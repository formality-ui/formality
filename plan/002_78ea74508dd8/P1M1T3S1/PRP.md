name: "P1.M1.T3.S1 — Define, export, and internally reuse FormalityFieldComponentProps<P>"
description: |

---

## Goal

**Feature Goal**: Implement PRD Appendix C **T3.1** (REACT) — define and
export `FormalityFieldComponentProps<P = unknown>` from `@formality-ui/react`
using the **real** runtime types for the three props Formality injects onto
every field component (`state`, `formState`, `forwardRef`), reuse it
internally to type the component cast in `Field.tsx` so the contract cannot
drift, and add JSDoc + tests. This deletes the downstream consumer's
hand-rolled `WithFormality<P>` / `FormalityInjectedProps` helper (sellario-ui
can drop it) and guarantees the three keys match the runtime contract.

**Deliverable**:

1. In `packages/react/src/overlays.ts` define and export
   `export type FormalityFieldComponentProps<P = unknown> = P & { state?: CustomFieldState | Record<string, CustomFieldState>; formState?: UseFormStateReturn<FieldValues>; forwardRef?: RefCallBack; }`
   (importing `CustomFieldState` from `./types` and `RefCallBack`,
   `UseFormStateReturn`, `FieldValues` from `react-hook-form`), with the
   PRD-mandated JSDoc (destructure-before-forward guidance; MUI v9
   `slotProps={{ input: { ref: forwardRef } }}` note; the `ref`-vs-`forwardRef`
   runtime caveat).
2. Reuse internally: change the component cast in `Field.tsx` from
   `inputConfig.component as React.ComponentType<any>` to
   `inputConfig.component as React.ComponentType<FormalityFieldComponentProps>`
   (locate by content — see Context; the cast at ~line 463, NOT the template
   cast below it). Import the type into `Field.tsx`. **NO behavior change**
   (still an `as` cast).
3. Export `FormalityFieldComponentProps` as a **TYPE** from
   `packages/react/src/index.ts` (overlays section).
4. (Recommended, clause d) Re-export `RefCallBack`, `UseFormStateReturn`,
   `FieldValues` from `react-hook-form` via `@formality-ui/react` so consumers
   don't need a direct RHF import.
5. Tests: a type-level assertion file in `packages/react/src/typeAssertions/`
   proving a representative consumer input component satisfies
   `ComponentType<FormalityFieldComponentProps<TextFieldProps>>` (and the
   destructure-before-forward pattern compiles), plus a lightweight vitest
   runtime smoke in `packages/react/src/__tests__/`.

**Success Definition**:

1. `pnpm --filter @formality-ui/react build` (tsup) succeeds and `dist/`'s type
   declarations export `FormalityFieldComponentProps`.
2. `pnpm typecheck` (root `tsc --build`) is green — including the new
   `src/typeAssertions/injectedProps.types.ts`.
3. `pnpm test` (vitest) is green — new smoke test passes, no regressions.
4. `pnpm lint` is clean.
5. **Runtime UNCHANGED**: `Field.tsx` still renders identically (the only
   Field.tsx edit is the cast's type argument + one type-only import; no logic,
   no new prop wiring). `state`/`formState` are NOT newly injected onto
   `coreProps` (that is an explicit future task, out of scope per R4).
6. **Non-breaking**: new export only; no existing API changed; generic default
   `P = unknown` preserves today's `ComponentType<any>`-equivalent looseness.

## User Persona

**Target User**: React consumers of `@formality-ui/react` (e.g. downstream
`sellario-ui`) who author custom field components and today are forced to
reverse-engineer and re-declare a `WithFormality<P>` helper for the three
injected props — and have hit bugs from inconsistent stripping.

**Use Case**:

```tsx
import type { FormalityFieldComponentProps } from "@formality-ui/react";
import type { ComponentType } from "react";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

// The component destructures the three Formality-injected props OUT before
// forwarding the rest to the underlying <input> (avoids leaking to the DOM).
const TextField: ComponentType<
  FormalityFieldComponentProps<TextFieldProps>
> = ({ state, formState, forwardRef, ...rest }) => (
  <>
    <input ref={forwardRef} {...rest} />
    {state?.invalid && <span>invalid</span>}
  </>
);
```

**Pain Points Addressed**: No shipped type today → every consumer re-declares a
lossy `WithFormality<P>` with `state?: unknown; formState?: unknown;
forwardRef?: Ref<HTMLInputElement>` (wrong types, no autocomplete, bugs from
inconsistent stripping). `FormalityFieldComponentProps` ships the accurate
contract once, internally reused so it cannot drift from runtime.

## Why

- **Business value**: Closes PRD §C.4 T3.1 (delta R4). Deletes the consumer's
  hand-maintained `WithFormality` and codifies the MUI-v9 `slotProps.input.ref`
  awkwardness the consumer hit (Checkbox now takes its ref via
  `slotProps.input.ref`, not a top-level `inputRef`). Low risk: new export only,
  no existing API changed, runtime unchanged.
- **Integration**: Builds on T1.1 (DONE — `ReactInputConfig` overlays
  `component: ComponentType<any>`) and T1.2 (DONE — `ReactFieldConfig` overlays
  `rules: RegisterOptions`). This is the third react overlay: the
  "injected-props" contract layered on top of the component type. Reusing it
  in `Field.tsx` means the cast type is constructed from the same source the
  consumer imports — drift is impossible by construction.
