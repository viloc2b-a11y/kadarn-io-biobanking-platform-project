# CLAIM REQUIREMENTS CATALOG

**Document ID:** WO-KEMS-PROFILE-001 / KPO-CANON-004
**Category:** KPO Canonical — Governance
**Baselines:** WO-KEMS-DOC-001 ACCEPTED, WO-KEMS-DOC-002 ACCEPTED, WO-KEMS-DOC-003 REPORT_READY
**References:** DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md (48 types, 9 primary classes), CLAIM_LIFECYCLE_AND_STATE_MODEL.yml (12 states, 7 claim types, boundedness test), SELF_CLAIM_GOVERNANCE_REFERENCE.md § 7 (Bounded Claim Test), CLAIM_ASSERTION_AUTHORITY_MATRIX.md, CLAIM_ENTITY_SCOPE_MATRIX.md, CLAIM_VISIBILITY_AND_PUBLICATION_MATRIX.md
**Version:** 1.0.0 — 2026-07-30
**Total Canonical Claims:** 31

---

## 1. Purpose

This catalog defines every **canonical claim** in the KADARN Self-Claim Governance system. Each claim has a stable `claim_id`, a precise `canonical_statement`, and full metadata governing who can assert it, what evidence supports it, how it decays, and how it publishes. The catalog is the single source of truth for claim validation. Any claim not found here is treated as a `CUSTOM_CLAIM_PROPOSAL` and must pass the full review pipeline.

---

## 2. Claim Metadata Schema

| Field | Type | Description |
|---|---|---|
| `claim_id` | string | Stable, unique identifier (e.g., `KAD-CLAIM-INST-001`) |
| `canonical_statement` | string | The precise, bounded statement this claim makes |
| `claim_type` | enum | From lifecycle model: SELF_DECLARED, DOCUMENT_DERIVED, EXTERNALLY_ASSERTED, OPERATIONALLY_OBSERVED, NEGATIVE_DECLARATION |
| `allowed_asserting_roles` | list | Roles authorized to assert this claim (from Authority Matrix) |
| `entity_scope` | list | Valid entity types for this claim (from Entity Scope Matrix) |
| `required_context` | list | Context fields required by the boundedness test |
| `minimum_evidence` | list | Minimum evidence required to reach `declared_documented` |
| `alternative_evidence` | list | Alternative/additional evidence that strengthens the claim |
| `high_impact` | bool | Whether this claim materially affects feasibility decisions |
| `human_review_required` | bool | Whether this claim always requires human review |
| `decay_policy` | object | Temporal validity: `interval_days`, `reconfirmation_required` |
| `dependencies` | list | Other claim_ids this claim depends on |
| `publication_policy` | object | `default_visibility`, `can_be_projected`, `sponsor_facing` |
| `negative_form` | string | The explicit opposite statement (for NEGATIVE_DECLARATION) |
| `confidence_weight` | float | Base weight from lifecycle model claim_types |

---

## 3. Canonical Claim Catalog

### GROUP A: INSTITUTIONAL IDENTITY (5 claims)

---

