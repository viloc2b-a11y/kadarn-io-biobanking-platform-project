# KADARN Document Precedence

**Document ID:** KADARN-PREC-001  
**Status:** Canonical — Materialized  
**Propósito:** Define la jerarquía de precedencia entre documentos de governance y las reglas de resolución de conflictos.

---

## 1. Precedence chain

```
LEVEL 1 — Constitutional
    KEMS (Evidence Model Specifications)
    Product Book (Product Constitution)
    KOSRA (Architectural View & OSS Governance)
    ADRs (individual architectural decisions)

LEVEL 2 — Strategic
    Canonical Execution Plan (phase sequence and gates)

LEVEL 3 — Implementation Structure
    Implementation Master Plan — KIMP (programs, work streams, Work Orders)

LEVEL 4 — Control
    ICO Charter (portfolio, compliance, evidence and gate governance)

LEVEL 5 — Execution
    Work Orders (individual bounded tasks)
```

---

## 2. Precedence rules

### Rule 1: Implementation truth outranks all documentation

If a document claims a component is implemented but the repository shows otherwise, the repository wins. No document may override committed code and accepted ADRs.

### Rule 2: Accepted ADRs outrank explanatory text

An accepted ADR governs the specific decision it records. Explanatory architecture text (ARCHITECTURE.md, blueprints, narratives) is subordinate to the ADR on that decision.

### Rule 3: KOSRA governs architecture

KOSRA defines architectural identity, boundaries, intelligence views, and OSS governance. The Execution Plan, KIMP, and ICO Charter operate within KOSRA's framework.

### Rule 4: CEP governs sequence

The Canonical Execution Plan defines the phase sequence, phase gates, and strategic priorities. KIMP and Work Orders must align with the CEP sequence.

### Rule 5: KIMP governs structure

KIMP defines how work is organized into programs, work streams, and Work Orders. It does not override KOSRA or CEP decisions.

### Rule 6: ICO governs controls

The ICO Charter defines portfolio controls, compliance gates, and evidence requirements. It does not override architectural decisions or phase sequencing.

### Rule 7: Work Orders govern execution

A Work Order is the atomic unit of execution. It must reference its governing documents (KOSRA, CEP, KIMP) and comply with their constraints.

### Rule 8: Lower level may not silently override higher authority

A Work Order may not contradict KOSRA. KIMP may not contradict CEP. CEP may not contradict KOSRA or accepted ADRs. If a conflict appears, the higher-level document prevails unless the lower document explicitly cites evidence of implementation change or a newer accepted ADR.

---

## 3. Conflict resolution sequence

When two governance documents appear to conflict:

1. **Verify implementation truth** — check the committed repository baseline.
2. **Check date and version** — the newer version of a document at the same level prevails.
3. **Check precedence level** — the higher level prevails.
4. **Check ADR** — if one side is an accepted ADR, it prevails over non-ADR text at the same level.
5. **Escalate to human gate** — unresolved conflicts require human review.

---

## 4. Supersession rules

- A document may be superseded only by a newer version of the same document or by a higher-level document explicitly addressing the same scope.
- Supersession must be recorded in the superseding document and in `GOVERNANCE_CHANGELOG.md`.
- A superseded document remains in the repository as a historical record unless explicitly archived.

---

## 5. Applicable scope by document

| Document | Governs | Does not govern |
|----------|---------|-----------------|
| KEMS | Evidence model, claims, confidence, provenance | Implementation technology, OSS tools, UI |
| KOSRA | Architecture identity, intelligence views, OSS governance | Product features, delivery schedule, team structure |
| CEP | Phase sequence, gates, strategic priorities | Technology selection, implementation details, UI design |
| KIMP | Program organization, work streams, delivery waves | Architecture decisions, tool selection |
| ICO | Portfolio compliance, controls, evidence gates | Product direction, architectural decisions |
| ADR | Individual architectural decisions | Everything outside the decision's scope |

---

*Precedence established under WO-GOV-001. Conflicts not resolvable through these rules must be escalated to human gate.*
