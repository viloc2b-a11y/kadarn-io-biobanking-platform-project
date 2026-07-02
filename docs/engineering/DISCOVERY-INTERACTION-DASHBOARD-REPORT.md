# Discovery Interaction Dashboard — Implementation Report

**Date:** 2026-06-28  
**Platform:** Kadarn v1.0.0-hardening.11  
**Scope:** First Discovery Interaction Dashboard for Site Directors and Kadarn reviewers

---

## Executive Summary

The Discovery Workbench is the first end-to-end UI for reviewing institutional evidence produced by the Evidence Discovery pipeline (`@kadarn/evidence-discovery`). It lets users open discovery sessions, inspect pipeline outputs across 14 review surfaces (including Provenance), perform curation through the existing Curation API, and record validation notes — without writing to Evidence Core, implementing promotion, or calculating claim confidence.

---

## Architecture Alignment

| Boundary | Respected |
|----------|-----------|
| Evidence Core | Read-only from dashboard perspective; no writes |
| Curation API | All curation via `POST /api/v1/discovery/curation` |
| Validation Notes API | All notes via `POST /api/v1/discovery/validation-notes` |
| Promotion | Not implemented |
| Claim confidence calculation | Not implemented |
| New invented APIs | Minimal read-only provenance endpoint only where aggregate dashboard data is insufficient |

The dashboard consumes aggregate data from `GET /api/v1/discovery/dashboard?sessionId=…`, which joins session metadata, latest run, artifacts, candidates, agent outputs, curation events, and validation notes scoped to the authenticated user's active organization.

---

## User Experiences

### Site Director — `/workspace/discovery`

- Rendered inside the workspace shell
- Mode: `site_director`
- Navigation: **Organization → Institutional Discovery** (workspace navigation API)
- Requires authenticated user with validated `active_org_id`

### Kadarn Reviewer — `/koc/discovery`

- Rendered inside the KOC shell (requires `kadarn_internal` role)
- Mode: `kadarn_reviewer`
- Navigation: **Evidence → Institutional Discovery**
- Uses the same dashboard component and APIs, scoped to the reviewer's active org context

---

## Feature Coverage

| Requirement | Implementation |
|-------------|----------------|
| Open Discovery Session | Sidebar **Open Session** → `POST /api/v1/discovery/session` |
| View Institutional Evidence Snapshot | **Evidence Snapshot** tab → `evidence_snapshot` / `snapshot_builder` agent output |
| View Institutional Profile | **Institutional Profile** tab → `profile_builder` / `institutional_profile` output |
| Review documents | **Documents** tab → run artifacts + classifier output |
| Review entities | **Entities** tab → `entity-extractor` output |
| Review relationships | **Relationships** tab → `relationship-extractor` output |
| Review timeline | **Timeline** tab → `institutional_timeline_engine` output |
| Review capabilities | **Capabilities** tab → `capability_detector` output |
| Review Claim Candidates | **Claim Candidates** tab → `claim_candidate_detector` output |
| Review Evidence Gaps | **Evidence Gaps** tab → `evidence_gap_detector` output |
| Review Narrative | **Narrative** tab → `narrative_engine` output |
| Perform Curation | **Curation** tab → form posts to Curation API; lists recent events |
| Record Validation Notes | **Validation Notes** tab → form posts to Validation Notes API |
| Trace item provenance | **Provenance** tab + **View provenance** on entities, relationships, capabilities, claims |

---

## File Inventory

### Web components (`apps/web/src/components/discovery/`)

| File | Role |
|------|------|
| `dashboard.tsx` | Main shell: sessions, stats, 14-tab navigation, loading/error/empty |
| `discovery-tab-bar.tsx` | Accessible tab list with keyboard navigation |
| `discovery-dashboard.css` | Responsive shell + scrollable tab bar |
| `discovery-api.ts` | API client helpers + curation display labels |
| `panel-primitives.tsx` | Shared Empty, Error, Skeleton, Badge, FormMessage, HelpTooltip |
| `types.ts` | Shared TypeScript types and tab definitions |
| `snapshot-panel.tsx` | Institutional Evidence Snapshot |
| `profile-panel.tsx` | Institutional Profile |
| `documents-panel.tsx` | Document artifacts |
| `entities-panel.tsx` | Extracted entities |
| `relationships-panel.tsx` | Extracted relationships |
| `timeline-panel.tsx` | Institutional timeline |
| `capabilities-panel.tsx` | Detected capabilities |
| `claims-panel.tsx` | Claim candidates |
| `gaps-panel.tsx` | Evidence gaps |
| `narrative-panel.tsx` | Institutional narrative |
| `curation-panel.tsx` | Curation form + event history |
| `notes-panel.tsx` | Validation notes form + history |
| `provenance-panel.tsx` | Provenance Explorer with breadcrumb chain |
| `view-provenance-link.tsx` | Shared “View provenance” action on reviewable items |
| `discovery-metrics-strip.tsx` | Discovery Metrics summary strip |
| `pipeline-panel.tsx` | Pipeline Status stage view |

