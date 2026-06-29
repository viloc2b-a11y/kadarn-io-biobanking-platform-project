# Kadarn GDPR Erasure Strategy

**Status:** Production  
**Sprint:** KPR-03  
**Regulation:** GDPR Article 17 — Right to Erasure (Right to be Forgotten)

---

## The Problem

Kadarn's provenance layer is **append-only by design** (migration `032_provenance_append_only.sql`). This directly conflicts with GDPR Art.17, which gives data subjects the right to have their personal data erased.

We cannot delete provenance records without breaking:
- Chain of custody (regulatory requirement)
- Scientific validity (ISO 20387)
- Audit trail (21 CFR Part 11)
- Platform invariants (append-only)

## The Solution: Soft Erasure

Kadarn implements a **soft-erasure strategy** that satisfies Art.17 without breaking append-only invariants.

### What gets erased

| Data | Action | Justification |
|---|---|---|
| User email | Replaced with `anonymized-{uuid}@erased.kadarn.io` | Direct identifier |
| User display name | Replaced with `anonymized-user-{uuid}` | Direct identifier |
| Organization membership status | Set to `anonymized` | Relationship preserved, status anonymized |
| External identity links | **Deleted** | Not protected by Art.17(3) exemptions |
| Organization name/legal_name/tax_id | Replaced with anonymized value | Business identifier linked to natural person |

### What is preserved

| Data | Reason for retention | Legal basis |
|---|---|---|
| Provenance nodes | Chain of custody, scientific validity | Art.17(3)(d) — archiving, Art.17(3)(e) — research |
| Provenance edges | Lineage tracking | Art.17(3)(d) |
| Provenance evidence | Integrity verification | Art.17(3)(d) |
| User UUID | Referential integrity | Required — no personal data stored in UUID |
| Audit events | Regulatory compliance | Art.17(3)(d), 21 CFR 11.10(e) |
| Organization UUID | Referential integrity | Required — no personal data in UUID |

### Legal basis for provenance retention

Per **GDPR Art.17(3)**:

> Paragraphs 1 and 2 shall not apply to the extent that processing is necessary:
> - (d) for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes in accordance with Article 89(1)
> - (e) for the establishment, exercise or defence of legal claims

Biospecimen provenance records qualify under both exemptions:
1. **Scientific research purposes** (Art.17(3)(d)) — provenance is essential for reproducible science
2. **Archiving in the public interest** (Art.17(3)(d)) — biobank records serve public health
3. **Legal claims** (Art.17(3)(e)) — chain of custody may be required for regulatory defense

**Recital 156** further confirms:
> "The processing of personal data for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes should be subject to appropriate safeguards for the rights and freedoms of the data subject."

Kadarn's anonymization of direct identifiers *is* that safeguard.

## Implementation

### API

```
POST /api/v1/account/erasure
```

Executes the erasure flow and returns the result + legal notice.

### Erasure flow

```
User requests erasure
  → Anonymize user_profiles (email → anon, display_name → anon)
  → Anonymize memberships (status → 'anonymized')
  → Delete external identity links
  → Log ErasureCompleted event
  → Provenance: NO CHANGE (legally justified)
  → Return result with Art.17(3) citation
```

### Idempotency

Calling the endpoint multiple times is safe. After the first call:
- Profile data is already anonymized (no further action needed)
- Memberships are already anonymized
- Links are already deleted
- Response indicates data was already erased

## Testing

| Test | Verifies |
|---|---|
| User profile anonymized | `email` and `display_name` replaced with anonymized values |
| Provenance not mutated | Append-only invariant confirmed |
| Referential integrity | UUIDs preserved across all related tables |
| Audit preserved | `ErasureCompleted` event emitted |
| Idempotency | Second call produces same (safe) result |

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| User UUID can still be linked to provenance | Low | UUID is not personal data per GDPR (random, non-descriptive). Art.17(3) exemption applies. |
| Anonymized email format could be identified as same person | Low | Each erasure generates a unique random suffix. No two erasures produce the same anonymized email. |
| Regulator may challenge provenance retention | Medium | Documented legal basis. Consult DPO before deployment in EU jurisdiction. |
