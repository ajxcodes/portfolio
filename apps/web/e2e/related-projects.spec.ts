import { test, expect } from '@playwright/test';

test.describe('Related Projects', () => {
  test('shows the related project and its releases on the blog post page', async ({ page }) => {
    await page.goto('/blog/seeded-blog-post');

    await expect(page.getByText('Related Projects')).toBeVisible();
    await expect(page.getByText('Alpha Seed Project').first()).toBeVisible();
    await expect(page.getByText('v1.0.0').first()).toBeVisible();
  });

  test('attaches and detaches a project from the admin blog editor', async ({ page }) => {
    await page.goto('/admin/blog');

    const row = page.locator('tr', { hasText: 'Seeded Blog Post' }).first();
    await row.getByTitle('Edit Post').click();

    await expect(page.getByText('edit_post')).toBeVisible();
    await expect(page.getByText('Alpha Seed Project')).toBeVisible();
    await expect(page.getByText('Beta Seed Project')).toBeVisible();

    const alphaCheckbox = page.locator('label', { hasText: 'Alpha Seed Project' }).locator('input[type="checkbox"]');
    const betaCheckbox = page.locator('label', { hasText: 'Beta Seed Project' }).locator('input[type="checkbox"]');

    // Start from a clean state: detach anything attached.
    if (await alphaCheckbox.isChecked()) await alphaCheckbox.uncheck();
    if (await betaCheckbox.isChecked()) await betaCheckbox.uncheck();

    // Attach Beta, then verify on the public blog post page.
    await betaCheckbox.check();
    await page.goto('/blog/seeded-blog-post');
    await expect(page.getByText('Related Projects')).toBeVisible();

    // Detach Beta from the admin editor and verify the section is gone.
    await page.goto('/admin/blog');
    await page.locator('tr', { hasText: 'Seeded Blog Post' }).first().getByTitle('Edit Post').click();
    await expect(page.getByText('edit_post')).toBeVisible();
    const betaCheckbox2 = page.locator('label', { hasText: 'Beta Seed Project' }).locator('input[type="checkbox"]');
    if (await betaCheckbox2.isChecked()) await betaCheckbox2.uncheck();
    const alphaCheckbox2 = page.locator('label', { hasText: 'Alpha Seed Project' }).locator('input[type="checkbox"]');
    if (await alphaCheckbox2.isChecked()) await alphaCheckbox2.uncheck();

    await page.goto('/blog/seeded-blog-post');
    await expect(page.getByText('Related Projects')).toHaveCount(0);
  });
});