- **Scope boundary (CRITICAL)**: Per R4 constraint (Appendix C.3 / delta R4),
  this subtask is **type-only**. It does NOT wire `state`/`formState` into
  `coreProps` for bare components (the `provideState`/`passSubscriptions` knobs
  exist in core `FieldConfig` at `config.ts:148-154` but are **unconsumed** in
  `Field.tsx` — building that runtime injection is a separate FUTURE task).
  The type ships the INTENDED contract now. The only Field.tsx edit is the
  cast's type argument (still an `as` cast — zero behavior change).
- **Parallel-safe with P1.M1.T2.S1 (concurrent)**: Both touch `overlays.ts` +
  `index.ts`, but in **independent, additive regions** (see Integration
  Points). No semantic conflict; reconcile at merge.

## What

Add `FormalityFieldComponentProps<P>` to the react overlays, export it (+ the
three RHF types it depends on), thread it into the `Field.tsx` component cast,
and prove the contract with a type-level assertion + runtime smoke. Purely
type-only at runtime (no new prop wiring, no new runtime code).

### Success Criteria

- [ ] `FormalityFieldComponentProps<P = unknown>` exists in `packages/react/src/overlays.ts` with the exact three members and the JSDoc described below.
- [ ] The type is reused in `Field.tsx`: the component cast reads `as React.ComponentType<FormalityFieldComponentProps>` (the `any` is gone), and `FormalityFieldComponentProps` is imported into `Field.tsx`.
- [ ] The **template** cast in `Field.tsx` (`TemplateComponent`) is UNCHANGED.
- [ ] `FormalityFieldComponentProps` exported as a **TYPE** from `packages/react/src/index.ts`.
- [ ] `RefCallBack`, `UseFormStateReturn`, `FieldValues` re-exported (type-only) from `@formality-ui/react`.
- [ ] `pnpm --filter @formality-ui/react build` succeeds; `dist/` type decls export `FormalityFieldComponentProps`.
- [ ] `pnpm typecheck` green (includes `src/typeAssertions/injectedProps.types.ts`); `pnpm test` green; `pnpm lint` clean.
- [ ] Runtime unchanged (no new prop wiring in `coreProps`; no test regression).
- [ ] No new runtime code anywhere (type-only + one unchanged `as` cast).

## All Needed Context

### Context Completeness Check

_Pass._ Tightly scoped: ADD one type + 3 imports to `overlays.ts`; ADD the
type to the `index.ts` overlays export block + one RHF type re-export line;
CHANGE one `as` cast's type argument (+ one type-only import) in `Field.tsx`;
ADD two test files. All target locations, exact current text, import state,
and tsconfig test-exclusion behavior are verified below.

### Documentation & References

