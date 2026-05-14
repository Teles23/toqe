import { test, expect } from "./fixtures/auth.fixture";

test.describe("Agendamento", () => {
  test("selecionar barbeiro → data → serviço → confirmar → ver na lista", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/agendamentos/novo");
    await page
      .getByText(/selecionar barbeiro/i)
      .first()
      .click();
    await page.getByRole("option").first().click();
    await page.getByLabel(/data/i).fill("2024-12-01");
    await page
      .getByText(/selecionar serviço/i)
      .first()
      .click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /confirmar/i }).click();
    await expect(page.getByText(/agendado|confirmado/i)).toBeVisible();
  });
});
