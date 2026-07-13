# Hooks & Contexts v1.0 Compliance Audit — `packages/react/src`

Audit of all 6 hooks and 3 contexts against PRD §4 (Context System), §2.3 (memoization),
§8.3 (subscription lifecycle / churn fix), §9 (Subscription System), §12.5/§12.6
(useInferredInputs / useConditions), §17 (Props Evaluation Pipeline), §12 (Auto-Save).

All findings cite exact `file:line` evidence. Research only — no files edited.

---

## HOOK 1 — `hooks/useConditions.ts` (PRD §12.6 / §13.6)

**File:** `packages/react/src/hooks/useConditions.ts:1-279`

### (a) Interface
- Signature: `useConditions(options: UseConditionsOptions): ConditionResult` (:88-89, :279).
- `UseConditionsOptions` (:22-35): `{ conditions, subscribesTo?, props?, allFieldsConfig? }` — SUPERSET of PRD §12.6's `{ conditions, subscriptions? }`.
- **Return type is `ConditionResult`** (from `@formality-ui/core`), NOT the PRD §12.6 pseudo-shape `{ isDisabled: boolean; isVisible: boolean }`.
  - `ConditionResult` = `{ disabled, visible, setValue, hasDisabledCondition, hasVisibleCondition, hasSetCondition }`.
- **Deviation:** property names differ from PRD §12.6 (`disabled`/`visible` vs spec's `isDisabled`/`isVisible`). Functionally compliant (richer) but **naming diverges**. Severity: low (consumers read actual fields). ACCEPTED DEVIATION (document, don't change).

### (b) Behavior
- Uses `useInferredInputs` to derive watch fields from `conditions` + `subscribesTo` (:92-96). ✔
- `useWatch({ control: methods.control, name: watchFields })` for isolated subscription (:100-103). ✔
- Empty-conditions early return at :259-269. ✔
- Final evaluation via Core `evaluateConditions({ conditions, fieldValues, fieldStates, record, props })` (:273-277). ✔
- Documented **two-pass + iterative** disabled-state computation (Pass 1 base states → Pass 2 iterative convergence maxIterations=10 → Pass 3 merge). EXTENSION beyond PRD §12.6 sketch. `allFieldsConfig` threaded by `useField` (:213). ✔ Well-documented.

### (c) Exported
- `index.ts:75`: `export { useConditions }`. ✔ (no type export of `UseConditionsOptions` — minor).

### (d) Test evidence
- **No dedicated `useConditions.test.tsx`.** Covered indirectly via `Field.test.tsx:1134,1174,1184`.
- **Gap:** no isolated unit tests for return shape.

### Verdict: **PARTIAL** — behavior rich and correct; PRD §12.6 return-shape naming is a documented deviation (richer superset); no isolated test file.

---

## HOOK 2 — `hooks/useField.tsx` (P2.M1.T1 extraction; PRD §1.3.3 / §5.3 / §20)

**File:** `packages/react/src/hooks/useField.tsx:1-~781` (function `useField` at :155).

### (a) Interface
- `UseFieldParams<TName extends string = string>` (:54-110). Generic over `TName` (PRD §C.4 / T2.1). ✔
- `UseFieldReturn` (:119-152): `{ fieldState, renderedField, fieldProps, watchers, formState }` — structurally identical to `FieldRenderAPI`. ✔ (Enforced by `__typechecks__/useField.test-d.ts`.)

### (b) Behavior
- Owns full RHF `<Controller>` lifecycle: input-config resolution (:165-189), watcher registration (:194-199), subscriptions (:204-219), conditions (:221-227), setValue effect (:229-276), props evaluation (:278-287), disabled/visible resolution (:314-361), label (:363-365), provideState/passSubscriptions (:378-432), validation rules (:435-474), change handler (:477-494), Controller render callback with format→stateInjection→8-layer `mergeFieldProps`→forwardRef→template/host/component→render-prop children (:518-end). ✔
- **`<Controller>` mounts ONLY when visible** — preserves hidden-field-not-RHF-registered invariant. ✔
- **forwardRef delivery (§20.1/§20.4):** `forwardRef: field.ref` at **useField.tsx:678**; host-element path translates `forwardRef` → React special `ref` key + strips non-DOM props. ✔
- **`<Field>` delegates to `useField`:** `components/Field.tsx:12` imports; `Field.tsx:143-160` calls `useField({...})` and returns `renderedField`. Field.tsx owns ONLY registration `useEffect` (:132-140). ✔ Confirms P2.M1.T1 extraction complete.

