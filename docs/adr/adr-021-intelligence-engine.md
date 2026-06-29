# ADR-021: Intelligence Engine — AI-Assisted Platform

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

KRM-RAO defines AI as a transversal capability across all layers — not
an isolated module. The Intelligence Engine (§5.8) provides AI assistance
to every other engine on demand.

---

## Decision: Build Intelligence Engine as a Plugin Interface

Each engine registers AI-capable handlers. The Intelligence Engine routes
requests to the appropriate handler (LLM, classifier, embedder). Default
implementations are no-ops — actual AI requires external model access.
