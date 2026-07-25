# KADARN v2 — v1 vs v2 Schema Reconciliation

**Date:** 2026-07-25

---

## Three-State Comparison

| v1 Table | v1 Status | v2 Ratified Status | v2 Table | Action |
|----------|-----------|-------------------|----------|--------|
| organizations | IDENTITY | PRESERVE | institutions | VIEW rename |
| people | IDENTITY | PRESERVE | people | None |
| locations | IDENTITY | PRESERVE | locations | Add valid_from/until later |
| organization_memberships | IDENTITY | PRESERVE | institution_memberships | VIEW rename |
| organization_roles | IDENTITY | PRESERVE | roles | None |
| membership_roles | IDENTITY | PRESERVE | membership_roles | None |
| organization_capability_types | CAPABILITY | PRESERVE | capability_types | None |
| claims | CLAIMS | EXTEND | claims | +claim_family_id, version, temporal, epistemic |
| evidence_nodes | EVIDENCE | EXTEND | evidence_nodes | +source_id, source_record_id, epistemic_type |
| evidence_class_ref | EVIDENCE | PRESERVE | evidence_class_ref | None |
| capabilities | CAPABILITY | EXTEND | capabilities | +conditions, availability, quantity, temporal |
| review_tasks | REVIEW | PRESERVE | review_tasks | +evidence_id (already added) |
| passport_entries | PUBLICATION | PRESERVE | passport_entries | +snapshot_id later |
| passport_shares | PUBLICATION | PRESERVE | passport_shares | None |
| published_knowledge | PUBLICATION | RENAME | packages | VIEW for compat |
| confidence_state_snapshots | CONFIDENCE | PRESERVE | confidence_state_snapshots | +8-dimension breakdown later |

## New Tables (8) — Ratified

| Table | Context | Introduced In |
|-------|---------|---------------|
| evidence_sources | Source & Evidence | Sprint 1 |
| source_records | Source & Evidence | Sprint 1 |
| claim_evidence_links | Claims & Capability | Sprint 2 |
| protocols | Protocol Assessment | Sprint 5 |
| protocol_versions | Protocol Assessment | Sprint 5 |
| assessments | Protocol Assessment | Sprint 5 |
| knowledge_snapshots | Publication | Sprint 4 |
| audit_events | Governance | Sprint 6 |

## Tables NOT in v2 Core

All continuity tables (8): **DEPRECATE** (absorbed by v2 equivalents)
All engine-specific tables (~46): **PRESERVE** (out of scope, not deleted)