### (c) Exported
- `index.ts:80-81`: `export { useField }` + `export type { UseFieldParams, UseFieldReturn }`. ✔

### (d) Test evidence
- `__tests__/useField.test.tsx` — dedicated file. `:125` `describe("useField (gap_analysis G6 — PRD §1.3.3)")`; `:126` returns UseFieldReturn contract; `:147` returns null renderedField when hidden; `:157` applies render-prop children; `:198` isolated direct-hook contract (registers watcher setter on mount/unmount, returns watchers Record). Plus `__typechecks__/useField.test-d.ts` (bidirectional equivalence with `FieldRenderAPI`).

### Verdict: **COMPLIANT** — fully extracted; `<Field>` is thin wrapper; returns documented contract; dedicated tests present.

---

## HOOK 3 — `hooks/useFormState.ts` (PRD §2.1.5 / §4 form state)

**File:** `packages/react/src/hooks/useFormState.ts:1-160` (function at :78).

### (a) Interface
- `UseFormStateOptions` (:16-25): `{ name: string | string[] }` — `name` REQUIRED. ✔ Matches "isolate subscriptions, never watch-all".
- Returns `IsolatedFormState` (:81). `base` object (:114-130): `{ fields, record, isDirty, isTouched, isValid, isSubmitting, errors, touchedFields, dirtyFields, defaultValues }`. `record` is lazy getter (:132-135). ✔

### (b) Behavior
- RHF `useWatch({ control, name: fieldNames })` for isolated subscription (:59-62). ✔
- Proxy-wrapped `CustomFieldState` per watched field via `makeProxyState` (:75-94) — does NOT touch `getFieldState` to avoid whole-form subscription. ✔
- `record` accessed lazily via `Object.defineProperty` getter (:132-135). ✔
- Falls back gracefully outside `<Form>`: try/catch around `useFormalityFormContext`, `record` degrades to `{}` (:42-52, :133). ✔

### (c) Exported
- `index.ts:72-73`: `export { useFormState }` + `export type { UseFormStateOptions }`. ✔

### (d) Test evidence
- `__tests__/useFormState.test.tsx`: single watched name (:69), multiple (:107), empty-name-array early return (:125), `record` lazy getter (:145), outside-Form try/catch fallback (:170).

### Verdict: **COMPLIANT**

---

## HOOK 4 — `hooks/useInferredInputs.ts` (PRD §12.5 + §2.3 pt.5 + §8.3 churn fix) — CRITICAL

**File:** `packages/react/src/hooks/useInferredInputs.ts:1-110` (function at :52).

### (a) Interface
- `UseInferredInputsOptions` (:5-26): `{ selectProps?, formDefaultFieldProps?, providerDefaultFieldProps?, conditions?, subscribesTo? }` — SUPERSET of PRD §12.5's `{ conditions? }`. ✔
- Returns `string[]` (:52). ✔

### (b) Behavior — THE §8.3 CHURN FIX ✔✔✔
- **Content-signature memo is present and correct:**
  - `:76-82`: `const signature = JSON.stringify({ selectProps, formDefaultFieldProps, providerDefaultFieldProps, conditions, subscribesTo });`
  - `:84-109`: `return useMemo(() => { ... return [...new Set(inferred)]; }, [signature]);`  ← memo keyed on `[signature]`, NOT on raw array identities.
- Comment block (:54-74) documents the regression + fix: "formerly defaulted to a fresh `[]` on every call ... 'Maximum update depth exceeded'."
- Dedup via `new Set` (:108). ✔ Matches PRD §2.3 pt.5 + §8.3 "memoize on a content signature". ✔

