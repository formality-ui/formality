name: "P1.M2.T1.S3 — EXTEND validation.test.ts: validate.ts rule paths + messages.ts arms"
description: |

---

## Goal

**Feature Goal**: Extend the existing pure-function test suite
`packages/core/src/__tests__/validation.test.ts` so that
`packages/core/src/validation/validate.ts` rises from **79.42% stmt / 83.33%
branch** to **≥ 95% stmt / ≥ 90% branch**, and
`packages/core/src/validation/messages.ts` rises from **89.88% stmt / 86.66%
branch** to **~100% stmt / ~100% branch**. Both files are already at **100%
function coverage** — this task is **statement + branch** backfill only
(covering the catch block, the `!namedValidators` arm, the entire
`runValidatorSync` string/array paths, the `maxLength`/`pattern`
skip-non-string arms, the `pattern` default-message fallback, and every
remaining `resolveErrorMessage` / `getErrorType` arm).

**Deliverable**:

1. **Modify (extend) the existing file**
   `packages/core/src/__tests__/validation.test.ts` — add new `it(...)` cases
   (and new nested `describe` blocks where natural) covering every region in
   `research/coverage-map.md`. **Do NOT create a new file** (item INPUT §2
   explicitly says "extend it") and **do NOT delete or rewrite any existing
   passing test**.
2. **No source changes.** No new deps. No docs (item OUTPUT §5: test-only).

**Success Definition**:

1. `pnpm vitest run packages/core/src/__tests__/validation.test.ts --coverage`
   reports `validate.ts` at **≥ 95% statements, ≥ 90% branches, 100% functions**
   and `messages.ts` at **~100% statements, ~100% branches, 100% functions**.
2. Repo-wide contribution ≈ **+40 statements / +10 branches** (the planned
   step-3 gain in `architecture/coverage_gaps.md` §5).
3. `pnpm --filter @formality-ui/core test` is green with **zero new failures**
   and the full existing validation suite still passes.
4. Every region A–K in `research/coverage-map.md` is exercised by at least one
   named, self-documenting test case.

## User Persona (if applicable)

**Target User**: Library maintainer / CI coverage gate (PRD §1.3.7 / Appendix B
h3.95). The 90% gate (added in P1.M2.T1.S5) cannot go green until validate.ts
and messages.ts clear the bar.

**Use Case**: Automated regression protection for the pure validation pipeline
that every adapter (React today, Svelte/Vue later) depends on.

**Pain Points Addressed**: Today a refactor could silently drop the
`!namedValidators` warn path, the validator-throw catch path, or the
`resolveErrorMessage` type-fallback — and no test would notice. This suite
makes every arm observable.

## Why

