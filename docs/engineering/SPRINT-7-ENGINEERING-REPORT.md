# Sprint 7 — Engineering Report

**Program:** Kadarn v1.0 Hardening  
**Sprint:** Observability  
**Version:** `1.0.0-hardening.7`  
**Date:** 2026-06-28  
**Gate status:** PASS (`npm run verify`)

---

## Objective

Make Kadarn observable — logs, metrics, tracing, alerts, health, readiness, and dashboards — with technology choices driven by value, not fashion.

**Gate:** Platform exposes structured logs, Prometheus metrics, health/readiness probes, and documented alert/dashboard artifacts.

---

## Technology evaluation

| Tool | Verdict | Why |
|------|---------|-----|
| Structured stdout JSON | ✅ Now | Zero infra; Loki-compatible when needed |
| Prometheus (pull metrics) | ✅ Now | `/api/metrics`; standard K8s scrape |
| OpenTelemetry-compatible tracing | ✅ Incremental | Recording tracer; OTLP when endpoint configured |
| Grafana | ✅ Artifacts | Dashboard JSON + optional local compose |
| Alert rules (YAML) | ✅ Now | Versioned; requires Prometheus to fire |
| Loki | ⏸ Defer | Centralized log search at scale — not required for pilots |
| Tempo | ⏸ Defer | Distributed trace UI — span logs bridge until multi-service |

Full rationale: `observability/EVALUATION.md`

---

## Architecture

```
API startup (instrumentation.ts)
  → initObservability()
      ├─ metrics: always on (in-process)
      ├─ logging: structured JSON (KADARN_LOG_LEVEL)
      └─ tracing: noop | RecordingTracer (KADARN_TRACING=enabled)

Request / pipeline
  → withAsyncTracing (routes)
  → runPipeline → executeStage
      ├─ observeHistogram(kadarn_pipeline_stage_duration_ms)
      ├─ incrementCounter(kadarn_pipeline_stage_total)
      └─ runTelemetryStage → logInfo('pipeline.completed')

Probes
  GET /api/health        → liveness + uptime + observability status
  GET /api/health/ready  → database + event_runtime + observability
  GET /api/metrics       → Prometheus text exposition
```

---

## Metrics catalog

| Metric | Type | Labels |
|--------|------|--------|
| `kadarn_health_checks_total` | counter | probe, status |
| `kadarn_pipeline_runs_total` | counter | pipeline, status |
| `kadarn_pipeline_stage_total` | counter | pipeline, stage, status |
| `kadarn_pipeline_stage_duration_ms` | histogram | pipeline, stage |
| `kadarn_domain_events_published_total` | counter | event_type |

---

## Optional local stack

```bash
docker compose -f observability/docker-compose.yml up
```

- Prometheus: http://localhost:9090  
- Grafana: http://localhost:3000 (admin/admin)

---

## Verification

```bash
npm run verify
```

Health: `GET /api/health` → `1.0.0-hardening.7`  
Readiness: `GET /api/health/ready` → 200 when Supabase reachable
