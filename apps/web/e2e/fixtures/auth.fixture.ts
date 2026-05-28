import { test as base, Page } from "@playwright/test";

type AuthFixtures = { authenticatedPage: Page };

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, playwrightUse) => {
    await page.goto("/login");
    await page.locator("#login-email").fill("thiago@email.com");
    await page.locator("#login-senha").fill("senha123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 30000 });
    await playwrightUse(page);
  },
});

export { expect } from "@playwright/test";
