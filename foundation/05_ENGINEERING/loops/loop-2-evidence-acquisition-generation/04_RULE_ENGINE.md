# Phase 2 — Evidence Source Model Report

## 1. Required Models vs Existing

The Loop 2 spec requires implementing or reconciling these 8 models:

| # | Required Model | Existing Implementation | Status | Action |
|---|---------------|------------------------|--------|--------|
| 1 | EvidenceSource | `evidence_sources` table (073) + types (sources.ts) | ✅ Complete | No change |
| 2 | EvidenceOrigin | `source_type` enum (073) + `authority_level` enum (073) | ✅ Covered by two enums | No change — origin = source_type + authority_level combination |
| 3 | EvidenceMethod | `acquisition_method` enum (073) | ✅ Complete | No change |
| 4 | EvidenceAuthority | `authority_level` enum (073) | ✅ Complete | No change |
| 5 | EvidenceCollectionMethod | `acquisition_method` enum (073) | ✅ Same as EvidenceMethod | No change — collection method = acquisition method |
| 6 | EvidenceClassification | `evidence_class` enum (045: A-F) + `evidence_class_ref` table | ⚠️ Misaligned with types | Reconcile types to DB |
| 7 | EvidenceSensitivity | COMMENT ON COLUMN (079): PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED | ✅ Metadata-level | No change — sensitivity is column-level classification, not a domain enum |
| 8 | EvidenceVisibility | `visibility_scope` enum (008/045: site/sponsor_authorized/system) + `visibility` JSONB on evidence_nodes | ✅ Complete | No change |

**Result: 8/8 models present. 1 needs reconciliation (EvidenceClassification).**

---

## 2. EvidenceClassification Reconciliation

### Problem
Two parallel classification systems exist:

**DB (authoritative — frozen by migration 045):**
```
evidence_class enum: A, B, C, D, E, F
evidence_class_ref table:
  A = Public Independent Evidence (decay 60mo, weight 0.80)
  B = Institutional Documentary Evidence (decay 24mo, weight 0.50)
  C = Operational Evidence (decay 12mo, weight 0.70)
  D = Cross-Source Corroboration (no decay, weight 0.00)
  E = Temporal Continuity Evidence (no decay, weight 0.00)
  F = External Confirmation (decay 36mo, weight 1.00)
```

**Types (evidence.ts — misaligned):**
```
EvidenceClassEnum: regulatory, contract, cv, training, publication,
  financial, policy, certification, photo, video, document, other
```

### Resolution
The DB enum is canonical (frozen, has reference table with decay/weight, used by `evidence_nodes.evidence_class` column). The types enum was created independently and is wrong.

**Action:** Replace `EvidenceClassEnum` in `evidence.ts` with the DB- canonical 6-class model:

```typescript
export const EvidenceClassEnum = z.enum(['A', 'B', 'C', 'D', 'E', 'F'])
export type EvidenceClass = z.infer<typeof EvidenceClassEnum>

export const EvidenceClassRefSchema = z.object({
  id: EvidenceClassEnum,
  name: z.string(),
  description: z.string(),
  decay_months: z.number().int().nullable(),
  default_weight: z.number().min(0).max(1),
})
export type EvidenceClassRef = z.infer<typeof EvidenceClassRefSchema>
```

**No migration needed.** The DB is already correct. Only types change.

**Impact:** API routes that use `EvidenceClassEnum` for validation will now enforce A-F instead of the 12-value taxonomy. This is the correct behavior — the DB only accepts A-F.

---

## 3. Enum Reuse Audit

The spec says "Reuse existing enums whenever possible. Create new enums only when justified."

| Concept | Existing Enum | Reuse? | Justification if new |
|---------|--------------|--------|----------------------|
| Source type | `source_type` (073) | ✅ Reuse | — |
| Producer type | `producer_type` (073) | ✅ Reuse | — |
| Authority level | `authority_level` (073) | ✅ Reuse | — |
| Acquisition method | `acquisition_method` (073) | ✅ Reuse | — |
| Freshness policy | `freshness_policy` (073) | ✅ Reuse | — |
| Acquisition status | `acquisition_status` (073) | ✅ Reuse | — |
| Evidence class | `evidence_class` (045) | ✅ Reuse | — |
| Evidence node status | `evidence_node_status` (045) | ✅ Reuse for existing | — |
| Evidence lifecycle | N/A | ⚠️ NEW needed | Spec requires 10 states; existing has 4. New enum `evidence_lifecycle_status` (migration 080). See Phase 6. |
| Relationship type | `evidence_relationship_type` (045) | ✅ Reuse for node-to-node | — |
| Claim-evidence link | CHECK constraint (078) | ✅ Reuse | — |
| Review task type | `review_task_type` (060) | ✅ Reuse | — |
| Review task status | `review_task_status` (060) | ✅ Reuse | — |
| Visibility scope | `visibility_scope` (008/045) | ✅ Reuse | — |

**New enums justified: 1** (`evidence_lifecycle_status` — 10 states required by spec, existing 4-state enum cannot be modified since it's frozen in migration 045).

---

## 4. Evidence Source Model: Design Decisions

### Decision 1: No new migration for EvidenceSource
The `evidence_sources` table (073) is complete with all necessary enums. No extension needed.

### Decision 2: EvidenceClassEnum fix (types only)
Replace the 12-value enum with the canonical 6-value DB enum. This is a breaking change for any code that uses the 12-value taxonomy, but that code is already broken (DB rejects those values).

### Decision 3: EvidenceSensitivity stays as metadata
The COMMENT ON COLUMN model (079) is sufficient. Sensitivity/classification is a column-level concern, not a domain entity. No enum needed.

### Decision 4: EvidenceOrigin = source_type + authority_level
The spec lists "EvidenceOrigin" as a separate model, but it's adequately modeled as the combination of `source_type` (where it came from) and `authority_level` (trust tier). No separate table or enum.

### Decision 5: EvidenceCollectionMethod = acquisition_method
These are synonyms. One enum (`acquisition_method`) serves both concepts.

---

## 5. Gap Summary for Phase 2

| # | Gap | Severity | Fix | Migration |
|---|-----|----------|-----|-----------|
| 1 | `EvidenceClassEnum` in types (12 values) misaligned with DB (6 values) | CRITICAL | Replace with A-F | None (types only) |
| 2 | Missing `EvidenceClassRefSchema` in types | LOW | Add schema matching `evidence_class_ref` table | None (types only) |
| 3 | `EvidenceStatus` in types (6 values) misaligned with DB `evidence_node_status` (4 values) | CRITICAL | Resolve in Phase 6 (lifecycle) | 080 (new enum) |

---

## 6. Verdict

**Evidence Source Model is 87.5% complete (7/8 models present and correct).**

The only critical issue is the `EvidenceClassEnum` misalignment in types, which is a types-only fix (no migration). The `EvidenceStatus` misalignment is deferred to Phase 6 (Evidence Lifecycle) where it belongs.

**No new migrations needed for Phase 2.** All enums and tables already exist. Only types reconciliation.
