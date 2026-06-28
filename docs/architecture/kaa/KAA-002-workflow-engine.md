# KAA-002 — Workflow Engine
## Kadarn Workflow Engine Architecture — Temporal Adoption Assessment

**Status:** Draft  
**Version:** 1.0

---

## 1. Why This Capability Exists

Kadarn coordinates business processes that can last days, weeks, or months. A
program moves through IRB approval, enrollment, collection, processing, quality
control, logistics, analysis, and settlement. An exchange request passes through
submission, review, negotiation, MTA signing, transfer, and confirmation. A shipment
has its own cycle: pickup, transit, customs, delivery, temperature verification, and
custody confirmation.

None of these processes fit inside an HTTP request. All of them require persistent
state across steps, the ability to resume from a failure point, timeout enforcement,
and visibility into what is happening at any given moment.

Today Kadarn manages this coordination with status fields in PostgreSQL
(`program_milestones.status`, `logistics_shipments.status`,
`exchange_requests.status`) and transition logic scattered across route handlers.
The result: there is no guarantee that steps execute in order, no automatic retry
when a step fails, no timeout enforcement, and the real state of a process is only
visible by querying the database row by row.

---

## 2. Responsibility Stack

| Layer | Owner | Question it answers |
|---|---|---|
| Identity | Auth (Supabase JWT) | Who is this actor? |
| Policy | Policy Engine (OPA) | Can this actor perform this action? |
| **Workflow Orchestration** | **Workflow Engine (Temporal)** | **What steps run, in what order, with what guarantees?** |
| Data Authorization | PostgreSQL RLS | Can this actor see these rows? |
| Business Logic | Kadarn Engines | What does the system do within each step? |
| Persistence | PostgreSQL | Where do the data live? |
| Audit | Audit Engine | What business actions occurred? |
| Events | Event Bus | What changed in system state? |

Temporal enters between Policy and Business Logic. It does not replace any existing
layer — it coordinates the execution of Kadarn's engines in durable, recoverable
sequences.

---

## 3. Why Not Build It Ourselves?

The alternative of continuing with the current model — state machines in PostgreSQL,
cron jobs for timeouts, retry logic in route handlers — was evaluated and rejected.

**Durability.** Temporal persists every step in its own event log. If the server
goes down between step 3 and step 4 of a 12-step process, Temporal resumes from
where it left off. PostgreSQL-as-state-machine does not have that guarantee without
idempotency keys, distributed transactions, and manual recovery logic at every
transition.

**Native retry with backoff.** Temporal handles automatic retry with configurable
exponential backoff per Activity. A handler that calls an external service and fails
does not need its own retry logic.

**Long-lived timers.** A workflow waiting for IRB approval may be on hold for 30
days. Temporal manages long-duration timers without polling, without cron jobs, and
without holding memory. Implementing this with cron is brittle by definition.

**Visibility.** Temporal UI shows the state of every running workflow, the complete
event history, failed steps, retries, and active timers. This replaces manual
queries against `program_milestones` to understand what is happening in a program.

**Determinism.** Temporal workflows are deterministic functions — given the same
event history, they always produce the same result. This makes behavior exactly
testable, something impossible with distributed state logic across multiple tables.

**Focus.** Kadarn's problem is not building workflow infrastructure. It is modeling
the processes of biological material transfer, regulatory approval, and
inter-organizational coordination. Temporal solves the first; Kadarn solves the
second.

---

## 4. Scope of Authority

**Temporal may decide:**
- What steps execute and in what order
- When to retry a failed step and with what backoff policy
- When a workflow has timed out
- When to wait for external signals (human approval, webhook, event)
- What to do when a step fails definitively (compensation, rollback, escalation)

**Temporal never:**
- Decides whether an actor is authorized to start a workflow (that is OPA)
- Decides what data the actor can see during execution (that is RLS)
- Implements business logic within any step (that is the owning Engine)
- Determines whether persisted data are correct (that is PostgreSQL)

Temporal orchestrates. Kadarn's engines execute. Authorization is evaluated by OPA
before Temporal starts.

---

## 5. Technology Selected: Temporal

