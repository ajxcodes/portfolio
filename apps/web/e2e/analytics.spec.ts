import { test, expect, request as playwrightRequest } from "@playwright/test";

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5808";

test.describe("Traffic Attribution Analytics", () => {
  // Before the click-analytics test, ensure a profile with a GitHub link is active.
  // The admin spec activates a profile with no contact links, which would break this test.
  // NOTE: GET /api/resume (list) does NOT eager-load links, so we must check each
  // profile individually via GET /api/resume/{id} which does include links.
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.title !== "should post click analytics on external link clicks with correct referrer") {
      return;
    }
    const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE });
    try {
      // Fast path: check if the currently active profile already has a GitHub link
      const activeRes = await apiContext.get("/api/resume/active");
      if (activeRes.ok()) {
        const active: any = await activeRes.json();
        const hasGithub = Array.isArray(active.links) &&
          active.links.some((l: any) => l.linkType?.keyIdentifier === "github");
        if (hasGithub) return;
      }

      // Active profile has no GitHub link — find one that does by fetching each profile's full details
      const listRes = await apiContext.get("/api/resume");
      if (!listRes.ok()) return;
      const profiles: any[] = await listRes.json();

      for (const profile of profiles) {
        const detailRes = await apiContext.get(`/api/resume/${profile.id}`);
        if (!detailRes.ok()) continue;
        const detail: any = await detailRes.json();
        const hasGithub = Array.isArray(detail.links) &&
          detail.links.some((l: any) => l.linkType?.keyIdentifier === "github");
        if (hasGithub) {
          await apiContext.post(`/api/resume/${profile.id}/activate`);
          break;
        }
      }
    } finally {
      await apiContext.dispose();
    }
  });


  test("should extract ref parameter and post page view analytics", async ({ page }) => {
    // Intercept POST request to the analytics views endpoint
    let viewRequestPayload: any = null;
    await page.route("**/api/analytics/views", async (route) => {
      viewRequestPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    const viewResponsePromise = page.waitForResponse("**/api/analytics/views");

    // Navigate to homepage with ref parameter
    await page.goto("/?ref=test_github_campaign");

    // Wait for the view analytics fetch to fire
    await viewResponsePromise;

    expect(viewRequestPayload).not.toBeNull();
    expect(viewRequestPayload.ReferrerSource).toBe("test_github_campaign");
    expect(viewRequestPayload.PagePath).toBe("/");
  });

  test("should track new page view with correct PagePath when navigating", async ({ page }) => {
    let viewRequestPayload: any = null;
    await page.route("**/api/analytics/views", async (route) => {
      viewRequestPayload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await page.goto("/");
    // wait for first view
    await page.waitForResponse("**/api/analytics/views");
    
    const viewResponsePromise = page.waitForResponse("**/api/analytics/views");
    
    // navigate to resume page
    await page.click('a[href="/resume"]');
    
    await viewResponsePromise;
    expect(viewRequestPayload).not.toBeNull();
    expect(viewRequestPayload.PagePath).toBe("/resume");
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

    const clickResponsePromise = page.waitForResponse("**/api/analytics/clicks");

    await githubLink.click({ force: true }).catch(() => {});

    // Wait for the async click telemetry fetch to fire
    await clickResponsePromise;

    // Check click payload — LinkId must match the data-link-id attribute, not a hardcoded fallback
    expect(clickRequestPayload).not.toBeNull();
    expect(clickRequestPayload.ReferrerSource).toBe("job_board");
    expect(clickRequestPayload.LinkId).toBe(linkId);
  });
});
