# Coverage Map — validate.ts + messages.ts (P1.M2.T1.S3)

> Generated from a live file-targeted run:
> `pnpm vitest run packages/core/src/__tests__/validation.test.ts --coverage`
> (root, vitest 2.1.x, v8 provider). Line numbers are **current** as of this
> PRP (the item description's line ranges match these files).

## Baseline (current, before this task)

| File          | stmt%  | branch% | func% | uncovered lines (clover) |
| ------------- | ------ | ------- | ----- | ------------------------ |
| validate.ts   | 79.42  | 83.33   | 100   | 31-35, ~112-188, 135, 277-278, 299-300 |
| messages.ts   | 89.88  | 86.66   | 100   | 57-65, 148-149           |

Function coverage is already 100% on both files — this task is **statement +
branch** backfill only. Target: validate.ts → ≥95% stmt, messages.ts → ~100%.

---

## validate.ts — every uncovered region + the test that covers it

All public exports are already imported by the existing `validation.test.ts`.
Extend that file (item INPUT §2 says "extend it"). New tests are PURE
(synchronous; async ones use `async`/`await`). NO mocks except optional
`vi.spyOn(console, "warn")` to silence + assert the two dev `console.warn`
arms (PRD §9.x does not forbid this; core has no "no-mock" rule — setup.ts is
react-only).

### Region A — `runSingleValidator` catch block (lines 29-35) [STMT + BRANCH]
Source:
```ts
} catch (error) {
  return {
    type: "validation_error",
    message: error instanceof Error ? error.message : "Validation error",  // line 33 — TWO arms
  };
}
```
Tests needed (both arms of the ternary on line 33):
- validator that `throw new Error("boom")` → `{ type: "validation_error", message: "boom" }` (instanceof-Error TRUE arm).
- validator that `throw "string error"` (non-Error) → `{ type: "validation_error", message: "Validation error" }` (instanceof-Error FALSE arm).
Route via `runValidator(throwing, value, {})` (async) OR the inline branch — runSingleValidator is shared by both the string-resolved and inline paths, so an inline throwing validator through `runValidator` exercises it.

### Region B — `runValidator` string branch: `!namedValidators` (lines 111-116) [STMT + BRANCH]
Source:
```ts
if (typeof spec === "string") {
  if (!namedValidators) {                       // line 111 — UNCOVERED true arm
    console.warn(`Named validator "${spec}" requested but no validators provided`);
    return true;                                // line 115
  }
  ...
}
```
Test:
- `runValidator("required", "x", {})` — NOTE: **omit the 4th argument** so `namedValidators` is `undefined`. Assert returns `true`. Spy `console.warn` to assert the "requested but no validators provided" substring fires.
- Contrast: existing "missing named validator" test passes `{}` as 4th arg → that covers the *other* warn ("not found", line 120). Do NOT delete it.

### Region C — `runValidator` unknown spec type → `return true` (line 135) [STMT]
Source:
```ts
// Unknown spec type - pass
return true;   // line 135 — reached when spec is NOT array/string/function
```
Test:
- `runValidator(42 as any, "x", {})` → `true`. (`ValidatorSpec` type is `string | ValidatorFunction | Array<...>`; a number violates the type at compile-time, so cast `as unknown as ValidatorSpec` / `as any`.) Also `null` works.

### Region D — `runValidatorSync` array branch (lines 154-161) [STMT + BRANCH]
Source: the `if (Array.isArray(spec))` loop, short-circuit on `!isValid(result)`, final `return true`.
Tests:
- `runValidatorSync(["a", "b"], validValue, {}, validators)` where both pass → `true` (covers 154-161 incl. final `return true`).
- short-circuit: `runValidatorSync([failing, neverCalled], ...)` → failing result; assert second never called (track via a flag).

### Region E — `runValidatorSync` string branch (lines 165-178) [STMT + BRANCH — 4 sub-paths]
Source:
```ts
if (typeof spec === "string") {
  if (!namedValidators) return true;            // 166-167 — UNCOVERED
  const validator = resolveNamedValidator(spec, namedValidators);
  if (!validator) return true;                  // 171-172 — UNCOVERED
  const result = validator(value, formValues);
  return result as ValidationResult;            // 175-178 — happy path UNCOVERED
}
```
Tests:
- happy: `runValidatorSync("notEmpty", "v", {}, { notEmpty: v => Boolean(v) || "Req" })` → `true` (175-178).
- no-config: `runValidatorSync("notEmpty", "v", {})` (omit 4th arg) → `true` (166-167).
- not-found: `runValidatorSync("missing", "v", {}, {})` → `true` (171-172).

### Region F — `runValidatorSync` unknown spec → `return true` (line 187) [STMT]
Test: `runValidatorSync(42 as any, "x", {})` → `true`.

### Region G — `maxLength` skip-non-string (lines 276-278) [STMT + BRANCH]
Source: `if (typeof value !== "string") { return true; }`.
Test: `maxLength(5)(123, {})` → `true`, `maxLength(5)(null, {})` → `true`.

### Region H — `pattern` skip-non-string (lines 298-300) + default message fallback (line 304) [STMT + BRANCH]
Source:
```ts
if (typeof value !== "string") return true;        // 298-300 — UNCOVERED
if (!pattern.test(value)) {
  return { type: "pattern", message: message ?? "Invalid format" };  // 304 — `??` UNCOVERED default arm
}
```
Tests:
- skip: `pattern(/\d/)(123, {})` → `true`.
- default message: `pattern(/^[A-Z]/)("lower")` — call **without** the 2nd `message` arg → `{ type: "pattern", message: "Invalid format" }` (covers `?? "Invalid format"`).

---

## messages.ts — every uncovered region + the test that covers it

### Region I — `resolveErrorMessage` object branch: type-fallback + no-type (lines 57-61) [STMT + BRANCH]
Source:
```ts
if (typeof result === "object" && result !== null) {
  if (result.message) return result.message;                      // (a) covered
  if (result.type && errorMessages?.[result.type]) return ...;    // (b) hit covered
  if (result.type) return formatTypeAsMessage(result.type);       // (c) line 57-59 UNCOVERED (lookup MISS)
  return "Invalid value";                                          // (d) line 61 UNCOVERED (no type)
}
```
Tests:
- (c) lookup-miss: `resolveErrorMessage({ type: "customThing" }, {})` → `formatTypeAsMessage("customThing")` → `"Custom thing"`.
- (c) hit-but-also-assert: `resolveErrorMessage({ type: "required" }, { required: "Req" })` already exists (covered).
- (d) no-type object: `resolveErrorMessage({}, {})` → `"Invalid value"`. Also `resolveErrorMessage({ message: undefined, type: undefined })`.

### Region J — `resolveErrorMessage` final fallback `return "Invalid value"` (line 64) [STMT + BRANCH]
Source: the trailing `return "Invalid value"` after the object check — reached for a primitive that is not true/undefined/string/false (e.g. a number).
Test: `resolveErrorMessage(42 as any)` → `"Invalid value"`.

### Region K — `getErrorType` object-without-type (line 145 `||` falsy arm) + final fallback (lines 148-149) [STMT + BRANCH]
Source:
```ts
if (typeof result === "object" && result !== null) {
  return result.type || "validate";    // 145 — falsy-type arm UNCOVERED
}
return "validate";                      // 148-149 — UNCOVERED (primitive fallback)
```
Tests:
- `getErrorType({})` → `"validate"` (line 145 falsy arm).
- `getErrorType(42 as any)` → `"validate"` (lines 148-149).

---

## What is ALREADY covered (do not re-test / do not break)

- `runValidator`: inline function, named (found), array (all-pass + short-circuit + 1st-fails), async, formValues passthrough, "not found" warn (line 120).
- `isValid`: true/undefined → true; false/string/object → false.
- `composeValidators`: all-pass + short-circuit (uses minLength factory — so the "validator factory / parameterized" PRD §9.2 concept is already exercised).
- `required()`: undefined/null/""/[] fail; "value"/0/false/["item"] pass.
- `minLength()`: fail/pass/skip-non-string.
- `resolveErrorMessage`: true/undefined → undefined; string → string; false → "Invalid value" (both with & without `{invalid}`); object-with-message → message; object-type-lookup-hit.
- `formatTypeAsMessage`: camelCase, snake_case, capitalize.
- `createErrorMessages`: defaults + overrides.
- `getErrorType`: true/undefined → undefined; false → "invalid"; string → "validate"; object-with-type → type.
- `createValidationError`: custom message / lookup / format fallback.

## Branch-coverage subtotal of NEW branches covered

A(regions: catch×2) + B(!namedValidators) + C(unknown) + D(array loop + short-circuit) +
E(sync string×3) + F(unknown) + G(maxLength skip) + H(pattern skip + msg fallback) +
I(c)+(d) + J(final) + K(×2) ≈ **14-16 branch arms** → comfortably clears "+10 branches".

## Statement subtotal

~38-42 new covered statements → clears "+40 statements"; lifts validate.ts 79%→~95-97%
and messages.ts 90%→~100%.