- **Coverage gate (PRD §1.3.7 / h3.95).** The repo enforces **≥ 90%** on
  statements, branches, functions, and lines via vitest v8 thresholds run in CI.
  `validate.ts` (79.4% stmt) and `messages.ts` (90% stmt but only 86.7% branch)
  are two of the named offenders in `architecture/coverage_gaps.md` §2 (rows #4
  and #10). They are the **step-3 backfill** in the §5 plan ("Minimum to clear
  the gate: steps 1 + 2 + 3").
- **PRD contract correctness (§9.1–9.6).** The uncovered arms encode real PRD
  guarantees that are currently untested at the unit level: every
  `ValidationResult` return shape from §9.3 (true / undefined / false / string /
  `{type}` / `{type,message}`), the named-validator-lookup-miss "pass with
  warning" behavior, validator factories (PRD §9.2 `validators.minLength(5)`),
  and the full `resolveErrorMessage` matrix from §9.4. This suite pins each.
- **Cheap & deterministic.** Both files are **pure functions with zero
  framework/state/timer dependencies** (node environment, no React, no fake
  timers). This is the lowest-risk, highest-leverage coverage work in the plan.

## What

Add **new `it(...)` test cases** to the existing
`packages/core/src/__tests__/validation.test.ts`, organised under the existing
top-level `describe("Validation", ...)` and its nested `describe` blocks. Each
new case targets one uncovered region from `research/coverage-map.md`. Use
plain synchronous assertions (`expect(...).toBe(...)` / `.toEqual(...)`) and
`async`/`await` for async-validator cases — **no mocking required** except an
optional `vi.spyOn(console, "warn")` to assert+silence the two dev `console.warn`
arms (core has no "no-mocks" rule; `packages/react/src/__tests__/setup.ts` is
React-only and does not apply here).

### Success Criteria

- [ ] Existing `validation.test.ts` extended; **no existing test removed or
      rewritten**.
- [ ] `validate.ts` ≥ 95% stmt / ≥ 90% branch / 100% func (regions A–H covered).
- [ ] `messages.ts` ~100% stmt / ~100% branch (regions I–K covered).
- [ ] No source files under `packages/*/src/**` modified (test-only).
- [ ] `pnpm --filter @formality-ui/core test` green (no regressions).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the two source
files with exact uncovered line ranges, the `ValidationResult` / `ValidatorSpec`
type definitions, the existing test file's structure, and the exact coverage
baseline. All cited below with exact paths and line numbers. ✅ Passes the
"No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/002_78ea74508dd8/P1M2T1S3/research/coverage-map.md
  section: "validate.ts — every uncovered region" + "messages.ts — every uncovered region"
  why: |
    Authoritative, line-number-exact map of EVERY uncovered region (A–K) with
    the EXACT test case that covers it, the source snippet, and a tally of the
    expected statement/branch gain. Build the new `it(...)` cases directly from
    its region table. This is the single source of truth for what to test.
  critical: |
    Two regions require a compile-time type cast to reach because the runtime
    branch only fires for inputs the TypeScript types forbid: (C) runValidator
    "unknown spec" and (F/J/K) non-object primitives to resolveErrorMessage /
    getErrorType. Use `... as unknown as ValidatorSpec` / `as any` for those.
    The `!namedValidators` arm (B) requires OMITTING the 4th argument entirely
    (passing `{}` makes it truthy and misses the arm).

- file: packages/core/src/validation/validate.ts
  why: The primary System Under Test (79.42% stmt). Read end-to-end.
  pattern: |
    Uncovered regions to cover (line numbers current as of this PRP):
      29-35     runSingleValidator catch block (validator throws) + Error ternary
      111-116   runValidator string branch: !namedValidators → console.warn + return true
      135       runValidator unknown spec type → return true
      154-161   runValidatorSync array branch (loop + short-circuit + return true)
      165-178   runValidatorSync string branch (!namedValidators / not-found / happy)
      187       runValidatorSync unknown spec → return true
      276-278   maxLength skip-non-string branch
      298-300   pattern skip-non-string branch
      304       pattern default message (`message ?? "Invalid format"`)
  gotcha: |
    `resolveNamedValidator`'s `typeof validator === "function" === false` arm is
    ALREADY covered by the existing "nonExistent" test (validators["nonExistent"]
    is undefined → not-a-function → returns undefined). Do NOT re-add a test for
    it; doing so via a non-function value would also violate the ValidatorsConfig
    type. Leave it.

- file: packages/core/src/validation/messages.ts
  why: The secondary System Under Test (89.88% stmt / 86.66% branch).
  pattern: |
    Uncovered regions (line numbers current as of this PRP):
      57-59   resolveErrorMessage object branch: type-fallback (lookup MISS → formatTypeAsMessage)
      61      resolveErrorMessage object branch: no-type → "Invalid value"
      64      resolveErrorMessage final fallback → "Invalid value" (e.g. number)
      145     getErrorType: object-without-type (`result.type || "validate"` falsy arm)
      148-149 getErrorType: final fallback → "validate" (e.g. number)
  gotcha: |
    resolveErrorMessage line 52 `if (result.type && errorMessages?.[result.type])`
    has TWO ways to be false: type-falsy, or type-truthy-but-lookup-miss. The
    existing test only covers the lookup-HIT. The type-truthy-lookup-MISS case
    (region I-c) is what drives execution into the line 57-59 fallback — that is
    the one to add.

- file: packages/core/src/__tests__/validation.test.ts
  why: The file to EXTEND. Mirror its structure: top-level
        describe("Validation") with nested describes per export. Every needed
        import is ALREADY at the top of this file (runValidator, runValidatorSync,
        isValid, composeValidators, required, minLength, maxLength, pattern,
        resolveErrorMessage, formatTypeAsMessage, createErrorMessages,
        getErrorType, createValidationError). Add `vi` to the vitest import only
        if you spy console.warn.
  pattern: |
    Existing nested describes to extend INTO:
      describe("runValidator")          ← add regions A, B, C here
      describe("runValidatorSync")      ← add regions D, E, F here (currently 1 test only)
      describe("Built-in validators") > describe("maxLength")  ← region G
      describe("Built-in validators") > describe("pattern")    ← region H
      describe("Error Message Resolution") > describe("resolveErrorMessage")  ← region I, J
      describe("Error Message Resolution") > describe("getErrorType")          ← region K
  gotcha: |
    The existing "should handle missing named validator gracefully" test calls
    runValidator("nonExistent", "value", {}, {}) — the 4th arg is {} (truthy),
    so it hits the "not found" warn (line 120), NOT the "!namedValidators" warn
    (line 112). Keep it; add a SEPARATE test that OMITS the 4th arg for region B.

- file: packages/core/src/types/validation.ts
  why: |
    Defines ValidationResult (true | false | string | undefined |
    {type:string; message?:string}), ValidatorSpec, ValidatorFunction,
    ValidatorFactory, ValidatorsConfig, ErrorMessagesConfig. Reference to
    choose correct test inputs and to know which inputs need a type cast.
  critical: |
    ValidatorSpec = string | ValidatorFunction | Array<string|ValidatorFunction>.
    A bare number/object is NOT a valid ValidatorSpec → to reach the "unknown
    spec" branch (validate.ts:135, 187) you must cast: `42 as unknown as
    ValidatorSpec` (or `as any`). Same for resolveErrorMessage(42 as any) and
    getErrorType(42 as any) to reach their final-fallback arms.

- docfile: plan/002_78ea74508dd8/architecture/coverage_gaps.md
  section: §3 (rows validate.ts + messages.ts), §5 step 3
  why: Confirms these two files are the step-3 backfill; expected gain
        +~40 stmt / +~10 branch.

- docfile: PRD §9.1–9.6 (h3.35–h3.40)
  section: §9.2 (Validator Specification Formats) + §9.3 (Return Values) + §9.4 (Error Message Resolution)
  why: The behavioral contract these tests pin. Map each §9.3 return shape and
        each §9.4 resolveErrorMessage arm to a test case.

- url: https://vitest.dev/api/#expect
  why: `expect(...).toEqual(...)` for deep object equality on the
        {type,message} results; `expect(...).toBe(true)` for primitives.
- url: https://vitest.dev/guide/mocking.html#console
  why: Canonical `vi.spyOn(console, "warn").mockImplementation(() => {})` to
        both assert and silence the two dev console.warn arms in validate.ts
        (lines 112, 120). Optional but keeps test output clean.

- docfile: plan/002_78ea74508dd8/P1M2T1S2/PRP.md
  section: "Parallel Execution Contract"
  why: |
    Sibling work item S2 (Form.coverage.test.tsx) is being implemented in
    PARALLEL in the REACT package. This task (S3) touches ONLY
    packages/core/src/__tests__/validation.test.ts. There is NO file overlap
    and NO behavioral coupling between S2 and S3 — S2 mounts React components,
    S3 calls pure core functions. The only shared concern is that S1's known
    failure can make the FULL `pnpm test:coverage` exit non-zero before emitting
    JSON. Therefore validate THIS suite with a file-targeted core run (see
    Validation Level 3), which emits coverage regardless of react-package state.
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/
├── validation/
│   ├── index.ts          # barrel: re-exports validate.ts + messages.ts
│   ├── validate.ts       # ← SUT #1 (79.42% stmt / 83.33% branch / 100% func)
│   └── messages.ts       # ← SUT #2 (89.88% stmt / 86.66% branch / 100% func)
├── types/
│   └── validation.ts     # ValidationResult, ValidatorSpec, ValidatorFunction, ...
└── __tests__/
    ├── setup.ts          # (react-only; core does NOT use a setup file)
    └── validation.test.ts # ← EXTEND THIS FILE (sole deliverable)

packages/core/vitest.config.ts   # environment:"node", globals:true,
                                 #   include:["src/**/*.test.ts"] — new tests
                                 #   match the glob; NO config change needed.
vitest.config.ts (repo root)     # coverage.exclude correct; NO thresholds block
                                 #   (that is P1.M2.T1.S5's deliverable — do NOT add).
```

### Desired Codebase tree with files to be added/modified

```bash
packages/core/src/__tests__/
└── validation.test.ts    # MODIFIED — new it(...) cases added; no file created
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: both SUT files are PURE functions — no React, no hooks, no timers,
// no DOM. Tests run in vitest's "node" environment (core/vitest.config.ts).
// Do NOT import @testing-library/react, do NOT use fake timers, do NOT render.
// Every assertion is a direct return-value check on an imported function.

// CRITICAL: to reach the "unknown spec type" branches (validate.ts:135, 187)
// and the primitive-fallback arms of resolveErrorMessage (line 64) /
// getErrorType (line 148), you MUST pass a value the TS types forbid. Cast it:
//   runValidator(42 as unknown as ValidatorSpec, "x", {})   → true
//   resolveErrorMessage(42 as any)                          → "Invalid value"
//   getErrorType(42 as any)                                 → "validate"
// (ValidatorSpec only allows string | function | array; ValidationResult only
//  allows true/false/string/undefined/{type,message}.)

// CRITICAL: the "!namedValidators" arm (validate.ts:111) fires ONLY when the
// 4th argument is OMITTED (undefined). Passing `{}` makes it truthy and takes
// the OTHER branch (resolveNamedValidator → not-found warn at line 120).
//   runValidator("required", "x", {})            // ← 3 args; covers B ✓
//   runValidator("nonExistent", "x", {}, {})     // ← 4 args; existing test, covers line 120
// Keep both; they cover different branches.

// GOTCHA: the existing runValidatorSync describe has exactly ONE test (inline
// function). The string branch, array branch, !namedValidators, not-found, and
// unknown-spec paths of runValidatorSync are ENTIRELY uncovered (regions D/E/F).
// This is the single biggest validate.ts gap — add ~6 cases there.

// GOTCHA: maxLength and pattern each have their OWN `typeof value !== "string"`
// closure (they are separate factory instances). minLength's skip-non-string is
// already tested, but maxLength's (line 276-278) and pattern's (line 298-300)
// are NOT — add a skip-non-string case to each of their describes.

// GOTCHA: pattern()'s default message arm (`message ?? "Invalid format"`,
// line 304) is only hit when the factory is called WITHOUT the 2nd arg. The
// existing pattern test passes a message ("Invalid email"), so it covers the
// `message` arm only. Add: pattern(/^[A-Z]/)("lower", {}) → {type:"pattern",
// message:"Invalid format"}.

// GOTCHA: do NOT add coverage.thresholds to vitest.config.ts — that is
// P1.M2.T1.S5's explicit deliverable. This task is test-only.

// GOTCHA (parallel execution): sibling S1 (useFormState.test.tsx) currently
// has a failing assertion that can make the FULL `pnpm test:coverage` exit
// non-zero before emitting coverage JSON. Always validate THIS suite with a
// file-targeted run (Validation Level 3) so coverage emits regardless.
```

## Implementation Blueprint

### Data models and structure

No new models. Tests reuse the existing imports already present at the top of
`validation.test.ts`. If you spy `console.warn`, add `vi` to the existing
vitest import line (`import { describe, it, expect, vi } from "vitest";`).

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EXTEND describe("runValidator") — regions A (catch), B (!namedValidators), C (unknown spec)
  - FILE: packages/core/src/__tests__/validation.test.ts
  - WHERE: inside the existing `describe("runValidator", () => { ... })` block.
  - CASE A1 (catch, Error arm — covers validate.ts:29-35, line 33 TRUE):
      it("should treat a throwing validator as a validation failure (Error)", async () => {
        const throwing = () => { throw new Error("boom"); };
        await expect(runValidator(throwing, "x", {})).resolves.toEqual({
          type: "validation_error", message: "boom",
        });
      });
  - CASE A2 (catch, non-Error arm — covers line 33 FALSE):
      it("should treat a throwing validator as a validation failure (non-Error)", async () => {
        const throwing = () => { throw "string error"; };
        await expect(runValidator(throwing, "x", {})).resolves.toEqual({
          type: "validation_error", message: "Validation error",
        });
      });
  - CASE B (!namedValidators — covers validate.ts:111-116; OMIT 4th arg):
      it("should pass with a warning when a named validator is requested but no validators provided", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        await expect(runValidator("required", "x", {})).resolves.toBe(true);  // 3 args only
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no validators provided"));
        warnSpy.mockRestore();
      });
  - CASE C (unknown spec — covers validate.ts:135):
      it("should pass for an unknown validator spec type", async () => {
        await expect(runValidator(42 as unknown as ValidatorSpec, "x", {})).resolves.toBe(true);
      });
  - NOTE: add `import type { ValidatorSpec } from "../../types";` ONLY if not
    already importable; otherwise use `as any`. The existing file imports from
    "../index" (values), not types — prefer `as any` to avoid a new import, OR
    add the type import if the linter prefers it.

