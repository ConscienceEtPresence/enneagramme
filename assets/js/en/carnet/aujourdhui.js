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
  if (confirm('Leave the journal? Your data stays saved.')) {
    clearSession();
    window.location.href = '../';
  }
});

(async function init() {
  let T;
  try { T = await loadTypeData(session.type); }
  catch (e) { mount.innerHTML = '<p style="color:#fda4af;text-align:center">Type not found.</p>'; return; }

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
      <span class="miroir-reprise__label">Yesterday you told yourself</span>
      <blockquote class="miroir-reprise__vow">“${esc(hierVow)}”</blockquote>
      <p class="miroir-reprise__q">How did it go today?</p>
      <div class="miroir-reprise__opts" id="reprise">
        ${[['tenu','kept'],['partiel','partly'],['paspu','couldn\'t'],['passu','didn\'t know how']].map(([id,label]) => `
          <button class="miroir-reprise__opt ${repriseDone===id?'is-active':''}" data-id="${id}">${label}</button>
        `).join('')}
      </div>
    </section>
  ` : '';

  // --- Bandeau type compagnon
  const compagnonHtml = `
    <section class="miroir-compagnon fade-in-up delay-2">
      <span class="miroir-compagnon__label">Your companion today</span>
      <h2 class="miroir-compagnon__type">Type ${T.type} — <em>${esc(T.nom)}</em></h2>
      <p class="miroir-compagnon__phrase">${esc(T.essence.qualite_phrase)}</p>
    </section>
  `;

  // --- Centre travaillé aujourd'hui
  const centreHtml = `
    <section class="miroir-centre-card fade-in-up delay-3">
      <div class="miroir-centre-card__icon">🔥</div>
      <div>
        <div class="miroir-centre-card__label">The center you're cultivating</div>
        <p class="miroir-centre-card__text">${esc(T.centre.reprime_invitation)}</p>
      </div>
    </section>
  `;

  // --- Cartes "portes du jour"
  const portes = [
    { key: 'instant', href: '../instant/',           icon: '⚡', titre: 'A moment',              desc: 'A note anytime — 15 seconds' },
    { key: 'niveau',  href: '../mon-niveau/',        icon: '📊', titre: 'My level today',        desc: 'Where I stand — 2 minutes' },
    { key: 'ego',     href: '../mon-ego/',           icon: '🌪', titre: 'My ego today',          desc: 'What pushed me, what trapped me' },
    { key: 'essence', href: '../mon-essence/',       icon: '✨', titre: 'My essence today',      desc: 'Did I touch something else?' },
    { key: 'moment',  href: '../relire-un-moment/',  icon: '📖', titre: 'Revisit a moment of the day', desc: 'An event to understand' },
    { key: 'poser',   href: '../poser-le-jour/',     icon: '🌙', titre: 'Set down the day',      desc: 'A sentence, a vow, then sleep' }
  ];
  const visitedInstant = (k) => k === 'instant' ? Array.isArray(dayData.instants) && dayData.instants.length > 0 : visited(k);
  const portesHtml = `
    <div class="miroir-portes">
      ${portes.map((p, i) => `
        <a class="miroir-porte ${visitedInstant(p.key)?'is-visited':''} fade-in-up delay-${i+3}" href="${p.href}">
          <div class="miroir-porte__icon">${p.icon}</div>
          <h3 class="miroir-porte__title">${p.titre}</h3>
          <p class="miroir-porte__desc">${p.desc}</p>
          <div class="miroir-porte__arrow">${visitedInstant(p.key) ? 'come back →' : 'begin →'}</div>
        </a>
      `).join('')}
    </div>
  `;

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>The <em>Inner Mirror</em></span>
      </a>
      <div class="miroir-header__nav">
        <a href="../miroir/">Mirror</a>
        <a href="../mon-carnet/">My journal</a>
        <a href="#" id="sortir-top">Leave</a>
      </div>
    </header>

    <p class="miroir-whisper fade-in-up">${esc(whisperForTime(T))}</p>
    <p class="miroir-hello fade-in-up">Hello, <em>${esc(session.prenom)}</em>.</p>
    <p class="miroir-date">${dateLisible()}</p>

    ${(() => {
      // Carte de bienvenue : seulement au 1er accès
      try {
        if (localStorage.getItem('mi_welcomed') === '1') return '';
        localStorage.setItem('mi_welcomed', '1');
      } catch {}
      return `
        <section class="welcome-card fade-in-up">
          <h2>🪞 Welcome to your <em>Inner Mirror</em></h2>
          <p>This journal is your daily companion — it adapts to your type ${T.type} to help you observe, understand, and move forward gently.</p>
          <ul>
            <li><strong>⚡ A moment</strong> — to jot down a note anytime.</li>
            <li><strong>📊 My level</strong> — to see where you stand, without judgment.</li>
            <li><strong>🌪 My ego</strong> — to spot your specific mechanisms.</li>
            <li><strong>✨ My essence</strong> — to honor moments of freedom.</li>
            <li><strong>📖 Revisit a moment</strong> — to understand an event.</li>
            <li><strong>🌙 Set down the day</strong> — to end with a vow.</li>
          </ul>
          <p style="margin-top:1rem;"><em>No obligation. One thing at a time, at your own pace. The mirror never judges — it listens.</em></p>
          <p style="text-align:center;margin-top:1.2rem;"><button class="miroir-btn miroir-btn--ghost" id="welcome-close">Let's begin</button></p>
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
          <h2 class="weekly-suggestions__title">🌱 For the days ahead</h2>
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
          <h2 class="weekly-mirror__title">🪞 <em>The mirror of the week</em></h2>
          <p class="weekly-mirror__sub">A botanical observation, never a judgment.</p>
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
