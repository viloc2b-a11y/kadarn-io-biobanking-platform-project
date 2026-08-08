# Documentary Drift Register — Canonical Conformance Loop

**Date:** 2026-08-08  
**Scope:** Full Runtime + Canonical Conformance Loop  
**Status:** Active — Updated per recovery passes  
**Authority:** KPO (KADARN Program Office)  

---

## Purpose

This register documents discrepancies between canonical documentation and runtime reality discovered during the conformance loop. Each entry records the drift, its resolution, and the evidence of correction.

---

## Recovery 3 — Canonical Reconciliation (KEMS Mapping)

### DRIFT-003-01: KEMS-005 mislabeled as "Evidence Core"

| Field | Value |
|---|---|
| **Document** | `foundation/00_GOVERNANCE/CANONICAL_MVP_SCOPE.md` §6 |
| **Found** | KEMS-005 listed as "Evidence Core" |
| **Correct** | KEMS-005 is "Schema Evolution Standard" |
| **Resolution** | Fixed in `49d9386e` |
| **Evidence** | `git show 49d9386e -- foundation/00_GOVERNANCE/CANONICAL_MVP_SCOPE.md` |

### DRIFT-003-02: KEMS-006 mislabeled as "Capability Model"

| Field | Value |
|---|---|
| **Document** | `foundation/00_GOVERNANCE/CANONICAL_MVP_SCOPE.md` §6 |
| **Found** | KEMS-006 listed as "Capability Model" |
| **Correct** | KEMS-006 is "Systems Integration Standard" |
| **Resolution** | Fixed in `49d9386e` |
| **Evidence** | `git show 49d9386e -- foundation/00_GOVERNANCE/CANONICAL_MVP_SCOPE.md` |

### DRIFT-003-03: KEMS-001 reference ambiguous in explainability.ts

| Field | Value |
|---|---|
| **Document** | `packages/evidence-core/src/explainability.ts` |
| **Found** | Comment: "Evidence Core — Explainability Framework (KEMS-001 §6)" |
| **Problem** | Ambiguous: reads as if KEMS-001 IS "Evidence Core" |
| **Correct** | KEMS-001 §6 refers to "Confidence Graph Model" |
| **Resolution** | Clarified to "Evidence Core package — Explainability Framework (KEMS-001 §6: Confidence Graph Model)" in `49d9386e` |
| **Evidence** | `git show 49d9386e -- packages/evidence-core/src/explainability.ts` |

---

## Recovery 4 — Source-of-Truth (user_organizations)

### DRIFT-004-01: site@kadarn.test missing PharmaCorp in user_organizations

| Field | Value |
|---|---|
| **System** | Supabase Cloud (`mojwbpjwrhfohalfdred`) |
| **Found** | `user_organizations` VIEW returned 0 orgs for `site@kadarn.test` |
| **Root Cause** | Membership `040c0d6f` existed but had 0 `membership_roles` records |
| **Fix** | Inserted `membership_role` with `org_member` (`3799888e-bc57-4edd-a0bf-0877ca07bb74`) |
| **Result** | 2 orgs visible; PharmaCorp pipeline verified (Claims 5/5, Activity 200, Readiness 200) |
| **Evidence** | Pipeline HTTP verification: Claims(5/5), Activity(200), Readiness(200) |

---

## Recovery 5 — Pipeline Verification (E2E)

### VERIFIED-005-01: Authenticated Pipeline — PharmaCorp

```
login(site@kadarn.test) → active-org(PharmaCorp) → GET /api/v1/claims (HTTP 200)

Certificacion ISO 15189:       ev=1 → substantiated
Experiencia Fase II Oncologia: ev=3 → substantiated
Centrifuga Refrigerada:        ev=2 → substantiated
Fase II Experience:            ev=0 → awaiting_evidence
Centrifuga Sorvall RC-6:       ev=2 → substantiated

_meta: evidenceLoadOk: True
```

| Endpoint | Status |
|---|---|
| `GET /api/v1/claims` | ✅ HTTP 200 |
| `GET /api/v1/workspace/activity` | ✅ HTTP 200 |
| `POST /api/v1/workspace/active-org` | ✅ HTTP 200 |
| `GET /api/v1/institutions/self/readiness` | ✅ HTTP 200 |

---

## Summary

| Recovery | Drifts Found | Resolved | Evidence |
|---|---|---|---|
| Recovery 3 — KEMS Mapping | 3 | 3 | Commit `49d9386e` |
| Recovery 4 — user_organizations | 1 | 1 | Pipeline verification |
| Recovery 5 — Pipeline | 0 (verification) | N/A | 4/4 endpoints HTTP 200 |

**All discovered drifts resolved. Pipeline verified.**