```yaml
# MUST READ
- url: PRD §C.4 T3.1 (heading:h4.62) — the work item being implemented.
  why: Gives the target type shape, the "reuse internally so it cannot drift"
        requirement (step 3), the destructure-before-forward JSDoc requirement
        (step 4), and the MUI-v9 slotProps note.
  critical: "Step 1: determine the EXACT runtime types — do NOT leave them
             `unknown` unless runtime truly passes unknown." The architecture
             doc already resolved all three (see docfile below).

- url: PRD §5.3.8 (heading:h4.36) — Template Rendering (runtime render path).
  why: Shows `React.createElement(inputConfig.component, finalProps)` and that
        `formState: methods.formState` reaches templates + render-prop children
        but NOT bare `<Component>` coreProps today.

- url: PRD §C.3 (heading:h3.112) — Non-Negotiable Constraints.
  why: "No breaking public API changes. Runtime behavior unchanged — type-only
        changes except T2.2 (identity fn) and T3.1 (internal reuse)." T3.1's
        only runtime-touching allowance is the internal cast reuse.
  critical: "After every item: rebuild affected package(s), run the full test
             suite, and run tsc --noEmit on that package."

- url: PRD §C.6 (heading:h3.115) — Per-Item Verification Checklist.
  why: Source edited (not dist); built react; tsc --noEmit green; full test
        suite green; JSDoc added where consumer-facing; "No new runtime code
        except where the item explicitly allows it (T2.2 identity fn; T3.1
        internal reuse)."

- url: PRD §C.7 (heading:h3.116) — Cross-validation against sellario-ui.
  why: The driving consumer. After this change they can DROP
        FormalityInjectedProps / WithFormality and import
        FormalalityFieldComponentProps. Their pain file is `src/forms/config.tsx`.

- url: PRD Appendix A (heading:h2.21) — FormalityFieldComponentProps target.
  why: Authoritative target (note: Appendix A still shows `unknown` placeholders;
        the architecture doc below is the SOURCE OF TRUTH for the real types).

- url: PRD §3.2.1 (heading:h4.12) — React Overlay Types reference.
  why: Confirms the overlay pattern (react package narrows core's loose types
        without a react dep in core). FormalityFieldComponentProps is the
        injected-props overlay.

- docfile: plan/002_78ea74508dd8/architecture/injected_props_types.md
  why: THE authoritative source for the three prop types. Resolved against
        react-hook-form@7.68.0 installed .d.ts + Field.tsx source.
  section: "TL;DR" + "§1 formState" + "§2 state" + "§3 forwardRef" + "§4 What
            R4 (T3.1) must do".
  critical: |
    - formState = `UseFormStateReturn<FieldValues>` (RHF controller.d.ts:24-31;
      Field.tsx Controller render arg; already used at types.ts InputTemplateProps.formState).
    - state = `CustomFieldState | Record<string, CustomFieldState>` — NOT
      injected at runtime today (provideState/passSubscriptions unconsumed in
      Field.tsx); type reflects INTENDED contract from examples/07:67-99.
    - forwardRef = RHF `RefCallBack` = `(instance: any) => void` — NOTE
      spelling `RefCallBack` (capital B), NOT React's `RefCallback`. Field.tsx
      spreads it as the React-special `ref` key; the type names it `forwardRef`
      per PRD/consumer intent. Runtime still delivers via `ref` key — wiring
      `coreProps.forwardRef = field.ref` is a FUTURE task (out of R4 scope).

- file: packages/react/src/overlays.ts
  section: "Top import block; end of file (append FormalityFieldComponentProps)."
  why: THE file to add the type in. Match the existing verbose-JSDoc style
        (ReactInputConfig / ReactFormFieldsConfig have @example blocks).
  pattern: All exports here are `interface`/`type` (type-only). FormalityFieldComponentProps
            is also type-only — consistent. Add the new RHF imports to the
            existing `import type { RegisterOptions, FieldValues } from "react-hook-form";`
            line and `CustomFieldState` to the `import type { InputTemplateProps } from "./types";` line.
  gotcha: "P1.M1.T2.S1 (concurrent) APPENDS a `defineInputs` identity fn at the
           end of this file. APPEND FormalityFieldComponentProps there too (or
           just above defineInputs). The two additions are in independent
           regions; git merges cleanly. Do NOT rewrite or reorder existing overlays."

- file: packages/react/src/index.ts
  section: "Last section: 'React Type Overlays' — `export type { ReactInputConfig, ReactFieldConfig, ReactFormFieldsConfig } from './overlays';`"
  why: Add `FormalityFieldComponentProps` to that type-export block. Add a NEW
        line `export type { RefCallBack, UseFormStateReturn, FieldValues } from "react-hook-form";`.
  pattern: The file already mixes `export type { X } from "./y"` (types) and
            `export { X } from "./y"` (values). FormalityFieldComponentProps is
            a TYPE — keep it in the `export type` block.
  gotcha: "P1.M1.T2.S1 (concurrent) adds `export { defineInputs } from './overlays';`
           (a VALUE line) right after the type block. Different line/keyword —
           mergeable. Do NOT put FormalityFieldComponentProps in a value export."

- file: packages/react/src/components/Field.tsx
  section: "Controller render callback (~line 463): `const Component = inputConfig.component as React.ComponentType<any>;`"
  why: THE cast to retarget. Locate by CONTENT (line shifted because P1.M1.T1.S2
        is now complete). Change the `any` to `FormalityFieldComponentProps`.
  pattern: Field.tsx already imports RHF types at top (`import { Controller, type ControllerFieldState, type UseFormStateReturn, type FieldValues } from "react-hook-form";`).
            Add `import type { FormalityFieldComponentProps } from "../overlays";` near the other local type imports.
  gotcha: "There is a SECOND cast a few lines below — `const TemplateComponent =
           template as | React.ComponentType<any> | undefined;` — that is TEMPLATE
           territory (InputTemplateProps), OUT OF SCOPE. Do NOT touch it. Only
           change the FIRST cast (the one on `inputConfig.component`)."

- file: packages/react/src/types.ts
  section: "CustomFieldState interface (lines 30-58)."
  why: Confirms `CustomFieldState` is ALREADY defined AND exported (index.ts
        re-exports it from ./types). FormalityFieldComponentProps imports it
        from ./types in overlays.ts.
  gotcha: "CustomFieldState is already exported from the package — no need to
           re-export it again. Only FormalityFieldComponentProps is new."

- file: packages/react/tsconfig.json
  section: "`exclude: [src/**/*.test.ts, src/**/*.test.tsx, src/**/__tests__/**]`"
  why: Confirms `@ts-expect-error` directives placed in __tests__/ are NEVER
        checked by `pnpm typecheck` (`tsc --build`). Type-level proof MUST live
        in a plain .ts file under src/ (e.g. src/typeAssertions/).
  gotcha: "src/typeAssertions/ does NOT exist yet. Create it. A .ts file there
           is included by `include: [src/**/*]` and checked by tsc --build."

# PARALLEL-EXECUTION CONTEXT (P1.M1.T2.S1 is being implemented concurrently)
- file: plan/002_78ea74508dd8/P1M1T2S1/PRP.md
  section: "Implementation Tasks (overlays.ts append defineInputs; index.ts value export)."
  why: T2.S1 edits the SAME two files (overlays.ts, index.ts) as this subtask.
        DIFFERENT regions: T2.S1 appends a `defineInputs` function (value) at
        end of overlays.ts and adds `export { defineInputs } from "./overlays";`
        to index.ts. This subtask adds a TYPE + imports (top of overlays.ts)
        and a TYPE export to index.ts. No semantic conflict. Reconcile at merge:
        both additions are additive; if both append to overlays.ts, the order
        does not matter. Do NOT revert T2.S1's defineInputs when editing
        overlays.ts / index.ts.
- file: plan/002_78ea74508dd8/architecture/type_system_state.md
  section: "§1 (overlays.ts) + §4 (index.ts overlays section) + §8 (gaps table)."
  why: Confirms FormalityFieldComponentProps does NOT exist anywhere (grep
        zero); confirms index.ts "React Type Overlays" section is the export slot.
```

### Current Codebase tree (relevant slice)

