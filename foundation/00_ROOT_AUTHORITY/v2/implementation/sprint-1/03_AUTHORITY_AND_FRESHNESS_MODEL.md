# Sprint 1 — Authority & Freshness Model

**Date:** 2026-07-25

---

## Authority Levels

| Level | DB Enum | Meaning | Examples |
|-------|---------|---------|----------|
| T1a | `regulatory` | Public independent evidence | State Board, CLIA, SAM.gov |
| T1b | `authoritative_registry` | Official registry | ClinicalTrials.gov, NPPES, ORCID |
| T2 | `transactional_system` | Execution system | CTMS, EDC, eISF, LMS |
| T3 | `institutional_record` | Institutional documentary | CV, DOA, SOP, CR |
| T4a | `human_attestation` | Human declaration | Site confirmation, expert opinion |
| T4b | `inferred_or_generated` | AI/derived | LLM extraction, heuristic inference |

## Freshness Policies

| Policy | Meaning | Config |
|--------|---------|--------|
| `no_expiration` | Never expires | `{}` |
| `fixed_duration` | Expires after N days | `{max_age_days: 365}` |
| `source_defined` | Source dictates freshness | `{source_dependent: true}` |
| `event_driven` | Expires on trigger event | `{trigger_event: "..."}` |
| `manual_review` | Requires human check | `{review_interval_days: 90}` |

Freshness config is JSONB on `evidence_sources.freshness_policy`.
