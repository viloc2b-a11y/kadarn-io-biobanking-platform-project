# RC-13 Roadmap - Platform Readiness & Operations

**Date:** 2026-07-05  
**Status:** Proposed workstream baseline  
**Depends on:** RC-12 Sponsor Passport Production Integration closure  
**Program intent:** Convert Kadarn from a production-integrated platform into an operable platform prepared for pilots, continuous operation, and growth.

---

## Governing Rule

RC-13 is the final major infrastructure workstream before Kadarn shifts primary focus toward pilots, network onboarding, sponsor intelligence, and commercial scale.

RC-13 must strengthen platform execution without changing:

- the knowledge semantics defined by KEMS / Evidence Blueprint;
- public product contracts;
- KUX-governed user experience;
- established domain ownership boundaries.

The mission changes from "make it work" to "make it operate at scale."

---

## 1. Objective

Convert Kadarn into a platform prepared for pilots, continuous operation, and growth through transversal capabilities that do not alter the knowledge model, public contracts, or user experience.

RC-13 should make Kadarn:

- faster;
- observable;
- diagnosable;
- secure;
- resilient;
- operable.

---

## 2. Why RC-13 Exists

RC-12 proved that Sponsor Passport production integration is substantially complete:

- Evidence Core is productive;
- Sponsor Platform is productive;
- architecture and invariants are frozen;
- production source selection is hardened.

The remaining maturity themes are not Sponsor Passport-specific. Keeping them under RC-12 would create an artificial continuation of a completed integration program. RC-13 provides the correct boundary: platform operations.

---

## 3. Workstreams

| Sprint | Area | Result |
|---|---|---|
| RC-13.0 | Readiness Baseline | Roadmap, readiness inventory, and closure criteria. |
| RC-13.1 | Performance | Baseline measurements and targeted optimization plan. |
| RC-13.2 | Caching | Cache strategy and implementation for safe read paths. |
| RC-13.3 | Query Hardening | Pagination, filtering, limits, and query safety rules. |
| RC-13.4 | Logging | Structured logging conventions and implementation. |
| RC-13.5 | Observability | Metrics and tracing foundation. |
| RC-13.5B | Distributed Tracing | Correlation IDs, trace IDs, request IDs, span timing, adapter timing, and database timing. |
| RC-13.6 | Alerting | Operational alerts and SLO-oriented signals. |
| RC-13.6B | Operational Runbooks | Startup, shutdown, restore, degraded mode, rollback, and incident response runbooks. |
| RC-13.7 | Security Hardening | Rate limiting and abuse protection. |
| RC-13.8 | Operational Readiness | Health checks, readiness checks, and environment validation. |
| RC-13.9 | QA + Readiness Report | Final QA and program closure report. |

---

## 4. Distributed Tracing Requirement

RC-13.5B is required because logs, metrics, and tests are not enough once Kadarn operates at scale.

The platform must be able to answer operational questions such as:

- Why did this Sponsor Passport request take 3.2 seconds?
- Which Evidence Core read produced this error?
- Which adapter or database call dominated request latency?
- Which request, trace, and sponsor/workspace context belong to this failure?

Required tracing capabilities:

| Capability | Purpose |
|---|---|
| Correlation IDs | Tie platform events to a logical workflow or user action. |
| Trace IDs | Tie spans across API, adapter, Evidence Core, and database boundaries. |
| Request IDs | Identify a single inbound request and response path. |
| Span timing | Measure route, adapter, Evidence Core, cache, and database timing. |
| Adapter timing | Identify slow mappers, source reads, or aggregation steps. |
| Database timing | Identify query latency and degraded persistence paths. |

This is not only observability. It is operational diagnosis.

---

## 5. Operational Runbooks Requirement

RC-13.6B is required because an operable platform needs documented response paths, not only working code.

Minimum runbooks:

| Runbook | Purpose |
|---|---|
| Startup | Verify required services, env, migrations, and readiness gates. |
| Shutdown | Document safe stop behavior and dependency order. |
| DB restore | Restore data safely and verify Evidence Core / platform consistency. |
| Cache flush | Clear stale cache without leaking cross-tenant or sponsor data. |
| Evidence Core degraded | Operate when claim/evidence/provenance reads are slow or unavailable. |
| Sponsor API degraded | Triage Sponsor Passport/API failures and rollback options. |
| Emergency mode | Define allowed reduced-operation posture without semantic drift. |
| Rollback | Restore previous deployment/configuration safely. |
| Incident response | Roles, escalation, diagnostics, evidence capture, and closure notes. |

