# KEMS Site Profile Production — Deployment Checklist

> **Branch:** `feat/kems-site-profile-production`  
> **Specs:** WO-KEMS-DOC-003, WO-KEMS-PRODUCTION-001  
> **Schema:** site-profile-state-machine/v1, claim-state-machine/v1  
> **Last updated:** 2026-07-30  

---

## Pre-Deployment Gate

- [ ] All PRs merge to `feat/kems-site-profile-production`  
- [ ] CI green on latest commit (`npm run gate:web` — type-check + e2e + a11y)  
- [ ] No unresolved review comments on migrations 096–098  
- [ ] Architecture review complete (KADARN Architecture Constitution v2.0)  
- [ ] Spec files synchronized with migration state:
  - [ ] `specs/site-profile/profile-state-machine.yml`  
  - [ ] `specs/site-profile/claim-state-machine.yml`  
  - [ ] `specs/site-profile/capability-activation.yml`  
  - [ ] `specs/site-profile/visibility-policy.yml`  
  - [ ] `specs/site-profile/onboarding-rules.yml`  

---

## Phase 1: Backup Database

| Step | Action | Command / Verification | Owner | 
|------|--------|----------------------|-------|
| 1.1 | Identify target Supabase project | `supabase projects list` | DBA | 
| 1.2 | Verify backup schedule is active (PITR enabled) | Supabase Dashboard → Database → Backups | DBA | 
| 1.3 | Create manual snapshot before migration run | `supabase db dump --data-only > pre_migration_backup_$(date +%Y%m%d).sql` | DBA | 
| 1.4 | Verify backup file is > 0 bytes and readable | `wc -l pre_migration_backup_*.sql` and spot-check | DBA | 
| 1.5 | Store backup off-instance (S3 / GCS / Azure Blob) | Upload to `kadarn-backups/migration-pre/` | DBA | 

---

## Phase 2: Dry-Run Migrations

| Step | Action | Command / Verification | Owner |
|------|--------|----------------------|-------|
| 2.1 | Pull latest migration list | `supabase migration list` | Dev |
| 2.2 | Verify migrations 096–098 are in the list and ordered correctly | `supabase migration list \| grep -E "096\|097\|098"` | Dev |
| 2.3 | Execute dry-run against local Supabase | `supabase db reset && supabase db push --dry-run` | Dev |
| 2.4 | Review dry-run output for errors | Check for DDL conflicts, missing dependencies, enum collisions | Dev |
| 2.5 | Verify seed data applies cleanly (idempotent) | `supabase db reset && psql < database/seeds/pilot_vilo_research.sql` | Dev |
| 2.6 | Validate seed data integrity | Query counts: `SELECT COUNT(*) FROM site_profiles`, `claims`, `capability_instances`, `evidence_nodes` | Dev |
| 2.7 | Run RLS policy verification script | `supabase db test` (ensure all new tables have RLS policies) | Dev |

---

## Phase 3: Staging Deploy

| Step | Action | Command / Verification | Owner |
|------|--------|----------------------|-------|
| 3.1 | Promote staging branch to match `feat/kems-site-profile-production` | Merge or reset staging | Dev |
| 3.2 | Push migrations to staging Supabase project | `supabase db push --linked --password <staging-password>` | Dev |
| 3.3 | Verify all 3 migrations applied | `supabase db remote commit` shows 096–098 in history | Dev |
| 3.4 | Apply pilot seed data to staging | `psql $STAGING_DB_URL -f database/seeds/pilot_vilo_research.sql` | Dev |
| 3.5 | Verify tables exist and indexes created | Run: `\dt public.site_profiles`, `\dt public.capability_instances`, `\dt public.capability_activation_events`, `\dt public.document_taxonomy_rules` | Dev |
| 3.6 | Verify RLS is enabled on new tables | `SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=true AND tablename IN ('site_profiles','site_profile_versions','profile_attestations','profile_publications','capability_instances','capability_claim_links','capability_dependency_status','capability_activation_events','document_taxonomy_rules')` | Dev |
| 3.7 | Verify grants applied | Confirm `authenticated` has SELECT on all new tables; `service_role` has full CRUD | Dev |
| 3.8 | Deploy web app to staging | `vercel deploy` or equivalent CI/CD pipeline | Dev |
| 3.9 | Smoke test staging dashboard | Navigate to observability dashboard, verify metrics render | QA |
| 3.10 | Verify no regressions on existing features | Run existing Playwright test suite against staging | QA |

