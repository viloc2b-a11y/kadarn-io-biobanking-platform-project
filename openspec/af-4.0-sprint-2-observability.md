# AF-4.0 Sprint 2 — Observability Platform

**Depends on:** Sprint 1 PASS  
**Status:** Implemented (scaffolding + alert rules)

---

## Dashboards

| Dashboard | Metrics source | Config |
|-----------|----------------|--------|
| Health | `/api/health`, `/api/health/ready` | [`infra/observability/dashboards/health.json`](../infra/observability/dashboards/health.json) |
| API | `kadarn_http_*` | [`infra/observability/dashboards/api.json`](../infra/observability/dashboards/api.json) |
| Evidence Pipeline | `kadarn_discovery_*` (hooks) | [`infra/observability/dashboards/evidence-pipeline.json`](../infra/observability/dashboards/evidence-pipeline.json) |
| Published View | `kadarn_published_view_*` | [`infra/observability/dashboards/published-view.json`](../infra/observability/dashboards/published-view.json) |
| Latency / Errors | p95 from histograms | [`infra/observability/dashboards/latency-errors.json`](../infra/observability/dashboards/latency-errors.json) |

## Alert rules

See [`infra/observability/alerts/kadarn-alerts.yaml`](../infra/observability/alerts/kadarn-alerts.yaml):

- `KadarnHighErrorRate` — error rate > 5% for 5m
- `KadarnHighLatencyP95` — p95 > 2s for 5m
- `KadarnReadinessFail` — `/api/health/ready` fail for 2m

## Metrics explorer

Prometheus scrape target: `GET /api/metrics` on API service.

## KEMS-007 hooks

Delivery Layer should register metrics via:

```typescript
import { getMetricsRegistry } from '@kadarn/instrumentation'
getMetricsRegistry().counter('kadarn_delivery_pack_total', 1, { channel: 'email' })
```

## Gate

- [x] Alert rules defined
- [x] Dashboard JSON stubs importable to Grafana
- [ ] OTel exporter (deferred — noop tracer until backend selected)
