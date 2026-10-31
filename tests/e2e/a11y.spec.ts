import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./coverage.js";

for (const path of ["/", "/fixtures"]) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(".gauge-container > svg").first()).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} elements)`);
    expect(serious).toEqual([]);
  });
}
