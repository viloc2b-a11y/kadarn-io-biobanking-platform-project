import { test as base, expect } from '@playwright/test';

const E2E_SESSION_COOKIE = 'kadarn-e2e-session';
const E2E_SESSION_VALUE = 'workspace';

/**
 * RC-9.2 — Workspace auth harness (no Supabase, no skip).
 * Requires KADARN_E2E_AUTH=true on the Playwright webServer (see playwright.config.ts).
 */
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const origin = baseURL ?? 'http://127.0.0.1:3099';
    await page.context().addCookies([
      {
        name: E2E_SESSION_COOKIE,
        value: E2E_SESSION_VALUE,
        url: origin,
      },
    ]);
    await use(page);
  },
});

export { expect };

export async function gotoDeliveryWorkspace(page: import('@playwright/test').Page): Promise<void> {
  // Avoid networkidle — Next dev HMR keeps connections open and can hang/time out.
  await page.goto('/workspace/delivery', { waitUntil: 'load', timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Delivery Workspace' })).toBeVisible({
    timeout: 30_000,
  });
  // Client components hydrate after DOM paint — wait before tab clicks.
  await page.waitForFunction(
    () => {
      const tab = document.querySelector('[role="tablist"] [role="tab"]');
      return tab != null && Object.keys(tab).some((key) => key.startsWith('__reactFiber'));
    },
    { timeout: 30_000 },
  );
  await expect(page.getByRole('tab', { name: 'Artifacts' })).toHaveAttribute('aria-selected', 'true');
}
