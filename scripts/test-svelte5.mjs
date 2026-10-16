// Runs the Playwright suite against Svelte 5 (legacy mode) in a temporary copy of the repo.
// Extra arguments go to `playwright test`, for example: pnpm test:svelte5 --project=chromium
import { execSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const root = process.cwd();
const skip = new Set(["node_modules", ".git", ".svelte-kit", ".pnpm-store", "build", "dist", "test-results", "playwright-report"]);
const dir = mkdtempSync(join(tmpdir(), "svelte-gauge-svelte5-"));
cpSync(root, dir, {
  recursive: true,
  filter: (src) => !skip.has(relative(root, src).split(/[\\/]/)[0]),
});

const run = (command) => execSync(command, { cwd: dir, stdio: "inherit", env: { ...process.env, PW_PORT: "4174" } });
let failed = false;
try {
  // vite-plugin-svelte 4 is the newest version that supports both Svelte 5 and Vite 5
  run("pnpm add -D svelte@^5 @sveltejs/vite-plugin-svelte@^4");
  run(`pnpm exec playwright test ${process.argv.slice(2).join(" ")}`);
} catch {
  failed = true;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
