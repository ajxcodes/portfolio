import { test, expect } from '@playwright/test';

test.describe('Blog Page', () => {
  test('should load the blog page and render empty state', async ({ page }) => {
    // Navigate to the blog page
    await page.goto('/blog');

    // Verify page title and header
    const header = page.locator('h1');
    await expect(header).toContainText('developer_log');

    // Verify empty state OR list of blog posts (robust for both CI empty db and seeded local db)
    const emptyState = page.locator('text=No blog posts found');
    const blogArticles = page.locator('article');
    await expect(emptyState.or(blogArticles).first()).toBeVisible();
  });

  test('should navigate to blog post detail page when a post is clicked', async ({ page }) => {
    await page.goto('/blog');

    const blogArticles = page.locator('article');
    if (await blogArticles.count() > 0) {
      const firstArticleLink = blogArticles.first().locator('h2 a');
      const expectedTitle = await firstArticleLink.textContent();
      
      // Click the title link to navigate
      await firstArticleLink.click();

      // Verify URL changes to include the blog slug prefix
      await expect(page).toHaveURL(/\/blog\//);

      // Verify the details page renders the correct post title
      const detailsHeader = page.locator('h1');
      await expect(detailsHeader).toContainText(expectedTitle?.replace('>_', '').trim() || '');
    }
  });
});
