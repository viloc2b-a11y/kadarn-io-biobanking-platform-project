# Institutional Knowledge Package — Score/Rollup Site Inventory

**Change:** dashboard-next-best-action (Slice 1), Phase D — non-blocking inventory deliverable
**Date:** 2026-08-07
**Scope:** `packages/institutional-knowledge/**` (all `.ts` sources), cross-checked against `apps/web/src/**` and `apps/api/src/**` for runtime reachability.
**Binding rule:** `sdd/dashboard-next-best-action/decisions-2` (engram id 983), rule 5 — Slice 1 success gate is two-tier. This document is the **non-blocking deliverable**: a complete classification of every score/health/coverage/readiness rollup site in `packages/institutional-knowledge/*`. Nothing in this document is fixed as part of Slice 1; a site only qualifies for `fix-now` if it is simultaneously runtime-reachable, institution-level, and produces/consumes an institution-level aggregate.

## Method

1. Grepped `packages/institutional-knowledge/src/**/*.ts` for `healthScore|coverageScore|readinessScore|overallScore|continuityScore|maturityScore|qualityScore|regulatoryScore|relevanceScore|capacityScore|responsivenessScore|stabilityScore|overallHealth|healthSummary|\boverall\s*:` and related compliance/readiness score names.
2. For each match, read surrounding context to identify the owning interface/function and its scope (institution / capability / claim / evidence).
3. Checked **runtime reachability** two ways:
   - `rg "@kadarn/institutional-knowledge"` across every `package.json` in the repo (including `apps/web`, `apps/api`, and every other `packages/*`) — **zero dependency edges found anywhere**, including `package-lock.json`'s resolved graph (the only two hits are the package's own `package.json` declaring its own name, and the lockfile's own workspace entry for itself).
   - `rg "institutional-knowledge"` across `apps/web/src/**` and `apps/api/src/**` directly (in case of relative-path imports bypassing the package name) — **zero hits**.
   - `rg "institutional-knowledge"` repo-wide (excluding `node_modules`) — the only in-repo consumers are `tests/institutional-knowledge/*.test.ts` (30 vitest files, one per source file), which import via relative path `../../packages/institutional-knowledge/src/<file>`.
4. Conclusion used for every row below: **the entire `packages/institutional-knowledge` package is unreachable from any running application surface** (`apps/web`, `apps/api`). It is not a dependency of any other package that is itself a dependency of an app. Its only consumers are its own unit tests.

This is a stronger finding than the original explore's "~20 sites, out of scope" note (engram id 975) — the actual count of distinct score/rollup fields is **23 distinct sites across 11 files**, and every single one is confirmed `TEST_ONLY`, not merely "out of scope."

## Classification Table

