# Research Notes — P2.M1.T1.S2: Extract Controller integration logic into useField hook

Scope: IMPLEMENT `packages/react/src/hooks/useField.ts` body (the throwing S1
stub becomes real), refactor `Field.tsx` to delegate to it, export `useField`
from the barrel. Field behavioral parity is the HARD gate (S3 + all Field tests
pass unmodified). S1 (P2.M1.T1.S1) landed the type contract + stub; this is the
extraction.

## 1. Current state (verified)

- `packages/react/src/hooks/useField.ts` (188 lines) is a THROWING STUB (S1):
  exports `UseFieldParams<TName>`, `UseFieldReturn`, `useField` (throws). JSDoc
  says "STUB / NOT IMPLEMENTED / extraction in S2".
- `packages/react/src/__tests__/useField.test.tsx` (13 lines) asserts the stub
  THROWS (`/not implemented/i`). **MUST change in S2** — useField no longer throws.
- `packages/react/src/__typechecks__/useField.test-d.ts` (36 lines) asserts
  `UseFieldReturn` ↔ `FieldRenderAPI` bidirectional assignability. **Stays valid**
  as long as the field set is unchanged (it is — S1 locked it). Consumed by
  `tsc --build` (`pnpm typecheck`), NOT vitest.
- `packages/react/src/components/Field.tsx` (702 lines) owns ALL the logic inline.
- `packages/react/src/index.ts` does NOT export useField yet (S1 deferred the
  barrel export). Field export block = L55-56; Hooks export block = L72-78
  (useFormState is the only hook with a companion `export type` line — the model).

## 2. The extractable logic in Field.tsx (line map → what moves into useField)

| Concern | Field.tsx lines | Moves to useField? |
|---|---|---|
| useFormContext destructure (config, formConfig, methods, changeField, setFieldValidating, register/unregisterWatcherSetter) | 168-171 | YES (hook calls it internally) |
| useConfigContext / useGroupContext | 173-174 | YES |
| inputConfig resolution memo (resolveInputConfig + provider/form merge + inputConfigProp) | 145-174 (memo body) | YES |
| **Registration effect (registerField/unregisterField)** | 178-184 | **NO — stays in Field** (per contract bullet b) |
| watchers state + registerWatcherSetter effect | 186-197 | YES (hook owns watchers) |
| useInferredInputs + group merge + useSubscriptions | 199-214 | YES |
| useConditions | 216-223 | YES |
| setValue conditions: setValueRef/getValuesRef + effectiveSetValue + effect | 225-275 | YES (**preserve ref pattern — PRD §7.1.1**) |
| usePropsEvaluation | 277-288 / 309 | YES |
| disabled resolution memo (prop > config > condition > group > props-merge > false) | 312-357 | YES |
| visible resolution memo | 359-371 | YES (compute here; Field does the null guard? — see §3) |
| label resolution memo (resolveLabel) | 373-376 | YES |
| passSubscriptions watch + subscribedState memo (useWatch + makeProxyState) | 418-460 | YES |
| validationRules memo (runValidator / resolveErrorMessage) | 462-502 | YES |
| handleChange (parse + onChange + changeField) | 504-518 | YES |
| `if (!isVisible) return null;` | 521-523 | **Render-layer — see §3 (hook returns null renderedField when hidden)** |
| `<Controller>` + render callback (format, stateInjection, mergeFieldProps, template/host/component, forwardRef §20.1/§20.4, children render-prop) | 527-698 | YES — **the Controller element is the hook's `renderedField` return** |

## 3. KEY DESIGN DECISION — Controller ownership & children application

This is the crux and the highest-risk decision in the task. Two designs:

### Design A — Field applies children (literal work-item wording)
Work item bullet (c): "Field renders the returned renderedField OR children
render-prop." Taken literally, the hook returns RAW renderedField + live
fieldState/formState/fieldProps, and Field does `children(result) ?? result.renderedField`.

**Problem:** `fieldState`/`formState`/`finalProps` only exist INSIDE the
Controller render callback. To expose them at the hook's top-level return, you
must either:
- (A1) `useController` instead of `<Controller>` — gives `{field, fieldState,
  formState}` as return values directly. **BUT** useController ALWAYS registers
  the field with RHF (mounts the controller). Current behavior mounts the
  Controller ONLY when visible (`if (!isVisible) return null` is BEFORE `<Controller>`
  at Field.tsx:529→536), so hidden fields are NOT RHF-registered today.
  Switching to useController registers hidden fields → risks changing
  validation/submit semantics for conditionally-hidden fields (unobservable
  gap without reading all 2183 test lines in detail). **RISKY.**
