// Runs the Chromium tests with coverage and writes the reports to coverage/ (open coverage/index.html).
// Extra arguments go to `playwright test`, for example: pnpm test:coverage tests/e2e/behavior.spec.ts
import { execSync } from "node:child_process";

// Its own port, so it never reuses a running server whose build has no source maps
const env = { ...process.env, COVERAGE: "1", PW_PORT: "4175" };
try {
  execSync(`pnpm exec playwright test --project=chromium ${process.argv.slice(2).join(" ")}`, { stdio: "inherit", env });
} catch {
  process.exit(1);
}
