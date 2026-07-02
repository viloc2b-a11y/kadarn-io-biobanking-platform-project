# Engine Wiring Report — Sprint 25C

**Date:** 2026-07-02
**Purpose:** Verify every production consumer is wired to canonical engines.

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Wired — consumes canonical engine via API or direct import |
| ⚠️ | Shallow-wired — engine path exists in types but not reaching live data |
| ❌ | Not wired — uses agent output fallback or mock data |
| 🔧 | Being wired this sprint |

---

## Dashboard Wiring

| Panel | Engine | Wiring Status | Data Path |
|---|---|---|---|
| Recognition Overview | Assessment Engine | ⚠️ | `data.assessmentIntelligence` type exists, API field not populated |
| Institutional Story | Assessment Engine | ⚠️ | Engine path in component, no API data |
| Research Assets | Capability Intelligence | ⚠️ | `EngineDrivenPanel` consumes `capabilityIntelligence` + `gapIntelligence` — API field missing |
| Evidence Gaps | Gap Intelligence | ⚠️ | `EngineDrivenGapsPanel` consumes `gapIntelligence` — API field missing |
| Sponsor Readiness | Sponsor Readiness | ⚠️ | `CanonicalSponsorReadiness` consumes `sponsorReadiness` — API field missing |
| Recommendations | Recommendation Engine | ❌ | `recommendations` field in DashboardData, no API field |
| Pipeline Status | Pipeline | ✅ | Dedicated endpoint |
| Source Trace | Provenance | ✅ | Dedicated endpoint |
| Curation | Curation | ✅ | Dedicated endpoint |
| Validation Notes | Curation | ✅ | Dedicated endpoint |

**Dashboard wiring: 4 ✅, 5 ⚠️, 1 ❌**

**Root cause:** `GET /api/v1/discovery/dashboard` route does not build engine outputs. It returns raw agent outputs only. Need to add engine output fields to the dashboard response.

---

## Report Wiring

| Report Section | Engine | Wiring Status |
|---|---|---|
| Executive Summary | Assessment + Readiness | ❌ No endpoint |
| Institution Overview | Assessment + Capability | ❌ |
| Institutional Story | Narrative | ❌ |
| Capabilities | Capability Intelligence | ❌ |
| Research Assets | Capability Intelligence | ❌ |
| Evidence Highlights | Capability Intelligence | ❌ |
| Evidence Gaps | Gap Intelligence | ❌ |
| Sponsor Readiness | Sponsor Readiness | ❌ |
| Recommendations | Recommendation Engine | ❌ |
| Appendix | Governance | ❌ |

**Report wiring: 0/10 sections wired. Endpoint not created.**

---

## Executive Profile Wiring

| Section | Engine | Wiring Status |
|---|---|---|
| Hero + Story | Capability Intelligence | ❌ No API endpoint |
| Executive Summary | Assessment | ❌ |
| Sponsor Readiness | Sponsor Readiness | ❌ |
| Capabilities | Assessment | ❌ |
| Research Assets | Assessment | ❌ |
| Recommendations | Recommendation | ❌ |
| Evidence Highlights | Capability Intelligence | ❌ |
| Evidence Gaps | Gap Intelligence | ❌ |

**Profile wiring: 0/8 sections. Endpoint not created.**

---

## Sponsor Products Wiring

| Product | Engine | Wiring Status |
|---|---|---|
| Capability Graph / Search | Capability Graph + Visibility | ❌ Sample data |
| Discovery Workspace | Workspace + Capability Graph | ❌ Sample data |
| Opportunity Brief | Brief Generator | ❌ No endpoint |
| Institutional Consent | Consent Engine | ❌ No endpoint |
| Mutual Reveal | Passport Engine | ❌ No endpoint |
| Feasibility Passport | Passport Engine | ❌ No endpoint |

**Sponsor products: 0/6 wired.**

---

## Engine Dependency Verification

| Engine | Consumers Wired | Total Consumers Needed | Status |
|---|---|---|---|
| Capability Intelligence | 0 | 5 (Dashboard, Report, Profile, Search, Workspace) | ❌ |
| Gap Intelligence | 0 | 3 (Dashboard, Report, Profile) | ❌ |
| Assessment | 0 | 5 (Dashboard, Report, Profile, Search, Workspace) | ❌ |
| Sponsor Readiness | 0 | 4 (Dashboard, Report, Profile, Search) | ❌ |
| Recommendation | 0 | 2 (Dashboard, Report) | ❌ |
| Recognition Report | 0 | 1 (API endpoint) | ❌ |

---

## Summary

| Category | ✅ | ⚠️ | ❌ | Total |
|---|---|---|---|---|
| Dashboard Panels | 4 | 5 | 1 | 10 |
| Report Sections | 0 | 0 | 10 | 10 |
| Profile Sections | 0 | 0 | 8 | 8 |
| Sponsor Products | 0 | 0 | 6 | 6 |
| Engine Consumers | 0 | 0 | 6 engines × N consumers | — |

**Overall: 4 wired, 5 shallow-wired, 25 not wired.**

### Root Cause

The dashboard API route (`apps/api/app/api/v1/discovery/dashboard/route.ts`) only returns raw agent outputs. The engine output fields (`capabilityIntelligence`, `gapIntelligence`, `assessmentIntelligence`, `sponsorReadiness`, `recommendations`, `gapIntelligence`) are defined in the DashboardData type but never populated by the backend.

Additionally, separate API endpoints for Report, Profile, Search, Workspace, Consent, and Passport do not exist.

### Fix Approach

Single change with maximum impact: update `route.ts` to build and include engine outputs in the dashboard response. This wires 5 dashboard panels + enables Executive Profile data through the existing dashboard endpoint.

Then create endpoints for Report, Search, and Public Profile.
