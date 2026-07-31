# SELF-CLAIM GOVERNANCE — Open Source Reference Integration

**Reference Repos:** W3C VC Data Model v2.1, Attestix v0.4.0, digitalbazaar/vc v7.3
**KADARN Context:** WO-KEMS-PROFILE-001 — Self-Claim Governance and Capability Activation
**Baselines:** WO-KEMS-DOC-001 ACCEPTED (76e3625), WO-KEMS-DOC-002 ACCEPTED (e9581aa), WO-KEMS-DOC-003 REPORT_READY

---

## 1. W3C VERIFIABLE CREDENTIALS → KADARN SELF-CLAIM

### 1.1 Core Model Mapping

| W3C VC Concept | KADARN Concept | Description |
|---|---|---|
| **Verifiable Credential** | **Self-Claim** | A set of claims made by an issuer about a subject, with cryptographic proof |
| **Issuer** | `asserted_by_person` + `asserted_by_role` | The entity making the claim (PI, Lab Director, Site Admin) |
| **Holder** | Institution (claim owner) | Entity that holds and can present the credential |
| **Subject** | `asserted_for_institution` / `asserted_for_location` / `asserted_for_entity` | What/who the claim is about |
| **Verifier** | Sponsor / CRO / KADARN reviewer | Entity that validates the claim |
| **Claims** | `claim_statements[]` | The actual assertions within the credential |
| **Proof** | Attestation (`attestation_status`) | Cryptographic signature proving issuer authenticity |
| **credentialSubject** | Entity scope (Institution, Location, Person, Equipment) | Bounded entity scope per D9 |
| **evidence** | Evidence Nodes (`claim_evidence_links`) | Supporting documentation linked to claims |
| **validFrom / validUntil** | `claim_valid_from` / `claim_valid_until` | Temporal validity per gap #13 |
| **credentialStatus** | `claim_status` (DECLARED → CONFIRMED → VERIFIED → EXPIRED → REVOKED) | Claim lifecycle state |
| **termsOfUse** | `claim_limitations` | Constraints, conditions, exclusions per gap #12 |
| **type[]** | Claim origin type (SELF_DECLARED, DOCUMENT_DERIVED, EXTERNALLY_ASSERTED, OPERATIONALLY_OBSERVED, SYSTEM_INFERRED) | Per gap #1 |

### 1.2 W3C VC JSON-LD Structure → KADARN Claim Schema

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "KADARNSelfClaim"],
  "issuer": {
    "id": "did:kadarn:person:uuid",
    "name": "Dr. Smith",
    "role": "Principal Investigator"
  },
  "validFrom": "2026-01-01T00:00:00Z",
  "validUntil": "2027-01-01T00:00:00Z",
  "credentialSubject": {
    "id": "did:kadarn:institution:uuid",
    "entityType": "Institution",
    "locationId": "did:kadarn:location:uuid"
  },
  "credentialStatus": {
    "id": "https://kadarn.io/claims/status#DECLARED",
    "type": "KADARNClaimStatus"
  },
  "evidence": [{
    "id": "did:kadarn:evidence:uuid",
    "type": ["Evidence"],
    "documentPresence": ["DigitalDocument"],
    "evidenceClass": "B"
  }],
  "termsOfUse": [{
    "type": "LimitationPolicy",
    "capacityLimits": "Up to 12 participants",
    "geographicLimits": "US only",
    "exclusions": ["ICU-level care"]
  }]
}
```

---

## 2. ATTESTIX UCAN DELEGATION → KADARN CLAIM AUTHORITY

### 2.1 Delegation Model

Attestix implements **UCAN (User Controlled Authorization Networks)** — capability-based delegation where authority flows through a chain of signed tokens.

| Attestix UCAN Concept | KADARN Concept | Description |
|---|---|---|
| `issuer_agent_id` | `delegated_authority.source` | Who granted the authority (e.g., Institution Admin → PI) |
| `audience_agent_id` | `asserting_actor` | Who exercises the authority |
| `capabilities` | `authority_basis` | What they're authorized to claim |
| `parent_token` | Delegation chain | Authority flows down; each link verified |
| `expiry_hours` | Authority timeout | Time-bounded delegation |
| Capability attenuation | Scope restriction | Sub-delegate cannot expand beyond parent's scope |

### 2.2 KADARN Claim Assertion Authority Model

```yaml
claim_assertion_authority:
  asserting_person: "uuid:person:dr-smith"
  asserting_role: "Principal Investigator"
  asserted_for_institution: "uuid:institution:vilo-research"
  asserted_for_location: "uuid:location:hub-01"  # optional
  authority_basis: "institutional_role"
  delegated_authority:
    source: "Site Administrator"
    delegation_date: "2026-01-01"
    scope: ["clinical_experience", "lab_capabilities"]
    expires: "2027-01-01"
  attestation_status: "attested"
  attestation_version: "v1.0"
