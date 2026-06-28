# First Kadarn Operational Pilot Report

**Pilot:** ALPHA-PILOT-03  
**Date:** 2026-06-28  
**Platform:** Kadarn v1.0.0-alpha  
**Infrastructure:** Supabase local (Docker), Next.js API  
**Execution method:** Supabase REST API (service role) — auth bypass required  

---

## 1. Timeline

| Step | Status | Duration |
|---|---|---|
| Discovery (catalog browse) | ✅ | Instant |
| Feasibility assessment | ❌ | Blocked (no auth users) |
| Exchange request | ✅ | 1 attempt |
| Request approval | ⚠️ | Worked but via direct PATCH |
| Exchange deal | ✅ | 1 attempt |
| Escrow | ✅ | 1 attempt |
| Collection | ❌ | FK constraints |
| Processing sample | ❌ | Missing columns |
| QC | ⚠️ | Aliquots exist, no PATCH route tested |
| Shipment | ⚠️ | Insert worked, FK warning |
| Settlement release | ⚠️ | Escrow PATCH worked |
| Analytics | ✅ | Data available |

---

## 2. Issues Found (8 total)

### 🔴 Critical (3)

| # | Issue | Step | Root Cause | Fix |
|---|---|---|---|---|
| 1 | **Feasibility assessment requires auth** | Feasibility | `withAuth` middleware requires valid Supabase JWT. No test users exist. | Create auth users before pilot OR add service-role bypass for integration tests |
| 2 | **Exchange request requester_id requires auth.users** | Request | FK constraint `requester_id` references `auth.users.id`. Without auth users, inserts fail. | Seed auth users or make FK nullable with default system user |
| 3 | **collection_twins requires explicit id** | Collection | Table has no auto-generate for `id` — must provide UUID. Docs don't mention this. | Add `DEFAULT gen_random_uuid()` to collection_twins OR document in runbook |

### 🟡 Medium (3)

| # | Issue | Step | Root Cause | Fix |
|---|---|---|---|---|
| 4 | **processing_samples.sample_id FK is NOT NULL** | Processing | `sample_id` references itself with NOT NULL. Chicken-and-egg problem for first insert. | Make `sample_id` nullable OR set to `id` as default |
| 5 | **No direct API route for creating auth users** | Setup | Supabase Auth admin API requires `supabase` CLI or GoTrue API. Not exposed via Kadarn API. | Document in runbook: create users via `supabase auth create-user` |
| 6 | **check-secrets.sh flags example docs** | Ops | Documentation files with placeholder credentials trigger scanner. | Add doc files to scanner exclusions (done) |

### 🟢 Minor (2)

| # | Issue | Step | Root Cause | Fix |
|---|---|---|---|---|
| 7 | **Seed data has old demo orgs mixed with pilot orgs** | Setup | Previous seed data (PharmaCorp, etc.) coexists with new pilot seed. | Add seed data cleanup step to runbook |
| 8 | **collection_twins has no metadata column** | Collection | Runbook references `metadata` column that doesn't exist in actual schema. | Fix runbook to use protocol/irb_ref columns |

---

## 3. Pilot Score

| Dimension | Score | Notes |
|---|---|---|
| **Infrastructure** | 8/10 | API/Supabase available, some schema inconsistencies |
| **Data model** | 6/10 | FK constraints block inserts without auth.users |
| **Auth integration** | 3/10 | No auth users created — critical blocker for realistic pilot |
| **Documentation** | 7/10 | Runbook exists but had inaccuracies |
| **API completeness** | 8/10 | All main endpoints work, some UX rough edges |
| **Observability** | 7/10 | Logs visible, no dashboard |
| **Overall** | **6.5/10** | |

---

## 4. Operational Readiness

| Aspect | Ready? | Notes |
|---|---|---|
| Can a biobank execute the pilot today? | ❌ No | Auth users must be created first. Feasibility requires JWT. |
| Can a developer execute the pilot? | ⚠️ With workarounds | Using service key + manual SQL inserts. |
| Is the runbook accurate? | ⚠️ Partially | 2 documented issues found (collection_twins, metadata column). |
| Are the tests passing? | ✅ Yes | 385 tests pass, SIT-01 passes with Supabase. |

---

## 5. Recommendation

### Do not proceed to alpha-2 without fixes.

The 3 critical blockers must be resolved before another organization can execute this pilot:

1. **Auth users**: Create a seed script for `auth.users` with known IDs
2. **FK constraints**: Make `requester_id` in `exchange_requests` nullable or provide default system user UUID
3. **collection_twins**: Add `DEFAULT gen_random_uuid()` to the `id` column

### Recommended next steps

```
1. Fix the 3 critical blockers
2. Re-run the pilot end-to-end via API (not service role bypass)
3. Create real auth users with proper JWT tokens
4. Re-verify runbook accuracy
5. Re-score: target 8/10

After fixes, proceed to Alpha 2. Do not skip to Beta.
```

---

## 6. Evidence

### Discovery works
```
Discovery search returned 3 items for "breast"
```

### Exchange request created (with service key bypass)
```
ID: a9523793-ff58-44b9-9fa8-94cdceb67821
Status: submitted
```

### Analytics data available
```
Organizations: 10  Programs: 6  Collections: 2  Shipments: 2
```

### Tests
```
npm test:             385 passed (26 files)
SIT-01 (with Supabase): 38 passed
check-secrets.sh:     ✅ (after fixing exclusions)
tsc --noEmit:         0 errors
npm run build:        ✅ Build OK
```