### (c) Exported
- `index.ts:77`: `export { useInferredInputs }`. ✔

### (d) Test evidence — STRONG
- `__tests__/useInferredInputs.test.tsx`: correctness (:20), **`describe("referential stability (regression: max-depth loop)")`** (:47) — SAME array reference across rerenders (:48), stable with undefined conditions/subscribesTo (:61), stable with NEW inline `subscribesTo` array (:77), stable with NEW inline `conditions` (:93), NEW reference only when content changes (:109).
- `__tests__/Field.subscriptionStability.test.tsx:65` — end-to-end: typing into watched field does not churn subscriptions / hit max update depth (:70).

### Verdict: **COMPLIANT** — §8.3 churn fix correctly implemented AND directly regression-tested.

---

## HOOK 5 — `hooks/usePropsEvaluation.ts` (PRD §17 Props Evaluation Pipeline)

**File:** `packages/react/src/hooks/usePropsEvaluation.ts:1-~260` (function at :81-86).

### (a) Interface
- `UsePropsEvaluationOptions` (:61-75): `{ selectProps?, formDefaultFieldProps?, providerDefaultFieldProps?, subscribesTo?, fieldName }`. ✔
- Returns `EvaluatedPropsResult` (:50-58): `{ providerSelectProps, formSelectProps, fieldSelectProps }` — three independently-evaluated layers for `mergeFieldProps`'s 8-layer priority. ✔ Matches §17.

### (b) Behavior
- Infers watch fields via `useInferredInputs` (:92-98). ✔ (Consumes the stable array from §8.3 fix.)
- `useWatch({ control, name: watchFields })` (:101-103). ✔
- Builds isolated `FormState` with proxy-wrapped fields for ONLY watched fields (:107-150) — does NOT subscribe to whole-form state. ✔
- Evaluates all three layers separately, supporting expression descriptors (`evaluateDescriptor`) AND function callbacks (usePropsEvaluation.ts:154-243). ✔ Handles §3.1 `SelectValue` union.
- Final memo deps `[:245-252]`. ✔

### (c) Exported
- `index.ts:76`: `export { usePropsEvaluation }`. ✔
- Note: `EvaluatedPropsResult` / `UsePropsEvaluationOptions` types NOT type-exported from `index.ts` — minor.

### (d) Test evidence
- **No dedicated `usePropsEvaluation.test.tsx`.** Covered indirectly via `__tests__/selectDefaultFieldProps.test.tsx`: provider expression-based (:108), provider function callbacks (:251), re-evaluation on dependency change (:354), priority ordering (:478), form-level (:689/:835/:938/:1191).
- **Gap:** no isolated unit test invoking `usePropsEvaluation` directly.

### Verdict: **PARTIAL** — behavior compliant with §17; no isolated test file; types not exported.

---

## HOOK 6 — `hooks/useSubscriptions.ts` (PRD §8.3 / §9)

**File:** `packages/react/src/hooks/useSubscriptions.ts:1-89` (function at :23-25).

### (a) Interface
- `useSubscriptions(fieldName: string, subscriptions: string[]): void` (:23-25). ✔ Matches §8.3.

### (b) Behavior — LIFO + runIdRef tracking ✔
- Pulls `addSubscription`/`removeSubscription` from `useFormContext` (:27). ✔
- **runIdRef tracking:** `const runIdRef = useRef<number>(0)` (:36); `runSubscriptionsRef = useRef<Map<number,string[]>>(new Map())` (:40); `const currentRunId = ++runIdRef.current` (:44). ✔
- **Per-run subscription capture:** `runSubscriptionsRef.current.set(currentRunId, [...subscriptions])` — copies array (:48). ✔
- **Adds all subscriptions** in forward order (:50-58). ✔
- **Cleanup uses THIS run's captured array** (:66-67) — not current `subscriptions` value. ✔
- **LIFO unsubscribe:** `[...thisRunSubscriptions].reverse().forEach((target) => removeSubscription(target, fieldName))` (:79-81). ✔ Exactly matches §8.3.
- **Map cleanup to prevent leaks:** `.delete(currentRunId)` (:85). ✔
- **Effect deps:** `[fieldName, subscriptions, addSubscription, removeSubscription]` (:88) — matches §8.3 verbatim. Stability of `subscriptions` guaranteed upstream by `useInferredInputs`. ✔
- Dev-only `console.warn` logging (gated `process.env.NODE_ENV !== "production"`, :54-58, :71-77). ✔