```bash
packages/
  react/src/
    overlays.ts           # ← EDIT: add 3 imports (top) + FormalityFieldComponentProps type (append)
    index.ts              # ← EDIT: add type to overlays export block + RHF type re-export line
    types.ts              # (read-only ref) CustomFieldState already defined+exported here
    components/
      Field.tsx           # ← EDIT: retarget the Component cast (~line 463) + add type-only import
    __tests__/            # ← NEW: FormalityFieldComponentProps.test.tsx (runtime smoke)
    typeAssertions/       # ← NEW dir: injectedProps.types.ts (build-time type proof)
                           #    (must be in src/, NOT __tests__/, per tsconfig exclude)
    context/ConfigContext.ts   # (ref) defaultSubscriptionPropName = 'state'
  core/src/types/config.ts     # (ref) provideState/passSubscriptions knobs (lines 148-154) — unconsumed in Field.tsx
examples/
  07-advanced-features.tsx     # (ref) lines 67-99 — the INTENDED state contract (single vs Record)
node_modules/react-hook-form/  # (ref) RefCallBack in types/controller.d.ts + types/form.d.ts
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/
  overlays.ts                                    # MODIFIED — +3 imports, +FormalityFieldComponentProps type (append)
  index.ts                                       # MODIFIED — +type export, +RHF type re-export
  components/Field.tsx                           # MODIFIED — retarget Component cast + type-only import
  __tests__/
    FormalityFieldComponentProps.test.tsx        # NEW — runtime smoke (renders a representative component)
  typeAssertions/
    injectedProps.types.ts                       # NEW — build-time type proof (assignability + destructure pattern)
```

> **Test-file placement:** Runtime smoke in `__tests__/` (vitest runs it).
> Type-level proof in `src/typeAssertions/injectedProps.types.ts` (tsc --build
> checks it; `__tests__/` is excluded from the build typecheck). This mirrors
> the convention prescribed by the sibling P1.M1.T2.S1 PRP. NEVER put
> `@ts-expect-error` assertions in `__tests__/` — they'd be silently unchecked.

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (spelling): react-hook-form exports `RefCallBack` (capital B), NOT
// React's `RefCallback`. Importing the wrong name is a compile error. Verified
// in node_modules/react-hook-form/types/controller.d.ts + form.d.ts.
//   import type { RefCallBack } from "react-hook-form";  // ✓ RHF spelling

// CRITICAL (locate cast by content, not line): The architecture doc cites the
// cast at Field.tsx:426, but P1.M1.T1.S2 (now COMPLETE) shifted it to ~line 463.
// Find it by TEXT: `const Component = inputConfig.component as React.ComponentType<any>;`
// Do NOT touch the SECOND cast below it:
//   `const TemplateComponent = template as | React.ComponentType<any> | undefined;`
// (that is InputTemplateProps / template territory — out of scope).

// CRITICAL (test-file inclusion in tsc): packages/react/tsconfig.json excludes
//   "src/**/*.test.ts", "src/**/*.test.tsx", "src/**/__tests__/**"
// So @ts-expect-error directives in __tests__/ are NEVER verified by
// `pnpm typecheck`. Put type-level proof in src/typeAssertions/injectedProps.types.ts.

// CRITICAL (runtime UNCHANGED): Do NOT add `state` or `formState` keys to
// `coreProps` in Field.tsx. Do NOT add `coreProps.forwardRef = field.ref`.
// The ONLY Field.tsx edit is the cast's type argument + one type-only import.
// Wiring the runtime injection is a FUTURE task (R4 explicitly excludes it).

// CRITICAL (type-only, no value export): FormalityFieldComponentProps is a TYPE.
// In index.ts keep it in the `export type { ... } from "./overlays"` block.
// Re-exporting the RHF types is also `export type { ... } from "react-hook-form"`
// (type-only — adds NO runtime, NO new dependency; RHF is already a peer dep).

// GOTCHA (parallel execution): P1.M1.T2.S1 (concurrent) also edits overlays.ts
// (appends `defineInputs` fn) and index.ts (adds `export { defineInputs }`).
// Independent regions — additive on both sides. Verify T2.S1's defineInputs is
// preserved when you edit; do NOT revert it. Order of the two appended items in
// overlays.ts does not matter.

// GOTCHA (assignability of the new cast): `React.ComponentType<FormalityFieldComponentProps>`
// (default P = unknown) resolves to `ComponentType<{ state?, formState?, forwardRef? }>`
// (unknown & T = T; all members optional). Spreading `finalProps` onto it still
// compiles because a props type with only-optional members accepts any object.
// → Zero behavior change; the `as` cast just gets a precise type argument.

// GOTCHA (CustomFieldState already exported): types.ts already defines AND
// index.ts already re-exports CustomFieldState. Do NOT re-export it again.
// Only FormalityFieldComponentProps (+ the 3 RHF types) are new exports.

