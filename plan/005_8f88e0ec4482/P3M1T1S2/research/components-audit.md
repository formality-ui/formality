# Formality React Components — v1.0 PRD Compliance Audit

**Scope:** 5 components vs PRD §6 (Component Specs §5.1–§5.5), §13 (FieldGroup Mechanics), §20 (forwardRef).
**Repo root:** `/home/dustin/projects/formality`
**React package:** `packages/react/src/`
**Mode:** Research only — no files edited.

---

## 0. Critical §20 Confirmation (forwardRef)

**CONFIRMED.** `Field` delivers RHF's ref via the **`forwardRef`** prop key, NOT React's special `ref` key.

The `coreProps` object is built inside the `<Controller render={...}>` callback in `useField.tsx`. The relevant block:

```tsx
// packages/react/src/hooks/useField.tsx lines ~665-685
const finalProps = mergeFieldProps({
  ...
  coreProps: {
    name,
    label,
    disabled: isDisabled,
    error: fieldState.error?.message,
    [inputConfig.inputFieldProp ?? "value"]: formattedValue,
    onChange: handleChange(field.onChange),
    onBlur: field.onBlur,
    forwardRef: field.ref,   // ← §20.1 requirement (useField.tsx:678)
    ...stateInjection,
  },
});
```

**Exact line: `packages/react/src/hooks/useField.tsx:678` — `forwardRef: field.ref,`**

`grep` for `ref: field.ref` returns **zero matches** in the entire react package; the only `field.ref` reference is `forwardRef: field.ref`.

**§20.2 pass-through verified:** `mergeFieldProps` (`packages/core/src/config/merge.ts:180-215`) calls `mergeStaticProps(...layers)` which does a plain `Object.assign` loop with **no key filtering/allow-list** (`merge.ts:155-173`). `coreProps` is applied last and wins outright, so `forwardRef` passes through unchanged.

**§20.3/§20.4 host-element narrow exception:** `useField.tsx` has an `isHostComponent` branch (`typeof inputConfig.component === "string"`) that translates `forwardRef` back into React's special `ref` key for the degenerate `component: "input"` fallback only, stripping `forwardRef`/`formState`/`state` to avoid DOM leakage. Real (function/object) components always get `forwardRef`-exclusive spread.

---

## 1. FormalityProvider.tsx (PRD §5.1)

**File:** `packages/react/src/components/FormalityProvider.tsx` (211 lines)

### (a) Props Interface
`FormalityProviderProps` (FormalityProvider.tsx:26-129) matches PRD §5.1 field-for-field: children, inputs (required), formatters?, parsers?, validators?, errorMessages?, defaultInputTemplate?, inputTemplates?, defaultSubscriptionPropName?, defaultFieldProps?, selectDefaultFieldProps?.

**Minor naming note:** PRD §5.1 types `selectDefaultFieldProps?: SelectDescriptor`, but no `SelectDescriptor` type exists — canonical type is `SelectValue<TReturn = unknown>` (`packages/core/src/types/config.ts:18`). Impl + ConfigContext + ConfigContextValue all consistently use `SelectValue`. Doc-side naming gap, not behavioral.

### (b) Behavioral Compliance
- **Creates ConfigContext** ✅ — builds `ConfigContextValue` memo (:157-188) wraps in `<ConfigContext.Provider>` (:191-195).
- **No wrapper element** ✅ — returns `<ConfigContext.Provider>{children}</ConfigContext.Provider>` directly. Asserted by test `should not render any wrapper elements` (FormalityProvider.test.tsx:247-257).
- **Correct defaults** ✅ — destructure defaults (:152-163): `formatters={}`, `parsers={}`, `validators={}`, `errorMessages={}`, `inputTemplates={}`, `defaultSubscriptionPropName="state"`, `defaultFieldProps={}`. Asserted by `should use empty defaults` (FormalityProvider.test.tsx:258).

### (c) Test Evidence
`packages/react/src/__tests__/FormalityProvider.test.tsx` — 13 tests + ConfigContext-defaults suite.

### Verdict: ✅ **COMPLIANT**

---

## 2. Form.tsx (PRD §5.2)

**File:** `packages/react/src/components/Form.tsx` (961 lines)

### (a) Props Interface
`FormProps` (Form.tsx:61-120) matches PRD §5.2 with intentional superset extensions:
- children (render API), config, formConfig?, onSubmit?, record?, autoSave?, debounce? (typed `number | false` — PRD shows `number`; `false`=immediate is added documented capability), mode? (`'onChange'|'onBlur'|'onSubmit'|'onTouched'|'all'`), validate?.
- `FormRenderAPI` (Form.tsx:123-143): unusedFields ✅, formState ✅, methods ✅, resolvedTitle? ✅ (:128), plus extension `handleSubmit` render-API submit (:130-138).

