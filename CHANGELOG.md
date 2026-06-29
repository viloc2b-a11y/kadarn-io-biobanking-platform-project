# Changelog

All notable changes to Kadarn are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and Kadarn follows [Semantic Versioning](https://semver.org/) once it reaches a Public API release (see Stability Policy, Blueprint §22).

---

## [v1.0.0-alpha.2] — 2026-06-28 — Pilot Readiness Validated

### Added

- **APF-01 Identity Bootstrap** — `scripts/seed-pilot-users.ts` creates 7 pilot users in Supabase Auth with profiles and memberships. Idempotent, no passwords committed, production safety guard.
- **APF-02 Sample Lifecycle Schema Fix** — Migration 033: `ALTER TABLE collection_twins ALTER COLUMN id SET DEFAULT gen_random_uuid()`. Resolves pilot blocker where collection inserts failed without explicit UUID.
- **APF-03 Twin UUID Hardening** — Migration 034: Added `DEFAULT gen_random_uuid()` to 4 twin tables (organization_twins, shipment_twins, specimen_twins, transaction_twins). Schema audit of 19 pilot-critical tables completed.
- **APF-04 Pilot Re-run** — Full 10-step pilot flow executed successfully (0 errors, score 9/10).
- **ALPHA-PILOT-01 Production Seed** — `scripts/seed-pilot.sql` with realistic pilot data (6 orgs, 2 programs, exchange flow, shipments, provenance).
- **ALPHA-PILOT-02 Operational Runbook** — Complete 30-day pilot runbook with success/failure criteria, recovery/rollback procedures.
- **ALPHA-PILOT-03 Pilot Execution** — First pilot run identified 8 issues (3 critical). Score: 4.3/10.
- **SIT-01 Supabase Integration Gate** — 38 tests validating connection, migrations, RLS, provenance, RPCs, key tables.
- **Audit coverage completion** — Centralized `emitAuditEvent()`. 23/25 state-changing routes verified.

### Fixed

- **collection_twins.id** now auto-generates UUID (Migration 033)
- **4 twin tables** now auto-generate UUIDs (Migration 034)
- **check-secrets.sh** exclusions updated for documentation files

### Changed

- `.env.example` — Created for all app directories with placeholders only
- `scripts/check-secrets.sh` — Improved exclusion patterns
- `docs/ops/SUPABASE-SECRETS-SETUP.md` — Secret classification and rotation procedures

### Known Limitations

- Real external biobank not yet onboarded
- Production Supabase not yet validated
- Stripe / payment gateway not integrated
- OPA external adapter (KPE-03) deferred
- Policy decision persistence (KPE-02) deferred
- Temporal SDK not installed
- FHIR adapter not implemented

### Verification

```
npm test             415 passed (30 files)
npx tsc --noEmit     0 errors
npm run build        Build OK
bash check-secrets   All clear
```

---

## [0.1.0] — 2026-06-26 — Foundation Validated

### Added

- **Trust & Security Foundation** — 86 security tests passing across 7 suites:
  - Identity (19 tests): JWT login, memberships, multi-org users
  - Authorization (17 tests): RLS isolation, program access, role checks
  - Audit (6 tests): audit triggers, immutability, actor tracking
  - Threat (13 tests): JWT tampering, org spoofing, privilege escalation
  - Compliance (19 tests): timestamp consistency, data integrity, immutability
  - Concurrency (14 tests): unique constraints, race conditions, idempotency
  - Performance (8 tests): baseline metrics for login and queries
- **ADR-003** — Processing Engine Philosophy: bounded LIMS integration
- **ADR-004** — Platform Boundaries: explicit scope of what Kadarn does/doesn't do
- **Kadarn Processing Engine** — Blueprint §12: sample lifecycle, workflows, QC, storage, custody, instrument runs, LIMS connectors
- **Domain events package** — `packages/domain-events/` with 17 typed event contracts + EventBus interface
- **Stability policy** — Blueprint §22: Experimental / Stable / Public levels
- **Repository governance** — `CONTRIBUTING.md`, `ARCHITECTURE.md`, `CHANGELOG.md`

### Changed

- **Blueprint restructured** — Sections renumbered 12→22 to accommodate Processing Engine
- **Sprint roadmap updated** — Processing Engine sprint added; Sprint 0 marked ✅ Committed
- **Migrations moved** — `apps/backend/migrations/` → `database/migrations/`

### Fixed

- **PostgREST permissions** — Base-level grants for `authenticated` role restored after DROP/CREATE cycle
- **Audit trigger table mapping** — Plural table names (`programs` → `'program'`) now correctly map to singular enum values
- **RLS detection in tests** — `tryDelete`/`tryUpdate` now detect when PostgREST returns 204 with 0 affected rows
- **User creation** — `admin_create_user` SQL function replaced by `seed-users.ts` using Auth API (SQL-only creation didn't produce login-capable users)
- **JWT claims** — `sync_profile_to_auth_meta` trigger now merges instead of overwriting `raw_app_meta_data`

### Security

- All RLS policies verified against real JWT contexts
- Threat validation confirms: JWT tampering blocked, org ID spoofing blocked, privilege escalation blocked
- Audit immutability confirmed: no UPDATE or DELETE policies on `audit_events`

---

## [0.0.1] — 2026-06-25 — Sprint 0 Foundation

### Added

- Initial blueprint — 20 sections covering architecture, principles, engines, roadmap
- ADR-001: Platform Core vs. Service Layer Separation
- ADR-002: Multi-Tenant Architecture & Organization Model
- Strategic positioning document
- Salvage review: prototype → clean platform classification
- Database migrations 008-012:
  - 008: Organizations, capabilities, memberships, roles, identity providers
  - 009: RLS helper functions + policies for all Sprint 0 tables
  - 010: Audit events, programs, program participants, access policies
  - 011: Seed data (7 orgs, 8 users, 2 programs)
  - 012: Structural smoke tests (53 tests)

### Changed

- Prototype archived as `archive/pre-kadarn-platform-prototype`
- Vilo-specific code removed from all migrations

---

## Future Releases

| Version | Sprint | Focus |
|---------|--------|-------|
| 0.2.0 | 1B | Core API |
| 0.3.0 | 2 | Platform Services |
| 0.4.0 | 3 | Discovery Engine |
| 0.5.0 | 4 | Feasibility Engine |
| 0.6.0 | 5 | Program Engine |
| 0.7.0 | 6 | Exchange Engine |
| 0.8.0 | 7 | Fulfillment / Chain |
| 0.9.0 | 8 | Regulatory |
| 0.10.0 | 9 | Processing Marketplace |
| 0.11.0 | 10 | Analytics |
| 0.12.0 | 11 | AI Layer |
