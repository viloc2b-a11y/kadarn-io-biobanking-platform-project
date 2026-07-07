# ADR-030 Supplement — Public Passport Read (Remediation P2.0)

**Status:** Accepted for Phase 8 remediation  
**Date:** 2026-07-03

## Decision

`GET /api/v1/continuity/passport/:slug` is an **external public surface**. It must:

1. Allow **anonymous** access (no `withAuth`) for slugs with `passport_visibility IN ('public', 'shared_link')`.
2. Use **server-side `createServiceClient()`** for DB reads (same pattern as `institution/public`).
3. Project response via `PublishedViewService.getPassportResponse()` (Compatibility Layer retained).

## Rationale

- Product expectation: public passport pages (`/site-passport/[slug]`) do not require login.
- RLS on `site_continuity_profiles` blocks non-members when using user JWT; service role + visibility filter is the correct server boundary for published data.

## Rollback

- Revert route to `withAuth` only if product mandates authenticated passport (unlikely).
- `LEGACY_PASSPORT_ENABLED=true` restores legacy adapter path without route shape change.

## Out of scope

- Native reads from `phase8_published_views` (P4 optional).
- KEMS-007 / Evidence Pack delivery.
