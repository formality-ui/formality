# PRP — P1.M1.T1.S2: Implement `resolveFieldOverType` helper

**Parent plan**: `plan/006_223c8a76c909` — §6.4 Field-Level Overrides.
**Status**: Core foundation (precedence helper). A single pure generic function
that encapsulates the §6.4.0 "field wins over type when `!== undefined`" rule.
This sub-task owns the function **definition + JSDoc + unit test** only. The
barrel/`index` re-exports are the next sub-task (S3). This is the foundational
primitive consumed by P1.M2.T1.S1 (resolveInitialValue) and the React-adapter
resolution sites in P1.M3.

---

## Goal

**Feature Goal**: Add one exported, pure, generic helper `resolveFieldOverType`
to `packages/core/src/config/defaults.ts` that returns the field-level value
when it is not `undefined`, otherwise the type-level value — so that `null`,
`false`, `0`, and `""` are **meaningful** overrides/defaults (PRD §6.4.0,
§6.4.5). This is the single precedence rule shared by all six field-level
levers (`defaultValue`, `debounce`, `parser`, `formatter`, `getSubmitField`,
`valueField`).

**Deliverable**: An exported function `resolveFieldOverType<T>` in
`packages/core/src/config/defaults.ts` with the exact signature and JSDoc below,
plus a unit-test block in `packages/core/src/__tests__/config.test.ts` covering
the override semantics and the §6.4.5 edge cases. No other source file is
touched (barrel/`index` exports are S3's scope).

**Success Definition**:
1. `resolveFieldOverType` is defined and exported from
   `packages/core/src/config/defaults.ts` with the exact generic signature.
2. Its body uses `!== undefined` (NOT `??`, NOT truthiness) — §6.4.5 semantics.
3. JSDoc matches the task-contract text (Mode A docs ride with the work).
4. A `describe("resolveFieldOverType", …)` block exists in `config.test.ts`
   asserting: field-wins, type-fallback, both-undefined, and the §6.4.5 cases
   (`null`/`false`/`0`/`""` are returned, not fallen-through).
5. `pnpm test` passes (1085+ new tests green; 90/90/90/90 coverage gate held).
6. `pnpm typecheck`, `pnpm lint`, `pnpm format:check` all pass.

---

## Why

PRD §6.4 specifies that every behavioral lever on `InputConfig` is overridable
per-field-instance, all under **one** identical rule (§6.4.0): the field value
wins over the type value when it is not `undefined`. Rather than reimplementing
that check at six resolution sites across the React adapter (and future
Svelte/Vue adapters), §6.4.0 mandates a **single core helper** so the rule lives
in one auditable place.

- **Business value**: one rule, one test, one place to change. Eliminates the
  class of bugs where one adapter uses `??` (wrong: drops `null`/`false`/`0`/`"`)
  and another uses `!== undefined` (right).
- **Proven semantics**: `resolveInitialValue` in this very file already uses the
  inline `inputConfig?.defaultValue !== undefined` check (its Priority 3 block).
  This helper is the named, reusable extraction of that proven check.
- **Scope boundary**: this sub-task is the **definition** only. Wiring it into
  `resolveInitialValue` (P1.M2.T1.S1) and the React adapter
  (P1.M3.T1/T2/T3.S1) is explicitly separate. Re-exporting from the core barrel
  + root `index` is S3. Do not implement those here.

---

## What

Add one exported generic function to `packages/core/src/config/defaults.ts`:

```typescript
/**
 * Resolve a field-level override against its type-level default. Returns the
 * field value when it is not undefined (so null/false/0/"" are meaningful
 * overrides); otherwise the type value. This is the single precedence rule
 * shared by defaultValue, debounce, parser, formatter, getSubmitField, and
 * valueField (§6.4.0). Every adapter MUST call this helper at each
 * field-vs-type resolution site.
 */
export function resolveFieldOverType<T>(
  fieldVal: T | undefined,
  typeVal: T | undefined,
): T | undefined {
  return fieldVal !== undefined ? fieldVal : typeVal;
}
```

### Success Criteria

- [ ] `resolveFieldOverType` exists in `config/defaults.ts` with the exact
      generic signature `<T>(fieldVal: T | undefined, typeVal: T | undefined): T | undefined`.
- [ ] Body is `fieldVal !== undefined ? fieldVal : typeVal` (NOT `fieldVal ?? typeVal`).
- [ ] JSDoc present and references §6.4.0 (Mode A docs ride with the work).
- [ ] `config.test.ts` has a `describe("resolveFieldOverType")` block with ≥4
      cases: field-wins, type-fallback, both-undefined, and the §6.4.5
      falsy-but-meaningful cases (null / false / 0 / "").
- [ ] The test imports `resolveFieldOverType` from `"../config/defaults"`
      (direct module — NOT `"../index"`, which is S3's scope; see Gotchas).
- [ ] `pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm format:check` pass.
- [ ] 90% coverage gate still green.

---

## All Needed Context

### Context Completeness Check

> _"If someone knew nothing about this codebase, would they have everything
> needed to implement this successfully?"_ — **YES.** This PRP names the exact
> file, the exact function (copy-pasteable signature + body), the exact JSDoc,
> the exact test file, the exact test-block placement, the exact import path
> (and why it diverges from the file's barrel convention), and the exact
> validation commands. The change is a localized addition of one ~10-line
> function plus a focused test block.

### Documentation & References

```yaml
# PRD — authoritative spec for the precedence rule and its edge cases.
- docfile: PRD.md
  section: §6.4.0 (The precedence rule — single rule for all six)
  why: Gives the exact helper code and the `!== undefined` semantics verbatim.
  critical: "MUST use `!== undefined`, NOT `??` or truthiness. `null`/`false`/`0`/`\"\"` are MEANINGFUL overrides (§6.4.5) and must NOT fall through to typeVal."
- docfile: PRD.md
  section: §6.4.5 (Edge cases & semantics)
  why: Enumerates the falsy-but-meaningful cases the tests must assert.

# The single source file being edited.
- file: packages/core/src/config/defaults.ts
  why: Home of all pure default-resolution helpers; zero framework deps. New helper belongs here.
  pattern: "`resolveInitialValue` already inlines `inputConfig?.defaultValue !== undefined` in its Priority 3 block — this is the exact check the new helper extracts and names."
  gotcha: "defaults.ts imports only `import type { FieldConfig, InputConfig } from \"../types\"`. The new helper needs NO imports (pure generic, params only). Do not add FieldConfig/InputConfig references."

# The test file to extend.
- file: packages/core/src/__tests__/config.test.ts
  why: Vitest suite for all config helpers; nested `describe(\"Config Module\", () => { describe(\"deepMerge\")… describe(\"Initial Value Resolution\")… })`.
  pattern: "Each helper gets its own `describe(name, () => { it(…) })`. Assertions use plain `expect(x).toBe(y)` / `.toEqual(…)` / `.toBeUndefined()`."
  gotcha: "Existing tests import from `\"../index\"` (root barrel). resolveFieldOverType is NOT in the barrel yet (S3 owns that) — S2 MUST import it directly from `\"../config/defaults\"` or the test fails to compile/run."

# The barrel + root index — DO NOT EDIT in this task (S3's scope).
- file: packages/core/src/config/index.ts
  why: "`export { resolveInitialValue, … } from \"./defaults\"` — adding resolveFieldOverType here is S3. Touching it now duplicates/conflicts with S3."
- file: packages/core/src/index.ts
  why: "Root barrel re-exports config helpers (~lines 118–135) from `\"./config\"`. S3 adds resolveFieldOverType here. Out of scope for S2."

# Architecture context (read-only) — confirms the gap and the downstream wiring sites.
- docfile: plan/006_223c8a76c909/architecture/prd_gaps.md
  section: "What's Also Missing: resolveFieldOverType Helper" + "2. Core Helper (config/defaults.ts)"
  why: Confirms the function does not exist and lists the 6 downstream call sites this enables.
- docfile: plan/006_223c8a76c909/P1M1T1S1/PRP.md
  why: "The parallel type-addition task. It adds the 6 optional fields to FieldConfig. This helper is independent of those fields at the type level (it is generic over T), but P1.M2.T1.S1 will later call `resolveFieldOverType(fieldConfig?.defaultValue, inputConfig?.defaultValue)` — so this helper's signature must match that usage."
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/config/defaults.ts          # ← EDIT TARGET (add export function resolveFieldOverType)
packages/core/src/config/index.ts             # barrel — NO EDIT (S3)
packages/core/src/index.ts                    # root barrel — NO EDIT (S3)
packages/core/src/__tests__/config.test.ts    # ← EDIT TARGET (add describe block + direct import)
packages/core/src/types/config.ts             # FieldConfig — owned by S1 (parallel); not touched here
vitest.config.ts                              # root: 90/90/90/90 coverage gate
package.json                                  # scripts: pnpm test/typecheck/lint/format:check
```

### Desired Codebase tree with files to be added/changed

```bash
packages/core/src/config/defaults.ts          # MODIFY — add resolveFieldOverType<T> (top of file, after import)
packages/core/src/__tests__/config.test.ts    # MODIFY — add resolveFieldOverType import (from "../config/defaults") + describe block
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: use `!== undefined`, NOT `??`. `fieldVal ?? typeVal` would treat
// null / false / 0 / "" as "missing" and return typeVal — directly violating
// PRD §6.4.5. The whole point of the helper is the strict-undefined check.
// `resolveInitialValue`'s Priority-3 block already proves the correct form.

// CRITICAL (S2/S3 boundary): the test MUST import resolveFieldOverType from
// `"../config/defaults"`, NOT `"../index"`. The root barrel + config barrel do
// not re-export it until S3 lands. Importing from "../index" would make the
// test fail at S2 time. After S3, the direct import stays valid (no churn).

// CRITICAL: keep it pure. defaults.ts has ZERO framework deps (enforced by
// packages/core/src/__tests__/sample.test.ts, which asserts package.json has
// no react/vue/svelte deps). The helper takes two params and returns one — no
// imports needed, no state, no side effects.

// GENERIC: the `<T>` is required so call sites get inference. E.g. a debounce
// call `resolveFieldOverType(fieldConfig?.debounce, inputConfig?.debounce)`
// resolves T = number | false and returns `number | false | undefined`.
// Do NOT specialize T or drop the generic.

// PLACEMENT: put the helper at the TOP of defaults.ts (after the `import type`
// line, before `resolveInitialValue`). It is the foundational primitive that
// resolveInitialValue (and later the adapter sites) build on; primitive-first
// ordering aids readers. End-of-file is acceptable if preferred; top is recommended.
```

---

## Implementation Blueprint

### Data models and structure

No data models — a single pure function. Exact definition to add at the top of
`packages/core/src/config/defaults.ts` (after the `import type {…} from "../types";`
line, before `resolveInitialValue`):

```typescript
/**
 * Resolve a field-level override against its type-level default. Returns the
 * field value when it is not undefined (so null/false/0/"" are meaningful
 * overrides); otherwise the type value. This is the single precedence rule
 * shared by defaultValue, debounce, parser, formatter, getSubmitField, and
 * valueField (§6.4.0). Every adapter MUST call this helper at each
 * field-vs-type resolution site.
 *
 * @param fieldVal - The field-level (instance) value; `undefined` means "not specified".
 * @param typeVal  - The type-level (InputConfig) default; `undefined` means "not specified".
 * @returns `fieldVal` when it is not `undefined`, else `typeVal`.
 *
 * @example
 * // Field override wins (even when falsy):
 * resolveFieldOverType(false, true);   // → false
 * resolveFieldOverType(null, "x");     // → null
 * resolveFieldOverType(0, 100);        // → 0
 * resolveFieldOverType("", "fallback");// → ""
 *
 * // Field unset → type default:
 * resolveFieldOverType(undefined, "type"); // → "type"
 * resolveFieldOverType(undefined, undefined); // → undefined
 */
export function resolveFieldOverType<T>(
  fieldVal: T | undefined,
  typeVal: T | undefined,
): T | undefined {
  return fieldVal !== undefined ? fieldVal : typeVal;
}
```

> The `@param` / `@example` lines are recommended additions matching the file's
> existing JSDoc density (see `resolveInitialValue`'s block). The core prose +
> §6.4.0 reference is the required (task-contract) text.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY packages/core/src/config/defaults.ts — add resolveFieldOverType
  - LOCATE: the top of the file. There is one import:
        `import type { FieldConfig, InputConfig } from "../types";`
    immediately followed by the `/** Resolve the initial value… */` JSDoc for
    resolveInitialValue.
  - INSERT: the `resolveFieldOverType` function (see "Data models and
            structure" above) BETWEEN the import and the resolveInitialValue
            JSDoc, separated by one blank line on each side.
  - SIGNATURE (exact — do not deviate):
        export function resolveFieldOverType<T>(
          fieldVal: T | undefined,
          typeVal: T | undefined,
        ): T | undefined
  - BODY (exact):
        return fieldVal !== undefined ? fieldVal : typeVal;
  - JSDOC: required core text = "Resolve a field-level override against its
           type-level default. Returns the field value when it is not undefined
           (so null/false/0/\"\" are meaningful overrides); otherwise the type
           value. This is the single precedence rule shared by defaultValue,
           debounce, parser, formatter, getSubmitField, and valueField (§6.4.0).
           Every adapter MUST call this helper at each field-vs-type resolution
           site." (add @param/@example as shown above — optional but recommended).
  - NAMING: `resolveFieldOverType`, camelCase, `export function` (named export —
            matches every other function in this file).
  - DO NOT: touch any other function, touch imports (the helper needs none),
            or touch the barrel files (config/index.ts, src/index.ts — S3).

Task 2: MODIFY packages/core/src/__tests__/config.test.ts — add unit tests
  - ADD an import line. The existing imports come from "../index" (root barrel).
    resolveFieldOverType is NOT in the barrel until S3, so import it DIRECTLY
    from the source module:
        import { resolveFieldOverType } from "../config/defaults";
    Place this import right after the existing `import { … } from "../index";`
    block (top of file). Keep the existing barrel import intact.
  - ADD a `describe("resolveFieldOverType", () => { … })` block. Recommended
    placement: as the FIRST child describe inside `describe("Config Module", …)`,
    i.e. immediately before `describe("deepMerge", …)`. (It is the most
    primitive resolver; primitive-first ordering. End-of-file inside the
    Config Module block is also acceptable.)
  - TEST CASES (assert all of these — they encode §6.4.0 + §6.4.5):
      it("returns the field value when it is not undefined (override wins)")
        expect(resolveFieldOverType("field", "type")).toBe("field");
      it("returns the type value when field is undefined (fallback)")
        expect(resolveFieldOverType(undefined, "type")).toBe("type");
      it("returns undefined when both are undefined")
        expect(resolveFieldOverType(undefined, undefined)).toBeUndefined();
      it("treats null as a meaningful override (§6.4.5)")   // CRITICAL
        expect(resolveFieldOverType(null, "type")).toBeNull();
      it("treats false as a meaningful override (§6.4.5)")  // CRITICAL
        expect(resolveFieldOverType(false, true)).toBe(false);
      it("treats 0 as a meaningful override (§6.4.5)")      // CRITICAL
        expect(resolveFieldOverType(0, 100)).toBe(0);
      it('treats "" as a meaningful override (§6.4.5)')     // CRITICAL
        expect(resolveFieldOverType("", "fallback")).toBe("");
      it("passes through a type-level null when field is undefined")
        expect(resolveFieldOverType(undefined, null)).toBeNull();
      it("preserves type inference over the generic (number | false)")
        // optional: confirm debounce-shaped usage compiles & returns the value
        const d: number | false | undefined = resolveFieldOverType(false, 500);
        expect(d).toBe(false);
  - FOLLOW pattern: sibling describes in this file (e.g. "isEmptyValue") use
        plain `expect(…).toBe(…)` / `.toBeNull()` / `.toBeUndefined()`.
  - NAMING: `describe("resolveFieldOverType", …)`; `it("…")` sentences.
  - COVERAGE: the 4 §6.4.5 cases (null/false/0/"") are the highest-value
        assertions — they are the exact regressions `??` would introduce.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: every function in defaults.ts is a named export with a `/** … */`
// JSDoc block. Match that style (2-space indent, `;`/`,` per TS conventions).

// PATTERN: `resolveInitialValue` (same file) already encodes the `!== undefined`
// rule inline:
//     if (inputConfig?.defaultValue !== undefined) { return inputConfig.defaultValue; }
// The new helper is the named, reusable version of THAT exact check. P1.M2.T1.S1
// will later replace that inline check with a resolveFieldOverType call.

// GOTCHA (the #1 way this task gets done wrong): writing `return fieldVal ??
// typeVal`. `??` falls through on null/0/false/"" — the opposite of §6.4.5.
// Always `fieldVal !== undefined ? fieldVal : typeVal`.

// GOTCHA (test import): the whole file imports from "../index"; your new test
// imports resolveFieldOverType from "../config/defaults". Do NOT add it to the
// existing `import { … } from "../index"` list — it isn't exported there yet.

// GOTCHA (generic): do not constrain or specialize <T>. Both params are
// `T | undefined`; return is `T | undefined`. Leave T fully inferred by caller.
```

### Integration Points

```yaml
DATABASE:
  - none (pure function; no persistence, no migration).

CONFIG:
  - none (no settings/env vars).

ROUTES / EXPORTS:
  - The function is `export`ed from defaults.ts (its definition IS the export).
  - DO NOT add it to packages/core/src/config/index.ts or packages/core/src/index.ts
    in this task — that is S3 ("Export resolveFieldOverType from core index").
    This is a hard scope boundary: editing the barrels here duplicates/conflicts
    with S3.
  - Downstream consumers (NOT this task — listed for awareness):
      P1.M1.T1.S3        → barrel + root index re-export
      P1.M2.T1.S1        → resolveInitialValue Priority-3 uses it
      P1.M3.T1.S1        → useField parser/formatter resolution
      P1.M3.T2.S1        → changeField debounce resolution
      P1.M3.T3.S1        → transformValuesForSubmit getSubmitField/valueField
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# From repo root. Type-check the core package (tsc --build). Note: core tsconfig
# EXCLUDES *.test.ts and __tests__/**, so this checks defaults.ts itself.
pnpm typecheck      # = tsc --build across packages/core + packages/react

# Lint + format-check.
pnpm lint
pnpm format:check

# If prettier flags the new function/test, run:
#   pnpm prettier --write packages/core/src/config/defaults.ts packages/core/src/__tests__/config.test.ts

# Expected: ZERO errors. The only plausible TS error would be a malformed
# generic signature or a stray type — read the message and fix the signature.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Targeted (fastest feedback) — run just the config suite.
pnpm vitest run packages/core/src/__tests__/config.test.ts

# Full suite (enforces the 90% coverage gate).
pnpm test

# Coverage on the touched module (optional, sanity):
pnpm vitest run packages/core/src/__tests__/config.test.ts --coverage

# Expected:
#   - All resolveFieldOverType cases pass (field-wins, type-fallback,
#     both-undefined, and the 4 §6.4.5 falsy cases).
#   - 1085 + N new tests pass (N = number of `it` blocks added), 5 skipped.
#   - Coverage gate 90/90/90/90 still green (the new function is fully covered
#     by the truthy-field, undefined-field, and both-undefined branches).
```

### Level 3: Integration Testing (System Validation)

```bash
# Confirm the helper is importable from its source module (the S2 contract —
# S3 will later make it reachable via the barrels).
pnpm -r build   # builds packages/core + packages/react; must succeed

# Smoke import (throwaway; do NOT commit a scratch file):
#   node -e "import('./packages/core/src/config/defaults.ts').then(m => console.log(typeof m.resolveFieldOverType))"
# (If tsx/ts-node isn't wired, rely on the vitest run + tsc --build instead —
#  both already prove the export exists and is callable.)

# Expected: build succeeds; no "cannot find name resolveFieldOverType" errors.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# §6.4.5 semantics proof — the four falsy-but-meaningful cases. These are the
# exact regressions that `??` (the wrong implementation) would introduce, so
# they are the most important assertions. They live in the Task 2 describe
# block; re-run them in isolation if anything looks off:
pnpm vitest run packages/core/src/__tests__/config.test.ts -t "resolveFieldOverType"

# Confirm the helper does NOT import any framework module (PRD §1.3.2 / the
# sample.test.ts "no framework imports" gate). It takes no imports at all, so
# this is satisfied by construction — but the gate still runs under `pnpm test`.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` passes with zero errors.
- [ ] `pnpm test` passes (baseline 1085 passed | 5 skipped + new tests; no regressions).
- [ ] `pnpm lint` passes; `pnpm format:check` passes.
- [ ] 90/90/90/90 coverage gate still green (`pnpm test` enforces it).

### Feature Validation

- [ ] `resolveFieldOverType` exported from `config/defaults.ts` with the exact
      generic signature.
- [ ] Body uses `!== undefined` (NOT `??`).
- [ ] JSDoc present and references §6.4.0.
- [ ] `describe("resolveFieldOverType")` block asserts field-wins, type-fallback,
      both-undefined, AND the four §6.4.5 falsy cases (null/false/0/"").
- [ ] Test imports `resolveFieldOverType` from `"../config/defaults"` (not the barrel).
- [ ] Barrel files (`config/index.ts`, `src/index.ts`) UNCHANGED (S3's scope).

### Code Quality Validation

- [ ] Helper is pure (no imports, no state, no side effects).
- [ ] Matches the file's named-export + JSDoc convention.
- [ ] Placement at top of `defaults.ts` (after import), primitive-first.
- [ ] No anti-patterns (`??`, truthiness, constrained generic, hardcoded values).

### Documentation & Deployment

- [ ] JSDoc is self-documenting (Mode A docs ride with the work).
- [ ] No new env vars / config.

---

## Anti-Patterns to Avoid

- ❌ **Do NOT use `fieldVal ?? typeVal`.** `??` drops `null`/`false`/`0`/`""` —
  the precise opposite of §6.4.5. The helper exists *because* the strict
  `!== undefined` check must be shared.
- ❌ **Do NOT edit the barrels** (`config/index.ts`, `src/index.ts`). That is
  S3. Editing them here duplicates S3's work and creates merge/plan conflicts.
- ❌ **Do NOT add framework imports** to `defaults.ts`. It is the pure core
  module; `sample.test.ts` enforces zero framework dependencies in package.json.
- ❌ **Do NOT specialize or constrain `<T>`.** It must infer freely from the
  caller (debounce → `number | false`, parser → its union, etc.).
- ❌ **Do NOT import the test symbol from `"../index"`.** It is not exported
  from the root barrel until S3; import from `"../config/defaults"`.
- ❌ **Do NOT wire the helper into `resolveInitialValue` or any adapter here.**
  That is P1.M2.T1.S1 / P1.M3.*. This task is definition + test only.
- ❌ **Do NOT skip the §6.4.5 falsy test cases.** They are the regression net
  for the `??` mistake; without them the helper's whole purpose is untested.
