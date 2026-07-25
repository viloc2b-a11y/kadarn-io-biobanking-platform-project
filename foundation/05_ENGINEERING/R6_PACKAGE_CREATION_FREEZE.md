# Engineering Rule — Package Creation Freeze

**Effective:** 2026-07-24
**Authority:** Audit 054 — Condition C7, Architecture Disposition Register 055
**Duration:** Until end of Phase 5 implementation (Foundation Library delivery)

## Rule

No new package, engine, graph, or twin may be created in the KADARN monorepo during the remediation (Phase 0.6) or Foundation implementation (Phase 1-5) phases without an approved ADR.

## Scope

This freeze covers:

- New directories under `packages/` or `apps/`
- New top-level TypeScript library packages
- New engine abstractions (anything named `*-engine`, `*-graph`, `*-twin`)
- New twin abstractions
- New graph abstractions

## Exceptions

The following do NOT require an ADR:

- Adding files to existing packages
- Creating test files under `tests/`
- Creating scripts under `scripts/`
- Creating documentation under `docs/` or `foundation/`
- Adding configuration files (CI/CD, environment, linting)
- Creating migration files under `database/migrations/`

## Process

1. Developer identifies a need that appears to require a new package
2. Developer writes an ADR in `docs/adr/` following the standard template
3. ADR must demonstrate that no existing package boundary can responsibly contain the required behavior
4. ADR must include the proposed package name, responsibility, public API surface, and relationship to existing packages
5. Architect reviews and approves ADR before any code is written

## Enforcement

- CI/CD will not be modified to enforce this rule programmatically
- Code review policy requires reviewers to verify no new packages are introduced without ADR approval
- Pull requests introducing new packages without ADR will be rejected
- This rule is documented in `AGENTS.md` and the foundation architecture guide

## Rationale

The audit (054) identified 36 packages in the monorepo, of which 24 are <10 files and 11 are scaffolded "engines" with <5 files. The proliferation of packages creates:

1. **Discovery overhead** — developers must navigate 36 package directories
2. **Maintenance cost** — every package requires package.json, tsconfig, and build configuration
3. **Architectural noise** — scaffolded packages obscure the actual working system
4. **False modularity** — packages with 3 files don't deliver the benefits of modular architecture

The freeze ensures new abstractions are justified before they are created.
