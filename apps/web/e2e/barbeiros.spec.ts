import { test, expect } from "./fixtures/auth.fixture";

test.describe("Barbeiros", () => {
  test("listar → convidar → ver métricas", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/barbeiros");
    await expect(
      page.getByRole("heading", { name: /barbeiros/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /convidar|adicionar/i }).click();
    await page.getByLabel(/email/i).fill("novo@barbeiro.com");
    await page.getByRole("button", { name: /convidar|enviar/i }).click();

    await page.goto("/barbeiros");
    const metricasBtn = page
      .getByRole("button", { name: /métricas|detalhes/i })
      .first();
    if (await metricasBtn.isVisible()) {
      await metricasBtn.click();
      await expect(page.getByText(/agendamentos|faturamento/i)).toBeVisible();
    }
  });
});
