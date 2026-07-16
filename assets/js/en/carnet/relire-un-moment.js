/* "Revisit a moment of the day" — the reflective heart */
import { requireSession, loadTypeData, todayKey, getDay, saveDay, esc, flashOk } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();
  const day = await getDay(today, session);
  const cur = day.moment || {};

  const isEvtChecked = (id) => cur.type === id;

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>The <em>Inner Mirror</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Today</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">Revisit <em>a moment</em> of the day</h1>
    <p class="miroir-sub fade-in-up delay-1">
      A single event, looked at gently. Not to judge yourself — to understand.
    </p>

    <h2 class="miroir-section-title fade-in-up delay-2">This moment was more like</h2>
    <div class="check-cards" id="types">
      ${T.evenements_a_relire.map(e => `
        <label class="check-card ${isEvtChecked(e.id)?'is-checked':''}">
          <input type="radio" name="evtype" value="${esc(e.id)}" ${isEvtChecked(e.id)?'checked':''} />
          <span class="check-card__box"></span>
          <span class="check-card__label">${esc(e.label)}</span>
        </label>
      `).join('')}
    </div>

    <div class="miroir-field fade-in-up delay-3">
      <label class="miroir-field__label" for="scene">What happened, simply</label>
      <textarea class="miroir-textarea" id="scene" rows="4" placeholder="With whom, when, how it came about, how it ended…">${esc(cur.scene || '')}</textarea>
    </div>

    <div class="miroir-field fade-in-up delay-4">
      <label class="miroir-field__label" for="remede">The remedy-word I want to call on</label>
      <select class="miroir-select" id="remede">
        <option value="">— choose —</option>
        ${T.remedes.map(r => `<option value="${esc(r.id)}" ${cur.remede===r.id?'selected':''}>${esc(r.label)}</option>`).join('')}
      </select>
    </div>

    <div class="miroir-field fade-in-up delay-5">
      <label class="miroir-field__label" for="repare">One small possible repair (optional)</label>
      <textarea class="miroir-textarea" id="repare" rows="2" placeholder="Talking to them again, breathing before answering tomorrow…">${esc(cur.repare || '')}</textarea>
    </div>

    <div class="miroir-field fade-in-up delay-6">
      <label class="miroir-field__label" for="appris">What this moment teaches me</label>
      <textarea class="miroir-textarea" id="appris" rows="3" placeholder="One thing, not ten…">${esc(cur.appris || '')}</textarea>
    </div>

    <div class="miroir-actions">
      <a href="../aujourdhui/" class="miroir-btn miroir-btn--ghost">Later</a>
      <button id="save" class="miroir-btn">Keep this moment</button>
      <span class="miroir-ok" id="ok">✓ kept</span>
    </div>
  `;

  document.querySelectorAll('input[name="evtype"]').forEach(inp => {
    inp.addEventListener('change', () => {
      document.querySelectorAll('#types .check-card').forEach(c => c.classList.remove('is-checked'));
      if (inp.checked) inp.closest('.check-card').classList.add('is-checked');
    });
  });

  document.getElementById('save').addEventListener("click", async () => {
    const type = document.querySelector('input[name="evtype"]:checked')?.value || null;
    await saveDay(today, {
      moment: {
        type,
        scene:  document.getElementById('scene').value.trim() || null,
        remede: document.getElementById('remede').value || null,
        repare: document.getElementById('repare').value.trim() || null,
        appris: document.getElementById('appris').value.trim() || null,
        when: Date.now()
      }
    });
    flashOk(document.getElementById('ok'));
    setTimeout(() => window.location.href = '../aujourdhui/', 900);
  });
})();
