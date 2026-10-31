import type { Locator, Page } from "@playwright/test";

// Fixtures on /fixtures (src/routes/fixtures/+page.svelte) that have a numeric width and render on the server
export const serverRendered = [
  "basic",
  "no-value",
  "labels",
  "labels-centered",
  "segments",
  "segments-tuple",
  "partial",
  "reverse",
  "reverse-full",
  "reverse-labels",
  "reversed-range",
  "empty-range",
  "clamped",
  "invalid",
  "invalid-range",
  "non-numbers",
  "display-string",
  "display-fn",
  "slot",
  "styled",
  "nested",
  "reactive",
  "animated",
];

// Fixtures sized by CSS, which render only after the browser has measured them
export const clientOnly = ["auto-size", "string-width", "resize"];

// Fixtures that look the same on every run, for screenshots
export const stable = [
  ...serverRendered.filter((id) => id !== "reactive" && id !== "animated"),
  "auto-size",
  "string-width",
];

// Radius of the arc centerline for width 160 and stroke 12 without labels: 160 / 2 - 12 / 2
export const R = 74;

// Length of an arc with radius r spanning the given degrees
export const arcLength = (r: number, degrees: number) =>
  (r * Math.abs(degrees) * Math.PI) / 180;

// The outermost gauge of a fixture
export const gauge = (page: Page, id: string): Locator =>
  page.getByTestId(id).locator(".gauge-container").first();

// Attributes in all gauges whose value contains NaN or Infinity
export const invalidAttributes = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".gauge-container, .gauge-container *")].flatMap((el) =>
      [...el.attributes]
        .filter((attr) => /NaN|Infinity/.test(attr.value))
        .map((attr) => `<${el.tagName} ${attr.name}="${attr.value}">`)
    )
  );

// Console errors and warnings plus uncaught exceptions, collected while the page runs
export const collectErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
};
