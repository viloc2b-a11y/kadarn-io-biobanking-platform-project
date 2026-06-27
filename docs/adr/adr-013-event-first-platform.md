# ADR-013: Event-First Platform

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn already produces and consumes events across multiple modules.
However, events have evolved organically: different envelope shapes,
inconsistent field names, no versioning strategy, and no idempotency
guarantees.

The KRM-RAO reference model defines events as the single source of truth
(§2.3) and the foundation for Provenance, Twins, and Graphs. Without a
standardized event model, these higher-level constructs cannot be built
reliably.

---

## Decision: Adopt a Standardized Event Model

Kadarn adopts a canonical event envelope, versioning strategy,
idempotency mechanism, and correlation/causation model as defined in
`docs/architecture/event-catalog.md`.

### Envelope

Every event must include:

| Field | Purpose |
|-------|---------|
| `event_id` | Unique, idempotency key |
| `event_type` | Canonical PascalCase type |
| `version` | Schema version |
| `occurred_at` / `recorded_at` | Timestamps |
| `actor_id` | Who caused it |
| `organization_id` / `tenant_id` | Multi-tenant scope |
| `subject_type` / `subject_id` | Entity reference |
| `correlation_id` / `causation_id` | Chain tracing |
| `payload` | Event-specific data |
| `metadata` | Routing, versioning, source |

### Missing Events Added

16 new canonical events are added to close gaps in the Research Asset
lifecycle, governance, fulfillment, and settlement domains (see
Event Catalog §3).

### Idempotency

The `event_id` is the idempotency key. Event stores must detect and
skip duplicate IDs.

### Correlation

Every event carries a `correlation_id` (tracing the full command chain)
and optionally a `causation_id` (linking to the direct parent event).

---

## Consequences

### Positive

- All events have a consistent, predictable shape
- Correlation enables full-chain tracing for audit and provenance
- Idempotency enables safe retry and replay
- Versioning enables schema evolution without breaking consumers
- The Event Catalog becomes the authoritative reference

### Negative

- Existing event producers must be updated to the new envelope
- `correlation_id` and `causation_id` require plumbing through command
  handlers

### Neutral

- The event catalog is a living document — new events are additive
- Backward compatibility for existing events during migration period
