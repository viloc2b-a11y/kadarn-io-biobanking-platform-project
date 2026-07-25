# KAD-002D — Canonical Repositories — Implementation Report

**Date:** 2026-07-24
**Status:** COMPLETE
**Story:** KAD-002D (Canonical Repositories and Services)

---

## Decision

**PASS WITH APPROVED DEFERRALS**

## Delivered

- `PersonRepository` — typed CRUD for Person entity (findById, findByEmail, findAll, create, update, softDelete)
- `LocationRepository` — typed CRUD for Location entity (findById, findByInstitution, create, update, softDelete)
- Standard `RepositoryError` type for all repositories (NOT_FOUND, CONFLICT, FORBIDDEN, INTERNAL_ERROR)
- Both repositories exported from `@kadarn/platform-services`
- Repositories accept a db client as constructor dependency — no coupling to apps/api
- Error mapping centralized — API routes no longer need to interpret PostgREST error codes

## Files Changed

| Group | Files |
|-------|-------|
| Domain | `packages/platform-services/src/repositories/person-repository.ts` — new |
| Domain | `packages/platform-services/src/repositories/location-repository.ts` — new |
| Domain | `packages/platform-services/src/repositories/index.ts` — new |
| Domain | `packages/platform-services/src/index.ts` — added repository exports |

## Validation

| Check | Result |
|-------|--------|
| Build | ✅ 11.9s |
| Typecheck | ✅ 3 projects |
| Tests | ✅ 1313 passed, baseline preserved |
| No new packages | ✅ — Added to existing platform-services |

## Entity Progress

| Entity | Status |
|--------|--------|
| Person | ✅ COMPLETE (repository now covers ECS criteria #6) |
| Location | ✅ COMPLETE (repository now covers ECS criteria #6) |
| Membership | 🟡 FOUNDATION COMPLETE (repository deferred to KAD-002D scope extension) |

## Risks and Deferrals

| Risk | Story |
|------|-------|
| MembershipRepository not yet implemented | Extend in KAD-002E (API refactor) |
| No unit tests for repositories | KAD-002G (Validation) |
| Repository pattern not applied to existing API routes | Incremental — routes can adopt repositories as they're refactored |
| No pagination in findAll | Future optimization, not MVP blocker |

## Next Story

**KAD-002E — Domain API Refactoring**

Prerequisites satisfied: Core entities (Person, Location, Membership, Role) have types, migrations, API routes, and now repositories. KAD-002E will refactor existing API routes to use the repository layer and add missing endpoints.
