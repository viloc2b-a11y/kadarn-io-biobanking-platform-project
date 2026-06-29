# KAA-001 — Policy Engine
## Kadarn Policy Engine Architecture — OPA Adoption Assessment

**Status:** Draft  
**Version:** 1.0

---

## 1. Why This Capability Exists

Kadarn has three authorization layers today that do not talk to each other: JWT
validation in the web middleware, copy-pasted inline checks in each API route
handler, and Row-Level Security in PostgreSQL. None of these three is the "policy
engine" the codebase comments promise — `packages/policy-engine/` is a reference
to code that was never implemented.

The result is predictable. The same rules are expressed in different ways in
different places, with no record of what was decided or why. A `kadarn_internal`
check missing from a single handler is a silent access gap. A policy in
`program_access_policies` that exists in the schema but is never read is zero
enforcement.

A Policy Engine resolves this at the root: it separates policy logic from
application code. Rules are written once, tested independently, and evaluated
traceably. The result of every evaluation is a structured record, not a
`console.log` in a catch block.

---

## 2. Responsibility Stack

| Layer | Owner | Question it answers |
|---|---|---|
| Identity | Auth (Supabase JWT) | Who is this actor? |
| **Policy** | **Policy Engine (OPA)** | **Can this actor perform this action in this context?** |
| Workflow Orchestration | Workflow Engine (Temporal) | What steps run, in what order, with what guarantees? |
| Data Authorization | PostgreSQL RLS | Can this actor see these rows? |
| Business Logic | Kadarn Engines | What does the system do within each step? |
| Persistence | PostgreSQL | Where do the data live? |
| Audit | Audit Engine | What business actions occurred? |
| Events | Event Bus | What changed in system state? |

OPA enters between Identity and Data Authorization. It does not replace any existing
layer — it fills the gap where a policy layer should have been.

---

## 3. Why Not Build It Ourselves?

The alternative of implementing a rules engine inside `packages/policy-engine` was
evaluated and rejected.

**Maturity.** OPA has over ten years of active development, is CNCF Graduated, and
runs in production at Netflix, Cloudflare, Styra, and most Kubernetes enterprise
platforms. That cannot be replicated in six months of internal development.

**Rego already solves non-trivial problems.** Policy versioning, native testing,
partial evaluation, dry-run, and decision debugging. Building the equivalent
consumes engineering time that should go into Kadarn's engines.

**Native audit trail.** OPA produces structured decision logs without additional
instrumentation. An internal engine would require building that infrastructure from
scratch.

**Ecosystem.** Integrations with OpenTelemetry, Envoy, Kafka, and most cloud
infrastructure already exist. There is nothing to write.

**Focus.** Kadarn's problem is not building a rule interpreter. It is modeling
policies for biospecimen transfer, consent, material transfer, and regulatory
compliance. OPA solves the first; Kadarn solves the second.

---

## 4. Scope of Authority

**OPA may decide:**
- Access — can this actor read, write, or initiate this resource?
- Approval — does this deal satisfy the conditions of the agreement?
- Visibility — can this actor discover this supply item?
- Compliance — does this lab hold the required certification for this protocol?
- Eligibility — does this organization meet the minimum Trust Score threshold to
  participate in this program tier?

**OPA never:**
- Modifies inventory
- Updates samples or aliquots
- Executes payments or releases escrow
- Moves money
- Modifies Trust Scores
- Creates, updates, or deletes business records
- Triggers workflows

OPA evaluates. The decision to *act* on that evaluation belongs to the corresponding
business engine. This prevents the Policy Engine from becoming a God Service with
hidden side effects.

---

## 5. Technology Selected: Open Policy Agent

OPA is not API middleware — it is a transversal service that each Kadarn engine can
query before executing a business action.

```
Kadarn Engine
    │
    ├─ Can this actor perform this action on this resource?
    │        │
    │     OPA evaluates (Rego)
    │        │
    │   PolicyDecision { allow, reasons, policy_version }
    │        │
    ├─ Kadarn records the decision (policy_evaluations)
    │
    └─ Engine executes (or denies) → RLS protects the data
```

