# ADR-019: Fulfillment Engine — Automated Fulfillment Lifecycle

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Fulfillment is the end-to-end process from request acceptance through
logistics to settlement confirmation. Currently handled by Exchange
Service with manual steps. KRM-RAO §5.6 defines the Fulfillment Engine.

---

## Decision: Build Fulfillment Engine as Workflow + Twins Orchestrator

The Fulfillment Engine creates a Transaction Twin on start, coordinates
logistics via Shipment Twin, invokes Policy Engine at handoffs, and
triggers Financial Engine on completion.
