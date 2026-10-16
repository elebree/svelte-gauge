import { expect, test } from "@playwright/test";
import { stable } from "./fixtures.js";

// Baselines live in visual.spec.ts-snapshots and are per platform; update them with `pnpm test --update-snapshots`
for (const id of stable) {
  test(`${id} looks the same`, { tag: "@visual" }, async ({ page }) => {
    await page.goto("/fixtures");
    const fixture = page.getByTestId(id);
    await expect(fixture.locator(".gauge-container > svg").first()).toBeVisible();
    await expect(fixture).toHaveScreenshot(`${id}.png`);
  });
}
