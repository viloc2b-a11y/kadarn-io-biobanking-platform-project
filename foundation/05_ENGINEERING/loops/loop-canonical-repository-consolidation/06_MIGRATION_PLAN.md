# Phase 6 — Migration Plan

## Current Migration Head

D's highest committed migration: **074** (`074_sprint1_source_records.sql`)

All new migrations begin at **075**.

## Migration Sequence

| Number | Name | Package | Purpose |
|--------|------|---------|---------|
| 075 | `075_institutional_event_ledger.sql` | A | Append-only event ledger table with correlation, causation, idempotency, RLS |
| 076 | `076_source_record_supersession.sql` | B | Extend source_records with superseded_by, supersession_reason, invalidation_status |
| 077 | `077_evidence_generation_rules_and_provenance.sql` | C | Generation rules table + extend evidence_nodes with generation provenance |
| 078 | `078_claim_evidence_links.sql` | D | Canonical claim-evidence join table with relationship semantics, tenant safety |
| 079 | `079_security_classification_comments.sql` | E | COMMENT ON COLUMN for classification model (PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED) |

## Migration Requirements (per migration)

### 075 — Institutional Event Ledger

```sql
-- Table: institutional_events
-- Columns: id, organization_id, event_type, event_version, occurred_at, recorded_at,
--          actor_id, actor_type (CHECK person/system/external), subject_id, subject_type,
--          correlation_id, causation_id, payload JSONB, idempotency_key UNIQUE,
--          tenant_id, created_at
-- RLS: enabled
-- Indexes: organization_id, occurred_at DESC, correlation_id, idempotency_key
-- FK: organization_id → organizations(id)
-- Constraint: idempotency_key UNIQUE
```

### 076 — Source Record Supersession

```sql
-- ALTER TABLE source_records ADD COLUMN:
--   superseded_by UUID REFERENCES source_records(id),
--   supersession_reason TEXT,
--   invalidation_status TEXT CHECK (IN ('active','superseded','invalidated'))
-- Index: superseded_by
-- Comment: supersession semantics
```

### 077 — Evidence Generation Rules and Provenance

```sql
-- New table: evidence_generation_rules
--   id, rule_name, rule_version, event_pattern, required_inputs JSONB,
--   output_evidence_type, preconditions JSONB, review_mode TEXT,
--   confidence_policy JSONB, owner UUID, active BOOLEAN DEFAULT true,
--   effective_from TIMESTAMPTZ, effective_until TIMESTAMPTZ,
--   created_at, updated_at
--   UNIQUE(rule_name, rule_version)
--   RLS enabled

-- ALTER TABLE evidence_nodes ADD COLUMN:
--   generation_rule_id UUID REFERENCES evidence_generation_rules(id),
--   input_hash TEXT,
--   generator TEXT,
--   generated_at TIMESTAMPTZ,
--   source_record_id UUID REFERENCES source_records(id)
-- Indexes on all new columns
```

### 078 — Claim-Evidence Links

```sql
-- New table: claim_evidence_links
--   claim_id UUID NOT NULL,
--   evidence_id UUID NOT NULL REFERENCES evidence_nodes(id) ON DELETE CASCADE,
--   relationship_type TEXT NOT NULL CHECK (IN ('SUPPORTS','PARTIALLY_SUPPORTS','CONTRADICTS','REQUIRES_REVIEW','OBSOLETES')),
--   tenant_id UUID NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   created_by UUID,
--   rationale TEXT,
--   provenance TEXT,
--   PRIMARY KEY(claim_id, evidence_id)
-- RLS enabled
-- Indexes: evidence_id, tenant_id, relationship_type
-- FK: evidence_id → evidence_nodes(id)
-- No FK on claim_id yet (claims table exists, add FK if compatible)
-- Tenant isolation: CHECK + RLS ensuring claim.tenant_id = evidence.tenant_id
```

### 079 — Security Classification Comments

```sql
-- COMMENT ON COLUMN for key tables:
-- evidence_nodes: CONFIDENTIAL
-- source_records: CONFIDENTIAL
-- claims: CONFIDENTIAL
-- institutional_events: INTERNAL
-- claim_evidence_links: CONFIDENTIAL
-- evidence_generation_rules: INTERNAL
-- Classification: PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED
-- Non-destructive: comments only
```

## Cross-Migration Validation

- 075 is independent (no dependency on 076-079)
- 076 depends on 074 (source_records table exists)
- 077 depends on 045 (evidence_nodes table exists) and 074 (source_records for FK)
- 078 depends on 045 (evidence_nodes table) and 066 (claims table)
- 079 depends on 075-078 (comments reference new tables)

## Idempotency

All migrations use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` for enums.

## Tenant Awareness

All new tables include `tenant_id` or `organization_id` and have RLS enabled.

## Non-Destructive

No existing table is dropped. No existing column is removed. No existing data is modified. All changes are additive.