Task 2: EXTEND describe("runValidatorSync") — regions D (array), E (string×3), F (unknown)
  - WHERE: inside the existing `describe("runValidatorSync", () => { ... })` block
           (currently contains exactly ONE test).
  - CASE D1 (array all-pass — covers 154-161 incl. final return true):
      it("should run an array of sync validators (all pass)", () => {
        const validators = { a: (v: unknown) => Boolean(v) || "A", b: () => true };
        expect(runValidatorSync(["a", "b"], "v", {}, validators)).toBe(true);
      });
  - CASE D2 (array short-circuit — covers 157-159):
      it("should short-circuit sync arrays on first failure", () => {
        let secondCalled = false;
        expect(runValidatorSync([() => "nope", () => { secondCalled = true; return true; }], "v", {})).toBe("nope");
        expect(secondCalled).toBe(false);
      });
  - CASE E1 (string happy — covers 165, 170, 175-178):
      it("should run a named sync validator", () => {
        const validators = { notEmpty: (v: unknown) => Boolean(v) || "Required" };
        expect(runValidatorSync("notEmpty", "v", {}, validators)).toBe(true);
        expect(runValidatorSync("notEmpty", "", {}, validators)).toBe("Required");
      });
  - CASE E2 (string no-config — covers 166-167):
      it("should pass when a named sync validator is requested but no validators provided", () => {
        expect(runValidatorSync("notEmpty", "v", {})).toBe(true);  // 3 args only
      });
  - CASE E3 (string not-found — covers 171-172):
      it("should pass when a named sync validator is not found", () => {
        expect(runValidatorSync("missing", "v", {}, {})).toBe(true);
      });
  - CASE F (unknown — covers 187):
      it("should pass for an unknown sync validator spec type", () => {
        expect(runValidatorSync(42 as any, "x", {})).toBe(true);
      });

