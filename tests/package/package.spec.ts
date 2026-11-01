import { expect, test } from "@playwright/test";
import { execFileSync, execSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { VERSION, compile } from "svelte/compiler";
import ts from "typescript";

// These tests pack the library the way `pnpm publish` does and use the tarball like a consumer would
test.describe.configure({ mode: "serial" });

const root = process.cwd();
let work: string;
let tarball: string;
let consumer: string;
let installed: string;

test.beforeAll(async () => {
  test.setTimeout(180_000);
  // Builds dist/ with svelte-package and validates package.json with publint; throws if either fails
  execSync("pnpm run package", { cwd: root, stdio: "pipe" });
  work = mkdtempSync(join(tmpdir(), "svelte-gauge-package-"));
  execSync(`pnpm pack --pack-destination "${work}"`, { cwd: root, stdio: "pipe" });
  tarball = readdirSync(work).find((file) => file.endsWith(".tgz"))!;

  // Install it like npm does: extracted into node_modules next to the consumer's own svelte.
  // A relative archive path keeps both GNU tar and bsdtar from reading "C:" as a remote host.
  execFileSync("tar", ["-xzf", tarball], { cwd: work });
  consumer = join(work, "consumer");
  installed = join(consumer, "node_modules", "svelte-gauge");
  mkdirSync(join(consumer, "node_modules"), { recursive: true });
  renameSync(join(work, "package"), installed);
  symlinkSync(realpathSync(join(root, "node_modules", "svelte")), join(consumer, "node_modules", "svelte"), "junction");
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "consumer", private: true, type: "module" }));
});

test.afterAll(() => {
  // Remove the junction first, so cleaning up never touches the real svelte package
  rmSync(join(consumer, "node_modules", "svelte"), { force: true });
  rmSync(work, { recursive: true, force: true });
});

test("ships only the built files, README, LICENSE and package.json", () => {
  const files = execFileSync("tar", ["-tzf", tarball], { cwd: work, encoding: "utf8" }).trim().split(/\r?\n/);
  for (const file of files) expect(file).toMatch(/^package\/(dist\/.+|README\.md|LICENSE|package\.json)$/);
  for (const file of ["index.js", "index.d.ts", "Gauge.svelte", "Gauge.svelte.d.ts", "util.js", "util.d.ts"]) {
    expect(files).toContain(`package/dist/${file}`);
  }
});

test("has no runtime dependencies and a Svelte 4 and 5 peer range", () => {
  const pkg = JSON.parse(readFileSync(join(installed, "package.json"), "utf8"));
  expect(pkg.dependencies).toBeUndefined();
  expect(pkg.peerDependencies).toEqual({ svelte: ">=4.0.0 <6.0.0" });
});

test("the tarball stays within its size budget", () => {
  expect(statSync(join(work, tarball)).size).toBeLessThanOrEqual(8 * 1024);
});

test("the runtime code stays within its size budget", () => {
  // npm gets the package built with Svelte 4. Under Svelte 5, svelte-package keeps the TypeScript in Gauge.svelte.
  test.skip(Number(VERSION.split(".")[0]) >= 5, "measured on the Svelte 4 build, which is the one published");
  const runtime = ["index.js", "Gauge.svelte", "util.js"]
    .map((file) => statSync(join(installed, "dist", file)).size)
    .reduce((sum, size) => sum + size, 0);
  expect(runtime).toBeLessThanOrEqual(12 * 1024);
});

test("resolves through the svelte export condition", () => {
  const resolved = execFileSync(
    process.execPath,
    ["--conditions=svelte", "--input-type=module", "-e", "console.log(import.meta.resolve('svelte-gauge'))"],
    { cwd: consumer, encoding: "utf8" }
  ).trim();
  expect(resolved).toMatch(/\/node_modules\/svelte-gauge\/dist\/index\.js$/);
});

test("TypeScript resolves the bundled types", () => {
  const { resolvedModule } = ts.resolveModuleName(
    "svelte-gauge",
    join(consumer, "index.ts"),
    { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, customConditions: ["svelte"] },
    ts.sys
  );
  expect(resolvedModule?.resolvedFileName.replaceAll("\\", "/")).toMatch(/\/node_modules\/svelte-gauge\/dist\/index\.d\.ts$/);
});

test("the published component compiles and renders on the server with the installed Svelte", async () => {
  const major = Number(VERSION.split(".")[0]);
  const source = readFileSync(join(installed, "dist", "Gauge.svelte"), "utf8");
  const { js } = compile(source, { filename: "Gauge.svelte", generate: (major >= 5 ? "server" : "ssr") as "ssr" });
  const file = join(installed, "dist", "Gauge.server.js");
  writeFileSync(file, js.code);
  const { default: Gauge } = await import(pathToFileURL(file).href);

  const props = { value: 50, width: 200, labels: ["A", "B"] };
  // svelte/server only exists in Svelte 5; a variable keeps the Svelte 4 type check from resolving it
  const serverModule = "svelte/server";
  const html: string = major >= 5 ? (await import(serverModule)).render(Gauge, { props }).body : Gauge.render(props).html;

  expect(html).toContain('viewBox="0 0 200 200"');
  expect(html.match(/<textPath/g)).toHaveLength(2);
  expect(html).not.toMatch(/="[^"]*(?:NaN|Infinity)[^"]*"/);
});
