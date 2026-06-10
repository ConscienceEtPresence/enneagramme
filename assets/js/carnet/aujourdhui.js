/* « Aujourd'hui » — la page-sommaire du jour, multipage feel */
import {
  requireSession, clearSession, loadTypeData,
  todayKey, yesterdayKey, getDay, saveDay,
  dateLisible, whisperForTime, esc, flashOk,
  ensureValidSession
} from './session.js';
import { injectThemeToggle } from './theme.js';
import { buildWeeklyData } from './weekly.js';

const session = requireSession();
const mount = document.getElementById('mount');

document.getElementById('sortir').addEventListener('click', e => {
  e.preventDefault();
  if (confirm('Sortir du carnet ? Vos données restent enregistrées.')) {
    clearSession();
    window.location.href = '../';
  }
});

(async function init() {
  let T;
  try { T = await loadTypeData(session.type); }
  catch (e) { mount.innerHTML = '<p style="color:#fda4af;text-align:center">Type introuvable.</p>'; return; }

  try { await ensureValidSession(session); } catch { return; }

  const today = todayKey();
  const hier  = yesterdayKey();
  const [dayData, hierData] = await Promise.all([getDay(today, session), getDay(hier, session)]);
  const visited = (key) => !!dayData[key];

  // --- Reprise du vœu d'hier
  const hierVow = hierData?.poser?.vow;
  const repriseDone = dayData.reprise?.statut;
  const repriseHtml = hierVow ? `
    <section class="miroir-reprise fade-in-up delay-1">
      <span class="miroir-reprise__label">Hier vous vous étiez dit</span>
      <blockquote class="miroir-reprise__vow">« ${esc(hierVow)} »</blockquote>
      <p class="miroir-reprise__q">Comment ça s'est passé aujourd'hui ?</p>
      <div class="miroir-reprise__opts" id="reprise">
        ${[['tenu','tenu'],['partiel','en partie'],['paspu','pas pu'],['passu','je n\'ai pas su']].map(([id,label]) => `
          <button class="miroir-reprise__opt ${repriseDone===id?'is-active':''}" data-id="${id}">${label}</button>
        `).join('')}
      </div>
    </section>
  ` : '';

  // --- Bandeau type compagnon
  const compagnonHtml = `
    <section class="miroir-compagnon fade-in-up delay-2">
      <span class="miroir-compagnon__label">Votre compagnon aujourd'hui</span>
      <h2 class="miroir-compagnon__type">Type ${T.type} — <em>${esc(T.nom)}</em></h2>
      <p class="miroir-compagnon__phrase">${esc(T.essence.qualite_phrase)}</p>
    </section>
  `;

  // --- Centre travaillé aujourd'hui
  const centreHtml = `
    <section class="miroir-centre-card fade-in-up delay-3">
      <div class="miroir-centre-card__icon">🔥</div>
      <div>
        <div class="miroir-centre-card__label">Le centre que vous cultivez</div>
        <p class="miroir-centre-card__text">${esc(T.centre.reprime_invitation)}</p>
      </div>
    </section>
  `;

  // --- Cartes "portes du jour"
  const portes = [
    { key: 'instant', href: '../instant/',           icon: '⚡', titre: 'Un instant',                desc: 'Une remarque à toute heure — 15 secondes' },
    { key: 'niveau',  href: '../mon-niveau/',        icon: '📊', titre: 'Mon niveau aujourd\'hui',  desc: 'Où je me situe — 2 minutes' },
    { key: 'ego',     href: '../mon-ego/',           icon: '🌪', titre: 'Mon ego aujourd\'hui',     desc: 'Ce qui m\'a poussé, ce qui m\'a piégé' },
    { key: 'essence', href: '../mon-essence/',       icon: '✨', titre: 'Mon essence aujourd\'hui', desc: 'Ai-je touché autre chose ?' },
    { key: 'moment',  href: '../relire-un-moment/',  icon: '📖', titre: 'Relire un moment du jour', desc: 'Un événement à comprendre' },
    { key: 'poser',   href: '../poser-le-jour/',     icon: '🌙', titre: 'Déposer la journée',       desc: 'Une phrase, un vœu, puis dormir' }
  ];
  const visitedInstant = (k) => k === 'instant' ? Array.isArray(dayData.instants) && dayData.instants.length > 0 : visited(k);
  const portesHtml = `
    <div class="miroir-portes">
      ${portes.map((p, i) => `
        <a class="miroir-porte ${visitedInstant(p.key)?'is-visited':''} fade-in-up delay-${i+3}" href="${p.href}">
          <div class="miroir-porte__icon">${p.icon}</div>
          <h3 class="miroir-porte__title">${p.titre}</h3>
          <p class="miroir-porte__desc">${p.desc}</p>
          <div class="miroir-porte__arrow">${visitedInstant(p.key) ? 'revenir →' : 'commencer →'}</div>
        </a>
      `).join('')}
    </div>
  `;

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>Le <em>miroir intérieur</em></span>
      </a>
      <div class="miroir-header__nav">
        <a href="../miroir/">Miroir</a>
        <a href="../mon-carnet/">Mon carnet</a>
        <a href="#" id="sortir-top">Sortir</a>
      </div>
    </header>

    <p class="miroir-whisper fade-in-up">${esc(whisperForTime(T))}</p>
    <p class="miroir-hello fade-in-up">Bonjour, <em>${esc(session.prenom)}</em>.</p>
    <p class="miroir-date">${dateLisible()}</p>

    ${(() => {
      // Carte de bienvenue : seulement au 1er accès
      try {
        if (localStorage.getItem('mi_welcomed') === '1') return '';
        localStorage.setItem('mi_welcomed', '1');
      } catch {}
      return `
        <section class="welcome-card fade-in-up">
          <h2>🪞 Bienvenue dans votre <em>miroir intérieur</em></h2>
          <p>Ce carnet est votre compagnon quotidien — il s'adapte à votre type ${T.type} pour vous aider à observer, comprendre, et avancer doucement.</p>
          <ul>
            <li><strong>⚡ Un instant</strong> — pour poser une remarque à toute heure.</li>
            <li><strong>📊 Mon niveau</strong> — pour situer où vous êtes, sans jugement.</li>
            <li><strong>🌪 Mon ego</strong> — pour repérer vos mécanismes spécifiques.</li>
            <li><strong>✨ Mon essence</strong> — pour honorer les moments de liberté.</li>
            <li><strong>📖 Relire un moment</strong> — pour comprendre un événement.</li>
            <li><strong>🌙 Déposer le jour</strong> — pour finir avec un vœu.</li>
          </ul>
          <p style="margin-top:1rem;"><em>Pas d'obligation. Une chose à la fois, à votre rythme. Le miroir n'évalue jamais — il écoute.</em></p>
          <p style="text-align:center;margin-top:1.2rem;"><button class="miroir-btn miroir-btn--ghost" id="welcome-close">Je commence</button></p>
        </section>
      `;
    })()}
    ${repriseHtml}
    ${compagnonHtml}
    ${centreHtml}
    ${portesHtml}
    <div id="weekly-mount"></div>
  `;

  // Fermer la carte de bienvenue
  document.getElementById('welcome-close')?.addEventListener('click', e => {
    e.target.closest('.welcome-card').style.display = 'none';
  });

  // Calcul async du miroir hebdo (ne bloque pas l'affichage)
  buildWeeklyData(session, T).then(({ mirror, suggestions, daysCount }) => {
    const m = document.getElementById('weekly-mount');
    if (!m) return;
    const showMirror = daysCount >= 3; // au moins 3 jours pour avoir du sens
    let html = '';
    if (suggestions?.length) {
      html += `
        <section class="weekly-suggestions fade-in-up">
          <h2 class="weekly-suggestions__title">🌱 Pour les jours qui viennent</h2>
          ${suggestions.map(s => `
            <div class="weekly-suggestions__item">
              <p>${esc(s.message)}</p>
            </div>
          `).join('')}
        </section>
      `;
    }
    if (showMirror && mirror?.lines?.length) {
      html += `
        <section class="weekly-mirror fade-in-up">
          <h2 class="weekly-mirror__title">🪞 <em>Le miroir de la semaine</em></h2>
          <p class="weekly-mirror__sub">Un constat botanique, jamais un jugement.</p>
          ${mirror.lines.map(l => `<p class="weekly-mirror__line">${l}</p>`).join('')}
        </section>
      `;
    }
    if (html) m.innerHTML = html;
  }).catch(e => console.warn('weekly failed', e));

  // Sortir lien header
  document.getElementById('sortir-top').addEventListener('click', e => {
    e.preventDefault(); document.getElementById('sortir').click();
  });

  // Bouton de thème
  injectThemeToggle();

  // Reprise du vœu d'hier
  document.querySelectorAll('#reprise .miroir-reprise__opt').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('#reprise .miroir-reprise__opt').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      try { await saveDay(today, { reprise: { statut: btn.dataset.id, when: Date.now() } }, session); }
      catch (e) { console.warn(e); }
    });
  });
})();
