# P1.M2.T2.S1 — Residual Error Analysis (verified against current `main`)

Run: `pnpm --filter @formality-ui/react build && pnpm typecheck:examples` on current
`main` (BEFORE P1.M2.T1.S1 lands). Total = 293 errors. The codes THIS task owns:

| Code | Count | Meaning |
|------|------:|---------|
| TS2365 | 6 | `Operator '>=' cannot be applied to types '{}' and 'number'` |
| TS2362 | 5 | LHS of arithmetic must be number/bigint |
| TS2363 | 3 | RHS of arithmetic must be number/bigint |
| TS2554 | 7 | Expected 2 arguments, but got 1 |
| TS2769 | 1 | No overload matches this call |
| **TOTAL** | **22** | |

## IMPORTANT scope correction vs. architecture doc

`architecture/examples_typecheck.md` says these are "concentrated in
`examples/09-string-vs-function.tsx`". **Verified reality: they span 4 files.**

| File | Errors | Codes |
|------|-------:|-------|
| examples/09-string-vs-function.tsx | 11 | TS2365(6) TS2362(3) TS2363(2) |
| examples/04-validation.tsx | 6 | TS2554(6) |
| examples/05-field-dependencies.tsx | 3 | TS2362(2) TS2363(1) |
| examples/02-input-types.tsx | 1 | TS2769(1) |
| **TOTAL** | **21 unique** | (architecture counted TS2362/2363=8 → matches 5+3) |

> Note: the PRP's error-count inventory (22) and the file spread (4 files) are the
> ground truth. The item description's code counts (TS2365=6, TS2362/2363=8,
> TS2554=7, TS2769=1) EXACTLY match this run.

## Exact error → file → line map (current `main`)

```
examples/02-input-types.tsx
  (162,15)  TS2769  Intl.NumberFormat(...).format(value)  // value: unknown

examples/04-validation.tsx   (all TS2554 "Expected 2 arguments, but got 1")
  (220,40)  validators.min(18)
  (220,60)  validators.max(120)
  (263,18)  validators.minLength(3)
  (264,18)  validators.maxLength(20)
  (324,18)  validators.minLength(3)
  (387,18)  validators.minLength(8)
  (404,18)  validators.matchField("password")

examples/05-field-dependencies.tsx   (in selectProps.value callback, NO :FormState)
  (499,26) TS2362  items * price        // items: unknown
  (499,34) TS2363  items * price        // price: unknown
  (500,39) TS2362  tax / 100            // tax: unknown

examples/09-string-vs-function.tsx
  (145,26) TS2362  subtotal = price * qty     // selectProps.totalFunction value()
  (145,34) TS2363  subtotal = price * qty
  (249,15) TS2365  age >= 25                  // selectWhen functionConditionField
  (249,40) TS2365  exp >= 5
  (250,15) TS2365  age >= 21
  (250,40) TS2365  exp >= 2
  (354,26) TS2362  subtotal = qty * price     // selectSet totalFunction
  (354,32) TS2363  subtotal = qty * price
  (357,15) TS2365  qty >= 100
  (359,20) TS2365  qty >= 50
  (362,27) TS2362  discount / 100
```

## Root causes (3 distinct)

### RC-A — `FieldState.value` is `unknown` (core type, framework-agnostic)
`packages/core/src/types/state.ts`: `interface FieldState { value: unknown; ... }`.
So `fields.age?.value` is `unknown`; `unknown ?? 0` is STILL `unknown` (the
nullish-coalesced `0` only applies when left is null/undefined; otherwise it's
`unknown`; union → `unknown`). Then `age >= 21` / `price * qty` fail (TS2365/2362/2363).
Affects 09 (3 callbacks) + 05 (1 callback). The T1.S1 annotation swap does NOT
change `FormState` (a core type), so these persist after T1.S1.

### RC-B — `ValidatorsConfig` entry union `ValidatorFunction | ValidatorFactory`
`packages/core/src/types/validation.ts`:
```ts
export type ValidatorFunction = (value: unknown, formValues: Record<string, unknown>) => ValidationResult | Promise<ValidationResult>;
export type ValidatorFactory<TArgs = unknown> = (args: TArgs) => ValidatorFunction;
export interface ValidatorsConfig { [name: string]: ValidatorFunction | ValidatorFactory; }
```
`04-validation.tsx` line 102 declares `const validators: ValidatorsConfig = {...}`
(which COMPILES — fresh-literal relaxation). But `validators.min(18)` calls the
UNION: TS requires the args to satisfy EVERY call signature; `ValidatorFunction`
needs 2 args → TS2554 "Expected 2 arguments, but got 1". The factories ARE
factories at runtime (`min(18)` → ValidatorFunction); only the TYPE is ambiguous.
NOT touched by T1.S1 → persists.

