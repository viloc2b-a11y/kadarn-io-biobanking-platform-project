# Delivery Workspace — Web Gates

## Gate Checklist

| Gate | Command | Expectation |
|------|---------|-------------|
| TypeScript | `npm run type-check` | 0 new errors |
| E2E | `npm run test:e2e` | All delivery workspace tests pass |
| A11y | `npm run test:a11y` | Accessibility checks pass |
| Build | `npm run build` | Next.js build succeeds |

## Run All Gates

```bash
npm run gate:web
```

## Test Files

- `e2e/delivery-workspace.spec.ts` — 13 E2E tests covering shell, all 8 tabs, and resilience
- `e2e/a11y.spec.ts` — 7 accessibility tests (ARIA roles, keyboard nav, focus order, heading hierarchy)
- `e2e/fixtures/authenticated-workspace.ts` — RC-9.2 mock session cookie + hydration wait

## Playwright Configuration

- Browser: Chromium (Desktop Chrome)
- Base URL: `http://127.0.0.1:3099`
- Parallel: yes (workers: 1 in CI)
- Reporter: HTML
- Trace: on-first-retry
- Web server: auto-starts `next dev --webpack -p 3099` with env from `.env.local` / `.env.test` (RC-9.1)

## Environment (RC-9.1)

Playwright loads env via `@next/env` (same as Next.js) before starting tests:

1. `apps/web/.env`, `.env.local`, `.env.development*` (Next.js standard)
2. Monorepo root `.env.local` / `.env` (unset keys only)
3. `apps/web/.env.test`, `.env.playwright` (overrides)

Required for E2E (names only — never log values):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Template: copy `.env.test.example` → `.env.test` if `.env.local` is unavailable in CI.

Set `PLAYWRIGHT_REUSE_SERVER=true` only when a dev server is already running with valid env.

## E2E Auth Harness (RC-9.2)

Delivery workspace E2E uses a **controlled bypass** — not production auth, not real Supabase keys:

| Mechanism | Purpose |
|-----------|---------|
| `KADARN_E2E_AUTH=true` (webServer env) | Server middleware bypass for `/workspace/*` |
| `NEXT_PUBLIC_KADARN_E2E_AUTH=true` | Client mock session in SessionProvider |
| Cookie `kadarn-e2e-session=workspace` | Set by Playwright fixture before navigation |

Rules: no `test.skip`, no real keys, no `delivery-domain` changes. Fixture waits for React hydration before tab interaction.

**Gate RC-9.2:** `npm run test:e2e` → **20/20 PASS**

## Manual Run

```bash
# Start dev server first (or let Playwright auto-start it)
npm run dev

# In another terminal:
npx playwright test
npx playwright test --ui          # interactive
npx playwright test e2e/a11y.spec.ts  # a11y only
```

## CI

```bash
CI=true npm run test:e2e
```
