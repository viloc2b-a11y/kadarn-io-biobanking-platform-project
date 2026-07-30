# KADARN Implementation Master Plan (KIMP) v1.0

**Document ID:** KADARN-KIMP-001  
**Status:** Canonical — Materialized  
**Owner:** KADARN Program Direction  
**Governance basis:** KOSRA v0.2 and KADARN Canonical Execution Plan v1.0

## 1. Purpose
KIMP governs how KADARN is implemented from the current verified baseline through production scale. It converts architectural direction into programs, work streams, Work Orders, dependencies, gates, evidence requirements, and completion rules.

## 2. Scope
KIMP governs six implementation programs:
1. Architecture & Governance.
2. Platform Foundation.
3. Intelligence Platform.
4. Product Experience.
5. Open Source Evolution.
6. Production & Scale.

## 3. Program model
Each Program contains Work Streams. Each Work Stream contains bounded Work Orders. Every Work Order must define objective, baseline, scope, exclusions, deliverables, acceptance criteria, evidence, tests, rollback, owner, dependencies, and human gate.

## 4. Program 1 — Architecture & Governance
**Objective:** freeze and govern the architectural baseline without replacing implementation truth.

Work streams: KOSRA, ADR governance, canonical lexicon, decision register, product/engineering alignment, documentation compliance.

Initial Work Orders:
- WO-KOSRA-002 — KOSRA v0.2 controlled restructuring (COMPLETE).
- WO-ADR-001 — validate proposed ADR-035 through ADR-037 and create only those approved.
- WO-LEX-001 — materialize the active architecture and intelligence lexicon.
- WO-GOV-001 — validate canonical document precedence and supersession rules.

Completion gate: KOSRA v0.2 validated; active lexicon established; ADR conflicts resolved; canonical precedence published; no implementation state overstated.

## 5. Program 2 — Platform Foundation
**Objective:** complete and stabilize the technical substrate on which intelligence and product experiences depend.

Work streams: Evidence Core, entity/claim/evidence boundaries, policy engine, provenance, confidence, readiness, Passport, Hermes, Gateway, operational observability.

Key rules:
- Existing implemented components are improved, not rebuilt.
- OPA remains Shadow Mode until the promotion gate is approved.
- Observability is telemetry, not semantic evidence.
- No new database is introduced without demonstrated need and ADR.

## 6. Program 3 — Intelligence Platform
**Objective:** convert validated evidence into proprietary Institutional Capability Intelligence and explainable decisions.

Work streams: Capability Intelligence, Evidence Freshness, Provenance Coverage, Capability Maturity, Confidence Drift, Readiness Evolution, Gap Intelligence, Matching, Recommendation, Sponsor Intelligence, Portfolio Intelligence, forecasting.

Maturity truth:
- Evidence/Capability/Readiness foundations exist.
- Matching remains incomplete until committed evidence proves otherwise.
- Recommendation and forecasting are not considered implemented without executable evidence.

## 7. Program 4 — Product Experience
**Objective:** expose KADARN intelligence through usable workflows for institutions, sites, sponsors, and internal operators.

Work streams: onboarding, institutional interview, Passport, dashboard, capability explorer, readiness, documents, reports, sharing, sponsor view, search, APIs.

Product gate: no UI may create a second source of truth or bypass Evidence Core, policy, provenance, authorization, or review boundaries.

## 8. Program 5 — Open Source Evolution
**Objective:** accelerate non-differentiating infrastructure while protecting the proprietary core.

Mandatory lifecycle: demonstrated need → boundary → alternatives → isolated POC → acceptance criteria → ADR → adopt/adapt/defer/reject.

Initial candidates:
- Grafana / Prometheus or VictoriaMetrics / Loki for Operational Observability.
- Evidence.dev for read-only Architecture Intelligence.
- DuckDB and Rill for analytical projections.
- MarkItDown for document ingestion.
- OpenLineage for technical lineage only.
- HAPI FHIR only after a demonstrated interoperability requirement.
- FastAPI only for an approved specialized Python service.

## 9. Program 6 — Production & Scale
**Objective:** prepare the verified product for secure, recoverable, supportable and scalable operation.

Work streams: deployment, environments, secrets, security, backups, disaster recovery, performance, monitoring, incident response, data retention, multi-tenancy, compliance evidence, support.

Scale rule: enterprise BI, warehouses, additional databases and distributed infrastructure are deferred until volume, latency, tenancy or governance requirements demonstrate necessity.

## 10. Delivery waves
- Wave 0: KOSRA and canonical governance.
- Wave 1: Operational metric model and instrumentation audit.
- Wave 2: Architecture Intelligence model and read-only POC.
- Wave 3: Institutional Intelligence metric dictionary and first vertical slices.
- Wave 4: Matching and Decision Intelligence.
- Wave 5: controlled OSS evaluations.
- Wave 6: production hardening and scale.

## 11. Work Order standard
Every Work Order must include:
- immutable identifier and title;
- baseline repository, branch and HEAD;
- objective and business question;
- in-scope and prohibited actions;
- dependencies and assumptions;
- deliverables and affected boundaries;
- acceptance criteria and tests;
- evidence package;
- risks, rollback and recovery;
- human approval gate;
- final status: accepted, correction required, rejected or superseded.

## 12. Program controls
No Work Order may close solely because files were created. Closure requires implemented or documentary evidence, test results where applicable, baseline preservation, scope compliance and human acceptance.

## 13. Initial execution sequence
1. WO-KOSRA-002 (COMPLETE).
2. Human review of KOSRA v0.2.
3. WO-OBS-001.
4. WO-ARCH-001.
5. WO-INT-001.
6. Independent POCs only after the corresponding model and boundary are approved.

## 14. Success criteria
KIMP succeeds when KADARN can explain what exists, what is missing, what is next, why a technology is present, what evidence closes each Work Order, and who authorized progression.

---

**Document references:** KOSRA v0.2 (`foundation/05_ENGINEERING/architecture/KOSRA.md`), CEP (`foundation/05_ENGINEERING/architecture/KADARN_CANONICAL_EXECUTION_PLAN_v1.0.md`), Governance Index (`foundation/00_GOVERNANCE/GOVERNANCE_INDEX.md`).
