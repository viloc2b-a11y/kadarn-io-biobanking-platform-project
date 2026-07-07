# OCP-6 — Historical Portfolio Closure

**Sprint:** OCP-6
**Date:** 2026-07-07
**Status:** Complete

---

## Objective

Close the historical acquisition layer so Kadarn can generate a meaningful Historical Portfolio as part of the Institution Passport. The Passport must separate Current Snapshot from Historical Portfolio.

---

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `apps/web/src/lib/onboarding/historical-portfolio.ts` | NEW (+400 lines) | Pure historical portfolio derivation |
| `tests/onboarding/ocp-6-historical-portfolio.test.ts` | NEW (+240 lines) | 18 tests |

---

## Historical Event Types

| Type | Source |
|------|--------|
| `founding_or_institution_creation` | Canonical founding year |
| `study_experience` | Memory events + classified docs |
| `capability_acquisition` | Current capabilities (derived) |
| `infrastructure_expansion` | Memory events + classified docs |
| `specialty_expansion` | Memory events |
| `certification_or_training_milestone` | Classified docs (GCP, IATA, CLIA) |
| `audit_or_inspection_event` | Classified docs (audit evidence) |
| `vendor_or_lab_relationship` | Memory events |
| `organizational_change` | Memory events + classified docs |
| `operational_achievement` | Memory events |
| `document_backed_history_event` | Classified docs |
| `other` | Unclassified events |

---

## Evidence States

| State | Meaning |
|-------|---------|
| `DECLARED_HISTORY` | Self-declared, no document support |
| `DOCUMENT_BACKED_HISTORY` | Backed by at least one classified document |
| `EXTERNALLY_CONFIRMED_HISTORY` | Confirmed by external source (reserved) |
| `NEEDS_SUPPORTING_EVIDENCE` | Linked evidence exists but not matched |
| `UNKNOWN_DATE` | Event exists but date is missing |
| `INCOMPLETE_CONTEXT` | Event context is insufficient |

---

## Document-to-History Linkage

OCP-5 document categories map to historical event types:
- `study_history_evidence` → `study_experience`
- `audit_or_inspection_evidence` → `audit_or_inspection_event`
- `gcp_training` / `iata_training` / `clia_certificate` → `certification_or_training_milestone`
- `equipment_record` / `calibration_record` / `temperature_log` → `infrastructure_expansion`

---

## Historical Gaps

- Founding date missing
- Study history incomplete
- Capability date unknown
- Specialty expansion not documented
- Evidence support ratio (declared-only > 50%)

---

## Passport Impact

- Declared history strengthens narrative but needs evidence
- Document-backed history strengthens Passport
- Unknown dates reduce historical clarity
- Historical gaps become roadmap actions
- History does NOT inflate readiness scores

---

## Tests

18 tests covering: event types, evidence states, document linkage, gap detection, baseline check, Vilo Research scenario (4 sources: canonical, derived, document, memory).