### (c) Exported
- `index.ts:78`: `export { useSubscriptions }`. ✔

### (d) Test evidence — VERY STRONG
- `__tests__/useSubscriptions.test.tsx` (1180+ lines): basic add on mount (:159), empty array no-op (:178), per-effect cleanup isolation (:188), rapid changes no leak (:232), **"should use LIFO cleanup ordering"** (:282), React 18 StrictMode (:333/:380), array isolation (:429), dev logging (:459/:469/:484/:502), double-cleanup detection (:534), invertedSubscriptions cleaned on unmount (:550/:573), GC (:605), nested/multi-field (:658/:730), rapid-change subscription count balance (:802/:850/:886), memory leak detection (:927/:936/:1011), different patterns (:1064/:1111/:1142).
- `__tests__/Field.subscriptionStability.test.tsx:70` — typed-into-watched-field stability.

### Verdict: **COMPLIANT**

---

## CONTEXT 1 — `context/FormContext.ts` (PRD §4.1)

**File:** `packages/react/src/context/FormContext.ts:1-157`.

### (a) Interface — `FormContextValue` (FormContext.ts:25-139)
All required members present: config (:33), formConfig (:36), record? (:39), registerField/unregisterField (:49/:57), addSubscription/removeSubscription (:69/:77), registerWatcherSetter/unregisterWatcherSetter (:85/:92), changeField (:101-105 — superset: adds optional `inputConfig?` 3rd param), setFieldValidating (:112), getFormState (:120), onSubmit? (:121 — PRD declares required; impl optional — minor), debouncedSubmit: DebouncedFunction (:124), submitImmediate (:127), unusedFields (:133), methods: UseFormReturn<TFieldValues> (:139). Generic `<TFieldValues>` (:24).

### (b) Behavior
- `createContext<FormContextValue | null>(null)` (:135) — null default. ✔
- `useFormContext` throws `"useFormContext must be used within a Form component"` when null (:148-153). ✔

### (c) Exported
- `index.ts:40-41`. ✔

### (d) Test evidence
- No dedicated FormContext.test.tsx; covered through Form.test.tsx, Form.coverage.test.tsx, Field.test.tsx, useField.test.tsx. Throw-on-null exercised by useFormState.test.tsx:170.

### Verdict: **COMPLIANT** (minor: `onSubmit` optional vs PRD-required; `changeField` has extra optional param — both backward-compatible widenings).

---

## CONTEXT 2 — `context/ConfigContext.ts` (PRD §4.2)

**File:** `packages/react/src/context/ConfigContext.ts:1-110`.

### (a) Interface — `ConfigContextValue` (ConfigContext.ts:14-53)
All §4.2 members present: inputs (:16), formatters (:19), parsers (:22), validators (:25), errorMessages (:28), defaultInputTemplate? (:31), inputTemplates (:34), defaultSubscriptionPropName (:37), defaultFieldProps (:40), selectDefaultFieldProps?: SelectValue (:43). ✔

### (b) Behavior
- `defaultConfigContext` (:60-71): `inputs:{}, formatters:{}, parsers:{}, validators:{}, errorMessages:{}, inputTemplates:{}, defaultSubscriptionPropName:"state", defaultFieldProps:{}`. ✔ Matches §4.2/§5.1 default.
- `createContext<ConfigContextValue>(defaultConfigContext)` (:83) — non-null default. ✔
- `useConfigContext` returns `useContext(ConfigContext)` (no throw) (:103-105). ✔

### (c) Exported
- `index.ts:37-38`. ✔

### (d) Test evidence
- No dedicated test; provider behavior covered by FormalityProvider.test.tsx + selectDefaultFieldProps.test.tsx.

### Verdict: **COMPLIANT**

---

