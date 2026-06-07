/* « Mon miroir » — calendrier 30 jours + détail du jour cliqué */
import { requireSession, loadTypeData, todayKey, getDay, DAILY_PREFIX, esc } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateLisible(s) {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();

  // 56 derniers jours (8 semaines)
  const cells = [];
  for (let i = 55; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dateKey(d);
    const day = getDay(k);
    const visited = Object.keys(day).filter(x => !x.startsWith('_')).length > 0;
    cells.push({ key: k, visited, isToday: k === today });
  }

  const visitedCount = cells.filter(c => c.visited).length;

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>Le <em>miroir intérieur</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Aujourd'hui</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">Mon <em>miroir</em></h1>
    <p class="miroir-sub fade-in-up delay-1">
      Les jours visités sur les 8 dernières semaines.
      Cliquez un jour pour relire ce que vous y avez déposé.
    </p>

    <p style="text-align:center;color:var(--car-muted);font-style:italic;font-family:'Cormorant Garamond',serif;">
      ${visitedCount} jour${visitedCount>1?'s':''} habité${visitedCount>1?'s':''} sur 56.
    </p>

    <div class="cal-grid" id="grid">
      ${cells.map(c => `<button class="cal-cell ${c.visited?'is-visited':''} ${c.isToday?'is-today':''}" data-key="${c.key}" title="${dateLisible(c.key)}"></button>`).join('')}
    </div>

    <div class="day-detail" id="detail">
      <p class="day-detail__empty">— cliquez un jour pour voir ce qui y a été déposé —</p>
    </div>
  `;

  const detail = document.getElementById('detail');

  document.querySelectorAll('.cal-cell').forEach(c => {
    c.addEventListener('click', () => {
      const k = c.dataset.key;
      const day = getDay(k);
      const has = Object.keys(day).filter(x => !x.startsWith('_')).length > 0;
      if (!has) {
        detail.innerHTML = `<p class="day-detail__empty">${dateLisible(k)} — rien noté ce jour-là.</p>`;
        return;
      }
      detail.innerHTML = `
        <h3>${dateLisible(k)}</h3>
        <dl>
          ${day.niveau?.zone ? `<dt>Niveau</dt><dd>${esc(day.niveau.zone)}${day.niveau.niveau_riso ? ` — niveau ${day.niveau.niveau_riso}` : ''}${day.niveau.note ? `<br><em>« ${esc(day.niveau.note)} »</em>` : ''}</dd>` : ''}
          ${day.ego?.passions?.length ? `<dt>Passions</dt><dd>${day.ego.passions.map(esc).join(', ')}</dd>` : ''}
          ${day.ego?.pieges?.length ? `<dt>Pièges</dt><dd>${day.ego.pieges.map(esc).join(', ')}</dd>` : ''}
          ${day.essence?.moments?.length ? `<dt>Essence</dt><dd>${day.essence.moments.map(esc).join(', ')}${day.essence.phrase ? `<br><em>« ${esc(day.essence.phrase)} »</em>` : ''}</dd>` : ''}
          ${day.moment?.type ? `<dt>Moment</dt><dd>${esc(day.moment.type)}${day.moment.scene ? `<br><em>« ${esc(day.moment.scene)} »</em>` : ''}${day.moment.appris ? `<br>j'ai appris : ${esc(day.moment.appris)}` : ''}</dd>` : ''}
          ${day.poser?.phrase ? `<dt>Le jour</dt><dd><em>« ${esc(day.poser.phrase)} »</em></dd>` : ''}
          ${day.poser?.merci ? `<dt>Merci</dt><dd>${esc(day.poser.merci)}</dd>` : ''}
          ${day.poser?.vow ? `<dt>Vœu</dt><dd><em>« ${esc(day.poser.vow)} »</em></dd>` : ''}
          ${day.reprise?.statut ? `<dt>Reprise</dt><dd>${esc(day.reprise.statut)}</dd>` : ''}
        </dl>
      `;
    });
  });
})();
