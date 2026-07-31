# CLAIM ENTITY SCOPE MATRIX

**Document ID:** WO-KEMS-PROFILE-001 / KPO-CANON-002
**Category:** KPO Canonical — Governance
**Baselines:** WO-KEMS-DOC-001 ACCEPTED, WO-KEMS-DOC-002 ACCEPTED, WO-KEMS-DOC-003 REPORT_READY
**References:** DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md (48 types, 9 primary classes), CLAIM_LIFECYCLE_AND_STATE_MODEL.yml § boundedness_test, SELF_CLAIM_GOVERNANCE_REFERENCE.md § 7 (Bounded Claim Test)
**Version:** 1.0.0 — 2026-07-30

---

## 1. Purpose

This document defines the **entity scope** for every claim category: which entity types a claim can be about, and how scope inheritance propagates through relationships between entities. Every claim in KADARN must answer the question **"WHERE does this claim apply?"** — and the answer MUST be one or more of the seven scoped entity types.

---

## 2. Entity Types

| Entity Type | Definition | Canonical Example | Identifier Pattern |
|---|---|---|---|
| **Institution** | The legal entity operating the site | "Vilo Research Institute" | `did:kadarn:institution:<uuid>` |
| **Location** | A physical site where operations occur | "Houston Clinical Research Unit" | `did:kadarn:location:<uuid>` |
| **Person** | An individual human actor | "Dr. Jane Smith, MD" | `did:kadarn:person:<uuid>` |
| **Equipment** | A specific asset with serial number | "Centrifuge Model 5430R, S/N F-0421" | `did:kadarn:equipment:<uuid>` |
| **Technology System** | An electronic system or platform | "Medidata Rave EDC v2024.1" | `did:kadarn:system:<uuid>` |
| **Program** | A named program spanning studies | "Oncology Early Phase Program" | `did:kadarn:program:<uuid>` |
| **Study** | A specific clinical study / protocol | "Protocol KAD-2026-042" | `did:kadarn:study:<uuid>` |

---

## 3. Claim Category × Entity Scope Matrix

### 3.1 Scope Applicability Table

✅ = Valid scope for this claim category
⬜ = Invalid scope — claim must not be asserted against this entity type
⛓ = Compound scope required (claim requires multiple entity types jointly)

| Claim Category | Institution | Location | Person | Equipment | Tech System | Program | Study |
|---|---|---|---|---|---|---|---|
| **Institutional Identity** | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Institutional License | ✅ | ⛓ (+Location) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Facility Certification | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Insurance Certificate | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| IRB Reliance Information | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Business Continuity Plan | ✅ | ⛓ (+Location) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Emergency Response Plan | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Hazardous Materials | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Clinical Experience** | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | ✅ | ✅ |
| Therapeutic Areas | ⬜ | ⛓ (+Location) | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Study Phase Experience | ⬜ | ⛓ (+Location) | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| PI Credentials (CV, License, Board Cert) | ⬜ | ⛓ (+Location) | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Sub-I / Coordinator Credentials | ⬜ | ⛓ (+Location) | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| GCP / IATA Training | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Staff Training Compliance | ✅ | ⛓ (+Location) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Recruitment Estimates | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ |
| Study Logistics | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ |
| **Lab Infrastructure** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| CLIA Certificate | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| CAP Accreditation | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Lab Capabilities (general) | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Lab SOPs | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| BSL Documentation | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Radiation Safety Certificate | ⬜ | ✅ | ⛓ (+Equipment) | ⬜ | ⬜ | ⬜ | ⬜ |
| **Biospecimen Processing** | ⬜ | ✅ | ⬜ | ⛓ (+Equipment) | ⬜ | ⬜ | ⬜ |
| **Pharmacy** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Pharmacy License | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Controlled-Substance Registration | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Pharmacy Capabilities | ⬜ | ✅ | ⬜ | ⛓ (+Equipment) | ⬜ | ⬜ | ⬜ |
| **Equipment** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Equipment Inventory | ⬜ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| Equipment Calibration | ⬜ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| Preventive Maintenance | ⬜ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| Equipment Qualification (IQ/OQ/PQ) | ⬜ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| Temperature Mapping | ⬜ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| Shipping Equipment Validation | ⬜ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| Backup Power Test Logs | ⬜ | ✅ | ⬜ | ⛓ (+Equipment) | ⬜ | ⬜ | ⬜ |
| Environmental Monitoring | ⬜ | ✅ | ⬜ | ⛓ (+Equipment) | ⬜ | ⬜ | ⬜ |
| **Quality System** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| CAPA Records | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Internal Audit Report | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Quality Metrics | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Alarm / Excursion Logs | ⬜ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| **Technology Systems** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| EMR/EHR System Validation | ⬜ | ⛓ (+Location) | ⬜ | ⬜ | ✅ | ⬜ | ⬜ |
| Data Security Certification | ✅ | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ⬜ |
| 21 CFR Part 11 Compliance | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ⬜ |
| **Regulatory Startup** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Regulatory Compliance (general) | ✅ | ⛓ (+Location) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Sponsor Audit Readiness | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| FDA Inspection History | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Personnel / Contacts** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Staff Directory | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Key Contact Information | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Human Subjects Protection | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| ACLS/BLS Certification | ⬜ | ⛓ (+Location) | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |

### 3.2 Legend for Compound Scope (⛓)

Compound scope means the claim is simultaneously scoped to two entity types. It is invalid if either is missing:

| Claim | Primary Entity | Secondary Entity (Required) | Rationale |
|---|---|---|---|
| Institutional License | Institution | Location | License may be per-location (e.g., state-specific) |
| PI Credentials | Person | Location | License is state/location-specific |
| Therapeutic Areas | Person | Location | PI may have different TA experience at different sites |
| Pharmacy Capabilities | Location | Equipment | Pharmacy capability depends on available equipment |
| Biospecimen Processing | Location | Equipment | Processing capability depends on equipment at location |
| Equipment Calibration | Equipment | Location | Equipment is calibrated at a specific location |
| Environmental Monitoring | Location | Equipment | Monitoring logs are for specific equipment at a location |
| EMR/EHR System Validation | Tech System | Location | System may be validated differently at different sites |
| ACLS/BLS Certification | Person | Location | Certification may be valid at specific facility |

---

## 4. Scope Inheritance Rules

### 4.1 Entity Hierarchy

```
Institution (root)
├── Location (child of Institution)
│   ├── Equipment (child of Location)
│   ├── Person (child of Location, via assignment)
│   └── Technology System (child of Location)
├── Program (child of Institution)
│   └── Study (child of Program)
└── Person (child of Institution, via employment)
```

### 4.2 Inheritance Propagation Rules

```yaml
scope_inheritance:

  rule_1_parent_to_child:
    description: "A claim scoped to a parent entity IS NOT automatically valid for child entities"
    direction: "downward — restricted"
    example: "Institution-level CAP accreditation does NOT automatically mean every location is CAP-accredited"
    enforcement: "Each location must assert its own accreditation claim"
    exception: "Institutional licenses explicitly marked 'institution-wide' propagate to all locations"

  rule_2_child_to_parent:
    description: "A claim scoped to a child entity IS NOT automatically valid for the parent entity"
    direction: "upward — restricted"
    example: "A single calibrated centrifuge does NOT mean the entire lab is 'fully calibrated'"
    enforcement: "Aggregation claims (e.g., 'All equipment at Location X is calibrated') require explicit assertion"
    exception: "Completeness claims can aggregate child claims (e.g., '100% of freezers mapped')"

  rule_3_compound_scope_necessity:
    description: "When a claim requires compound scope (⛓), BOTH entities must be specified"
    example: "PI license claim MUST specify both Person (Dr. Smith) AND Location (Texas)"
    enforcement: "Claim rejected at boundedness test if compound scope is incomplete"
    resolution: "Assert separate claims for each location where the PI is licensed"

  rule_4_location_boundedness:
    description: "Most operational claims are intrinsically location-bounded"
    applies_to: ["Therapeutic Areas", "Study Phase Experience", "Equipment Calibration",
                 "Biospecimen Processing", "Pharmacy Capabilities", "Lab Capabilities"]
    rule: "If a Person can perform a capability at Location A but not Location B,
           two separate claims SHALL be asserted"
    example: "Dr. Smith can perform oncology Phase I at Houston but only Phase III at Dallas.
              Requires two claims: one scoped to Person+Location:Houston, one to Person+Location:Dallas"

  rule_5_equipment_location_binding:
    description: "Equipment claims are always scoped to Equipment + Location"
    rule: "If equipment is moved to a new location, existing calibration/maintenance claims
           at the old location become 'location_stale'; new claims must be asserted at the new location"
    enforcement: "Equipment relocation event triggers automatic review of all equipment claims"

  rule_6_system_institution_binding:
    description: "Technology System claims are scoped to System + Institution"
    rule: "A system validation claim is valid for the institution that operates the system;
           a different institution using the same system brand/version must assert its own claim"
    exception: "Vendor-provided system certifications (e.g., SOC 2) may be shared across institutions"

  rule_7_study_scoping:
    description: "Study-scoped claims are valid only for that specific study/protocol"
    rule: "Claims scoped to a Study SHALL NOT be presented as institutional capability
           for other studies unless explicitly generalized"
    example: "'We enrolled 50 participants in Protocol KAD-2026-042' does NOT imply
             'We can enroll 50 participants in any protocol'"
    enforcement: "Study-scoped claims are flagged STUDY_SPECIFIC and excluded from
                 general institutional profile"
```