// GOTCHA (no new runtime imports in Field.tsx): Add FormalityFieldComponentProps
// as a TYPE-ONLY import (`import type { ... } from "../overlays";`). Do not add
// a value import — overlays.ts has no runtime exports relevant to Field except
// (concurrently) defineInputs, which Field does not use.
```

## Implementation Blueprint

### Data models and structure

One new generic type. The default `P = unknown` is what keeps the change
non-breaking: `FormalityFieldComponentProps<unknown>` = `unknown & {state?,
formState?, forwardRef?}` = `{state?, formState?, forwardRef?}` — a props type
with only-optional members, which any existing component (previously cast to
`ComponentType<any>`) still satisfies. Consumers narrow `P` to their own
component props for full typing.

````typescript
// packages/react/src/overlays.ts (append)

import type { ComponentType } from "react";
import type {
  RegisterOptions,
  FieldValues,
  RefCallBack, // ← ADD (RHF spelling, capital B)
  UseFormStateReturn, // ← ADD
} from "react-hook-form";
import type { InputConfig, FieldConfig } from "@formality-ui/core";
import type {
  InputTemplateProps,
  CustomFieldState, // ← ADD
} from "./types";

// …existing ReactInputConfig / ReactFieldConfig / ReactFormFieldsConfig…

/**
 * Props Formality injects onto every field component.
 *
 * `<Field>` renders your input component via React Hook Form's `<Controller>`.
 * At runtime Formality merges a `coreProps` bundle onto the component (name,
 * value, onChange, onBlur, and — as a React-special key — `ref`). The three
 * members below are the **intended injected-props contract**: `formState`
 * today reaches templates and render-prop children; `state` (subscribed field
 * state) and a top-level `forwardRef` key are part of the contract this type
 * codifies ahead of the runtime wiring (see "Runtime caveat" below).
 *
 * **Destructure before forwarding.** Component authors MUST destructure
 * `state`, `formState`, and `forwardRef` OUT of props before spreading the
 * rest onto the underlying DOM `<input>` — otherwise these non-DOM props leak
 * to the DOM and React warns. Recommended pattern:
 *
 * ```tsx
 * const TextField: ComponentType<FormalityFieldComponentProps<TextFieldProps>> =
 *   ({ state, formState, forwardRef, ...domProps }) => (
 *     <input ref={forwardRef} {...domProps} />
 *   );
 * ```
 *
 * **Wiring `forwardRef` to the inner input.** `forwardRef` is RHF's
 * `RefCallBack` (a function). For a plain `<input>` use `ref={forwardRef}`.
 * For MUI v9 components that no longer accept a top-level `inputRef`, wire it
 * via slots: `slotProps={{ input: { ref: forwardRef } }}` (PRD §5.3.8).
 *
 * **Runtime caveat (important).** Today `Field` delivers the RHF ref via the
 * React-special `ref` key (not a top-level `forwardRef` prop). To receive it
 * as `forwardRef` on a plain function component WITHOUT a `React.forwardRef`
 * wrap, either (a) wrap your component with `React.forwardRef`, or (b) target
 * React 19's ref-as-prop. Making Field deliver it as a top-level `forwardRef`
 * key for bare components is a FUTURE runtime task (out of scope for this
 * type-only change). The type ships the intended contract now so consumers
 * stop hand-rolling a lossy `WithFormality<P>`.
 *
 * @template P - the field component's own props (e.g. TextFieldProps). Defaults
 *   to `unknown` so existing `ComponentType<any>` casts remain valid.
 */
export type FormalityFieldComponentProps<P = unknown> = P & {
  /** Subscribed/own field state when `provideState`/`passSubscriptions` is on. */
  state?: CustomFieldState | Record<string, CustomFieldState>;

  /** React Hook Form form state threaded from `<Controller>`. */
  formState?: UseFormStateReturn<FieldValues>;

  /** RHF ref callback (`RefCallBack`); wire to the inner input (see JSDoc). */
  forwardRef?: RefCallBack;
};
````

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (read-only sanity check)
  - READ packages/react/src/overlays.ts — confirm ReactInputConfig/ReactFieldConfig/
    ReactFormFieldsConfig present; confirm current RHF import is only
    `RegisterOptions, FieldValues`; confirm `./types` import is only `InputTemplateProps`.
  - READ packages/react/src/index.ts — confirm the last section is the
    "React Type Overlays" `export type { ReactInputConfig, ... } from "./overlays"`.
  - READ packages/react/src/components/Field.tsx around the Controller render —
    locate `const Component = inputConfig.component as React.ComponentType<any>;`
    (content match; ~line 463). Confirm the SECOND cast (TemplateComponent) is below it.
  - GREP: `rg -n "FormalityFieldComponentProps" packages/` → expect ZERO hits.
  - GREP: `rg -n "RefCallBack" node_modules/react-hook-form/types/` → confirm export + spelling.
  - WHY: Confirm blast radius; ensure you APPEND, not clobber (T2.S1's defineInputs
    may already be present if it lands first — preserve it).

Task 2: MODIFY packages/react/src/overlays.ts — add imports + the type
  - EDIT the RHF import line: add `RefCallBack, UseFormStateReturn`:
      import type {
        RegisterOptions,
        FieldValues,
        RefCallBack,
        UseFormStateReturn,
      } from "react-hook-form";
  - EDIT the ./types import line: add `CustomFieldState`:
      import type { InputTemplateProps, CustomFieldState } from "./types";
  - APPEND at END of file (after ReactFormFieldsConfig, and after defineInputs
    if T2.S1 already added it) the `FormalityFieldComponentProps<P = unknown>`
    type with the full JSDoc shown in "Data models and structure" above.
  - PRESERVE: ReactInputConfig, ReactFieldConfig, ReactFormFieldsConfig, and
    (if present) T2.S1's defineInputs. Do NOT reorder existing overlays.
  - NO value/runtime code (type-only). No new runtime imports.
  - DEPENDENCIES: Task 1 verified.

Task 3: MODIFY packages/react/src/index.ts — add the exports
  - EDIT the existing overlays type-export block to include FormalityFieldComponentProps:
      export type {
        ReactInputConfig,
        ReactFieldConfig,
        ReactFormFieldsConfig,
        FormalityFieldComponentProps,
      } from "./overlays";
  - ADD (recommended, clause d) a type-only re-export of the RHF types so
    consumers don't need a direct react-hook-form import. Place it right after
    the overlays block:
      // Re-export the react-hook-form types FormalityFieldComponentProps depends
      // on, so consumers don't need a direct react-hook-form import.
      export type {
        RefCallBack,
        UseFormStateReturn,
        FieldValues,
      } from "react-hook-form";
  - DO NOT use a value `export { ... }` for any of these (all type-only).
  - PRESERVE T2.S1's `export { defineInputs } from "./overlays";` if present.
  - DEPENDENCIES: Task 2 (the symbol must exist in overlays.ts).

Task 4: MODIFY packages/react/src/components/Field.tsx — retarget the cast
  - ADD a type-only import near the other local type imports (e.g. after the
    `import type { FieldConfig, InputConfig } from "@formality-ui/core";` line):
      import type { FormalityFieldComponentProps } from "../overlays";
  - EDIT the Component cast (locate by CONTENT — the FIRST occurrence of
    `inputConfig.component as React.ComponentType<any>`):
      // BEFORE:
      const Component = inputConfig.component as React.ComponentType<any>;
      // AFTER:
      const Component =
        inputConfig.component as React.ComponentType<FormalityFieldComponentProps>;
  - DO NOT touch the `TemplateComponent` cast below it (template/InputTemplateProps
    territory — out of scope).
  - DO NOT add any new coreProps keys (state/formState/forwardRef) — runtime unchanged.
  - DEPENDENCIES: Task 2 (type exists) + Task 1 (located the cast).

Task 5: CREATE packages/react/src/typeAssertions/injectedProps.types.ts — build-time proof
  - CREATE the directory packages/react/src/typeAssertions/ (does not exist yet).
  - CREATE injectedProps.types.ts (plain .ts, NOT a *.test.* file) with:
      import type { ComponentType } from "react";
      import type {
        FormalityFieldComponentProps,
        RefCallBack,
        UseFormStateReturn,
        FieldValues,
      } from "../index"; // exercise the PUBLIC surface (re-exports)
      import type { CustomFieldState } from "../types";

      // --- A representative consumer input component ---
      interface TextFieldProps {
        label: string;
        value: string;
        onChange: (v: string) => void;
      }

      // POSITIVE: a component typed via FormalityFieldComponentProps<P> compiles,
      // including the destructure-before-forward pattern (strip the three
      // injected props before spreading the rest onto the DOM input).
      const TextField: ComponentType<FormalityFieldComponentProps<TextFieldProps>> =
        ({ state, formState, forwardRef, ...domProps }) => {
          // The three injected props are typed (not `unknown`):
          const _touched: boolean | undefined = state && "isTouched" in state ? state.isTouched : undefined;
          const _fs: UseFormStateReturn<FieldValues> | undefined = formState;
          const _ref: RefCallBack | undefined = forwardRef;
          void _touched; void _fs; void _ref;
          return null as unknown as JSX.Element;
        };

      // POSITIVE: default P = unknown — a component with no own props still works
      // (preserves today's ComponentType<any>-equivalent looseness).
      const Bare: ComponentType<FormalityFieldComponentProps> = () => null as unknown as JSX.Element;

      // POSITIVE: CustomFieldState single-shape (provideState) and Record-shape
      // (passSubscriptions) are both valid for `state`.
      const _single: CustomFieldState | Record<string, CustomFieldState> | undefined = undefined;

      // NEGATIVE: FormalityFieldComponentProps is exported (proven by importing it
      // above). A consumer's old lossy helper is replaceable 1:1 — no @ts-expect-error
      // needed because the assignability is the proof.

      // Export a symbol so the file is not tree-shaken from the typecheck graph:
      export type _AssertInjectedProps = typeof TextField & typeof Bare & typeof _single;
  - DO NOT use vitest here — pure type-level; no runtime side effects; must NOT
    be a *.test.* file (tsconfig would exclude it).
  - CRITICAL: place in src/typeAssertions/, NOT __tests__/.
  - DEPENDENCIES: Tasks 2 + 3 (type + public re-exports exist).

Task 6: CREATE packages/react/src/__tests__/FormalityFieldComponentProps.test.tsx — runtime smoke
  - IMPLEMENT a vitest test that defines a representative component using
    FormalityFieldComponentProps and renders it, proving (a) the type is usable
    at the component-definition site (vitest's esbuild transform type-checks
    the file) and (b) destructuring the three injected props out at runtime
    does not leak them to the DOM and does not crash:
      import { describe, it, expect } from "vitest";
      import { render, screen } from "@testing-library/react";
      import type { ComponentType } from "react";
      import type { FormalityFieldComponentProps } from "../overlays";

      interface SmokeProps {
        label: string;
        value: string;
        onChange: (v: string) => void;
      }

      // Representative consumer component: strips state/formState/forwardRef.
      const SmokeField: ComponentType<FormalityFieldComponentProps<SmokeProps>> =
        ({ state, formState, forwardRef, ...domProps }) => (
          <input
            aria-label={(domProps as { label?: string }).label ?? "field"}
            // forwardRef is a RefCallBack; wiring it here is fine.
            ref={forwardRef as React.Ref<HTMLInputElement> | undefined}
            value={(domProps as { value?: string }).value ?? ""}
            onChange={(e) => (domProps as { onChange?: (v: string) => void }).onChange?.(e.target.value)}
            data-touched={state && "isTouched" in state ? String(state.isTouched) : "n/a"}
          />
        );

      describe("FormalityFieldComponentProps", () => {
        it("renders a representative component typed by FormalityFieldComponentProps", () => {
          render(
            <SmokeField label="name" value="abc" onChange={() => {}} />
          );
          expect(screen.getByLabelText("name")).toHaveValue("abc");
        });
      });
  - MOCK: none (pure render smoke).
  - COVERAGE: type usable at definition site + runtime render + destructure works.
  - PLACEMENT: __tests__/ (vitest runs it; runtime-only assertions here).
  - DEPENDENCIES: Task 2.

Task 7: BUILD + TYPECHECK + TEST + LINT
  - RUN: `pnpm --filter @formality-ui/react build` (tsup) — dist/ type decls MUST export FormalityFieldComponentProps.
  - RUN: `pnpm typecheck` (root tsc --build — MUST include typeAssertions/injectedProps.types.ts).
  - RUN: `pnpm --filter @formality-ui/react test` (vitest — the new smoke test).
  - RUN: `pnpm test` (full root suite — regression check; Field tests must stay green).
  - RUN: `pnpm format` && `pnpm lint`.
  - EXPECT: all green. If injectedProps.types.ts fails to compile, the public
    re-export (Task 3) or the type (Task 2) is wrong — fix before proceeding.
```

