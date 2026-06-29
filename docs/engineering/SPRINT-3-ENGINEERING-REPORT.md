# Sprint 3 — Engineering Report

**Program:** Kadarn v1.0 Hardening  
**Sprint:** Database & Compliance Hardening  
**Version:** `1.0.0-hardening.3`  
**Date:** 2026-06-28  
**Gate status:** PASS (static + verify)

---

## Objective

Make the database fully auditable: append-only enforcement at the DB layer for all compliance audit tables, regulatory submission audit trail, schema parity, and regression gates.

---

## Root causes fixed

| Issue | Evidence | Fix |
|-------|----------|-----|
| `policy_evaluations` documented append-only but no triggers | Migration 022 comment only; no UPDATE/DELETE block | Migration 035: `apply_append_only_triggers('policy_evaluations')` |
| Same gap for `audit_events`, `trust_events`, `twin_events` | Comments + RLS only | Migration 035: triggers + `REVOKE UPDATE, DELETE` |
| Regulatory submissions mutable with no immutable history | No audit event table | New `regulatory_submission_events` + trigger on status change |
| API/schema drift on policies & evaluations | API queried `result`, `policy_type`, `severity` not in schema | Generated columns + `policies.policy_type`/`severity` sync |
| `database/` vs `supabase/` drift risk | Two migration trees | Parity test: SHA-256 match all 35 files |

---

## Migration 035 deliverables

| Component | Detail |
|-----------|--------|
| Generic triggers | `reject_append_only_update()`, `reject_append_only_delete()`, `apply_append_only_triggers(regclass)` |
| Append-only tables | `audit_events`, `policy_evaluations`, `trust_events`, `twin_events`, `regulatory_submission_events` |
| Provenance (existing) | Migration 032 — 6 triggers unchanged |
| Regulatory audit | `regulatory_submission_events` + `trg_regulatory_submissions_audit` |
| Schema compat | `policy_evaluations.result` ← `outcome`, `created_at` ← `evaluated_at` |
| RLS hardening | `REVOKE UPDATE, DELETE` on all append-only tables from `anon`, `authenticated` |

---

## Append-only inventory (gate)

| Table | Triggers | RLS UPDATE/DELETE | Regulatory |
|-------|----------|-------------------|------------|
| `provenance_nodes/edges/evidence` | ✅ (032) | ✅ revoked (035) | Chain of custody |
| `audit_events` | ✅ (035) | ✅ revoked | Platform audit |
| `policy_evaluations` | ✅ (035) | ✅ revoked | Policy compliance |
| `trust_events` | ✅ (035) | ✅ revoked | Trust audit |
| `twin_events` | ✅ (035) | ✅ revoked | Operational twins |
| `regulatory_submission_events` | ✅ (035) | ✅ revoked | IRB/ethics audit |
| `regulatory_submissions` | ❌ (mutable state) | N/A | Current state only — history in events table |

Mutable regulatory tables (`regulatory_protocols`, `regulatory_icf_templates`, etc.) intentionally allow UPDATE — they are working documents, not audit logs.

---

## Tests

| Test | Type | Location |
|------|------|----------|
| Static migration gate | Vitest (offline) | `tests/hardening/sprint3-database.test.ts` |
| Migration parity | Vitest (offline) | Same file — SHA-256 all 35 migrations |
| pgTAP trigger verification | SQL (requires DB) | `tests/compliance/append-only-triggers.pgtest.sql` |
| Provenance append-only | Vitest (offline) | `tests/provenance/provenance-append-only.test.ts` (existing) |

### pgTAP (manual, with Supabase local)

```bash
psql "$DATABASE_URL" -f tests/compliance/append-only-triggers.pgtest.sql
```

---

## Verification (executed 2026-06-28)

```
npm run verify       → PASS (typecheck + build + tests + secrets)
Migration parity     → 35/35 files identical (database ↔ supabase)
Static Sprint 3 gate → 17 new tests in hardening/sprint3-database.test.ts
```

---

## Known limitations (Sprint 4+ scope)

- pgTAP suite not wired into CI (requires Postgres + pgTAP extension)
- `regulatory_document_access` grants are mutable (revocation is an UPDATE — acceptable for access control)
- GDPR soft-delete pattern for PII tables still deferred (does not break append-only audit logs)

---

## Gate decision

**Sprint 3 gate: PASS** — All compliance audit tables enforce append-only at the database layer; regulatory submission history is immutable; migration parity verified; `npm run verify` green.
