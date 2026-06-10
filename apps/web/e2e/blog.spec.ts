import { test, expect } from '@playwright/test';

test.describe('Blog Page', () => {
  test('should load the blog page and render empty state', async ({ page }) => {
    // Navigate to the blog page
    await page.goto('/blog');

    // Verify page title and header
    const header = page.locator('h1');
    await expect(header).toContainText('developer_log');

    // Verify empty state message since no posts are seeded on CI
    const emptyState = page.locator('text=No blog posts found');
    await expect(emptyState).toBeVisible();
  });
});
