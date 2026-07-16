/* "My ego today" — checkboxes specific to the type */
import { requireSession, loadTypeData, todayKey, getDay, saveDay, esc, flashOk } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();
  const day = await getDay(today, session);
  const cur = day.ego || { passions: [], pieges: [], notes: {} };
  const isChecked = (kind, id) => Array.isArray(cur[kind]) && cur[kind].includes(id);

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>The <em>Inner Mirror</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Today</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">My <em>ego</em> today</h1>
    <p class="miroir-sub fade-in-up delay-1">
      Here are the typical mechanisms of your type. Check whatever got activated —
      even a little, even briefly. No judgment, just awareness.
    </p>

    <h2 class="miroir-section-title fade-in-up delay-2">Passions and drivers</h2>
    <p class="miroir-section-sub">What pushed you from within.</p>
    <div class="check-cards" id="passions">
      ${T.ego_du_jour.passions.map(p => `
        <label class="check-card ${isChecked('passions', p.id)?'is-checked':''}">
          <input type="checkbox" data-kind="passions" data-id="${esc(p.id)}" ${isChecked('passions', p.id)?'checked':''} />
          <span class="check-card__box"></span>
          <span class="check-card__label">${esc(p.label)}</span>
          <span class="check-card__detail">${esc(p.detail)}</span>
        </label>
      `).join('')}
    </div>

    <h2 class="miroir-section-title fade-in-up delay-3">Typical traps</h2>
    <p class="miroir-section-sub">The automatic movements that catch you.</p>
    <div class="check-cards" id="pieges">
      ${T.ego_du_jour.pieges.map(p => `
        <label class="check-card ${isChecked('pieges', p.id)?'is-checked':''}">
          <input type="checkbox" data-kind="pieges" data-id="${esc(p.id)}" ${isChecked('pieges', p.id)?'checked':''} />
          <span class="check-card__box"></span>
          <span class="check-card__label">${esc(p.label)}</span>
          <span class="check-card__detail">${esc(p.detail)}</span>
        </label>
      `).join('')}
    </div>

    <div class="miroir-field fade-in-up delay-4">
      <label class="miroir-field__label" for="note">A note for today (optional)</label>
      <textarea class="miroir-textarea" id="note" rows="4" placeholder="What happened, what it taught me…">${esc((cur.notes && cur.notes.global) || '')}</textarea>
    </div>

    <div class="miroir-actions">
      <a href="../aujourdhui/" class="miroir-btn miroir-btn--ghost">Later</a>
      <button id="save" class="miroir-btn">Save</button>
      <span class="miroir-ok" id="ok">✓ saved</span>
    </div>
  `;

  document.querySelectorAll('.check-card input').forEach(inp => {
    inp.addEventListener('change', () => {
      inp.closest('.check-card').classList.toggle('is-checked', inp.checked);
    });
  });

  document.getElementById('save').addEventListener("click", async () => {
    const passions = [...document.querySelectorAll('input[data-kind="passions"]:checked')].map(i => i.dataset.id);
    const pieges   = [...document.querySelectorAll('input[data-kind="pieges"]:checked')].map(i => i.dataset.id);
    const note = document.getElementById('note').value.trim();
    await saveDay(today, {
      ego: {
        passions, pieges,
        notes: { global: note || null },
        when: Date.now()
      }
    });
    flashOk(document.getElementById('ok'));
    setTimeout(() => window.location.href = '../aujourdhui/', 900);
  });
})();
