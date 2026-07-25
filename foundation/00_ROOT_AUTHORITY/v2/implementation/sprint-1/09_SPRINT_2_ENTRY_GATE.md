# Sprint 1 — Sprint 2 Entry Gate

**Date:** 2026-07-25

---

## Gate Conditions for Sprint 2 (Claim-Evidence Relationships)

| # | Condition | Status | Evidence |
|---|-----------|--------|----------|
| 1 | evidence_sources table exists and stable | ✅ | Migration 073 applied, 15 tests passing |
| 2 | source_records table exists and stable | ✅ | Migration 074 applied, 15 tests passing |
| 3 | Source vs SourceRecord distinction correct | ✅ | Types and migrations enforce the separation |
| 4 | Build, typecheck, tests pass (baseline preserved) | ✅ | 1337 passed, 19 failed (baseline) |
| 5 | Evidence, Claim, Capability, Passport unchanged | ✅ | No modifications to those tables |
| 6 | Authority and freshness model complete | ✅ | 6 levels + 5 policies defined |
| 7 | RLS for sources tested | ✅ | Global vs institutional isolation validated |
| 8 | Continuing Review fixture exists | ✅ | In test fixtures (CR source type) |
| 9 | API contracts documented | ✅ | 6 endpoints |
| 10 | Rollback path documented | ✅ | DROP TABLE for new tables, backwards-compatible |

## Sprint 2 Scope (when authorized)

**Block B — Claim-Evidence Relationships:**
- `claim_evidence_links` table (many-to-many with role: supports/contradicts/qualifies)
- Extend `evidence_nodes` with `source_record_id` and `epistemic_type` (nullable)
- API: POST/GET claim evidence links
- Integrate with existing Claims + Evidence API

**Feature flag:** `v2_claim_links` — disabled by default, enabled after validation.