Task 3: EXTEND describe("maxLength") — region G (skip-non-string)
  - WHERE: inside `describe("Built-in validators") > describe("maxLength")`.
  - CASE G:
      it("should skip non-strings", () => {
        const validator = maxLength(5);
        expect(validator(123, {})).toBe(true);     // covers 276-278
        expect(validator(null, {})).toBe(true);
      });

Task 4: EXTEND describe("pattern") — region H (skip-non-string + default message)
  - WHERE: inside `describe("Built-in validators") > describe("pattern")`.
  - CASE H1 (skip-non-string — covers 298-300):
      it("should skip non-strings", () => {
        const validator = pattern(/\d/);
        expect(validator(123, {})).toBe(true);
        expect(validator(null, {})).toBe(true);
      });
  - CASE H2 (default message fallback — covers line 304 `?? "Invalid format"`):
      it("should use a default message when none is provided", () => {
        const validator = pattern(/^[A-Z]/);   // NO 2nd arg
        expect(validator("lower", {})).toEqual({ type: "pattern", message: "Invalid format" });
      });

Task 5: EXTEND describe("resolveErrorMessage") — regions I (type-fallback + no-type), J (final fallback)
  - WHERE: inside `describe("Error Message Resolution") > describe("resolveErrorMessage")`.
  - CASE I-c (type-fallback on lookup miss — covers 57-59):
      it("should fall back to a formatted type message when the type has no entry", () => {
        expect(resolveErrorMessage({ type: "customThing" }, {})).toBe("Custom thing");
      });
  - CASE I-d (object with no type — covers line 61):
      it("should return the generic message for an object result with no type", () => {
        expect(resolveErrorMessage({}, {})).toBe("Invalid value");
        expect(resolveErrorMessage({ message: undefined } as any, {})).toBe("Invalid value");
      });
  - CASE J (non-object primitive final fallback — covers line 64):
      it("should return the generic message for an unhandled primitive", () => {
        expect(resolveErrorMessage(42 as any)).toBe("Invalid value");
      });

