# KADARN Canonical Execution Plan v1.0

**Document ID:** KADARN-CEP-001  
**Title:** Canonical Execution Plan for KOSRA, Observability, Architecture Intelligence and Institutional Intelligence  
**Version:** 1.0  
**Status:** Canonical — Materialized  
**Date:** 2026-07-27  
**Owner:** KADARN Program Direction  
**Governance Framework:** KOSRA v0.2  

---

## 1. Purpose

This document defines the canonical execution sequence for evolving KADARN after the materialization and restructuring of KOSRA.

Its purpose is to prevent fragmented implementation, uncontrolled open-source adoption, duplicated architecture, and premature expansion. It establishes a single ordered program that separates:

1. **Operational Observability** — whether the system is healthy.
2. **Architecture Intelligence** — whether the platform is evolving coherently.
3. **Institutional Intelligence** — what an institution can actually do, with what evidence and confidence.
4. **Decision Analytics** — which decisions should be made from that intelligence.
5. **Open-Source Evolution** — which external components should be adopted, adapted, studied, deferred, or rejected.

This plan is not an installation list. It is a governed sequence of decisions, evaluations, and implementation gates.

---

## 2. Canonical Architectural Identity

KADARN is an **Institutional Capability Intelligence Platform** that transforms institution-owned evidence into explainable capability, readiness, confidence, gap, and decision intelligence.

The canonical value flow is:

```text
Data Fabric
    ↓
Evidence Core
    ↓
Evidence Intelligence
    ↓
Capability Intelligence
    ↓
Decision Intelligence
    ↓
Applications and Distribution
```

Three transversal domains govern this flow:

```text
Operational Observability
Architecture Intelligence
Institutional Intelligence
```

These domains are complementary and must not be merged into a single semantic layer.

---

## 3. Governing Principles

### 3.1 State first

Every decision must begin with the real committed implementation, followed by accepted architectural decisions, and only then by roadmaps or external proposals.

### 3.2 Preserve the proprietary core

The following remain KADARN-owned intellectual property:

- Canonical Entity Model.
- Evidence Core.
- Claim and provenance semantics.
- Confidence Graph and confidence projections.
- Capability Intelligence.
- Readiness and gap logic.
- Institutional Intelligence.
- Decision Intelligence.

Open-source tools may support, expose, transport, analyze, or observe these domains, but may not redefine them.

### 3.3 No technology without demonstrated need

No repository, framework, service, database, or analytical engine may be introduced because it is popular or appears in KOSRA.

Every adoption must follow:

```text
Demonstrated need
    ↓
Boundary definition
    ↓
Alternative evaluation
    ↓
Isolated POC
    ↓
Acceptance criteria
    ↓
ADR
    ↓
Adopt / Adapt / Study / Defer / Reject
```

### 3.4 Dashboards are projections, not sources of truth

Grafana, Evidence.dev, Rill, Superset, or any other dashboard must consume canonical records through read-only projections.

They may not become the authoritative source for:

- architectural decisions;
- ADR status;
- claims;
- evidence;
- provenance;
- capability definitions;
- readiness decisions;
- policy decisions.

### 3.5 Evidence is not telemetry

Operational logs, traces, and runtime metrics are not institutional evidence and do not replace semantic provenance.

### 3.6 Human-governed progression

Every phase ends in a human review gate before the next phase begins.

---

## 4. Program Sequence

The approved sequence is:

```text
Phase 0 — Architectural Foundation
    ↓
Phase 1 — Operational Observability
    ↓
Phase 2 — Architecture Intelligence
    ↓
Phase 3 — Institutional Intelligence
    ↓
Phase 4 — Decision Analytics
    ↓
Phase 5 — Open-Source Evolution
    ↓
Phase 6 — Enterprise Scale
```

Phases may overlap only when they have separate Work Orders, isolated scopes, explicit owners, and no dependency conflict.

---

# Phase 0 — Architectural Foundation

## Objective

Establish the architectural and governance baseline before further implementation.

## Scope

- Reconcile KOSRA with the repository baseline.
- Materialize KOSRA.
- Restructure KOSRA to separate the three intelligence domains.
- Protect the proprietary core.
- Establish Build vs Adopt governance.
- Resolve OPA, FastAPI, roadmap, lexicon, and ADR-numbering conflicts.