### Implementation Patterns & Key Details

```typescript
// overlays.ts — the type (Task 2). The default P = unknown is the non-breaking
// guarantee: FormalityFieldComponentProps<unknown> = { state?, formState?, forwardRef? }
// (unknown & T = T), all-optional → any component satisfies it.

export type FormalityFieldComponentProps<P = unknown> = P & {
  state?: CustomFieldState | Record<string, CustomFieldState>;
  formState?: UseFormStateReturn<FieldValues>;
  forwardRef?: RefCallBack; // RHF spelling (capital B)
};

// Field.tsx — the cast retarget (Task 4). Locate by CONTENT (line shifted to ~463):
//   BEFORE: const Component = inputConfig.component as React.ComponentType<any>;
//   AFTER:
const Component =
  inputConfig.component as React.ComponentType<FormalityFieldComponentProps>;
// Why safe: still an `as` cast (no runtime change). The props type now has
// only-optional members → <Component {...finalProps} /> still compiles for any
// finalProps shape. The contract type and the runtime render now share ONE
// source of truth (this type), so they cannot drift.

// index.ts — exports (Task 3). Type-only (no runtime, no new dep; RHF is a peer dep):
export type {
  ReactInputConfig,
  ReactFieldConfig,
  ReactFormFieldsConfig,
  FormalityFieldComponentProps, // ← ADD
} from "./overlays";

export type {
  RefCallBack,
  UseFormStateReturn,
  FieldValues,
} from "react-hook-form"; // ← ADD (recommended; consumer convenience)
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
PUBLIC API:
  - `FormalityFieldComponentProps<P>` — NEW type export from @formality-ui/react.
    Replaces consumer hand-rolled `WithFormality<P>` / `FormalityInjectedProps`.
  - `RefCallBack`, `UseFormStateReturn`, `FieldValues` — NEW type re-exports
    from @formality-ui/react (recommended; consumers no longer need a direct
    react-hook-form import for these).
  - No existing export changed. ReactInputConfig / ReactFieldConfig /
    ReactFormFieldsConfig / CustomFieldState unchanged.
INTERNAL:
  - Field.tsx Component cast now uses FormalityFieldComponentProps (sync by
    construction). NO runtime change.
PARALLEL-SAFE (with P1.M1.T2.S1, concurrent):
  - Both edit overlays.ts + index.ts. Independent additive regions:
      T2.S1: overlays.ts APPEND defineInputs fn (value); index.ts ADD value export.
      T3.S1: overlays.ts ADD 3 imports (top) + type (append); index.ts ADD type
             to existing type block + RHF type re-export line.
  - No semantic conflict. Reconcile at merge; preserve T2.S1's defineInputs.
CONSUMER (sellario-ui) — out of scope to edit, but this unblocks:
  - Drop FormalityInjectedProps / WithFormality in src/forms/config.tsx.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing overlays.ts (Task 2), index.ts (Task 3), Field.tsx (Task 4)
pnpm --filter @formality-ui/react exec tsc --noEmit
pnpm format            # prettier
pnpm lint              # eslint — expect clean

# Expected: Zero errors. Watch for: wrong RHF spelling (RefCallback vs RefCallBack),
# value-vs-type export mixups in index.ts, accidental edit of the TemplateComponent cast.
```

