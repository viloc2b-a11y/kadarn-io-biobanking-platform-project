# KADARN v2 — Minimal Architecture

**Date:** 2026-07-25
**Status:** Pre-implementation proposal
**Principle:** The best architecture is the smallest one that still fully answers "Can this institution execute this protocol, why do we believe it, and what current evidence supports that conclusion?"

---

## 1. Core Principle: Fold, Don't Multiply

Every concept that can be an **attribute** should not be an **entity**.
Every entity that can be a **column** should not be a **table**.
Every table that can be a **JSONB field** should not be a **separate schema**.
Every service that can be a **function** should not be a **package**.

---

## 2. The Minimal Data Model

### Identity Registry (Preserved, no changes)

```
institutions (was organizations) ──┬── people
    │                              ├── locations
    │                              ├── institution_memberships (was org_memberships)
    │                              └── membership_roles
roles                              └── institution_capability_types (was org_capability_types)
```

**Tables:** 6 (all existing)
**Changes:** `organizations` → view as `institutions`, suffix updates

### Source & Evidence Intelligence (2 new tables, 1 extended)

```
evidence_sources (NEW)                    — T1–T4 authority, freshness policy
source_records (NEW)                      — content-addressed, immutable
    └── extractions (JSONB)               — parser runs + observations
evidence_nodes (EXTEND)                   — add: source_id, source_record_id, epistemic_type
```

**New tables:** 2 (instead of 7)
**JSONB columns:** extractions[{parser, version, confidence, observations}]
**Saved tables:** acquisition_runs, extraction_runs, observations, evidence_producers

### Claims & Capability (0 new tables, 2 extended)

```
claims (EXTEND)                           — add: valid_from, valid_until, version, epistemic_type, superseded_by
    └── evidence_links (JSONB)            — [{evidence_id, role: "supports"|"contradicts"|"qualifies"}]
capabilities (EXTEND)                     — add: valid_from, valid_until, conditions, availability, quantity, unit
    └── claim_ids (UUID[])                — multi-claim composition
review_tasks (preserved)
claim_evidence_links (NEW)                — indexed table for supports/contradicts queries
```

**New tables:** 1 (claim_evidence_links — needed for "why do we believe it?")
**Saved tables:** claim_versions (−1), capability_states (−1), capability_claim_links (−1), claim_conflicts (−1), evidence_links (−1)

### Protocol Assessment (3 new tables)

```
protocols (NEW)
protocol_versions (NEW)                   — versioned content
    └── requirements (JSONB)              — [{code, statement, criticality, evidence_expectation}]
assessments (NEW)
    └── results (JSONB)                   — [{requirement_code, result, matched_capability_id, confidence, explanation}]
    └── mitigations (JSONB)               — [{gap, action, responsible, deadline, effect}]
knowledge_snapshots (NEW)                 — immutable publication record
```

**New tables:** 4 (instead of 10)
**Saved tables:** requirements, requirement_rules, assessment_results, gaps, mitigations, package_snapshot_links (−6)

### Publication & Sharing (Preserved, minor extends)

```
passport_entries (EXTEND)                 — add: snapshot_id
packages (was published_knowledge)        — add: snapshot_id, assessment_id
passport_shares (preserved)
```

**Changes:** Rename + add FKs

### Audit (1 new table)

```
audit_events (NEW)                        — entity_type, entity_id, action, actor, previous_state, new_state
```

**Covers:** ProvenanceRecord, audit log, GDPR erasure tracking

---

## 3. Table Summary

| Context | Existing | New | Total |
|---------|----------|-----|-------|
| Identity Registry | 6 | 0 | 6 |
| Source & Evidence | 4 (evidence + class_ref) | 2 | 6 (2 extended) |
| Claims & Capability | 3 (claims, capabilities, reviews) | 1 | 4 (2 extended) |
| Protocol Assessment | 0 | 4 | 4 |
| Publication | 3 (passport_entries, shares, knowledge) | 0 | 3 (extended) |
| Audit | 0 | 1 | 1 |
| **Total** | **16** | **8** | **24** |

**vs. v2 Blueprint: 24 tables (instead of ~45 — 47% fewer)**

---

## 4. The Cost of Simplicity

Every simplification has a trade-off. These are explicit:

| Simplification | Trade-off | Acceptable? |
|---------------|-----------|-------------|
| Claims versioned via columns (no separate table) | Version history queries use COALESCE instead of JOIN. Limit: 100 versions before performance degrades. | ✅ Yes — MVP has <10 versions per claim |
| Observations in JSONB | Cannot query observations independently of their source. Limit: extraction runs with >1000 observations. | ✅ Yes — Continuing Review yields <50 observations |
| Assessment results in JSONB | Cannot index per-requirement results. All results loaded with assessment. Limit: 200 requirements per assessment. | ✅ Yes — first slices have 15–30 requirements |
| Requirements in JSONB | No FK enforcement. Schema validation in application layer. | ✅ Yes — Zod validation before write |
| Gaps computed on read | Assessment report always computed fresh. No historical gap snapshots. | ✅ Yes — KnowledgeSnapshot captures assessment at point of publication |

---

## 5. Architectural Rules for the Minimal Model

1. **One table per aggregate root.** Children of an aggregate are JSONB columns or separate tables only when they have independent lifecycle.
2. **JSONB over new table unless queried independently.** If you only access data through its parent, it's JSONB. If you query it across parents, it's a table.
3. **Temporal columns over version tables.** Add valid_from/valid_until directly. Introduce version tables only when the version count exceeds 100 per entity.
4. **Audit over provenance.** A single audit_events table covers provenance, compliance, and GDPR. Separate provenance tables only when audit trail exceeds 1M events.
5. **Compute over persist.** Gaps, readiness scores, confidence breakdowns are computed. Persist only when computation cost exceeds query savings.
6. **Only 5 bounded contexts.** Identity, SourceEvidence, ClaimsCapability, ProtocolAssessment, Publication. All cross-context communication is via stable UUIDs and application services.

---

## 6. What the Minimal Architecture DELIVERS

### Answer to the Core Question

For every institutional capability required by a protocol:

- **Can the institution execute?** Yes/No/Partial — via Capability matched against Requirement
- **Why do we believe it?** Evidence links with supports/contradicts roles, traced back to SourceRecords with authority levels
- **What current evidence supports that?** SourceRecords with freshness policies, confidence dimensions (8-factor explainability)
- **What's missing?** Gaps computed from assessment results, mitigations proposed
- **Is this reproducible?** KnowledgeSnapshot freezes the state at publication

### Principal Violations Avoided

The minimal architecture does NOT create:
- A CTMS (no patient data, no visit tracking)
- An eReg (no regulatory submission workflow)
- An EMR (no clinical data)
- A marketplace (no listing/bidding workflow)
- A recruitment system (no patient matching)

It IS:
- An institutional knowledge intelligence platform
- Source → Evidence → Claim → Capability → Assessment → Passport
- With Explainable Confidence, Temporal Truth, and Golden Source
