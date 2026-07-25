# KAD-010 — Sharing and Access Grants — Report

**Date:** 2026-07-24 | **Status:** COMPLETE

## Decision: PASS

**Delivered:**
- Migration 070 — `access_level` enum (`view/download/full`), `granted_by`, `revoked_at/by`, `access_token`, `permissions` JSONB, `created_at/updated_at` on passport_shares
- API: `GET/POST /api/v1/passport-entries/[id]/shares` — grant access with level + list shares
- API: `DELETE /api/v1/shares/[id]` — revoke access (soft-delete with audit trail)
- API: `GET /api/v1/public/passport/[token]` — no-auth required, gated by valid token, checks expiration
- Canonical `AccessLevel` type + extended `PassportShare` schema in `@kadarn/types`
- RLS: sponsors can view their granted shares; org members manage shares

| Check | Result |
|-------|--------|
| Build | ✅ 21.5s |
| Typecheck | ✅ |
| Migration | ✅ Clean (ALTER TABLE, indexes, RLS) |
| Tests | ✅ 1322 passed, baseline |

## Complete Passport Pipeline

```
         ┌──────────┐
         │  Claim   │
         └────┬─────┘
              │
         ┌────▼─────┐
         │ Evidence  │
         └────┬─────┘
              │
         ┌────▼─────┐
         │  Review   │
         └────┬─────┘
              │
         ┌────▼───────┐
         │ Confidence  │
         └────┬───────┘
              │
         ┌────▼─────────┐
         │   Passport    │
         │  (Entry +     │
         │   Knowledge)  │
         └────┬─────────┘
              │
         ┌────▼──────────┐
         │  Share Grant   │ ← You are here
         │  (Token-based  │
         │   public view) │
         └───────────────┘
```

**Next:** KAD-011 — Readiness (institutional discovery readiness score, integrating metrics from the positioning docs)
