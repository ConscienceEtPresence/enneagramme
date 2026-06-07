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
  if (document.querySelector('.miroir-header__nav')) {
    injectThemeToggle();
    return true;
  }
  return false;
};
if (!tryInject()) {
  // Observer pour les pages où le header est créé dynamiquement
  const obs = new MutationObserver(() => {
    if (tryInject()) obs.disconnect();
  });
  obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  // safety net
  setTimeout(() => obs.disconnect(), 5000);
}
