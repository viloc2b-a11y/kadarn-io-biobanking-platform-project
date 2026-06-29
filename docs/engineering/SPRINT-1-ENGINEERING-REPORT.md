# Sprint 1 — Engineering Report

**Program:** Kadarn v1.0 Hardening  
**Sprint:** Repository Integrity & Engineering Foundation  
**Version:** `1.0.0-hardening.1`  
**Date:** 2026-06-28  
**Gate status:** PASS

---

## Objective

Make the repository trustworthy for any developer: reproducible install, build, typecheck, tests, and CI.

---

## Root causes fixed

| Issue | Root cause | Fix |
|-------|------------|-----|
| Build failed (`next/dist/bin/next` missing) | Corrupted / incomplete `node_modules`; nested lockfiles | `npm ci` from single root lockfile; removed 4 nested `package-lock.json` |
| Typecheck only checked `packages/types` | Root script pointed at one tsconfig | `npm run typecheck --workspaces --if-present` across 23 workspaces |
| Web typecheck failed | Implicit `any` in middleware `setAll` | Typed `CookieOptions` from `@supabase/ssr` |
| Web build failed (SSG) | `useSearchParams` without Suspense on 3 pages | Wrapped login, feasibility, access forms in `<Suspense>` |
| Web build failed (env) | Missing Supabase env at build time | Build fallbacks in `apps/web/next.config.ts` + CI env |
| Turbopack wrong root | Multiple lockfiles / parent `package-lock.json` | `turbopack.root` → monorepo root |
| `check:secrets` failed on Windows | Bash CRLF / `pipefail` | Cross-platform `scripts/check-secrets.mjs` |
| Orphan workspace deps | `platform-services` used relative path | `@kadarn/domain-events: "*"` |
| TS errors in packages | Missing exports, wrong imports, empty `@kadarn/ui` | Fixed knowledge-engine, platform-services, trust-engine, added `ui/index.ts` |

---

## Verification (executed 2026-06-28)

```
npm run typecheck   → PASS (23 workspaces)
npm run build       → PASS (web + api)
npm test            → 406 passed, 38 skipped (SIT-01 offline)
npm run check:secrets → PASS (warnings only in pilot shell scripts)
npm run verify      → PASS
```

---

## Deliverables

| Deliverable | Location |
|-------------|----------|
| CI workflow | `.github/workflows/ci.yml` |
| Test matrix | `docs/engineering/TEST-MATRIX.md` |
| Unified scripts | Root `package.json` |
| Secret scanner | `scripts/check-secrets.mjs` |
| This report | `docs/engineering/SPRINT-1-ENGINEERING-REPORT.md` |

---

## Official npm scripts

```json
{
  "build": "web + api",
  "typecheck": "all workspaces",
  "test": "offline unit gate",
  "test:integration": "api + security (manual)",
  "test:all": "full vitest",
  "check:secrets": "node scanner",
  "verify": "typecheck + build + test + check:secrets"
}
```

---

## Known limitations (Sprint 2+ scope)

- Integration/security tests still require local Supabase — not in CI yet
- Pilot shell scripts contain Supabase demo JWT literals (warned, not blocking)
- `npm audit` reports 2 moderate vulnerabilities in dev dependencies
- API health route still reports legacy version string (Sprint 2 cleanup)

---

## Gate decision

**Sprint 1 gate: PASS** — No official command fails on a clean `npm ci` + `npm run verify`.
