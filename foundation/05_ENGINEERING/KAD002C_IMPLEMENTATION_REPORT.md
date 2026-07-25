# KAD-002C — Institution Participation Model — Implementation Report

**Date:** 2026-07-24
**Status:** COMPLETE
**Story:** KAD-002C (Institution Participation Model — Membership, Role Catalog, Role Assignment)

---

## Decision

**PASS WITH APPROVED DEFERRALS**

## Delivered

- Governed Role Catalog seeded (6 roles: org_admin, org_member, site_pi, site_coordinator, reviewer, sponsor_viewer)
- `person_id` added to organization_memberships linking to canonical people table
- Temporal lifecycle fields added to memberships (started_at, ended_at, deactivation tracking)
- API: List/create members by institution, get/update/terminate membership by ID
- API: List/create role assignments per membership
- API: List governed roles by scope
- TypeScript Zod schemas for Membership, Role, RoleAssignment, ResolvedPermissions
- RLS extended for membership/role tables

## Files Changed

| Group | Files |
|-------|-------|
| Database | `database/migrations/064_kad002c_membership.sql`, `supabase/migrations/064_kad002c_membership.sql` |
| Types | `packages/types/src/membership.ts`, `packages/types/src/index.ts` |
| API | `apps/api/src/app/api/v1/roles/route.ts` |
| API | `apps/api/src/app/api/v1/institutions/[id]/members/route.ts` |
| API | `apps/api/src/app/api/v1/memberships/[id]/route.ts` |
| API | `apps/api/src/app/api/v1/memberships/[id]/roles/route.ts` |

## Validation

| Check | Result |
|-------|--------|
| Build | ✅ 15.0s |
| Typecheck | ✅ 3 projects |
| Tests | ✅ 1313 passed, baseline preserved |
| Protected vertical slice | ✅ 6+ tables (claims, evidence_nodes, people, locations, memberships, roles) |
| DB tables | ✅ people, locations, organization_memberships, organization_roles all present |

## Entity Progress

| Entity | Status | Completion Criteria |
|--------|--------|-------------------|
| Person | ✅ COMPLETE | Spec, migration, RLS, Zod, types, API, audit, lifecycle, build, typecheck, tests, DB reset |
| Location | ✅ COMPLETE | Same criteria |
| Membership | 🟡 FOUNDATION COMPLETE | Migration, RLS, API, types, lifecycle. Deferred: repository layer (KAD-002D), validation tests (KAD-002G) |
| Role | 🟡 FOUNDATION COMPLETE | Governed catalog seeded, API, types. Deferred: permission resolution (KAD-002D/E) |

## Risks and Deferrals

| Risk | Story Assignment |
|------|-----------------|
| Permission resolution not implemented (only roles cataloged) | KAD-002D (Repositories) |
| No integration tests for membership/role assignment | KAD-002G (Validation) |
| Membership does not auto-create person record | KAD-002F (UI) may trigger on invite |
| Existing `user_id` in memberships still references auth.users | Person→auth.users link is optional per spec |

## Next Story

**KAD-002D — Canonical Repositories and Services**

Prerequisites satisfied: Person (KAD-002A), Location (KAD-002B), Membership+Role (KAD-002C) are foundation complete. Repository layer will consolidate data access for the four entities into service objects with proper error handling, audit integration, and permission resolution.
