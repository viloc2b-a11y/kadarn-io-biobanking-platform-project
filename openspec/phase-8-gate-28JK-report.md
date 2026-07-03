# Phase 8 Legacy Equivalence Gate Report — 28J→28K

**Status:** PASS  
**Date:** 2026-07-03  
**Fixture source:** staging-anonymized (`tests/phase8/legacy-equivalence/fixtures/`)  
**Gate runner:** `tests/phase8/legacy-equivalence/gate.test.ts`

---

## Summary

| Check | Result |
|-------|--------|
| Overall gate | **PASS** |
| Cutover ready (`LEGACY_PASSPORT_ENABLED=false`) | **YES** |
| Compatibility Layer retained for rollback | **YES** |
| Typecheck | **PASS** |
| Phase 8 equivalence suite | **13/13 PASS** |

---

## Surfaces

| Surface | Route | Result | Notes |
|---------|-------|--------|-------|
| Passport | `GET /api/v1/continuity/passport/:slug` | **PASS** | Profile fields, claim count, confidence ordering, verification labels |
| Institution public | `GET /api/v1/institution/public/:slug` | **PASS** | Capabilities/assessment parity vs direct engine output |
| Discovery dashboard | `GET /api/v1/discovery/dashboard` | **PASS** | Agent outputs + candidates unchanged; views registered |
| Discovery report | `GET /api/v1/discovery/report` | **PASS** | Full report body parity (volatile fields stripped) |
| Cutover readiness | `LEGACY_PASSPORT_ENABLED=false` | **PASS** | Adapter disable/enable paths validated; rollback adapter importable |

---

## Explicitly deferred (not in gate scope)

| Route | Classification | Decision |
|-------|----------------|----------|
| `GET /api/v1/institution/profile` | Internal authenticated workspace | **Deferred** — do not migrate in Sprint 28K gate |

Tracked in `VIEW_PENDING_ROUTES` (`packages/published-view/src/integration-guard.ts`).

---

## Migrated external surfaces (28D route convergence)

- `/api/v1/continuity/passport/:slug`
- `/api/v1/institution/public/:slug`
- `/api/v1/discovery/dashboard`
- `/api/v1/discovery/report`

---

## Exit gate criteria

- [x] All four external-facing surfaces pass equivalence
- [x] Typecheck passes
- [x] Published-view and legacy-equivalence tests pass (`npm run test:gate-28jk`)
- [x] `/institution/profile` remains explicitly deferred
- [x] Cutover can proceed with Compatibility Layer still available for rollback

---

## Authorization

| Role | Status |
|------|--------|
| Engineering | Gate suite green — 2026-07-03 |
| Architecture | Pending sign-off on tolerance allowlist |
| Product | Pending UX parity confirmation |

**Next step:** Controlled cutover per [phase-8-cutover-runbook.md](phase-8-cutover-runbook.md).

---

*Generated from automated gate runner. Re-run: `npm run test:gate-28jk -w tests`*