### 4.3 Scope Expansion / Restriction Events

| Event | Scope Impact | Action Required |
|---|---|---|
| Person joins new location | Scope expands — new claims needed for new location | Person (or PI) asserts location-specific claims |
| Person leaves location | Claims scoped to Person+Location persist with end-date | Claims marked with `effective_until`; not auto-withdrawn |
| Equipment relocated | Old location claims become location-stale | New claims asserted at new location; old claims marked `superseded` |
| Equipment decommissioned | All equipment claims expire | Auto-transition to `expired`; remove from active inventory |
| New facility opened | New Location entity created | All location-scoped claims must be asserted for new location |
| Facility closed | Location entity archived | All location-scoped claims transition to `withdrawn` |
| Institution acquired/merged | Institution entity changes | Scope review of all institution-scoped claims |
| System upgraded (major version) | Old system claims expire | New system validation claims required for new version |

---

## 5. Compound Scope Validation Algorithm

```
function validate_claim_scope(claim_category, entity_scope[]):
    required_scopes = get_required_scopes(claim_category)

    for each required_scope in required_scopes:
        if required_scope.entity_type not in entity_scope:
            return FAIL("Missing required scope: {required_scope.entity_type}")

    // Verify: no invalid scopes present
    for each scope in entity_scope:
        if scope.entity_type not in get_allowed_scopes(claim_category):
            return FAIL("Invalid scope for {claim_category}: {scope.entity_type}")

    // Verify: compound scopes are consistent
    if claim_category in compound_scope_categories:
        primary = entity_scope[0]
        secondary = entity_scope[1]
        if not relationship_exists(primary, secondary):
            return FAIL("No relationship: {primary.type}:{primary.id} → {secondary.type}:{secondary.id}")

    return PASS(entity_scope)
```

---

## 6. Scope Relationship Validation

| Parent → Child | Valid Relationship? | Example |
|---|---|---|
| Institution → Location | ✅ | "Vilo Research → Houston CRU" |
| Location → Equipment | ✅ | "Houston CRU → Centrifuge F-0421" |
| Location → Person | ✅ (via assignment) | "Houston CRU → Dr. Smith" |
| Location → Technology System | ✅ | "Houston CRU → Medidata Rave instance" |
| Institution → Program | ✅ | "Vilo Research → Oncology Early Phase Program" |
| Program → Study | ✅ | "Oncology Early Phase Program → KAD-2026-042" |
| Institution → Person | ✅ (via employment) | "Vilo Research → Dr. Smith" |
| Equipment → Person | ❌ | Invalid — Equipment is not an organizational parent of Person |
| Person → Equipment | ❌ | Invalid — Person is not an organizational parent of Equipment |
| Study → Equipment | ❌ | Valid only as Usage, not as Scope parent |

---

*CLAIM_ENTITY_SCOPE_MATRIX.md — WO-KEMS-PROFILE-001 — KPO-CANON-002 — 2026-07-30*
