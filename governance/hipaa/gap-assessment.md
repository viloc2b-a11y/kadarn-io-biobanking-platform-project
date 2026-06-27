# Kadarn HIPAA Gap Assessment

> **Status:** Pre-Beta Assessment
> **Date:** 2026-06-26
> **Scope:** Kadarn Platform as Infrastructure Provider

---

## Executive Summary

Kadarn is a **biospecimen network infrastructure platform**. It processes biospecimen metadata, not clinical data about patients. By default, all data is **de-identified** at the platform level. HIPAA applies only when Kadarn processes Protected Health Information (PHI) on behalf of a Covered Entity.

**Assessment:** Kadarn's architecture is HIPAA-aligned by design for de-identified data. PHI handling requires a BAA and additional controls.

---

## HIPAA Security Rule (45 CFR §164.306)

| Standard | Requirement | Kadarn Status | Gap |
|----------|-------------|---------------|-----|
| **Administrative Safeguards** | | | |
| Security Management Process | Risk analysis, risk management | ⚠️ Risk register exists; formal risk analysis pending | Formalize |
| Security Personnel | Assigned security officer | ⬜ Not assigned | Assign |
| Information Access Management | Authorize, modify access | ✅ RLS enforces org-level access | — |
| Workforce Training | Security awareness | ⬜ Not implemented | Implement |
| Security Incident Procedures | Response and reporting | ⚠️ IR plan draft exists | Formalize |
| Contingency Plan | Disaster recovery, emergency mode | ⬜ DR plan pending | Create |
| Evaluation | Periodic technical evaluation | ⬜ Planned for Beta | Schedule |
| **Physical Safeguards** | | | |
| Facility Access Controls | (Handled by cloud provider: Supabase/Vercel) | ✅ Supabase SOC 2 | — |
| **Technical Safeguards** | | | |
| Access Control | Unique user IDs, emergency access, automatic logoff | ✅ JWT auth, RLS | — |
| Audit Controls | Record and examine activity | ✅ `audit_events` table | — |
| Integrity Controls | Protect from improper alteration | ✅ Immutable audit, RLS | — |
| Transmission Security | Encrypt PHI in transit | ✅ TLS 1.3 | — |

---

## HIPAA Breach Notification Rule (45 CFR §164.400)

| Requirement | Kadarn Status |
|-------------|---------------|
| Breach identification | ⚠️ Process defined in IR plan |
| Notification to CE within 60 days | ⬜ SLA to be defined |
| Notification to individuals | ⬜ Customer responsibility |
| Notification to HHS | ⬜ Customer responsibility |
| Documentation | ⬜ Breach log pending |

---

## Required Actions for PHI Processing

Before Kadarn can process PHI:

1. **Execute BAA** with each Covered Entity
2. **Document PHI flows** — which data elements, which programs
3. **Implement minimum necessary policy** in platform
4. **Add PHI flag** to programs that involve PHI
5. **Train staff** on HIPAA requirements
6. **Designate Security Officer**

---

## De-identification Strategy

Kadarn's default strategy: **de-identification at ingestion.**

| Identifier | Handling |
|------------|----------|
| Names | Never collected |
| Geographic subdivisions > population 20,000 | Country-level only |
| Dates (birth, treatment) | Year only |
| Phone/fax numbers | Never collected |
| Email addresses | Account-only; never in biospecimen data |
| SSN / MRN | Never collected |
| Medical record numbers | Never collected |
| Device identifiers | Never collected |
| Biometric data | Never collected |
| Full-face photos | Never collected |
| Any other unique identifier | Blocked at API layer |

**Safe Harbor:** If Kadarn never receives the 18 identifiers, data is de-identified per Safe Harbor method.

**Expert Determination:** For borderline cases, engage privacy expert per 45 CFR §164.514(b).

---

## Conclusion

| Area | Readiness |
|------|-----------|
| De-identified data only | ✅ No gaps |
| PHI with BAA | ⚠️ BAA template ready; operational controls needed |
| Security Rule compliance | ✅ Architecture-aligned; documentation gaps |
| Breach Notification | ⚠️ Process defined; not tested |
| Organizational | ⬜ Security Officer, training, policies pending |