## Current status

```text
Baseline reconciliation       COMPLETE
KOSRA materialization         COMPLETE
KOSRA v0.2 restructuring      COMPLETE
Human approval gate           PENDING
```

## Required canonical outputs

- `KOSRA.md`
- `KOSRA_IMPLEMENTATION_MAPPING.md`
- `KOSRA_DECISION_REGISTER.md`
- `KOSRA_MATERIALIZATION_REPORT.md`
- `KOSRA_V02_VALIDATION_REPORT.md`

## Completion gate

Phase 0 is complete only when:

- KOSRA v0.2 has been materialized and validated;
- no implementation state is overstated;
- no duplicate ADR numbering exists;
- Operational Observability, Architecture Intelligence, and Institutional Intelligence have explicit boundaries;
- the approved baseline is recorded;
- human review accepts the result.

---

# Phase 1 — Operational Observability

## Strategic question

> Is the KADARN operating environment healthy, reliable, and recoverable?

## Objective

Instrument Hermes, Hermes Gateway, APIs, workers, policy evaluation, jobs, and supporting infrastructure without mixing runtime telemetry with institutional evidence.

## Candidate technologies

- Grafana.
- Prometheus or VictoriaMetrics.
- Loki, only if justified.
- OpenTelemetry, if required by the selected design.

Candidate status does not imply adoption.

## Initial scope

### Runtime metrics

- Hermes heartbeat health.
- Gateway request rate and error rate.
- Work Order processing latency.
- Issue polling latency.
- Queue depth, when queues exist.
- Worker availability.
- Job success and failure rate.
- OPA evaluation latency.
- OPA shadow divergence count.
- Authentication failure count.
- API endpoint latency.
- CPU and memory usage where operationally relevant.

### Structured logs

Allowed:

- `trace_id`
- `work_order_id`
- `issue_id`
- `claim_id` as a non-content identifier
- `policy_id`
- `decision_result`
- `latency_ms`
- `error_code`
- `component`
- `environment`

Prohibited:

- PHI.
- PII.
- access tokens.
- evidence content.
- claim content.
- document bodies.
- secrets.
- raw credentials.

## Required Work Orders

1. `WO-OBS-001` — Operational metric dictionary and telemetry boundary.
2. `WO-OBS-002` — Current instrumentation audit.
3. `WO-OBS-003` — Minimal observability POC.
4. `WO-OBS-004` — Production-readiness and retention decision.

## Acceptance criteria

- Every metric has a definition, owner, source, unit, and purpose.
- No semantic evidence is written into logs.
- Dashboards are read-only for consumers.
- Alerting rules distinguish warning, degraded, and failed states.
- Failure and fallback behavior are documented.
- The observability stack can be removed without affecting the KADARN domain model.

## Completion gate

Phase 1 is complete when KADARN can reliably answer:

- Is Hermes active?
- Is the Gateway accepting and validating orders?
- Are jobs completing?
- Where are failures occurring?
- Is OPA responding and diverging from the native engine?
- Can the system recover from an operational failure?

---

# Phase 2 — Architecture Intelligence

## Strategic question

> Is KADARN evolving according to its approved architecture and governance?

## Objective

Create a read-only, evidence-linked architecture intelligence layer that makes implementation maturity, gaps, divergence, and open-source status visible.

## Preferred candidate

- Evidence.dev.

## Supporting candidate

- DuckDB, only if an embedded analytical projection is justified.

## Initial products

1. Capability Heat Map.
2. Build vs Adopt Matrix.
3. OSS Adoption Status.
4. Engine Maturity Map.
5. ADR Coverage Map.
6. Baseline Freshness Report.
7. Documentation-to-Code Divergence Report.
8. Architectural Debt Register.

## Minimum canonical projection schema

```text
component
architectural_layer
functional_engine
implementation_status
maturity_level
build_or_adopt
kosra_classification
canonical_reference
evidence_reference
owner
risk
next_action
last_verified_at
baseline_commit
```

## Maturity vocabulary

```text
PROPOSED
DESIGNED
STUB
IMPLEMENTED
VERIFIED
PRODUCTION_READY
DEFERRED
REJECTED
UNKNOWN
```

