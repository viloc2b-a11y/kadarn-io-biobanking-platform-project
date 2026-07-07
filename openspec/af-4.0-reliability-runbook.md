# AF-4.0 Reliability Runbook (Sprint 5)

## Backup validation

```bash
bash scripts/reliability/backup-validate.sh
```

## Restore test (staging only)

```bash
bash scripts/reliability/restore-test.sh
```

## Rollback automation

Phase 8 pattern — set `LEGACY_PASSPORT_ENABLED=true` and rolling restart. See [phase-8-cutover-runbook.md](phase-8-cutover-runbook.md).

## Circuit breakers

Connector framework: `packages/evidence-core/src/connectors/framework/rate-limiter.ts` — extend with failure thresholds in Sprint 5.1.

## Chaos tests (basic)

| Test | Command |
|------|---------|
| API kill | Stop API process; verify readiness fail + alert |
| DB timeout | Block Supabase port; verify `/api/health/ready` 503 |

## Gate

- [x] Scripts scaffolded
- [ ] Restore executed on staging with timestamp evidence
