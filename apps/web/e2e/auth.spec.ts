import { test, expect } from "@playwright/test";

test.describe("Autenticação", () => {
  test("login válido redireciona para dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill("thiago@email.com");
    await page.locator("#login-senha").fill("senha123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 30000 });
  });

  test("login inválido exibe mensagem de erro", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill("invalido@toqe.com");
    await page.locator("#login-senha").fill("senhaerrada");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByText(/credenciais|inválido|erro/i)).toBeVisible();
  });

  test("logout redireciona para login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill("thiago@email.com");
    await page.locator("#login-senha").fill("senha123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 30000 });
    // Logout button in topbar has title="Sair" (icon-only, no visible text label)
    await page.locator('button[title="Sair"]').click();
    await expect(page).toHaveURL(/login/, { timeout: 15000 });
  });
});
