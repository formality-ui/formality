name: "P2.M1.T1.S2 — Extract Controller integration logic into useField hook"
description: |

---

## Goal

**Feature Goal**: Replace the **throwing S1 stub** in
`packages/react/src/hooks/useField.ts` with the **real RHF Controller
integration** extracted out of `Field.tsx`, refactor `Field.tsx` into a **thin
wrapper** that delegates to `useField`, and **export `useField`** (+
`UseFieldParams` / `UseFieldReturn`) from the public barrel. This closes
gap_analysis **G6** (PRD §1.3.3 module `hooks/useField`) at the **implementation
layer** — S1 (P2.M1.T1.S1) already landed the type contract; this step lands
the behavior. **Zero behavioral change** is the hard gate: every existing
`<Field>` test must pass unmodified.

**Deliverable**:
1. `packages/react/src/hooks/useField.ts` (MODIFY): replace the throwing stub
   with a real implementation that owns the **entire** Controller lifecycle —
   context reads, input-config resolution, watchers, subscriptions, conditions,
   the setValue effect (ref pattern §7.1.1), props evaluation, disabled/visible/
   label resolution, passSubscriptions, validation rules, handleChange
   (parse/format), the **`<Controller>` element + its render callback**
   (format → stateInjection → `mergeFieldProps` 8-layer merge → forwardRef
   delivery §20.1/§20.4 → template/host/component → render-prop `children`),
   and returns the `UseFieldReturn`. Rewrite the S1 "STUB/not implemented" JSDoc
   to Mode A describing the real implementation (cite §1.3.3, §20).
2. `packages/react/src/components/Field.tsx` (MODIFY → thin): call
   `useField(params)`, keep the **registration `useEffect`**
   (`registerField`/`unregisterField`), and `return` the hook's `renderedField`.
3. `packages/react/src/__tests__/useField.test.tsx` (MODIFY): the S1 test
   asserted the stub THROWS — **it must be replaced** with a real test (useField
   no longer throws). Minimal: render through a `<FormalityProvider><Form>`
   wrapper via `renderHook`/`render` and assert it returns a `renderedField`.
4. `packages/react/src/index.ts` (MODIFY): add `export { useField }` +
   `export type { UseFieldParams, UseFieldReturn }` to the Hooks block.
5. `packages/react/src/__typechecks__/useField.test-d.ts` (UNCHANGED): the
   `UseFieldReturn` ↔ `FieldRenderAPI` bidirectional assignability assertion
   stays valid (the field set is unchanged).

**Success Definition**:
- `useField` is fully implemented and owns the RHF Controller integration per
  PRD §1.3.3 (no longer throws).
- `Field.tsx` is a thin wrapper (registration effect + `return renderedField`);
  it no longer contains the Controller / props-merge / parse-format / validation
  / forwardRef / template logic.
- **ALL existing Field tests pass UNMODIFIED**: `Field.test.tsx` (39 describes /
  ~60 `it`s), `Field.forwardRef.test.tsx`, `FieldForwardRef.acceptance.test.tsx`,
  `Field.subscriptionStability.test.tsx`, plus `validation-report-fixes.test.tsx`
  (provideState/passSubscriptions coverage). The full suite count is unchanged
  for these files.
- `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`, and
  `pnpm test:coverage` (≥ 90%) all pass.
- `useField` + `UseFieldParams` + `UseFieldReturn` are exported from the barrel.

## User Persona (if applicable)

**Target User**: Formality React-adapter maintainer / future Vue/Svelte adapter
author reading `packages/react/src/hooks/useField.ts` against PRD §1.3.3, and
downstream consumers who want to call `useField` directly.

**Use Case**: A consumer renders a single field with full framework integration
(Controller + props merge + conditions + parse/format + validation + forwardRef)
either via `<Field>` (the thin wrapper) or by calling `useField` directly for a
custom layout.

**User Journey**: `<Field name="email">` → Field delegates to
`useField({ name: "email" })` → the hook reads form/config/group contexts,
resolves input config, sets up subscriptions/conditions/watchers, builds the
validation rules + change handler, mounts the `<Controller>`, and returns
`renderedField` (the rendered input) → Field renders it.

**Pain Points Addressed**: gap_analysis **G6** — `useField` was absent and the
~270-line Controller logic lived inline in a 702-line `Field.tsx`, making the
component hard to test/reuse and diverging from PRD §1.3.3's module contract.

## Why

- **PRD §1.3.3 module-contract compliance.** The PRD lists `hooks/useField` as
  "RHF Controller integration — Uses Core: transform/pipeline, validation/
  validate". gap_analysis G6 classifies its absence as **STRUCTURAL — Medium**
  with decision **extract**. S1 landed the contract; S2 lands the behavior.
- **De-risk P2.** This is the riskiest move in P2 (extracting 270+ lines from a
  702-line component). The behavior-preservation gate (S3 + all Field tests)
  is exactly why this PRP specifies a **minimal-diff MOVE** (Design B/C below)
  rather than a risky re-architecture.
- **Enables direct-hook consumption + S3 parity.** Once `useField` is real and
  exported, consumers can build custom field layouts without `<Field>`, and S3
  ("verify behavioral parity") has an explicit public seam to assert against.
- **Non-breaking by construction.** Because the extraction is a relocation of
  identical logic (not a rewrite), the 1003-test / 97%-coverage baseline is
  preserved.

## What

`useField.ts` becomes the single owner of the Field's Controller lifecycle.
`Field.tsx` keeps only: (a) prop destructuring + the `useField` call, (b) the
registration `useEffect`, (c) `return renderedField`. The hook reads
`useFormContext`/`useConfigContext`/`useGroupContext` internally and composes
`useConditions`/`usePropsEvaluation`/`useInferredInputs`/`useSubscriptions`.

