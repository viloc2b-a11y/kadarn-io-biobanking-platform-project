# Phase 8 Cutover Runbook — Sprint 28K

**Prerequisite:** [phase-8-gate-28JK-report.md](phase-8-gate-28JK-report.md) — PASS  
**Parent:** [phase-8-evidence-evolution-architecture.md](phase-8-evidence-evolution-architecture.md)

---

## Objective

Controlled cutover from Compatibility Layer (Read Adapter) to native Published Views for external-facing surfaces, with a monitoring period and documented rollback.

**Not in scope for this cutover:**

- `/api/v1/institution/profile` — internal authenticated; explicitly deferred
- Phase 9 (Evidence Delivery)
- Removing Compatibility Layer code (retained for rollback until monitoring period ends)

---

## Cutover flag

```bash
LEGACY_PASSPORT_ENABLED=false
```

**Default:** unset or any value other than `false` → legacy adapter **enabled** (pre-cutover).

**Effect when `false`:**

- `PublishedViewService` disables `LegacyReadAdapter` for passport reads
- Native `PublishedViewEngine` serves views already registered in-process
- Compatibility Layer **code remains deployed** — re-enable flag to rollback

Configured in `apps/api/src/lib/published-view-service.ts`.

---

## Cutover procedure

### Pre-cutover checklist

- [ ] Gate 28J→28K report PASS
- [ ] Migration `048_phase8_hybrid_index.sql` applied in target environment
- [ ] Native views populated for orgs with active public passports (post-28K data backfill if required)
- [ ] On-call engineer assigned for monitoring window

### Step 1 — Staging validation

1. Set `LEGACY_PASSPORT_ENABLED=false` in staging API environment.
2. Smoke-test all four external routes:
   - Passport public page
   - Institution public page
   - Discovery dashboard
   - Discovery report export
3. Confirm response shapes unchanged (no API contract changes).

### Step 2 — Production cutover

1. Deploy current build (Compatibility Layer code included, flag still `true`).
2. Verify health endpoint and gate-equivalent smoke paths.
3. Set `LEGACY_PASSPORT_ENABLED=false` in production API environment.
4. Rolling restart API instances to pick up env change.

### Step 3 — Monitoring period (recommended: 2 weeks)

Monitor:

| Signal | Threshold / action |
|--------|-------------------|
| 5xx rate on migrated routes | Rollback if sustained elevation vs baseline |
| Empty passport responses for known-active slugs | Investigate native view backfill |
| Discovery dashboard empty capability sections | Rollback if user-facing regression |
| Error logs: `Phase 8 boundary violation` | Block release; adapter bypass detected |

---

## Rollback plan

**Trigger:** Sustained errors, empty public surfaces for known-good orgs, or product-significant UX regression.

**Rollback steps (< 15 minutes):**

1. Set `LEGACY_PASSPORT_ENABLED=true` (or unset the variable).
2. Rolling restart API instances.
3. Verify legacy adapter path restores passport/institution/discovery responses.
4. Re-run gate suite against staging: `npm run test:gate-28jk -w tests`
5. File incident note; do not remove Compatibility Layer code.

**Why rollback is safe:**

- `LegacyReadAdapter` and `adaptDiscoveryAgentOutputs` remain in the deployed artifact
- No API response shape changes in this sprint — consumers see identical JSON
- Hybrid index migration is additive; rollback does not require DB revert

**What rollback does NOT restore:**

- In-flight native-only views written after cutover (non-destructive; legacy path re-serves from source tables)

---

## Post-monitoring

After monitoring period with no rollback:

1. Mark Sprint 28K cutover complete in [architecture-freeze-af-3.0-checklist.md](architecture-freeze-af-3.0-checklist.md)
2. Schedule Compatibility Layer code removal (separate change, post-28L)
3. Plan `/institution/profile` migration in a future sprint (internal surface)

---

## Commands

```bash
# Gate validation
npm run test:gate-28jk -w tests

# Full Phase 8 equivalence
npm run test:phase8 -w tests

# Typecheck
npm run typecheck
```

---

*Option C — Compatibility Layer retained until monitoring sign-off.*
