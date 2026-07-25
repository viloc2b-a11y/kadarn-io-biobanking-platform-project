# KADARN v2 — Current Schema Inventory

**Date:** 2026-07-25

---

## Current Tables (~70)

Tables are grouped by functional area. Only those relevant to v2 are classified here.

### Identity Registry (6 tables — PRESERVE)

| Table | Rows (est) | v2 Name | Status |
|-------|-----------|---------|--------|
| organizations | ~10 | institutions | PRESERVE (rename via VIEW) |
| people | ~10 | people | PRESERVE |
| locations | ~10 | locations | PRESERVE (add temporal) |
| organization_memberships | ~20 | institution_memberships | PRESERVE (rename via VIEW) |
| organization_roles | ~8 | roles | PRESERVE |
| membership_roles | ~15 | membership_roles | PRESERVE |

### Evidence Core (2 tables — PRESERVE + EXTEND)

| Table | Rows (est) | v2 Name | Status |
|-------|-----------|---------|--------|
| claims | ~50 | claims | EXTEND (add temporal + epistemic) |
| evidence_nodes | ~100 | evidence_nodes | EXTEND (add source_id, source_record_id) |
| evidence_class_ref | 6 | evidence_class_ref | PRESERVE |

### Capability (2 tables — PRESERVE + EXTEND)

| Table | Rows (est) | v2 Name | Status |
|-------|-----------|---------|--------|
| capabilities | ~20 | capabilities | EXTEND (add conditions, temporal) |
| organization_capability_types | ~10 | capability_types | PRESERVE |

### Publication (4 tables — PRESERVE)

| Table | Rows (est) | v2 Name | Status |
|-------|-----------|---------|--------|
| passport_entries | ~10 | passport_entries | PRESERVE (add snapshot_id) |
| passport_shares | ~5 | passport_shares | PRESERVE |
| published_knowledge | ~5 | packages | RENAME (VIEW for compat) |
| confidence_state_snapshots | ~10 | confidence_state_snapshots | PRESERVE |

### Review (1 table — PRESERVE)

| Table | Rows (est) | v2 Name | Status |
|-------|-----------|---------|--------|
| review_tasks | ~10 | review_tasks | PRESERVE |

### Legacy Continuity (8 tables — DEPRECATE)

| Table | Reason |
|-------|--------|
| continuity_experience_claims | Replaced by claims + versions |
| continuity_evidence_items | Replaced by evidence_nodes |
| continuity_evidence_links | Replaced by claim_evidence_links |
| continuity_experience_ledger | Replaced by claim versions |
| continuity_performance_metrics | Replaced by capabilities |
| continuity_references | Replaced by source records |
| continuity_relationships | Replaced by claim_evidence_links |
| continuity_timeline_events | Replaced by audit_events |
| continuity_capabilities | Replaced by capabilities |

### Platform (remaining ~45 tables)

These tables support engines (discovery, fulfillment, logistics, exchange, analytics, etc.) that are **out of MVP scope** per v2 Constitution. They are PRESERVE (not deleted) but not part of the v2 core model.

---

## Table Count Summary

| Category | Count |
|----------|-------|
| v2 Core (Identity, Evidence, Capability, Publication, Review) | 15 tables |
| v2 Legacy (Continuity) | 9 tables |
| v2 Future (new: Sources, Protocols, Assessment, Audit) | 0 (not yet built) |
| Non-core (Engines, Platform) | ~46 tables |
| **Total** | **~70 tables** |