```
Actor initiates process
    │
    ├─ OPA evaluates: can this actor start?
    │        │
    │   PolicyDecision { allow }
    │        │
    ├─ Temporal receives the request
    │        │
    │   WorkflowExecution { id, status: running }
    │        │
    ├─ Activity 1 → Kadarn Engine executes step 1
    ├─ Activity 2 → Waits for signal (human approval, external event)
    ├─ Activity 3 → Kadarn Engine executes step 2
    │   ...
    │        │
    └─ Workflow completes → final state persisted in PostgreSQL
```

---

## 6. Core Concepts

**Workflow.** The orchestration. Defines what steps execute, in what order, under
what conditions. It is a deterministic function — it has no side effects of its own.
It can be in execution for weeks or months.

**Activity.** The execution. A unit of work that does have side effects: calls
Supabase, sends an email, updates a record, calls an external service. It is
retriable. It is idempotent by design. This is where Kadarn's business logic lives.

**Signal.** An external event that wakes a waiting workflow — an MTA signature, a
`kadarn_internal` approval, a carrier webhook. The workflow does not poll — it
waits for the signal. Signals can arrive after minutes or days.

---

## 7. Interaction with Kadarn Data

Temporal has its own persistence store. Kadarn's tables remain the business source
of truth.

- Temporal persists workflow state in its own schema
- On completing each relevant Activity, the Kadarn Engine updates its own tables
  (`program_milestones.status`, `logistics_shipments.status`, etc.)
- Temporal does not read Kadarn's tables directly — it receives state as workflow
  input and updates it through Activities belonging to the owning Engine
- Business queries continue to point at Kadarn's tables, not at Temporal's store

The KOC can continue reading `program_milestones` to display a program's status.
Temporal is the engine that guarantees those records are updated reliably and in
order.

---

## 8. Interaction with Other Engines

**OPA (Policy Engine):** OPA evaluates authorization before Temporal starts any
workflow. For steps with human approval, OPA re-evaluates when the approval signal
arrives — the system state may have changed during the wait period. For high-impact
Activities (escrow release, restricted material transfer), the Activity calls OPA
before executing any mutation.

**PostgreSQL RLS:** RLS protects data within every Activity that queries Supabase.
Temporal does not bypass RLS — every database call inside an Activity runs under the
actor's session context.

**Audit Engine:** `audit_events` captures what happened (a milestone was completed).
Temporal captures how the system reached that state — the complete history of steps,
retries, timeouts, and signals. Two complementary records with different purposes.

**Event Bus:** Each completed workflow step emits a domain event. The KOC receives
real-time updates without polling Temporal UI.

**W3C PROV:** Each Activity that produces or modifies material records a provenance
node. Temporal's event history and the PROV graph are complementary — Temporal
captures the process, PROV captures the material chain of custody.

**OpenTelemetry:** Each WorkflowExecution and each Activity emits distributed trace
spans. Step latency is visible in the observability dashboard, correlated with the
request trace that triggered the workflow.

---

## 9. Ownership Boundaries

Temporal executes. The owning Engine remains responsible for the process and its
business logic.

| Workflow | Owner | Description |
|---|---|---|
| Program Lifecycle | Program Engine | Submission through archive, including IRB, milestones, and KPE |
| Exchange Request | Exchange Engine | Submission through settlement, including MTA/DTA and transfer |
| Logistics Shipment | Logistics Engine | Pickup through custody confirmation in destination |
| KPE Settlement | Payments Engine | Evidence collection, scoring, and payment distribution |
| Organization Onboarding | Governance Engine | Document verification, capabilities, initial Trust Score |
| Trust Review | Trust Engine | Score review, suspension, and recovery pathway |
| Protocol Amendment | Governance Engine | Active protocol change with IRB approval |
| Consent Re-contact | Governance Engine | Re-contact to donors with consent update |
| Dispute Resolution | Payments Engine | Dispute handling with escrow hold and arbitration |
| QC Gate | Processing Engine | Quality control decision point within larger workflows |
| Shipment Incident | Logistics Engine | Deviation response for temperature excursion or loss |

---

## 10. Granularity

The question is not "is it complex?" — it is "does it need durability?"

**Deserves a Workflow if:**
- The process can outlast a server restart
- It requires waiting days or weeks (human approval, timer, external event)
- It coordinates multiple organizations
- It has steps that can fail and require retry or compensation
- Its state needs to be visible and auditable over time

