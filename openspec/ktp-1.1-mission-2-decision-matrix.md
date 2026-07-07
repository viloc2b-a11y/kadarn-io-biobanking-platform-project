# KTP-1.1 — Mission 2: Decision Matrix + Domain Model & Schema

> **Date:** 2026-07-06
> **Reviewer:** R0-E Engineering Advisor (read-only, 4-lens engineering review)
> **Status:** COMPLETE
> **Verdict:** PROCEED — All 4 ambiguities resolved. Domain model ready for migrations 052–054.

---

## Phase 1: Decision Matrix — Resolved Ambiguities

### AMB-1: programs.created_by_organization_id IS NOT NULL constraint blocks system-seeded templates

| Field | Detail |
|-------|--------|
| **Ambiguity ID** | AMB-1 |
| **Decision** | **Option (b): Relax constraint to allow NULL for program_type containing readiness variants, with application-layer validation.** |
| **Rationale** | The `CHECK (created_by_organization_id IS NOT NULL) NOT VALID` at `database/migrations/010_audit_programs.sql:167` was designed when every program had a creator org. Program Types are system-seeded templates — they have no natural creator org. Semantically, NULL is correct for templates. A system organization (option a) introduces a fake organization into the RLS model that every org_admin could theoretically administer, creating a security boundary risk. The constraint is already NOT VALID (existing rows are not validated), which signals it was never a hard invariant. Application-layer validation enforces: IF program_type[] does NOT contain any `readiness_*` value THEN `created_by_organization_id` IS REQUIRED. |
| **Impacted files** | `database/migrations/010_audit_programs.sql:167` — constraint to modify. Application service that creates programs — add validation logic. RLS policy `program_participants_insert` — references `p.created_by_organization_id` for first-participant rule; this path is only hit for program INSTANCES (which will always have a creator org), never templates. |
| **Schema implications** | Drop constraint `programs_created_by_org_required`. Enforce at application layer. Simpler than CHECK constraints on array membership. |
| **Migration implications** | Migration 052 should include: `ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_created_by_org_required;`. |
| **Risks** | Application-layer validation gap: a non-template program bypassing the application layer could have NULL `created_by_organization_id`. Mitigation: add DB trigger in hardening mission (post-Mission 2). |
| **Validation criteria** | (1) Seed readiness template with `created_by_organization_id = NULL` and `program_type[] = '{readiness_biospecimen_collection}'` — must succeed. (2) Non-readiness program with NULL creator org rejected by application. (3) RLS policies on programs table still function correctly for template rows. |

---

### AMB-2: program_type TEXT[] lacks referential integrity

| Field | Detail |
|-------|--------|
| **Ambiguity ID** | AMB-2 |
| **Decision** | **Option (d): Hybrid — application-layer validation now, trigger hardening later.** |

| **Rationale** | PostgreSQL has no native per-element FK constraint on arrays, and a single `program_type_id` FK would prevent multi-type classification — which is essential: a program can be both `readiness_biospecimen_collection` AND `retrospective_study`. Application-layer validation against `program_type_taxonomy` is the pragmatic start. A DB trigger (option b) is deferred to a hardening mission after `program_type_taxonomy` table is stable. The trigger would unnest `NEW.program_type`, validate each element against `program_type_taxonomy.type_key`, and reject on mismatch. |
| **Impacted files** | `database/migrations/010_audit_programs.sql:134` — `program_type TEXT[] DEFAULT '{}'` (no change needed). New: application service that creates/updates programs must validate `program_type[]` against taxonomy. New: `database/migrations/052_program_type_taxonomy.sql`. Future: trigger function `validate_program_types()`. |
| **Schema implications** | `program_type_taxonomy.type_key TEXT NOT NULL UNIQUE` becomes the controlled vocabulary. No constraint change on `programs.program_type[]`. Consistency enforced by application + future trigger. |
| **Migration implications** | Migration 052 must: (1) Create `program_type_taxonomy` table, (2) Seed with all existing `program_type` values via `SELECT DISTINCT unnest(program_type) FROM programs`, (3) Add the 3 readiness types. |
| **Risks** | Until trigger deployed, direct DB insert with invalid program_type is possible — gated by RLS (admin-only). Taxonomy drift: new values added to programs before taxonomy — mitigated by application validation reading from taxonomy on every create/update. |
| **Validation criteria** | (1) All existing program_type values exist in taxonomy after seed. (2) Application rejects programs with types not in taxonomy. (3) Existing programs retain their values unchanged. |

