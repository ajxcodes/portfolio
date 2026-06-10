import { test, expect } from '@playwright/test';

test.describe('Blog Page', () => {
  test('should load the blog page and navigate to a post', async ({ page }) => {
    // Navigate to the blog page
    await page.goto('/blog');

    // Verify page title and header
    const header = page.locator('h1');
    await expect(header).toContainText('developer_log');

    // Verify presence of a post
    const postLink = page.locator('text=What\'s New in .NET 10?');
    await expect(postLink).toBeVisible();

    // Click the read post button
    const readPostBtn = page.locator('text=read_post.exe').first();
    await readPostBtn.click();

    // Verify navigation to post detail page
    await expect(page).toHaveURL(/\/blog\/.+/);
    const postTitle = page.locator('h1');
    await expect(postTitle).not.toBeEmpty();
  });
});
