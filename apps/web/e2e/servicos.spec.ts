import { test, expect } from "./fixtures/auth.fixture";

test.describe("Serviços", () => {
  test("listar → criar → editar → desativar", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/servicos");
    await expect(
      page.getByRole("heading", { name: /serviços/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /novo serviço|adicionar/i }).click();
    await page.getByLabel(/nome/i).fill("Teste E2E");
    await page.getByLabel(/duração/i).fill("30");
    await page.getByLabel(/preço/i).fill("50");
    await page.getByRole("button", { name: /salvar|criar/i }).click();
    await expect(page.getByText("Teste E2E")).toBeVisible();

    await page.getByText("Teste E2E").first().click();
    await page.getByRole("button", { name: /editar/i }).click();
    await page.getByLabel(/nome/i).fill("Teste E2E Editado");
    await page.getByRole("button", { name: /salvar/i }).click();
    await expect(page.getByText("Teste E2E Editado")).toBeVisible();

    await page
      .getByRole("button", { name: /desativar/i })
      .first()
      .click();
    await page.getByRole("button", { name: /confirmar/i }).click();
  });
});
