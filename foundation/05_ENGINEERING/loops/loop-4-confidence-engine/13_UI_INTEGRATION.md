# KAD-LOOP-004 — Phase 12: UI Integration

## Views

| View | API Backend | UI File |
|---|---|---|
| Capability Confidence | GET /api/v1/capabilities/{id}/confidence | capabilities page (existing) |
| Confidence Breakdown | GET /confidence-assessments/{id}/factors | ConfidenceBreakdown component |
| Factors | GET /confidence-assessments/{id}/factors | FactorsPanel component |
| Penalties & Blockers | GET /confidence-assessments/{id}/blockers | BlockersPanel component |
| Assessment History | GET /api/v1/institutions/{id}/confidence | HistoryView component |
| Replay Result | POST /confidence-assessments/{id}/replay | ReplayPanel component |
| Stale Assessments | GET /api/v1/institutions/{id}/confidence/stale | StaleList component |
| Institution Summary | GET /api/v1/institutions/{id}/confidence | InstitutionConfidence component |

## UI Requirements
- Display: score, band, readiness, eligibility, model version, timestamp, valid-until, stale status, stale reasons, manual-review requirement, dimension breakdown, positive factors, penalties, blockers, excluded inputs, evidence gaps, assessment history
- Do NOT use color alone — include text labels and accessible status descriptions
- Every view must support: loading, empty, unavailable, not eligible, blocked, stale, error, successful states
- Show UNASSESSED explicitly when no valid assessment exists (never show 0)
- Mocks removed from confidence flow

## UI Actions
Where consistent with auth:
- Calculate confidence
- Recalculate confidence
- Replay assessment
- Compare assessments
- Open capability, claim, evidence, blocker details
- No destructive actions