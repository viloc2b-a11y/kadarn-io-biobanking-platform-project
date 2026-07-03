# ADR-026: Trust Surface Decommission (RC-0.2)

**Status:** Accepted
**Date:** 2026-07-03
**Deciders:** Kadarn Architecture
**Baseline:** AF-2.0 / AF-2.1
**Related:** ADR-010 (Trust Engine Retirement), ADR-011 (Evidence Core Boundary Rule), ADR-012 (Engine Governance)

---

## Context

ADR-010 retired the Trust paradigm at the concept level and replaced it with the KEMS-001 Confidence Graph / Evidence model. ADR-010 Decision 4 explicitly requires that no component preserved under that decision (`packages/trust-engine/`, `database/migrations/023_trust_engine.sql`, and related routes/tests) be deleted without a dedicated ADR evaluating its content and deciding its disposition.

Despite the conceptual retirement, runtime Trust UI and API surfaces persisted in the codebase well past AF-1.0 and AF-2.0. RC-0.2 ("Architecture Recovery") is the cleanup pass that brings the running application in line with the terminology and structure ADR-010 already mandated. This ADR is the "dedicated ADR" ADR-010 Decision 4 calls for, and it also documents registry hygiene issues discovered during this pass.

---

## Decision

### (a) Runtime Trust UI/API surfaces removed

The following runtime surfaces are removed as part of the Trust → Evidence/Confidence migration:

Already executed in prior commits (verified present at HEAD, not re-done by this change):
- `apps/web/src/app/(koc)/koc/trust/` screen — removed.
- Trust Index navigation entry in the KOC shell — removed.
- `TrustBadge` component and its usages — removed.
- `apps/api/src/app/api/v1/operations/trust/route.ts` — removed.

Executed as part of this RC-0.2 remainder pass:
- `apps/api/src/app/api/v1/operations/health/route.ts` — removed the `organization_trust` query, `trustScores`/`networkTrustAvg` computation, and the `network_trust_avg` / `trust_org_count` response fields.
- `apps/web/src/app/(koc)/koc/health/page.tsx` — removed the corresponding `Trust Avg` / `Trusted Orgs` display labels and the trust-specific color-threshold logic.
- `apps/web/src/app/(koc)/koc/page.tsx` — stale `{/* Trust + KPE */}` comment corrected to `{/* KPE */}` (no trust panel existed in the underlying markup; this was a leftover comment only).
- `apps/web/src/app/(koc)/koc/network/page.tsx` — inspected in full; this page fetches `koc/ecosystem`, `koc/analytics`, and `koc/logistics`, not the removed `/operations/trust` endpoint. No dead fetch or trust-matching logic was present. No change required beyond this audit note.
- `apps/web/src/app/(koc)/koc/ai/page.tsx` — replaced two mock "trust score" insight strings with neutral evidence-coverage language.
- `apps/web/src/components/koc/koc-shell.tsx.bak` — deleted (stale backup file, not part of the build).
- `apps/api/src/lib/logistics-helper.ts` — `evaluateProviderTrust()` and its local `TrustEvaluation` type removed after confirming zero call sites.
- `packages/domain-events/src/index.ts` — `TrustScoreEvaluatedPayload` interface and the `TrustScoreEvaluated` registry entry removed after confirming zero emitters and zero subscribers. `TrustEventRecorded`/`TrustEventRecordedPayload` are unrelated to this cleanup and are left untouched (out of scope; not verified dead).

### (b) User-facing Verified/Trust string relabels

Per KEMS-001 §10 (Retired Terms Registry), the following user-facing strings were relabeled. No enum values, no `computeBadgeLevel`/scoring logic, and no schema were changed — these are presentation-layer relabels only:

- `apps/api/src/app/api/v1/continuity/passport/[slug]/route.ts` — `verificationLabel()`: `'kadarn_verified'` → "Externally confirmed", `'evidence_submitted'` → "Supported by evidence", default → "Self reported" (previously "Verified" / "Evidence submitted" / "Self-reported").
- `apps/api/src/lib/continuity-claim-service.ts` — `computeContinuityScore()` response field `trustLevel` renamed to `evidenceLevel`, with values "Externally Confirmed" / "Reference Confirmed" / "Supported by Evidence" / "Self Reported" (previously "Kadarn Verified" / "Reference Confirmed" / "Evidence Backed" / "Self Reported"). The `infrastructure` / `regulatoryReadiness` fields changed from "Verified"/"Not Verified" to "Supported by Evidence"/"Not Yet Supported". The recommendations field `estimatedTrustIncrease` renamed to `estimatedEvidenceLevelIncrease`. The institutional growth timeline milestone description "Kadarn Verified" changed to "Externally confirmed".
- `apps/web/src/app/site-passport/[slug]/page.tsx` — consumers of the above updated accordingly: `Metric label="Trust Level"` → `"Evidence Level"` (reading `score.evidenceLevel`); "Estimated Trust Increase" → "Estimated Evidence Level Increase" (reading `estimatedEvidenceLevelIncrease`); default profile summary "Verified site continuity profile." → "Evidence-backed site continuity profile."
- `apps/web/src/app/(workspace)/workspace/continuity/page.tsx` — `verification_status` enum values are unchanged (still `self_reported`, `evidence_submitted`, `reference_pending`, `reference_confirmed`, `kadarn_verified`, `rejected`, `expired` — see `LegacyClaimStatus` in `continuity-claim-service.ts`), but the page previously printed the raw enum value to users. Added a `verificationStatusLabel()` presentation mapping using KEMS-001 vocabulary so the UI never shows the raw enum key.

