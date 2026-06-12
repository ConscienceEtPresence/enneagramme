/* ============================================================
   PULSE — compteur de visites anonyme, ultra-léger
   Pour : Le miroir intérieur (site = 'lemiroirinterieur')
   - 1 écriture Firestore atomique par pageview
   - Visiteur unique = 1 ID anonyme en localStorage, compté 1 fois par jour
   - Aucune donnée perso, aucun cookie, aucun pistage
   ============================================================ */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, increment, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const SITE = 'lemiroirinterieur';
const FIRE_CFG = {
  apiKey: "AIzaSyBYlX1AcOP4Yg5rCy9T5tIcrV0WOTT3E24",
  authDomain: "la-voie-du-dedans.firebaseapp.com",
  projectId: "la-voie-du-dedans",
  storageBucket: "la-voie-du-dedans.firebasestorage.app",
  messagingSenderId: "531110328878",
  appId: "1:531110328878:web:322ac57d9504e750b83dbf"
};

const app = getApps().length ? getApps()[0] : initializeApp(FIRE_CFG);
const db = getFirestore(app);

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getVisitorId() {
  try {
    let id = localStorage.getItem('pulse_vid');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2));
      localStorage.setItem('pulse_vid', id);
    }
    return id;
  } catch { return null; }
}

// Normalise le chemin pour la clef Firestore (pas de slash, pas de point)
function normalizePath(p) {
  let s = (p || '/').split('?')[0].split('#')[0];
  if (s === '/') return 'home';
  // retirer leading/trailing slash, remplacer / et . par _
  s = s.replace(/^\/+|\/+$/g, '').replace(/\.html?$/, '').replace(/[\/\.]/g, '_');
  return s.substring(0, 80) || 'home';
}

function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

async function pulse() {
  if (/bot|spider|crawler|preview|headless/i.test(navigator.userAgent || '')) return;

  const date = todayKey();
  const month = monthKey();
  const pathKey = normalizePath(location.pathname);

  // ---- Doc du JOUR ----
  const dayUpd = { pageviews: increment(1), lastSeen: serverTimestamp() };
  dayUpd[`pages.${pathKey}`] = increment(1);
  try {
    if (localStorage.getItem('pulse_last_day') !== date) {
      dayUpd.uniques = increment(1);
      localStorage.setItem('pulse_last_day', date);
    }
  } catch {}

  // ---- Doc du MOIS (même collection 'jours', id spécial '_mois_…') ----
  const moUpd = { pageviews: increment(1) };
  moUpd[`pages.${pathKey}`] = increment(1);
  try {
    if (localStorage.getItem('pulse_last_month') !== month) {
      moUpd.uniques = increment(1);
      localStorage.setItem('pulse_last_month', month);
    }
    let up = {}; try { up = JSON.parse(localStorage.getItem('pulse_upm') || '{}'); } catch {}
    if (up.m !== month) up = { m: month, k: [] };
    if (!up.k.includes(pathKey)) {
      moUpd[`upages.${pathKey}`] = increment(1);
      up.k.push(pathKey);
      localStorage.setItem('pulse_upm', JSON.stringify(up));
    }
  } catch {}

  try { await setDoc(doc(db, 'analytics', SITE, 'jours', date), dayUpd, { merge: true }); } catch (e) { console.warn('pulse day failed', e); }
  try { await setDoc(doc(db, 'analytics', SITE, 'jours', '_mois_' + month), moUpd, { merge: true }); } catch (e) { console.warn('pulse month failed', e); }
}

// déclenche sans attendre (non bloquant)
pulse();