### Success Criteria

- [ ] `useField.ts` is implemented (no throw); it owns Controller + parse/format
      + validation + props merge + forwardRef + template/host + conditions +
      setValue effect + watchers + subscriptions + disabled/visible/label.
- [ ] `Field.tsx` contains ONLY: prop destructure, `useFormContext()` for
      `registerField`/`unregisterField`, the registration `useEffect`, the
      `useField(params)` call, and `return renderedField` (+ the JSDoc +
      interfaces `FieldProps`/`FieldRenderAPI` which STAY exported unchanged).
- [ ] The registration `useEffect` (`registerField`/`unregisterField`, gated on
      `shouldRegister`) stays in `Field.tsx` (NOT in the hook) per the contract.
- [ ] The setValue effect's **ref pattern** (`setValueRef`/`getValuesRef`,
      no-infinite-loop guard) is preserved verbatim in the hook (PRD §7.1.1).
- [ ] **forwardRef delivery (§20.1/§20.4)** is preserved verbatim: `coreProps.forwardRef = field.ref`
      for components; host-element path translates `forwardRef`→`ref` and strips
      non-DOM props.
- [ ] `Field.test.tsx`, `Field.forwardRef.test.tsx`,
      `FieldForwardRef.acceptance.test.tsx`, `Field.subscriptionStability.test.tsx`,
      and `validation-report-fixes.test.tsx` ALL pass **unmodified**.
- [ ] `useField.test.tsx` is updated (no longer asserts a throw) and passes.
- [ ] `useField` + `UseFieldParams` + `UseFieldReturn` are exported from
      `packages/react/src/index.ts` (Hooks block).
- [ ] Mode A JSDoc on `useField` describes the real implementation (§1.3.3, §20);
      the S1 "STUB/not implemented" framing is removed.
- [ ] `pnpm typecheck` + `pnpm test` + `pnpm lint` + `pnpm build` +
      `pnpm test:coverage` (≥ 90%) all pass.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the exact line map
of Field.tsx's extractable blocks, the precise design decision for Controller
ownership (Design B/C below — the crux), the registration split (Field keeps
registration), the forwardRef delivery contract (§20.1/§20.4), the setValue ref
pattern (§7.1.1), the exact core-fn signatures + arg orders, the context-hook
return shapes, the Field.test.tsx behavior catalog (the parity gate), the
test/barrel conventions, and the verified validation commands. All cited below
with paths/lines. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/005_8f88e0ec4482/P2M1T1S2/research/research-notes.md
  why: |
    THIS TASK'S FIELD GUIDE. The line map of extractable Field.tsx blocks (§2),
    the KEY DESIGN DECISION (Controller ownership — Design B/C, §3), the
    registration split (§4), the parity contract "what MUST be preserved" (§5),
    the Field.test.tsx catalog (§6), the core-fn signatures (§7). READ THIS FIRST.

- docfile: plan/005_8f88e0ec4482/P2M1T1S1/PRP.md
  why: |
    The PREV step (complete). It landed the UseFieldParams/UseFieldReturn type
    contract + the throwing stub. S2 implements against that exact contract.
    Note S1's JSDoc says "STUB/not implemented" — S2 must REWRITE that JSDoc.

- docfile: plan/005_8f88e0ec4482/architecture/gap_analysis.md
  section: "G6: useField hook absent [STRUCTURAL — Medium]"
  why: The gap this task closes (decision: EXTRACT). S1 = contract; S2 = this.

- docfile: PRD.md §1.3.3 (h4.2)
  why: |
    The module contract: `hooks/useField` — "RHF Controller integration — Uses
    Core: transform/pipeline, validation/validate". The useField JSDoc cites it.

- docfile: PRD.md §5.3 Field Component (h3.18) + §5.3.2 Props Pipeline (h4.30) +
    §5.3.5 Value Transformation (h4.33) + §5.3.6 Change Handler (h4.34) +
    §5.3.7 Validation (h4.35) + §5.3.8 Template Rendering (h4.36)
  why: |
    The behaviors the hook owns. NOTE: PRD §5.3.2/§5.3.6 show `ref: field.ref`;
    the IMPLEMENTED behavior is forwardRef delivery (§20.1) — Field.tsx coreProps
    emits `forwardRef: field.ref`. Preserve the implemented behavior, not the
    stale PRD pseudo-code.

- docfile: PRD.md §20 Field ref delivery via forwardRef (h2.21, esp. §20.1 h3.95,
    §20.4 h3.98)
  why: |
    forwardRef delivery (NOT the legacy `ref` key) is current behavior. The
    host-element narrow exception (§20.4) translates forwardRef→ref for string
    components. Preserve BOTH paths verbatim. The useField JSDoc must say
    "forwardRef (§20.1)".

- docfile: PRD.md §7.1.1 setValue Application Mechanism (h4.48)
  why: The setValue effect's ref pattern (prevent infinite loops) — preserve it.

- file: packages/react/src/components/Field.tsx
  section: |
    The SOURCE of the logic to move. Line map (current): useFormContext/useConfig/
    useGroup (168-174), inputConfig memo (145-174 body), registration effect
    (178-184 → STAYS in Field), watchers state+effect (186-197), useInferredInputs
    +group merge+useSubscriptions (199-214), useConditions (216-223), setValue
    refs+effectiveSetValue+effect (225-275), usePropsEvaluation (277-288/309),
    disabled memo (312-357), visible memo (359-371), label memo (373-376),
    passSubscriptions watch+state (418-460), validationRules memo (462-502),
    handleChange (504-518), `if(!isVisible) return null` (521-523), `<Controller>`
    + render callback (527-698: format, stateInjection, mergeFieldProps, template/
    host/component, forwardRef, children render-prop).
  why: Ground truth. The extraction is a RELOCATION of these blocks (see Design
    Decision below for the one structural decision).
  pattern: COPY each block verbatim into useField; only the enclosing function +
    return shape change.
  gotcha: The Controller render callback applies `children` at Field.tsx:686-697
    (INSIDE the callback). Preserve that placement (Design B/C).