```

### 2.3 Claim Assertion Authority Matrix

| Role | Can Declare | Cannot Declare |
|---|---|---|
| **Site Administrator** | Institutional identity, locations, contacts, general info | Clinical capabilities, lab certifications, regulatory compliance |
| **Principal Investigator** | Clinical experience, therapeutic areas, study phases, own credentials | Institutional licenses, equipment certifications (unless delegated) |
| **Laboratory Director** | Lab capabilities, certifications, equipment, SOPs | Clinical experience, pharmacy, regulatory startup |
| **Equipment Manager** | Equipment inventory, calibration, maintenance records | Lab certifications, clinical claims |
| **Study Coordinator** | Study logistics, recruitment estimates | Institutional certifications, PI credentials |
| **Quality Manager** | CAPA, internal audits, quality metrics | Clinical claims, investigator credentials |

---

## 3. ATTESTIX PROVENANCE → KADARN CLAIM HISTORY

### 3.1 Hash-Chained Audit Trail

Attestix implements a **tamper-evident hash chain** where each entry links to the previous via SHA-256:

```python
def _chain_hash(previous_hash: str, entry_data: dict) -> str:
    canonical = json.dumps(entry_data, sort_keys=True, separators=(",", ":"))
    combined = f"{previous_hash}:{canonical}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()
```

This maps directly to KADARN's need for **immutable claim history** (gap #17 — correction without silent overwrite).

### 3.2 KADARN Claim Provenance Chain

```yaml
claim_provenance:
  - version: 1
    action: "declared"
    asserted_by: "dr-smith"
    asserted_at: "2026-01-01T00:00:00Z"
    claim_hash: "sha256:abc123..."
    previous_hash: "0" * 64  # Genesis

  - version: 2
    action: "institution_confirmed"
    confirmed_by: "site-admin"
    confirmed_at: "2026-01-02T00:00:00Z"
    claim_hash: "sha256:def456..."
    previous_hash: "sha256:abc123..."

  - version: 3
    action: "evidence_linked"
    evidence_id: "uuid:evidence-001"
    linked_at: "2026-01-03T00:00:00Z"
    claim_hash: "sha256:ghi789..."
    previous_hash: "sha256:def456..."
    confidence_level: "documented"

  - version: 4
    action: "corrected"
    corrected_by: "dr-smith"
    correction_reason: "Updated capacity from 12 to 20 participants"
    claim_hash: "sha256:jkl012..."
    previous_hash: "sha256:ghi789..."
    supersedes: "version 3"
```

---

## 4. DIGITALBAZAAR VC API → KADARN CLAIM ISSUANCE

### 4.1 Core API Pattern

```javascript
// digitalbazaar/vc — Issue a credential
const vc = require('@digitalbazaar/vc');

const credential = await vc.issue({
  issuer: 'did:key:z6Mk...',
  credential: credentialData,
  suite: new Ed25519Signature2020({key: signingKey})
});

