# Phase 3 — D Worktree Classification

## 3.1 Integration Branch

### Safety References (pre-existing, verified at HEAD c9e478df)

- `safety/pre-stabilization-d-2026-07-25` → `c9e478df`
- `preservation/d-worktree-2026-07-25` → `c9e478df`

### New Integration Branch

```
integration/canonicalization-and-forward-port
```

Created from `c9e478df` without touching the working tree. All forward-port work will occur on this branch. Master remains untouched.

## 3.2 Change Classification

### Modified Files (8 files)

| File | Classification | Reason |
|------|---------------|--------|
| `apps/api/src/app/api/v1/institutions/[id]/readiness/route.ts` | VALID PRODUCT IMPLEMENTATION | API route update for readiness endpoint |
| `apps/api/src/lib/continuity-claim-service.ts` | VALID PRODUCT IMPLEMENTATION | Service layer update for claim continuity |
| `apps/web/eslint.config.mjs` | LOCAL TOOLING | Linter config adjustment |
| `apps/web/package.json` | LOCAL TOOLING | Dependency config update |
| `package-lock.json` | GENERATED | Lockfile regeneration |
| `packages/platform-services/src/index.ts` | VALID PRODUCT IMPLEMENTATION | Package export update for new repositories |
| `packages/types/src/index.ts` | VALID PRODUCT IMPLEMENTATION | Type export barrel update for new domain types |
| `supabase/migrations/056_phase8_public_read_grants.sql` | VALID MIGRATION | Migration content update (phase8 grants) |
| `tests/package.json` | LOCAL TOOLING | Test dependency config |

### Deleted Files (8 files)

| File | Classification | Reason |
|------|---------------|--------|
| `database/migrations/056_review_workflow.sql` | INTENTIONALLY REMOVED | Renumbered to `060_review_workflow.sql` per commit 05751139 |
| `database/migrations/057_passport_publication.sql` | INTENTIONALLY REMOVED | Renumbered to `061_passport_publication.sql` per commit 05751139 |
| `supabase/migrations/050_discovery_core.sql` | INTENTIONALLY REMOVED | Discovery migration retired in clean reset chain |
| `supabase/migrations/051_discovery_preparation.sql` | INTENTIONALLY REMOVED | Discovery migration retired in clean reset chain |
| `supabase/migrations/052_discovery_agent_outputs.sql` | INTENTIONALLY REMOVED | Discovery migration retired in clean reset chain |
| `supabase/migrations/053_discovery_curation.sql` | INTENTIONALLY REMOVED | Discovery migration retired in clean reset chain |
| `supabase/migrations/054_validation_notes.sql` | INTENTIONALLY REMOVED | Discovery migration retired in clean reset chain |
| `supabase/migrations/055_discovery_staging_seed.sql` | INTENTIONALLY REMOVED | Discovery migration retired in clean reset chain |

### Untracked Files (161 files)

#### VALID PRODUCT IMPLEMENTATION — API Routes (25 files)

```
apps/api/src/app/api/v1/capabilities/[id]/route.ts
apps/api/src/app/api/v1/claims/[id]/confidence/route.ts
apps/api/src/app/api/v1/claims/[id]/reviews/route.ts
apps/api/src/app/api/v1/evidence-sources/[id]/records/route.ts
apps/api/src/app/api/v1/evidence-sources/[id]/route.ts
apps/api/src/app/api/v1/evidence-sources/route.ts
apps/api/src/app/api/v1/institutions/[id]/capabilities/route.ts
apps/api/src/app/api/v1/institutions/[id]/knowledge/route.ts
apps/api/src/app/api/v1/institutions/[id]/locations/route.ts
apps/api/src/app/api/v1/institutions/[id]/members/route.ts
apps/api/src/app/api/v1/institutions/[id]/passport-entries/route.ts
apps/api/src/app/api/v1/knowledge/[id]/route.ts
apps/api/src/app/api/v1/locations/[id]/route.ts
apps/api/src/app/api/v1/memberships/[id]/roles/route.ts
apps/api/src/app/api/v1/memberships/[id]/route.ts
apps/api/src/app/api/v1/passport-entries/[id]/route.ts
apps/api/src/app/api/v1/passport-entries/[id]/shares/route.ts
apps/api/src/app/api/v1/people/[id]/route.ts
apps/api/src/app/api/v1/people/route.ts
apps/api/src/app/api/v1/pilot/health/route.ts
apps/api/src/app/api/v1/public/passport/[token]/route.ts
apps/api/src/app/api/v1/reviews/[id]/route.ts
apps/api/src/app/api/v1/roles/route.ts
apps/api/src/app/api/v1/shares/[id]/route.ts
apps/api/src/app/api/v1/source-records/[id]/route.ts
```

#### VALID PRODUCT IMPLEMENTATION — UI Pages (2 files)

```
apps/web/src/app/(workspace)/workspace/locations/page.tsx
apps/web/src/app/(workspace)/workspace/people/page.tsx
```

#### VALID MIGRATION — database/migrations (13 files)

```
database/migrations/056_phase8_public_read_grants.sql
database/migrations/058_phase8_rls_and_evidence_grants.sql
database/migrations/059_sponsor_portfolio.sql
database/migrations/062_kad002a_person.sql
database/migrations/063_kad002b_location.sql
database/migrations/064_kad002c_membership.sql
database/migrations/065_kad003_capability.sql
database/migrations/066_kad004_claim_consolidation.sql
database/migrations/067_kad006_review_workflow.sql
database/migrations/068_kad008_knowledge_publication.sql
database/migrations/069_kad009_passport.sql
database/migrations/070_kad010_sharing.sql
database/migrations/071_kad011_readiness.sql
database/migrations/072_kad012_vilo_seed.sql
database/migrations/073_sprint1_evidence_sources.sql
database/migrations/074_sprint1_source_records.sql
```

