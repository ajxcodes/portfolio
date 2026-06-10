import { test, expect } from "@playwright/test";

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test.describe("Traffic Attribution Analytics", () => {
  test("should extract ref parameter and post page view analytics", async ({ page }) => {
    // Intercept POST request to the analytics views endpoint
    let viewRequestPayload: any = null;
    await page.route("**/api/analytics/views", async (route) => {
      viewRequestPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    const viewRequestPromise = page.waitForRequest("**/api/analytics/views");

    // Navigate to homepage with ref parameter
    await page.goto("/?ref=test_github_campaign");

    // Wait for the view analytics fetch to fire
    await viewRequestPromise;

    expect(viewRequestPayload).not.toBeNull();
    expect(viewRequestPayload.ReferrerSource).toBe("test_github_campaign");
  });

  test("should post click analytics on external link clicks with correct referrer", async ({ page }) => {
    // Intercept clicks endpoint
    let clickRequestPayload: any = null;
    await page.route("**/api/analytics/clicks", async (route) => {
      clickRequestPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    // Navigate with ref
    await page.goto("/?ref=job_board");

    // Find a GitHub link that ContactLinks has tagged with a real data-link-id
    const githubLink = page.locator('a[href*="github.com"][data-link-id]').first();
    await expect(githubLink).toBeVisible({ timeout: 5000 });

    // Read the DB link ID that was rendered; it comes from the active resume profile
    const linkId = await githubLink.getAttribute("data-link-id");
    expect(linkId).toMatch(GUID_REGEX);

    // Intercept navigation away so the test page stays loaded
    await page.route("https://github.com/**", async (route) => {
      await route.abort();
    });

    const clickRequestPromise = page.waitForRequest("**/api/analytics/clicks");

    await githubLink.click({ force: true }).catch(() => {});

    // Wait for the async click telemetry fetch to fire
    await clickRequestPromise;

    // Check click payload — LinkId must match the data-link-id attribute, not a hardcoded fallback
    expect(clickRequestPayload).not.toBeNull();
    expect(clickRequestPayload.ReferrerSource).toBe("job_board");
    expect(clickRequestPayload.LinkId).toBe(linkId);
  });
});
