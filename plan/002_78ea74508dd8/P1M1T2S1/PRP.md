name: "P1.M1.T2.S1 — Implement and export defineInputs identity helper + test"
description: |

---

## Goal

**Feature Goal**: Implement PRD Appendix C T2.2 — add an **opt-in**, pure
identity helper `defineInputs<T extends Record<string, ReactInputConfig>>` to
`packages/react/src/overlays.ts`, export it as a **value** from
`@formality-ui/react`, and add a test asserting (a) it returns its argument
**referentially** unchanged and (b) `keyof typeof result` is the expected
literal union (so consumers can write `type InputType = keyof typeof inputs`
and get compile-time checking on input-type keys). The function has **zero
runtime effect** (returns `inputs` as-is), so tsup tree-shakes it to nothing
in production bundles. This is purely **additive** — the existing non-generic
`Field`/`FieldConfig.type?: string` is UNCHANGED.

**Deliverable**:

1. `export function defineInputs<T extends Record<string, ReactInputConfig>>(inputs: T): T { return inputs; }` in `packages/react/src/overlays.ts` with the PRD-mandated JSDoc (InputType derivation example, opt-in note, "default non-generic Field/FieldConfig.type unchanged" note).
2. `defineInputs` exported as a **VALUE** (not `export type`) from `packages/react/src/index.ts`, added to the existing "React Type Overlays" section.
3. A vitest unit test asserting `defineInputs(x) === x` (referential identity).
4. A type-level assertion (either in the same test file via `// @ts-expect-error`, or in a `src/typeAssertions/` `.ts` file that `tsc --build` includes) proving `keyof typeof result` is the expected union and that a typo'd key is rejected.

**Success Definition**:

1. `pnpm --filter @formality-ui/react build` (tsup) succeeds and the emitted `dist/` contains `defineInputs` as a runtime export.
2. `pnpm typecheck` (root `tsc --build`) is green — including any new type-assertion file.
3. `pnpm test` (vitest) is green — the new `defineInputs` test passes, no regressions.
4. `pnpm lint` is clean.
5. Non-breaking: `Field`, `FieldConfig.type`, `FieldProps.type` are UNCHANGED. No consumer is forced to use `defineInputs`.
6. Bundle: `defineInputs` is a one-line identity fn — tsup inlines/tree-shakes it; verify no meaningful bundle-size regression (the PRD explicitly notes this is expected).

## User Persona

**Target User**: React consumers of `@formality-ui/react` (e.g. downstream `sellario-ui`) who want **compile-time** checking that a `FieldConfig.type` / `FieldProps.type` string is one of their registered input keys.

**Use Case**:

```tsx
import { defineInputs } from "@formality-ui/react";

const inputs = defineInputs({
  textField: { component: TextField, defaultValue: "" },
  switch: { component: Switch, defaultValue: false },
});
export type InputType = keyof typeof inputs; // "textField" | "switch"
```

A consumer who then derives `InputType` and parameterizes their configs gets a compile error on `type: "texField"` (typo).

**Pain Points Addressed**: Today `FieldConfig.type?: string` and `FieldProps.type?: string` accept any string, so `type: "texField"` silently renders nothing. There is no way to learn the set of registered input keys from the type system. `defineInputs` is the opt-in escape hatch — consumers who want checking get it; those who don't are unaffected.

## Why

