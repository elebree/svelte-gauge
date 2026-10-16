import { expect, test, type Page } from "@playwright/test";
import { R, arcLength, serverRendered } from "./fixtures.js";

// Rendered length of an SVG path, as measured by the browser
const length = (page: Page, id: string, selector: string) =>
  page
    .getByTestId(id)
    .locator(selector)
    .first()
    .evaluate((path) => (path as SVGPathElement).getTotalLength());

test.beforeEach(async ({ page }) => {
  await page.goto("/fixtures");
  // Fixtures jump to their value on the first frame; wait until the last one has
  await expect(page.getByTestId("clamped").locator(".gauge-slot-content")).toHaveText("150");
});

test("background arcs span the configured angles in both directions", async ({ page }) => {
  expect(await length(page, "basic", ".gauge-background")).toBeCloseTo(arcLength(R, 360), 0);
  expect(await length(page, "partial", ".gauge-background")).toBeCloseTo(arcLength(R, 270), 0);
  expect(await length(page, "reverse", ".gauge-background")).toBeCloseTo(arcLength(R, 270), 0);
  expect(await length(page, "reverse-full", ".gauge-background")).toBeCloseTo(arcLength(R, 360), 0);
  // Invalid stroke falls back to 20, so the centerline radius is 80 - 10
  expect(await length(page, "invalid", ".gauge-background")).toBeCloseTo(arcLength(70, 360), 0);
});

test("progress arcs cover the value's share of the sweep", async ({ page }) => {
  expect(await length(page, "basic", ".gauge-progress")).toBeCloseTo(arcLength(R, 90), 0);
  expect(await length(page, "partial", ".gauge-progress")).toBeCloseTo(arcLength(R, 135), 0);
  // Reverse sweeps longer than 180° need the large-arc flag
  expect(await length(page, "reverse", ".gauge-progress")).toBeCloseTo(arcLength(R, 270), 0);
  expect(await length(page, "reverse-full", ".gauge-progress")).toBeCloseTo(arcLength(R, 180), 0);
  // Range 100..0 with value 25 covers 75% of the circle
  expect(await length(page, "reversed-range", ".gauge-progress")).toBeCloseTo(arcLength(R, 270), 0);
  // Values outside the range are clamped
  expect(await length(page, "clamped", ".gauge-progress")).toBeCloseTo(arcLength(R, 360), 0);
  expect(await length(page, "empty-range", ".gauge-progress")).toBeCloseTo(0, 0);
});

test("segments span their share of the sweep", async ({ page }) => {
  for (const id of ["segments", "segments-tuple"]) {
    const lengths = await page
      .getByTestId(id)
      .locator("defs path[id^=segment-]")
      .evaluateAll((paths) => paths.map((path) => (path as SVGPathElement).getTotalLength()));
    expect(lengths, id).toHaveLength(3);
    [108, 108, 144].forEach((degrees, i) => expect(lengths[i], id).toBeCloseTo(arcLength(R, degrees), 0));
  }
});

test("the pointer sits at the value's angle", async ({ page }) => {
  const pointer = async (id: string) => {
    const circle = page.getByTestId(id).locator(".gauge-pointer").first();
    return [Number(await circle.getAttribute("cx")), Number(await circle.getAttribute("cy"))];
  };
  // Angle 0 is at the bottom and angles grow clockwise; the center is (80, 80)
  expect(await pointer("basic")).toEqual([80 - R, 80]);
  expect(await pointer("empty-range")).toEqual([80, 80 + R]);
  expect(await pointer("reverse-full")).toEqual([80, 80 - R]);
});

test("the pointer sits at the end of the progress arc", async ({ page }) => {
  for (const id of serverRendered.filter((id) => !["no-value", "invalid", "reactive", "animated"].includes(id))) {
    const [end, center] = await page.getByTestId(id).locator(".gauge-container").first().evaluate((el) => {
      const progress = el.querySelector(":scope > svg > .gauge-progress") as SVGPathElement;
      const pointer = el.querySelector(":scope > svg > .gauge-pointer") as SVGCircleElement;
      const point = progress.getPointAtLength(progress.getTotalLength());
      return [
        [point.x, point.y],
        [pointer.cx.baseVal.value, pointer.cy.baseVal.value],
      ];
    });
    expect(end[0], id).toBeCloseTo(center[0], 0);
    expect(end[1], id).toBeCloseTo(center[1], 0);
  }
});
