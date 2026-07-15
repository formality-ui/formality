# Research — P1.M3.T3.S1: Wire field-level getSubmitField/valueField in `transformValuesForSubmit`

## 1. The function being edited (verbatim current state)

**File**: `packages/react/src/components/Form.tsx` lines **940–967**.

```typescript
function transformValuesForSubmit<T extends FieldValues>(
  values: T,
  config: FormFieldsConfig,
  inputs: Record<string, InputConfig>,
): Partial<T> {
  const result: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(values)) {
    const fieldConfig = config[name];
    const type = fieldConfig?.type ?? "textField";
    const inputConfig = inputs[type];

    if (inputConfig) {
      // Get the submit field name (may be transformed)
      const submitName = transformFieldName(name, inputConfig.getSubmitField);

      // Extract value from complex object if valueField is specified
      const submitValue = extractValueField(value, inputConfig.valueField);

      result[submitName] = submitValue;
    } else {
      result[name] = value;
    }
  }

  return result as Partial<T>;
}
```

### Key observations

- **`fieldConfig` is already in scope** (line `const fieldConfig = config[name];`). Reading
  `fieldConfig?.getSubmitField` / `fieldConfig?.valueField` needs NO new variable.
- The **`if (inputConfig)` guard** is the thing to RELAX. With field-level overrides, a field
  may have `getSubmitField`/`valueField` even when `inputConfig` is `undefined` (type not
  registered in the provider `inputs`).
- The current code reads `inputConfig.getSubmitField` / `inputConfig.valueField` **without**
  optional chaining (safe only because of the guard). After the change, these MUST become
  `inputConfig?.getSubmitField` / `inputConfig?.valueField`.

## 2. The two helper no-op guarantees (verified in code)

`packages/core/src/transform/pipeline.ts`:

```typescript
// L182 extractValueField:
export function extractValueField(value: unknown, valueField?: string): unknown {
  if (!valueField) return value;          // ← no-op when undefined
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  return (value as Record<string, unknown>)[valueField];
}

// L219 transformFieldName:
export function transformFieldName(fieldName: string, getSubmitField?: (name: string) => string): string {
  if (!getSubmitField) return fieldName;  // ← no-op when undefined
  return getSubmitField(fieldName);
}
```

**Implication**: when BOTH effective specs are `undefined` (no field-level, no type-level),
`transformFieldName(name, undefined)` returns `name` and `extractValueField(value, undefined)`
returns `value` → `result[name] = value` naturally. This is why the `if (inputConfig)` guard
can be REMOVED: the else-branch behavior is reproduced by the no-op helpers.

## 3. `resolveFieldOverType` — already imported & used in Form.tsx (T2.S1 landed)

`packages/core/src/config/defaults.ts:30`:
```typescript
export function resolveFieldOverType<T>(fieldVal, typeVal): T | undefined {
  return fieldVal !== undefined ? fieldVal : typeVal;
}
```

**CRITICAL — import already present.** P1.M3.T2.S1 (debounce) has landed in the working tree:

```
$ rg -n 'resolveFieldOverType' packages/react/src/components/Form.tsx
26:  resolveFieldOverType,                 # ← already in the value import block
393:        const fieldDebounce = resolveFieldOverType(   # ← changeField debounce (T2.S1)
```

So **Task 1 (import) is a VERIFICATION, not an edit** — the import is already there. If for some
reason T2.S1 is reverted, this task re-adds it; otherwise it is a no-op. Either way the call site
for `transformValuesForSubmit` uses the same already-present import.

## 4. Type surface — already COMPLETE (P1.M1.T1.S1)

`packages/core/src/types/config.ts`:

- **FieldConfig** (lines 185–199) already has `valueField?: string` (L193) and
  `getSubmitField?: (fieldName: string) => string` (L199) with JSDoc citing §6.4.4.
- **InputConfig** (lines 86–90):
  ```typescript
  /** For complex values (objects), which property contains the actual value */
  valueField?: string;

  /** Transform field name for submission (e.g., 'client' → 'clientId') */
  getSubmitField?: (fieldName: string) => string;
  ```
  These are the TWO JSDoc blocks to extend (Mode A) per the item description.

`ReactFieldConfig extends Omit<FieldConfig, "rules">` (overlays.ts:74) so the field-level
overrides are already typed on the React side — no overlay edit needed.

## 5. Existing tests that constrain this change (Form.coverage.test.tsx)

| Test (describe → it) | Setup | Current assertion | Post-change behavior |
|---|---|---|---|
| `valueField/getSubmitField transform` → "should extract valueField and rename via getSubmitField" (L466) | `inputsWithAutocomplete` (autocomplete: `valueField:'id'`, `getSubmitField:(k)=>\`${k}Id\``); config `{client:{type:'autocomplete'}, signed:{type:'switch'}}`; record `client:{id:5,name:'Acme'}` | submit `{clientId:5, signed:false}` | **STILL PASSES**: effective specs = type-level (no field override) → identical. |
| `transform else branch` → "should pass values through untransformed when config type is absent from provider inputs" (L525) | `testInputs` (NO autocomplete); config `{client:{type:'autocomplete'}, signed:{type:'switch'}}`; record `client:{id:5}, signed:true` | submit `{client:{id:5}, signed:false}` (untransformed) | **STILL PASSES**: fieldConfig for `client` = `{type:'autocomplete'}` (no field-level overrides) → effectiveGetSubmitField/valueField = resolveFieldOverType(undefined, undefined) = undefined → helpers are no-ops → `result['client'] = {id:5}`. ✓ |
| `transform type-default arm` → "should default a missing field type to textField" (L586) | `testInputs`; config `{signed:{type:'switch'}}`; record has `extra` (not in config) | `extra` passes through (type defaults to textField; textField has no transform) | **STILL PASSES**: fieldConfig undefined → `?.getSubmitField` undefined; textField has none either → no-op. ✓ |

