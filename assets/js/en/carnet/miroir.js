/* "My mirror" — 30-day calendar + detail of the clicked day */
import { requireSession, loadTypeData, todayKey, listDays, esc } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateLisible(s) {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
}

(async function init() {
  const T = await loadTypeData(session.type);
  const today = todayKey();

  // Fetches all entered days (up to 100), then projects onto 56 days
  const days = await listDays(session, 100);
  const visitedSet = new Set(days.map(d => d.date));
  const dataMap = Object.fromEntries(days.map(d => [d.date, d.data]));

  const cells = [];
  for (let i = 55; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dateKey(d);
    cells.push({ key: k, visited: visitedSet.has(k), isToday: k === today });
  }

  const visitedCount = cells.filter(c => c.visited).length;

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>The <em>Inner Mirror</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Today</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">My <em>mirror</em></h1>
    <p class="miroir-sub fade-in-up delay-1">
      The days visited over the last 8 weeks.
      Click a day to revisit what you recorded there.
    </p>

    <p style="text-align:center;color:var(--car-muted);font-style:italic;font-family:'Cormorant Garamond',serif;">
      ${visitedCount} day${visitedCount>1?'s':''} lived out of 56.
    </p>

    <div class="cal-grid" id="grid">
      ${cells.map(c => `<button class="cal-cell ${c.visited?'is-visited':''} ${c.isToday?'is-today':''}" data-key="${c.key}" title="${dateLisible(c.key)}"></button>`).join('')}
    </div>

    <div class="day-detail" id="detail">
      <p class="day-detail__empty">— click a day to see what was recorded there —</p>
    </div>
  `;

  const detail = document.getElementById('detail');

  document.querySelectorAll('.cal-cell').forEach(c => {
    c.addEventListener('click', () => {
      const k = c.dataset.key;
      const day = dataMap[k] || {};
      const has = Object.keys(day).filter(x => !x.startsWith('_')).length > 0;
      if (!has) {
        detail.innerHTML = `<p class="day-detail__empty">${dateLisible(k)} — nothing noted that day.</p>`;
        return;
      }
      detail.innerHTML = `
        <h3>${dateLisible(k)}</h3>
        <dl>
          ${day.niveau?.zone ? `<dt>Level</dt><dd>${esc(day.niveau.zone)}${day.niveau.niveau_riso ? ` — level ${day.niveau.niveau_riso}` : ''}${day.niveau.note ? `<br><em>“${esc(day.niveau.note)}”</em>` : ''}</dd>` : ''}
          ${day.ego?.passions?.length ? `<dt>Passions</dt><dd>${day.ego.passions.map(esc).join(', ')}</dd>` : ''}
          ${day.ego?.pieges?.length ? `<dt>Traps</dt><dd>${day.ego.pieges.map(esc).join(', ')}</dd>` : ''}
          ${day.essence?.moments?.length ? `<dt>Essence</dt><dd>${day.essence.moments.map(esc).join(', ')}${day.essence.phrase ? `<br><em>“${esc(day.essence.phrase)}”</em>` : ''}</dd>` : ''}
          ${day.moment?.type ? `<dt>Moment</dt><dd>${esc(day.moment.type)}${day.moment.scene ? `<br><em>“${esc(day.moment.scene)}”</em>` : ''}${day.moment.appris ? `<br>I learned: ${esc(day.moment.appris)}` : ''}</dd>` : ''}
          ${day.poser?.phrase ? `<dt>The day</dt><dd><em>“${esc(day.poser.phrase)}”</em></dd>` : ''}
          ${day.poser?.merci ? `<dt>Thanks</dt><dd>${esc(day.poser.merci)}</dd>` : ''}
          ${day.poser?.vow ? `<dt>Vow</dt><dd><em>“${esc(day.poser.vow)}”</em></dd>` : ''}
          ${day.reprise?.statut ? `<dt>Follow-up</dt><dd>${esc(day.reprise.statut)}</dd>` : ''}
        </dl>
      `;
    });
  });
})();
