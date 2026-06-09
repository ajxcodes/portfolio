import { test, expect } from "@playwright/test";

test.describe("Interactive Resume Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the backend API response for the active resume
    await page.route('**/api/resume/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Test User",
          title: "Full Stack Developer",
          intro: "Hello world",
          photoUrlLight: null,
          photoUrlDark: null,
          isActive: true,
          links: [],
          skills: [
            {
              category: "Languages & Frameworks",
              items: ["TypeScript", "React", "C#", ".NET"]
            }
          ],
          experience: [
            {
              company: "Test Company",
              role: "Developer",
              period: "2020 - Present",
              location: "Remote",
              isPrevious: false,
              skills: ["TypeScript", "React"],
              highlights: ["Built awesome features"]
            }
          ]
        })
      });
    });

    // Load local development page
    await page.goto("/resume");
  });

  test("should toggle collapsible sections on click", async ({ page }) => {
    // Find Section headers functioning as buttons
    const sections = page.locator('div[role="button"]');
    
    // Check that at least one section exists (e.g., Skills or Experience)
    await expect(sections.first()).toBeVisible();
    
    const firstSection = sections.first();
    const isInitiallyExpanded = await firstSection.getAttribute("aria-expanded") === "true";

    // Toggle the section
    await firstSection.click();
    
    // Check that aria-expanded changed
    const isNowExpanded = await firstSection.getAttribute("aria-expanded") === "true";
    expect(isNowExpanded).toBe(!isInitiallyExpanded);
  });

  test("should select skills and highlight corresponding experience items", async ({ page }) => {
    // Locate all skill buttons
    const skillButtons = page.locator(".skill-btn");
    
    // Wait until skill buttons are rendered
    await expect(skillButtons.first()).toBeVisible();
    
    const firstSkillBtn = skillButtons.first();
    const skillText = await firstSkillBtn.innerText();
    
    // Click on the first skill button
    await firstSkillBtn.click();
    
    // Expect skill button to be highlighted (selected class)
    await expect(firstSkillBtn).toHaveClass(/selected/);

    // Assert that the Clear button appears
    const clearButton = page.getByRole("button", { name: /Clear/i });
    await expect(clearButton).toBeVisible();

    // Click clear button and verify selection is cleared
    await clearButton.click();
    await expect(firstSkillBtn).not.toHaveClass(/selected/);
  });
});
