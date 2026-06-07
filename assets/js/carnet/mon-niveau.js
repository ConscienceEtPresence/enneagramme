/* « Mon niveau aujourd'hui » — auto-évaluation 4 zones / 9 niveaux Riso */
import {
  requireSession, loadTypeData, todayKey, getDay, saveDay, esc, flashOk
} from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();
  const day = await getDay(today, session);
  const cur = day.niveau || {};

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>Le <em>miroir intérieur</em></span>
      </a>
      <div class="miroir-header__nav">
        <a href="../aujourdhui/">Aujourd'hui</a>
      </div>
    </header>

    <h1 class="miroir-h1 fade-in-up">Mon <em>niveau</em> aujourd'hui</h1>
    <p class="miroir-sub fade-in-up delay-1">
      Sans jugement, sans score. Juste un repère honnête — où vous sentez-vous, à cet instant ?
    </p>

    <div class="niveau-zones fade-in-up delay-2" id="zones">
      ${T.niveaux.zones.map(z => `
        <button class="niveau-zone ${cur.zone===z.id?'is-active':''}" data-id="${z.id}">
          <div class="niveau-zone__icon">${z.icon}</div>
          <div class="niveau-zone__body">
            <h3 class="niveau-zone__nom">${esc(z.nom)}</h3>
            <p class="niveau-zone__desc">${esc(z.description)}</p>
          </div>
        </button>
      `).join('')}
    </div>

    <div class="niveau-precision fade-in-up delay-3">
      <button class="niveau-precision__toggle" id="toggle-precision">
        ${cur.niveau_riso ? `Niveau précisé : ${cur.niveau_riso} — modifier` : 'Préciser parmi les 9 niveaux'}
      </button>
      <div class="niveau-details" id="details">
        ${T.niveaux.details_riso.map(d => `
          <button class="niveau-detail ${cur.niveau_riso===d.n?'is-active':''}" data-n="${d.n}">
            <div class="niveau-detail__head">
              <span class="niveau-detail__n">Niveau ${d.n}</span>
              <span class="niveau-detail__titre">${esc(d.titre)}</span>
            </div>
            <p class="niveau-detail__texte">${esc(d.texte)}</p>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="miroir-field fade-in-up delay-4">
      <label class="miroir-field__label" for="note">Une note pour ce niveau (facultatif)</label>
      <textarea class="miroir-textarea" id="note" rows="3" placeholder="Ce qui m'a amené là, ce que je sens…">${esc(cur.note || '')}</textarea>
    </div>

    <div class="miroir-actions">
      <a href="../aujourdhui/" class="miroir-btn miroir-btn--ghost">Plus tard</a>
      <button id="save" class="miroir-btn">Enregistrer mon niveau</button>
      <span class="miroir-ok" id="ok">✓ enregistré</span>
    </div>
  `;

  let zone = cur.zone || null;
  let nivR = cur.niveau_riso || null;
  let precisionOpen = !!cur.niveau_riso;
  if (precisionOpen) document.getElementById('details').classList.add('is-open');

  document.querySelectorAll('#zones .niveau-zone').forEach(b => {
    b.addEventListener("click", async () => {
      document.querySelectorAll('#zones .niveau-zone').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      zone = b.dataset.id;
    });
  });

  document.getElementById('toggle-precision').addEventListener("click", async () => {
    precisionOpen = !precisionOpen;
    document.getElementById('details').classList.toggle('is-open', precisionOpen);
  });

  document.querySelectorAll('#details .niveau-detail').forEach(b => {
    b.addEventListener("click", async () => {
      document.querySelectorAll('#details .niveau-detail').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      nivR = parseInt(b.dataset.n, 10);
      document.getElementById('toggle-precision').textContent = `Niveau précisé : ${nivR} — modifier`;
    });
  });

  document.getElementById('save').addEventListener("click", async () => {
    if (!zone) { alert('Choisissez une zone d\'abord.'); return; }
    await saveDay(today, { niveau: { zone, niveau_riso: nivR, note: document.getElementById('note').value.trim() || null, when: Date.now() } });
    flashOk(document.getElementById('ok'));
    setTimeout(() => window.location.href = '../aujourdhui/', 900);
  });
})();
