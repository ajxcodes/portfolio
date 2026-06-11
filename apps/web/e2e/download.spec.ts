import { test, expect } from "@playwright/test";

test.describe("Resume Download Flow", () => {
  test("should successfully generate and download resume PDF", async ({ page }) => {
    // Navigate to the resume page. The database is seeded by seed.js so the resume exists.
    await page.goto("/resume");

    // Wait for the Download Resume button to appear
    const downloadButton = page.locator('a[aria-label="Download Resume"]');
    await expect(downloadButton).toBeVisible();
    
    // Click the button to trigger the modal and API generation
    await downloadButton.click();
    
    // Wait for the download progress modal to appear
    const modalHeading = page.getByText("Preparing", { exact: false });
    await expect(modalHeading).toBeVisible();
    
    // Wait for the generation to complete and the direct link to appear
    const directDownloadLink = page.getByText("Download File Directly");
    await expect(directDownloadLink).toBeVisible({ timeout: 15000 });
    
    // Now setup the download listener BEFORE clicking the direct link
    const downloadPromise = page.waitForEvent('download');
    await directDownloadLink.click();
    
    // Wait for the actual file download to complete
    const download = await downloadPromise;
    
    // Verify it downloaded a PDF file
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });
});