---

### AMB-3: evaluateClaim() may violate ADR-011 Evidence Core boundary

| Field | Detail |
|-------|--------|
| **Ambiguity ID** | AMB-3 |
| **Decision** | **Option (a): Move evaluateClaim() and evaluateEvidenceGraph() to a new readiness-engine package. Keep backward-compatible re-export in evidence-core for one mission cycle, marked `@deprecated`.** |

| **Rationale** | This is the most architecturally significant ambiguity. ADR-011's Boundary Principle states: *"If there is any reasonable doubt about whether a function interprets, infers, or modifies the meaning of evidence, that function does NOT belong to the Evidence Core."* The ADR-011 examples table explicitly lists "Resolve Confidence Value (0-100) from graph → Engine. Interprets evidence meaning." `evaluateClaim()` does exactly this: it runs 6 evaluators (EvidenceClassEvaluator, RelationshipEvaluator, CounterEvidenceEvaluator, TemporalEvaluator, RightOfResponseEvaluator, VisibilityEvaluator) against the evidence graph and produces a `ConfidenceReport` with a computed `confidenceValue` (0-100) and `confidenceLevel`. This IS content interpretation — converting raw evidence attributes into a synthesized confidence score. The function is NOT registered as a Core function in `boundary.ts` (only `createClaim`, `submitEvidence`, `submitCounterEvidence`, `submitRightOfResponse`, `linkEvidenceToClaim`, `updateProcessState` are registered). Moving it to `readiness-engine` resolves the boundary and positions confidence computation as the bridge between Evidence Core (storage) and Readiness Evaluation (aggregation). |
| **Impacted files** | `packages/evidence-core/src/output.ts` → moves to `packages/readiness-engine/src/`. `packages/evidence-core/src/evaluation.ts` — `EvaluationPipeline`, `aggregateContributions`, `projectConfidence` also move. `packages/evidence-core/src/evaluators.ts` — all 6 evaluators move. `packages/evidence-core/src/index.ts` — add `@deprecated` re-exports. NEW: `packages/readiness-engine/src/` — package created. |
| **Schema implications** | None. Pure code boundary change. `confidence_state_snapshots` table stays as Core — it stores snapshots, not computes them. |
| **Migration implications** | No database migration. Code migration: consumers of `evaluateClaim` should import from `@kadarn/readiness-engine` instead of `@kadarn/evidence-core`. |
| **Risks** | (1) Breaking change for consumers — mitigated by `@deprecated` re-export for one mission cycle. (2) `readiness-engine` must depend on `evidence-core` for graph traversal — this is correct, engines consume Core. (3) Circular dependency risk — verified: evidence-core has no imports from engines. |
| **Validation criteria** | (1) All imports of `evaluateClaim` use new package or deprecated re-export. (2) `FORBIDDEN_CORE_OPERATIONS` list updated to include `evaluateClaim`. (3) New package passes `tsc --noEmit`. (4) Existing tests pass from new location. |

---

### AMB-4: Readiness threshold per Program Type must be data-driven

| Field | Detail |
|-------|--------|
| **Ambiguity ID** | AMB-4 |
| **Decision** | **Option (a): program_type_taxonomy.readiness_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.75.** |

