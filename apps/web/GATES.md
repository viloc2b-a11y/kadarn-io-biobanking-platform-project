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

- `e2e/delivery-workspace.spec.ts` — 15 E2E tests covering shell, all 8 tabs, and resilience
- `e2e/a11y.spec.ts` — 7 accessibility tests (snapshot, keyboard nav, ARIA roles, focus order, heading hierarchy)

## Playwright Configuration

- Browser: Chromium (Desktop Chrome)
- Base URL: `http://localhost:3000`
- Parallel: yes
- Reporter: HTML
- Trace: on-first-retry
- Web server: auto-starts `npm run dev`

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