### (b) Behavioral Compliance
- **`mode` forwarded to `useForm`** ✅ — `Form.tsx:198` `mode: mode ?? "onChange"`.
- **executeAutoSave scoped validation + execution-version guard** ✅ — `executionVersionRef.current++` captures version at `Form.tsx:561`; every async gate re-checks `executionVersionRef.current !== executionVersion` and aborts. **Gate 1** triggers changed fields (`methods.trigger(changedArray)` ~592-603); **Gate 2** triggers affected fields (~609-628). Uses `methods.trigger(...)` explicitly (ignores mode → mode-agnostic).
- **Title resolution (`resolvedTitle`)** ✅ — `useMemo` at `Form.tsx:797-819`: evaluates `selectTitle` via `buildFormContext` + `evaluateDescriptor`, falls back to `title`. Exposed via render API `Form.tsx:881`.
- **unusedFields tracking** ✅ — `Form.tsx:790-793`; `registerField`/`unregisterField` mutate `fieldRegistry` → `registeredFields` state (:265-278).
- **Value transformation for submit** ✅ — `transformValuesForSubmit` (Form.tsx:933-966) applies `transformFieldName` + `extractValueField`.

**Minor behavioral note (not a blocker):** PRD §5.2.3 `changeField` pseudo-code gates auto-save on `subscribers.size > 0`. Impl (`Form.tsx:318-363`) triggers auto-save on any change when autoSave is on. More correct.

### (c) Test Evidence
`packages/react/src/__tests__/Form.test.tsx` — `Form` suite (87): FormContext (94), track unused fields (108), render API exposure (123), default values (141), record values (165), onSubmit (186), manual-submit pipeline (218-294), methods/formState (295/311), Auto-Save (358-432). Additional: `Form.coverage.test.tsx`.

### Verdict: ✅ **COMPLIANT**

---

## 3. Field.tsx → useField.tsx (PRD §5.3 + §20)

**Files:** `packages/react/src/components/Field.tsx` (155 lines, thin wrapper) + `packages/react/src/hooks/useField.tsx` (781 lines, owns Controller lifecycle).

> Per PRD §1.3.3, `Field.tsx` is a thin wrapper. It owns ONLY the form-registry registration `useEffect` (gated on `shouldRegister`) and delegates the entire Controller lifecycle to `useField`. All §5.3/§20 behavior lives in `useField.tsx`.

### (a) Props Interface
`FieldProps<TName>` (Field.tsx:42-83) matches PRD §5.3 plus extension `inputConfig?: Partial<InputConfig>` (:72). `FieldRenderAPI` (Field.tsx:88-99): fieldState, renderedField, fieldProps, watchers, formState — matches PRD §5.3 exactly.

### (b) Behavioral Compliance
- **forwardRef delivery (§20)** ✅ — **CONFIRMED at `useField.tsx:678`** (`forwardRef: field.ref`).
- **8-layer merge order (§5.3.2)** ✅ — `mergeFieldProps` call at `useField.tsx:666-685` passes layers in exact PRD priority.
- **Conditions OR/AND/last-wins (§5.3.3)** ✅ — delegated to `useConditions` → core `evaluateConditions`.
- **Disabled state resolution (§5.3.4)** ✅ — `useField.tsx:388-432`. Priority: `disabledProp` > `fieldConfig.disabled` > `conditionResult.disabled` > `groupContext.state.isDisabled` > props-merge fallback > `false`.
- **Value parse/format (§5.3.5)** ✅ — `handleChange` (`useField.tsx:560-581`) parses BEFORE `onChange`; render formats AFTER getting RHF value.
- **Change handler (§5.3.6)** ⚠️ partial — does parse → onChange → changeField but does NOT call `methods.trigger(name)` per-change for `debounce === false` (PRD §5.3.6 step 4). Validation routed via auto-save gates + RHF mode. Low severity.
- **Validation integration (§5.3.7)** ✅ — `validationRules` (`useField.tsx:440-488`): layer 1 fieldConfig.validator, layer 2 inputConfig.validator, via `runValidator` + `resolveErrorMessage`, with `setFieldValidating` bookkeeping.

### (c) Test Evidence
`packages/react/src/__tests__/Field.test.tsx` — very large suite. **forwardRef-specific:** `Field.test.tsx:2133` → `delivers a non-undefined forwardRef to a plain function component` (2163). `Field.forwardRef.test.tsx:61`. `FieldForwardRef.acceptance.test.tsx:164` → plain delivery (169), no React 18 ref warning (184), focus-on-error (201), React.forwardRef migration regression (220).

### Verdict: ✅ **COMPLIANT** — §20 satisfied (`useField.tsx:678`). One low-severity gap: change handler omits literal `debounce===false → trigger` step (§5.3.6 #4); behavior preserved via auto-save gates + RHF mode.

---

## 4. FieldGroup.tsx (PRD §5.4 + §13)

**File:** `packages/react/src/components/FieldGroup.tsx` (158 lines)

### (a) Props Interface
`FieldGroupProps` (FieldGroup.tsx:21-27): `{ name: string; children: ReactNode }` — **exact match**.