### Routes

| Path | File |
|------|------|
| `/workspace/discovery` | `apps/web/src/app/(workspace)/workspace/discovery/page.tsx` |
| `/koc/discovery` | `apps/web/src/app/(koc)/koc/discovery/page.tsx` |

### API (existing, one route fix)

| Endpoint | Purpose |
|----------|---------|
| `GET/POST /api/v1/discovery/session` | List / open sessions |
| `GET /api/v1/discovery/dashboard` | Aggregate dashboard payload |
| `GET/POST /api/v1/discovery/curation` | List / record curation events |
| `GET/POST /api/v1/discovery/validation-notes` | List / record validation notes |
| `GET /api/v1/discovery/pipeline-status` | Read-only pipeline stage status |
| `GET /api/v1/discovery/provenance` | Read-only provenance chain for a review item |

**Dashboard payload** now includes a `metrics` object computed server-side by `buildDiscoveryMetrics()` — single source of truth, not duplicated in UI components.

**Fix applied:** Dashboard route moved from erroneous `/discovery/discovery/dashboard` to `/discovery/dashboard`.

---

## Discovery Metrics

A compact metrics strip appears below the session header, summarizing discovery quality and readiness for the active session.

### Required metrics

| Metric | Source |
|--------|--------|
| Artifacts processed | Run artifact count |
| Documents classified | Snapshot summary or inventory |
| Entities detected | Aggregated entity count |
| Relationships detected | Aggregated relationship count |
| Capabilities detected | `capability_detector` output |
| Claim candidates detected | `claim_candidate_detector` output |
| Evidence gaps detected | `evidence_gap_detector` reports |
| Unknown documents | Snapshot summary / inventory / uncertainty |
| Low-confidence items | Entities, relationships, docs below threshold |
| Curation events | `discovery_curation_events` count |
| Validation notes | `discovery_validation_notes` count |
| Next best action | Snapshot `nextBestAction` present/absent |

### Optional metrics (when data exists)

| Metric | Source |
|--------|--------|
| TTFV | Minutes from session open to run completion |
| Institution Reconstruction Coverage | Snapshot `coverageIndicator` or profile readiness |
| Evidence Leverage Score | High-priority gap recommendations or next-action priority |

### UI behavior

- Compact responsive grid with amber warnings for unknown docs and low-confidence items
- Help text and `?` tooltip: metrics are discovery pipeline indicators, **not** Claim Confidence, Trust Score, or certification
- Empty state: all metrics show `0` / `No` via `EMPTY_DISCOVERY_METRICS` when no session is loaded
- Loading state: cells show `—` while dashboard fetch is in progress

### Boundaries

| Rule | Status |
|------|--------|
| Discovery metrics only | Enforced |
| No Claim Confidence | Not displayed or calculated |
| No Trust Score | Not displayed |
| No certification language | Enforced in UI copy |
| No sponsor-facing scores | Leverage/reconstruction are internal discovery indicators |
| No Evidence Core writes | Metrics are read-only aggregation |

### Files

| File | Role |
|------|------|
| `apps/api/src/lib/discovery-metrics.ts` | `buildDiscoveryMetrics()` — single calculator |
| `apps/web/src/components/discovery/discovery-metrics-strip.tsx` | Metrics UI strip |
| `tests/web/discovery-metrics.test.ts` | Unit tests for metric computation |

---

## Pipeline Status View

The **Pipeline** tab shows read-only processing stages for the active discovery session, helping reviewers debug and validate pipeline progress.

### Stages (in order)

Layer 0 Artifact → Layer 1 Extraction → Semantic Requests → Document Classification → Entity Extraction → Relationship Extraction → Timeline Engine → Capability Detector → Claim Candidate Detector → Gap Detector → Narrative Engine → Institutional Profile → Snapshot → Curation

### Stage display

Each stage shows:
- Status: `pending`, `running`, `completed`, `failed`, `skipped`, or `not_available`
- Count (when available)
- Latest timestamp (when available)
- Errors and warnings from failed requests or agent outputs