Task 6: EXTEND describe("getErrorType") — region K (object-no-type + primitive fallback)
  - WHERE: inside `describe("Error Message Resolution") > describe("getErrorType")`.
  - CASE K1 (object without type — covers line 145 `||` falsy arm):
      it("should return 'validate' for an object result with no type", () => {
        expect(getErrorType({})).toBe("validate");
      });
  - CASE K2 (primitive final fallback — covers 148-149):
      it("should return 'validate' for an unhandled primitive", () => {
        expect(getErrorType(42 as any)).toBe("validate");
      });
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: pure-function assertion (the vast majority of new cases)
expect(runValidatorSync("notEmpty", "v", {}, validators)).toBe(true);
expect(resolveErrorMessage({ type: "customThing" }, {})).toBe("Custom thing");
expect(pattern(/^[A-Z]/)("lower", {})).toEqual({ type: "pattern", message: "Invalid format" });

// PATTERN: async validator result via .resolves
await expect(runValidator(throwing, "x", {})).resolves.toEqual({
  type: "validation_error", message: "boom",
});

// PATTERN: asserting + silencing the dev console.warn (Task 1, CASE B)
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
await runValidator("required", "x", {});          // 3 args → "!namedValidators" arm
expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no validators provided"));
warnSpy.mockRestore();                            // ALWAYS restore to avoid leaking

