/* « Mon ego aujourd'hui » — checkboxes spécifiques au type */
import { requireSession, loadTypeData, todayKey, getDay, saveDay, esc, flashOk } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();
  const day = getDay(today);
  const cur = day.ego || { passions: [], pieges: [], notes: {} };
  const isChecked = (kind, id) => Array.isArray(cur[kind]) && cur[kind].includes(id);

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>Le <em>miroir intérieur</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Aujourd'hui</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">Mon <em>ego</em> aujourd'hui</h1>
    <p class="miroir-sub fade-in-up delay-1">
      Voici les mécanismes typiques de votre type. Cochez ce qui s'est activé —
      même peu, même brièvement. Pas de jugement, juste de la conscience.
    </p>

    <h2 class="miroir-section-title fade-in-up delay-2">Passions et moteurs</h2>
    <p class="miroir-section-sub">Ce qui vous a poussé du dedans.</p>
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

    <h2 class="miroir-section-title fade-in-up delay-3">Pièges typiques</h2>
    <p class="miroir-section-sub">Les mouvements automatiques qui vous prennent.</p>
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
      <label class="miroir-field__label" for="note">Une note pour aujourd'hui (facultatif)</label>
      <textarea class="miroir-textarea" id="note" rows="4" placeholder="Ce qui s'est passé, ce que ça m'a appris…">${esc((cur.notes && cur.notes.global) || '')}</textarea>
    </div>

    <div class="miroir-actions">
      <a href="../aujourdhui/" class="miroir-btn miroir-btn--ghost">Plus tard</a>
      <button id="save" class="miroir-btn">Enregistrer</button>
      <span class="miroir-ok" id="ok">✓ enregistré</span>
    </div>
  `;

  document.querySelectorAll('.check-card input').forEach(inp => {
    inp.addEventListener('change', () => {
      inp.closest('.check-card').classList.toggle('is-checked', inp.checked);
    });
  });

  document.getElementById('save').addEventListener('click', () => {
    const passions = [...document.querySelectorAll('input[data-kind="passions"]:checked')].map(i => i.dataset.id);
    const pieges   = [...document.querySelectorAll('input[data-kind="pieges"]:checked')].map(i => i.dataset.id);
    const note = document.getElementById('note').value.trim();
    saveDay(today, {
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
