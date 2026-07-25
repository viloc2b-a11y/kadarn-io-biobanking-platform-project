# KAD-002A — Person Model — Implementation Report

**Date:** 2026-07-24
**Status:** COMPLETE
**Story:** KAD-002A (Foundation Domain — Person)

---

## Acceptance Criteria

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Migration 062 creates people table | ✅ | 14 columns, all constraints verified |
| Person type defined in packages/types | ✅ | PersonSchema + CreatePersonSchema + UpdatePersonSchema |
| Person Zod validation | ✅ | Email, name length, optional fields, status enum |
| POST /api/v1/people creates person | ✅ | withAuth, Zod validation, unique email handling |
| GET /api/v1/people lists/search | ✅ | By id, email, or full list (service) |
| GET /api/v1/people/:id reads single | ✅ | Route params, 404 handling |
| PATCH /api/v1/people/:id updates | ✅ | Partial update, Zod validation, 409 on email conflict |
| DELETE /api/v1/people/:id soft-deletes | ✅ | Sets status='suspended' |
| RLS on people table | ✅ | Self-read, self-update, service-role full access |
| No new packages, engines, graphs, or twins | ✅ | Zero new packages |
| Protected vertical slice unchanged | ✅ | 7 tables (6 original + people) |
| Build green | ✅ | 10.6s |
| Typecheck green | ✅ | 3 projects |
| Tests baseline | ✅ | 1313 passed, 11 accepted failures |

## Files Created

| File | Purpose |
|------|---------|
| `database/migrations/062_kad002a_person.sql` | Migration: people table, person_status enum, RLS, grants |
| `packages/types/src/person.ts` | Person Zod schema + Create/Update variants + TypeScript types |
| `apps/api/src/app/api/v1/people/route.ts` | POST create + GET list/search |
| `apps/api/src/app/api/v1/people/[id]/route.ts` | GET read + PATCH update + DELETE soft-delete |

## Files Modified

| File | Change |
|------|--------|
| `packages/types/src/index.ts` | Added Person exports |
| `supabase/migrations/062_kad002a_person.sql` | Sync from database/migrations/ |

## Database Schema

```
people
├── id: UUID PK
├── email: TEXT NOT NULL UNIQUE
├── first_name: TEXT NOT NULL
├── last_name: TEXT NOT NULL
├── middle_name: TEXT (nullable)
├── suffix: TEXT (nullable)
├── phone: TEXT (nullable)
├── orcid: TEXT UNIQUE (nullable)
├── npi: TEXT UNIQUE (nullable)
├── profile_photo_url: TEXT (nullable)
├── status: person_status (active/inactive/suspended/merged)
├── auth_user_id: UUID FK → auth.users (nullable)
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ (auto-trigger)
```

## RLS Policies

| Policy | Scope | Rule |
|--------|-------|------|
| people_select_self | SELECT | auth.uid() = auth_user_id |
| people_select_service | SELECT | auth.role() = 'service_role' |
| people_update_self | UPDATE | auth.uid() = auth_user_id |
| people_all_service | ALL | auth.role() = 'service_role' |

## Remaining Risks

| Risk | Mitigation |
|------|------------|
| Person not linked to organization_memberships yet | KAD-002C will add person_id FK to memberships |
| Person not linked to evidence-core actor_ids | KAD-002D/E will add person resolution |
| No UI for person management | KAD-002F |
| No integration tests | KAD-002G |
