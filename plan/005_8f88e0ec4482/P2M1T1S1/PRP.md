name: "P2.M1.T1.S1 — Design useField hook interface and type contract"
description: |

---

## Goal

**Feature Goal**: Establish the **input/output type contract** for the
`useField` hook (PRD §1.3.3 module `hooks/useField`) as a **design-only**
artefact: a new file `packages/react/src/hooks/useField.ts` containing two
exported TypeScript interfaces (`UseFieldParams`, `UseFieldReturn`) + a
non-functional **stub** function + Mode A JSDoc. **No behavioral change** — the
actual extraction of `Field.tsx`'s Controller logic into the hook is **S2**
(P2.M1.T1.S2). This step closes gap_analysis **G6** at the contract layer so S2
has a concrete implementation target.

**Deliverable**:
1. `packages/react/src/hooks/useField.ts` (NEW FILE): exported `UseFieldParams`
   interface, exported `UseFieldReturn` interface, and an exported `useField`
   stub function that **throws "not implemented"**. Full Mode A JSDoc on every
   export explaining the PRD §1.3.3 module contract.
2. `packages/react/src/__tests__/useField.test.tsx` (NEW FILE): minimal
   stub-coverage test asserting the stub throws (keeps the 90% coverage gate
   green and matches the repo's per-hook test convention).
3. *(Recommended)* `packages/react/src/__typechecks__/useField.test-d.ts`
   (NEW FILE): type-only assertion locking in `UseFieldReturn` ≡ `FieldRenderAPI`
   (the central design relationship), auto-checked by `pnpm typecheck`.

**Success Definition**:
- `UseFieldParams` and `UseFieldReturn` are defined, exported from the file,
  carry Mode A JSDoc citing PRD §1.3.3 (and §5.3.5–§5.3.8, §20.1, gap_analysis
  G6), and compile under `verbatimModuleSyntax: true`.
- `UseFieldReturn` is **structurally identical** to the existing
  `FieldRenderAPI` (Field.tsx) — `fieldState`, `renderedField`, `fieldProps`,
  `watchers`, `formState` — verified by the type-assertion file.
- `Field.tsx`, `index.ts`, and every other existing file are **unchanged**
  (`git diff --stat` shows only the new files above). No runtime behavior changes.
- `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`, and
  `pnpm test:coverage` all pass with the coverage gate still ≥ 90%.
- The stub clearly signals deferred implementation (throws), so accidental use
  fails loud — and the contract is **S2-ready** (Field.tsx will delegate to it).

## User Persona (if applicable)

**Target User**: Formality React-adapter maintainer / future Vue/Svelte adapter
author reading `packages/react/src/hooks/` against PRD §1.3.3.

**Use Case**: A maintainer opens the hooks directory, sees `useField.ts`, and
understands — from the JSDoc alone — that this hook owns the RHF Controller
integration, parse/format pipeline, validation wiring, forwardRef delivery, and
template rendering, and that the implementation is intentionally deferred to S2
(gap_analysis G6).

**User Journey**: Open `useField.ts` → read the module-level + interface JSDoc →
understand the params/return contract AND which core functions / context hooks /
composed hooks the real implementation will use (per §1.3.3) → recognize the
stub throw as the "extraction pending" marker → proceed to S2 with a precise
target.

**Pain Points Addressed**: gap_analysis G6 ("`useField` hook absent — logic
inline in Field.tsx"); the PRD §1.3.3 module table lists `hooks/useField` as a
first-class module, so its absence is a structural divergence. This step puts
the module + its public contract in place without destabilizing the working
inline implementation.

## Why

- **PRD §1.3.3 module-contract compliance.** The PRD's React-package table
  lists `hooks/useField` as "RHF Controller integration — Uses Core:
  transform/pipeline, validation/validate". gap_analysis G6 classifies its
  absence as **STRUCTURAL — Medium** and the decision as **extract**. This step
  is the first half of that extraction: define the contract.
- **De-risk the extraction (S2/S3).** Extracting 270+ lines of Controller logic
  out of a 702-line component is the riskiest move in P2. By landing a reviewed
  type contract FIRST (this step), S2 implements against a fixed target and S3
  ("verify behavioral parity") has an explicit shape to assert against. Designing
  the contract separately from the extraction is the standard way to avoid
  "change types AND behavior in one diff" failures.
- **Non-breaking by construction.** Because Field.tsx is untouched and the stub
  is not wired (nor exported from the public barrel), this step cannot regress
  the 1003-test / 97%-coverage baseline. It only adds files.
- **Documentation Mode A.** The work item mandates JSDoc explaining the §1.3.3
  contract — making the module self-documenting for adapter authors.

## What

A new, self-contained `useField.ts` whose ONLY runtime surface is a throwing
stub. The real value is the **type contract** + **JSDoc**. Field.tsx continues
to own the working logic until S2.

### Contract (derived from Field.tsx ground-truth — see research-notes §1)

`UseFieldParams` mirrors the subset of `FieldProps` (Field.tsx) that the hook
will eventually consume; `UseFieldReturn` is **structurally identical** to the
existing `FieldRenderAPI` (Field.tsx). See Implementation Blueprint for exact
field lists.

### Success Criteria

- [ ] `packages/react/src/hooks/useField.ts` exists and exports
      `UseFieldParams` (generic over `TName extends string = string`),
      `UseFieldReturn`, and `useField`.
- [ ] `UseFieldReturn` fields are exactly `fieldState: ControllerFieldState`,
      `renderedField: ReactNode`, `fieldProps: Record<string, unknown>`,
      `watchers: Record<string, boolean>`, `formState: UseFormStateReturn<FieldValues>`
      — matching `FieldRenderAPI`.
- [ ] `UseFieldParams` fields include `name`, `type?`, `disabled?`, `hidden?`,
      `shouldRegister?`, `inputConfig?: Partial<InputConfig>`, `children?`, and
      an index signature `[key: string]: unknown`.
- [ ] `useField` stub **throws** an `Error` whose message mentions "not
      implemented" and references gap_analysis G6 / §1.3.3 / S2.
- [ ] Mode A JSDoc on the file/module, both interfaces (every field), and the
      stub — citing PRD §1.3.3 and explaining the hook owns Controller +
      parse/format (§5.3.5) + change handler (§5.3.6) + validation (§5.3.7) +
      forwardRef (§20.1) + template render (§5.3.8).
- [ ] `useField.ts` does NOT import from `../components/Field` (avoids the
      Field↔useField module cycle that S2 would otherwise hit).
- [ ] `packages/react/src/index.ts` (barrel) is **NOT modified** in S1.
- [ ] `git diff --stat` shows ONLY new files (useField.ts + test [+ optional
      test-d]). Field.tsx, index.ts, overlays.ts, and all other files unchanged.
- [ ] `pnpm typecheck` + `pnpm test` + `pnpm lint` + `pnpm build` +
      `pnpm test:coverage` (≥ 90%) all pass.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the exact field
shapes (derived from Field.tsx's `FieldRenderAPI` / `FieldProps`), the
file-header + JSDoc convention (useConditions.ts / useFormState.ts), the
type-only-import rule (`verbatimModuleSyntax`), the barrel non-change decision
and its rationale, the "no Field import → no cycle" decision, the test +
type-assertion + typecheck mechanics, the parallel/sibling boundaries, and the
exact validation commands. All cited below with paths/lines. ✅ Passes the "No
Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/005_8f88e0ec4482/P2M1T1S1/research/research-notes.md
  why: |
    THIS TASK'S FIELD GUIDE. Distills the verified repo conventions, the
    contract derivation from Field.tsx, the 7 resolved design decisions
    (UseFieldReturn≡FieldRenderAPI, no barrel export, throwing stub, no Field
    import/cycle, children-as-passthrough, generic TName, inputConfig
    inclusion), the test/typecheck mechanics, and the validation commands.
    READ THIS FIRST.

- docfile: plan/005_8f88e0ec4482/architecture/gap_analysis.md
  section: "G6: useField hook absent [STRUCTURAL — Medium]"
  why: |
    The authoritative gap this task opens. States the logic lives inline in
    Field.tsx (~lines 430-702, the Controller render block) and the decision is
    EXTRACT. S1 = contract; S2 = extraction. Cite G6 in the stub throw message
    and the JSDoc.

- docfile: PRD.md §1.3.3 (h4.2)
  why: |
    The module contract being implemented: `hooks/useField` — "RHF Controller
    integration — Uses Core: transform/pipeline, validation/validate". The
    interface JSDoc MUST cite this section by number and name the core modules
    (parse/format, runValidator/resolveErrorMessage, mergeFieldProps) + composed
    hooks (useConditions, usePropsEvaluation, useInferredInputs, useSubscriptions)
    + context hooks (useFormContext, useConfigContext, useGroupContext) the real
    implementation will use.

- docfile: PRD.md §5.3 Field Component (h3.18) + §5.3.5 Value Transformation
    (h4.33) + §5.3.6 Change Handler (h4.34) + §5.3.7 Validation (h4.35) +
    §5.3.8 Template Rendering (h4.36)
  why: |
    The behaviors the useField hook will eventually own (parse/format pipeline,
    change handler, validation integration, template/host rendering). The JSDoc
    references these so adapter authors know the hook's responsibilities. NOTE:
    §5.3.2/§5.3.7 in the PRD describe `ref: controller.field.ref`; the
    IMPLEMENTED behavior is forwardRef delivery (PRD §20) — the JSDoc must say
    "forwardRef (§20.1)", NOT "ref".

- docfile: PRD.md §20 Field ref delivery via forwardRef (h2.21, esp. §20.1 h3.95)
  why: |
    forwardRef delivery (NOT the legacy `ref` key) is the current implemented
    behavior (Field.tsx `coreProps.forwardRef`). The UseFieldReturn/JSDoc must
    reflect forwardRef. (Sibling P2.M2.T1.S1 fixes stale `ref` wording in
    overlays.ts; this task only needs to use the correct `forwardRef` term.)

- docfile: PRD.md §C.4 / T2.1 (h4.60) — generic Form<TFieldValues> + Field name
  why: |
    Why UseFieldParams is generic `UseFieldParams<TName extends string = string>`
    (threads field-name type narrowing). Field.tsx's FieldProps<TName> is the
    model; the default `string` keeps it non-breaking.

- file: packages/react/src/components/Field.tsx
  section: |
    FieldRenderAPI interface (~L80-96) — the EXACT shape UseFieldReturn mirrors.
    FieldProps<TName> interface (~L60-79) — the input shape. Controller render
    block (~L430-702) — the logic S2 will extract. imports (~L3-26) — the core
    fns (resolveInputConfig, mergeFieldProps, resolveLabel, parse, format,
    runValidator, resolveErrorMessage), context hooks, composed hooks.
  why: |
    Ground truth for the contract. Copy FieldRenderAPI's field set/types verbatim
    into UseFieldReturn (same `UseFormStateReturn<FieldValues>` generic).
  pattern: FieldRenderAPI is `fieldState | renderedField | fieldProps | watchers
    | formState`. FieldProps fields feed UseFieldParams.
  gotcha: |
    Do NOT import FieldRenderAPI into useField.ts (creates Field↔useField cycle
    for S2). Define UseFieldReturn fresh + assert equivalence in the test-d file.
    Also: FieldRenderAPI.formState is `UseFormStateReturn<FieldValues>` (not bare
    `UseFormStateReturn`) — match the generic.

- file: packages/react/src/hooks/useConditions.ts
  section: L1-2 (file header), L24-37 (UseConditionsOptions w/ field JSDoc),
    L39-71 (function JSDoc w/ @param/@returns/@example)
  why: |
    The hook-file pattern to mirror: header comment `// @formality-ui/react -
    <Name> Hook`, an options interface with per-field JSDoc, a full function
    JSDoc block. useFormState.ts is the "typed public hook" model (also exports
    its options type + @example).
  pattern: header comment → `import type` only for types → options interface →
    function with JSDoc.

- file: packages/react/src/hooks/useFormState.ts
  why: The model for a hook that EXPORTS its param type (`UseFormStateOptions`)
    with @example JSDoc. Mirror this for the public, typed feel of useField.

- file: packages/react/src/types.ts
  section: CustomFieldState (L29-52), WatcherSetterFn (L79-82)
  why: |
    Types Field.tsx imports (`CustomFieldState`, `WatcherSetterFn`). The
    useField JSDoc references these as the real implementation's types but S1
    does NOT need to import them (stub throws before use). Mention in prose only.

- file: packages/react/src/overlays.ts
  section: FormalityFieldComponentProps (L160-194)
  why: |
    The injected-props type (`state`, `formState`, `forwardRef`) the rendered
    component consumes — relevant context for what `renderedField`/`fieldProps`
    feed. READ ONLY; do NOT modify (sibling P2.M2.T1.S1 owns overlays.ts edits).

- file: packages/react/src/index.ts
  section: L72-79 (Hooks barrel block)
  why: |
    Confirms hook export convention AND that this task MUST NOT touch the barrel
    (useField stub is not wired yet). useFieldDisabledState is NOT exported —
    the precedent for an un-exported-in-S1 hook. FieldRenderAPI IS exported
    (via `export type { …, FieldRenderAPI } from "./components/Field"`).
  gotcha: Do not add useField here in S1.

- file: packages/react/src/__tests__/useSubscriptions.test.tsx
  why: |
    The hook-test pattern: relative import (`../hooks/useX`), `renderHook` from
    `@testing-library/react`, inline FormContext.Provider wrapper, vitest
    describe/it/expect. NO shared test util (setup.ts only wires jest-dom +
    cleanup). For a THROWING stub, no wrapper is needed (it throws before any
    context access).

- file: packages/react/src/__typechecks__/FieldProps.test-d.ts
  why: |
    The type-assertion pattern: `*.test-d.ts`, `// @ts-expect-error` for
    rejections, `const x: T = …; void x;` for acceptances. NOT run by vitest;
    auto-included by `tsc --build` (react tsconfig includes src/**/*, excludes
    only *.test.* + __tests__/**). No expectTypeOf/assertType.

- docfile: plan/005_8f88e0ec4482/P1M3T1S1/PRP.md
  why: |
    The PARALLEL "previous" item (core JSDoc on conditions/evaluate.ts,
    config/defaults.ts, labels/resolve.ts). Confirms ZERO file overlap with this
    task (core vs react) and that it only READS useConditions.ts/Field.tsx as
    evidence (no modifications). Safe to run in parallel; no coordination needed.

- docfile: plan/005_8f88e0ec4482/prd_index.txt
  why: Section index for cross-referencing §1.3.3, §5.3.*, §20, §C.4 in JSDoc.
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
├── components/
│   └── Field.tsx              # 702 lines; exports FieldProps<TName>, FieldRenderAPI (UNCHANGED)
├── hooks/
│   ├── useConditions.ts       # hook file pattern + JSDoc model
│   ├── useFormState.ts        # "typed public hook" model (exports options type)
│   ├── useInferredInputs.ts
│   ├── usePropsEvaluation.ts
│   ├── useSubscriptions.ts
│   └── useFieldDisabledState.ts  # dead; removed by sibling P2.M1.T2.S1 (NOT this task)
├── __tests__/
│   ├── setup.ts               # jest-dom + cleanup ONLY (no shared wrapper)
│   ├── useSubscriptions.test.tsx
│   ├── useFormState.test.tsx
│   ├── useInferredInputs.test.tsx
│   └── useFieldDisabledState.test.tsx
├── __typechecks__/
│   ├── FieldProps.test-d.ts   # type-assertion pattern
│   ├── defineInputs.test-d.ts
│   └── ReactFormFieldsConfig.test-d.ts
├── typeAssertions/
│   └── injectedProps.types.ts
├── overlays.ts                # FormalityFieldComponentProps (READ ONLY; sibling P2.M2.T1.S1 edits)
├── types.ts                   # CustomFieldState, WatcherSetterFn
└── index.ts                   # barrel (UNCHANGED in S1)
```

### Desired Codebase tree with files to be added (ALL NEW — no modifications)

```bash
packages/react/src/hooks/useField.ts                  # NEW — UseFieldParams, UseFieldReturn, useField stub + JSDoc
packages/react/src/__tests__/useField.test.tsx        # NEW — stub-throws coverage test (keeps 90% gate green)
packages/react/src/__typechecks__/useField.test-d.ts  # NEW (recommended) — UseFieldReturn ≡ FieldRenderAPI assertion
# (nothing else changes; Field.tsx + index.ts + overlays.ts untouched)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (verbatimModuleSyntax: true, root tsconfig): EVERY type-only import
// in useField.ts MUST be `import type { … }`. Mixing value+type from the same
// module is fine ONLY if a value is actually used; here ALL imports are types
// (ReactNode, ControllerFieldState, UseFormStateReturn, FieldValues, InputConfig)
// → all `import type`. eslint will fail otherwise.

// CRITICAL (no module cycle): useField.ts MUST NOT import from
// `../components/Field`. S2 will make Field.tsx import useField → a back-import
// now creates a Field↔useField cycle. Define UseFieldReturn fresh (structurally
// matching FieldRenderAPI); lock the equivalence in the test-d file instead.

// CRITICAL (UseFieldReturn ≡ FieldRenderAPI): copy FieldRenderAPI's field set
// AND the `UseFormStateReturn<FieldValues>` generic EXACTLY (not bare
// `UseFormStateReturn`). formState in FieldRenderAPI is
// `UseFormStateReturn<FieldValues>`.

// CRITICAL (forwardRef, not ref): the implemented ref-delivery behavior is
// `coreProps.forwardRef` (PRD §20.1), NOT the legacy `ref` key that PRD §5.3.2
// pseudo-code shows. The JSDoc must say "forwardRef (§20.1)". (Sibling
// P2.M2.T1.S1 fixes the stale `ref` wording in overlays.ts.)

// CRITICAL (children is pass-through): UseFieldReturn.renderedField is the RAW
// rendered input (template/component/host) — NOT children-applied. Field.tsx
// computes renderedField FIRST, then applies `children({…})` at the render
// layer. Designing it the other way breaks S3 behavioral parity.

// CRITICAL (no barrel change): do NOT add useField to packages/react/src/index.ts
// in S1. A throwing stub in the public barrel exposes an unimplemented API.
// useFieldDisabledState (defined, un-exported) is the precedent. File-level
// `export` already satisfies "exported from the file".

// GOTCHA (stub throws, not no-op): the stub must `throw new Error(...)`. A
// `return {} as UseFieldReturn` no-op would silently misuse if accidentally
// wired. Throwing is the honest "not implemented" marker; nothing calls it in
// S1 (Field still inline). Underscore the unused param: `_params`.

// GOTCHA (90% coverage gate, PRD §1.3.7): ALL of packages/react/** is measured
// (only examples/**, svelte/**, vue/**, dist/** excluded). A new stub function
// adds an uncovered function if untested. The repo baseline (~97% / 1003 tests)
// likely tolerates one uncovered fn, but the minimal useField.test.tsx removes
// ALL risk AND matches the per-hook test convention. The test uses renderHook
// (NOT a direct call) to stay consistent with sibling hook tests and avoid any
// rules-of-hooks lint false-positive — the stub throws before any context is
// read, so NO FormContext wrapper is needed.

// GOTCHA (type-assertion file naming): must be `*.test-d.ts` (NOT `*.test.ts`)
// so vitest's `include: src/**/*.test.{ts,tsx}` IGNORES it while tsc's
// `include: src/**/*` type-checks it. Plain `const x: T = …; void x;` +
// `// @ts-expect-error` only — no expectTypeOf/assertType.

// GOTCHA (generic on the interface): UseFieldParams MUST be generic
// `<TName extends string = string>` (matches FieldProps<TName> in Field.tsx)
// so S2 can pass Field's narrowed name type straight through. Default `string`
// keeps a bare `UseFieldParams` identical to `UseFieldParams<string>`.

// GOTCHA (siblings): P2.M1.T2.S1 REMOVES useFieldDisabledState — a DIFFERENT
// file; do not touch it. P2.M2.T1.S1 edits overlays.ts — you only READ it.
```

## Implementation Blueprint

### Data models and structure

This task's "data models" are two TypeScript interfaces + one stub function.
There are no ORM/pydantic models — this is a React/TypeScript design artefact.

```typescript
// EXACT contract (derived from Field.tsx FieldRenderAPI / FieldProps — see research §1)

import type { ReactNode } from "react";
import type {
  ControllerFieldState,
  UseFormStateReturn,
  FieldValues,
} from "react-hook-form";
import type { InputConfig } from "@formality-ui/core";

/**
 * Parameters for {@link useField}. (Mode A JSDoc — see file-level block.)
 *
 * Mirrors the subset of `FieldProps` (Field.tsx) the hook will consume once
 * extracted (S2). Generic over `TName` to thread field-name type narrowing
 * (PRD §C.4 / T2.1).
 */
export interface UseFieldParams<TName extends string = string> {
  /** Field name (must match a key in Form's config). */
  name: TName;
  /** Override the input type resolved from config. */
  type?: string;
  /** Override disabled state (highest priority in §5.3.4 resolution). */
  disabled?: boolean;
  /** Override hidden state (inverse of visible). */
  hidden?: boolean;
  /** Whether to register this field in Form's field registry (default: true). */
  shouldRegister?: boolean;
  /** Per-field input-config override (merged highest-priority over provider/form). */
  inputConfig?: Partial<InputConfig>;
  /**
   * Optional render-prop. PASSED THROUGH so the Field component can apply it
   * against the hook's {@link UseFieldReturn}. The hook itself returns the RAW
   * {@link UseFieldReturn.renderedField} (render-prop application is a
   * render-layer concern — see Field.tsx §5.3.8).
   */
  children?: ReactNode | ((api: UseFieldReturn) => ReactNode);
  /** Additional props forwarded to the input component (the 8-layer merge's
   *  `componentProps` layer — §5.3.2). */
  [key: string]: unknown;
}

/**
 * Return value of {@link useField}. (Mode A JSDoc — see file-level block.)
 *
 * Structurally identical to `FieldRenderAPI` (Field.tsx) — the data the render
 * layer (template / host / render-prop children) consumes. S2/S3 will reconcile
 * `FieldRenderAPI` into an alias of this type.
 */
export interface UseFieldReturn {
  /** RHF field state from the Controller (invalid/error/isTouched/isDirty/…). */
  fieldState: ControllerFieldState;
  /** The RAW rendered input (template/component/host) — NOT children-applied. */
  renderedField: ReactNode;
  /** Final merged props passed to the input (8-layer merge, §5.3.2). */
  fieldProps: Record<string, unknown>;
  /** Map of fields watching this field (watcher state, §5.3.1 step 3). */
  watchers: Record<string, boolean>;
  /** RHF form state from the Controller. */
  formState: UseFormStateReturn<FieldValues>;
}

/**
 * useField — STUB (design step only). Throws to signal deferred extraction.
 *
 * @remarks NOT IMPLEMENTED. Throws `Error` on every call. The Controller
 *   integration logic (parse/format pipeline §5.3.5, change handler §5.3.6,
 *   validation §5.3.7, forwardRef delivery §20.1, template render §5.3.8)
 *   currently lives INLINE in `Field.tsx`; extraction into this hook is tracked
 *   in gap_analysis.md **G6** / PRD §1.3.3 and lands in **P2.M1.T1.S2**.
 */
export function useField(_params: UseFieldParams): UseFieldReturn {
  throw new Error(
    "useField is not implemented yet. The RHF Controller integration currently " +
      "lives inline in Field.tsx; extraction into this hook is tracked in " +
      "gap_analysis.md G6 / PRD §1.3.3 (P2.M1.T1.S2).",
  );
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — read the field guide + the contract sources + confirm conventions
  - READ: plan/.../P2M1T1S1/research/research-notes.md   (field guide — FIRST)
  - READ the contract sources (ground truth):
      grep -n "export interface FieldRenderAPI" packages/react/src/components/Field.tsx
      grep -n "export interface FieldProps" packages/react/src/components/Field.tsx
      # Skim the Controller render block (~L430-702) to confirm what S2 extracts.
  - READ the patterns to mirror:
      packages/react/src/hooks/useConditions.ts   (header + interface + JSDoc)
      packages/react/src/hooks/useFormState.ts    (typed public hook + @example)
      packages/react/src/__tests__/useSubscriptions.test.tsx (hook test pattern)
      packages/react/src/__typechecks__/FieldProps.test-d.ts (test-d pattern)
  - CONFIRM verbatimModuleSyntax + tsconfig include/exclude:
      grep -n "verbatimModuleSyntax" tsconfig.json packages/react/tsconfig.json
  - CONFIRM useField.ts is ABSENT and the barrel is untouched:
      ls packages/react/src/hooks/useField.ts   # must fail today
      grep -n "useField" packages/react/src/index.ts   # must be empty

Task 2: CREATE packages/react/src/hooks/useField.ts  (THE deliverable)
  - FILE: packages/react/src/hooks/useField.ts  (NEW)
  - HEADER: `// @formality-ui/react - useField Hook` + blank line (match useConditions.ts).
  - IMPORTS (ALL `import type` — verbatimModuleSyntax):
      type { ReactNode } from "react"
      type { ControllerFieldState, UseFormStateReturn, FieldValues } from "react-hook-form"
      type { InputConfig } from "@formality-ui/core"
      (NO import from "../components/Field" — avoids the S2 cycle.)
  - DEFINE + EXPORT `UseFieldParams<TName extends string = string>` with the
    field set in the Data-models block above (name, type?, disabled?, hidden?,
    shouldRegister?, inputConfig?, children?, [key:string]:unknown). Per-field
    JSDoc.
  - DEFINE + EXPORT `UseFieldReturn` with EXACTLY: fieldState:
    ControllerFieldState; renderedField: ReactNode; fieldProps:
    Record<string, unknown>; watchers: Record<string, boolean>; formState:
    UseFormStateReturn<FieldValues>. (Match FieldRenderAPI field-for-field +
    the <FieldValues> generic.) Per-field JSDoc.
  - DEFINE + EXPORT the `useField(_params: UseFieldParams): UseFieldReturn` STUB
    that THROWS (see Data-models block). Underscore `_params`.
  - MODE A JSDoc: a module-level block + interface blocks + stub block, each
    citing PRD §1.3.3 and the responsibilities (Controller + parse/format
    §5.3.5 + change handler §5.3.6 + validation §5.3.7 + forwardRef §20.1 +
    template render §5.3.8) and the core fns / composed hooks / context hooks
    the real impl will use (resolveInputConfig/mergeFieldProps/parse/format/
    runValidator/resolveErrorMessage; useConditions/usePropsEvaluation/
    useInferredInputs/useSubscriptions; useFormContext/useConfigContext/
    useGroupContext). State the stub throws + extraction in S2 + gap_analysis G6.
  - DO NOT: modify Field.tsx, index.ts, overlays.ts, or any existing file.

Task 3: CREATE packages/react/src/__tests__/useField.test.tsx  (stub coverage)
  - FILE: packages/react/src/__tests__/useField.test.tsx  (NEW)
  - IMPORT (RELATIVE, per convention):
      import { describe, it, expect } from "vitest";
      import { renderHook } from "@testing-library/react";
      import { useField } from "../hooks/useField";
      import type { UseFieldParams } from "../hooks/useField";
  - TEST: one describe("useField (stub — gap_analysis G6)") with one it() that
    asserts the stub throws, via renderHook (consistent with sibling hook tests;
    no wrapper needed — stub throws before any context access):
        const params = { name: "email" } as UseFieldParams;
        expect(() => renderHook(() => useField(params))).toThrow(/not implemented/i);
  - NAMING: file `useField.test.tsx` (matches sibling hook tests).
  - COVERAGE: this single test covers the stub's throw line → keeps the 90% gate
    green. (If a direct `useField(params)` call is preferred and passes lint, it
    is also acceptable — the stub throws before any React hook runs — but
    renderHook is the established repo pattern.)

Task 4 (RECOMMENDED): CREATE packages/react/src/__typechecks__/useField.test-d.ts
  - FILE: packages/react/src/__typechecks__/useField.test-d.ts  (NEW)
  - PURPOSE: lock in `UseFieldReturn` ≡ `FieldRenderAPI` (the central design
    claim) so S2/S3 can't drift. Header comment (copy FieldProps.test-d.ts
    style): "NOT a runtime test; pure type-check consumed by `tsc --build`."
  - ASSERT (both directions — structural equivalence):
      import type { UseFieldReturn } from "../hooks/useField";
      import type { FieldRenderAPI } from "../components/Field";
      const _r2api: FieldRenderAPI = null as unknown as UseFieldReturn;
      const _api2r: UseFieldReturn = null as unknown as FieldRenderAPI;
      void _r2api; void _api2r;
    (If these compile, the two types are structurally identical. Add a brief
    comment explaining S2 will alias FieldRenderAPI = UseFieldReturn.)
  - GOTCHA: file MUST be `*.test-d.ts` (vitest excludes it; tsc includes it).
  - This task is OPTIONAL only if the type-assertion proves redundant; default
    to INCLUDING it (low risk, high value, auto-checked).

Task 5: VERIFY — no behavioral change + all gates green
  - 5a. SCOPE: `git diff --stat` shows ONLY the new file(s) above. NO changes to
       Field.tsx, index.ts, overlays.ts, or any existing file.
  - 5b. GATES (from repo root):
       pnpm typecheck     # tsc --build — validates useField.ts + the test-d file
       pnpm test          # vitest run — new stub test passes; existing 1003 stay green
       pnpm lint          # eslint . — incl. verbatimModuleSyntax + rules-of-hooks
       pnpm build         # pnpm -r build (tsup) — new file compiles & emits
       pnpm test:coverage # 90% gate still met (stub covered by Task 3)
  - 5c. CONTRACT spot-check: UseFieldReturn fields == FieldRenderAPI fields;
       UseFieldParams has all 8 members; stub message contains "not implemented".
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — hook file skeleton (mirror useConditions.ts / useFormState.ts):
// @formality-ui/react - useField Hook
// <blank line>
import type { ReactNode } from "react";
import type { ControllerFieldState, UseFormStateReturn, FieldValues } from "react-hook-form";
import type { InputConfig } from "@formality-ui/core";

/** Mode A JSDoc: UseFieldParams … (cite PRD §1.3.3, §C.4/T2.1) */
export interface UseFieldParams<TName extends string = string> { /* … */ }

/** Mode A JSDoc: UseFieldReturn ≡ FieldRenderAPI (cite §1.3.3, §5.3.5-8, §20.1) */
export interface UseFieldReturn { /* field-for-field = FieldRenderAPI */ }

/** Mode A JSDoc: STUB — throws; extraction in S2 (G6). */
export function useField(_params: UseFieldParams): UseFieldReturn {
  throw new Error("useField is not implemented yet. … G6 … §1.3.3 … (P2.M1.T1.S2).");
}

// PATTERN — type-assertion test-d (mirror __typechecks__/FieldProps.test-d.ts):
// header comment: "NOT a runtime test … consumed by tsc --build (pnpm typecheck)."
import type { UseFieldReturn } from "../hooks/useField";
import type { FieldRenderAPI } from "../components/Field";
// Bidirectional assignability = structural equivalence:
const _a: FieldRenderAPI = null as unknown as UseFieldReturn;
const _b: UseFieldReturn = null as unknown as FieldRenderAPI;
void _a; void _b;

// PATTERN — hook test (mirror __tests__/useSubscriptions.test.tsx):
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useField } from "../hooks/useField";
import type { UseFieldParams } from "../hooks/useField";
describe("useField (stub — gap_analysis G6)", () => {
  it("throws until extraction in P2.M1.T1.S2", () => {
    const params = { name: "email" } as UseFieldParams;
    expect(() => renderHook(() => useField(params))).toThrow(/not implemented/i);
  });
});

// GOTCHA recap (see Known Gotchas): verbatimModuleSyntax → all `import type`;
// no Field import (cycle); UseFormStateReturn<FieldValues> generic; forwardRef
// not ref; children is pass-through (renderedField is RAW); no barrel change;
// stub THROWS; test via renderHook; test-d naming.
```

### Integration Points

```yaml
FILES ADDED (this task — all NEW, no modifications):
  - packages/react/src/hooks/useField.ts                  # types + stub + JSDoc
  - packages/react/src/__tests__/useField.test.tsx        # stub-coverage test
  - packages/react/src/__typechecks__/useField.test-d.ts  # (recommended) type assertion

NOT TOUCHED IN S1 (deferred to S2/S3 or siblings):
  - packages/react/src/components/Field.tsx   # S2 will refactor to delegate to useField
  - packages/react/src/index.ts               # barrel export deferred to S2/S3 (stub not wired)
  - packages/react/src/overlays.ts            # READ ONLY here; sibling P2.M2.T1.S1 edits it
  - packages/react/src/hooks/useFieldDisabledState.ts  # removed by P2.M1.T2.S1 (different file)

NO DATABASE / CONFIG / ROUTES — this is a pure TypeScript design artefact in a
React hooks directory. The only "integration" is the type contract that S2
implements against.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type-only imports + formatting (run after creating useField.ts):
pnpm exec prettier --check packages/react/src/hooks/useField.ts \
  packages/react/src/__tests__/useField.test.tsx \
  packages/react/src/__typechecks__/useField.test-d.ts || \
  pnpm exec prettier --write packages/react/src/hooks/useField.ts \
    packages/react/src/__tests__/useField.test.tsx \
    packages/react/src/__typechecks__/useField.test-d.ts

# All imports are `import type` (verbatimModuleSyntax):
grep -n "^import " packages/react/src/hooks/useField.ts
# Expected: every line is `import type { … }`. No bare `import { … }`.

# No forbidden Field import (cycle guard):
grep -n "components/Field" packages/react/src/hooks/useField.ts
# Expected: EMPTY. (FieldRenderAPI is referenced only in the test-d file.)

# Expected: zero lint errors.
pnpm lint
```

### Level 2: Unit Tests (Component Validation)

```bash
# The new stub test (covers the throw → keeps 90% gate green):
pnpm test -- packages/react/src/__tests__/useField.test.tsx

# Full react suite — must stay green (no behavioral change):
pnpm test
# Expected: existing ~1003 tests still pass + 1 new stub test passes.
```

### Level 3: Type Checking & Build (System Validation)

```bash
# tsc --build validates useField.ts AND the test-d assertion file automatically:
pnpm typecheck
# Expected: zero errors. If the test-d bidirectional-assignability lines error,
# UseFieldReturn ≠ FieldRenderAPI → fix the field set/generics in useField.ts.

# Build (tsup) — the new file must compile & emit:
pnpm build
# Expected: @formality-ui/react builds cleanly.
```

### Level 4: Coverage Gate & Scope Purity (final)

```bash
# 90% hard gate (PRD §1.3.7) — must still pass with the new stub file:
pnpm test:coverage
# Expected: statements/branches/functions/lines all ≥ 90% across
# packages/core + packages/react. (Task 3's stub test covers the throw line.)

# SCOPE PURITY — only NEW files; zero modifications to existing files:
git diff --stat
# Expected ONLY:
#   packages/react/src/hooks/useField.ts            (new)
#   packages/react/src/__tests__/useField.test.tsx  (new)
#   packages/react/src/__typechecks__/useField.test-d.ts  (new, optional)
# If ANY existing file appears (Field.tsx, index.ts, overlays.ts, …) → revert it.

# Contract spot-checks:
grep -n "export interface UseFieldParams\|export interface UseFieldReturn\|export function useField" \
  packages/react/src/hooks/useField.ts   # all three present
grep -n "not implemented" packages/react/src/hooks/useField.ts   # stub message present
grep -niE "§1\.3\.3|G6|forwardRef|§20\.1|§5\.3\.[5-8]" packages/react/src/hooks/useField.ts
# Expected: JSDoc cites §1.3.3 + G6 + the responsibility sections.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: prettier clean; every import in useField.ts is `import type`; no
      `components/Field` import in useField.ts; `pnpm lint` clean.
- [ ] Level 2: new stub test passes; `pnpm test` green with unchanged existing
      test count + 1.
- [ ] Level 3: `pnpm typecheck` clean (incl. the test-d bidirectional
      equivalence); `pnpm build` clean.
- [ ] Level 4: `pnpm test:coverage` ≥ 90% on all metrics; `git diff --stat` =
      new files ONLY.

### Feature Validation

- [ ] `useField.ts` exports `UseFieldParams` (generic `<TName extends string =
      string>`), `UseFieldReturn`, and `useField`.
- [ ] `UseFieldReturn` is field-for-field identical to `FieldRenderAPI`
      (incl. `UseFormStateReturn<FieldValues>`), proven by the test-d file.
- [ ] `UseFieldParams` has all 8 members (name, type?, disabled?, hidden?,
      shouldRegister?, inputConfig?, children?, index signature).
- [ ] `useField` stub THROWS with a message containing "not implemented" + G6.
- [ ] Mode A JSDoc on module + both interfaces + stub cites PRD §1.3.3 and lists
      the hook's responsibilities (parse/format §5.3.5, change handler §5.3.6,
      validation §5.3.7, forwardRef §20.1, template render §5.3.8).
- [ ] JSDoc uses **forwardRef (§20.1)**, NOT the legacy `ref` key.

### Code Quality Validation

- [ ] File header + interface + function JSDoc match useConditions.ts /
      useFormState.ts style.
- [ ] No import cycle (useField.ts does not import Field.tsx).
- [ ] Barrel (`index.ts`) unchanged in S1.
- [ ] Field.tsx, overlays.ts, and all other existing files unchanged.
- [ ] All `import type` (verbatimModuleSyntax).

### Documentation & Deployment

- [ ] The module is self-documenting: a maintainer understands the §1.3.3
      contract + the S2 handoff from the JSDoc alone.
- [ ] No README/CHANGELOG required for this Mode A subtask (the type contract +
      JSDoc are the deliverable; changeset-level docs sync is P3.M2).

---

## Anti-Patterns to Avoid

- ❌ Don't import `FieldRenderAPI` (or anything) from `../components/Field` into
  useField.ts. S2 makes Field import useField → that back-import now is a cycle.
  Define `UseFieldReturn` fresh; prove equivalence in the test-d file.
- ❌ Don't add `useField` to `packages/react/src/index.ts` in S1. A throwing stub
  in the public barrel exposes an unimplemented API. Barrel export is S2/S3.
- ❌ Don't make `UseFieldReturn` diverge from `FieldRenderAPI` (different field
  names, missing `<FieldValues>` generic, swapped `ReactNode`/`ReactElement`).
  Copy it field-for-field; the test-d file enforces this.
- ❌ Don't describe ref delivery as the legacy `ref` key. The implemented
  behavior is `forwardRef` (PRD §20.1). (PRD §5.3.2 pseudo-code still shows `ref`
  — that is the stale text; do not copy it into the JSDoc.)
- ❌ Don't design `renderedField` as children-applied. It is the RAW rendered
  input; the render-prop `children` is applied by the Field component against
  the hook's return. Inverting this breaks S3 parity.
- ❌ Don't write a no-op stub (`return {} as UseFieldReturn`). It must THROW so
  accidental wiring fails loud. (Nothing calls it in S1, but the throw is the
  honest "not implemented" marker and makes the stub test trivial.)
- ❌ Don't skip the stub test. The 90% coverage gate (PRD §1.3.7) measures all of
  `packages/react/**`; an uncovered function is avoidable risk. One renderHook
  test covers the throw line.
- ❌ Don't use bare `import { Type }` — `verbatimModuleSyntax: true` requires
  `import type`. (ReactNode, the RHF types, and InputConfig are all type-only
  here.)
- ❌ Don't modify Field.tsx, overlays.ts, index.ts, useFieldDisabledState.ts, or
  any existing file. This is CREATE-only. (useFieldDisabledState is removed by
  the sibling P2.M1.T2.S1 — not by you. overlays.ts is edited by sibling
  P2.M2.T1.S1 — you only read it.)
- ❌ Don't implement the hook body. That is S2 (P2.M1.T1.S2). S1 = contract +
  JSDoc + throwing stub ONLY. Resist copying Field.tsx logic in.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **CREATE-only, type-contract + JSDoc + throwing-stub** task with the
  entire contract pre-derived from Field.tsx ground truth (`FieldRenderAPI` /
  `FieldProps`) and distilled into the research note. The single deliverable file
  is fully specified (exact field lists, exact imports, exact stub message).
- The biggest risk (`UseFieldReturn` ≠ `FieldRenderAPI`) is neutralized by a
  bidirectional type-assertion file auto-checked by `pnpm typecheck`.
- The second risk (coverage gate) is neutralized by one renderHook stub test.
- The third risk (accidental behavioral change / cycle / barrel leak) is
  neutralized by the `git diff --stat` scope gate + the "no Field import / no
  barrel change" rules.
- Sibling/parallel boundaries are clean (zero file overlap with P1.M3.T1.S1,
  P2.M1.T2.S1, P2.M2.T1.S1).
- Residual 1 point: JSDoc tone/wording is subjective; the implementer must match
  the useConditions.ts / useFormState.ts style and cite the exact PRD sections
  (Task 1 + the Data-models block make this explicit).
