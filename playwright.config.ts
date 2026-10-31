import { defineConfig, devices } from "@playwright/test";

// The Svelte 5 run (scripts/test-svelte5.mjs) uses its own port so it never reuses a Svelte 4 server
const port = Number(process.env.PW_PORT ?? 4173);

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    // Node only: geometry helpers and the packed npm package
    { name: "unit", testDir: "tests/unit" },
    { name: "package", testDir: "tests/package" },
    // The built demo site, including the fixtures page, in real browsers
    {
      name: "chromium",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testDir: "tests/e2e",
      testIgnore: ["visual.spec.ts", "a11y.spec.ts"],
      // Firefox starts and closes pages much more slowly than the others when all three run in parallel
      timeout: 60_000,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testDir: "tests/e2e",
      testIgnore: ["visual.spec.ts", "a11y.spec.ts"],
      use: { ...devices["Desktop Safari"] },
    },
  ],
  // Tests run against the production build, so prerendered HTML is exactly what gets deployed
  webServer: {
    command: `pnpm exec vite build && pnpm exec vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
