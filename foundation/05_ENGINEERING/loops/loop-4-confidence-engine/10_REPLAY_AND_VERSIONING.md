# KAD-LOOP-004 — Phases 7-8: Replay & Staleness

## Replay (Phase 7)

`ConfidenceReplayService.replay(assessmentId) → ConfidenceReplayResult`

### What Replay Compares
| Field | Source |
|---|---|
| model_version | Original vs recomputed |
| rule IDs + versions | Original assessment → current state |
| input_snapshot_hash | SHA-256 of all inputs |
| score | Numeric comparison |
| confidence_band | Band assignment |
| readiness_state | Not ready → ready |
| factors | Count + contribution per factor |
| blockers | Count + type per blocker |
| output_hash | SHA-256 of result |

### Replay Rules
- Exact match → match=true, empty differences
- Mismatch → match=false, explicit differences array
- Never replaces original assessment
- Returns replayed_at timestamp

## Staleness (Phase 8)

`ConfidenceStalenessService.detectStale(assessmentId) → { stale, reasons[] }`

### What Triggers Staleness
| Change | Detection Method |
|---|---|
| Capability updated | updated_at > assessment.calculated_at |
| Claim link created | capability_claims.created_at > calculated_at |
| Claim status changed | claims.updated_at > calculated_at |
| Evidence updated | evidence_nodes.updated_at > calculated_at |
| Review outcome changed | review_tasks.updated_at > calculated_at |
| SourceRecord superseded | source_records.updated_at > calculated_at |
| Model version bumped | confidence_models.version > assessment.model_version |
| Rule updated | confidence_rules.updated_at > calculated_at |

### Staleness Rules
- Historical assessments never deleted
- Stale flag + reasons returned, not overwritten
- `isFresh()` → quick boolean check
- `getStaleAssessments()` → all stale for a tenant
- Unrelated upstream changes → assessment remains fresh