No dashboard may label a component as implemented without repository evidence.

## Required Work Orders

1. `WO-ARCH-001` — Architecture Intelligence data model.
2. `WO-ARCH-002` — Read-only extraction pipeline.
3. `WO-ARCH-003` — Evidence.dev isolated POC.
4. `WO-ARCH-004` — Governance and publication decision.

## Acceptance criteria

- Data originates from versioned files, reproducible SQL views, or committed repository metadata.
- Every displayed claim links to a canonical reference.
- Evidence.dev cannot edit canonical decisions.
- The pipeline is deterministic and reproducible.
- Planned tools are not presented as installed.
- The dashboard is removable without affecting the source repository.

## Completion gate

Phase 2 is complete when leadership can answer:

- Which parts of KADARN are implemented?
- Which are partial, stubbed, planned, or unknown?
- Which OSS components are adopted, adapted, under evaluation, deferred, or rejected?
- Where does documentation diverge from code?
- Which architectural decisions are stale or incomplete?

---

# Phase 3 — Institutional Intelligence

## Strategic question

> What can an institution actually do, with what evidence, with what confidence, and for which program is it ready?

## Objective

Formalize the proprietary Institutional Intelligence domain that transforms evidence, claims, provenance, confidence, capabilities, and readiness into explainable longitudinal intelligence.

## Canonical metric families

### Evidence Freshness

Measures whether evidence remains current under the policy applicable to its type.

Suggested states:

```text
FRESH
AGING
STALE
EXPIRED
UNVERIFIED
```

### Provenance Coverage

Measures not only whether a claim has evidence, but whether its evidence is authoritative, current, complete, and non-contradictory.

### Capability Maturity

Canonical maturity progression:

```text
0 — UNDECLARED
1 — DECLARED
2 — EVIDENCED
3 — VERIFIED
4 — OPERATIONALLY_DEMONSTRATED
5 — HISTORICALLY_RELIABLE
```

### Confidence Drift

Tracks changes in confidence over time and records their causes.

Possible causes:

- evidence expiration;
- contradictory evidence;
- coverage loss;
- policy change;
- source authority change;
- operational divergence;
- human review;
- calculation version change.

### Readiness Evolution

Tracks evaluation snapshots by institution, program type, capability, and time.

### Gap Closure

Measures movement from missing or blocked requirements to satisfied requirements.

### Operational Demonstration

Distinguishes documented capability from capability proven through actual operations.

### Historical Reliability

Measures the persistence and consistency of capability performance over time.

## Minimum governed metric metadata

```text
metric_key
definition
subject_type
subject_id
calculation_method
calculation_version
policy_version
source_reference
measured_at
confidence
owner
status
```

## Required Work Orders

1. `WO-INT-001` — Canonical Institutional Intelligence metric dictionary.
2. `WO-INT-002` — Snapshot and historical model assessment.
3. `WO-INT-003` — Capability Maturity and Evidence Freshness vertical slice.
4. `WO-INT-004` — Confidence Drift and Readiness Evolution vertical slice.
5. `WO-INT-005` — Institutional Intelligence governance and validation.

## Acceptance criteria

- Metrics are explainable and version-aware.
- Calculation changes are distinguishable from real institutional change.
- Every intelligence output traces back to canonical evidence and policy.
- Human review remains available for high-impact or ambiguous decisions.
- No external open-source component owns the canonical meaning of the metrics.

## Completion gate

Phase 3 is complete when KADARN can explain:

- what the institution claims;
- what is evidenced;
- what is verified;
- what has been operationally demonstrated;
- what is stale or contradictory;
- why confidence changed;
- what readiness gaps remain;
- how institutional capability evolved over time.

---

# Phase 4 — Decision Analytics

## Strategic question

> Which institutions, capabilities, programs, or actions should be prioritized, and why?

## Objective

Build analytical projections and decision-support capabilities on top of validated Institutional Intelligence.

## Candidate technologies

- DuckDB.
- Rill.

## Potential products

- Sponsor Intelligence.
- Program portfolio analysis.
- Capability benchmarking.
- Readiness trends.
- Network analysis.
- Matching explainability.
- Scenario analysis.
- Forecasting, only after sufficient historical evidence exists.

