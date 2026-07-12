# Organisation Feedback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** Implement the NGO's feedback on the Amava M&E app. Six requests, split into two phases.

**Decisions (from the user):** file uploads are **online-only** (core assessing stays offline-first); child photos + indemnity forms live in **private** storage buckets served via short-lived signed URLs; "Our Projects" reuses the existing **programme→class** structure (reworded), no new data level; logo lockup images are supplied by the user (dropped in verbatim).

**Working dir:** `amava-me/`. Branch `org-feedback`. Live DB writes via the Supabase MCP tools or Management API (project ref `aihjgjvappnwablhkrpn`).

---

## Requests → phases

**Phase 1 — no storage (ship first)**
1. Rename the app name **"Amava" → "Amava Oluntu"** (titles/manifest/plain-name text; the brand wordmark lockup is handled by the supplied logo files).
2. Home **"My classes" → "Our Projects"**, grouped by **programme** (programme = sub-heading; its classes listed under it). Coordinators see all active programmes+classes; facilitators see only programmes containing their assigned classes, and only those classes.
5. **View child details** — a read-only child profile (guardian, contact, grade, gender, DOB+age, home language, address, sample, start date, class) reachable from the child row and the assessment screen.
6. **Printable class list** — a print-friendly table of all children in a class (name, grade, gender, guardian, contact, sample, start date), reusing the print pattern.
+ Logos: swap the login + header lockups to the supplied files; wordmark reads "Amava Oluntu".

**Phase 2 — storage (photos + attachments)**
3. **Child profile photo** (private bucket `child-photos`).
4. **Assessment attachments** (attendance/incident, private bucket `assessment-files`) + **indemnity form per child** (private bucket `child-docs`).

---

# PHASE 1

## TASK 1 — Rename to "Amava Oluntu"

**Files:** `index.html`, `amava-me/vite.config.ts` (manifest), any plain-name UI text.

- [ ] **Step 1:** `index.html` `<title>` → `Amava Oluntu — M&E`. `<meta name="description">` keep.
- [ ] **Step 2:** `vite.config.ts` manifest `name: 'Amava Oluntu M&E'`, `short_name: 'Amava Oluntu'`.
- [ ] **Step 3:** Grep the app for user-facing plain `"Amava M&E"` / standalone `Amava` titles and change to `Amava Oluntu` where it reads as the org/app name (NOT the `Logo` wordmark component, which the supplied lockup replaces). Reg line already says "Amava Oluntu NPC…" — leave.
- [ ] **Step 4:** `npm run build` clean. Commit `feat: rename app to Amava Oluntu`.

## TASK 2 — Home "Our Projects" grouped by programme

**File:** `src/screens/HomeScreen.tsx`.

- [ ] **Step 1:** Keep all hooks. Replace the flat class list with programme-grouped sections. Derivation:
  ```tsx
  const isCoordinator = me?.role === 'coordinator'
  const myClasses = ref.classes.filter(c => c.active && (isCoordinator || me?.classIds.includes(c.id)))
  const myProgrammes = ref.programmes
    .filter(p => p.active && myClasses.some(c => c.programmeId === p.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  ```
  Change the section label "My classes" → title **"Our Projects"** (eyebrow or `am-h2`). For each programme in `myProgrammes`, render a `.am-sectionlab` with the **programme name** as the sub-heading, then its classes (`myClasses.filter(c => c.programmeId === p.id)`) as the existing `.am-row` cards (child count sub, chevron → `/class/:id`). Keep the term-snapshot donut card and "View reports" button. If a user has no projects, keep the empty-state message.
- [ ] **Step 2:** `npm run build` clean. Commit `feat: Home 'Our Projects' grouped by programme`.

## TASK 3 — Child profile (view details) route

**Files:** Create `src/screens/ChildProfileScreen.tsx`; modify `src/App.tsx`, `src/screens/ChildListScreen.tsx`, `src/screens/AssessmentFlow.tsx` (or AssessChildRoute) for entry points.

