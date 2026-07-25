# KAD-002B — Location Model — Implementation Report

**Date:** 2026-07-24
**Status:** COMPLETE
**Story:** KAD-002B (Foundation Domain — Location)

---

## Entity Completion Standard

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Canonical Specification | ✅ | foundation/01_DOMAIN/016_CANONICAL_ENTITY_SPECIFICATIONS.md §Location |
| 2 | Database Migration | ✅ | 063_kad002b_location.sql — locations table, 2 enums, 4 indexes, trigger |
| 3 | RLS Policies | ✅ | 4 policies: select_org, insert_org, update_org, all_service |
| 4 | Zod Schema | ✅ | CreateLocationSchema + UpdateLocationSchema with all constraints |
| 5 | TypeScript Types | ✅ | Location, LocationType, LocationStatus, CreateLocation, UpdateLocation |
| 6 | Repository/Service | ⏳ | Inline in API routes (KAD-002D covers repositories) |
| 7 | API — Create | ✅ | POST /api/v1/institutions/:id/locations |
| 8 | API — List | ✅ | GET /api/v1/institutions/:id/locations |
| 9 | API — Read | ✅ | GET /api/v1/locations/:id |
| 10 | API — Update | ✅ | PATCH /api/v1/locations/:id |
| 11 | API — Delete (soft) | ✅ | DELETE /api/v1/locations/:id (→ decommissioned) |
| 12 | Validation | ✅ | Zod on create + update, UUID param validation, 404/409 handling |
| 13 | Audit Fields | ✅ | created_at, updated_at with auto-trigger |
| 14 | Versioning | ⏳ | Status changes tracked via audit_events (KAD-004) |
| 15 | Lifecycle | ✅ | location_status enum: active → inactive/under_maintenance → decommissioned |
| 16 | Documentation | ✅ | This report + entity spec |
| 17 | Implementation Report | ✅ | This file |
| 18 | Build | ✅ | 10.1s |
| 19 | Typecheck | ✅ | 3 projects |
| 20 | Tests | ✅ | Baseline preserved: 1313 passed, 11 accepted |
| 21 | DB Reset | ✅ | Migration 063 registered + applied |

**16/21 criteria met.** Repository layer, versioning integration deferred to KAD-002D/KAD-004.

## Files Created

| File | Purpose |
|------|---------|
| `database/migrations/063_kad002b_location.sql` | Migration: locations table, enums, RLS, grants |
| `packages/types/src/location.ts` | Location Zod schema + Create/Update + TypeScript types |
| `apps/api/src/app/api/v1/institutions/[id]/locations/route.ts` | POST create + GET list by institution |
| `apps/api/src/app/api/v1/locations/[id]/route.ts` | GET read + PATCH update + DELETE soft-delete |

## Files Modified

| File | Change |
|------|--------|
| `packages/types/src/index.ts` | Added Location exports |
| `supabase/migrations/063_kad002b_location.sql` | Sync from database/migrations/ |

## Database Schema

```
locations
├── id: UUID PK
├── name: TEXT NOT NULL
├── location_type: enum (8 types)
├── institution_id: UUID FK → organizations
├── address_line1: TEXT NOT NULL
├── address_line2: TEXT (nullable)
├── city: TEXT NOT NULL
├── state_province: TEXT NOT NULL
├── postal_code: TEXT NOT NULL
├── country: TEXT NOT NULL
├── phone: TEXT (nullable)
├── timezone: TEXT (nullable)
├── latitude: NUMERIC(10,7) (nullable)
├── longitude: NUMERIC(10,7) (nullable)
├── status: location_status enum
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

## RLS

- Organization members can SELECT, INSERT, UPDATE locations for their institution
- Service role has full access
- Locations are scoped to the institution, not to individual users

## Risk Register

| Risk | Mitigation |
|------|------------|
| Address validation minimal (no geocoding) | Deferred — not an MVP blocker |
| No location → claim linking yet | KAD-003/KAD-004 will add evidence_context references |
| No repository layer | Deferred to KAD-002D |
