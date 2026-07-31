# PRODUCTION DEPLOYMENT REPORT — WO-KEMS-PRODUCTION-001

**Date:** 2026-07-30
**Authorized HEAD:** `39500a14537613a99f38ebf7474c61a0bcb0a2f0`

---

## 1. Deployment State

```yaml
repository: https://github.com/viloc2b-a11y/kadarn-io-biobanking-platform-project.git
base_branch: master
working_branch: feat/kems-site-profile-production
sha: 39500a14537613a99f38ebf7474c61a0bcb0a2f0
working_tree: CLEAN
diff_scope: I1 remediation (5 lines) + staging/production reports
```

---

## 2. Pre-Deployment Backup

| Metric | Value |
|---|---|
| Method | `pg_dump --clean --if-exists` |
| Size | 30,596 lines |
| Pre-deployment orgs | 9 |
| Pre-deployment claims | 2 |
| Pre-deployment profiles | 2 |
| Pre-deployment taxonomy | 48 |
| Pre-deployment capabilities | 2 |
| Pre-deployment RLS policies | 368 |

---

## 3. Migration Execution

| Migration | Errors (real) | Errors (rel-not-found) | Status |
|---|---|---|---|
| 095 | 0 | 0 | ✅ |
| 096 | 0 | 0 | ✅ |
| 097 | 0 | 2 | ✅ (harmless) |
| 098 | 0 | 0 | ✅ |
| 099 | 0 | 0 | ✅ |

---

## 4. Post-Deployment Verification

| Entity | Pre | Post | Preserved |
|---|---|---|---|
| Organizations | 9 | 9 | ✅ |
| Claims | 2 | 2 | ✅ |
| Site Profiles | 2 | 2 | ✅ |
| Taxonomy Rules | 48 | 48 | ✅ |
| Capability Instances | 2 | 2 | ✅ |
| RLS Policies | 368 | 368 | ✅ |

---

## 5. Smoke Tests

| Test | Result |
|---|---|
| Site profiles present | ✅ 2 (Vilo + Tenant2) |
| Claims present | ✅ 2 (biospecimen, sample_processing) |
| Capabilities present | ✅ 2 (DECLARED 0.10, DOCUMENTED 0.60) |
| Vilo admin isolation | ✅ 1 profile visible |
| Tenant2 admin isolation | ✅ 1 profile visible |
| Cross-tenant access | ✅ DENIED |

---

## 6. Feature Flags

| Flag | Status |
|---|---|
| site_profile_v2 | 🔒 OFF (all tenants) |
| self_claims | 🔒 OFF (all tenants) |
| evidence_linking | 🔒 OFF (all tenants) |
| capability_activation | 🔒 OFF (all tenants) |
| passport_publication | 🔒 OFF (all tenants) |

**Activation pending:** Vilo tenant only, post Human Gate acceptance.

---

## 7. Conclusion

**PRODUCTION DEPLOYMENT: PASS**

- 0 real SQL errors
- 0 data loss
- 368 RLS policies verified
- Tenant isolation confirmed
- All smoke tests pass
- Ready for feature flag activation and acceptance

---

*PRODUCTION_DEPLOYMENT_REPORT.md — WO-KEMS-PRODUCTION-001 — 2026-07-30*
