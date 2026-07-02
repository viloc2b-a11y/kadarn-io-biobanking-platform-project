# Kadarn Operations Console (KOC) Experience
## Product Definition Document — v1.0

---

## Who is this user?

**Primary persona: Kadarn Evidence Analyst**

A member of the Kadarn operations team responsible for reviewing, approving, and moderating the evidence that flows into the platform. They are the last human checkpoint before an institution's representation changes. They understand the domain (clinical research, biobanking, regulatory history) well enough to make judgment calls.

**Secondary persona: Kadarn Platform Engineer / Connector Operator**

Monitors system health, connector pipelines, and data quality. Primarily technical. Does not make evidence decisions but needs visibility into processing status, errors, and pipeline health.

**Tertiary persona: Kadarn Leadership / QA Lead**

Reviews metrics, audit trails, and quality signals. Rarely takes direct action. Needs aggregate views and exception reports.

**What they are NOT:** a customer support agent or a product manager. This console is an operational tool, not a communication platform.

---

## What are they trying to accomplish?

Four jobs, in priority order:

1. **Process the Evidence Queue** — Review incoming evidence, approve or reject items, assign them to Claims.
2. **Manage Identity** — Resolve ambiguous institutions, merge duplicates, split incorrectly merged entities.
3. **Moderate Disputes** — Review Counter Evidence and Right of Response submissions. Make or escalate decisions.
4. **Monitor System Health** — Connector pipelines, processing latency, error rates, queue depth.

---

## Moment of Truth

> The Evidence Analyst opens the staging queue, reviews the three items flagged overnight, makes a decision on each in under five minutes, and has full confidence that each decision is logged, auditable, and reversible if needed.

Speed and auditability are equally critical. A decision made in 30 seconds must be as defensible as one made in 30 minutes.

---

## Primary Object: Evidence Queue

The KOC is built around the queue, not around institutions. The analyst's job is to keep the queue moving.

Every other view — Institution Detail, Identity Graph, Connector Health — exists to help the analyst make a better queue decision.

---

## Entry Point

**URL:** `/koc`

On login, the KOC analyst sees the **Operations Overview**:
- Queue depth (items pending review)
- Disputes awaiting decision
- Identity conflicts requiring resolution
- System health summary (connector status, error rate)
- Items assigned to me vs. unassigned

The first question the console must answer: *"What requires my attention right now?"*

---

## Primary Flows

### Flow 1 — Process the Evidence Queue

**Trigger:** New evidence arrives via connector or site upload. Enters staging.

**Steps:**
1. Open Evidence Queue — sorted by: priority flag, age, source type
2. Open an evidence item — see: source (connector or site upload), raw content, proposed Claim associations, confidence contribution preview
3. Review the item:
   - Is this evidence real? (Source verification)
   - Is it correctly classified? (Type, domain, date)
   - Is the Claim association correct?
   - Is the institution correctly identified?
4. Choose action:
   - **Approve** — item enters the Confidence Graph, Passport updates
   - **Approve with correction** — fix classification or Claim assignment before approving
   - **Hold** — needs more context, flag for follow-up
   - **Reject** — not valid, with required rejection reason
5. Decision is logged with timestamp, analyst ID, and reasoning
6. Next item loads automatically

**What the analyst must understand at the end of this flow:**
- Every item they processed and what decision was made
- Queue depth before and after their session
- Whether any items were held that require follow-up

---

### Flow 2 — Resolve an Identity Conflict

**Trigger:** System flags a new institution record that may duplicate an existing one, or an institution's name appears differently across connectors.

**Steps:**
1. Open Identity Queue — list of flagged conflicts
2. Open a conflict: see the two (or more) candidate records side by side
   - Name variants
   - Associated EvidenceNodes per record
   - Source connectors per record
   - Confidence scores per record
   - Geographic and organizational metadata
3. Choose resolution:
   - **Merge** — confirm canonical identity, migrate all evidence nodes to merged record
   - **Keep separate** — records are distinct institutions, close the conflict
   - **Escalate** — needs domain expertise or legal review
4. If merging: confirm canonical name, canonical identifier, and merge rationale
5. Decision logged. Passport of merged institution updates to reflect combined evidence.

**What the analyst must understand:**
- What evidence belongs to each candidate record
- Which merge direction preserves the most accurate representation
- What the impact on existing Passports will be

---

### Flow 3 — Review Counter Evidence and Right of Response

**Trigger:** Counter Evidence has been filed against an institution, and/or the institution has submitted a Right of Response.

**Steps:**
1. Open Disputes Queue
2. Open a dispute: see side-by-side
   - The challenged Claim and supporting evidence
   - The Counter Evidence item (source, content, classification)
   - The institution's Right of Response (if submitted)
3. Assess:
   - Is the Counter Evidence valid and properly sourced?
   - Does the Right of Response address the challenge?
   - Does the Claim need to be modified, removed, or kept as-is?
4. Choose resolution:
   - **Uphold Claim** — Counter Evidence does not meet threshold; Claim unchanged
   - **Modify Claim** — Claim adjusted to reflect nuance from Counter Evidence
   - **Remove Claim** — Counter Evidence is sufficient to invalidate the Claim
   - **Escalate** — Requires external verification or legal review
5. Resolution logged with analyst reasoning. Institution and (if applicable) challenger notified of outcome.

