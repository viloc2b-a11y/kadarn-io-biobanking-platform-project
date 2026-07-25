# KADARN v2 — Ratified Migration Sequence

**Date:** 2026-07-25
**Last current migration:** 072 (kad012_vilo_seed)

---

## Blocks

### Block A — Sources (Sprint 1)

| # | Migration | Table | Type | Backfill | Rollback |
|---|-----------|-------|------|----------|----------|
| A1 | 073 | evidence_sources | NEW | None | DROP TABLE |
| A2 | 074 | source_records | NEW | None | DROP TABLE |

### Block B — Claim Evidence (Sprint 2)

| # | Migration | Table | Type | Backfill | Rollback |
|---|-----------|-------|------|----------|----------|
| B1 | 075 | claim_evidence_links | NEW | Link existing evidence to claims (implicit supports) | DROP TABLE |
| B2 | 076 | evidence_nodes (extend) | EXTEND | Add source_id, source_record_id (nullable) | DROP COLUMN |

### Block C — Temporal Claims (Sprint 3)

| # | Migration | Table | Type | Backfill | Rollback |
|---|-----------|-------|------|----------|----------|
| C1 | 077 | claims (extend) | EXTEND | Add claim_family_id=id, version=1, valid_from=created_at | DROP COLUMN (data preserved) |
| C2 | 078 | capabilities (extend) | EXTEND | Add valid_from=created_at, conditions={} | DROP COLUMN |

### Block D — Snapshots (Sprint 4)

| # | Migration | Table | Type | Backfill | Rollback |
|---|-----------|-------|------|----------|----------|
| D1 | 079 | knowledge_snapshots | NEW | None | DROP TABLE |
| D2 | 080 | passport_entries (extend) | EXTEND | Add snapshot_id (nullable) | DROP COLUMN |

### Block E — Protocols (Sprint 5)

| # | Migration | Table | Type | Backfill | Rollback |
|---|-----------|-------|------|----------|----------|
| E1 | 081 | protocols | NEW | None | DROP TABLE |
| E2 | 082 | protocol_versions | NEW | None | DROP TABLE |

### Block F — Assessments (Sprint 5/6)

| # | Migration | Table | Type | Backfill | Rollback |
|---|-----------|-------|------|----------|----------|
| F1 | 083 | assessments | NEW | None | DROP TABLE |

### Block G — Audit (Sprint 6)

| # | Migration | Table | Type | Backfill | Rollback |
|---|-----------|-------|------|----------|----------|
| G1 | 084 | audit_events | NEW | None | DROP TABLE |

### Block H — Publication Rename (Sprint 6)

| # | Migration | Table | Type | Backfill | Rollback |
|---|-----------|-------|------|----------|----------|
| H1 | 085 | packages + view published_knowledge | RENAME | Create VIEW for old name | DROP VIEW, rename table back |

---

## Feature Flags

| Flag | Block | Purpose | Introduced | Removed |
|------|-------|---------|------------|---------|
| `v2_sources` | A | Enable source registry endpoints | Sprint 2 | Sprint 4 |
| `v2_claim_versions` | C | Enable temporal claim reads | Sprint 3 | Sprint 5 |
| `v2_assessment` | F | Enable assessment engine | Sprint 6 | Sprint 8 |

## Summary

| Block | Sprint | Total Migrations | Irreversible? |
|-------|--------|-----------------|---------------|
| A (Sources) | 1 | 2 | No |
| B (Links) | 2 | 2 | No |
| C (Temporal) | 3 | 2 | No (columns with defaults) |
| D (Snapshots) | 4 | 2 | No |
| E (Protocols) | 5 | 2 | No |
| F (Assessment) | 5–6 | 1 | No |
| G (Audit) | 6 | 1 | No |
| H (Rename) | 6 | 1 | No (VIEW) |

**Total new migrations: 13** (within the 8–14 range from the ratified estimate)
**Lowest risk approach:** Each block is independently rollbackable. No destructive operations.
