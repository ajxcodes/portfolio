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

  test('should cycle themes using the ThemeSwitcher button', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.locator('button[aria-label^="Change theme from"]');
    await expect(themeButton).toBeVisible();

    const screenReaderText = themeButton.locator('span.sr-only');
    
    // Cycle theme from current to next
    const initialThemeText = await screenReaderText.textContent();
    await themeButton.click();

    const nextThemeText = await screenReaderText.textContent();
    expect(nextThemeText).not.toBe(initialThemeText);
  });
});
