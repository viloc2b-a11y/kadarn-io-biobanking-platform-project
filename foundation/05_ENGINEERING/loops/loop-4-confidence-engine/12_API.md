# KAD-LOOP-004 — Phase 10-11: API & Institution Summary

## API Routes

### Confidence Models (6 routes)
| Method | Route | Purpose |
|---|---|---|
| GET | /api/v1/confidence-models | List models (tenant-scoped) |
| POST | /api/v1/confidence-models | Create draft model |
| GET | /api/v1/confidence-models/{id} | Get model detail |
| PATCH | /api/v1/confidence-models/{id} | Update model metadata |
| POST | /api/v1/confidence-models/{id}/activate | Activate model (validate rules) |
| POST | /api/v1/confidence-models/{id}/deprecate | Deprecate model |
| GET | /api/v1/confidence-models/{id}/rules | List rules for model |
| POST | /api/v1/confidence-models/{id}/rules | Create rule for model |

### Confidence Rules (2 routes)
| Method | Route | Purpose |
|---|---|---|
| GET | /api/v1/confidence-rules/{id} | Get rule detail |
| PATCH | /api/v1/confidence-rules/{id} | Update rule |

### Capability Confidence (2 routes)
| Method | Route | Purpose |
|---|---|---|
| POST | /api/v1/capabilities/{id}/confidence/calculate | Run scoring engine |
| GET | /api/v1/capabilities/{id}/confidence | Get latest assessment |

### Assessment Retrieval (7 routes)
| Method | Route | Purpose |
|---|---|---|
| GET | /api/v1/confidence-assessments/{id} | Get assessment |
| GET | /api/v1/confidence-assessments/{id}/factors | Get factors breakdown |
| GET | /api/v1/confidence-assessments/{id}/blockers | Get blockers |
| GET | /api/v1/confidence-assessments/{id}/explanation | Get human-readable explanation |
| POST | /api/v1/confidence-assessments/{id}/replay | Replay verification |
| POST | /api/v1/confidence-assessments/{id}/recalculate | Create new assessment |
| GET | /api/v1/confidence-assessments/{id}/compare/{otherId} | Compare two assessments |

### Institution Confidence (2 routes)
| Method | Route | Purpose |
|---|---|---|
| GET | /api/v1/institutions/{id}/confidence | Institution summary |
| GET | /api/v1/institutions/{id}/confidence/stale | Stale assessments |

## Key Status Codes
- 200: Success
- 201: Created (new assessment)
- 400: Validation error
- 403: Cross-tenant denial
- 404: Not found
- 409: Governance/model conflict
- 422: Not eligible (structurally valid but ineligible)
- 500: Server error

## Institution Summary (Phase 11)

Returned by GET /institutions/{id}/confidence:
- assessed_capabilities, unassessed_capabilities
- band_distribution (by confidence_band)
- readiness_distribution (by readiness_state)
- stale_count, blocked_count, manual_review_count
- weakest_dimensions, major_evidence_gaps
- composite_score: null (unless methodology is defined)
- methodology_disclosure explaining aggregation

**No unexplained composite score.**