---

## Phase 4: Integration Tests

| Step | Action | Command / Verification | Owner |
|------|--------|----------------------|-------|
| 4.1 | Profile creation E2E | Create new site profile via UI → verify DB row in `site_profiles` | QA |
| 4.2 | Profile versioning | Update profile → verify new version in `site_profile_versions` | QA |
| 4.3 | Claim submission flow | Submit claims → verify `claims` + `claims_ext` rows | QA |
| 4.4 | Evidence upload flow | Upload evidence → verify `evidence_sources` + `evidence_nodes` rows | QA |
| 4.5 | Capability declaration | Declare capability → verify `capability_instances` row created in DECLARED state | QA |
| 4.6 | Capability activation | Satisfy dependencies → verify state transitions through to ACTIVATED | QA |
| 4.7 | Dependency resolution | Link claims to capability → verify `capability_dependency_status` resolves to SATISFIED | QA |
| 4.8 | Attestation flow | Attest to a profile version → verify `profile_attestations` row + hash integrity | QA |
| 4.9 | Publication flow | Publish profile → verify `profile_publications` row + `visibility_level` | QA |
| 4.10 | Observability dashboard | Verify all metrics + status cards reflect actual DB state | QA |
| 4.11 | API responses match spec | Compare `/api/v1/site-profiles`, `/api/v1/claims`, `/api/v1/evidence` against OpenAPI spec | Dev |
| 4.12 | Performance baseline | Profile creation < 2s, claim listing < 500ms, dashboard load < 3s | Dev |

---

## Phase 5: E2E Pilot (Vilo Research)

| Step | Action | Verification | Owner |
|------|--------|-------------|-------|
| 5.1 | Load pilot seed data | `psql < database/seeds/pilot_vilo_research.sql` → verify 1 profile, 10 claims, 12 evidence nodes, 5 capability instances | Dev |
| 5.2 | Verify Vilo Research profile is PUBLISHED | `SELECT state, current_version FROM site_profiles WHERE institution_id = 'e0000000-0000-0000-0000-000000000001'` | QA |
| 5.3 | Verify therapeutic areas populate correctly | Check profile completions: primary_care, ob_gyn, endocrinology | QA |
| 5.4 | Verify Phase I capability is ACTIVATED | `SELECT state FROM capability_instances WHERE capability_code = 'phase_i_capability'` | QA |
| 5.5 | Verify biospecimen + sample processing activated | Both capability instances show ACTIVATED | QA |
| 5.6 | Verify community recruitment + Spanish language | Both show ACTIVATED | QA |
| 5.7 | Verify equipment claims backed by evidence | Claims 9 (centrifuge) and 10 (freezer) have evidence_count ≥ 1 | QA |
| 5.8 | Verify no PHI in any seed data | Grep: `SELECT * FROM claims WHERE answer_value ~* '(patient|mrn|ssn|dob|credential|password)'` → zero rows | DBA |
| 5.9 | Verify profile appears in network-visible search | Search as sponsor role → Vilo Research passport appears | QA |
| 5.10 | Pilot sign-off | Stakeholder reviews Vilo Research profile → approves pilot completion | PM |

---

## Phase 6: Security Smoke Tests