**Does not deserve a Workflow — use an Activity or a handler:**
- Creating a single record in the database (atomic operation)
- Validating a field or computing a value
- Sending a notification as a side effect of another process
- Any operation that completes in milliseconds with no external dependencies

**Wrong:** `CreateShipmentWorkflow` that only inserts into `logistics_shipments`.
That is an Activity inside an Exchange Workflow, not a Workflow of its own.

**Right:** `ShipmentFulfillmentWorkflow` that coordinates pickup, transit, customs
(with timer and escalation), temperature monitoring, delivery, and destination
verification — a process that can take weeks.

---

## 11. Workflow Taxonomy

**Platform Workflows** — network infrastructure processes. Not business, operational.
- Organization Onboarding
- User Provisioning
- Capability Verification

**Business Workflows** — Kadarn's core value delivery.
- Program Lifecycle
- Exchange Request Fulfillment
- KPE Settlement

**Regulatory Workflows** — processes with compliance requirements.
- IRB Approval
- Consent Management
- Protocol Amendment

**Operational Workflows** — coordination of physical operations.
- Logistics Shipment
- Chain of Custody
- Quality Control Gate

**Settlement Workflows** — value distribution.
- Milestone Payment Release
- Escrow Release
- Dispute Resolution

**Exception Workflows** — failure and unplanned situation handling.
- Shipment Incident Response
- QC Failure Recovery
- Trust Suspension and Recovery

---

## 12. Compensation and Failure Handling

Temporal is not only retry. When a step fails definitively — or when the system
state changes in a way that invalidates what was already done — the workflow can
execute compensation steps in reverse order, unwinding side effects in a controlled
way.

**Compensation scenarios in Kadarn:**

*Shipment cancelled mid-transit.* The logistics workflow executes: carrier
notification → status update in Kadarn → destination slot release → partial escrow
reversal if applicable → exception creation in KOC queue.

*QC failed at destination.* The program execution workflow executes: milestone
flagged as failed → sponsor notification → milestone payment hold → remediation
window opened → if unresolved within N days → escalation to `kadarn_internal`.

*MTA expired during negotiation.* The exchange workflow executes: deal closed →
both parties notified → reserved supply items released → failed intent recorded in
audit → re-engagement suggested.

*Trust Score dropped during a running program workflow.* The workflow receives a
`TrustScoreUpdated` signal → OPA re-evaluates eligibility → if the organization no
longer meets the threshold → workflow pauses and escalates to KOC for manual
decision → KOC can approve an exception or terminate the program.

*Payment rejected at settlement.* The payments workflow executes: settlement hold →
financial contact notified → dispute window opened → if unresolved within N days →
escalation with complete history record.

Compensation in Temporal is not a global catch — it is explicit business logic.
Kadarn defines what "undo" means in each domain, and Temporal guarantees that logic
executes reliably even when intermediate steps fail.

---

## 13. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Deployment complexity (Temporal Server + Workers) | High | Medium | Use Temporal Cloud for initial phases; self-host only when scale justifies it |
| Workflow history bloat on very long-running processes | Medium | Low | Configure `continueAsNew` for workflows that exceed N events |
| Non-deterministic code inside Workflow functions | Medium | High | Linting rules, code review gate, test suite with TestWorkflowEnvironment |
| Vendor dependency on Temporal Cloud | Low | Medium | The interface is OSS — migration to self-hosted is always available |
| State sync gap between Temporal and PostgreSQL | High | High | Each Activity persists state in Kadarn before returning — enforced as a contract |
| Workflow proliferation for processes that do not need durability | Medium | Medium | Granularity criteria documented and enforced in code review |
| Debugging production workflows | Medium | Medium | Temporal UI + OpenTelemetry traces + structured logging in every Activity |

---

## 14. Exit Strategy

**What belongs to Kadarn and survives a replacement:**
- All business logic lives in Activities, which are plain TypeScript functions.
  They have no Temporal dependency beyond the Activity registration call. They can
  be extracted and called directly by any other orchestration system.
- Workflow definitions express Kadarn's process logic in code. The sequencing,
  branching, and compensation logic is Kadarn's intellectual property. It can be
  translated to any workflow DSL.
- PostgreSQL remains the source of truth for all business state. Temporal's store
  is its own concern. Removing Temporal does not affect Kadarn's data.
