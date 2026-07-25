# Credential Registry — Conceptual Specification

**Status:** Product concept — no implementation changes required

---

## Definition

The Credential Registry represents credentials as structured institutional assets rather than attached PDFs. Each credential has tracked status, issuer, expiration, linked evidence, and computed confidence.

## Credential Types

| Category | Examples |
|----------|----------|
| Licenses | Medical License, DEA, CLIA, State Licenses |
| GCP Training | GCP, CITI, ICH-GCP |
| Professional Certifications | SOCRA, ACRP, CCRA, CRC |
| Safety & Compliance | IATA, HIPAA, OSHA, Fire Safety |
| Institutional | IRB Registration, FWA, Federal Wide Assurance |
| Specialty | Lab Certification (CAP, CLIA), Imaging (ACR), Pharmacy |

## Data Model (Conceptual)

```
Credential
├── id: UUID
├── institution_id: UUID (FK → organizations)
├── type: enum (license, certification, training, registration)
├── name: string (e.g. "IATA Dangerous Goods")
├── issuing_body: string (e.g. "IATA")
├── credential_id: string (e.g. license number)
├── status: enum (active, expired, pending, revoked)
├── issued_date: date
├── expiration_date: date (nullable — some credentials don't expire)
├── renewed_date: date (nullable)
├── scope: string (e.g. "All personnel shipping biologics")
├── evidence_id: UUID (FK → evidence_nodes — supporting document)
├── confidence: confidence_level (confidence in this credential record)
├── created_at, updated_at: timestamptz
└── created_by: UUID (person who entered this credential)
```

## Status Model

```
active       → The credential is current and valid
expiring     → Active but within 90 days of expiration (computed)
pending      → Application submitted, not yet approved
expired      → Past expiration date, not renewed
revoked      → Issuing body has revoked the credential
unknown      → Status cannot be verified
```

## Key Behaviors

1. **Expiration awareness** — System tracks expiration dates and surfaces upcoming expirations on the dashboard
2. **Evidence-linked** — Each credential can optionally link to an evidence_node (uploaded certificate PDF)
3. **Confidence-scored** — Credentials have confidence levels based on evidence quality, verification status, and freshness
4. **Bulk operations** — Institutions can add credentials in bulk (during onboarding or credential refresh)
5. **Renewal workflow** — When a credential expires, a renewal workflow can be triggered

## Relationship to Existing Implementation

| Aspect | Current State | Gap |
|--------|--------------|-----|
| Storage | No dedicated table | 🔴 New table needed (Phase 2+) |
| Evidence linking | evidence_nodes can store credential PDFs | 🟡 Structural metadata missing |
| Expiration tracking | No expiration awareness | 🔴 New feature |
| UI | No credential management | 🔴 New views needed |

## Implementation Path

1. **Migration**: Create `credentials` table + RLS
2. **Types**: Add `Credential` type + Zod schema
3. **API**: CRUD routes at `/api/v1/credentials`
4. **Linking**: Evidence attachments for credential documents
5. **Dashboard**: Credential status widget + expiration alerts
6. **Renewal**: Optional renewal workflow integration
