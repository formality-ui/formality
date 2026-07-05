name: "P1.M2.T1.S1 — NEW useFormState.test.tsx (currently 0% covered)"
description: |

---

## Goal

**Feature Goal**: Create `packages/react/src/__tests__/useFormState.test.tsx`
that takes `packages/react/src/hooks/useFormState.ts` from **0% → ~100%**
coverage across statements, branches, and functions. This is the single
highest-leverage backfill target in the R1 coverage plan (the biggest
statement drag, ~60 uncovered statements, 1 uncovered branch, 1 uncovered
function) and is step #1 in `coverage_gaps.md` §5.

**Deliverable**:

1. One new file: `packages/react/src/__tests__/useFormState.test.tsx`.
2. All five contract scenarios from the item description covered (single name,
   multiple names, empty-name-array early return, lazy `record` getter, and
   the outside-`<Form>` try/catch fallback).
3. No source changes. No new deps. No docs (test-only, per item OUTPUT §5).

**Success Definition**:

1. `pnpm test` is green (the new file passes; no regressions).
2. `pnpm test:coverage` shows `packages/react/src/hooks/useFormState.ts` at
   **≥ 95% statements, 100% functions, ≥ 80% branches** (ideally 100% all).
3. Repo-wide metrics improve by **≈ +57 statements / +1 branch / +1 function**
   (per `coverage_gaps.md` §5 step 1 estimate). This alone does NOT clear the
   90% gate — sibling tasks (P1.M2.T1.S2, S3, S4, S5) finish the job — but it
   is the largest single contributor and unblocks them.
4. The test follows the exact conventions of `useFieldDisabledState.test.tsx`
   and `makeProxyState.test.tsx` (renderHook + FormalityProvider/Form wrapper,
   vitest `describe/it/expect`).

## Why

- **Coverage gate (PRD §1.3.7 / Appendix B h3.95).** The repo enforces **≥ 90%**
  on statements, branches, functions, lines via `vitest` v8 thresholds.
  Pre-backfill the repo is at 87.02% statements / 88.26% branches — **failing**.
  `useFormState.ts` at 0% is the single worst offender and the cheapest win.
