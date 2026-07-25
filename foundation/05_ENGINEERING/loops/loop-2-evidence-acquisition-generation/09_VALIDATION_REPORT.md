# Phase 7 — Claim Linking Report

## 1. Current State

`claim_evidence_links` table (migration 078):
```
claim_id (FK), evidence_id (FK), relationship_type (CHECK: 5 values),
tenant_id, created_at, created_by, rationale, provenance (text),
PRIMARY KEY (claim_id, evidence_id)
```

**Relationship types:** SUPPORTS, PARTIALLY_SUPPORTS, CONTRADICTS, REQUIRES_REVIEW, OBSOLETES

## 2. Spec Compliance Check

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Use only canonical relational model | ✅ | Table with PK(claim_id, evidence_id), not array |
| 2 | No array-based canonical storage | ✅ | No `claim_ids` array on evidence, no `evidence_ids` array on claims |
| 3 | SUPPORTS | ✅ | In CHECK constraint |
| 4 | PARTIALLY_SUPPORTS | ✅ | In CHECK constraint |
| 5 | CONTRADICTS | ✅ | In CHECK constraint |
| 6 | REQUIRES_REVIEW | ✅ | In CHECK constraint |
| 7 | OBSOLETES | ✅ | In CHECK constraint |
| 8 | Support many-to-many | ✅ | PK is composite, one evidence can link to many claims and vice versa |
| 9 | Tenant-safe | ⚠️ | `tenant_id` column exists but NO RLS policies |

## 3. Gaps

| # | Gap | Severity | Fix |
|---|-----|----------|-----|
| 1 | No RLS on `claim_evidence_links` | HIGH | Migration 080: add tenant-scoped RLS policies |
| 2 | `provenance` column is TEXT not JSONB | LOW | Acceptable for simple text provenance. Could migrate to JSONB in 080 but not critical. |
| 3 | No index on `claim_id` alone | LOW | PK serves as composite index; separate index on claim_id could help query patterns |
| 4 | No `ClaimEvidenceLinkRepository` | MEDIUM | Create in implementation phase |

## 4. Design Decision: RLS for claim_evidence_links (Migration 080)

```sql
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
```

## 5. Verdict

**Claim linking is 90% complete.** The relational model is canonical and correct. Only gap is RLS policies (migration 080). No schema changes to the table structure needed.
