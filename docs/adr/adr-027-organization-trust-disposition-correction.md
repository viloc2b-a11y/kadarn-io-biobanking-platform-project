# ADR-027: `organization_trust` Disposition Correction (Supersedes ADR-026 §d)

**Status:** Accepted
**Date:** 2026-08-07
**Deciders:** Kadarn Architecture
**Supersedes:** ADR-026 §(d) — "Database artifacts — frozen schema, no migration"
**Related:** ADR-010 (Trust Engine Retirement), ADR-026 (Trust Surface Decommission), sdd/dashboard-next-best-action (Slice 1: Score-Free Foundation)

---

## Quick path

1. ADR-026 §(d) declared `organization_trust` fully dead. It was wrong: the marketplace organizations API still read it in production.
2. The live read is now removed (`apps/api/src/app/api/v1/marketplace/organizations/route.ts`, PR-A of this change).
3. `organization_trust` is genuinely unread as of this ADR. No migration is issued; disposition otherwise unchanged from ADR-026 §(d).

## Context

ADR-026 §(d) stated:

> `organization_trust` table (created by `database/migrations/023_trust_engine.sql`) — dead now that `apps/api/src/app/api/v1/operations/health/route.ts` no longer queries it.

That statement was accurate for `operations/health/route.ts` — ADR-026's own Decision (a) had just removed that query in the same change. But ADR-026 audited only the `operations/*` surfaces it was actively decommissioning. It did not audit the marketplace surface.

## Correction of record

At the time ADR-026 was accepted (2026-07-03) and up until this ADR's fix (2026-08-06), `apps/api/src/app/api/v1/marketplace/organizations/route.ts` still:

- joined `organization_trust (overall_score, operational_score, regulatory_score, financial_score, technical_score, total_fulfillments, successful_fulfillments)` into its Supabase query (route.ts:23-31, pre-fix line numbers),
- destructured the joined row into a `trust` object (route.ts:61-63, pre-fix),
- and returned it to clients as `trust: { overall, operational, regulatory, financial, technical, fulfillments, success_rate }` on every marketplace organization list response (route.ts:74-84, pre-fix).

This is a live institution-level composite score (`trust.overall`, an aggregate of four sub-scores) served in production by a public marketplace API — exactly the class of surface ADR-026 intended to have fully decommissioned. ADR-026 §(d)'s "dead now" claim was therefore incorrect for this table as a whole; it was dead only from the one route ADR-026 happened to touch.

**Root cause**: ADR-026's audit scope was the `operations/*` and `koc/*` surfaces named in its Decision (a). The marketplace surface was a separate, unaudited consumer of the same table and was missed.

## Decision

1. **Fix applied**: `apps/api/src/app/api/v1/marketplace/organizations/route.ts` no longer queries `organization_trust` or returns a `trust` field. Ordering falls back to the pre-existing `.order('name')`; no replacement ranking field was introduced. (dashboard-next-best-action PR-A, commit `b38ee57f`.)
2. **Consumer cleanup**: `apps/web/src/app/(marketplace)/marketplace/organizations/page.tsx` declared `Org.trust` on its TypeScript interface but never rendered it (confirmed by dedicated regression test before removal, not assumed). The dead interface field is deleted as part of this change's PR-C (dashboard-next-best-action, "delete deprecated fields" work unit).
3. **`organization_trust` is now genuinely unread**: as of this ADR, no runtime API route queries the table. This reaffirms — not changes — ADR-026 §(d)'s underlying policy: no migration is issued, and the table remains in place per ADR-010 Decision 4 (no deletion of Trust-era schema without a dedicated ADR evaluating the schema itself, which neither ADR-026 nor this ADR attempts).
4. **kpe-generator TRUST INDEX** (ADR-026 §(c), deferred item): also resolved by this change. `packages/kpe-generator/src/index.ts`'s `KpeRequest.trust` field and the rendered `TRUST INDEX` block are deleted — confirmed zero callers of `generateKpe()`/`KpeRequest` anywhere in the repository (dashboard-next-best-action PR-C).

## What this ADR does not do

- Does not drop, alter, or migrate the `organization_trust` table or `database/migrations/023_trust_engine.sql`.
- Does not touch `packages/trust-engine/` or its tests (explicitly out of scope for the parent change; see sdd/dashboard-next-best-action decisions rule 6).
- Does not introduce a replacement ranking, score, or tier for marketplace organizations (per sdd/dashboard-next-best-action spec, "Organization List Ordering" requirement).
- Does not renumber or otherwise touch the ADR registry hygiene issue ADR-026 flagged (still open, still out of scope here).

## Impact

| Area | Impact |
|------|--------|
| Runtime API | `marketplace/organizations` no longer queries `organization_trust` or returns `trust`. |
| Runtime UI | `marketplace/organizations/page.tsx` no longer declares an unread `trust` field on its `Org` interface. |
| Dormant packages | `kpe-generator`'s `TRUST INDEX` template (ADR-026 §(c) deferred item) is now removed — resolves that deferral. |
| Database | No schema change. `organization_trust` remains a documented dead artifact, now dead from *all* known runtime consumers rather than one. |
| Record accuracy | ADR-026 §(d)'s claim is corrected: it was route-scoped ("dead from `operations/health`"), not table-scoped ("dead"). This ADR closes that gap. |

## Dependencies

| Artifact | Relationship |
|----------|-------------|
| ADR-010 (Trust Engine Retirement) | Underlying policy this ADR continues to honor — no schema deletion without a dedicated ADR. |
| ADR-026 (Trust Surface Decommission) | §(d) corrected by this ADR for `organization_trust`; §(c)'s kpe-generator deferral resolved by this ADR. |
| sdd/dashboard-next-best-action (Slice 1) | Parent change. PR-A fixed the live read (commit `b38ee57f`); PR-C (this ADR) removes the dead consumer field and the kpe-generator dead code, and publishes this correction. |
