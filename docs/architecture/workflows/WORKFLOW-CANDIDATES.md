# Kadarn Workflow Candidates — Temporal Readiness Map

**Status:** Draft  
**Sprint:** KPE-06  
**Reference:** KAA-002 — Workflow Engine / Temporal Adoption Assessment

---

## Purpose

This document inventories every business process in Kadarn that could be modeled as a
Temporal Workflow. It does not prescribe implementation — it identifies candidates,
evaluates their suitability, and recommends a first PoC.

---

## Criteria

A process is a **strong** workflow candidate when it meets most of:

- **Durable execution**: spans minutes to months; cannot fit in an HTTP request
- **Multi-step**: involves 3+ sequential or parallel steps
- **External signals**: requires waiting for human action, external service, or time
- **Retry value**: a step can fail transiently and should be retried
- **Timeout risk**: the process can stall indefinitely without timeout enforcement
- **Compensation needed**: if a step fails, prior steps must be undone
- **Visibility gap**: current status is only visible via database queries

---

## Workflow Candidates

### 1. Exchange Request (Interest → Agreement)

**Table:** `exchange_requests`
**Status field:** `status: exchange_request_status`
**Values:** `draft → submitted → under_review → negotiation → accepted / declined / withdrawn`
**Owning engine:** Exchange Engine

| Factor | Assessment |
|---|---|
| Durable execution | ✅ Days to weeks (human review, MTA negotiation) |
| Multi-step | ✅ 4+ states with transitions |
| External signals | ✅ Human reviews request, signs MTA (offline) |
| Retry value | ⚠️ Low — steps are human-driven, not automation |
| Timeout risk | ✅ High — requests can stall in `under_review` or `negotiation` indefinitely |
| Compensation | ✅ If declined, revert visibility, notify participants |
| Visibility gap | ⚠️ Current: `SELECT * FROM exchange_requests WHERE status` — works but no history |

**Verdict: PoC candidate.** Mature table with clear state machine. Timeout enforcement
alone justifies the workflow.

---

### 2. Exchange Deal (Negotiation → Settlement)

**Table:** `exchange_deals`
**Status field:** `status: exchange_deal_status`
**Values:** `pending_acceptance → active → fulfillment → completed / cancelled / disputed`
**Owning engine:** Exchange Engine

| Factor | Assessment |
|---|---|
| Durable execution | ✅ Weeks to months (fulfillment, shipment, settlement) |
| Multi-step | ✅ 4+ states |
| External signals | ✅ Deal acceptance, fulfillment confirmation, dispute resolution |
| Retry value | ✅ Fulfillment steps may need retry (carrier failures, payment retry) |
| Timeout risk | ✅ High — deals stall in `fulfillment` if shipments are lost |
| Compensation | ✅ If cancelled, revert escrow, notify parties |
| Visibility gap | ⚠️ Partial — escrow status and deal status are separate tables |

**Verdict: Strong candidate.** More complex than Exchange Request (escrow + financial
implications). Better as a second workflow.

---

### 3. Logistics Shipment

**Table:** `logistics_shipments`
**Status field:** `status: shipment_status`
**Values:** `pending → label_created → picked_up → in_transit → customs_clearance → out_for_delivery → delivered / exception / lost / returned / cancelled`
**Owning engine:** Logistics Engine

| Factor | Assessment |
|---|---|
| Durable execution | ✅ Days to weeks |
| Multi-step | ✅ 7+ states (the richest state machine in Kadarn) |
| External signals | ✅ Carrier webhooks, temperature alerts, customs events |
| Retry value | ✅ High — carrier API calls, label generation can fail transiently |
| Timeout risk | ✅ Very high — in_transit without delivery for 7+ days = exception |
| Compensation | ✅ If lost, trigger replacement workflow, insurance claim |
| Visibility gap | ✅ Current: manual query per shipment, no aggregated view |

**Verdict: Strong candidate** but high complexity. 11 status values, carrier
integration, temperature monitoring, customs. Better as a phase-2 workflow after PoC.

---

### 4. Program Milestone Tracking

**Table:** `program_milestones`
**Status field:** `status: milestone_status`
**Values:** `pending → in_progress → completed / blocked / cancelled`
**Owning engine:** Program Engine

| Factor | Assessment |
|---|---|
| Durable execution | ✅ Weeks to months (program lifecycle) |
| Multi-step | ✅ Milestones are sequential by design |
| External signals | ✅ Human marks milestones complete, external IRB approval |
| Retry value | ⚠️ Low — milestones are human-driven |
| Timeout risk | ✅ High — blocked milestones can stall a program indefinitely |
| Compensation | ⚠️ Low — cancelling a milestone reverts downstream expectations |
| Visibility gap | ⚠️ Current: `program_milestones` query works for single program |

