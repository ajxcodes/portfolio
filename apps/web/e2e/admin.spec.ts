import { test, expect } from '@playwright/test';

test.describe('Admin Control Panel', () => {
  test('should load the traffic telemetry page', async ({ page }) => {
    // Navigate to admin analytics page
    await page.goto('/admin/analytics');

    // Verify analytics header
    const header = page.locator('h1');
    await expect(header).toContainText('traffic_telemetry');

    // Verify presence of metrics cards
    const totalViewsCard = page.locator('text=Total Views');
    await expect(totalViewsCard).toBeVisible();
  });

  test('should load the audit logs page', async ({ page }) => {
    // Navigate to admin audit logs page
    await page.goto('/admin/audit-logs');

    // Verify audit logs header
    const header = page.locator('h1');
    await expect(header).toContainText('audit_trails');
  });
});