- **Business value**: Closes PRD §C.4 T2.2. The last "silent no-op" footgun on the input-type side (companion to the field-name / config-key footguns closed by P1.M1.T1.S1 and P1.M1.T1.S2). Lowest-risk item in the type-safety delta: additive, one identity function, zero runtime behavior change.
- **Integration**: Builds directly on T1.1 (DONE) — `defineInputs` is constrained to `Record<string, ReactInputConfig>`, the overlay that types `component` as a real `ComponentType<any>`. This means a consumer wrapping their inputs in `defineInputs` ALSO gets the T1.1 component-type checking for free (a non-component value is rejected at the `defineInputs` call site).
- **Scope boundary (CRITICAL)**: Per item contract clause (c) and PRD T2.2 step 3 ("Optional, nice-to-have … Do not change the default `type?: string`"), this subtask ships ONLY the identity helper + its export + tests. It does NOT add a `FieldTyped<TInputType>` variant, does NOT wire `InputType` into `FieldConfig.type`/`FieldProps.type`, and does NOT change the default `type?: string`. Those are explicitly deferred follow-ups.
- **Parallel-safe with P1.M1.T1.S2**: S2 edits `Field.tsx` only (generic FieldProps). This subtask edits `overlays.ts` (add the function) and `index.ts` (add the value export). **ZERO file overlap.** The two changes are independent. (S1 is already merged/implemented — it narrowed `ReactFormFieldsConfig<V>` keys in `overlays.ts`; this subtask ADDS to `overlays.ts` without touching S1's `ReactFormFieldsConfig` definition.)

## What

Add a pure identity `defineInputs` function constrained to `Record<string, ReactInputConfig>`, export it as a value, and test both its runtime identity guarantee and its type-level `keyof` derivation. Purely additive — no existing API touched.

### Success Criteria

- [ ] `defineInputs` exists in `packages/react/src/overlays.ts` with the exact signature `export function defineInputs<T extends Record<string, ReactInputConfig>>(inputs: T): T`.
- [ ] Its body is `return inputs;` (zero runtime effect).
- [ ] JSDoc on `defineInputs` includes the `InputType = keyof typeof inputs` example, the opt-in note, and the "default non-generic Field/FieldConfig.type unchanged" note.
- [ ] `defineInputs` is exported as a **VALUE** from `packages/react/src/index.ts` (use `export { defineInputs } from "./overlays";`, NOT `export type`).
- [ ] A vitest test asserts `expect(defineInputs(x)).toBe(x)` (referential identity).
- [ ] A type-level assertion proves `keyof typeof result` is the expected union and rejects a typo'd key.
- [ ] `pnpm --filter @formality-ui/react build` succeeds; `dist/` exports `defineInputs`.
- [ ] `pnpm typecheck` green; `pnpm test` green; `pnpm lint` clean.
- [ ] `Field`, `FieldConfig.type`, `FieldProps.type` UNCHANGED.
- [ ] `Field.tsx` UNCHANGED (S2's territory — parallel execution).

## All Needed Context

### Context Completeness Check

_Pass._ This is a tightly scoped, additive change to TWO files (`overlays.ts` add function; `index.ts` add one value-export line) plus ONE new test file. The exact `ReactInputConfig` shape, the export-section location, and the test-file inclusion rules are all verified below.

### Documentation & References

```yaml
# MUST READ
- url: PRD §C.4 T2.2 (heading:h4.61) — the work item being implemented.
  why: Gives the EXACT target signature, JSDoc, and the "pure identity; no runtime
        effect" + "keep existing non-generic Field/FieldConfig.type working unchanged"
        requirements.
  critical: "Step 3: '(Optional, nice-to-have) add a FieldTyped<TInputType> variant …
             Do not change the default type?: string.' → ship ONLY the identity helper."

- url: PRD §C.3 (heading:h3.112) — Non-Negotiable Constraints.
  why: "No breaking public API changes. Runtime behavior unchanged — type-only changes
        except T2.2 (identity fn) and T3.1."
  critical: "After every item: rebuild affected package(s), run the full test suite,
             and run tsc --noEmit on that package. Do not move on if anything is red."

- url: PRD §C.6 (heading:h3.115) — Per-Item Verification Checklist.
  why: Source edited (not dist); built affected package; tsc --noEmit green; full test
        suite green; JSDoc added where consumer-facing.

- url: PRD Appendix A (heading:h2.21) — `defineInputs` target shape.
  why: Authoritative: `function defineInputs<T extends Record<string, ReactInputConfig>>
        (inputs: T): T;`

- url: PRD §3.2.1 (heading:h4.12) — React Overlay Types reference.
  why: Confirms `ReactInputConfig<TValue = unknown>` is the constraint target and is
        already exported (T1.1 DONE).

- file: packages/react/src/overlays.ts
  section: "ReactInputConfig (top of file); end of file (append defineInputs here)."
  why: THE file to edit (add the function). ReactInputConfig is already imported/defined
        locally — `defineInputs` can reference it directly with no new import.
  pattern: Existing JSDoc style is verbose with @example blocks (see ReactInputConfig,
            ReactFormFieldsConfig). Match that style.
  gotcha: "defineInputs is a VALUE (function), not a type. All other exports in this
           file are interfaces/types. This is the first runtime export in overlays.ts —
           that's fine (the file already imports `ComponentType` as a type-only import;
           defineInputs adds no new imports)."

- file: packages/react/src/index.ts
  section: "Last section: 'React Type Overlays' — `export type { ReactInputConfig, ... } from './overlays';`"
  why: Add the value export HERE. Must use `export { defineInputs }` (NOT `export type`),
        because defineInputs is a function.
  pattern: The file uses separate `export { X } from "./y"` (values) vs `export type { X } from "./y"` (types).
  gotcha: "Adding `defineInputs` to the EXISTING `export type { ... } from './overlays'` block
           would be WRONG (it's a value). Add a NEW line: `export { defineInputs } from './overlays';`
           immediately after the type-export block."

- file: plan/002_78ea74508dd8/architecture/type_system_state.md
  section: "§1 (overlays.ts) + §4 (index.ts overlays section) + §8 (gaps table)."
  why: Confirms `defineInputs` does NOT exist anywhere in packages/ (grep-verified);
        confirms index.ts "React Type Overlays" section is the export slot.
  critical: "§8 row: 'index.ts overlays section — no defineInputs … export both [R3, R4].'"

# PARALLEL-EXECUTION CONTEXT (S2 is being implemented concurrently)
- file: plan/002_78ea74508dd8/P1M1T1S2/PRP.md
  section: "Goal + Implementation Tasks (Field.tsx only)"
  why: S2 makes FieldProps generic in `packages/react/src/components/Field.tsx`. This
        subtask (S1 of T2) touches ONLY `overlays.ts` + `index.ts`. ZERO file overlap.
        Do NOT touch Field.tsx. The two changes are independent and composable.

- file: plan/002_78ea74508dd8/P1M1T1S1/PRP.md
  section: "Goal (ReactFormFieldsConfig<V> key-narrowing in overlays.ts)"
  why: S1 already modified overlays.ts (narrowed ReactFormFieldsConfig keys to
        Extract<keyof V, string>). This subtask APPENDS a new function to overlays.ts
        WITHOUT touching S1's ReactFormFieldsConfig definition. Verify S1's change is
        present (it should be — S1 is "Implementing") so you don't accidentally revert it.
```

### Current Codebase tree (relevant slice)

```bash
packages/
  react/src/
    overlays.ts           # ← EDIT HERE: append `defineInputs` function (after ReactFormFieldsConfig)
    index.ts              # ← EDIT HERE: add `export { defineInputs } from "./overlays";`
    components/
      Field.tsx           # ← S2's territory; DO NOT TOUCH
    __tests__/            # ← candidate location for the runtime test
      Field.test.tsx
      FormalityProvider.test.tsx
      ...
    typeAssertions/       # ← (optional) candidate for the type-level assertion file
                           #    MUST be in src/, NOT __tests__/, if used (see gotcha)
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/
  overlays.ts                                     # MODIFIED — append defineInputs (identity fn + JSDoc)
  index.ts                                        # MODIFIED — add value export line
  __tests__/
    defineInputs.test.ts                          # NEW (or .tsx) — runtime identity test + type assertions
#  typeAssertions/
#    defineInputs.types.ts                        # ALTERNATIVE — pure type-level assertions in src/
```

> **Test-file placement choice:** Two valid options —
> **(A)** Put the runtime identity test in `packages/react/src/__tests__/defineInputs.test.ts` (vitest picks it up via the root vitest config), AND put the type-level `@ts-expect-error` assertions in a SEPARATE `packages/react/src/typeAssertions/defineInputs.types.ts` file (because `tsconfig.json` EXCLUDES `__tests__/` from `tsc --build` — type assertions there are never checked). This mirrors the pattern established by P1.M1.T1.S2.
> **(B)** Put BOTH in `__tests__/defineInputs.test.ts` and accept that the `@ts-expect-error` lines are only checked by vitest's typecheck (if configured), not `tsc --build`. **Prefer (A)** for a rigorous type-level guarantee, since vitest does not fail the build on unused `@ts-expect-error` directives.
>
> **Recommended:** Option (A). Runtime test in `__tests__/`; type-level proof in `src/typeAssertions/`.

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (value vs type export): defineInputs is a FUNCTION. In index.ts you
// MUST write `export { defineInputs } from "./overlays";` (a VALUE export).
// Adding it to the existing `export type { ReactInputConfig, ... } from "./overlays"`
// block is a BUG — `export type` strips runtime and consumers would get
// "defineInputs is a type only and cannot be imported as a value" errors.

// CRITICAL (test-file inclusion in tsc): packages/react/tsconfig.json excludes:
//   "src/**/*.test.ts", "src/**/*.test.tsx", "src/**/__tests__/**"
// So @ts-expect-error directives placed in __tests__/ are NEVER verified by
// `tsc --build` — an "unused @ts-expect-error" (meaning the typo WASN'T rejected)
// would silently pass. To get a rigorous build-time guarantee that the type-level
// rejection works, put the @ts-expect-error assertions in a plain .ts file under
// src/ (e.g. src/typeAssertions/defineInputs.types.ts) that tsc --build includes.

// CRITICAL (don't touch Field/FieldConfig.type): The default `FieldProps.type?: string`
// and `FieldConfig.type?: string` MUST stay `string`. defineInputs is OPT-IN. Do NOT
// wire InputType into those types (PRD T2.2 step 3 explicitly defers it). Do NOT add
// a FieldTyped<TInputType> variant in this subtask.

// GOTCHA (parallel execution): Do NOT edit Field.tsx — that's P1.M1.T1.S2's file
// (it's making FieldProps generic concurrently). Your edits are overlays.ts + index.ts
// + new test files only.

// GOTCHA (identity fn must be trivially inlineable): Keep the body as `return inputs;`
// — do NOT add any wrapping, validation, Object.freeze, or side effect. The PRD's
// claim that "bundle size unchanged" depends on tsup being able to inline a one-line
// identity. Any added logic defeats the tree-shaking justification.

// GOTCHA (S1's prior change): overlays.ts was already modified by P1.M1.T1.S1
// (ReactFormFieldsConfig<V> key-narrowing to Extract<keyof V, string>). VERIFY that
// change is present before editing and PRESERVE it — append defineInputs at the END of
// the file; do not rewrite or reorder the existing overlays.

// GOTCHA (no new imports needed): overlays.ts already imports everything defineInputs
// needs — `ReactInputConfig` is defined in the same file. No new import statements.
// Keep it that way (adding an unused import triggers lint failure).
```

## Implementation Blueprint

### Data models and structure

No new data models. The only addition is one function. `defineInputs` is
generic over `T extends Record<string, ReactInputConfig>` and returns `T`
unchanged — this is what lets `keyof typeof inputs` resolve to the literal
key union (if it returned a widened type, the literal keys would be lost).

### Implementation Tasks (ordered by dependencies)

````yaml
Task 1: VERIFY current state (read-only sanity check)
  - READ packages/react/src/overlays.ts — confirm ReactInputConfig is present (T1.1 DONE)
    and confirm S1's ReactFormFieldsConfig key-narrowing (Extract<keyof V, string>) is present.
  - READ packages/react/src/index.ts — confirm the "React Type Overlays" section is last
    and currently exports only `export type { ReactInputConfig, ReactFieldConfig, ReactFormFieldsConfig }`.
  - GREP: `rg -n "defineInputs" packages/` → expect ZERO hits (confirm it doesn't exist yet).
  - WHY: Confirm the blast radius and that you're appending, not clobbering prior work.

Task 2: MODIFY packages/react/src/overlays.ts — append defineInputs
  - APPEND at END of file (after the ReactFormFieldsConfig block):
      /**
       * Identity helper that lets consumers derive a union of their input-type keys.
       * Opt-in: wrap your provider inputs to get `keyof` checking on Field `type`
       * and `FieldConfig.type`.
       *
       * This is a PURE IDENTITY function — it returns `inputs` unchanged with zero
       * runtime effect, so bundlers (tsup/esbuild/rollup) tree-shake it to nothing.
       * It exists purely so consumers can write `type InputType = keyof typeof inputs`.
       *
       * The existing non-generic `Field` and `FieldConfig.type` / `FieldProps.type`
       * (which default to `type?: string`) are UNCHANGED — this helper is purely
       * additive and opt-in. End-to-end wiring of `InputType` into those types is a
       * follow-up (PRD §C.4 T2.2 step 3).
       *
       * @example
       * ```tsx
       * import { defineInputs } from "@formality-ui/react";
       *
       * const inputs = defineInputs({
       *   textField: { component: TextField, defaultValue: "" },
       *   switch:     { component: Switch,   defaultValue: false },
       * });
       * export type InputType = keyof typeof inputs;   // "textField" | "switch"
       * ```
       */
      export function defineInputs<T extends Record<string, ReactInputConfig>>(
        inputs: T,
      ): T {
        return inputs;
      }
  - PRESERVE: all existing exports (ReactInputConfig, ReactFieldConfig, ReactFormFieldsConfig).
  - PRESERVE: S1's ReactFormFieldsConfig key-narrowing.
  - NO new imports (ReactInputConfig is local).
  - DEPENDENCIES: Task 1 verified.

Task 3: MODIFY packages/react/src/index.ts — add the value export
  - ADD immediately AFTER the existing `export type { ... } from "./overlays";` block
    (the last section of the file):
      // `defineInputs` is a VALUE export (identity function), not a type.
      export { defineInputs } from "./overlays";
  - DO NOT add it to the existing `export type { ReactInputConfig, ... }` line.
  - PRESERVE: the existing `export type { ReactInputConfig, ReactFieldConfig, ReactFormFieldsConfig } from "./overlays";`.
  - DEPENDENCIES: Task 2 (the symbol must exist in overlays.ts).

Task 4: CREATE the runtime test — packages/react/src/__tests__/defineInputs.test.ts
  - IMPLEMENT:
      import { describe, it, expect } from "vitest";
      import { defineInputs } from "../overlays";
      import type { ComponentType } from "react";

      // A minimal stand-in component so the ReactInputConfig constraint is satisfied.
      const Stub: ComponentType<any> = () => null;

      describe("defineInputs", () => {
        it("returns its input referentially unchanged (identity)", () => {
          const inputs = {
            textField: { component: Stub, defaultValue: "" },
            switch: { component: Stub, defaultValue: false },
          };
          // SAME reference, not a clone.
          expect(defineInputs(inputs)).toBe(inputs);
        });

        it("preserves all keys and values", () => {
          const inputs = {
            textField: { component: Stub, defaultValue: "" },
            switch: { component: Stub, defaultValue: false },
          };
          const result = defineInputs(inputs);
          expect(Object.keys(result).sort()).toEqual(["switch", "textField"]);
          expect(result.textField).toBe(inputs.textField);
          expect(result.switch).toBe(inputs.switch);
        });

        it("handles an empty record", () => {
          const empty = defineInputs({});
          expect(empty).toEqual({});
        });
      });
  - FOLLOW pattern: existing __tests__/*.test.ts(x) files use `describe/it/expect` from vitest.
  - MOCK: none (pure identity — no dependencies to mock).
  - COVERAGE: referential identity + key/value preservation + empty case.
  - PLACEMENT: __tests__/ (vitest runs it; runtime-only assertions here).

Task 5: CREATE the type-level assertion — packages/react/src/typeAssertions/defineInputs.types.ts
  - CREATE a plain .ts file in src/ (NOT __tests__/) so tsc --build checks it.
  - IMPLEMENT:
      import { defineInputs } from "../overlays";
      import type { ComponentType } from "react";

      const Stub: ComponentType<any> = () => null;

      // deriveInputs has the expected literal-union keys.
      const inputs = defineInputs({
        textField: { component: Stub, defaultValue: "" },
        switch: { component: Stub, defaultValue: false },
      });

      // POSITIVE: keyof typeof inputs is exactly "textField" | "switch".
      type InputType = keyof typeof inputs;
      const _ok1: InputType = "textField";
      const _ok2: InputType = "switch";

      // NEGATIVE: a typo'd key is rejected by the type system.
      // @ts-expect-error "texField" is not a valid input key
      const _bad: InputType = "texField";

      // The returned object's keys are the literal union (not widened to string).
      type Keys = keyof typeof inputs;
      const _assertKeys: Keys = "switch";
      // @ts-expect-error "radio" was never registered
      const _badKey: Keys = "radio";

      // Constraint: a non-component `component` is rejected (T1.1 checking flows in).
      // @ts-expect-error component must be a ComponentType, not a string
      defineInputs({ bad: { component: "not-a-component", defaultValue: "" } });
  - DO NOT use vitest here — this file is pure type-level; it must have NO runtime
    side effects (and must not be a *.test.* file or it gets excluded from tsc).
  - CRITICAL: place in src/typeAssertions/, NOT __tests__/ (see gotcha).
  - COVERAGE: positive (key union correct) + negative (typo rejected × 2 + non-component rejected).

Task 6: BUILD + TYPECHECK + TEST
  - RUN: `pnpm --filter @formality-ui/react build` (tsup).
  - RUN: `pnpm typecheck` (root tsc --build — MUST include defineInputs.types.ts).
  - RUN: `pnpm --filter @formality-ui/react test` (vitest — the new defineInputs.test.ts).
  - RUN: `pnpm test` (full root suite — regression check).
  - EXPECT: all green. If the defineInputs.types.ts @ts-expect-error directives are
    reported "unused", the file isn't being checked (wrong location) OR the rejection
    isn't happening (bug) — both are FAILURES.

Task 7: LINT + FORMAT
  - RUN: `pnpm format` (prettier) and `pnpm lint` (eslint).
  - EXPECT: clean.
````

### Implementation Patterns & Key Details

```typescript
// packages/react/src/overlays.ts — THE addition (Task 2), appended at end of file.

// WHY a generic identity function works for keyof derivation:
//   The generic <T extends Record<string, ReactInputConfig>> captures the LITERAL
//   shape of the object passed in. Because the return type is `T` (not a widened
//   Record<string, ...>), `keyof typeof inputs` resolves to the literal key union.
//   If we returned `Record<string, ReactInputConfig>`, the keys would widen to
//   `string | number` and the whole feature would be useless.

export function defineInputs<T extends Record<string, ReactInputConfig>>(
  inputs: T,
): T {
  return inputs;
}

// packages/react/src/index.ts — THE export (Task 3), added after the type-export block.

// BEFORE (last section):
//   export type {
//     ReactInputConfig,
//     ReactFieldConfig,
//     ReactFormFieldsConfig,
//   } from "./overlays";

// AFTER — append a VALUE export (defineInputs is a function):
//   export type {
//     ReactInputConfig,
//     ReactFieldConfig,
//     ReactFormFieldsConfig,
//   } from "./overlays";
//
//   // `defineInputs` is a VALUE export (identity function), not a type.
//   export { defineInputs } from "./overlays";

// WHY this is tree-shakeable:
//   The function body is `return inputs;` — tsup/esbuild inline it at every call
//   site, after which the call disappears entirely. No runtime cost in production.
//   Verify by inspecting dist/ if desired: defineInputs should appear in the ESM
//   build but be inlined wherever used.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
PUBLIC API:
  - `defineInputs` — NEW value export from @formality-ui/react. Consumers import it
    as a value: `import { defineInputs } from "@formality-ui/react";`.
  - No existing export changed. ReactInputConfig / ReactFieldConfig /
    ReactFormFieldsConfig remain type-only exports.
INTERNAL:
  - overlays.ts gains one function (appended). No internal call sites consume it
    yet (T3.1 / T2.1 follow-ups MAY use it internally; not this subtask).
  - index.ts gains one export line.
PARALLEL-SAFE:
  - S2 edits Field.tsx; this subtask edits overlays.ts + index.ts. No file overlap.
  - S1 already edited overlays.ts (ReactFormFieldsConfig keys). This subtask APPENDS
    to overlays.ts without touching S1's definition. Verify S1's change is preserved.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing overlays.ts (Task 2) and index.ts (Task 3)
pnpm --filter @formality-ui/react exec tsc --noEmit
pnpm format            # prettier — only formats if needed
pnpm lint              # eslint — expect clean

# Expected: Zero errors.
```

### Level 2: Unit Tests (Component Validation)

```bash
# The new runtime identity test
pnpm --filter @formality-ui/react test defineInputs

# Full react suite (regression check)
pnpm --filter @formality-ui/react test

# Full root suite (cross-package regression check)
pnpm test

# Expected: all green. defineInputs is a pure identity fn — it cannot break
# runtime behavior of any existing test.
```

### Level 3: Build & Typecheck (System Validation)

```bash
# Build react (tsup emits dist/) — dist/ MUST contain defineInputs as a value export.
pnpm --filter @formality-ui/react build

# Inspect the emitted dist to confirm the export landed (optional confidence check):
node -e "console.log(Object.keys(require('./packages/react/dist/index.js')))" \
  | tr ',' '\n' | grep -i defineInputs   # should print defineInputs

# Root typecheck — project references (core + react). MUST include the new
# packages/react/src/typeAssertions/defineInputs.types.ts file.
pnpm typecheck    # = tsc --build

# Expected: green. If defineInputs.types.ts's @ts-expect-error directives are
# reported "unused", the file isn't being type-checked (wrong location) OR the
# rejection isn't happening (bug in the generic) — both are FAILURES.
```

### Level 4: Type-Level Validation (the actual proof of this feature)

```bash
# Confirm the assertion file is included in the build's typecheck:
pnpm typecheck

# Manual confidence check (optional): temporarily change a @ts-expect-error line's
# expected value to a VALID key (e.g. "texField" → "textField") and re-run
# `pnpm typecheck`. tsc should then report "Unused '@ts-expect-error' directive"
# — proving the directive is honored (typos really are rejected). Revert after.

# Expected:
#   - Positive cases (key union derivation): compile cleanly.
#   - @ts-expect-error lines: all USED (typos + non-component rejected).
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm --filter @formality-ui/react build` succeeds and `dist/` exports `defineInputs`.
- [ ] `pnpm typecheck` (root `tsc --build`) is green — AND includes
      `packages/react/src/typeAssertions/defineInputs.types.ts`.
- [ ] `pnpm --filter @formality-ui/react test` is green (new defineInputs.test.ts passes).
- [ ] `pnpm test` (root vitest) is green — no regressions.
- [ ] `pnpm lint` is clean.
- [ ] Every `@ts-expect-error` in defineInputs.types.ts is USED (rejections really happen).

### Feature Validation

- [ ] `defineInputs` exists with signature `<T extends Record<string, ReactInputConfig>>(inputs: T): T`.
- [ ] `defineInputs(x) === x` (referential identity) — proven by the runtime test.
- [ ] `keyof typeof defineInputs({a:..., b:...})` is exactly `"a" | "b"` — proven by the type assertion.
- [ ] A typo'd key (`"texField"`) is a compile error — proven by `@ts-expect-error`.
- [ ] A non-component `component` value is rejected (T1.1 checking flows through the constraint) — proven by `@ts-expect-error`.
- [ ] `defineInputs` is exported as a **VALUE** (not `export type`) from index.ts.
- [ ] `Field`, `FieldConfig.type`, `FieldProps.type` are UNCHANGED (default `string` preserved).
- [ ] `Field.tsx` was NOT modified (S2's parallel territory).

### Code Quality Validation

- [ ] JSDoc on `defineInputs` includes the InputType example, opt-in note, "default unchanged" note (Mode A).
- [ ] Function body is exactly `return inputs;` (trivially inlineable; no side effects).
- [ ] No new imports added to overlays.ts (ReactInputConfig is local).
- [ ] S1's `ReactFormFieldsConfig<V>` key-narrowing preserved (not reverted).
- [ ] Change is strictly additive (one new function + one export line).

### Documentation & Deployment

- [ ] JSDoc self-documents the opt-in usage and the InputType derivation pattern.
- [ ] No new environment variables or config.

---

## Anti-Patterns to Avoid

- ❌ Don't add `defineInputs` to the existing `export type { ... } from "./overlays"` block in index.ts — it's a VALUE, use a separate `export { defineInputs } from "./overlays";` line.
- ❌ Don't put the `@ts-expect-error` type assertions in `__tests__/` or a `*.test.*` file — `tsconfig.json` excludes those and the assertions would never be checked by `tsc --build`.
- ❌ Don't change `Field`, `FieldConfig.type`, or `FieldProps.type` defaults — defineInputs is OPT-IN (PRD T2.2 step 3).
- ❌ Don't add a `FieldTyped<TInputType>` variant or wire `InputType` into Field — explicitly deferred follow-up.
- ❌ Don't edit `Field.tsx` — that's P1.M1.T1.S2's file (parallel execution).
- ❌ Don't add validation, `Object.freeze`, or any side effect to `defineInputs` — it must remain a one-line identity fn so tsup can inline/tree-shake it (PRD bundle-size justification).
- ❌ Don't revert or reorder S1's `ReactFormFieldsConfig<V>` key-narrowing in overlays.ts — APPEND only.
- ❌ Don't skip the runtime identity test — `expect(x).toBe(x)` is the core guarantee (referential, not a clone).
- ❌ Don't widen the return type (e.g. `Record<string, ReactInputConfig>`) — that would destroy the literal-key union that makes `keyof typeof` useful.

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is the lowest-risk item in the type-safety delta. It is a
purely additive, one-line identity function with a mathematically guaranteed
non-breaking profile (nothing existing references `defineInputs`; it touches
no runtime code path). The only subtleties are mechanical: (1) it must be a
VALUE export (not `export type`) in index.ts, (2) the type-level assertions
must live in `src/` (not `__tests__/`) to be checked by `tsc --build`, and
(3) S1's prior `overlays.ts` change must be preserved (append, don't
rewrite). All three are called out explicitly in the gotchas. The function
constrained to `Record<string, ReactInputConfig>` automatically inherits
T1.1's component-type checking, which is a nice bonus the type assertion
verifies. Parallel-safety with S2 is guaranteed (no file overlap).
