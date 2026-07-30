# KADARN Document Relationship Map

**Document ID:** KADARN-REL-001  
**Status:** Canonical — Materialized  
**Propósito:** Mapa de relaciones, dependencias y supersesiones entre documentos de governance.

---

## 1. Document relationship diagram

```
                        ┌─────────────────────┐
                        │   KEMS-003 (Const.)  │◄────────────── Product Authority
                        └──────────┬──────────┘
                                   │ governs
                                   ▼
          ┌─────────────────────────────────────────────┐
          │  KEMS-001  KEMS-002  KEMS-004  KEMS-005     │
          │  KEMS-006  KEMS-007  PB-2.7                 │
          │  (Evidence Model Family)                     │
          └─────────────────────────────────────────────┘
                                   │
                                   ▼
          ┌─────────────────────────────────────────────┐
          │  KOSRA v0.2                                  │
          │  (Architectural Identity & OSS Governance)   │
          └──────────┬──────────────────┬────────────────┘
                     │ defines           │ references
                     ▼                   ▼
          ┌─────────────────────┐   ┌─────────────────────┐
          │  CEP v1.0           │   │  ADR-001..034       │
          │  (Phase Sequence)   │   │  (Arch. Decisions)  │
          └──────────┬──────────┘   └─────────────────────┘
                     │ aligns
                     ▼
          ┌─────────────────────┐
          │  KIMP v1.0          │
          │  (Programs & Waves) │
          └──────────┬──────────┘
                     │ controls
                     ▼
          ┌─────────────────────┐
          │  ICO Charter v1.0   │
          │  (Controls & Gates) │
          └──────────┬──────────┘
                     │ executes
                     ▼
          ┌─────────────────────┐
          │  Work Orders        │
          │  (Bounded Tasks)    │
          └─────────────────────┘
```

---

## 2. Supersession records

| Superseded document | Superseded by | Date | Scope |
|--------------------|---------------|------|-------|
| ADR-005 (Architectural Lexicon v1.0) | KEMS-001, KEMS-002, KEMS-003, AF-2.0/2.1 | 2026-07-02 | Terminology definitions superseded by KEMS model terms |
| KOSRA v0.1 | KOSRA v0.2 | 2026-07-27 | Added 3 intelligence domains, metric governance, telemetry boundaries, multiple views |

No other supersessions are currently recorded.

---

## 3. Dependency map

### Document dependencies

| Document | Depends on | For |
|----------|-----------|-----|
| CEP | KOSRA v0.2 | Architectural identity, intelligence domains, OSS governance |
| KIMP | CEP, KOSRA v0.2 | Phase sequence, governance framework |
| ICO Charter | KIMP, CEP, KOSRA v0.2 | Program structure, phase gates, compliance boundaries |
| Work Orders | ICO, KIMP, CEP, KOSRA v0.2 | Authorized scope, controls, architectural compliance |
| KOSRA | KEMS-001..004, ADR-011, ADR-012 | Evidence model, core boundary, engine governance |

### External references

| Document | References |
|----------|-----------|
| KOSRA | ADR-002, ADR-004, ADR-007, ADR-011, ADR-012, ADR-014, KEMS-001..004, PB-2.7, ASSESSMENT-OSS-INTEGRATION.md, ARCHITECTURE.md |
| CEP | KOSRA v0.2, KOSRA_IMPLEMENTATION_MAPPING.md, KOSRA_DECISION_REGISTER.md |
| KIMP | KOSRA v0.2, CEP |
| ICO | KOSRA v0.2, CEP, KIMP |

---

## 4. Cross-reference matrix

| | KEMS | KOSRA | ADRs | CEP | KIMP | ICO |
|--|------|-------|------|-----|------|-----|
| **KEMS** | — | References §§4, 5 | Referenced by ADR-011, 012 | Referenced | — | — |
| **KOSRA** | References §§4, 5, 6 | — | References ADR-002..037 | Governs architecture | Governs OSS | Governs compliance |
| **ADRs** | ADR-011 freezes KEMS boundary | ADR-035..037 proposed | — | ADR sequencing | Referenced | Referenced |
| **CEP** | — | Operates within KOSRA | Phase gates reference ADRs | — | Aligns programs | Phase gates |
| **KIMP** | — | References OSS classification | Work Order ADR requirements | Aligned to phases | — | Delegates controls |
| **ICO** | — | Enforces compliance | Enforces ADR compliance | Enforces gates | Enforces program controls | — |

---

## 5. Unresolved references

| Issue | Documents affected | Status |
|-------|-------------------|--------|
| ADR-005 superseded without formal replacement | ADR-005, KEMS-001..003, AF-2.1 | Pending — active lexicon terms defined across KEMS docs |
| KEMS-001 two divergent copies (docs/kems/ vs vendor/kems/) | KEMS-001, AF-2.1 | Pending Architecture Review |
| KEMS-002 two versions (v1.0 and v1.1) | KEMS-002, AF-2.1 | Pending Architecture Review |

---

*All relationships verified against committed repository baseline (HEAD 9c76848).*