- file: packages/react/src/hooks/useField.ts
  section: current S1 stub (UseFieldParams L34, UseFieldReturn L97, throw L182-188)
  why: The TARGET. Replace the throw body; KEEP the two interfaces UNCHANGED
    (S1 locked them; the test-d file asserts their shape). Rewrite the JSDoc.

- file: packages/react/src/__tests__/useField.test.tsx
  why: |
    Currently asserts the stub THROWS (`/not implemented/i`). In S2 useField no
    longer throws → this test FAILS unless updated. Replace with a real test.

- file: packages/react/src/__typechecks__/useField.test-d.ts
  why: Stays valid (type equivalence). Do NOT modify (unless you change the
    UseFieldReturn field set — you must NOT).

- file: packages/react/src/index.ts
  section: Field export L55-56; Hooks export L72-78 (useFormState L72-73 is the
    value+type-pair model)
  why: Add `export { useField }` + `export type { UseFieldParams, UseFieldReturn }`
    in the Hooks block, mirroring useFormState's two-line pattern.

- file: packages/react/src/hooks/useConditions.ts (L62 signature),
    usePropsEvaluation.ts (L112 signature), useInferredInputs.ts (L52 signature),
    useSubscriptions.ts (L28 signature)
  why: The composed hooks the implementation calls — same call sites as Field.tsx.

- file: packages/react/src/context/FormContext.ts (FormContextValue),
    ConfigContext.ts (ConfigContextValue), GroupContext.ts (GroupContextValue,
    GroupState)
  why: Context return shapes the hook destructures. All 9 FormContextValue fields
    Field uses exist (config, formConfig, methods, registerField, unregisterField,
    registerWatcherSetter, unregisterWatcherSetter, changeField, setFieldValidating).

- file: packages/core/src/config/merge.ts (resolveInputConfig L107, mergeFieldProps
    L180), labels/resolve.ts (resolveLabel L77), transform/pipeline.ts (parse L56,
    format L119), validation/validate.ts (runValidator L151), validation/messages.ts
    (resolveErrorMessage L25)
  why: Core fn signatures + arg orders (see Implementation Patterns). The hook
    calls them exactly as Field.tsx does.

- file: packages/react/src/__tests__/validation-report-fixes.test.tsx
  why: The ONLY test covering provideState/passSubscriptions state injection.
    Must still pass after the move (the stateInjection logic moves verbatim).
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
├── components/
│   └── Field.tsx              # 702 lines; owns ALL logic inline (BEFORE)
├── hooks/
│   ├── useField.ts            # S1 THROWING STUB (188 lines) (BEFORE)
│   ├── useConditions.ts       # composed hook (call site preserved)
│   ├── usePropsEvaluation.ts  # composed hook (call site preserved)
│   ├── useInferredInputs.ts   # composed hook (call site preserved)
│   ├── useSubscriptions.ts    # composed hook (call site preserved)
│   └── useFormState.ts        # value+type barrel-export model
├── __tests__/
│   ├── Field.test.tsx                 # 2183 lines — parity gate (UNMODIFIED)
│   ├── Field.forwardRef.test.tsx      # forwardRef gate (UNMODIFIED)
│   ├── FieldForwardRef.acceptance.test.tsx # §20.6 acceptance (UNMODIFIED)
│   ├── Field.subscriptionStability.test.tsx # max-depth guard (UNMODIFIED)
│   ├── validation-report-fixes.test.tsx     # provideState/passSubs (UNMODIFIED)
│   └── useField.test.tsx              # S1 stub-throws test (→ MUST UPDATE)
├── __typechecks__/
│   └── useField.test-d.ts    # type equivalence (UNCHANGED)
└── index.ts                  # barrel (NO useField export YET)
```

### Desired Codebase tree with files to be modified

```bash
packages/react/src/hooks/useField.ts            # MODIFY: stub → real impl + JSDoc rewrite
packages/react/src/components/Field.tsx         # MODIFY: → thin wrapper (registration + return renderedField)
packages/react/src/__tests__/useField.test.tsx  # MODIFY: stub-throws test → real behavior test
packages/react/src/index.ts                     # MODIFY: add useField + UseFieldParams + UseFieldReturn exports
# (FieldProps / FieldRenderAPI STAY exported from Field.tsx unchanged; useField.test-d.ts UNCHANGED)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL — DESIGN DECISION (read research-notes §3): The hook owns the
// `<Controller>` element + its ENTIRE render callback (including the render-prop
// `children` application, identical to Field.tsx:686-697). The hook returns
// `renderedField` = the <Controller> element when visible, `null` when hidden.
// DO NOT switch to `useController` — it ALWAYS registers the field with RHF,
// but current behavior mounts the Controller ONLY when visible (Field.tsx:529
// `if(!isVisible) return null` is BEFORE <Controller> at :536), so hidden fields
// are NOT RHF-registered today. useController would change that → risk to
// conditionally-hidden-field validation/submit semantics. KEEP <Controller>.
// DO NOT capture fieldState/formState/finalProps via setState in the Controller
// callback (risks "Maximum update depth" — the exact regression
// Field.subscriptionStability.test.tsx guards). The render-prop children are
// applied INSIDE the Controller callback (where the live values are). This
// refines the work item's literal "Field applies children" wording — behavior
// preservation is the hard gate and takes precedence.

