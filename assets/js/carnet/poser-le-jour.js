/* « Déposer la journée » — synthèse du soir, le vœu pour demain */
import { requireSession, loadTypeData, todayKey, getDay, saveDay, esc, flashOk } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();
  const day = getDay(today);
  const cur = day.poser || {};

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>Le <em>miroir intérieur</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Aujourd'hui</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">Déposer <em>la journée</em></h1>
    <p class="miroir-sub fade-in-up delay-1">
      Une phrase pour ce qui s'est passé, un vœu pour demain. C'est tout.
    </p>

    <div class="miroir-field fade-in-up delay-2">
      <label class="miroir-field__label" for="phrase">Une phrase sur cette journée</label>
      <textarea class="miroir-textarea" id="phrase" rows="3" placeholder="Ce qui restera de ce jour, en quelques mots…">${esc(cur.phrase || '')}</textarea>
    </div>

    <div class="miroir-field fade-in-up delay-3">
      <label class="miroir-field__label" for="merci">Une chose pour laquelle dire merci (facultatif)</label>
      <textarea class="miroir-textarea" id="merci" rows="2" placeholder="Même petite, même banale…">${esc(cur.merci || '')}</textarea>
    </div>

    <div class="miroir-field fade-in-up delay-4">
      <label class="miroir-field__label" for="vow">Mon vœu pour demain</label>
      <textarea class="miroir-textarea" id="vow" rows="3" placeholder="${esc(T.pratiques_du_matin[0] || 'Une intention, une chose concrète…')}">${esc(cur.vow || '')}</textarea>
      <p style="margin-top:.5rem;font-style:italic;color:var(--car-muted);font-size:.9rem;font-family:'Cormorant Garamond',serif;">
        Ce vœu vous reviendra demain matin — pour voir comment il s'est tenu.
      </p>
    </div>

    <div class="miroir-actions">
      <a href="../aujourdhui/" class="miroir-btn miroir-btn--ghost">Plus tard</a>
      <button id="save" class="miroir-btn">Déposer le jour</button>
      <span class="miroir-ok" id="ok">✓ déposé</span>
    </div>
  `;

  document.getElementById('save').addEventListener('click', () => {
    saveDay(today, {
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
