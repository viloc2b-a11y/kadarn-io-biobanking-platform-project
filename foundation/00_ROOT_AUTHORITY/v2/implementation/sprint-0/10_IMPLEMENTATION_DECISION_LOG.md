# KADARN v2 — Implementation Decision Log

**Date:** 2026-07-25

---

| # | Date | Decision | Rationale | Author |
|---|------|----------|-----------|--------|
| 001 | 2026-07-25 | Architecture Constitution v2 ratified as Level 1 authority | Consensus strategic July 2026 | Architecture & Engineering |
| 002 | 2026-07-25 | Minimal schema: 22 tables (not 45) | Domain Simplification Review — each table justified | Red Team Review |
| 003 | 2026-07-25 | claim_evidence_links as relational table (not JSONB) | FK integrity required for Evidence Graph | Final Gate Decision 1 |
| 004 | 2026-07-25 | Provenance distributed, not centralized | FK chain (source→record→evidence→claim) sufficient | Final Gate Decision 2 |
| 005 | 2026-07-25 | Observations in JSONB with explicit promotion rules | Transient extraction results, no independent lifecycle | Final Gate Decision 3 |
| 006 | 2026-07-25 | Self-versioning claims (no ClaimVersion table) | claim_family_id + temporal columns on claims | Final Gate Decision 4 |
| 007 | 2026-07-25 | 7 JSONB columns APPROVED, 0 rejected | JSONB Governance Matrix — all justified | Final Gate Decision |
| 008 | 2026-07-25 | 5 bounded contexts (not 9) | Identity | SourceEvidence | ClaimsCapability | ProtocolAssessment | Publication | Bounded Context Review |
| 009 | 2026-07-25 | Continuity engine DEPRECATE (not DELETE) | All continuity tables preserved, no new features | Sprint 0 |
| 010 | 2026-07-25 | Modular monolith confirmed | Constitution §15: no microservices in Phase I | Architecture Constitution |
| 011 | 2026-07-25 | v1→v2 backward compatibility guaranteed | Compatibility Contract signed | Sprint 0 |
| 012 | 2026-07-25 | 10 migrations (not 18) in ratified sequence | All reversible, all with rollback | Sprint 0 |
| 013 | 2026-07-25 | First vertical slice: Continuing Review | Constitution §16, Plan Maestro §6 | Plan Maestro |
| 014 | 2026-07-25 | Sprint 0 CLOSED — READY FOR SPRINT 1 | All 10 gate conditions satisfied | This document |