**Verdict: Moderate candidate.** The milestone concept naturally maps to Temporal
workflow steps, but milestones are a _consequence_ of other workflows (exchange,
shipment) completing, not a process themselves. Better as signal collectors than
individual workflows.

---

### 5. Processing Workflow (sample → aliquot → QC)

**Tables:** `processing_samples`, `processing_aliquots`, `processing_workflows`
**Status field:** `qc_status` (per aliquot: `pending / pass / fail / borderline`)
**Owning engine:** Processing Engine

| Factor | Assessment |
|---|---|
| Durable execution | ✅ Hours to days (lab processing) |
| Multi-step | ✅ Sample receipt → processing → QC → storage |
| External signals | ✅ Lab technician marks steps complete, QC results |
| Retry value | ⚠️ Low — lab steps are physical, not retryable |
| Timeout risk | ✅ Medium — processing without QC result |
| Compensation | ✅ If QC fails, revert aliquot to source, flag sample |
| Visibility gap | ⚠️ Partial — per-aliquot status, no batch view |

**Verdict: Moderate candidate.** Good workflow shape but the physical nature of lab
processing means retry and timeout have different semantics than digital processes.

---

### 6. Organization Onboarding

**Table:** Does not exist yet — `009_rls_foundation.sql` has a `TODO` comment:
```
-- TODO Sprint 1: Add onboarding status for organizations
```
**Owning engine:** Platform Services / Auth

| Factor | Assessment |
|---|---|
| Durable execution | ✅ Days to weeks (vetting, agreement signing) |
| Multi-step | ✅ Registration → verification → agreement → approval → activation |
| External signals | ✅ Admin review, background check, signed participation agreement |
| Retry value | ⚠️ Low — steps are human-driven |
| Timeout risk | ✅ High — incomplete onboarding stalls without follow-up |
| Compensation | ✅ If rejected, clean up partial registrations, notify applicant |
| Visibility gap | ✅ No current status tracking |

**Verdict: PoC candidate.** No existing table means clean-slate design — simpler than
retrofitting. The TODO in the migration explicitly marks it as needed.

---

### 7. Settlement / Payment

**Table:** None found — likely handled by `financial-engine` (package exists but is stub)
**Owning engine:** Financial Engine

**Verdict: Premature.** No existing state machine. Settlement requires financial
infrastructure (invoicing, payment gateway, escrow release) not yet implemented in
Kadarn. Cannot evaluate workflow suitability until the engine exists.

---

## Recommendation

### First PoC: Exchange Request Workflow

**Rationale:**

1. **Table exists** with a well-defined status enum (`draft → submitted → under_review →
   negotiation → accepted / declined / withdrawn`)
2. **Timeout risk is real** — requests can stall in `under_review` indefinitely today
3. **External signals** — human review and MTA signing are explicit waits a workflow
   would manage
4. **Compensation is clear** — declining a request reverts visibility, notifies participants
5. **Boundary is narrow** — the workflow lives entirely within the Exchange Engine,
   touching only `exchange_requests` and `exchange_messages`
6. **No escrow or financial complexity** — unlike Deals, Requests are pure information
   exchange + consent

### Comparison: Onboarding vs Exchange Request

| Factor | Organization Onboarding | Exchange Request |
|---|---|---|
| Table exists | ❌ | ✅ |
| Status enum exists | ❌ | ✅ |
| External signals | Admin review | Human review, MTA signing |
| Timeout risk | High | High |
| Boundary scope | Auth + Platform | Exchange Engine only |
| Clean-slate design | ✅ | ❌ (must fit existing data) |

**Exchange Request wins** because it works with existing production data. Onboarding
is a close second — it would be simpler to design but has no schema to work with,
which means the PoC would be entirely abstract until the table is created.

### Suggested Future Order

| Phase | Workflow | Why |
|---|---|---|
| **PoC (KPE-06+)** | Exchange Request | Existing data, clear timeout risk |
| **Phase 2** | Organization Onboarding | Clean-slate, complementary to Requests |
| **Phase 3** | Logistics Shipment | Highest complexity, needs carrier integration |
| **Phase 4** | Exchange Deal | Escrow + financial settlement |
| **Phase 5** | Program Milestone Tracking | Signal collector, depends on other workflows |

---

## Next Steps (Post-KPE-06)

1. Create Temporal SDK package skeleton: `packages/temporal-workflows/`
2. Define `ExchangeRequestWorkflow` interface: signals, queries, activities
3. Write first activity: `NotifyReviewer` (stub — email/notification service)
4. Implement workflow logic: state machine + timeout + compensation
5. Connect to existing `POST /api/v1/exchange/requests` route
6. Tests: workflow simulation without Temporal server (via test environment)

**Do not install Temporal server during PoC.** The Temporal SDK's test environment
(`@temporalio/testing`) runs workflows in-process for unit tests. The server is only
needed when connecting to production.
