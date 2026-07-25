# KADARN v2 — Foundation Phase Charter

**Date:** 2026-07-25
**Phase:** Foundation Phase (post-Concept Discovery)
**Predecessor Phase:** Concept Discovery (KAD-001→012)

---

## Declaration

KADARN enters the Foundation Phase. The phase is governed by the Architecture Constitution v2.0 and the Ratified Minimal Schema.

## Objectives

| # | Objective | Bounded Context | Key Deliverable |
|---|-----------|----------------|-----------------|
| 1 | Evidence Source Intelligence | Source & Evidence | Sources + SourceRecords with T1–T4 authority |
| 2 | Provenance and Extraction | Source & Evidence | Extraction pipeline with observation promotion |
| 3 | Claim Temporal Integrity | Claims & Capability | Self-versioning claims with valid_from/until |
| 4 | Evidence Relationship Graph | Claims & Capability | claim_evidence_links with supports/contradicts |
| 5 | Capability Intelligence | Claims & Capability | Temporal capabilities with conditions and availability |
| 6 | Protocol Requirements | Protocol Assessment | Protocol + versions with structured requirements |
| 7 | Explainable Assessment | Protocol Assessment | Per-requirement matching with gaps and mitigations |
| 8 | Reproducible Publication | Publication | KnowledgeSnapshot-based Passport projections |
| 9 | Controlled Sharing v2 | Publication | ShareGrant with purpose, policy, and audit |
| 10 | Audit & Observability | Governance | Audit event table for compliance and provenance |

## What Is OUT of Scope

- 🚫 Marketplace (buy/sell of services)
- 🚫 CTMS replacement (no patient scheduling, no visit tracking)
- 🚫 eReg/electronic regulatory submission
- 🚫 EMR/EDC replacement (no clinical data)
- 🚫 Recruitment platform (no patient matching)
- 🚫 Universal site score (no ranking)
- 🚫 Mass system integrations (before decision value demonstrated)
- 🚫 Microservices (modular monolith confirmed)
- 🚫 Advanced dashboards and visualization
- 🚫 AI-first claim generation (LLM produces candidates, review gates apply)

## Phase Exit Criteria

The Foundation Phase ends when:

1. A real Continuing Review document from Vilo can be ingested, extracted, promoted to evidence, composed into capabilities, and published as a Passport.
2. The protocol assessment engine can compare institutional knowledge against requirements and produce actionable gaps.
3. All 22 tables in the ratified schema exist, have tests, and have integration coverage.
4. The continuity engine is fully replaced (tables still exist but no code reads them).

## Principle

Every sprint must increase the platform's ability to answer:

> "Can this institution execute this protocol, why do we believe it, and what current evidence supports that conclusion?"