- (A2) `<Controller>` + capture fieldState/formState/finalProps into state
  during the Controller render callback (guarded setState to avoid loops).
  This setState-during-Controller-render is exactly the pattern that can trip
  "Maximum update depth exceeded" — the very regression `Field.subscriptionStability.test.tsx`
  guards against. **RISKY** (stability test).
- (A3) `<Controller>` + ref capture (no setState) → Field reads refs for the
  children path → **one-render-behind staleness** for the render-prop (the
  Controller callback writes the ref AFTER Field has already rendered children
  with the stale ref). Breaks `should update touched state after blur` (Field.test.tsx:1635). **RISKY.**

### Design B/C (RECOMMENDED) — Hook owns the Controller + its render callback (including children application)
Keep `<Controller>` (conditionally mounted when visible — preserves the
hidden-field invariant). MOVE the Controller + its ENTIRE render callback
(including the `typeof children === "function"` block, identical to current
Field.tsx:686-697) into the hook. The hook returns `renderedField` = the
`<Controller>` element when visible, `null` when hidden.

- Field.tsx becomes: `const { renderedField } = useField(params); /* registration effect */ return renderedField;`
- The `if (!isVisible)` guard becomes `renderedField = null` when hidden →
  Field renders null → Controller never mounts (hidden invariant PRESERVED).
- NO state-capture, NO useController, NO staleness, NO loop risk. It is
  literally a MOVE of the existing Controller block. **Lowest behavioral risk.**
- `UseFieldReturn` still returns `fieldState`/`fieldProps`/`watchers`/`formState`
  for the public type contract (the test-d file enforces the shape). `watchers`
  is owned by the hook. `fieldState`/`formState`/`fieldProps` are captured from
  the Controller render callback into a ref so the return honors the contract
  (Field does NOT consume them — it only renders `renderedField`; the
  render-prop children are applied INSIDE the Controller callback where the
  real, live values are). Direct-hook consumers (future) are the audience for
  those fields; the Field tests do not exercise hook-direct fieldState reads.

**DECISION: Design B/C.** It is the minimal-diff, behavior-preserving refactor.
It refines the work item's literal "Field applies children" wording: the
children render-prop is applied inside the hook's Controller render callback
(identical code, relocated), and `renderedField` encapsulates that. This is
necessary because exposing live Controller-callback data to a separate render
layer is not cleanly possible without useController (hidden risk) or
state-capture (stability risk). **Behavior preservation is the hard gate and
takes precedence over the literal bullet wording.** Document this prominently.

## 4. Registration split (per contract)

- Field.tsx: calls `useFormContext()` to get `registerField`/`unregisterField`
  + the registration `useEffect` (Field.tsx:178-184 moved verbatim, gated on
  `shouldRegister`). **Stays in Field** (contract bullet b).
- useField: calls `useFormContext()` internally for config/formConfig/methods/
  changeField/setFieldValidating/registerWatcherSetter/unregisterWatcherSetter.
  (Two context reads — Field for registration, hook for the rest — is fine;
  context reads are idempotent.)
- useField owns the watchers state + registerWatcherSetter effect (it returns
  `watchers`). Field does NOT do watcher registration.

## 5. What MUST be preserved verbatim (the parity contract)

- **forwardRef delivery (§20.1/§20.4):** `coreProps.forwardRef = field.ref`
  (NOT `ref`); host-element path (`typeof component === "string"`) translates
  `forwardRef` back to React's `ref` key + strips non-DOM props
  (`formState`, `state`, `subsPropName`). Guards: `Field.forwardRef.test.tsx`,
  `FieldForwardRef.acceptance.test.tsx`, `Field.test.tsx` forwardRef describe
  + `does not leak forwardRef onto the fallback host element` + `focuses the
  fallback input on a failed required submit`.