| **Rationale** | The readiness threshold is a property of the Program Type, not the Program Instance. Putting it in `program_type_taxonomy` co-locates it with the type definition. `programs.metadata` JSONB (option b) has downsides: harder to query, no type safety, no DEFAULT, no NOT NULL enforcement. A separate `readiness_config` table (option c) is over-normalized for a single threshold. Hardcoding (option d) defeats the purpose of data-driven readiness. Default 0.75 balances rigor with achievability: programs can be more demanding (IVD Validation at 0.85) or more accessible (Biospecimen Collection at 0.70). |
| **Impacted files** | `database/migrations/052_program_type_taxonomy.sql` — includes `readiness_threshold` column. Readiness evaluation logic reads threshold from taxonomy, not from a constant. |
| **Schema implications** | `program_type_taxonomy.readiness_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.75` with `CHECK (readiness_threshold >= 0.00 AND readiness_threshold <= 1.00)`. |
| **Risks** | (1) Threshold too high → institutions perpetually Not Ready. Default 0.75 is moderate. (2) Threshold too low → low-quality institutions appear Ready. Evidence class weighting (A-F) ensures quality differentiation. (3) Changing thresholds invalidates cached evaluations — `computed_at` and `evidence_graph_correlation_id` enable cache invalidation. |
| **Validation criteria** | (1) All readiness types have a threshold in taxonomy. (2) Evaluation function reads threshold from taxonomy. (3) Changing threshold causes next evaluation to use new value. |

---

## Phase 2: Domain Model & Schema Plan

### Domain Model Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW ENTITIES (Migrations 052–054)              │
│                                                                   │
│  program_type_taxonomy (052)                                      │
│  ├── id, type_key (UNIQUE), name, category                       │
│  ├── readiness_threshold NUMERIC(3,2) DEFAULT 0.75               │
│  └── Network-visible reference data                               │
│        │                                                          │
│        │ 1:N (type_key referenced by programs.program_type[])     │
│        │ 1:N (program_type_id FK from capability requirements)    │
│        ▼                                                          │
│  readiness_capability_requirements (053)                          │
│  ├── program_type_id FK → program_type_taxonomy                  │
│  ├── capability_type_id FK → organization_capability_types (008) │
│  ├── is_mandatory BOOLEAN DEFAULT true                           │
│  ├── minimum_confidence NUMERIC(3,2) (per-cap override)          │
│  └── UNIQUE(program_type_id, capability_type_id)                 │
│        │                                                          │
│        │ 1:N                                                      │
│        ▼                                                          │
│  readiness_evidence_requirements (053)                            │
│  ├── capability_requirement_id FK                                │
│  ├── evidence_class ENUM (A-F, matches 045)                      │
│  ├── is_mandatory BOOLEAN, minimum_count INTEGER                 │
│  └── UNIQUE(capability_requirement_id, evidence_class)           │
│                                                                   │
│  readiness_evaluations (054)                                      │
│  ├── organization_id FK → organizations (008)                    │
│  ├── program_id FK → programs (010) — the template               │
│  ├── program_type_id FK → program_type_taxonomy (052)            │
│  ├── readiness_status ENUM (not_ready/partial/                   │
│  │       conditionally_ready/ready)                              │
│  ├── overall_confidence NUMERIC(3,2) — derived, not stored       │
│  ├── visibility_scope ENUM DEFAULT 'organization'                │
│  ├── evaluation_snapshot JSONB (cache, DERIVED)                  │
│  ├── computed_at, evidence_graph_correlation_id                  │
│  └── Audit trigger on every status change                        │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural principles:**

1. **Readiness is DERIVED** — `evaluation_snapshot` caches a computation result. Canonical readiness is always recomputed from evidence. Snapshot includes `computed_at` and `evidence_graph_correlation_id` for cache invalidation.
2. **Program Type taxonomy is network-visible** — shared reference data, not tenant-isolated.
3. **Capability requirements reference existing vocabulary** — FK to `organization_capability_types` reuses the 12 seeded types.
4. **Evidence requirements match existing classification** — `evidence_class` uses the enum from migration 045 (A-F).
5. **Evaluations are organization-scoped by default** — institution controls publication via `visibility_scope`.

---

### Migration 052: program_type_taxonomy

**Table Schema:**