// PATTERN: reaching type-forbidden runtime branches via cast
runValidator(42 as unknown as ValidatorSpec, "x", {})   // "unknown spec" branch
resolveErrorMessage(42 as any)                          // primitive final fallback
getErrorType(42 as any)                                 // primitive final fallback
```

### Integration Points

```yaml
VITEST CONFIG:
  - file: packages/core/vitest.config.ts
  - note: |
      Already correct. environment:"node", globals:true,
      include:["src/**/*.test.ts"]. The extended validation.test.ts matches the
      glob and needs NO config change. (globals:true means `describe`/`it`/
      `expect` are available without imports, but the existing file imports them
      explicitly from "vitest" — keep that style.)

COVERAGE CONFIG:
  - file: vitest.config.ts (repo root)
  - note: |
      Has coverage.exclude (correct) but NO coverage.thresholds block. DO NOT
      add thresholds — that is P1.M2.T1.S5's job. This task is test-only.

PARALLEL-EXECUTION CONTRACT:
  - S2 (Form.coverage.test.tsx) and S1 (useFormState.test.tsx) run in the REACT
    package; S3 runs in CORE. No file overlap, no behavioral coupling.
  - Because S1 can currently fail and abort the full coverage JSON emission,
    validate THIS suite with the file-targeted command in Validation Level 3.
  - S3 writes ONLY packages/core/src/__tests__/validation.test.ts.

TYPE-SAFETY CONTRACT (do not weaken):
  - Do NOT change any type in packages/core/src/types/validation.ts to make the
    "unknown spec" / primitive-fallback tests type-check without a cast. The
    cast (`as unknown as ValidatorSpec` / `as any`) is the intended way to
    exercise a runtime branch the types intentionally forbid.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing the file — fix before proceeding