- [ ] **Step 1:** Create `ChildProfileScreen` at route `/child/:childId`. Read `useConfigData()` (ref) + `useReportAssessments()` for history. Guard: not found → back to home; access — facilitators only their classes (mirror ChildListScreen `canManage`/visibility; at minimum coordinators + the child's class facilitators). Layout (`am-root am-screen` + AppBar back + BottomNav):
  - Header: `Avatar` (or photo in Phase 2) + full name + class name + `StatusPill` (from report-metrics/childStatus) + sample chip.
  - **Details card** (read-only): render each `CHILD_FIELDS` value present in `child.fields` as a labelled row (Guardian name, Contact number, Grade, Gender, Date of birth + `ageFromDob`, Home language, Address), plus Start date. Missing fields show "—".
  - **Assessment history** list: date + type (Baseline/Quarterly) + avg score; tap could deep-link later (optional).
  - Buttons: **Edit** (→ opens the ChildListScreen editor / navigates to the class with an edit intent — simplest: an "Edit" button that navigates back to the class list; full inline edit optional) and **Assess** (→ `/assess/:childId`).
- [ ] **Step 2:** Add the route in `App.tsx` (RequireAuth + AppServicesProvider).
- [ ] **Step 3:** In `ChildListScreen`, add a **"Details"** affordance to each child row action group (`View`), navigating to `/child/:id`. Keep Edit/Retire.
- [ ] **Step 4:** `npm run build` clean; `npm run test` green. Commit `feat: child profile / view-details screen`.

## TASK 4 — Printable class list

**Files:** Create `src/screens/ClassListPrintScreen.tsx`; modify `src/App.tsx`, `src/screens/ChildListScreen.tsx`.

- [ ] **Step 1:** Create `ClassListPrintScreen` at `/class/:classId/print`. Uses the `.paper` print pattern (like `PaperReportScreen`): a `.paper-stage` with a top bar (Back + "Save PDF"→`window.print()`), and a `.paper` A4 sheet: slate band header (supplied logo + "CLASS LIST" kicker + class/programme name + generated date), then a table of the class's active children — columns: #, Name, Grade, Gender, Guardian, Contact, Sample (Y/N), Start date. Footer = reg line. Reuse `.paper-tbl` styles.
- [ ] **Step 2:** Route in `App.tsx`. In `ChildListScreen`, add a **"Print class list"** button (`am-btn--ghost`, `print` icon) near the top → `navigate('/class/'+classId+'/print')`.
- [ ] **Step 3:** `npm run build` clean. Commit `feat: printable class list`.

## TASK 5 — Logos (when files supplied)

**Files:** add the supplied logo assets under `src/assets/`; modify `LoginScreen.tsx` (vertical lockup), the app-bar `Logo` usage (horizontal lockup), and regenerate app icons if a new emblem is supplied.

- [ ] Drop the supplied `logo-horizontal.*` and `logo-vertical.*` into `src/assets/`. Login hero → vertical lockup `<img>`. Home/app-bar → horizontal lockup (replace or restyle the `Logo` component to render the supplied image, or set the wordmark colour to terracotta to match). Keep alt text "Amava Oluntu". Commit `feat: official Amava Oluntu logo lockups`.

---

# PHASE 2 — Storage (photos + attachments)

> All uploads are **online-only**. Show a clear "needs internet to upload" message when offline. Files are private; display via signed URLs (short TTL), cached in-memory for the session.

## TASK 6 — Storage buckets + schema (migration, live DB)

- [ ] **Step 1:** Create a migration `0005_storage.sql` (and apply live). Create private buckets `child-photos`, `child-docs`, `assessment-files` (via storage API/SQL `insert into storage.buckets`). Storage RLS: authenticated users may read/write objects (mirror the app's staff-only model; tighten to coordinator/own-class if feasible). Add columns: `alter table child add column photo_path text, add column indemnity_path text;` and `alter table assessment add column attachments jsonb not null default '[]';` (each attachment `{path, name, type}`).
- [ ] **Step 2:** Update `src/domain/types.ts` (Child gets `photoPath?: string | null`, `indemnityPath?: string | null`; Assessment gets `attachments: {path,name,type}[]`), and the local-store/sync mappers + supabase-sync-client select/insert to include the new columns. Keep existing behaviour when null/empty.
- [ ] **Step 3:** A `src/lib/storage.ts` helper: `uploadFile(bucket, file) → path` and `signedUrl(bucket, path) → url` using the supabase client; online-only (throws a friendly error offline).
- [ ] Tests for pure mappers; build; commit per sub-step.

## TASK 7 — Child photo + indemnity UI

- [ ] Child editor (sheet): a **photo** picker (`<input type="file" accept="image/*" capture>`), uploads on save when online, stores `photoPath`; show current photo thumbnail. An **indemnity form** upload (`accept="image/*,application/pdf"`) → `indemnityPath`. Both optional; offline → disabled with a note.
- [ ] Child profile screen: show the photo (signed URL) in the header; a "Indemnity form" row that opens/downloads the signed URL. Class list + rows show the photo thumbnail when available (fallback to initials avatar).
- [ ] Build/test; commit.

## TASK 8 — Assessment attachments

- [ ] In the assessment **Review step**, an "Attachments" section: add photos/PDFs (attendance register, incident report). Upload online on save; store in `assessment.attachments`. Offline: allow saving the assessment without attachments (note that files can be added when online) — do NOT block the offline assessment.
- [ ] Child profile / reports: list an assessment's attachments (open via signed URL). Coordinator-only for sensitive docs as appropriate.
- [ ] Build/test; commit.

---

## Self-review / risks
- **Offline integrity:** never block offline assessment saving on a file upload; uploads are a separate online action.
- **Privacy:** private buckets + signed URLs; indemnity forms & photos are personal data — do not expose public URLs; child-level exports remain coordinator-only.
- **Sync mappers:** adding columns must not break existing rows (defaults/nullable).
- **Facilitator access:** the new profile/print/photo routes must respect the same class-visibility rules as ChildListScreen.
- **Logos:** blocked on the user's files; Task 5 runs when supplied; the "Amava Oluntu" text rename (Task 1) is independent.
