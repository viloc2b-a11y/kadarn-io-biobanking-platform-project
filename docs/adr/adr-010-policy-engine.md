# ADR-010: Policy Engine — Declarative Policy Evaluation

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn's existing modules hardcode business rules in application logic
(RLS policies, service-layer checks, API middleware). As the platform
grows across regulatory domains and jurisdictions, hardcoded rules
create several problems:

1. **Change velocity:** A new regulation affecting consent verification
   requires a code change, deployment, and migration — even when the
   rule itself is simple.
2. **Auditability:** Hardcoded rules leave no evaluation trace. When a
   governance decision is challenged, there is no record of *which* rules
   were evaluated and *why* the outcome was produced.
3. **Composability:** Rules for different domains (governance, financial,
   regulatory, operational) are scattered across services with no unified
   composition strategy.
4. **Multi-tenancy:** Different organizations and programs need different
   rule sets. Hardcoded rules cannot be customized per tenant without
   branching the codebase.

The KRM-RAO reference model (§2.4, §5.2) defines a **Policy Engine** as
a P0 component — the first engine to implement.

---

## Decision: Build a Declarative Policy Engine as a Standalone Package

Kadarn implements the Policy Engine as `packages/policy-engine/` with
the following architecture:

### 1. Policy Model

A **Policy** is a versioned, declarative set of rules with a domain,
priority, and status.

```
Policy
├── identity (id, name, version, domain, status, priority)
├── rules[]
│   ├── condition (expression tree)
│   ├── effect (allow | deny)
│   └── reason (human-readable explanation)
└── metadata (free-form key-value store)
```

### 2. Condition Expression Language

Conditions use a JSON-based expression tree — no custom DSL. This
avoids parsing complexity, enables safe storage in PostgreSQL (JSONB),
and allows conditions to be constructed programmatically.

Supported operators:

| Operator | Semantics | Example |
|----------|-----------|---------|
| `eq` | Equality | `{"eq": [{"var": "request.consent.scope"}, "oncology"]}` |
| `neq` | Inequality | `{"neq": [{"var": "specimen.type"}, "whole_blood"]}` |
| `gt`, `gte`, `lt`, `lte` | Numeric comparison | `{"gte": [{"var": "org.trustScore"}, 0.85]}` |
| `in` | Membership | `{"in": [{"var": "request.purpose"}, ["research", "qa"]]}` |
| `contains` | String contains | `{"contains": [{"var": "specimen.id"}, "TMA-"]}` |
| `all` | Logical AND | `{"all": [cond1, cond2, cond3]}` |
| `any` | Logical OR | `{"any": [cond1, cond2]}` |
| `not` | Logical NOT | `{"not": cond}` |
| `var` | Context variable reference | `{"var": "request.consent.irbId"}` |
| `bool`, `string`, `number` | Literal values | `{"string": "oncology"}` |

### 3. Evaluation

The engine evaluates a policy against a **context** object — a JSON
document assembled at the decision point containing all facts relevant
to the decision.

Evaluation produces:

```
PolicyEvaluation
├── policyId
├── policyName
├── outcome (allow | deny | conditional)
├── matchedRules[]
├── trace[]
│   ├── ruleId
│   ├── condition (serialized)
│   ├── result (boolean)
│   └── reason (if denied)
└── evaluatedAt (ISO 8601)
```

### 4. Composition Strategy

When multiple policies apply to the same decision point:

1. **Priority order:** Policies with lower `priority` values are evaluated
   first. Default priority is 1000.
2. **Deny wins:** If any applicable policy produces `deny`, the final
   outcome is `deny` regardless of other policies. This is a safety
   invariant — a single hard block stops the flow.
3. **Allow with conditions:** If all policies produce `allow` or
   `conditional`, the outcome is `allow`. Any `conditional` outcomes
   are attached as caveats.
4. **Inactive/skipped:** Policies with status `inactive`, `draft`, or
   `deprecated` are not evaluated unless explicitly selected.

### 5. Database Schema

Two tables in a new migration:

- `policies` — policy definitions with JSONB rules
- `policy_evaluations` — evaluation results (append-only audit log)

Policies use RLS for multi-tenant isolation (same pattern as existing
migrations). Policy evaluation is stateless — the engine itself is a
pure function.

### 6. Integration

The Policy Engine is a **package**, not a microservice. Other Kadarn
services and engines import it as a library and call `evaluate()`. This
keeps latency low (no network hop) and follows the existing monorepo
pattern.

When a real event bus is implemented (future Sprint), the Policy Engine
will also emit `PolicyEvaluated` events for audit and provenance
tracking.

### 7. Traceability

Every evaluation records a full trace — which rules matched, which didn't,
and why. Traces are stored in `policy_evaluations` and accessible via API
for audit review. This satisfies the KRM-RAO "evaluation trace" and
"traceable" requirements.

---

## Consequences

### Positive

- Business rules become data — changeable without code deploys
- Full audit trail for every policy decision
- Multi-tenant isolation via existing RLS pattern
- Composability via priority + deny-wins semantics
- No custom DSL (JSON expression tree is safe and portable)

### Negative

- Complex conditions may be harder to express in JSON vs a DSL
- Policy evaluation adds latency to decision points (sub-millisecond for
  typical cases)
- Existing hardcoded rules must be migrated incrementally — not all at
  once

### Neutral

- The expression tree can be extended with new operators as needed
- Policy versioning is explicit (not automatic) — version bumps require
  an API call
