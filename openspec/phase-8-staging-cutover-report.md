# Phase 8 Staging Cutover Report — Sprint 28K

**Date:** 2026-07-03  
**Environment:** local staging (`apps/api/.env.local`, Supabase `:55421`)  
**Flag:** `LEGACY_PASSPORT_ENABLED=false`  
**Verdict:** **STAGING PASS** — production cutover **pending**

---

## Cutover actions executed

| Action | Status |
|--------|--------|
| Set `LEGACY_PASSPORT_ENABLED=false` in staging env | **DONE** |
| Compatibility Layer retained in deploy artifact | **YES** |
| `/institution/profile` deferred (not migrated) | **YES** |
| Phase 9 not started | **YES** |
| API response shapes unchanged | **YES** |
| Ops endpoint `/api/v1/operations/phase8-cutover` | **200** |
| Migrations 046–048 applied (lineage, claims/views, hybrid index) | **DONE** |
| Staging seeds 049 + 055 (passport + discovery) | **DONE** |
| Smoke runner `npm run staging:cutover-smoke -w tests` | **PASS** |

---

## Smoke results (Supabase running, DB-backed)

### In-process (cutover flag + golden fixtures)

| Check | Result |
|-------|--------|
| `legacyAdapterEnabled=false` | **PASS** |
| Passport non-empty + shape | **PASS** |
| Institution public parity | **PASS** |
| Discovery dashboard parity | **PASS** |
| Discovery report parity | **PASS** |
| `/institution/profile` deferred | **PASS** |

### HTTP (local API `:3001`, Supabase `:55421`)

| Route | Result | Notes |
|-------|--------|-------|
| `GET /api/v1/operations/phase8-cutover` | **200** | `published_view_path=active`, legacy disabled |
| `GET /api/v1/institution/public/:orgId` | **200** | National Biobank, 15 capabilities |
| `GET /api/v1/continuity/passport/national-biobank-staging` | **200** | 2 public claims |
| `GET /api/v1/discovery/dashboard?sessionId=…` | **200** | `capability_detector` present |
| `GET /api/v1/discovery/report?sessionId=…` | **200** | executive summary present |

**Logs:** `[phase8-cutover] Published View path active — LEGACY_PASSPORT_ENABLED=false`

---

## Exit gate (2026-07-03)

| Gate | Result |
|------|--------|
| Ops endpoint 200 | **PASS** |
| Four external routes with DB | **PASS** |
| No module-not-found / duplicate export | **PASS** |
| `npm run test:gate-28jk -w tests` | **13/13 PASS** |
| `npm run test:phase8 -w tests` | **13/13 PASS** |
| `npm run typecheck` | **PASS** |

---

## Staging cutover verdict

| Layer | Verdict |
|-------|---------|
| Cutover configuration | **PASS** |
| In-process equivalence under cutover flag | **PASS** |
| Full HTTP staging smoke (DB-backed) | **PASS** |

**Overall staging cutover:** **STAGING PASS**  
**Production cutover:** **NOT AUTHORIZED** — remains pending after prod-environment validation.

---

## Infra fixes applied during validation

| Issue | Fix |
|-------|-----|
| Next.js 16 Turbopack vs webpack config | `next dev --webpack` in `apps/api/package.json` |
| Wrong `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` | Aligned with `supabase status` |
| Seed auth users invisible to GoTrue | `instance_id` + null token columns |
| Public institution route RLS | `createServiceClient()` for server-side public reads |
| Bearer token support in API routes | `Authorization` header in `createRouteClient()` |
| Discovery RLS grant chain (local) | Migration `056_phase8_public_read_grants.sql` + service client on discovery routes |
| `active-org` route | Updates auth `user_metadata` via admin API |

---

## Production cutover window (prepared, not executed)

| Step | When |
|------|------|
| Apply migrations 046–056 in staging/prod | Before cutover |
| Set `LEGACY_PASSPORT_ENABLED=false` | Cutover window T+0 |
| Rolling restart API | T+0 to T+15m |
| Run `staging:cutover-smoke` against prod URL | T+15m |
| Monitoring period | **2 weeks** |
| Remove Compatibility Layer code | **After** monitoring sign-off only |

See [phase-8-cutover-runbook.md](phase-8-cutover-runbook.md).

---

## Rollback (available now)

```bash
LEGACY_PASSPORT_ENABLED=true   # or unset
# rolling restart API
```

Compatibility Layer code remains in the deployed artifact.

---

*Staging cutover closed with DB-backed validation. Production cutover remains pending.*
