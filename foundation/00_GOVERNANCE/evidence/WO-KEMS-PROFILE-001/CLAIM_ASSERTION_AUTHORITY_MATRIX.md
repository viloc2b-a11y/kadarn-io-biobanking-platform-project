# CLAIM ASSERTION AUTHORITY MATRIX

**Document ID:** WO-KEMS-PROFILE-001 / KPO-CANON-001
**Category:** KPO Canonical — Governance
**Baselines:** WO-KEMS-DOC-001 ACCEPTED, WO-KEMS-DOC-002 ACCEPTED, WO-KEMS-DOC-003 REPORT_READY
**References:** CLAIM_LIFECYCLE_AND_STATE_MODEL.yml § Assertion Authority, SELF_CLAIM_GOVERNANCE_REFERENCE.md § 2 (Attestix UCAN Delegation)
**Version:** 1.0.0 — 2026-07-30

---

## 1. Purpose

This document defines **who can assert what** within the KADARN Self-Claim Governance system. It maps every authorized role against all claim categories, specifying authority levels, delegation rules, attestation requirements, and review gates. The matrix implements the principle: **every claim has a known, authorized asserter whose scope is bounded, reviewable, and temporal.**

---

## 2. Assertion Authority Matrix

### 2.1 Role × Claim Category × Authority Level

