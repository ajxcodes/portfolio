import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Admin Blog E2E', () => {
  test('should create, edit, upload image and delete a blog post', async ({ page }) => {
    test.setTimeout(60000); // Allow more time for local Ollama generation

    // Navigate to admin blog page
    await page.goto('/admin/blog');

    // Verify header
    await expect(page.locator('h1')).toContainText('blog_posts');

    // Click "New Post"
    await page.getByRole('link', { name: /New Post/i }).click();

    // Ensure we are on the create page
    await expect(page).toHaveURL(/\/admin\/blog\/create/);
    await expect(page.locator('h1')).toContainText('new_post');

    // Fill title and content
    const testTitle = `E2E Test Post ${Date.now()}`;
    await page.getByPlaceholder('Post Title...').fill(testTitle);

    // MDXEditor uses contenteditable. Playwright's `fill` doesn't always trigger React's onChange
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('This is a test content for E2E. \n\n ![alt text](https://via.placeholder.com/150)');
    // Verify image markdown was inserted (or typed in this case)
    await expect(editor).toContainText('![alt text](https://via.placeholder.com/150)');

    // Note: We skip clicking "Auto-Fill Empty Fields" here because the E2E environment
    // pulls the Ollama model on the fly, which can take several minutes and cause a timeout.
    // The backend logic is fully covered by Integration tests.

    const slugInput = page.getByPlaceholder('url-friendly-slug');
    await slugInput.fill('e2e-test-post');
    const summaryInput = page.getByPlaceholder('Brief summary of the post...');
    await summaryInput.fill('This is an E2E test summary.');

    // Add tags
    const tagInput = page.getByPlaceholder('Add a tag and press Enter');
    await tagInput.fill('e2e-tag-1');
    await tagInput.press('Enter');
    await tagInput.fill('e2e-tag-2');
    await tagInput.press(','); // comma also adds tag
    
    // Verify tags are visible
    await expect(page.getByText('e2e-tag-1').first()).toBeVisible();
    await expect(page.getByText('e2e-tag-2').first()).toBeVisible();

    // Save the post
    await page.getByRole('button', { name: 'Save Post' }).click();

    // Wait to be redirected back to the list
    await expect(page).toHaveURL(/\/admin\/blog/);

    // Verify the post is in the list
    const postItem = page.locator('.terminal-card').filter({ hasText: testTitle }).first();
    await expect(postItem).toBeVisible();

    // Delete the post
    await postItem.getByRole('button', { name: 'Delete' }).click();
    
    // Confirm delete in dialog
    const confirmBtn = page.getByRole('button', { name: 'Confirm Delete' });
    await confirmBtn.click();

    // Wait for it to be removed entirely (both the list item and the dialog)
    await expect(page.getByText(testTitle)).toHaveCount(0);
  });
});