// CRITICAL — REGISTRATION STAYS IN FIELD (contract bullet b): the
// registerField/unregisterField useEffect stays in Field.tsx, NOT in the hook.
// The hook calls useFormContext() for everything ELSE (config, methods,
// changeField, setFieldValidating, registerWatcherSetter,
// unregisterWatcherSetter). Field ALSO calls useFormContext() for
// registerField/unregisterField. Two context reads is fine (idempotent).

// CRITICAL — setValue ref pattern (PRD §7.1.1): preserve setValueRef/getValuesRef
// (assigned every render, NOT in effect deps) + the `currentValue !== value`
// guard. Moving it carelessly → infinite-loop regression.

// CRITICAL — forwardRef (§20.1/§20.4): coreProps.forwardRef = field.ref (NOT
// ref). Host-element path (typeof component === "string") translates forwardRef
// → ref + strips non-DOM keys (formState, state, subsPropName). Component path
// is forwardRef-exclusive. Preserve verbatim.

// CRITICAL — UseFieldReturn field set is LOCKED by S1 + the test-d file: do NOT
// add/remove/rename fields (fieldState, renderedField, fieldProps, watchers,
// formState). Field.tsx's FieldRenderAPI STAYS exported unchanged (public type).

// CRITICAL (verbatimModuleSyntax: true): ALL type-only imports must be
// `import type`. value imports (useMemo, useCallback, useEffect, useState,
// useRef, createElement, Controller, useWatch, resolveInputConfig, mergeFieldProps,
// resolveLabel, parse, format, runValidator, resolveErrorMessage, makeProxyState,
// the 3 context hooks, the 4 composed hooks) are VALUES → `import { … }`.
// type imports (ReactNode, Ref, ControllerFieldState, UseFormStateReturn,
// FieldValues, FieldConfig, InputConfig, FormalityFieldComponentProps,
// CustomFieldState, WatcherSetterFn, UseFieldParams, UseFieldReturn) → `import type`.

// GOTCHA — useField.test.tsx MUST change: the S1 test asserts useField THROWS.
// After S2 it doesn't. Replace it; otherwise `pnpm test` fails on this file.

// GOTCHA — Field.tsx imports: after extraction, Field.tsx no longer needs
// Controller/useWatch/resolveInputConfig/mergeFieldProps/resolveLabel/parse/
// format/runValidator/resolveErrorMessage/makeProxyState/useConditions/
// usePropsEvaluation/useInferredInputs/useSubscriptions/useConfigContext/
// useGroupContext. It KEEPS: useFormContext (for register/unregister),
// useField, and the type imports for FieldProps/FieldRenderAPI. A stale import
// → eslint/TS error; clean them up.

// GOTCHA — ordering of hook calls: Field.tsx will call useFormContext() then
// useEffect (registration) then useField(). The hook internally calls its hooks
// in the SAME relative order Field.tsx does today (inputConfig memo → watchers
// effect → subscriptions → conditions → setValue effect → propsEval → disabled
// memo → visible memo → label memo → passSubs → validationRules → handleChange
// → Controller). Reordering hook calls is allowed as long as it's unconditional
// and stable across renders, but keeping the order minimizes diff/risk.

// GOTCHA — `methods` typing (Field.tsx:290 comment): methods comes from the
// un-parameterized useFormContext() → UseFormReturn<FieldValues>; the setValue
// name param is FieldPath<FieldValues>===string at runtime; cast
// `name as string` for RHF's conditional type (P1.M1.T1.S2 gotcha). Preserve.
```

## Implementation Blueprint

### 🔑 Design Decision: Controller ownership (READ THIS FIRST)

The hook owns the **`<Controller>` element and its entire render callback**
(including the render-prop `children` application — identical to the current
`Field.tsx:686-697`). The hook returns `renderedField` = the `<Controller>`
element when visible, `null` when hidden. `Field.tsx` is a thin wrapper.

**Why this (and not the literal "Field applies children"):** `fieldState` /
`formState` / `finalProps` exist ONLY inside the Controller render callback.
Exposing them at the hook's top-level return — which the literal reading would
require — demands either `useController` (always RHF-registers, breaking the
"hidden fields don't mount a Controller" invariant at `Field.tsx:529→536`) or
state-capture during the Controller render (the "Maximum update depth" pattern
`Field.subscriptionStability.test.tsx` exists to prevent). Keeping the
Controller + children-application together inside the hook is a **pure
relocation** of existing, tested code → lowest behavioral risk. The work item's
"Field renders renderedField or children render-prop" is satisfied: Field
renders `renderedField` (the Controller), which internally applies the
render-prop. **Behavior preservation is the hard gate and takes precedence over
the literal bullet wording.** (Full rationale: research-notes §3.)

`UseFieldReturn` still returns `fieldState` / `fieldProps` / `watchers` /
`formState` for the public type contract (enforced by
`__typechecks__/useField.test-d.ts`). `watchers` is owned by the hook;
`fieldState`/`formState`/`fieldProps` are captured from the Controller render
callback into a ref so the return honors the contract (Field does not consume
them; the render-prop children use the live values inside the callback).

### Data models and structure

No new data models. `UseFieldParams` / `UseFieldReturn` are **unchanged** (S1
locked them; the test-d file asserts `UseFieldReturn` ↔ `FieldRenderAPI`).
`FieldProps` / `FieldRenderAPI` in `Field.tsx` stay exported & unchanged.

```typescript
// useField.ts — interfaces UNCHANGED (S1). Only the function body + JSDoc change.
export interface UseFieldParams<TName extends string = string> { /* S1 fields */ }
export interface UseFieldReturn { /* S1 fields: fieldState, renderedField, fieldProps, watchers, formState */ }
export function useField(params: UseFieldParams): UseFieldReturn { /* REAL IMPL */ }
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — read the field guide + the source line map
  - READ: plan/.../P2M1T1S2/research/research-notes.md   (FIRST — esp. §2 line map + §3 design decision)
  - READ: packages/react/src/components/Field.tsx         (the logic to move; 702 lines)
  - READ: packages/react/src/hooks/useField.ts            (the S1 stub target — interfaces stay)
  - CONFIRM the design decision (§ above): hook owns <Controller> + its callback (incl. children);
    Field is thin; registration stays in Field; NOT useController; NO setState-capture.

