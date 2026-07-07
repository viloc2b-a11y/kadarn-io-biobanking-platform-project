# RC-12 Roadmap - Sponsor Passport Production Integration

**Date:** 2026-07-05  
**Status:** Closed after RC-12.3  
**Depends on:** RC-11 Completion Report, Sponsor Platform Architecture v1.0, Sponsor Platform Invariants v1.0  
**Program intent:** Replace temporary implementations with production-grade infrastructure.

---

## Governing Rule

RC-12 may replace temporary implementations with production-grade infrastructure, but it must not change the RC-10.2 Sponsor Passport Contract, the KUX-008 user experience, or the Sponsor Platform v1.0 dependency rules.

RC-12 is not a feature expansion phase. It is a production integration phase.

**Program closure update:** RC-12 is closed after RC-12.3. The original RC-12.4 and RC-12.5 themes are no longer Sponsor Passport-only continuation sprints; they are superseded by RC-13 - Platform Readiness & Operations as a transversal operational readiness program.

---

## Program Gates

Every RC-12 sprint must close with:

| Gate | Required Result |
|---|---|
| `apps/api` build | PASS |
| `apps/api` TypeScript | PASS |
| Sponsor Passport tests | PASS |
| Evidence Core tests | PASS, unless explicitly out of scope and justified |
| RC-10.2 contract stability | PASS |
| KUX-008 stability | PASS |
| Sponsor Platform Invariants | PASS |
| Public Projection untouched | PASS |
| `continuity/passport` untouched | PASS |

---

## RC-12.1 - Persistent Portfolio

### Objective

Replace the temporary Sponsor Passport portfolio allowlist with persistent, versioned portfolio infrastructure while preserving the RC-10.2 Sponsor Passport contract.

### Scope

- Persistent portfolio storage model.
- Sponsor organization ownership.
- Institution membership records.
- Versioning or auditability of portfolio membership changes.
- Read path behind `PassportStore.getPortfolioIndex()`.
- Access checks behind `PassportStore.isInstitutionInPortfolio()`.
- Migration from temporary allowlist behavior to persistent runtime behavior.

### Out of Scope

- Sponsor UI redesign.
- Contract field changes.
- Public Projection.
- `continuity/passport`.
- Stability Runtime.
- Recommendation logic changes.
- Broad Evidence Core refactors.

### Dependencies

- Sponsor Platform Architecture v1.0.
- Sponsor Platform Invariants v1.0.
- RC-10.2 Sponsor Passport Contract.
- Existing `PassportStore` boundary.
- Current portfolio allowlist tests.

### Entry Criteria

- RC-12.0 accepted.
- Build and TypeScript pass.
- Sponsor Passport tests pass.
- Current allowlist behavior documented.
- Persistent storage design approved before implementation.

### Exit Criteria

- Portfolio reads are backed by persistent storage.
- Temporary allowlist/JSON is removed from production path.
- Sponsor organization ownership is enforced.
- Contract response shape is unchanged.
- Mock mode remains available where explicitly supported.
- Migration or seed path is documented if needed.

### Technical Gates

- `cd apps/api && npx tsc --noEmit`
- `cd apps/api && npm run build`
- Sponsor Passport test suite.
- Evidence Core tests if touched.
- Portfolio authorization tests.
- Contract parity tests.

### Risks

| Risk | Mitigation |
|---|---|
| Portfolio persistence changes API semantics | Keep all changes behind `PassportStore`. |
| Ownership rules become ambiguous | Model sponsor org ownership explicitly. |
| Migration creates stale allowlist behavior | Remove or isolate temporary config after persistent path passes. |
| Contract drift | Run parity and contract tests before closure. |

---

## RC-12.2 - Stability Runtime

### Objective

Replace the provisional `stability: 'Under Review'` value with a real Stability Runtime derived from existing evidence, claim, audit, and lifecycle state.

### Scope

- Stability derivation rules.
- Review and lifecycle inputs.
- Mapping to the existing stability enum:
  - `Stable`
  - `Evolving`
  - `Under Review`
  - `Evidence Refresh Needed`
- Explanation or traceability for stability decisions if needed internally.
- Tests for edge cases and temporal behavior.

### Out of Scope

- New stability fields.
- Numeric institution scores.
- Certification or verification labels.
- UI changes.
- Public Projection.
- `continuity/passport`.
- AI-generated stability.

### Dependencies

