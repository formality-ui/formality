# Research Notes — P1.M2.T1.S1

## Input Dependencies — VERIFIED IN CODE (not assumed)

### S1 (P1.M1.T1.S1) — COMPLETE ✅
`FieldConfig` has `defaultValue?: unknown` in `packages/core/src/types/config.ts`:
- Line 140: `recordKey?: string;`
- Line 142: `// ── Field-level overrides for type-level levers (PRD §6.4). ──`
- Line 152: `defaultValue?: unknown;`
- Line 186: `rules?: Record<string, unknown>;`

So `fieldConfig?.defaultValue` is a valid type-level access. Confirmed via `rg`.

### S2 (P1.M1.T1.S2) — COMPLETE ✅
`resolveFieldOverType` is ALREADY in `packages/core/src/config/defaults.ts` (top of file,
before `resolveInitialValue`). Exact signature:
```typescript
export function resolveFieldOverType<T>(
  fieldVal: T | undefined,
  typeVal: T | undefined,
): T | undefined {
  return fieldVal !== undefined ? fieldVal : typeVal;
}
```
Also already imported in `packages/core/src/__tests__/config.test.ts` line 14:
`import { resolveFieldOverType } from "../config/defaults";`
And has a `describe("resolveFieldOverType")` block at line 26 (9 test cases incl. §6.4.5).

→ This task does NOT re-import or re-test the helper; it only CALLS it.

### T2.S1 (P1.M1.T2.S1) — PARALLEL / IN-FLIGHT, NO CONFLICT ✅
Touches ONLY `packages/react/src/overlays.ts` (ReactFieldConfig JSDoc). Does not touch
`defaults.ts` or `resolveInitialValue` tests. Zero file overlap → safe to run in parallel.

## The Edit Target — EXACT CURRENT STATE

### File: `packages/core/src/config/defaults.ts`

**Current `resolveInitialValue` JSDoc block** (priority list is 3-tier; deviation note
also recites the 3-step chain; @example has 2 scenarios, neither shows field-level default):

```
 * Priority order (highest to lowest):
 * 1. defaultValues[fieldName] (from Form props)
 * 2. record[recordKey] (using recordKey if specified, else fieldName)
 * 3. inputConfig.defaultValue (from input type definition)
 *
 * **PRD deviation note (accepted, gap_analysis G5).** ... it drives the full
 * priority chain above (defaultValues → record[recordKey] → inputConfig.defaultValue) ...
 *
 * @param fieldName - Field name
 * @param fieldConfig - Field configuration        ← no mention of defaultValue
 * @param inputConfig - Input type configuration
 * ...
 * @example
 * // Field with recordKey mapping ...
 * // Field with explicit defaultValue ... defaultValues takes precedence
```

**Current Priority 3 block** (the block to REPLACE):
```typescript
  // Priority 3: Input type default value
  if (inputConfig?.defaultValue !== undefined) {
    return inputConfig.defaultValue;
  }
```

## Existing resolveInitialValue Tests — `packages/core/src/__tests__/config.test.ts`

`describe("resolveInitialValue")` at line 438 (inside `describe("Initial Value Resolution")`
at line 437). 5 existing tests:
1. "should use defaultValues first" — fieldConfig `{}` → still works (no defaultValue)
2. "should use record value with recordKey" — fieldConfig `{ recordKey }` → still works
3. "should use record value by field name" — fieldConfig `{}` → still works
4. "should use input default value" — fieldConfig `{}`, inputConfig has defaultValue →
   **STILL PASSES** because `{}.defaultValue === undefined` → resolveFieldOverType returns
   inputConfig.defaultValue. ✓ regression-safe
5. "should return undefined when no value found" — fieldConfig `{}`, undefined inputConfig →
   resolveFieldOverType(undefined, undefined) = undefined → falls through to return undefined. ✓

All 5 existing tests remain green after the change. New tests needed for the Priority 3 tier.

`describe("resolveAllInitialValues")` at line 486 — delegates to resolveInitialValue, so
auto-benefits. Add one test proving field-level default flows through resolveAllInitialValues.

## Scope Boundaries (explicit non-goals)

- Do NOT touch `resolveFieldOverType` (S2 owns it; it's done).
- Do NOT touch `resolveAllInitialValues` body (delegates; no change needed per contract).
- Do NOT touch barrel exports (S3).
- Do NOT touch React adapter runtime (P1.M3.*).
- Do NOT touch `overlays.ts` (T2.S1 — parallel).