---

## 6. Relationship to KEMS

Evidence Blueprint / KEMS defines the knowledge architecture:

```
Claim -> Evidence -> Provenance -> Confidence -> Intelligence -> Feedback
```

RC-13 must not modify that chain.

RC-13 strengthens the execution environment around that chain so the knowledge architecture can run reliably:

- faster, without changing meaning;
- observable, without exposing sensitive evidence;
- secure, without changing ownership boundaries;
- resilient, without inventing fallback facts;
- operable, without drifting from governance.

In short: RC-13 hardens platform execution, not knowledge semantics.

---

## 7. Scope Boundaries

### In Scope

- Shared API performance profiling.
- Cache safety, invalidation, and isolation rules.
- Query pagination, filtering, and limit safety.
- Structured logs that avoid evidence or PII leakage.
- Metrics and tracing conventions.
- Distributed tracing and request/span timing.
- Alert thresholds and operational dashboards.
- Rate limit and abuse protection review.
- Health/readiness checks and environment validation.
- Production failure-mode documentation.
- Runbooks and support notes.

### Out of Scope

- Sponsor Passport DTO changes.
- KUX changes.
- KEMS / Evidence Blueprint semantic changes.
- New Sponsor Passport features.
- Evidence Core semantic rewrites.
- Public Projection changes unless explicitly approved.
- `continuity/passport` rewrites unless explicitly approved.
- Product-specific UI redesign.
- Sponsor Intelligence or Marketplace feature expansion.

---

## 8. Program Gates

Every RC-13 implementation sprint should close with:

| Gate | Required Result |
|---|---|
| Build | PASS |
| TypeScript | PASS |
| Relevant feature tests | PASS |
| Performance baseline or delta | PASS where performance is touched |
| Security/log leakage review | PASS when logs, traces, errors, or metrics are touched |
| Contract compatibility | PASS |
| KUX compatibility | PASS |
| KEMS semantic stability | PASS |
| Tenant/sponsor/workspace isolation | PASS where caching, tracing, or rate limits are touched |
| Operational notes updated | PASS |
| `git diff --check` | PASS |
| ReadLints | PASS |

---

## 9. Entry Criteria

RC-13 should start when:

- RC-12 is formally closed;
- key production surfaces are identified;
- existing instrumentation, logging, metrics, tracing, health checks, and rate-limit patterns are inventoried;
- one initial slice is selected and scoped;
- the work is explicitly framed as platform readiness and operations, not product feature expansion.

---

## 10. Exit Criteria

RC-13 should close when:

- core platform surfaces have baseline performance visibility;
- cache patterns are documented, implemented where needed, and safely bounded;
- query pagination, filtering, and limits are hardened for critical paths;
- structured logging is implemented without evidence or PII leakage;
- metrics and tracing conventions are implemented for critical routes;
- distributed tracing can answer request, adapter, Evidence Core, and database timing questions;
- alerts exist for material failure, latency, and availability conditions;
- rate limiting and abuse protection are reviewed against production usage;
- health/readiness checks and environment validation are documented and implemented where required;
- runbooks and operational support notes exist for critical surfaces;
- no contracts, KUX documents, or KEMS semantics drifted without explicit approval.

---

## 11. Strategic Sequence

After RC-13, Kadarn should not open another broad infrastructure workstream by default.

Recommended sequence:

```
RC-10  Sponsor Runtime
RC-11  Evidence Adapter
RC-12  Production Integration
RC-13  Platform Readiness & Operations
Pilot Alpha
Network Onboarding
Sponsor Intelligence
Marketplace / Commercial Scale
```

This sequence aligns with the Master Work Plan: consolidate infrastructure and governance first, then expand adoption and business capabilities using real evidence and operating feedback.

---

## 12. Formal Opening Recommendation

RC-13 - Platform Readiness & Operations is the recommended next program after RC-12.

It should begin with RC-13.0 - Readiness Baseline, not immediate broad implementation. The first artifact should inventory current performance, caching, query safety, logging, metrics, tracing, alerting, rate limits, health/readiness checks, environment validation, and operational runbook gaps across the platform.
