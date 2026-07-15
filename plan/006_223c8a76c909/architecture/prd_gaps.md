# PRD Gap Analysis — §6.4 Field-Level Overrides

## Summary

The Formality codebase is **extremely mature**. Of the 20 PRD sections plus 3 appendices,
**only §6.4 Field-Level Overrides** represents genuinely unimplemented work. Every other
PRD section is implemented, tested (1085 tests passing), and meets the 90% coverage gate.

## Gap Detail: §6.4 Field-Level Overrides

### What's Missing

The PRD §6.4 specifies six "levers" that should exist on `FieldConfig` as field-level
overrides of their `InputConfig` (type-level) counterparts. **None of these exist on
`FieldConfig` today.**

| Lever | FieldConfig field | Exists? | InputConfig field | Used at |
|---|---|---|---|---|
| defaultValue | `fieldConfig.defaultValue` | ❌ MISSING | `inputConfig.defaultValue` | `resolveInitialValue` (Form.tsx defaultValues) |
| debounce | `fieldConfig.debounce` | ❌ MISSING | `inputConfig.debounce` | `changeField` (Form.tsx auto-save) |
| parser | `fieldConfig.parser` | ❌ MISSING | `inputConfig.parser` | `useField.tsx` handleChange |
| formatter | `fieldConfig.formatter` | ❌ MISSING | `inputConfig.formatter` | `useField.tsx` Controller render |
| getSubmitField | `fieldConfig.getSubmitField` | ❌ MISSING | `inputConfig.getSubmitField` | `Form.tsx` transformValuesForSubmit |
| valueField | `fieldConfig.valueField` | ❌ MISSING | `inputConfig.valueField` | `Form.tsx` transformValuesForSubmit |

### What's Also Missing: `resolveFieldOverType` Helper

The PRD §6.4.0 specifies a single core helper that encapsulates the "field wins when not
undefined" rule:

```typescript
export function resolveFieldOverType<T>(
  fieldVal: T | undefined,
  typeVal: T | undefined,
): T | undefined {
  return fieldVal !== undefined ? fieldVal : typeVal;
}
```

**This function does not exist** in `packages/core/src/config/defaults.ts` and is not
exported from `packages/core/src/index.ts`.

### Specific Code Changes Required

#### 1. Core Type (types/config.ts)

Current `FieldConfig` (lines ~42-92 of config.ts) does NOT have:
`defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, `getSubmitField`.

These must be added as optional fields with JSDoc referencing §6.4.

#### 2. Core Helper (config/defaults.ts)

Add `resolveFieldOverType<T>(fieldVal, typeVal)` and export it.

#### 3. Core Initial Value Resolution (config/defaults.ts)

Current `resolveInitialValue` priority chain:
1. `defaultValues[fieldName]` (Form prop)
2. `record[recordKey]`
3. `inputConfig.defaultValue` ← type default

**Must become:**
1. `defaultValues[fieldName]` (Form prop)
2. `record[recordKey]`
3. `fieldConfig.defaultValue` ← **NEW: field-level default**
4. `inputConfig.defaultValue` ← type default (was Priority 3)

The field-vs-type step should use `resolveFieldOverType`.

#### 4. React useField (hooks/useField.tsx)

**handleChange** (parse pipeline):
- Current: `parse(newValue, inputConfig.parser, providerConfig.parsers)`
- Must: `parse(newValue, resolveFieldOverType(fieldConfig.parser, inputConfig.parser), providerConfig.parsers)`

**Controller render** (format pipeline):
- Current: `format(field.value, inputConfig.formatter, providerConfig.formatters)`
- Must: `format(field.value, resolveFieldOverType(fieldConfig.formatter, inputConfig.formatter), providerConfig.formatters)`

#### 5. React Form changeField (components/Form.tsx)

- Current: `const fieldDebounce = inputConfig?.debounce;`
- Must: `const fieldDebounce = config[name]?.debounce ?? inputConfig?.debounce;`
  (where `config` is the form's field configs, already in scope)

#### 6. React Form transformValuesForSubmit (components/Form.tsx)

- Current: `transformFieldName(name, inputConfig.getSubmitField)` / `extractValueField(value, inputConfig.valueField)`
- Must: use `resolveFieldOverType(fieldConfig?.getSubmitField, inputConfig?.getSubmitField)` etc.
- Also: the `if (inputConfig)` guard must be relaxed — a field-level override should apply even when inputConfig is undefined.

## What Is NOT Missing (Confirmed Complete)

| PRD Section | Status | Evidence |
|---|---|---|
| §1.3 Package structure | ✅ | Monorepo with core/react/vue/svelte |
| §1.3.7 90% coverage gate | ✅ | `vitest.config.ts` thresholds: 90/90/90/90 |
| §2 Performance (proxy) | ✅ | `makeProxyState` + used in Form/useField |
| §2.2 Inverted subscriptions | ✅ | `invertedSubscriptions` ref in Form.tsx |
| §3 Type system | ✅ | All types in core/types/ |
| §3.2.1 React overlays | ✅ | `overlays.ts` with all overlay types |
| §4 Context system | ✅ | Three context files |
| §5 Expression engine | ✅ | `expression/{evaluate,context,infer}.ts` |
| §5.1-5.5 Components | ✅ | All 5 components implemented |
| §6.1-6.3 Config merging | ✅ | `config/merge.ts` with 8-layer merge |
| §8 Conditions | ✅ | `conditions/evaluate.ts` with when/selectWhen/functions |
| §9 Subscriptions | ✅ | `useSubscriptions.ts` |
| §10 Validation | ✅ | Multi-layer with async support |
| §11 Transform pipeline | ✅ | `transform/pipeline.ts` |
| §12 Auto-save | ✅ | Scoped validation + version tracking in Form.tsx |
| §13 FieldGroup | ✅ | Nesting, state accumulation |
| §14 Initial values | ✅ (minus field-level default) | Priority chain in `resolveInitialValue` |
| §15 Ordering | ✅ | `config/ordering.ts` |
| §16 Labels | ✅ | `labels/resolve.ts` with humanizeLabel |
| §17 Props evaluation | ✅ | `usePropsEvaluation.ts` |
| §19 Edge cases | ✅ | Mount order, pending queue, etc. |
| §20 forwardRef | ✅ | `forwardRef` delivered as regular prop in useField |
| Appendix C T1.1-T3.2 | ✅ | All overlay types, defineInputs, FormalityFieldComponentProps |

## Test Baseline

```
Test Files  41 passed (41)
Tests       1085 passed | 5 skipped (1090)
```

All tests green. New tests for §6.4 changes must maintain this green status and
not drop below 90% coverage.