| Column | Type | Constraint | Purpose |
|--------|------|------------|---------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `type_key` | TEXT | NOT NULL, UNIQUE | Stable identifier, e.g. `readiness_biospecimen_collection` |
| `name` | TEXT | NOT NULL | Human-readable label |
| `description` | TEXT | — | What this program type represents |
| `category` | TEXT | NOT NULL | `readiness`, `execution`, `regulatory` |
| `readiness_threshold` | NUMERIC(3,2) | NOT NULL, DEFAULT 0.75, CHECK (>=0 AND <=1) | AMB-4 |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete |
| `display_order` | INTEGER | NOT NULL, DEFAULT 0 | UI ordering |
| `metadata` | JSONB | DEFAULT '{}' | Extension point |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:** `idx_program_type_taxonomy_category` on (category), `idx_program_type_taxonomy_active` on (is_active).

**Trigger:** `updated_at` trigger — `BEFORE UPDATE ... EXECUTE FUNCTION update_updated_at_column()`.

**Seed Data:**

| type_key | name | category | readiness_threshold |
|----------|------|----------|---------------------|
| `readiness_biospecimen_collection` | Prospective Biospecimen Collection Readiness | readiness | 0.70 |
| `readiness_ivd_validation` | IVD Clinical Validation Readiness | readiness | 0.85 |
| `readiness_biobanking` | Biobanking Operations Readiness | readiness | 0.75 |

Plus: backfill ALL existing `program_type[]` values from the `programs` table into taxonomy with `category = 'execution'` and default threshold.

**RLS Policies:** SELECT for all authenticated users (reference data). INSERT/UPDATE/DELETE gated by platform admin (temporary: any org_admin until platform_admin role is created in Mission 3). Network-visible, not tenant-isolated.

**AMB-4 resolved:** `readiness_threshold` column on this table makes thresholds data-driven.

---

### Migration 053: readiness_capability_requirements + readiness_evidence_requirements

#### readiness_capability_requirements

| Column | Type | Constraint |
|--------|------|------------|
| `id` | UUID | PK |
| `program_type_id` | UUID | FK → program_type_taxonomy(id) ON DELETE CASCADE |
| `capability_type_id` | UUID | FK → organization_capability_types(id) ON DELETE RESTRICT |
| `is_mandatory` | BOOLEAN | NOT NULL DEFAULT true |
| `minimum_confidence` | NUMERIC(3,2) | Optional per-capability threshold override |
| `description` | TEXT | — |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 |
| `metadata` | JSONB | DEFAULT '{}' |
| `created_at`, `updated_at` | TIMESTAMPTZ | Standard |

**UNIQUE:** `(program_type_id, capability_type_id)`.

#### readiness_evidence_requirements

| Column | Type | Constraint |
|--------|------|------------|
| `id` | UUID | PK |
| `capability_requirement_id` | UUID | FK → readiness_capability_requirements(id) ON DELETE CASCADE |
| `evidence_class` | evidence_class | NOT NULL (A-F, matches 045) |
| `is_mandatory` | BOOLEAN | NOT NULL DEFAULT true |
| `minimum_count` | INTEGER | NOT NULL DEFAULT 1 |
| `description` | TEXT | — |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 |
| `metadata` | JSONB | DEFAULT '{}' |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |

**UNIQUE:** `(capability_requirement_id, evidence_class)`.

**RLS Policies (both tables):** SELECT for all authenticated (reference data). INSERT/UPDATE/DELETE for platform admins (same temporary gate as taxonomy).

---

### Migration 054: readiness_evaluations

**New Enum:**