#### KAD-CLAIM-INST-001: Institution Exists and Is Licensed

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-INST-001` |
| **canonical_statement** | "`{institution_name}` is a legally established clinical research site operating under license `{license_type}` issued by `{issuing_authority}`, effective `{effective_date}`, valid until `{valid_until}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Site Administrator |
| **entity_scope** | Institution |
| **required_context** | institution_name, license_type, issuing_authority, effective_date, valid_until |
| **minimum_evidence** | Institutional license document (Class: SITE_REUSABLE, DocType #15) |
| **alternative_evidence** | State business registry entry, accreditation body listing |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | None |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{institution_name}` does not hold an active institutional license." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-INST-002: Institution Has IRB Oversight

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-INST-002` |
| **canonical_statement** | "`{institution_name}` has an established IRB reliance relationship with `{irb_name}`, type `{reliance_type}`, effective `{effective_date}`, valid until `{valid_until}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Site Administrator |
| **entity_scope** | Institution |
| **required_context** | institution_name, irb_name, reliance_type (central/local/commercial), effective_date, valid_until |
| **minimum_evidence** | IRB reliance agreement or FWA registration (DocType #18) |
| **alternative_evidence** | IRB roster, OHRP registration |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{institution_name}` does not have an active IRB reliance relationship." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-INST-003: Institution Carries Insurance

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-INST-003` |
| **canonical_statement** | "`{institution_name}` maintains clinical research liability insurance with coverage `{coverage_type}`, effective `{effective_date}`, valid until `{valid_until}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Site Administrator |
| **entity_scope** | Institution |
| **required_context** | institution_name, coverage_type, effective_date, valid_until |
| **minimum_evidence** | Insurance certificate (DocType #20) |
| **alternative_evidence** | Policy declaration page, broker letter |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V4, `can_be_projected`: true, `sponsor_facing`: false |
| **negative_form** | "`{institution_name}` does not maintain clinical research liability insurance." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-INST-004: Location Is Certified for Clinical Research

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-INST-004` |
| **canonical_statement** | "`{location_name}` at `{institution_name}` is certified as a clinical research facility under `{certification_type}`, issued by `{certifying_body}`, effective `{effective_date}`, valid until `{valid_until}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Site Administrator |
| **entity_scope** | Location |
| **required_context** | location_name, institution_name, certification_type, certifying_body, effective_date, valid_until |
| **minimum_evidence** | Facility certification document (DocType #19) |
| **alternative_evidence** | Accreditation body listing, regulatory inspection report |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{location_name}` does not hold an active facility certification for clinical research." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-INST-005: Institution Has Business Continuity Plan

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-INST-005` |
| **canonical_statement** | "`{institution_name}` maintains a business continuity plan, last reviewed `{review_date}`, covering `{covered_scenarios}`. Plan is tested every `{test_interval_days}` days." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Site Administrator |
| **entity_scope** | Institution + Location |
| **required_context** | institution_name, review_date, covered_scenarios, test_interval_days |
| **minimum_evidence** | Business continuity plan document (DocType #25) |
| **alternative_evidence** | Test results, drill logs |
| **high_impact** | 🟡 Medium |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V4, `can_be_projected`: true, `sponsor_facing`: false |
| **negative_form** | "`{institution_name}` does not maintain a business continuity plan." |
| **confidence_weight** | 0.5 |

---

### GROUP B: CLINICAL EXPERIENCE (5 claims)

---

#### KAD-CLAIM-CLIN-001: PI Has Therapeutic Area Experience

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-CLIN-001` |
| **canonical_statement** | "`{pi_name}`, `{credentials}`, has experience as Principal Investigator in `{therapeutic_area}` at `{location_name}`, having conducted `{study_count}` studies enrolling `{participant_count}` participants since `{since_date}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Principal Investigator, Site Administrator (with delegation) |
| **entity_scope** | Person + Location |
| **required_context** | pi_name, credentials, therapeutic_area, location_name, study_count, participant_count, since_date |
| **minimum_evidence** | PI Curriculum Vitae (DocType #1), Medical License (DocType #5) |
| **alternative_evidence** | Study completion documentation, FDA 1572 forms, publication list |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: true, `sponsor_facing`: true |
| **negative_form** | "`{pi_name}` does not have experience as PI in `{therapeutic_area}`." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-CLIN-002: PI Has Study Phase Experience

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-CLIN-002` |
| **canonical_statement** | "`{pi_name}` has served as Principal Investigator on `{phase_count}` `{phase}` clinical trials at `{location_name}`, most recently `{most_recent_study_date}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Principal Investigator |
| **entity_scope** | Person + Location |
| **required_context** | pi_name, phase (I/II/III/IV), phase_count, location_name, most_recent_study_date |
| **minimum_evidence** | PI Curriculum Vitae listing phase experience (DocType #1) |
| **alternative_evidence** | FDA 1572 archive, clinicaltrials.gov investigator listing |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-CLIN-001 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: true, `sponsor_facing`: true |
| **negative_form** | "`{pi_name}` has not served as PI on any `{phase}` clinical trial." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-CLIN-003: PI Holds Active Medical License

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-CLIN-003` |
| **canonical_statement** | "`{pi_name}` holds an active, unrestricted medical license in `{state_region}`, license type `{license_type}`, issued `{issue_date}`, expiring `{expiration_date}`." |
| **claim_type** | EXTERNALLY_ASSERTED_CLAIM |
| **allowed_asserting_roles** | Principal Investigator |
| **entity_scope** | Person + Location |
| **required_context** | pi_name, state_region, license_type, issue_date, expiration_date |
| **minimum_evidence** | Medical license document (DocType #5), verified against state medical board registry |
| **alternative_evidence** | State medical board website verification, NPI registry |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: matches license expiration, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-CLIN-001 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{pi_name}` does not hold an active medical license in `{state_region}`." |
| **confidence_weight** | 1.0 |

---

#### KAD-CLAIM-CLIN-004: PI Is Board Certified

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-CLIN-004` |
| **canonical_statement** | "`{pi_name}` holds board certification in `{specialty}` from `{certifying_board}`, issued `{issue_date}`, valid until `{valid_until}`." |
| **claim_type** | EXTERNALLY_ASSERTED_CLAIM |
| **allowed_asserting_roles** | Principal Investigator |
| **entity_scope** | Person |
| **required_context** | pi_name, specialty, certifying_board, issue_date, valid_until |
| **minimum_evidence** | Board certification document (DocType #6), verified against certifying board registry |
| **alternative_evidence** | Certifying board website verification, hospital credentialing letter |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: matches certification expiry, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-CLIN-003 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{pi_name}` does not hold board certification in `{specialty}`." |
| **confidence_weight** | 1.0 |

---

#### KAD-CLAIM-CLIN-005: Staff Holds GCP Training

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-CLIN-005` |
| **canonical_statement** | "`{staff_name}`, role `{role}`, has completed GCP training on `{completion_date}`, training provider `{provider}`, valid until `{valid_until}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Staff (own), PI (for team), Site Administrator |
| **entity_scope** | Person |
| **required_context** | staff_name, role, completion_date, provider, valid_until |
| **minimum_evidence** | GCP training certificate (DocType #2) |
| **alternative_evidence** | Training LMS record, CITI Program completion report |
| **high_impact** | 🟡 Medium |
| **human_review_required** | ❌ False (self-attestation for own cert; PI attestation for staff) |
| **decay_policy** | `interval_days`: 1095 (3 years), `reconfirmation_required`: true |
| **dependencies** | None |
| **publication_policy** | `default_visibility`: V4, `can_be_projected`: true, `sponsor_facing`: false |
| **negative_form** | "`{staff_name}` has not completed GCP training." |
| **confidence_weight** | 0.5 |

---

### GROUP C: LAB INFRASTRUCTURE (5 claims)

---

#### KAD-CLAIM-LAB-001: Lab Holds CLIA Certification

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-LAB-001` |
| **canonical_statement** | "The laboratory at `{location_name}`, `{institution_name}`, holds CLIA Certificate number `{clia_number}`, certificate type `{cert_type}`, issued `{issue_date}`, expiring `{expiration_date}`." |
| **claim_type** | EXTERNALLY_ASSERTED_CLAIM |
| **allowed_asserting_roles** | Laboratory Director, Site Administrator (with delegation) |
| **entity_scope** | Institution + Location |
| **required_context** | location_name, institution_name, clia_number, cert_type, issue_date, expiration_date |
| **minimum_evidence** | CLIA certificate (DocType #13), verified against CMS CLIA database |
| **alternative_evidence** | CMS CLIA lookup, state health department verification |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 730 (2 years), `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "The laboratory at `{location_name}` does not hold CLIA certification." |
| **confidence_weight** | 1.0 |

---

#### KAD-CLAIM-LAB-002: Lab Holds CAP Accreditation

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-LAB-002` |
| **canonical_statement** | "The laboratory at `{location_name}`, `{institution_name}`, holds CAP Accreditation number `{cap_number}`, last inspection `{last_inspection_date}`, next inspection `{next_inspection_date}`, valid until `{valid_until}`." |
| **claim_type** | EXTERNALLY_ASSERTED_CLAIM |
| **allowed_asserting_roles** | Laboratory Director |
| **entity_scope** | Institution + Location |
| **required_context** | location_name, institution_name, cap_number, last_inspection_date, next_inspection_date, valid_until |
| **minimum_evidence** | CAP accreditation certificate (DocType #14), verified against CAP directory |
| **alternative_evidence** | CAP inspector report summary, CAP online directory verification |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 730 (2 years), `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-LAB-001 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "The laboratory at `{location_name}` does not hold CAP accreditation." |
| **confidence_weight** | 1.0 |

---

#### KAD-CLAIM-LAB-003: Lab Has Active SOPs

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-LAB-003` |
| **canonical_statement** | "The laboratory at `{location_name}` maintains SOP `{sop_title}` (`{sop_id}`, version `{version}`), covering `{sop_scope}`, effective `{effective_date}`, last reviewed `{review_date}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Laboratory Director |
| **entity_scope** | Location |
| **required_context** | location_name, sop_title, sop_id, version, sop_scope, effective_date, review_date |
| **minimum_evidence** | SOP document title page with version and dates (DocType #21) |
| **alternative_evidence** | SOP index/log, SOP review committee minutes |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 730 (2 years), `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-LAB-001 |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "The laboratory at `{location_name}` does not maintain SOP `{sop_id}`." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-LAB-004: Lab Meets Biosafety Level

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-LAB-004` |
| **canonical_statement** | "The laboratory at `{location_name}` is documented and operated at Biosafety Level `{bsl_level}`, covering `{bsl_scope}`, last certified `{certification_date}`, valid until `{valid_until}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Laboratory Director |
| **entity_scope** | Location |
| **required_context** | location_name, bsl_level, bsl_scope, certification_date, valid_until |
| **minimum_evidence** | BSL documentation (DocType #36) |
| **alternative_evidence** | Institutional biosafety committee approval, facility engineering certification |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-LAB-001 |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "The laboratory at `{location_name}` does not meet Biosafety Level `{bsl_level}`." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-LAB-005: Lab Has Radiation Safety Certification

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-LAB-005` |
| **canonical_statement** | "The laboratory at `{location_name}` holds Radiation Safety Certificate `{cert_number}`, issued by `{issuing_body}`, covering equipment `{equipment_list}`, issued `{issue_date}`, expiring `{expiration_date}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Laboratory Director |
| **entity_scope** | Location + Equipment |
| **required_context** | location_name, cert_number, issuing_body, equipment_list, issue_date, expiration_date |
| **minimum_evidence** | Radiation safety certificate (DocType #35) |
| **alternative_evidence** | State radiation control program listing, equipment license |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-LAB-001 |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "The laboratory at `{location_name}` does not hold radiation safety certification for `{equipment_list}`." |
| **confidence_weight** | 0.5 |

---

### GROUP D: BIOSPECIMEN (3 claims)

---

#### KAD-CLAIM-BIO-001: Site Can Process Biospecimens

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-BIO-001` |
| **canonical_statement** | "`{location_name}` can process `{sample_types}` biospecimens using `{processing_methods}`, under SOP `{sop_id}`, with monthly capacity of `{capacity_range}` samples." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Laboratory Director |
| **entity_scope** | Location + Equipment |
| **required_context** | location_name, sample_types, processing_methods, sop_id, capacity_range |
| **minimum_evidence** | SOP covering processing method (DocType #21), equipment qualification records (DocType #29) |
| **alternative_evidence** | Processing logs, training records for processing personnel |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-LAB-003 (relevant SOP), KAD-CLAIM-EQU-003 (equipment qualified) |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: true, `sponsor_facing`: true |
| **negative_form** | "`{location_name}` does not have capability to process `{sample_types}` biospecimens." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-BIO-002: Site Has Validated Storage

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-BIO-002` |
| **canonical_statement** | "`{location_name}` maintains validated `{storage_type}` storage at `{temperature_range}`, with `{capacity_range}` aliquot capacity, across `{freezer_count}` units, last mapped `{last_mapping_date}`, monitored `{monitoring_frequency}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Laboratory Director, Equipment Manager |
| **entity_scope** | Location + Equipment |
| **required_context** | location_name, storage_type, temperature_range, capacity_range, freezer_count, last_mapping_date, monitoring_frequency |
| **minimum_evidence** | Temperature mapping reports (DocType #30) for all storage units |
| **alternative_evidence** | Environmental monitoring logs (DocType #34), equipment qualification records (DocType #29) |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-EQU-003 (equipment qualified), KAD-CLAIM-EQU-001 (equipment inventory) |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: true, `sponsor_facing`: true |
| **negative_form** | "`{location_name}` does not maintain validated `{storage_type}` storage." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-BIO-003: Site Has Shipping Capability

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-BIO-003` |
| **canonical_statement** | "`{location_name}` can ship `{sample_types}` biospecimens under `{shipping_conditions}`, using validated shipping equipment `{equipment_list}`, in compliance with IATA `{iata_compliance_date}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Laboratory Director, Equipment Manager |
| **entity_scope** | Location + Equipment |
| **required_context** | location_name, sample_types, shipping_conditions, equipment_list, iata_compliance_date |
| **minimum_evidence** | Shipping equipment validation (DocType #31), staff IATA training certificates (DocType #3) |
| **alternative_evidence** | Shipping manifests, temperature monitoring during transit |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-EQU-003 (equipment qualified), KAD-CLAIM-CLIN-005 (IATA training for staff) |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{location_name}` does not have validated shipping capability for `{sample_types}`." |
| **confidence_weight** | 0.5 |

---

### GROUP E: PHARMACY (3 claims)

---

#### KAD-CLAIM-PHARM-001: Site Has Pharmacy License

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-PHARM-001` |
| **canonical_statement** | "`{institution_name}` holds Pharmacy License `{license_number}` for `{location_name}`, issued by `{issuing_body}`, effective `{effective_date}`, expiring `{expiration_date}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Site Administrator, Pharmacist (if delegated) |
| **entity_scope** | Institution + Location |
| **required_context** | institution_name, license_number, location_name, issuing_body, effective_date, expiration_date |
| **minimum_evidence** | Pharmacy license document (DocType #16) |
| **alternative_evidence** | State board of pharmacy verification, NABP e-Profile |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: matches license expiry, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{institution_name}` does not hold a pharmacy license for `{location_name}`." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-PHARM-002: Site Has Controlled-Substance Registration

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-PHARM-002` |
| **canonical_statement** | "`{institution_name}` holds Controlled-Substance Registration `{registration_number}` for Schedules `{schedules}`, at `{location_name}`, issued by `{issuing_body}`, effective `{effective_date}`, expiring `{expiration_date}`." |
| **claim_type** | EXTERNALLY_ASSERTED_CLAIM |
| **allowed_asserting_roles** | Site Administrator, Pharmacist (if delegated) |
| **entity_scope** | Institution + Location |
| **required_context** | institution_name, registration_number, schedules, location_name, issuing_body, effective_date, expiration_date |
| **minimum_evidence** | Controlled-substance registration (DocType #17), verified against DEA/state registry |
| **alternative_evidence** | DEA Certificate of Registration, state controlled substance database verification |
| **high_impact** | ✅ True |
| **human_review_required** | ✅ True (restricted evidence class) |
| **decay_policy** | `interval_days`: matches registration expiry, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-PHARM-001 |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{institution_name}` does not hold controlled-substance registration for Schedules `{schedules}`." |
| **confidence_weight** | 1.0 |

---

#### KAD-CLAIM-PHARM-003: Site Has Compounding Capability

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-PHARM-003` |
| **canonical_statement** | "The pharmacy at `{location_name}` can perform `{compounding_type}` compounding under USP `{usp_chapter}`, with `{capacity_statement}`, effective `{effective_date}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Pharmacist (if delegated), Site Administrator (with delegation) |
| **entity_scope** | Location + Equipment |
| **required_context** | location_name, compounding_type, usp_chapter, capacity_statement, effective_date |
| **minimum_evidence** | Pharmacy SOP for compounding, equipment qualification for compounding equipment |
| **alternative_evidence** | Pharmacist compounding certification, USP compliance documentation |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-PHARM-001, KAD-CLAIM-EQU-003 |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "The pharmacy at `{location_name}` does not have `{compounding_type}` compounding capability." |
| **confidence_weight** | 0.5 |

---

### GROUP F: EQUIPMENT (4 claims)

---

#### KAD-CLAIM-EQU-001: Equipment Inventory Exists

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-EQU-001` |
| **canonical_statement** | "`{location_name}` has `{equipment_name}` (`{make}`, `{model}`), asset ID `{asset_id}`, installed `{install_date}`, located in `{room_location}`." |
| **claim_type** | SELF_DECLARED_CLAIM |
| **allowed_asserting_roles** | Equipment Manager |
| **entity_scope** | Location + Equipment |
| **required_context** | location_name, equipment_name, make, model, asset_id, install_date, room_location |
| **minimum_evidence** | Equipment inventory record (no separate document — inventory is the claim) |
| **alternative_evidence** | Purchase order, delivery receipt, asset tag photo |
| **high_impact** | 🟡 Medium |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | None |
| **publication_policy** | `default_visibility`: V4 (with S/N), V2 (make/model only), `can_be_projected`: true, `sponsor_facing`: true |
| **negative_form** | "`{location_name}` does not have `{equipment_name}`." |
| **confidence_weight** | 0.1 |

---

#### KAD-CLAIM-EQU-002: Equipment Is Calibrated

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-EQU-002` |
| **canonical_statement** | "`{equipment_name}` (`{make}`, `{model}`, S/N `{serial_number}`) at `{location_name}` was calibrated on `{calibration_date}` by `{calibrator}`, calibration due `{next_calibration_date}`, calibration standard `{standard}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Equipment Manager |
| **entity_scope** | Equipment + Location |
| **required_context** | equipment_name, make, model, serial_number, location_name, calibration_date, calibrator, next_calibration_date, standard |
| **minimum_evidence** | Equipment calibration record (DocType #27) |
| **alternative_evidence** | Calibration certificate from external vendor, calibration sticker photo |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: matches calibration interval (typically 180–365), `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-EQU-001 |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: true, `sponsor_facing`: true |
| **negative_form** | "`{equipment_name}` at `{location_name}` is not currently calibrated." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-EQU-003: Equipment Is Qualified (IQ/OQ/PQ)

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-EQU-003` |
| **canonical_statement** | "`{equipment_name}` (`{make}`, `{model}`, S/N `{serial_number}`) at `{location_name}` has completed `{qualification_type}` qualification on `{qualification_date}`, performed by `{qualifier}`, protocol `{protocol_ref}`, valid until `{valid_until}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Equipment Manager, Laboratory Director |
| **entity_scope** | Equipment + Location |
| **required_context** | equipment_name, make, model, serial_number, location_name, qualification_type (IQ/OQ/PQ), qualification_date, qualifier, protocol_ref, valid_until |
| **minimum_evidence** | Equipment qualification record (DocType #29) |
| **alternative_evidence** | Vendor qualification report, requalification protocol |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: matches qualification interval (typically 365), `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-EQU-001 |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{equipment_name}` at `{location_name}` has not completed `{qualification_type}` qualification." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-EQU-004: Equipment Has Preventive Maintenance

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-EQU-004` |
| **canonical_statement** | "`{equipment_name}` (`{make}`, `{model}`, S/N `{serial_number}`) at `{location_name}` is on preventive maintenance schedule `{schedule_type}`, last PM `{last_pm_date}`, next PM due `{next_pm_date}`, performed by `{provider}`." |
| **claim_type** | OPERATIONALLY_OBSERVED_CLAIM |
| **allowed_asserting_roles** | Equipment Manager |
| **entity_scope** | Equipment + Location |
| **required_context** | equipment_name, make, model, serial_number, location_name, schedule_type, last_pm_date, next_pm_date, provider |
| **minimum_evidence** | Preventive maintenance record (DocType #28) |
| **alternative_evidence** | PM service contract, PM log, vendor service report |
| **high_impact** | 🟡 Medium |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: matches PM interval (typically 90–365), `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-EQU-001 |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: true, `sponsor_facing`: true |
| **negative_form** | "`{equipment_name}` at `{location_name}` is not on a preventive maintenance schedule." |
| **confidence_weight** | 0.7 |

---

### GROUP G: QUALITY SYSTEM (3 claims)

---

#### KAD-CLAIM-QUAL-001: Quality Metrics Are Tracked

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-QUAL-001` |
| **canonical_statement** | "`{institution_name}` at `{location_name}` tracks quality metrics including `{metric_list}`, reporting period `{period}`, with values `{metric_values}`, benchmarked against `{benchmark}`." |
| **claim_type** | OPERATIONALLY_OBSERVED_CLAIM |
| **allowed_asserting_roles** | Quality Manager |
| **entity_scope** | Institution + Location |
| **required_context** | institution_name, location_name, metric_list, period, metric_values, benchmark |
| **minimum_evidence** | Quality metrics dashboard or report |
| **alternative_evidence** | Internal audit records, management review minutes |
| **high_impact** | 🟡 Medium |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 90, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V4, `can_be_projected`: true, `sponsor_facing`: false |
| **negative_form** | "`{institution_name}` does not track quality metrics at `{location_name}`." |
| **confidence_weight** | 0.7 |

---

#### KAD-CLAIM-QUAL-002: Internal Audits Are Conducted

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-QUAL-002` |
| **canonical_statement** | "`{institution_name}` conducted an internal audit of `{audit_scope}` at `{location_name}` on `{audit_date}`, auditor `{auditor}`, outcome `{outcome}`, next audit scheduled `{next_audit_date}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Quality Manager |
| **entity_scope** | Institution + Location |
| **required_context** | institution_name, audit_scope, location_name, audit_date, auditor, outcome, next_audit_date |
| **minimum_evidence** | Internal audit report (DocType #23) |
| **alternative_evidence** | Audit schedule, audit finding summary, CAPA linkage |
| **high_impact** | 🟡 Medium |
| **human_review_required** | ✅ True (RESTRICTED_EVIDENCE class) |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V5, `can_be_projected`: false, `sponsor_facing`: false |
| **negative_form** | "`{institution_name}` has not conducted an internal audit of `{audit_scope}` at `{location_name}`." |
| **confidence_weight** | 0.5 |

---

#### KAD-CLAIM-QUAL-003: CAPA System Is Active

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-QUAL-003` |
| **canonical_statement** | "`{institution_name}` maintains an active CAPA system. In period `{period}`, `{capa_opened}` CAPAs opened, `{capa_closed}` closed, `{capa_open}` currently open. Most recent CAPA `{recent_capa_id}` was `{recent_capa_type}`." |
| **claim_type** | OPERATIONALLY_OBSERVED_CLAIM |
| **allowed_asserting_roles** | Quality Manager |
| **entity_scope** | Institution + Location |
| **required_context** | institution_name, period, capa_opened, capa_closed, capa_open, recent_capa_id, recent_capa_type |
| **minimum_evidence** | CAPA log or summary (DocType #22) |
| **alternative_evidence** | Quality management review minutes, CAPA system screenshot |
| **high_impact** | 🟡 Medium |
| **human_review_required** | ✅ True (RESTRICTED_EVIDENCE class) |
| **decay_policy** | `interval_days`: 90, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V5, `can_be_projected`: false, `sponsor_facing`: false |
| **negative_form** | "`{institution_name}` does not maintain an active CAPA system." |
| **confidence_weight** | 0.7 |

---

### GROUP H: REGULATORY STARTUP (3 claims)

---

#### KAD-CLAIM-REG-001: Site Has FDA Inspection History

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-REG-001` |
| **canonical_statement** | "`{institution_name}` at `{location_name}` was last inspected by `{regulatory_body}` on `{inspection_date}`, inspection type `{inspection_type}`, outcome `{outcome}` (`{classification}`)." |
| **claim_type** | EXTERNALLY_ASSERTED_CLAIM |
| **allowed_asserting_roles** | Site Administrator, Quality Manager |
| **entity_scope** | Institution + Location |
| **required_context** | institution_name, location_name, regulatory_body, inspection_date, inspection_type, outcome, classification |
| **minimum_evidence** | FDA Form 483 or EIR, inspection close-out letter, or regulatory database entry |
| **alternative_evidence** | FDA inspection classification database, warning letter, establishment inspection report |
| **high_impact** | ✅ True |
| **human_review_required** | ✅ True |
| **decay_policy** | `interval_days`: 1095 (3 years), `reconfirmation_required`: false (historical fact) |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V4, `can_be_projected`: true, `sponsor_facing`: false |
| **negative_form** | "`{institution_name}` has not been inspected by `{regulatory_body}` at `{location_name}`." |
| **confidence_weight** | 1.0 |

---

#### KAD-CLAIM-REG-002: Site Is Sponsor Audit Ready

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-REG-002` |
| **canonical_statement** | "`{institution_name}` at `{location_name}` is sponsor audit ready for `{audit_type}` audits, with `{readiness_statement}`, as of `{assessment_date}`, assessed by `{assessor}`." |
| **claim_type** | SELF_DECLARED_CLAIM |
| **allowed_asserting_roles** | Quality Manager, Site Administrator |
| **entity_scope** | Institution + Location |
| **required_context** | institution_name, location_name, audit_type, readiness_statement, assessment_date, assessor |
| **minimum_evidence** | Readiness self-assessment, previous sponsor audit outcomes |
| **alternative_evidence** | Consultant readiness assessment, mock audit results |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 180, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001, KAD-CLAIM-QUAL-002 |
| **publication_policy** | `default_visibility`: V3, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{institution_name}` is not currently sponsor audit ready for `{audit_type}` audits." |
| **confidence_weight** | 0.1 |

---

#### KAD-CLAIM-REG-003: Site Is 21 CFR Part 11 Compliant

| Field | Value |
|---|---|
| **claim_id** | `KAD-CLAIM-REG-003` |
| **canonical_statement** | "`{system_name}` at `{institution_name}` is validated for 21 CFR Part 11 compliance, validation performed `{validation_date}`, by `{validator}`, covering electronic records and signatures for `{system_scope}`." |
| **claim_type** | DOCUMENT_DERIVED_CLAIM |
| **allowed_asserting_roles** | Quality Manager, Site Administrator |
| **entity_scope** | Technology System + Institution |
| **required_context** | system_name, institution_name, validation_date, validator, system_scope |
| **minimum_evidence** | 21 CFR Part 11 compliance assessment (DocType #39) |
| **alternative_evidence** | System validation package, vendor compliance certificate |
| **high_impact** | ✅ True |
| **human_review_required** | ❌ False |
| **decay_policy** | `interval_days`: 365, `reconfirmation_required`: true |
| **dependencies** | KAD-CLAIM-INST-001 |
| **publication_policy** | `default_visibility`: V2, `can_be_projected`: false, `sponsor_facing`: true |
| **negative_form** | "`{system_name}` is not validated for 21 CFR Part 11 compliance." |
| **confidence_weight** | 0.5 |

---

## 4. Dependency Graph Summary

```
KAD-CLAIM-INST-001 (Institution Licensed)
├── KAD-CLAIM-INST-002 (IRB Oversight)
├── KAD-CLAIM-INST-003 (Insurance)
├── KAD-CLAIM-INST-004 (Facility Certification)
├── KAD-CLAIM-INST-005 (Business Continuity)
├── KAD-CLAIM-CLIN-001 (PI TA Experience)
│   ├── KAD-CLAIM-CLIN-002 (PI Phase Experience)
│   └── KAD-CLAIM-CLIN-003 (PI Medical License)
│       └── KAD-CLAIM-CLIN-004 (PI Board Certification)
├── KAD-CLAIM-LAB-001 (CLIA Cert)
│   ├── KAD-CLAIM-LAB-002 (CAP Accreditation)
│   ├── KAD-CLAIM-LAB-003 (Lab SOPs)
│   │   └── KAD-CLAIM-BIO-001 (Biospecimen Processing)
│   ├── KAD-CLAIM-LAB-004 (BSL Level)
│   └── KAD-CLAIM-LAB-005 (Radiation Safety)
├── KAD-CLAIM-PHARM-001 (Pharmacy License)
│   ├── KAD-CLAIM-PHARM-002 (Controlled Substance)
│   └── KAD-CLAIM-PHARM-003 (Compounding)
│       └── KAD-CLAIM-EQU-003 (Equipment Qualified)
├── KAD-CLAIM-EQU-001 (Equipment Inventory)
│   ├── KAD-CLAIM-EQU-002 (Calibration)
│   ├── KAD-CLAIM-EQU-003 (Qualification)
│   │   ├── KAD-CLAIM-BIO-002 (Validated Storage)
│   │   └── KAD-CLAIM-BIO-003 (Shipping Capability)
│   └── KAD-CLAIM-EQU-004 (Preventive Maintenance)
├── KAD-CLAIM-QUAL-001 (Quality Metrics)
├── KAD-CLAIM-QUAL-002 (Internal Audits)
│   └── KAD-CLAIM-REG-002 (Audit Readiness)
├── KAD-CLAIM-QUAL-003 (CAPA System)
└── KAD-CLAIM-REG-001 (FDA Inspection History)
    └── KAD-CLAIM-REG-003 (21 CFR Part 11)
```

---

## 5. Claim Dependencies: Degradation Rules

When a dependency claim degrades or expires, dependent claims are affected:

| Dependency Event | Effect on Dependent Claim | Action |
|---|---|---|
| `INST-001` expires | ALL dependent claims degrade to `confidence: 0` | All claims marked `pending_attestation` |
| `LAB-001` (CLIA) expires | `LAB-002` (CAP), `LAB-003` (SOPs), `LAB-004` (BSL), `LAB-005` (Radiation) all degrade | All lab claims suspended |
| `EQU-001` (Equipment Inventory) equipment decommissioned | `EQU-002` (Calibration), `EQU-003` (Qualification), `EQU-004` (PM) all become `not_applicable` | Equipment claims auto-expire |
| `CLIN-003` (PI License) expires | `CLIN-001` (TA Experience) still valid historically; `CLIN-004` (Board Cert) may be independently valid | PI experience claims retain history; license-dependent claims flagged |
| `PHARM-001` (Pharmacy License) expires | `PHARM-002` (Controlled Substance), `PHARM-003` (Compounding) both degrade | All pharmacy claims suspended |
| `LAB-003` (SOP) superseded | `BIO-001` (Biospecimen Processing) degrades to `declared_unsupported` | Re-assert BIO-001 against new SOP version |

---

## 6. Summary Statistics

| Group | Count | High Impact | Human Review Required | Average Decay (days) |
|---|---|---|---|---|
| A: Institutional Identity | 5 | 4 | 0 | 365 |
| B: Clinical Experience | 5 | 4 | 0 | 365–1095 |
| C: Lab Infrastructure | 5 | 5 | 0 | 365–730 |
| D: Biospecimen | 3 | 3 | 0 | 365 |
| E: Pharmacy | 3 | 3 | 1 | 365 |
| F: Equipment | 4 | 2 | 0 | 90–365 |
| G: Quality System | 3 | 0 | 2 | 90–365 |
| H: Regulatory Startup | 3 | 3 | 1 | 180–1095 |
| **TOTAL** | **31** | **24** | **4** | — |

---

*CLAIM_REQUIREMENTS_CATALOG.md — WO-KEMS-PROFILE-001 — KPO-CANON-004 — 2026-07-30*
