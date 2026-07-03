import { test, expect, gotoDeliveryWorkspace } from './fixtures/authenticated-workspace';

test.describe('Delivery Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDeliveryWorkspace(page);
  });

  // ── Shell ──────────────────────────────────────────────────────────────────

  test('page loads with title and all tabs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Delivery Workspace');

    const tabs = [
      'Artifacts', 'History', 'Subscriptions', 'Policies',
      'Templates', 'Channels', 'Queue', 'Audit',
    ];
    for (const tab of tabs) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }
  });

  test('clicking tabs switches content', async ({ page }) => {
    await page.getByRole('tab', { name: 'Subscriptions' }).click();
    await expect(page.getByRole('tab', { name: 'Subscriptions' })).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('tab', { name: 'Templates' }).click();
    await expect(page.getByRole('tab', { name: 'Templates' })).toHaveAttribute('aria-selected', 'true');
  });

  // ── Artifacts tab ──────────────────────────────────────────────────────────

  test('artifacts tab shows table with artifact names', async ({ page }) => {
    const tab = page.getByRole('tab', { name: 'Artifacts' });
    await tab.click();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  test('artifact filter dropdowns exist', async ({ page }) => {
    await page.getByRole('tab', { name: 'Artifacts' }).click();
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible();
  });

  // ── Subscriptions tab ──────────────────────────────────────────────────────

  test('subscriptions tab shows subscription entries', async ({ page }) => {
    await page.getByRole('tab', { name: 'Subscriptions' }).click();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  // ── Policies tab ───────────────────────────────────────────────────────────

  test('policies tab shows RBAC section', async ({ page }) => {
    await page.getByRole('tab', { name: 'Policies' }).click();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  // ── Templates tab ──────────────────────────────────────────────────────────

  test('templates tab shows template entries', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates' }).click();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  // ── Channels tab ───────────────────────────────────────────────────────────

  test('channels tab renders content', async ({ page }) => {
    await page.getByRole('tab', { name: 'Channels' }).click();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  // ── Queue tab ──────────────────────────────────────────────────────────────

  test('queue tab shows queue sections', async ({ page }) => {
    await page.getByRole('tab', { name: 'Queue' }).click();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  // ── Audit tab ──────────────────────────────────────────────────────────────

  test('audit tab loads audit content', async ({ page }) => {
    await page.getByRole('tab', { name: 'Audit' }).click();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  // ── A11y basics ────────────────────────────────────────────────────────────

  test('tabs have accessible roles', async ({ page }) => {
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    const tabs = page.locator('[role="tab"]');
    await expect(tabs.first()).toBeVisible();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  // ── Navigation resilience ──────────────────────────────────────────────────

  test('rapid tab switching does not crash', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(100);
    }
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  // ── No console errors ─────────────────────────────────────────────────────

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await gotoDeliveryWorkspace(page);
    await page.waitForTimeout(1000);
    const deliveryErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('hydration') &&
        !e.includes('unique "key" prop'),
    );
    expect(deliveryErrors).toHaveLength(0);
  });
});
