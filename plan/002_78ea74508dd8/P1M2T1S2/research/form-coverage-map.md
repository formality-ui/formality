# Form.tsx Coverage Map — exact uncovered regions (P1.M2.T1.S2)

Source: `coverage/coverage-final.json` from
`pnpm vitest run --coverage --exclude '**/useFormState.test.tsx'` over
Form/autosave/render-isolation suites (the sibling S1 `useFormState.test.tsx`
currently FAILS — see note — and would block the JSON emit, so it was excluded
to capture the true Form.tsx baseline).

## Baseline (Form.tsx only)

| metric    | covered | total | %      | target |
| --------- | ------- | ----- | ------ | ------ |
| stmt      | 337     | 440   | 76.59% | ≥90%   |
| branch    | 60      | 78    | 76.92% | ≥90%   |
| **func**  | **2**   | **7** | **28.57%** | ≥90% |
| line      | 337     | 440   | 76.59% | ≥90%   |

Need: +59 stmt / +10 branch / +5 func to clear 90% on Form.tsx alone.

## The 5 uncovered FUNCTIONS (func 28.6% → must reach 90%)

All 5 are the `Object.assign`-attached helper methods on the debounce adapter
built inside the `useEffect` at Form.tsx:562-598. They are exposed publicly via
`FormContext.debouncedSubmit`, so a context-capturing test can invoke them
directly.

| fn# | v8 name              | decl@loc      | what it is                              | how to hit                                            |
| --- | -------------------- | ------------- | --------------------------------------- | ----------------------------------------------------- |
| #1  | "Object.assign.cancel" | 566-568 (main arrow) | `immediateFn` body: `executeAutoSave()` | `<Form debounce={false} autoSave>` + any Field change (calls `debouncedSubmitRef.current?.()` → immediateFn()) |
| #2  | "cancel"             | 570 (no-op)   | `immediateFn.cancel = () => {}`         | `ctx.debouncedSubmit.cancel()` on a `debounce={false}` form |
| #3  | "flush"              | 571           | `immediateFn.flush = () => executeAutoSave()` | `ctx.debouncedSubmit.flush()` OR `ctx.submitImmediate()` (debounce={false}) |
| #4  | "pending"            | 572           | `immediateFn.pending = () => false`     | `ctx.debouncedSubmit.pending()` on a `debounce={false}` form |
| #5  | "pending"            | 590           | lodash-fn `.pending = () => false`       | `ctx.debouncedSubmit.pending()` on a `debounce={500}` form |

(fn#0 = `Form` component, fn#6 = `transformValuesForSubmit` — both already hit.)

## Uncovered STATEMENTS grouped by scenario

| region (lines)        | function              | scenario that covers it                                                                 |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| 147                   | `mergedInputs` useMemo | `formConfig.inputs` as a **function** (`(providerInputs) => ({...})`)                   |
| 233-237               | `addSubscription`     | subscriber added while target NOT mounted → `pendingWatcherUpdates` queue               |
| 256-260               | `removeSubscription`  | both `console.warn` dev-arms (exists-removed warn + double-cleanup warn) — spy `console.warn` |
| 283-291               | `registerWatcherSetter` | target mounts AFTER a pending subscription existed → process pending                   |
| **364-397 (34 stmt)** | `getFormState`        | ONLY reachable via `resolvedTitle` when `formConfig.selectTitle` is set (626). Biggest chunk. |
| 411-418               | `handleSubmit`        | form-level `validate` prop returning `{field: "msg"}` → `setError` + `return` (block)   |
| 467                   | `waitForFieldValidation` | 10s-timeout `return true` — advance fake timers ≥10000ms (low value, optional)       |
| 489-490               | `executeAutoSave`     | early `return` when `changedFields.size === 0` — call `ctx.debouncedSubmit.flush()` with no pending change |
| 526-532               | `executeAutoSave`     | affected-field `methods.trigger` returns `!isValid` → return (subscribed field fails validation) |
| 544-552               | `executeAutoSave`     | post-trigger version check + `formState.errors.length > 0` return                       |
| 565-581               | debounce `useEffect`  | `debounceMs === false` branch → build `immediateFn` (also fn#1-#4)                      |
| 590                   | debounce `useEffect`  | normal lodash branch `.pending` (fn#5)                                                  |
| 603-607               | `submitImmediate`     | capture ctx, call `ctx.submitImmediate()` → `.flush()` path (605-606 else is effectively dead — lodash+immediateFn both have `.flush`) |
| **626-637 (12 stmt)** | `resolvedTitle`       | `formConfig.selectTitle` truthy → `getFormState()` + `buildFormContext` + `evaluateDescriptor` + `resolveFormTitle` |
| 737-738               | `transformValuesForSubmit` | `else` branch: value whose `config[name].type` has NO entry in mergedInputs (e.g. `type:"autocomplete"` absent from provider inputs) |

## API contracts verified (for scenario design)

- `evaluateDescriptor(descriptor, ctx)` (core/expression/evaluate.ts:405):
  - `string` → evaluated as expression
  - `function` → **returned as-is** (NO throw) ← safest `selectTitle` to trigger getFormState
  - `object`/`array` → recursed
- `resolveFormTitle(formTitle?, evaluated?)` (core/labels/resolve.ts:107):
  evaluated !== undefined/null → `String(evaluated)`; else `formTitle`.
- `buildFormContext(fields, record, errors, defaultValues, touched, dirty)` (core/expression/context.ts:145).
- `Field.tsx:415` calls `changeField(name, parsedValue, inputConfig)`; `Field.tsx:354/385`
  call `setFieldValidating(name, true/false)`. So `<Field>` changes drive the autosave path.
- `submitImmediate` + `debouncedSubmit` are on `FormContext` but NOT called by Field —
  must be driven by a context-capturing consumer component.

## NOTE on sibling task S1

`packages/react/src/__tests__/useFormState.test.tsx` (P1.M2.T1.S1) currently
FAILS: `useWatch({name:"x"})` inside the hook returns `["hello"]` (array) not
`"hello"` for the single-name case in THIS RHF version, so the S1 assertion
`expect(...fields.x.value).toBe("hello")` sees the array. **That is S1's bug,
not ours** — but it currently blocks `pnpm test:coverage` from emitting the
coverage JSON (vitest exits non-zero). The S2 suite must therefore be validated
with an explicit file-targeted vitest invocation
(`pnpm vitest run <file> --coverage`) while S1 is being fixed, and the full
`pnpm test:coverage` gate is only expected green once BOTH S1 and S2 land
(S5 enforces the threshold).
