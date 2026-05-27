import { test, expect } from "./fixtures/auth.fixture";

test.describe("Barbeiros", () => {
  test("carrega página e abre drawer de convite", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/barbeiros");

    // Topbar renders the page title as a <span> — not a semantic <h1>
    // The stat card "Total de barbeiros" confirms we are on the right page
    await expect(page.getByText("Total de barbeiros")).toBeVisible();

    // Open the "Novo barbeiro" drawer
    await page.getByRole("button", { name: /novo barbeiro/i }).click();

    // Drawer should open: its title is "Adicionar barbeiro"
    await expect(page.getByText("Adicionar barbeiro")).toBeVisible();

    // The email field inside the drawer has label "E-mail *"
    // The label element contains the text "E-mail *" and the input follows it
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill("novo@barbeiro.com");

    // CTA button text is "Convidar →"
    // It is disabled until nome is also filled, so just check it's present
    await expect(page.getByText(/convidar/i).first()).toBeVisible();

    // Close the drawer
    await page.locator('button[aria-label="Fechar"]').click();
  });
});
