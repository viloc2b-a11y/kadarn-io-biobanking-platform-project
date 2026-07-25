# KAD-LOOP-003 — Phase 0: Current State Review

**Branch:** `feat/loop-3-claims` (from master `a9ef10a`)
**Migration head:** 080
**Date:** 2026-07-25
**Scope:** Phase 0 of KAD-LOOP-003 (Institutional Claims & Capability Graph)

---

## 1. Claims

### DB Schema
- **Created by:** `045_evidence_core.sql` (canonical `public.claims` table)
- **Consolidated by:** `066_kad004_claim_consolidation.sql` (adds `person_id`, `tags`, `evidence_count`; deprecates legacy `continuity_experience_claims`)
- **Table:** `public.claims`
- **Columns (045):** `id`, `claim_type_id` (TEXT), `name`, `description`, `organization_id` (FK→organizations), `status` (`claim_status` enum), `domain`, `decays`, `decay_period_months`, `valid_evidence_classes` (`evidence_class[]`), `required_evidence_classes` (`evidence_class[]`), `created_by_actor_id`, `created_by_org_id`, `correlation_id`, `provenance_summary`, `source_event_id`, `owning_org_id`, `visibility_scope`, `authorized_sponsor_ids` (UUID[]), `created_at`, `updated_at`
- **Columns added (060):** `workflow_state` (`workflow_state` enum, default `'draft'`)
- **Columns added (066):** `person_id` (FK→people, ON DELETE SET NULL), `tags` (TEXT), `evidence_count` (INT default 0)
- **Enums:**
  - `claim_status` (045): `active`, `archived`, `deprecated`
  - `workflow_state` (060): `draft`, `declared`, `pending_evidence`, `under_review`, `published`, `disputed`, `archived`
- **Constraints:** `claim_valid_classes` (valid_evidence_classes non-empty), `claim_decay_consistent`
- **RLS:** ENABLED (045) — `claims_select_org`, `claims_select_sponsor`, `claims_select_system`, `claims_insert_org`, `claims_update_org`
- **Legacy table (DEPRECATED):** `public.continuity_experience_claims` (043) — separate schema. Kept for backward compat.

### Types
- **File:** `packages/types/src/claim.ts` (89 lines)
- **Schemas:** `ClaimSchema` (12 fields), `CreateClaimSchema` (7 fields), `UpdateClaimSchema`, `ClaimEvidenceLinkSchema`, `ClaimEvidenceRelationshipType` enum
- **Enums:** `ClaimStatus` (7 values: self_reported/evidence_submitted/reference_pending/reference_confirmed/kadarn_verified/rejected/expired — **DIVERGES from DB `claim_status` enum**), `ClaimEvidenceRelationshipType` (5 values: SUPPORTS/PARTIALLY_SUPPORTS/CONTRADICTS/REQUIRES_REVIEW/OBSOLETES)
- **Type alias:** `ClaimLegacyType` (7 values) — deprecated

### Repository
- **NOT present.** No `claim-repository.ts` exists.

### Service
- `apps/api/src/lib/continuity-claim-service.ts` — legacy continuity claim service. **Operates on legacy `continuity_experience_claims` table, NOT canonical `claims`.**
- `apps/api/src/lib/sponsor-passport/adapter/map-claim.ts` — mapping functions for passport view

### API Routes
- `/api/v1/claims/[id]/evidence` — GET, POST (stub, 10 lines)
- `/api/v1/claims/[id]/evidence/[evidenceId]` — stub
- `/api/v1/claims/[id]/reviews` — stub
- `/api/v1/claims/[id]/confidence` — stub
- `/api/v1/evidence-core/claims` — GET, POST (92 lines, real impl)
- `/api/v1/evidence-core/claims/[id]` — route exists
- `/api/v1/evidence-lineage/claims/[id]/provenance` — route exists
- `/api/v1/continuity/claims` — legacy continuity claims routes
- **NOTE:** No top-level `/api/v1/claims` collection route (POST/GET list).

### UI Pages
- No dedicated claims page. Claims appear within continuity and sponsor passport pages.

