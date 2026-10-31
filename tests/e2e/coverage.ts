import { test as base, expect } from "@playwright/test";
import MCR from "monocart-coverage-reports";

// Set by `pnpm test:coverage` and the CI coverage run. The build then has inline source maps, which map
// the bundles back to src/lib.
const enabled = Boolean(process.env.COVERAGE);

export const coverageOptions: MCR.CoverageReportOptions = {
  name: "svelte-gauge",
  outputDir: "./coverage",
  // The app's bundles, of which only the library sources count. SvelteKit's entry files only re-export
  // other bundles, and their empty source maps would keep them in the report.
  entryFilter: (entry) => /\/_app\/immutable\/(nodes|chunks)\//.test(entry.url),
  sourceFilter: (sourcePath) => sourcePath.includes("src/lib/"),
  reports: ["v8", "lcovonly", "console-details"],
};

// Records the JavaScript coverage of each test's page. Chromium is the only browser with a coverage API,
// and the others run the same code. Pages without JavaScript (ssr.spec.ts) have nothing to record.
export const test = base.extend({
  page: async ({ page, browserName, javaScriptEnabled }, use) => {
    const collect = enabled && browserName === "chromium" && javaScriptEnabled;
    if (collect) await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);
    if (collect) await MCR(coverageOptions).add(await page.coverage.stopJSCoverage());
  },
});

export { expect };
