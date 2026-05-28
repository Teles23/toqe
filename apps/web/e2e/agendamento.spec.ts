import { test, expect } from "./fixtures/auth.fixture";

test.describe("Agendamento", () => {
  test("abre modal de novo agendamento a partir da agenda", async ({
    authenticatedPage: page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/agenda");
    // "Novo agendamento" button — text is in a <span class="hidden sm:inline">
    // but the button itself has a Plus icon. Clicking the button opens the modal.
    await page.getByRole("button", { name: /novo agendamento/i }).click();

    // Modal header should display "Novo agendamento" (the modal header <span>)
    // We wait for the modal overlay to appear (z-50 element with "Novo agendamento" text)
    await expect(
      page.locator(".fixed.inset-0.z-50").getByText("Novo agendamento"),
    ).toBeVisible();

    // Modal contains a <select> for barbeiro with a placeholder option
    await expect(page.locator("select").first()).toBeVisible();

    // Close modal via the X button inside the modal
    await page.locator(".fixed.inset-0.z-50 button").first().click();
  });
});
