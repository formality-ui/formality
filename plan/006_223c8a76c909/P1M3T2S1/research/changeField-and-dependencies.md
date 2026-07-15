# Research Notes — P1.M3.T2.S1 (field-level debounce in `changeField`)

Primary-source verification of every edit site + input dependency. Captured
verbatim so the PRP can quote exact before/after text.

## 1. The edit site — `packages/react/src/components/Form.tsx`

`changeField` is a `useCallback`, declared at **line 368**, body lines 368–401.

### Current body (the part being changed — lines ~383–395)

```typescript
        // Resolve the auto-save cadence for this field:
        //   inputConfig.debounce === false      → submit immediately (no timer)
        //   inputConfig.debounce === <number>   → per-field debounced timer at that ms
        //   inputConfig.debounce === undefined  → fall back to the Form-level debounce
        //     (debouncedSubmitRef already encodes debounceMs, including its false → immediate case)
        const fieldDebounce = inputConfig?.debounce;
        if (fieldDebounce === false) {
          // Immediate submission: bypass debounce entirely (field-level override)
          executeAutoSaveRef.current?.();
        } else if (typeof fieldDebounce === "number") {
          // Per-field numeric debounce: schedule at the field's own interval.
          // Previously this branch was dead config — any number fell through to
          // the single Form-level debounce. See autosave Issue 1.
          getOrCreateDebouncedRef.current?.(fieldDebounce)();
        } else {
          // No field-level override → Form-level debounced submission
          debouncedSubmitRef.current?.();
        }
```

### Current `useCallback` dep array (line 400)

```typescript
    [autoSave, getAffectedFields],
```

→ `config` is NOT in the deps. Must be added (item step (c)).

### Replacement (exact, from item description)

```typescript
        const fieldConfig = config[name];
        const fieldDebounce = resolveFieldOverType(
          fieldConfig?.debounce,
          inputConfig?.debounce,
        );
```

The three-way branch (`false` / `number` / `else`) is UNCHANGED —
`resolveFieldOverType` returns the field-level value when `!== undefined`,
otherwise the type-level, otherwise `undefined` (which falls through to the
`else` → Form-level `debouncedSubmitRef`).

## 2. The import to extend — `Form.tsx` lines 19–26

```typescript
import {
  resolveAllInitialValues,
  resolveFormTitle,
  evaluateDescriptor,
  buildFormContext,
  extractValueField,
  transformFieldName,
} from "@formality-ui/core";
```

Add `resolveFieldOverType,` to this named-import block. There is a SECOND
`@formality-ui/core` import (type-only, lines 28–33) — do NOT touch it; this
is a runtime helper, belongs in the value import above.

## 3. Input dependency — `resolveFieldOverType` (COMPLETE + exported)

- Defined in `packages/core/src/config/defaults.ts:30`:
  ```typescript
  export function resolveFieldOverType<T>(fieldVal: T | undefined, typeVal: T | undefined): T | undefined {
    return fieldVal !== undefined ? fieldVal : typeVal;
  }
  ```
- Exported from core barrel: `packages/core/src/index.ts:127` AND
  `packages/core/src/config/index.ts:15`. **No barrel work needed** (S3 done).

## 4. Input dependency — `FieldConfig.debounce` (COMPLETE, S1)

- `packages/core/src/types/config.ts:159` — `debounce?: number | false;`
  (FieldConfig interface starts L120).
- React overlay: `ReactFieldConfig extends Omit<FieldConfig, "rules">`
  (`packages/react/src/overlays.ts:74`), so `config[name]?.debounce` is a valid
  typed access returning `number | false | undefined`.
- `config` is a `<Form>` prop, destructured in the FormProps binding, typed
  `ReactFormFieldsConfig<TFieldValues>`. `config[name]` →
  `ReactFieldConfig | undefined`.

## 5. The JSDoc edit — `InputConfig.debounce` (lines 67–80 of config.ts)

