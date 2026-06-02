/* AMAVA seed data + report metrics — realistic content for the prototype.
   Mirrors the real Supabase seed: After-school Garden programme, 1–4 scale,
   five development areas. Assessments generated deterministically so the
   charts and trends look believable. Exported to window.AMAVA. */

const SCALE = [
  { value: 1, label: 'Emerging',  description: 'Rarely or not yet seen' },
  { value: 2, label: 'Developing', description: 'Beginning to show, on and off' },
  { value: 3, label: 'Consistent', description: 'Shows this most of the time' },
  { value: 4, label: 'Strong',     description: 'Always, on their own' },
];

const AREAS = [
  { id: 'gen', name: 'General', short: 'General', icon: 'sun', indicators: [
    { id: 'g1', short: 'Appearance',   text: 'Good general appearance' },
    { id: 'g2', short: 'Tidies up',    text: 'Willingness to clean up after class' },
    { id: 'g3', short: 'Listens',      text: 'Willingness to listen and ask questions' },
    { id: 'g4', short: 'Co-operates',  text: 'Willing to co-operate' },
    { id: 'g5', short: 'Engages',      text: 'Shows effort and engagement in activities' },
  ]},
  { id: 'emo', name: 'Emotional Development', short: 'Emotional', icon: 'heart', indicators: [
    { id: 'e1', short: 'Talks to me',  text: 'Willingness to communicate with the facilitator' },
    { id: 'e2', short: 'Sense of self', text: 'Ability to demonstrate a strong sense of self' },
    { id: 'e3', short: 'Empathy',      text: 'Ability to show empathy when appropriate' },
    { id: 'e4', short: 'Expresses',    text: 'Expresses feelings and emotions in words' },
  ]},
  { id: 'art', name: 'Artistic / Creative', short: 'Creative', icon: 'spark', indicators: [
    { id: 'a1', short: 'Knows tools',  text: 'Ability to identify materials / tools' },
    { id: 'a2', short: 'Uses tools',   text: 'Ability to hold and use materials / tools' },
    { id: 'a3', short: 'Shares work',  text: 'Willingness to show and share work with others' },
    { id: 'a4', short: 'Experiments',  text: 'Willingness to experiment with materials' },
    { id: 'a5', short: 'Finishes',     text: 'Ability to complete projects as instructed' },
  ]},
  { id: 'soc', name: 'Social & Interaction', short: 'Social', icon: 'people', indicators: [
    { id: 's1', short: 'Follows',      text: 'Concentrates, listens and follows instructions' },
    { id: 's2', short: 'Appreciates',  text: 'Shows appreciation for other children' },
    { id: 's3', short: 'Respect',      text: 'Shows respect to the facilitator' },
    { id: 's4', short: 'Problem-solves', text: 'Demonstrates good problem-solving in class' },
    { id: 's5', short: 'Shares tools', text: 'Freely shares tools and materials with others' },
  ]},
  { id: 'gar', name: 'Garden & Nature', short: 'Garden', icon: 'leaf', gardenOnly: true, indicators: [
    { id: 'n1', short: 'Self-regulates', text: 'Self-regulates when required' },
    { id: 'n2', short: 'In the garden', text: 'Interacts with the garden outside sessions' },
    { id: 'n3', short: 'Cares',        text: 'Shows care for environment / animals / insects' },
    { id: 'n4', short: 'Curious',      text: 'Shows interest / fascination with the outdoors' },
    { id: 'n5', short: 'Independent',  text: 'Uses the space independently in breakaways' },
  ]},
];

const ALL_INDICATORS = AREAS.flatMap(a => a.indicators.map(i => ({ ...i, areaId: a.id, areaName: a.name })));

const CLASSES = [
  { id: 'c1', name: 'Sunrise Class', garden: true,  color: '#DD866C' },
  { id: 'c2', name: 'Garden Club',   garden: true,  color: '#6fa173' },
  { id: 'c3', name: 'Afternoon Group', garden: false, color: '#687F8B' },
];

