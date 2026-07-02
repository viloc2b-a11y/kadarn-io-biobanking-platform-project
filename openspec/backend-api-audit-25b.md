# Backend & API Audit Report — Sprint 25B

**Date:** 2026-07-02

---

## API Endpoint Status

| Endpoint | Method | Consumer | Engine | Status |
|---|---|---|---|---|
| `/api/v1/discovery/session` | GET | Dashboard | Session store | ✅ Connected |
| `/api/v1/discovery/dashboard` | GET | Dashboard | Agent outputs | ⚠️ Missing engine fields |
| `/api/v1/discovery/curation` | GET/POST | Dashboard | Curation service | ✅ Connected |
| `/api/v1/discovery/validation-notes` | GET/POST | Dashboard | Curation service | ✅ Connected |
| `/api/v1/discovery/provenance` | GET | Dashboard | Provenance | ✅ Connected |
| `/api/v1/discovery/pipeline-status` | GET | Dashboard | Pipeline | ✅ Connected |
| `/api/v1/workspace/navigation` | GET | Shell | Static config | ✅ Connected |
| `/api/v1/koc/navigation` | GET | Shell | Static config | ✅ Connected |
| Report endpoint | — | — | Report Generator | ❌ Not created |
| Sponsor search endpoint | — | — | Capability Graph | ❌ Not created |
| Executive profile endpoint | — | — | All engines | ❌ Not created |
| Public profile endpoint | — | — | Visibility + Assessment | ❌ Not created |
| Consent endpoint | — | — | Consent Engine | ❌ Not created |
| Passport endpoint | — | — | Passport Engine | ❌ Not created |
| Workspace endpoint | — | — | Workspace Engine | ❌ Not created |

---

## Engine Consumer Verification

| Engine | Consumed By | Status |
|---|---|---|
| Capability Intelligence | Dashboard (agent output fallback) | ⚠️ Not via engine API |
| Gap Intelligence | Dashboard (agent output fallback) | ⚠️ Not via engine API |
| Assessment | Dashboard (engine path exists) | ⚠️ Not wired to API |
| Sponsor Readiness | Dashboard (engine path exists) | ⚠️ Not wired to API |
| Recommendation | No consumer | ❌ Orphan |
| Recognition Report | No consumer | ❌ Orphan |
| Visibility Policy | Sponsor Search (via Capability Graph) | ⚠️ Engine exists, not called from API |
| Capability Graph | No consumer | ❌ Orphan |
| Discovery Workspace | No consumer | ❌ Orphan |
| Opportunity Brief | No consumer | ❌ Orphan |
| Institutional Consent | No consumer | ❌ Orphan |
| Feasibility Passport | No consumer | ❌ Orphan |
| Connector Layer | No consumer (mock only) | ❌ Unused |
| Identity Resolution | No consumer | ❌ Unused |
| Evidence Firewall | No consumer | ❌ Not inserted |
| Continuous Monitoring | No consumer | ❌ Not triggered |
| Notification Center | No consumer | ❌ Generated but undelivered |
| Governance & Explainability | Engine outputs (read-only) | ✅ Passive |
| Private Evidence | No consumer | ❌ Unused |

---

## Orphan / Unused Components

| Component | Reason |
|---|---|
| Recommendation Engine | Fully built and tested — no API endpoint exposes output |
| Recognition Report Generator | Fully built and tested — no API endpoint |
| Capability Graph Engine | Built — no API consumer |
| Discovery Workspace Engine | Built — no API consumer |
| Opportunity Brief Generator | Built — no API consumer |
| Institutional Consent Engine | Built — no API consumer |
| Feasibility Passport Engine | Built — no API consumer |
| Connector Layer (7 adapters) | Built with mock HTTP — no real calls |
| Identity Resolution Engine | Built — not connected to Connector Layer |
| Evidence Firewall | Built — not inserted into Discovery path |
| Continuous Monitoring | Built — no triggers |
| Notification Center | Built — no delivery channel |

---

## Evidence Core Isolation

| Check | Status |
|---|---|
| Engine writes to Evidence Core | ✅ None — all engines are read-only |
| Direct Evidence Core queries outside Discovery | ✅ None verified |
| Evidence Core boundary respected | ✅ ADR-011 enforced |

---

## Action Summary

**13 engine/components built and tested but not wired to any API consumer.**

Priority: Create API endpoints for the 7 critical consumer-facing engines (Report, Search, Profile, Consent, Passport, Workspace, Brief), then wire Connector → Identity → Firewall → Discovery pipeline.

---

*This audit confirms all backend engines are correctly built. The gap is exclusively in API wiring and pipeline integration — not in engine logic.*
