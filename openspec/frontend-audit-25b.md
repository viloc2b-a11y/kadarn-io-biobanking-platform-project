# Frontend Audit Report — Sprint 25B

**Date:** 2026-07-02

---

## Mock Data Scan

| File | Mock Found | Type | Severity |
|---|---|---|---|
| `sponsor-search.tsx` | `SAMPLE_RESULTS` array with 3 hardcoded institutions | Hardcoded data | ❌ Critical |
| `report-generation-cta.tsx` | Button `disabled` permanently | Disabled functionality | ❌ Critical |
| `executive-profile.tsx` | Reads `data.capabilityIntelligence` — never populated | Missing data path | ❌ Critical |
| `public-profile.tsx` | Accepts `PublicProfileData` — no API caller | Missing data path | ❌ Critical |

---

## Placeholder / TODO Scan

| File | Issue | Type |
|---|---|---|
| `discovery-copy.ts` | Some copy strings reference future features | Minor |
| `dashboard.tsx` | `case 'research_assets'` wired to engine path ✅ | None |

---

## Disabled / Incomplete Features

| Feature | File | Status |
|---|---|---|
| Generate Report | `report-generation-cta.tsx` | Permanently disabled |
| Sponsor Search live data | `sponsor-search.tsx` | Sample data only |
| Executive Profile data | `executive-profile.tsx` | No data source |
| Public Profile data | `public-profile.tsx` | No data source |
| Opportunity Brief UI | Not built | Missing |
| Consent UI | Not built | Missing |
| Passport UI | Not built | Missing |
| Visibility Inspector | Not built | Missing |
| Firewall Status | Not built | Missing |
| Identity Status | Not built | Missing |

---

## Dead Navigation

| Route | Status |
|---|---|
| `/workspace/discovery` | ✅ Active |
| `/koc/discovery` | ✅ Active |
| `/institutions/{slug}` (public) | ❌ Route not created |
| `/sponsor/search` | ❌ Route not created |
| `/sponsor/workspace` | ❌ Route not created |
| `/institution/consent` | ❌ Route not created |

---

## Component Health Summary

| Component | Exists | Has Types | Has Engine Path | Has Fallback | Wired to API |
|---|---|---|---|---|---|
| Discovery Dashboard | ✅ | ✅ | ✅ | ✅ | ⚠️ Partial |
| Research Assets | ✅ | ✅ | ✅ | ✅ | ⚠️ Partial |
| Evidence Gaps | ✅ | ✅ | ✅ | ✅ | ⚠️ Partial |
| Sponsor Readiness | ✅ | ✅ | ✅ | ✅ | ⚠️ Partial |
| Recommendations | ✅ | ✅ | ❌ | ❌ | ❌ |
| Executive Profile | ✅ | ✅ | ✅ | N/A | ❌ |
| Sponsor Search | ✅ | ✅ | ✅ | N/A | ❌ |
| Public Profile | ✅ | ✅ | ✅ | N/A | ❌ |
| Opportunity Brief | ❌ | ✅ | N/A | N/A | ❌ |
| Consent UI | ❌ | ✅ | N/A | N/A | ❌ |
| Passport UI | ❌ | ✅ | N/A | N/A | ❌ |

---

## Action Items

1. **Critical:** Wire Sponsor Search to real API (C-003)
2. **Critical:** Wire Executive Profile to dashboard data (C-004)
3. **Critical:** Enable Report Generation button (C-002)
4. **Critical:** Create Public Profile API route (H-003)
5. **High:** Build Opportunity Brief UI
6. **High:** Build Consent UI
7. **High:** Build Passport UI
8. **Medium:** Build admin dashboards (Visibility, Firewall, Identity)

---

*Update after each sprint as components are wired.*