pnpm --filter @formality-ui/core exec tsc --noEmit -p tsconfig.json 2>/dev/null || pnpm typecheck
pnpm lint packages/core/src/__tests__/validation.test.ts
pnpm --filter @formality-ui/core exec prettier --check src/__tests__/validation.test.ts
# Expected: zero errors. Watch for: unused `vi` import if you ended up not spying;
# unused `ValidatorSpec` type import; `any` flagged by eslint (the existing file
# already uses casts, so the rule is permissive — but verify).
```

### Level 2: Unit Tests (the suite itself)

```bash
# Run JUST the extended file (fast; CORE package, node env, no timers)
pnpm vitest run packages/core/src/__tests__/validation.test.ts
# Expected: ALL tests green (existing + new). If a new case fails, the SUT
# behavior differs from this PRP's assumption — READ the failure, adjust the
# EXPECTED value (the source is the source of truth; the PRP predicted it).

# Full core suite to confirm no regressions
pnpm --filter @formality-ui/core test
# Expected: all green (core has no known failing sibling — S1/S2 failures are
# react-package only).
```

### Level 3: Coverage Validation (the actual deliverable gate)

```bash
# File-targeted coverage run (emits JSON regardless of react-package state)
pnpm vitest run packages/core/src/__tests__/validation.test.ts --coverage

# Confirm the two SUT files cleared the target (v8, from the table above):
#   validate.ts  stmt >= 95%   branch >= 90%   func = 100%
#   messages.ts  stmt ~ 100%   branch ~ 100%   func = 100%
# (Read the "core/src/validation" rows in the printed coverage table.)

# Precise remaining-uncovered-line check (sanity — should be near-empty):
node -e '
  const c = require("./coverage/coverage-final.json");
  for (const base of ["validation/validate.ts","validation/messages.ts"]) {
    const k = Object.keys(c).find((x) => x.endsWith(base));
    if (!k) { console.log(base, "NOT FOUND in coverage"); continue; }
    const f = c[k];
    const lines = new Set();
    for (const [id, s] of Object.entries(f.statementMap)) {
      if (f.s[id] === 0) for (let l = s.start.line; l <= s.end.line; l++) lines.add(l);
    }
    console.log(base, "uncovered stmt lines:", [...lines].sort((a,b)=>a-b).join(",") || "(none)");
  }
'
# Expected for validate.ts: at most a couple of lines (the resolveNamedValidator
# false arm is already covered; nothing material should remain).
# Expected for messages.ts: "(none)" or empty.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Verify each PRD §9.3 ValidationResult return shape is now pinned by a test:
#   true / undefined (valid)   → existing isValid + resolveErrorMessage tests
#   false                       → existing resolveErrorMessage(false) test
#   string                      → existing + region C unknown-spec path
#   { type }                    → region I-c (type-fallback) + existing lookup-hit
#   { type, message }           → existing object-with-message test
# (No extra command — satisfied by the cases in Tasks 1–6. Ensure the describe
#  block names make the §9.3 mapping obvious.)

# Verify the PRD §9.4 resolveErrorMessage matrix is fully covered:
#   valid (true/undefined/null) → undefined
#   false                        → errorMessages.invalid ?? "Invalid value"
#   string                       → string
#   {type, message?}             → message ?? errorMessages[type] ?? formatTypeAsMessage(type)
# (Satisfied by Tasks 5 + existing cases. The null arm: note the CURRENT source
#  checks `result === true || result === undefined` (NOT null) — null falls
#  through to the object check (`typeof null === "object"`) → `null !== null` is
#  false → skips object block → final `return "Invalid value"`. If you want to
#  pin this, add resolveErrorMessage(null as any) → "Invalid value"; optional.)
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: `pnpm typecheck` clean; `pnpm lint` on the test file clean.
- [ ] Level 2 passed: `pnpm --filter @formality-ui/core test` green (zero new failures).
- [ ] Level 3 passed: `validate.ts` ≥ 95% stmt / ≥ 90% branch / 100% func;
      `messages.ts` ~100% stmt / ~100% branch / 100% func.
- [ ] No new lint warnings (no unused `vi`/`ValidatorSpec` imports; `any` casts intentional).

### Feature Validation

