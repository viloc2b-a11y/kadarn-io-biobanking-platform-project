# ADR-023: External Integrations — Evaluation Decision

**Status:** Accepted  
**Date:** 2026-06-28  
**Deciders:** Kadarn Architecture (Sprint 11)  
**Principle:** Each integration must justify its value — not satisfy an audit checklist  

---

## Context

Sprint 11 evaluates six external integrations commonly listed in Kadarn audits:

- OPA, Stripe, FHIR, OpenSpecimen, BBMRI, Supabase Realtime

Kadarn is now **operationally solid** (Sprints 6–10): orchestrator, observability, workflow runtime, trust/financial/knowledge fabric. External integrations should **extend** that foundation, not destabilize it.

---

## Decision

| Integration | Sprint 11 verdict |
|-------------|-------------------|
| **OPA** | **Integrate** — HttpOpaClient + optional sidecar; shadow mode only |
| **Supabase Realtime** | **Integrate** — KOC audit feed subscription |
| **Stripe** | **Deferred** |
| **FHIR** | **Deferred** (mapping doc retained) |
| **OpenSpecimen** | **Deferred** |
| **BBMRI / MIABIS** | **Rejected** for Sprint 11 scope |

Registry: `packages/integration-engine/src/registry.ts`

---

## Rationale

### OPA

Shadow infrastructure exists and is tested. HTTP client enables real OPA without changing call sites. Enforce mode stays off until convergence metrics justify it (KPE PR-006 gate).

### Supabase Realtime

Already enabled in Supabase config. Client hook + publication migration delivers pilot UX value at minimal cost.

### Stripe, FHIR, OpenSpecimen, BBMRI

No pilot currently requires these. Premature integration adds vendor lock-in, compliance surface, or AGPL risk without user-facing value.

---

## Consequences

### Positive

- Clear integration roadmap with re-evaluation triggers
- OPA path to production-grade policy evaluation
- Live KOC activity without new infrastructure

### Negative / accepted

- Payment remains orchestration-only until Stripe defer lifted
- FHIR/OpenSpecimen pilots need connector work in a future sprint
- Realtime limited to tables in publication migration

---

## References

- [SPRINT-11-EXTERNAL-INTEGRATIONS-EVALUATION.md](../engineering/SPRINT-11-EXTERNAL-INTEGRATIONS-EVALUATION.md)
- [KAA-001 Policy Engine](../architecture/kaa/KAA-001-policy-engine.md)
- [FHIR-MAPPING.md](../architecture/fhir/FHIR-MAPPING.md)
