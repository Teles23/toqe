import { test, expect } from "./fixtures/auth.fixture";

test.describe("Configurações", () => {
  test("navega para seção Notificações via sidebar", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/configuracoes");

    // Sidebar has nav buttons for each section. "Notificações" is a sidebar button.
    // On desktop the sidebar is visible; click the nav item.
    await page.getByRole("button", { name: "Notificações" }).click();

    // SecaoNotificacoes renders an <h2> "Notificações" and groups like "Agendamentos" / "Operação"
    await expect(page.getByText("Agendamentos").first()).toBeVisible();
    await expect(page.getByText("Novo agendamento")).toBeVisible();
  });

  test("toggle de notificação altera estado visual", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/configuracoes");

    // Navigate to Notificações section
    await page.getByRole("button", { name: "Notificações" }).click();

    // Wait for the section content to appear
    await expect(page.getByText("Novo agendamento")).toBeVisible();

    // The Toggle component is a <button> without role="switch" or aria-checked.
    // We verify it responds to a click by observing a style change.
    // The first toggle in the list controls "novoAgendamento".
    // We rely on the button's background style change (green → grey).
    const firstToggle = page.locator(".rounded-full.transition-all").first();
    await expect(firstToggle).toBeVisible();

    // Capture initial background colour
    const styleBefore = await firstToggle.getAttribute("style");
    await firstToggle.click();

    // After clicking, background changes (success → border-strong or vice versa)
    // Give React time to re-render
    await page.waitForTimeout(200);
    const styleAfter = await firstToggle.getAttribute("style");
    expect(styleAfter).not.toBe(styleBefore);
  });
});