Adoption begins in **Shadow Mode**: OPA evaluates all decisions in parallel with
existing logic, never blocking, producing only records. This builds convergence
evidence before OPA becomes the authoritative layer.

---

## 6. Core Concepts

**Policy.** A named, versioned rule written in Rego. A policy answers one question:
given this input (actor, action, resource, context), is the result `allow` or
`deny`, and why? Policies live in Kadarn's codebase, not in OPA's server.

**PolicyDecision.** The structured result of an evaluation: `allow` boolean, the
`reasons` array, the `policy_version` that produced the decision, and the
`evaluated_at` timestamp. This record is what gets written to `policy_evaluations`.

**Shadow Mode / Enforce Mode.** Shadow Mode means OPA evaluates but never blocks —
its decision is logged alongside the existing Kadarn decision, and the two are
compared. Enforce Mode means OPA's decision is the authoritative one. The transition
is gated by a feature flag per policy.

---

## 7. Interaction with Kadarn Data

OPA does not read Kadarn's PostgreSQL tables directly. It receives context as input
at evaluation time — the actor's role, the resource's current state, the
organization's trust score — and returns a decision.

The `policy_evaluations` table already exists in the schema. Every OPA evaluation
writes one row:

```
decision_id       uuid
policy_id         reference to policies table
policy_version    semver
actor_id          user id
actor_role        kadarn_role
organization_id   active org
resource_type     program / exchange / shipment / etc.
resource_id       specific resource id
action            read / write / execute / approve
kadarn_decision   allow | deny
opa_decision      allow | deny
match             boolean
reasons           string[]
evaluated_at      timestamptz
```

RLS remains the final enforcement layer. A query that bypasses OPA still cannot
return rows the actor is not authorized to see.

---

## 8. Interaction with Other Engines

**Temporal (Workflow Engine):** OPA evaluates authorization before Temporal starts
any workflow. For steps that require human approval, OPA re-evaluates when the
approval signal arrives — the system state may have changed during the wait. For
high-impact Activities (escrow release, restricted material transfer approval), OPA
is called as part of the Activity itself before any mutation occurs.

**PostgreSQL RLS:** RLS answers "what rows can this actor see." OPA answers "what
actions can this actor perform in this context." These are different questions about
different dimensions of the problem. A `visibility_scope = 'sponsor_only'` rule
requires knowing the actor's business role within the program — context RLS does
not have. OPA does. The architecture is OPA *and* RLS, each doing what the other
cannot.

**Audit Engine:** `audit_events` captures what happened (a program was created, a
shipment was approved). `policy_evaluations` captures why it was permitted — the
policy reasoning, not the business fact. Complementary records with different
purposes.

**Event Bus:** When domain events signal state changes (`TrustScoreUpdated`,
`ProgramActivated`), cached OPA evaluations that depend on the previous state are
invalidated. OPA re-evaluates on the next query against the new state.

**OpenTelemetry:** Each OPA evaluation emits a distributed trace span. Policy
decision latency and policy version are visible in the observability dashboard,
correlated with the request trace that triggered the evaluation.

---

## 9. Ownership Boundaries

| Policy | Owner |
|---|---|
| discovery.visibility | Discovery Engine |
| discovery.embargo | Discovery Engine |
| discovery.cohort_access | Discovery Engine |
| discovery.network_threshold | Trust Engine |
| exchange.mta_terms | Exchange Engine |
| exchange.dta_scope | Exchange Engine |
| exchange.duo_compatibility | Exchange Engine |
| exchange.pricing_authorization | Exchange Engine |
| exchange.cross_jurisdiction | Governance Engine |
| processing.biosafety_level | Processing Engine |
| processing.chain_of_custody | Processing Engine |
| processing.protocol_version | Governance Engine |
| logistics.export_control | Logistics Engine |
| logistics.carrier_authorization | Logistics Engine |
| payments.escrow_release | Payments Engine |
| payments.milestone_disbursement | Payments Engine |
| trust.participation_threshold | Trust Engine |
| trust.incident_suspension | Trust Engine |
| analytics.deidentification_level | Analytics Engine |
| analytics.phi_exposure_check | Analytics Engine |
| ai.phi_in_prompt | AI Engine |
| governance.irb_scope | Governance Engine |
| governance.consent_model | Governance Engine |

