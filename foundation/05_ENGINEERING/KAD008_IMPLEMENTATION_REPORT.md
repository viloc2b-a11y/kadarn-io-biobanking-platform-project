# KAD-008 — Knowledge Publication — Report

**Date:** 2026-07-24 | **Status:** COMPLETE

## Decision: PASS

**Delivered:**
- `published_knowledge` table with JSONB content, lifecycle status (`draft→published→archived`), 7 knowledge types (capability_profile, institution_profile, evidence_passport, sponsor_brochure, feasibility_response, trust_page, sponsor_package)
- RLS: published entries readable by anyone (`anon` role); org members can create/update
- Canonical `PublishedKnowledge` types in `@kadarn/types` with Zod schemas
- API: `GET/POST /api/v1/institutions/[id]/knowledge` — list/create with type+status filters
- API: `GET/PATCH /api/v1/knowledge/[id]` — read and update/publish/archive

| Check | Result |
|-------|--------|
| Build | ✅ 19.0s |
| Typecheck | ✅ |
| Tests | ✅ 1322 passed, baseline preserved |

**Next:** KAD-009 — Passport
