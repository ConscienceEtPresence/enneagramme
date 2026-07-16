/* « Ma trajectoire » — vue 30/56 derniers jours : niveau + essence */
import { requireSession, loadTypeData, todayKey, listDays, esc } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

(async function init() {
  const T = await loadTypeData(session.type);
  const DAYS = 28;
  const days = await listDays(session, 60);
  const dataMap = Object.fromEntries(days.map(d => [d.date, d.data]));
  const cells = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dateKey(d);
    cells.push({ key: k, day: dataMap[k] || {} });
  }

  // Comptages
  const counts = { lumineux: 0, fonctionnel: 0, reactif: 0, enseveli: 0, none: 0 };
  let essenceTouches = 0;
  let egoPassions = 0, egoPieges = 0;
  let vowsKept = 0, vowsCount = 0;

  cells.forEach(c => {
    const zone = c.day.niveau?.zone || 'none';
    counts[zone]++;
    if (Array.isArray(c.day.essence?.moments) && c.day.essence.moments.length) essenceTouches += c.day.essence.moments.length;
    if (Array.isArray(c.day.ego?.passions)) egoPassions += c.day.ego.passions.length;
    if (Array.isArray(c.day.ego?.pieges))   egoPieges   += c.day.ego.pieges.length;
    if (c.day.reprise?.statut) {
      vowsCount++;
      if (c.day.reprise.statut === 'tenu') vowsKept++;
    }
  });

  const row = (label, zoneId) => `
    <div class="traj-row">
      <span class="traj-label">${label}</span>
      <div class="traj-bar">
        ${cells.map(c => `<div class="traj-bar__cell ${c.day.niveau?.zone===zoneId?zoneId:''}" title="${c.key}"></div>`).join('')}
      </div>
    </div>
  `;

  // Lecture douce générée
  const lecture = [];
  if (counts.lumineux + counts.fonctionnel > counts.reactif + counts.enseveli) {
    lecture.push('You have mostly stayed in the light or the functional.');
  } else if (counts.enseveli > 3) {
    lecture.push('Several heavy days over this period — be gentle with yourself.');
  }
  if (essenceTouches > counts.none + counts.enseveli) {
    lecture.push(`Moments of essence have multiplied (${essenceTouches} contacts).`);
  } else if (essenceTouches > 0) {
    lecture.push(`A few moments of essence recognized (${essenceTouches}).`);
  }
  if (vowsCount > 0) {
    lecture.push(`Of ${vowsCount} vow${vowsCount>1?'s':''} taken up, ${vowsKept} ${vowsKept>1?'were kept':'was kept'}.`);
  }
  if (egoPassions > egoPieges * 1.3) {
    lecture.push('Your passions have been activated more often than your typical traps.');
  } else if (egoPieges > egoPassions * 1.3) {
    lecture.push('Your traps have been recognized more often than your passions.');
  }
  if (!lecture.length) lecture.push('Still little data. Come back in about a week to see a shape form.');

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>The <em>Inner Mirror</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Today</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">My <em>trajectory</em></h1>
    <p class="miroir-sub fade-in-up delay-1">
      Last ${DAYS} days. Not a score — a shape of what is growing.
    </p>

    <div class="traj-graph fade-in-up delay-2">
      ${row('☀ Luminous',   'lumineux')}
      ${row('🌤 Functional','fonctionnel')}
      ${row('🌫 Reactive',    'reactif')}
      ${row('🌑 Buried',   'enseveli')}

      <div class="traj-row">
        <span class="traj-label">✨ Essence</span>
        <div class="traj-essence">
          ${cells.map(c => `<div class="traj-essence__cell ${c.day.essence?.moments?.length?'has':''}"></div>`).join('')}
        </div>
      </div>
    </div>

    <div class="traj-stats fade-in-up delay-3">
      <div class="traj-stat"><span class="traj-stat__num">${counts.lumineux + counts.fonctionnel}</span><div class="traj-stat__lbl">Stable days</div></div>
      <div class="traj-stat"><span class="traj-stat__num">${essenceTouches}</span><div class="traj-stat__lbl">Touches of essence</div></div>
      <div class="traj-stat"><span class="traj-stat__num">${vowsKept}/${vowsCount || '–'}</span><div class="traj-stat__lbl">Vows kept</div></div>
    </div>

    <div class="traj-reading fade-in-up delay-4">
      ${lecture.map(l => `<p style="margin:.4rem 0">— ${esc(l)}</p>`).join('')}
    </div>
  `;
})();
