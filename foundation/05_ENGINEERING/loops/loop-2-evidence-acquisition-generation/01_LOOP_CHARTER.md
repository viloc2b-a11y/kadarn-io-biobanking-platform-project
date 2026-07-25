# KAD-LOOP-002 — Loop Charter

## Loop ID
KAD-LOOP-002

## Name
Evidence Acquisition & Generation Foundation

## Date
2026-07-25

## Orchestrator
Hermes

## Implementation
PI Coding Agent (OpenAI gpt-4o-mini)

## Canonical Repository
```
D:\AI_WORKSPACE\01_ACTIVE_PROJECTS\KADARN\repo\kadarn-platform
```

## Branch
`master` (HEAD: `9fe38f8`) → feature branch `feat/loop-2-evidence` from master

## Migration Head
079 (security_classification_comments.sql)

## Purpose

Implement the canonical Evidence Acquisition pipeline that transforms raw institutional facts into governed Evidence capable of supporting institutional Claims and ultimately institutional Trust.

```
Institutional Event
        ↓
SourceRecord
        ↓
Evidence Acquisition
        ↓
Evidence Generation
        ↓
Canonical Evidence
        ↓
ClaimEvidenceLink
        ↓
Review
        ↓
Passport
```

This Loop does NOT implement confidence scoring. Confidence belongs to LOOP 4.

## Non-Negotiable Rules

1. Do not modify historical migrations (008–079)
2. New migrations begin after 079 (next: 080)
3. Do not duplicate: Claim, Evidence, Review, Passport, ShareGrant, SourceRecord, InstitutionalEvent
4. Do not introduce hidden business rules — business rules must exist as governed Generation Rules
5. Every Evidence must answer: WHO, WHEN, FROM WHAT, USING WHICH RULE, UNDER WHICH VERSION, WITH WHICH CONFIDENCE, REVIEWED BY WHOM
6. Every Evidence must be reproducible

## Architecture Principles

- Evidence is never magic
- Nothing may become Evidence without provenance
- No destructive overwrite on Evidence (append-only)
- Transitions must be auditable
- Claim linking is relational, not array-based
- Tenant isolation enforced via RLS

## Phases

| Phase | Name | Deliverable |
|-------|------|-------------|
| 0 | Foundation Review | Charter, Capability Inventory, Gap Analysis |
| 1 | Source Acquisition | Source Acquisition Report |
| 2 | Evidence Source Model | Reconciled enums, classification |
| 3 | Generation Rule Engine | Canonical rule registry |
| 4 | Evidence Generation | Generation pipeline with deterministic replay |
| 5 | Provenance | Lineage graph, service, API, queries |
| 6 | Evidence Lifecycle | Lifecycle states with auditable transitions |
| 7 | Claim Linking | Canonical relational model |
| 8 | Review Foundation | Review metadata for LOOP 3 |
| 9 | API | 9 API endpoints |
| 10 | UI Integration | Connect existing UI, replace mocks |
| 11 | PI Implementation Packages | 9 bounded packages (A–I) |
| 12 | Validation | Build, typecheck, tests, migration, API, lineage, replay, tenant |
| 13 | Acceptance Scenarios | 5 end-to-end scenarios |

## Documentation Deliverables

```
01_LOOP_CHARTER.md         (this file)
02_CURRENT_STATE.md
03_SOURCE_MODEL.md
04_RULE_ENGINE.md
05_PROVENANCE.md
06_LINEAGE.md
07_API.md
08_IMPLEMENTATION_REPORT.md
09_VALIDATION_REPORT.md
10_ACCEPTANCE_REPORT.md
11_NEXT_LOOP_GATE.md
```

## Exit Criteria

Loop completes only when:

- ✓ SourceRecord is production-ready
- ✓ Evidence acquisition implemented
- ✓ Rule registry implemented
- ✓ Evidence generation reproducible
- ✓ Provenance operational
- ✓ Lineage operational
- ✓ Claim linking canonical
- ✓ Lifecycle implemented
- ✓ APIs operational
- ✓ UI connected
- ✓ Tests green
- ✓ Build green
- ✓ Typecheck introduces zero new errors
- ✓ Migration chain valid
- ✓ No duplicate domain models
- ✓ LOOP 3 foundation prepared

## Final Status

Conclude with exactly one:

```
LOOP 2 COMPLETE — READY FOR LOOP 3
LOOP 2 COMPLETE — REVIEW FOUNDATION PENDING
BLOCKED BY MIGRATION
BLOCKED BY DOMAIN CONFLICT
BLOCKED BY VALIDATION
NOT READY
```

Do not begin LOOP 3 automatically.