| # | File | Line(s) | Field(s) | Runtime status | Data scope | Action | Reasoning |
|---|---|---|---|---|---|---|---|
| 1 | `document-intelligence.ts` | 402, 445, 462 | `DocumentDashboardState.coverageScore` | TEST_ONLY | Institution-level | defer | `institutionId`-scoped dashboard (line 453); exercised only by `document-intelligence.test.ts`; zero app imports of this package. |
| 2 | `document-intelligence.ts` | 404, 450, 464 | `DocumentDashboardState.healthScore` | TEST_ONLY | Institution-level | defer | Same struct as #1, penalized health rollup across all institution documents. |
| 3 | `compliance-ecosystem.ts` | 123, 652, 697 | `ComplianceDashboardState.overview.healthScore` | TEST_ONLY | Institution-level | defer | Built by `buildComplianceDashboard()` from one institution's `ComplianceKnowledgeState` (created via `createComplianceKnowledgeState(institutionId)`, line 234). |
| 4 | `compliance-ecosystem.ts` | 135, 646–648, 709 | `ComplianceDashboardState.quality.healthScore` | TEST_ONLY | Institution-level | defer | Quality-domain sub-rollup, still scoped to one institution's whole quality domain (not a single claim/capability). |
| 5 | `compliance-ecosystem.ts` | 147, 649–651, 721 | `ComplianceDashboardState.regulatory.healthScore` | TEST_ONLY | Institution-level | defer | Regulatory-domain sub-rollup, same institution scope as #4. |
| 6 | `guided-acquisition.ts` | 470–489 | `determineGrowthPath()` → `overall` / `coverageScore` param family | TEST_ONLY | Institution-level | defer | Function signature takes `institutionId` directly (line 471); composite of coverage/document/people/lab/graph health. |
| 7 | `guided-acquisition.ts` | 56–62, 168–234 | `ActionImpact.overallScore` (+ `readinessImprovement`/`complianceImprovement`) | TEST_ONLY | Institution-level | defer | `generateNextBestActions()` takes `institutionId` (line 69); this is a next-best-action priority score, not a displayed institution health number, but it is an institution-scoped composite aggregate per the rule-5 pattern. |
| 8 | `institution-os.ts` | 642–650, 695 | `IOSDashboardState.overview.healthScore` | TEST_ONLY | Institution-level | defer | `institutionId`-scoped dashboard (line 643). |
| 9 | `institution-os.ts` | 718–755 | `IOSHealth.overall` / `.responsivenessScore` / `.stabilityScore` | TEST_ONLY | Institution-level | defer | Computed from one institution's observations/recommendations/action plans; called from `buildIOSDashboard` context. |
| 10 | `institution-twin.ts` | 218–230, 340–342 | `TwinHealth.overall` (+ `dimensions.*`) | TEST_ONLY | Institution-level | defer | Digital Twin = one institution's full aggregate profile; `overall` explicitly averages knowledge/people/lab/document/graph/compliance health. |
| 11 | `institution-twin.ts` | 179–186 | `GrowthProfile.coverageScore` / `.healthScore` | TEST_ONLY | Institution-level | defer | Part of `InstitutionalProfile` assembled per institution. |
| 12 | `institution-twin.ts` | 170–176 | `ComplianceProfile.overallComplianceScore` | TEST_ONLY | Institution-level | defer | Same `InstitutionalProfile` assembly as #11. |
| 13 | `institution-twin.ts` | 192–197, 271–280 | `TwinExplorers.{people.healthScore, compliance.qualityScore, compliance.regulatoryScore, readiness.score}` | TEST_ONLY | Institution-level | defer | Facade rollups feeding the twin's institution-scoped explorer views. |
| 14 | `institutional-memory.ts` | 609–626, 737–747 | `MemoryHealthReport.scores.overall` | TEST_ONLY | Institution-level | defer | Report struct carries `institutionId` (line 610) directly. |
| 15 | `relationship-graph.ts` | 364–372, 414–422 | `GraphHealthReport.scores.overall` | TEST_ONLY | Institution-level | defer | One `RelationshipGraph` = one institution's full relationship graph; connectivity/completeness/consistency rolled into `overall`. |
| 16 | `lab-intelligence.ts` | 270–275 | `LabCapacityDashboard.overallCapacityScore` | TEST_ONLY | Capability-level | defer | Scoped to a single lab's operational capacity, not the whole institution — genuinely sub-institution granularity, already narrower than the hard-rule target. |
| 17 | `knowledge-explorer.ts` | 147–156 | `EquipmentExplorerDetail.healthScore` | TEST_ONLY | Capability-level | already-safe | Single-equipment-asset health metric supporting specific capabilities; not an institution aggregate by construction. |
| 18 | `knowledge-explorer.ts` | 184–192, 262–270 | `SearchResult.relevanceScore` | TEST_ONLY | N/A (not a rollup) | already-safe | Full-text search ranking score, not a health/readiness/coverage aggregate — outside the pattern rule 5 targets. |
| 19 | `people-intelligence.ts` | 261–273, 296–339 | `PersonDerivedMetrics.{certificationComplianceScore, trainingComplianceScore, licenseComplianceScore, overallReadinessScore}` | TEST_ONLY | Capability-level | defer | Per-person sub-metric (one `PersonProfile` in, one metrics object out) — not an institution aggregate; could theoretically feed a capability readiness rollup but does not itself claim to be one. |
| 20 | `people-intelligence.ts` | 504–521, 580–591 | `PeopleDashboardState.healthSummary.{certificationCompliance, trainingCompliance, licenseCompliance, cvCompleteness, overallHealth}` | TEST_ONLY | Institution-level | defer | Struct carries `institutionId` (line 505); averages `PersonDerivedMetrics` (#19) across all active people at the institution. |
| 21 | `promotion-pipeline.ts` | 31–42, 146 | `EligibilityResult.maturityScoreAtEvaluation` | TEST_ONLY | Claim-level | already-safe | Tied to one `KnowledgeItem` + `EvidenceCandidate` pair being evaluated for promotion into a single claim — already claim-scoped, exactly the granularity decisions-2 rule 1 requires. |
| 22 | `promotion-pipeline.ts` | 563, 602, 682 | `PromotionResult.maturityScoreAtPromotion` | TEST_ONLY | Claim-level | already-safe | Same promotion-decision scope as #21. |
| 23 | `claim-review-pipeline.ts` | 689 | `"Score delta shown"` (UI copy string in `whatUserSees`) | TEST_ONLY | N/A (not a field) | already-safe | Descriptive placeholder copy for a hypothetical future notification, not a computed or stored field. No actual score is produced here. |

## Runtime-reachability evidence

```text
$ rg "@kadarn/institutional-knowledge" **/package.json
packages/institutional-knowledge/package.json:2:  "name": "@kadarn/institutional-knowledge",
# (zero other package.json files reference it as a dependency — not apps/web, not apps/api, not any sibling package)

$ rg "institutional-knowledge" apps/web/src apps/api/src
# zero hits

$ rg "institutional-knowledge" . --files-with-matches   (excluding node_modules)
tests/institutional-knowledge/*.test.ts   (30 files — the package's own test suite)
packages/institutional-knowledge/package.json
package-lock.json                          (workspace self-entry only)
+ a handful of planning/audit docs under foundation/** and docs/** that merely mention the package by name
```

No file under `apps/web/src/**` or `apps/api/src/**` imports `@kadarn/institutional-knowledge`, directly or transitively through any other in-repo package. The package is fully isolated: built, tested, but never wired into a running surface.

## Fix-now items

**None.** Zero sites in this inventory meet all three conditions required for `action: fix-now` (runtime-reachable AND institution-level AND produces/consumes an institution-level aggregate) — every site fails the runtime-reachability condition, regardless of data scope. This confirms the Slice 1 mandatory gate (repo-wide `apps/web`/`apps/api` score scan) and this non-blocking inventory are correctly decoupled: nothing here needed to be touched to satisfy Slice 1's success gate, and nothing here was touched by PR-A/PR-B/PR-C.

## Recommendation

A **follow-up decommissioning slice is warranted but low urgency.** `packages/institutional-knowledge` is a ~34-file, fully-tested (30 test files), fully-isolated package that computes 15 institution-level score/health rollups (rows 1–15, 20) that directly violate decisions-2 rule 1 ("Never aggregated into an institutional tier, readiness label, capability score, continuity score, ranking...") in spirit, but currently cause zero user-facing or product harm because nothing imports the package. Recommended priority: **low/opportunistic** — address in a dedicated follow-up (either delete the institution-level rollup fields to align the codebase with the no-institution-score rule permanently, or formally mark the package `@deprecated`/archive it) rather than as an urgent fix, since there is no live risk today. The main risk this inventory flags is **latent**: if anyone wires this package into `apps/web` or `apps/api` in the future without checking this document first, 15 institution-level score fields would become instantly reachable and violate the hard rule again.
