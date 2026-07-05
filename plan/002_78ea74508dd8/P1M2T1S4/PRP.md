name: "P1.M2.T1.S4 — MARGIN: extend Field/expression/transform/config tests to ~92%"
description: |

---

## Goal

**Feature Goal**: Push the four worst per-file coverage offenders in the
in-scope surface — `react/src/components/Field.tsx` (75.8% branch),
`core/src/expression/infer.ts` (75.86% branch), `core/src/transform/pipeline.ts`
(84.61% branch), `core/src/expression/evaluate.ts` (93.1% branch but 86.36%
stmt), and `core/src/config/merge.ts` (whole `createConfigContext` fn at 0%) —
each up to **≥ 90% stmt / ≥ 90% branch / 100% func**, so the repo-wide coverage
clears the 90% hard gate (PRD §1.3.7) with a stable **~92–94% buffer** and no
in-scope per-file metric below 90%. This is the **safety-margin** subtask that
runs after S1–S3 have (thinly) cleared the gate.

**Deliverable**:

1. **EXTEND (modify, do not rewrite) four existing test files** — add new
   `it(...)` cases (and new nested `describe` blocks where natural) covering
   every region A–X in `research/coverage-map.md`:
   - `packages/react/src/__tests__/Field.test.tsx` — regions F1–F11
   - `packages/core/src/__tests__/expression.test.ts` — regions E1–E4 + I1–I4
   - `packages/core/src/__tests__/transform.test.ts` — regions T1–T8
   - `packages/core/src/__tests__/config.test.ts` — regions C1–C2
   - **Do NOT create new files.** **Do NOT delete or rewrite any existing
     passing test.** The diff must be purely additive.
2. **No source changes.** No new deps. No docs (item OUTPUT §5: test-only).
   **Do NOT add `coverage.thresholds` to `vitest.config.ts`** — that is
   P1.M2.T1.S5's explicit deliverable.

**Success Definition**:

1. `pnpm test:coverage` is green with all 883+ existing tests still passing.
2. Per-file (from the printed v8 table):
   - `Field.tsx` ≥ 90% stmt / ≥ 90% branch / 100% func
   - `evaluate.ts` ≥ 95% stmt / ≥ 98% branch / 100% func
   - `infer.ts` ≥ 90% stmt / ≥ 90% branch / 100% func
   - `pipeline.ts` ≥ 95% stmt / ≥ 96% branch / 100% func
   - `merge.ts` ≥ 95% stmt / 100% branch / 100% func
3. Repo-wide **statements / branches / functions / lines ≥ ~92%** (stable margin
   above the 90% gate). No in-scope per-file metric below 90% (type-only
   modules / barrels are excluded by PRD §1.3.7 and are not a concern).
4. Every region E1–E4, I1–I4, T1–T8, C1–C2, F1–F11 in
   `research/coverage-map.md` is exercised by at least one named,
   self-documenting test case.

## User Persona (if applicable)

**Target User**: Library maintainer / CI coverage gate (PRD §1.3.7 / Appendix B
h3.95). After S1–S3 the gate passes with little headroom; a single future
refactor could drop it under 90%. S4 buys the margin so the gate stays green
through P1.M3 and beyond.

**Use Case**: Automated regression protection for the operator-dispatch,
string-literal inference, parse/format error handling, config-merge, and Field
component branches that are currently exercised only indirectly (or not at all).

**Pain Points Addressed**: Today a refactor could silently drop the named-parser
throw path, the `!=` operator arm, the `createConfigContext` merge, the template
rendering path, or the type-level validator — and no unit test would notice.
This suite makes every arm observable.

## Why

- **Coverage gate margin (PRD §1.3.7 / h3.95).** The repo enforces **≥ 90%** on
  statements, branches, functions, and lines via vitest v8 thresholds run in CI.
  At the S4 baseline (S1+S2 applied) the repo sits at **91.80% stmt / 89.94%
  branch** — branches *just* under 90%. The five files above carry the worst
  per-file branch percentages in scope. This is step 4–7 of
  `architecture/coverage_gaps.md` §5 ("steps 4–7 give a stable ~92% headroom").
- **PRD behavioral coverage.** The uncovered arms encode real guarantees that
  are currently untested: every expression operator (§4.2.1), descriptor
  inference skipping string literals (§4.3.3), the parse/format pipelines'
  error + named-not-found behavior (§5.3.5 / §10), the full config merge
  including `createConfigContext` (§6.1), and Field's props-resolution +
  template-rendering + type-level-validator paths (§5.3.2 / §5.3.7 / §5.3.8).
- **Cheap & deterministic.** Four of the five files are **pure functions** with
  zero framework/state/timer dependencies (core package, node env). Field.tsx
  is the only React component and reuses the existing RTL harness.

## What

Add **new `it(...)` test cases** to the four existing test files, organised
under existing top-level/nested `describe` blocks. Mirror each file's existing
style:

- **Core tests** (`expression.test.ts`, `transform.test.ts`, `config.test.ts`):
  plain synchronous assertions (`expect(...).toBe(...)` / `.toEqual(...)`) in
  vitest's **node** environment. **No mocking required** except an optional
  `vi.spyOn(console, "warn").mockImplementation(() => {})` to assert+silence the
  dev `console.warn` arms (parse/format not-found + throw; expression type
  errors/overflow). Core has no "no-mocks" rule.
- **React test** (`Field.test.tsx`): reuse the existing `render`/`screen`/
  `waitFor`/`userEvent` harness, the existing `TestInput`/`TestSwitch`
  components, and the existing `testInputs` config already defined at the top of
  the file. New templates / input types should be defined locally in the test.
  Use `vi.spyOn(console, "warn")` if a case triggers a dev warning.

### Success Criteria

