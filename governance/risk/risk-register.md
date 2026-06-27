# Kadarn Risk Register

> **Version:** 0.1.0
> **Status:** Initial — Pre-Beta
> **Owner:** Kadarn Architecture

---

## Risk Scoring

| Level | Score | Response |
|-------|-------|----------|
| Critical | 15-25 | Immediate mitigation required |
| High | 10-14 | Mitigation within 30 days |
| Medium | 5-9 | Planned mitigation within 90 days |
| Low | 1-4 | Accept or monitor |

**Formula:** Likelihood (1-5) × Impact (1-5) = Score

---

## Technical Risks

| # | Risk | Likelihood | Impact | Score | Mitigation | Status |
|---|------|-----------|--------|-------|------------|--------|
| T-01 | RLS bypass via direct DB access | 1 | 5 | 5 | Supabase secures direct DB; service_role key rotation | ✅ Mitigated |
| T-02 | Cross-org data leak via misconfigured RLS | 2 | 5 | 10 | 86 RLS integration tests; mandatory policy review | ⚠️ Ongoing |
| T-03 | JWT tampering or session hijacking | 2 | 4 | 8 | JWT signature verification; short expiry; refresh rotation | ✅ Mitigated |
| T-04 | SQL injection via API | 1 | 5 | 5 | PostgREST parameterized queries; Zod input validation | ✅ Mitigated |
| T-05 | Dependency vulnerability | 3 | 3 | 9 | `npm audit` in CI; dependency review per sprint | ⚠️ Ongoing |
| T-06 | Denial of service via API | 3 | 3 | 9 | Rate limiting planned (Sprint 2 — Platform Services) | ⬜ Planned |
| T-07 | Audit log manipulation | 1 | 5 | 5 | `audit_events` is append-only; no UPDATE/DELETE policies | ✅ Mitigated |
| T-08 | Loss of Supabase Local compatibility | 2 | 4 | 8 | OIDC-ready abstraction; PostgreSQL standard SQL | ⚠️ Ongoing |
| T-09 | Data loss from failed migration | 2 | 4 | 8 | All migrations idempotent; seed data reproducible | ✅ Mitigated |
| T-10 | Insider threat — malicious org_admin | 2 | 5 | 10 | Audit trail covers all mutations; separation of duties via roles | ⚠️ Ongoing |

---

## Compliance Risks

| # | Risk | Likelihood | Impact | Score | Mitigation | Status |
|---|------|-----------|--------|-------|------------|--------|
| C-01 | HIPAA violation from PHI exposure | 2 | 5 | 10 | De-identification by default; BAA required for PHI | ⬜ Planned |
| C-02 | GDPR violation from EU personal data | 2 | 5 | 10 | DPA required; data residency planning | ⬜ Planned |
| C-03 | 21 CFR Part 11 non-compliance | 1 | 4 | 4 | Audit trail already Part 11-ready; electronic signature pending | ⬜ Planned |
| C-04 | Cross-border data transfer restriction | 3 | 4 | 12 | Data residency architecture; SCCs in DPA | ⬜ Planned |
| C-05 | Insufficient consent for biospecimen use | 3 | 5 | 15 | Consent tracking in regulatory engine; ICF templates | ⬜ Planned |

---

## Business Risks

| # | Risk | Likelihood | Impact | Score | Mitigation | Status |
|---|------|-----------|--------|-------|------------|--------|
| B-01 | Platform mistaken for CRO/LIMS | 3 | 3 | 9 | Clear positioning; ADR-004 boundaries | ✅ Mitigated |
| B-02 | Network effect not achieved | 3 | 4 | 12 | Open integration; no vendor lock-in | ⚠️ Ongoing |
| B-03 | Competitor builds equivalent platform | 4 | 3 | 12 | 5 compounding assets (network, regulatory library, intelligence) | ⚠️ Ongoing |
| B-04 | Regulatory change impacts business model | 2 | 4 | 8 | Modular architecture; compliance team | ⬜ Planned |
| B-05 | Customer concentration risk | 3 | 3 | 9 | Multi-tenant by design; no single-org dependency | ✅ Mitigated |

---

## Risk Treatment Plan

### Immediate (Pre-Beta)

| Risk | Action | Owner | Deadline |
|------|--------|-------|----------|
| C-01 | Create BAA template | Legal | Pre-Beta |
| C-02 | Create DPA template | Legal | Pre-Beta |
| T-06 | Implement rate limiting | Engineering | Beta |
| C-05 | Deploy ICF template engine | Product | Beta |

### Short-term (Beta)

| Risk | Action | Owner |
|------|--------|-------|
| T-02 | Quarterly RLS policy audit | Security |
| T-05 | Dependency scanning in CI | Engineering |
| C-04 | Data residency architecture | Engineering |
| B-02 | Partner integration program | Business |

### Long-term (GA)

| Risk | Action | Owner |
|------|--------|-------|
| C-01 | SOC 2 Type I audit | Compliance |
| C-03 | 21 CFR Part 11 validation | QA |
| B-04 | Regulatory monitoring program | Legal |