- Persistent Portfolio should be complete or not relevant to test setup.
- Evidence Core claim/evidence reads.
- History runtime.
- Recommendations runtime.
- RC-10.2 stability enum.

### Entry Criteria

- RC-12.1 accepted or explicitly deferred with no dependency conflict.
- Stability inputs identified.
- Stability rules approved before implementation.
- Existing `Under Review` stub behavior documented.

### Exit Criteria

- `Under Review` is no longer a universal stub in Evidence Core mode.
- Stability values are derived from evidence-backed conditions.
- Stability enum remains unchanged.
- Stability logic is deterministic and testable.
- No Sponsor UI or contract shape changes.

### Technical Gates

- `cd apps/api && npx tsc --noEmit`
- `cd apps/api && npm run build`
- Sponsor Passport test suite.
- Evidence Core tests if lifecycle/evaluation code is touched.
- New stability tests.

### Risks

| Risk | Mitigation |
|---|---|
| Stability becomes a disguised score | Use enum-only rules; no numeric rollups. |
| Stability duplicates recommendation logic | Keep stability as state indicator, not next-action engine. |
| Rules become interpretive without evidence | Require claim/evidence/audit backing. |
| UI semantics drift | Preserve KUX-008 and RC-10.2 language. |

---

## RC-12.3 - Evidence Core Production Integration

### Objective

Remove remaining temporary mocks, stubs, or adapter shortcuts from the production Sponsor Passport path so production data comes from Evidence Core through approved boundaries.

### Scope

- Production source selection hardening.
- Evidence Core-backed reads for all production Sponsor Passport sections.
- Removal or isolation of production-ineligible mock/stub paths.
- Adapter query consolidation where needed.
- Failure behavior for missing Evidence Core data.
- Test coverage for production mode.

### Out of Scope

- Removing mock mode entirely if it is still required for local/demo workflows.
- UI changes.
- Contract changes.
- Public Projection.
- `continuity/passport`.
- New Evidence Intelligence features.
- New claim taxonomy work.

### Dependencies

- RC-12.1 Persistent Portfolio.
- RC-12.2 Stability Runtime.
- Evidence Core repository/read APIs.
- Sponsor Platform Invariants v1.0.

### Entry Criteria

- Temporary production path elements are inventoried.
- Evidence Core read coverage is known for every passport section.
- Mock mode policy is clarified.
- Build, TypeScript, and tests are green.

### Exit Criteria

- Production Sponsor Passport mode reads from Evidence Core-backed paths.
- Temporary shortcuts are removed or explicitly limited to non-production mode.
- Missing data behavior is deterministic.
- Contract shape remains unchanged.
- Evidence Core remains source of truth.

### Technical Gates

- `cd apps/api && npx tsc --noEmit`
- `cd apps/api && npm run build`
- Sponsor Passport tests.
- Evidence Core tests.
- Production-mode adapter tests.
- Mock-mode preservation tests.

### Risks

| Risk | Mitigation |
|---|---|
| Mock removal breaks local workflows | Keep mock mode explicit and isolated if still needed. |
| Evidence Core gaps surface as empty passports | Define deterministic empty/missing behavior. |
| Adapter begins owning Evidence Core policy | Keep policy in Evidence Core; adapter maps representation only. |
| Contract drift | Run contract/parity tests. |

---

## RC-12.4 - Performance, Caching and Pagination (Superseded)

### Objective

Make Sponsor Passport reads production-ready for larger portfolios and evidence graphs without changing contract semantics.

**Status:** Superseded by RC-13 - Platform Readiness & Operations. Performance and caching are platform-wide concerns and should not remain artificially scoped to Sponsor Passport.

### Scope

- Read performance profiling.
- Caching strategy for safe read paths.
- Cache invalidation rules.
- Pagination strategy for portfolio or large nested collections where contract-compatible.
- Query optimization.
- Index review or query plan review where allowed.
- Lazy loading boundaries for heavy provenance data.

### Out of Scope

- Making cache authoritative.
- Contract-breaking pagination changes.
- UI redesign.
- New intelligence features.
- Public Projection.
- `continuity/passport`.
- Broad database redesign.

### Dependencies

- RC-12.1 Persistent Portfolio.
- RC-12.3 production read paths.
- Current performance baseline.
- Sponsor Platform Invariants v1.0.

### Entry Criteria

- Production read paths are stable.
- Representative portfolio/evidence sizes are defined.
- Slow queries or heavy response paths are identified.
- Contract-compatible pagination approach is approved if needed.