### Level 2: Unit Tests (Component Validation)

```bash
# The new runtime smoke
pnpm --filter @formality-ui/react test FormalityFieldComponentProps

# Full react suite — Field tests MUST stay green (the cast change is type-only)
pnpm --filter @formality-ui/react test

# Full root suite (cross-package regression)
pnpm test

# Expected: all green. The Field.tsx change is a type-argument swap on an `as`
# cast — it cannot change runtime behavior, so no Field test should regress.
```

### Level 3: Build & Typecheck (System Validation)

```bash
# Build react (tsup emits dist/ + .d.ts) — dist decls MUST export FormalityFieldComponentProps.
pnpm --filter @formality-ui/react build

# Inspect emitted decls (optional confidence check):
grep -n "FormalityFieldComponentProps" packages/react/dist/index.d.ts   # should print the export

# Root typecheck — project references (core + react). MUST include the new
# packages/react/src/typeAssertions/injectedProps.types.ts (tsc --build checks it).
pnpm typecheck

# Expected: green. If injectedProps.types.ts fails, either the public re-export
# (index.ts) is missing FormalityFieldComponentProps, or the type/imports in
# overlays.ts are wrong. If the file is NOT being checked at all (e.g. an
# @ts-expect-error you add later is reported unused), it's in the wrong location.
```

### Level 4: Type-Level Validation (the actual proof of this feature)

