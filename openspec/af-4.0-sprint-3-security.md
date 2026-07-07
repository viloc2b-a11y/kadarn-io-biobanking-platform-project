# AF-4.0 Sprint 3 — Security Hardening

**Status:** Implemented

## Deliverables

| Item | Location |
|------|----------|
| Security headers (API + Web) | `apps/api/next.config.ts`, `apps/web/next.config.ts` |
| CSP | Same |
| Rate limit unified code | `apps/api/src/lib/rate-limit.ts` → `API_RATE_LIMITED` |
| Dead rate-limiter removed | Deleted `apps/api/src/lib/rate-limiter.ts` |
| Dependency audit script | `npm run audit:deps` |
| SBOM generation | `npm run sbom:generate` → `scripts/generate-sbom.sh` |
| CI security workflow | `.github/workflows/security.yml` |
| Secret scan | `npm run check:secrets` (existing) |

## JWT review

- Bearer + cookie dual path: `apps/api/src/lib/supabase-server.ts`
- Role guards: `apps/api/src/lib/auth-guards.ts`
- Security test suite: `tests/security/`

## Gate

- [x] Security headers configured
- [x] CI security workflow defined
- [ ] Zero high vulns — run `npm audit` in CI (may require dependency updates)

## Secret rotation

See `docs/ops/SUPABASE-SECRETS-SETUP.md` — rotate via Supabase dashboard + rolling restart.
