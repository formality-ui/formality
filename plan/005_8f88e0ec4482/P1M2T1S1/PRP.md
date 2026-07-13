name: "P1.M2.T1.S1 — Implement validate() wrapper over existing validator functions"
description: |

---

## Goal

**Feature Goal**: Close gap **G2** of the v1.0 spec-compliance audit by adding
the PRD §1.3.2 headline export `validate(value, rules, validators, formValues)`
to `@formality-ui/core`. The function is a **thin wrapper** over the existing
`runValidator` (which already handles string-named-lookup, inline-function,
and array-of-validators with short-circuiting and async support). It exists
purely to satisfy the PRD-mandated public API surface; all functional
behavior is delegated unchanged.

**Deliverable**:
1. A new exported `validate()` function in
   `packages/core/src/validation/validate.ts`.
2. Two barrel additions: `packages/core/src/validation/index.ts` and
   `packages/core/src/index.ts` (root).
3. New unit tests in `packages/core/src/__tests__/validation.test.ts`
   covering the wrapper's reordered signature.
4. JSDoc on `validate()` explaining its role as the PRD §1.3.2 headline
   export and its relationship to `runValidator` / `composeValidators`.

**Success Definition**:
1. `import { validate } from "@formality-ui/core"` resolves to a function.
2. `validate(value, rules, validators?, formValues?)` returns
   `Promise<ValidationResult | undefined>` and is behaviorally identical to
   `runValidator(rules, value, formValues ?? {}, validators)` for every
   spec shape (string / function / array), including async + short-circuit.
3. Existing **1003 tests unaffected** — the new tests are additive; nothing
   existing changes signature or behavior.
4. `pnpm --filter @formality-ui/core build` + `pnpm typecheck` + `pnpm test` +
   `pnpm lint` all green; coverage stays ≥90% (core is currently ~higher).

## User Persona

**Target User**: Library consumers who read PRD §1.3.2's core-export table and
expect to call the *named* headline function `validate(value, rules,
validators, formValues)` — the ergonomic, documented entry point — rather than
the lower-level `runValidator(spec, value, formValues, namedValidators)` with
its non-obvious argument order.

**Use Case**: A consumer writes a standalone validator outside the React layer:
`const result = await validate(email, ['required', checkEmail], validators,
formValues)`. Today they must use `runValidator` with a different arg order and
no `formValues` default — an API-surface deviation from the documented spec.

**Pain Points Addressed**: API-surface non-compliance (G2). Functionally the
library already validates correctly; this fixes the *named* export the PRD
promises and the consumer-facing argument order.

## Why

- **Spec compliance (PRD §1.3.2).** The core-export table explicitly lists
  `validation/validate` → `validate(value, rules, validators, formValues)`.
  Its absence is a documented gap (gap_analysis.md G2, "Medium").
- **Lowest-risk path to compliance.** `runValidator` already implements 100%
  of the required semantics (named resolution via `resolveNamedValidator`,
  factory-vs-plain detection, inline functions, array short-circuit, async via
  `Promise.resolve`, throw→failure). `validate()` is a pure argument-reordering
  delegation — no new logic, no new branches, no behavioral risk.
- **Scope discipline.** This task owns ONLY the rules-layer `validate()` export.
  PRD §9.1's full layer order (RHF rules → field validator → type validator →
  form validator) is NOT this task's concern — the field/type layers are wired
  by React's `Field` Controller `rules.validate`. `validate()` is the
  rules-layer entry point only. Do not re-implement the layer pipeline.

## What

Add a single thin async function and wire it through two barrels, plus tests
and JSDoc. No change to `runValidator`, `runValidatorSync`, `isValid`,
`composeValidators`, or any existing export.

### Success Criteria

- [ ] `validate(value, rules, validators?, formValues?)` exported from
      `@formality-ui/core` (root barrel) and from `@formality-ui/core/validation`.
- [ ] Delegates to `runValidator(rules, value, formValues ?? {}, validators)`
      with **no additional logic** (no re-resolution, no re-short-circuit).
