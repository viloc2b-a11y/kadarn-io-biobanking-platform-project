# Kadarn Data Processing Agreement (DPA) — Template

> **Status:** Template for review
> **When used:** When Kadarn processes EU personal data
> **Governing law:** EU GDPR (Regulation 2016/679)

---

## 1. Parties

**Controller:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ (the organization using Kadarn)
**Processor:** Kadarn, Inc.
**Effective Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

## 2. Subject Matter and Duration

Kadarn processes personal data as described in the [Kadarn Data Processing Inventory](#) for the duration of the Agreement.

## 3. Nature and Purpose

Kadarn provides biospecimen network infrastructure services. Processing of personal data is limited to:
- User account management (name, email, organization)
- Biospecimen metadata (de-identified by default)
- Audit trail records (user actions, timestamps)

## 4. Categories of Data Subjects

- Researchers
- Site coordinators
- Laboratory personnel
- IRB members
- Organization administrators

## 5. Obligations of the Processor

Kadarn shall:

1. **Process only on documented instructions** — Not use personal data for any purpose other than providing the Kadarn platform.
2. **Confidentiality** — Ensure all personnel with access are bound by confidentiality.
3. **Security** — Implement appropriate technical and organizational measures (see Appendix 1).
4. **Subprocessing** — Not engage subprocessors without prior authorization. Current subprocessors:
   - Supabase (PostgreSQL hosting, auth)
   - Vercel (application hosting)
5. **Data Subject Rights** — Assist Controller in responding to DSARs, rectification, erasure, portability.
6. **Breach Notification** — Notify Controller within 48 hours of becoming aware of a personal data breach.
7. **DPIA** — Assist Controller with Data Protection Impact Assessments.
8. **Deletion/Return** — Delete or return all personal data within 60 days of termination.

## 6. International Transfers

| Transfer | Safeguard |
|----------|-----------|
| EU → US (Kadarn hosting) | Standard Contractual Clauses (2021/914) |
| EU → US (Supabase) | SCCs + Supplemental Measures |

## 7. Subprocessors

Prior authorization required for new subprocessors. Current list maintained at: `https://kadarn.io/subprocessors`

## 8. Audit Rights

Kadarn shall allow audits by Controller or a mandated auditor once per 12-month period, subject to reasonable notice and confidentiality.

## 9. Liability

Kadarn's liability limited to the fees paid under the Agreement, except for GDPR fines arising from Kadarn's breach of this DPA.

---

## Appendix 1: Technical and Organizational Measures

### Technical Measures
- Row-Level Security (RLS) for data isolation
- Encryption in transit (TLS 1.3)
- Immutable audit trail
- JWT-based authentication
- Access controls per organization
- Rate limiting (planned)

### Organizational Measures
- Data Protection Officer: privacy@kadarn.io
- Security awareness training
- Access control policy
- Incident response plan
- Vendor risk assessments

---

**Controller Signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ **Date:** \_\_\_\_\_\_\_\_
**Processor Signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ **Date:** \_\_\_\_\_\_\_\_
