# CLAIM VISIBILITY AND PUBLICATION MATRIX

**Document ID:** WO-KEMS-PROFILE-001 / KPO-CANON-003
**Category:** KPO Canonical — Governance
**Baselines:** WO-KEMS-DOC-001 ACCEPTED, WO-KEMS-DOC-002 ACCEPTED, WO-KEMS-DOC-003 REPORT_READY
**References:** SELF_CLAIM_GOVERNANCE_REFERENCE.md § 11 (Claim Publication and Visibility), DOCUMENT_TAXONOMY_CLASSIFICATION_MATRIX.md (RESTRICTED_EVIDENCE class), CLAIM_LIFECYCLE_AND_STATE_MODEL.yml § confidence_rules
**Version:** 1.0.0 — 2026-07-30

---

## 1. Purpose

This document defines the **visibility and publication rules** for every claim category. Not all claims are equally visible. The matrix enforces the principle: **claims that cannot be externally verified must not be externally published as verified.** It governs what appears on the institutional Passport (public-facing profile) versus what appears in a sponsor-facing feasibility package, and defines projection rules that transform detailed internal claims into summary-level external claims.

---

## 2. Visibility Levels

| Level | Label | Audience | Description |
|---|---|---|---|
| **V1** | `public` | Anyone on the internet | Openly published; no authentication required |
| **V2** | `network_visible` | KADARN network members | Visible to authenticated KADARN institutions and sponsors |
| **V3** | `recipient_authorized` | Named recipient (sponsor, CRO) | Visible only to specifically authorized counterparties |
| **V4** | `internal` | Institution members only | Visible within the asserting institution; not externally accessible |
| **V5** | `restricted` | Named internal roles | Visible only to specific authorized internal roles (e.g., Site Admin, Quality Mgr) |

---

## 3. Claim Category × Visibility Matrix

