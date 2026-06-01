# Amava Oluntu — Monitoring & Evaluation Tool

**Design specification**
Date: 2026-06-01
Organisation: Amava Oluntu NPC (NPC 2011/108066/08 · PBO 930 043 213)

---

## 1. Purpose & background

Amava Oluntu runs an after-school programme that uses a community garden. Lead
facilitators currently track child development on a manual spreadsheet (the
"Child Stability and Impact Tracker") across five development areas on a 1–6
scale, anchored to school terms.

This project digitises that tool into a **branded, offline-capable web app** so
that:

- Lead facilitators can assess sample children **on their phones, in the garden,
  with no internet**, syncing automatically later.
- A coordinator can produce **confirmed quantitative impact data** for the board,
  internal team, and two reporting funders — replacing today's reliance on
  qualitative stories alone.
- The whole system is **self-service configurable** so the team can evolve it
  (indicators, scale, areas, programmes, fields, thresholds) without a developer.

### Scope now vs later

**In scope (build now):** the after-school garden programme M&E, with the five
existing development areas adapted to a 1–4 scale.

**Built to support, populate later:** additional programmes (e.g. the expanding
ECD programme for ages 4–7) each with their *own* indicator sets and rubrics.
The data model supports multiple programmes from day one; only the after-school
programme is populated initially.

**Out of scope:** adult-learning and workshop M&E tools (separate future
projects); parallel/divergent multi-facilitator scoring (the org uses a single
*agreed* score); migrating historical 1–6 paper data (we start fresh baselines —
revisit only if requested).

---

## 2. Key decisions (confirmed with stakeholder)

| Decision | Choice |
|---|---|
| Data entry context | Facilitator phones, in the garden, **offline-first** |
| Hosting / cost | **Free / near-zero** tiers only |
| Rating scale | **1–4** with a written descriptor per point (was 1–6) |
| Re-assessment cadence | **Baseline** after 8–12 sessions, then **quarterly** |
| Authentication | **One login per facilitator** |
| Deliverable | **Working, deployable app** |
| Build approach | **Option A** — custom installable PWA + free-tier backend |
| Grouping for reports | **Programme** (Organisation → Programme → Class → Child) |
| Configurability | **Everything** coordinator-editable (areas, indicators, scale, fields, programmes, thresholds) |

---

## 3. Roles & permissions

- **Facilitator (lead):** signs in with own account; assesses children in their
  assigned class(es); views history for their own classes only. The score
  recorded is the *agreed* score reached with co-facilitators — the app stores
  the lead as assessor plus a field naming the co-facilitators who agreed.
- **Coordinator / Admin:** manages programmes, classes, children, and facilitator
  accounts; edits all configuration (areas, indicators, scale, fields,
  thresholds); views all dashboards; exports reports at every level.

Access rule: facilitators see only their assigned classes; coordinators see
everything. Child personally-identifying information never appears in funder
outputs (aggregates only); individual child files are coordinator-only exports.

---

## 4. Configurability (self-service)

