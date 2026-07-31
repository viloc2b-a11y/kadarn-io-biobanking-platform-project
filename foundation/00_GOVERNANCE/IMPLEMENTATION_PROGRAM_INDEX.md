# KADARN Implementation Program Index

**Document ID:** KADARN-PROG-001  
**Status:** Canonical — Materialized  
**Propósito:** Índice de los programas, work streams y Work Orders definidos en KIMP v1.0.

---

## 1. Program overview

| # | Program | Objective | Work Streams | Waves |
|---|---------|-----------|--------------|-------|
| 1 | Architecture & Governance | Freeze and govern architectural baseline | KOSRA, ADR governance, lexicon, decision register, alignment, doc compliance | Wave 0 |
| 2 | Platform Foundation | Complete and stabilize technical substrate | Evidence Core, policy engine, provenance, confidence, readiness, Hermes, Gateway, observability | Wave 1 |
| 3 | Intelligence Platform | Convert evidence into proprietary intelligence | Capability Intelligence, metrics, matching, recommendation, sponsor intelligence | Wave 3-4 |
| 4 | Product Experience | Expose intelligence through usable workflows | Onboarding, Passport, dashboards, capability explorer, APIs | Wave 3-4 |
| 5 | Open Source Evolution | Accelerate non-differentiating infrastructure | Observability tools, Architecture Intelligence, analytics, ingestion | Wave 5 |
| 6 | Production & Scale | Prepare for secure, scalable operation | Deployment, security, DR, performance, multi-tenancy, support | Wave 6 |

---

## 2. Program 1 — Architecture & Governance

| Work Stream | Work Orders | Status | Dependencies |
|------------|-------------|--------|--------------|
| KOSRA | WO-KOSRA-002 | COMPLETE | — |
| ADR governance | WO-ADR-001 (proposed) | Planned | KOSRA approval |
| Lexicon | WO-LEX-001 (proposed) | Planned | ADR-005, KEMS |
| Governance | WO-GOV-001 | IN PROGRESS | KOSRA, CEP, KIMP, ICO |
| Decision register | — | Complete (KOSRA_DECISION_REGISTER.md) | KOSRA |

## 3. Program 2 — Platform Foundation

| Work Stream | Work Orders | Status | Dependencies |
|------------|-------------|--------|--------------|
| Observability | WO-OBS-001 (metric dictionary) | Planned | CEP Phase 1 approval |
| Observability | WO-OBS-002 (instrumentation audit) | Planned | WO-OBS-001 |
| Observability | WO-OBS-003 (POC) | Planned | WO-OBS-002 |
| Observability | WO-OBS-004 (production decision) | Planned | WO-OBS-003 |
| Evidence Core | — | COMPLETE (existing) | ADR-011 |
| Policy Engine | — | COMPLETE (existing) | ADR-010 |

## 4. Program 3 — Intelligence Platform

| Work Stream | Work Orders | Status | Dependencies |
|------------|-------------|--------|--------------|
| Institutional Intelligence | WO-INT-001 (metric dictionary) | Planned | CEP Phase 3 approval, WO-OBS-001, WO-ARCH-001 |
| Institutional Intelligence | WO-INT-002 (model assessment) | Planned | WO-INT-001 |
| Institutional Intelligence | WO-INT-003 (vertical slice: maturity + freshness) | Planned | WO-INT-002 |
| Institutional Intelligence | WO-INT-004 (vertical slice: drift + evolution) | Planned | WO-INT-003 |
| Institutional Intelligence | WO-INT-005 (governance) | Planned | WO-INT-004 |
| Decision | WO-DEC-001 (use-case prioritization) | Planned | CEP Phase 4 approval, WO-INT-005 |

## 5. Program 4 — Product Experience

| Work Stream | Work Orders | Status | Dependencies |
|------------|-------------|--------|--------------|
| (Work Orders to be defined) | — | Planned | Program 2-3 completion |

## 6. Program 5 — Open Source Evolution

| Work Stream | Work Orders | Status | Dependencies |
|------------|-------------|--------|--------------|
| Architecture Intelligence | WO-ARCH-001 (data model) | Planned | CEP Phase 2 approval |
| Architecture Intelligence | WO-ARCH-002 (extraction pipeline) | Planned | WO-ARCH-001 |
| Architecture Intelligence | WO-ARCH-003 (POC) | Planned | WO-ARCH-002 |
| Architecture Intelligence | WO-ARCH-004 (governance decision) | Planned | WO-ARCH-003 |

## 7. Program 6 — Production & Scale

| Work Stream | Work Orders | Status | Dependencies |
|------------|-------------|--------|--------------|
| (Work Orders to be defined) | — | Planned | Programs 1-5 completion |

---

## 8. Delivery waves

```
Wave 0 ─── Governance (KOSRA, CEP, KIMP, ICO, ADRs)
              ↓
Wave 1 ─── Observability (metrics model → audit → POC)
              ↓
Wave 2 ─── Architecture Intelligence (data model → pipeline → POC)
              ↓
Wave 3 ─── Institutional Intelligence (metrics → slices → governance)
              ↓
Wave 4 ─── Decision & Matching
              ↓
Wave 5 ─── OSS evaluations (individual, isolated)
              ↓
Wave 6 ─── Production hardening & scale
```

---

*Program index derived from KIMP v1.0. Work Orders listed are current and planned; new Work Orders may be added per ICO Charter control process.*