Clicking a stage with a linked dashboard tab navigates to the relevant review surface (e.g. Entities, Claims, Curation).

### API

`GET /api/v1/discovery/pipeline-status?sessionId=`

Aggregates data from:
- `discovery_artifacts` (Layer 0)
- `discovery_layer1` (Layer 1)
- `discovery_preparation_requests` (semantic requests + 20A agents)
- `discovery_agent_outputs` (agent completion status)
- `discovery_curation_events` (curation stage)

Computed by `buildDiscoveryPipelineStatus()` in `apps/api/src/lib/discovery-pipeline-status.ts`.

### Boundaries

| Rule | Status |
|------|--------|
| Read-only | No POST, no mutations |
| No rerun button | Not implemented — no safe rerun API exposed |
| No Evidence Core writes | SELECT-only queries |
| No promotion | Not implemented |
| Partial data safe | All stages render with `not_available` / `pending` as appropriate |

### Files

| File | Role |
|------|------|
| `apps/api/src/lib/discovery-pipeline-status.ts` | Stage aggregation |
| `apps/api/.../pipeline-status/route.ts` | Read-only API |
| `apps/web/.../pipeline-panel.tsx` | Pipeline Status UI |
| `tests/web/discovery-pipeline-status.test.ts` | Unit tests |

The Provenance Explorer lets reviewers trace any reviewable item back through the discovery pipeline chain:

**Item → Agent Output → Layer 1 → Layer 0**

### Entry points

- **Provenance tab** — shows empty state until an item is selected; displays full chain when loaded
- **View provenance** link on:
  - Entities (`ENTITY`)
  - Relationships (`RELATIONSHIP`)
  - Capabilities (`CAPABILITY`)
  - Claim candidates (`CLAIM_CANDIDATE`)

Clicking **View provenance** switches to the Provenance tab and loads the chain for that item.

### Provenance panel displays

| Section | Content |
|---------|---------|
| Breadcrumb | Visual chain: Review Item → Agent Output → Layer 1 → Layer 0 |
| Selected item | Label, type, source span/snippet when available |
| Agent output | Agent name/version, pipeline version, status, timestamp |
| Layer 1 | Extractor name/version, original hash, markdown preview (read-only, truncated) |
| Layer 0 | File name, type, source, storage ref, SHA-256, size |
| Related items | Linked entities, relationships, capabilities, claim candidates |
| Curation history | Append-only curation events for the target ID |

### API

`GET /api/v1/discovery/provenance?sessionId=&targetType=&targetId=`

- Read-only GET — no POST, no mutations
- Org-scoped via session ownership
- Resolves items from `discovery_agent_outputs`, then joins `discovery_layer1` and `discovery_artifacts`
- Never writes to Evidence Core; never mutates Layer 0 or Layer 1
- Does not call agents; does not calculate claim confidence

### Boundaries respected

| Rule | Status |
|------|--------|
| No Evidence Core writes | Enforced — SELECT-only queries |
| No promotion | Not implemented |
| No claim confidence calculation | Not implemented |
| No Layer 0 / Layer 1 mutation | Enforced — read-only |
| No direct agent invocation from UI | Enforced |
| No certification language | UI uses “trace”, “inspect”, “review item” only |

### Navigation updates

- `apps/api/src/app/api/v1/workspace/navigation/route.ts` — Evidence Discovery in Organization section
- `apps/web/src/components/koc/koc-shell.tsx` — Discovery under Evidence section

### Tests

- `tests/web/discovery-dashboard.test.ts` — routes, navigation, API contracts, 13-tab/panel wiring, provenance explorer, UI state primitives, agent key resolution

---

## Design Language

The dashboard follows existing Kadarn web conventions:

- Inline styles with CSS variables from `globals.css` (`--navy2`, `--tx`, `--txdd`, `--border`, `--blue`, `--purple`, `--amber`, `--red`, `--green`)
- No Tailwind or shadcn — consistent with workspace and KOC pages
- Card-based panels with rounded borders and dark navy backgrounds
- Responsive grid: session sidebar stacks above main content below 768px; tab bar scrolls horizontally
- Sticky session sidebar on desktop only
- WAI-ARIA tab pattern with keyboard navigation (Arrow keys, Home/End)

---

## State Handling

