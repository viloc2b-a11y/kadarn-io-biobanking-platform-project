# AF-4.0 Production Operations (Sprint 9)

## Runbooks

| Runbook | Path |
|---------|------|
| Phase 8 cutover | [phase-8-cutover-runbook.md](phase-8-cutover-runbook.md) |
| Reliability | [af-4.0-reliability-runbook.md](af-4.0-reliability-runbook.md) |
| Secrets | `docs/ops/SUPABASE-SECRETS-SETUP.md` |
| Incident (template) | Below |

## SLO (initial)

| Service | SLI | Target |
|---------|-----|--------|
| API availability | `/api/health/ready` success | 99.5% |
| API latency | p95 < 2s | 99% |
| Discovery report | success rate | 99% |

## Error budget

- Monthly 0.5% downtime ≈ 3.6h
- Burn review weekly in KOC platform-health

## Alert escalation

1. Pager → on-call engineer
2. 15m → platform lead
3. 30m → architecture review if Phase 8/9 surfaces affected

## Incident playbook (summary)

1. Acknowledge alert
2. Check `/api/health/ready` + Grafana dashboards
3. Correlate via `x-correlation-id` in logs
4. Rollback if cutover-related (see phase-8 runbook)
5. Post-incident doc in `openspec/incidents/`

## Gate

- [x] Runbooks linked
- [x] SLO/error budget defined
- [ ] Tabletop exercise documented
