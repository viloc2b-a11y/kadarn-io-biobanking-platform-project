# Pilot Readiness Gap List — Sprint 25A

**Date:** 2026-07-02

---

## What Must Exist Before First Pilot

| Capability | Status | Blocker? |
|---|---|---|
| Institution can upload discovery documents | ⚠️ Unknown — depends on existing Discovery pipeline | Yes |
| Discovery pipeline processes artifacts end-to-end | ⚠️ Not verified in production flow | Yes |
| Dashboard displays processed results | ⚠️ Partially — engine outputs not wired | Yes |
| Executive Profile renders with real data | ❌ Data path not wired | Yes |
| Sponsor can search capabilities anonymously | ❌ Sample data only | Yes |
| Site Director can review Opportunity Brief | ❌ Frontend not built | Yes |
| Institution can grant/decline consent | ❌ Frontend not built | Yes |
| Recognition Report can be generated | ❌ Button disabled | Yes |
| Public Profile accessible at URL | ❌ No public route | No |
| Identity protected throughout | ✅ By design — Visibility + Consent | No |
| No confidence scores exposed | ✅ All engines enforce this | No |
| No forbidden terminology | ✅ rg verified throughout | No |

---

## Demo-Ready Institution Profiles Needed

| Institution | Type | Capabilities | Assets | Readiness |
|---|---|---|---|---|
| Community Hospital | Small site | 3-5 capabilities | 2-3 assets | Needs Additional Evidence |
| Academic Medical Center | Large site | 8-12 capabilities | 5-8 assets | Presentation Ready |
| Phase I Unit | Specialist | 4-6 capabilities | 3-4 assets | Presentation Ready |
| Biobank | Repository | 6-8 capabilities | 6-10 assets | Presentation Ready |
| SMO Network | Multi-site | 10+ capabilities | 8+ assets | Varies by site |

---

## Sponsor Demo Scenarios

| Scenario | Flow |
|---|---|
| Pharma sponsor searches for Phase I oncology sites in Texas | Anonymous search → 3 matches → Workspace → Brief |
| CRO evaluates biobank capabilities for longitudinal study | Search by research assets → 2 matches → Brief → Consent |
| Site Director receives Opportunity Brief | Brief view → Grant partial consent → Passport created |
| Kadarn Internal reviews visibility policies | Inspector → Policy audit → Override test |

---

## Integration Checkpoints

| Checkpoint | Required For Pilot |
|---|---|
| ClinicalTrials.gov connector returns real data | No (demo data acceptable) |
| PubMed connector returns real data | No |
| Evidence Firewall active in ingestion path | Yes (C-005) |
| Dashboard serves engine outputs | Yes (C-001) |
| Report generation works | Yes (C-002) |
| Sponsor Search returns non-hardcoded results | Yes (C-003) |
| Executive Profile renders with data | Yes (C-004) |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Dashboard wiring takes longer than expected | Medium | High | Prioritize C-001 first |
| External APIs unstable during demo | Medium | Medium | Use demo dataset as fallback |
| Institution onboarding friction | High | High | Prepare pre-loaded demo institutions |
| Sponsor expectations exceed MVP | Medium | Medium | Set clear scope boundaries in pilot agreement |

---

*Update after Sprint 25B (Demo Dataset) when sample institutions are ready.*