- **Performance contract (PRD §2.1 / Appendix B h3.96).** The hook is the
  framework's **"Custom useFormState hook wrapping RHF's useFormState"** line
  item. Its lazy `record` getter and proxy-wrapped field states are the
  performance guarantees the PRD makes; this test **proves them at runtime**
  (one of the h3.96 checklist items: _"Testing: Verify Object.defineProperty
  creates getters"_).
- **Risk reduction.** The hook has subtle branches (single-vs-array useWatch
  return, try/catch null-context fallback, empty-array early return) that are
  currently exercised only indirectly via Form/Field integration. A focused
  unit test pins each branch.

## What

A new vitest test file that mounts the `useFormState` hook via
`@testing-library/react`'s `renderHook` inside a Formality `<Form>` wrapper
(reusing the harness from `Form.test.tsx` / `useFieldDisabledState.test.tsx`),
and asserts each behavior branch of `packages/react/src/hooks/useFormState.ts`.

### Success Criteria

- [ ] New file `packages/react/src/__tests__/useFormState.test.tsx` exists and
      imports the hook via `import { useFormState } from "../hooks/useFormState"`.
- [ ] Test: single watched name (`{ name: "x" }`) → `result.current.fields.x`
      exists and `.value` reflects the record/form default.
- [ ] Test: multiple watched names (`{ name: ["a", "b"] }`) → both keys present
      in `fields` with correct values.
- [ ] Test: empty name array (`{ name: [] }`) → `fields` is `{}` (early-return
      path at the `if (fieldNames.length === 0) return result;` branch).
- [ ] Test: `record` is a **lazy getter** —
      `Object.getOwnPropertyDescriptor(result.current, "record").get` is a
      function; accessing `result.current.record` returns the object passed as
      `record={...}` to `<Form>` (or `{}` outside a Form).
- [ ] Test: used **outside** a Formality `<Form>` (but inside an RHF
      `FormProvider`) → the try/catch swallows the thrown error, hook still
      returns a valid `IsolatedFormState`, and `record` getter returns `{}`.
- [ ] `pnpm test:coverage` reports `useFormState.ts` ≥ 95% statements.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the hook source,
the two context systems it bridges (RHF's `useFormContext` vs Formality's
`FormContext`), the existing test-harness convention, the proxy/getter
contract from `makeProxyState`, and the type shapes. All are cited below with
exact paths. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ - include in context window before implementing
- url: https://react-hook-form.com/docs/usewatch
  why: useWatch return-shape differs by `name` arity — single string returns the
        value directly; array returns an array-of-values. The hook's
        `values = fieldNames.length === 1 ? [watchedValues] : watchedValues`
        branch depends on this exact contract.
  critical: |
    useWatch({ name: 'single' }) → returns the VALUE (e.g. "John").
    useWatch({ name: ['a','b'] }) → returns [valueA, valueB].
    Getting this wrong makes the multi-name test assert against the wrong shape.

- url: https://react-hook-form.com/docs/useformcontext
  why: useFormState calls RHF's useFormContext() FIRST (un-guarded). To exercise
        the Formality try/catch branch you MUST still provide an RHF context
        (FormProvider + useForm), otherwise rhfContext.control throws and the
        hook crashes before reaching the try/catch.
  critical: |
    The outside-Form test needs: <FormProvider {...useForm()}> WITHOUT a
    Formality <Form>/<FormalityProvider>. That makes useRHFFormContext() return
    valid methods while useFormalityFormContext() throws (caught → null).

- file: packages/react/src/hooks/useFormState.ts
  why: The System Under Test. 0% covered. Whole body (lines ~55–141) uncovered.
  pattern: |
    Branches to cover:
      (1) useMemo fieldNames: Array.isArray ? array : [name]  (single vs array)
      (2) useWatch with single vs multi name
      (3) fields useMemo: `if (fieldNames.length === 0) return result;`  ← branch
      (4) values = length===1 ? [watchedValues] : watchedValues   ← branch
      (5) try { useFormalityFormContext() } catch { /* null */ }   ← branch
      (6) Object.defineProperty(base, "record", { get: ... })  ← getter
  gotcha: |
    `useFormalityFormContext()` (from ../context/FormContext) THROWS a real
    Error when used outside <Form> (see FormContext.ts). The hook wraps it in
    try/catch specifically to degrade to record:{}. The outside-Form test must
    hit this without first crashing on `rhfContext.control`.

- file: packages/react/src/__tests__/useFieldDisabledState.test.tsx
  why: EXACT pattern to follow for a renderHook hook test in this repo.
  pattern: |
    - `import { renderHook } from "@testing-library/react"`
    - A `createWrapper(record, config)` factory returning
      ({children}) => <FormalityProvider inputs={testInputs}><Form config record>{children}</Form></FormalityProvider>
    - `const { result } = renderHook(() => useHook(...), { wrapper })`
    - testInputs = { textField: { component: (...) => <input.../>, defaultValue: "" } }
  gotcha: The wrapper closure must accept the per-test record/config; don't
          hard-code them.

- file: packages/react/src/__tests__/makeProxyState.test.ts
  why: Canonical assertion pattern for "is this a getter?" — needed for the
        lazy `record` property test.
  pattern: |
    const desc = Object.getOwnPropertyDescriptor(obj, "key");
    expect(desc?.get).toBeTypeOf("function");
    expect(desc?.set).toBeUndefined();
    expect(desc?.enumervable / configurable)...
    expect(desc?.value).toBeUndefined();  // getter, not data prop

- file: packages/react/src/__tests__/Form.test.tsx
  why: Source of the TestInput/TestSwitch components + FormalityProvider+Form
        mount shape. Copy the `testInputs` Record<string, InputConfig> shape
        verbatim (with forwardRef) so RHF register works.
  pattern: |
    const TestInput = forwardRef<HTMLInputElement, TestInputProps>(...)
    const testInputs: Record<string, InputConfig> = {
      textField: { component: TestInput, defaultValue: "" },
      switch:    { component: TestSwitch, defaultValue: false },
    };

- file: packages/react/src/context/FormContext.ts
  why: Confirms useFormalityFormContext() THROWS on null context (line ~165).
        This is WHY the hook has a try/catch. Drives the outside-Form test.
  gotcha: FormContextValue.record is optional (`record?:`). When undefined,
          `formalityContext?.record ?? {}` returns {}.

- file: packages/react/src/types.ts
  why: Defines IsolatedFormState (line ~85) and CustomFieldState (line ~38)
        — the return type contract to assert against.
  pattern: |
    IsolatedFormState has: fields, record, isDirty, isTouched, isValid,
    isSubmitting, errors, touchedFields, dirtyFields, defaultValues.
    CustomFieldState has: value, isTouched, isDirty, isValidating, error?, invalid.
    The hook hard-codes isTouched:false, isDirty:false, error:undefined,
    invalid:false, isValidating:false on each field proxy.

- docfile: plan/002_78ea74508dd8/architecture/coverage_gaps.md
  section: §3 (uncovered regions), §4 (files lacking tests), §5 step 1
  why: Authoritative gap analysis. useFormState.ts listed as "❌ NONE (0%) —
        top priority". Confirms the +57 stmt / +1 branch / +1 func target.
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
├── hooks/
│   ├── useFormState.ts          # ← SUT, 0% covered
│   ├── useFieldDisabledState.ts
│   ├── useSubscriptions.ts
│   ├── useInferredInputs.ts
│   ├── usePropsEvaluation.ts
│   └── useConditions.ts
├── context/
│   └── FormContext.ts           # useFormalityFormContext() — throws outside <Form>
├── utils/
│   └── makeProxyState.ts        # getter pattern reused by the hook
├── components/
│   ├── Form.tsx
│   └── FormalityProvider.tsx
├── types.ts                     # IsolatedFormState, CustomFieldState
└── __tests__/
    ├── setup.ts                 # afterEach(cleanup) + jest-dom
    ├── useFieldDisabledState.test.tsx   # ← renderHook template to copy
    ├── makeProxyState.test.ts           # ← getter-assertion template
    ├── Form.test.tsx                    # ← TestInput/FormalityProvider harness
    └── useFormState.test.tsx            # ← NEW (this task)
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/__tests__/
└── useFormState.test.tsx        # NEW — sole deliverable
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: useFormState bridges TWO separate contexts.
//   1. RHF's useRHFFormContext()  (react-hook-form) — must be provided or
//      rhfContext.control throws BEFORE the try/catch. Provide via <Form>
//      (normal path) OR <FormProvider {...useForm()}> (outside-Form path).
//   2. Formality's useFormalityFormContext() — THROWS when outside <Form>.
//      The hook wraps it in try/catch → record degrades to {}. This is the
//      branch the outside-Form test must exercise.

// CRITICAL: useWatch return shape depends on name arity.
//   name: "x"      → returns the value (not wrapped)
//   name: ["a","b"] → returns [valA, valB]
//   The hook normalizes: values = length===1 ? [watchedValues] : watchedValues.

// GOTCHA: renderHook wrapper must be a React component taking {children}.
//   Reuse the createWrapper(record, config) closure pattern from
//   useFieldDisabledState.test.tsx — do NOT inline JSX in renderHook's 2nd arg.

// GOTCHA: jsdom env + globals:true are already configured in
//   packages/react/vitest.config.ts and setup.ts (afterEach cleanup).
//   No additional config or mock needed. Import nothing from vitest beyond
//   describe/it/expect/vi.

// GOTCHA: For the outside-Form test you need react-hook-form's FormProvider
//   AND useForm directly (not via <Form>). The repo currently has NO test that
//   imports these directly — this is a new harness, not a copy. RHF is already
//   a runtime dep of packages/react so the import resolves:
//     import { useForm, FormProvider } from "react-hook-form";

// GOTCHA: empty-array branch. useWatch({ name: [] }) returns []. The hook's
//   fields useMemo returns {} immediately — but useWatch STILL runs, so this
//   test must still be inside an RHF context (use <Form> wrapper).
```

## Implementation Blueprint

### Data models and structure

No new models. The test asserts against the existing exported types:

```typescript
import type { IsolatedFormState } from "../types"; // return type
import type { CustomFieldState } from "../types"; // per-field shape
import type { UseFormStateOptions } from "../hooks/useFormState"; // { name: string | string[] }
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE packages/react/src/__tests__/useFormState.test.tsx (header + shared harness)
  - FILE: packages/react/src/__tests__/useFormState.test.tsx
  - IMPORTS:
      import { describe, it, expect, vi } from "vitest";
      import { renderHook, act } from "@testing-library/react";
      import React, { forwardRef } from "react";
      import { useForm, FormProvider } from "react-hook-form";
      import { Form } from "../components/Form";
      import { FormalityProvider } from "../components/FormalityProvider";
      import { useFormState } from "../hooks/useFormState";
      import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";
  - FOLLOW pattern: packages/react/src/__tests__/useFieldDisabledState.test.tsx
        (renderHook + createWrapper closure) and Form.test.tsx (TestInput shape).
  - DEFINE: TestInput (forwardRef<HTMLInputElement>) + testInputs
        Record<string, InputConfig> { textField: {component, defaultValue:""} }
        — copy from Form.test.tsx so RHF register() works through <Form>.
  - DEFINE: createWrapper(record, config?) returning
        ({children}) => <FormalityProvider inputs={testInputs}>
          <Form config={config ?? {}} record={record}>{children}</Form>
        </FormalityProvider>
  - NAMING: top-level describe("useFormState", () => {...}); nested
        describe blocks per scenario (mirrors useFieldDisabledState.test.tsx).
  - PLACEMENT: packages/react/src/__tests__/useFormState.test.tsx
  - NOTE: `vi` import only needed if a spy is used (e.g. to assert record
        getter does not subscribe). If unused, drop it to avoid lint warning.

Task 2: SCENARIO (a) single watched name
  - TEST: renderHook(() => useFormState({ name: "x" }), { wrapper: createWrapper({x:"hello"}, {x:{type:"textField"}}) })
  - ASSERT:
      expect(result.current.fields.x).toBeDefined();
      expect(result.current.fields.x.value).toBe("hello"); // from record defaultValues
      // each field is a proxy per makeProxyState — value is a getter
      const fDesc = Object.getOwnPropertyDescriptor(result.current.fields, "x");
      expect(fDesc?.get).toBeTypeOf("function");
      // CustomFieldState hard-coded flags per hook body:
      expect(result.current.fields.x.isTouched).toBe(false);
      expect(result.current.fields.x.isDirty).toBe(false);
      expect(result.current.fields.x.invalid).toBe(false);

Task 3: SCENARIO (b) multiple watched names
  - TEST: createWrapper({a:"A", b:"B"}, {a:{type:"textField"}, b:{type:"textField"}})
          renderHook(() => useFormState({ name: ["a","b"] }), { wrapper })
  - ASSERT:
      expect(Object.keys(result.current.fields).sort()).toEqual(["a","b"]);
      expect(result.current.fields.a.value).toBe("A");
      expect(result.current.fields.b.value).toBe("B");
  - COVERS: the `values = fieldNames.length === 1 ? [watchedValues] : watchedValues` branch
            AND the Array.isArray path of the fieldNames useMemo.

Task 4: SCENARIO (c) empty-name-array early return
  - TEST: createWrapper({}, {})
          renderHook(() => useFormState({ name: [] as string[] }), { wrapper })
  - ASSERT: expect(result.current.fields).toEqual({});   // early `return result;`
            // record getter still wired:
            const recDesc = Object.getOwnPropertyDescriptor(result.current, "record");
            expect(recDesc?.get).toBeTypeOf("function");
  - COVERS: the `if (fieldNames.length === 0) return result;` branch.

Task 5: SCENARIO (d) lazy `record` getter (Object.defineProperty)
  - TEST: createWrapper({ id: 42, name: "rec" }, { id:{type:"textField"} })
  - ASSERT (mirrors makeProxyState.test.ts getter pattern):
      const state = result.current;
      const recDesc = Object.getOwnPropertyDescriptor(state, "record");
      expect(recDesc?.get).toBeTypeOf("function");      // is a GETTER
      expect(recDesc?.set).toBeUndefined();
      expect(recDesc?.enumerable).toBe(true);
      expect(recDesc?.configurable).toBe(true);
      expect(recDesc?.value).toBeUndefined();            // not a data property
      expect(state.record).toEqual({ id: 42, name: "rec" }); // reads FormContext.record
  - ADDITIONALLY (proves PRD h3.96 "Verify Object.defineProperty creates getters"):
      // accessing record returns the SAME object identity the Form was given
      const recordRef = state.record;
      expect(recordRef).toBe(recordRef); // sanity; main identity check is value equality above

Task 6: SCENARIO (e) used outside <Form> (try/catch null-context fallback)
  - NEW HARNESS (NOT createWrapper): provide RHF context WITHOUT Formality <Form>.
      function OutsideFormWrapper({ children }: { children: React.ReactNode }) {
        const methods = useForm({ defaultValues: { x: "val" } });
        return <FormProvider {...methods}>{children}</FormProvider>;
      }
  - TEST: renderHook(() => useFormState({ name: "x" }), { wrapper: OutsideFormWrapper })
  - ASSERT:
      // hook did not throw; returned a valid IsolatedFormState
      expect(result.current).toBeDefined();
      expect(result.current.fields.x).toBeDefined();
      // formal context fell to null → record getter returns {}
      expect(result.current.record).toEqual({});
      const recDesc = Object.getOwnPropertyDescriptor(result.current, "record");
      expect(recDesc?.get).toBeTypeOf("function");
  - COVERS: the try/catch branch where useFormalityFormContext() throws and
            formalityContext stays null → `formalityContext?.record ?? {}` → {}.
  - GOTCHA: Do NOT wrap in <FormalityProvider>/<Form> here — that would supply
            a Formality FormContext and bypass the catch branch entirely.
```

### Implementation Patterns & Key Details

```tsx
// PATTERN: createWrapper closure (copy/adapt from useFieldDisabledState.test.tsx)
const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
};

