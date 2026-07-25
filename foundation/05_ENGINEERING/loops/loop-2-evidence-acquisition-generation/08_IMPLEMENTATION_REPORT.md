# Phase 6 — Evidence Lifecycle Report

## 1. Required Lifecycle States (Spec)

```
Draft → Generated → Imported → Verified → Reviewed → Accepted → Rejected → Superseded → Archived → Invalidated
```

## 2. Current State

**DB enum `evidence_node_status` (045, frozen):**
```
active, superseded, disputed, resolved
```

**Types `EvidenceStatus` (evidence.ts, misaligned):**
```
draft, submitted, under_review, approved, rejected, expired
```

**Neither matches the 10-state spec.** The DB enum is frozen (cannot modify migration 045). A new enum is needed.

## 3. Resolution: New Enum (Migration 080)

Create `evidence_lifecycle_status` enum:
```sql
CREATE TYPE evidence_lifecycle_status AS ENUM (
  'draft',        -- Created but not yet generated or imported
  'generated',    -- Produced by generation pipeline
  'imported',     -- Manually imported from external source
  'verified',     -- Source verified against origin
  'reviewed',     -- Has been reviewed (outcome may be accept/reject)
  'accepted',     -- Review outcome: accepted
  'rejected',     -- Review outcome: rejected
  'superseded',   -- Replaced by newer evidence (wasRevisionOf pattern)
  'archived',     -- No longer active but preserved
  'invalidated'   -- Source invalidated or provenance broken
);
```

**Mapping from existing 4-state to 10-state:**
| Old (evidence_node_status) | New (evidence_lifecycle_status) |
|---------------------------|-------------------------------|
| active | draft / generated / imported / verified / reviewed / accepted (depends on context) |
| superseded | superseded |
| disputed | rejected |
| resolved | accepted |

**Implementation:**
- `ALTER TABLE evidence_nodes ADD COLUMN lifecycle_status evidence_lifecycle_status DEFAULT 'draft'`
- Keep `status` column (frozen enum) for backward compatibility
- New code writes to `lifecycle_status`; `status` is derived/maintained by trigger or app logic
- `EvidenceStatus` in types replaced with `EvidenceLifecycleStatus` matching the new enum

## 4. Lifecycle Transitions

```
                    ┌──→ accepted ──→ archived
                    │
draft → generated ──┤
       │            ┌──→ rejected ──→ archived
       ├──→ reviewed┤
       │            └──→ superseded
       ↓
imported → verified ┘

Any state → invalidated (source revoked)
superseded → archived (after retention period)
```

**Rules:**
- No destructive overwrite (append-only enforced by triggers)
- Transitions are auditable (record in `provenance` JSONB or audit table)
- `invalidated` is terminal
- `archived` is terminal
- `superseded` implies a `wasRevisionOf` link to the new evidence

## 5. Gaps

| # | Gap | Severity | Fix |
|---|-----|----------|-----|
| 1 | No `evidence_lifecycle_status` enum | CRITICAL | Migration 080 |
| 2 | `EvidenceStatus` in types misaligned | CRITICAL | Replace with `EvidenceLifecycleStatus` |
| 3 | No lifecycle transition audit | MEDIUM | Record transitions in provenance JSONB or audit log |
| 4 | No lifecycle state machine enforcement | MEDIUM | App-level validation in repository/service |

## 6. Verdict

**Lifecycle is 10% implemented.** The DB has a 4-state enum that cannot be modified. A new 10-state enum (migration 080) with a new column on `evidence_nodes` is the path forward. Backward compatibility maintained by keeping the old column.
