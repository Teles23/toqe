import { test, expect } from "@playwright/test";

test.describe("Autenticação", () => {
  test("login válido redireciona para dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@toqe.com");
    await page.getByLabel(/senha/i).fill("Senha@123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("login inválido exibe mensagem de erro", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("invalido@toqe.com");
    await page.getByLabel(/senha/i).fill("senhaerrada");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByText(/credenciais|inválido|erro/i)).toBeVisible();
  });

  test("logout redireciona para login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@toqe.com");
    await page.getByLabel(/senha/i).fill("Senha@123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/dashboard/);
    await page.getByRole("button", { name: /sair|logout/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});
