# KAD-LOOP-003 — Loop Charter

## Loop ID
KAD-LOOP-003

## Name
Institutional Claims & Capability Graph

## Status
ACTIVE

## Branch
`feat/loop-3-claims` (from master `a9ef10a`)

## Migration Head
080 (next: 081+)

## Purpose
Build the Institutional Knowledge Layer. Transform reviewed Evidence into governed Claims. Aggregate Claims into institutional Capabilities. Prepare the graph consumed by the Confidence Engine.

## Non-Negotiable Rules
- No modify migrations 001–080
- All schema evolution starts at migration 081
- No duplicate Claim/Evidence/Review/Capability models
- No confidence scoring (LOOP 4)
- No Passport implementation (separate Loop)
- No hidden business rules — all rules as governed entities
- Forward-only migrations
- No `git reset --hard`, `git clean`, `git checkout .`, `git restore .`, `git stash clear`, `git branch -D`, `git push --force`, `git rebase`
- Claims immutable after approval — versioning via new rows, not updates
- Claim-Evidence relationships many-to-many only, no embedded arrays
- All endpoints tenant-safe, RLS-compatible, Zod-validated

## Delegation Protocol
- Hermes owns: architecture, governance, decomposition, validation, acceptance
- PI/delegate_task owns: implementation, migrations, repositories, services, APIs, tests, docs
- Hermes writes ONLY: 1 mechanical file already understood
- 2+ non-trivial files → ALWAYS delegate
- Validation → `execute_code` structured pipeline
- Context → `session_search` before starting

## Phases
0. Current State Review → 01_CURRENT_STATE.md
1. Claim Model → 02_CLAIM_MODEL.md
2. Claim Versioning → 03_CLAIM_VERSIONING.md
3. Claim-Evidence Graph → (covered in 02 or separate)
4. Capability Model → 04_CAPABILITY_MODEL.md
5. Claim Aggregation → 05_AGGREGATION_ENGINE.md
6. Evidence Sufficiency → 06_EVIDENCE_SUFFICIENCY.md
7. Knowledge Graph → 07_KNOWLEDGE_GRAPH.md
8. Services → (covered in implementation)
9. API → 08_API.md
10. UI → (covered in implementation)
11. PI Packages A-I → 09_IMPLEMENTATION_REPORT.md
12. Validation → 10_VALIDATION_REPORT.md
13. Acceptance → 11_ACCEPTANCE_REPORT.md
14. Next Loop Gate → 12_NEXT_LOOP_GATE.md

## Exit Criteria
- Claims production ready
- Claim versioning operational
- Claim-Evidence graph operational
- Capability entity operational
- Capability aggregation operational
- Evidence sufficiency operational
- Knowledge Graph operational
- APIs operational
- UI connected
- Build green
- Typecheck green
- Full test suite passes with zero new regressions
- Migration chain valid
- Ready for Confidence Engine

## Final Status Options
- LOOP 3 COMPLETE — READY FOR LOOP 4
- BLOCKED BY MIGRATION
- BLOCKED BY DOMAIN CONFLICT
- BLOCKED BY VALIDATION
- NOT READY

## Do Not Begin LOOP 4 Automatically