A coordinator-facing **Settings** area makes the following editable with no
developer, all soft-deleting (retire, don't destroy) to preserve history:

- **Programmes** — create/rename; each programme owns its own areas, indicators,
  and scale.
- **Development areas** — add/reorder/rename/retire per programme.
- **Indicators** — add/reword/reorder/retire per area; optional one-line hint per
  indicator; a per-class flag controls whether an area applies (e.g. *Garden &
  Nature* only shows for classes flagged as having a garden component).
- **Rating scale** — number of points and the descriptor wording per point, per
  programme.
- **Demographic fields** — which child fields are collected and whether each is
  required.
- **Report thresholds** — e.g. how much improvement counts as "improved"
  (default: +1 or more vs baseline).

**Integrity rule (critical):** editing configuration must never silently corrupt
past data. Therefore:

- Indicators/areas are *retired* (hidden going forward), never hard-deleted;
  existing scores keep referencing them and continue to appear in history.
- Each saved assessment **stores a snapshot of the scale it was taken under**
  (e.g. `scale_max = 4`) and the indicator text at time of scoring, so changing
  the scale or rewording an indicator later never breaks historical trends or
  comparisons.

---

## 5. Assessment model & change logic

- **Baseline:** the first assessment for a child, taken after 8–12 sessions.
  Everything is anchored to *when the child started* — no "term" language.
- **Quarterly:** subsequent assessments, ~4 per year.
- For each assessment the facilitator records a 1–4 score per active indicator,
  optional per-area / general observation notes, and the co-facilitators who
  agreed.
- **Change per child per indicator = latest score − baseline score.**
- **"Improved"** = change ≥ +1 (threshold configurable). Children are also
  classed as *stable* (no change) or *declined* (negative change) for reporting.

### The 1–4 scale (default descriptors — editable)

- **1 – Emerging:** rarely or not yet observed
- **2 – Developing:** beginning to show, inconsistent
- **3 – Consistent:** reliably shows this most of the time
- **4 – Strong:** consistently and independently demonstrates this

### Development areas & indicators (carried from current tool)

1. **General** — good general appearance; willingness to clean up after class;
   willingness to listen and ask questions; willingness to co-operate; effort and
   engagement in activities.
2. **Emotional Development** — willingness to communicate with the facilitator;
   strong sense of self; shows empathy when appropriate; expresses feelings and
   emotions verbally.
3. **Artistic / Creative Development** — identify materials/tools; hold and use
   materials/tools; show and share work with others; experiment with materials;
   complete projects as instructed.
4. **Social & Interaction Skills** — concentrate/listen/follow instructions;
   appreciation for other children; respect for the facilitator; problem-solving
   in class; freely shares tools/materials.
5. **Garden & Connection to Nature** *(garden-classes only)* — self-regulates when
   required; interacts with the garden outside facilitated sessions; cares for the
   environment/animals/insects; shows interest/fascination with the outdoors; uses
   the space independently during breakaways.

---

## 6. Reporting (four levels)

All reports are filterable by date range, area, and assessment type, and exportable
to **CSV** and a **branded PDF**.

- **Individual child:** demographics, full assessment history, per-area trend over
  time, change-since-baseline per indicator, observation notes. Coordinator-only
  for export (the rare principal/intervention request).
- **Class:** average change per area; counts improved/stable/declined; per-indicator
  movement across the class's sample children.
- **Programme (group):** the same rolled up across all classes in a programme.
- **Organisation:** headline impact stats across everything, e.g.
  *"X% of children increased in seeing the garden as a safe space since baseline"*,
  *"X children increased in confidence"* (maps to the *strong sense of self*
  indicator). Anonymised aggregates only — suitable for board, funders, annual
  reports, and public stats.

---

## 7. Screens

1. **Login** — per-facilitator sign-in.
2. **Home** — facilitator's classes; children with a baseline due or a quarterly
   assessment due; a visible **sync status** ("N items waiting to sync").
3. **Class view** — sample children and each child's assessment status.
4. **Child profile** — demographics + assessment history + per-area trend charts.
5. **Assessment flow** — pick child → Baseline/Quarterly → step through areas one
   screen at a time → tap 1–4 per indicator (descriptor always visible) → notes →
   confirm co-facilitators → **Save** (queues offline, syncs when online). Large
   tap targets, minimal typing, designed for one-handed phone use outdoors.
6. **Settings / Admin** — manage programmes, classes (incl. garden-component flag),
   children, facilitators, and all configuration from §4.
7. **Reports** — the four-level dashboards and exports from §6.

---

## 8. Architecture & technology (all free-tier)

- **Front end:** React (Vite) **Progressive Web App** — installs to a phone home
  screen, no app store. Offline via a service worker (cached app shell) plus an
  on-device queue (IndexedDB) for assessments and cached reference data
  (classes, children, current config) so a facilitator can assess fully offline.
- **Sync:** queued assessments push to the backend when connectivity returns;
  reference/config data pulls on sign-in and refresh. Each queued item shows a
  pending/synced state.
- **Backend / database / auth:** **Supabase free tier** (Postgres + Auth +
  row-level security). Comfortably within free limits at ~35 children / 5 classes,
  with headroom to grow.
- **Hosting:** Cloudflare Pages or Netlify free tier (static PWA hosting).
- **Branding:** palette `#687F8B` (slate), `#97D7D9` (teal), `#E5BF7A` (sand),
  `#C4E2B7` (soft green), `#9CA297` (sage), `#DD866C` (terracotta); **Cavorting**
  (display) and **Minion Pro** (body) fonts as supplied; Avenir substituted with a
  close free font where needed.

### Data model (entities)

- `programme` (name, scale_max, scale_descriptors, active)
- `development_area` (programme_id, name, sort_order, active)
- `indicator` (area_id, text, hint, sort_order, active)
- `class` (programme_id, name, has_garden_component, active)
- `child` (class_id, configurable demographic fields, date_started, is_sample, active)
- `facilitator` (auth user; profile name, role, assigned classes)
- `assessment` (child_id, type [baseline|quarterly], date, assessed_by,
  co_assessors, **scale_max snapshot**, sync state)
- `assessment_score` (assessment_id, indicator_id, **indicator_text snapshot**,
  score)
- `observation` (assessment_id, area_id nullable, note)
- `config` (report thresholds, demographic-field definitions)

Row-level security enforces the role rules in §3.

---

## 9. Success criteria

- A lead facilitator can complete a child's assessment on a phone **with no
  internet** in a few minutes, and it reliably syncs later.
- A coordinator can **add or reword an indicator, or change the scale,** without
  help, and historical reports stay correct.
- A coordinator can export, for a chosen period, a **branded funder report**
  stating things like *"X% of children improved in [indicator] since baseline"* at
  child, class, programme, and organisation level.
- Runs within free-tier limits at current scale with room to add programmes
  (e.g. ECD) later.

---

## 10. Open questions / assumptions

- Avenir is not a free font; a close free substitute will be used for body text
  unless the org licenses Avenir.
- Historical 1–6 paper data is **not** migrated; the app starts fresh baselines.
  (Revisit if the org wants history imported.)
- ECD (ages 4–7) indicators are **not** defined yet; the structure supports a
  second programme/indicator set when the team is ready to author it.
