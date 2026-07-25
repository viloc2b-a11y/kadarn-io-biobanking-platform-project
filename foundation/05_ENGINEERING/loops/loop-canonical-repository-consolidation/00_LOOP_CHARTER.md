# Loop Charter — KAD-LOOP-CANONICALIZATION-001

## Title

Canonical Repository Consolidation, Archive and Forward-Port

## Status

**ACTIVE** — 2026-07-25

## Orquestador

Hermes (architectural decisions, decomposition, validation, governance, evidence)

## Implementador

PI coding agent (bounded implementation tasks, migrations, code changes, tests)

## Ratified Decision

- **Canonical repository**: `D:\AI_WORKSPACE\01_ACTIVE_PROJECTS\KADARN\repo\kadarn-platform`
- **Retiring repository**: `C:\Users\jmend\kadarn-platform`
- Only one active workspace, one migration lineage, one canonical repository.

## Dependency

**LOOP 2 (Evidence Acquisition & Generation) is BLOCKED** until this Loop closes.

## Exit Criteria

1. D recorded as canonical repository.
2. C frozen and excluded from active development.
3. C history and uncommitted work safely archived.
4. D's pre-existing dirty state classified and preserved.
5. D's coherent baseline committed or explicitly preserved.
6. Required C architecture reconciled into D.
7. New migrations begin after D's current migration head (074).
8. No historical migration modified.
9. No duplicate canonical entities introduced.
10. Claim–Evidence is relational and tenant-safe.
11. Event history is append-only.
12. SourceRecord and generation provenance operational.
13. Builds, tests and typechecks pass to extent supported.
14. Semantic parity documented.
15. Hermes and PI point only to D.
16. C deletion readiness explicitly determined.
17. LOOP 2 remains blocked until final acceptance.
