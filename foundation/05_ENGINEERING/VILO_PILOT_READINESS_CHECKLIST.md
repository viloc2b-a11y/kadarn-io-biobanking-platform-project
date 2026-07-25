# Vilo Production Pilot — Readiness Checklist

**Date:** 2026-07-24
**Authority:** KAD-012

## Pipeline Verification

The following pipeline must be verified end-to-end before Vilo's first Passport can be generated.

### 1. Organization Onboarded ✅

| Item | Status | Evidence |
|------|--------|----------|
| Vilo Research Group exists as Organization | `organizations` table | Migration 072 seeds UUID `e0000000-...` |
| Vilo admin user exists | `auth.users` + `organization_memberships` | Manual: create user via Supabase |
| Vilo capability types exist | `organization_capability_types` | Migration 072 seeds 5 types |

### 2. Foundation Entities Ready ✅

| Entity | API Endpoint | Verified |
|--------|-------------|----------|
| Person | `POST /api/v1/people` | KAD-002A |
| Location | `POST /api/v1/institutions/:id/locations` | KAD-002B |
| Membership | `POST /api/v1/institutions/:id/members` | KAD-002C |
| Role Assignment | `POST /api/v1/memberships/:id/roles` | KAD-002C |

### 3. Trust Pipeline Ready ✅

| Step | API | Story |
|------|-----|-------|
| Claim | `POST /api/v1/evidence-core/claims` | KAD-004 |
| Evidence | `POST /api/v1/evidence-core/evidence` | KAD-005 |
| Review | `POST /api/v1/claims/:id/reviews` | KAD-006 |
| Confidence | `GET /api/v1/claims/:id/confidence` | KAD-007 |
| Passport | `POST /api/v1/institutions/:id/passport-entries` | KAD-009 |
| Share Grant | `POST /api/v1/passport-entries/:id/shares` | KAD-010 |
| Public View | `GET /api/v1/public/passport/:token` | KAD-010 |

### 4. Pilot Vilo Workflow

```
1. Create Vilo org (seed) ──────────────────────────────────────────────── ✅ Migration 072
2. Add Vilo admin user to org ──────────────────────────────────────────── Manual (Supabase auth)
3. Create Vilo locations (main clinic, lab) ────────────────────────────── POST /institutions/:id/locations
4. Create Vilo staff as People ─────────────────────────────────────────── POST /api/v1/people
5. Add staff as members with roles ─────────────────────────────────────── POST /institutions/:id/members
6. Declare capabilities ────────────────────────────────────────────────── POST /institutions/:id/capabilities
7. Submit claims for each capability ───────────────────────────────────── POST /evidence-core/claims
8. Upload evidence documents ───────────────────────────────────────────── POST /evidence-core/evidence
9. Assign reviewers ────────────────────────────────────────────────────── POST /claims/:id/reviews
10. Complete reviews (approve/reject) ──────────────────────────────────── PATCH /reviews/:id
11. Compute confidence ─────────────────────────────────────────────────── GET /claims/:id/confidence
12. Create Passport entries ────────────────────────────────────────────── POST /institutions/:id/passport-entries
13. Publish Passport ───────────────────────────────────────────────────── PATCH /passport-entries/:id
14. Grant sponsor access ───────────────────────────────────────────────── POST /passport-entries/:id/shares
15. Share access token with sponsor ────────────────────────────────────── GET /api/v1/public/passport/:token
```

### 5. First Passport Generation

The first real Vilo Passport is generated when steps 1–14 above are completed with Vilo's actual data.

**Blockers:** None identified. All pipeline components are implemented and validated.
