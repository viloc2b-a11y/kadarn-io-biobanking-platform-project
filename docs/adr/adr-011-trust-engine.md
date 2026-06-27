# ADR-011: Trust Engine — Evidence-Based Trust Computation

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn orchestrates biospecimen movement across independent organizations.
Without a mechanism to assess counterparty reliability, the platform falls
back to either:
- **Risk-averse routing:** always using known partners, defeating the
  purpose of a network, or
- **Assumption-based trust:** treating all participants as equally reliable,
  exposing the network to counterparty risk.

The KRM-RAO reference model (§2.7, §4.4, §5.4) defines **Trust** as a
computed, evidence-based assessment that decays without new evidence. The
**Trust Engine** is a P0 engine.

---

## Decision: Build the Trust Engine as a Stateful Score Manager

The Trust Engine is implemented as `packages/trust-engine/` with persistent
state in PostgreSQL and a stateless scoring function as a TypeScript
library.

### 1. Trust Score Model

An **OrganizationTrust** represents one organization's trust assessment
across four dimensions. Each dimension is a scalar 0.0–1.0.

| Dimension | Meaning | Evidence sources |
|-----------|---------|-----------------|
| **Operational** | Reliability of specimen handling | Fulfillment completion rate, on-time delivery, temperature compliance, QC pass rate |
| **Regulatory** | Compliance with rules and accreditations | Valid CAP/CLIA/ISO certifications, audit outcomes, regulatory incidents |
| **Financial** | Payment reliability | Payment history, invoice accuracy, settlement timeliness |
| **Technical** | System and data quality | Integration stability, data completeness, API reliability |

A composite **overall score** is computed as a weighted average of the
four dimensions. Default weights are equal (0.25 each) but configurable
per program.

### 2. Score Computation

Scores are updated through **trust events** — evidence-bearing records of
actions or incidents that affect trust.

Each trust event specifies:
- **organization_id** — target of the assessment
- **dimension** — which dimension this event affects
- **impact** — a numeric delta (-1.0 to +1.0) or a function reference
- **evidence** — reference to supporting evidence (document hash, event ID)
- **source** — what triggered this event (e.g., `fulfillment.completed`,
  `temperature.breach`, `accreditation.verified`)

Score computation formula (for each dimension):

```
new_score = clamp(previous_score + weighted_impact, 0.0, 1.0)

where weighted_impact = base_impact × severity_multiplier × recency_multiplier

  base_impact:        configured per event source (e.g., -0.1 for breach)
  severity_multiplier: event severity (1.0 normal, 1.5 high, 2.0 critical)
  recency_multiplier:  higher for recent events, lower for old events
```

### 3. Score Decay

Trust scores decay over time when no new evidence arrives. This prevents
stale certifications from masking current operational issues.

Decay formula (applied on read or on a schedule):

```
decayed_score = current_score × (1 - decay_rate ^ days_since_last_event)

where decay_rate is configured per dimension:
  Operational:  0.01/day (fast — recent performance matters most)
  Regulatory:   0.005/day (medium — certifications last 1-2 years)
  Financial:    0.005/day (medium)
  Technical:    0.002/day (slow — system quality is persistent)
```

### 4. Trust Challenges

An organization may **challenge** a trust score when they believe it is
inaccurate. A challenge provides counter-evidence and triggers
recomputation.

Challenge lifecycle:
1. **Filed** — organization submits counter-evidence
2. **Under review** — platform reviews the challenge
3. **Accepted** — score is recomputed including the new evidence
4. **Rejected** — original score stands, challenge is logged
5. **Escalated** — human review required

### 5. Database Schema

Three tables:

- **organization_trust** — current trust scores per organization
  - organization_id, operational_score, regulatory_score, financial_score,
    technical_score, overall_score, last_event_at, last_decay_at,
    total_fulfillments, successful_fulfillments, incident_count

- **trust_events** — append-only log of trust-affecting events
  - id, organization_id, dimension, impact, evidence_ref, source,
    severity, description, created_by, created_at

- **trust_challenges** — trust score challenges
  - id, organization_id, dimension, challenged_score, evidence_ref,
    reason, status, reviewed_by, reviewed_at, resolution_notes

### 6. Integration

The Trust Engine is both a **package** (scoring functions as pure
computation) and a **service** (state management via the database).

Other engines and services call:

```typescript
// Record a trust-affecting event
await trustEngine.recordEvent({
  organizationId: "...",
  dimension: "operational",
  source: "fulfillment.completed",
  impact: 0.02,
  evidence: "fulfillment-448",
  severity: "normal",
});

// Get current trust scores (with decay applied on read)
const scores = await trustEngine.getScores("org-123");

// Challenge a score
await trustEngine.fileChallenge({
  organizationId: "org-123",
  dimension: "operational",
  evidence: "...",
  reason: "ISO 20387 certification verified",
});
```

### 7. Traceability

Every trust score is traceable to the events that produced it. The
`/trust/:orgId/trajectory` endpoint returns the score history over time,
showing each event's contribution.

---

## Consequences

### Positive

- Trust is computed from verifiable evidence, not subjective ratings
- Scores decay without reinforcement — stale trust is not blind trust
- Challenges provide a correction mechanism
- Every score is traceable to contributing events

### Negative

- Decay requires a scheduled job or read-time computation
- Impact weights need tuning as the platform matures
- Initial trust scores (0.5 neutral) may not reflect actual capability

### Neutral

- Weight configuration per program allows flexibility
- New dimensions can be added without schema changes (extensible model)