### (c) Dormant / Deprecated disposition

- `packages/trust-engine/` — preserved dormant per ADR-010 Decision 4. Not deleted. Tests kept. No action taken in this ADR beyond reaffirming the disposition.
- `packages/graph-query/` — marked **Deprecated** pending a future ADR. Contains graph traversal code with Trust-era assumptions; disposition (migrate vs. retire) is deferred.
- `packages/matching-engine/` — the `minTrustScore?: number` field in `packages/matching-engine/src/types.ts` is a trust-typed field marked **Deprecated** pending a future ADR. Not removed in this pass (would require evaluating call sites and matching semantics, which is out of scope for a decommission-only ADR).
- `packages/kpe-generator/src/index.ts` — the `` `TRUST INDEX` `` template string (line 54) is marked **Deprecated** pending a future ADR. Left in place; no template content or logic changed.

### (d) Database artifacts — frozen schema, no migration

The following DB artifacts remain as-is. This ADR does not introduce a migration:

- `organization_trust` table (created by `database/migrations/023_trust_engine.sql`) — dead now that `apps/api/src/app/api/v1/operations/health/route.ts` no longer queries it. Retained per ADR-010 Decision 4 (no deletion without a dedicated ADR evaluating the schema itself, which this ADR does not attempt).
- `badge_level` enum and related columns — dead columns, documented here for traceability. No migration is issued.
- `database/migrations/023_trust_engine.sql` and `database/migrations/044_continuity_verification_workflow.sql` — unchanged. `044` still relies on `kadarn_verified`-style status values for the continuity claim workflow (see the `LegacyClaimStatus` note in `continuity-claim-service.ts`); this is a claim-verification workflow value, not an institutional Trust/Verified label, and is explicitly out of scope for this ADR (no enum value changes permitted under the RC-0.2 recovery scope).

---

## Registry hygiene issue (noted, not fixed by this ADR)

During this pass, `docs/adr/` was found to contain numbering collisions: `adr-010-policy-engine.md` / `adr-010-trust-engine-retirement.md`, `adr-011-evidence-core-boundary.md` / `adr-011-trust-engine.md`, `adr-012-engine-governance.md` / `adr-012-operational-twins.md`, `adr-018-matching-engine.md` / `adr-018-phase-8.md`, `adr-019-fulfillment-engine.md` / `adr-019-phase-8.md`, and `adr-020-financial-engine.md` / `adr-020-phase-8.md` (numbers 013–019 are otherwise fully assigned, with 018/019/020 additionally double-booked by the Phase 8 lineage series). This ADR is numbered **026** — the next free integer above the highest existing number (`adr-025-phase-8.md`) — specifically to avoid adding a further collision. Renumbering the existing colliding files is out of scope for this change and is flagged here for a future registry-hygiene pass.

---

## What this ADR does not do

- Does not change any enum value anywhere (evidence_class, confidence_level, verification_status, claim_status, badge_level, etc.).
- Does not touch `computeBadgeLevel` or any confidence/score computation logic.
- Does not modify `packages/trust-engine/` code or tests.
- Does not add, drop, or alter any database migration.
- Does not introduce new architecture, engines, or features.

---

## Impact

| Area | Impact |
|------|--------|
| Runtime API | `operations/health` no longer returns trust fields; `operations/trust` already removed. |
| Runtime UI | KOC health/overview/network/ai pages no longer reference Trust terminology; site-passport and workspace continuity pages use Evidence vocabulary. |
| Domain events | `TrustScoreEvaluated` event type removed (dead, zero subscribers). |
| Dormant packages | `trust-engine` unchanged; `graph-query`, matching-engine's `minTrustScore`, and kpe-generator's `TRUST INDEX` template marked Deprecated for a future ADR. |
| Database | No schema change. `organization_trust` / `badge_level` remain as documented dead artifacts. |

---

## Dependencies

| Artifact | Relationship |
|----------|-------------|
| ADR-010 (Trust Engine Retirement) | This ADR is the "dedicated ADR" required by ADR-010 Decision 4 to evaluate and decommission runtime surfaces. |
| KEMS-001 §10 (Retired Terms Registry) | Source of the relabeling vocabulary used in Decision (b). |
| `openspec/ratificacion-kems-001.md` | Contains the ratified Retired Terms Registry table this ADR's relabels are drawn from. |

---

*This document is part of the RC-0.2 Architecture Recovery effort.*
