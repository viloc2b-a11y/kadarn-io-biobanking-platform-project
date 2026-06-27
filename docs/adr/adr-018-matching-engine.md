# ADR-018: Matching Engine — Intelligent Specimen Matching

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Discovery Service currently returns flat catalog results without ranking,
semantic expansion, or trust filtering. The KRM-RAO Capability Sequence
(§6) places Matching at step 4 — after Integration, Policy, and Knowledge.

---

## Decision: Build Matching Engine as a Query Composition Service

Queries are expanded via Knowledge Engine (synonyms), filtered by Policy
(governance) and Trust (score), ranked by relevance. The engine is a
library that composes existing engines — no new storage.