### RC-C — `Intl.NumberFormat.format()` overload vs `unknown`
`02-input-types.tsx` line 162: `currency` input's `formatter: (value) => ...`
where `value: unknown` (TValue defaults unknown). `Intl.NumberFormat.prototype.format()`
accepts `number | bigint`; `unknown` → TS2769 "No overload matches". NOT touched
by T1.S1 → persists.

## Verified fix patterns (tested in isolated tsc --strict harness)

### Pattern 1 — RC-A (arithmetic/comparison on `fields.X.value`): wrap in `Number(...)`
`Number()` global signature: `(value?: unknown) => number`. So
`Number(fields.age?.value ?? 0)` is `number`, and `age >= 21` / `price * qty` compile.
Preserves the `?? 0` fallback semantics exactly (`Number(0)` === 0).
VERIFIED CLEAN in `/tmp/prp_verify/verify_final.ts` (Pattern 1 block: 0 errors).

```tsx
// BEFORE: const age = fields.age?.value ?? 0;   // unknown
// AFTER:
const age = Number(fields.age?.value ?? 0);       // number ✓
```

### Pattern 2 — RC-B (validator factory union ambiguity): typed local factory aliases
`ValidatorFactory` is NOT re-exported by `@formality-ui/react` (grep confirmed:
only `ValidatorFunction`, `ValidatorSpec`, `ValidatorsConfig`, `ValidationResult`,
`ErrorMessagesConfig`). `ValidatorFunction` IS exported. So cast through a
structural arrow type returning `ValidatorFunction` — NO new import source needed
(`ValidatorFunction` already importable from `@formality-ui/react`).

```tsx
import { type ValidatorsConfig, type ValidatorFunction } from "@formality-ui/react";
// ...
const validators: ValidatorsConfig = { /* unchanged */ };

// ValidatorsConfig types each entry as ValidatorFunction | ValidatorFactory, which makes
// parameterized factory calls like validators.min(18) ambiguous. Narrow the factories:
const min = validators.min as (n: number) => ValidatorFunction;
const max = validators.max as (n: number) => ValidatorFunction;
const minLength = validators.minLength as (n: number) => ValidatorFunction;
const maxLength = validators.maxLength as (n: number) => ValidatorFunction;
const matchField = validators.matchField as (s: string) => ValidatorFunction;
// call sites: min(18), max(120), minLength(3), maxLength(20), matchField("password")
```
VERIFIED CLEAN: the alias declarations + all 5 call signatures compiled with 0
errors in the harness (the declaration of `validators` itself is a non-issue —
it already compiles in the real repo, proven by `pnpm typecheck:examples` showing
no error at line 102).

> Rejected alternatives (all tested, all FAIL):
> - `const validators = {...} satisfies ValidatorsConfig` — FAILS: strict
>   contravariance makes `(min: number) => VF` unassignable to `ValidatorFactory<unknown>`.
> - `const validators = {...}` (drop annotation, infer) — FAILS the
>   `<Form validators={validators}>` prop gate for the same contravariance reason.
> - Importing `ValidatorFactory` from `@formality-ui/core` — works but adds a new
>   import source; the structural cast avoids it.

### Pattern 3 — RC-C (Intl overload on unknown): `Number(value)`
```tsx
// BEFORE: return new Intl.NumberFormat("en-US", {...}).format(value);   // value: unknown → TS2769
// AFTER:
return new Intl.NumberFormat("en-US", {...}).format(Number(value));     // number ✓
```
The `if (value == null) return "";` guard already precedes it, so `Number(value)`
is safe. VERIFIED CLEAN (Pattern 3 block: 0 errors).

## Things T1.S1 does NOT resolve (confirming they land here)

T1.S1 swaps `InputConfig`→`ReactInputConfig` and `FormFieldsConfig`→
`ReactFormFieldsConfig` (annotation names). It does NOT touch:
- `FormState` / `FieldState` (core types) → RC-A persists.
- `ValidatorsConfig` / `ValidatorFunction` / `ValidatorFactory` → RC-B persists.
- `InputConfig.formatter` value param (still `unknown` after ReactInputConfig with
  default TValue) → RC-C persists. (NOTE: an alternative RC-C fix is to change the
  currency decl to `ReactInputConfig<number>` so the formatter gets `value: number`,
  but that MODIFIES the line T1.S1 produces → prefer the localized `.format(Number(value))`
  fix to avoid touching T1.S1's work and to keep the diff self-contained.)

## Validation gate
`pnpm typecheck:examples` → exit 0, zero errors across all 9 example files.
