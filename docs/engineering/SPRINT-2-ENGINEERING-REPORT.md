# Sprint 2 — Engineering Report

**Program:** Kadarn v1.0 Hardening  
**Sprint:** API Production Hardening  
**Version:** `1.0.0-hardening.2`  
**Date:** 2026-06-28  
**Gate status:** PASS

---

## Objective

Eliminate fake/placeholder API endpoints. Every `/api/v1/*` route must represent real database-backed behavior with auth, org context, and validation.

---

## Before → After

| Pattern | Before (audit) | After (grep) |
|---------|----------------|--------------|
| `org-default` | 11 workspace stubs | **0** |
| `readyForAudit: true` | 1 KPE generate route | **0** |
| `pol-001` fake policy | 1 compliance route | **0** |
| `x-org-id` header fallback | 11 routes | **0** |
| Workspace `items: []` stubs | 11 routes | **0** (Supabase queries) |
| Legacy unversioned handlers | 13 routes with real logic at `/api/*` | **308 redirects** to `/api/v1/*` |

---

## Changes delivered

### Workspace routes (14)

All rewritten with `withAuth`, `requireActiveOrg`, `withRateLimit`, and real Supabase queries:

| Route | Table(s) |
|-------|----------|
| `workspace/inventory` | `supply_items` |
| `workspace/collections` | `collection_twins` |
| `workspace/qc` | `processing_aliquots` |
| `workspace/processing` | `processing_samples` |
| `workspace/logistics` | `logistics_shipments` |
| `workspace/programs` | `programs` |
| `workspace/requests` | `exchange_requests` |
| `workspace/consent` | `regulatory_icf_templates`, `specimen_twins`, `provenance_nodes` |
| `workspace/regulatory` | `regulatory_protocols`, `regulatory_submissions` |
| `workspace/documents` | `regulatory_documents` |
| `workspace/payments` | `exchange_escrow` |
| `workspace/applications` | capability-derived app list from DB |
| `workspace/exchange` | `exchange_requests`, `exchange_deals` |
| `workspace/analytics` | `analytics_program_metrics`, `program_activity_log` |

Org context: `user.user_metadata.active_org_id` via `requireActiveOrg()` — returns **422** if unset (no header fallback).

### KOC / operations fake routes removed

| Route | Fix |
|-------|-----|
| `operations/compliance` | Queries `policies`, `policy_evaluations`, `regulatory_submissions` |
| `operations/kpe/generate` | Zod-validated redirect (308) → `/api/v1/programs/:id/kpe` |

### Versioning & legacy migration

- Canonical handlers moved/copied to `/api/v1/*`: `programs`, `exchange`, `discovery`, `feasibility`, `organizations`, `account/me`, `audit-events`
- All legacy `/api/*` routes (except `/api/health`, `/api`) → **308 permanent redirect** via `legacyRedirectAuto`
- API middleware sets `X-Kadarn-Api-Version: v1` and `Deprecation: true` on legacy paths

### Cross-cutting infrastructure

| Module | Purpose |
|--------|---------|
| `apps/api/src/lib/workspace.ts` | `requireActiveOrg`, pagination, list response shape |
| `apps/api/src/lib/rate-limit.ts` | Per-route in-memory limiter (120 req/min/IP) |
| `apps/api/src/lib/legacy-redirect.ts` | 308 redirects with `/api/me` → `/api/v1/account/me` |
| `apps/api/src/middleware.ts` | Global rate limit + version/deprecation headers |

### Health endpoint

Updated to `version: 1.0.0-hardening.2`, `api_version: v1`.

### Regression gate

`tests/hardening/sprint2-api.test.ts` — static ban on fake patterns + legacy redirect enforcement. Included in default `npm test`.

---

## Verification (executed 2026-06-28)

```
npm run typecheck   → PASS (23 workspaces)
npm run build       → PASS (web + api, 71 API routes)
npm test            → 416 passed, 38 skipped (+10 Sprint 2 hardening tests)
npm run check:secrets → PASS
npm run verify      → PASS
```

### Grep evidence (apps/api)

```
org-default      → 0 matches
readyForAudit    → 0 matches
pol-001          → 0 matches
x-org-id         → 0 matches
```

---

## Known limitations (Sprint 3+ scope)

- Cross-engine hooks in `exchange-helper.ts`, `logistics-helper.ts`, `onboarding.ts` remain console stubs (not API routes)
- Rate limiter is in-memory (single instance); Redis-backed limiter needed for clustered deploy
- Integration tests (`test:integration`) still require local Supabase
- `marketplace/search` returns empty arrays when `q` is blank — intentional, not a stub

---

## Gate decision

**Sprint 2 gate: PASS** — No fake API endpoints remain; all workspace and operations routes query real tables; legacy paths redirect to v1; verify gate green.
