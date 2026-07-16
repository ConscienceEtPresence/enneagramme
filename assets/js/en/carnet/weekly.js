/* « Miroir hebdomadaire » + suggestions automatiques
   Lit les 7 derniers jours et produit :
   - Un résumé doux (constat botanique)
   - Des suggestions ciblées selon les patterns du type
   ============================================================ */
import { listDays, todayKey, esc } from './session.js';

// Comptage des occurrences (ego.passions, ego.pieges, essence.moments) sur N jours
export function countOverDays(days, key, sub) {
  const counts = {};
  for (const d of days) {
    const arr = d.data?.[key]?.[sub];
    if (Array.isArray(arr)) for (const id of arr) counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
}

export function topEntries(counts, n = 3) {
  return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, n);
}

// Niveau dominant cette semaine
export function dominantZone(days) {
  const c = { lumineux: 0, fonctionnel: 0, reactif: 0, enseveli: 0 };
  for (const d of days) {
    const z = d.data?.niveau?.zone;
    if (z && z in c) c[z]++;
  }
  const total = Object.values(c).reduce((s, x) => s + x, 0);
  if (!total) return { zone: null, count: 0, total: 0 };
  const [zone, count] = Object.entries(c).sort((a,b) => b[1] - a[1])[0];
  return { zone, count, total, breakdown: c };
}

// Compte les touches d'essence
export function essenceTouches(days) {
  let n = 0;
  for (const d of days) {
    const arr = d.data?.essence?.moments;
    if (Array.isArray(arr)) n += arr.length;
  }
  return n;
}

// Vœux tenus
export function vowStats(days) {
  let total = 0, tenu = 0;
  for (const d of days) {
    const s = d.data?.reprise?.statut;
    if (s) { total++; if (s === 'tenu') tenu++; }
  }
  return { total, tenu };
}

// Labels par id (depuis le typeData)
function labelOf(typeData, kind, id) {
  const buckets = {
    passions: typeData.ego_du_jour?.passions || [],
    pieges:   typeData.ego_du_jour?.pieges   || [],
    moments:  typeData.essence_du_jour?.moments || []
  };
  const found = (buckets[kind] || []).find(x => x.id === id);
  return found?.label || id;
}

/* ============================================================
   GÉNÉRATEUR DE RÉSUMÉ HEBDOMADAIRE
   ============================================================ */
export function buildWeeklyMirror(days, typeData) {
  if (!days.length) return null;
  const filled = days.filter(d => Object.keys(d.data).filter(x => !x.startsWith('_')).length > 0);
  if (!filled.length) return null;

  const lines = [];

  // 1. Présence
  lines.push(`<strong>${filled.length}</strong> day${filled.length > 1 ? 's' : ''} inhabited out of the last 7.`);

  // 2. Niveau dominant
  const zone = dominantZone(filled);
  const zoneLabels = {
    lumineux:    'rather luminous',
    fonctionnel: 'mostly functional',
    reactif:     'often reactive',
    enseveli:    'heavy'
  };
  if (zone.zone) {
    lines.push(`The week has been <strong>${zoneLabels[zone.zone]}</strong>.`);
  }

  // 3. Top passions / pièges / essence
  const topPassions = topEntries(countOverDays(filled, 'ego', 'passions'), 2);
  const topPieges   = topEntries(countOverDays(filled, 'ego', 'pieges'), 2);
  const topEssence  = topEntries(countOverDays(filled, 'essence', 'moments'), 2);

  if (topPassions.length) {
    const [id, n] = topPassions[0];
    lines.push(`What came back the most: <em>“${esc(labelOf(typeData, 'passions', id))}”</em> (${n} times).`);
  }
  if (topPieges.length && topPassions.length && topPieges[0][1] >= 2) {
    const [id, n] = topPieges[0];
    lines.push(`A visible trap: <em>“${esc(labelOf(typeData, 'pieges', id))}”</em> (${n} times).`);
  }
  if (topEssence.length) {
    const total = topEssence.reduce((s, [_, n]) => s + n, 0);
    lines.push(`<strong>${total}</strong> touch${total>1?'es':''} of essence encountered — including <em>“${esc(labelOf(typeData, 'moments', topEssence[0][0]))}”</em>.`);
  } else {
    lines.push(`No moment of essence noted this week. That's alright — they exist even when unnoticed.`);
  }

  // 4. Vœux
  const vows = vowStats(filled);
  if (vows.total > 0) {
    lines.push(`Of ${vows.total} vow${vows.total>1?'s':''} taken up, <strong>${vows.tenu}</strong> ${vows.tenu>1?'were kept':'was kept'}.`);
  }

  // 5. Phrase d'invitation pour la semaine prochaine
  const invite = inviteForNextWeek(filled, typeData, topPassions, topPieges, topEssence);
  if (invite) lines.push(`<em style="color:var(--car-gold)">${esc(invite)}</em>`);

  return {
    days: filled.length,
    zone,
    topPassions, topPieges, topEssence,
    vows,
    lines,
    invite
  };
}