### Tests
- `tests/sprint1/claim-evidence-links.test.ts` — 5 tests
- `tests/api/sponsor-passport-claims.test.ts` — 6 tests
- `tests/institutional-knowledge/claim-review-pipeline.test.ts` — 46 tests
- `tests/integration/evidence-core-idor.test.ts` — 14 tests

---

## 2. Evidence

### DB Schema
- **Created by:** `045_evidence_core.sql` (parts 4–7)
- **Extended by:** 073, 074, 077, 080
- **Tables:** `evidence_nodes` (append-only), `evidence_relationships`, `right_of_response`, `confidence_state_snapshots`, `evidence_class_ref`
- **Enums:** `evidence_class` (A-F), `evidence_node_status` (4), `evidence_relationship_type` (5), `confidence_level`, `visibility_scope`
- **RLS:** ENABLED on all evidence tables

### Types
- **File:** `packages/types/src/evidence.ts` (168 lines)
- **Schemas:** `EvidenceSchema` (17 fields), `EvidenceClassEnum` (A-F), `EvidenceLifecycleStatus` (10 states, added LOOP-2), `GenerateEvidenceSchema`, `ReplayResultSchema`, `LineageChainSchema`

### Repository
- `EvidenceSourceRepository`, `SourceRecordRepository`, `GenerationRuleRepository` — all exist (LOOP-2)
- **No `EvidenceNodeRepository`** for the canonical `evidence_nodes` table.

### Service
- `generation-pipeline-service.ts` (12KB) — evidence generation
- `lineage-service-impl.ts` (10KB) — lineage traversal

### API Routes
- `/api/v1/evidence/generate` — POST (real impl)
- `/api/v1/evidence/[id]/lineage` — GET
- `/api/v1/evidence/[id]/replay` — POST
- `/api/v1/evidence-core/evidence` — GET, POST

### Tests
- `tests/sprint2/evidence-foundation.test.ts` — 26 tests
- `tests/sprint1/lineage.test.ts` — 5 tests
- `tests/sprint1/source-intelligence.test.ts` — 15 tests
- `tests/sprint1/generation-rules.test.ts` — 4 tests

---

## 3. Review

### DB Schema
- **Created by:** `060_review_workflow.sql`
- **Extended by:** `080_evidence_lifecycle_and_governance.sql`
- **Tables:** `review_tasks`, `claim_workflow`
- **Enums:** `review_task_type` (6), `review_task_status` (5), `workflow_state` (7)
- **RLS:** ENABLED — `review_tasks_org_access`, `claim_workflow_org_access`

### Types
- **File:** `packages/types/src/review.ts` (68 lines)
- **Schemas:** `ReviewSchema` (14 fields), `CreateReviewSchema`, `UpdateReviewSchema`
- **Enums:** `ReviewTaskType` (6), `ReviewTaskStatus` (5), `ReviewDecision` (4)
- **LOOP-2 fields:** `review_outcome`, `required_actions`, `evidence_snapshot`

### Repository
- **NOT present.** No `review-repository.ts`.

### Service
- No dedicated review service. Review logic embedded in legacy `continuity-claim-service.ts`.

### API Routes
- `/api/v1/reviews/[id]` — GET, PATCH (43 lines, real impl)
- `/api/v1/review/tasks` — route exists
- `/api/v1/claims/[id]/reviews` — stub

### Tests
- `tests/institutional-knowledge/claim-review-pipeline.test.ts` — 46 tests

---

## 4. Institution (mapped to `organizations`)

### DB Schema
- **Created by:** `008_organizations_capabilities.sql`
- **Table:** `public.organizations` (22 columns)
- **RLS:** Foundation in `009_rls_foundation.sql`
- **NOTE:** No `institutions` table. "Institution" = domain concept mapped to `organizations`.

### Types
- **No dedicated `institution.ts` or `organization.ts`.** Implicit via `organization_id` fields.

### Repository
- **NOT present.**

### API Routes
- `/api/v1/institution/profile` — GET
- `/api/v1/institutions/[id]/capabilities` — GET, POST
- `/api/v1/institutions/[id]/locations` — route exists
- `/api/v1/institutions/[id]/members` — route exists
- `/api/v1/institutions/[id]/knowledge` — route exists

