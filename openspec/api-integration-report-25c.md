# API Integration Report — Sprint 25C

**Date:** 2026-07-02

---

## Existing Endpoints (Wired)

| Endpoint | Method | Status | Notes |
|---|---|---|---|
| `/api/v1/discovery/session` | GET | ✅ | Returns session data |
| `/api/v1/discovery/dashboard` | GET | ⚠️ | Missing engine output fields |
| `/api/v1/discovery/curation` | GET/POST | ✅ | |
| `/api/v1/discovery/validation-notes` | GET/POST | ✅ | |
| `/api/v1/discovery/provenance` | GET | ✅ | |
| `/api/v1/discovery/pipeline-status` | GET | ✅ | |

---

## Endpoints to Create (Priority Order)

| Priority | Endpoint | Method | Consumes | Serves |
|---|---|---|---|---|
| P0 | `/api/v1/discovery/dashboard` | GET | UPDATE existing | Add engine output fields |
| P0 | `/api/v1/discovery/report` | GET | Report Generator | Recognition Report |
| P0 | `/api/v1/sponsor/search` | POST | Capability Graph | Anonymous search results |
| P0 | `/api/v1/institution/profile` | GET | Assessment + Readiness | Executive Profile data |
| P1 | `/api/v1/institution/public/{slug}` | GET | Visibility + Assessment | Public Profile |
| P1 | `/api/v1/sponsor/workspace` | POST/GET | Discovery Workspace | Workspace CRUD |
| P1 | `/api/v1/opportunity/brief` | POST/GET | Brief Generator | Brief CRUD |
| P1 | `/api/v1/consent` | POST/GET/PUT | Consent Engine | Consent CRUD |
| P1 | `/api/v1/passport` | GET | Passport Engine | Passport data |
| P2 | `/api/v1/admin/visibility` | GET | Visibility Policy | Internal debug |
| P2 | `/api/v1/admin/firewall` | GET | Evidence Firewall | Internal status |
| P2 | `/api/v1/admin/identity` | GET | Identity Resolution | Internal status |

---

## Dashboard API Update Spec

Current response:
```json
{
  "session": {...},
  "latestRun": {...},
  "counts": {...},
  "metrics": {...},
  "agentOutputs": {...},
  "curationEvents": [...],
  "validationNotes": [...],
  "artifacts": [...],
  "candidates": [...]
}
```

Required additional fields:
```json
{
  "capabilityIntelligence": { "capabilities": [...], "summary": {...}, "generated_at": "..." },
  "gapIntelligence": { "gaps": [...], "summary": {...}, "generated_at": "..." },
  "assessmentIntelligence": { "assessment": [...], "summary": {...}, "generated_at": "..." },
  "sponsorReadiness": { "readiness_label": "...", "summary": "...", "strengths": [...], ... },
  "recommendations": { "recommendations": [...], "summary": {...}, "generated_at": "..." }
}
```

Each field built by calling the respective engine:
- `CapabilityIntelligenceEngine.build(input)` from agent capability output + claims + gaps
- `EvidenceGapIntelligenceEngine.build(input)` from agent gap output
- `InstitutionalCapabilityAssessmentEngine.build(input)` from CI + GI
- `SponsorReadinessEngine.build(input)` from Assessment
- `RecommendationEngine.build(input)` from Assessment + GI + SR

---

## Report API Spec

```
GET /api/v1/discovery/report?sessionId={id}

Response: InstitutionRecognitionReport (JSON)
         or text/html (printable view)
```

Implementation:
```typescript
const generator = new InstitutionRecognitionReportGenerator()
const report = generator.generate({
  institutionName: session.siteName,
  capabilities: capabilityIntelligence.capabilities,
  gaps: gapIntelligence.gaps,
  readiness: sponsorReadiness,
  recommendations: recommendationOutput.recommendations,
  // ...
})
return Response.json(report)
```

---

## Search API Spec

```
POST /api/v1/sponsor/search
Body: { capabilities: ["PBMC"], research_assets: ["Plasma"], geography: "Texas" }

Response: CapabilityGraphResult
```

Implementation:
```typescript
const graph = new CapabilityGraphEngine(visibilityPolicyEngine)
// Register institutions from database
const result = graph.search(query, 'sponsor')
return Response.json(result)
```

---

## Integration Status After Wiring

| Category | Before 25C | After 25C (target) |
|---|---|---|
| Dashboard endpoints | 6 ✅, 1 ⚠️ | 7 ✅ |
| Report endpoint | 0 | 1 ✅ |
| Search endpoint | 0 | 1 ✅ |
| Profile endpoints | 0 | 2 ✅ |
| Sponsor endpoints | 0 | 3 ✅ |
| Admin endpoints | 0 | 3 ✅ |
| **Total** | **6 ✅** | **17 ✅** |

---

*This report defines the exact API changes needed for Sprint 25C.*