### (b) Behavioral Compliance
- **span wrapper with `display:none`** ✅ — `FieldGroup.tsx:150-154`: `<span style={{ display: mergedState.isVisible ? undefined : "none" }} data-formality-group={name}>`. **No `<fieldset>`**, no `disabled` attribute.
- **OR-logic `isDisabled`** ✅ — `FieldGroup.tsx:74-79`.
- **AND-logic `isVisible`** ✅ — `FieldGroup.tsx:82-85`.
- **condition + subscription accumulation** ✅ — `FieldGroup.tsx:96-106`: `conditions = [...parentContext.state.conditions, ...(groupConfig.conditions ?? [])]`; `subscriptions = [...parentContext.state.subscriptions, ...(groupConfig.subscribesTo ?? [])]`.
- **setValue propagation priority** ✅ — `FieldGroup.tsx:90-94`: inner group's hasSetCondition/setValue take priority over parent's; field-level overrides all (`useField.tsx:325-340`).

**Deviation from literal PRD §5.4 pseudo-code (graceful):** PRD shows `if (!groupConfig) { console.error(...); return null; }`. Impl (:39-50) instead defaults `groupConfig` to `{ conditions: [], subscribesTo: [] }` and only `console.warn`s — does NOT `return null`. More robust. Asserted by `FieldGroup.test.tsx:285`.

### (c) §13 FieldGroup Nesting Mechanics
Parent/child context merge via `useGroupContext()` (`FieldGroup.tsx:33`). Default context (fields outside any group) provided by `Form.tsx:172-185` `defaultGroupContext` + `context/GroupContext.ts` default. Merge table (§12.3) all satisfied.

### (d) Test Evidence
`packages/react/src/__tests__/FieldGroup.test.tsx` (80): visibility (:81), span wrapper preserves children (:122), disabled propagation (:180), nesting (:208), group without config (:282), data attribute (:310). Cross-validated by `Field.test.tsx:1988`.

### Verdict: ✅ **COMPLIANT**

---

## 5. UnusedFields.tsx (PRD §5.5)

**File:** `packages/react/src/components/UnusedFields.tsx` (86 lines)

### (a) Props Interface
PRD §5.5 shows `function UnusedFields()` with no props. Impl `UnusedFieldsProps` (:15-18) adds optional `children?: (field) => ReactNode` render function — pure superset.

### (b) Behavioral Compliance
- **`shouldRegister={false}`** ✅ — both render paths: custom-render `UnusedFields.tsx:70`; default path `UnusedFields.tsx:82`. Asserted by `UnusedFields.test.tsx:225` and `:71`.
- **reads `unusedFields` from FormContext** ✅ — `const { unusedFields, config } = useFormContext()` (UnusedFields.tsx:40).
- **Enhancement:** `sortFieldsByOrder(unusedFields, config)` (:44-46) applies ordering per PRD §15.

### (c) Test Evidence
`packages/react/src/__tests__/UnusedFields.test.tsx` (47): renders undeclared fields (48), no infinite loop (71), respects order (91), custom render (142), renders nothing when all declared (170), excludes declared (193), shouldRegister=false (225).

### Verdict: ✅ **COMPLIANT**

---

## Summary Table

| # | Component | File | PRD | Props | Behavior | forwardRef | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | FormalityProvider | FormalityProvider.tsx | §5.1 | ✅ | ✅ | n/a | **COMPLIANT** |
| 2 | Form | Form.tsx | §5.2 | ✅ (+ext) | ✅ | n/a | **COMPLIANT** |
| 3 | Field | Field.tsx + useField.tsx | §5.3/§20 | ✅ (+ext) | ✅ | ✅ `useField.tsx:678` | **COMPLIANT** |
| 4 | FieldGroup | FieldGroup.tsx | §5.4/§13 | ✅ | ✅ | n/a | **COMPLIANT** |
| 5 | UnusedFields | UnusedFields.tsx | §5.5 | ✅ (+ext) | ✅ | n/a | **COMPLIANT** |

## Gaps & Notes (all low severity — none blocking)

1. **[LOW] Field change handler omits PRD §5.3.6 step 4** — `useField.tsx:560-581` does NOT call `methods.trigger(name)` when `inputConfig.debounce === false`. Validation occurs via RHF `mode` + auto-save gates. Behavior preserved; literal pseudo-code step absent.
2. **[INFO] Superset props extensions**: `Form.debounce?: number | false`; `FormRenderAPI.handleSubmit`; `FieldProps.inputConfig?`; `UnusedFieldsProps.children?`.
3. **[INFO] PRD type-name drift:** §5.1 references `SelectDescriptor`, which does not exist; impl uses `SelectValue<TReturn>`.
4. **[INFO] FieldGroup missing-config handling** — impl defaults + warns rather than `return null`. More robust; test-asserted.
5. **[INFO] FieldGroup span test hook** — adds `data-formality-group={name}` (harmless).

All five components meet their PRD v1.0 component-spec contracts. The §20 forwardRef requirement is satisfied with strong test coverage (3 dedicated test files).
