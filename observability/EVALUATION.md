# Kadarn Observability Stack — Technology Evaluation

**Sprint 7 decision record.** Adopt only what adds measurable value for pilot operations and production readiness.

---

## Summary

| Technology | Decision | Rationale |
|------------|----------|-----------|
| **Structured logs (stdout JSON)** | ✅ Adopt now | Zero infra cost; Loki-compatible without running Loki locally |
| **Prometheus metrics (pull)** | ✅ Adopt now | `/api/metrics` exposition; fits K8s ServiceMonitor pattern |
| **OpenTelemetry (API-compatible tracing)** | ✅ Adopt incrementally | Recording tracer today; OTLP export when `OTEL_EXPORTER_OTLP_ENDPOINT` set |
| **Grafana dashboards** | ✅ Adopt as artifacts | JSON provisioning + optional local compose — no runtime dependency |
| **Prometheus Alertmanager rules** | ✅ Adopt as YAML | Alert definitions versioned; firing requires Prometheus in env |
| **Loki** | ⏸ Defer | Value when centralized log search is required at scale; stdout JSON is sufficient for pilots |
| **Tempo** | ⏸ Defer | Value when distributed trace search across services is required; structured span logs bridge the gap |
| **Full OTel SDK in every package** | ⏸ Defer | `@kadarn/telemetry` abstraction keeps call sites stable; SDK adds bundle weight to API |

---

## What Kadarn ships in Sprint 7

1. **Logs** — JSON structured logger (`@kadarn/telemetry/logger`) with `correlationId`, `traceId`, pipeline context
2. **Metrics** — In-process registry + Prometheus text at `GET /api/metrics`
3. **Tracing** — No-op default; `KADARN_TRACING=enabled` activates RecordingTracer with span logs
4. **Health** — `GET /api/health` (liveness + uptime + observability status)
5. **Readiness** — `GET /api/health/ready` (database + event runtime + observability checks)
6. **Alerts** — `observability/prometheus/alerts.yml` (readiness down, pipeline error rate)
7. **Dashboard** — `observability/grafana/dashboards/kadarn-platform.json`

---

## Local stack (optional)

```bash
docker compose -f observability/docker-compose.yml up
```

Scrapes `host.docker.internal:3001/api/metrics`. Grafana: http://localhost:3000 (admin/admin).

---

## Production path

1. **Now:** scrape `/api/metrics`, ship stdout logs to your aggregator, enable `KADARN_TRACING=enabled`
2. **When multi-service:** add OTel Collector → Tempo + Loki
3. **When SLOs formalized:** wire Alertmanager to on-call (PagerDuty/Slack)

No component is required for `npm run verify` or pilot operation offline.
