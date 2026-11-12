import { test, expect } from '@playwright/test';

test.describe('Related Projects', () => {
  test.describe.configure({ mode: 'serial' });

  test('shows the related project and its releases on the blog post page', async ({ page }) => {
    await page.goto('/blog/seeded-blog-post');

    await expect(page.getByText('Related Projects')).toBeVisible();
    await expect(page.getByText('Alpha Seed Project').first()).toBeVisible();
    await expect(page.getByText('v1.0.0').first()).toBeVisible();
  });

  test('attaches and detaches a project from the admin blog editor', async ({ page }) => {
    await page.goto('/admin/blog');

    const postCard = page.locator('.terminal-card').filter({ hasText: 'Seeded Blog Post' }).first();
    await postCard.getByRole('link', { name: 'Edit' }).click();

    await expect(page.getByText('edit_post')).toBeVisible();
    await expect(page.getByText('Alpha Seed Project')).toBeVisible();
    await expect(page.getByText('Beta Seed Project')).toBeVisible();

    const alphaCheckbox = page.locator('label', { hasText: 'Alpha Seed Project' }).locator('input[type="checkbox"]');
    const betaCheckbox = page.locator('label', { hasText: 'Beta Seed Project' }).locator('input[type="checkbox"]');

    // Start from a clean state: detach anything attached.
    if (await alphaCheckbox.isChecked()) {
      await alphaCheckbox.click();
      await expect(alphaCheckbox).not.toBeChecked();
    }
    if (await betaCheckbox.isChecked()) {
      await betaCheckbox.click();
      await expect(betaCheckbox).not.toBeChecked();
    }

    // Attach Beta, then verify on the public blog post page.
    await betaCheckbox.click();
    await expect(betaCheckbox).toBeChecked();
    await page.goto('/blog/seeded-blog-post');
    await expect(page.getByText('Related Projects')).toBeVisible();

    // Detach Beta from the admin editor and verify the section is gone.
    await page.goto('/admin/blog');
    await page
      .locator('.terminal-card')
      .filter({ hasText: 'Seeded Blog Post' })
      .first()
      .getByRole('link', { name: 'Edit' })
      .click();
    await expect(page.getByText('edit_post')).toBeVisible();
    const betaCheckbox2 = page.locator('label', { hasText: 'Beta Seed Project' }).locator('input[type="checkbox"]');
    if (await betaCheckbox2.isChecked()) {
      await betaCheckbox2.click();
      await expect(betaCheckbox2).not.toBeChecked();
    }
    const alphaCheckbox2 = page.locator('label', { hasText: 'Alpha Seed Project' }).locator('input[type="checkbox"]');
    if (await alphaCheckbox2.isChecked()) {
      await alphaCheckbox2.click();
      await expect(alphaCheckbox2).not.toBeChecked();
    }

    await page.goto('/blog/seeded-blog-post');
    await expect(page.getByText('Related Projects')).toHaveCount(0);

    // Restore the seeded state (Alpha attached) so the suite is idempotent.
    await page.goto('/admin/blog');
    await page
      .locator('.terminal-card')
      .filter({ hasText: 'Seeded Blog Post' })
      .first()
      .getByRole('link', { name: 'Edit' })
      .click();
    await expect(page.getByText('edit_post')).toBeVisible();
    const alphaRestoreCheckbox = page
      .locator('label', { hasText: 'Alpha Seed Project' })
      .locator('input[type="checkbox"]');
    if (!(await alphaRestoreCheckbox.isChecked())) {
      await alphaRestoreCheckbox.click();
      await expect(alphaRestoreCheckbox).toBeChecked();
    }
  });
});
