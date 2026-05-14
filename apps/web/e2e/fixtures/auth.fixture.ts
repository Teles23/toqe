import { test as base, Page } from "@playwright/test";

type AuthFixtures = { authenticatedPage: Page };

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, playwrightUse) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@toqe.com");
    await page.getByLabel(/senha/i).fill("Senha@123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("**/dashboard");
    await playwrightUse(page);
  },
});

export { expect } from "@playwright/test";
