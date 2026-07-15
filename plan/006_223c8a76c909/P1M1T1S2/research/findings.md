# Research Notes — P1.M1.T1.S2: `resolveFieldOverType` helper

## Task
Add ONE pure generic helper to `packages/core/src/config/defaults.ts` that
encapsulates the §6.4.0 precedence rule ("field wins over type when `!== undefined`")
shared by all six field-level override levers.

## 1. Target file confirmed

`packages/core/src/config/defaults.ts` — pure functions, ZERO framework deps
(`import type { FieldConfig, InputConfig } from "../types"`). Current exports:

- `resolveInitialValue` — priority chain; **already** uses the exact inline
  pattern this helper extracts: `if (inputConfig?.defaultValue !== undefined)`
  (Priority 3 block). This is direct proof the semantics are already battle-
  tested in the codebase.
- `resolveAllInitialValues`, `isEmptyValue`, `getInputDefaultValue`,
  `mergeRecordWithDefaults`.

The helper does **NOT** exist yet (grep across `packages/core/src` returns
nothing — confirmed).

## 2. Export chain (S2 vs S3 boundary — CRITICAL)

```
packages/core/src/config/defaults.ts      ← SOURCE  (S2 owns: add `export function`)
packages/core/src/config/index.ts          ← barrel  (S3 owns: add to `export {…} from "./defaults"`)
packages/core/src/index.ts                 ← root    (S3 owns: add to `export {…} from "./config"`, ~line 127 area)
```

Root `index.ts` (lines ~118–135) currently re-exports `resolveInitialValue,
resolveAllInitialValues, isEmptyValue, getInputDefaultValue, mergeRecordWithDefaults`
from `"./config"`. S3 adds `resolveFieldOverType` to BOTH barrel files.

**Implication for S2 testing:** the function is only reachable via the source
module until S3 lands. S2's test MUST import directly from
`"../config/defaults"` (NOT `"../index"`), otherwise it fails because the
barrels don't re-export it yet. This keeps S2 self-contained and validatable
independently of S3. After S3, the direct import remains valid (no churn).

## 3. Existing inline precedent (semantics proof)

`resolveInitialValue` (defaults.ts ~line 70):
```ts
// Priority 3: Input type default value
if (inputConfig?.defaultValue !== undefined) {
  return inputConfig.defaultValue;
}
```
This is the `!== undefined` rule verbatim. `resolveFieldOverType` is the
named, reusable extraction of it. P1.M2.T1.S1 will later refactor this site to
call `resolveFieldOverType(fieldConfig?.defaultValue, inputConfig?.defaultValue)`.

## 4. Test conventions (vitest)

- File: `packages/core/src/__tests__/config.test.ts`
- Structure: `describe("Config Module", () => { describe("deepMerge"…),
  …, describe("Initial Value Resolution", () => { describe("resolveInitialValue"…),
  describe("resolveAllInitialValues"…), describe("isEmptyValue"…),
  describe("getInputDefaultValue"…), describe("mergeRecordWithDefaults"…) }) })`
- Import style: `import { … } from "../index"` (barrel). **S2 must diverge** —
  import `resolveFieldOverType` from `"../config/defaults"` (see §2).
- Assertions: plain `expect(x).toBe(y)` / `.toEqual(…)` / `.toBeUndefined()`.
- Baseline: 1085 passed | 5 skipped (41 files). Must stay green + 90/90/90/90
  coverage gate (root `vitest.config.ts`).

Recommended test block: a new `describe("resolveFieldOverType", …)` placed as
the FIRST child of `describe("Config Module", …)` (before `deepMerge`) — it is
the most primitive resolver, consumed by the others. The §6.4.5 edge cases
(null / false / 0 / "" must all be returned as-is, NOT fall through to typeVal)
are the highest-value assertions.

## 5. tsconfig / runner behavior

- Core `tsconfig.json`: `include: ["src/**/*"]`, `exclude: ["src/**/*.test.ts",
  "src/**/__tests__/**"]`. So `tsc --build` (root `pnpm typecheck`) does NOT
  type-check test files — it only checks `defaults.ts` itself. Good (the helper
  is trivially type-correct; `<T>` generic).
- `vitest run` (root `pnpm test`) picks up `src/**/*.test.ts` → includes
  `config.test.ts`. The new tests DO run and count toward coverage.

## 6. Validation commands (verified present in root package.json)

```bash
pnpm test            # vitest run  — runs config.test.ts, enforces 90% gate
pnpm typecheck       # tsc --build — compiles defaults.ts (test files excluded)
pnpm lint            # eslint .
pnpm format:check    # prettier --check .
pnpm format          # prettier --write .  (fix formatting if needed)
```

## 7. Key gotchas

- **`!== undefined` (NOT `??`, NOT truthiness).** `??` would treat `null`/`0`/
  `false`/`""` as "missing" and fall through to typeVal — violating §6.4.5.
  The task contract mandates `fieldVal !== undefined ? fieldVal : typeVal`.
- **Generic `<T>`** — return type is `T | undefined`. Both params are
  `T | undefined`. Keep the generic so call sites get type inference (e.g.
  debounce resolves to `number | false | undefined`, parser to its union).
- **No framework imports.** defaults.ts is pure; the helper must stay pure
  (no React, no state, no side effects). Enforced by `sample.test.ts`
  ("should have no framework imports in package.json").
- **JSDoc** — task contract gives the exact text (Mode A docs ride with work).
  Match the file's existing JSDoc density (`/** … */`, may add `@example`).

## 8. Placement in defaults.ts

Recommend TOP of file (after the import, before `resolveInitialValue`) — it is
the foundational primitive that resolveInitialValue (and later debounce/
parser/formatter/getSubmitField/valueField sites) builds upon; primitive-first
ordering. End-of-file is also acceptable; top is preferred for clarity.
