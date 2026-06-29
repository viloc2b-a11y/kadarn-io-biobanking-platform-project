# Sprint 11 — External Integrations Evaluation

**Program:** Kadarn v1.0 Hardening  
**Objective:** Justify each external integration by pilot value — not audit checklist compliance  
**Decision:** See [ADR-023](../adr/adr-023-external-integrations-decision.md)

**Deferred to post-hardening backlog:** pgvector hybrid search, KPE ontology coverage metrics (from Sprint 10).

---

## Current state (verified in code)

| Integration | In repo today | Production use |
|-------------|---------------|----------------|
| **OPA** | Shadow mode + LocalOpaClient + 1 route wired | Simulated JSON eval; no HTTP OPA server |
| **Stripe** | Zero npm deps; settlement API says "no gateway" | Escrow orchestration only |
| **FHIR** | `docs/architecture/fhir/FHIR-MAPPING.md` | Docs only |
| **OpenSpecimen** | Blueprint references | Zero code |
| **BBMRI** | Vocabulary notes in blueprint | Zero code |
| **Supabase Realtime** | `[realtime] enabled = true` in config | Auth subscription only; KOC polled REST |

**Conclusion:** Kadarn is solid enough to **evaluate** integrations, but most should remain **deferred** until a named pilot demands them.

---

## Decision matrix

| Integration | Verdict | Pilot value | Readiness | Effort | Weighted |
|-------------|---------|-------------|-----------|--------|----------|
| OPA HTTP + sidecar | **Integrate** (shadow) | Policy convergence, audit | High | Medium | **4.2** |
| Supabase Realtime | **Integrate** (narrow) | KOC live feed | Config ready | Low | **4.5** |
| Stripe Connect | **Defer** | Real money | Settlement SM only | High | 2.1 |
| FHIR translation | **Defer** | Hospital interop | Docs only | Medium | 2.4 |
| OpenSpecimen connector | **Defer** | LIMS import | Stub engine | Medium | 2.0 |
| BBMRI/MIABIS federation | **Reject** (Sprint 11) | EU network | Vocab refs only | Very high | 1.5 |

---

## What we ship (Sprint 11)

1. **HttpOpaClient** + ResilientOpaClient fallback → `packages/policy-engine/src/opa/http-opa-client.ts`
2. **OPA sidecar artifact** → `integrations/opa/docker-compose.yml` (optional, dev only)
3. **Integration registry** → `packages/integration-engine/src/registry.ts`
4. **Supabase Realtime hook** → `apps/web/src/hooks/use-supabase-realtime.ts` + KOC notifications
5. **Migration 041** → Realtime publication for `audit_events`, `workflow_tasks`

### Explicit non-actions

- No `stripe` npm package
- No FHIR server or `@types/fhir`
- No OpenSpecimen code import (AGPL)
- No BBMRI federation APIs
- **OPA enforce mode remains off** (`OPA_ENFORCEMENT=false`)

---

## Per-integration rationale

### OPA — Integrate (shadow only)

KAA-001 already adopted OPA architecturally. Shadow mode records divergences without blocking. HttpOpaClient closes the gap to a real sidecar while LocalOpaClient remains offline/test fallback.

**Value:** Evidence before enforce mode; structured policy_evaluations; provenance linkage.

### Supabase Realtime — Integrate (narrow)

Infra enabled; gap is client wiring. Subscribe to `audit_events` for KOC activity refresh when `NEXT_PUBLIC_REALTIME_ENABLED=true`.

**Value:** Removes polling latency for operations dashboard; zero new vendor.

### Stripe — Defer

Sprint 9 financial runtime handles escrow/settlement **orchestration**. Real fund movement requires KYC, PCI scope, and legal review.

**Value exists** but **timing is wrong** until pilot requires payment rails.

### FHIR — Defer

Mapping doc is the correct first step. Export/translation layer when a hospital pilot names a FHIR consumer.

### OpenSpecimen — Defer

REST connector pattern when pilot biobank confirmed. AGPL prevents embedding their codebase.

### BBMRI — Reject for Sprint 11

Keep compatible vocabulary; federation is a program, not a sprint.

---

## Re-evaluation triggers

| Integration | Re-open when |
|-------------|--------------|
| OPA enforce | Shadow divergence < 1% for 30 days |
| Stripe | Pilot contract requires PSP + legal sign-off |
| FHIR | Named consumer requires Bundle export |
| OpenSpecimen | Staging LIMS API credentials available |
| BBMRI | EU federation pilot funded |
| Realtime | Dedicated notifications table replaces composite API |

---

## Environment variables

```bash
# OPA (optional sidecar)
OPA_SHADOW_MODE=true
OPA_SERVER_URL=http://localhost:8181
OPA_ENFORCEMENT=false

# Realtime (web)
NEXT_PUBLIC_REALTIME_ENABLED=true
```