// firstName, surname, classId, progress profile (baseline avg → latest avg), assessed?
const RAW_CHILDREN = [
  ['Aphiwe', 'Mbeki',    'c1', 1.6, 3.1, true,  true],
  ['Liyema', 'Dlamini',  'c1', 1.4, 2.8, true,  true],
  ['Sipho',  'Nkosi',    'c1', 2.0, 3.4, true,  true],
  ['Anele',  'Jacobs',   'c1', 1.8, 2.5, true,  true],
  ['Owethu', 'Khumalo',  'c1', 1.5, 3.6, true,  true],
  ['Banele', 'Petersen', 'c1', null, null, true, false], // baseline only / new
  ['Khanya', 'Sithole',  'c2', 1.7, 3.0, true,  true],
  ['Lwazi',  'Adams',    'c2', 2.1, 3.2, true,  true],
  ['Zinhle', 'Mahlangu', 'c2', 1.3, 2.9, true,  true],
  ['Thando', 'Ndlovu',   'c2', 1.9, 2.2, true,  true],   // slow mover
  ['Naledi', 'Booysen',  'c2', 1.6, 3.5, true,  true],
  ['Sive',   'Maart',    'c3', 1.8, 2.7, false, true],   // not in sample
  ['Yamkela','Cele',     'c3', 1.5, 3.0, true,  true],
  ['Kabelo', 'Du Toit',  'c3', 2.0, 3.3, true,  true],
  ['Imka',   'Olivier',  'c3', 1.4, 2.6, true,  true],
];

