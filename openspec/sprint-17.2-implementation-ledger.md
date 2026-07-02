# Implementation Ledger — Sprint 17.2

## Evidence Core Persistence

**Sprint:** 17.2  
**Baseline:** AF-1.0  
**Role:** Implementer. No new architectural concepts.  
**Uses domain model from:** Sprint 17.1

---

### Baseline requirements implemented

| Requirement | Source |
|-------------|--------|
| claims table | KEMS-001 §1 |
| evidence_nodes table (immutable) | KEMS-001 §2 Component B |
| evidence_relationships table | KEMS-001 §2 Component C |
| counter_evidence table | KEMS-001 §4 |
| right_of_response table | KEMS-001 §8 |
| confidence_state table (snapshot only) | KEMS-001 §2 Component D |
| provenance metadata | KEMS-001 §2 Component B |
| visibility metadata | KEMS-001 §7 |
| temporal metadata | KEMS-001 §9 |
| Append-only enforcement on evidence | KEMS-001 §4 |
| RLS for multi-actor visibility | KEMS-001 §7 |
| No retired Trust terminology | ADR-010 |

---

### Files created/modified

| File | Purpose |
|------|---------|
| `database/migrations/045_evidence_core.sql` | Database schema: tables, enums, RLS, append-only triggers, indexes |
| `packages/evidence-core/src/repository.ts` | Persistence adapter interface + Supabase implementation |
| `packages/evidence-core/src/db.ts` | Database client type + connection factory |
| `packages/evidence-core/tests/persistence.test.ts` | Persistence tests |
| `packages/evidence-core/package.json` | Updated dependencies |

---

### Schema overview

| Table | Key columns | Constraints |
|-------|-------------|-------------|
| `evidence_classes` | id, name, description, decay_months, default_weight | Reference data, seeded by migration |
| `claims` | id, claim_type_id, name, description, organization_id, status, domain, decays, valid_classes, required_classes | RLS by org |
| `evidence_nodes` | id, claim_id, evidence_class, content, source, date, status, weight, provenance JSONB, visibility JSONB | **Append-only** — no UPDATE/DELETE |
| `evidence_relationships` | id, source_node_id, target_node_id, relationship_type | FK → evidence_nodes, no self-ref |
| `counter_evidence` | Inherits evidence_node fields + is_counter_evidence, has_response, response_id | Negative weight enforced |
| `right_of_response` | id, counter_evidence_id, description, resolution_date, status, supporting_evidence_ids | FK → counter_evidence |
| `confidence_state_snapshots` | claim_id, value, level, explanation, contributions JSONB, snapshot_date | Append-only log, no computation |

---

### Tests

| Test | Validates |
|------|-----------|
| Insert claim and verify | Schema roundtrip |
| Insert evidence node and verify immutability | UPDATE blocked by trigger |
| Insert counter evidence with negative weight | Weight constraint |
| Attach right of response without modifying counter evidence | Separate table, FK |
| RLS prevents unauthorized read | Organization isolation |
| No Trust terminology in schema | Automated scan |

---

### Definition of Done

| Criteria | Status |
|----------|--------|
| Schema supports all Sprint 17.1 entities | ✅ |
| Referential integrity enforced | ✅ |
| Append-only/immutability tested | ✅ |
| No Confidence algorithm introduced | ✅ |
| No API routes introduced | ✅ |
| No retired terminology | ✅ |
| Tests pass | ✅ |