- [ ] Tests cover: named validator (string), inline function, async validator,
      array of validators (short-circuit), and valid/invalid return values
      (`true` = valid, string/object = invalid).
- [ ] `validate` has a JSDoc block naming it the PRD §1.3.2 headline export and
      explaining its relationship to `runValidator`/`composeValidators`.
- [ ] All gates green; `git diff` touches only `validate.ts`, `validation/index.ts`,
      `index.ts` (root, Validation block only), and `validation.test.ts`.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the existing
`runValidator` signature + semantics, the exact type definitions, both barrel
files' structure with line numbers, the test-file conventions, the G2 gap
write-up, and the parallel-task barrel-safety note. All cited below with exact
paths. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ - include in context window before implementing
- docfile: plan/005_8f88e0ec4482/architecture/gap_analysis.md
  section: "### G2: Missing validate() named export [API — Medium]"
  why: |
    The authoritative gap statement. Confirms: PRD §1.3.2 requires
    `validate(value, rules, validators, formValues)`; current core has no such
    function; the granular exports (runValidator etc.) are functionally complete
    but the PRD-named headline export is missing. Resolution: thin wrapper
    composing the existing functions. This is EXACTLY what this task does.

- file: packages/core/src/validation/validate.ts
  why: |
    The file to edit. Contains runValidator (line ~89), runValidatorSync,
    isValid, composeValidators, plus built-in factories (required/minLength/
    maxLength/pattern). validate() delegates to runValidator — read it fully.
  pattern: |
    runValidator(spec, value, formValues, namedValidators?) signature & semantics:
      - spec: ValidatorSpec (string | ValidatorFunction | array)
      - returns Promise<ValidationResult> (ALWAYS resolves, never rejects)
      - string  → resolveNamedValidator(spec, namedValidators); warn+pass if none
      - function→ runSingleValidator (try/catch → {type:'validation_error'} on throw)
      - array   → sequential, short-circuits on first !isValid(result)
      - async   → handled via Promise.resolve(result)
    validate() maps (value,rules,validators,formValues) → runValidator(rules, value, formValues ?? {}, validators).
  gotcha: |
    runValidator's arg ORDER is (spec, value, formValues, namedValidators).
    validate()'s PRD order is (value, rules, validators, formValues). The
    wrapper's ENTIRE job is this reordering + defaulting formValues to {}.
    Do NOT duplicate runValidator's dispatch logic inside validate().

