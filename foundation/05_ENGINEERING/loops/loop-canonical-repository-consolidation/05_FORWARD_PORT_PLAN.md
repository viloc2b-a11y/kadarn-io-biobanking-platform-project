# Phase 5 — Forward-Port Plan

## Base Repository

D is the architectural base. No wholesale replacement of D's Claim/Evidence/Review/Passport system.

## Capabilities to Forward-Port

### 1. Institutional Event Ledger

| Aspect | Detail |
|--------|--------|
| Existing D component | `packages/domain-events` (event catalog), `packages/platform-services/src/event-bus` (runtime event bus), `database/migrations/036_domain_events_runtime.sql` |
| C reference | `database/migrations/022_institutional_event_ledger.sql`, `apps/api/src/routes/events.ts`, `packages/domain-events/src/index.ts` |
| Canonical target | New `institutional_events` table (append-only) + EventRepository + Event API route. Reuse D's EventEnvelope type. No global Map store. |
| Files affected | `database/migrations/075_*.sql`, `supabase/migrations/075_*.sql`, `packages/platform-services/src/repositories/event-repository.ts`, `packages/types/src/events.ts`, `apps/api/src/app/api/v1/events/route.ts`, `apps/api/src/app/api/v1/events/[id]/route.ts` |
| Schema impact | New table `institutional_events` with: id, organization_id, event_type, event_version, occurred_at, recorded_at, actor_id, actor_type, subject_id, subject_type, correlation_id, causation_id, payload JSONB, idempotency_key UNIQUE, tenant_id. RLS enabled. |
| API impact | POST /v1/events (append), GET /v1/events (list by org), GET /v1/events/:id |
| Test impact | New test: event append, idempotency, correlation chain, tenant isolation |
| Migration impact | 075_institutional_event_ledger.sql |
| Risks | Event table grows unbounded — need partitioning strategy (defer). Idempotency key collision handling. |
| Rollback | Drop table (forward-only, but table is new so safe to drop in dev) |
| Acceptance | Event persists append-only. Duplicate idempotency_key returns existing. Correlation chain queryable. Tenant isolation enforced. |

### 2. SourceRecord Reconciliation (Supersession Extension)

| Aspect | Detail |
|--------|--------|
| Existing D component | `database/migrations/074_sprint1_source_records.sql` (source_records table), `packages/types/src/sources.ts`, API routes |
| C reference | `database/migrations/027_source_record_extension.sql` (supersession, lifecycle, organizational columns) |
| Canonical target | Extend D's source_records with: `superseded_by UUID`, `supersession_reason TEXT`, `invalidation_status`. Add `evidence_source_id` already exists. Keep D's acquisition_status enum. |
| Files affected | `database/migrations/076_*.sql`, `supabase/migrations/076_*.sql`, `packages/types/src/sources.ts` |
| Schema impact | ALTER TABLE source_records ADD COLUMN superseded_by, supersession_reason, invalidation_status |
| API impact | Source record supersession endpoint |
| Test impact | Supersession flow test |
| Migration impact | 076_source_record_supersession.sql |
| Risks | Minimal — additive columns |
| Rollback | Drop columns (forward-only dev) |
| Acceptance | Source record can be superseded. Superseded records are not deleted. Query returns active records by default. |

### 3. Evidence Generation Rules and Provenance

| Aspect | Detail |
|--------|--------|
| Existing D component | `evidence_nodes` (045) with `wasRevisionOf` pattern. No generation rule registry. |
| C reference | `database/migrations/025_evidence_generation_rules.sql`, `027_source_record_extension.sql` (rule_code, policies, effectivity) |
| Canonical target | New `evidence_generation_rules` table + extend evidence_nodes with generation provenance columns |
| Files affected | `database/migrations/077_*.sql`, `supabase/migrations/077_*.sql`, `packages/types/src/evidence.ts`, `packages/evidence-core/src/` |
| Schema impact | New table: evidence_generation_rules (id, rule_name, rule_version, event_pattern, required_inputs JSONB, output_evidence_type, preconditions JSONB, review_mode, confidence_policy JSONB, owner, active, effective_from, effective_until). ALTER TABLE evidence_nodes ADD: generation_rule_id, input_hash, generator, generated_at, source_record_id. |
| API impact | CRUD for generation rules. Evidence generation endpoint. |
| Test impact | Generation rule versioning, input hash determinism, review state |
| Migration impact | 077_evidence_generation_rules_and_provenance.sql |
| Risks | Rule versioning complexity. Input hash determinism across environments. |
| Rollback | Drop table and columns (forward-only dev) |
| Acceptance | Rule is versioned. Evidence records rule_id + version + input_hash. Regeneration with same inputs produces same hash. Review mode enforced. |

### 4. Claim-Evidence Canonical Links

| Aspect | Detail |
|--------|--------|
| Existing D component | `evidence_relationships` table (045) for evidence-to-evidence. `claims` table (045, 066). No claim-evidence join. |
| C reference | `database/migrations/028_claim_evidence_links.sql` (SUPPORTS/CONTRADICTS) |
| Canonical target | New `claim_evidence_links` table bridging claims and evidence_nodes with relationship semantics |
| Files affected | `database/migrations/078_*.sql`, `supabase/migrations/078_*.sql`, `packages/types/src/claim.ts`, `packages/evidence-core/src/claim.ts`, API routes |
| Schema impact | New table: claim_evidence_links (claim_id UUID, evidence_id UUID, relationship_type enum, tenant_id UUID, created_at, created_by, rationale, provenance). PK(claim_id, evidence_id). FK to claims and evidence_nodes. RLS. CHECK relationship_type IN ('SUPPORTS','PARTIALLY_SUPPORTS','CONTRADICTS','REQUIRES_REVIEW','OBSOLETES'). |
| API impact | Link/unlink evidence to claim. List evidence for claim. List claims for evidence. |
| Test impact | Link creation, uniqueness, tenant isolation, no claim_ids array |
| Migration impact | 078_claim_evidence_links.sql |
| Risks | Must not conflict with D's evidence_relationship_type enum. Different domain (claim-evidence vs evidence-evidence). |
| Rollback | Drop table (forward-only dev) |
| Acceptance | Evidence links to claim with relationship type. Unique constraint enforced. Cross-tenant link rejected. No claim_ids array used. |

### 5. Security Classification Comments

| Aspect | Detail |
|--------|--------|
| Existing D component | RLS on all tables. No classification comments. |
| C reference | `database/migrations/026_security_classification_comments.sql` |
| Canonical target | Forward-only COMMENT ON COLUMN statements for key tables |
| Files affected | `database/migrations/079_*.sql`, `supabase/migrations/079_*.sql` |
| Schema impact | Comments only — no structural changes. Classification: PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED |
| API impact | None (documentation comments) |
| Test impact | Verify comments exist in information_schema |
| Migration impact | 079_security_classification_comments.sql |
| Risks | None — comments are non-destructive |
| Rollback | Drop comments |
| Acceptance | Comments present on key columns. Classification model documented. |

## Prohibited Strategy (confirmed)

- ❌ No cherry-picking C migrations 022-028
- ❌ No copying C's full architecture wholesale
- ❌ No replacing D's Claim/Evidence/Review/Passport with C's earlier implementation
- ✅ D is the architectural base. C capabilities are ported as new forward-only migrations.