Task 2: IMPLEMENT packages/react/src/hooks/useField.ts  (THE deliverable)
  - KEEP the UseFieldParams + UseFieldReturn interfaces EXACTLY as S1 (do not touch fields).
  - REPLACE the throw body with the real implementation, RELOCATING each block from Field.tsx:
    2a. CONTEXT READS: const { config, formConfig, methods, changeField,
        setFieldValidating, registerWatcherSetter, unregisterWatcherSetter }
        = useFormContext(); const providerConfig = useConfigContext();
        const groupContext = useGroupContext();  (Field.tsx:168-174)
        NOTE: registerField/unregisterField are NOT needed here (Field keeps registration).
    2b. PARAM DESTRUCTURE: from params — name, type: typeProp, disabled: disabledProp,
        hidden: hiddenProp, children, shouldRegister (unused here — Field owns registration),
        inputConfig: inputConfigProp, ...restProps.  (mirrors Field.tsx:158-167)
    2c. inputConfig memo (Field.tsx:145-174) — resolveInputConfig + provider/form merge +
        inputConfigProp merge. VERBATIM.
    2d. watchers state + registerWatcherSetter effect (Field.tsx:186-197) — VERBATIM (hook owns watchers).
    2e. inferredSubscriptions = useInferredInputs({...}); allSubscriptions memo (merge group);
        useSubscriptions(name, allSubscriptions).  (Field.tsx:199-214) VERBATIM.
    2f. conditionResult = useConditions({...});  (Field.tsx:216-223) VERBATIM.
    2g. setValue refs + effectiveSetValue memo + setValue effect (Field.tsx:225-275) VERBATIM
        — PRESERVE the ref pattern (setValueRef/getValuesRef assigned every render,
        NOT in deps) + the `currentValue !== value` guard (PRD §7.1.1).
    2h. usePropsEvaluation({...}) (Field.tsx:309-318) VERBATIM.
    2i. isDisabled memo (Field.tsx:312-357) VERBATIM — full resolution order.
    2j. isVisible memo (Field.tsx:359-371) VERBATIM.
    2k. label memo = resolveLabel(name, fieldConfig, fieldSelectProps, restProps) (Field.tsx:373-376).
    2l. passSubscriptions: provideStateEnabled/passSubscriptionsEnabled, subscribedWatchNames
        memo, useWatch, subscribedState memo (Field.tsx:~395-460) VERBATIM.
    2m. validationRules memo (runValidator/resolveErrorMessage, field then type) (Field.tsx:462-502) VERBATIM.
    2n. handleChange (parse + onChange + changeField) (Field.tsx:504-518) VERBATIM.
    2o. renderedField: if (!isVisible) → null; else → the <Controller control={methods.control}
        name={name} rules={validationRules} render={({field,fieldState,formState}) => {...}} />
        element (Field.tsx:527-698) VERBATIM — INCLUDING:
          - format(field.value, inputConfig.formatter, providerConfig.formatters)
          - stateInjection (provideState/passSubscriptions; formState to plain components
            ONLY when opted-in)
          - mergeFieldProps({...9 layers..., coreProps:{ name,label,disabled:isDisabled,
            error:fieldState.error?.message, [inputConfig.inputFieldProp??"value"]:formattedValue,
            onChange:handleChange(field.onChange), onBlur:field.onBlur, forwardRef:field.ref,
            ...stateInjection }})   ← forwardRef (§20.1), NOT ref
          - template/host/component resolution (Field.tsx:~620-684): template path; host path
            (typeof component==="string" → translate forwardRef→ref + strip non-DOM keys);
            component path (<Component {...finalProps} />)
          - children render-prop (typeof children==="function" → children({fieldState,
            renderedField, fieldProps:finalProps, watchers, formState}) wrapped in <>) (Field.tsx:686-697)
    2p. RETURN: { fieldState, renderedField, fieldProps, watchers, formState }.
        For fieldState/formState/fieldProps when visible, capture from the Controller callback
        into a ref (best-effort, for contract honesty + direct-hook consumers); watchers is real.
        Field.tsx only consumes renderedField, so these need not be reactive for the Field tests.
  - REWRITE the JSDoc: remove ALL "STUB / not implemented / will compose" wording; describe the
    real implementation; cite PRD §1.3.3 (owns RHF Controller integration, uses transform/pipeline
    + validation/validate) and §20 (forwardRef delivery contract). Keep Mode A quality.

Task 3: REFACTOR packages/react/src/components/Field.tsx  → thin wrapper
  - KEEP the file header, FieldProps<TName> interface, FieldRenderAPI interface, and the Field
    JSDoc (interfaces STAY exported — public types; index.ts re-exports them).
  - REPLACE the Field function body with:
      const { registerField, unregisterField } = useFormContext();
      useEffect(() => { if (shouldRegister) { registerField(name);
        return () => unregisterField(name); } },
        [name, shouldRegister, registerField, unregisterField]);
      const { renderedField } = useField({ name, type: typeProp, disabled: disabledProp,
        hidden: hiddenProp, children, shouldRegister, inputConfig: inputConfigProp, ...restProps });
      return renderedField;
  - REMOVE the now-unused imports (Controller, useWatch, resolveInputConfig, mergeFieldProps,
    resolveLabel, parse, format, runValidator, resolveErrorMessage, makeProxyState,
    useConditions, usePropsEvaluation, useInferredInputs, useSubscriptions, useConfigContext,
    useGroupContext, and any now-unused react imports like useMemo/useCallback/createElement/Ref).
    KEEP: useEffect, useFormContext, useField, + type imports (FieldProps, FieldRenderAPI,
    ReactNode, UseFieldParams if threading the generic). Fix TS/eslint on the cleaned imports.
  - PRESERVE the generic: export function Field<TName extends string = string>(props: FieldProps<TName>)

