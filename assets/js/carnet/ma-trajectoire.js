/* « Ma trajectoire » — vue 30/56 derniers jours : niveau + essence */
import { requireSession, loadTypeData, todayKey, getDay, esc } from './session.js';

const session = requireSession();
const mount = document.getElementById('mount');

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

(async function init() {
  const T = await loadTypeData(session.type);
  const DAYS = 28;
  const cells = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    cells.push({ key: dateKey(d), day: getDay(dateKey(d)) });
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
    lecture.push('Vous tenez globalement dans la lumière ou le fonctionnel.');
  } else if (counts.enseveli > 3) {
    lecture.push('Plusieurs jours lourds sur cette période — soyez doux(ce) envers vous-même.');
  }
  if (essenceTouches > counts.none + counts.enseveli) {
    lecture.push(`Les moments d'essence se sont multipliés (${essenceTouches} contacts).`);
  } else if (essenceTouches > 0) {
    lecture.push(`Quelques instants d'essence reconnus (${essenceTouches}).`);
  }
  if (vowsCount > 0) {
    lecture.push(`Sur ${vowsCount} vœu${vowsCount>1?'x':''} repris, ${vowsKept} ${vowsKept>1?'ont été tenus':'a été tenu'}.`);
  }
  if (egoPassions > egoPieges * 1.3) {
    lecture.push('Vos passions sont plus souvent activées que vos pièges typiques.');
  } else if (egoPieges > egoPassions * 1.3) {
    lecture.push('Vos pièges sont plus souvent reconnus que vos passions.');
  }
  if (!lecture.length) lecture.push('Encore peu de données. Revenez d\'ici une semaine pour voir un dessin se former.');

  mount.innerHTML = `
    <header class="miroir-header">
      <a href="../aujourdhui/" class="miroir-brand">
        <span class="miroir-brand__mark"></span>
        <span>Le <em>miroir intérieur</em></span>
      </a>
      <div class="miroir-header__nav"><a href="../aujourdhui/">Aujourd'hui</a></div>
    </header>

    <h1 class="miroir-h1 fade-in-up">Ma <em>trajectoire</em></h1>
    <p class="miroir-sub fade-in-up delay-1">
      ${DAYS} derniers jours. Pas un score — un dessin de ce qui pousse.
    </p>

    <div class="traj-graph fade-in-up delay-2">
      ${row('☀ Lumineux',   'lumineux')}
      ${row('🌤 Fonctionnel','fonctionnel')}
      ${row('🌫 Réactif',    'reactif')}
      ${row('🌑 Enseveli',   'enseveli')}

      <div class="traj-row">
        <span class="traj-label">✨ Essence</span>
        <div class="traj-essence">
          ${cells.map(c => `<div class="traj-essence__cell ${c.day.essence?.moments?.length?'has':''}"></div>`).join('')}
        </div>
      </div>
    </div>

    <div class="traj-stats fade-in-up delay-3">
      <div class="traj-stat"><span class="traj-stat__num">${counts.lumineux + counts.fonctionnel}</span><div class="traj-stat__lbl">Jours stables</div></div>
      <div class="traj-stat"><span class="traj-stat__num">${essenceTouches}</span><div class="traj-stat__lbl">Touches d'essence</div></div>
      <div class="traj-stat"><span class="traj-stat__num">${vowsKept}/${vowsCount || '–'}</span><div class="traj-stat__lbl">Vœux tenus</div></div>
    </div>

    <div class="traj-reading fade-in-up delay-4">
      ${lecture.map(l => `<p style="margin:.4rem 0">— ${esc(l)}</p>`).join('')}
    </div>
  `;
})();