### UI Pages
- `apps/web/src/app/(onboarding)/onboarding/organization/page.tsx`
- `apps/web/src/app/(workspace)/workspace/profile/page.tsx`

---

## 5. Location

### DB Schema
- **Created by:** `063_kad002b_location.sql`
- **Table:** `public.locations` (16 columns)
- **Enums:** `location_type` (8), `location_status` (4)
- **RLS:** ENABLED

### Types
- **File:** `packages/types/src/location.ts` (61 lines)
- **Schemas:** `LocationSchema`, `CreateLocationSchema`, `UpdateLocationSchema`

### Repository
- `LocationRepository` — `findById`, `findByInstitution`, `create`, `update`, `softDelete`

### API Routes
- `/api/v1/locations/[id]` — GET, PATCH, DELETE
- `/api/v1/institutions/[id]/locations` — route exists

### UI Pages
- `apps/web/src/app/(workspace)/workspace/locations/page.tsx`

---

## 6. People (Persons)

### DB Schema
- **Created by:** `062_kad002a_person.sql`
- **Table:** `public.people` (13 columns)
- **Enums:** `person_status` (4), `person_role_type` (8)
- **RLS:** ENABLED

### Types
- **File:** `packages/types/src/person.ts` (47 lines)
- **Schemas:** `PersonSchema`, `CreatePersonSchema`, `UpdatePersonSchema`

### Repository
- `PersonRepository` — `findById`, `findByEmail`, `findAll`, `create`, `update`, `softDelete`

### API Routes
- `/api/v1/people` — GET, POST
- `/api/v1/people/[id]` — route exists

### UI Pages
- `apps/web/src/app/(onboarding)/onboarding/people/page.tsx`
- `apps/web/src/app/(workspace)/workspace/people/page.tsx`

---

## 7. Membership

### DB Schema
- **Created by:** `008` (part 6), extended by `064_kad002c_membership.sql`
- **Table:** `public.organization_memberships` (20 columns)
- **Enum:** `membership_status` (5)
- **Junction:** `membership_roles` (M2M membership↔role)
- **RLS:** Foundation in `009_rls_foundation.sql`

### Types
- **File:** `packages/types/src/membership.ts` (117 lines)
- **Schemas:** `MembershipSchema`, `RoleSchema`, `RoleAssignmentSchema`
- **Enums:** `MembershipStatus` (5), `RoleScope` (3), `KadarnRole` (6)

### Repository
- `MembershipRepository` — `findById`, `findByOrganization`, `create`, `update`, `terminate`, `getRoles`, `assignRole`, `removeRole`, `listRoles`

### API Routes
- `/api/v1/memberships/[id]` — GET, PATCH, DELETE
- `/api/v1/memberships/[id]/roles` — route exists
- `/api/v1/roles` — GET

### UI Pages
- `apps/web/src/app/(workspace)/settings/members/page.tsx`

---

## 8. Role

### DB Schema
- **Created by:** `008` (part 5), extended by `064`
- **Table:** `public.organization_roles`
- **Seeded roles:** org_admin, org_member, site_pi, site_coordinator, reviewer, sponsor_viewer

### Types
- Co-located in `packages/types/src/membership.ts`
- `RoleSchema` (5 fields), `RoleScope` (3), `KadarnRole` (6)

### Repository
- Co-located in `MembershipRepository`

### API Routes
- `/api/v1/roles` — GET

---

## 9. Capability

### DB Schema
- **Created by:** `065_kad003_capability.sql`
- **Table:** `public.capabilities` (13 columns)
- **Enum:** `capability_status` (6: declared/evidence_submitted/under_review/verified/published/deprecated)
- **Constraints:** `uq_capability_org_type` UNIQUE(organization_id, capability_type_id)
- **RLS:** ENABLED
- **Legacy M2M (008):** `organization_capabilities` — OLD capability model. `065` introduces the DERIVED capability entity backed by claims.
- **CRITICAL:** No `capability_claims` join table. Link is 1:1 via `capabilities.primary_claim_id` FK only.

