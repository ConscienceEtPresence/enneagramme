/* "Lay down the day" — evening synthesis, the vow for tomorrow */
import { requireSession, loadTypeData, todayKey, getDay, saveDay, esc, flashOk } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();
  const day = await getDay(today, session);
  const cur = day.poser || {};

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>The <em>Inner Mirror</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Today</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">Lay down <em>the day</em></h1>
    <p class="miroir-sub fade-in-up delay-1">
      One sentence for what happened, one vow for tomorrow. That's all.
    </p>

    <div class="miroir-field fade-in-up delay-2">
      <label class="miroir-field__label" for="phrase">One sentence about this day</label>
      <textarea class="miroir-textarea" id="phrase" rows="3" placeholder="What will remain of this day, in a few words…">${esc(cur.phrase || '')}</textarea>
    </div>

    <div class="miroir-field fade-in-up delay-3">
      <label class="miroir-field__label" for="merci">One thing to be grateful for (optional)</label>
      <textarea class="miroir-textarea" id="merci" rows="2" placeholder="Even small, even ordinary…">${esc(cur.merci || '')}</textarea>
    </div>

    <div class="miroir-field fade-in-up delay-4">
      <label class="miroir-field__label" for="vow">My vow for tomorrow</label>
      <textarea class="miroir-textarea" id="vow" rows="3" placeholder="${esc(T.pratiques_du_matin[0] || 'An intention, one concrete thing…')}">${esc(cur.vow || '')}</textarea>
      <p style="margin-top:.5rem;font-style:italic;color:var(--car-muted);font-size:.9rem;font-family:'Cormorant Garamond',serif;">
        This vow will come back to you tomorrow morning — to see how it held up.
      </p>
    </div>

    <div class="miroir-actions">
      <a href="../aujourdhui/" class="miroir-btn miroir-btn--ghost">Later</a>
      <button id="save" class="miroir-btn">Lay down the day</button>
      <span class="miroir-ok" id="ok">✓ laid down</span>
    </div>
  `;

  document.getElementById('save').addEventListener("click", async () => {
    await saveDay(today, {
      poser: {
        phrase: document.getElementById('phrase').value.trim() || null,
        merci:  document.getElementById('merci').value.trim() || null,
        vow:    document.getElementById('vow').value.trim() || null,
        when: Date.now()
      }
    });
    flashOk(document.getElementById('ok'));
    setTimeout(() => window.location.href = '../aujourdhui/', 900);
  });
})();
