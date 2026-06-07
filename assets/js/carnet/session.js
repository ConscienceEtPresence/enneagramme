/* ============================================================
   LE MIROIR INTÉRIEUR — Session & data loading (localStorage v1)
   En v2 : passage à Firebase. L'API reste la même.
   ============================================================ */

// Thème appliqué immédiatement (avant tout rendu)
import './theme.js';

export const SESSION_KEY = 'mi_session';
export const DAILY_PREFIX = 'mi_day_';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}

export function setSession(s) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function requireSession() {
  const s = getSession();
  if (!s) {
    window.location.href = '/pages/carnet/entrer/';
    throw new Error('no-session');
  }
  return s;
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function yesterdayKey() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function getDay(date) {
  try { return JSON.parse(localStorage.getItem(DAILY_PREFIX + date) || '{}'); }
  catch { return {}; }
}

export function saveDay(date, partial) {
  const current = getDay(date);
  const merged = { ...current, ...partial, _updated: Date.now() };
  localStorage.setItem(DAILY_PREFIX + date, JSON.stringify(merged));
  return merged;
}

export async function loadTypeData(typeNum) {
  const res = await fetch(`/data/type-carnet/type-${typeNum}.json`);
  if (!res.ok) throw new Error('type-data-missing');
  return res.json();
}

export function dateLisible() {
  const d = new Date();
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
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
  // déterministe sur le jour pour éviter clignotements à chaque chargement
  const seed = new Date().getDate() + new Date().getMonth();
  return arr[seed % arr.length];
}

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

export function flashOk(el) {
  if (!el) return;
  el.classList.add('is-visible');
  setTimeout(() => el.classList.remove('is-visible'), 2200);
}
