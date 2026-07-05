# Research: CI step ordering for `pnpm typecheck:examples`

**Question**: Where in the `verify` job must the new `pnpm typecheck:examples`
step go? Does `pnpm typecheck` produce the `dist` that the examples' composite
references consume, or must the step come after the explicit
`pnpm --filter ... build`?

## Findings

### 1. Examples resolve `@formality-ui/{core,react}` via `dist`, not source

`examples/tsconfig.json`:
```json
{
  "compilerOptions": { "composite": true, "rootDir": ".", "outDir": "../.tsbuildcache/examples", "jsx": "react-jsx" },
  "include": ["**/*.ts", "**/*.tsx"],
  "references": [{ "path": "../packages/core" }, { "path": "../packages/react" }]
}
```

`packages/react/package.json` resolves the package types through dist:
```
"main":   "./dist/index.cjs"
"module": "./dist/index.js"
"types":  "./dist/index.d.ts"
"exports": { "types": "./dist/index.d.ts", ... }
```

`pnpm typecheck:examples` = `tsc -p examples/tsconfig.json --noEmit` (NOT
`tsc --build -p ...`). Non-build `tsc -p` does **not** build referenced
projects; it reads their emitted `.d.ts` from each referenced project's
`declarationDir`. Therefore `packages/{core,react}/dist/*.d.ts` MUST already
exist when the step runs.

Verified empirically: `packages/react/dist/index.d.ts` and
`packages/core/dist/index.d.ts` are present on a built tree.

### 2. `pnpm typecheck` (`tsc --build`) produces that dist

Root `tsconfig.json` is solution-style (`"files": []`, references
`packages/core` + `packages/react`). Both package tsconfigs are
`composite: true` with `outDir: "dist"`, `declarationDir: "dist"`, and inherit
`declaration: true` + `declarationMap: true` from the root.

`tsc --build` on the root walks the reference graph and **emits** `.js` +
`.d.ts` + `.tsbuildinfo` into each package's `dist`. So immediately after the
`- run: pnpm typecheck` step, `packages/{core,react}/dist/index.d.ts` is fresh.

Incremental cache: `.tsbuildinfo` files exist locally. In CI the checkout is
fresh (the workflow only caches the pnpm store via `cache: pnpm`; it does NOT
cache `dist` or `*.tsbuildinfo`), so `tsc --build` always does a full emit.
No stale-dist risk.

### 3. Conclusion — recommended placement is correct and safe

The work-item contract recommends placing the new step **immediately after**
`- run: pnpm typecheck`, grouped with the other type-checking steps. This is
correct: `pnpm typecheck` produces the dist the examples consume.

Resulting `verify` job step order:
```
- run: pnpm lint
- run: pnpm typecheck
- run: pnpm typecheck:examples   # NEW — dist is fresh from the line above
- run: pnpm test:coverage
- name: Build core + react
  run: pnpm --filter @formality-ui/core --filter @formality-ui/react build
```

Equally-valid alternative: place it AFTER the `Build core + react` step (tsup
also emits dist). The contract prefers the grouped placement; either works.
Do NOT place it before `pnpm typecheck` — dist would be absent/stale and the
step would emit phantom TS6305 / resolution errors.

### 4. Blocking semantics — no special flag needed

A GitHub Actions `- run: <cmd>` step fails the job iff the command exits
non-zero. `tsc --noEmit` exits 1 on any type error. So a plain
`- run: pnpm typecheck:examples` is already BLOCKING. Do NOT add
`continue-on-error: true` (the contract explicitly requires blocking; examples
are clean per dependency P1.M2.T2.S1).

### 5. Step naming convention

The existing grouped steps (`pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`)
omit an explicit `name:` and rely on the auto-generated "Run pnpm X" label.
Match that: use the bare `- run: pnpm typecheck:examples` form (no `name:`)
for consistency with its siblings. (The `Build core + react` step is the
exception because it runs a longer filter command.)

### 6. README dup-check vs P1.M2.T4.S1

`grep -rn "typecheck:examples" README.md packages/react/README.md .github/`
→ 0 matches currently. Adding the Scripts-table row is a clean, non-duplicating
change. The broader §Contributing/Testing CI-narrative is owned by P1.M2.T4.S1
and MUST NOT be touched here.