| Claim Category | Default Visibility | Can Be Projected | Redaction Required | Sponsor Facing |
|---|---|---|---|---|
| **Institutional Identity** | | | | |
| Institution Name / Type | V1 — public | No (identity is not summarizable) | No | ✅ Yes |
| Institutional License | V2 — network_visible | No | No | ✅ Yes — license category shown |
| Facility Certification | V2 — network_visible | No | No | ✅ Yes |
| IRB Reliance Information | V2 — network_visible | No | No | ✅ Yes |
| Insurance Certificate | V4 — internal | No | ✅ Yes — policy numbers redacted | ❌ No — internal only |
| Business Continuity Plan | V4 — internal | ✅ Yes — summary only | ✅ Yes — vendor names, recovery times | ❌ No — summary may be shared |
| Emergency Response Plan | V3 — recipient_authorized | ✅ Yes — capability summary | ✅ Yes — specific procedures | 🟡 Summary only |
| Hazardous Materials | V2 — network_visible | No | ✅ Yes — exact quantities | ✅ Yes — classes present |
| **Clinical Experience** | | | | |
| Therapeutic Areas | V1 — public | No | No | ✅ Yes |
| Study Phase Experience | V2 — network_visible | No | No | ✅ Yes |
| PI Credentials (CV Summary) | V2 — network_visible | ✅ Yes — full CV → summary profile | ✅ Yes — PII from full CV | ✅ Yes — summary profile |
| PI Licenses | V2 — network_visible | No | ✅ Yes — license numbers | ✅ Yes — specialty + state |
| Board Certification | V2 — network_visible | No | No | ✅ Yes |
| Staff GCP Training Status | V4 — internal | ✅ Yes — aggregate compliance % | ✅ Yes — individual names | 🟡 Aggregate only |
| Recruitment Estimates | V4 — internal | ✅ Yes — range instead of exact | ✅ Yes — exact numbers | 🟡 Ranges only |
| Study Logistics | V3 — recipient_authorized | No | No | ✅ Yes — per-study |
| **Lab Infrastructure** | | | | |
| CLIA Certificate | V2 — network_visible | No | ✅ Yes — certificate number | ✅ Yes — CLIA status |
| CAP Accreditation | V2 — network_visible | No | No | ✅ Yes |
| Lab Capabilities (general) | V2 — network_visible | ✅ Yes — detailed → capability summary | No | ✅ Yes |
| Lab SOPs (titles/versions) | V3 — recipient_authorized | No | ✅ Yes — full SOP content | 🟡 Titles + dates only |
| BSL Documentation | V3 — recipient_authorized | No | No | ✅ Yes |
| Radiation Safety Certificate | V3 — recipient_authorized | No | ✅ Yes — license details | ✅ Yes — status only |
| **Biospecimen Processing** | | | | |
| Biospecimen Processing Capabilities | V2 — network_visible | ✅ Yes — detailed → summary | ✅ Yes — specific SOP references | ✅ Yes — summary |
| Processing Volumes (exact) | V4 — internal | ✅ Yes — ranges | ✅ Yes — exact counts | 🟡 Ranges only |
| Storage Capacity | V3 — recipient_authorized | ✅ Yes — capacity range | ✅ Yes — exact aliquot counts | 🟡 Ranges only |
| **Pharmacy** | | | | |
| Pharmacy License | V2 — network_visible | No | ✅ Yes — license number | ✅ Yes — status only |
| Controlled-Substance Registration | V3 — recipient_authorized | No | ✅ Yes — DEA number | ✅ Yes — schedule levels |
| Pharmacy Capabilities (detailed) | V3 — recipient_authorized | ✅ Yes — detailed → summary | ✅ Yes — vendor relationships | ✅ Yes — summary |
| Compounding Capabilities | V3 — recipient_authorized | No | ✅ Yes — specific formulations | ✅ Yes — capability yes/no |
| **Equipment** | | | | |
| Equipment Inventory (make/model) | V2 — network_visible | No | No | ✅ Yes |
| Equipment Inventory (serial numbers) | V4 — internal | No | ✅ Yes — S/N redacted externally | ❌ No |
| Equipment Calibration Records | V3 — recipient_authorized | ✅ Yes — status only | ✅ Yes — dates + S/N | 🟡 Calibration status only |
| Preventive Maintenance Records | V3 — recipient_authorized | ✅ Yes — status only | ✅ Yes — dates + S/N | 🟡 PM status only |
| Equipment Qualification (IQ/OQ/PQ) | V3 — recipient_authorized | No | ✅ Yes — vendor names | ✅ Yes — qualification status |
| Temperature Mapping Reports | V3 — recipient_authorized | ✅ Yes — summary | ✅ Yes — raw data points | 🟡 Mapping status only |
| Shipping Equipment Validation | V3 — recipient_authorized | No | No | ✅ Yes |
| Backup Power Test Logs | V4 — internal | ✅ Yes — summary | ✅ Yes — raw logs | 🟡 Status only |
| Environmental Monitoring Logs | V4 — internal | ✅ Yes — summary statistics | ✅ Yes — raw data | ❌ No — internal only |
| **Quality System** | | | | |
| CAPA Records | V5 — restricted | ❌ No | ✅ Yes — full content always redacted | ❌ No — never sponsor-facing |
| Internal Audit Reports | V5 — restricted | ❌ No | ✅ Yes — full content always redacted | ❌ No — never sponsor-facing |
| Quality Metrics (high-level) | V4 — internal | ✅ Yes — aggregated trends | ✅ Yes — individual metrics | 🟡 Aggregate trends only |
| Alarm / Excursion Logs | V5 — restricted | ✅ Yes — summary of excursions | ✅ Yes — all raw data | ❌ No — internal only |
| **Technology Systems** | | | | |
| EMR/EHR System Validation | V3 — recipient_authorized | No | ✅ Yes — system architecture details | ✅ Yes — validation status |
| Data Security Certification | V2 — network_visible | No | No | ✅ Yes |
| 21 CFR Part 11 Compliance | V2 — network_visible | No | No | ✅ Yes |
| **Regulatory Startup** | | | | |
| Regulatory Compliance (general) | V2 — network_visible | No | No | ✅ Yes |
| Sponsor Audit Readiness | V3 — recipient_authorized | No | ✅ Yes — specific audit dates | ✅ Yes |
| FDA Inspection History | V4 — internal | ✅ Yes — summary of outcomes | ✅ Yes — specific findings | 🟡 Outcome summary |

---

## 4. Projection Rules: Detailed → Summary

### 4.1 Projection Mapping

The `can_be_projected` flag indicates that a detailed claim has a summary-level representation suitable for wider audiences. The projection rules are:

```yaml
projection_rules:
  rule_identity_preservation:
    description: "A projected claim MUST preserve the claim_category and entity_scope"
    example: "Equipment calibration claim projected from Equipment+Location remains Equipment+Location"

  rule_detail_degradation:
    description: "Projection reduces precision without falsifying the claim"
    allowed_transformations:
      - "Exact numbers → rounded ranges"
      - "Serial numbers → make/model only"
      - "Date ranges → status only (current/expired)"
      - "Raw data → summary statistics"
      - "Full document → metadata only"
    prohibited_transformations:
      - "Changing the claim statement's truth value"
      - "Projecting a NO/negative into a YES"
      - "Removing entity scope"
      - "Removing temporal validity bounds"

  rule_redaction_marking:
    description: "Every projected claim MUST carry a 'projected_from' reference"
    metadata:
      - "projected: true"
      - "projected_from: original_claim_id"
      - "projection_level: summary | status_only | aggregate"
      - "detail_available: V3 or V4 (the visibility level at which full detail is available)"

  rule_sponsor_package_projection:
    description: "Claims included in a sponsor package are projected to V3 (recipient_authorized)"
    transformations:
      - "V1/V2 claims → passed through unchanged"
      - "V3 claims → passed through unchanged"
      - "V4 claims → projected to summary (if can_be_projected) or excluded"
      - "V5 claims → NEVER included in sponsor package"

  rule_passport_projection:
    description: "The public Passport shows V1 (public) claims directly; V2+ claims as projected summaries"
    transformations:
      - "V1 claims → shown in full"
      - "V2 claims → shown in full for authenticated KADARN members"
      - "V3 claims → shown as projection status + 'Available on Request'"
      - "V4/V5 claims → NEVER shown on Passport"
```

### 4.2 Projection Examples

| Original (Internal, V4) | Projected (Sponsor, V3) |
|---|---|
| "Centrifuge 5430R S/N F-0421 calibrated 2026-06-15 by BioCal Inc., next due 2026-12-15" | "All centrifuges at Houston CRU: calibration current (last verified Q2 2026)" |
| "Stored 187,342 aliquots across 3 -80°C freezers (S/N: F-001, F-002, F-003)" | "Validated ultra-low-temperature storage: 150K–200K aliquot capacity" |
| "CAPA-2026-042: Nonconformance in centrifuge log documentation. Root cause: training gap. Corrective action: retraining completed 2026-07-01" | ❌ NEVER projected — CAPA is V5 restricted |
| "Enrolled 47 participants in oncology studies in 2025 (12 Phase I, 35 Phase II/III)" | "Oncology enrollment capacity: 30–50 participants/year across all phases" |
| "Dr. Smith, MD, License TX-MD-004217, exp 2027-03-15, Board Certified Oncology" | "Board-certified oncologist (TX-licensed, expires 2027)" |

---

## 5. Publication Policy: Passport vs. Sponsor Package

### 5.1 Institutional Passport

The Passport is the publicly visible or network-visible profile. It is auto-generated from claims.

| Included in Passport | Condition |
|---|---|
| All V1 (public) claims | Always included, full detail |
| All V2 (network_visible) claims | Included for authenticated KADARN members |
| V3 claims (projected) | Shown as "Available on Request" with projection status |
| V4/V5 claims | NEVER included |
| Disputed claims | Shown with dispute flag + both sources cited |
| Expired claims | Removed from Passport; preserved as history |
| Superseded claims | NOT shown; only latest version visible |
| Not Applicable claims | Shown as "Not Applicable" for completeness |
| Declared Unsupported claims | Shown with low-confidence indicator |

### 5.2 Sponsor Feasibility Package

The Sponsor Package is assembled on-demand for a specific sponsor/protocol.

| Included in Sponsor Package | Condition |
|---|---|
| All V1/V2 claims relevant to protocol | Included in full |
| V3 claims relevant to protocol | Included in full (sponsor is the authorized recipient) |
| V4 claims (projected) | Included as projection if `can_be_projected` and `sponsor_facing` |
| V5 claims | NEVER included |
| Verified claims (confidence ≥ 0.7) | Included with HIGH confidence indicator |
| Declared Documented claims (confidence 0.3–0.7) | Included with MODERATE confidence indicator |
| Declared Unsupported claims (confidence < 0.3) | Included with LOW confidence indicator + caveat |
| Disputed claims | Excluded from package; sponsor notified of exclusion |
| Expired claims | Excluded from package |
| Negative Declarations | Included — useful for qualification filtering |

### 5.3 Package Assembly Rules

