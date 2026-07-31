# CLAIM ATTESTATION POLICY

**Document ID:** KEMS-CLAIM-ATTEST-001
**Work Order:** WO-KEMS-PROFILE-001

---

## 1. Purpose

Every claim submitted by a site must carry a versioned attestation from an authorized representative. This separates individual user input from institutional endorsement.

---

## 2. Attestation Text (Versioned)

### v1.0 — Baseline Attestation

```
I confirm that:
- I am authorized to submit this information on behalf of the institution.
- The information is accurate to the best of my knowledge.
- Documents uploaded belong to or are lawfully controlled by the institution.
- No prohibited PHI has been uploaded with these claims.
- I understand this information may be visible to sponsors and CROs per the
  institution's disclosure settings.
- I understand this information must be updated if it changes.
```

### v2.0 — Enhanced (future)

Adds:
- Specific scope (which claims, which entities)
- Explicit PHI attestation per document
- Data processing consent for embeddings

---

## 3. Attestation Record

```yaml
attestation:
  id: "uuid"
  attested_by: "uuid:person:dr-smith"
  attested_by_role: "Principal Investigator"
  attested_for_institution: "uuid:institution:vilo-research"
  scope: "all_claims_submitted_in_session"
  claim_ids: ["uuid:claim-001", "uuid:claim-002"]
  profile_version: "v1.2"
  attestation_text_version: "v1.0"
  attested_at: "2026-01-15T10:30:00Z"
  ip_address_hash: "sha256:..."
  session_id: "uuid:session-001"
```

---

## 4. When Attestation Is Required

| Action | Attestation Required? |
|---|---|
| Submitting new claim(s) | ✅ Full attestation |
| Updating existing claim | ✅ Full attestation (scope: updated claims only) |
| Uploading evidence for existing claim | ✅ Per-document attestation (PHI clause) |
| Viewing claims | ❌ |
| Authorizing package transfer | ✅ Transfer-specific attestation (separate from claim attestation) |
| Periodic reconfirmation | ✅ Re-attestation (claims still accurate) |

---

## 5. Attestation Validity

- Attestation is valid for the **session** in which it was made
- Re-attestation required if: claims change, new evidence uploaded, 90 days elapsed
- Attestation can be **revoked** by the attester or institution admin
- Revoked attestation → claims remain but marked `attestation_status: revoked`

---

## 6. Delegated Attestation

When a PI delegates claim authority to a coordinator:

```yaml
delegation:
  delegator: "uuid:person:dr-smith"
  delegate: "uuid:person:coordinator-jones"
  scope: ["clinical_experience", "therapeutic_areas"]
  delegated_at: "2026-01-01"
  expires: "2026-06-01"
  attestation_chain: ["delegator_attested", "delegate_accepts"]
```

The delegate's attestation references the delegation chain. KADARN verifies the full chain before accepting the claim.

---

## 7. Attestation vs. Transfer Authorization

These are DISTINCT:

| | Attestation | Transfer Authorization |
|---|---|---|
| **What** | "This information is accurate" | "I authorize sharing this with Sponsor X" |
| **When** | At claim submission | At package assembly |
| **Scope** | Claims + evidence accuracy | Specific recipient + study |
| **Revocable** | Yes | Yes |
| **Required for** | Claim admission | Package transfer |

---

*CLAIM_ATTESTATION_POLICY.md — WO-KEMS-PROFILE-001 — 2026-07-30*
