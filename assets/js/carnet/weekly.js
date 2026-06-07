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
  lines.push(`<strong>${filled.length}</strong> jour${filled.length > 1 ? 's' : ''} habité${filled.length > 1 ? 's' : ''} sur les 7 derniers.`);

  // 2. Niveau dominant
  const zone = dominantZone(filled);
  const zoneLabels = {
    lumineux:    'plutôt lumineuse',
    fonctionnel: 'majoritairement fonctionnelle',
    reactif:     'souvent réactive',
    enseveli:    'lourde'
  };
  if (zone.zone) {
    lines.push(`La semaine a été <strong>${zoneLabels[zone.zone]}</strong>.`);
  }

  // 3. Top passions / pièges / essence
  const topPassions = topEntries(countOverDays(filled, 'ego', 'passions'), 2);
  const topPieges   = topEntries(countOverDays(filled, 'ego', 'pieges'), 2);
  const topEssence  = topEntries(countOverDays(filled, 'essence', 'moments'), 2);

  if (topPassions.length) {
    const [id, n] = topPassions[0];
    lines.push(`Ce qui est revenu le plus : <em>« ${esc(labelOf(typeData, 'passions', id))} »</em> (${n} fois).`);
  }
  if (topPieges.length && topPassions.length && topPieges[0][1] >= 2) {
    const [id, n] = topPieges[0];
    lines.push(`Un piège visible : <em>« ${esc(labelOf(typeData, 'pieges', id))} »</em> (${n} fois).`);
  }
  if (topEssence.length) {
    const total = topEssence.reduce((s, [_, n]) => s + n, 0);
    lines.push(`<strong>${total}</strong> touche${total>1?'s':''} d'essence rencontrée${total>1?'s':''} — dont <em>« ${esc(labelOf(typeData, 'moments', topEssence[0][0]))} »</em>.`);
  } else {
    lines.push(`Pas de moment d'essence noté cette semaine. Pas grave — ils existent même quand on ne les remarque pas.`);
  }

  // 4. Vœux
  const vows = vowStats(filled);
  if (vows.total > 0) {
    lines.push(`Sur ${vows.total} vœu${vows.total>1?'x':''} repris, <strong>${vows.tenu}</strong> ${vows.tenu>1?'ont été tenus':'a été tenu'}.`);
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
    return "Continuer à honorer ce qui s'ouvre. Une chose à la fois.";
  }
  // Si pièges récurrents → invitation ciblée
  if (topPieges.length && topPieges[0][1] >= 3) {
    const id = topPieges[0][0];
    return `Pour la semaine à venir : nommer le piège « ${labelOf(typeData, 'pieges', id)} » avant qu'il agisse.`;
  }
  // Si passion récurrente
  if (topPassions.length && topPassions[0][1] >= 3) {
    const id = topPassions[0][0];
    return `Cette semaine, observer « ${labelOf(typeData, 'passions', id)} » quand elle monte — sans la combattre.`;
  }
  // Par défaut
  return "Un instant doux à se garder, chaque jour.";
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
        message: `« ${label} » est revenu ${n} fois cette semaine. Demain, peut-être le nommer dès qu'il commence — sans le combattre.`,
        weight: n
      });
    }
  }

  // Pattern 2 : aucune touche d'essence depuis 3+ jours → invitation douce
  const lastEssenceDays = filled.slice(0, 3).every(d => !(d.data?.essence?.moments?.length));
  if (lastEssenceDays && filled.length >= 3) {
    out.push({
      type: 'no-essence',
      message: `Aucun moment d'essence noté ces 3 derniers jours. Demain, peut-être chercher l'ordinaire qui suffit — même brièvement.`,
      weight: 4
    });
  }

  // Pattern 3 : niveau qui se dégrade
  const recentZones = filled.slice(0, 4).map(d => d.data?.niveau?.zone).filter(Boolean);
  const reactifs = recentZones.filter(z => z === 'reactif' || z === 'enseveli').length;
  if (reactifs >= 3) {
    out.push({
      type: 'niveau-bas',
      message: `Plusieurs jours réactifs ou lourds ces derniers temps. Demain, peut-être venir simplement en mode léger — une trace, c'est déjà assez.`,
      weight: 5
    });
  }

  // Pattern 4 : un vœu n'a pas été tenu plusieurs fois
  const vows = vowStats(filled);
  if (vows.total >= 3 && vows.tenu === 0) {
    out.push({
      type: 'vows-pas-tenus',
      message: `Vos vœux n'ont pas été tenus cette semaine. Peut-être trop ambitieux ? Demain, un vœu plus petit, plus concret — une seule chose, vraiment.`,
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
