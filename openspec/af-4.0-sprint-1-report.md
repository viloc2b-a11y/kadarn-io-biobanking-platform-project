# AF-4.0 Sprint 1 — Platform Instrumentation Foundation Report

**Date:** 2026-07-03  
**Verdict:** **SPRINT 1 PASS**

---

## Deliverables

| Item | Status | Location |
|------|--------|----------|
| `@kadarn/instrumentation` package | **DONE** | [`packages/instrumentation/`](../packages/instrumentation/) |
| `KadarnErrorCode` taxonomy | **DONE** | [`packages/types/src/errors.ts`](../packages/types/src/errors.ts) |
| Platform event taxonomy | **DONE** | [`packages/types/src/events/platform-events.ts`](../packages/types/src/events/platform-events.ts) |
| Request/Correlation/Trace ID middleware | **DONE** | [`apps/api/src/middleware.ts`](../apps/api/src/middleware.ts) |
| Route context + unified errors | **DONE** | [`apps/api/src/lib/supabase-server.ts`](../apps/api/src/lib/supabase-server.ts) |
| `initInstrumentation()` startup | **DONE** | [`apps/api/instrumentation.ts`](../apps/api/instrumentation.ts) |
| `GET /api/metrics` (Prometheus) | **DONE** | [`apps/api/src/app/api/metrics/route.ts`](../apps/api/src/app/api/metrics/route.ts) |
| `GET /api/health/ready` | **DONE** | [`apps/api/src/app/api/health/ready/route.ts`](../apps/api/src/app/api/health/ready/route.ts) |
| Metric naming conventions | **DONE** | [af-4.0-metric-naming.md](af-4.0-metric-naming.md) |
| Correlation ID bridge | **DONE** | [`apps/api/src/lib/exchange-helper.ts`](../apps/api/src/lib/exchange-helper.ts) |

## Gate verification

| Gate | Result |
|------|--------|
| Every API request gets `x-request-id` + `x-correlation-id` (middleware) | **PASS** |
| Errors use `KadarnErrorCode` via `handleInstrumentedError` | **PASS** |
| `GET /api/metrics` operational | **PASS** |
| `npm run typecheck` | **PASS** |
| `@kadarn/instrumentation` tests (7/7) | **PASS** |
| `tests/instrumentation/error-taxonomy.test.ts` | **PASS** |

## Standard metrics (base)

- `kadarn_http_requests_total{method,route,status}`
- `kadarn_http_request_duration_seconds{method,route}`
- `kadarn_http_errors_total{method,route,status|code}`

## Out of scope (Sprint 2+)

- Grafana/Datadog dashboards
- OTel exporter (noop tracer retained)
- CSP / security headers
- OpenAPI / SDK

---

*Sprint 1 complete — observability platform (S2) may proceed.*
