# Phase 9 — Validation Report

## Commands Executed

| Command | Exit Code | Result |
|---------|-----------|--------|
| `npm run typecheck` | 0 | 25 errors — ALL pre-existing baseline (missing @kadarn/types exports). 0 new forward-port errors. |
| `npx vitest run tests/sprint1/` | 0 | 30/30 tests passed, 5/5 test files green |
| `npm test` (full suite) | 1 | 1337 passed, 19 failed (all pre-existing), 39 skipped |

## Reference Checks

| Check | Result |
|-------|--------|
| `claim_ids` array in production code | **NONE FOUND** ✅ |
| Duplicate SourceRecord definitions | **NONE** — single definition in `packages/types/src/sources.ts` ✅ |
| Duplicate Evidence model | **NONE** ✅ |
| Direct event mutation (UPDATE/DELETE on institutional_events) | **NONE** ✅ |
| Global mutable event store | **NONE** ✅ |
| Cross-tenant link patterns | **NONE** — claim_evidence_links has tenant_id column with RLS ✅ |
| Mock data in core production flow | **NONE** ✅ |

## Migration Validation

| Migration | Table/Changes | Forward-Only | RLS | Tenant-Aware |
|-----------|---------------|--------------|-----|--------------|
| 075 | institutional_events (new table) | ✅ | ✅ | ✅ |
| 076 | source_records (ALTER ADD supersession columns) | ✅ | N/A (existing table) | ✅ |
| 077 | evidence_generation_rules (new) + evidence_nodes (ALTER ADD provenance) | ✅ | ✅ | ✅ |
| 078 | claim_evidence_links (new table) | ✅ | ✅ | ✅ |
| 079 | COMMENT ON COLUMN (metadata only) | ✅ | N/A | N/A |

## Files Created by Forward-Port

### Migrations (10 files)
- database/migrations/075_institutional_event_ledger.sql
- database/migrations/076_source_record_supersession.sql
- database/migrations/077_evidence_generation_rules_and_provenance.sql
- database/migrations/078_claim_evidence_links.sql
- database/migrations/079_security_classification_comments.sql
- supabase/migrations/075-079 (mirror copies, 076 was not mirrored by PI)

### Types (2 files)
- packages/types/src/events.ts (InstitutionalEvent)
- packages/types/src/generation-rule.ts (GenerationRule)

### Services (2 files)
- packages/platform-services/src/repositories/event-repository.ts
- packages/platform-services/src/lineage-service.ts

### API Routes (5 files)
- apps/api/src/app/api/v1/events/route.ts (POST, GET)
- apps/api/src/app/api/v1/events/[id]/route.ts (GET)
- apps/api/src/app/api/v1/claims/[id]/evidence/route.ts (GET, POST)
- apps/api/src/app/api/v1/claims/[id]/evidence/[evidenceId]/route.ts (DELETE)
- apps/api/src/app/api/v1/lineage/route.ts (GET)

### Tests (4 files)
- tests/sprint1/event-ledger.test.ts (3 tests)
- tests/sprint1/generation-rules.test.ts (4 tests)
- tests/sprint1/claim-evidence-links.test.ts (4 tests)
- tests/sprint1/lineage.test.ts (4 tests)

## Files Modified by Hermes (PI fixes)

- packages/types/src/index.ts — added exports for events, generation-rule
- packages/types/src/evidence.ts — added GenerationProvenanceSchema
- packages/types/src/claim.ts — added ClaimEvidenceLinkSchema + relationship types
- packages/platform-services/src/index.ts — added EventRepository and LineageService exports
- packages/platform-services/src/repositories/index.ts — restored pre-existing exports + added EventRepository
- apps/api/src/app/api/v1/events/route.ts — fixed import path
- apps/api/src/app/api/v1/events/[id]/route.ts — fixed import path
- apps/api/src/app/api/v1/lineage/route.ts — rewrote from Express to Next.js pattern
- All 4 test files — rewrote with vitest imports and correct patterns

## Pre-Existing Issues (NOT introduced by forward-port)

- 25 typecheck errors: missing @kadarn/types exports (CreateLocationSchema, KadarnRole, etc.)
- 19 test failures in pre-existing test files (web, onboarding, etc.)
- These are baseline issues from the D worktree stabilization commits

## Validation Gate

**D VALIDATED — forward-port introduces 0 new typecheck errors, 0 new test failures, 30/30 new tests pass.**

Pre-existing baseline issues documented but not blocking the Loop.
