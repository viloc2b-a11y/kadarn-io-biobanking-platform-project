# AF-4.0 Performance Report (Sprint 4)

**Date:** 2026-07-03  
**Environment:** CI / local in-process benchmarks

## Capacity baseline (in-process Published View)

| Surface | Target p95 | Gate |
|---------|------------|------|
| Passport | < 50ms | PASS |
| Institution public | < 50ms | PASS |
| Discovery report | < 100ms | PASS |

## Load testing (staging)

Run against staging URL when available:

```bash
# k6 example (install k6 separately)
k6 run scripts/load/k6-staging-smoke.js
```

## Profiling

- Memory: `node --inspect` on API dev server
- DB: Supabase slow query log in dashboard

## Cache strategy

Deferred until HTTP profiling shows hot paths. Candidate: institution public by org ID (TTL 60s).

## Gate

- [x] Benchmark suite in `tests/performance/`
- [x] Performance CI workflow (nightly)
- [ ] Full k6 load test against shared staging (ops)
