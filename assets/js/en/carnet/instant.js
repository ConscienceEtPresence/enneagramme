/* « Un instant » — capture rapide à toute heure
   Stocke dans jours/{today}/instants[] */
import {
  requireSession, loadTypeData, todayKey, getDay, saveDay, esc, flashOk
} from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

const MODES = {
  ego:      { icon:'🌪', nom:'Mechanism activated', desc:'My type spoke — I reacted automatically.' },
  evite:    { icon:'🌫', nom:'I\'m avoiding something', desc:'A flight, a withdrawal, a detour.' },
  presence: { icon:'✨', nom:'Presence touched',   desc:'A moment when I wasn\'t in my mechanism.' }
};

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();
  const day = await getDay(today, session);
  const instants = Array.isArray(day.instants) ? day.instants : [];

  // Chips disponibles selon le mode
  const chipsByMode = {
    ego:      T.ego_du_jour.passions.concat(T.ego_du_jour.pieges),
    evite:    T.ego_du_jour.pieges,
    presence: T.essence_du_jour.moments
  };

  let mode = null;
  const chosen = new Set();

  function render() {
    mount.innerHTML = `
      <header class="miroir-header">
        <a href="../aujourdhui/" class="miroir-brand">
          <span class="miroir-brand__mark"></span>
          <span>The <em>Inner Mirror</em></span>
        </a>
        <div class="miroir-header__nav"><a href="../aujourdhui/">Today</a></div>
      </header>

      <h1 class="miroir-h1 fade-in-up">A <em>moment</em></h1>
      <p class="miroir-sub fade-in-up delay-1">
        Noticed something? Set it down here in a few seconds — no need to wait for the evening.
      </p>

      <div class="instant-modes fade-in-up delay-2">
        ${Object.entries(MODES).map(([k, m]) => `
          <button class="instant-mode instant-mode--${k} ${mode === k ? 'is-active' : ''}" data-mode="${k}">
            <span class="instant-mode__icon">${m.icon}</span>
            <div class="instant-mode__nom">${esc(m.nom)}</div>
            <div class="instant-mode__desc">${esc(m.desc)}</div>
          </button>
        `).join('')}
      </div>

      ${mode ? `
        <div class="fade-in-up">
          <p class="miroir-field__label">What exactly? <span style="text-transform:none;letter-spacing:0;color:var(--car-text-soft);font-style:italic;font-weight:400;">(one or several)</span></p>
          <div class="instant-chips" id="chips">
            ${chipsByMode[mode].map(c => `
              <button class="instant-chip ${chosen.has(c.id) ? 'is-checked' : ''}" data-id="${esc(c.id)}">${esc(c.label)}</button>
            `).join('')}
          </div>

          <div class="miroir-field">
            <label class="miroir-field__label" for="mot">A word (optional)</label>
            <input class="miroir-input" type="text" id="mot" maxlength="60" placeholder="e.g. fatigue, anger, joy…">
          </div>

          <div class="miroir-field">
            <label class="miroir-field__label" for="note">A sentence (optional)</label>
            <textarea class="miroir-textarea" id="note" rows="2" placeholder="Whatever comes — nothing more."></textarea>
          </div>

          <div class="miroir-actions">
            <a href="../aujourdhui/" class="miroir-btn miroir-btn--ghost">Later</a>
            <button id="save" class="miroir-btn">Keep this moment</button>
            <span class="miroir-ok" id="ok">✓ saved</span>
          </div>
        </div>
      ` : ''}

      ${instants.length ? `
        <section class="instants-today">
          <h2>Today, already ${instants.length} moment${instants.length>1?'s':''} recorded</h2>
          ${instants.slice().reverse().map(it => {
            const t = it.time ? new Date(it.time).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'}) : '—';
            return `
              <div class="instant-item instant-item--${esc(it.mode || 'ego')}">
                <div class="instant-item__time">${t} · ${esc(MODES[it.mode]?.nom || it.mode)}</div>
                ${it.what?.length ? `<div class="instant-item__what">${it.what.map(esc).join(' · ')}</div>` : ''}
                ${it.mot ? `<div class="instant-item__mot">“${esc(it.mot)}”</div>` : ''}
                ${it.note ? `<div class="instant-item__note">${esc(it.note)}</div>` : ''}
              </div>
            `;
          }).join('')}
        </section>
      ` : ''}
    `;

    // bind modes
    document.querySelectorAll('.instant-mode').forEach(b => {
      b.addEventListener('click', () => {
        mode = b.dataset.mode;
        chosen.clear();
        render();
      });
    });

    // bind chips
    document.querySelectorAll('.instant-chip').forEach(c => {
      c.addEventListener('click', () => {
        const id = c.dataset.id;
        if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
        c.classList.toggle('is-checked');
      });
    });

    // save
    document.getElementById('save')?.addEventListener('click', async () => {
      if (!mode) return;
      const mot  = document.getElementById('mot')?.value.trim() || null;
      const note = document.getElementById('note')?.value.trim() || null;
      const it = {
        mode,
        what: [...chosen],
        mot, note,
        time: Date.now()
      };
      const fresh = await getDay(today, session);
      const list = Array.isArray(fresh.instants) ? fresh.instants : [];
      list.push(it);
      await saveDay(today, { instants: list }, session);
      instants.push(it);
      mode = null; chosen.clear();
      flashOk(document.getElementById('ok'));
      render();
    });
  }

  render();
})();
