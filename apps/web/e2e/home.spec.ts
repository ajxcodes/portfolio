import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page and render heading', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Assert that the page title is visible and not empty
    const pageTitle = page.locator('#page-title');
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).not.toBeEmpty();
  });
});
