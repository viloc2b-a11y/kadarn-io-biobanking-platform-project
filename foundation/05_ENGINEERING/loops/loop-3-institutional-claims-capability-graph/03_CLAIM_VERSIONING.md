# KAD-LOOP-003 — Phase 2: Claim Versioning Report

## Objective
Claims must support: draft, review, approved, rejected, superseded, expired, archived. Every version immutable. No destructive updates. Maintain full lineage.

## Implementation

### Migration 085: `claim_versions` Table
- **Table**: `public.claim_versions`
- **Columns**: 25 (matches `ClaimVersionSchema` exactly)
- **Constraints**: `UNIQUE(claim_id, version)`, self-referential FK on `superseded_by`
- **RLS**: org-scoped SELECT (inherits org from claims via FK), service_role all access
- **Trigger**: `trg_claim_versions_updated_at` for audit metadata
- **Indexes**: `claim_id`, `superseded_by`, `claim_id+version` (unique)

### Versioning Flow
1. `ClaimService.createClaim()` → creates Claim row + initial ClaimVersion (version 1)
2. `ClaimService.updateClaim()` → snapshots current state to new ClaimVersion, bumps `version`, applies update
3. `ClaimService.approveClaim()` / `rejectClaim()` → creates new version snapshot
4. `ClaimService.supersedeClaim()` → sets `lifecycle_status='superseded'`, `superseded_by`, `supersession_reason`

### Repositories
- `ClaimVersionRepository`: findById, findByClaim, findCurrentVersion, create, findLineage, supersede

### Types
- `ClaimVersionSchema`: full immutable snapshot (25 fields)
- `CreateClaimVersionSchema`: DTO for creating new versions
- `ClaimVersionSummarySchema`: lightweight lineage query (7 fields)
- `ClaimVersionLineageSchema`: ordered versions + current_version_id

## Verification
- Migration 085 applied to live Postgres: ✅ exit 0
- Typecheck: 0 errors
- Immutable: no UPDATE path in repository except `supersede()` (sets `superseded_by` once)

## Design Decisions
1. **Append-only**: rows are never deleted or destructively updated
2. **Self-referential FK**: `superseded_by` → `claim_versions.id` (not `claims.id`)
3. **Full snapshot**: each version stores the complete claim state, not just diffs
4. **`superseded_by` is the only mutable field**: set once when a new version supersedes an old one