## Preconditions

Phase 4 may not begin at scale until:

- Institutional Intelligence metrics are governed;
- Decision Intelligence maturity is represented honestly;
- the Matching Engine is no longer merely a stub for the intended use case;
- sufficient validated historical data exists;
- evaluation criteria and human-review boundaries are defined.

## Required Work Orders

1. `WO-DEC-001` — Decision Analytics use-case prioritization.
2. `WO-DEC-002` — Analytical engine comparison.
3. `WO-DEC-003` — Read-only POC.
4. `WO-DEC-004` — Matching and recommendation governance.

## Completion gate

Phase 4 is complete when KADARN can produce a reproducible, explainable decision recommendation with:

- evidence basis;
- confidence;
- policy version;
- alternatives considered;
- limitations;
- human-review status.

---

# Phase 5 — Open-Source Evolution

## Strategic question

> Which external components create measurable value without weakening KADARN's architectural control?

## Objective

Evaluate OSS components individually through bounded Work Orders.

## Candidate register

| Component | Current KOSRA status | Intended domain |
|---|---|---|
| OPA | Adapt — Shadow Mode integrated | Policy evaluation |
| Evidence.dev | Evaluate | Architecture Intelligence |
| Grafana | Evaluate | Operational Observability |
| Prometheus/VictoriaMetrics | Evaluate | Metrics storage and query |
| Loki | Evaluate | Structured technical logs |
| DuckDB | Evaluate | Embedded analytics |
| Rill | Study | Decision Analytics |
| Apache Superset | Defer | Enterprise BI |
| FastAPI | Study / conditional | Specialized Python services only |
| MarkItDown | Evaluate separately | Document ingestion |
| HAPI FHIR | Defer until demonstrated need | Clinical interoperability |
| OpenLineage | Study | Technical lineage |
| GraphRAG | Study | Extraction and knowledge augmentation |

## Rules

- No bulk integration.
- One component per evaluation Work Order unless an explicit comparison requires more.
- No production adoption before ADR.
- No new database without a documented need and ADR.
- No external service receives institutional evidence without approved security and data-handling controls.
- No AI system writes directly into the Evidence Core without validation and governance.

## OPA-specific gate

OPA is already integrated in Shadow Mode. Promotion to Enforce Mode requires:

- measured parity rate;
- divergence inventory;
- expected versus defective divergence classification;
- tested fallback behavior;
- tested unavailability behavior;
- latency evidence;
- policy versioning;
- rollback evidence;
- human approval;
- governing ADR.

## Completion gate

Phase 5 is continuous. A component exits evaluation only through one of these explicit decisions:

```text
ADOPT
ADAPT
CONTINUE_SHADOW
DEFER
REJECT
RETIRE
```

---

# Phase 6 — Enterprise Scale

## Strategic question

> Has KADARN reached a scale that justifies enterprise BI, distributed analytics, or additional operational complexity?

## Objective

Introduce enterprise-scale infrastructure only after demonstrated demand.

## Deferred candidates

- Apache Superset.
- Enterprise data warehouse.
- Multi-tenant enterprise BI.
- Distributed analytics infrastructure.
- Additional databases or graph stores.

## Trigger conditions

At least one of the following must be demonstrated:

- multi-tenant analytical demand;
- high concurrent query volume;
- data volumes unsuitable for current projections;
- complex enterprise role models;
- sponsor-facing self-service analytics;
- contractual reporting requirements that current architecture cannot satisfy.

## Completion gate

Enterprise scale is not a default destination. It is authorized only by evidence of operational and commercial need.

---

## 5. Work Order Priority Queue

The immediate canonical order is:

```text
1. WO-KOSRA-002 — KOSRA v0.2 Controlled Restructuring (COMPLETE)
2. Human review and approval of KOSRA v0.2
3. WO-OBS-001 — Operational metric dictionary
4. WO-ARCH-001 — Architecture Intelligence data model
5. WO-INT-001 — Institutional Intelligence metric dictionary
6. Independent POCs only after their design Work Orders are approved
```

---

## 6. Decision Rights

### GPT Work

- defines what must be done;
- prepares Work Orders;
- requests human authorization;
- reviews final reports;
- accepts, rejects, or requests correction.

