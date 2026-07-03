import { test, expect } from '@playwright/test';

test.describe('Accessibility — Delivery Workspace', () => {
  test('delivery page has an accessible structure', async ({ page }) => {
    await page.goto('/workspace/delivery');

    // Use Playwright's built-in accessibility snapshot
    const snapshot = await page.accessibility.snapshot();
    expect(snapshot).toBeTruthy();
    expect(snapshot?.name).toBeTruthy();
  });

  test('all tabs are keyboard navigable', async ({ page }) => {
    await page.goto('/workspace/delivery');

    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(7);

    for (let i = 0; i < count; i++) {
      await tabs.nth(i).focus();
      await expect(tabs.nth(i)).toBeFocused();
    }
  });

  test('tabpanel content is linked to active tab', async ({ page }) => {
    await page.goto('/workspace/delivery');

    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toBeVisible();

    const panel = page.locator('[role="tabpanel"]');
    await expect(panel).toBeVisible();
  });

  test('no missing alt text on images', async ({ page }) => {
    await page.goto('/workspace/delivery');

    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('no rendering errors across all tabs', async ({ page }) => {
    await page.goto('/workspace/delivery');

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
      (e) => !e.includes('favicon') && !e.includes('hydration'),
    );
    expect(deliveryErrors).toHaveLength(0);
  });

  test('focus order follows visual tab order', async ({ page }) => {
    await page.goto('/workspace/delivery');

    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();

    // Press Tab to move through each
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      await expect(tabs.nth(i)).toBeFocused();
    }
  });

  test('page has a heading hierarchy', async ({ page }) => {
    await page.goto('/workspace/delivery');

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Delivery Workspace');
  });
});