- [ ] Four existing test files extended; **no existing test removed or rewritten**.
- [ ] All five target files meet the per-file minimums in Success Definition #2.
- [ ] Repo-wide all four metrics ≥ ~92%.
- [ ] No source files under `packages/*/src/**` modified (test-only).
- [ ] `pnpm test:coverage` green (no regressions); existing 883 tests still pass.
- [ ] No `coverage.thresholds` added to any vitest config (that is S5's job).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the exact current
per-file coverage baseline, the exact uncovered branch line numbers with source
snippets, the existing test-file structure + harness, and the type definitions
for the core APIs. All cited below with exact paths and line numbers.
✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/002_78ea74508dd8/P1M2T1S4/research/coverage-map.md
  section: "1. evaluate.ts" + "2. infer.ts" + "3. pipeline.ts" + "4. merge.ts" + "5. Field.tsx"
  why: |
    Authoritative, line-number-exact map of EVERY uncovered region (E1–E4,
    I1–I4, T1–T8, C1–C2, F1–F11) with the EXACT source line, what it is, and
    the concrete test case that covers it. Build the new it(...) cases directly
    from its region tables. This is the single source of truth for what to test.
  critical: |
    Four branches in evaluate.ts (E5–E8: arithmetic/unary/node-type default
    throws + the dedicated LogicalExpression case) are DEFENSIVE/DEAD for real
    expression strings (current jsep emits &&/||/?? as BinaryExpression). They
    are marked SKIP in the map — do NOT waste effort crafting impossible inputs;
    they do not affect the ≥90%/≥92% targets. Likewise two Field.tsx arms (F9:
    conditionResult.disabled/visible ?? defaults) may be hard to force — confirm
    via coverage which arm remains and only add a case if it is cheap.

- file: packages/core/src/expression/evaluate.ts
  why: SUT #1 (86.36% stmt / 93.10% branch). The operator-dispatch switch.
  pattern: |
    Uncovered regions (exact lines current as of this PRP):
      L147   `+` string-concat path, left-nullish arm (`?? ""`)
      L229   `+` numeric overflow → !Number.isFinite(result) → warn + undefined
      L251   loose `!=` operator arm (and `==` if uncovered)
      L336   `Compound` node case (comma / multiple statements → last wins)
      L224/L267/L309/L346  DEFENSIVE default throws — SKIP
  gotcha: |
    The whole `evaluate(...)` body is wrapped in try/catch that returns
    undefined on error. A branch that `throw`s still counts as COVERED (v8 marks
    the line executed when it runs), so e.g. `evaluate("1e308 + 1e308", {})`
    covers L229 even though the result is undefined. Newer jsep (installed)
    emits logical operators as BinaryExpression, so the dedicated
    `LogicalExpression` case (L267) is effectively dead — do not target it.

- file: packages/core/src/expression/infer.ts
  why: SUT #2 (76.62% stmt / 75.86% branch). The string-literal scanner.
  pattern: |
    Uncovered regions (exact lines):
      L82    `if (inString) continue;` — identifier inside a string literal
      L68/L74 string-state enter/exit arms (single AND double quotes)
      L58/L63 escape-sequence arms (`\\` sets escapeNext; next char skipped)
      L158   inferFieldsFromDescriptor primitive fall-through `return []`
  gotcha: |
    To exercise the escape arms (L58/L63) you MUST put an actual backslash in the
    string UNDER TEST. In a TS/JS string literal write `"\"a\\\\\"b\""` carefully:
    the runtime string must contain a backslash before the inner quote. Verify by
    logging or by asserting the expected output array. The array/object branches
    of inferFieldsFromDescriptor are ALREADY covered — do not re-add.

- file: packages/core/src/transform/pipeline.ts
  why: SUT #3 (85.06% stmt / 84.61% branch). parse/format + default configs.
  pattern: |
    Uncovered regions (exact lines):
      L77    named-PARSER try/catch (a named parser that THROWS)
      L95    parse tail (function-type arms + final `return value`)
      L132   named-FORMATTER not-found (`if (!formatter)`)
      L142   named-FORMATTER try/catch (a named formatter that THROWS)
      L160   format tail (mirror of L95)
      L295   createDefaultParsers.string `?? ""` nullish arm
      L313   createDefaultFormatters.integer non-number/NaN early-return arm
      L318   createDefaultFormatters.string `?? ""` nullish arm
  gotcha: |
    The existing suite already covers the INLINE parser/formatter throw paths
    and the named-parser not-found path — but NOT the named-parser/formatter
    THROW paths, nor the named-FORMATTER not-found path, nor the default-config
    `??`/non-number tails. Reach the defensive final `return value` (L95/L160)
    by passing a non-string-non-function spec cast with `as any`.

- file: packages/core/src/config/merge.ts
  why: SUT #4 (80.95% stmt / 85.71% func). createConfigContext is 0%.
  pattern: |
    Uncovered regions (exact lines):
      L91    mergeInputConfigs `} else {` new-key arm (form inputs add a NEW type)
      L227-258 createConfigContext — ENTIRE FUNCTION uncovered
  gotcha: |
    createConfigContext merges provider + optional form config and returns
    {inputs, formatters, parsers, validators, errorMessages, defaultFieldProps,
    selectDefaultFieldProps}. `selectDefaultFieldProps` falls back
    form→provider. Missing optional collections default to {}. Assert the FULL
    returned shape. The existing mergeInputConfigs object-form test only
    overrides an EXISTING key (textField) — add a NEW key to hit the else arm.

- file: packages/react/src/components/Field.tsx
  why: SUT #5 (87.91% stmt / 75.80% branch). Worst per-file branch %.
  pattern: |
    Uncovered regions (exact lines):
      L173/L176  config-lookup `?? {}` + type `?? "textField"` defaults
      L181/L189  formConfig.inputs FUNCTION form + override/add BOTH arms
      L198       resolveInputConfig `?? {input fallback}` arm
      L264/L267  field-level + group-level set-condition arms
      L280/L282  effectiveSetValue `hasCondition && value!==undefined` arms
      L307/L308  disabled `?? false` + group-disabled `return true`
      L322       visible `?? true`
      L378       TYPE-level validator (`inputConfig.validator`) failing path
      L482       template-rendering ternary BOTH arms + render-prop children
  gotcha: |
    Existing validation tests exercise ONLY the field-level validator
    (`fieldConfig.validator`). To cover L378 you must define an input TYPE whose
    InputConfig carries a `validator` and render a Field of that type, then
    trigger validation (blur/submit) to FAIL it. Template rendering (L482) needs
    a `FormalityProvider` with `inputTemplates` and/or `defaultInputTemplate`.
    The render-prop branch needs `<Field>{(api) => ...}</Field>`.

- file: packages/react/src/__tests__/Field.test.tsx
  why: The file to EXTEND for Field.tsx. Reuses its harness verbatim.
  pattern: |
    Top-of-file already defines: TestInput (forwardRef), TestSwitch (forwardRef),
    testInputs ({textField:{component:TestInput,defaultValue:""},
    switch:{component:TestSwitch,defaultValue:false}}), and imports render,
    screen, waitFor, userEvent, vi, Field, Form, FormalityProvider. Wrap every
    render in <FormalityProvider inputs={...}><Form config={...}><Field/>
    </Form></FormalityProvider>. Add new describe blocks: "template rendering",
    "type-level validator", "set conditions", "config-less fields",
    "form inputs function form", "FieldGroup disabled", "render-prop children".

- file: packages/core/src/__tests__/expression.test.ts
  why: The file to EXTEND for evaluate.ts + infer.ts.
  pattern: |
    Existing top-level describe("Expression Engine") with nested
    describe("evaluate"), describe("evaluateDescriptor"),
    describe("Field Inference") > inferFieldsFromExpression /
    inferFieldsFromDescriptor. All needed imports (evaluate, evaluateDescriptor,
    inferFieldsFromExpression, inferFieldsFromDescriptor) already present. Add
    E1–E4 under "evaluate" and I1–I4 under inferFieldsFromExpression /
    inferFieldsFromDescriptor.

- file: packages/core/src/__tests__/transform.test.ts
  why: The file to EXTEND for pipeline.ts.
  pattern: |
    Existing describe("Transform Pipeline") with nested describes parse, format,
    extractValueField, transformFieldName, Built-in Parsers, Built-in
    Formatters, Default Parsers/Formatters. Imports parse, format,
    createFloatParser/Formatter, createIntParser, createTrimParser,
    createDefaultParsers, createDefaultFormatters. Add T1/T2 under "parse",
    T3/T4/T5 under "format", T6/T7/T8 under "Default Parsers/Formatters". Add
    `vi` to the vitest import only if you spy console.warn.

- file: packages/core/src/__tests__/config.test.ts
  why: The file to EXTEND for merge.ts.
  pattern: |
    Existing describe("Config Module") with nested describes per export. Imports
    deepMerge, mergeInputConfigs, resolveInputConfig, resolveFieldType,
    mergeStaticProps, mergeFieldProps, createConfigContext (+ initial-value
    helpers), and types InputConfig/FieldConfig/FormalityProviderConfig. Add C1
    as a NEW describe("createConfigContext") and C2 as a new case under
    describe("mergeInputConfigs").

- docfile: plan/002_78ea74508dd8/architecture/coverage_gaps.md
  section: §2 (ranked files), §3 (uncovered regions), §5 steps 4–7
  why: Confirms these five files are the step 4–7 backfill; expected combined
        gain pushes repo to stable ~92–94%.

- docfile: plan/002_78ea74508dd8/P1M2T1S3/PRP.md
  section: "Parallel Execution Contract" + Goal
  why: |
    Sibling S3 (validation.test.ts → validate.ts + messages.ts) is being
    implemented IN PARALLEL in the CORE package. S4 touches DIFFERENT core test
    files (expression/transform/config) and the react Field test — NO file
    overlap with S3. Treat S3 as already-applied: when you run the full
    `pnpm test:coverage`, validate.ts/messages.ts should already be ≥95%.
    Do NOT add any validation tests (that is S3's exclusive deliverable).

- docfile: PRD §4.2.1 / §4.3.3 / §5.3 / §6.1 / §10 (h3.14, h3.15, h3.18, h3.21, h3.23, h3.41–h3.43)
  section: expression operators, descriptor inference, Field component,
           config merge priority, value transformation
  why: The behavioral contracts these tests pin (operator semantics, merge
        priority order, parse/format error handling, Field rendering paths).

- url: https://vitest.dev/api/#expect
  why: `expect(...).toEqual(...)` for deep equality; `.toBe(...)` for primitives;
        `.resolves` not needed here (sync core fns; Field tests use sync RTL).
- url: https://vitest.dev/guide/mocking.html#console
  why: Canonical `vi.spyOn(console, "warn").mockImplementation(() => {})` to
        assert + silence the dev console.warn arms. ALWAYS mockRestore after.
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/
├── expression/
│   ├── evaluate.ts        # ← SUT (86.36% stmt / 93.10% branch / 100% func)
│   └── infer.ts           # ← SUT (76.62% stmt / 75.86% branch / 100% func)
├── transform/
│   └── pipeline.ts        # ← SUT (85.06% stmt / 84.61% branch / 100% func)
├── config/
│   └── merge.ts           # ← SUT (80.95% stmt / 85.71% func; createConfigContext 0%)
└── __tests__/
    ├── expression.test.ts     # ← EXTEND (E1–E4, I1–I4)
    ├── transform.test.ts      # ← EXTEND (T1–T8)
    └── config.test.ts         # ← EXTEND (C1–C2)

packages/react/src/
├── components/
│   └── Field.tsx          # ← SUT (87.91% stmt / 75.80% branch / 100% func)
└── __tests__/
    └── Field.test.tsx     # ← EXTEND (F1–F11)

packages/core/vitest.config.ts   # environment:"node", globals:true,
                                 #   include:["src/**/*.test.ts"] — new tests
                                 #   match the glob; NO config change needed.
packages/react/vitest.config.ts  # environment with jsdom; setup.ts loaded.
vitest.config.ts (repo root)     # coverage.exclude correct; NO thresholds block
                                 #   (that is P1.M2.T1.S5's deliverable — do NOT add).
```

### Desired Codebase tree with files to be added/modified

```bash
packages/core/src/__tests__/expression.test.ts   # MODIFIED — E1–E4, I1–I4 added
packages/core/src/__tests__/transform.test.ts    # MODIFIED — T1–T8 added
packages/core/src/__tests__/config.test.ts       # MODIFIED — C1–C2 added
packages/react/src/__tests__/Field.test.tsx      # MODIFIED — F1–F11 added
# (no new files; no source changes)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: the three CORE SUTs (evaluate.ts, infer.ts, pipeline.ts, merge.ts)
// are PURE functions — no React, no hooks, no timers, no DOM. Their tests run
// in vitest's "node" environment (core/vitest.config.ts). Do NOT import
// @testing-library/react or use fake timers there. Every assertion is a direct
// return-value check on an imported function.

// CRITICAL (evaluate.ts): evaluate() wraps evaluateNode in try/catch returning
// undefined on error. A `throw` inside a default arm STILL counts as covered
// (v8 marks the line executed). So `evaluate("1e308 + 1e308", {})` covers the
// overflow branch (L229) even though the return is undefined. Do NOT chase the
// 4 defensive default throws (E5–E8) — they are unreachable for real strings.

// CRITICAL (evaluate.ts): the installed jsep emits &&/||/?? as BinaryExpression
// (see the code comment in the BinaryExpression case). The dedicated
// `LogicalExpression` case (L267) is therefore effectively DEAD — skip it.

// CRITICAL (infer.ts): to cover the escape-sequence arms (L58/L63) the string
// UNDER TEST must contain a literal backslash. In your TS source that means
// doubling it. e.g. to get runtime string `a\"b` write "a\\\"b". Assert the
// resulting field array to confirm you actually exercised it.

// CRITICAL (pipeline.ts): the existing suite already covers the INLINE
// parser/formatter throw paths. The NAMED parser/formatter throw paths (L77,
// L142) and the named-FORMATTER not-found path (L132) are the gaps. Pass a
// named registry containing a throwing function: { boom: () => { throw ... } }.

// CRITICAL (pipeline.ts): the default `string` parser/formatter `?? ""` arms
// (L295, L318) only fire for null/undefined input — the existing tests pass a
// number (42) which exercises only the non-null arm. Pass null/undefined.

// CRITICAL (merge.ts): createConfigContext is ENTIRELY untested (0% function).
// Build a describe("createConfigContext") with 3–5 cases covering: form inputs
// merged, defaultFieldProps merged (provider + form), selectDefaultFieldProps
// fallback (form → provider), and missing optional collections → {}.

// CRITICAL (Field.tsx): existing validation tests use fieldConfig.validator
// ONLY. To cover L378 you MUST define an input TYPE with a `validator` in the
// provider inputs and render a Field of that type, then trigger validation to
// FAIL. Do not confuse field-level (fieldConfig.validator) with type-level
// (inputConfig.validator).

// CRITICAL (Field.tsx): template rendering (L482) needs a FormalityProvider
// with `inputTemplates` (per-type) and/or `defaultInputTemplate`. Define a
// minimal template component inline in the test that wraps children + shows a
// label/error slot. The render-prop branch needs children-as-function:
//   <Field name="x">{(api) => <div data-testid="rp">{...}</div>}</Field>

// GOTCHA: do NOT add coverage.thresholds to vitest.config.ts — that is
// P1.M2.T1.S5's explicit deliverable. This task is test-only.

// GOTCHA (parallel execution): sibling S3 extends validation.test.ts (CORE).
// S4 extends expression/transform/config tests (CORE) + Field.test.tsx (REACT).
// NO file overlap. Do NOT touch validation.test.ts. When validating with the
// FULL `pnpm test:coverage`, expect validate.ts/messages.ts to already be high
// (S3 applied) — focus your assertions on the five S4 files.

// GOTCHA: keep a `vi.spyOn(console,"warn")` RESTORED after each use to avoid
// leaking the spy (which would silence warnings for every later test).
```

## Implementation Blueprint

### Data models and structure

No new models. Tests reuse the imports already present at the top of each test
file. Add `vi` to the `vitest` import in `transform.test.ts` (and
`expression.test.ts` / `Field.test.tsx` already import `vi`) only if you spy
`console.warn`. Field.test.tsx new input types/templates are defined locally in
the relevant `describe`.

### Implementation Tasks (ordered by dependencies)

The four files are independent — implement in any order, but the order below
goes lowest-risk (pure core) → highest-risk (React Field). After EACH task,
re-run the targeted coverage (Validation Level 3) to confirm the per-file metric
climbed before moving on.

```yaml
Task 1: EXTEND packages/core/src/__tests__/expression.test.ts — regions E1–E4 (evaluate.ts)
  - FILE: packages/core/src/__tests__/expression.test.ts
  - WHERE: inside the existing describe("evaluate", () => { ... }) block.
  - CASE E1 (string-concat left-nullish — covers L147):
      it("concatenates with a nullish left operand in the + string path", () => {
        expect(evaluate("missing + 'x'", {})).toBe("x");
      });
  - CASE E2 (+ overflow — covers L229):
      it("returns undefined when numeric + overflows to Infinity", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(evaluate("1e308 + 1e308", {})).toBeUndefined();
        warnSpy.mockRestore();
      });
  - CASE E3 (loose != — covers L251):
      it("supports loose inequality (!=)", () => {
        expect(evaluate("1 != 2", {})).toBe(true);
        expect(evaluate("1 != '1'", {})).toBe(false); // loose: 1 == '1'
      });
  - CASE E4 (Compound node — covers L336):
      it("evaluates comma-separated (Compound) expressions, returning the last", () => {
        expect(evaluate("1, 2, 3", {})).toBe(3);
      });
  - NOTE: E5–E8 (L224/L267/L309/L346) are DEFENSIVE/DEAD — SKIP. (Add a brief
    code comment noting why if desired; do not add tests for them.)

Task 2: EXTEND packages/core/src/__tests__/expression.test.ts — regions I1–I4 (infer.ts)
  - WHERE: inside describe("Field Inference") > describe("inferFieldsFromExpression")
           (I1–I3) and describe("inferFieldsFromDescriptor") (I4).
  - CASE I1 (identifier inside string literal — covers L82):
      it("skips identifiers that appear inside string literals", () => {
        expect(inferFieldsFromExpression('"foo bar"')).toEqual([]);
      });
  - CASE I2 (single-quote enter/exit — covers L68/L74):
      it("handles single-quoted string literals", () => {
        expect(inferFieldsFromExpression("'a' + b")).toEqual(["b"]);
        expect(inferFieldsFromExpression('signed ? "x" : "y"')).toEqual(["signed"]);
      });
  - CASE I3 (escape sequence — covers L58/L63):
      it("handles escaped characters inside string literals", () => {
        // runtime string contains a backslash before the inner quote
        expect(inferFieldsFromExpression('"a\\"b" + c')).toEqual(["c"]);
      });
  - CASE I4 (primitive fall-through — covers L158):
      it("returns empty for primitive descriptors", () => {
        expect(inferFieldsFromDescriptor(42)).toEqual([]);
        expect(inferFieldsFromDescriptor(null)).toEqual([]);
        expect(inferFieldsFromDescriptor(true)).toEqual([]);
      });

Task 3: EXTEND packages/core/src/__tests__/transform.test.ts — regions T1–T8 (pipeline.ts)
  - FILE: packages/core/src/__tests__/transform.test.ts
  - WHERE: add `vi` to the vitest import; add T1/T2 under describe("parse"),
           T3/T4/T5 under describe("format"), T6/T7/T8 under
           describe("Default Parsers/Formatters").
  - CASE T1 (named parser throws — covers L77):
      it("should handle a named parser that throws", () => {
        expect(parse("value", "boom", { boom: () => { throw new Error("x"); } })).toBe("value");
      });
  - CASE T2 (defensive final return — covers L95 tail):
      it("should return the value for a non-string/non-function spec", () => {
        expect(parse("value", 42 as any)).toBe("value");
      });
  - CASE T3 (named formatter not found — covers L132):
      it("should handle missing named formatter gracefully", () => {
        expect(format("value", "nonExistent", {})).toBe("value");
      });
  - CASE T4 (named formatter throws — covers L142):
      it("should handle a named formatter that throws", () => {
        expect(format("value", "boom", { boom: () => { throw new Error("x"); } })).toBe("value");
      });
  - CASE T5 (defensive final return — covers L160 tail):
      it("should return the value for a non-string/non-function formatter spec", () => {
        expect(format("value", 42 as any)).toBe("value");
      });
  - CASE T6 (default string parser nullish — covers L295):
      it("default string parser coerces null/undefined to empty string", () => {
        const parsers = createDefaultParsers();
        expect(parsers.string(null)).toBe("");
        expect(parsers.string(undefined)).toBe("");
      });
  - CASE T7 (default integer formatter non-number — covers L313):
      it("default integer formatter returns empty for non-numbers", () => {
        const formatters = createDefaultFormatters();
        expect(formatters.integer(NaN)).toBe("");
        expect(formatters.integer("x" as any)).toBe("");
      });
  - CASE T8 (default string formatter nullish — covers L318):
      it("default string formatter coerces null/undefined to empty string", () => {
        const formatters = createDefaultFormatters();
        expect(formatters.string(null)).toBe("");
      });

Task 4: EXTEND packages/core/src/__tests__/config.test.ts — regions C1–C2 (merge.ts)
  - FILE: packages/core/src/__tests__/config.test.ts
  - CASE C2 (mergeInputConfigs new-key arm — covers L91):
      WHERE: inside describe("mergeInputConfigs"); add:
      it("should add a new input type introduced by form inputs", () => {
        const merged = mergeInputConfigs(providerInputs, {
          custom: { component: "Custom", defaultValue: "" },
        } as any);
        expect(merged.custom).toEqual({ component: "Custom", defaultValue: "" });
      });
  - CASE C1 (createConfigContext whole fn — covers L227–258):
      WHERE: add a NEW describe("createConfigContext") sibling block. Cover:
        (a) basic shape with provider only,
        (b) form inputs merged in,
        (c) defaultFieldProps merged (provider + form, form wins),
        (d) selectDefaultFieldProps precedence (form over provider; provider when form omits),
        (e) missing optional collections default to {}.
      Example:
      it("merges provider and form config into a context", () => {
        const provider: FormalityProviderConfig = {
          inputs: { textField: { component: "T", defaultValue: "" } } as any,
          formatters: { f: () => "x" },
          defaultFieldProps: { size: "small" },
          selectDefaultFieldProps: { label: "props.name" },
        };
        const ctx = createConfigContext(provider, {
          defaultFieldProps: { margin: "dense" },
          selectDefaultFieldProps: { placeholder: "p" },
        } as any);
        expect(ctx.defaultFieldProps).toEqual({ size: "small", margin: "dense" });
        expect(ctx.selectDefaultFieldProps).toEqual({ placeholder: "p" });
        expect(ctx.formatters.f("y")).toBe("x");
        expect(ctx.parsers).toEqual({}); // missing → {}
        expect(ctx.inputs.textField).toBeDefined();
      });
      it("falls back to provider selectDefaultFieldProps when form omits it", () => {
        const provider: FormalityProviderConfig = {
          inputs: {} as any,
          selectDefaultFieldProps: { label: "props.name" },
        };
        const ctx = createConfigContext(provider);
        expect(ctx.selectDefaultFieldProps).toEqual({ label: "props.name" });
        expect(ctx.defaultFieldProps).toEqual({}); // both omitted → {}
      });

Task 5: EXTEND packages/react/src/__tests__/Field.test.tsx — regions F1–F11 (Field.tsx)
  - FILE: packages/react/src/__tests__/Field.test.tsx
  - WHERE: add new describe blocks under the top-level describe("Field").
           Reuse TestInput/TestSwitch/testInputs. Define a local template +
           type-level-validator input type + (if needed) a FieldGroup helper.
  - CASE F1 (config-less field — covers L173) + F2 (type defaults — covers L176):
      describe("config-less fields and type defaults", () => {
        it("renders a field absent from config using the textField default", () => {
          render(<FormalityProvider inputs={testInputs}><Form config={{}}><Field name="orphan" /></Form></FormalityProvider>);
          expect(screen.getByTestId("orphan")).toBeInTheDocument();
        });
        it("honours an explicit type prop", () => {
          render(<FormalityProvider inputs={testInputs}><Form config={{ sw: {}}}><Field name="sw" type="switch" /></Form></FormalityProvider>);
          expect(screen.getByTestId("sw")).toHaveAttribute("type", "checkbox");
        });
      });
  - CASE F3 (formConfig.inputs function — covers L181) + F4 (override+add arms — covers L189):
      describe("form-level inputs overrides", () => {
        it("accepts a function-form inputs config", () => {
          render(<FormalityProvider inputs={testInputs}><Form inputs={() => ({ textField: { debounce: 500 } })} config={{ name: { type: "textField" } }}><Field name="name" /></Form></FormalityProvider>);
          expect(screen.getByTestId("name")).toBeInTheDocument();
        });
        it("adds a brand-new input type via form inputs", () => {
          render(<FormalityProvider inputs={testInputs}><Form inputs={{ custom: { component: TestInput, defaultValue: "" } }} config={{ c: { type: "custom" } }}><Field name="c" /></Form></FormalityProvider>);
          expect(screen.getByTestId("c")).toBeInTheDocument();
        });
      });
  - CASE F5 (unknown-type fallback — covers L198):
      it("renders the input fallback for an unknown type", () => {
        render(<FormalityProvider inputs={testInputs}><Form config={{ x: { type: "totallyUnknown" } }}><Field name="x" /></Form></FormalityProvider>);
        expect(screen.getByTestId("x")).toBeInTheDocument(); // or query input fallback
      });
  - CASE F6 (field-level set condition — covers L264/L280/L282):
      describe("set conditions", () => {
        it("applies a field-level set condition when the trigger matches", async () => {
          render(<FormalityProvider inputs={testInputs}>
            <Form config={{ trigger: { type: "textField" }, target: { type: "textField", conditions: [{ when: "trigger", is: "go", set: "forced" }] } }}>
              <Field name="trigger" /><Field name="target" />
            </Form></FormalityProvider>);
          await userEvent.type(screen.getByTestId("trigger"), "go");
          await waitFor(() => expect(screen.getByTestId("target")).toHaveValue("forced"));
        });
      });
  - CASE F7 (group-level set condition — covers L267): wrap a Field in a
      FieldGroup whose conditions carry a set; assert the child value updates.
      (Mirror FieldGroup.test.tsx patterns.)
  - CASE F8 (FieldGroup disabled — covers L308): wrap a Field in a disabled
      FieldGroup; assert the Field input is disabled.
      it("disables a field inside a disabled FieldGroup", () => { ... });
  - CASE F9 (disabled ?? false / visible ?? true — covers L307/L322): add a
      condition that matches WITHOUT a disabled/visible action and assert the
      field stays enabled/visible (the ?? default arm). If the engine does not
      set hasDisabled/hasVisible flags without an action, confirm via coverage
      and SKIP with a comment — do not force an artificial case.
  - CASE F10 (type-level validator failure — covers L378):
      it("runs the type-level (inputConfig) validator", async () => {
        const inputs = { ...testInputs, requiredText: { component: TestInput, defaultValue: "", validator: (v: unknown) => v === "" ? "required" : true } };
        render(<FormalityProvider inputs={inputs}><Form config={{ name: { type: "requiredText" } }}><Field name="name" /></Form></FormalityProvider>);
        await userEvent.click(document.body); // blur
        await waitFor(() => expect(screen.queryByTestId("name-error")).toBeInTheDocument());
      });
  - CASE F11 (template rendering + render-prop children — covers L482 both arms):
      describe("template rendering and render props", () => {
        const Wrapper = ({ Field: F, fieldProps }: any) => (
          <div data-testid="tpl-wrap"><F {...fieldProps} /></div>
        );
        it("renders through an input template", () => {
          render(<FormalityProvider inputs={testInputs} inputTemplates={{ textField: Wrapper }}><Form config={{ name: { type: "textField" } }}><Field name="name" /></Form></FormalityProvider>);
          expect(screen.getByTestId("tpl-wrap")).toBeInTheDocument();
        });
        it("supports a render-prop child", () => {
          render(<FormalityProvider inputs={testInputs}><Form config={{ name: { type: "textField" } }}><Field name="name">{() => <div data-testid="rp">render-prop</div>}</Field></Form></FormalityProvider>);
          expect(screen.getByTestId("rp")).toBeInTheDocument();
        });
      });

Task 6: VERIFY (no code change) — re-run coverage and confirm per-file minimums
  - RUN: pnpm test:coverage
  - ASSERT each target file meets Success Definition #2; iterate on any region
    that did not climb (re-read research/coverage-map.md for that region's exact
    line and adjust the test).
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: pure-function assertion (core tests)
expect(evaluate("1 != 2", {})).toBe(true);
expect(parse("value", "boom", { boom: () => { throw new Error("x"); } })).toBe("value");
expect(createConfigContext(provider, form).defaultFieldProps).toEqual({ size: "small", margin: "dense" });

// PATTERN: assert + silence a dev console.warn (then RESTORE)
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
expect(evaluate("1e308 + 1e308", {})).toBeUndefined();
warnSpy.mockRestore(); // ALWAYS restore to avoid leaking across tests

// PATTERN: reaching type-forbidden defensive branches via cast
parse("value", 42 as any);   // final `return value` arm
format("value", 42 as any);  // format final `return value` arm

// PATTERN: React Field test (reuse existing harness)
render(
  <FormalityProvider inputs={testInputs} inputTemplates={{ textField: Wrapper }}>
    <Form config={{ name: { type: "textField" } }}>
      <Field name="name" />
    </Form>
  </FormalityProvider>,
);
expect(screen.getByTestId("tpl-wrap")).toBeInTheDocument();

// PATTERN: type-level validator (F10) — define the validator on the INPUT TYPE,
// not on the field config:
const inputs = { ...testInputs, requiredText: {
  component: TestInput, defaultValue: "",
  validator: (v: unknown) => (v === "" ? "required" : true),
} };
```

### Integration Points

```yaml
VITEST CONFIG:
  - file: packages/core/vitest.config.ts + packages/react/vitest.config.ts
  - note: |
      Both already correct. core = node env, globals:true, include "src/**/*.test.ts".
      react = jsdom + setup.ts. The extended test files match their globs and
      need NO config change.

COVERAGE CONFIG:
  - file: vitest.config.ts (repo root)
  - note: |
      Has coverage.exclude (correct, PRD §1.3.7) but NO coverage.thresholds
      block. DO NOT add thresholds — that is P1.M2.T1.S5's job. Test-only.

PARALLEL-EXECUTION CONTRACT:
  - S3 (validation.test.ts) runs in CORE in parallel; S4 touches
    expression/transform/config tests + Field.test.tsx. NO file overlap.
    Do NOT modify validation.test.ts. Treat validate.ts/messages.ts as already
    ≥95% when reading the post-S3 coverage table.
  - S1 (useFormState.test.tsx) and S2 (Form.coverage.test.tsx) are already
    applied in the working tree. No conflict.

TYPE-SAFETY CONTRACT (do not weaken):
  - Do NOT change any type to make the `parse("x", 42)` / `format("x", 42)`
    defensive-tail tests type-check without a cast. The `as any` cast is the
    intended way to exercise a runtime branch the types forbid.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing each file — fix before proceeding
pnpm typecheck                                   # tsc --build across the repo
pnpm lint packages/core/src/__tests__/expression.test.ts \
            packages/core/src/__tests__/transform.test.ts \
            packages/core/src/__tests__/config.test.ts \
            packages/react/src/__tests__/Field.test.tsx
pnpm --filter @formality-ui/core exec prettier --check src/__tests__/{expression,transform,config}.test.ts
pnpm --filter @formality-ui/react exec prettier --check src/__tests__/Field.test.tsx
# Expected: zero errors. Watch for: unused `vi` import if you ended up not spying;
# `any` flagged by eslint (the existing files already use casts, so it is
# permissive — but verify); unused locals in Field.test.tsx helper components.
```

### Level 2: Unit Tests (the suites themselves)

```bash
# Each extended file in isolation (fast)
pnpm vitest run packages/core/src/__tests__/expression.test.ts
pnpm vitest run packages/core/src/__tests__/transform.test.ts
pnpm vitest run packages/core/src/__tests__/config.test.ts
pnpm vitest run packages/react/src/__tests__/Field.test.tsx

# Full repo run to confirm no regressions
pnpm test            # = vitest run across all projects
# Expected: ALL green (existing 883 + new cases). If a new case fails, the SUT
# behavior differs from this PRP's prediction — READ the failure and adjust the
# EXPECTED value (the source is the source of truth). In particular:
#   - evaluate("1, 2, 3") — if jsep returns a Compound, result is 3; if not,
#     adjust to a Compound-producing expression you verify with jsep directly.
#   - infer.ts escape case — confirm the runtime string actually contains a
#     backslash (adjust escaping in the source literal).
#   - Field F9 (?? defaults) — if the arm is unreachable without an action,
#     skip it rather than forcing an artificial case.
```

### Level 3: Coverage Validation (the actual deliverable gate)

```bash
# Full coverage run (emits the per-file table regardless of any unrelated skip)
pnpm test:coverage

# Confirm the five SUT files meet Success Definition #2 (v8 table):
#   Field.tsx     stmt >= 90%  branch >= 90%  func = 100%
#   evaluate.ts   stmt >= 95%  branch >= 98%  func = 100%
#   infer.ts      stmt >= 90%  branch >= 90%  func = 100%
#   pipeline.ts   stmt >= 95%  branch >= 96%  func = 100%
#   merge.ts      stmt >= 95%  branch = 100%  func = 100%
# And repo-wide All-files row: stmt/branch/func/line >= ~92%.

# Precise remaining-uncovered-branch check (sanity):
node -e '
  const c = require("./coverage/coverage-final.json");
  const targets = [
    "react/src/components/Field.tsx",
    "core/src/expression/evaluate.ts",
    "core/src/expression/infer.ts",
    "core/src/transform/pipeline.ts",
    "core/src/config/merge.ts",
  ];
  for (const base of targets) {
    const k = Object.keys(c).find((x) => x.endsWith(base));
    if (!k) { console.log(base, "NOT FOUND"); continue; }
    const f = c[k];
    const unc = [];
    for (const [id, b] of Object.entries(f.branchMap)) {
      const hits = f.b[id];
      b.locations.forEach((loc, idx) => { if (hits[idx] === 0) unc.push(loc.start.line); });
    }
    const uncFns = [];
    for (const [id, fn] of Object.entries(f.fnMap)) { if (f.f[id] === 0) uncFns.push(fn.name+"@L"+fn.decl.start.line); }
    console.log(base, "| unc branches:", unc.length? [...new Set(unc)].sort((a,b)=>a-b).join(",") : "(none)",
                "| unc funcs:", uncFns.length? uncFns.join(";") : "(none)");
  }
'
# Expected: merge.ts unc funcs "(none)"; Field/infer/pipeline/evaluate unc branches
# reduced to the documented DEFENSIVE arms only (evaluate E5–E8 are acceptable
# residue). If a NON-defensive branch remains, add/fix the corresponding test.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Verify each PRD behavioral contract is now pinned by at least one S4 case:
#   §4.2.1 operators: !=  (E3), + overflow (E2), + nullish concat (E1), Compound (E4)
#   §4.3.3 inference: string-literal skip (I1), escape (I3), single-quote (I2)
#   §5.3.5/§10 transform: named parser/formatter throw (T1/T4), not-found (T3),
#                          default-config nullish/non-number (T6/T7/T8)
#   §6.1 config merge: createConfigContext full shape (C1), new-key merge (C2)
#   §5.3.2/§5.3.7/§5.3.8 Field: config-less + type defaults (F1/F2), form inputs
#       fn-form + new type (F3/F4), unknown-type fallback (F5), set conditions
#       (F6/F7), group disabled (F8), type-level validator (F10), template +
#       render-prop (F11).
# (No extra command — satisfied by the cases in Tasks 1–5. Ensure describe/it
#  names make the PRD-section mapping obvious.)
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: `pnpm typecheck` clean; `pnpm lint` on the four test files clean.
- [ ] Level 2 passed: `pnpm test` green (zero new failures; existing 883 pass).
- [ ] Level 3 passed: all five SUT files meet Success Definition #2; repo-wide ≥ ~92%.
- [ ] No new lint warnings (no unused `vi` imports; `any` casts intentional).

### Feature Validation

- [ ] Task 1: evaluate.ts E1–E4 covered (L147, L229, L251, L336).
- [ ] Task 2: infer.ts I1–I4 covered (L82, L68/L74, L58/L63, L158).
- [ ] Task 3: pipeline.ts T1–T8 covered (L77, L95, L132, L142, L160, L295, L313, L318).
- [ ] Task 4: merge.ts C1 (createConfigContext L227–258) + C2 (L91) covered.
- [ ] Task 5: Field.tsx F1–F11 covered (L173/176, L181/189, L198, L264/267, L280/282, L307/308, L322, L378, L482).
- [ ] No source files under `packages/*/src/**` modified (test-only deliverable).
- [ ] validation.test.ts NOT modified (S3's exclusive deliverable).

### Code Quality Validation

- [ ] New cases added INSIDE the existing `describe` blocks (mirrors file structure).
- [ ] NO existing test removed or rewritten (diff is purely additive).
- [ ] `it(...)` names are self-documenting and map 1:1 to a coverage region.
- [ ] File placement: the four named test files (modified, not new).
- [ ] Anti-patterns avoided: no `.only`/`.skip`; `console.warn` spied AND restored;
      no fake timers where not needed; no coverage.thresholds added.

### Documentation & Deployment

- [ ] No docs needed (item OUTPUT §5: test-only, no API/config/surface change).
- [ ] Did NOT add `coverage.thresholds` to root vitest.config.ts (S5's job).

---

## Anti-Patterns to Avoid

- ❌ Don't create NEW test files. Item INPUT §2 explicitly says to EXTEND the
  four named suites. New files would fragment coverage and risk import drift.
- ❌ Don't delete or rewrite existing passing tests. The diff must be purely
  additive.
- ❌ Don't chase the four evaluate.ts DEFENSIVE branches (E5–E8: arithmetic/unary/
  node-type default throws + the LogicalExpression case). They are unreachable
  for real expression strings and do not affect the targets. They are documented
  in research/coverage-map.md as SKIP.
- ❌ Don't confuse field-level (`fieldConfig.validator`) with type-level
  (`inputConfig.validator`) validation in Field.tsx. L378 needs the TYPE-LEVEL
  validator; the existing suite already covers field-level.
- ❌ Don't weaken types to make `parse("x", 42)` / `format("x", 42)` type-check
  without a cast. Use `as any`; the runtime branch exists for defensive handling.
- ❌ Don't forget to `warnSpy.mockRestore()` after spying `console.warn`.
- ❌ Don't add `coverage.thresholds` to vitest.config.ts — that is S5's deliverable.
- ❌ Don't modify `validation.test.ts` — that is S3's exclusive deliverable
  (parallel execution).
- ❌ Don't rely on the inline-parser/formatter throw tests to cover the
  NAMED-parser/formatter throw paths — they are different try/catch blocks
  (T1/T4). Pass a named registry with a throwing function.
- ❌ Don't pass a non-null value when targeting the default `string`
  parser/formatter `?? ""` arms (T6/T8) — those arms only fire for
  null/undefined. The existing tests pass a number.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- Four of the five SUTs are **pure functions** with no state/timers/DOM — the
  lowest-risk coverage category. Every new core case is a direct return-value
  assertion.
- Every uncovered branch is mapped **line-number-exactly** to a concrete test
  case in `research/coverage-map.md`, including exact inputs (e.g.
  `evaluate("1e308 + 1e308")`, `parse("v","boom",{boom:()=>{throw}})`,
  `createDefaultParsers().string(null)`) and exact expected returns.
- The baseline was captured by an ACTUAL `pnpm test:coverage` run (not guessed):
  91.80% stmt / 89.94% branch repo-wide, with the five files' exact uncovered
  branch lines parsed from `coverage-final.json`.
- Field.tsx is the only React component; it reuses the existing RTL harness and
  `TestInput`/`TestSwitch`/`testInputs`, and every gap (F1–F11) has a concrete
  render snippet.
- The -1 is for three minor unknowns: (1) jsep's exact output for `1, 2, 3`
  (should be a Compound node → 3, but verify at Level 2 and adjust if jsep
  tokenizes differently); (2) the infer.ts escape-sequence test's TS-source
  escaping must produce a runtime backslash — verify the asserted output array;
  (3) Field F9 (`disabled ?? false` / `visible ?? true`) may be unreachable
  without an action and is explicitly skippable. None of these risk the gate.