- The domain event contracts (what each completed step emits to the Event Bus) are
  Kadarn architecture decisions, independent of Temporal.

**What is coupled to Temporal:**
- The Temporal TypeScript SDK at Activity registration and Workflow definition
  points. This is the primary coupling surface.
- The `workflowId` and `runId` identifiers used for correlation with Temporal's
  store. These can be mapped to Kadarn-native identifiers.

**Migration path if replacement is needed:**
1. Activities are already plain functions. Wrap them in the target system's task
   abstraction — no internal logic changes.
2. Translate Workflow definitions to the target orchestration DSL. The process
   logic is explicit — translation is structural, not architectural.
3. The Event Bus contract is preserved. Downstream consumers (KOC, Audit Engine,
   PROV) are unaffected.
4. PostgreSQL state is preserved. The replacement system reads from the same tables.

**Acceptable coupling:** The Temporal SDK dependency is real but bounded to
orchestration code, not to business engines. Kadarn's core value — the process
logic, the business rules, the data — survives any workflow engine replacement.

---

## 15. Future Capabilities

| Engine | Future workflows |
|---|---|
| Program | Emergency use authorization, multi-site coordination, study closure with data retention |
| Exchange | Multi-party exchange (3+ orgs), exclusivity window enforcement, price renegotiation |
| Logistics | Multi-leg routing, return shipment, automated cold chain incident response |
| Payments | Partial release, tax withholding compliance, multi-currency settlement |
| Governance | IRB renewal, cross-IRB coordination, protocol deviation reporting |
| Trust | Cross-network federation, peer verification delegation |
| Analytics | Data export approval, researcher access provisioning |
| AI | Output review workflow, PHI incident response, model evaluation |

---

## 16. Future Integrations

```
                    ┌─────────────────────────────┐
                    │     Temporal Workflow Engine  │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
    ┌────▼────┐              ┌─────▼─────┐            ┌──────▼──────┐
    │OPA      │              │Event Bus  │            │W3C PROV     │
    │Policy   │              │Domain     │            │Provenance   │
    │Engine   │              │Events     │            │Graph        │
    └────┬────┘              └─────┬─────┘            └──────┬──────┘
         │                         │                         │
    ┌────▼────┐              ┌─────▼─────┐            ┌──────▼──────┐
    │Exchange │              │KOC        │            │OpenTelemetry│
    │Engine   │              │Real-time  │            │Observability│
    └─────────┘              └───────────┘            └─────────────┘
```

- **OPA:** Evaluates authorization before Temporal starts and within high-impact
  Activities during execution. Policy decisions are part of the workflow trace.
- **Event Bus:** Each completed step emits a domain event. The KOC receives
  real-time updates; the Audit Engine captures the business fact.
- **W3C PROV:** Each Activity that touches material records a PROV node. Temporal's
  event history and the provenance graph are correlated by `workflowId`.
- **OpenTelemetry:** WorkflowExecutions and Activities emit distributed spans.
  Step latency, retry counts, and timer durations are visible in the observability
  dashboard correlated with the originating request.
- **FHIR (future):** Clinical consent and enrollment workflows will include
  Activities that write FHIR resources, coordinated by Temporal with the same
  durability guarantees.

---

## 17. Architectural Decision

Temporal is adopted as **Kadarn's transversal workflow orchestration engine**. It
does not replace PostgreSQL as the business data store, does not replace Kadarn's
engines as business logic executors, and does not replace OPA as the authorization
evaluator.

Temporal guarantees that Kadarn's long-lived business processes — program lifecycle,
exchange requests, shipments, onboarding, KPE settlement — execute reliably,
recoverably, and observably, without polling, without cron jobs, and without manual
retry logic in route handlers.

**Non-negotiable constraints:**
- PostgreSQL remains the source of truth for all business state
- OPA evaluates authorization before Temporal starts any workflow
- RLS protects data in every database call within Activities
- Temporal does not access Kadarn's tables directly — it receives state as input
  and updates it through Activities belonging to the owning Engine
- The owning Engine remains responsible for its process logic and its data

The detailed technical design — Worker configuration, Activity definitions, Workflow
definitions per process, SDK setup, testing with TestWorkflowEnvironment — is the
subject of KAA-002-B: Workflow Engine Technical Design.
