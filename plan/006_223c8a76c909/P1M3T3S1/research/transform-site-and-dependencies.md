# Research — P1.M3.T3.S1 (transformValuesForSubmit field-level getSubmitField/valueField)

## The edit target (verbatim current text)

`packages/react/src/components/Form.tsx` L949–977 — a **standalone function**
(NOT a useCallback / hook → **no dependency-array concern**, unlike the
debounce sibling P1.M3.T2.S1):

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

## CRITICAL DIFFERENCE vs the debounce sibling (P1.M3.T2.S1)

1. **`resolveFieldOverType` is ALREADY imported** in Form.tsx (L26) — the
   completed `changeField` task (P1.M3.T2.S1) added it. The item description
   explicitly anticipates this: "(already imported for changeField if
   P1.M3.T2.S1 ran first)". P1.M3.T2.S1 is marked **Complete** in
   `<plan_status>`. So this task does **NO import change**.
   - Verified: `rg -n resolveFieldOverType packages/react/src/components/Form.tsx`
     → L26 (import) + L393 (changeField call). The import is already there.
2. **`transformValuesForSubmit` is a standalone function**, not a `useCallback`.
   → **No dependency-array edit** (the debounce sibling had to add `config` to a
   dep array; this one does not). `config` and `inputs` are function PARAMETERS,
   captured fresh on every call.
3. **This task RELAXES/RESTRUCTURES the `if (inputConfig)` guard** — not just a
   single-line value replacement. The guard must be collapsed into one path so
   field-level overrides apply even when `inputConfig` is undefined (per
   prd_gaps.md §6: "the `if (inputConfig)` guard must be relaxed — a field-level
   override should apply even when inputConfig is undefined").

## Why the else-branch stays behaviorally correct after the collapse

The existing "else branch" test (Form.coverage.test.tsx Task 8, L~526) asserts
that when `inputConfig` is undefined AND `fieldConfig` has no override,
`result[name] = value` (untransformed). After collapsing the guard:
- `fieldConfig?.getSubmitField` → undefined (no override)
- `inputConfig?.getSubmitField` → undefined (inputConfig is undefined)
- `resolveFieldOverType(undefined, undefined)` → undefined
- `transformFieldName(name, undefined)` → name (no-op; verified in pipeline.ts:
  "if (!getSubmitField) return fieldName;")
- `extractValueField(value, undefined)` → value (no-op; verified in pipeline.ts:
  "if (!valueField) return value;")
- → `result[name] = value` ✓ — identical behavior, test stays green.

## The helpers (no-op on undefined — verified in pipeline.ts)

- `transformFieldName(fieldName, getSubmitField?)`: `if (!getSubmitField) return fieldName;`
- `extractValueField(value, valueField?)`: `if (!valueField) return value;`
- `resolveFieldOverType(fieldVal, typeVal)`: `return fieldVal !== undefined ? fieldVal : typeVal;`

So when both field-level and type-level are undefined, the pipeline is a
pass-through — exactly the old `else` branch.

## Input dependencies (ALL COMPLETE — verified)

- **P1.M1.T1.S2** `resolveFieldOverType` — exists in
  `packages/core/src/config/defaults.ts` (L30), exported from
  `@formality-ui/core` (index.ts L127) and `config/index.ts` (L15). ✓
- **P1.M1.T1.S1** `FieldConfig.getSubmitField?` / `FieldConfig.valueField?` —
  exist in `packages/core/src/types/config.ts` (L195–205) with §6.4.4 JSDoc.
  React overlay `ReactFieldConfig extends FieldConfig` (overlays.ts) →
  `config[name]?.getSubmitField` is a valid typed access. ✓
- **P1.M3.T2.S1** `changeField` already imports + calls `resolveFieldOverType`
  in Form.tsx (L26, L393). ✓ — so the import is present.

## The JSDoc edit target (verbatim current text)

`packages/core/src/types/config.ts` L92–96 (InputConfig interface) — currently
ONE-LINE JSDoc on each:

```typescript
  /** For complex values (objects), which property contains the actual value */
  valueField?: string;

  /** Transform field name for submission (e.g., 'client' → 'clientId') */
  getSubmitField?: (fieldName: string) => string;
```

The FieldConfig counterparts (L195–205, S1) already cite §6.4.4 — no change there.

The item description's DOCS note gives the exact prose to add: 'Per-field
override via FieldConfig.getSubmitField/valueField (§6.4.4); field wins when
!== undefined, restoring read/write symmetry with recordKey.'

## Test harness to mirror

`packages/react/src/__tests__/Form.coverage.test.tsx`:
- `testInputs` (L84–87): `{ textField: {...}, switch: {...} }`.
- `inputsWithAutocomplete` (L89–99): adds `autocomplete` TYPE with
  `valueField: "id"`, `getSubmitField: (k) => `${k}Id``.
- Task 7 (L454) — the canonical transform test: renders `<Field name="signed" />`
  (a switch), passes `record={{ client: {id,name}, signed }}`, `autoSave
  debounce={300}`, drives a `userEvent.click` on the toggle, advances fake
  timers, asserts `submitHandler` received `{ clientId: 5, signed: false }`.
  KEY INSIGHT: the `client` field is NOT rendered as a `<Field>`, yet it appears
  in the submit (it's in `record` → defaultValues → RHF state). This lets us
  test a field whose TYPE is unregistered (inputConfig undefined) — perfect for
  the guard-relaxation proof.
- Task 8 (L~526) — the else-branch regression test (stays green post-collapse).

New test cases needed:
1. **field wins over type** — type `autocomplete` (id/`${k}Id`) overridden by
   config to `valueField: "code"`, `getSubmitField: (k) => `${k}Code`` →
   submit `{ clientCode: <code value> }`.
2. **field override applies when inputConfig is undefined** (the guard-relaxation
   proof) — a field whose type is NOT in `inputs` (e.g. a custom `refPicker`),
   config sets `valueField`/`getSubmitField`, record carries an object → submit
   carries the transformed field (NOT `result[name] = value`).
3. **regression: field undefined → type applies** — type autocomplete, no field
   override → type transforms apply (existing Task 7 covers this, but an explicit
   sibling makes the precedence crisp).
4. **regression: both undefined → passthrough** — covered by existing Task 8
   (else-branch test stays green; no new test needed, but note it).

## Architecture doc confirmation

- `external_deps.md` §getSubmitField/valueField (L72–81): names the exact site
  (`transformValuesForSubmit`) and the conceptual spec
  `config[name]?.getSubmitField ?? inputConfig?.getSubmitField` (note: doc writes
  `??`; implementation MUST use `resolveFieldOverType` per §6.4.0 + item desc).
- `prd_gaps.md` §6 (L87–90): "Must: use resolveFieldOverType(...) etc. Also:
  the `if (inputConfig)` guard must be relaxed — a field-level override should
  apply even when inputConfig is undefined."
- `system_context.md` (L70–71, L106–107): confirms the site uses
  `inputConfig.getSubmitField`/`inputConfig.valueField` and not field-level.

## Validation commands (verified in package.json)

- `pnpm test` → `vitest run` (enforces 90/90/90/90 coverage gate)
- `pnpm typecheck` → `tsc --build`
- `pnpm lint` → `eslint .`
- `pnpm format:check` → `prettier --check .` / `pnpm format` → `--write`
- `pnpm -r build`
