// Runs the @visual tests in the Playwright Docker image that CI uses, against the *-linux.png baselines.
// Extra arguments go to `playwright test`, for example: pnpm test:visual:linux --update-snapshots=all
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

// The image tag has to match the installed Playwright, whose browser builds it contains
const { version } = createRequire(import.meta.url)("@playwright/test/package.json");
const image = `mcr.microsoft.com/playwright:v${version}-noble`;

// node_modules and .svelte-kit stay in the container, so the Windows copies are left alone. build/ can't be a
// volume, since adapter-static deletes it; it is regenerated output anyway.
// The pnpm store is a named volume, so later runs don't download every package again. It needs an explicit
// --store-dir, since pnpm otherwise puts its store at the root of the project's mount, which is the repo.
const volumes = ["node_modules", ".svelte-kit"].flatMap((dir) => ["--mount", `type=volume,target=/work/${dir}`]);
const script =
  "corepack enable && pnpm install --frozen-lockfile --store-dir /pnpm-store && pnpm exec playwright test --project=chromium --grep @visual \"$@\"";

const { status, error } = spawnSync(
  "docker",
  [
    "run", "--rm", "--ipc=host",
    "--mount", `type=bind,source=${process.cwd()},target=/work`,
    ...volumes,
    "--mount", "type=volume,source=svelte-gauge-pnpm-store,target=/pnpm-store",
    "--env", "COREPACK_ENABLE_DOWNLOAD_PROMPT=0",
    "--workdir", "/work",
    image,
    "bash", "-c", script, "bash", ...process.argv.slice(2),
  ],
  { stdio: "inherit" },
);
if (error) throw error;
process.exit(status ?? 1);
