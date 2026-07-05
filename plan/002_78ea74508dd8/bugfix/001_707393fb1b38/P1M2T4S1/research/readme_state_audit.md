# README State Audit — P1.M2.T4.S1 (Mode-B docs sweep)

> Purpose: capture the EXACT current state of the two overview READMEs' CI /
> coverage / examples narrative, the precise scope fences, and the minimal,
> honest edits this changeset must make. Read alongside the PRP.

## 0. What this task IS and IS NOT

- **IS** the SOW §5 **Mode-B** cross-cutting overview-docs sweep.
- **IS** the LAST task in the changeset (depends on P1.M1.T1.S1, P1.M2.T1.S1,
  P1.M2.T2.S1, P1.M2.T3.S1 all having landed).
- **IS NOT** a rewrite. The existing prose is mostly accurate post-fix; the
  contract mandates *small clarifying sentences*, not a rebuild.
- **IS NOT** the owner of the README §Scripts table — that row is added
  (Mode-A) by **P1.M2.T3.S1**. This task MUST NOT touch that table.
- **IS NOT** the owner of any `.github/workflows/*` file, `package.json`,
  `vitest.config.ts`, `examples/**`, or `packages/**`.

## 1. CI reality (the source of truth the docs must describe)

`grep` of `.github/workflows/ci.yml` `verify` job steps (post P1.M1.T1.S1 +
post P1.M2.T3.S1, which is what the tree looks like when THIS task runs):

```
- run: pnpm lint
- run: pnpm typecheck
- run: pnpm typecheck:examples      # <- added by P1.M2.T3.S1 (parallel; lands before us)
- run: pnpm test:coverage           # <- the 90% gate (P1.M1.T1.S1 already switched this)
- name: Build core + react
  run: pnpm --filter @formality-ui/core --filter @formality-ui/react build
```

→ **Honest claims this task may make** (because both are literally in `ci.yml`
when this task runs last):
- "CI runs `pnpm test:coverage`" (the 90% gate) — TRUE.
- "CI runs `pnpm typecheck:examples`" (examples stay type-clean) — TRUE.

`release.yml` does NOT run tests/typecheck (build + publish only) → do not
describe release as enforcing anything. Out of scope anyway.

## 2. README.md — current state (verified line numbers, 764-line file)

### §Scripts table — lines ~697–705 — **DO NOT TOUCH** (owned by P1.M2.T3.S1)

```markdown
### Scripts

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `pnpm build`         | Build all packages                   |
| `pnpm test`          | Run all tests                        |
| `pnpm test:coverage` | Run tests with the 90% coverage gate |
| `pnpm typecheck`     | Type check all packages              |
| `pnpm lint`          | Lint all packages                    |
```

(P1.M2.T3.S1 adds the `pnpm typecheck:examples` row here. Our task must NOT
duplicate or pre-empt that.)

### §Examples — lines 711–723 — accurate; OPTIONAL light touch

```markdown
## Examples

See the [examples directory](./examples) for comprehensive, runnable examples:

| Example ... (9 rows) |
```

Post-changeset the examples are ALSO type-clean (typecheck:examples green in
CI). The phrase "comprehensive, runnable examples" remains accurate; adding
"type-clean" is a discretionary one-word enhancement, NOT required. The
honest, non-fabricated narrative about type-cleanness lives primarily in the
§Contributing/Testing sentence (see §2 below). If §Examples is touched, the
only defensible edit is "comprehensive, runnable, type-clean examples".

### §Contributing / ### Testing — lines ~725–759 — **PRIMARY EDIT TARGET**

Current text (verbatim):