// Verify a credential
const result = await vc.verifyCredential({
  credential: issuedCredential,
  suite: new Ed25519Signature2020(),
  documentLoader
});
// result.verified === true/false
```

### 4.2 Mapping to KADARN

| digitalbazaar/vc API | KADARN Equivalent |
|---|---|
| `vc.issue({issuer, credential, suite})` | `POST /api/v1/claims` with `asserted_by` + `attestation_signature` |
| `vc.verifyCredential({credential, suite})` | `GET /api/v1/claims/:id/verify` → validates issuer signature + temporal validity |
| `vc.createPresentation({verifiableCredential, holder})` | Feasibility Package assembly with authorized credentials |
| `vc.verify({presentation, suite, challenge})` | Sponsor verification of package integrity |

---

## 5. CLAIM TYPE ONTOLOGY (Gap #1)

Adopted from W3C VC `type[]` + KADARN business logic:

| Origin Type | Definition | Evidence Weight | Transfer Eligibility |
|---|---|---|---|
| **SELF_DECLARED_CLAIM** | Asserted by authorized person; no evidence attached | `declared_unsupported` | May populate profile; never = High Readiness |
| **DOCUMENT_DERIVED_CLAIM** | Facts extracted from uploaded document (SOP, cert, license) | `documented` | Eligible if document is valid + authorized |
| **EXTERNALLY_ASSERTED_CLAIM** | Confirmed by third party (public registry, sponsor, CRO, central lab) | `verified` or `externally_corroborated` | High confidence; shareable |
| **OPERATIONALLY_OBSERVED_CLAIM** | Evidence from operational logs (processing count, shipping records) | `operational_evidence` | Internal + sponsor-authorized |
| **SYSTEM_INFERRED_CLAIM** | Derived automatically from system data (computed readiness, gap detection) | `system_inferred` | Internal only; never auto-published |
| **NEGATIVE_DECLARATION** | Explicit absence declaration ("We do NOT have onsite pharmacy") | Varies | Useful for qualification; prevents repeated queries |
| **CUSTOM_CLAIM_PROPOSAL** | User-proposed claim not in catalog | `proposed` | Requires review pipeline before activation |

---

## 6. CLAIM LIFECYCLE STATE MODEL (Gaps #3, #10, #11, #17)

### 6.1 States

```
submitted           → User drafted the claim
pending_attestation → Waiting for authorized confirmation
declared_unsupported → Institution confirmed; no evidence attached
declared_documented  → Evidence linked; not externally verified
verified             → External corroboration confirmed
disputed             → Counter-evidence or internal conflict exists
expired              → Claim or supporting evidence expired
superseded           → Replaced by newer version
withdrawn            → Institution removed the claim
rejected             → Failed boundedness test or taxonomy review
unknown              → Not yet assessed
not_applicable       → Does not apply to this entity
```

### 6.2 Transitions

```
submitted ──→ pending_attestation ──→ declared_unsupported
declared_unsupported ──→ declared_documented (evidence linked)
declared_documented ──→ verified (external corroboration)
ANY ──→ disputed (counter-evidence detected)
ANY ──→ superseded (newer version created)
ANY ──→ expired (temporal validity expired)
ANY ──→ withdrawn (institution removed)
custom_proposal ──→ submitted OR rejected
```

---

## 7. BOUNDED CLAIM TEST (Gap #6)

Every self-claim must answer before publication:

| Dimension | Required? | Example |
|---|---|---|
| **Who** (asserting entity) | ✅ | PI, Lab Director, Site Admin |
| **What** (capability) | ✅ | "Can process PBMC samples" |
| **Where** (entity scope) | ✅ | Location Houston-01 |
| **Context** (applicable conditions) | ✅ | "Under SOP PBMC-003" |
| **Since** (effective date) | ✅ | "2025-06-01" |
| **Until** (validity limit) | 🟡 | "2027-06-01 or until SOP superseded" |
| **Volume/Capacity** | 🟡 | "Up to 200 samples/month" |
| **Limitations/Exclusions** | 🟡 | "Not for samples requiring RNA stabilization" |

**Invalid:** "We have Phase I capabilities." ❌ (no who, where, context, since)
**Valid:** "Location Houston-01 can support overnight observation for up to 12 participants under protocols not requiring ICU-level care, effective 2025-06-01." ✅

---

## 8. CLAIM DEPENDENCY MODEL (Gap #15)

Claims can form dependency trees. If a parent claim is invalidated, children degrade.

```yaml
claim_dependency:
  parent_claim: "CAP-CLAIM-001: Can perform PBMC processing"
  component_claims:
    - "CAP-CLAIM-001a: Personnel trained in PBMC processing"
    - "CAP-CLAIM-001b: Equipment available (centrifuge, biosafety cabinet)"
    - "CAP-CLAIM-001c: SOP PBMC-003 active and current"
    - "CAP-CLAIM-001d: -80°C storage validated"
  dependency_type: "ALL_REQUIRED"  # ALL_REQUIRED | ANY_SUFFICIENT | N_OF_M
  degradation_rule: "If any component expires, parent degrades to evidence_stale"
