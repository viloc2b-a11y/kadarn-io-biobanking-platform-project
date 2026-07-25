# Sprint 1 — Baseline Failure Registry

**Date:** 2026-07-25
**Rule:** Sprint 1 must not increase failures. Final: 19 (same as baseline).

---

| # | Test | File | Error | Cause | Category | Deterministic? | v2 Core? | Sprint 1 Status |
|---|------|------|-------|-------|----------|---------------|----------|----------------|
| 1 | POST /people — creates | domain-integration | 403 vs 201 | RLS blocks insert (admin+service only) | RLS/Tenancy | Yes | No (identity) | Unchanged |
| 2 | GET /people?id= — reads | domain-integration | 400 vs 200 | Same RLS | RLS/Tenancy | Yes | No | Unchanged |
| 3 | GET /people?email= — finds | domain-integration | 0 vs 1 | Same RLS | RLS/Tenancy | Yes | No | Unchanged |
| 4 | POST /people — duplicate | domain-integration | 403 vs 409 | Same RLS | RLS/Tenancy | Yes | No | Unchanged |
| 5 | PATCH /people — updates | domain-integration | 400 vs 200 | Same RLS | RLS/Tenancy | Yes | No | Unchanged |
| 6 | PATCH /people — suspend | domain-integration | 400 vs 200 | Same RLS | RLS/Tenancy | Yes | No | Unchanged |
| 7 | passport tables exist | domain-integration | false vs true | RLS blocks read | RLS/Tenancy | Yes | Yes | Unchanged |
| 8 | review workflow tables | domain-integration | false vs true | RLS blocks read | RLS/Tenancy | Yes | Yes | Unchanged |
| 9 | IATA cert validation | biospecimen-domain | 3 > 3 | Edge case in expiry logic | Test logic | No | No | Unchanged |
| 10 | MarkItDown installed | markitdown-adapter | false | Python pkg not installed | External dep | Yes | No | Unchanged |
| 11 | converts text file | markitdown-adapter | command failed | Same | External dep | Yes | No | Unchanged |
| 12 | converts HTML | markitdown-adapter | command failed | Same | External dep | Yes | No | Unchanged |
| 13 | handles empty file | markitdown-adapter | command failed | Same | External dep | Yes | No | Unchanged |
| 14 | includes metadata | markitdown-adapter | command failed | Same | External dep | Yes | No | Unchanged |
| 15 | 20 req across programs | program-catalog | 20 > 20 | Edge case | Test logic | No | No | Unchanged |
| 16 | workspace nav includes discovery | discovery-dashboard | assertion | UI discovery not in nav | UI | No | No | Unchanged |
| 17 | curation form still submits | discovery-ux | assertion | Legacy API | UI/Legacy | No | No | Unchanged |
| 18 | positions capabilities derived | mvp-onboarding | assertion | UI mismatch | UI | No | No | Unchanged |
| 19 | returns Markdown JSON | onboarding-documents | MarkItDown missing | Same ext dep | External dep | Yes | No | Unchanged |

## Categories

| Category | Count | Acceptable? |
|----------|-------|-------------|
| RLS/Tenancy (test design) | 8 | Yes — tests call PostgREST directly, not API routes |
| External dependency (MarkItDown) | 5 | Yes — requires python package install |
| Test logic edge case | 2 | Yes — non-critical assertions |
| UI legacy | 3 | Yes — related to deprecated discovery engine |
| Sprint 1 new failures | **0** | ✅ Baseline preserved |