**What the analyst must understand:**
- What the institution's Passport looked like before and after the potential change
- What the evidentiary threshold is for each decision type
- That every decision is reversible with an audit trail

---

### Flow 4 — Monitor Connector Health

**Trigger:** Daily check, or alert on connector error.

**Steps:**
1. Open Connector Dashboard
2. See per-connector status: last successful run, items processed, error rate, queue backlog
3. For failing connectors: see error log, last successful record, alert history
4. Trigger manual re-run if needed (with confirmation)
5. Flag connector issue for platform engineering if systemic

**What the analyst must understand:**
- Which connectors are healthy, degraded, or failed
- How long since last successful data pull
- Whether errors are transient or require engineering intervention

---

## Screen Inventory

| Screen | Purpose |
|--------|---------|
| Operations Overview | Entry point — queue depth, disputes, identity conflicts, system health, assigned items |
| Evidence Queue | Paginated list of items pending review — sortable, filterable |
| Evidence Item Detail | Single item review — source, content, proposed associations, action panel |
| Identity Queue | List of institution identity conflicts |
| Identity Conflict Detail | Side-by-side record comparison + merge/separate action |
| Disputes Queue | Counter Evidence items awaiting review |
| Dispute Detail | Claim + Counter Evidence + Right of Response + resolution panel |
| Institution Detail (KOC view) | Full institution record — evidence graph, history, all Claim details, audit trail |
| Connector Dashboard | Per-connector status, run history, error logs |
| Audit Log | Full history of all decisions made on the platform — filterable by analyst, institution, date, type |
| Quality Metrics | Aggregate views: queue throughput, error rates, decision distribution, confidence score distribution |
| Team Management | Analyst accounts, role assignments, queue ownership rules |

---

## Navigation Structure

```
/koc
├── /koc/queue                    Evidence Queue
│   └── /koc/queue/:id            Evidence Item Detail
├── /koc/identity                 Identity Queue
│   └── /koc/identity/:id         Conflict Detail
├── /koc/disputes                 Disputes Queue
│   └── /koc/disputes/:id         Dispute Detail
├── /koc/institutions             Institution search (KOC view — full data)
│   └── /koc/institutions/:id     Institution Detail
├── /koc/connectors               Connector Dashboard
│   └── /koc/connectors/:id       Single Connector Detail + Log
├── /koc/audit                    Full Audit Log
├── /koc/metrics                  Quality Metrics
├── /koc/analytics                Operational Analytics (existing)
├── /koc/trust                    Trust Index (existing)
├── /koc/exceptions               Exception Queue (existing)
└── /koc/settings                 Team, roles, notification rules
```

---

## What this user must be able to answer in under 30 seconds

1. How many items are in the Evidence Queue right now?
2. Do I have any disputes awaiting my decision?
3. Are any connectors failing?
4. What did I process in the last 24 hours?
5. Is there anything flagged as urgent?

---

## What this user must NEVER see

- Sponsor identities or their saved site lists
- Any information about which sponsor queried which institution
- Raw Supabase records or database internals
- Another analyst's assigned items without explicit escalation

---

## Permissions

| Action | Evidence Analyst | Platform Engineer | Leadership / QA |
|--------|----------------|------------------|----------------|
| Review Evidence Queue | ✓ | — | — |
| Approve / Reject evidence | ✓ | — | — |
| Resolve Identity conflicts | ✓ | — | — |
| Resolve Disputes | ✓ | — | — |
| Trigger connector re-run | ✓ | ✓ | — |
| View Connector Dashboard | ✓ | ✓ | ✓ |
| View Audit Log | ✓ | ✓ | ✓ |
| View Quality Metrics | — | — | ✓ |
| Manage analyst team | — | — | ✓ |
| Override another analyst's decision | — | — | ✓ (with log) |

---

## Decision auditability requirements

Every action taken in the KOC must produce an audit record containing:

| Field | Required |
|-------|---------|
| Analyst ID | ✓ |
| Timestamp (UTC) | ✓ |
| Action type | ✓ |
| Affected entity (evidence ID / institution ID / dispute ID) | ✓ |
| Before state | ✓ |
| After state | ✓ |
| Reasoning (free text, required for Reject / Modify / Escalate) | ✓ |
| Reversible | ✓ (flag) |

No decision is permanent without an audit record. The audit log is immutable.

---

## Notification triggers

| Event | Channel | Urgency |
|-------|---------|---------|
| Queue depth exceeds threshold (e.g., 50 items) | In-app + Email | High |
| Connector failure lasting > 1 hour | In-app + Email | High |
| Dispute filed with Severity = Critical | In-app | High |
| Item flagged as requiring escalation | In-app | High |
| Identity conflict auto-detected | In-app | Medium |
| Daily queue summary | Email | Low |

---

## Open questions before implementation

1. Should the Evidence Queue support bulk actions (approve N items of the same type at once)? (Recommended: yes, with confirmation modal)
2. What is the SLA for dispute resolution? (Recommended: 5 business days — surfaced in the UI as a countdown)
3. Can an analyst re-open a closed dispute? (Recommended: yes, with escalation path and dual-approval requirement)
4. Should confidence score changes preview before the analyst approves? (Recommended: yes — show delta)
5. Should the KOC have a Slack or webhook integration for high-urgency alerts? (Recommended: yes, configurable per team)
