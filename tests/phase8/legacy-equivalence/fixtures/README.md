# Staging Golden Fixtures — Legacy Equivalence Gate (28J→28K)

Anonymized snapshots representing staging-like data for Phase 8 cutover validation.

**Capture protocol (when refreshing from staging):**

1. Export response from legacy path before cutover.
2. Anonymize org names, IDs, PII, sponsor labels.
3. Store under this directory.
4. Re-run `npm run test:gate-28jk`.

| File | Surface | Route |
|------|---------|-------|
| `staging-passport.json` | Passport | `GET /api/v1/continuity/passport/:slug` |
| `staging-institution-public.json` | Institution public | `GET /api/v1/institution/public/:slug` |
| `staging-discovery-dashboard.json` | Discovery dashboard | `GET /api/v1/discovery/dashboard` |
| `staging-discovery-report.json` | Discovery report | `GET /api/v1/discovery/report` |

**Not in scope:** `/api/v1/institution/profile` — deferred internal/authenticated (Sprint 28K+).
