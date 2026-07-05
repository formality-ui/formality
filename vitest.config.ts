import { defineConfig, coverageConfigDefaults } from "vitest/config";

// Root-level vitest config. The per-package configs (referenced by
// vitest.workspace.ts) define WHAT runs in each project; this root config
// holds cross-cutting settings — in particular coverage, which vitest resolves
// against the workspace root (`ctx.config.root`), not the individual project
// roots. See PRD §1.3.7.
//
// Note: setting `coverage.exclude` REPLACES vitest's defaults rather than
// extending them, so we spread `coverageConfigDefaults.exclude` first and then
// add the PRD §1.3.7 out-of-scope directories.
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      exclude: [
        ...coverageConfigDefaults.exclude,
        // PRD §1.3.7 — out of scope: demo apps and stubbed adapters.
        "examples/**",
        "packages/svelte/**",
        "packages/vue/**",
        // vitest's default `dist/**` is root-anchored; this also catches nested
        // package build output (e.g. packages/*/dist/**).
        "**/dist/**",
      ],
    },
  },
});
