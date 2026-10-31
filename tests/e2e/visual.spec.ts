import { expect, test } from "./coverage.js";
import { stable } from "./fixtures.js";

// Baselines live in visual.spec.ts-snapshots and are per platform; update them with `pnpm test --update-snapshots`
// on Windows and `pnpm test:visual:linux --update-snapshots=all` for Linux (CI)
for (const id of stable) {
  test(`${id} looks the same`, { tag: "@visual" }, async ({ page }) => {
    await page.goto("/fixtures");
    await expect(page.getByTestId("auto-size").locator("svg")).toHaveCount(1);
    const fixture = page.getByTestId(id);
    await expect(fixture.locator(".gauge-container > svg").first()).toBeVisible();
    await expect(fixture).toHaveScreenshot(`${id}.png`);
  });
}
