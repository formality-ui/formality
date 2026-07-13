# Research: CI Command Sequence & dist/ Build Verification — Formality Monorepo

All scripts referenced by the PRP contract step (d) exist and map to the expected
commands. The project gates on a hard 90% coverage threshold (statements/branches/
functions/lines) with `examples/**`, `packages/svelte/**`, `packages/vue/**`,
`**/dist/**`, and `scripts/**` excluded. `dist/` is BOTH gitignored and
prettier-ignored → generated at build time, never committed.

## 1. Root `package.json` scripts (verbatim, `version: "0.1.0"`, private)

| Script | Exact command |
|---|---|
| `lint` | `eslint .` |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` |
| `typecheck` | `tsc --build` |
| `typecheck:examples` | `tsc -p examples/tsconfig.json --noEmit` |
| `test` | `vitest run` |
| `test:coverage` | `vitest run --coverage` |
| `build` | `pnpm -r build` |
| `release` | `semantic-release` |
| `release:dry` | `semantic-release --dry-run`  ← LACKS `--no-ci`; skipped locally |

### Contract step (d) — every segment resolves to an existing script ✓
```
pnpm lint && pnpm format:check && pnpm typecheck && pnpm typecheck:examples && pnpm test:coverage && pnpm --filter @formality-ui/core --filter @formality-ui/react build
```
- `lint`→`eslint .`; `format:check`→`prettier --check .`; `typecheck`→`tsc --build`;
  `typecheck:examples`→`tsc -p examples/tsconfig.json --noEmit`;
  `test:coverage`→`vitest run --coverage`;
  build filter→`tsup` in each of core + react.
- The filtered build (`--filter core --filter react`) is the PUBLISHABLE pair and
  matches exactly what `scripts/release.mjs prepare` runs. It does NOT build the
  private vue/svelte stubs (correct).

### Note: this is the CI `verify` job, NOT the `release` job
- `.github/workflows/ci.yml` `verify` job = `lint`, `format:check`, `typecheck`,
  `typecheck:examples`, `test:coverage`, build core+react. **(exact match to step d)**
- `.github/workflows/release.yml` `release` job = `typecheck`, `test`, then
  `npx semantic-release`. It runs on `push: branches:[main]` and `workflow_dispatch`.

## 2. `vitest.config.ts` (root) — coverage gate (verbatim)

**Thresholds (hard gate; CI exits 1 below any of these):**
```ts
thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 }
```
**Exclude list (REPLACES vitest defaults, so `coverageConfigDefaults.exclude` is
spread first):** `examples/**`, `packages/svelte/**`, `packages/vue/**`,
`**/dist/**`, `scripts/**` (+ defaults). `coverage.exclude` is resolved against the
WORKSPACE root (per docs), so it lives in the root config, not the per-package
configs. `vitest.workspace.ts` = core + react only.

## 3. `tsup` build configs (packages/core & packages/react)

Shared (both): `entry: ["src/index.ts"]`, `format: ["esm","cjs"]`, `dts: {compilerOptions:{composite:false}}`,
`sourcemap:true`, `clean:true` (wipes dist before build), `treeshake:true`,
`splitting:false`, `minify:false`. React adds `external:["react","react-dom","react-hook-form"]`
and `esbuildOptions jsx="automatic"`.

**dist/ output (single entry → `index.*`):**

| File | Format | package.json field |
|---|---|---|
| `dist/index.js` | ESM | `module`, `exports["."].import` |
| `dist/index.cjs` | CJS | `main`, `exports["."].require` |
| `dist/index.d.ts` (+ `.d.cts`) | types | `types`, `exports["."].types |
| `dist/index.js.map`, `dist/index.cjs.map` | sourcemaps | (sourcemap:true) |

## 4. `.gitignore` & `.prettierignore` — dist handling

- `.gitignore`: `dist/` (+ `build/`, `*.tsbuildinfo`, `.tsbuildcache/`) → **dist NOT committed**.
- `.prettierignore`: `**/dist/` → dist NOT prettier-checked.
- A clean checkout has NO `dist/`; produced by `pnpm build` / filtered build.
- To verify a release build: run the filtered build, then assert
  `index.js`, `index.cjs`, `index.d.ts` exist in both `packages/core/dist/` and
  `packages/react/dist/`.

## 5. Package versions & publish fields (verified)

| Package | version | private | exports→dist | Published? |
|---|---|---|---|---|
| `@formality-ui/core` | **0.2.5** | (absent→false) | ✓ `./dist/index.*` | YES |
| `@formality-ui/react` | **0.2.5** | (absent→false) | ✓ `./dist/index.*` | YES |
| `@formality-ui/vue` | **0.0.0** | **true** | ✓ | NO (private stub) |
| `@formality-ui/svelte` | **0.0.0** | **true** | ✓ | NO (private stub) |

core & react SHARE the identical exports block; react depends on
`"@formality-ui/core": "workspace:*"` (pnpm rewrites to the real published
version at publish time). Both: `publishConfig.access: "public"`, `sideEffects:false`,
`files:["dist"]`.

**At research time: `core=0.2.5 react=0.2.5 → MATCH ✓`** (verified via node script).

## 6. Git state (verified)

- Branch: `main`. Tree: **clean** (no uncommitted changes).
- Last git tag: **`v0.2.5`**.
- Commits since `v0.2.5`: ~17, including `feat(core): add validate()`,
  `feat(core): add mergeConfigs()`, `feat(react): implement useField hook`,
  `feat(react): add useField type contract and stub`, `refactor(core): relocate
  ordering functions to config/ordering`, several `test:`/`docs:`/`chore:`, and
  the P3.M2.T1.S1 README-sync commit `docs: sync README architecture and structure to v1.0`.
- **NO breaking markers (`!:` or `BREAKING CHANGE`) in any commit since v0.2.5**
  (grep confirmed empty). → semantic-release will compute **0.3.0 (minor)** from
  the `feat:` commits, NOT 1.0.0. See sibling file
  `semantic-release-major-bump-behavior.md`.

## 7. `scripts/release.mjs` — prepare & publish (verified)

Driven by `.releaserc.json` `@semantic-release/exec`.

**`prepare <version>`** (invoked `node scripts/release.mjs prepare ${nextRelease.version}`):
1. `PACKAGES = ["packages/core","packages/react"]` → stamps the SAME
   `${nextRelease.version}` onto BOTH `package.json` files (reads, sets `.version`,
   rewrites with trailing newline).
2. Runs `pnpm --filter @formality-ui/core --filter @formality-ui/react build`.

**`publish`**:
1. `pnpm --filter @formality-ui/core publish --no-git-checks --access public`
2. `pnpm --filter @formality-ui/react publish --no-git-checks --access public`
   (core first — react depends on it; `--no-git-checks` allows publishing from the
   `[skip ci]` release commit).

`.releaserc.json` `@semantic-release/git` assets =
`["packages/core/package.json","packages/react/package.json","CHANGELOG.md"]`,
commit message `chore(release): ${nextRelease.version} [skip ci]`. `branches:["main"]`.

## Sources (all first-party repo files)

`package.json`, `vitest.config.ts`, `vitest.workspace.ts`, `.gitignore`,
`.prettierignore`, `packages/{core,react,vue,svelte}/package.json`,
`packages/{core,react}/tsup.config.ts`, `scripts/release.mjs`, `.releaserc.json`,
`.github/workflows/{ci,release}.yml`, `examples/tsconfig.json`, `.git` refs.

## Gaps

None material for the PRP. Live `pnpm` execution of the step (d) sequence is the
definitive proof and is the PRP's Level-2/Level-3 gate. The dry-run command form
(`--no-ci`) and the "manual bump fails" caveat are covered in the sibling research
file.