const createWrapper = (
  record: Record<string, unknown> = {},
  config: FormFieldsConfig = {},
) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <FormalityProvider inputs={testInputs}>
        <Form config={config} record={record}>
          {children}
        </Form>
      </FormalityProvider>
    );
  };

// PATTERN: standard renderHook usage
const { result } = renderHook(() => useFormState({ name: "x" }), {
  wrapper: createWrapper({ x: "hello" }, { x: { type: "textField" } }),
});
// result.current is the IsolatedFormState returned by the hook.

// PATTERN: outside-Form harness (NEW — not a copy; needs raw RHF FormProvider)
function OutsideFormWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm({ defaultValues: { x: "val" } });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

// PATTERN: getter assertion (from makeProxyState.test.ts)
const desc = Object.getOwnPropertyDescriptor(result.current, "record");
expect(desc?.get).toBeTypeOf("function");
expect(desc?.set).toBeUndefined();
expect(desc?.value).toBeUndefined();
```

### Integration Points

```yaml
VITEST CONFIG:
  - file: packages/react/vitest.config.ts
  - note: |
      Already correct. environment:"jsdom", globals:true,
      include:["src/**/*.test.{ts,tsx}"], setupFiles:["./src/__tests__/setup.ts"].
      The new file matches the include glob (src/__tests__/*.test.tsx). No change.

COVERAGE CONFIG:
  - file: vitest.config.ts (repo root)
  - note: |
      Has coverage.exclude (correct) but NO coverage.thresholds block yet.
      DO NOT add thresholds here — that is P1.M2.T1.S5's job (explicitly
      separate work item). This task only writes the test file.

FORMCONTEXT CONTRACT:
  - record? is optional on FormContextValue; when the hook is inside <Form>,
    record reflects the prop passed to <Form>. Outside <Form>, the try/catch
    nulls formalityContext → record getter returns {}.

PARALLEL EXECUTION CONTRACT:
  - sibling P1.M1.T3.S1 (FormalityFieldComponentProps) edits overlays.ts +
    Field.tsx cast + index.ts export. It does NOT touch useFormState.ts or any
    test under __tests__/. No file conflict; this task is fully independent.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating the file — fix before proceeding
pnpm lint                                   # repo root (eslint flat config)
pnpm --filter @formality-ui/react lint      # package-scoped if available
# Type-check (catches JSX/TSX import mistakes early)
pnpm typecheck                              # root tsc --build
# Expected: zero errors. If the `vi` import is unused, either use it or remove it.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run JUST the new file (fast iteration)
pnpm vitest run packages/react/src/__tests__/useFormState.test.tsx
# or workspace-scoped:
pnpm --filter @formality-ui/react test -- src/__tests__/useFormState.test.tsx

# Run the full react suite to catch regressions
pnpm --filter @formality-ui/react test
# Expected: all green, including the 5 new scenarios.
```

### Level 3: Coverage Validation (the actual deliverable gate)

```bash
# Full repo coverage run
pnpm test:coverage

# Then confirm useFormState.ts specifically flipped to ~100%.
# Open the generated HTML report or grep the json:
node -e "const c=require('./coverage/coverage-final.json'); \
  const k=Object.keys(c).find(x=>x.includes('hooks/useFormState.ts')); \
  const s=c[k].statementMap; const cov=c[k].s; \
  const total=Object.keys(s).length; const hit=Object.values(cov).filter(Boolean).length; \
  console.log('useFormState.ts statements:', hit+'/'+total, '('+(100*hit/total).toFixed(1)+'%)');"

# Expected: useFormState.ts ≥ 95% statements (was 0.0%), 100% functions
# (was 0%), ≥ 80% branches (was 0%). Ideally 100% across all four metrics.
# Repo-wide statements should rise from 87.02% → ~89% (this task alone does
# not clear 90% — siblings S2/S3/S4 finish it; S5 adds the threshold).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Confirm the PRD §2.1 performance guarantee is actually exercised:
# "Verify Object.defineProperty creates getters" (Appendix B h3.96).
# This is satisfied by Task 5's descriptor assertions above — no extra command,
# but the test MUST include an explicit Object.getOwnPropertyDescriptor check
# on the `record` key (not just an equality check on state.record).

# Confirm no accidental subscription regressions: run the existing hook tests
# alongside to ensure renderHook teardown (setup.ts afterEach(cleanup)) is fine:
pnpm vitest run packages/react/src/__tests__/useFieldDisabledState.test.tsx \
                  packages/react/src/__tests__/useFormState.test.tsx
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: `pnpm lint` and `pnpm typecheck` clean.
- [ ] Level 2 passed: `pnpm --filter @formality-ui/react test` green.
- [ ] Level 3 passed: `pnpm test:coverage` shows `useFormState.ts` ≥ 95% stmt.
- [ ] No new lint warnings (e.g. unused `vi` import removed if not needed).

### Feature Validation

- [ ] Scenario (a) single name: `fields.x.value` correct + x is a getter.
- [ ] Scenario (b) multiple names: both `fields.a`, `fields.b` correct.
- [ ] Scenario (c) empty array: `fields === {}` early-return branch covered.
- [ ] Scenario (d) lazy record getter: `record` descriptor has `.get`, no `.set`,
      not a data prop, returns the Form's record object.
- [ ] Scenario (e) outside `<Form>`: try/catch hit, hook returns valid state,
      `record === {}`.
- [ ] No source files modified (test-only deliverable).

### Code Quality Validation

- [ ] Follows `useFieldDisabledState.test.tsx` renderHook + createWrapper pattern.
- [ ] Reuses `makeProxyState.test.ts` getter-assertion pattern for the
      `record` descriptor.
- [ ] Reuses `Form.test.tsx` TestInput / `testInputs` / FormalityProvider+Form
      mount shape.
- [ ] File placement: `packages/react/src/__tests__/useFormState.test.tsx`.
- [ ] Anti-patterns avoided: no manual mocks of react-hook-form; no inline JSX
      wrapper in renderHook's 2nd arg; no `.only`/`.skip`.

### Documentation & Deployment

- [ ] No docs needed (item OUTPUT §5: test-only, no API/config/surface change).
- [ ] Test names are self-documenting (describe/it describe each scenario).

---

## Anti-Patterns to Avoid

- ❌ Don't mock `react-hook-form`'s `useWatch`/`useFormContext`. The hook's
  whole point is its real RHF integration; mocking defeats the coverage
  purpose and the repo convention is no-framework-mocks (see setup.ts — only
  jest-dom + cleanup).
- ❌ Don't wrap the outside-`<Form>` test in `<FormalityProvider>`/`<Form>` —
  that supplies a Formality `FormContext` and the try/catch is never entered.
  Use raw RHF `<FormProvider {...useForm()}>`.
- ❌ Don't assert `result.current.record === someObject` by identity for the
  in-Form case — the getter reads `formalityContext.record` which is the prop
  the Form received; assert by deep equality (`.toEqual`) to be robust.
- ❌ Don't skip the descriptor check on `record` — equality alone does NOT
  prove the PRD h3.96 getter contract; `Object.getOwnPropertyDescriptor` is
  required.
- ❌ Don't add `coverage.thresholds` to the root vitest.config.ts — that is
  P1.M2.T1.S5's explicit deliverable; this task is test-only.
- ❌ Don't reuse `createWrapper` for the outside-Form scenario — it always
  wraps in `<Form>`. Provide a dedicated `OutsideFormWrapper`.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale: The SUT is small (~90 lines) with 5 well-understood branches, every
one of which maps 1:1 to a listed scenario. The repo already contains two
templates (`useFieldDisabledState.test.tsx` for renderHook harness,
`makeProxyState.test.ts` for getter assertions) that cover ~80% of the
mechanical work. The single non-obvious detail — that the outside-Form path
needs a raw RHF `FormProvider` (because `useRHFFormContext().control` runs
_before_ the try/catch) — is called out explicitly above. The -1 is for the
small risk that the exact value-assertion strings (e.g. whether `useWatch`
returns the record default synchronously on first render inside `<Form>`)
need one iteration against real RHF behavior; the test author should read the
existing Form.test.tsx "should initialize with record values" case for the
proven pattern if initial values are not yet populated on first render.
