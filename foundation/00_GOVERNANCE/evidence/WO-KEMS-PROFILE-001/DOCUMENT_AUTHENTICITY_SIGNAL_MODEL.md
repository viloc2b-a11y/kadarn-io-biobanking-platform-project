# DOCUMENT AUTHENTICITY SIGNAL MODEL

**Document ID:** KEMS-DOC-AUTH-001
**Work Order:** WO-KEMS-PROFILE-001
**Reference:** W3C VC Data Integrity, Attestix hash chain

---

## 1. Purpose

KADARN cannot assert absolute document authenticity. Instead, it records **authenticity signals** — verifiable indicators that collectively build confidence in a document's provenance and integrity. No single signal is sufficient; the combination provides a confidence profile.

---

## 2. Authenticity Signals

| # | Signal | How Detected | Confidence Contribution |
|---|---|---|---|
| **S1** | **Content Hash** | SHA-256 of uploaded file; compared on every access | Prevents undetected modification |
| **S2** | **Issuer Identity** | Extracted from document metadata or user-declared | Low (self-declared) to High (externally confirmed) |
| **S3** | **Digital Signature Present** | PDF signature detection; PKCS#7 verification | Medium if present; High if validated |
| **S4** | **Digital Signature Validated** | Cryptographic verification of signature chain | High — issuer identity cryptographically confirmed |
| **S5** | **Internal Consistency** | Cross-check dates, names, identifiers within document | Medium — inconsistency suggests tampering or error |
| **S6** | **Public Registry Match** | Compare document data against public registry (CLIA, CAP, FDA, ClinicalTrials.gov) | High — external corroboration |
| **S7** | **Version Chain** | Compare version number, effective date, supersedes with previous versions | Medium — chain integrity |
| **S8** | **Issuer Externally Confirmed** | Issuing organization verified via independent source | High |
| **S9** | **Reviewer Assessment** | Human reviewer confirms document appears authentic | Medium — subjective |
| **S10** | **Tampering Indicators** | Metadata anomalies, inconsistent fonts, edit history | Negative — reduces confidence |
| **S11** | **Upload Integrity** | File unchanged since upload (hash match) | Low — basic integrity check |
| **S12** | **Chain of Custody** | Provenance records from upload to current state | Medium — continuous custody |

---

## 3. Authenticity Confidence Levels

Combined signals produce an authenticity confidence level:

| Level | Signals Required | Meaning |
|---|---|---|
| **UNVERIFIED** | Only S1 (hash) | "We have the file and it hasn't changed since upload." |
| **CONSISTENCY_CHECKED** | S1 + S5 + S11 | "The file is intact and internally consistent." |
| **ISSUER_CONFIRMED** | Above + S2 + S8 | "We confirmed the issuing organization independently." |
| **CRYPTOGRAPHICALLY_VERIFIED** | Above + S3 + S4 | "The digital signature is valid and the issuer is cryptographically confirmed." |
| **EXTERNALLY_CORROBORATED** | Above + S6 | "The document content matches a public registry record." |

---

## 4. Prohibited Terminology

KADARN must NOT use these terms without qualification:

| Term | Why Prohibited | Use Instead |
|---|---|---|
| "Verified document" | Implies absolute verification | "Document hash verified; issuer identity confirmed; signature validated" |
| "Authentic document" | Implies legal authenticity | "Authenticity signals: hash match, signature present, issuer confirmed" |
| "Original document" | Cannot prove it's the original | "Document as received on [date]; hash: [value]" |
| "Certified true copy" | Legal term KADARN cannot assert | "Uploaded copy; content hash matches source as declared by uploader" |

---

## 5. Signal Recording

```yaml
document_authenticity:
  document_id: "uuid:doc-001"
  content_hash: "sha256:a1b2c3..."
  hash_verified_at: "2026-01-15T10:30:00Z"
  signals:
    - signal: "S1_CONTENT_HASH"
      status: "verified"
      verified_at: "2026-01-15T10:30:00Z"
    - signal: "S2_ISSUER_IDENTITY"
      status: "self_declared"
      issuer_name: "College of American Pathologists"
      declared_by: "uuid:person:lab-director"
    - signal: "S3_SIGNATURE_PRESENT"
      status: "detected"
      signature_type: "PKCS#7"
    - signal: "S4_SIGNATURE_VALIDATED"
      status: "valid"
      validated_at: "2026-01-15T10:31:00Z"
      signer: "CN=CAP, O=College of American Pathologists"
    - signal: "S5_INTERNAL_CONSISTENCY"
      status: "passed"
      checks: ["dates_consistent", "names_match", "no_anomalies"]
    - signal: "S6_REGISTRY_MATCH"
      status: "matched"
      registry: "CAP Accreditation Registry"
      registry_id: "CAP-12345"
      matched_at: "2026-01-15T10:32:00Z"
  combined_level: "EXTERNALLY_CORROBORATED"
  confidence_score: 0.95
```

---

## 6. Tampering Detection

| Indicator | Detection Method | Action |
|---|---|---|
| Hash mismatch on re-read | Compare stored hash with current file hash | ALERT — "File may have been modified" |
| Metadata anomaly | Creation date after modification date, author mismatch | FLAG for review |
| Inconsistent fonts/sizes | Multiple font changes in single document | FLAG — possible assembly from multiple sources |
| Edit history present | Document revision log detected | NOTE — not necessarily suspicious |
| Digital signature invalid | Signature verification failed | ALERT — "Signature invalid; document may be altered" |

---

## 7. Document Type Classification

| Document Nature | Authenticity Weight |
|---|---|
| `original` — Directly from issuing authority | Highest |
| `certified_copy` — Stamped/signed as true copy | High |
| `ordinary_copy` — Scanned or photocopied | Medium |
| `redacted_copy` — Content partially obscured | Lower (verify redaction integrity separately) |
| `derived_extract` — Data extracted from original | Low for authenticity; high for extracted facts |
| `structured_summary` — System-generated summary | Not applicable (authenticity of source data matters) |

---

*DOCUMENT_AUTHENTICITY_SIGNAL_MODEL.md — WO-KEMS-PROFILE-001 — 2026-07-30*
