name: "P1.M2.T1.S2 — EXTEND Form.test.tsx: autosave/submit callbacks + defaultValues + debounce-false + transform"
description: |

---

## Goal

**Feature Goal**: Extend the Form component test suite so that
`packages/react/src/components/Form.tsx` rises from **76.6% stmt / 76.9% branch
/ 28.6% func** to **≥ 90% on all four metrics (statements, branches,
functions, lines)**. The headline gap is **function coverage (28.6%)**: all 5
uncovered functions are debounce-adapter helper methods
(`Object.assign`-attached `cancel`/`flush`/`pending` + the immediate-fn body +
the lodash `.pending`) that are publicly reachable through
`FormContext.debouncedSubmit` / `FormContext.submitImmediate` but never
exercised by the existing shallow `Form.test.tsx` or the autosave-*.test.tsx
suites.

**Deliverable**:

1. **One new file**: `packages/react/src/__tests__/Form.coverage.test.tsx`
   (a focused, white-box coverage suite). Adding to the existing
   `Form.test.tsx` is also acceptable, but a separate file is preferred so the
   new scenarios stay isolated and the existing file is untouched (zero
   regression risk; see Anti-Patterns).
2. The new suite must drive **every uncovered region** listed in
   `research/form-coverage-map.md` (the 5 functions + ~13 statement clusters).
3. **No source changes.** No new deps. No docs (item OUTPUT §5: test-only).

**Success Definition**:

1. `pnpm vitest run packages/react/src/__tests__/Form.coverage.test.tsx --coverage`
   reports `packages/react/src/components/Form.tsx` at **≥ 90% statements,
   ≥ 90% branches, ≥ 90% functions, ≥ 90% lines**.
2. Concretely: **function coverage jumps from 2/7 (28.6%) → ≥ 7/7 (100%)** by
   invoking `ctx.debouncedSubmit.{cancel,flush,pending}` and
   `ctx.submitImmediate` directly via a context-capturing consumer, plus
   triggering the form-level `debounce={false}` path.
3. `pnpm --filter @formality-ui/react test` is green (no regressions in the
   29 other test files).
4. The suite reuses the **exact** harness/timer conventions of
   `autosave-validation.test.tsx` / `autosave-rapid-changes.test.tsx`
   (`vi.useFakeTimers({ shouldAdvanceTime: true })`, `userEvent.type(field, "x",
   { delay: null })`, `act` + `advanceTimersByTimeAsync`).

## Why

- **Coverage gate (PRD §1.3.7 / Appendix B h3.95).** The repo enforces **≥ 90%**
  on statements, branches, functions, lines via vitest v8 thresholds run in CI.
  Form.tsx is the **single worst function-coverage file in the repo** (28.6%)
  and the #2 statement drag (per `architecture/coverage_gaps.md` §2). Without
  this task the gate (added in P1.M2.T1.S5) cannot go green.
- **PRD contract correctness.** The uncovered regions encode real PRD
  guarantees that are currently untested at the component level: the submit
  flow's form-level `validate` → `setError` + block (PRD §5.2.5 h4.28), value
  transformation via `valueField`/`getSubmitField` (PRD §5.2.5 / §10.3
  h4.28/h3.43), the `debounce: false` immediate-submit path (PRD §11.1-11.3
  h3.48/h3.49/h3.50), and config merging with a function-form
  `formConfig.inputs`. This suite pins each behavior.
- **Risk reduction.** The 5 uncovered functions are pure plumbing today — a
  refactor could silently break immediate-submit / debounce-cancel without any
  test failing. This suite makes them observable.

## What

A vitest + React Testing Library suite that mounts `<Form>` inside
`<FormalityProvider>` (copying the `TestInput`/`TestSwitch`/`testInputs`
harness from `Form.test.tsx`) and exercises the uncovered Form.tsx regions via
**observable behavior** (onSubmit calls, transformed payloads, console.warn
spies) and, for the 5 debounce-helper functions, via a **context-capturing
consumer** that calls the publicly-exposed `debouncedSubmit` / `submitImmediate`
API directly.

### Success Criteria

- [ ] New file `packages/react/src/__tests__/Form.coverage.test.tsx` exists and
      passes.
- [ ] `Form.tsx` ≥ 90% on statements, branches, functions, lines (verified via
      targeted coverage run — see Validation Level 3).
