#!/usr/bin/env node
// Drives the semantic-release lifecycle for the @formality-ui monorepo.
//
// semantic-release computes ONE shared version from conventional commits;
// this script stamps it onto both publishable packages, builds them, and
// publishes. Order matters: core is published before react (react depends on
// core), and `pnpm publish` rewrites react's `@formality-ui/core: "workspace:*`
// range to the real published version at publish time.
//
//   prepare <version>  -> bump package.json versions + build core & react
//   publish            -> pnpm publish core, then react
//
// Invoked by @semantic-release/exec. Auth comes from NODE_AUTH_TOKEN in the
// env (set on the Release workflow step; setup-node's registry-url writes the
// matching .npmrc).
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const cmd = process.argv[2];
const version = process.argv[3];
const PACKAGES = ["packages/core", "packages/react"];

function setVersion(pkgDir, v) {
  const file = `${pkgDir}/package.json`;
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  pkg.version = v;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

function run(command) {
  execSync(command, { stdio: "inherit" });
}

if (cmd === "prepare") {
  if (!version)
    throw new Error(
      'prepare requires a version argument (e.g. "prepare 0.1.0")',
    );
  for (const dir of PACKAGES) setVersion(dir, version);
  run("pnpm --filter @formality-ui/core --filter @formality-ui/react build");
} else if (cmd === "publish") {
  // core first (react depends on it), then react.
  run(
    "pnpm --filter @formality-ui/core publish --no-git-checks --access public",
  );
  run(
    "pnpm --filter @formality-ui/react publish --no-git-checks --access public",
  );
} else {
  throw new Error(`Unknown command: ${cmd}. Expected "prepare" or "publish".`);
}