```sql
DO $$ BEGIN
    CREATE TYPE readiness_status AS ENUM (
        'not_ready', 'partial', 'conditionally_ready', 'ready'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

**Table Schema:**

| Column | Type | Constraint | Purpose |
|--------|------|------------|---------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `organization_id` | UUID | FK → organizations(id) ON DELETE CASCADE | Which institution |
| `program_id` | UUID | FK → programs(id) ON DELETE CASCADE | Which template (Program Type as programs row) |
| `program_type_id` | UUID | FK → program_type_taxonomy(id) ON DELETE RESTRICT | Redundant but enables direct taxonomy queries |
| `readiness_status` | readiness_status | NOT NULL DEFAULT 'not_ready' | Current readiness |
| `overall_confidence` | NUMERIC(3,2) | — | 0.00-1.00, derived at evaluation time |
| `visibility_scope` | visibility_scope | NOT NULL DEFAULT 'organization' | Who can see this evaluation |
| `evaluation_snapshot` | JSONB | — | Cached evaluation (DERIVED, not source of truth) |
| `computed_at` | TIMESTAMPTZ | — | When snapshot was computed |
| `evidence_graph_correlation_id` | TEXT | — | Links to evidence graph state used |
| `metadata` | JSONB | DEFAULT '{}' | Extension point |
| `created_by` | UUID | NOT NULL | Auth user who triggered evaluation |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `idx_readiness_evals_org` on (organization_id, program_type_id, readiness_status)
- `idx_readiness_evals_program` on (program_id, readiness_status)
- `idx_readiness_evals_visibility` on (visibility_scope) WHERE visibility_scope = 'network'
- `idx_readiness_evals_confidence` on (overall_confidence) WHERE overall_confidence IS NOT NULL

**UNIQUE:** `(organization_id, program_type_id)` — one evaluation per institution per program type. Re-evaluations UPDATE the existing row.

**Triggers:**
1. `updated_at` trigger — standard.
2. Audit trigger — `AFTER INSERT OR UPDATE ... EXECUTE FUNCTION audit_table_trigger()` — emits audit event on every status change with old_values/new_values showing the transition.

**RLS Policies:**

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `readiness_evals_select_org` | `public.is_org_member(organization_id)` |
| SELECT | `readiness_evals_select_network` | `visibility_scope = 'network' AND auth.role() = 'authenticated'` |
| INSERT | `readiness_evals_insert` | `public.is_org_admin(organization_id) AND created_by = auth.uid()` |
| UPDATE | `readiness_evals_update` | `public.is_org_admin(organization_id)` |
| DELETE | `readiness_evals_delete` | `public.is_org_admin(organization_id)` |

**Audit resource type extension:**
```sql
DO $$ BEGIN
    ALTER TYPE audit_resource_type ADD VALUE 'readiness_evaluation';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```
Update `audit_table_trigger()` CASE mapping to include `'readiness_evaluations' → 'readiness_evaluation'`.

---

### Domain Events Registry Update

Add to `packages/domain-events/src/index.ts`:

**New Event Payloads:**

```typescript
export interface ReadinessEvaluationStartedPayload {
  evaluationId: string;
  organizationId: string;
  programId: string;
  programTypeKey: string;
  triggeredBy: string;
}

export interface ReadinessEvaluationCompletedPayload {
  evaluationId: string;
  organizationId: string;
  programId: string;
  programTypeKey: string;
  previousStatus: string | null;
  newStatus: string;
  overallConfidence: number;
  mandatoryCapsMet: number;
  mandatoryCapsTotal: number;
  optionalCapsMet: number;
  optionalCapsTotal: number;
  evaluatedAt: string;
}

export interface ReadinessEvaluationPublishedPayload {
  evaluationId: string;
  organizationId: string;
  programId: string;
  programTypeKey: string;
  readinessStatus: string;
  publishedBy: string;
  publishedAt: string;
}