**Conclusion**: ALL existing transformValuesForSubmit tests are regression-safe by construction.
The new code is purely additive in capability (field-level overrides now apply, including when
inputConfig is undefined).

## 6. Test harness to reuse (Form.coverage.test.tsx)

Module-level fixtures already present:
- `TestInput`, `TestSwitch` — forwardRef-aware plain components with `data-testid={name}`.
- `testInputs` — `{ textField, switch }`.
- `inputsWithAutocomplete` — `testInputs` + `autocomplete` type carrying `valueField:'id'`,
  `getSubmitField:(k)=>\`${k}Id\``.

Pattern (verified from L466 test):
```typescript
render(
  <FormalityProvider inputs={...}>
    <Form config={...} autoSave debounce={300} onSubmit={submitHandler} record={...}>
      <Field name="signed" />   {/* rendered Field triggers the change → autosave → transform */}
    </Form>
  </FormalityProvider>,
);
await act(async () => { await vi.advanceTimersByTimeAsync(100); });
await act(async () => { await userEvent.click(screen.getByTestId("signed")); });
await act(async () => { await vi.advanceTimersByTimeAsync(400); });
await waitFor(() => { expect(submitHandler).toHaveBeenCalledTimes(1); });
expect(submitHandler).toHaveBeenCalledWith(expect.objectContaining({ ... }));
```

`beforeEach` re-assigns `submitHandler = vi.fn()` and `vi.useFakeTimers({ shouldAdvanceTime: true })`;
`afterEach` does `vi.useRealTimers()`.

## 7. New tests required (the coverage gap this task fills)

1. **Field-level override WINS over type-level** — `inputsWithAutocomplete` (type has
   `valueField:'id'`/`getSubmitField`); config sets `client:{type:'autocomplete', valueField:'uuid',
   getSubmitField:(k)=>\`${k}Uuid\`}`; record `client:{id:5,name:'Acme',uuid:'abc-123'}` → submit
   `{clientUuid:'abc-123', signed:...}` (NOT `clientId:5`).
2. **Field-level override applies when inputConfig is UNDEFINED** (the relaxed-guard capability) —
   `testInputs` (no autocomplete); config `{client:{type:'autocomplete', valueField:'id',
   getSubmitField:(k)=>\`${k}Id\`}, signed:{type:'switch'}}`; record `client:{id:5,name:'Acme'}` →
   submit `{clientId:5, signed:...}` (field-level transform applies even though type unregistered).
3. **Regression — type-level still applies when field omits override** — equivalent to existing L466
   test but via the new describe (proves resolveFieldOverType(undefined, typeSpec) === typeSpec).
4. **Regression — passthrough when both undefined** — `testInputs`; config `{signed:{type:'switch'}}`;
   record `{signed:true, misc:'x'}` → submit `{signed:false, misc:'x'}` (no transform anywhere).

## 8. JSDoc edit targets (Mode A — docs ride with the work)

`packages/core/src/types/config.ts` InputConfig:

- **`valueField`** (L86–87): currently `/** For complex values (objects), which property contains the actual value */`.
- **`getSubmitField`** (L89–90): currently `/** Transform field name for submission (e.g., 'client' → 'clientId') */`.

Replacement prose (item description + §6.4.0/§6.4.4, modeled on the parser/formatter JSDoc that
P1.M3.T1.S1 already wrote):
```
Per-field override via `FieldConfig.getSubmitField`/`valueField` (§6.4.4); field
wins when `!== undefined` (resolved via `resolveFieldOverType`, §6.4.0), restoring
read/write symmetry with `recordKey`.
```

Field TYPE annotations (`string` / `(fieldName: string) => string`) are UNCHANGED — JSDoc prose only.

## 9. Architecture docs confirming the resolution site + spec

- `plan/006_223c8a76c909/architecture/external_deps.md:72-81` — getSubmitField/valueField (§6.4.4)
  names `transformValuesForSubmit` as the site and gives the conceptual spec
  `config[name]?.getSubmitField ?? inputConfig?.getSubmitField`. **The IMPLEMENTATION must CALL
  `resolveFieldOverType`** (not `??`) per §6.4.0 single-rule integrity (behaviorally identical for
  these types — no falsy values possible — but mandated).
- `plan/006_223c8a76c909/architecture/prd_gaps.md:87-90` — confirms current vs must-be for this
  exact site.
- `plan/006_223c8a76c909/architecture/system_context.md:70-71,106-107` — confirms resolution rule
  `field ?? type` and the current gap.

## 10. Disjointness from parallel task (P1.M3.T2.S1)

- P1.M3.T2.S1 edits `changeField` (Form.tsx L386–401) + `InputConfig.debounce` JSDoc (config.ts
  L67–81). It has **already landed** in the working tree (import present L26, debounce call L393).
- This task edits `transformValuesForSubmit` (Form.tsx L940–967) + `InputConfig.valueField`/
  `getSubmitField` JSDoc (config.ts L86–90). **Disjoint regions in BOTH files** — clean merge.
- Both tasks share the SAME `resolveFieldOverType` import (already present once) — no double-import
  conflict (a duplicate named import would be a TS error; verify the import is single).

## 11. Validation tooling

- `pnpm test` — vitest with 90/90/90/90 coverage gate (`vitest.config.ts`).
- `pnpm typecheck` — `tsc --build` (core + react).
- `pnpm lint` — eslint (incl. formatting rules).
- `pnpm format` / `pnpm format:check` — prettier.
