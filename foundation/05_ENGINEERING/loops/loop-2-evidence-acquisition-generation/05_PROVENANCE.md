# Phase 3 — Generation Rule Engine Report

## 1. Current State

`evidence_generation_rules` table (migration 077):
```
id, rule_name, rule_version (UNIQUE pair), event_pattern, required_inputs (JSONB),
output_evidence_type, preconditions (JSONB), review_mode (manual/automatic/conditional),
confidence_policy (JSONB), owner (UUID), active (BOOLEAN), effective_from, effective_until,
created_at, updated_at
```

## 2. Required Rule Metadata vs Existing

| # | Required Field | DB Column | Status | Action |
|---|----------------|-----------|--------|--------|
| 1 | Rule ID | `id` UUID PK | ✅ | None |
| 2 | Version | `rule_version` INTEGER | ✅ | None |
| 3 | Owner | `owner` UUID | ✅ | None |
| 4 | Status | `active` BOOLEAN + `effective_until` | ⚠️ Partial | Add `rule_status` enum (migration 080): draft/active/deprecated/retired |
| 5 | Input requirements | `required_inputs` JSONB | ✅ | None |
| 6 | Output Evidence type | `output_evidence_type` TEXT | ✅ | None |
| 7 | Review policy | `review_mode` (manual/automatic/conditional) | ✅ | None |
| 8 | Confidence policy | `confidence_policy` JSONB | ✅ | None (used by LOOP 4, stored now) |
| 9 | Effective dates | `effective_from` + `effective_until` | ✅ | None |
| 10 | Deprecation state | `effective_until` + `active=false` | ⚠️ Implicit | Make explicit with `rule_status` enum |

## 3. Gaps

| # | Gap | Severity | Fix |
|---|-----|----------|-----|
| 1 | No RLS on `evidence_generation_rules` | HIGH | Migration 080: add RLS policies (tenant-scoped or global governance) |
| 2 | No explicit `rule_status` enum | MEDIUM | Migration 080: add `rule_status` enum (draft/active/deprecated/retired) |
| 3 | No validation that `output_evidence_type` matches a valid `evidence_class` | LOW | Add CHECK constraint or app-level validation |
| 4 | `generation-rule.ts` uses plain type not Zod | LOW | Convert to Zod schema |
| 5 | No `GenerationRuleRepository` | MEDIUM | Create in implementation phase |

## 4. Design Decision: Rule Governance

Rules are governed entities. The `evidence_generation_rules` table is the canonical registry. No separate "rule registry" table needed.

**Rule lifecycle:** draft → active → deprecated → retired
- `draft`: Rule created but not yet effective. `effective_from` is future or null.
- `active`: Rule is effective. `active=true`, `effective_from <= now()`, `effective_until IS NULL OR > now()`.
- `deprecated`: Rule is superseded by a new version. `effective_until` is set. Existing evidence preserved.
- `retired`: Rule is no longer usable for new generation. `active=false`.

**Migration 080 will add:**
- `ALTER TABLE evidence_generation_rules ADD COLUMN rule_status rule_status DEFAULT 'draft'`
- RLS policies
- Index on `rule_status`

## 5. Verdict

**Rule registry is 80% complete.** Most fields exist. Needs RLS and explicit status enum. No duplicate table.
