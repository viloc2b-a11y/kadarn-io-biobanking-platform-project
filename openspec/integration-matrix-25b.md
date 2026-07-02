# End-to-End Integration Matrix — Sprint 25B

**Date:** 2026-07-02
**Purpose:** Verify every visible feature is wired to canonical backend architecture.

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Fully Connected — UI → API → Engine → Pipeline |
| ⚠️ | Partially Connected — some layers wired, gaps remain |
| ❌ | Mock/Placeholder — no backend connection |
| 🔧 | Requires Correction — connected but broken |
| ➖ | Not Applicable — no UI for this component |

---

## 1. Discovery Dashboard

| Panel | Backend API | Engine | Status | Action Required |
|---|---|---|---|---|
| Recognition Overview | `GET /api/v1/discovery/dashboard` | Assessment, Readiness | ⚠️ | C-001: Wire engine outputs |
| Institutional Story | `GET /api/v1/discovery/dashboard` | Narrative Engine | ✅ | None |
| Research Assets | `GET /api/v1/discovery/dashboard` | Capability Intelligence | ⚠️ | C-001: Wire engine outputs |
| Evidence Gaps | `GET /api/v1/discovery/dashboard` | Gap Intelligence | ⚠️ | C-001: Wire engine outputs |
| Capability Intelligence | `GET /api/v1/discovery/dashboard` | Capability Intelligence | ✅ | None (agent fallback works) |
| Sponsor Readiness | `GET /api/v1/discovery/dashboard` | Sponsor Readiness | ⚠️ | C-001: Wire engine outputs |
| Recommendations | `GET /api/v1/discovery/dashboard` | Recommendation Engine | ❌ | C-001: No API field |
| Pipeline Status | `GET /api/v1/discovery/pipeline-status` | Pipeline | ✅ | None |
| Source Trace | `GET /api/v1/discovery/provenance` | Provenance | ✅ | None |
| Curation | `GET /api/v1/discovery/curation` | Curation | ✅ | None |
| Validation Notes | `GET /api/v1/discovery/validation-notes` | Curation | ✅ | None |
| Discovery Metrics | Inline in dashboard | Metrics builder | ✅ | None |

---

## 2. Institution Products

| Product | Backend API | Engine | Status | Action Required |
|---|---|---|---|---|
| Recognition Report | ❌ No endpoint | Report Generator | ❌ | C-002: Create endpoint |
| Executive Profile | ❌ No endpoint | All engines | ❌ | C-004: Wire to dashboard data |
| Public Profile | ❌ No endpoint | Visibility + Assessment | ❌ | H-003: Create public endpoint |

---

## 3. Sponsor Products

| Product | Backend API | Engine | Status | Action Required |
|---|---|---|---|---|
| Capability Graph / Sponsor Search | ❌ Sample data | Capability Graph Engine | ❌ | C-003: Wire to engine |
| Discovery Workspace | ❌ Sample data | Discovery Workspace Engine | ❌ | C-003: Wire to engine |
| Opportunity Brief | ❌ No endpoint | Opportunity Brief Generator | ❌ | Needs API endpoint |
| Institutional Consent | ❌ No endpoint | Consent Engine | ❌ | Needs API endpoint |
| Mutual Reveal | ❌ No endpoint | Passport Engine | ❌ | Needs API endpoint |
| Feasibility Passport | ❌ No endpoint | Passport Engine | ❌ | Needs API endpoint |
| Collaboration Workspace | ❌ No UI | Passport Engine | ❌ | Defer to post-pilot |

---

## 4. Infrastructure Components

| Component | Connected To | Real Data? | Status | Action Required |
|---|---|---|---|---|
| Connector Layer | Provider APIs | ❌ Mock only | ⚠️ | H-001: Wire ClinicalTrials.gov + PubMed |
| Identity Resolution | Connector Layer | ❌ Not connected | ❌ | H-002: Wire to ConnectorRegistry |
| Evidence Firewall | Discovery Pipeline | ❌ Not inserted | ❌ | C-005: Insert into ingestion path |
| Continuous Monitoring | Session events | ❌ Not triggered | ⚠️ | H-005: Add triggers |
| Notification Center | No delivery channel | ❌ No UI | ❌ | M-001: Add in-app display |
| Governance & Explainability | Engine outputs | ✅ Read-only | ✅ | None |
| Private Evidence Layer | No persistence | ❌ No storage | ⚠️ | M-005: Add metadata storage |

---

## 5. API Endpoints Audit

| Endpoint | Consumer | Engine | Status |
|---|---|---|---|
| `GET /api/v1/discovery/session` | Dashboard | Session store | ✅ |
| `GET /api/v1/discovery/dashboard` | Dashboard | Agent outputs | ⚠️ Missing engine fields |
| `GET /api/v1/discovery/curation` | Dashboard | Curation | ✅ |
| `GET /api/v1/discovery/validation-notes` | Dashboard | Curation | ✅ |
| `GET /api/v1/discovery/provenance` | Dashboard | Provenance | ✅ |
| `GET /api/v1/discovery/pipeline-status` | Dashboard | Pipeline | ✅ |
| `GET /api/v1/workspace/navigation` | Shell | Static | ✅ |
| Report endpoint | ❌ Not created | Report Generator | ❌ |
| Sponsor search endpoint | ❌ Not created | Capability Graph | ❌ |
| Executive profile endpoint | ❌ Not created | All engines | ❌ |
| Public profile endpoint | ❌ Not created | Visibility + Assessment | ❌ |
| Consent endpoint | ❌ Not created | Consent Engine | ❌ |
| Passport endpoint | ❌ Not created | Passport Engine | ❌ |

---

## 6. Frontend Mock/Placeholder Scan

| Component | Issue | Severity |
|---|---|---|
| Sponsor Search | Uses SAMPLE_RESULTS hardcoded array | ❌ Critical |
| Executive Profile | Has engine path but no data source | ❌ Critical |
| Public Profile | Has component but no data path | ❌ Critical |
| Recognition Report CTA | Button permanently disabled | ❌ Critical |
| Opportunity Brief UI | Not built | ❌ Critical |
| Consent UI | Not built | ❌ Critical |
| Passport UI | Not built | ❌ Critical |
| Visibility Inspector | Not built | ⚠️ High |
| Firewall Status | Not built | ⚠️ High |
| Identity Status | Not built | ⚠️ High |
| Notification display | Not built | ⚠️ Medium |
| Monitoring dashboard | Not built | ⚠️ Medium |

---

## 7. Summary

| Category | ✅ | ⚠️ | ❌ | 🔧 | Total |
|---|---|---|---|---|---|
| Dashboard Panels | 6 | 4 | 1 | 0 | 11 |
| Institution Products | 0 | 0 | 3 | 0 | 3 |
| Sponsor Products | 0 | 0 | 6 | 0 | 6 |
| Infrastructure | 1 | 2 | 3 | 0 | 6 |
| API Endpoints | 6 | 1 | 5 | 0 | 12 |

**Overall: 13 connected, 7 partial, 18 not connected**

### Critical Path to Pilot Readiness (in order)

1. C-005: Insert Evidence Firewall (protects everything downstream)
2. C-001: Wire engine outputs to dashboard API (enables 4 panels + profile)
3. C-002: Create report endpoint (enables Recognition Report)
4. C-003: Wire Sponsor Search to Capability Graph (enables sponsor demo)
5. C-004: Wire Executive Profile to data (enables institution demo)
6. H-003: Create public profile endpoint (enables public demo)
7. H-001/H-002: Wire Connector → Identity (enables real data flow)

---

*This matrix is the authoritative source for Sprint 25C-25F work prioritization.*
