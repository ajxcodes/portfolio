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

    // Verify that the Recharts container renders (or fallback message if no data)
    // Wait for the loading skeleton to disappear first
    await expect(page.locator('text=Views Over Time')).toBeVisible({ timeout: 10000 });
    const chartOrFallback = page.locator('.recharts-responsive-container').or(page.getByText('Not enough data to display chart')).first();
    await expect(chartOrFallback).toBeVisible();
  });

  test('should load the audit logs page', async ({ page }) => {
    // Navigate to admin audit logs page
    await page.goto('/admin/audit-logs');

    // Verify audit logs header
    const header = page.locator('h1');
    await expect(header).toContainText('audit_trails');

    // Wait for loading to finish and logs to appear (or empty state)
    // If logs exist, click the first one and verify the JsonDiffViewer appears
    const logRows = page.locator('tbody tr');
    const emptyState = page.locator('text=No modification audit entries have been logged');
    
    await Promise.any([
      expect(logRows.first()).toBeVisible({ timeout: 10000 }),
      expect(emptyState).toBeVisible({ timeout: 10000 })
    ]);

    if (await logRows.count() > 0) {
      await logRows.first().click();
      await expect(page.locator('text=Field Differences')).toBeVisible();
    }
  });

  test('should create, save, activate, and view a new resume profile', async ({ page }) => {
    // 1. Navigate to resume profile list
    await page.goto('/admin/resume');

    // 2. Click "New Profile" and wait for navigation
    await Promise.all([
      page.waitForURL('**/admin/resume/form*'),
      page.locator('text=New Profile').click()
    ]);
    await expect(page).toHaveURL(/\/admin\/resume\/form/);

    // 3. Fill in Personal Info
    const testName = `E2E Test Profile ${Date.now()}`;
    await page.locator('#name').fill(testName);
    await page.locator('#title').fill('Automated Test Engineer');
    await page.locator('#intro').fill('This profile was fully generated and validated by an E2E Playwright test.');
    await page.locator('#email').fill('playwright-test@ajx.codes');

    // 4. Add a Job
    await page.locator('button:has-text("Add Job")').click();
    
    // Fill in the first experience inputs
    const expContainer = page.locator('div.border-primary\\/20').first();
    await expContainer.locator('input[placeholder="Google"]').fill('QA Labs Inc');
    await expContainer.locator('input[placeholder="Senior Software Engineer"]').fill('Senior E2E Developer');
    
    // Set start date
    await expContainer.locator('select').first().selectOption('Jan');
    await expContainer.locator('select').nth(1).selectOption('2025');
    
    // Set "I currently work here"
    await expContainer.locator('input[type="checkbox"]').first().check();

    // 5. Save the profile
    await page.locator('button[type="submit"]').first().click();

    // Verify success banner and wait for auto-redirect back to list
    const successBanner = page.locator('text=Profile details saved successfully!');
    await expect(successBanner).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/resume/, { timeout: 10000 });

    // 6. Find the newly created profile card and click "Activate"
    const profileCard = page.locator('div.terminal-card', { hasText: testName });
    await expect(profileCard).toBeVisible();
    
    const activateButton = profileCard.locator('button:has-text("Activate")');
    await activateButton.click();

    // Verify it is now flagged as "Active Live"
    await expect(profileCard.locator('text=Active Live')).toBeVisible();

    // 7. Go to public Resume Page and verify it renders the active info
    await page.goto('/resume');
    await expect(page.locator('#page-title')).toContainText(testName);
    await expect(page.locator('text=Automated Test Engineer')).toBeVisible();
    await expect(page.locator('text=QA Labs Inc')).toBeVisible();
  });
});