```

---

## 9. PERIODIC RECONFIRMATION (Gap #14)

```yaml
reconfirmation_policy:
  interval_days: 365
  applicable_to: ["SELF_DECLARED_CLAIM", "DOCUMENT_DERIVED_CLAIM"]
  prompt_text: "Do you still maintain this capability?"
  response_options:
    - confirmed_unchanged    # Claim extended; new valid_until set
    - confirmed_with_changes # Claim updated; new version created
    - temporarily_unavailable # Claim suspended for X days
    - no_longer_available    # Claim withdrawn
    - unknown                # Escalated to reviewer
  if_no_response:
    after_30_days: "mark_pending_review"
    after_90_days: "mark_expired"
    after_180_days: "archive"
```

---

## 10. INTERNAL CONSISTENCY CONFLICT (Gap #16)

When the same site provides contradictory information:

```yaml
consistency_check:
  triggers:
    - "Onboarding answer conflicts with uploaded document"
    - "Two claims make mutually exclusive assertions"
    - "Claim contradicts institutional profile data"
  resolution:
    status: "INTERNAL_CONSISTENCY_CONFLICT"
    action: "HUMAN_REVIEW_REQUIRED"
    display_rule: "Show conflict publicly with both sources cited"
    auto_resolve: false  # Never auto-resolve; always requires human review
  example:
    onboarding: "Freezer is continuously monitored."
    sop: "Temperatures are manually checked twice daily."
    result: "CONFLICT: Monitoring method contradicts between self-declaration and SOP-PROC-012 §4.3"
```

---

## 11. CLAIM PUBLICATION AND VISIBILITY (Gaps #20, #21)

```yaml
claim_visibility:
  public:
    - therapeutic_areas
    - study_phase_experience
    - institutional_profile_basic
  network_visible:
    - capability_summaries (aggregated)
    - readiness_levels
    - geographic_reach
  recipient_authorized:
    - detailed_capacity
    - equipment_inventory
    - staff_credentials (redacted)
  internal:
    - exact_volumes
    - vendor_relationships
    - internal_audit_findings
    - quality_metrics_detail
  restricted:
    - prior_sponsor_history
    - contractual_terms
    - financial_data
    - proprietary_workflows

published_projection:
  detailed: "Can store 180,000 aliquots across three validated -80°C freezers (S/N: F-001, F-002, F-003)"
  projected: "Validated ultra-low-temperature storage available"
  rule: "Detailed claim visible internally; projected version visible to network/sponsors"
```

---

*SELF_CLAIM_GOVERNANCE_REFERENCE.md — WO-KEMS-PROFILE-001 preparation — 2026-07-30*
*Sources: W3C Verifiable Credentials Data Model v2.1, Attestix v0.4.0 (UCAN delegation, provenance), digitalbazaar/vc v7.3*
