# KADARN v2 — Repository Baseline (Sprint 0)

**Date:** 2026-07-25
**Commit:** `c9e478df4a323530cfa528cf567aaa413f4bc17e`
**Branch:** `master`
**Verification executed:** Fresh for this baseline.

---

## Verification Results

| Check | Command | Result | Detail |
|-------|---------|--------|--------|
| Build | `npm run build` | ✅ | 13.1s, compiled successfully |
| Typecheck | `npm run typecheck` | ✅ | 3 projects (types, instrumentation, api) |
| Unit Tests | `npm run test` | ✅ | 1322 passed, 19 failed (accepted baseline), 39 skipped |
| Test Suites | `npm run test` | ✅ | 75 passed, 8 failed (accepted), 2 skipped |
| Supabase Local | `npx supabase status` | ✅ | Running (auth, db, rest, studio) |
| Docker | `docker ps` | ✅ | 6 containers (supabase stack) |
| Migrations | DB query | ✅ | 55 migrations applied (008–072) |
| DB Tables | DB query | ✅ | ~70 tables present |

## Known Issues (Accepted)

| Issue | Impact | Blocks Sprint 1? |
|-------|--------|-----------------|
| 19 test failures (11 pre-existing + 8 RLS foundation tests) | Tests not "all green" but baseline stable | No |
| Continuity engine not deprecated | Dual code paths for claims | No (plan exists) |
| No feature flags | No way to toggle v2 behavior | No (introduced in Sprint 1) |
| ~35 legacy packages (engines) | Codebase larger than needed | No (deprecation strategy exists) |

## Repository Snapshot

| Metric | Value |
|--------|-------|
| Commit SHA | `c9e478df` |
| Branch | `master` |
| Packages | 33 |
| Apps | 2 |
| Migrations | 55 applied (highest: 072) |
| Database tables | ~70 |
| API route files | ~50 |
| Test files | 85 suites |
| Lines of code | ~80,000 (est.) |