Task 4: MODIFY packages/react/src/__tests__/useField.test.tsx  (stub test → real test)
  - The S1 test asserts useField THROWS → now false. REPLACE it.
  - Minimal real test: render useField through a <FormalityProvider><Form> wrapper via renderHook
    (with an inline FormContext.Provider-free approach using the real <Form>), assert it returns an
    object with renderedField defined (ReactElement). Mirror the wrapper pattern from
    __tests__/useSubscriptions.test.tsx (inline provider) — but useField needs a full <Form>, so wrap
    in <FormalityProvider inputs={...}><Form config={{email:{type:"textField"}}}>…</Form></FormalityProvider>
    and call useField inside a child. (Alternatively, test useField indirectly by asserting the
    Field tests still pass — but a direct smoke test is preferred to keep the 90% coverage gate
    green on the hook's branches.)
  - NAMING: keep the file useField.test.tsx; rename the describe to drop "stub".

Task 5: MODIFY packages/react/src/index.ts  (export useField)
  - In the Hooks block (after line 78, `export { useSubscriptions } …`), add:
      export { useField } from "./hooks/useField";
      export type { UseFieldParams, UseFieldReturn } from "./hooks/useField";
    (mirrors the useFormState L72-73 value+type-pair pattern).

Task 6: VERIFY — behavior parity + all gates green
  - 6a. PARITY: pnpm test -- packages/react/src/__tests__/Field.test.tsx \
        packages/react/src/__tests__/Field.forwardRef.test.tsx \
        packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx \
        packages/react/src/__tests__/Field.subscriptionStability.test.tsx \
        packages/react/src/__tests__/validation-report-fixes.test.tsx
       ALL PASS UNMODIFIED.
  - 6b. NEW TEST: pnpm test -- packages/react/src/__tests__/useField.test.tsx passes.
  - 6c. FULL: pnpm typecheck && pnpm test && pnpm lint && pnpm build && pnpm test:coverage (≥90%).
  - 6d. DIFF: Field.tsx is thin; useField.ts is real; index.ts exports useField; useField.test.tsx updated.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — useField return shape (Design B/C). The Controller element IS renderedField.
export function useField(params: UseFieldParams): UseFieldReturn {
  // ... 2a–2n: all the relocated hooks/memos/effects (verbatim from Field.tsx) ...

  const renderedField: ReactNode = isVisible ? (
    <Controller control={methods.control} name={name} rules={validationRules}
      render={({ field, fieldState, formState }) => {
        const formattedValue = format(field.value, inputConfig.formatter, providerConfig.formatters);
        // ... stateInjection (provideState/passSubscriptions) — verbatim ...
        const finalProps = mergeFieldProps({
          // ... 8 layers verbatim ...
          coreProps: {
            name, label, disabled: isDisabled, error: fieldState.error?.message,
            [inputConfig.inputFieldProp ?? "value"]: formattedValue,
            onChange: handleChange(field.onChange), onBlur: field.onBlur,
            forwardRef: field.ref,   // §20.1 — NOT ref
            ...stateInjection,
          },
        });
        // ... template / host (forwardRef→ref) / component resolution — verbatim ...
        if (typeof children === "function") {
          return <>{children({ fieldState, renderedField, fieldProps: finalProps, watchers, formState })}</>;
        }
        return renderedFieldEl;
      }}
    />
  ) : null;

  return { fieldState, renderedField, fieldProps, watchers, formState };
}

// PATTERN — thin Field.tsx
export function Field<TName extends string = string>({
  name, type: typeProp, disabled: disabledProp, hidden: hiddenProp,
  children, shouldRegister = true, inputConfig: inputConfigProp, ...restProps
}: FieldProps<TName>): JSX.Element | null {
  const { registerField, unregisterField } = useFormContext();
  useEffect(() => {
    if (shouldRegister) { registerField(name); return () => unregisterField(name); }
  }, [name, shouldRegister, registerField, unregisterField]);
  const { renderedField } = useField({
    name, type: typeProp, disabled: disabledProp, hidden: hiddenProp, children,
    shouldRegister, inputConfig: inputConfigProp, ...restProps,
  });
  return renderedField;
}

// CRITICAL — setValue effect ref pattern (PRD §7.1.1) — preserve verbatim in the hook:
const setValueRef = useRef(methods.setValue); setValueRef.current = methods.setValue;
const getValuesRef = useRef(methods.getValues); getValuesRef.current = methods.getValues;
// ... effectiveSetValue memo ...
useEffect(() => {
  if (effectiveSetValue.hasCondition && effectiveSetValue.value !== undefined) {
    const currentValue = getValuesRef.current(name);
    if (currentValue !== effectiveSetValue.value) {   // ← prevents infinite loop
      setValueRef.current(name as string, effectiveSetValue.value,
        { shouldValidate: true, shouldDirty: true, shouldTouch: false });
    }
  }
}, [effectiveSetValue.hasCondition, effectiveSetValue.value, name]);

// CRITICAL — host-element forwardRef→ref translation (§20.4) — preserve verbatim:
if (isHostComponent) {
  const nonDomKeys = new Set(["forwardRef", "formState", "state", subsPropName]);
  const strippedHostProps = {};
  for (const [k, v] of Object.entries(finalProps)) if (!nonDomKeys.has(k)) strippedHostProps[k] = v;
  renderedFieldEl = createElement(inputConfig.component as string,
    { ...strippedHostProps, ref: (finalProps).forwardRef as Ref<HTMLElement> });
}

// CRITICAL — core fn arg orders (verified): parse(newValue, inputConfig.parser,
// providerConfig.parsers); format(field.value, inputConfig.formatter,
// providerConfig.formatters); runValidator(spec, value, methods.getValues(),
// providerConfig.validators); resolveErrorMessage(result, providerConfig.errorMessages);
// resolveLabel(name, fieldConfig, fieldSelectProps, restProps).
```

### Integration Points

```yaml
FILES MODIFIED (this task):
  - packages/react/src/hooks/useField.ts            # stub → real impl + JSDoc rewrite
  - packages/react/src/components/Field.tsx         # → thin wrapper (registration + return renderedField)
  - packages/react/src/__tests__/useField.test.tsx  # stub-throws test → real smoke test
  - packages/react/src/index.ts                     # add useField + UseFieldParams + UseFieldReturn

PUBLIC API ADDITION:
  - barrel now exports useField (value) + UseFieldParams, UseFieldReturn (types).
    This is a NEW public export per the work item ([Mode A] docs in JSDoc).

UNCHANGED (do NOT touch):
  - packages/react/src/__typechecks__/useField.test-d.ts  # type equivalence (still valid)
  - FieldProps / FieldRenderAPI in Field.tsx              # stay exported unchanged
  - all Field*.test.tsx + validation-report-fixes.test.tsx # pass UNMODIFIED
  - overlays.ts (sibling P2.M2.T1.S1 owns it); useFieldDisabledState.ts (sibling P2.M1.T2.S1 owns it)

NO DATABASE / CONFIG / ROUTES — pure React/TypeScript refactor in packages/react.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing useField.ts + Field.tsx — format + lint:
pnpm exec prettier --write packages/react/src/hooks/useField.ts \
  packages/react/src/components/Field.tsx \
  packages/react/src/__tests__/useField.test.tsx packages/react/src/index.ts

# verbatimModuleSyntax — type-only imports must be `import type`:
grep -nE "^import \{" packages/react/src/hooks/useField.ts   # value imports only here
grep -nE "^import type \{" packages/react/src/hooks/useField.ts  # type imports only here
# (a value like Controller/useMemo IS a value import; ReactNode/ControllerFieldState IS type)

# Field.tsx should now import FEWER modules (Controller/useWatch/mergeFieldProps/etc. gone):
grep -nE "^import" packages/react/src/components/Field.tsx
# Expected: react (useEffect, type ReactNode), react-hook-form (nothing — or only types),
# ../context/FormContext (useFormContext), ../hooks/useField, ../overlays (type), ../types maybe.
# NO Controller, useWatch, resolveInputConfig, mergeFieldProps, resolveLabel, parse, format,
# runValidator, resolveErrorMessage, makeProxyState, useConditions/usePropsEvaluation/
# useInferredInputs/useSubscriptions, useConfigContext, useGroupContext.

pnpm lint    # Expected: zero errors. Fix unused imports / rules-of-hooks violations.
```

### Level 2: Unit Tests (Component Validation)

```bash
# THE PARITY GATE — these MUST pass UNMODIFIED (the hard success criterion):
pnpm test -- packages/react/src/__tests__/Field.test.tsx \
              packages/react/src/__tests__/Field.forwardRef.test.tsx \
              packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx \
              packages/react/src/__tests__/Field.subscriptionStability.test.tsx \
              packages/react/src/__tests__/validation-report-fixes.test.tsx
# Expected: ALL green, unchanged test count. If ANY fails, the extraction changed behavior —
# diff the relocated block against Field.tsx's original and fix the divergence.

# The updated useField smoke test:
pnpm test -- packages/react/src/__tests__/useField.test.tsx
# Expected: passes (no longer asserts a throw).

# Full suite — must stay green:
pnpm test
# Expected: existing ~1003 tests pass (the useField.test.tsx count is unchanged or +smoke).
```

### Level 3: Type Checking & Build (System Validation)

```bash
# tsc --build validates useField.ts, the refactored Field.tsx, AND the test-d equivalence file:
pnpm typecheck
# Expected: zero errors. If UseFieldReturn drifts from FieldRenderAPI, the test-d file errors.

# Build (tsup) — both packages must compile & emit:
pnpm build
# Expected: @formality-ui/core + @formality-ui/react build cleanly (useField is now a real export).
```

### Level 4: Coverage Gate & Export Verification (final)

```bash
# 90% hard gate (PRD §1.3.7) — the relocated logic is now in useField.ts; coverage must hold:
pnpm test:coverage
# Expected: statements/branches/functions/lines all ≥ 90% across packages/core + packages/react.

# Export verification:
node -e "import('@formality-ui/react').then(m => { console.log('useField:', typeof m.useField);
  console.log('UseFieldParams:', typeof m.UseFieldParams); console.log('Field:', typeof m.Field); })" 2>/dev/null \
  || grep -n "useField\|UseFieldParams\|UseFieldReturn" packages/react/src/index.ts