function inviteForNextWeek(days, typeData, topPassions, topPieges, topEssence) {
  // Si essence forte → encourager
  if (topEssence.length >= 2 || (topEssence[0] && topEssence[0][1] >= 3)) {
    return "Keep honoring what's opening up. One thing at a time.";
  }
  // Si pièges récurrents → invitation ciblée
  if (topPieges.length && topPieges[0][1] >= 3) {
    const id = topPieges[0][0];
    return `For the coming week: name the trap “${labelOf(typeData, 'pieges', id)}” before it acts.`;
  }
  // Si passion récurrente
  if (topPassions.length && topPassions[0][1] >= 3) {
    const id = topPassions[0][0];
    return `This week, watch “${labelOf(typeData, 'passions', id)}” as it rises — without fighting it.`;
  }
  // Par défaut
  return "One gentle moment to keep for yourself, each day.";
}

/* ============================================================
   MOTEUR DE SUGGESTIONS (jour par jour)
   Analyse les derniers jours et propose 1 action ciblée
   ============================================================ */
export function buildSuggestions(days, typeData) {
  const filled = days.filter(d => Object.keys(d.data).filter(x => !x.startsWith('_')).length > 0);
  if (filled.length < 2) return []; // pas assez de matière

  const out = [];

  // Pattern 1 : un piège récurrent → suggestion concrète
  const pieges = countOverDays(filled, 'ego', 'pieges');
  for (const [id, n] of Object.entries(pieges)) {
    if (n >= 3) {
      const label = labelOf(typeData, 'pieges', id);
      // Suggestions génériques liées au piège
      out.push({
        type: 'piege-recurrent',
        message: `“${label}” came back ${n} times this week. Tomorrow, maybe name it as soon as it starts — without fighting it.`,
        weight: n
      });
    }
  }

  // Pattern 2 : aucune touche d'essence depuis 3+ jours → invitation douce
  const lastEssenceDays = filled.slice(0, 3).every(d => !(d.data?.essence?.moments?.length));
  if (lastEssenceDays && filled.length >= 3) {
    out.push({
      type: 'no-essence',
      message: `No moment of essence noted these last 3 days. Tomorrow, maybe look for the ordinary that is enough — even briefly.`,
      weight: 4
    });
  }

  // Pattern 3 : niveau qui se dégrade
  const recentZones = filled.slice(0, 4).map(d => d.data?.niveau?.zone).filter(Boolean);
  const reactifs = recentZones.filter(z => z === 'reactif' || z === 'enseveli').length;
  if (reactifs >= 3) {
    out.push({
      type: 'niveau-bas',
      message: `Several reactive or heavy days lately. Tomorrow, maybe come simply in light mode — a trace is already enough.`,
      weight: 5
    });
  }

  // Pattern 4 : un vœu n'a pas été tenu plusieurs fois
  const vows = vowStats(filled);
  if (vows.total >= 3 && vows.tenu === 0) {
    out.push({
      type: 'vows-pas-tenus',
      message: `Your vows haven't been kept this week. Maybe too ambitious? Tomorrow, a smaller, more concrete vow — just one thing, truly.`,
      weight: 4
    });
  }

  // Trier par poids décroissant et retourner top 2
  return out.sort((a, b) => b.weight - a.weight).slice(0, 2);
}

/* ============================================================
   API principale : lit les jours et compose tout
   ============================================================ */
export async function buildWeeklyData(session, typeData) {
  const days = await listDays(session, 14);
  const last7  = days.slice(0, 7);
  const last14 = days.slice(0, 14);

  return {
    mirror: buildWeeklyMirror(last7, typeData),
    suggestions: buildSuggestions(last14, typeData),
    daysCount: last7.filter(d => Object.keys(d.data).filter(x => !x.startsWith('_')).length > 0).length
  };
}