| State | Behavior |
|-------|----------|
| Loading | Session list `PanelSkeleton`, dashboard skeleton, per-panel `PanelSkeleton` with `aria-busy` |
| Refreshing | “Updating” badge on session overview and metrics while refetching existing session |
| Empty | No sessions, no run, no agent output — contextual `EmptyPanel` with hints (`role="status"`) |
| Error | `ErrorPanel` with retry (`role="alert"`) for session load and dashboard fetch failures |
| Session switch | Clears stale dashboard + provenance selection before refetch |
| Form feedback | Curation and notes use `FormMessage` with `aria-live="polite"` |
| Success refresh | Curation and notes panels call `onSubmitted` → dashboard reload |

---

## Agent Output Key Strategy

The dashboard API and panels support both Sprint 20A and 20B agent naming:

| Surface | Primary keys | Fallback keys |
|---------|--------------|---------------|
| Snapshot | `evidence_snapshot` | `snapshot_builder`, `institutional_timeline_engine` |
| Profile | `profile_builder` | `institutional_profile` |
| Entities | `entity-extractor` | `entity_extractor` |
| Relationships | `relationship-extractor` | `relationship_extractor` |
| Timeline | `institutional_timeline_engine` | — |
| Capabilities | `capability_detector` | — |
| Claims | `claim_candidate_detector` | — |
| Gaps | `evidence_gap_detector` | — |
| Narrative | `narrative_engine` | — |

When structured arrays are absent, panels fall back to `JsonBlock` for raw agent output inspection.

---

## Known Limitations

1. **Pipeline persistence:** Sprint 20B engines may run in-memory during `ProfileBuilder` without persisting outputs to `discovery_agent_outputs`. Panels show empty states gracefully until pipeline runs persist data.

2. **Migrations:** Discovery tables (046–050) live in `database/migrations/` and may not be synced to `supabase/migrations/`. Local Supabase instances need those migrations applied for full functionality.

3. **Org context:** Kadarn reviewers operate within their `active_org_id` like Site Directors. Cross-org review is not implemented in this sprint.

4. **Marketplace naming collision:** Workspace navigation previously had a sponsor "Discovery" item pointing to `/marketplace` (supply search). Institutional Discovery is a separate nav item at `/workspace/discovery`.

---

## Language & UX Copy

Product language across the Discovery Workbench follows **Institutional Discovery / Institutional Intelligence** positioning — not generic admin-dashboard tone.

### Preferred user-facing names

| Term | Where used |
|------|------------|
| **Institutional Discovery** | Eyebrow, workspace nav, KOC nav, sign-in gate |
| **Discovery Workbench** | Page title (`dashboard.tsx`) |
| **Institutional Evidence Snapshot** | Snapshot tab and panel |
| **Institutional Profile** | Profile tab and panel |
| **Possible Capabilities** | Capabilities tab; metrics strip |
| **Claim Candidates** | Claims tab; session overview |
| **Validation Notes** | Notes tab; metrics strip |
| **Provenance** | Provenance tab (formerly "Provenance Explorer") |

### Uncertainty-aware phrasing

- Panel descriptions use **"Kadarn found evidence suggesting…"**, **"Reconstructed from available artifacts"**, and **"Requires review" / "Needs human review"**.
- Confidence labels in UI read **Discovery confidence** — never "Claim Confidence" or "Trust Score".
- Empty states explain *why* data may be missing (pipeline still running, stage not reached) rather than implying failure or certification.

### Forbidden language (user-facing)

The following must **not** appear in discovery UI components:

`verified`, `certified`, `trust score`, `site score`, `approved`, `this site has`, `guaranteed`, `capability exists`, `claim confidence`, legacy names `Evidence Discovery` / `Discovery Interaction Dashboard`.

Central definitions live in `apps/web/src/components/discovery/discovery-copy.ts`. Structural enforcement: `tests/web/discovery-copy.test.ts`.

### Copy module

`discovery-copy.ts` exports `DISCOVERY_COPY`, `FORBIDDEN_UI_PHRASES`, and `PREFERRED_UI_PHRASES`. Internal code names (`DashboardData`, `fetchDiscoveryDashboard`, API field names like `entitiesDetected`) remain unchanged to avoid architecture churn.

---

## QA & UX Polish (2026-06-28)

Full QA pass focused on visual hierarchy, state handling, responsive behavior, accessibility, and reviewer workflow consistency across Site Director and Kadarn Reviewer routes.

### UX improvements