# Expected: useField exported (function); UseFieldParams/UseFieldReturn exported (types).

# Diff sanity — Field.tsx is thin, useField.ts is real:
git diff --stat
# Expected: useField.ts (grew), Field.tsx (shrank dramatically), index.ts (+2 lines),
# useField.test.tsx (updated). No OTHER react source files changed.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: prettier clean; `import type` vs `import` correct in useField.ts; Field.tsx
      unused imports removed; `pnpm lint` clean.
- [ ] Level 2: **Field.test.tsx + Field.forwardRef.test.tsx + FieldForwardRef.acceptance.test.tsx
      + Field.subscriptionStability.test.tsx + validation-report-fixes.test.tsx ALL pass
      UNMODIFIED**; updated useField.test.tsx passes; `pnpm test` green.
- [ ] Level 3: `pnpm typecheck` clean (incl. test-d equivalence); `pnpm build` clean.
- [ ] Level 4: `pnpm test:coverage` ≥ 90% on all metrics; `useField` + `UseFieldParams` +
      `UseFieldReturn` exported from the barrel.

### Feature Validation

- [ ] `useField` is implemented (no throw) and owns the entire Controller lifecycle.
- [ ] `Field.tsx` is a thin wrapper: `useFormContext()` for register/unregister + registration
      `useEffect` + `useField(params)` + `return renderedField`.
