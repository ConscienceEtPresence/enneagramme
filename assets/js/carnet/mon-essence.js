/* « Mon essence aujourd'hui » — moments où autre chose a transparu */
import { requireSession, loadTypeData, todayKey, getDay, saveDay, esc, flashOk } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();
  const day = await getDay(today, session);
  const cur = day.essence || { moments: [], phrase: '', appris: '' };
  const isChecked = (id) => Array.isArray(cur.moments) && cur.moments.includes(id);

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>Le <em>miroir intérieur</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Aujourd'hui</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">Mon <em>essence</em> aujourd'hui</h1>
    <p class="miroir-sub fade-in-up delay-1">
      Y a-t-il eu, même brièvement, un moment où vous étiez autrement
      que dans vos mécanismes habituels ? Cochez ce que vous avez touché —
      même quelques secondes comptent.
    </p>

    <div class="check-cards fade-in-up delay-2" id="moments">
      ${T.essence_du_jour.moments.map(m => `
        <label class="check-card check-card--essence ${isChecked(m.id)?'is-checked':''}">
          <input type="checkbox" data-id="${esc(m.id)}" ${isChecked(m.id)?'checked':''} />
          <span class="check-card__box"></span>
          <span class="check-card__label">${esc(m.label)}</span>
        </label>
      `).join('')}
    </div>

    <div class="miroir-field fade-in-up delay-3">
      <label class="miroir-field__label" for="phrase">Quand ça est arrivé (une phrase)</label>
      <textarea class="miroir-textarea" id="phrase" rows="2" placeholder="Ce matin, en buvant mon café, sans bruit…">${esc(cur.phrase || '')}</textarea>
    </div>

    <div class="miroir-field fade-in-up delay-4">
      <label class="miroir-field__label" for="appris">Qu'est-ce que ce moment m'apprend ?</label>
      <textarea class="miroir-textarea" id="appris" rows="3" placeholder="Ce que je voudrais me rappeler de cette pause…">${esc(cur.appris || '')}</textarea>
    </div>

    <div class="miroir-actions">
      <a href="../aujourdhui/" class="miroir-btn miroir-btn--ghost">Plus tard</a>
      <button id="save" class="miroir-btn">Garder ce moment</button>
      <span class="miroir-ok" id="ok">✓ gardé</span>
    </div>
  `;

  document.querySelectorAll('.check-card input').forEach(inp => {
    inp.addEventListener('change', () => {
      inp.closest('.check-card').classList.toggle('is-checked', inp.checked);
    });
  });

  document.getElementById('save').addEventListener("click", async () => {
    const moments = [...document.querySelectorAll('input[data-id]:checked')].map(i => i.dataset.id);
    await saveDay(today, {
      essence: {
        moments,
        phrase: document.getElementById('phrase').value.trim() || null,
        appris: document.getElementById('appris').value.trim() || null,
        when: Date.now()
      }
    });
    flashOk(document.getElementById('ok'));
    setTimeout(() => window.location.href = '../aujourdhui/', 900);
  });
})();