// deterministic pseudo-random so layout is stable
function seeded(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
const clamp = (n) => Math.max(1, Math.min(4, Math.round(n)));

const CHILDREN = RAW_CHILDREN.map((r, idx) => {
  const [firstName, surname, classId, baseAvg, latestAvg, sample, assessed] = r;
  const rnd = seeded(idx * 97 + 7);
  const cls = CLASSES.find(c => c.id === classId);
  const inds = ALL_INDICATORS.filter(i => i.areaId !== 'gar' || cls.garden);
  let baseline = null, latest = null;
  if (assessed && baseAvg != null) {
    baseline = {}; latest = {};
    for (const i of inds) {
      const b = clamp(baseAvg + (rnd() - 0.5) * 1.5);
      baseline[i.id] = b;
      // most indicators rise, but with real variation — some hold steady, a few dip
      let l = clamp(latestAvg + (rnd() - 0.5) * 2.0);
      if (l < b - 1) l = clamp(b - (rnd() < 0.5 ? 0 : 1)); // limit large drops
      latest[i.id] = l;
    }
  } else if (assessed && baseAvg == null) {
    baseline = {};
    for (const i of inds) baseline[i.id] = clamp(1.6 + (rnd() - 0.5) * 1.2);
  }
  return {
    id: 'k' + idx, firstName, surname, classId, sample,
    garden: cls.garden, started: '2025-02-10',
    hasLatest: !!latest, baseline, latest,
    observations: assessed && latestAvg != null && idx % 3 === 0 ? [
      { date: '2025-05-14', note: 'Much more settled this term — now helps younger children pack away tools without being asked.' },
    ] : [],
  };
});

const AMAVA = {
  orgName: 'Amava Oluntu',
  programmeName: 'After-school Garden',
  regLine: 'Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213',
  scaleMax: 4,
  improvedThreshold: 1,
  descriptors: SCALE,
  areas: AREAS,
  classes: CLASSES,
  children: CHILDREN,
  allIndicators: ALL_INDICATORS,
  user: { name: 'Nomsa Dlamini', role: 'coordinator', firstName: 'Nomsa' },
};

/* ---------- metrics ---------- */
function classify(change) {
  if (change == null) return null;
  if (change >= AMAVA.improvedThreshold) return 'improved';
  if (change <= -1) return 'declined';
  return 'stable';
}

function buildAggregate(children) {
  const assessed = children.filter(c => c.baseline);
  const withFollowUp = children.filter(c => c.latest);
  const usesGarden = children.some(c => c.garden);
  const areas = AMAVA.areas.filter(a => !a.gardenOnly || usesGarden).map(area => {
    const indicators = area.indicators.map(ind => {
      let nMeasured = 0, nImproved = 0, nStable = 0, nDeclined = 0, sumB = 0, sumL = 0, nB = 0, nL = 0;
      for (const c of withFollowUp) {
        const b = c.baseline?.[ind.id], l = c.latest?.[ind.id];
        if (b != null) { sumB += b; nB++; }
        if (l != null) { sumL += l; nL++; }
        if (b != null && l != null) {
          nMeasured++;
          const cl = classify(l - b);
          if (cl === 'improved') nImproved++; else if (cl === 'declined') nDeclined++; else nStable++;
        }
      }
      return {
        id: ind.id, text: ind.text, short: ind.short,
        nMeasured, nImproved, nStable, nDeclined,
        percentImproved: nMeasured ? Math.round((nImproved / nMeasured) * 100) : 0,
        avgBaseline: nB ? +(sumB / nB).toFixed(1) : null,
        avgLatest: nL ? +(sumL / nL).toFixed(1) : null,
      };
    });
    const avgB = avg(indicators.map(i => i.avgBaseline));
    const avgL = avg(indicators.map(i => i.avgLatest));
    return { id: area.id, name: area.name, short: area.short, icon: area.icon, indicators, avgBaseline: avgB, avgLatest: avgL };
  });
  const headlines = areas.flatMap(a => a.indicators)
    .filter(i => i.nMeasured >= 3)
    .sort((a, b) => b.percentImproved - a.percentImproved);
  return {
    childrenInScope: assessed.length,
    total: children.length,
    withFollowUp: withFollowUp.length,
    areas, headlines,
  };
}

function buildChild(child) {
  const usesGarden = child.garden;
  const areas = AMAVA.areas.filter(a => !a.gardenOnly || usesGarden);
  const trends = areas.map(area => {
    const b = avg(area.indicators.map(i => child.baseline?.[i.id]));
    const l = child.latest ? avg(area.indicators.map(i => child.latest?.[i.id])) : null;
    return { id: area.id, name: area.name, short: area.short, icon: area.icon, baseline: b, latest: l };
  });
  const rows = areas.flatMap(area => area.indicators.map(ind => {
    const b = child.baseline?.[ind.id] ?? null;
    const l = child.latest?.[ind.id] ?? null;
    const change = (b != null && l != null) ? l - b : null;
    return { areaId: area.id, areaName: area.name, text: ind.text, short: ind.short, baseline: b, latest: l, change, classification: classify(change) };
  }));
  const improved = rows.filter(r => r.classification === 'improved').length;
  const measured = rows.filter(r => r.change != null).length;
  return {
    name: child.firstName + ' ' + child.surname, firstName: child.firstName,
    trends, rows, observations: child.observations || [],
    improved, measured, hasLatest: !!child.latest,
  };
}

function avg(arr) {
  const xs = arr.filter(x => x != null);
  if (!xs.length) return null;
  return +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);
}

// child summary status for list rows
function childStatus(child) {
  if (!child.baseline) return { key: 'new', label: 'Not started' };
  if (!child.latest) return { key: 'base', label: 'Baseline done' };
  const r = buildChild(child);
  const net = (avg(r.trends.map(t => t.latest)) ?? 0) - (avg(r.trends.map(t => t.baseline)) ?? 0);
  if (net >= 0.6) return { key: 'up', label: 'Improving', net: +net.toFixed(1) };
  if (net <= -0.2) return { key: 'down', label: 'Needs attention', net: +net.toFixed(1) };
  return { key: 'flat', label: 'Steady', net: +net.toFixed(1) };
}

Object.assign(window, { AMAVA, buildAggregate, buildChild, childStatus, classify });
