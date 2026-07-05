# Research Note — vitest v2 Coverage Threshold Semantics (P1.M2.T1.S5)

> Purpose: ground the PRP's validation section in the *actual* installed
> toolchain behavior, so the implementing agent does not have to guess.

## 1. Installed versions (verified)

| Package                 | Version |
| ----------------------- | ------- |
| `vitest`                | 2.1.9   |
| `@vitest/coverage-v8`   | 2.1.9   |

`pnpm@8.15.0` is the declared `packageManager` (root `package.json`).

## 2. The `coverage.thresholds` shape (vitest v2)

From `node_modules/vitest/dist/coverage.d.ts`:

```ts
thresholds: Partial<Record<Threshold, number | undefined>>;
// Threshold = "statements" | "branches" | "functions" | "lines" | "perFile"
```

So each key is a plain number interpreted as a **percent** (0–100). The PRD
§1.3.7 / Appendix B h3.95 verbatim block is therefore exactly correct:

```ts
thresholds: {
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90,
},
```

No extra keys, no nested objects, no `100` vs `90.0` ambiguity.

## 3. Exit-code semantics (THE hard gate)

From `node_modules/vitest/dist/coverage.d.ts` (the v8 provider class):

```ts
/**
 * Check collected coverage against configured thresholds.
 * Sets exit code to 1 when thresholds not reached.
 */
private checkThresholds;
```

➡️ Adding the block turns `pnpm test:coverage` into a **non-zero-exit-on-
failure** CI gate. This is the entire deliverable of S5. There is **no separate
CI file** to edit in this repo — the gate is the script's exit code.

## 4. Where coverage is resolved

Per `architecture/system_context.md` §1.1/§1.2 and `coverage_gaps.md` §6:
coverage is resolved at the **repo root** (`vitest.config.ts`), **not**
per-package. The per-package configs (`packages/core/vitest.config.ts`,
`packages/react/vitest.config.ts`) only set `environment`/`include`/`globals`/
`setupFiles` — they have no `coverage` block. Therefore the `thresholds` block
MUST live in the **root** `vitest.config.ts`, alongside the existing
`coverage.exclude`.

> Confirmed: `grep -rn thresholds vitest.config.ts packages/*/vitest.config.ts`
> currently returns nothing. S5 adds the *only* threshold block in the repo.

## 5. Current baseline (verified by running `pnpm test:coverage`)

Captured at PRP authoring time (S1–S3 applied; S4 in parallel):

```
All files | 93.31 | 91.62 | 98.14 | 93.31   (stmt / branch / func / line)
```

Exit code **0** (no thresholds configured yet, so nothing to fail against).

➡️ All four metrics are **already ≥ 90%** today. Adding the threshold block is
therefore safe to turn on immediately; it converts the current "silently green"
state into a **hard gate** that cannot regress below 90% without turning red.
Once S4 lands the ~92–94% margin, the gate holds with comfortable headroom.

## 6. What the gate does NOT change

- The existing `coverage.exclude` list (PRD §1.3.7): `examples/**`,
  `packages/svelte/**`, `packages/vue/**`, `**/dist/**` spread over
  `coverageConfigDefaults.exclude`. **Untouched.**
- Per-package configs. **Untouched.**
- CI workflow file. (The repo's `.github/` may reference `pnpm test:coverage`;
  that is already wired — the gate is the script exit code, not a CI-side
  threshold env var. No CI edit is in scope for S5.)
- Test files. S5 is **config-only**. If a metric is short, the fix is in S4
  (add tests) — **never** lower the threshold or broaden excludes (PRD §1.3.7,
  `architecture/system_context.md` §2 constraint #6).

## 7. Parallel-execution note (vs S4)

S4 (backfill tests → ~92–94%) is implemented **in parallel**. S4 touches only
test files (`expression.test.ts`, `transform.test.ts`, `config.test.ts`,
`Field.test.tsx`) and is explicitly forbidden from touching
`vitest.config.ts`. S5 touches **only** `vitest.config.ts`. **Zero file
overlap.** S5 may be authored while S4 is mid-flight; the only consumer-facing
check is `pnpm test:coverage` exiting 0 after S4 lands.