Current (verbatim):
```typescript
  /**
   * Auto-save debounce for fields of this input type.
   *
   * - `false` — submit immediately on change (no debounce timer). Use for
   *   toggles/switches/selects where every change is a discrete commit.
   * - `number` — delay auto-save by this many milliseconds after the last
   *   change to a field of this type. Fields that share the same numeric
   *   debounce coalesce into a single timer; fields with different numeric
   *   debounces fire on their own cadence. When unset, the field falls back
   *   to the Form-level `debounce` prop (default 1000ms).
   *
   * This governs *auto-save timing only*. The field value is still committed
   * to the form state on every change (it does not throttle re-renders).
   */
  debounce?: number | false;
```

This is a TWO-tier statement (type → Form-level). Item requires extending to
THREE tiers (field → type → Form-level) per §6.4.2, citing the single
field-over-type rule from §6.4.0. Type annotation `debounce?: number | false;`
is UNCHANGED — JSDoc prose only.

### Disjointness with parallel task P1.M3.T1.S1

P1.M3.T1.S1 edits `InputConfig.parser` (JSDoc above L93) and
`InputConfig.formatter` (JSDoc above L96). This task edits `InputConfig.debounce`
(JSDoc L67–80). Disjoint regions — no merge conflict. Both tasks also touch
distinct React files (useField.tsx vs Form.tsx).

## 6. Test harness — `packages/react/src/__tests__/autosave-field-debounce.test.tsx`

- 603 lines, 4 describe blocks, established fake-timer autosave harness.
- Setup: `vi.useFakeTimers({ shouldAdvanceTime: true })` in `beforeEach`;
  `vi.useRealTimers()` in `afterEach`. A module-level `submitHandler = vi.fn()`
  is re-assigned per test.
- `TestInput` component with `data-testid={name}`, `onChange` → `onChange?.(e.target.value)`.
- Pattern: `<FormalityProvider inputs={...}><Form config={...} onSubmit={submitHandler} autoSave debounce={...}><Field name="..."/></Form></FormalityProvider>`.
- Drive input: `await act(async () => { await userEvent.type(fieldA, "x", { delay: null }); });`.
- Advance time: `await act(async () => { await vi.advanceTimersByTimeAsync(N); });`.
- Assert: `expect(submitHandler).toHaveBeenCalled()` / `.not.toHaveBeenCalled()`
  + `expect.objectContaining({ fieldA: "x" })`.
- Existing coverage (to mirror):
  - L77 "should NOT submit before the field's numeric debounce" — numeric via TYPE.
  - L125 "should submit after exactly the field's numeric debounce" — numeric via TYPE.
  - L174 "should honor a numeric debounce passed via the Field inputConfig prop" — numeric via FIELD PROP (inputConfig).
  - L438 "should submit a debounce:false field immediately" — `false` via FIELD PROP.
  - L559 "should fall back to the Form-level debounce when the field debounce is unset" — Form-level fallback.
- **Gap**: NO test covers `debounce` set via `config[name]` (the FieldConfig
  / `config` prop) — that is exactly what P1.M3.T2.S1 wires. New tests move
  `debounce` from `inputs[type]` / `<Field inputConfig>` into
  `config={{ name: { type, debounce } }}`.

## 7. Validation commands (`package.json`)

- `pnpm test` → `vitest run` (enforces 90/90/90/90 coverage gate via vitest.config.ts).
- `pnpm typecheck` → `tsc --build`.
- `pnpm lint` → `eslint .`.
- `pnpm format` → `prettier --write .`; `pnpm format:check` → `prettier --check .`.

## 8. The `??` vs `resolveFieldOverType` nuance (critical for the implementer)

`architecture/external_deps.md:53` writes the conceptual spec as
`fieldDebounce = config[name]?.debounce ?? inputConfig?.debounce`. For the
`debounce` domain (`number | false`), `??` and `resolveFieldOverType` are
**behaviorally equivalent** (neither `null`/`0`/`""` can occur, and `??`
already preserves `false`). HOWEVER the item description and §6.4.0 mandate
CALLING `resolveFieldOverType` — single-rule integrity: the `!== undefined`
precedence rule lives in exactly one place, reused by all six §6.4 levers.
The implementation MUST call the helper; an inline `??` is forbidden by the
§6.4.0 contract even though it happens to agree here.
