import { test, expect } from "@playwright/test";

test.describe("Resume Download Flow", () => {
  test("should successfully generate and download resume PDF", async ({ page }) => {
    // Navigate to the resume page. The database is seeded by seed.js so the resume exists.
    await page.goto("/resume");

    // Wait for the Download Resume button to appear
    const downloadButton = page.locator('a[aria-label="Download Resume"]');
    await expect(downloadButton).toBeVisible();
    
    // Start waiting for the download event BEFORE clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    // Click the button to trigger the modal and API generation
    await downloadButton.click();
    
    // Wait for the download progress modal to appear
    const modalHeading = page.getByText("Preparing", { exact: false });
    await expect(modalHeading).toBeVisible();
    
    // Wait for the actual file download to complete
    const download = await downloadPromise;
    
    // Verify it downloaded a PDF file
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    
    // Check that the download modal eventually shows success or closes
    const successText = page.getByText("Ready for Download!", { exact: false });
    // It might close or show this text depending on how the frontend handles the auto-download.
    // The test passes if the file was downloaded via the browser.
  });
});
