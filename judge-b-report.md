# Judge B - Independent Adversarial Review

## Review Scope
- **Target:** Full Kadarn Platform repository
- **Mode:** Read-only, blind adversarial (independent of Judge A)
- **Files examined:** ~60 route handlers, 10+ engine/library modules, 2 migration files, middleware, auth package, test files, configuration files

---

## Findings

### CRITICAL-1: Genuine Supabase credentials leaked in .env.example

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **File** | `.env.example` (lines 13-26) |
| **Description** | The `.env.example` file contains real Supabase project credentials - including `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_URL` pointing to a real Supabase project. The service role key grants full database access bypassing RLS. |
| **Suggested fix** | Replace with placeholder values. Rotate leaked keys immediately. |

### CRITICAL-2: Rate limiter memory leak - unbounded in-memory map growth

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **File** | `apps/api/src/middleware.ts` (lines 5-6) and `apps/api/src/lib/rate-limit.ts` (lines 8-9) |
| **Description** | Two independent IP-based rate limiters each use a `Map<string, Bucket>` that is never pruned. Every unique IP adds an entry that persists forever, causing unbounded memory growth. |
| **Suggested fix** | Add periodic cleanup of expired entries or switch to Redis. Consolidate the two Map instances. |

### CRITICAL-3: TrustEngineService.resolveChallenge corrupts non-challenged dimensions

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **File** | `packages/trust-engine/src/service.ts` (lines 151-172) |
| **Description** | When `resolveChallenge` accepts a challenge, it recomputes `overallScore` with hardcoded `0.5` for all non-challenged dimensions, destroying legitimate scores. |
| **Suggested fix** | Fetch current OrganizationTrust and merge only the challenged dimension. |

### CRITICAL-4: Organization capabilities POST - broken RBAC

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **File** | `apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts` (lines 67-73) |
| **Description** | POST handler selects `organization_memberships` with `.select("id, role")` but the table has NO `role` column. Any active member can assign capabilities - should be admin-only. |
| **Suggested fix** | Use `is_org_admin()` RPC or join through `membership_roles`. |

### CRITICAL-5: Graph fabric - non-existent column reference

| Field | Value |
|---|---|
| **Severity** | **CRITICAL** |
| **File** | `apps/api/src/lib/graph-fabric-runtime.ts` (lines 139-140) |
| **Description** | Query references column `capability` on `organization_capabilities` table, which does not exist. Will crash at runtime with Postgres error. |
| **Suggested fix** | Join through `organization_capability_types` to resolve capability keys. |
### WARNING (real)-1: Escrow update failure silently swallowed in exchange deal PATCH

| Field | Value |
|---|---|
| **Severity** | **WARNING (real)** |
| **File** | `apps/api/src/app/api/v1/exchange/deals/[id]/route.ts` (lines 118-124) |
| **Description** | Escrow update error is only logged via `console.error`. The caller receives HTTP 200 with deal updated but escrow in previous state, creating silent partial-update failures. |
| **Suggested fix** | Either throw (making the PATCH transactional) or return escrow error in the response. |

### WARNING (real)-2: Shipment twin sync failure silently swallowed

| Field | Value |
|---|---|
| **Severity** | **WARNING (real)** |
| **File** | `apps/api/src/app/api/v1/shipments/[id]/route.ts` (lines 85-87) |
| **Description** | Twin sync error is only logged via `console.error`. Shipment status changes but operational twin stays stale, causing health dashboard to show incorrect data. |
| **Suggested fix** | Make twin update part of the same transaction, or throw on failure. |

### WARNING (real)-3: Twin health route - twin_events(count) aggregate accessed as array .length

| Field | Value |
|---|---|
| **Severity** | **WARNING (real)** |
| **File** | `apps/api/src/app/api/v1/koc/twins/health/route.ts` (line 28), `apps/api/src/app/api/v1/koc/twins/route.ts` (lines 20-24) |
| **Description** | Supabase `.select("id, twin_events: twin_events(count)")` returns count as `{ count: N }` object, not an array. Code accesses `i.twin_events?.length` which is always `undefined` for objects. `total_events` is always 0. |
| **Suggested fix** | Access `i.twin_events?.count` depending on actual Supabase response shape. |

### WARNING (real)-4: OPA shadow mode uses fail-open by default with no alerting

| Field | Value |
|---|---|
| **Severity** | **WARNING (real)** |
| **File** | `packages/policy-engine/src/opa/shadow-mode.ts` (lines 128-132) |
| **Description** | Default `opaFailOpen` is `true`. If shadow mode is promoted to enforcement mode without changing this default, an OPA network partition silently allows every request. |
| **Suggested fix** | Add error counter/metric increment for OPA failures. Require explicit `opaFailOpen: false` for enforcement. |

### WARNING (real)-5: runTelemetryStage has dead-code void statements

| Field | Value |
|---|---|
| **Severity** | **WARNING (real)** |
| **File** | `apps/api/src/lib/orchestration/stage-handlers.ts` (lines 283-286) |
| **Description** | Four `void SPAN_*` statements reference imported string constants, doing nothing. Suggests incomplete instrumentation. |
| **Suggested fix** | Remove dead statements or implement actual OpenTelemetry span wrapping. |

