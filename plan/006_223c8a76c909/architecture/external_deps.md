# External Dependencies & Integration Points

## Build System

- **pnpm workspace**: `pnpm-workspace.yaml` → `packages/*`
- **Build order**: `core` must be built before `react` (`react` depends on `core` dist)
- **Build tool**: `tsup` (per-package `tsup.config.ts`)
- **Scripts**: `pnpm build` (all), `pnpm test` (all), `pnpm test:coverage` (with gate)

## Test Infrastructure

- **vitest** with `@vitest/coverage-v8`
- **Workspace**: `vitest.workspace.ts` references per-package configs
- **Coverage gate**: 90% across statements, branches, functions, lines (§1.3.7)
- **Exclusions**: `examples/**`, `packages/svelte/**`, `packages/vue/**`, `**/dist/**`, `scripts/**`
- **React tests**: React Testing Library (`@testing-library/react`), `renderHook`
- **Test setup**: `packages/react/src/__tests__/setup.ts`

## Key File Map for §6.4 Changes

### Core (must change first)

| File | Role | What Changes |
|---|---|---|
| `packages/core/src/types/config.ts` | Type definitions | Add 6 fields to `FieldConfig` |
| `packages/core/src/config/defaults.ts` | Initial value resolution | Add `resolveFieldOverType`; update `resolveInitialValue` + `resolveAllInitialValues` |
| `packages/core/src/index.ts` | Public exports | Export `resolveFieldOverType` |
| `packages/core/src/__tests__/config.test.ts` | Unit tests | Add tests for new helper + priority tiers |

### React (depends on core rebuild)

| File | Role | What Changes |
|---|---|---|
| `packages/react/src/hooks/useField.tsx` | Field Controller lifecycle | Effective parser/formatter resolution |
| `packages/react/src/components/Form.tsx` | Form state + auto-save | `changeField` debounce resolution; `transformValuesForSubmit` field-level overrides |
| `packages/react/src/overlays.ts` | React overlay types | JSDoc update on `ReactFieldConfig` |
| `packages/react/src/__tests__/` | Integration tests | Field-level override integration tests |

### Data Flow for Each Lever

#### defaultValue (§6.4.1)
```
Form defaultValues computation:
  resolveAllInitialValues(config, inputs, record)
    → for each field: resolveFieldOverType(fieldConfig.defaultValue, inputConfig.defaultValue)
    → then resolveInitialValue applies: defaultValues prop → record[recordKey] → field default → type default
```
**Sites**: `Form.tsx` defaultValues useMemo → `core/config/defaults.ts` resolveAllInitialValues/resolveInitialValue

#### debounce (§6.4.2)
```
changeField(name, value, inputConfig):
  fieldDebounce = config[name]?.debounce ?? inputConfig?.debounce
  if false → executeAutoSave immediately
  if number → getOrCreateDebounced(fieldDebounce)
  if undefined → debouncedSubmitRef (Form-level debounceMs)
```
**Sites**: `Form.tsx` changeField callback

#### parser/formatter (§6.4.3)
```
useField handleChange:
  effectiveParser = fieldConfig.parser ?? inputConfig.parser
  parse(newValue, effectiveParser, providerConfig.parsers)

useField Controller render:
  effectiveFormatter = fieldConfig.formatter ?? inputConfig.formatter
  format(field.value, effectiveFormatter, providerConfig.formatters)
```
**Sites**: `useField.tsx` handleChange callback + Controller render callback

#### getSubmitField/valueField (§6.4.4)
```
transformValuesForSubmit(values, config, inputs):
  for each field:
    effectiveGetSubmitField = config[name]?.getSubmitField ?? inputConfig?.getSubmitField
    effectiveValueField = config[name]?.valueField ?? inputConfig?.valueField
    submitName = transformFieldName(name, effectiveGetSubmitField)
    submitValue = extractValueField(value, effectiveValueField)
```
**Sites**: `Form.tsx` transformValuesForSubmit function

## Critical Constraints

1. **Core must NOT import React/RHF** — enforced by `framework-independence.test.ts`
2. **No breaking public API** — the new FieldConfig fields are all optional (`?`)
3. **`resolveFieldOverType` uses `!== undefined`** — not `??` or truthiness — so `null`/`false`/`0`/`""` are meaningful overrides
4. **`defaultValue` field-level is a NEW priority tier** — it sits BETWEEN record and type default, not replacing the type default directly
5. **React overlay inherits automatically** — `ReactFieldConfig extends Omit<FieldConfig, "rules">` so new fields propagate without structural change
6. **validator composes, does NOT override** — this is already implemented; the six new levers override, which is different
