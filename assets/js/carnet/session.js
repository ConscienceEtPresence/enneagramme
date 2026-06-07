/* ============================================================
   LE MIROIR INTÉRIEUR — Session & Firestore data layer
   v2 : passage à Firebase. La session reste en localStorage
   (état client), les données du carnet vont en Firestore.
   ============================================================ */
import './theme.js';
import { db, COL } from './firebase-init.js';
import {
  doc, getDoc, setDoc, addDoc, collection,
  serverTimestamp, updateDoc, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export const SESSION_KEY = 'mi_session';

// === Session client (localStorage) ===
export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
export function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

export function requireSession() {
  const s = getSession();
  if (!s || !s.codeId) {
    window.location.href = '/pages/carnet/entrer/';
    throw new Error('no-session');
  }
  return s;
}

// === Helpers de date ===
export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function todayKey()     { return dateKey(new Date()); }
export function yesterdayKey() { const d = new Date(); d.setDate(d.getDate()-1); return dateKey(d); }

// === Normalisation prénom (pour login) ===
export function normPrenom(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// === Login : prénom + codeId ===
// Renvoie la session si OK, throw sinon
// Le code est insensible à la casse, aux espaces et aux accents
export async function login(prenom, codeId) {
  // Normalisation : minuscules + retire les caractères invalides
  const cleanId = String(codeId || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!cleanId) throw new Error('code-vide');

  const snap = await getDoc(doc(db, COL.codes, cleanId));
  if (!snap.exists()) throw new Error('code-introuvable');

  const d = snap.data();
  if (d.actif === false) throw new Error('code-desactive');

  // Vérification du prénom (insensible accents/casse)
  if (normPrenom(d.prenomNorm || d.prenom) !== normPrenom(prenom)) {
    throw new Error('prenom-incorrect');
  }

  const session = {
    codeId: cleanId,
    prenom: d.prenom,
    type:   d.type,
    aile:   d.aile || null,
    sousType: d.sousType || null,
    langue: d.langue || 'fr',
    startedAt: Date.now()
  };
  setSession(session);

  // mise à jour de la dernière visite (best effort, silencieuse si KO)
  try { await updateDoc(doc(db, COL.codes, cleanId), { derniereVisite: serverTimestamp() }); } catch {}

  return session;
}

// === Vérification de session ouverte ===
// (la clé est-elle toujours active ?)
export async function ensureValidSession(session) {
  const snap = await getDoc(doc(db, COL.codes, session.codeId));
  if (!snap.exists() || snap.data().actif === false) {
    clearSession();
    window.location.href = '/pages/carnet/entrer/';
    throw new Error('session-invalid');
  }
  // resync du type si l'admin l'a corrigé
  const d = snap.data();
  if (d.type && d.type !== session.type) {
    session.type = d.type;
    setSession(session);
  }
}

// === Lecture / Écriture d'un jour ===
export async function getDay(date, session) {
  session = session || getSession();
  if (!session?.codeId) return {};
  try {
    const snap = await getDoc(doc(db, COL.carnets, session.codeId, 'jours', date));
    return snap.exists() ? snap.data() : {};
  } catch (e) {
    console.warn('getDay failed', e);
    return {};
  }
}

export async function saveDay(date, partial, session) {
  session = session || getSession();
  if (!session?.codeId) return;
  const payload = { ...partial, _updated: serverTimestamp() };
  await setDoc(doc(db, COL.carnets, session.codeId, 'jours', date), payload, { merge: true });
}

// === Liste des jours visités (pour le miroir) ===
export async function listDays(session, limitDays = 60) {
  session = session || getSession();
  if (!session?.codeId) return [];
  // Sans index : on lit tout (les utilisateurs n'auront pas 1000 docs)
  const snap = await getDocs(collection(db, COL.carnets, session.codeId, 'jours'));
  const out = [];
  snap.forEach(s => out.push({ date: s.id, data: s.data() }));
  return out.sort((a,b) => b.date.localeCompare(a.date)).slice(0, limitDays);
}

// === Suggestion (pour Brahms) ===
export async function sendSuggestion(message, signed = false) {
  const session = getSession();
  await addDoc(collection(db, COL.suggestions), {
    message,
    prenom: signed ? (session?.prenom || null) : null,
    codeId: signed ? (session?.codeId || null) : null,
    type:   signed ? (session?.type   || null) : null,
    langue: session?.langue || 'fr',
    statut: 'neuve',
    creeLe: serverTimestamp()
  });
}

// === UI helpers ===
export function dateLisible() {
  return new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}
export function whisperForTime(typeData) {
  const h = new Date().getHours();
  const ouv = typeData?.ouverture_du_jour;
  if (!ouv) return '';
  let bucket;
  if (h < 6 || h >= 22) bucket = 'nuit';
  else if (h < 11) bucket = 'matin';
  else if (h < 18) bucket = 'midi';
  else bucket = 'soir';
  const arr = ouv[bucket] || [];
  if (!arr.length) return '';
  const seed = new Date().getDate() + new Date().getMonth();
  return arr[seed % arr.length];
}
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
export function flashOk(el) {
  if (!el) return;
  el.classList.add('is-visible');
  setTimeout(() => el.classList.remove('is-visible'), 2200);
}

// === Données du type (statique, JSON) ===
export async function loadTypeData(typeNum) {
  const res = await fetch(`/data/type-carnet/type-${typeNum}.json`);
  if (!res.ok) throw new Error('type-data-missing');
  return res.json();
}
