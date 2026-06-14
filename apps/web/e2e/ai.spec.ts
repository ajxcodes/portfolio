import { test, expect } from '@playwright/test';

test.describe('AI Terminal and Widget', () => {
  test.beforeAll(async () => {
    // Pre-flight check: If Gemini API is out of quota (429), skip the entire AI suite
    // instead of letting it fail and turn the CI build red.
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5808';
    try {
      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "ping", systemPrompt: "ping" })
      });
      if (response.status === 429) {
        console.log("⚠️ Skipping AI E2E tests due to Gemini Free-Tier Quota Exceeded (429)");
        test.skip(true, 'Gemini API Free-Tier Quota Exceeded (429)');
      }
    } catch (e) {
      // If it fails for another reason, let the test suite naturally handle it
    }
  });

  test('should load the homepage terminal shell and execute basic commands', async ({ page }) => {
    await page.goto('/');

    // Ensure the terminal shell is visible
    const terminalInput = page.locator('input[type="text"][placeholder*="Type"]');
    await expect(terminalInput).toBeVisible();

    // Run clear to empty the screen
    await terminalInput.fill('clear');
    await terminalInput.press('Enter');

    // Run ls command
    await terminalInput.fill('ls');
    await terminalInput.press('Enter');

    // Ensure blog list or experience list appears (basic sanity check)
    await expect(page.locator('text=blog/').first()).toBeVisible();
    await expect(page.locator('text=experience/').first()).toBeVisible();
  });

  test('should open the floating AI widget and switch to terminal tab', async ({ page }) => {
    // Go to a page other than homepage to ensure the floating widget has the terminal tab
    await page.goto('/resume');

    const widgetButton = page.getByRole('button', { name: /Open AI Chat/i });
    await expect(widgetButton).toBeVisible();

    await widgetButton.click();

    // Should see GUI tab by default
    const guiTab = page.locator('button:has-text("GUI Chat")');
    await expect(guiTab).toBeVisible();

    // Check terminal tab
    const terminalTab = page.locator('button:has-text("Shell")');
    await expect(terminalTab).toBeVisible();
    await terminalTab.click();

    // Now the actual TerminalShell component should be rendered
    const terminalInput = page.locator('input[type="text"][placeholder*="Type"]');
    await expect(terminalInput).toBeVisible();

    // Run clear
    await terminalInput.fill('clear');
    await terminalInput.press('Enter');

    // Close the widget
    const closeButton = page.getByRole('button', { name: /Close widget/i });
    await closeButton.click();

    await expect(page.locator('text=GUI Chat')).toBeHidden();
  });

  test('should persist GUI chat history across page reloads', async ({ page }) => {
    await page.goto('/resume');
    
    const widgetButton = page.getByRole('button', { name: /Open AI Chat/i });
    await widgetButton.click();

    // Verify we are on the GUI Chat tab
    const guiTab = page.locator('button:has-text("GUI Chat")');
    await expect(guiTab).toBeVisible();

    // Type a unique message
    const chatInput = page.locator('textarea[placeholder="Type a message..."]');
    const uniqueMessage = `Hello this is a persistent test ${Date.now()}`;
    await chatInput.fill(uniqueMessage);
    await chatInput.press('Enter');

    // Wait for message to appear in the chat UI
    await expect(page.getByText(uniqueMessage)).toBeVisible();

    // Wait for the AI "Thinking..." indicator or a response to appear so we know the state was updated
    await expect(page.locator('text=Thinking...').or(page.locator('.prose')).first()).toBeVisible();

    // Reload the page to test persistence
    await page.reload();

    // Reopen widget
    await widgetButton.click();

    // The message should still be there from localStorage
    await expect(page.getByText(uniqueMessage)).toBeVisible();
    
    // Click Clear Chat to clean up state
    const clearButton = page.getByRole('button', { name: /Clear Chat/i });
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    
    // Verify it was cleared
    await expect(page.getByText(uniqueMessage)).toBeHidden();
  });
});
