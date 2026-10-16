import { expect, test } from "@playwright/test";
import { clientOnly, gauge, serverRendered } from "./fixtures.js";

// What visitors see before JavaScript loads: the prerendered HTML only
test.use({ javaScriptEnabled: false });

test.describe("prerendered fixtures", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fixtures");
  });

  test("gauges with a numeric width render their SVG", async ({ page }) => {
    for (const id of serverRendered) {
      const expected = id === "nested" ? 2 : 1;
      await expect(page.getByTestId(id).locator(".gauge-container > svg"), id).toHaveCount(expected);
    }
  });

  test("gauges sized by CSS render an empty container", async ({ page }) => {
    for (const id of clientOnly) {
      await expect(gauge(page, id), id).toBeAttached();
      await expect(gauge(page, id).locator("svg"), id).toHaveCount(0);
      await expect(gauge(page, id), id).not.toHaveAttribute("style", /--gauge-radius/);
    }
  });

  test("the radius variable and viewBox come from the width", async ({ page }) => {
    await expect(gauge(page, "basic")).toHaveAttribute("style", /--gauge-radius: 80px;/);
    await expect(gauge(page, "basic").locator("svg")).toHaveAttribute("viewBox", "0 0 160 160");
  });

  test("a nested gauge starts at the parent's slot size", async ({ page }) => {
    // 200 minus twice the stroke (10) and the label border (16)
    const svgs = page.getByTestId("nested").locator(".gauge-container > svg");
    await expect(svgs.nth(0)).toHaveAttribute("viewBox", "0 0 200 200");
    await expect(svgs.nth(1)).toHaveAttribute("viewBox", "0 0 148 148");
  });

  test("value text shows the start value before the animation runs", async ({ page }) => {
    await expect(page.getByTestId("basic").locator(".gauge-slot-content")).toHaveText("0");
    await expect(page.getByTestId("display-fn").locator(".gauge-slot-content")).toHaveText("0 km/h");
    await expect(page.getByTestId("display-string").locator(".gauge-slot-content")).toHaveText("OK");
    await expect(page.getByTestId("no-value").locator(".gauge-slot-content")).toHaveText("NaN");
    await expect(page.getByTestId("slot-value")).toHaveText("0");
  });

  test("labels and segments are part of the HTML", async ({ page }) => {
    await expect(page.getByTestId("labels").locator(".gauge-labels textPath")).toHaveText(["A", "B", "C"]);
    await expect(page.getByTestId("segments").locator("use.gauge-segment")).toHaveCount(3);
    await expect(page.getByTestId("segments").locator(".gauge-segment-label")).toHaveText(["Low", "Mid", "High"]);
  });
});

test("no NaN or Infinity in prerendered attributes", async ({ request }) => {
  for (const path of ["/", "/fixtures"]) {
    const html = await (await request.get(path)).text();
    expect(html.match(/="[^"]*(?:NaN|Infinity)[^"]*"/g), path).toBeNull();
  }
});

test("the demo page prerenders all of its gauges", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".gauge-container")).toHaveCount(11);
  await expect(page.locator(".gauge-container > svg")).toHaveCount(11);
});
