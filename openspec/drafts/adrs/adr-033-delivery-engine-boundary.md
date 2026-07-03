# ADR-033 — Delivery Engine Boundary

**Status:** Proposed  
**Date:** 2026-07-03  
**Target sprint:** 29A (Accepted at 29B)  
**Phase:** 9  
**Depends on:** ADR-030, ADR-031, KEMS-007  
**Related:** [phase-9-evidence-delivery-architecture.md](../../phase-9-evidence-delivery-architecture.md)

---

## Context

Outbound delivery (PDF, webhook, API export) must not bypass Published Views or mutate Evidence Core. Connector retry/DLQ is inbound-only and must not be reused for outbound delivery.

---

## Decision

1. **Delivery Engine** is a separate bounded context (`packages/delivery/`).
2. Compile input: **Published View** (+ optional Evidence Pack). Never raw Claims.
3. Outbound retry, idempotency, DLQ: **KEMS-007.F only** — not connector framework.
4. Policy Engine and Visibility Engine are mandatory runtime calls before artifact compile (KEMS-007 §2 wiring mandate).

---

## Consequences

| Area | Impact |
|------|--------|
| platform-services/webhooks | Replaced by delivery engine |
| evidence-core/connectors | Inbound only; no outbound merge |
| Phase 8 | 28D + 28F prod required before 29B |

---

## Acceptance criteria (29B gate)

- [ ] No delivery path reads Evidence Core claims directly
- [ ] ADR-033 Accepted before Delivery Engine code merge
