# ADR-020: Financial Engine — Settlement & Fee Distribution

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Settlement is the financial completion of a fulfillment. KRM-RAO §5.7
defines the Financial Engine for fee calculation, escrow, and multi-party
distribution. Currently settlement is manual.

---

## Decision: Build Financial Engine as a Stateless Calculator

The engine takes fulfillment data and fee schedules, computes obligations,
and produces settlement records. State management uses the Transaction
Twin. Integration with external payment systems is deferred to the
Integration Engine.
