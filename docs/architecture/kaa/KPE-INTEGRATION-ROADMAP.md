# KPE Integration Roadmap
## From KAA Decisions to Production Code

**Derived from:** KAA-001 (OPA), KAA-002 (Temporal), KAA-003 (W3C PROV)  
**Scope:** What ships as code, in what order, and why that order

---

## The ordering principle

Each milestone must produce standalone production value — not just infrastructure
that pays off "later." The sequence is ordered so that each PR makes the platform
more correct, more auditable, or more observable than it was before, regardless of
what comes next.

---

## Milestone map

```
PR-001  PROV: Append-only enforcement + integrity_status API
    └─ Makes the existing provenance data trustworthy (regulatory baseline)

PR-002  OPA: Shadow Mode infrastructure + first policy
    └─ Starts building divergence evidence (prerequisite for enforce mode)

PR-003  PROV: W3C PROV semantic mapping + chain validation
    └─ Makes provenance queryable by external auditors and KPE scoring

PR-004  OPA: Trust Score policy in Shadow Mode
    └─ First business-critical policy wired to real data

PR-005  PROV: KPE provenance dimension scoring
    └─ Provenance completeness becomes a quantifiable program metric

PR-006  OPA: Enforce Mode rollout — trust.participation_threshold
    └─ First OPA policy that actually blocks (gated on <0.1% divergence rate)

PR-007  Temporal: First workflow — Shipment Fulfillment
    └─ Replaces status-field coordination with durable orchestration

PR-008  OPA + PROV: Policy decisions recorded as provenance nodes
    └─ Governance decisions become part of the auditable chain of custody

PR-009  Temporal: Program Milestone workflow
    └─ KPE scoring triggered automatically on milestone completion

PR-010  Temporal + OPA + PROV: Full KPE settlement workflow
    └─ All three engines converge in a single production workflow
```

---

## PR-001 — PROV Append-Only Enforcement (this PR)

**Why first:** The provenance tables exist. The data is being written. But nothing
prevents a `DELETE` or an `UPDATE` on `provenance_nodes`. That is not a provenance
graph — it is a mutable log with no regulatory defensibility. This PR makes the
existing data mean something, without adding a single new dependency.

**What it delivers:**
- PostgreSQL trigger that blocks `UPDATE` and `DELETE` on all three provenance
  tables, with a corrective exception for `wasRevisionOf` correction pattern
- `integrity_status` column on `provenance_nodes` (computed, not stored)
- API endpoint enhancement: `GET /api/v1/operations/provenance` already exists —
  add `integrity_status` derivation server-side with the PROV-aligned logic
- New migration: `032_provenance_append_only.sql`

**What it does NOT touch:** No schema changes to existing columns. No RLS changes.
No new tables. The existing route handler gets a small enhancement.

---

## PR-002 — OPA Shadow Mode Infrastructure

**Why second:** Before any policy can be enforced, there must be evidence that OPA
reaches the same decisions as the existing logic. Shadow Mode produces that evidence.
The `policy_evaluations` table already exists and is waiting for rows.

**What it delivers:**
- `packages/policy-engine/src/opa-client.ts` — thin wrapper around OPA HTTP API
- `apps/api/src/lib/with-policy.ts` — HOF that layers on top of `withAuth()`
- Feature flags: `OPA_SHADOW_MODE`, `OPA_FAIL_OPEN`, `OPA_AUDIT_ENABLED`
- First Rego policy: `trust.participation_threshold` (the one already seeded in DB)
- Shadow evaluation writes to `policy_evaluations` on every evaluated request
- KOC divergence counter in Overview page stats

---

## PR-003 — W3C PROV Semantic Mapping

**Why third:** Once provenance is append-only and integrity-validated, the next
step is making it externally readable. This maps the existing `edge_type` enum
values to W3C PROV relation names and adds a PROV-JSON export endpoint.

---

## PR-004 through PR-010 — deferred

Sequenced but not specced until the first three PRs are in production and the
divergence data from Shadow Mode informs the enforce-mode rollout timing.

---

## Starting now: PR-001