- [ ] All 5 currently-uncovered functions (fn#1-#5) are exercised.
- [ ] No source files under `packages/*/src/**` modified (test-only).
- [ ] `pnpm --filter @formality-ui/react test` green (no regressions).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the Form.tsx
source with exact uncovered line ranges, the public `FormContext` surface
(`debouncedSubmit`, `submitImmediate`, `addSubscription`, `registerWatcherSetter`,
`setFieldValidating`), the existing test-harness convention
(`Form.test.tsx` + `autosave-*.test.tsx`), the core submit-transform helpers
(`extractValueField`/`transformFieldName`/`evaluateDescriptor`/`resolveFormTitle`
signatures), and the exact coverage baseline. All cited below with exact paths
and line numbers. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ - include in context window before implementing
- docfile: plan/002_78ea74508dd8/P1M2T1S2/research/form-coverage-map.md
  section: "The 5 uncovered FUNCTIONS" + "Uncovered STATEMENTS grouped by scenario"
  why: |
    Authoritative map of EVERY uncovered line range in Form.tsx with the exact
    scenario that covers it, and the 5 uncovered function IDs (fn#1-#5) with
    how to invoke each. This is the single source of truth for what to test;
    build the test list directly from its table.
  critical: |
    The 5 uncovered functions are ALL Object.assign helper methods on the
    debounce adapter (Form.tsx:562-598). They are reached via the PUBLIC
    FormContext.debouncedSubmit / .submitImmediate — NOT via Field changes
    alone. A context-capturing consumer is REQUIRED to cover functions.

- file: packages/react/src/components/Form.tsx
  why: The System Under Test. Read it end-to-end before writing any test.
  pattern: |
    Key regions to cover (line numbers current as of this PRP):
      147        mergedInputs: formConfig.inputs as FUNCTION
      233-237    addSubscription: target-not-mounted → pendingWatcherUpdates queue
      256-260    removeSubscription: console.warn dev-arms (exists + double-cleanup)
      283-291    registerWatcherSetter: process pending subscriptions on mount
      364-397    getFormState (34 stmt — biggest chunk; only via selectTitle)
      411-418    handleSubmit: form-level `validate` → setError + return
      489-490    executeAutoSave: changedFields.size===0 early return
      526-552    executeAutoSave: affected-field trigger !isValid + errors check
      565-581    useEffect debounce===false → immediateFn (fn#1-#4)
      590        useEffect lodash .pending (fn#5)
      603-607    submitImmediate flush path
      626-637    resolvedTitle selectTitle branch (calls getFormState)
      737-738    transformValuesForSubmit else (type with no inputConfig)
  gotcha: |
    handleSubmit (Form.tsx:402) is an INTERNAL useCallback — it is NOT
    methods.handleSubmit and is NOT on FormContext. Its only caller is
    executeAutoSave (line 556). Therefore the form-level `validate` branch
    (411-418) can ONLY be hit through the autoSave path, NOT through a plain
    <form onSubmit={methods.handleSubmit(...)}>.

- file: packages/react/src/__tests__/Form.test.tsx
  why: Source of the TestInput/TestSwitch components + testInputs +
        FormalityProvider+Form mount shape. Copy verbatim.
  pattern: |
    const TestInput = forwardRef<HTMLInputElement, TestInputProps>(...)
    const testInputs: Record<string, InputConfig> = {
      textField: { component: TestInput, defaultValue: "" },
      switch:    { component: TestSwitch, defaultValue: false },
    };
  gotcha: The existing "should call onSubmit" test wraps <form onSubmit={
          methods.handleSubmit(onSubmit)}> — that is RHF's handleSubmit, NOT
          Form's internal one, so it does NOT cover the transform/validate
          pipeline. Do not copy that pattern for transform/validate tests.

- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: EXACT timer + harness pattern for autoSave tests. Copy its
        beforeEach/aftergether + render+act cadence verbatim.
  pattern: |
    beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
    afterEach(() => { vi.useRealTimers(); });
    // mount, then:
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    // drive a change:
    await act(async () => { await userEvent.type(field, "x", { delay: null }); });
    // advance past debounce:
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    await waitFor(() => { expect(submitHandler).toHaveBeenCalledTimes(1); });
  gotcha: |
    MUST use { shouldAdvanceTime: true } or RHF's onChange validation timers
    never fire and the auto-save never reaches handleSubmit. MUST pass
    { delay: null } to userEvent.type or fake timers stall the per-keystroke
    delay. Both conventions are established in the autosave suites — reuse them.

- file: packages/react/src/__tests__/autosave-validation.test.tsx
  section: "Immediate Submission (debounce: false)" + "Mixed Debounce Settings"
  why: |
    Proven pattern for field-level inputConfig.debounce:false. This PRP
    additionally needs the FORM-LEVEL debounce={false} path (different code:
    Form.tsx:564 builds immediateFn). Reuse the mount/timer shape but pass
    <Form debounce={false}> instead of a per-Field inputConfig.

- file: packages/react/src/context/FormContext.ts
  why: Defines the FormContextValue surface exposed to consumers — confirms
        debouncedSubmit, submitImmediate, addSubscription, removeSubscription,
        registerWatcherSetter, unregisterWatcherSetter, changeField,
        setFieldValidating, getFormState are ALL on the context and callable
        from a capturing consumer.
  pattern: |
    function ContextCapture() {
      const ctx = useFormContext();
      // expose ctx to the test via a ref / test-id / window global
      return null;
    }
  gotcha: useFormContext() (FormContext, NOT RHF) throws if used outside <Form>
          — always render ContextCapture as a child of <Form>.

- file: packages/core/src/expression/evaluate.ts (evaluateDescriptor, line 405)
  why: |
    selectTitle descriptor evaluation. function descriptors are returned AS-IS
    (no throw) — this is the SAFEST selectTitle value to trigger getFormState
    (lines 626-637) without depending on expression-string syntax.
  critical: |
    evaluateDescriptor(descriptor, ctx):
      string  → evaluate(expr, ctx)        (expression engine; syntax-sensitive)
      function → returned as-is             (← use this; guaranteed safe)
      object/array → recursed
    For the selectTitle test use formConfig={{ selectTitle: () => "Dynamic" }}
    so resolvedTitle's branch runs and calls getFormState() regardless of the
    expression dialect. (resolveFormTitle then String()s it — assert defined.)

- file: packages/core/src/transform/pipeline.ts
  section: extractValueField (line 182) + transformFieldName (line 219)
  why: |
    The submit-transform primitives used by Form.transformValuesForSubmit
    (Form.tsx:716). To exercise the valueField/getSubmitField path you must add
    a CUSTOM input type to the provider with valueField + getSubmitField.
  pattern: |
    // in testInputs add:
    autocomplete: {
      component: TestInput,            // any forwardRef component
      defaultValue: null,
      valueField: "id",                // extract obj.id
      getSubmitField: (k) => `${k}Id`, // rename client → clientId
    }
    // config: { client: { type: "autocomplete" }, signed: { type: "switch" } }
    // record: { client: { id: 5, name: "Acme" }, signed: true }
    // → onSubmit called with { clientId: 5, signed: true }   (PRD §5.2.5 example)

- url: https://vitest.dev/guide/mocking.html#console
  why: vi.spyOn(console, "warn").mockImplementation(() => {}) is the canonical
        way to both assert and silence the dev-only console.warn calls in
        addSubscription/removeSubscription (Form.tsx:222, 251-260).
  critical: |
    These warns fire under `process.env.NODE_ENV !== "production"` which is the
    vitest default (test). They are noisy — spy+mock them in the
    removeSubscription / addSubscription tests to keep output clean AND assert
    they fired. Restore with mockRestore() in afterEach.

- url: https://testing-library.com/docs/user-event/setup
  why: userEvent.setup() is NOT used in the fake-timer autosave suites; they
        call userEvent.type(...) directly. Match that — userEvent.setup()
        advances real timers and conflicts with vi.useFakeTimers.

- docfile: plan/002_78ea74508dd8/architecture/coverage_gaps.md
  section: §2 (row #1 Form.tsx), §3, §5 step 2
  why: Confirms Form.tsx is the #1 func-coverage offender and step 2 of the
        backfill plan. Expected gain for this task: +~40 stmt / +10-12 branch /
        +3-4 func (we actually get +5 func).
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
├── components/
│   ├── Form.tsx                 # ← SUT (76.6/76.9/28.6)
│   ├── Field.tsx                # calls ctx.changeField + ctx.setFieldValidating
│   └── FormalityProvider.tsx
├── context/
│   └── FormContext.ts           # FormContextValue surface (debouncedSubmit, submitImmediate, ...)
├── __tests__/
│   ├── setup.ts                 # afterEach(cleanup) + jest-dom; globals:true
│   ├── Form.test.tsx            # ← shallow; copy TestInput/testInputs harness
│   ├── autosave-validation.test.tsx     # ← timer+harness TEMPLATE
│   ├── autosave-rapid-changes.test.tsx  # ← timer+harness TEMPLATE
│   ├── autosave-async-timing.test.tsx   # ← timer+harness TEMPLATE
│   ├── render-isolation.test.tsx
│   └── Form.coverage.test.tsx   # ← NEW (this task)
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/__tests__/
└── Form.coverage.test.tsx        # NEW — sole deliverable (or append to Form.test.tsx)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: the 5 uncovered FUNCTIONS are not reachable through <Field> changes
// alone. They live on the debounce adapter (Form.tsx:562-598) and are exposed
// via FormContext.debouncedSubmit (an Object.assign'd lodash-or-immediate fn
// with .cancel/.flush/.pending) and FormContext.submitImmediate. You MUST add a
// context-capturing consumer that calls these methods directly.

// CRITICAL: Form's INTERNAL handleSubmit (Form.tsx:402) is NOT methods.handleSubmit
// and is NOT exposed. Its ONLY caller is executeAutoSave (line 556). So the
// form-level `validate` branch (411-418) and transform pipeline are reachable
// ONLY via the autoSave path. A plain <form onSubmit={methods.handleSubmit(...)}>
// test will NOT cover them (the existing Form.test.tsx "should call onSubmit"
// test proves this — it passes yet leaves 411-418 uncovered).

// CRITICAL: fake timers + RHF onChange. You MUST use
//   vi.useFakeTimers({ shouldAdvanceTime: true })
// (the { shouldAdvanceTime: true } is mandatory — without it RHF's internal
//  onChange validation microtasks never settle and auto-save never submits).
// Match the autosave-validation.test.tsx beforeEach/aftergether verbatim.
// userEvent.type MUST be called with { delay: null } under fake timers.

// GOTCHA: submitImmediate's else branch (Form.tsx:605-606 `executeAutoSave()`)
// is effectively DEAD — both the lodash debounce fn and the immediateFn expose
// a .flush, so `debouncedSubmitRef.current?.flush` is always truthy once the
// effect ran. Do NOT spend time trying to cover 605-606; cover 603-604 (the
// flush path) by calling ctx.submitImmediate().

// GOTCHA: getFormState (Form.tsx:364-397, 34 statements — the BIGGEST chunk)
// is reachable ONLY through resolvedTitle when formConfig.selectTitle is set.
// Use a FUNCTION descriptor (formConfig={{ selectTitle: () => "x" }}) so
// evaluateDescriptor returns it as-is without depending on expression syntax.

// GOTCHA: the transformValuesForSubmit else branch (Form.tsx:737-738) needs a
// value whose config type has NO inputConfig in mergedInputs. Add a config
// field with type:"autocomplete" but do NOT register "autocomplete" in the
// provider's testInputs for THAT test → inputConfig undefined → else branch.
// (For the valueField EXTRACTION test, DO register autocomplete with
//  valueField/getSubmitField — two separate tests, two provider configs.)

// GOTCHA: process.env.NODE_ENV is "test" under vitest (not "production"), so
// the console.warn dev-arms in addSubscription/removeSubscription FIRE and are
// noisy. Spy + mock them: vi.spyOn(console,"warn").mockImplementation(()=>{}).

// GOTCHA: do NOT add coverage.thresholds to vitest.config.ts — that is
// P1.M2.T1.S5's deliverable. This task is test-only.
```

## Implementation Blueprint

### Data models and structure

No new models. The suite reuses the existing harness types:

```typescript
import type { InputConfig, FormFieldsConfig, FormConfig } from "@formality-ui/core";
// TestInput / TestSwitch = forwardRef components copied from Form.test.tsx
// testInputs: Record<string, InputConfig> = { textField, switch, [autocomplete?] }
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE packages/react/src/__tests__/Form.coverage.test.tsx (header + shared harness + context-capture helper)
  - FILE: packages/react/src/__tests__/Form.coverage.test.tsx
  - IMPORTS:
      import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
      import React, { forwardRef } from "react";
      import { render, screen, waitFor, act } from "@testing-library/react";
      import userEvent from "@testing-library/user-event";
      import { Form } from "../components/Form";
      import { Field } from "../components/Field";
      import { FormalityProvider } from "../components/FormalityProvider";
      import { useFormContext } from "../context/FormContext";
      import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";
  - FOLLOW pattern: Form.test.tsx (TestInput/TestSwitch/testInputs shape) +
        autosave-validation.test.tsx (timer beforeEach/aftergether).
  - DEFINE TestInput + TestSwitch (forwardRef, copy verbatim from Form.test.tsx)
        and testInputs = { textField:{component:TestInput,defaultValue:""},
                           switch:{component:TestSwitch,defaultValue:false} }.
  - DEFINE a ContextCapture helper that stashes the FormContext on a ref so
        tests can call debouncedSubmit / submitImmediate / addSubscription /
        registerWatcherSetter / setFieldValidating directly:
        function ContextCapture({ captureRef }: { captureRef: React.MutableRefObject<any> }) {
          captureRef.current = useFormContext();
          return null;
        }
  - DEFINE a local renderForm(overrides) factory OR inline per-test (inline is
        clearer for coverage scenarios — match autosave suites which inline).
  - NAMING: top-level describe("Form coverage (P1.M2.T1.S2)", () => {...});
        nested describe per region. test names: "should <observable behavior>".
  - PLACEMENT: packages/react/src/__tests__/Form.coverage.test.tsx
  - NOTE: No vi.useFakeTimers at the top level — only inside the describe
        blocks that drive autoSave (match autosave suites' per-describe setup).

Task 2: FORM-LEVEL debounce={false} → cover fn#1 (immediateFn body) + useEffect 565-581
  - COVERS: Form.tsx:564-581 (debounceMs===false branch, immediateFn build) + fn#1.
  - RENDER:
      <FormalityProvider inputs={testInputs}>
        <Form config={{ name:{type:"textField"} }} autoSave debounce={false}
              onSubmit={vi.fn()}>
          <Field name="name" />
        </Form>
      </FormalityProvider>
  - DRIVE: vi.useFakeTimers({shouldAdvanceTime:true}); render; advance 100ms;
        userEvent.type(field,"x",{delay:null}); advance ~100ms (NOT a debounce
        wait — immediate path should fire fast).
  - ASSERT: onSubmit called once with { name:"x" } (proves immediateFn() ran
        → fn#1 hit AND executeAutoSave ran through handleSubmit).
  - ALSO ASSERT: advancing 0ms more does not double-submit (immediate, not
        debounced).

Task 3: CONTEXT-CAPTURE → cover fn#2/#3/#4 (immediateFn.cancel/flush/pending) + fn#5 (lodash pending) + submitImmediate 603-604
  - This is the task that flips function coverage 2/7 → 7/7.
  - RENDER TWO forms, each with a <ContextCapture captureRef={ref}/> child:
      (a) <Form autoSave debounce={false}>  → immediateFn adapter
      (b) <Form autoSave debounce={500}>    → lodash adapter
  - SUB-TEST 3a (immediateFn methods, debounce={false}):
        vi.useFakeTimers({shouldAdvanceTime:true});
        const ref = { current: null };
        render(...<Form autoSave debounce={false}>...<ContextCapture captureRef={ref}/>...);
        await act(async () => { await vi.advanceTimersByTimeAsync(100); });
        expect(typeof ref.current.debouncedSubmit.cancel).toBe("function");  // fn#2
        expect(ref.current.debouncedSubmit.pending()).toBe(false);           // fn#4
        ref.current.debouncedSubmit.cancel();                                // fn#2 body
        // flush executes executeAutoSave immediately:
        ref.current.debouncedSubmit.flush();                                // fn#3
        await act(async () => { await vi.advanceTimersByTimeAsync(100); });
        // submitImmediate also routes through flush:
        ref.current.submitImmediate();                                      // 603-604
        await act(async () => { await vi.advanceTimersByTimeAsync(100); });
  - SUB-TEST 3b (lodash .pending, debounce={500}):
        render(...<Form autoSave debounce={500}>...<ContextCapture captureRef={ref}/>...);
        await act(async () => { await vi.advanceTimersByTimeAsync(100); });
        expect(typeof ref.current.debouncedSubmit.pending).toBe("function");
        expect(ref.current.debouncedSubmit.pending()).toBe(false);          // fn#5
        expect(typeof ref.current.debouncedSubmit.flush).toBe("function");  // lodash has flush
  - ASSERT: after Task 3, Form.tsx function coverage = 7/7 (100%).

Task 4: selectTitle → cover getFormState 364-397 + resolvedTitle selectTitle branch 626-637 (BIGGEST statement chunk)
  - COVERS: ~46 statements (the single largest gain).
  - RENDER (function descriptor — guaranteed safe per evaluateDescriptor:414-416):
      <FormalityProvider inputs={testInputs}>
        <Form config={{ name:{type:"textField"} }}
              record={{ name:"Alice" }}
              formConfig={{ title:"Static", selectTitle: () => "Dynamic Title" }}>
          {({ resolvedTitle }) => <span data-testid="title">{String(resolvedTitle)}</span>}
        </Form>
      </FormalityProvider>
  - ASSERT: screen.getByTestId("title") has text "Dynamic Title" (resolveFormTitle
        String()s the evaluated function → proves getFormState() + buildFormContext
        + evaluateDescriptor + resolveFormTitle all ran).
  - GOTCHA: selectTitle MUST be truthy to enter the branch (625). A function is
        truthy. Do NOT pass selectTitle: undefined.

Task 5: formConfig.inputs as FUNCTION → cover mergedInputs line 147
  - RENDER:
      <FormalityProvider inputs={testInputs}>
        <Form config={config}
              formConfig={{ inputs: (providerInputs) => ({ textField: { debounce: 500 } }) }}>
          <ConfigCapture/>   // stashes ctx.formConfig
        </Form>
      </FormalityProvider>
  - ASSERT: captured formConfig.inputs equals { textField: { debounce: 500 } }
        (proves the `(providerInputs) => {...}` branch at line 146-148 ran).
  - CONTRAST with existing Form.test.tsx "should merge form-level input
        overrides" which passes an OBJECT and so covers only the `?? {}` branch.

Task 6: form-level validate FAILURE → cover handleSubmit 411-418 (setError + block)
  - COVERS: the validate branch + Object.entries(errors).forEach(setError) + return.
  - RENDER (autoSave required — see gotcha; internal handleSubmit only callable via executeAutoSave):
      const onSubmit = vi.fn();
      const validate = vi.fn(async (values) => ({ name: "too short" }));
      <FormalityProvider inputs={testInputs}>
        <Form config={{ name:{type:"textField"} }} autoSave debounce={300}
              validate={validate} onSubmit={onSubmit} record={{ name:"x" }}>
          <Field name="name" />
        </Form>
      </FormalityProvider>
  - DRIVE: fake timers; advance 100; userEvent.type(field,"y",{delay:null});
        advance past 300ms debounce.
  - ASSERT: validate WAS called (proves handleSubmit reached the validate branch);
        onSubmit was NOT called (blocked by setError+return);
        (optional) field shows the error via methods.formState.errors — expose
        via a render-API child reading formState.errors.name.message.
  - ALSO ADD a sibling test: validate returns {} → onSubmit IS called once.
        (covers the happy path through transformValuesForSubmit + onSubmit?.)

Task 7: valueField + getSubmitField transform → cover transformValuesForSubmit extraction path (PRD §5.2.5)
  - BUILD a SECOND provider inputs map (do NOT pollute the shared testInputs):
      const inputsWithAutocomplete: Record<string, InputConfig> = {
        ...testInputs,
        autocomplete: {
          component: TestInput,
          defaultValue: null,
          valueField: "id",
          getSubmitField: (k: string) => `${k}Id`,
        },
      };
  - RENDER:
      <FormalityProvider inputs={inputsWithAutocomplete}>
        <Form config={{ client:{type:"autocomplete"}, signed:{type:"switch"} }}
              autoSave debounce={300} onSubmit={onSubmit}
              record={{ client:{id:5,name:"Acme"}, signed:true }}>
          <Field name="signed" />    {/* render at least one Field so changeField can fire */}
        </Form>
      </FormalityProvider>
  - DRIVE a change on `signed` (toggle) to trigger autoSave → executeAutoSave →
        handleSubmit → transformValuesForSubmit.
  - ASSERT: onSubmit called with { clientId: 5, signed: <toggled> } — proves
        valueField extraction (obj.id) + getSubmitField rename (client→clientId).

Task 8: transformValuesForSubmit else branch → cover line 737-738
  - RENDER with a config field whose type is ABSENT from provider inputs:
      <FormalityProvider inputs={testInputs}>   {/* NO "autocomplete" here */}
        <Form config={{ client:{type:"autocomplete"}, signed:{type:"switch"} }}
              autoSave debounce={300} onSubmit={onSubmit}
              record={{ client:{id:5}, signed:true }}>
          <Field name="signed" />
        </Form>
      </FormalityProvider>
  - DRIVE a `signed` change to trigger autoSave submit.
  - ASSERT: onSubmit called with { client:{id:5}, signed:<toggled> } — `client`
        passed through UNTRANSFORMED (the else branch result[name]=value),
        proving inputConfig-undefined path (737-738).
  - GOTCHA: do NOT render <Field name="client"> here — autocomplete has no
        component in this provider and Field would fail. Only `signed` is a Field;
        `client` is still in the form values via the record → transformed at submit.

Task 9: pendingWatcherUpdates queue + registerWatcherSetter processing → cover 233-237 + 283-291
  - RENDER a form with a <ContextCapture/> and NO Field for "lateTarget" yet:
      const ref = { current: null };
      render(<FormalityProvider inputs={testInputs}>
        <Form config={{ lateTarget:{type:"textField"}, sub:{type:"textField"} }}>
          <ContextCapture captureRef={ref}/>
        </Form>
      </FormalityProvider>);
  - ACT: call ref.current.addSubscription("lateTarget", "sub") while "lateTarget"
        is NOT yet mounted → hits the else queue (233-237).
  - THEN render/mount a Field for "lateTarget" (e.g. re-render with <Field
        name="lateTarget"/> added) → Field calls registerWatcherSetter which
        finds pending → processes (283-291).
  - ASSERT: no throw; the watcher setter was invoked (can spy via a passed
        setter, but minimal: just assert the mount + addSubscription completed).
  - SIMPLER ALTERNATIVE if mount-order is fiddly: call
        ref.current.registerWatcherSetter("lateTarget", () => ({...})) manually
        after addSubscription queued a pending entry — directly exercises 283-291.
  - vi.spyOn(console,"warn").mockImplementation(()=>{}) to silence the
        addSubscription dev-warn (line 222).

Task 10: removeSubscription dev-warns → cover 256-260
  - RENDER form with <ContextCapture/>; spy console.warn.
  - ACT (exists-then-remove path):
        ref.current.addSubscription("a","b");
        ref.current.removeSubscription("a","b");
        → expect console.warn to have been called with the "removed from watching" msg.
  - ACT (double-cleanup path):
        ref.current.removeSubscription("a","b");   // already removed
        → expect console.warn called with the "Double-cleanup attempt" msg.
  - ASSERT: spy.mock.calls contains both message substrings.
  - afterEach: spy.mockRestore().

Task 11 (STRETCH, lower priority): executeAutoSave early-return + affected-field failure
  - 489-490 (changedFields.size===0 early return): call
        ref.current.debouncedSubmit.flush() on an autoSave form with NO pending
        field change → executeAutoSave runs, changedFields empty → return. Assert
        onSubmit NOT called. (Low risk; 2 statements.)
  - 526-552 (affected-field trigger !isValid + errors check): set up a Field
        with a condition subscribing to another + a validator that fails when
        the dependency changes; drive the dependency change; assert onSubmit NOT
        called. This is the trickiest scenario — if time-boxed, it is acceptable
        to leave 526-552 partially covered; the 90% gate is already cleared by
        Tasks 2-10 (see Confidence rationale).
```

### Implementation Patterns & Key Details

```tsx
// PATTERN: fake-timer autoSave harness (copy from autosave-validation.test.tsx)
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });   // MANDATORY flag
  submitHandler = vi.fn();
});
afterEach(() => { vi.useRealTimers(); });

// mount, settle, drive, advance, assert:
render(<FormalityProvider inputs={testInputs}>
  <Form config={{ name:{type:"textField"} }} autoSave debounce={300} onSubmit={submitHandler}>
    <Field name="name" />
  </Form>
</FormalityProvider>);
await act(async () => { await vi.advanceTimersByTimeAsync(100); });
const field = screen.getByTestId("name");
await act(async () => { await userEvent.type(field, "x", { delay: null }); });
await act(async () => { await vi.advanceTimersByTimeAsync(400); }); // > debounce
await waitFor(() => { expect(submitHandler).toHaveBeenCalledTimes(1); });

// PATTERN: context capture for the 5 debounce-helper functions (Task 3)
function ContextCapture({ captureRef }: { captureRef: React.MutableRefObject<any> }) {
  captureRef.current = useFormContext();
  return null;
}
const ref = { current: null as any };
render(<FormalityProvider inputs={testInputs}>
  <Form config={{ name:{type:"textField"} }} autoSave debounce={false} onSubmit={vi.fn()}>
    <Field name="name" />
    <ContextCapture captureRef={ref} />
  </Form>
</FormalityProvider>);
await act(async () => { await vi.advanceTimersByTimeAsync(100); });
// Now ref.current.debouncedSubmit is the immediateFn adapter:
ref.current.debouncedSubmit.cancel();    // fn#2
ref.current.debouncedSubmit.flush();     // fn#3 → executeAutoSave
ref.current.debouncedSubmit.pending();   // fn#4 → false
ref.current.submitImmediate();           // 603-604 (flush path)

// PATTERN: silencing + asserting dev console.warn (Task 10)
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
ref.current.addSubscription("a", "b");
ref.current.removeSubscription("a", "b");            // "removed from watching"
ref.current.removeSubscription("a", "b");            // "Double-cleanup attempt"
expect(warnSpy.mock.calls.some((c) => /removed from watching/.test(c[0]))).toBe(true);
expect(warnSpy.mock.calls.some((c) => /Double-cleanup/.test(c[0]))).toBe(true);
warnSpy.mockRestore();

// PATTERN: selectTitle via function descriptor (Task 4 — covers getFormState)
<Form formConfig={{ title: "Static", selectTitle: () => "Dynamic Title" }} ...>
  {({ resolvedTitle }) => <span data-testid="title">{String(resolvedTitle)}</span>}
</Form>
// evaluateDescriptor returns the function as-is → resolveFormTitle String()s it.
```

### Integration Points

```yaml
VITEST CONFIG:
  - file: packages/react/vitest.config.ts
  - note: |
      Already correct. environment:"jsdom", globals:true,
      include:["src/**/*.test.{ts,tsx}"], setupFiles:["./src/__tests__/setup.ts"].
      The new Form.coverage.test.tsx matches the include glob. No config change.

COVERAGE CONFIG:
  - file: vitest.config.ts (repo root)
  - note: |
      Has coverage.exclude (correct) but NO coverage.thresholds block. DO NOT
      add thresholds — that is P1.M2.T1.S5's job. This task is test-only.

PARALLEL-EXECUTION CONTRACT (sibling S1):
  - S1 (useFormState.test.tsx) is being implemented in parallel and currently
    has a failing assertion (useWatch single-name returns an array in this RHF
    version). That failure currently makes `pnpm test:coverage` exit non-zero
    BEFORE emitting the coverage JSON. Therefore:
      • Validate THIS suite with a file-targeted run:
          pnpm vitest run packages/react/src/__tests__/Form.coverage.test.tsx --coverage
        which emits coverage regardless of S1's state.
      • The full `pnpm test:coverage` gate is only expected green once BOTH
        S1 and S2 have landed (S5 then enforces the threshold).
  - S1 writes ONLY useFormState.test.tsx; S2 writes ONLY Form.coverage.test.tsx.
    No file conflict.

FORM API CONTRACT (do not violate in assertions):
  - onSubmit receives TRANSFORMED values (transformValuesForSubmit output), not
    raw form values. Assert on transformed keys (e.g. clientId, not client).
  - Form's internal handleSubmit is NOT exposed; autoSave is the only way to
    reach the validate/transform branches from a test.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating the file — fix before proceeding
pnpm lint                                    # repo root (eslint flat config)
pnpm --filter @formality-ui/react lint 2>/dev/null || true
pnpm typecheck                               # root tsc --build
# Expected: zero errors. Remove any unused imports (e.g. `Field` if a test
# doesn't use it; `waitFor` if unused). eslint will flag unused vars.
```

### Level 2: Unit Tests (the suite itself)

```bash
# Run JUST the new file (fast iteration; works even while S1 is broken)
pnpm vitest run packages/react/src/__tests__/Form.coverage.test.tsx
# Expected: all new tests green.

# Full react suite to catch regressions
pnpm --filter @formality-ui/react test
# Expected: all green EXCEPT possibly S1's useFormState.test.tsx (sibling bug,
# not yours). If a NON-S1 test regresses, fix your suite.
```

### Level 3: Coverage Validation (the actual deliverable gate)

```bash
# File-targeted coverage run (emits JSON regardless of S1 state)
pnpm vitest run packages/react/src/__tests__/Form.coverage.test.tsx \
  packages/react/src/__tests__/Form.test.tsx \
  packages/react/src/__tests__/autosave-validation.test.tsx \
  packages/react/src/__tests__/autosave-rapid-changes.test.tsx \
  packages/react/src/__tests__/autosave-async-timing.test.tsx \
  --coverage

# Confirm Form.tsx flipped to >=90% on ALL four metrics:
node -e '
  const c = require("./coverage/coverage-final.json");
  const k = Object.keys(c).find((x) => x.includes("components/Form.tsx"));
  const f = c[k];
  const pct = (hit, tot) => (100 * hit / tot).toFixed(1);
  const s = Object.values(f.s).filter(Boolean).length + "/" + Object.keys(f.s).length;
  const b = Object.values(f.b).flat().filter(Boolean).length + "/" + Object.values(f.b).flat().length;
  const fn = Object.values(f.f).filter(Boolean).length + "/" + Object.keys(f.f).length;
  console.log("Form.tsx stmt:", s, "("+pct(+s.split("/")[0],+s.split("/")[1])+"%)");
  console.log("Form.tsx branch:", b, "("+pct(+b.split("/")[0],+b.split("/")[1])+"%)");
  console.log("Form.tsx func:", fn, "("+pct(+fn.split("/")[0],+fn.split("/")[1])+"%)");
'
# Expected:
#   stmt   >= 90%  (was 76.6%)
#   branch >= 90%  (was 76.9%)
#   func   = 100%  (was 28.6% — 7/7 after Task 3)
#   line   >= 90%  (was 76.6%)

# Uncovered-line diff (sanity): what (if anything) remains?
node -e '
  const c = require("./coverage/coverage-final.json");
  const k = Object.keys(c).find((x) => x.includes("components/Form.tsx"));
  const f = c[k];
  const lines = new Set();
  Object.entries(f.s).filter(([,v])=>v===0).forEach(([,])=>{});
  Object.entries(f.statementMap).forEach(([id])=>{ if(f.s[id]===0){const s=f.statementMap[id];for(let l=s.start.line;l<=s.end.line;l++)lines.add(l);} });
  console.log("remaining uncovered stmt lines:", [...lines].sort((a,b)=>a-b).join(","));
'
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Verify the PRD §5.2.5 value-transformation example reproduces exactly:
#   { client:{id:5,name:"Acme"}, signed:true } + autocomplete valueField:id /
#   getSubmitField:k=>`${k}Id`  →  onSubmit({ clientId:5, signed:true })
# (Satisfied by Task 7's assertion — no extra command, but the test MUST
# assert the exact transformed payload, not just that onSubmit was called.)

# Verify the PRD §11.1-11.3 debounce:false contract:
#   <Form debounce={false}> + field change → immediate submit, no debounce wait.
# (Satisfied by Task 2's assertion that onSubmit fires within ~100ms, well
# inside the 1000ms default debounce — proving immediacy.)

# Confirm no behavior regression in the existing autosave suites:
pnpm vitest run packages/react/src/__tests__/autosave-validation.test.tsx \
                  packages/react/src/__tests__/autosave-rapid-changes.test.tsx \
                  packages/react/src/__tests__/autosave-async-timing.test.tsx
# Expected: all green.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: `pnpm lint` and `pnpm typecheck` clean.
- [ ] Level 2 passed: `Form.coverage.test.tsx` green; `pnpm --filter @formality-ui/react test` green (excluding the known S1 sibling failure).
- [ ] Level 3 passed: `Form.tsx` ≥ 90% on stmt/branch/func/line; **func = 100% (7/7)**.
- [ ] No new lint warnings (no unused `vi`/`Field`/`waitFor` imports).

### Feature Validation

- [ ] Task 2: form-level `debounce={false}` submits immediately (fn#1 + 565-581).
- [ ] Task 3: `debouncedSubmit.cancel/flush/pending` + `submitImmediate` all invoked via context capture (fn#1-#5 + 603-604).
- [ ] Task 4: `selectTitle` (function descriptor) yields a resolved title → getFormState ran (364-397 + 626-637).
- [ ] Task 5: `formConfig.inputs` as a function is invoked (line 147).
- [ ] Task 6: form-level `validate` returning errors blocks onSubmit and sets errors (411-418); returning `{}` allows submit.
- [ ] Task 7: `valueField`/`getSubmitField` transform produces `{ clientId: 5 }` from `{ client: {id:5} }` (PRD §5.2.5).
- [ ] Task 8: a config type absent from provider inputs passes through untransformed (737-738).
- [ ] Task 9: `addSubscription` before target mount queues; `registerWatcherSetter` processes pending (233-237 + 283-291).
- [ ] Task 10: both `removeSubscription` dev-warn arms observed via console.warn spy (256-260).
- [ ] No source files under `packages/*/src/**` modified (test-only deliverable).

### Code Quality Validation

- [ ] Follows `Form.test.tsx` TestInput/TestSwitch/testInputs harness verbatim.
- [ ] Follows `autosave-validation.test.tsx` fake-timer + userEvent `{delay:null}` + act/advance cadence verbatim.
- [ ] `describe`/`it` names are self-documenting and map 1:1 to a coverage region.
- [ ] File placement: `packages/react/src/__tests__/Form.coverage.test.tsx`.
- [ ] Anti-patterns avoided: no `.only`/`.skip`; no mocking of react-hook-form; no inline-timer hacks; console.warn spied+restored.

### Documentation & Deployment

- [ ] No docs needed (item OUTPUT §5: test-only, no API/config/surface change).
- [ ] Did NOT add `coverage.thresholds` to root vitest.config.ts (S5's job).

---

## Anti-Patterns to Avoid

- ❌ Don't try to cover Form's internal `handleSubmit` (402) or the
  `validate`/`transform` branches via `<form onSubmit={methods.handleSubmit(...)}>`.
  That calls RHF's handleSubmit, NOT Form's internal one. The internal one is
  only reachable through `autoSave` → `executeAutoSave` → `handleSubmit`. The
  existing Form.test.tsx "should call onSubmit" test is misleading this way —
  it passes while leaving 411-418 fully uncovered.
- ❌ Don't mock `react-hook-form`. The repo convention is no-framework-mocks
  (setup.ts has only jest-dom + cleanup). The 5 debounce functions are coverable
  through the REAL public context API — use a `<ContextCapture/>` consumer.
- ❌ Don't drop the `{ shouldAdvanceTime: true }` from `vi.useFakeTimers(...)` or
  RHF's onChange validation never settles and auto-save never submits. Don't
  drop `{ delay: null }` from `userEvent.type` under fake timers.
- ❌ Don't use a string-expression `selectTitle` (e.g. `"=record.name"`) without
  first verifying the engine's expression dialect in `expression/evaluate.ts`.
  A **function** descriptor (`() => "Dynamic"`) is returned as-is by
  `evaluateDescriptor` and is guaranteed not to throw — use it for Task 4.
- ❌ Don't register `autocomplete` in the shared `testInputs` and then expect
  the Task 8 else-branch (737-738) to be hit — that test REQUIRES `autocomplete`
  to be ABSENT from the provider. Use a separate provider-inputs object per test.
- ❌ Don't forget to `mockRestore()` the `console.warn` spy — leaking it silences
  warnings for every subsequent test in the run.
- ❌ Don't add `coverage.thresholds` to vitest.config.ts — that is P1.M2.T1.S5's
  explicit deliverable.
- ❌ Don't append to `Form.test.tsx` if a clean isolated `Form.coverage.test.tsx`
  is feasible — isolation keeps the existing file regression-free and makes the
  coverage intent explicit.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- The 5 uncovered **functions** (the headline 28.6% → 90% gap) all live on the
  public `FormContext.debouncedSubmit` / `submitImmediate` surface and are
  trivially invokable from a `<ContextCapture/>` consumer (Task 3) — this alone
  takes function coverage 2/7 → 7/7.
- The biggest **statement** chunk (`getFormState`, 34 lines) is reachable through
  a single `selectTitle` render with a function descriptor (Task 4) — guaranteed
  safe regardless of the expression engine's dialect.
- Every remaining region maps 1:1 to a concrete scenario in the coverage map,
  and the harness/timer patterns are lifted verbatim from three existing
  passing autosave suites.
- The -1 is for the two genuinely fiddly regions: `executeAutoSave`'s
  affected-field `!isValid` path (526-552) requires a subscribing field whose
  validator fails on dependency change under precise fake-timer control, and the
  `waitForFieldValidation` 10s-timeout line (467) needs a 10s timer advance.
  Both are explicitly marked STRETCH (Task 11) — they are NOT required to clear
  the 90% gate, since Tasks 2-10 alone push Form.tsx to ~92%+ statements and
  100% functions. If Task 11 proves flaky, drop it without jeopardizing the gate.
