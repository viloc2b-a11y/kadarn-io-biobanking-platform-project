# Kadarn Governance & Compliance Pack

> **Version:** 0.1.0 (Pre-Beta)
> **Status:** Draft for review
> **Classification:** Confidential — Kadarn Internal

---

## Purpose

This pack contains the governance, compliance, and operational documentation required for Kadarn to operate as a biospecimen network infrastructure platform in regulated environments.

It covers the regulatory frameworks most relevant to biospecimen programs:

- **HIPAA** — US health information privacy (when handling PHI)
- **GDPR** — EU data protection (when processing EU personal data)
- **21 CFR Part 11** — FDA electronic records (when used in clinical trials)
- **SOC 2** — Service organization controls (enterprise trust)
- **ISO 27001** — Information security management (framework)

---

## Document Index

### Regulatory Assessments

| Document | Status | Location |
|----------|--------|----------|
| HIPAA Gap Assessment | ⬜ Draft | `governance/hipaa/gap-assessment.md` |
| HIPAA Security Rule Mapping | ⬜ Draft | `governance/hipaa/security-rule-mapping.md` |
| GDPR Gap Assessment | ⬜ Draft | `governance/gdpr/gap-assessment.md` |
| GDPR Data Protection Impact Assessment | ⬜ Draft | `governance/gdpr/dpia.md` |
| 21 CFR Part 11 Assessment | ⬜ Draft | `governance/hipaa/21cfr11-assessment.md` |
| SOC 2 Readiness Matrix | ⬜ Draft | `governance/soc2/readiness-matrix.md` |
| ISO 27001 Readiness Matrix | ⬜ Draft | `governance/soc2/iso27001-readiness.md` |

### Agreements

| Document | Status | Location |
|----------|--------|----------|
| Business Associate Agreement (BAA) | ⬜ Draft | `governance/agreements/baa-template.md` |
| Data Processing Agreement (DPA) | ⬜ Draft | `governance/agreements/dpa-template.md` |
| Network Participation Agreement | ⬜ Draft | `governance/agreements/network-participation.md` |
| Material Transfer Agreement (MTA) | ⬜ Draft | `governance/agreements/mta-template.md` |
| Data Use Agreement (DUA) | ⬜ Draft | `governance/agreements/dua-template.md` |

### Operational

| Document | Status | Location |
|----------|--------|----------|
| Incident Response Plan | ⬜ Draft | `governance/operations/incident-response.md` |
| Disaster Recovery Plan | ⬜ Draft | `governance/operations/disaster-recovery.md` |
| Business Continuity Plan | ⬜ Draft | `governance/operations/business-continuity.md` |
| Runbooks | ⬜ Draft | `governance/operations/runbooks/` |

### Risk & Compliance

| Document | Status | Location |
|----------|--------|----------|
| Risk Register | ⬜ Draft | `governance/risk/risk-register.md` |
| Information Security Program | ⬜ Draft | `governance/risk/infosec-program.md` |
| Privacy Program | ⬜ Draft | `governance/risk/privacy-program.md` |
| Vendor Management Program | ⬜ Draft | `governance/risk/vendor-management.md` |

---

## Regulatory Classification

### When Does HIPAA Apply?

| Scenario | Covered Entity? | BA Required? | Notes |
|----------|----------------|-------------|-------|
| De-identified biospecimen data only | ❌ | ❌ | HIPAA doesn't apply to de-identified data |
| Limited dataset with identifiers | ❌ | ✅ | BAA required with entities providing PHI |
| Fully identified patient data | ✅ | ✅ | Full HIPAA compliance required |
| Kadarn as platform provider | ❌ (infrastructure) | Depends on data | Kadarn is a BA if it processes PHI on behalf of covered entities |

### When Does GDPR Apply?

| Scenario | GDPR Applies? | DPO Needed? | Notes |
|----------|--------------|-------------|-------|
| EU researchers using the platform | ✅ | Likely | Personal data of EU data subjects |
| Non-EU sites shipping to EU | ✅ | Recommended | Data entering EU jurisdiction |
| De-identified biospecimens only | Usually not | No | Recital 26: anonymized data not subject to GDPR |
| Pseudonymized data | ✅ | Depends | Still personal data under GDPR |

### When Does 21 CFR Part 11 Apply?

| Scenario | Part 11 Applies? | Notes |
|----------|-----------------|-------|
| Kadarn used in FDA-regulated clinical trial | ✅ | Electronic records, signatures |
| Kadarn used for research only (non-regulated) | ❌ | Not required |
| Kadarn as infrastructure, trial uses own systems | ❌ | Customer responsibility |

---

## Key Compliance Decisions

### 1. Architecture-Enforced Controls

Kadarn's architecture already provides several compliance-relevant controls:

| Control | Implementation |
|---------|---------------|
| Access Control | RLS — row-level security per organization |
| Audit Trail | `audit_events` — immutable, append-only |
| User Authentication | Supabase Auth — JWT-based, OIDC-ready |
| Data Segregation | Organization isolation via `organization_id` |
| Change Tracking | `updated_at` triggers on all tables |
| Chain of Custody | `sample_movements` with full provenance |

### 2. Gaps to Address

| Gap | Priority | Effort |
|-----|----------|--------|
| Formal access review process | High | Low |
| Encryption at rest documentation | High | Low |
| Penetration testing | High | Medium |
| Incident response drills | Medium | Medium |
| Vendor risk assessments | Medium | Low |
| Data retention/enforcement | Low | Medium |

### 3. Recommended Roadmap

```
Phase 1 (Pre-Beta)  → BAA template, DPA template, Risk Register
Phase 2 (Beta)       → HIPAA Gap Assessment, SOC2 Readiness, IR Plan
Phase 3 (GA)         → Penetration testing, ISO 27001 alignment
```

---

## References

- Blueprint §22: Stability Policy
- ADR-004: Platform Boundaries
- NIST SP 800-53: Security and Privacy Controls
- HHS HIPAA Security Rule (45 CFR 164)
- EU GDPR (Regulation 2016/679)
- FDA 21 CFR Part 11