OPA evaluates. The owning engine remains responsible for the policy's correctness
and its business semantics.

---

## 10. Granularity

**Deserves a Policy if:**
- The rule is reused across multiple engines or handlers
- The rule has regulatory or legal implications
- The rule changes independently from the code (regulatory updates, contract changes)
- The decision needs to be auditable

**Does not deserve a Policy — use a guard or handler check:**
- A single role check that is never reused (`kadarn_internal` check on one internal
  endpoint with no business complexity behind it)
- Structural validation (field presence, type, format)
- Computational rules with no access-control implication

The wrong path: wrapping every `if` statement in Rego. The right path: policies
that express Kadarn's business and regulatory rules, not its input validation.

---

## 11. Policy Taxonomy

**Access Policies** — who can read, write, or initiate a resource.
- discovery.visibility, exchange.access, analytics.export_restriction

**Approval Policies** — conditions that must be true for an action to proceed.
- payments.escrow_release, exchange.mta_terms, governance.irb_scope

**Eligibility Policies** — whether an actor or organization qualifies to participate.
- trust.participation_threshold, processing.biosafety_level, exchange.duo_compatibility

**Compliance Policies** — adherence to regulatory or contractual obligations.
- governance.consent_model, logistics.export_control, analytics.deidentification_level

**Safety Policies** — prevention of harmful or irreversible actions.
- ai.phi_in_prompt, analytics.phi_exposure_check, processing.chain_of_custody

---

## 12. Compensation and Failure Handling

OPA itself does not compensate — it evaluates synchronously and returns a decision.
Compensation for a denied decision belongs to the calling engine or workflow.

**Patterns by scenario:**

*OPA denies a mid-workflow action.* The Activity returns failure. Temporal handles
retry or escalation per the workflow's defined compensation logic.

*OPA and Kadarn disagree in Shadow Mode.* The divergence is recorded in
`policy_evaluations` (`match: false`). The KOC exception queue surfaces these for
manual review. No request is blocked.

*Policy evaluation times out.* Feature flag `OPA_FAIL_OPEN` determines behavior:
if `true`, the request proceeds and the timeout is logged; if `false`, the request
is denied. Default is `fail_open` during Shadow Mode.

*A policy is updated and invalidates previous allow decisions.* Domain event
triggers invalidation of cached decisions. The next request re-evaluates against
the new policy version.

---

## 13. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OPA adds latency to every evaluated request | High | Medium | Run OPA as a sidecar (same host), target < 5ms p99 per evaluation |
| Rego learning curve for the team | High | Medium | Start with simple policies, add policy testing from day one |
| Shadow Mode divergences reveal gaps in existing logic | High | Low | This is expected and desirable — divergences are the value of Shadow Mode |
| Policy proliferation without ownership | Medium | High | Ownership table enforced in code review; no policy without a named owner Engine |
| OPA context data is stale (trust score, org state) | Medium | High | Cache TTL aligned with domain event cadence; critical policies bypass cache |
| Enforce Mode rollout breaks existing behavior | Medium | High | Roll out per-policy, per-environment, with divergence rate < 0.1% gate |
| OPA server becomes a single point of failure | Low | High | Deploy OPA as sidecar per service instance, not as a shared server |

---

## 14. Exit Strategy

**What belongs to Kadarn and survives a replacement:**
- All policies expressed in Rego are Kadarn's intellectual property. Rego is
  readable and can be translated to any policy language.
- The `policy_evaluations` table and its schema belong to Kadarn's database.
- The policy taxonomy, ownership model, and decision record format are
  Kadarn architecture decisions, not OPA concepts.
- The `policies` and `program_access_policies` tables in the schema are
  Kadarn-native and have no OPA dependency.