export interface ReadinessEvaluationStatusChangedPayload {
  evaluationId: string;
  organizationId: string;
  programId: string;
  programTypeKey: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  reason: string | null;
}
```

**New entries in KadarnEventMap:**
```typescript
ReadinessEvaluationStarted: ReadinessEvaluationStartedPayload;
ReadinessEvaluationCompleted: ReadinessEvaluationCompletedPayload;
ReadinessEvaluationPublished: ReadinessEvaluationPublishedPayload;
ReadinessEvaluationStatusChanged: ReadinessEvaluationStatusChangedPayload;
```

**Event Semantics:**

| Event | When emitted | Consumer |
|-------|-------------|----------|
| `ReadinessEvaluationStarted` | Evaluation computation begins | Audit log, Growth Intelligence |
| `ReadinessEvaluationCompleted` | Evaluation computation finishes | Sponsor Intelligence, Audit log |
| `ReadinessEvaluationPublished` | Institution changes visibility_scope to 'network' | Discovery Engine, Sponsor Portfolio |
| `ReadinessEvaluationStatusChanged` | Any status transition | Audit log, Growth Intelligence, Notifications |

---

### Constraints & Rules Summary

| # | Constraint | Source | Implementation |
|---|-----------|--------|----------------|
| 1 | No new tables duplicate existing functionality | Mission 1 | ✓ Verified: taxonomy is vocabulary, requirements are new domain, evaluations are new domain |
| 2 | All new tables reference existing tables via FKs | Architecture rule | ✓ taxonomy (root vocabulary), capability_reqs → taxonomy + org_cap_types, evidence_reqs → capability_reqs, evaluations → orgs + programs + taxonomy |
| 3 | RLS on all tenant-scoped tables from day one | Blueprint §4 | ✓ evaluations has full RLS. Reference tables have SELECT for all authenticated |
| 4 | Audit on readiness_evaluations from day one | Blueprint §2.4 | ✓ Audit trigger on every INSERT/UPDATE with old_values/new_values |
| 5 | Readiness remains DERIVED | KTP-1.0A §3 | ✓ evaluation_snapshot is JSONB cache. Canonical readiness always recomputed |
| 6 | Program Type taxonomy is network-visible | This document | ✓ SELECT policy for all authenticated users |
| 7 | Institution readiness is organization-scoped by default | This document | ✓ visibility_scope DEFAULT 'organization' |
| 8 | programs.created_by_organization_id relaxed | AMB-1 | ✓ Constraint dropped, app-layer validation |
| 9 | program_type[] validated against taxonomy | AMB-2 | ✓ App-layer now, trigger hardening deferred |
| 10 | evaluateClaim() moved to readiness-engine | AMB-3 | ✓ New package, deprecated re-export for one cycle |

---

## Phase 3: Go/No-Go for Implementation

### Verdict: GO

All 4 ambiguities are resolved with clear architectural decisions grounded in existing code. The domain model is consistent with existing entities (organizations 008, programs 010, evidence-core 045), adheres to ADR-011 boundary rules, and respects all 10 Mission 1 constraints. Migrations 052-054 are well-defined and implementable.

### Pre-Implementation Checklist

- [ ] Read KTP-1.0A Blueprint Validation (`openspec/ktp-1.0a-blueprint-validation.md`) — all 6 frozen concepts
- [ ] Read ADR-011 (`docs/adr/adr-011-evidence-core-boundary.md`) — evaluateClaim boundary
- [ ] Read ADR-002 (`docs/adr/adr-002-multi-tenant-architecture.md`) — RLS model
- [ ] Verify migration numbering: 052 follows 051 (sponsor_portfolio)
- [ ] Verify no migration gaps at 035-041 (intentional — skipped for planned engines)
- [ ] Create readiness-engine package skeleton: `packages/readiness-engine/package.json`
- [ ] Move evaluateClaim files from evidence-core to readiness-engine with deprecated re-export
- [ ] Run `SELECT DISTINCT unnest(program_type) FROM programs` to discover existing values for taxonomy seed
- [ ] Extend `audit_resource_type` enum with `'readiness_evaluation'`
- [ ] Update `audit_table_trigger()` CASE mapping

### Residual Risks for Mission 3

| Risk | Mitigation |
|------|------------|
| No `platform_admin` role exists — taxonomy management uses temporary org_admin gate | Add proper platform_admin role in Mission 3 |
| program_type trigger validation deferred | Implement trigger in hardening mission |
| evaluateClaim deprecated re-export in evidence-core | Remove re-exports in Mission 3 |
| Knowledge Engine integration for capability taxonomy enrichment | Mission 3 dependency (ADR-015) |
| audit_resource_type enum extension may affect client-side enum mappings | PostgreSQL ALTER TYPE ADD VALUE is safe for SELECT; test client mappings |

---

*End of KTP-1.1 Mission 2 Decision Matrix.*

