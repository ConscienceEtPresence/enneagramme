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

function visitMoment() {
  const hour = new Date().getHours();
  const period = hour >= 5 && hour < 12 ? 'matin'
    : hour >= 12 && hour < 18 ? 'apres_midi'
    : hour >= 18 && hour < 23 ? 'soir'
    : 'nuit';
  return { hour: String(hour).padStart(2, '0'), period };
}

function deviceKind() {
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablette';
  if (/Mobi|iPhone|Android|iPod|Windows Phone/i.test(ua)) return 'mobile';
  return 'ordinateur';
}

/* fr / en, déduit du chemin (les pages anglaises vivent sous /en/) */
function langKey(pathKey) {
  return (pathKey === 'en' || pathKey.startsWith('en_')) ? 'en' : 'fr';
}

/* Région estimée d'après le fuseau horaire du navigateur (ex. "Europe/Paris").
   Aucune adresse IP, aucune géolocalisation : juste un réglage local, anonyme. */
function zoneKey() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return tz.replace(/[^A-Za-z0-9]+/g, '_').substring(0, 60) || 'inconnu';
  } catch { return 'inconnu'; }
}

function sourceKey() {
  try {
    if (!document.referrer) return 'direct';
    const from = new URL(document.referrer).hostname.replace(/^www\./, '');
    const here = location.hostname.replace(/^www\./, '');
    if (!from) return 'direct';
    if (from === here) return 'interne';
    if (/google\./i.test(from)) return 'google';
    if (/bing\.|duckduckgo\.|qwant\.|yahoo\./i.test(from)) return 'recherche';
    if (/lavoiedudedans\./i.test(from)) return 'lavoiedudedans';
    if (/lemiroirinterieur\./i.test(from)) return 'lemiroirinterieur';
    if (/facebook\.|instagram\.|threads\.|linkedin\.|x\.com$|twitter\.|t\.co$|youtube\./i.test(from)) return 'social';
    return 'autre';
  } catch {
    return 'direct';
  }
}

async function pulse() {
  if (/bot|spider|crawler|preview|headless/i.test(navigator.userAgent || '')) return;

  const date = todayKey();
  const month = monthKey();
  const pathKey = normalizePath(location.pathname);
  const moment = visitMoment();

  // ---- Doc du JOUR ----
  const dayUpd = { pageviews: increment(1), lastSeen: serverTimestamp() };
  dayUpd[`pages.${pathKey}`] = increment(1);
  dayUpd[`hours.${moment.hour}`] = increment(1);
  dayUpd[`periods.${moment.period}`] = increment(1);
  try {
    if (localStorage.getItem('pulse_last_day') !== date) {
      dayUpd.uniques = increment(1);
      dayUpd[`sources.${sourceKey()}`] = increment(1);
      dayUpd[`devices.${deviceKind()}`] = increment(1);
      dayUpd[`langs.${langKey(pathKey)}`] = increment(1);
      dayUpd[`visitors.${localStorage.getItem('pulse_seen') ? 'back' : 'new'}`] = increment(1);
      dayUpd[`zones.${zoneKey()}`] = increment(1);
      localStorage.setItem('pulse_seen', '1');
      localStorage.setItem('pulse_last_day', date);
    }
  } catch {}
  try {
    let upPeriods = {};
    try { upPeriods = JSON.parse(localStorage.getItem('pulse_uperiods') || '{}'); } catch {}
    if (upPeriods.d !== date) upPeriods = { d: date, k: [] };
    if (!upPeriods.k.includes(moment.period)) {
      dayUpd[`uperiods.${moment.period}`] = increment(1);
      upPeriods.k.push(moment.period);
      localStorage.setItem('pulse_uperiods', JSON.stringify(upPeriods));
    }
  } catch {}
  try {
    let upDay = {};
    try { upDay = JSON.parse(localStorage.getItem('pulse_upd') || '{}'); } catch {}
    if (upDay.d !== date) upDay = { d: date, k: [] };
    if (!upDay.k.includes(pathKey)) {
      dayUpd[`upages.${pathKey}`] = increment(1);
      upDay.k.push(pathKey);
      localStorage.setItem('pulse_upd', JSON.stringify(upDay));
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

  // ---- Lecture attentive : au plus UNE écriture, à la sortie ----
  // engaged = resté > 20 s sur la page ; deep = a fait défiler jusqu'au bas (≥ 70 %).
  const eng = {}; let engData = false, engSent = false;
  const markDwell = () => { if (!('engaged' in eng)) { eng.engaged = increment(1); engData = true; } };
  const markDeep  = () => { if (!('deep' in eng)) { eng.deep = increment(1); eng[`deeppages.${pathKey}`] = increment(1); engData = true; } };
  const dwellTimer = setTimeout(markDwell, 20000);
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const st = window.scrollY || document.documentElement.scrollTop || 0;
    if (h > 240 && st / h >= 0.7) { markDeep(); window.removeEventListener('scroll', onScroll); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  const flush = () => {
    if (engSent || !engData) return; engSent = true;
    clearTimeout(dwellTimer);
    setDoc(doc(db, 'analytics', SITE, 'jours', date), eng, { merge: true }).catch(() => {});
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
}

// déclenche sans attendre (non bloquant)
pulse();
