# KADARN Governance Index

**Document ID:** KADARN-GOV-INDEX-001  
**Status:** Canonical — Materialized  
**Propósito:** Índice maestro de todos los documentos de governance canónicos de KADARN.

---

## 1. Governance document hierarchy

```
Level 1 — Constitutional
    KEMS (Evidence Model Specifications)
    Product Book (Product Constitution)
    KOSRA (Architectural View & OSS Governance)
Level 2 — Strategic
    Canonical Execution Plan (Phase Sequence & Gates)
Level 3 — Implementation Structure
    Implementation Master Plan — KIMP (Programs, Work Streams, Work Orders)
Level 4 — Control
    ICO Charter (Portfolio, Compliance, Evidence & Gate Governance)
Level 5 — Execution
    Work Orders (Individual bounded tasks)
```

---

## 2. Document register

| ID | Document | Version | Status | Location | Authority | Precedence Level |
|----|----------|---------|--------|----------|-----------|------------------|
| KEMS-001 | Confidence Graph Model | v1.0 | Canonical Draft | `docs/kems/` | Product Constitution | 1 |
| KEMS-002 | Trustworthy Evidence Architecture | v1.0/v1.1 | Pending Review | `docs/kems/` | Product Constitution | 1 |
| KEMS-003 | Kadarn Product Constitution | v1.0 | Canonical | `docs/kems/` | Product Constitution | 1 |
| KEMS-004 | Claim Provenance Architecture | v1.0 | Canonical | `docs/kems/` | Product Constitution | 1 |
| KEMS-005 | Schema Evolution Standard | v1.0 | — | `docs/kems/` | Product Constitution | 1 |
| KEMS-006 | Systems Integration Standard | v1.0 | — | `docs/kems/` | Product Constitution | 1 |
| KEMS-007 | Evidence Delivery Architecture | v0.1 | Draft | `docs/kems/` | Product Constitution | 1 |
| PB-2.7 | Capability Intelligence | v1.0 | Canonical | `openspec/product-book/` | Product Constitution | 1 |
| KOSRA | Open Source Reference Architecture | v0.2 | Canonical | `foundation/05_ENGINEERING/architecture/KOSRA.md` | Architecture Governance | 1 |
| CEP | Canonical Execution Plan | v1.0 | Canonical | `foundation/05_ENGINEERING/architecture/KADARN_CANONICAL_EXECUTION_PLAN_v1.0.md` | Program Direction | 2 |
| KIMP | Implementation Master Plan | v1.0 | Canonical | `foundation/00_GOVERNANCE/KADARN_IMPLEMENTATION_MASTER_PLAN_v1.0.md` | Program Direction | 3 |
| ICO | Implementation Control Office Charter | v1.0 | Canonical | `foundation/00_GOVERNANCE/KADARN_IMPLEMENTATION_CONTROL_OFFICE_CHARTER_v1.0.md` | Program Direction | 4 |
| ADR-011 | Evidence Core Boundary Rule | v1.0 | Frozen (AF-2.1) | `docs/adr/` | Architecture | 1 |
| ADR-012 | Engine Governance | v1.0 | Frozen (AF-2.1) | `docs/adr/` | Architecture | 1 |
| ADR-001..034 | Architecture Decision Records | — | Various | `docs/adr/` | Architecture | 1 |
| CANONICAL_REPOSITORY.md | Canonical Repository Declaration | v1.0 | Active | `foundation/00_GOVERNANCE/` | KAD-LOOP | 1 |

---

## 3. Supporting documents

| Document | Location | Relation to governance |
|----------|----------|------------------------|
| ARCHITECTURE.md | `repo root` | Functional implementation architecture |
| ASSESSMENT-OSS-INTEGRATION.md | `repo root` | Technical OSS audit (subordinate to KOSRA) |
| KOSRA_IMPLEMENTATION_MAPPING.md | `foundation/05_ENGINEERING/architecture/` | Layer-to-engine correspondence map |
| KOSRA_DECISION_REGISTER.md | `foundation/05_ENGINEERING/architecture/` | Decision classification register |
| KOSRA_MATERIALIZATION_REPORT.md | `foundation/05_ENGINEERING/architecture/` | Phase A materialization record |
| KOSRA_V02_VALIDATION_REPORT.md | `foundation/05_ENGINEERING/architecture/` | v0.2 validation |

---

## 4. Governance artifacts (this directory)

| Artifact | Purpose |
|----------|---------|
| `GOVERNANCE_INDEX.md` | Master index (this file) |
| `DOCUMENT_PRECEDENCE.md` | Precedence hierarchy and conflict resolution |
| `DOCUMENT_RELATIONSHIP_MAP.md` | Relationships, dependencies, supersessions |
| `IMPLEMENTATION_PROGRAM_INDEX.md` | KIMP program/work-stream index |
| `WORK_ORDER_CATALOG.md` | Catalog of current and planned Work Orders |
| `GOVERNANCE_CHANGELOG.md` | Change log for governance documents |
| `KADARN_IMPLEMENTATION_MASTER_PLAN_v1.0.md` | KIMP — Programs and delivery waves |
| `KADARN_IMPLEMENTATION_CONTROL_OFFICE_CHARTER_v1.0.md` | ICO Charter — Controls and gates |
| `CANONICAL_REPOSITORY.md` | Repository declaration (pre-existing) |
| `DOCUMENTARY_DRIFT_REGISTER.md` | Canonical conformance drift tracking — discrepancies found and resolved |

---

## 5. Document status vocabulary

| Status | Meaning |
|--------|---------|
| Canonical — Materialized | Approved and written into the repository |
| Canonical Draft | Pending ratification |
| Proposed Canonical | Pending human approval and materialization |
| Frozen | Cannot be modified without formal process |
| Accepted | ADR accepted by Architecture |
| Superseded | Replaced by a newer version |
| Draft | Work in progress |

---

*This index is the entry point for all KADARN governance documentation. Last updated: 2026-08-08.*
