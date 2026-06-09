import { test, expect } from "@playwright/test";

test.describe("Traffic Attribution Analytics", () => {
  test("should extract ref parameter and post page view analytics", async ({ page }) => {
    // Intercept POST request to the analytics views endpoint
    let viewRequestPayload: any = null;
    await page.route("**/api/analytics/views", async (route) => {
      viewRequestPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    // Navigate to homepage with ref parameter
    await page.goto("/?ref=test_github_campaign");

    // Wait short moment for useEffect to execute fetch view analytics
    await page.waitForTimeout(500);

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

    // Find and click on GitHub social link (external)
    const githubLink = page.locator('a[href*="github.com"]').first();
    await expect(githubLink).toBeVisible();

    // Click link (we can intercept to prevent navigation away during E2E test)
    await page.route("https://github.com/**", async (route) => {
      await route.abort();
    });

    await githubLink.click({ force: true }).catch(() => {});

    // Check click payload
    expect(clickRequestPayload).not.toBeNull();
    expect(clickRequestPayload.ReferrerSource).toBe("job_board");
    expect(clickRequestPayload.LinkId).toBe("e2b02e77-508b-4c08-8e6c-7e6df5b9ef18"); // GitHub fallback GUID
  });
});