## CONTEXT 3 — `context/GroupContext.ts` (PRD §4.3)

**File:** `packages/react/src/context/GroupContext.ts:1-95`.

### (a) Interface
- `GroupState` (:11-38): `{ isDisabled, isVisible, hasSetCondition, setValue, conditions, subscriptions }` — superset (adds hasSetCondition + setValue for group-level set/selectSet). ✔
- `GroupContextValue` (:46-56): `{ state, subscriptions, inferredInputs, config }`. ✔ Matches §4.3.
- `config: GroupConfig` (:55). ✔

### (b) Behavior — defaultGroupContext ✔
- `defaultGroupContext` (:63-75): `state.isDisabled: false` (:65), `state.isVisible: true` (:66), `state.conditions: []` (:71), `state.subscriptions: []` (:72), plus `hasSetCondition: false`, `setValue: undefined` (:67-68). Root `subscriptions: []` (:73), `inferredInputs: []` (:74), `config: { conditions: [], subscribesTo: [] }` (:75). ✔ Matches §4.3 default exactly.
- `createContext<GroupContextValue>(defaultGroupContext)` (:86) — non-null default. ✔
- `useGroupContext` returns `useContext(GroupContext)` (no throw) (:95). ✔
- Nesting handled by consumer (`FieldGroup.tsx:64` reads parent, merges :93, provides :136-149). ✔ Satisfies §4.3 "Nesting support / Accumulation".

### (c) Exported
- `index.ts:43-44`. ✔

### (d) Test evidence
- No dedicated test; covered by `FieldGroup.test.tsx`: visibility (:81), disabled propagation (:181), nesting (:209), group without config (:283).

### Verdict: **COMPLIANT**

---

## CROSS-CUTTING FINDINGS

### Export completeness (`packages/react/src/index.ts`)
All 6 hooks exported: useFormState (:72), useConditions (:75), usePropsEvaluation (:76), useInferredInputs (:77), useSubscriptions (:78), useField (:80). All 3 contexts + use* hooks exported: ConfigContext (:37), FormContext (:40), GroupContext (:43). ✔
**Minor type-export gaps:** `UseConditionsOptions`, `UsePropsEvaluationOptions`, `EvaluatedPropsResult` not type-exported (only hook values). Low severity.

### §8.3 churn fix (CRITICAL) — FULLY IN PLACE ✔
- `useInferredInputs` memoizes on JSON content signature (useInferredInputs.ts:76-82, :109) — NOT fresh `[]` in deps.
- `useSubscriptions` effect deps include stable `subscriptions` (:88), LIFO cleanup (:79-81), per-run `runIdRef` tracking (:36/:44/:48/:66/:85).
- Regression tests: `useInferredInputs.test.tsx:47-115` (referential stability) + `Field.subscriptionStability.test.tsx:65-110` (no per-keystroke churn / no max-depth).

### Gaps / Residual Risks
1. **`useConditions` return-shape mismatch with PRD §12.6** (low): returns `ConditionResult` (`disabled`/`visible`/...) not `{ isDisabled, isVisible }`. Functionally richer; consumers read actual fields. Documented deviation.
2. **No isolated test files** for `useConditions` or `usePropsEvaluation` (both covered behaviorally). Coverage exists but not hook-isolated.
3. **`FormContext.onSubmit` is optional** (:121) vs PRD-required. Intentional/compatible.
4. **`changeField` has extra optional `inputConfig` param** (:101-105). Compatible widening.
5. **Option/result types for `useConditions`/`usePropsEvaluation` not re-exported.** Minor DX gap.

### Overall verdict per item
| Item | Verdict |
|---|---|
| useConditions | PARTIAL (return-shape naming deviation; no isolated test) |
| useField | COMPLIANT |
| useFormState | COMPLIANT |
| useInferredInputs | COMPLIANT (§8.3 fix verified) |
| usePropsEvaluation | PARTIAL (no isolated test; types not exported) |
| useSubscriptions | COMPLIANT |
| FormContext | COMPLIANT (minor optional-`onSubmit`) |
| ConfigContext | COMPLIANT |
| GroupContext | COMPLIANT |
