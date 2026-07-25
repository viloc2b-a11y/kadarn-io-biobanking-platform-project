# KADARN v2 Migration Strategy

**Document:** MIG-001  
**Date:** 2026-07-25  
**Authority:** Implementation Blueprint v2.0 §16–17, Master Realignment Plan §4  

---

## 1. Guiding Principles

1. **Zero data loss.** All existing records remain accessible. No destructive migrations.
2. **Backward compatibility.** Existing APIs continue to respond during migration. Views/triggers bridge old→new schemas.
3. **Dual-read during cutover.** New code reads from v2 tables; legacy code optionally reads from v1 views. When v2 is verified, reads flip.
4. **Incremental blocks.** Each block is independently deployable and testable.
5. **Canonical source discipline.** `database/migrations/` remains the sole canonical source. `supabase/migrations/` is a deployment artifact synced deterministically.

---

## 2. Migration Blocks

Following Implementation Blueprint §16, migrations are organized into 8 blocks (A–H), each corresponding to a bounded context.

### Block A — Sources (Migrations 073–075)

**Purpose:** Establish Source Intelligence as the foundation of provenance.

**Tables to create:**
- `evidence_sources` — logical source with authority level, producer, freshness policy
- `evidence_producers` — person, system, or organization that generates data
- `source_records` — acquired records with content hash, URI, schema version
- `acquisition_runs` — connector execution tracking
- `extraction_runs` — parser/model execution tracking

**Backward compatibility:**
- Existing `evidence_nodes` retains all columns
- Add nullable `source_id` + `source_record_id` to evidence_nodes

**Rollback:** `DROP TABLE IF EXISTS` for new tables. `ALTER TABLE evidence_nodes DROP COLUMN IF EXISTS source_id`.

### Block B — Provenance (Migrations 076–078)

**Purpose:** Normalize provenance tracking across all entities.

**Tables to create:**
- `observations` — pre-normalization extracted values
- `evidence_links` — typed relationships between evidence and claims (supports, contradicts, qualifies)

**Existing tables to extend:**
- `provenance_records` — align schema to v2: entity_type, entity_id, action (enum), actor_id, previous_state, new_state

**Dual-read strategy:**
- New code writes to both old and new provenance tables during transition
- `provenance-recorder.ts` is replaced by direct writes to `provenance_records` table
- Old events remain readable

### Block C — Claims v2 (Migrations 079–081) ⚠️ CRITICAL

**Purpose:** Introduce claim versioning, evidence relationship typing, and conflict tracking.

**Tables to create:**
- `claim_versions` — temporal claim values with epistemic_type, valid_from/until
- `claim_evidence_links` — relationship between claims and evidence
- `claim_conflicts` — detected and resolved conflicts

**Migration strategy for existing claims:**
1. Keep `claims` table as identity (stable UUIDs)
2. Create `claim_versions` with FK to `claims.id`
3. Backfill: For each existing claim, create initial ClaimVersion with:
   - version = 1
   - value = current description/name
   - epistemic_type = 'human' (conservative default)
   - valid_from = created_at
   - valid_until = NULL (still valid)
4. Add database trigger: on INSERT to `claims`, auto-create version 1
5. Add function: on UPDATE to `claims`, auto-create new ClaimVersion

**Dual-read:**
- Legacy claims API reads from `claims` + latest `claim_versions`
- New claims API reads from `claim_versions` with full history
- During transition, both return same data for latest version

### Block D — Capability Intelligence (Migrations 082–083)

**Purpose:** Add temporal states and composition to capabilities.

**Tables to create:**
- `capability_states` — temporal capability states with availability, quantity, conditions
- `capability_claim_links` — typed composition relationships

**Migration:**
1. Backfill: For each existing capability, create initial CapabilityState with:
   - status = current capabilities.status
   - valid_from = capabilities.created_at
   - valid_until = NULL
2. Create initial link to primary_claim_id if set

**Backward compatibility:**
- `capabilities` table remains with current schema
- New code reads capability via `capabilities` + latest `capability_states`

### Block E — Protocol Intelligence (Migrations 084–085)

**Purpose:** Entirely new domain. No migration needed from existing data.

**Tables to create:**
- `protocols` — protocol identity
- `protocol_versions` — versioned protocol data with hash
- `requirements` — normalized requirements with criticality
- `requirement_rules` — versioned matching rules

**Backward compatibility:** N/A (no existing data to migrate).

### Block F — Assessment Engine (Migrations 086–087)

**Purpose:** Entirely new domain for contextual protocol assessment.

**Tables to create:**
- `assessments` — assessment execution with protocol_version, institution, snapshot
- `assessment_results` — per-requirement results
- `gaps` — identified gaps with severity
- `mitigations` — proposed actions