- [ ] Task 1: throwing-validator catch block BOTH ternary arms + `!namedValidators` warn + unknown-spec (validate.ts:29-35, 111-116, 135).
- [ ] Task 2: `runValidatorSync` array (all-pass + short-circuit), string (happy + no-config + not-found), unknown-spec (validate.ts:154-187).
- [ ] Task 3: `maxLength` skip-non-string (validate.ts:276-278).
- [ ] Task 4: `pattern` skip-non-string + default-message fallback (validate.ts:298-300, 304).
- [ ] Task 5: `resolveErrorMessage` type-fallback + no-type-object + primitive-final-fallback (messages.ts:57-61, 64).
- [ ] Task 6: `getErrorType` object-no-type + primitive-final-fallback (messages.ts:145, 148-149).
- [ ] No source files under `packages/*/src/**` modified (test-only deliverable).

### Code Quality Validation

- [ ] New cases added INSIDE the existing `describe` blocks (mirrors file structure).
- [ ] NO existing test removed or rewritten (diff is purely additive).
- [ ] `it(...)` names are self-documenting and map 1:1 to a coverage region.
- [ ] File placement: `packages/core/src/__tests__/validation.test.ts` (modified, not new).
- [ ] Anti-patterns avoided: no `.only`/`.skip`; no React/DOM/timer imports; `console.warn` spied AND restored; no coverage.thresholds added.

### Documentation & Deployment

- [ ] No docs needed (item OUTPUT §5: test-only, no API/config/surface change).
- [ ] Did NOT add `coverage.thresholds` to root vitest.config.ts (S5's job).

---

## Anti-Patterns to Avoid

- ❌ Don't create a NEW test file. Item INPUT §2 explicitly says to EXTEND
  `validation.test.ts`. A second file would fragment the validation suite and
  risk import-style drift.
- ❌ Don't delete or rewrite the existing passing tests to "make room". The diff
  must be purely additive — every existing assertion still pins a real behavior.
- ❌ Don't weaken the types in `types/validation.ts` (e.g. adding `number` to
  `ValidatorSpec` or `ValidationResult`) just so the unknown-spec / primitive
  tests type-check without a cast. The runtime branches exist precisely for
  defensive handling of type-invalid input; reach them with `as unknown as ...`
  / `as any` and leave the strict types alone.
- ❌ Don't pass `{}` as the `namedValidators` argument when you intend to cover
  the `!namedValidators` arm (validate.ts:111). `{}` is truthy → it takes the
  "not found" branch (line 120) instead. OMIT the 4th argument for region B.
- ❌ Don't forget to `warnSpy.mockRestore()` after spying `console.warn` —
  leaking the spy silences warnings for every subsequent test in the run.
- ❌ Don't import React / @testing-library / fake timers. These are pure core
  functions in the node environment; any such import is a category error and
  will either fail to resolve in `@formality-ui/core` or break the build.
- ❌ Don't add `coverage.thresholds` to vitest.config.ts — that is
  P1.M2.T1.S5's explicit deliverable.
- ❌ Don't re-test `resolveNamedValidator`'s not-a-function arm with a
  non-function config value — it is ALREADY covered (the existing "nonExistent"
  test passes a key that resolves to `undefined`, which is not a function), and
  a non-function value would violate the `ValidatorsConfig` type for no gain.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- Both System-Under-Test files are **pure functions** with **no state, no
  timers, no DOM, no framework coupling** — the single lowest-risk category of
  coverage work. Every new case is a direct return-value assertion.
- Every uncovered region is mapped **line-number-exactly** to a concrete test
  case (regions A–K in `research/coverage-map.md`), including the exact inputs
  (e.g. "omit the 4th argument", "call pattern() without a message", "cast `42
  as any`") and the exact expected return value.
- The `runValidatorSync` gap (regions D/E/F) is the largest single block and is
  fully enumerated into six discrete cases — no guessing.
- The -1 is for two minor unknowns: (1) the exact remaining uncovered line(s)
  after the backfill may include the `resolveNamedValidator` not-a-function arm
  (already covered, but v8's branch accounting can occasionally leave a residual
  arm) — acceptable, since it does not affect the ≥95%/≥90% targets; and
  (2) eslint's stance on `as any` in this repo should be confirmed at Level 1
  (the existing test file already uses value-or casts, so it is permissive, but
  verify). Neither risks the gate.
