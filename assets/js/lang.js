/* ============================================================
   LANG.JS — Bascule FR/EN (Le miroir intérieur)
   Pastille flottante en bas à gauche. Mémorise le choix.
   Site FR à la racine, miroir EN sous /en/.
   ============================================================ */
(function(){
  var KEY = 'mi_lang';
  var path = location.pathname;
  var isEN = /^\/en(\/|$)/.test(path);

  function counterpartPath(){
    var p;
    if (isEN){
      p = path.replace(/^\/en(\/|$)/, '/');
    } else {
      p = '/en' + (path === '/' ? '/' : path);
    }
    return p + location.search + location.hash;
  }

  /* Préférence mémorisée : appliquée uniquement sur les pages d'accueil */
  try {
    var pref = localStorage.getItem(KEY);
    var atRoot = (path === '/' || path === '/index.html');
    var atEnRoot = (path === '/en' || path === '/en/' || path === '/en/index.html');
    if (pref === 'en' && atRoot){ location.replace('/en/'); return; }
    if (pref === 'fr' && atEnRoot){ location.replace('/'); return; }
  } catch(e){}

  function choose(lang){
    try { localStorage.setItem(KEY, lang); } catch(e){}
    if ((lang === 'en') !== isEN) location.href = counterpartPath();
  }

  var box = document.createElement('div');
  box.id = 'lang-switch';
  box.setAttribute('role', 'navigation');
  box.setAttribute('aria-label', 'Language');

  var fr = document.createElement('a');
  fr.textContent = 'FR';
  fr.href = isEN ? counterpartPath() : '#';
  fr.setAttribute('lang', 'fr');
  fr.title = 'Version française';
  if (!isEN) fr.className = 'on';

  var sep = document.createElement('span');
  sep.textContent = '·';

  var en = document.createElement('a');
  en.textContent = 'EN';
  en.href = isEN ? '#' : counterpartPath();
  en.setAttribute('lang', 'en');
  en.title = 'English version';
  if (isEN) en.className = 'on';

  fr.addEventListener('click', function(e){ e.preventDefault(); choose('fr'); });
  en.addEventListener('click', function(e){ e.preventDefault(); choose('en'); });

  box.appendChild(fr);
  box.appendChild(sep);
  box.appendChild(en);

  var css = document.createElement('style');
  css.textContent =
    '#lang-switch{position:fixed;bottom:20px;left:20px;z-index:960;' +
    'display:flex;align-items:center;gap:.45rem;padding:.5rem .85rem;' +
    'background:linear-gradient(135deg,#1a2540,#0e1528);' +
    'border:1px solid rgba(125,211,252,.4);border-radius:999px;' +
    'font-family:ui-sans-serif,system-ui,sans-serif;font-size:.8rem;font-weight:700;' +
    'letter-spacing:.06em;box-shadow:0 6px 20px rgba(0,0,0,.35);}' +
    '#lang-switch a{color:#8fa3cc;text-decoration:none;transition:color .15s ease;}' +
    '#lang-switch a:hover{color:#e8eeff;}' +
    '#lang-switch a.on{color:#f5d77b;pointer-events:none;}' +
    '#lang-switch span{color:rgba(255,255,255,.25);}' +
    '@media (max-width:480px){#lang-switch{bottom:16px;left:12px;padding:.42rem .7rem;font-size:.75rem}}';
  document.head.appendChild(css);

  function mount(){ document.body.appendChild(box); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
