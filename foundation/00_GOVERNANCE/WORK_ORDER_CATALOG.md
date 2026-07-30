# KADARN Work Order Catalog

**Document ID:** KADARN-WOC-001  
**Status:** Canonical — Materialized  
**Propósito:** Catálogo indexado de todas las Work Orders actuales y planificadas.

---

## 1. Work Order catalog

| ID | Title | Program | Owner | Dependencies | Status | Acceptance Criteria | ADR Required |
|----|-------|---------|-------|--------------|--------|-------------------|--------------|
| WO-KOSRA-002 | KOSRA v0.2 Controlled Restructuring | 1 — Architecture & Governance | Hermes | KOSRA v0.1 reconciliation | ✅ COMPLETE | KOSRA.md v0.2, Implementation Mapping, Decision Register, Validation Report | No (ADRs 035-037 proposed) |
| WO-GOV-001 | Canonical Governance Integration | 1 — Architecture & Governance | Hermes | KOSRA v0.2, CEP, KIMP, ICO | 🔄 IN PROGRESS | Governance hierarchy materialized, validated, documented | No |
| WO-OBS-001 | Operational Metric Dictionary & Telemetry Boundary | 2 — Platform Foundation | — | CEP Phase 1 approval, KOSRA v0.2 §3.1, §10 | 📋 PLANNED | Metric definitions, boundary rules, allowed/prohibited fields | Yes |
| WO-OBS-002 | Current Instrumentation Audit | 2 — Platform Foundation | — | WO-OBS-001 | 📋 PLANNED | Audit report, gap analysis, recommendations | — |
| WO-OBS-003 | Minimal Observability POC | 2 — Platform Foundation | — | WO-OBS-002 | 📋 PLANNED | Working observability stack, acceptance criteria met | Yes |
| WO-OBS-004 | Production-Readiness & Retention Decision | 2 — Platform Foundation | — | WO-OBS-003 | 📋 PLANNED | Production readiness assessment, retention policy | Yes |
| WO-ARCH-001 | Architecture Intelligence Data Model | 5 — OSS Evolution | — | CEP Phase 2 approval, KOSRA v0.2 §3.2, §9 | 📋 PLANNED | Canonical projection schema, extraction pipeline design | Yes |
| WO-ARCH-002 | Read-Only Extraction Pipeline | 5 — OSS Evolution | — | WO-ARCH-001 | 📋 PLANNED | Deterministic, reproducible pipeline | — |
| WO-ARCH-003 | Evidence.dev Isolated POC | 5 — OSS Evolution | — | WO-ARCH-002 | 📋 PLANNED | Working Architecture Intelligence dashboard, acceptance criteria | Yes |
| WO-ARCH-004 | Governance & Publication Decision | 5 — OSS Evolution | — | WO-ARCH-003 | 📋 PLANNED | Adopt/adapt/defer/reject decision | Yes |
| WO-INT-001 | Canonical Institutional Intelligence Metric Dictionary | 3 — Intelligence Platform | — | CEP Phase 3 approval, KOSRA v0.2 §3.3 | 📋 PLANNED | 8 metric families defined, governed metadata schema | Yes |
| WO-INT-002 | Snapshot & Historical Model Assessment | 3 — Intelligence Platform | — | WO-INT-001 | 📋 PLANNED | Assessment report, gap analysis | — |
| WO-INT-003 | Capability Maturity & Evidence Freshness Vertical Slice | 3 — Intelligence Platform | — | WO-INT-002 | 📋 PLANNED | Working prototype, acceptance criteria | — |
| WO-INT-004 | Confidence Drift & Readiness Evolution Vertical Slice | 3 — Intelligence Platform | — | WO-INT-003 | 📋 PLANNED | Working prototype, acceptance criteria | — |
| WO-INT-005 | Institutional Intelligence Governance & Validation | 3 — Intelligence Platform | — | WO-INT-004 | 📋 PLANNED | Governance framework, validation report | Yes |
| WO-DEC-001 | Decision Analytics Use-Case Prioritization | 3 — Intelligence Platform | — | CEP Phase 4 approval, WO-INT-005 | 📋 PLANNED | Prioritized use-case list, evaluation criteria | — |
| WO-DEC-002 | Analytical Engine Comparison | 3 — Intelligence Platform | — | WO-DEC-001 | 📋 PLANNED | Comparison report, recommendation | — |
| WO-DEC-003 | Read-Only POC | 3 — Intelligence Platform | — | WO-DEC-002 | 📋 PLANNED | Working POC, acceptance criteria | Yes |
| WO-DEC-004 | Matching & Recommendation Governance | 3 — Intelligence Platform | — | WO-DEC-003 | 📋 PLANNED | Governance framework, ADR | Yes |
| WO-ADR-001 | ADR-035-037 Validation | 1 — Architecture & Governance | — | KOSRA approval | 📋 PLANNED | ADRs created only if validated | Yes (creates ADRs) |
| WO-LEX-001 | Active Lexicon Materialization | 1 — Architecture & Governance | — | ADR-005, KEMS | 📋 PLANNED | Active lexicon document with KOSRA terms | Yes |

---

## 2. Status vocabulary

| Status | Meaning |
|--------|---------|
| ✅ COMPLETE | Work Order finished, deliverables accepted |
| 🔄 IN PROGRESS | Work Order being executed |
| 📋 PLANNED | Defined but not yet authorized |
| ⏸ BLOCKED | Blocked by dependency or gate |
| 📝 DRAFT | Being defined |

---

## 3. Execution sequence

The immediate authorized sequence:

```
1. WO-KOSRA-002      ✅ COMPLETE
2. WO-GOV-001        🔄 IN PROGRESS
3. Human review gate
4. WO-OBS-001        📋 Planned (next after review)
5. WO-ARCH-001       📋 Planned
6. WO-INT-001        📋 Planned
7. WO-ADR-001        📋 Planned
8. WO-LEX-001        📋 Planned
```

No POC Work Order may begin before its corresponding design Work Order (metric dictionary or data model) is approved.

---

*Catalog auto-generated from governance baseline. Last updated: 2026-07-27.*