### WARNING (theoretical)-1: Environment variable pattern may crash on module init

| Field | Value |
|---|---|
| **Severity** | **WARNING (theoretical)** |
| **File** | `packages/auth/src/index.ts` (lines 10-14) |
| **Description** | The `env()` helper throws at module init time if env vars are absent. In Docker builds without runtime env substitution, this can crash the process on import. |
| **Suggested fix** | Use lazy initialization or try/catch with runtime fallback. |

### WARNING (theoretical)-2: Web middleware calls auth.getUser() on every navigation

| Field | Value |
|---|---|
| **Severity** | **WARNING (theoretical)** |
| **File** | `apps/web/src/middleware.ts` (lines 31-32) |
| **Description** | `supabase.auth.getUser()` makes a network round-trip to Supabase Auth on every page navigation (200-500ms added latency). JWT is verifiable locally. |
| **Suggested fix** | Use local JWT decoding library (e.g., `jose`) to verify signature locally. |

### WARNING (theoretical)-3: Two independent rate limiter instances with inconsistent state

| Field | Value |
|---|---|
| **Severity** | **WARNING (theoretical)** |
| **File** | `apps/api/src/middleware.ts` (line 5) and `apps/api/src/lib/rate-limit.ts` (line 8) |
| **Description** | Two separate Map-based rate limiters exist. Middleware skips `/api/v1/*`, and `rate-limit.ts` is imported by specific routes. Both accumulate state independently. |
| **Suggested fix** | Consolidate into a single rate-limiter singleton module. |

### SUGGESTION-1: No pagination on audit events feed endpoint

| Field | Value |
|---|---|
| **Severity** | **SUGGESTION** |
| **File** | `apps/api/src/app/api/v1/feed/route.ts` (line 20) |
| **Description** | KOC feed fetches `.limit(30)` without pagination parameters or cursor support. |
| **Suggested fix** | Add `limit`, `offset`, or cursor-based pagination parameters. |

### SUGGESTION-2: Discovery route throws uncaught ZodError on malformed input

| Field | Value |
|---|---|
| **Severity** | **SUGGESTION** |
| **File** | `apps/api/src/app/api/v1/discovery/route.ts` (line 28) |
| **Description** | `searchSchema.parse()` without try-catch throws uncaught `ZodError` for invalid query params (e.g., `limit=abc`). Returns 500 instead of 400. |
| **Suggested fix** | Use `.safeParse()` and return field-level 400 errors. |

### SUGGESTION-3: publishIntegrationEvent fire-and-forget loses error tracking

| Field | Value |
|---|---|
| **Severity** | **SUGGESTION** |
| **File** | `apps/api/src/lib/event-runtime.ts` (lines 109-111) |
| **Description** | `publishDomainEventFireAndForget` uses `void promise.catch(...)`. If both Supabase RPC and in-memory fallback fail, error is logged but no metric is incremented. |
| **Suggested fix** | Add metric counter for failed event publications. |

### SUGGESTION-4: admin_create_user auth guard has subtle bypass condition

| Field | Value |
|---|---|
| **Severity** | **SUGGESTION** |
| **File** | `database/migrations/008_organizations_capabilities.sql` (lines 223-225) |
| **Description** | The `SECURITY DEFINER` function guard allows NULL and empty-string `auth.role()` to bypass. In some Postgres contexts, `auth.role()` can return these values. |
| **Suggested fix** | Simplify to: `IF auth.role() IS NULL OR auth.role() NOT IN ("service_role", "superuser") THEN RAISE EXCEPTION ... END IF;` |

### SUGGESTION-5: GDPR erasure sends null orgId in events

| Field | Value |
|---|---|
| **Severity** | **SUGGESTION** |
| **File** | `apps/api/src/app/api/v1/account/erasure/route.ts` (lines 37-46) |
| **Description** | Event context uses `active_org_id` from user metadata. If null, downstream consumers may skip processing or error. |
| **Suggested fix** | Pass sentinel like `"self-service"` or iterate user org memberships. |

### SUGGESTION-6: No rate limiting on authenticated API v1 routes

| Field | Value |
|---|---|
| **Severity** | **SUGGESTION** |
| **File** | `apps/api/src/middleware.ts` (lines 16-17) |
| **Description** | Middleware rate limiter explicitly skips `/api/v1/*`. Authenticated users can hammer endpoints without restriction. |
| **Suggested fix** | Apply per-user (JWT subject) rate limiting for authenticated paths. |

---

## VERDICT

**Not clean.** Found **5 CRITICAL**, **5 real WARNING**, **3 theoretical WARNING**, and **6 SUGGESTION** findings.

Most pressing:
1. **Credential leak** in `.env.example` - real Supabase project keys in git-tracked file
2. **Rate limiter memory leak** - unbounded Map growth will cause OOM over time
3. **Trust score corruption** in `resolveChallenge` - overwrites non-challenged dimensions to 0.5
4. **Broken RBAC** in capabilities assignment - any org member can assign capabilities
5. **Broken graph query** - references non-existent column, will crash at runtime

**Skill Resolution:** none - no project-specific skills mapped in registry.