**Migration from readiness:**
1. Keep `readiness_scores` table for backward compatibility
2. New assessment tables are independent
3. Existing readiness_score data can be referenced but is not migrated

### Block G — Publication (Migrations 088–089)

**Purpose:** Add reproducible snapshots and formalize Package concept.

**Tables to create:**
- `knowledge_snapshots` — immutable snapshot of claim versions, evidence, capabilities
- `package_snapshot_links` — links packages to their snapshot

**Migration:**
1. Add `snapshot_id` column to `passport_entries` (nullable)
2. Add `snapshot_id` + `assessment_id` columns to `packages` (was `published_knowledge`)
3. Rename `published_knowledge` to `packages` via VIEW + new table (no data loss)

### Block H — Governance (Migration 090)

**Purpose:** Formal audit trail for compliance.

**Tables to create:**
- `audit_events` — immutable event log

**Migration:**
- No migration from existing data. New table, clean start.
- Existing audit.ts service writes to both old and new during transition.

---

## 3. Dependency Order

```
Block A (Sources) ──┐
                    ├── Block B (Provenance) ──┐
Block C (Claims) ───┘                         │
                                               ├── Block D (Capability) ──┐
Block E (Protocol) ────────────────────────────┤                           │
                                               ├── Block F (Assessment) ──┤
Block G (Publication) ─────────────────────────┘                         │
                                                                          ├── Block H (Governance)
```

**Execution order:**
1. Block A (Sources) — prerequisite for all provenance
2. Block B (Provenance) — prerequisite for claim evidence links
3. Block C (Claims) — prerequisite for capability composition
4. Block D (Capability) — prerequisite for assessment matching
5. Block E (Protocol) — independent, can run parallel to D
6. Block F (Assessment) — depends on Claims, Capability, Protocol
7. Block G (Publication) — depends on Assessment
8. Block H (Governance) — independent, runs last or in parallel

---

## 4. Rollback Strategy

Each migration block must be reversible within one sprint:

| Block | Rollback | Risk |
|-------|----------|------|
| A | Drop new tables; remove nullable columns from evidence_nodes | Low |
| B | Drop new tables; revert provenance_recorder | Medium |
| C | **Cannot roll back** after backfill without data loss | **HIGH** |
| D | Drop new tables; capabilities table unchanged | Low |
| E | Drop new tables (no production data) | Low |
| F | Drop new tables; readiness_scores unchanged | Low |
| G | Drop new tables; revert view to published_knowledge | Medium |
| H | Drop audit_events table | Low |

**Mitigation for C:** Before running Block C backfill, take a full database snapshot. The claims table itself is never dropped — only `claim_versions` is added. To undo, truncate `claim_versions` table and drop the migration.

---

## 5. Feature Flag Strategy

| Flag | Purpose | Duration |
|------|---------|----------|
| `v2_sources_enabled` | Enable source registry API | Sprint 1–2 |
| `v2_claim_versions` | Enable versioned claims read/write | Sprint 3 (permanent) |
| `v2_assessment_engine` | Enable protocol assessment | Sprint 8 (permanent) |
| `v2_snapshots` | Enable snapshot on publish | Sprint 10 (permanent) |

Flags are stored in `app_config` table or environment variables. Default is `false` until the block is validated.

---

## 6. Validation Protocol

Each migration block must pass:

1. **Migration applied** — `supabase db reset` clean from 001 through block's max migration
2. **Existing tests pass** — `npm run test` baseline preserved
3. **Block-specific golden cases** — new tests for block features
4. **RLS verification** — auth and cross-tenant isolation checked
5. **Rollback verified** — rollback script tested in local environment
6. **Dual-read verified** — old and new code paths produce identical results
7. **Build + typecheck** — `npm run build && npm run typecheck`

---

## 7. Timeline Estimate

| Block | Sprint | Duration | Risk-Adjusted |
|-------|--------|----------|--------------|
| A — Sources | 1 | 5 days | 7 days |
| B — Provenance | 2 | 5 days | 7 days |
| C — Claims v2 | 3 | 8 days | 12 days |
| D — Capability | 4 | 5 days | 7 days |
| E — Protocol | 7 | 5 days | 7 days |
| F — Assessment | 8 | 8 days | 10 days |
| G — Publication | 10 | 5 days | 7 days |
| H — Governance | 11 | 3 days | 5 days |

**Total estimated: ~44 sprint days (~11 sprints)**

This follows the Master Realignment Plan's 11-sprint sequence (Sprint 0–10 in the original, now Sprint 0–11 with v2 alignment sprints).