- file: packages/core/src/types/validation.ts
  why: |
    The exact types validate() uses. ValidatorSpec = string | ValidatorFunction
    | Array<string|ValidatorFunction>. ValidationResult = true|false|string|
    undefined|{type,message?}. ValidatorsConfig = {[name]: ValidatorEntry}.
    ValidatorFunction = (value, formValues) => ValidationResult|Promise<...>.
  pattern: |
    Import these as type-only: `import type { ValidatorSpec, ValidationResult,
    ValidatorsConfig } from "../types";` (match validate.ts's existing import block).
  gotcha: |
    ValidationResult ALREADY includes `undefined` (the valid case). So the
    contract return type `Promise<ValidationResult | undefined>` is equivalent
    to `Promise<ValidationResult>` — the `| undefined` is just permissiveness.
    Use the contract type verbatim to match the item spec; it's a no-op superset.

- file: packages/core/src/validation/index.ts
  why: |
    The module barrel. validate() must be added to the `export { ... } from
    "./validate"` block (currently lists runValidator first). Place `validate`
    FIRST in the list — it is the PRD headline export.
  pattern: |
    export {
      validate,          // ← ADD FIRST (PRD §1.3.2 headline export)
      runValidator,
      runValidatorSync,
      isValid,
      composeValidators,
      required,
      minLength,
      maxLength,
      pattern,
    } from "./validate";

- file: packages/core/src/index.ts
  section: "Validation" block (lines 72-87)
  why: |
    The ROOT barrel. validate() must be added to the root's validation export
    block. Place FIRST there too.
  pattern: |
    export {
      validate,          // ← ADD FIRST
      runValidator,
      runValidatorSync,
      isValid,
      composeValidators,
      ...
      resolveErrorMessage,
      ...
    } from "./validation";
  gotcha: |
    The Validation block is at lines ~72-87. A DIFFERENT block ("Labels &
    Ordering", ~line 133) is owned by the parallel task P1.M1.T1.S2. Do NOT
    touch that block. See "Known Gotchas" for the barrel-collision note.

- file: packages/core/src/__tests__/validation.test.ts
  why: |
    The test file to extend. Follow its EXACT conventions: imports come from
    "../index" (the module barrel, not directly from validate.ts); test
    structure is `describe("Validation", () => { describe("runValidator", ...)
    ...})`. Add a new sibling `describe("validate", () => { ... })` block.
  pattern: |
    - import `validate` from "../index" (add to the existing import list at top).
    - use `async () => { ... }` test bodies + `await validate(...)`.
    - assert valid → `expect(result).toBe(true)`; invalid → `.toBe("msg")` /
      `.toEqual({ type, message })`.
    - mirror the existing runValidator tests but with the REORDERED signature:
      runValidator(spec, value, formValues, validators)
        vs
      validate(value, rules, validators, formValues)
  gotcha: |
    The existing runValidator "named validator" test uses validators config
    `{ notEmpty: (value) => Boolean(value) || "Required" }`. Reuse this exact
    shape for the validate() named test (pass it as the 3rd arg). formValues
    is the 4th arg (default {} when omitted).
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/
├── validation/
│   ├── validate.ts          # ← ADD validate() here; delegates to runValidator
│   ├── messages.ts          # resolveErrorMessage etc. (unchanged)
│   └── index.ts             # ← ADD validate to the "./validate" export (FIRST)
├── types/
│   └── validation.ts        # ValidatorSpec, ValidationResult, ValidatorsConfig (unchanged)
├── __tests__/
│   └── validation.test.ts   # ← ADD a `describe("validate", …)` block
└── index.ts                 # ← ADD validate to the "Validation" block (FIRST), lines ~72-87
```

### Desired Codebase tree with files to be added

```bash
# No new files. Four existing files edited:
packages/core/src/validation/validate.ts   # + validate() function + JSDoc
packages/core/src/validation/index.ts      # + validate in export list
packages/core/src/index.ts                 # + validate in Validation export block
packages/core/src/__tests__/validation.test.ts  # + describe("validate", …) block
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: validate() is a PURE DELEGATION wrapper. Do NOT reimplement
//   runValidator's dispatch (string/function/array, short-circuit, named
//   resolution, throw-handling). Reimplementing it = duplicated branches that
//   can drift. One line: return runValidator(rules, value, formValues ?? {}, validators);

// CRITICAL: arg ORDER differs. PRD/contract: (value, rules, validators, formValues).
//   runValidator: (spec, value, formValues, namedValidators). The wrapper maps
//   value→value, rules→spec, validators→namedValidators, formValues→formValues.
//   Getting this mapping backwards is the #1 way to ship a broken validate().

// GOTCHA: formValues defaults to {}. runValidator's 3rd param is required
//   (Record<string,unknown>), so validate() MUST supply `formValues ?? {}`.
//   validators (4th→mapped param) stays optional (runValidator tolerates
//   undefined namedValidators and warns+passes).

// GOTCHA: return type. runValidator returns Promise<ValidationResult>.
//   The contract asks for Promise<ValidationResult | undefined>. Since
//   ValidationResult already unions `undefined`, declare the contract type
//   verbatim — it's a no-op superset and matches the item spec exactly.

// GOTCHA: barrel-collision with the parallel task. P1.M1.T1.S2 (Implementing,
//   parallel) verifies the config/ordering relocation and MAY touch the root
//   index.ts "Labels & Ordering" block (~line 133) IF an import broke. This
//   task edits the "Validation" block (~lines 72-87). The blocks are ~50 lines
//   apart and semantically disjoint — no overlap. If you observe a git conflict
//   on index.ts at merge time, it is in a different block; keep BOTH edits.

// SCOPE: This task is the rules-layer export ONLY. Do NOT:
//   - re-implement PRD §9.1's full layer order (field/type/form validators);
//     those are wired by React Field's Controller rules.validate.
//   - touch messages.ts / resolveErrorMessage (validate() returns the raw
//     ValidationResult; the CALLER resolves messages — per contract clause 3).
//   - change runValidator/runValidatorSync/isValid/composeValidators signatures.
//   - add validate to the react package (it's a CORE export; react re-exports
//     are out of scope — P2/P3 own react work).
```

## Implementation Blueprint

### Data models and structure

No new models. `validate()` uses the existing types verbatim:

```typescript
import type {
  ValidatorSpec,
  ValidationResult,
  ValidatorsConfig,
} from "../types";

// Signature (contract clause 3), returns a raw ValidationResult — caller
// resolves messages via resolveErrorMessage.
export async function validate(
  value: unknown,
  rules: ValidatorSpec,
  validators?: ValidatorsConfig,
  formValues?: Record<string, unknown>,
): Promise<ValidationResult | undefined> {
  return runValidator(rules, value, formValues ?? {}, validators);
}
```

`runValidator` is already imported in the same file (it's defined there), so
no new import is needed for the delegation — only the type imports above
(`ValidatorSpec`, `ValidationResult`, `ValidatorsConfig` are already imported
in validate.ts's existing import block; verify they're present, add if not).

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD validate() to packages/core/src/validation/validate.ts
  - PLACEMENT: module-level exported async function. Place it ABOVE runValidator
    (it is the headline export; readers should see it first) OR immediately
    below the existing type imports — either is fine; pick the spot that keeps
    the file readable. Do NOT nest it.
  - SIGNATURE: validate(value: unknown, rules: ValidatorSpec, validators?:
    ValidatorsConfig, formValues?: Record<string, unknown>): Promise<ValidationResult | undefined>
  - BODY: exactly one statement —
      return runValidator(rules, value, formValues ?? {}, validators);
  - JSDOC (Mode A ride-with): explain (1) it is the PRD §1.3.2 headline export;
    (2) it is a thin wrapper that reorders args to the ergonomic
    (value, rules, validators, formValues) shape and defaults formValues to {};
    (3) it delegates ALL semantics (named lookup, short-circuit, async, throw-
    handling) to runValidator — see runValidator for details; (4) it returns the
    raw ValidationResult; resolve error messages via resolveErrorMessage;
    (5) it covers the RULES layer only (PRD §9.1) — field/type/form layers are
    wired by the adapter's Field Controller rules.validate.
  - TYPES: ensure `ValidatorSpec`, `ValidationResult`, `ValidatorsConfig` are
    in the type import block at the top of validate.ts (they already are).

Task 2: EXPORT validate from packages/core/src/validation/index.ts
  - EDIT: the `export { ... } from "./validate"` block.
  - ADD: `validate,` as the FIRST entry in the list (before runValidator).
  - PRESERVE: the existing entries and the separate `./messages` export block.

Task 3: EXPORT validate from packages/core/src/index.ts (ROOT barrel)
  - EDIT: the "Validation" export block (lines ~72-87).
  - ADD: `validate,` as the FIRST entry (before runValidator at line 74).
  - PRESERVE: every other entry; do NOT touch the "Labels & Ordering" block
    (~line 133) — that is the parallel task P1.M1.T1.S2's domain.

Task 4: ADD tests to packages/core/src/__tests__/validation.test.ts
  - IMPORT: add `validate,` to the existing import list from "../index" (top
    of file, alongside runValidator etc.).
  - ADD: a new sibling `describe("validate", () => { ... })` block inside the
    top-level `describe("Validation", ...)`. Cover these cases (mirror the
    existing runValidator tests but with the reordered signature):
      it("should run a named validator (string) via the validators registry", ...)
        validators = { notEmpty: (v) => Boolean(v) || "Required" }
        expect(await validate("value", "notEmpty", validators)).toBe(true)
        expect(await validate("", "notEmpty", validators)).toBe("Required")
      it("should run an inline validator function", ...)
        expect(await validate("valid", (v) => v === "valid" || "Must be valid")).toBe(true)
        expect(await validate("invalid", (v) => v === "valid" || "Must be valid")).toBe("Must be valid")
      it("should run an async validator", ...)
        asyncValidator = async (v) => { await delay(10); return v === "valid" || "Invalid" }
        expect(await validate("valid", asyncValidator)).toBe(true)
      it("should run an array of validators and short-circuit on first failure", ...)
        validators = { notEmpty, minFive }
        expect(await validate("hello", ["notEmpty","minFive"], validators)).toBe(true)
        expect(await validate("hi",     ["notEmpty","minFive"], validators)).toBe("Too short")
        expect(await validate("",       ["notEmpty","minFive"], validators)).toBe("Required")
      it("should pass formValues (4th arg) for cross-field validation", ...)
        validator = (v, fv) => v === fv.password || "Mismatch"
        expect(await validate("secret", validator, undefined, { password: "secret" })).toBe(true)
        expect(await validate("wrong",  validator, undefined, { password: "secret" })).toBe("Mismatch")
      it("should default formValues to {} when omitted", ...)
        expect(await validate("x", (v) => true)).toBe(true)  // no 4th arg, no throw
      it("should return a valid (true) result as-is and an invalid (string/object) result as-is", ...)
        // proves validate() does not transform ValidationResult
  - NAMING: `it("should ...", ...)` matching the file's existing style.
  - COVERAGE: each of the 3 spec shapes (string/function/array) + async +
    valid/invalid return passthrough. This exercises validate()'s delegation
    without duplicating runValidator's internal-branch coverage (already tested).
  - GOTCHA: tests import from "../index" (the module barrel), so Task 2 must
    be done before these tests compile. If a test can't resolve `validate`,
    re-check Task 2's barrel edit.

Task 5: VALIDATE
  - RUN: pnpm --filter @formality-ui/core build
  - RUN: pnpm --filter @formality-ui/core test   (or pnpm vitest run packages/core/src/__tests__/validation.test.ts)
  - RUN: pnpm typecheck   (root tsc --build — resolves the barrel end-to-end)
  - RUN: pnpm lint
  - ASSERT: new describe block passes; total test count rises from ~1003 by
    the number of new `it()`s; existing tests unaffected.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: the validate() wrapper (the ENTIRE functional change in validate.ts).
/**
 * Validate a value against a rule specification.
 *
 * PRD §1.3.2 headline export for the `validation/validate` module. This is a
 * THIN WRAPPER over {@link runValidator}: it reorders the arguments into the
 * ergonomic `(value, rules, validators, formValues)` shape documented in the
 * PRD, defaults `formValues` to `{}`, and delegates every semantic (named
 * lookup, factory detection, array short-circuit, async, throw-as-failure) to
 * `runValidator` — see that function for details.
 *
 * This covers the RULES layer only (PRD §9.1). The field-validator and
 * type-validator layers are wired by the adapter's `Field` Controller
 * `rules.validate`; this function does not compose them.
 *
 * Returns the raw {@link ValidationResult}. Resolve a user-facing message with
 * {@link resolveErrorMessage}.
 *
 * @param value      - The value to validate.
 * @param rules      - ValidatorSpec: a named validator (string), an inline
 *                     ValidatorFunction, or an array of either (run in
 *                     sequence, short-circuiting on first failure).
 * @param validators - Optional named-validators registry (ValidatorsConfig)
 *                     for resolving string `rules`. When omitted, a string
 *                     rule warns and passes.
 * @param formValues - Optional full form values for cross-field validation.
 *                     Defaults to `{}`.
 * @returns The ValidationResult (`true`/`undefined` = valid; `false`/string/
 *          `{type,message?}` = invalid).
 */
export async function validate(
  value: unknown,
  rules: ValidatorSpec,
  validators?: ValidatorsConfig,
  formValues?: Record<string, unknown>,
): Promise<ValidationResult | undefined> {
  // CRITICAL: pure delegation. Do not reimplement runValidator's dispatch here.
  return runValidator(rules, value, formValues ?? {}, validators);
}

// PATTERN: barrel placement (both index.ts files) — validate FIRST.
// validation/index.ts and root index.ts "Validation" block:
export {
  validate,            // PRD §1.3.2 headline export
  runValidator,
  runValidatorSync,
  isValid,
  composeValidators,
  // ... unchanged
} from "./validate";    // (validation/index.ts)  |  } from "./validation"; (root index.ts)
```

### Integration Points

```yaml
CORE BARREL (root index.ts):
  - block: "Validation" (lines ~72-87)
  - edit: "add `validate,` as the FIRST entry"
  - fence: "do NOT touch the 'Labels & Ordering' block (~line 133) — parallel task P1.M1.T1.S2"

MODULE BARREL (validation/index.ts):
  - block: 'export { ... } from "./validate"'
  - edit: "add `validate,` as the FIRST entry"

TYPES:
  - file: packages/core/src/types/validation.ts (UNCHANGED)
  - note: |
      ValidatorSpec, ValidationResult, ValidatorsConfig are already defined and
      already imported in validate.ts. No type additions.

PARALLEL EXECUTION CONTRACT:
  - P1.M1.T1.S2 (Implementing, parallel) verifies the config/ordering relocation.
    Its PRP states root index.ts is "UNCHANGED by S1" unless an import broke, in
    which case it fixes the "Labels & Ordering" block (~line 133). This task
    edits the "Validation" block (~line 72-87). The two blocks are disjoint and
    ~50 lines apart — no semantic overlap. A merge-time textual conflict (if any)
    is in a different block; keep BOTH edits. P1.M1.T1.S2 touches NO validation
    file, so validate.ts / validation/index.ts / validation.test.ts are safe.

SCOPE FENCES (do NOT touch):
  - messages.ts / resolveErrorMessage          → unchanged (validate returns raw result)
  - runValidator/runValidatorSync/isValid/composeValidators signatures → unchanged
  - PRD §9.1 full layer pipeline (field/type/form) → out of scope (adapter's job)
  - react package re-exports                   → P2/P3 own react work
  - README/CHANGELOG narrative                 → P3.M2.T1 owns docs sync
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After Task 1 (validate.ts) — fast feedback
pnpm --filter @formality-ui/core build        # tsup build must succeed
pnpm typecheck                                 # root tsc --build — barrel resolves
pnpm lint
# Expected: zero errors. validate.ts is pure delegation; the only way to break
# the build is a typo in the signature/return type or a wrong barrel entry.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run just the validation suite (fast iteration)
pnpm vitest run packages/core/src/__tests__/validation.test.ts
# Expected: the new describe("validate", …) block passes; existing runValidator/
# runValidatorSync/composeValidators tests still pass.

# Full core suite — prove the 1003 existing tests are unaffected
pnpm --filter @formality-ui/core test
# Expected: total rises by exactly the number of new it()s; zero regressions.
```

### Level 3: Barrel / Cross-Package Validation (System Validation)

```bash
# Confirm the export is reachable at the documented import paths
pnpm typecheck   # root tsc --build — project references resolve:
                 #   @formality-ui/core root barrel + validation module barrel
# Smoke-check the built dist declares validate (the react package + examples
# resolve against dist):
pnpm --filter @formality-ui/core build
grep -n "validate" packages/core/dist/index.d.ts | head
grep -n "validate" packages/core/dist/index.js   | head
# Expected: validate appears as an exported function in both.

# framework-independence guard — validate.ts must have ZERO framework imports
pnpm vitest run packages/core/src/__tests__/framework-independence.test.ts
# Expected: green (validate.ts imports only types + runValidator; no React).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Coverage — confirm validate()'s single statement is covered (the new tests
# exercise it) and core stays ≥90% (it is currently much higher):
pnpm test:coverage
grep -A2 "validation/validate" coverage/coverage-summary.json 2>/dev/null || true
# Expected: validate.ts coverage does not drop; validate()'s line is hit.

# Behavioral parity proof (optional, strong): assert validate() === runValidator
# for each spec shape by running BOTH in the same test and comparing. The
# Task 4 tests already assert the same expected values the runValidator tests
# do, which is the parity proof — no extra command needed.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `pnpm --filter @formality-ui/core build`, `pnpm typecheck`,
      `pnpm lint` all green.
- [ ] Level 2: `pnpm vitest run .../validation.test.ts` green; full core suite
      has zero regressions (count rises by new `it()`s only).
- [ ] Level 3: `validate` present in `packages/core/dist/index.d.ts` + `.js`.
- [ ] Level 4: coverage ≥90%; `framework-independence` test green.

### Feature Validation

- [ ] `import { validate } from "@formality-ui/core"` resolves.
- [ ] `validate(value, rules, validators?, formValues?)` returns
      `Promise<ValidationResult | undefined>`.
- [ ] Behaviorally identical to `runValidator(rules, value, formValues ?? {}, validators)`.
- [ ] Tests cover named / inline / async / array / valid+invalid / formValues-default.
- [ ] JSDoc names it the PRD §1.3.2 headline export + documents delegation.

### Code Quality Validation

- [ ] validate() body is ONE statement (pure delegation) — no duplicated dispatch.
- [ ] `validate` placed FIRST in both barrel export lists.
- [ ] `git diff` confined to validate.ts / validation/index.ts / root index.ts
      (Validation block) / validation.test.ts.
- [ ] No change to messages.ts, runValidator signatures, or any existing export.
- [ ] Anti-patterns avoided (see below).

### Documentation & Deployment

- [ ] validate() JSDoc complete (Mode A ride-with).
- [ ] No README/CHANGELOG edits (P3.M2.T1 owns the cross-cutting doc sync).

---

## Anti-Patterns to Avoid

- ❌ **Don't reimplement runValidator's dispatch inside validate().** The whole
  point of G2's "thin wrapper" resolution is delegation. Duplicating the
  string/function/array branches creates drift risk and untested code paths.
  One statement: `return runValidator(rules, value, formValues ?? {}, validators);`
- ❌ Don't get the arg order wrong. PRD order is `(value, rules, validators,
  formValues)`; runValidator order is `(spec, value, formValues, namedValidators)`.
  Map carefully — a swap ships a silently-broken `validate()`.
- ❌ Don't forget the `formValues ?? {}` default. runValidator's 3rd param is
  required; omitting the default makes `validate(value, rules, validators)`
  (no 4th arg) crash at runtime.
- ❌ Don't change the return type away from `Promise<ValidationResult | undefined>`.
  Use the contract type verbatim even though `ValidationResult` already unions
  `undefined` — it matches the item spec and documents intent.
- ❌ Don't have validate() call `resolveErrorMessage`. The contract (clause 3) is
  explicit: validate() returns the raw `ValidationResult`; the CALLER resolves
  messages. Bundling message resolution changes the return type and the API.
- ❌ Don't touch the "Labels & Ordering" block of root `index.ts` (~line 133).
  That is the parallel task P1.M1.T1.S2's domain; only edit the "Validation"
  block (~line 72-87).
- ❌ Don't add `validate` to the react package or update READMEs/CHANGELOG.
  Those are P2/P3 scope. This task is core-only.
- ❌ Don't re-implement PRD §9.1's full validation-layer pipeline (field/type/
  form). validate() is the rules-layer entry point only; the adapter wires the
  rest via the Field Controller.
- ❌ Don't introduce a framework import in validate.ts. Core is framework-free
  by §1.3.6; `framework-independence.test.ts` guards it.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale: This is the lowest-complexity task class — a one-statement
delegation wrapper plus two barrel edits and additive tests. The delegation
target (`runValidator`) already exists, is fully tested, and implements every
required semantic. The only failure modes are mechanical: getting the arg
reorder wrong, forgetting the `formValues ?? {}` default, or a missing barrel
entry — all of which are called out explicitly above and caught by the
Task 4 tests (which assert the reordered signature end-to-end). The -1 covers
the small risk of a merge-textual-collision on root `index.ts` with the
parallel P1.M1.T1.S2 task; the disjoint-block guidance + the typecheck gate
(resolves the barrel end-to-end) make that a non-issue if the implementer
keeps both blocks' edits.
