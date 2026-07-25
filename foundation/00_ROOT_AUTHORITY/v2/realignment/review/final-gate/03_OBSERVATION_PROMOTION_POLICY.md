# KADARN v2 — Decision 3: Observation Promotion Policy

**Date:** 2026-07-25
**Question:** When does a transient observation become domain knowledge?

---

## The Problem

Observations (extracted values from source records) are the raw output of parsing. They are not yet evidence or claims. They have no identity, no lifecycle, and no FK references. But they contain potentially valuable data that must eventually become Evidence and Claims.

---

## The Rule

### Phase 1: Extraction (Observation lives in JSONB)

When an extraction run completes:

```
SourceRecord
  └── extractions[] JSONB  ← observations live here
        └── field: "screened_count"
        └── raw_value: "145"
        └── confidence: 0.92
        └── locator: {page: 3, section: "Enrollment Summary", span: "line 12-14"}
        └── extracted_at: "2026-07-25T10:00:00Z"
```

**Status:** TRANSIENT. Observable but not yet domain data.

**Queryable:** Only through the SourceRecord. No independent query.

### Phase 2: Review (Observation is evaluated)

A human or automated reviewer examines observations:

- **ACCEPTED** → The observation is true and can become Evidence
- **REJECTED** → The observation is false or unreliable; stays in JSONB with `rejection_reason`
- **UNCERTAIN** → Flagged for further review

### Phase 3: Promotion (Observation → Evidence)

When an observation is ACCEPTED:

1. An `evidence_nodes` row is created
2. All domain fields are copied: content, locator, confidence, extracted_at
3. `evidence_nodes.source_record_id` links back to the source
4. `evidence_nodes.extraction_info` JSONB stores parser/model + extraction run details
5. The original observation in extraction_runs JSONB is NOT deleted (audit trail)

### Phase 4: Assertion (Evidence → Claim)

Once evidence exists, it can be linked to claims via `claim_evidence_links`:

- Evidence supports a Claim → `role = 'supports'`
- Evidence contradicts a Claim → `role = 'contradicts'`
- Evidence qualifies a Claim → `role = 'qualifies'`

---

## Locator Preservation Rule

The locator MUST be preserved through the pipeline:

```
SourceRecord ──► Observation (JSONB) ──► Evidence (column) ──► Claim (via link)
   storage_uri     locator: {page,         locator: {page,       shared via
                   section, span}          section, span}        claim_evidence_links
```

If an observation is promoted to Evidence, its locator is COPIED to `evidence_nodes.locator_json`. This ensures traceability back to the source document.

---

## Preventing Knowledge Loss

The risk is that useful observations remain trapped in extraction JSONB and are never promoted.

**Promotion triggers:**

| Trigger | Behavior |
|---------|----------|
| Review queue | Observations with confidence ≥ 0.9 AND no contradictions auto-promote to Evidence |
| Manual review | Observations in the review queue require explicit accept/reject |
| Re-extraction | A newer extraction run may demote previously accepted Evidence back to observation status |
| Orphan detection | Weekly job: observations not promoted within 30 days are flagged for review |

**Constraint:** Every ClaimVersion published in a Passport or Assessment must trace to a promoted Evidence with a source_record_id. No orphan claims.

---

## When Observations Become a Table

The JSONB approach is sufficient as long as:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Observations count | >10,000 per extraction run | Extract to `observations` table |
| Cross-observation queries | Required for analytics | Extract to table + index |
| Observation lifecycle | Observations develop their own review/supersede workflow | Extract to table |

None of these conditions are expected for the Continuing Review or PI Identity vertical slices.

---

## Decision

**OBSERVATIONS IN JSONB, WITH EXPLICIT PROMOTION RULES**

- Observations are JSONB in extraction runs
- Promotion to Evidence is an explicit reviewed+accepted action
- Locator is copied to Evidence on promotion
- Rejected observations remain in JSONB with rejection_reason
- Monthly orphan detection for un-promoted observations
- Table extraction only if >10K observations per run