- **setValue effect ref pattern (§7.1.1):** `setValueRef`/`getValuesRef` refs
  (assigned every render, not in deps) + the `currentValue !== value` guard
  to prevent infinite loops. Guards: `applies a field-level set condition`
  + `applies a group-level set condition` (Field.test.tsx:1925-1987).
- **Disabled resolution order:** prop > config.disabled > condition > group >
  props-merge layers (consulted in mergeFieldProps priority order) > false.
  ~20 tests in Field.test.tsx (505-1591) exhaust this.
- **8-layer merge via mergeFieldProps:** the exact 9 options keys + coreProps.
- **parse/format arg orders:** `parse(newValue, inputConfig.parser, providerConfig.parsers)`;
  `format(field.value, inputConfig.formatter, providerConfig.formatters)`.
- **runValidator/resolveErrorMessage:** field-level THEN type-level; arg order
  `runValidator(spec, value, methods.getValues(), providerConfig.validators)`.
- **state injection (provideState/passSubscriptions):** stateInjection object,
  `defaultSubscriptionPropName`, `passSubscriptionsAs`, formState delivered to
  plain components ONLY when opted-in. Covered by `validation-report-fixes.test.tsx`
  (NOT Field.test.tsx — but must still pass).
- **subscription stability:** `useInferredInputs` signature-stable memo +
  `allSubscriptions` dedup must not churn on value change. Guard:
  `Field.subscriptionStability.test.tsx`.
- **render-prop children:** applied with `{fieldState, renderedField, fieldProps,
  watchers, formState}` (Field.test.tsx:1592-1664).

## 6. Field.test.tsx behavior catalog (the parity gate) — from scout

39 describe blocks / ~60 `it`s. Categories: rendering (6), conditions (3),
selectProps (2), value-transform (2), validation (2), disabled-prop-override
(2), disabled-via-props-merge-layers (9), JSX-disabled-highest (4),
config-disabled (5), conditions-disabled (6+ nested), multi-field isDisabled (5),
render-prop (3), shouldRegister (2), type-override (1), config-less/defaults (3),
form-level-inputs (2), host-element fallback (4), setValue conditions (2),
FieldGroup-disabled (1), type-level-validator (1), templates+render-prop (3),
forwardRef delivery (1).

**Private harness is FILE-LOCAL** (TestInput/TestSwitch/testInputs at
Field.test.tsx:19-103). No other test imports it — every test file defines its
own. So refactoring Field.tsx internals is safe as long as the PUBLIC behavior
(`<Field>` rendered inside `<FormalityProvider><Form>`) is unchanged.

## 7. Core fn signatures (confirmed, scout §5)

- `resolveInputConfig(type, inputs, defaultType="textField"): InputConfig | undefined`
- `mergeFieldProps({ providerDefaultFieldProps, providerSelectDefaultFieldProps, formDefaultFieldProps, formSelectDefaultFieldProps, inputProps, fieldConfigProps, selectProps, componentProps, coreProps }): Record<string, unknown>` (coreProps wins)
- `resolveLabel(fieldName, fieldConfig?, evaluatedSelectProps?, componentProps?): string`
- `parse(value, parserSpec?, namedParsers?): unknown`
- `format(value, formatterSpec?, namedFormatters?): unknown`
- `runValidator(spec, value, formValues, namedValidators?): Promise<ValidationResult>`
- `resolveErrorMessage(result, errorMessages?): string | undefined`

## 8. Validation gates (verified commands)

- `pnpm typecheck` (tsc --build; validates useField.ts + the test-d file)
- `pnpm test` (vitest run; react include `src/**/*.test.{ts,tsx}`)
- `pnpm lint` (eslint .; rules-of-hooks + verbatimModuleSyntax + unused-args)
- `pnpm build` (pnpm -r build; tsup)
- `pnpm test:coverage` (90% hard gate on packages/react/** per §1.3.7)

## 9. Sibling/parallel boundaries

- P2.M1.T1.S1 (PREV, complete): landed the type contract + stub — this task's
  target.
- P2.M1.T1.S3 (NEXT): "Verify Field behavioral parity after extraction" —
  depends on THIS. This PRP must leave Field behavior identical so S3 passes.
- P2.M1.T2.S1 (sibling): REMOVES useFieldDisabledState — DIFFERENT file; no overlap.
- P2.M2.T1.S1 (sibling): edits overlays.ts forwardRef wording — READ ONLY here.
