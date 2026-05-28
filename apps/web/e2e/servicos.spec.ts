import { test, expect } from "./fixtures/auth.fixture";

test.describe("Serviços", () => {
  test("carrega lista e abre modal de novo serviço", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/servicos");

    // Stat card confirms we're on the servicos page; topbar title is not a heading
    await expect(page.getByText("Serviços ativos")).toBeVisible();

    // Open the "Novo serviço" modal
    await page.getByRole("button", { name: /novo serviço/i }).click();

    // Modal header says "Novo serviço"
    await expect(page.getByText("Novo serviço").first()).toBeVisible();

    // Fill in the service name via placeholder (labels use custom CSS class, not for= association)
    await page.getByPlaceholder("Ex: Corte Clássico").fill("Teste E2E");

    // Submit button
    await expect(
      page.getByRole("button", { name: /criar serviço/i }),
    ).toBeVisible();

    // Close modal without saving
    await page.getByRole("button", { name: /cancelar/i }).click();
  });
});