```markdown
## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Testing

```bash
pnpm test                          # run all tests
pnpm test:coverage                 # run tests + enforce the 90% coverage gate
pnpm test --filter=@formality-ui/core
pnpm test --filter=@formality-ui/react
```

Coverage is enforced at **≥ 90%** across statements, branches, functions, **and**
lines — the run exits non-zero (fails CI) if any drops below (v8 provider). The
gate applies repo-wide to all shipped code (`packages/core/**`,
`packages/react/**`). The following are excluded from the measurement:

| Excluded path        | Reason                                  |
| -------------------- | --------------------------------------- |
| `examples/**`        | Demo apps; not shipped                  |
| `packages/svelte/**` | Stubbed adapter (no implementation yet) |
| `packages/vue/**`    | Stubbed adapter (no implementation yet) |
| `**/dist/**`         | Build output                            |

See [PRD §1.3.7 — Testing Strategy](./PRD.md) for the full specification.
```

**Gap**: the coverage narrative is accurate and even says "fails CI" (which is
now TRUE), but there is NO mention that:
(a) CI actually invokes `pnpm test:coverage` (the sentence implies it but
    never names the CI invocation), and
(b) CI also runs `pnpm typecheck:examples` so the shipped examples stay
    type-clean.

**Minimal honest fix**: append ONE short clarifying paragraph at the end of
the Testing subsection (after the "See PRD §1.3.7 …" line), e.g.:

> In CI, the `verify` job runs both the coverage gate (`pnpm test:coverage`)
> and the examples type-check (`pnpm typecheck:examples`), so a regression in
> either fails the build.

(Exact wording in the PRP's Implementation Blueprint. No change to the code
block, the exclusion table, or the coverage paragraph itself — those are
already correct.)

## 3. packages/react/README.md — current state (verified, 659-line file)

### §Testing & Coverage — lines 630–657 — **SECONDARY EDIT TARGET**

Current text (verbatim):

```markdown
## Testing & Coverage

Run the test suite with coverage from the repo root:

```bash
pnpm test:coverage
# equivalent to: vitest run --coverage
```

Coverage is enforced as a **hard gate**: the run exits non-zero if **any** of
statements, branches, functions, or lines drop below **90%**
([vitest coverage thresholds](https://vitest.dev/guide/coverage.html#coverage-thresholds)).

Coverage is computed **repo-wide** (merged across `packages/core` and
`packages/react`), excluding only the directories below:

| Glob                 | Reason                 |
| -------------------- | ---------------------- |
| `examples/**`        | Demo apps; not shipped |
| `packages/svelte/**` | Stubbed adapter        |
| `packages/vue/**`    | Stubbed adapter        |
| `**/dist/**`         | Build output           |

All other code — `packages/core/**`, `packages/react/**`, and any future
adapter with a real implementation — is in scope and must clear 90%. See
`vitest.config.ts` for the exact configuration.

## License
```

**Gap**: the hard-gate description is accurate, but it never says this gate is
*run in CI*. The "light confirmation" the contract asks for = state plainly
that CI enforces the coverage gate (and, for completeness, also runs the
examples type-check).

**Minimal honest fix**: append ONE short clarifying sentence at the end of
the §Testing & Coverage subsection (after "See `vitest.config.ts` …", before
`## License`), e.g.:

> CI's `verify` job runs `pnpm test:coverage` on every push and PR, so any
> sub-90% regression fails the build; it also runs `pnpm typecheck:examples`
> to keep the shipped examples type-clean.

(Exact wording in the PRP. No rewrite of the gate/threshold/exclusion prose —
already correct.)

## 4. Validation facts (verified)

- **`pnpm lint` will NOT lint README.md or packages/react/README.md.**
  `eslint.config.mjs` `files` glob is `packages/**/*.{ts,tsx}` and
  `examples/**/*.{ts,tsx}` only; markdown is never matched. The global
  `ignores` also lists `dist`/`node_modules`/`coverage`/`*.tsbuildinfo`/
  `svelte`/`vue`. → Editing READMEs cannot introduce an eslint failure.
  (The contract's "verify nothing breaks" = run `pnpm lint` and confirm it
  still exits 0; it will, because the READMEs aren't in scope.)
- **Markdown formatting**: no markdown linter is wired in CI (no
  `markdownlint`/`remark` in `package.json` scripts). The only check that
  could plausibly catch a table break is a human reading GitHub's rendered
  preview. Keep edits confined to prose paragraphs (no table edits) to stay
  zero-risk.
- **`pnpm test:coverage` currently green** at 97.29%/95.56%/99.07%/97.29%
  (from PRD §Overview). The 90% gate prose is therefore true, not aspirational.
- **`pnpm typecheck:examples` is green** once P1.M2.T2.S1 + P1.M2.T1.S1 land
  (they do, before this task). So claiming "examples are type-clean in CI" is
  honest.

## 5. Scope fences (do NOT cross)

| Surface | Owner | This task's action |
|---|---|---|
| `README.md` §Scripts table | P1.M2.T3.S1 | **DO NOT TOUCH** |
| `README.md` §Contributing/Testing prose | **P1.M2.T4.S1 (this)** | +1 clarifying sentence |
| `README.md` §Examples intro | (unclaimed / discretionary) | optional 1-word tweak only |
| `packages/react/README.md` §Testing & Coverage | **P1.M2.T4.S1 (this)** | +1 clarifying sentence |
| `.github/workflows/ci.yml` | P1.M1.T1.S1 + P1.M2.T3.S1 | READ ONLY (precondition check) |
| `.github/workflows/release.yml` | (out of scope) | DO NOT TOUCH |
| `package.json`, `vitest.config.ts` | earlier milestones | DO NOT TOUCH |
| `examples/**`, `packages/**` | P1.M2.T1/T2 + library | DO NOT TOUCH |
| `PRD.md` | humans (READ-ONLY) | **NEVER MODIFY** |

## 6. Risk assessment

- **Conflict risk with P1.M2.T3.S1**: NONE. T3.S1 edits `ci.yml` + the
  README §Scripts *table*; this task edits the README §Contributing/Testing
  *prose* (different section, ~50 lines apart) and packages/react/README.md
  (which T3.S1 never touches). No overlapping hunks.
- **Accuracy risk**: LOW. Every claim is grounded in a literal `ci.yml` step
  that exists when this task runs. Task 0 precondition asserts the steps are
  present before any prose is written, so the docs cannot describe a CI that
  doesn't yet exist.
- **"Fabrication" risk** (contract §3c): MITIGATED. Edits are confined to
  restating what `ci.yml` literally does. No new scripts, thresholds, or
  behaviors are invented.
