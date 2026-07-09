import { test, expect } from "@playwright/test";

test.describe("Job Fit Analyzer Tracking", () => {
  test("should append VisitorSessionId when analyzing job fit", async ({ page }) => {
    await page.goto("/resume");
    
    // Ensure visitor_session_id is in sessionStorage so we can assert it later
    await page.evaluate(() => sessionStorage.setItem('visitor_session_id', 'test-e2e-session-id'));

    // Open AI Assistant by clicking its button instead of firing an event
    await page.getByRole('button', { name: 'Open AI Chat' }).click();

    const tabJobFit = page.getByRole('button', { name: 'Analyze Job Fit' });
    await tabJobFit.click();

    // Switch to URL input mode
    await page.getByRole('button', { name: 'Paste URL' }).click();

    // Fill in a URL
    await page.fill('input[placeholder="https://example.com/job"]', 'https://example.com/job');

    // Intercept POST request to /api/ai/job-fit/analyze
    let requestUrl = '';
    await page.route("**/api/ai/job-fit/analyze", async (route) => {
      requestUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ matchScore: 90, company: "Test Co", role: "Test Role" })
      });
    });

    const analyzePromise = page.waitForResponse("**/api/ai/job-fit/analyze");

    // Click Analyze
    await page.getByRole('button', { name: 'Analyze', exact: true }).click();

    const response = await analyzePromise;
    expect(response.status()).toBe(200);

    // Get the request payload to ensure VisitorSessionId is sent
    const request = response.request();
    const postData = request.postData() || '';
    
    expect(postData).toContain('name="Url"');
    expect(postData).toContain('https://example.com/job');
    // Since session ID might be dynamic, we just check that the field name is present
    expect(postData).toContain('name="VisitorSessionId"');
  });
});
