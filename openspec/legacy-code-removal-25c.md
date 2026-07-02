# Legacy Code Removal Report — Sprint 25C

**Date:** 2026-07-02

---

## Code Safe to Remove (After Canonical Wiring Verified)

### Dashboard lib.ts — Research Asset Mapping Shims

| Function | Status | Action |
|---|---|---|
| `mapCapabilitiesToResearchAssets()` | Deprecated shim | Remove after `EngineDrivenPanel` is the only active path |
| `getResearchAssetStatus()` | Deprecated shim | Remove |
| `getResearchAssetNextStep()` | Deprecated shim | Remove |
| `RESEARCH_ASSET_LABELS` | Duplicated in engine | Keep as re-export from engine types |
| `CAPABILITY_TO_ASSET` mapping | Duplicated in engine | Remove |
| `ResearchAssetEntry` interface | Duplicated in engine types | Remove |
| `ResearchAssetStatus` type | Duplicated in engine types | Remove |

**Risk:** `discovery-lib.test.ts` tests these functions. Must update tests to test engine equivalents or remove.

### Dashboard lib.ts — Sponsor Readiness Shims

| Function | Status | Action |
|---|---|---|
| `assessSponsorReadiness()` | Used by agent fallback | Keep as fallback until `CanonicalSponsorReadiness` is verified as sole path |
| `SponsorReadinessLabel` type | Duplicated in engine | Keep for backward compat, mark deprecated |

### Dashboard sponsor-readiness-summary.tsx

| Component | Status | Action |
|---|---|---|
| `EngineDrivenReadiness` | Intermediate adapter | Remove after `CanonicalSponsorReadiness` is verified |
| Agent extraction helpers (`extractCapabilities`, `extractClaims`, `extractGaps`) | Agent fallback | Keep until canonical path verified, then remove |

### Dashboard research-assets-enabled-panel.tsx

| Component | Status | Action |
|---|---|---|
| `AgentDrivenPanel` | Agent fallback | Remove after engine path verified |
| `ResearchAssetCard` (agent version) | Agent fallback | Remove |

### Dashboard gaps-panel.tsx

| Component | Status | Action |
|---|---|---|
| Agent extraction logic | Agent fallback | Keep until `EngineDrivenGapsPanel` verified, then remove |
| `GapCard` (agent version) | Agent fallback | Remove |

---

## Code to Keep

| File | Reason |
|---|---|
| `panel-primitives.tsx` | Shared UI — used by all panels |
| `discovery-copy.ts` | Shared copy strings |
| `discovery-api.ts` | Shared API client |
| `types.ts` engine contracts | Canonical types — consumed by all components |
| `discovery-tab-bar.tsx` | Navigation |
| `discovery-metrics-strip.tsx` | Metrics display |

---

## Files With No Duplication Risk

All files in `packages/evidence-discovery/src/` are canonical engines — no duplication. These are the source of truth.

Files in `apps/web/src/components/discovery/` that directly consume engine types (via `DashboardData` fields) are fine — they're consumers, not duplicators.

---

## Removal Order

1. Verify canonical engine path is the active path in production (API returns engine fields)
2. Confirm all dashboard panels render from engine data
3. Remove agent fallback components (AgentDrivenPanel, legacy GapCard, etc.)
4. Remove deprecated shim functions from lib.ts
5. Update tests to cover engine paths only (or add engine-path-specific tests)
6. Remove duplicate type definitions (replace with re-exports from engine package)

---

## Estimated Lines Removable

| Category | Estimated Lines |
|---|---|
| lib.ts deprecated shims | ~220 lines |
| Agent fallback components | ~150 lines |
| Duplicate type definitions | ~60 lines |
| **Total** | **~430 lines** |

---

*Do not remove until canonical wiring is verified in production with real data.*
