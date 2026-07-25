# KADARN v2 — Decision 1: Claim ↔ Evidence Relationship

**Date:** 2026-07-25
**Question:** What is the minimum structure that preserves integrity for the Claim↔Evidence graph?

---

## Requirements

The link must support:

| Requirement | Why |
|------------|-----|
| M:N relationship | One evidence supports/contradicts multiple claims; one claim has multiple evidence items |
| Role typing | supports, contradicts, qualifies |
| Weight/relevance | Contribution strength for confidence computation (0.0–1.0) |
| Validity period | Evidence may support a claim temporarily |
| Review status | Is this link reviewed? By whom? When? |
| Revocation | A previously accepted link can be revoked |
| Audit trail | Who created/revoked the link, when |
| Graph queries | "Find all evidence for claim X", "Find all claims supported by evidence Y", "Find contradictory evidence for claim X" |

---

## Options Analysis

### Option A: JSONB on claims

```sql
ALTER TABLE claims ADD COLUMN evidence_links JSONB DEFAULT '[]';
-- [{evidence_id, role, weight, valid_from, valid_until, review_status}]
```

**Pros:**
- No new table
- Simple reads for claim → evidence

**Cons:**
- ❌ **No FK enforcement** — evidence_id is a string, not a FK. Can reference non-existent evidence.
- ❌ **Cannot query evidence → claims** without full table scan of all claims
- ❌ **No partial update** — must read entire JSONB array, modify, write back
- ❌ **No constraints** on role values, weight ranges, or date ranges
- ❌ **No index** on evidence_id for reverse queries without GIN index (which is still slow)

**Verdict: REJECTED.** Loses referential integrity and reverse query capability.

### Option B: FK on evidence_nodes (existing)

```sql
evidence_nodes.claim_id UUID REFERENCES claims(id)  -- already exists
```

**Pros:**
- Already exists
- FK enforced

**Cons:**
- ❌ **1:N only** — one evidence per claim. Cannot share evidence across claims.
- ❌ **No role** — no way to distinguish supporting from contradicting evidence
- ❌ **No weight** — no relevance scoring

**Verdict: REJECTED.** Insufficient for M:N + role semantics.

### Option C: claim_evidence_links table

```sql
CREATE TABLE claim_evidence_links (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id      UUID NOT NULL REFERENCES claims(id),
    evidence_id   UUID NOT NULL REFERENCES evidence_nodes(id),
    role          TEXT NOT NULL CHECK (role IN ('supports', 'contradicts', 'qualifies')),
    weight        NUMERIC(3,2) DEFAULT 1.0,
    valid_from    TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until   TIMESTAMPTZ,
    review_status TEXT DEFAULT 'pending',
    revoked_at    TIMESTAMPTZ,
    revoked_by    UUID,
    created_by    UUID,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (claim_id, evidence_id, role, COALESCE(valid_until, 'infinity'))
);
```

**Pros:**
- ✅ FK integrity on both claim_id and evidence_id
- ✅ M:N with role typing
- ✅ Weight, validity, review, revocation
- ✅ Queryable in both directions via indexes
- ✅ UNIQUE prevents duplicate active links
- ✅ Audit trail via created_at, revoked_at, created_by

**Cons:**
- New table (but it's replacing the rejected JSONB column)

**Verdict: ACCEPTED.** This is the minimum structure that preserves integrity.

### Option D: Extend evidence_nodes with claim_ids array

```sql
evidence_nodes.claim_ids UUID[]  -- array of FKs
```

**Pros:**
- No new table
- M:N support

**Cons:**
- ❌ **No FK on array elements** — PG does not enforce FK on array members
- ❌ **No role, weight, or validity** per link
- ❌ No standard index for array elements (GIN only)

**Verdict: REJECTED.** Insufficient for relationship metadata.

---

## Decision

**RELATIONAL TABLE: claim_evidence_links**

This restores one table vs. the simplification review's JSONB proposal. The table is justified because:

1. The link IS a domain concept — it has identity, lifecycle, and metadata
2. FK integrity is non-negotiable for the Evidence Graph
3. Reverse queries (evidence→claims) are essential for Explainable Confidence
4. The UNIQUE constraint prevents contradictory ambiguity in active links

### Schema

```sql
claim_evidence_links
├── id              UUID (PK)
├── claim_id        UUID → claims.id (FK)
├── evidence_id     UUID → evidence_nodes.id (FK)
├── role            TEXT → 'supports' | 'contradicts' | 'qualifies'
├── weight          NUMERIC(3,2) DEFAULT 1.0
├── valid_from      TIMESTAMPTZ
├── valid_until     TIMESTAMPTZ
├── review_status   TEXT → 'pending' | 'accepted' | 'rejected'
├── revoked_at      TIMESTAMPTZ
├── revoked_by      UUID
├── created_by      UUID
└── created_at      TIMESTAMPTZ

INDEXES:
- (claim_id, role) WHERE revoked_at IS NULL
- (evidence_id, role) WHERE revoked_at IS NULL
- (claim_id, evidence_id) UNIQUE WHERE revoked_at IS NULL
```