### Human Gate

- authorizes execution;
- approves external actions;
- approves transitions between phases;
- accepts architectural and governance changes.

### Hermes Gateway

- authenticates;
- validates contracts;
- assigns identifiers;
- persists and transports orders;
- exposes state and results.

### Hermes

- verifies the real project state;
- rejects incompatible or incomplete orders;
- governs technical execution;
- consolidates evidence;
- returns results.

### Gentle AI

- executes authorized technical work;
- modifies code only within authorized scope;
- runs tests;
- produces evidence;
- does not decide architecture, scope, or baseline.

### GitHub

- provides transport and auditability;
- records Issues, branches, commits, pull requests, and evidence;
- does not decide or execute.

---

## 7. Program-Level Success Criteria

The program is succeeding when:

1. KADARN can distinguish implemented, partial, stub, planned, and unknown capabilities.
2. Operational failures are detected and explained without exposing sensitive evidence.
3. Architecture decisions remain traceable to code and ADRs.
4. Institutional capability can be measured longitudinally.
5. Confidence changes can be explained.
6. Readiness gaps can be prioritized and tracked to closure.
7. OSS adoption reduces time and risk without replacing proprietary logic.
8. Decision recommendations remain reproducible and human-governed.
9. Every major change passes a defined gate.
10. The project avoids unnecessary infrastructure and duplicated systems.

---

## 8. Explicit Non-Goals

This plan does not authorize:

- mass OSS installation;
- replacement of the current API stack;
- FastAPI adoption without a specialized use case;
- OPA Enforce Mode activation;
- creation of a new data warehouse;
- introduction of a graph database;
- Superset deployment;
- rebuilding Evidence Core;
- rebuilding the Capability Model;
- declaring Decision Intelligence complete;
- merging telemetry with provenance;
- converting dashboards into canonical records.

---

## 9. Canonical Review Cadence

This plan should be reviewed:

- at the completion of each phase;
- when a new major OSS component is proposed;
- when a new database or runtime is proposed;
- when KADARN changes its product identity or target market;
- when evidence shows a material divergence between architecture and implementation.

Minor Work Order changes do not require a new plan version unless they alter phase sequencing, decision rights, proprietary boundaries, or completion gates.

---

## 10. Final Canonical Statement

KADARN will not evolve by accumulating tools. It will evolve by strengthening a governed chain from evidence to capability, from capability to readiness, and from readiness to explainable decisions.

Open-source components will be used selectively to accelerate infrastructure, observability, ingestion, analytics, and presentation. They will not replace the institutional semantics, evidence model, confidence logic, capability intelligence, or decision intelligence that define KADARN's strategic value.

The canonical execution order is therefore:

```text
Govern the architecture
    ↓
Observe the system
    ↓
Observe the architecture
    ↓
Measure institutional capability
    ↓
Support decisions
    ↓
Scale only when justified
```

---

## 11. Document References

| Reference | Location |
|-----------|----------|
| KOSRA v0.2 | `foundation/05_ENGINEERING/architecture/KOSRA.md` |
| KOSRA Implementation Mapping | `foundation/05_ENGINEERING/architecture/KOSRA_IMPLEMENTATION_MAPPING.md` |
| KOSRA Decision Register | `foundation/05_ENGINEERING/architecture/KOSRA_DECISION_REGISTER.md` |
| KOSRA Materialization Report | `foundation/05_ENGINEERING/architecture/KOSRA_MATERIALIZATION_REPORT.md` |
| Governance Index | `foundation/00_GOVERNANCE/GOVERNANCE_INDEX.md` |
| KIMP | `foundation/00_GOVERNANCE/KADARN_IMPLEMENTATION_MASTER_PLAN_v1.0.md` |
| ICO Charter | `foundation/00_GOVERNANCE/KADARN_IMPLEMENTATION_CONTROL_OFFICE_CHARTER_v1.0.md` |

---

## Approval Record

| Role | Decision | Name | Date |
|---|---|---|---|
| Program Direction | Materialized | Vilo | 2026-07-27 |
| Architecture Governance | Materialized | Hermes | 2026-07-27 |
| Human Gate | Pending | | |
