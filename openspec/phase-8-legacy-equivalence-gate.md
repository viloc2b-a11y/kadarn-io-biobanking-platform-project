# Legacy Equivalence Validation Gate

**Status:** Mandatory gate between Sprint 28J and 28K  
**Parent:** [phase-8-evidence-evolution-architecture.md](../phase-8-evidence-evolution-architecture.md)

---

## Purpose

Before removing the Compatibility Layer (Read Adapter Only) and cutting over to Evidence Core v2, demonstrate that Published View outputs are **functionally equivalent** to legacy API responses.

Equivalence is not "it works" — it is **same semantic content** where the legacy contract applies.

---

## Surfaces under test (external-facing only)

| Surface | Legacy baseline | Published View target |
|---------|-----------------|----------------------|
| Passport | `GET /api/v1/continuity/passport/:slug` | `ViewType: public` |
| Institution public | `GET /api/v1/institution/public/:slug` | `ViewType: institution` |
| Discovery dashboard | `GET /api/v1/discovery/dashboard` | `ViewType: canonical` |
| Discovery report | `GET /api/v1/discovery/report` | canonical + EvidencePackSummary |

**Deferred (not in gate scope):** `GET /api/v1/institution/profile` — internal authenticated workspace.

---

## Test location

```text
tests/phase8/legacy-equivalence/
  gate.test.ts              ← orchestrator (28J→28K gate)
  gate-runner.ts            ← fixture loader + per-surface checks
  passport.equivalence.test.ts
  institution.equivalence.test.ts
  discovery-dashboard.equivalence.test.ts
  discovery-report.equivalence.test.ts
  fixtures/                 ← golden snapshots (anonymized staging data)
```

Run: `npm run test:gate-28jk -w tests`

Report: [phase-8-gate-28JK-report.md](phase-8-gate-28JK-report.md)

---

## Equivalence criteria

1. **Fields:** All required legacy fields present in view projection (or documented as deprecated).
2. **Filters:** Same visibility rules (public, rejected excluded, consent).
3. **Ordering:** Same sort semantics (e.g. confidence descending on passport).
4. **Counts:** Same number of claims/items for fixture datasets.
5. **Tolerance:** Explicit allowlist for intentional schema improvements.

---

## CI policy

- Gate runs on PRs targeting 28K work
- Merge to `main` for cutover branches **blocked** if any surface fails
- Threshold: 100% pass on required fields for golden fixtures; zero unapproved diffs

---

## Process

```text
28D  → Capture legacy golden fixtures
28E–28J → Build native views; adapter still serves legacy source
28J complete → Run full equivalence suite
Gate pass → Authorize 28K cutover
28K  → Remove adapter; re-run suite against native source only
```

---

## Sign-off

| Role | Responsibility |
|------|----------------|
| Engineering | Implement tests + fixtures |
| Architecture | Approve tolerance allowlist |
| Product | Confirm sponsor/passport UX parity |

---

*Part of Phase 8 Compatibility Layer strategy (Option C).*
