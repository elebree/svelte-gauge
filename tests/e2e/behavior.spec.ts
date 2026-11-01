import { expect, test } from "./coverage.js";
import { gauge } from "./fixtures.js";

// Computed value of a CSS custom property on a fixture's outermost gauge
const cssVar = (page: import("@playwright/test").Page, id: string, name: string) =>
  gauge(page, id).evaluate((el, name) => getComputedStyle(el).getPropertyValue(name).trim(), name);

test.beforeEach(async ({ page }) => {
  await page.goto("/fixtures");
  await expect(page.getByTestId("auto-size").locator("svg")).toHaveCount(1);
});

test("value text shows the value, the displayValue string or the function result", async ({ page }) => {
  const text = (id: string) => page.getByTestId(id).locator(".gauge-slot-content");
  await expect(text("basic")).toHaveText("25");
  await expect(text("clamped")).toHaveText("150");
  await expect(text("display-string")).toHaveText("OK");
  await expect(text("display-fn")).toHaveText("40 km/h");
  await expect(text("no-value")).toHaveText("");
  await expect(text("no-value-start")).toHaveText("");
  await expect(text("invalid")).toHaveText("");
});

test("an undefined or invalid value hides the progress arc and the pointer", async ({ page }) => {
  for (const id of ["no-value", "no-value-start", "invalid"]) {
    await expect(page.getByTestId(id).locator(".gauge-progress"), id).toHaveCount(0);
    await expect(page.getByTestId(id).locator(".gauge-pointer"), id).toHaveCount(0);
  }
  await expect(page.getByTestId("basic").locator(".gauge-progress")).toHaveCount(1);
  await expect(page.getByTestId("basic").locator(".gauge-pointer")).toHaveCount(1);
});

