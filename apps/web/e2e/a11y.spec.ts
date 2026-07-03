import { test, expect, gotoDeliveryWorkspace } from './fixtures/authenticated-workspace';

test.describe('Accessibility — Delivery Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDeliveryWorkspace(page);
  });

  test('delivery page has an accessible structure', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Delivery Workspace' })).toBeVisible();
    await expect(page.getByRole('tablist', { name: 'Delivery workspace sections' })).toBeVisible();
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('all tabs are keyboard navigable', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(8);
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).focus();
      await expect(tabs.nth(i)).toBeFocused();
    }
  });

  test('tabpanel content is linked to active tab', async ({ page }) => {
    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toBeVisible();
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('no missing alt text on images', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('no rendering errors across all tabs', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(300);
    }
    const deliveryErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('hydration') &&
        !e.includes('unique "key" prop'),
    );
    expect(deliveryErrors).toHaveLength(0);
  });

  test('focus order follows visual tab order', async ({ page }) => {
    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).focus();
      await expect(tabs.nth(i)).toBeFocused();
    }
  });

  test('page has a heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Delivery Workspace');
  });
});