| Step | Action | Verification | Owner |
|------|--------|-------------|-------|
| 6.1 | RLS — cross-org isolation | Authenticate as Org B user → cannot SELECT Vilo's `site_profiles` | Sec |
| 6.2 | RLS — authenticated cannot INSERT profiles | Attempt direct INSERT into `site_profiles` as authenticated → permission denied | Sec |
| 6.3 | RLS — `service_role` full access | Verify `service_role` can read/write all tables | Sec |
| 6.4 | Append-only enforcement | Attempt UPDATE on `evidence_nodes` → trigger exception | Sec |
| 6.5 | Append-only enforcement | Attempt DELETE on `evidence_nodes` → trigger exception | Sec |
| 6.6 | Immutable versions | Attempt UPDATE on `site_profile_versions` → no UPDATE policy (should fail if code bypasses) | Sec |
| 6.7 | Rate limiting | Verify API endpoints respect rate limits under load | Sec |
| 6.8 | Input validation | Submit malformed JSON to `/api/v1/site-profiles` → 400 with validation error, not 500 | Sec |
| 6.9 | No secrets in responses | Verify API responses never include `password`, `secret`, `token`, `api_key` fields | Sec |
| 6.10 | Dependency audit | `npm audit` → no critical/high vulnerabilities in production deps | Dev |

---

## Phase 7: Production Deploy

| Step | Action | Command / Verification | Owner |
|------|--------|----------------------|-------|
| 7.1 | Final code freeze on `feat/kems-site-profile-production` | No new commits without deployment lead approval | Lead |
| 7.2 | Merge to `main` | PR approved + CI green + all gates passed | Lead |
| 7.3 | Tag release | `git tag -a v2.3.0-kems-production -m "KEMS Site Profile Production GA"` | Lead |
| 7.4 | Push migrations to production Supabase | `supabase db push --linked` (target prod project) | DBA |
| 7.5 | Verify migrations applied | `supabase db remote commit` confirms 096–098 in prod | DBA |
| 7.6 | Apply seed data to production | `psql $PROD_DB_URL -f database/seeds/pilot_vilo_research.sql` | DBA |
| 7.7 | Deploy web app to production | Merge triggers Vercel/CI production deploy | Dev |
| 7.8 | Warm cache / run health checks | Hit key endpoints: `/api/v1/site-profiles`, `/api/v1/claims`, observability dashboard | Dev |
| 7.9 | Monitor error rates (first 30 min) | Supabase logs, Vercel analytics, Sentry/DataDog | SRE |
| 7.10 | Verify pilot profile visible in production | Log in as sponsor → search → Vilo Research passport renders | QA |
| 7.11 | Announcement to stakeholders | Notify pilot participants, internal team | PM |

---

## Rollback Plan

If critical issues are detected in production:

| Step | Action | Command | Owner |
|------|--------|---------|-------|
| R1 | Revert web app deploy | `vercel rollback` or redeploy previous commit | Dev |
| R2 | Disable new RLS policies (if blocking) | `ALTER TABLE public.site_profiles DISABLE ROW LEVEL SECURITY` (temporary) | DBA |
| R3 | Restore database from pre-migration backup | `supabase db restore <backup-id>` | DBA |
| R4 | Notify incident response | Post in #incidents Slack channel | SRE |
| R5 | Root cause analysis | Document in postmortem, add to runbook | Lead |

---

## Post-Deployment Verification

- [ ] All health indicators green on production dashboard  
- [ ] Vilo Research pilot profile visible and complete  
- [ ] No elevated error rates in first 24 hours  
- [ ] Database performance within baseline (query latency, connection count)  
- [ ] Evidence pipeline processing at normal throughput  
- [ ] Capability activation state machine transitions correct under load  
- [ ] Weekly review scheduled (check for claim expiry, evidence decay)  

---

## Contacts

| Role | Name | Contact |
|------|------|---------|
| Deployment Lead | — | — |
| DBA | — | — |
| QA Lead | — | — |
| Security Reviewer | — | — |
| SRE | — | — |
| Product Manager | — | — |