```bash
# Confirm the assertion file is included in the build's typecheck:
pnpm typecheck

# Manual confidence check (optional): temporarily make the representative
# component in injectedProps.types.ts reference a prop that does NOT exist on
# FormalityFieldComponentProps<SmokeProps> (e.g. read `nonExistent`), re-run
# `pnpm typecheck` → tsc should error. Revert after. This proves the type is
# actually constraining the component, not just `any`.

# Consumer cross-check (optional, PRD §C.7): if sellario-ui is locally linkable,
# link the rebuilt core+react and run the consumer's `tsc --noEmit`; expect their
# WithFormality to become deletable with NO new false-positive errors. Out of
# scope to actually edit the consumer — just validate if practical.
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm --filter @formality-ui/react build` succeeds; `dist/index.d.ts` exports `FormalityFieldComponentProps` (+ `RefCallBack`/`UseFormStateReturn`/`FieldValues`).
- [ ] `pnpm typecheck` (root `tsc --build`) is green — AND includes `packages/react/src/typeAssertions/injectedProps.types.ts`.
- [ ] `pnpm --filter @formality-ui/react test` green (new smoke test passes).
- [ ] `pnpm test` (root vitest) green — no regressions (esp. Field tests).
- [ ] `pnpm lint` clean; `pnpm format` applied.

### Feature Validation

- [ ] `FormalityFieldComponentProps<P = unknown>` exists in `overlays.ts` with exactly `{ state?: CustomFieldState | Record<string, CustomFieldState>; formState?: UseFormStateReturn<FieldValues>; forwardRef?: RefCallBack; }`.
- [ ] Field.tsx's Component cast reads `as React.ComponentType<FormalityFieldComponentProps>` (the `any` is gone); `FormalityFieldComponentProps` is imported into Field.tsx.
- [ ] The `TemplateComponent` cast in Field.tsx is UNCHANGED.
- [ ] NO new `coreProps` keys added (state/formState/forwardRef) — runtime unchanged.
- [ ] `FormalityFieldComponentProps` exported as a TYPE from index.ts.
- [ ] `RefCallBack`/`UseFormStateReturn`/`FieldValues` re-exported (type-only) from the package.
- [ ] Type-level proof (injectedProps.types.ts) compiles: a representative component satisfies `ComponentType<FormalityFieldComponentProps<TextFieldProps>>` and the destructure-before-forward pattern type-checks.
- [ ] RHF spelling is `RefCallBack` (capital B) everywhere.

### Code Quality Validation

- [ ] JSDoc on `FormalityFieldComponentProps` includes: destructure-before-forward guidance + example, MUI v9 `slotProps={{ input: { ref: forwardRef } }}` note, and the `ref`-vs-`forwardRef` runtime caveat (Mode A — rides with the work).
- [ ] Type-only change; no new runtime code; no new runtime imports in Field.tsx (type-only import only).
- [ ] Default `P = unknown` preserved (non-breaking).
- [ ] `src/typeAssertions/` convention followed (NOT `__tests__/`) for build-time type proof.
- [ ] Existing overlays (ReactInputConfig/ReactFieldConfig/ReactFormFieldsConfig) and T2.S1's defineInputs preserved.

### Documentation & Deployment

- [ ] JSDoc self-documents the three injected props + stripping guidance + MUI v9 note + runtime caveat.
- [ ] No new environment variables or config.

---

## Anti-Patterns to Avoid

- ❌ Don't use React's `RefCallback` spelling — RHF exports `RefCallBack` (capital B). Wrong name = compile error.
- ❌ Don't locate the Field.tsx cast by line number (the architecture doc's `:426` is stale; it's ~`:463` now). Match by content `inputConfig.component as React.ComponentType<any>`.
- ❌ Don't touch the `TemplateComponent` cast below the target cast — it's `InputTemplateProps` / template territory, out of scope.
- ❌ Don't add `state`/`formState`/`forwardRef` to `coreProps` in Field.tsx — runtime injection is a FUTURE task (R4 explicitly excludes it). The only Field.tsx edit is the cast's type argument + one type-only import.
- ❌ Don't put the type-level proof in `__tests__/` or a `*.test.*` file — `tsconfig.json` excludes those from `tsc --build`; use `src/typeAssertions/`.
- ❌ Don't use a value `export { FormalityFieldComponentProps }` in index.ts — it's a TYPE; keep it in `export type { ... }`. Same for the RHF re-exports.
- ❌ Don't re-export `CustomFieldState` again — it's already exported from `./types`. Only `FormalityFieldComponentProps` (+ the 3 RHF types) are new.
- ❌ Don't revert or reorder T2.S1's `defineInputs` in overlays.ts / index.ts — APPEND only; both changes are additive.
- ❌ Don't widen `state` to `unknown` — the architecture doc resolved the real type (`CustomFieldState | Record<string, CustomFieldState>`). Leaving it `unknown` re-creates the exact footgun T3.1 exists to fix.
- ❌ Don't add a value/runtime import of `FormalityFieldComponentProps` into Field.tsx — it's type-only; use `import type`.

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is a type-only, non-breaking change with a fully-resolved
target (the architecture doc `injected_props_types.md` already pinned all
three runtime types against the installed RHF `.d.ts` and Field.tsx source).
The only Field.tsx edit is swapping the type argument on an existing `as`
cast (provably safe: `FormalityFieldComponentProps<unknown>` has only-optional
members, so `<Component {...finalProps} />` still compiles for any shape).
The subtleties are mechanical and all called out: (1) RHF spelling
`RefCallBack` (capital B), (2) locate the cast by content not line (it shifted
to ~463 after T1.S2), (3) don't touch the template cast, (4) type-level proof
must live in `src/typeAssertions/` not `__tests__/` (tsconfig exclude), (5)
type-only exports in index.ts (no value export mixups), (6) reconcile the
additive file overlap with concurrent T2.S1. The consumer benefit is concrete
(deletes `WithFormality`), and the internal reuse guarantees the contract
cannot drift. Parallel-safety with T2.S1 is high (independent regions of the
same two files; both additive).
