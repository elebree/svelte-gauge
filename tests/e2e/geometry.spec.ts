import type { Page } from "@playwright/test";
import { expect, test } from "./coverage.js";
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
  // The label border moves the centerline in to 80 - 16 - 6
  expect(await length(page, "reverse-labels", ".gauge-background")).toBeCloseTo(arcLength(58, 270), 0);
});

test("label paths reach half a sweep past both ends in both directions", async ({ page }) => {
  // Labels sit on radius 80 - (16 - 2)
  const labelPath = "defs path[id^=labels-path-]";
  expect(await length(page, "labels", labelPath)).toBeCloseTo(arcLength(66, 720), 0);
  // A reverse gauge over 270° has a label path over 540°, longer than a circle
  expect(await length(page, "reverse-labels", labelPath)).toBeCloseTo(arcLength(66, 540), 0);
});

test("labels sit outside the arc at their angles in both directions", async ({ page }) => {
  // Each label's distance from the center (80, 80) and its angle, with angle 0 at the bottom and growing clockwise
  const labels = (id: string) =>
    page
      .getByTestId(id)
      .locator("svg")
      .first()
      .evaluate((svg) => {
        const origin = svg.getBoundingClientRect();
        return [...svg.querySelectorAll(".gauge-labels textPath")].map((label) => {
          const box = label.getBoundingClientRect();
          const dx = box.x + box.width / 2 - origin.x - 80;
          const dy = box.y + box.height / 2 - origin.y - 80;
          return { distance: Math.hypot(dx, dy), angle: (Math.atan2(-dx, dy) * 180) / Math.PI };
        });
      });
  // Difference between two angles, from 0 to 180
  const angleDiff = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);
  // The arc's outer edge is at 80 - 16 = 64. Centered labels sit in thirds of 0..360, and the reverse
  // gauge's labels at its start (0), middle (-135) and stop angle (-270, which is 90)
  for (const [id, expected] of [
    ["labels-centered", [60, 180, -60]],
    ["reverse-labels", [0, -135, 90]],
  ] as const) {
    const found = await labels(id);
    expect(found, id).toHaveLength(expected.length);
    found.forEach(({ distance, angle }, i) => {
      expect(distance, `${id} label ${i}`).toBeGreaterThan(64);
      expect(angleDiff(angle, expected[i]), `${id} label ${i}`).toBeLessThan(10);
    });
  }
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
  // Invalid ranges fall back to 0..100 and invalid strokes to 20, so 50 covers half the circle at radius 70
  expect(await length(page, "invalid-range", ".gauge-progress")).toBeCloseTo(arcLength(70, 180), 0);
  expect(await length(page, "non-numbers", ".gauge-progress")).toBeCloseTo(arcLength(70, 180), 0);
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

test("a NaN segment bound maps to the start angle and an infinite one is clamped", async ({ page }) => {
  const segments = await page
    .getByTestId("invalid-range")
    .locator("defs path[id^=segment-]")
    .evaluateAll((paths) =>
      paths.map((path) => {
        const start = (path as SVGPathElement).getPointAtLength(0);
        return { length: (path as SVGPathElement).getTotalLength(), start: [start.x, start.y] };
      })
    );
  // [NaN, 50] spans 0° to 180° and [50, Infinity] spans 180° to 360°, on radius 70
  expect(segments).toHaveLength(2);
  for (const { length } of segments) expect(length).toBeCloseTo(arcLength(70, 180), 0);
  // Angle 0 is at the bottom; the center is (80, 80)
  expect(segments[0].start[0]).toBeCloseTo(80, 1);
  expect(segments[0].start[1]).toBeCloseTo(80 + 70, 1);
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
