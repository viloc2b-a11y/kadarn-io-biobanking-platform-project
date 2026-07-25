# KADARN v2 — Decision 4: Non-Destructive Claim Versioning

**Date:** 2026-07-25
**Question:** Can we version claims without a separate ClaimVersion table?

---

## The Requirement

| Need | Must support |
|------|-------------|
| Stable identity | The same claim concept persists across versions |
| Historical preservation | Old versions are never overwritten |
| Current view | Query "what is the current value of this claim?" |
| Temporal view | Query "what was the value at time X?" |
| Supersession | A new version explicitly replaces an old one |
| FKs to specific versions | Published passports reference the precise version used |
| Audit trail | Who created each version, when |
| Conflict detection | Can detect when two versions overlap in valid time |

---

## The Model: Self-Versioning Claims Table

The `claims` table uses append-only versioning. Changes INSERT new rows; they never UPDATE existing versions.

### Columns Added

| Column | Type | Purpose |
|--------|------|---------|
| `claim_family_id` | UUID NOT NULL | Stable identity across all versions. Default = id (first version IS the family). |
| `version_number` | INT NOT NULL DEFAULT 1 | Monotonic counter within a family. |
| `supersedes_id` | UUID → claims.id (nullable) | The specific version this one replaces. |
| `valid_from` | TIMESTAMPTZ NOT NULL | When this version became effective. |
| `valid_until` | TIMESTAMPTZ (nullable) | When this version was superseded. NULL = current version. |
| `epistemic_type` | TEXT | 'direct', 'derived', 'inferred', 'human', 'automated' |

### Behavior

**INSERT (first version):**
- `claim_family_id = id` (self-referencing)
- `version_number = 1`
- `valid_from = now()`
- `valid_until = NULL` (current)

**UPDATE (new version):**
- Application layer creates a new INSERT:
  - `claim_family_id = existing.claim_family_id`
  - `version_number = existing.version_number + 1`
  - `supersedes_id = existing.id`
  - `valid_from = now()`
  - `valid_until = NULL`
- Then updates the previous row:
  - `valid_until = now()`
  - `superseded_by = new_row.id`

This is a TWO-STEP operation wrapped in a transaction. The old row is UPDATED only for the `valid_until` and `superseded_by` fields — the content remains intact.

### Queries

```sql
-- Current version (by claim_family_id)
SELECT * FROM claims WHERE claim_family_id = $1 AND valid_until IS NULL;

-- All versions (ordered)
SELECT * FROM claims WHERE claim_family_id = $1 ORDER BY version_number;

-- Version at point in time
SELECT * FROM claims
WHERE claim_family_id = $1
  AND valid_from <= $timestamp
  AND (valid_until IS NULL OR valid_until > $timestamp)
ORDER BY version_number DESC
LIMIT 1;

-- Latest version by supersedes chain
WITH RECURSIVE version_chain AS (
    SELECT id, claim_family_id, version_number, supersedes_id
    FROM claims WHERE claim_family_id = $1 AND valid_until IS NULL
    UNION ALL
    SELECT c.id, c.claim_family_id, c.version_number, c.supersedes_id
    FROM claims c JOIN version_chain v ON c.id = v.supersedes_id
)
SELECT * FROM version_chain ORDER BY version_number;
```

### FK Behavior

- Existing FKs from evidence_nodes, passport_entries, etc. reference `claims.id`
- `claims.id` is the VERSION-SPECIFIC ID, not the family ID
- When a passport entry links to `claims.id`, it captures the exact version at publication time
- To resolve the current version, query by `claim_family_id`
- This means: passport → claim_version_id (specific), assessment → claim_family_id (current)

---

## Comparison

| Criterion | Separate ClaimVersion table | Self-versioning claims (this proposal) |
|-----------|---------------------------|----------------------------------------|
| Table count | 2 (claims + claim_versions) | 1 (claims) |
| FK targets | Different for identity vs version | Same table, different columns |
| Query complexity | JOIN on every versioned read | COALESCE/WHERE on versioned read |
| Historical integrity | Append-only, no backfill risk | Append-only with valid_until UPDATE |
| Backfill from existing | REQUIRED (move data to new table) | OPTIONAL (add columns, default values) |
| Version count limit | Unlimited | PG row count per family (practical limit: ~1000) |
| Temporal overlap | Supported via valid_from/until | Same (both use same pattern) |
| Index complexity | (claim_id, version) + (claim_id, valid_until) | (claim_family_id, valid_until) + (claim_family_id, version) |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| UPDATE to valid_until could fail mid-transaction | Wrap in transaction with retry logic |
| Queries forget WHERE valid_until IS NULL | Create VIEW `current_claims` with the filter |
| claim_family_id confusion with id | Clear naming in code: `claimId` = family, `claimVersionId` = specific row |
| Existing FKs reference version-specific IDs | Accept as correct behavior (passport captures version at publication) |
| Version explosion (>1000 per family) | Extract to ClaimVersion table with migration script |

---

## Decision

**SELF-VERSIONING CLAIMS.** No separate ClaimVersion table.

The claims table gains append-only versioning via:
- `claim_family_id` — stable identity
- `version_number` — monotonic counter
- `valid_from` / `valid_until` — temporal validity
- `supersedes_id` / `superseded_by` — explicit supersession
- `epistemic_type` — knowledge layer classification

**Backfill:** Existing rows get `claim_family_id = id`, `version_number = 1`, `valid_from = created_at`, `valid_until = NULL`, `epistemic_type = 'human'`. No data moved.

**Final state:** 1 table instead of 2. Zero data loss. Full temporal query capability.