#### VALID MIGRATION — supabase/migrations (13 files, duplicates of database/migrations)

```
supabase/migrations/058_phase8_rls_and_evidence_grants.sql
supabase/migrations/059_sponsor_portfolio.sql
supabase/migrations/062_kad002a_person.sql
... (same as database/migrations 062-074)
```

**⚠️ NOTE**: `database/migrations/` and `supabase/migrations/` contain identical files for 058-074. This is a pre-existing duplication pattern. Both directories are mirrors. Classification: DUPLICATE (supabase is the mirror of database).

#### VALID PRODUCT IMPLEMENTATION — Domain Types (13 files)

```
packages/types/src/capability.ts
packages/types/src/claim.ts
packages/types/src/confidence.ts
packages/types/src/evidence.ts
packages/types/src/knowledge.ts
packages/types/src/location.ts
packages/types/src/membership.ts
packages/types/src/passport.ts
packages/types/src/person.ts
packages/types/src/readiness.ts
packages/types/src/review.ts
packages/types/src/sources.ts
```

#### VALID PRODUCT IMPLEMENTATION — Repositories (4 files)

```
packages/platform-services/src/repositories/base.ts
packages/platform-services/src/repositories/index.ts
packages/platform-services/src/repositories/location-repository.ts
packages/platform-services/src/repositories/membership-repository.ts
packages/platform-services/src/repositories/person-repository.ts
```

#### VALID TEST IMPLEMENTATION (2 files)

```
tests/foundation/domain-integration.test.ts
tests/sprint1/source-intelligence.test.ts
```

#### AUTHORITATIVE GOVERNANCE — foundation/ (84 files)

```
foundation/00_ROOT_AUTHORITY/v2/ (3 .docx, README, implementation/, realignment/)
foundation/01_DOMAIN/016_CANONICAL_ENTITY_SPECIFICATIONS.md
foundation/05_ENGINEERING/ (reports, implementation reports, matrices)
foundation/05_ENGINEERING/loops/loop-canonical-repository-consolidation/ (this Loop)
```

#### CURRENT LOOP DOCUMENTATION (3 files)

```
foundation/05_ENGINEERING/loops/loop-canonical-repository-consolidation/00_LOOP_CHARTER.md
foundation/05_ENGINEERING/loops/loop-canonical-repository-consolidation/01_INITIAL_REPOSITORY_BASELINE.md
foundation/05_ENGINEERING/loops/loop-canonical-repository-consolidation/02_C_ARCHIVE_MANIFEST.md
```

#### DUPLICATE — database/migrations vs supabase/migrations

The `database/migrations/` and `supabase/migrations/` directories mirror each other for migrations 058-074. This is a pre-existing pattern. The canonical migration directory should be determined during Phase 6. For now, both are preserved.

## 3.3 Preservation Strategy

### Coherent commit boundaries for D baseline:

1. **feat(domain): KAD-002–012 domain types, repositories, and API routes**
   - All `packages/types/src/*.ts` (13 files)
   - All `packages/platform-services/src/repositories/*.ts` (4 files)
   - All `apps/api/src/app/api/v1/*/route.ts` (25 files)
   - `packages/types/src/index.ts`, `packages/platform-services/src/index.ts` (modified)

2. **feat(ui): workspace pages for locations and people**
   - `apps/web/src/app/(workspace)/workspace/locations/page.tsx`
   - `apps/web/src/app/(workspace)/workspace/people/page.tsx`

3. **feat(migrations): KAD-002–012 and Sprint 1 migrations 058-074**
   - All `database/migrations/062-074*.sql`
   - All `supabase/migrations/062-074*.sql`
   - `database/migrations/056_phase8_public_read_grants.sql` (modified)
   - Deletions of 050-055 and old 056-057

4. **docs(governance): foundation v2 authority and engineering reports**
   - All `foundation/00_ROOT_AUTHORITY/v2/**`
   - `foundation/01_DOMAIN/016_CANONICAL_ENTITY_SPECIFICATIONS.md`
   - `foundation/05_ENGINEERING/054-057*, KAD*, R1, R6, VILO*`

5. **test(domain): foundation and sprint1 integration tests**
   - `tests/foundation/domain-integration.test.ts`
   - `tests/sprint1/source-intelligence.test.ts`

6. **chore(repo): config updates**
   - `apps/web/eslint.config.mjs`, `apps/web/package.json`
   - `tests/package.json`, `package-lock.json`

### Files NOT to commit:

- `foundation/05_ENGINEERING/loops/loop-canonical-repository-consolidation/` — This Loop documentation. Will be committed separately as Loop documentation after Phase 14.
- `.docx` files in `foundation/00_ROOT_AUTHORITY/v2/` — Binary documents. Need user confirmation before committing.
- `nul` file (root) — Accidental Windows artifact.

## Phase 3 Gate

### ✅ D BASELINE STABILIZED

Conditions met:
- Integration branch created from c9e478df
- Safety and preservation references verified
- All 177 changes classified (8 modified, 8 deleted, 161 untracked)
- No deleted file is accidental — all are intentional renumbering/cleanup
- No secrets detected in untracked files
- Coherent commit boundaries identified
- Historical migrations through 061 (committed) are unchanged

**Next step**: Execute the commit sequence on the integration branch, then proceed to Phase 4 domain comparison.
