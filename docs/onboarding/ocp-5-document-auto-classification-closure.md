# OCP-5 — Document Auto-Classification Closure

**Sprint:** OCP-5
**Date:** 2026-07-07
**Status:** Complete

---

## Objective

Close the MVP document intake loop so uploaded documents are treated as evidence, classified into useful categories, assigned review status, and connected to Passport/readiness impact.

---

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `apps/web/src/lib/onboarding/document-classifier.ts` | NEW (+410 lines) | Pure document classifier with 17 categories |
| `tests/onboarding/ocp-5-document-classifier.test.ts` | NEW (+340 lines) | 55 tests |

---

## Classification Categories

| Category | Example Documents |
|----------|-----------------|
| `legal_entity_document` | Business License, Registration |
| `pi_medical_license` | PI Medical License, Physician License |
| `cv` | CV, Resume, Biosketch |
| `gcp_training` | GCP Training Certificate |
| `iata_training` | IATA Dangerous Goods Certification |
| `clia_certificate` | CLIA, CAP, COLA Certificate |
| `irb_relationship_or_approval` | IRB Approval Letter |
| `sop` | Standard Operating Procedure |
| `calibration_record` | Calibration Certificate |
| `equipment_record` | IQ/OQ/PQ Equipment Qualification |
| `temperature_log` | Temperature Log, Freezer Log |
| `insurance` | Liability Insurance Certificate |
| `delegation_log` | Site Delegation Log |
| `financial_disclosure` | FDA 1572, Financial Disclosure |
| `study_history_evidence` | Study History Report |
| `audit_or_inspection_evidence` | FDA/EMA Inspection Report |
| `other` | Unclassified document |

---

## Domain Mapping

Each category maps to 1-4 onboarding domains: Institution Identity, People / Roles, Infrastructure, Capabilities, Documents / Evidence, Historical Portfolio, Regulatory / Quality, Passport.

---

## OCP-3 Conditional Rules

- CLIA only required when lab/testing capability is declared
- IATA only required when biospecimen/shipping capability is declared
- IRB not treated as universal institutional requirement
- Expiration unknown ≠ expired

---

## Review Statuses

`uploaded` → `classified` → `needs_review` → `accepted` / `rejected` / `expired_or_outdated` / `restricted` / `linked_to_passport`

---

## Passport Impact

`strengthens_passport` | `supports_declared_capability` | `fills_required_evidence_gap` | `optional_supporting_evidence` | `needs_review_before_impact` | `no_current_passport_impact`

---

## Tests

55 tests covering: all 17 categories, domain mappings, conditional rules (CLIA, IATA), expiration detection, Passport impact, review status, Vilo Research 9-document scenario.
