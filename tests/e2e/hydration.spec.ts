import { expect, test } from "./coverage.js";
import { collectErrors, invalidAttributes, serverRendered } from "./fixtures.js";

test("prerendered gauges keep their size when the page hydrates", async ({ page, request }) => {
  const html = await (await request.get("/fixtures")).text();
  await page.goto("/fixtures");
  // The client-only gauges render after measurement, so the page has hydrated
  await expect(page.getByTestId("auto-size").locator("svg")).toHaveCount(1);

  // The viewBox of every SVG per fixture, in the prerendered HTML (DOMParser runs no scripts) and on the live page
  const [prerendered, hydrated] = await page.evaluate(
    ({ html, ids }) => {
      const read = (root: ParentNode) =>
        Object.fromEntries(
          ids.map((id) => [
            id,
            [...root.querySelectorAll(`[data-testid="${id}"] .gauge-container > svg`)].map((svg) =>
              svg.getAttribute("viewBox")
            ),
          ])
        );
      return [read(new DOMParser().parseFromString(html, "text/html")), read(document)];
    },
    { html, ids: serverRendered }
  );

  for (const id of serverRendered) expect(prerendered[id], id).not.toEqual([]);
  expect(hydrated).toEqual(prerendered);
});

test("gauges sized by CSS render at their measured size", async ({ page }) => {
  await page.goto("/fixtures");
  await expect(page.getByTestId("auto-size").locator("svg")).toHaveAttribute("viewBox", "0 0 180 180");
  await expect(page.getByTestId("string-width").locator("svg")).toHaveAttribute("viewBox", "0 0 150 150");
});

for (const path of ["/", "/fixtures"]) {
  test(`${path} runs without console errors and leaks no NaN`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(path);
    await expect(page.locator(".gauge-container > svg").first()).toBeVisible();
    // Let the gauges animate for a while
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
    expect(await invalidAttributes(page)).toEqual([]);
  });
}
