import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test('should list seeded projects and render detail page with README, tags and links', async ({ page }) => {
    await page.goto('/projects');

    await expect(page.locator('header h1')).toContainText('projects');
    const alphaCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Alpha Seed Project', exact: true }) }).first();
    const betaCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Beta Seed Project', exact: true }) }).first();
    await expect(alphaCard).toHaveCount(1);
    await expect(betaCard).toHaveCount(1);
    await expect(alphaCard.getByText('https://alpha.example.com').first()).toBeVisible();
    await expect(alphaCard.getByText('https://github.com/example/alpha-seed').first()).toBeVisible();

    await alphaCard.getByRole('link', { name: 'Alpha Seed Project', exact: true }).click();
    await expect(page).toHaveURL(/\/projects\//);
    await expect(page.locator('header h1')).toHaveText('Alpha Seed Project');
    await expect(page.getByText('Alpha README body for e2e verification.')).toBeVisible();
    await expect(page.getByText('shared-tag').first()).toBeVisible();
    await expect(page.getByText('alpha').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Homepage/i }).first()).toBeVisible();
    await expect(page.getByText('https://alpha.example.com').first()).toBeVisible();
    await expect(page.getByText('https://github.com/example/alpha-seed').first()).toBeVisible();
  });

  test('should filter projects by tag on the public list', async ({ page }) => {
    await page.goto('/projects');

    const alphaCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Alpha Seed Project', exact: true }) });
    const betaCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Beta Seed Project', exact: true }) });
    await expect(alphaCard).toHaveCount(1);
    await expect(betaCard).toHaveCount(1);

    await page.getByRole('button', { name: 'beta', exact: true }).click();

    await expect(betaCard).toHaveCount(1);
    await expect(alphaCard).toHaveCount(0);

    await page.getByRole('button', { name: 'all', exact: true }).click();
    await expect(alphaCard).toHaveCount(1);
  });

  test('should show the not-found page for an unknown project id', async ({ page }) => {
    await page.goto('/projects/00000000-0000-0000-0000-000000000000');
    await expect(page.getByText(/404|not found|could not be found/i).first()).toBeVisible();
  });

  test('should create, edit and delete a project from the admin CMS', async ({ page }) => {
    const unique = Date.now();
    const title = `E2E Project ${unique}`;
    const slug = `e2e-project-${unique}`;
    const updatedTitle = `${title} Updated`;

    await page.goto('/admin/projects');
    await expect(page.locator('h1')).toContainText('projects');

    await page.getByRole('link', { name: /New Project/i }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/create/);

    const titleInput = page.locator('div.space-y-2').filter({ has: page.getByText(/^Title$/) }).locator('input').first();
    await titleInput.fill(title);
    await page.getByPlaceholder('project-slug').fill(slug);
    await page.getByPlaceholder('Short description...').fill('E2E project summary');

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('E2E README body for project verification.');

    const tagInput = page.getByPlaceholder('Add a tag and press Enter');
    await tagInput.fill('e2e-shared');
    await tagInput.press('Enter');

    await page.getByRole('button', { name: 'Add' }).click();
    await page.locator('select').filter({ hasText: 'homepage' }).first().selectOption('github');
    await page.getByPlaceholder('https://...').first().fill('https://github.com/example/e2e-project');
    await page.getByPlaceholder('Label (optional)').first().fill('GitHub');

    await page.getByRole('button', { name: 'Save Project' }).click();

    await expect(page).toHaveURL(/\/admin\/projects/);
    const createdCard = page.locator('.terminal-card').filter({ hasText: title }).first();
    await expect(createdCard).toBeVisible();

    await page.goto('/projects');
    await expect(page.locator('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })).toHaveCount(1);

    await page.goto('/admin/projects');
    await createdCard.getByRole('link', { name: 'Edit' }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/.*\/edit/);

    const editTitleInput = page.locator('div.space-y-2').filter({ has: page.getByText(/^Title$/) }).locator('input').first();
    await editTitleInput.fill(updatedTitle);
    const linkUrlInput = page.getByPlaceholder('https://...').first();
    await linkUrlInput.fill('https://github.com/example/e2e-project-updated');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page).toHaveURL(/\/admin\/projects/);
    await expect(page.getByText(/Failed to update project|500|Internal Server Error/i)).toHaveCount(0);
    const updatedCard = page.locator('.terminal-card').filter({ hasText: updatedTitle }).first();
    await expect(updatedCard).toBeVisible();

    await page.goto('/projects');
    await expect(page.locator('article').filter({ has: page.getByRole('heading', { name: updatedTitle, exact: true }) })).toHaveCount(1);
    await expect(page.getByText('https://github.com/example/e2e-project-updated').first()).toBeVisible();

    await page.goto('/admin/projects');
    await updatedCard.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm Delete' }).click();
    await expect(page.getByText(updatedTitle)).toHaveCount(0);
  });
});