**What is coupled to OPA:**
- Rego syntax. Migrating to a different policy engine requires rewriting policies
  in the target language. The logic is preserved; the syntax changes.
- The OPA evaluation API (`/v1/data`). The `withPolicy()` wrapper abstracts this —
  replacing OPA means replacing the wrapper implementation, not every call site.

**Migration path if replacement is needed:**
1. The `withPolicy()` wrapper is the only call site that knows about OPA.
   Replace the wrapper implementation; all callers are unaffected.
2. Translate Rego policies to the target language. The logic is explicit and
   testable — translation is mechanical, not architectural.
3. The `policy_evaluations` audit trail is preserved regardless of what evaluates.

**Acceptable coupling:** The Rego syntax dependency is real but bounded. The
abstraction layer and the explicit policy ownership model ensure that replacing
OPA never requires changes to Kadarn's business engines.

---

## 15. Future Capabilities

| Engine | Future policies |
|---|---|
| Discovery | Geo-restriction, donor opt-out propagation, competitor embargo |
| Exchange | Multi-party agreement validation, price floor enforcement, exclusivity windows |
| Processing | Inter-lab certification delegation, batch size limits, protocol amendment propagation |
| Logistics | Route optimization authorization, carrier performance-based routing, cold chain exception handling |
| Payments | Tax withholding compliance, multi-currency approval thresholds, invoice dispute routing |
| Analytics | Re-identification risk scoring, synthetic data authorization, external researcher access tiers |
| AI | Model version pinning, hallucination risk threshold, output redaction policy |
| Trust | Peer verification delegation, cross-network trust federation, reputation inheritance |
| Governance | Multi-IRB coordination, protocol amendment fast-track, emergency use authorization |

---

## 16. Future Integrations

```
                    ┌─────────────────────────────┐
                    │       OPA Policy Engine      │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
    ┌────▼────┐              ┌─────▼─────┐            ┌──────▼──────┐
    │Temporal │              │W3C PROV   │            │Trust Engine │
    │Workflow │              │Provenance │            │Score Model  │
    └────┬────┘              └─────┬─────┘            └──────┬──────┘
         │                         │                         │
    ┌────▼────┐              ┌─────▼─────┐            ┌──────▼──────┐
    │Exchange │              │FHIR Layer │            │Event Bus    │
    │Engine   │              │(Future)   │            │Domain Events│
    └─────────┘              └───────────┘            └─────────────┘
```

- **Temporal:** OPA evaluates whether a workflow step can execute before Temporal
  schedules it. Milestone approval policies become Temporal Activities conditioned
  on OPA.
- **W3C PROV:** Provenance nodes that represent policy decisions reference the
  `decision_id` from OPA. The provenance graph incorporates policy reasoning as
  evidence.
- **FHIR:** When Kadarn implements the clinical interoperability layer, FHIR resource
  access policies — consent, purpose, jurisdiction — are evaluated by OPA before
  any resource is exposed.
- **Trust Engine:** Trust Score changes emit domain events that invalidate cached OPA
  evaluations. The cycle: score changes → event bus → OPA invalidates dependent
  policies → next evaluation reflects the new state.
- **Event Bus:** OPA decisions are emitted as domain events, allowing other engines
  to react to policy state changes without polling.
- **OpenTelemetry:** Each OPA evaluation emits distributed traces. Policy decisions
  are spans within the request trace, with latency breakdown and policy version
  visible in the observability dashboard.

---

## 17. Architectural Decision

OPA is adopted as **Kadarn's transversal business policy engine**. It does not
replace PostgreSQL RLS or the existing authentication mechanism. It fills the missing
layer between authentication and business execution, in every engine that makes
decisions governable by declarative rules.

**Non-negotiable constraints:**
- RLS remains the final data isolation enforcement layer
- OPA in Shadow Mode never blocks requests
- No OPA policy modifies business state
- Identity authorization remains in Auth
- Every policy has a named owning Engine

The detailed technical design — package structure, `withPolicy()` wrapper, initial
Rego policies, feature flags, test strategy — is the subject of KAA-001-B:
Policy Engine Technical Design.