| Role | Claim Category | Can Declare | Cannot Declare | Requires Delegation | Attestation Level | Review Required |
|---|---|---|---|---|---|---|
| **Site Administrator** | Institutional Identity | ✅ | — | No | Institutional | No |
| **Site Administrator** | Locations | ✅ | — | No | Institutional | No |
| **Site Administrator** | Contacts / General Information | ✅ | — | No | Institutional | No |
| **Site Administrator** | Clinical Experience | ❌ | ✅ | Yes (from PI) | Institutional | Yes |
| **Site Administrator** | Lab Certifications | ❌ | ✅ | Yes (from Lab Director) | Institutional | Yes |
| **Site Administrator** | Equipment Certifications | ❌ | ✅ | Yes (from Equipment Mgr) | Institutional | Yes |
| **Site Administrator** | Regulatory Compliance | ❌ | ✅ | Yes (from Quality Mgr) | Institutional | Yes |
| **Site Administrator** | Pharmacy Capabilities | ❌ | ✅ | Yes (from Pharmacist) | Institutional | Yes |
| **Site Administrator** | Technology Systems | ✅ (basic) | Detailed system validation | No | Institutional | No |
| **Principal Investigator** | Clinical Experience | ✅ | — | No | Professional | No |
| **Principal Investigator** | Therapeutic Areas | ✅ | — | No | Professional | No |
| **Principal Investigator** | Study Phase Experience | ✅ | — | No | Professional | No |
| **Principal Investigator** | Own Credentials (CV, License, Board Cert) | ✅ | — | No | Professional | No |
| **Principal Investigator** | Research Personnel (Sub-Is, Coordinators) | ✅ | — | No | Professional | Yes (for others' credentials) |
| **Principal Investigator** | Institutional Licenses | ❌ | ✅ | Yes (from Site Admin) | Professional | Yes |
| **Principal Investigator** | Equipment Certifications | ❌ | ✅ | Yes (from Equipment Mgr) | Professional | Yes |
| **Principal Investigator** | Pharmacy Capabilities | ❌ | ✅ | Yes (from Pharmacist) | Professional | Yes |
| **Principal Investigator** | Lab Capabilities (general) | ✅ (non-cert) | Lab certifications specifically | No | Professional | No |
| **Laboratory Director** | Lab Capabilities | ✅ | — | No | Technical | No |
| **Laboratory Director** | Lab Certifications (CLIA, CAP, etc.) | ✅ | — | No | Technical | No |
| **Laboratory Director** | Lab Equipment Inventory | ✅ | — | No | Technical | No |
| **Laboratory Director** | Lab SOPs | ✅ | — | No | Technical | No |
| **Laboratory Director** | Biospecimen Processing | ✅ | — | No | Technical | No |
| **Laboratory Director** | Clinical Experience | ❌ | ✅ | — | — | — |
| **Laboratory Director** | Pharmacy | ❌ | ✅ | — | — | — |
| **Laboratory Director** | Regulatory Startup | ❌ | ✅ | — | — | — |
| **Equipment Manager** | Equipment Inventory | ✅ | — | No | Operational | No |
| **Equipment Manager** | Equipment Calibration Records | ✅ | — | No | Operational | No |
| **Equipment Manager** | Equipment Maintenance Records | ✅ | — | No | Operational | No |
| **Equipment Manager** | Equipment Qualification (IQ/OQ/PQ) | ✅ | — | No | Operational | No |
| **Equipment Manager** | Temperature Mapping | ✅ | — | No | Operational | No |
| **Equipment Manager** | Lab Certifications | ❌ | ✅ | — | — | — |
| **Equipment Manager** | Clinical Claims | ❌ | ✅ | — | — | — |
| **Quality Manager** | CAPA Records | ✅ | — | No | Internal | No |
| **Quality Manager** | Internal Audit Reports | ✅ | — | No | Internal | Yes (publication restricted) |
| **Quality Manager** | Quality Metrics | ✅ | — | No | Internal | No |
| **Quality Manager** | Clinical Claims | ❌ | ✅ | — | — | — |
| **Quality Manager** | Investigator Credentials | ❌ | ✅ | — | — | — |
| **Study Coordinator** | Study Logistics | ✅ | — | No | Professional | No |
| **Study Coordinator** | Recruitment Estimates | ✅ | — | No | Professional | Yes |
| **Study Coordinator** | Staff Availability | ✅ | — | No | Professional | No |
| **Study Coordinator** | Institutional Certifications | ❌ | ✅ | — | — | — |
| **Study Coordinator** | PI Credentials | ❌ | ✅ | — | — | — |
| **Staff (General)** | Personal Credentials (own CV, GCP, IATA) | ✅ | — | No | Personal | Yes (attestation required) |
| **Staff (General)** | Any Institutional Claim | ❌ | ✅ | — | — | — |
| **Staff (General)** | Any Clinical Claim | ❌ | ✅ | — | — | — |
| **Staff (General)** | Any Lab Claim | ❌ | ✅ | — | — | — |
| **Staff (General)** | Any Equipment Claim | ❌ | ✅ | — | — | — |

### 2.2 Attestation Level Definitions

| Level | Description | Signature Required | Evidence Required | May Self-Attest |
|---|---|---|---|---|
| **Personal** | Individual asserts own credential or status | Person-level attestation | Supporting document (certificate, license) | Yes — own credentials only |
| **Operational** | Role asserts operational facts within their domain | Role-level attestation | Supporting records (logs, calibration certs) | Yes — within domain |
| **Professional** | Licensed professional asserts domain facts | Role + license attestation | License verification + supporting evidence | Yes — within licensed scope |
| **Technical** | Technical authority asserts lab/equipment facts | Role + certification attestation | Certification evidence + supporting records | Yes — within certified scope |
| **Internal** | Internal quality/audit role asserts quality facts | Role attestation | Internal records (audit reports, CAPA logs) | Yes — restricted publication |
| **Institutional** | Senior institutional authority asserts org-level facts | Multi-factor attestation | Institutional documents (licenses, registrations) | Yes — institutional scope |

### 2.3 Delegation Capability Matrix

| Delegator → Delegatee | Allowed Categories | Attenuation Required | Maximum Expiry | Chain Verification |
|---|---|---|---|---|
| Site Admin → PI | Clinical Experience, Therapeutic Areas | Can limit to specific TA or phase | 365 days | Full chain |
| Site Admin → Lab Director | Lab Certifications, Lab Capabilities | Can limit to specific lab/location | 365 days | Full chain |
| Site Admin → Equipment Mgr | Equipment Inventory, Calibration | Can limit to equipment class or location | 365 days | Full chain |
| Site Admin → Quality Mgr | Quality Metrics, Audit Findings | Cannot delegate CAPA authority further | 365 days | Full chain |
| PI → Sub-Investigator | Subset of PI clinical claims | Must attenuate: specific studies, TAs | 180 days | Full chain |
| PI → Study Coordinator | Study Logistics, Recruitment | Must attenuate: specific study only | Duration of study + 90 days | Full chain |
| Lab Director → Lab Technician | Lab Equipment, SOP execution | Must attenuate: specific equipment, SOPs | 180 days | Full chain |

---

## 3. UCAN-Style Delegation Rules

### 3.1 Core Principles

```yaml
delegation_rules:
  principle_1_capability_attenuation:
    rule: "A delegate's authority SHALL be a subset of the delegator's own authority scope"
    formal: "∀ c ∈ delegate.capabilities : c ∈ delegator.capabilities"
    example: "PI cannot delegate pharmacy claims because PI cannot declare pharmacy claims"
    enforcement: "Delegation request is rejected at creation if scope exceeds delegator's scope"

  principle_2_no_authority_amplification:
    rule: "Delegation SHALL NOT expand the delegator's own authority"
    formal: "delegate.authority_scope ⊆ delegator.authority_scope"
    enforcement: "Chain verification walks from leaf to root; any node with scope ⊃ parent is invalid"

  principle_3_temporal_boundedness:
    rule: "Every delegation SHALL have an expiry date; auto-revoked unless renewed"
    formal: "delegation.expires_at ≤ delegator.credential_expires_at"
    default_max_duration: "365 days (Site Admin → PI/Lab Director)"
    shorter_max_duration: "180 days (PI → Sub-I, Lab Director → Technician)"
    enforcement: "Claim rejected if asserted under expired delegation"

  principle_4_chain_verification:
    rule: "The full delegation chain SHALL be verified before any claim is accepted"
    verification_steps:
      - "Walk from asserting actor up to root authority (Site Administrator)"
      - "At each hop, verify: delegate scope ⊆ delegator scope"
      - "At each hop, verify: delegation is not expired"
      - "At each hop, verify: delegation has not been revoked"
      - "Reject claim if any link in chain fails verification"
    audit_trail: "Full chain stored with claim; available for audit/review"

  principle_5_revocation_propagation:
    rule: "Revoking a delegation SHALL invalidate all sub-delegations derived from it"
    propagation: "Cascading — if Site Admin revokes PI's delegation, all Sub-I delegations from that PI are also revoked"
    grace_period: "30 days for existing claims to be re-attested under new delegation"
    notification: "All affected delegates and claim owners notified on revocation"

  principle_6_delegation_cannot_be_re_delegated_without_explicit_authorization:
    rule: "Sub-delegation SHALL require explicit 'may_delegate' flag on the parent delegation"
    default: "may_delegate = false (no sub-delegation permitted)"
    enforcement: "Sub-delegation request rejected if parent.may_delegate ≠ true"
```

### 3.2 Delegation Data Model

```yaml
delegation_record:
  delegation_id: "uuid:del-001"
  delegator:
    person_id: "uuid:person:site-admin"
    role: "Site Administrator"
  delegate:
    person_id: "uuid:person:dr-smith"
    role: "Principal Investigator"
  capabilities:
    - category: "clinical_experience"
      scope: ["therapeutic_area:oncology", "phase:I-III"]
      attenuation: "Limited to oncology Phase I-III only"
    - category: "therapeutic_areas"
      scope: ["oncology", "neurology"]
  may_delegate: false          # PI cannot further delegate
  valid_from: "2026-01-01T00:00:00Z"
  valid_until: "2027-01-01T00:00:00Z"
  status: "active"             # active | revoked | expired
  parent_delegation_id: null   # null = root delegation from Site Admin
  chain_hash: "sha256:abc123..."
  created_at: "2026-01-01T00:00:00Z"
  created_by: "uuid:person:site-admin"
```

### 3.3 Chain Verification Algorithm

```
function verify_delegation_chain(asserting_actor, claim_category):
    current = asserting_actor
    required_capability = claim_category
    chain = []

    while current.delegation_source is not null:
        delegation = current.delegation_source

        // Verify: delegation is active (not expired, not revoked)
        if delegation.status != "active":
            return FAIL("Delegation {delegation.id} is {delegation.status}")

        // Verify: delegation has not expired
        if now() > delegation.valid_until:
            return FAIL("Delegation {delegation.id} expired at {delegation.valid_until}")

        // Verify: capability is within delegated scope
        if required_capability not in delegation.capabilities:
            return FAIL("Capability {required_capability} not in delegation scope")

        // Verify: no scope expansion (attenuation only)
        if delegation.scope ⊃ delegator.scope:
            return FAIL("Delegation {delegation.id} expands scope beyond delegator")

        chain.prepend(delegation)
        current = delegation.delegator

    // Reached root — verify root has inherent authority
    if current.role cannot natively assert required_capability:
        return FAIL("Root authority {current.role} cannot assert {required_capability}")

    return PASS(chain)
```

---

## 4. Review Gate Triggers

| Condition | Trigger | Action | Override Path |
|---|---|---|---|
| Delegation chain > 2 hops | Automatic review flag | Human reviewer must approve | N/A — mandatory review |
| Claim category outside delegated scope | Rejected at assertion | Notify submitter with reason | Request broader delegation from Site Admin |
| Expired delegation used for claim | Rejected at assertion | Notify submitter; prompt delegation renewal | Renew delegation; re-assert claim |
| Staff role asserts non-personal claim | Rejected at assertion | Notify submitter; suggest correct role | Site Admin must assert or delegate |
| PI asserts equipment certification | Requires delegation check | Verify chain; if no delegation, reject | Equipment Mgr must assert or delegate to PI |
| Cross-domain claim (e.g., PI asserts lab certification) | Requires explicit multi-delegation | Verify both chains; flag for review | Both delegators must authorize |

---

## 5. Authority Revocation Events

| Event | Effect on Delegations | Effect on Claims |
|---|---|---|
| Person leaves institution | All delegations from/to this person revoked | Claims remain but marked `authority_revoked`; must be re-attested |
| Role change (e.g., PI → Sub-I) | Delegations re-evaluated; scope narrowed | Claims outside new scope marked for review |
| Delegation expires | Sub-delegations cascade-expire | Claims degrade to `declared_unsupported` |
| Site Admin revokes delegation | All sub-delegations from that delegation revoked | Grace period: 30 days to re-attest; then `expired` |
| License/Certification expires | Authority to assert dependent claims suspended | Claims dependent on that credential marked `pending_attestation` |

---

*CLAIM_ASSERTION_AUTHORITY_MATRIX.md — WO-KEMS-PROFILE-001 — KPO-CANON-001 — 2026-07-30*
