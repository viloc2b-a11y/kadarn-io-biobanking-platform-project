# Kadarn Supabase Infrastructure Validation

**Date:** 2026-06-28  
**Status:** Validation complete — local infrastructure verified, remote project not configured  
**Supabase CLI:** 2.108.0  
**Docker:** Not available on this machine  

---

## 1. Connection Status

| Check | Result | Details |
|---|---|---|
| `.env.local` exists | ✅ | `apps/api/.env.local` — contains local Supabase URL + demo anon key |
| Remote Supabase URL configured | ❌ | Currently pointing to `http://localhost:54321` (local) |
| `supabase status` | ❌ | Docker Desktop not available on this system |
| `supabase link` (remote) | ❌ | Not configured — no remote project credentials provided |
| `supabase --version` | ✅ | v2.108.0 installed |

**Veredicto:** No remote Supabase project is currently connected. The project is configured for local development via Docker + Supabase CLI.

---

## 2. Migration Infrastructure

| Check | Result |
|---|---|
| Migration files in `database/migrations/` | ✅ 25 SQL files |
| Migration files in `supabase/migrations/` | ✅ 25 SQL files |
| Directories in sync | ✅ Identical file lists |
| Seed data | ✅ `supabase/seed.sql` (17KB) |
| Key migrations present | See table below |

### Key Migration Inventory

| Migration | Purpose | Status |
|---|---|---|
| `008_organizations_capabilities.sql` | Organizations + capabilities schema | ✅ Present |
| `009_rls_foundation.sql` | 40+ RLS policies, helper functions | ✅ Present |
| `010_audit_programs.sql` | Programs, audit events | ✅ Present |
| `013-021` | Engine migrations (discovery through AI) | ✅ Present |
| `022_policy_engine.sql` | Policies + policy_evaluations tables | ✅ Present |
| `025_provenance_graph.sql` | Provenance nodes + edges + evidence | ✅ Present |
| `032_provenance_append_only.sql` | Append-only triggers + correction pattern | ✅ Present |

---

## 3. RLS Validation

| Check | Result |
|---|---|
| RLS foundation migration exists | ✅ `009_rls_foundation.sql` |
| RLS policies count | ✅ 40+ policies across all engine tables |
| All engine tables have RLS | ✅ Verified in KPV-08 (19 multi-tenant tests) |
| Organizations table RLS | ✅ SELECT, INSERT, UPDATE policies |
| Engine tables RLS | ✅ 50+ tables with `ENABLE ROW LEVEL SECURITY` |

---

## 4. Append-Only Trigger Validation

| Check | Result |
|---|---|
| Trigger migration exists | ✅ `032_provenance_append_only.sql` |
| Triggers block UPDATE on `provenance_nodes` | ✅ `provenance_nodes_no_update()` |
| Triggers block DELETE on `provenance_nodes` | ✅ `provenance_nodes_no_delete()` |
| Triggers block UPDATE on `provenance_edges` | ✅ `provenance_edges_no_update()` |
| Triggers block DELETE on `provenance_edges` | ✅ `provenance_edges_no_delete()` |
| Triggers block UPDATE on `provenance_evidence` | ✅ `provenance_evidence_no_update()` |
| Triggers block DELETE on `provenance_evidence` | ✅ `provenance_evidence_no_delete()` |
| Verification step | ✅ `DO $$ ... RAISE NOTICE` block confirms 6 triggers |

---

## 5. RPC / Function Validation

| Function | Source | Status |
|---|---|---|
| `upsert_provenance_node()` | `032_provenance_append_only.sql` | ✅ Defined |
| `ensure_provenance_node()` | `032_provenance_append_only.sql` | ✅ Defined |
| `provenance_node_integrity_status()` | `032_provenance_append_only.sql` | ✅ Defined |
| `provenance_node_integrity_status_batch()` | `032_provenance_append_only.sql` | ✅ Defined |
| `discovery_search()` | `013_discovery_engine.sql` | ✅ Defined |
| `run_feasibility_assessment()` | `014_feasibility_engine.sql` | ✅ Defined |
| RLS helper functions | `009_rls_foundation.sql` | ✅ 12+ functions defined |

---

## 6. Integration Tests

| Check | Result |
|---|---|
| Supabase-specific test files | ✅ Found in `tests/api/` and `tests/setup/` |
| Tests reference `process.env.SUPABASE_*` | ✅ — expect env vars at runtime |
| Tests can run with demo keys | ✅ Fallback to demo JWT when env vars unset |
| `npm test` (offline) | ✅ 385 passed — all offline/unit tests |

**Note:** Supabase integration tests require:
1. Running `supabase start` (Docker required) OR
2. A remote Supabase URL + credentials in `.env.local`
3. `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` environment variables

---

## 7. Full Verification

| Command | Result |
|---|---|
| `bash scripts/check-secrets.sh` | ✅ All checks passed |
| `npm test` | ✅ 385 passed (26 files) |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build -w apps/api` | ✅ Build OK |

---

## 8. Blockers

| # | Blocker | Status |
|---|---|---|
| 1 | **No remote Supabase project configured** | `.env.local` points to localhost. Need remote project URL + credentials. |
| 2 | **Docker Desktop not available** | Cannot run `supabase start` for local instance. Container runtime required for local Supabase. |
| 3 | **No Supabase integration tests executed** | 385 offline tests pass but DB-dependent tests (RLS, triggers, RPCs) cannot run without a running Supabase instance. |

---

## 9. Next Recommended Step

To connect Kadarn to a real Supabase project:

### Option A: Local Supabase (Docker required)

```bash
# Install Docker Desktop for Windows
# Then:
supabase start
# This creates local DB with all 25 migrations applied
supabase status  # Verify all services running
npm test         # Run all tests including integration
```

### Option B: Remote Supabase project

```bash
# 1. Get project credentials from Supabase Dashboard
# 2. Update .env.local:
#    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
#    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 3. Link local project to remote:
supabase link --project-ref your-project-ref

# 4. Push migrations:
supabase db push

# 5. Verify:
supabase db remote commit
```

---

## 10. Summary

| Dimension | Result |
|---|---|
| Project connected | ❌ No |
| Migrations applied | ❌ Not applied (no DB to apply to) |
| RLS validated | ✅ Offline (structure) / ❌ Not executed against real DB |
| Triggers validated | ✅ Offline (structure) / ❌ Not executed against real DB |
| RPCs validated | ✅ Offline (structure) / ❌ Not executed against real DB |
| Integration tests | ✅ 385 offline tests pass |
| Secrets leaked | ✅ None |
| **Overall** | **Infrastructure ready, needs Supabase connection to validate** |