- [ ] Registration `useEffect` stays in Field.tsx (NOT in the hook).
- [ ] setValue ref pattern (§7.1.1) preserved (no infinite-loop regression).
- [ ] forwardRef delivery (§20.1/§20.4) preserved: `forwardRef: field.ref` + host-element
      forwardRef→ref translation.
- [ ] `UseFieldParams` / `UseFieldReturn` field sets UNCHANGED (test-d file still passes).
- [ ] `FieldProps` / `FieldRenderAPI` stay exported unchanged from Field.tsx.

### Code Quality Validation

- [ ] Relocated blocks are verbatim (no logic drift) — diffable against original Field.tsx.
- [ ] JSDoc rewritten: no "STUB/not implemented" wording; cites §1.3.3 + §20 (Mode A).
- [ ] `useField` follows the hook-file header convention (`// @formality-ui/react - useField Hook`).
- [ ] Barrel export mirrors useFormState's value+type-pair pattern.
- [ ] Anti-patterns avoided (check against Anti-Patterns section).

### Documentation & Deployment

- [ ] useField JSDoc self-documents the §1.3.3 contract + forwardRef delivery (§20).
- [ ] No README/CHANGELOG required (changeset-level docs sync is P3.M2).

---

## Anti-Patterns to Avoid

- ❌ Don't switch to `useController`. It always RHF-registers the field; current behavior mounts
  the `<Controller>` ONLY when visible (`Field.tsx:529` before `:536`), so hidden fields are NOT
  RHF-registered today. useController changes that → risk to conditionally-hidden-field
  validation/submit. Keep `<Controller>`.
- ❌ Don't capture `fieldState`/`formState`/`finalProps` into React state from inside the
  Controller render callback. setState-during-Controller-render is the "Maximum update depth"
  pattern that `Field.subscriptionStability.test.tsx` exists to prevent. Apply the render-prop
  `children` INSIDE the Controller callback (where the live values are).
- ❌ Don't move the registration `useEffect` (`registerField`/`unregisterField`) into the hook.
  The contract says Field handles registration. Keep it in Field.tsx.
- ❌ Don't reorder/rewrite the relocated logic. This is a RELOCATION (verbatim move) of tested
  code. Drift = behavior change = test failure. Copy each block exactly.
- ❌ Don't drop the setValue ref pattern (`setValueRef`/`getValuesRef` assigned every render, not
  in deps) or the `currentValue !== value` guard. That's PRD §7.1.1 — removing it reintroduces the
  infinite-loop bug.
- ❌ Don't change forwardRef delivery. `coreProps.forwardRef = field.ref` (NOT `ref`); host-element
  path translates forwardRef→ref + strips non-DOM keys. The forwardRef tests are strict.
- ❌ Don't modify `UseFieldParams`/`UseFieldReturn` field sets. S1 locked them and the test-d file
  enforces `UseFieldReturn` ↔ `FieldRenderAPI`. Don't touch `FieldRenderAPI`/`FieldProps` either.
- ❌ Don't leave the S1 `useField.test.tsx` asserting a throw — useField no longer throws; that
  test will fail. Replace it with a real smoke test.
- ❌ Don't forget to clean Field.tsx's now-unused imports (Controller, useWatch,
  resolveInputConfig, mergeFieldProps, resolveLabel, parse, format, runValidator,
  resolveErrorMessage, makeProxyState, useConditions, usePropsEvaluation, useInferredInputs,
  useSubscriptions, useConfigContext, useGroupContext, and unused react hooks). Stale imports
  fail lint/typecheck.
- ❌ Don't forget to export `useField` + `UseFieldParams` + `UseFieldReturn` from index.ts.
- ❌ Don't use bare `import { Type }` for type-only imports (`verbatimModuleSyntax: true`).
- ❌ Don't touch `overlays.ts` (sibling P2.M2.T1.S1) or `useFieldDisabledState.ts`
  (sibling P2.M1.T2.S1) or any `Field*.test.tsx` file.

---

**Confidence Score: 8/10** for one-pass implementation success.

Rationale:
- This is a **behavior-preserving RELOCATION** of tested logic — the safest kind of refactor.
  The line map (research-notes §2) maps every block to move; the Design Decision (B/C) keeps the
  Controller + its callback intact so the "Maximum update depth" / forwardRef / hidden-field /
  render-prop behaviors are untouched.
- The biggest risks are neutralized by explicit guards: (1) useController is FORBIDDEN (hidden-field
  invariant); (2) state-capture is FORBIDDEN (stability test); (3) the setValue ref pattern +
  forwardRef delivery are called out as must-preserve; (4) the 5 parity test files are the
  non-negotiable gate.
- The 2-point risk premium is for: the design-decision refinement (children applied inside the
  hook's Controller callback, not by Field — a documented deviation from the literal work-item
  wording, justified by behavior preservation), and the JSDoc rewrite (subjective tone).
- The `-2` from 10: the extraction touches the highest-risk file in the repo (Field.tsx), and a
  subtle hook-ordering or stale-ref/import issue could cause a flaky parity failure that requires
  careful diffing to resolve. The PRP mitigates this with the verbatim-relocation mandate + the
  5-file parity gate, but the inherent risk of moving 270 lines keeps it at 8.