```yaml
package_assembly:
  protocol_binding:
    rule: "Only include claims scoped to entities relevant to the protocol"
    entity_filter:
      - "Location: where the study will be conducted"
      - "Person: named PI and key personnel"
      - "Equipment: equipment required by protocol"
      - "Tech System: systems required by protocol"
      - "Program/Study: if study-scoped claims exist"

  confidence_threshold:
    rule: "Claims below confidence threshold SHALL carry explicit caveats"
    verified_threshold: 0.7
    documented_threshold: 0.3
    below_documented: "Includes warning: 'This claim has not been independently verified'"

  temporal_validity:
    rule: "Claims that will expire during the projected study period SHALL be flagged"
    action: "Annotate with 'EXPIRES_DURING_STUDY' if valid_until < study_end_date"
    recommendation: "Sponsor may request re-verification before expiry"

  completeness_statement:
    rule: "Every package SHALL include a completeness statement"
    content:
      - "Total claims included: N"
      - "By confidence: verified=X, documented=Y, declared=Z"
      - "Excluded: disputed=A, expired=B, restricted=C"
      - "Not applicable claims: D (listed for completeness)"
```

---

## 6. Redaction Rules

| Data Type | Always Redact | Redact for V3+ | Redact for V2+ | Never Redact |
|---|---|---|---|---|
| Person Names | ✅ (non-PI staff) | ✅ (Sub-I names) | ❌ (PI name is public) | PI name for V1+ |
| License Numbers | ✅ (all visibility) | — | — | — |
| Serial Numbers | ✅ (V2+ public) | ✅ (sponsor-facing) | ❌ (internal use) | — |
| Exact Counts | ✅ (V2+ public) | ✅ (sponsor-facing) | ❌ (network_visible ranges) | — |
| Financial Data | ✅ (all visibility) | — | — | — |
| Vendor Names | ✅ (public, network) | 🟡 (sponsor if competitive) | ❌ (internal use) | — |
| Audit Findings Detail | ✅ (all visibility) | — | — | — |
| CAPA Root Cause | ✅ (all visibility) | — | — | — |
| SOP Full Content | ✅ (all external) | ✅ (sponsor-facing) | ❌ (network: titles only) | — |
| PII (addresses, phones) | ✅ (all external) | ✅ (sponsor-facing) | ❌ (network: business contact only) | — |
| Proprietary Workflows | ✅ (all external) | ✅ (sponsor-facing) | ❌ (internal only) | — |
| Institution Name | ❌ | ❌ | ❌ | ✅ (always visible) |
| Claim Category | ❌ | ❌ | ❌ | ✅ (always visible) |
| Confidence Level | ❌ | ❌ | ❌ | ✅ (always visible) |
| Effective Dates | ❌ | ❌ | ❌ | ✅ (always visible) |

---

## 7. Visibility State Transitions

```yaml
visibility_transitions:
  - trigger: "claim_verified"
    from_visibility: "V4 (internal)"
    to_visibility: "V2 (network_visible)"
    condition: "External verification source is authentic"
    review_required: true

  - trigger: "claim_disputed"
    from_visibility: "any"
    to_visibility: "unchanged + dispute_flag"
    action: "Add dispute annotation; DO NOT hide claim"
    review_required: true

  - trigger: "claim_expired"
    from_visibility: "any"
    to_visibility: "removed_from_passport; preserved_as_history"
    action: "Remove from active Passport; archive with visibility history"

  - trigger: "claim_withdrawn"
    from_visibility: "any"
    to_visibility: "removed_from_all_publications"
    action: "Remove from all external surfaces; retain internal audit copy"

  - trigger: "sponsor_access_revoked"
    from_visibility: "V3 (recipient_authorized)"
    to_visibility: "revoked_for_that_recipient"
    action: "Sponsor loses access; other authorized recipients unaffected"

  - trigger: "upgrade_to_public"
    from_visibility: "V2 or V3"
    to_visibility: "V1 (public)"
    condition: "Site Admin explicitly authorizes public visibility"
    review_required: true
```

---

## 8. Audit Trail for Visibility Changes

Every visibility change MUST be recorded:

```yaml
visibility_audit_entry:
  claim_id: "uuid:claim-001"
  timestamp: "2026-07-30T14:00:00Z"
  action: "visibility_changed"
  from_visibility: "V4"
  to_visibility: "V2"
  reason: "External verification received from CAP registry"
  authorized_by: "uuid:person:lab-director"
  projected_from: null  # set if this is a projection
```

---

*CLAIM_VISIBILITY_AND_PUBLICATION_MATRIX.md — WO-KEMS-PROFILE-001 — KPO-CANON-003 — 2026-07-30*