### Types
- **File:** `packages/types/src/capability.ts` (50 lines)
- **Schemas:** `InstitutionCapabilitySchema` (12 fields), `CreateInstitutionCapabilitySchema`, `UpdateInstitutionCapabilitySchema`
- **Enums:** `InstitutionCapabilityStatus` (6 — matches DB)

### Repository
- **NOT present.** No `capability-repository.ts`.

### Service
- `apps/api/src/lib/sponsor-passport/adapter/map-capability.ts` — mapping functions only

### API Routes
- `/api/v1/capabilities/[id]` — GET, PATCH, DELETE (91 lines, real impl)
- `/api/v1/institutions/[id]/capabilities` — GET, POST
- `/api/v1/organizations/[id]/capabilities` — GET, POST (legacy M2M)
- **NOTE:** No `/api/v1/capabilities` collection route at top level.

### UI Pages
- `apps/web/src/app/(onboarding)/onboarding/capabilities/page.tsx` (onboarding selection only)

### Tests
- `tests/institutional-knowledge/research-capability.test.ts` — 15 tests

---

## Cross-Cutting Findings

### claim_evidence_links Table
- **EXISTS** — created by `078_claim_evidence_links.sql`
- **Schema:** `claim_id`, `evidence_id` (FK→evidence_nodes), `relationship_type` (CHECK: 5 values), `tenant_id`, `created_at`, `created_by`, `rationale`, `provenance`. PK(claim_id, evidence_id)
- **RLS:** **NOT ENABLED** — security gap

### capability_claims Join Table
- **DOES NOT EXIST.** Only 1:1 via `capabilities.primary_claim_id`.

### Enum Divergence Summary

| Enum | Migration | Values |
|------|-----------|--------|
| `claim_status` (DB) | 045 | active, archived, deprecated |
| `workflow_state` (DB) | 060 | draft, declared, pending_evidence, under_review, published, disputed, archived |
| `ClaimStatus` (TS) | claim.ts | self_reported, evidence_submitted, reference_pending, reference_confirmed, kadarn_verified, rejected, expired |
| `capability_status` (DB) | 065 | declared, evidence_submitted, under_review, verified, published, deprecated |

**CRITICAL:** TS `ClaimStatus` (7 workflow values) ≠ DB `claim_status` (3 values). TS `ClaimStatus` mirrors legacy `continuity_claim_verification_status`. Must be reconciled.

---

## Gap Analysis — 16 Gaps for LOOP-3

### Critical
1. **No ClaimRepository** — canonical `claims` table has no repository layer
2. **No CapabilityRepository** — `capabilities` table has no repository layer
3. **No ReviewRepository** — `review_tasks` table has no repository layer
4. **No InstitutionRepository** — no repository for `organizations`
5. **TS/DB enum divergence** — `ClaimStatus` TS ≠ `claim_status` DB
6. **No `claim_types` reference table** — `claims.claim_type_id` is free TEXT
7. **No capability_claims M2M join** — only 1:1 via `primary_claim_id`
8. **claim_evidence_links has no RLS** — security gap
9. **No top-level collection routes** — missing POST/GET for /claims, /capabilities, /reviews
10. **6 stub API routes** under `claims/[id]/` — `// Implementation here`
11. **No Claim/Capability/Review services** in platform-services
12. **No UI pages** for claims/capabilities/reviews
13. **No dedicated repository tests**

### Minor
14. **No `institution.ts` types file**
15. **Legacy dual-model ambiguity** — two capability models coexist (008 M2M vs 065 derived)
16. **No `EvidenceNodeRepository`** for core `evidence_nodes` table

---

## Migration Impact — Migrations 081+ Needed

| Migration | Purpose |
|-----------|---------|
| 081 | Claim type catalog (`claim_types` reference table) |
| 082 | Capability-Claim M2M join (`capability_claims`) |
| 083 | Claim schema extensions (category, scope, priority, version, owner, lifecycle, expiration, supersession) |
| 084 | claim_evidence_links RLS enable + policies |
| 085 | Claim versioning (immutable versions, lineage) |
| 086 | Capability extensions (evidence_sufficiency, claim_count, review_status, confidence_placeholder) |
| 087 | Knowledge graph support (indexes, materialized views if needed) |

**Total: 5-7 new migrations (081-087)**