| Area | Change |
|------|--------|
| **Tab navigation** | WAI-ARIA tabs (`role="tablist"`, `role="tab"`, `role="tabpanel"`) with Arrow/Home/End keyboard support |
| **Responsive layout** | Shell stacks to single column below 768px; tab bar horizontal scroll; provenance DL stacks on mobile |
| **Session switch hygiene** | Clears dashboard + provenance selection before refetch — no stale cross-session data |
| **Refresh feedback** | “Updating” badge on overview and metrics during background refetch |
| **Loading states** | Unified `PanelSkeleton` with `aria-busy`; workspace page uses skeleton instead of plain text |
| **Form UX** | `FormMessage` with live regions; human-readable curation action/target labels |
| **Metrics help** | Focusable `HelpTooltip` button replaces non-keyboard `?` span |
| **Pipeline stages** | Non-navigable stages removed from tab order (`tabIndex={-1}`) |
| **Provenance links** | `aria-label` on “View provenance” actions |
| **Persona parity** | Site Director and Kadarn Reviewer share identical dashboard; only header role label differs |

### Files changed (QA pass)

| File | Change |
|------|--------|
| `discovery-dashboard.css` | **New** — responsive shell, tab scroll, refresh badge, provenance DL |
| `discovery-tab-bar.tsx` | **New** — accessible tab bar with keyboard navigation |
| `dashboard.tsx` | ARIA landmarks, session switch clearing, refresh indicator, CSS classes |
| `panel-primitives.tsx` | `FormMessage`, `HelpTooltip`, `inputStyle`, a11y roles on states |
| `discovery-metrics-strip.tsx` | HelpTooltip, refresh indicator |
| `curation-panel.tsx` | FormMessage, readable labels, form aria |
| `notes-panel.tsx` | FormMessage, improved empty hint |
| `pipeline-panel.tsx` | Non-clickable stages skip tab order |
| `provenance-panel.tsx` | Responsive DL class |
| `view-provenance-link.tsx` | aria-label |
| `discovery-api.ts` | `CURATION_ACTION_LABELS`, `CURATION_TARGET_TYPE_LABELS` |
| `(workspace)/workspace/discovery/page.tsx` | DISCOVERY_COPY sign-in, PanelSkeleton loading |
| `tests/web/discovery-ux.test.ts` | **New** — routes, tabs, responsive, forms, a11y structure |
| `tests/web/discovery-dashboard.test.ts` | Tab bar wiring assertion |

### Tests added/updated

- `tests/web/discovery-ux.test.ts` — 16 structural tests for routes, ARIA tabs, responsive CSS, forms, metrics, primitives
- `tests/web/discovery-dashboard.test.ts` — tab bar component wiring
- Existing: `discovery-copy.test.ts`, `discovery-metrics.test.ts`, `discovery-pipeline-status.test.ts`

### Readiness for hot validation

**Ready** for manual hot validation with the following checklist:

1. Sign in as Site Director → `/workspace/discovery` — verify session open, all 14 tabs, curation + notes submit
2. Sign in as Kadarn reviewer → `/koc/discovery` — verify identical workflow
3. Resize viewport to mobile width — sidebar stacks, tabs scroll horizontally
4. Switch sessions — panels should skeleton then reload (no stale prior session data)
5. Keyboard: Tab to tab bar, use Arrow keys to change panels
6. Click “View provenance” from Entities — Provenance tab opens with selection

**Not validated in CI:** runtime React rendering, visual pixel QA, or Supabase-backed form submission (requires local Supabase + discovery migrations).

**Product validation:** follow [VALIDATION-001 — Hot Validation Protocol](../validation/VALIDATION-001-HOT-VALIDATION-PROTOCOL.md) for Site Director sessions with real documents. Architecture freeze applies during Cycle-01.

---

## Verification

Run structural tests:

```bash
cd tests && npm test -- web/discovery-dashboard web/discovery-copy web/discovery-ux
```

Run full test suite:

```bash
npm test
```

Manual smoke test:

1. Sign in as a user with `active_org_id` set
2. Navigate to `/workspace/discovery`
3. Click **Open Session**
4. Verify tabs load (empty states acceptable without pipeline data)
5. Submit a validation note and curation action (requires discovery run)

---

## Out of Scope (by design)

- Evidence Core writes
- Promotion workflows
- Claim confidence scoring
- Architecture redesign
- New backend APIs beyond existing discovery routes (except read-only provenance GET)

---

## Conclusion

The Discovery Workbench delivers a complete first-pass review surface for institutional discovery, including read-only Provenance tracing, accessible tab navigation, and responsive layout. It respects all architectural boundaries, uses the existing Curation API exclusively, and provides polished loading, empty, error, and refresh states for both Site Director and Kadarn reviewer personas.
