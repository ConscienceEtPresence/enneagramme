/* Thème clair/sombre — appliqué tôt pour éviter le flash */
const THEME_KEY = 'mi_theme';

export function getTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'dark'; }
  catch { return 'dark'; }
}

export function applyTheme(t) {
  const isLight = t === 'light';
  document.body.classList.toggle('theme-light', isLight);
  // mettre à jour le bouton si présent
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = isLight ? '🌙' : '☀';
  try { localStorage.setItem(THEME_KEY, t); } catch {}
}

export function injectThemeToggle() {
  // bouton à ajouter dans le header (juste avant le lien Sortir)
  const nav = document.querySelector('.miroir-header__nav');
  if (!nav || document.getElementById('theme-toggle')) return;
  const btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.className = 'theme-toggle';
  btn.title = 'Changer de thème (clair / sombre)';
  btn.setAttribute('aria-label', 'Changer de thème');
  btn.textContent = getTheme() === 'light' ? '🌙' : '☀';
  btn.addEventListener('click', () => {
    const next = getTheme() === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });
  nav.appendChild(btn);
}

// auto-apply ASAP
applyTheme(getTheme());

// Auto-injection du toggle dès que le header existe
const tryInject = () => {
  if (document.querySelector('.miroir-header__nav') && !document.getElementById('theme-toggle')) {
    injectThemeToggle();
    return true;
  }
  return false;
};
// 1ère tentative immédiate
if (!tryInject()) {
  // Observer permanent : ne se déconnecte que quand l'injection a réussi
  const obs = new MutationObserver(() => {
    if (tryInject()) obs.disconnect();
  });
  obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  // safety net étendu (60 secondes) pour les pages très lentes
  setTimeout(() => obs.disconnect(), 60000);
}

// Bouton flottant de secours en bas à droite : toujours visible
// (au cas où le header serait absent ou tarde à apparaître)
function ensureFloatingToggle() {
  if (document.getElementById('theme-toggle-floating')) return;
  const btn = document.createElement('button');
  btn.id = 'theme-toggle-floating';
  btn.title = 'Changer de thème (clair / sombre)';
  btn.setAttribute('aria-label', 'Changer de thème');
  btn.textContent = getTheme() === 'light' ? '🌙' : '☀';
  btn.style.cssText = [
    'position:fixed',
    'top:14px',
    'right:14px',
    'z-index:1000',
    'width:42px',
    'height:42px',
    'border-radius:50%',
    'border:1px solid rgba(245,215,123,.6)',
    'background:rgba(7,11,20,.7)',
    'color:#f5d77b',
    'cursor:pointer',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'font-size:1.1rem',
    'backdrop-filter:blur(8px)',
    '-webkit-backdrop-filter:blur(8px)',
    'box-shadow:0 4px 14px rgba(0,0,0,.4)',
    'transition:transform .2s'
  ].join(';');
  btn.addEventListener('mouseenter', () => btn.style.transform = 'rotate(15deg)');
  btn.addEventListener('mouseleave', () => btn.style.transform = '');
  btn.addEventListener('click', () => {
    const next = getTheme() === 'light' ? 'dark' : 'light';
    applyTheme(next);
    btn.textContent = next === 'light' ? '🌙' : '☀';
  });
  document.body.appendChild(btn);
}
// activer le bouton flottant SEULEMENT si on est sur le carnet
if (document.body?.classList?.contains('miroir')) {
  ensureFloatingToggle();
} else {
  // body pas encore prêt
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body?.classList?.contains('miroir')) ensureFloatingToggle();
  });
}