### Exit Criteria

- Performance bottlenecks are measured and addressed.
- Cache is non-authoritative and invalidatable.
- Pagination/lazy loading does not break RC-10.2 semantics.
- Query performance is documented.
- No unauthorized evidence can be exposed through cache.

### Technical Gates

- `cd apps/api && npx tsc --noEmit`
- `cd apps/api && npm run build`
- Sponsor Passport tests.
- Evidence Core tests if query APIs are touched.
- Performance benchmark or documented baseline.
- Cache authorization tests where applicable.

### Risks

| Risk | Mitigation |
|---|---|
| Cache leaks cross-sponsor data | Key cache by sponsor scope and authorization context. |
| Pagination changes response shape | Require contract review before shape changes. |
| Optimization bypasses adapter boundary | Keep reads behind `PassportStore` and adapter queries. |
| Benchmarks use unrealistic data | Define representative portfolio/evidence scenarios. |

---

## RC-12.5 - Production Hardening and Observability (Superseded)

### Objective

Add production operations readiness to Sponsor Passport: observability, metrics, tracing, logging, alerts, error handling, audit posture, and rate limiting.

**Status:** Superseded by RC-13 - Platform Readiness & Operations. Observability, logging, alerting, metrics, distributed tracing, rate limiting, and operational hardening should be implemented as shared platform capabilities.

### Scope

- Metrics for Sponsor Passport read paths.
- Tracing/correlation propagation.
- Structured logging.
- Error taxonomy and response consistency.
- Alerting signals.
- Rate limiting review.
- Audit/event visibility for sensitive operations.
- Runbook or operational notes for Sponsor Passport production support.

### Out of Scope

- New Sponsor Passport features.
- UI redesign.
- Contract changes.
- Public Projection.
- `continuity/passport`.
- Rewriting global observability architecture unless needed for local integration.

### Dependencies

- RC-12.1 through RC-12.4 accepted.
- Existing instrumentation package and API conventions.
- Production error envelope standards.
- Security invariants.

### Entry Criteria

- Production read paths are stable and performant.
- Error cases are known.
- Metrics/tracing conventions are identified.
- Rate limit policy is reviewed.

### Exit Criteria

- Sponsor Passport has production metrics.
- Logs and traces identify request, sponsor org, route, and failure class without leaking evidence.
- Alerts exist for material failures or latency thresholds where applicable.
- Error handling is consistent.
- Rate limits are enforced at appropriate boundaries.
- Operational support notes are documented.

### Technical Gates

- `cd apps/api && npx tsc --noEmit`
- `cd apps/api && npm run build`
- Sponsor Passport tests.
- Evidence Core tests if shared instrumentation affects it.
- Observability tests or smoke checks where feasible.
- Security review of logs/errors for data leakage.

### Risks

| Risk | Mitigation |
|---|---|
| Logs leak sensitive evidence | Redact evidence content and identifiers where required. |
| Metrics cardinality grows too high | Use bounded labels and route-level metrics. |
| Alerts are noisy | Start with material error/latency thresholds. |
| Rate limits block legitimate sponsor workflows | Use sponsor/workspace-aware limits and document policy. |

---

## RC-12 Closure Criteria

RC-12 closes when:

- Persistent portfolio replaces temporary production allowlists.
- Stability is runtime-derived.
- Production Sponsor Passport reads are Evidence Core-backed.
- Performance and pagination strategy are transferred to RC-13 - Platform Readiness & Operations.
- Observability and hardening gates are transferred to RC-13 - Platform Readiness & Operations.
- RC-10.2 contract remains stable.
- KUX-008 remains stable.
- Sponsor Platform v1.0 invariants remain satisfied.

---

## Parallel Documentation Workstream

The following documents may proceed in parallel with RC-12 because they support pilots but do not directly alter the runtime architecture:

- Claim Taxonomy.
- Competitive Boundary.
- Business Model.
- Evidence Verification Playbook.
- Sponsor Validation Script.
- Governance Pack.

These documents prepare Kadarn for real sponsor/site pilots and the first production Confidence Graphs.

---

## Next Step

After RC-12.0 is accepted, open **RC-12.1 - Persistent Portfolio** as the first production integration sprint.

RC-12.1 must start with design/specification before implementation.

---

*RC-12 Roadmap defines the production integration sequence for Sponsor Passport. It authorizes replacement of temporary implementations, not expansion of the Sponsor Passport product surface.*