test("labels are spread along the arc, or centered in equal slots", async ({ page }) => {
  const offsets = (id: string) =>
    page
      .getByTestId(id)
      .locator(".gauge-labels textPath")
      .evaluateAll((paths) => paths.map((path) => path.getAttribute("startOffset")));
  expect(await offsets("labels")).toEqual(["25%", "50%", "75%"]);
  expect(await offsets("labels-centered")).toEqual(["33.33%", "50%", "66.67%"]);
  await expect(page.getByTestId("labels").locator(".gauge-labels textPath")).toHaveText(["A", "B", "C"]);
  await expect(page.getByTestId("labels").locator(".gauge-labels textPath").first()).toHaveAttribute("href", /^#labels-path-/);
});

test("labels added later reserve their border", async ({ page }) => {
  const reactive = page.getByTestId("reactive");
  expect(await cssVar(page, "reactive", "--gauge-border")).toBe("0px");
  await reactive.getByRole("button", { name: "Add labels" }).click();
  await expect(reactive.locator(".gauge-labels textPath")).toHaveText(["A", "B"]);
  expect(await cssVar(page, "reactive", "--gauge-border")).toBe("16px");
});

test("a new easing applies to the next change", async ({ page }) => {
  const reactive = page.getByTestId("reactive");
  await expect(reactive.locator(".gauge-slot-content")).toHaveText("20");
  // The first text the gauge shows after the click
  const text = await reactive.evaluate((section) => {
    const content = section.querySelector(".gauge-slot-content")!;
    const changed = new Promise<string | null>((resolve) =>
      new MutationObserver(() => resolve(content.textContent)).observe(content, {
        characterData: true,
        childList: true,
        subtree: true,
      })
    );
    [...section.querySelectorAll("button")].find((button) => button.textContent === "Ease to 80 halfway")!.click();
    return changed;
  });
  // The new easing holds the value halfway between 20 and 80; the old one would have jumped to 80
  expect(text).toBe("50");
  await expect(reactive.locator(".gauge-slot-content")).toHaveText("80");
});

test("object segments get their color and label, tuple segments render plain", async ({ page }) => {
  const segments = page.getByTestId("segments");
  await expect(segments.locator("use.gauge-segment")).toHaveCount(3);
  await expect(segments.locator("g").first()).toHaveAttribute("style", "--segment-color: #f6a944");
  await expect(segments.locator(".gauge-segment-label")).toHaveText(["Low", "Mid", "High"]);
  await expect(segments.locator(".gauge-segment-label textPath").first()).toHaveAttribute("href", /^#segment-0-/);

  const tuples = page.getByTestId("segments-tuple");
  await expect(tuples.locator("use.gauge-segment")).toHaveCount(3);
  await expect(tuples.locator(".gauge-segment-label")).toHaveCount(0);
});

test("class, color, stroke and label border reach the container as CSS hooks", async ({ page }) => {
  await expect(gauge(page, "styled")).toHaveClass(/fixture-styled/);
  expect(await cssVar(page, "styled", "--stroke-color")).toBe("crimson");
  expect(await cssVar(page, "styled", "--gauge-stroke")).toBe("8px");
  await expect(page.getByTestId("styled").locator(".gauge-progress")).toHaveCSS("stroke", "rgb(220, 20, 60)");

  expect(await cssVar(page, "labels", "--gauge-border")).toBe("16px");
  expect(await cssVar(page, "basic", "--gauge-border")).toBe("0px");
  expect(await cssVar(page, "basic", "--gauge-radius")).toBe("80px");
});

test("invalid numbers fall back to the defaults", async ({ page }) => {
  expect(await cssVar(page, "invalid", "--gauge-stroke")).toBe("20px");
  await expect(page.getByTestId("invalid").locator(".gauge-background")).toHaveAttribute("d", /^M [\d.]+ [\d.]+ A /);
  for (const id of ["invalid-range", "non-numbers"]) {
    expect(await cssVar(page, id, "--gauge-stroke"), id).toBe("20px");
    await expect(page.getByTestId(id).locator(".gauge-pointer"), id).toHaveAttribute("r", "10");
  }
});

test("an infinite value counts as no value", async ({ page }) => {
  const reactive = page.getByTestId("reactive");
  await expect(reactive.locator(".gauge-slot-content")).toHaveText("20");
  await reactive.getByRole("button", { name: "Set Infinity" }).click();
  await expect(reactive.locator(".gauge-progress")).toHaveCount(0);
  await expect(reactive.locator(".gauge-pointer")).toHaveCount(0);
  await expect(reactive.locator(".gauge-slot-content")).toHaveText("");
});

test("the default slot replaces the value text and receives the value", async ({ page }) => {
  const slot = page.getByTestId("slot");
  await expect(slot.locator(".gauge-slot-content")).toHaveCount(0);
  await expect(slot.locator(".gauge-slot-container")).toHaveCount(1);
  await expect(page.getByTestId("slot-value")).toHaveText("30");
});

test("updates when the value changes or is cleared", async ({ page }) => {
  const reactive = page.getByTestId("reactive");
  await expect(reactive.locator(".gauge-slot-content")).toHaveText("20");

  await reactive.getByRole("button", { name: "Set 80" }).click();
  await expect(reactive.locator(".gauge-slot-content")).toHaveText("80");

  await reactive.getByRole("button", { name: "Clear" }).click();
  await expect(reactive.locator(".gauge-progress")).toHaveCount(0);
  await expect(reactive.locator(".gauge-pointer")).toHaveCount(0);
  await expect(reactive.locator(".gauge-slot-content")).toHaveText("");
});

test("follows the size of its container", async ({ page }) => {
  const resize = page.getByTestId("resize");
  await expect(resize.locator("svg")).toHaveAttribute("viewBox", "0 0 180 180");
  await resize.getByRole("button", { name: "Resize" }).click();
  await expect(resize.locator("svg")).toHaveAttribute("viewBox", "0 0 120 120");
  await expect(gauge(page, "resize")).toHaveAttribute("style", /--gauge-radius: 60px;/);
});

test("animates to the value with the default easing", async ({ page }) => {
  await expect(page.getByTestId("animated").locator(".gauge-slot-content")).toHaveText("75", { timeout: 5000 });
});
