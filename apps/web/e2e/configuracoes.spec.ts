import { test, expect } from "./fixtures/auth.fixture";

test.describe("Configurações", () => {
  test("navegar seções accordion", async ({ authenticatedPage: page }) => {
    await page.goto("/configuracoes");
    await page.getByRole("button", { name: /notificações/i }).click();
    await expect(page.getByText(/email|push|sms/i)).toBeVisible();
  });

  test("toggle notificação → feedback visual imediato", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/configuracoes");
    await page.getByRole("button", { name: /notificações/i }).click();
    const toggle = page.getByRole("switch").first();
    const before = await toggle.getAttribute("aria-checked");
    await toggle.click();
    const after = await toggle.getAttribute("aria-checked");
    expect(after).not.toBe(before);
  });
});
