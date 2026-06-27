# Kadarn Business Associate Agreement (BAA) — Template

> **Status:** Template for review
> **When used:** When Kadarn processes PHI on behalf of a Covered Entity
> **Governing law:** United States (HIPAA/HITECH)

---

## 1. Parties

**Covered Entity:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ ("CE")
**Business Associate:** Kadarn, Inc. ("BA")
**Effective Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

## 2. Definitions

Capitalized terms have the meanings given in HIPAA (45 CFR §160.103).

## 3. Obligations of Business Associate

BA agrees to:

1. **Use Limitation** — Only use/disclose PHI as permitted by this BAA or as required by law.
2. **Safeguards** — Implement administrative, physical, and technical safeguards per HIPAA Security Rule (45 CFR §164.306). BA's current safeguards include:
   - Row-Level Security for multi-tenant isolation
   - Immutable audit trail (`audit_events` table)
   - JWT-based authentication (Supabase Auth)
   - Encryption in transit (TLS)
   - Access controls per organization
3. **Reporting** — Report any Security Incident or Breach to CE within 72 hours.
4. **Subcontractors** — Ensure any subcontractors agree to the same restrictions.
5. **Access** — Provide CE access to PHI within 30 days of request.
6. **Amendment** — Make PHI amendments as directed by CE.
7. **Accounting** — Document and provide accounting of PHI disclosures.
8. **Return/Destruction** — Return or destroy all PHI upon termination.

## 4. Permitted Uses

BA may use PHI only for:
- Biospecimen program orchestration
- Network coordination
- Quality improvement
- Compliance activities
- De-identification

## 5. Term and Termination

- **Term:** 1 year, auto-renewing
- **Termination for Cause:** 30 days written notice
- **Effect of Termination:** BA must return or destroy all PHI within 60 days

## 6. Indemnification

Each party indemnifies the other against third-party claims arising from their breach of HIPAA obligations.

## 7. Miscellaneous

- **Governing Law:** \_\_\_\_\_\_\_\_\_\_\_\_\_
- **Notices:** legal@kadarn.io
- **Amendments:** Must be in writing and signed by both parties

---

**CE Signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ **Date:** \_\_\_\_\_\_\_\_\_\_
**BA Signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ **Date:** \_\_\_\_\_\_\_\_\_\_
