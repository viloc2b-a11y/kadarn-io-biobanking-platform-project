# Phase 9-11 — API Design & PI Implementation Packages

## Consolidated Migration Plan (Migration 080)

A single migration (080) addresses all schema gaps from Phases 1-8:

```sql
-- 080_evidence_lifecycle_and_governance.sql

-- 1. New enum: evidence_lifecycle_status (Phase 6)
CREATE TYPE evidence_lifecycle_status AS ENUM (
  'draft', 'generated', 'imported', 'verified', 'reviewed',
  'accepted', 'rejected', 'superseded', 'archived', 'invalidated'
);

-- 2. New enum: rule_status (Phase 3)
CREATE TYPE rule_status AS ENUM ('draft', 'active', 'deprecated', 'retired');

-- 3. New enum: review_decision (Phase 8)
DO $$ BEGIN
  CREATE TYPE review_decision AS ENUM (
    'approved', 'rejected', 'needs_more_evidence', 'not_applicable'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. evidence_nodes: add lifecycle_status (Phase 6)
ALTER TABLE evidence_nodes
  ADD COLUMN IF NOT EXISTS lifecycle_status evidence_lifecycle_status DEFAULT 'draft';

-- 5. evidence_generation_rules: add rule_status + RLS (Phase 3)
ALTER TABLE evidence_generation_rules
  ADD COLUMN IF NOT EXISTS rule_status rule_status DEFAULT 'draft';

ALTER TABLE evidence_generation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY egr_select_tenant ON evidence_generation_rules
  FOR SELECT USING (auth.role() = 'service_role' OR owner IS NULL
  OR owner IN (SELECT user_id FROM organization_memberships WHERE status = 'active'));
CREATE POLICY egr_all_service ON evidence_generation_rules
  FOR ALL USING (auth.role() = 'service_role');

-- 6. institutional_events: add RLS policies (Phase 1)
CREATE POLICY ie_select_tenant ON institutional_events
  FOR SELECT USING (
    tenant_id IN (SELECT organization_id FROM organization_memberships
                  WHERE user_id = auth.uid() AND status = 'active')
    OR auth.role() = 'service_role'
  );
CREATE POLICY ie_insert_tenant ON institutional_events
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT organization_id FROM organization_memberships
                  WHERE user_id = auth.uid() AND status = 'active')
    OR auth.role() = 'service_role'
  );
CREATE POLICY ie_all_service ON institutional_events
  FOR ALL USING (auth.role() = 'service_role');

-- 7. claim_evidence_links: add RLS (Phase 7)
ALTER TABLE claim_evidence_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY cel_select_tenant ON claim_evidence_links
  FOR SELECT USING (
    tenant_id IN (SELECT organization_id FROM organization_memberships
                  WHERE user_id = auth.uid() AND status = 'active')
    OR auth.role() = 'service_role'
  );
CREATE POLICY cel_insert_tenant ON claim_evidence_links
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT organization_id FROM organization_memberships
                  WHERE user_id = auth.uid() AND status = 'active')
    OR auth.role() = 'service_role'
  );
CREATE POLICY cel_all_service ON claim_evidence_links
  FOR ALL USING (auth.role() = 'service_role');

-- 8. review_tasks: add review_outcome + required_actions + evidence_snapshot (Phase 8)
ALTER TABLE review_tasks
  ADD COLUMN IF NOT EXISTS review_outcome review_decision;
ALTER TABLE review_tasks
  ADD COLUMN IF NOT EXISTS required_actions JSONB DEFAULT '[]';
ALTER TABLE review_tasks
  ADD COLUMN IF NOT EXISTS evidence_snapshot JSONB;

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_evidence_lifecycle ON evidence_nodes(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_rule_status ON evidence_generation_rules(rule_status);
CREATE INDEX IF NOT EXISTS idx_review_outcome ON review_tasks(review_outcome);
```

---

## API Design (Phase 9)

| # | Endpoint | Method | Purpose | New? |
|---|----------|--------|---------|------|
| 1 | `/api/v1/source-records` | POST | Create SourceRecord | New |
| 2 | `/api/v1/source-records/[id]` | GET | Retrieve SourceRecord | Exists |
| 3 | `/api/v1/source-records/[id]` | PATCH | Update status (supersede/invalidate) | New |
| 4 | `/api/v1/evidence-sources` | GET | List sources | Exists |
| 5 | `/api/v1/evidence-sources` | POST | Create source | Exists |
| 6 | `/api/v1/evidence/generate` | POST | Generate evidence from source+rule | New |
| 7 | `/api/v1/evidence/[id]/replay` | POST | Replay generation, verify determinism | New |
| 8 | `/api/v1/evidence/[id]/lineage` | GET | Retrieve full lineage chain | New |
| 9 | `/api/v1/evidence/[id]/provenance` | GET | Retrieve provenance upstream | New |
| 10 | `/api/v1/generation-rules` | GET | List rules | New |
| 11 | `/api/v1/generation-rules/[id]` | GET | Retrieve rule | New |
| 12 | `/api/v1/generation-rules` | POST | Create rule | New |
| 13 | `/api/v1/evidence/[id]/review` | POST | Review evidence | New |
| 14 | `/api/v1/evidence/[id]/review` | GET | List reviews for evidence | New |

---

## PI Implementation Packages (Phase 11)

### Package A — Source Acquisition (types + repository + RLS)
- Extend `SourceRecordSchema` with supersession fields
- Add `UpdateSourceRecordSchema`
- Create `SourceRecordRepository` (DB-backed)
- Convert `InstitutionalEvent` to Zod
- Create `EvidenceSourceRepository` (DB-backed)
- Migration 080: institutional_events RLS policies
- Tests

### Package B — Evidence Source Model (types reconciliation)
- Fix `EvidenceClassEnum` to match DB (A-F)
- Add `EvidenceClassRefSchema`
- Add `EvidenceLifecycleStatus` enum
- Tests

### Package C — Generation Rule Engine (types + repository + RLS)
- Convert `GenerationRule` to Zod schema
- Add `rule_status` to types
- Create `GenerationRuleRepository`
- Migration 080: `rule_status` enum, column, RLS
- Tests

### Package D — Generation Pipeline (service + executor)
- Create `GenerationPipelineService`
- Create generator registry
- Implement deterministic replay
- Add `GenerateEvidenceSchema`, `ReplayResultSchema`
- Tests

### Package E — Provenance & Lineage (service + API)
- Implement `LineageService` with DB queries
- Implement `/api/v1/lineage` and `/api/v1/evidence/[id]/lineage`
- Implement `/api/v1/evidence/[id]/provenance`
- Tests

### Package F — Claim Linking (RLS + repository)
- Migration 080: `claim_evidence_links` RLS
- Create `ClaimEvidenceLinkRepository`
- Tests

### Package G — Review Foundation (migration + types + repository)
- Migration 080: `review_decision` enum, `review_outcome`, `required_actions`, `evidence_snapshot`
- Update `ReviewSchema` in types
- Create `ReviewRepository`
- Tests

### Package H — API Endpoints
- All new API routes from the API design table
- Wire to repositories/services
- Tests

### Package I — UI Integration
- Source Records page
- Evidence page
- Evidence Lineage page
- Generation Rules page
- Review Queue page
- Replace mocks with API calls
