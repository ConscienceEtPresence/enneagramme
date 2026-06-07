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

async function pulse() {
  // ignorer les bots évidents
  if (/bot|spider|crawler|preview|headless/i.test(navigator.userAgent || '')) return;

  const date = todayKey();
  const ref = doc(db, 'analytics', SITE, 'jours', date);
  const updates = { pageviews: increment(1), lastSeen: serverTimestamp() };

  // unique par jour : on stocke la date de dernière visite, et on incrémente
  // 'uniques' une seule fois si la dernière visite n'est pas aujourd'hui
  try {
    const lastDay = localStorage.getItem('pulse_last_day');
    if (lastDay !== date) {
      updates.uniques = increment(1);
      localStorage.setItem('pulse_last_day', date);
    }
  } catch {}

  try {
    await setDoc(ref, updates, { merge: true });
  } catch (e) {
    // silencieux : aucune analytics ne doit jamais casser une page
    console.warn('pulse failed', e);
  }
}

// déclenche sans attendre (non bloquant)
pulse();
