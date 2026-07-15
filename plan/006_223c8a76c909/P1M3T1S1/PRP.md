# PRP — P1.M3.T1.S1: Wire effective parser/formatter via `resolveFieldOverType` in `useField`

**Parent plan**: `plan/006_223c8a76c909` — §6.4 Field-Level Overrides.
**Status**: React adapter runtime — parser/formatter resolution. The third of
the six §6.4 levers to be wired at the adapter level, following the core
helper (P1.M1.T1.S2 — COMPLETE) and the type surface (P1.M1.T1.S1 —
COMPLETE). A surgical change to `packages/react/src/hooks/useField.tsx`:
resolve the **effective** parser/formatter once (via `resolveFieldOverType`)
and thread it into the two existing `parse`/`format` call sites — the
`handleChange` (parse) `useCallback` and the `<Controller>` render callback
(format). Named registries (`providerConfig.parsers`/`.formatters`) stay
global and unchanged. A two-line **Mode A** JSDoc update on
`InputConfig.parser`/`.formatter` in `packages/core/src/types/config.ts`
rides with the work.

---

## Goal

**Feature Goal**: Make `useField` apply `fieldConfig.parser` /
`fieldConfig.formatter` when set (honored for any value `!== undefined`),
falling back to `inputConfig.parser` / `inputConfig.formatter` otherwise —
the §6.4.3 / §6.4.0 precedence rule, implemented via the single shared
`resolveFieldOverType` helper so the `!== undefined` semantics live in one
place. Both transform sites (change-handler parse + Controller-render format)
consume the effective spec; the global named registries are untouched.

**Deliverable**:
1. A modified `packages/react/src/hooks/useField.tsx`:
   - `resolveFieldOverType` imported from `@formality-ui/core`.
   - Two new `useMemo`s — `effectiveParser` and `effectiveFormatter` — each
     calling `resolveFieldOverType(fieldConfig.<lever>, inputConfig.<lever>)`.
   - `handleChange` calls `parse(newValue, effectiveParser, providerConfig.parsers)`.
   - `<Controller>` render callback calls
     `format(field.value, effectiveFormatter, providerConfig.formatters)`.
   - `handleChange`'s `useCallback` dependency array uses `effectiveParser`
     (replacing `inputConfig.parser`).
2. Updated JSDoc on `InputConfig.parser` and `InputConfig.formatter` in
   `packages/core/src/types/config.ts` documenting the three-tier precedence
   (field → type → none; field wins when `!== undefined`; §6.4.3).
3. New tests proving field-level parser/formatter win over type-level, that
   the type-level spec still applies when the field-level one is `undefined`
   (regression), and that named (string) specs still resolve against the
   provider registry (global registry unchanged).

**Success Definition**:
1. A field with `parser: <fn>` in its `FieldConfig` parses input with that
   function, even when the input TYPE also defines a `parser` (field wins).
2. A field with `formatter: <fn>` in its `FieldConfig` formats the displayed
   value with that function, even when the input TYPE also defines a
   `formatter` (field wins).
3. When `fieldConfig.parser`/`.formatter` is `undefined`, the type-level
   `inputConfig.parser`/`.formatter` applies (existing behavior — no
   regression; all current Field.test.tsx "value transformation" tests stay
   green).
4. Named (string) parser/formatter specs still resolve against
   `providerConfig.parsers`/`.formatters` unchanged (registries global).
5. `resolveFieldOverType` is CALLED (not an inline `??` or truthiness check) —
   single-rule integrity (§6.4.0).
6. `pnpm test` passes (baseline + new tests green, 90/90/90/90 coverage gate);
   `pnpm typecheck`, `pnpm lint`, `pnpm format:check` clean.

---

## Why

PRD §6.4.3 requires per-instance `parser` / `formatter` overrides. Without
adapter wiring, a field that needs a DIFFERENT transform from its type siblings
(e.g. one `textField` that uppercases-on-parse; one `decimal` field that needs
3-decimal display while its siblings use 2) has no per-instance lever — it can
only re-specify the transform at the *type* level, which changes every field of
that type. S1 added the fields to the `FieldConfig` type surface; S2 added the
shared precedence helper. **This task is the runtime wiring that makes the
field-level parser/formatter actually take effect in the React adapter.**

- **Business value / user impact**: a single field can override its parse
  (input→form) or format (form→display) transform without affecting sibling
  fields of the same type. This is the core, user-visible payoff of §6.4.3.
- **Integration with existing features**: the parse pipeline (§5.3.5 / §10.1)
  and format pipeline (§5.3.5 / §10.2) are unchanged in shape — only the
  *which spec is applied* step changes, routed through `resolveFieldOverType`.
  Named registries (`providerConfig.parsers`/`.formatters`) remain global, so
  string specs continue to resolve identically.
- **Single-rule integrity**: routing both sites through `resolveFieldOverType`
  means the `!== undefined` precedence rule lives in exactly one place — the
  same helper the core `resolveInitialValue` path (P1.M2.T1.S1) and the
  upcoming P1.M3.T2/T3 sites will call. No bespoke inline check.
- **Scope boundary**: this task edits ONLY the two transform sites in
  `useField.tsx`, the import, the JSDoc on `InputConfig.parser`/`.formatter`,
  and adds tests. It does NOT touch `resolveFieldOverType` (done),
  `FieldConfig` (done), `changeField`/debounce (P1.M3.T2),
  `transformValuesForSubmit` (P1.M3.T3), or any barrel export (done in S3).

---

## What

Add `resolveFieldOverType` to the `@formality-ui/core` import in
`useField.tsx`. Compute two memoized effective specs — `effectiveParser` and
`effectiveFormatter` — each `resolveFieldOverType(fieldConfig.<lever>,
inputConfig.<lever>)`. Replace `inputConfig.parser` → `effectiveParser` in the
`parse(...)` call inside `handleChange` (and in its `useCallback` dep array).
Replace `inputConfig.formatter` → `effectiveFormatter` in the `format(...)`
call inside the `<Controller>` render callback. The two new `useMemo`s are
placed immediately above the `// === CHANGE HANDLER ===` section (both
`fieldConfig` and `inputConfig` are in scope there, and it keeps the effective
parse spec adjacent to its consumer).

Update the JSDoc on `InputConfig.parser` and `InputConfig.formatter` in
`packages/core/src/types/config.ts` to document the three-tier precedence
(field → type → none) and that the field-level value wins when `!== undefined`
(Mode A — docs ride with the work).

### Success Criteria

- [ ] `resolveFieldOverType` is imported from `@formality-ui/core` in useField.tsx.
- [ ] `effectiveParser` and `effectiveFormatter` are each computed via
      `resolveFieldOverType(...)` inside a `useMemo` with deps
      `[fieldConfig.<lever>, inputConfig.<lever>]`.
- [ ] `handleChange` calls `parse(newValue, effectiveParser, providerConfig.parsers)`.
- [ ] `handleChange`'s `useCallback` dep array references `effectiveParser`
      (not `inputConfig.parser`).
- [ ] The `<Controller>` render callback calls
      `format(field.value, effectiveFormatter, providerConfig.formatters)`.
- [ ] Named registries (`providerConfig.parsers`/`.formatters`) are UNCHANGED.
- [ ] No `??` / truthiness check is reintroduced (helper is CALLED).
- [ ] JSDoc on `InputConfig.parser` + `.formatter` mentions field → type → none
      precedence and the `!== undefined` field-wins rule (§6.4.3).
- [ ] New tests: field-parser-wins, field-formatter-wins,
      type-fallback-when-field-undefined (regression), named-spec-resolves.
- [ ] All existing tests pass (`pnpm test`); `pnpm typecheck`/`pnpm lint`/
      `pnpm format:check` clean; 90/90/90/90 coverage gate green.

---

## All Needed Context

### Context Completeness Check

> _"If someone knew nothing about this codebase, would they have everything
> needed to implement this successfully?"_ — **YES.** This PRP names the exact
> file, quotes the exact current text of BOTH transform sites (so the
> implementer can locate and match them for the edits), supplies the exact
> replacement code verbatim, specifies the exact useMemo placement (above
> `// === CHANGE HANDLER ===`), quotes the exact import block to extend,
> quotes the exact current JSDoc lines on `InputConfig.parser`/`.formatter`
> and gives the replacement JSDoc, names the exact test file + describe block +
> the existing tests to mirror, and verifies both input dependencies (S1 type
> surface + S2 helper, exported from the core barrel) are present in code. The
> change is mechanical and localized.

### Documentation & References

```yaml
# PRD — authoritative source for the precedence rule and transform semantics.
- docfile: PRD.md
  section: §6.4.3 parser / formatter (FieldConfig field-level overrides)
  why: "Defines `fieldConfig.parser ?? inputConfig.parser` and `fieldConfig.formatter ?? inputConfig.formatter`; string = named (registry global), function = inline."
  critical: "Resolution is field-over-type OVERRIDE (not compose). Registries stay global. The inline signature is (unknown) => unknown."
- docfile: PRD.md
  section: §6.4.0 (The precedence rule — single rule for all six) + §6.4.5 (Edge cases)
  why: "resolveFieldOverType encodes the `!== undefined` rule; §6.4.5 enumerates falsy-but-meaningful cases."
  critical: "Do NOT reimplement with `??` or truthiness — CALL resolveFieldOverType. `??` drops null/false/0/\"\"."
- docfile: PRD.md
  section: §5.3.5 Value Transformation (effective spec note) + §5.3.6 Change Handler
  why: "States the applied parser/formatter is the EFFECTIVE one (fieldConfig ?? inputConfig); parse happens before RHF setValue, format happens on every render."
  critical: "Parse site = handleChange; format site = Controller render callback. Both must consume the effective spec."
- docfile: PRD.md
  section: §10.1 Parse Pipeline + §10.2 Format Pipeline + §10.7 Parser/Formatter Contract
  why: "Confirms parse(format(x))≈x contract; named vs inline resolution; registries are the provider's parsers/formatters maps."

# The primary file being edited (React adapter).
- file: packages/react/src/hooks/useField.tsx
  why: "Home of handleChange (parse site, L562-566 + dep array L576) and the <Controller> render callback (format site, L617). Both consume inputConfig.parser/.formatter today."
  pattern: "useMemo + useCallback hooks resolve config once and thread results into closures. fieldConfig (config[name] ?? {}) at L~388; inputConfig useMemo ends ~L420."
  gotcha: "The Controller render callback is INLINE JSX (not a useCallback/useMemo) — there is no separate dep array to update for effectiveFormatter; the useMemo itself (deps [fieldConfig.formatter, inputConfig.formatter]) is the memo, and the inline callback just closes over it."

# The Mode-A JSDoc edit target (core types).
- file: packages/core/src/types/config.ts
  why: "InputConfig.parser (one-line JSDoc) + InputConfig.formatter (one-line JSDoc). Update to document the field→type→none precedence."
  pattern: "One-line `/** … */` JSDoc today; expand to a multi-line block. Do NOT change the field TYPE (`string | ((value: unknown) => TValue)` etc.) — only the JSDoc prose."
  gotcha: "parser is generic `(value: unknown) => TValue`; formatter is `(value: TValue) => unknown`. Keep the type annotations EXACTLY as-is."

# Input dependency #1 — the helper (COMPLETE, exported).
- file: packages/core/src/config/defaults.ts
  section: resolveFieldOverType (top of file)
  why: "Defines the helper's exact signature/behavior: `resolveFieldOverType<T>(fieldVal, typeVal) => fieldVal !== undefined ? fieldVal : typeVal`."
  critical: "Already exported from @formality-ui/core (index.ts:127, config/index.ts:15). Import by name in the React package — NO new barrel work."

# Input dependency #2 — the type surface (COMPLETE).
- file: packages/core/src/types/config.ts
  section: FieldConfig.parser / FieldConfig.formatter
  why: "Proves fieldConfig.parser / fieldConfig.formatter are valid type-level accesses (S1). Inline JSDoc already ref §6.4.3."

# Test harness to reuse.
- file: packages/react/src/__tests__/Field.test.tsx
  section: describe("value transformation") at L~319 (existing tests at L321 parser, L353 formatter)
  why: "Proven harness for parse/format end-to-end: TestInput + userEvent.setup().type(...) + Form render-prop {({ methods }) => ...} reading methods.watch(name). Mirror EXACTLY for the field-level-override variants (move the parser/formatter from inputs[type] to config[name])."
  pattern: "Inline fn parser: `parser: parseToUpperCase`; assert committed value via a `<span data-testid=\"value\">{methods.watch(\"name\")}</span>` sibling + waitFor + toHaveTextContent. Inline fn formatter: `formatter: formatToLower`; assert display via `screen.getByTestId(\"name\")` + toHaveValue."
  gotcha: "<Field> is a thin wrapper over useField — exercising it covers the exact useField code paths being modified (satisfies the 90% coverage gate for the new branches)."

# Direct-hook test file (contract-named; optional add).
- file: packages/react/src/__tests__/useField.test.tsx
  why: "The existing useField test suite (UseFieldReturn contract + watcher ownership via renderHook). Currently has NO parse/format tests. The new field-level-override tests fit equally well here OR in Field.test.tsx; this PRP puts them in Field.test.tsx (existing harness) and notes useField.test.tsx as an acceptable alternative."

# Parallel task — NO file overlap (safe).
- docfile: plan/006_223c8a76c909/P1M2T1S1/PRP.md
  why: "Touches ONLY packages/core/src/config/defaults.ts + packages/core/src/__tests__/config.test.ts. This task's only core edit is a 2-line JSDoc on packages/core/src/types/config.ts — disjoint."

# Validation tooling (root package.json).
- file: package.json
  section: scripts (test, typecheck, lint, format, format:check)
  why: "Exact commands for the validation loop."
- file: vitest.config.ts
  section: coverage thresholds (90/90/90/90)
  why: "Coverage gate enforced under `pnpm test` — new useField branches must stay covered (the Field.test.tsx value-transformation tests cover them)."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/hooks/useField.tsx          # ← EDIT (import + 2 useMemo + 2 call sites + 1 dep array)
packages/react/src/__tests__/Field.test.tsx     # ← EDIT (add field-level override tests to "value transformation")
packages/core/src/types/config.ts              # ← EDIT (JSDoc on InputConfig.parser + .formatter only)
packages/core/src/config/defaults.ts           # resolveFieldOverType — READ ONLY (S2 complete)
packages/core/src/index.ts                     # barrel — READ ONLY (resolveFieldOverType already exported, S3)
packages/react/src/components/Form.tsx         # changeField — READ ONLY (debounce = P1.M3.T2 scope)
vitest.config.ts                               # coverage gate 90/90/90/90
package.json                                   # scripts: pnpm test/typecheck/lint/format:check
```

### Desired Codebase tree with files to be changed

```bash
packages/react/src/hooks/useField.tsx          # MODIFY — import resolveFieldOverType; add effectiveParser/
                                                #          effectiveFormatter useMemo; rewire parse + format call
                                                #          sites; update handleChange dep array.
packages/react/src/__tests__/Field.test.tsx     # MODIFY — add ~4 tests to "value transformation" describe.
packages/core/src/types/config.ts              # MODIFY — expand JSDoc on InputConfig.parser + .formatter (2 blocks).
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: import resolveFieldOverType from "@formality-ui/core" (it is
// exported — index.ts:127). Do NOT add any barrel export; S3 already did it.

// CRITICAL: do NOT reimplement the check inline. The whole point of §6.4.0 is
// that the `!== undefined` precedence rule lives in ONE place
// (resolveFieldOverType). Writing `fieldConfig.parser ?? inputConfig.parser`
// would ALMOST work but drops `null`/`false`/0/"" (the §6.4.5 contract) AND
// violates single-rule integrity. CALL the helper:
//   resolveFieldOverType(fieldConfig.parser, inputConfig.parser)

// CRITICAL: named registries are GLOBAL and UNCHANGED. The `parse`/`format`
// third arg stays providerConfig.parsers / providerConfig.formatters. Only the
// 2nd arg (the spec) becomes the EFFECTIVE spec. A string effective spec still
// resolves against the same provider registry.

// GOTCHA: the <Controller> render callback is INLINE JSX, not a memoized fn.
// There is no dep array to update for effectiveFormatter at the format call —
// the `effectiveFormatter` useMemo (deps [fieldConfig.formatter,
// inputConfig.formatter]) is the memo; the inline callback closes over its
// value on each render. (Contract step (e) "add to the respective useMemo dep
// arrays" is satisfied BY the effectiveFormatter useMemo itself.)

// GOTCHA: handleChange's useCallback dep array currently lists BOTH
// `inputConfig.parser` AND `inputConfig` (whole). Replace `inputConfig.parser`
// → `effectiveParser`. KEEP `inputConfig` (whole) in the deps — it is still
// passed to changeField(name, parsedValue, inputConfig). (Debounce wiring in
// changeField is P1.M3.T2's job; leave that call untouched.)

// GOTCHA: placement of the two new useMemos — put them immediately ABOVE the
// `// === CHANGE HANDLER ===` section (after the validationRules useMemo ends).
// Both `fieldConfig` (L~388) and `inputConfig` (useMemo ending ~L420) are in
// scope. They are plain top-level hooks (not conditional) — hooks-rules safe.

// GOTCHA (prettier): useField.tsx is prettier-managed. Run `pnpm format` after
// the edits and re-run `pnpm format:check` if it complains (wrapping nit).

// GOTCHA (coverage): the new `resolveFieldOverType` branches (field-set vs
// field-unset) must be covered. The Field.test.tsx field-level-wins +
// type-fallback tests cover both branches through <Field>→useField.

// SCOPE — do NOT touch:
#   • resolveFieldOverType / FieldConfig / barrel exports (all COMPLETE).
#   • changeField debounce resolution (P1.M3.T2.S1).
#   • transformValuesForSubmit getSubmitField/valueField (P1.M3.T3.S1).
#   • resolveInitialValue field-level default (P1.M2.T1.S1 — parallel; no
#     file overlap with useField.tsx / Field.test.tsx).
#   • The InputConfig.parser/.formatter TYPE annotations (only the JSDoc changes).
```

---

## Implementation Blueprint

### Data models and structure

No new data models. This task threads an already-defined effective spec into
two existing call sites. The exact additions:

**New `useMemo`s (place immediately above `// === CHANGE HANDLER ===`):**
```typescript
  // === FIELD-LEVEL PARSER/FORMATTER OVERRIDES (§6.4.3, §6.4.0) ===
  //
  // Effective parser/formatter = field-level spec ?? type-level spec, resolved
  // through the single shared `resolveFieldOverType` helper (`!== undefined`,
  // NOT `??` — so null/false/0/"" are meaningful overrides; §6.4.5). Named
  // registries (providerConfig.parsers/.formatters) stay global and are passed
  // unchanged to `parse`/`format`.
  const effectiveParser = useMemo(
    () => resolveFieldOverType(fieldConfig.parser, inputConfig.parser),
    [fieldConfig.parser, inputConfig.parser],
  );
  const effectiveFormatter = useMemo(
    () => resolveFieldOverType(fieldConfig.formatter, inputConfig.formatter),
    [fieldConfig.formatter, inputConfig.formatter],
  );
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 0 (PRECHECK): confirm both input dependencies are present
  - RUN: rg -n 'export function resolveFieldOverType' packages/core/src/config/defaults.ts
    EXPECT: one match (S2 helper exists).
  - RUN: rg -n 'resolveFieldOverType' packages/core/src/index.ts
    EXPECT: one match (S3 exported it from the barrel — importable by name).
  - RUN: rg -n 'parser\?:.*\(value: unknown\) => unknown' packages/core/src/types/config.ts
    EXPECT: two matches (FieldConfig.parser + .formatter, S1).
  - IF ANY MISSING: STOP. This task depends on S1+S2+S3; sequence after them.
    (All three are verified present — see research/transform-sites-and-dependencies.md.)

Task 1: MODIFY packages/react/src/hooks/useField.tsx — add the import
  - FIND the existing @formality-ui/core import block (top of file):
        import {
          resolveInputConfig,
          mergeFieldProps,
          resolveLabel,
          parse,
          format,
          runValidator,
          resolveErrorMessage,
        } from "@formality-ui/core";
  - ADD `resolveFieldOverType,` to the named imports (e.g. after
    `resolveErrorMessage,` — placement is cosmetic; prettier will normalize).
  - RESULT:
        import {
          resolveInputConfig,
          mergeFieldProps,
          resolveLabel,
          parse,
          format,
          runValidator,
          resolveErrorMessage,
          resolveFieldOverType,
        } from "@formality-ui/core";

Task 2: MODIFY packages/react/src/hooks/useField.tsx — add the two effective-spec useMemos
  - LOCATE the line `  // === CHANGE HANDLER ===` (immediately after the
    validationRules useMemo's closing `]);`).
  - INSERT the new section ABOVE it (verbatim from "Data models" above):
        // === FIELD-LEVEL PARSER/FORMATTER OVERRIDES (§6.4.3, §6.4.0) ===
        // ... (comment block) ...
        const effectiveParser = useMemo(
          () => resolveFieldOverType(fieldConfig.parser, inputConfig.parser),
          [fieldConfig.parser, inputConfig.parser],
        );
        const effectiveFormatter = useMemo(
          () => resolveFieldOverType(fieldConfig.formatter, inputConfig.formatter),
          [fieldConfig.formatter, inputConfig.formatter],
        );

  - BLANK LINE, then the existing `  // === CHANGE HANDLER ===` follows.
  - VERIFY `fieldConfig` and `inputConfig` are in scope at this point (they
    are — fieldConfig at L~388, inputConfig useMemo ends ~L420).

Task 3: MODIFY packages/react/src/hooks/useField.tsx — rewire the parse call site
  - FIND (inside handleChange useCallback):
        const parsedValue = parse(
          newValue,
          inputConfig.parser,
          providerConfig.parsers,
        );
  - REPLACE `inputConfig.parser,` → `effectiveParser,`:
        const parsedValue = parse(
          newValue,
          effectiveParser,
          providerConfig.parsers,
        );

Task 4: MODIFY packages/react/src/hooks/useField.tsx — update handleChange dep array
  - FIND the handleChange useCallback dependency array:
        [
          inputConfig.parser,
          providerConfig.parsers,
          changeField,
          name,
          inputConfig,
        ],
  - REPLACE the `inputConfig.parser,` entry → `effectiveParser,`:
        [
          effectiveParser,
          providerConfig.parsers,
          changeField,
          name,
          inputConfig,
        ],
  - KEEP `inputConfig,` (whole) — it is passed to changeField(name,
    parsedValue, inputConfig). (Debounce resolution inside changeField is
    P1.M3.T2's scope; leave that call untouched.)

Task 5: MODIFY packages/react/src/hooks/useField.tsx — rewire the format call site
  - FIND (inside the <Controller render={({ field, fieldState, formState }) => ...}>):
        // Format value for display
        const formattedValue = format(
          field.value,
          inputConfig.formatter,
          providerConfig.formatters,
        );
  - REPLACE `inputConfig.formatter,` → `effectiveFormatter,`:
        // Format value for display
        const formattedValue = format(
          field.value,
          effectiveFormatter,
          providerConfig.formatters,
        );
  - NOTE: no dep array change needed here (the render callback is inline JSX;
    effectiveFormatter is already memoized with the correct deps).

Task 6: MODIFY packages/core/src/types/config.ts — expand InputConfig.parser/.formatter JSDoc
  - FIND (InputConfig interface):
        /** Transform user input to form value. String = named parser, function = inline */
        parser?: string | ((value: unknown) => TValue);

        /** Transform form value to display value. String = named formatter, function = inline */
        formatter?: string | ((value: TValue) => unknown);
  - REPLACE the parser JSDoc with:
        /**
         * Transform user input to form value. String = named parser, function = inline.
         *
         * Three-tier precedence (§6.4.3): field → type → none. Per-field override
         * via `FieldConfig.parser`; the field-level value wins when `!== undefined`
         * (resolved via `resolveFieldOverType`, §6.4.0 — so null/false/0/"" are
         * meaningful overrides). Named (string) specs resolve against the
         * provider's global `parsers` registry.
         */
        parser?: string | ((value: unknown) => TValue);
  - REPLACE the formatter JSDoc with:
        /**
         * Transform form value to display value. String = named formatter, function = inline.
         *
         * Three-tier precedence (§6.4.3): field → type → none. Per-field override
         * via `FieldConfig.formatter`; the field-level value wins when `!== undefined`
         * (resolved via `resolveFieldOverType`, §6.4.0 — so null/false/0/"" are
         * meaningful overrides). Named (string) specs resolve against the
         * provider's global `formatters` registry.
         */
        formatter?: string | ((value: TValue) => unknown);
  - DO NOT change the field TYPE annotations — only the JSDoc prose.

Task 7: MODIFY packages/react/src/__tests__/Field.test.tsx — add field-level override tests
  - LOCATE: `describe("value transformation", () => { … })` (~L319). It has
    two `it(...)` cases: "should apply parser on change" (L321) and
    "should apply formatter for display" (L353). The block ends ~L390
    (`});` before the next `describe("validation", ...)`).
  - ADD these `it(...)` cases INSIDE the value-transformation describe, AFTER
    the existing two (before the closing `});`). Mirror the existing harness
    EXACTLY: `TestInput`, `userEvent.setup()`, Form render-prop
    `{({ methods }) => …}`, `screen.getByTestId`, `waitFor`.
  - CASES (verbatim — adapt imports if `FormFieldsConfig` / `InputConfig`
    aren't already imported in the file; they are, per the existing tests):
      it("should apply the field-level parser over the type-level parser on change (§6.4.3)", async () => {
        const typeParser = vi.fn((v: unknown) => `TYPE:${String(v)}`);
        const fieldParser = vi.fn((v: unknown) => `FIELD:${String(v)}`);

        const inputs: Record<string, InputConfig> = {
          textField: { component: TestInput, defaultValue: "", parser: typeParser },
        };
        const config: FormFieldsConfig = {
          name: { type: "textField", parser: fieldParser }, // field-level override
        };

        render(
          <FormalityProvider inputs={inputs}>
            <Form config={config}>
              {({ methods }) => (
                <>
                  <Field name="name" />
                  <span data-testid="value">{methods.watch("name")}</span>
                </>
              )}
            </Form>
          </FormalityProvider>,
        );

        const user = userEvent.setup();
        await user.type(screen.getByTestId("name"), "hi");

        await waitFor(() => {
          expect(screen.getByTestId("value")).toHaveTextContent("FIELD:hi");
        });
        // Field-level parser ran; type-level parser did NOT (field wins).
        expect(fieldParser).toHaveBeenCalled();
        expect(typeParser).not.toHaveBeenCalled();
      });

      it("should fall back to the type-level parser when the field has no parser (regression)", async () => {
        const typeParser = vi.fn((v: unknown) => `TYPE:${String(v)}`);

        const inputs: Record<string, InputConfig> = {
          textField: { component: TestInput, defaultValue: "", parser: typeParser },
        };
        const config: FormFieldsConfig = {
          name: { type: "textField" }, // no field-level parser → type applies
        };

        render(
          <FormalityProvider inputs={inputs}>
            <Form config={config}>
              {({ methods }) => (
                <>
                  <Field name="name" />
                  <span data-testid="value">{methods.watch("name")}</span>
                </>
              )}
            </Form>
          </FormalityProvider>,
        );

        const user = userEvent.setup();
        await user.type(screen.getByTestId("name"), "hi");

        await waitFor(() => {
          expect(screen.getByTestId("value")).toHaveTextContent("TYPE:hi");
        });
        expect(typeParser).toHaveBeenCalled();
      });

      it("should apply the field-level formatter over the type-level formatter for display (§6.4.3)", async () => {
        const typeFormatter = vi.fn((v: unknown) =>
          typeof v === "string" ? v.toLowerCase() : v,
        );
        const fieldFormatter = vi.fn((v: unknown) =>
          typeof v === "string" ? v.toUpperCase() : v,
        );

        const inputs: Record<string, InputConfig> = {
          textField: { component: TestInput, defaultValue: "", formatter: typeFormatter },
        };
        const config: FormFieldsConfig = {
          name: { type: "textField", formatter: fieldFormatter }, // field-level override
        };

        render(
          <FormalityProvider inputs={inputs}>
            <Form config={config} record={{ name: "hello" }}>
              <Field name="name" />
            </Form>
          </FormalityProvider>,
        );

        // Field-level formatter wins → display is uppercased.
        await waitFor(() => {
          expect(screen.getByTestId("name")).toHaveValue("HELLO");
        });
        expect(fieldFormatter).toHaveBeenCalled();
        expect(typeFormatter).not.toHaveBeenCalled();
      });

      it("should resolve a named field-level parser against the provider registry (registries stay global)", async () => {
        const namedParser = vi.fn((v: unknown) => `NAMED:${String(v)}`);

        const inputs: Record<string, InputConfig> = {
          textField: { component: TestInput, defaultValue: "" },
        };
        const config: FormFieldsConfig = {
          name: { type: "textField", parser: "namedTest" }, // string → registry lookup
        };

        render(
          <FormalityProvider inputs={inputs} parsers={{ namedTest: namedParser }}>
            <Form config={config}>
              {({ methods }) => (
                <>
                  <Field name="name" />
                  <span data-testid="value">{methods.watch("name")}</span>
                </>
              )}
            </Form>
          </FormalityProvider>,
        );

        const user = userEvent.setup();
        await user.type(screen.getByTestId("name"), "x");

        await waitFor(() => {
          expect(screen.getByTestId("value")).toHaveTextContent("NAMED:x");
        });
        expect(namedParser).toHaveBeenCalled();
      });
  - NOTE on existing tests: the two existing value-transformation tests
    (type-level parser/formatter only) still pass UNCHANGED — with no
    field-level parser/formatter set, resolveFieldOverType(undefined,
    inputConfig.parser) returns inputConfig.parser (identical behavior).
    Do not modify them.
  - FOLLOW pattern: positional `inputs`/`config` consts, `FormalityProvider`
    wrapper, Form render-prop with a sibling `<span data-testid="value">`,
    `userEvent.setup().type`, `waitFor` + `toHaveTextContent`/`toHaveValue`.
  - NAMING: `it("should …")` matching the existing block's style.

Task 8: FORMAT + VALIDATE
  - RUN: pnpm format        # prettier --write (normalize import order + JSDoc)
  - RUN: pnpm format:check  # confirm clean
  - RUN: pnpm typecheck     # tsc --build (core + react) — must be clean
  - RUN: pnpm lint          # eslint
  - RUN: pnpm test          # full suite + 90/90/90/90 coverage gate
  - IF format:check FAILS: re-run `pnpm format` and re-check (wrapping nit).
  - IF a test FAILS: read the assertion vs. the actual value; the most likely
    cause is a typo in the parser/formatter fn or a misplaced config field.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — effective-spec resolution via the shared helper. Both sites use
// the IDENTICAL shape:
//   const effective<Lever> = useMemo(
//     () => resolveFieldOverType(fieldConfig.<lever>, inputConfig.<lever>),
//     [fieldConfig.<lever>, inputConfig.<lever>],
//   );
// This is the canonical adapter pattern established by resolveInitialValue
// (P1.M2.T1.S1) and to be reused by P1.M3.T2 (debounce) + P1.M3.T3
// (getSubmitField/valueField).

// PATTERN — call sites consume the EFFECTIVE spec as the 2nd arg, keep the
// GLOBAL registry as the 3rd arg:
//   parse(value, effectiveParser, providerConfig.parsers)
//   format(value, effectiveFormatter, providerConfig.formatters)
// parse/format (core transform/pipeline.ts) return the value unchanged when
// the spec is undefined → no-op when neither field nor type sets one.

// GOTCHA — `fieldConfig` is `config[name] ?? {}` (useField L~388). `({} as
// FieldConfig).parser === undefined`, so for any field WITHOUT a field-level
// parser, resolveFieldOverType(undefined, inputConfig.parser) returns
// inputConfig.parser — identical to today. This is why the existing type-level
// parser/formatter tests stay green unchanged (regression-safe by construction).

// GOTCHA — handleChange dep array: REPLACE `inputConfig.parser` →
// `effectiveParser`. KEEP `inputConfig` (whole object) — it is passed to
// changeField(name, parsedValue, inputConfig). Do NOT remove it.
// (resolveFieldOverType is pure & stable per its deps, so effectiveParser
// only changes identity when fieldConfig.parser/inputConfig.parser change —
// the memo deps are exact.)

// GOTCHA — the format call is inside the <Controller render={...}> inline
// callback (not memoized). effectiveFormatter is the memo; the callback closes
// over it. No dep-array change is possible or needed at the format site.

// GOTCHA — types/config.ts JSDoc edit is PROSE ONLY. The field types are:
//   parser?:    string | ((value: unknown) => TValue);
//   formatter?: string | ((value: TValue) => unknown);
// Do not touch the annotations. Only the /** … */ block above each changes.
```

### Integration Points

```yaml
DATABASE:
  - none (pure React hook change; no persistence, no migration).

CONFIG:
  - none (no settings/env vars).

ROUTES / EXPORTS:
  - none. resolveFieldOverType is already exported from @formality-ui/core
    (S3). useField is an internal hook; its public surface (UseFieldParams /
    UseFieldReturn) is UNCHANGED.

DOWNSTREAM (awareness only — none are triggered by this task):
  - The <Field> component consumes useField unchanged. Field.test.tsx's
    existing type-level parser/formatter tests now ALSO exercise the effective
    path (which, absent field-level overrides, is identical) — proving no
    regression.
  - P1.M3.T2 (debounce in changeField) and P1.M3.T3 (getSubmitField/valueField
    in transformValuesForSubmit) will reuse this same resolveFieldOverType
    pattern at their own field-vs-type sites — this task establishes the
    canonical React-adapter usage.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# From repo root. Type-check core + react (tsc --build). Catches a malformed
# resolveFieldOverType call (wrong arg count) or a JSDoc that broke the type.
pnpm typecheck

# Lint + format-check.
pnpm lint
pnpm format:check

# If prettier flags the new import order / JSDoc / tests, run:
#   pnpm prettier --write packages/react/src/hooks/useField.tsx packages/core/src/types/config.ts packages/react/src/__tests__/Field.test.tsx

# Expected: ZERO errors. The only plausible TS error is a wrong-arity
# resolveFieldOverType(...) call or a stray edit to a type annotation — read
# the message and fix.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Targeted (fastest feedback) — run just the Field value-transformation suite.
pnpm vitest run packages/react/src/__tests__/Field.test.tsx -t "value transformation"

# Run just the new field-level cases by name:
pnpm vitest run packages/react/src/__tests__/Field.test.tsx -t "field-level"
pnpm vitest run packages/react/src/__tests__/Field.test.tsx -t "fall back to the type-level"
pnpm vitest run packages/react/src/__tests__/Field.test.tsx -t "named field-level parser"

# Full react suite (Field + useField + integration).
pnpm vitest run packages/react/

# Full suite (enforces the 90% coverage gate across the workspace).
pnpm test

# Coverage on the touched module (optional, sanity):
pnpm vitest run packages/react/src/__tests__/Field.test.tsx --coverage

# Expected:
#   - The 2 EXISTING value-transformation tests pass (no regression).
#   - The 4 NEW field-level tests pass (field-parser-wins, type-fallback,
#     field-formatter-wins, named-parser-resolves).
#   - Full suite green; 90/90/90/90 coverage gate green (the new
#     resolveFieldOverType call sites in useField are covered: field-set
#      branch by field-level-wins tests, field-unset branch by type-fallback).
```

### Level 3: Integration Testing (System Validation)

```bash
# Confirm the react package builds (useField is consumed by <Field>).
pnpm -r build
# Expected: build succeeds. No "cannot find name resolveFieldOverType" /
# "resolveFieldOverType is not exported" errors.

# Grep proof the edits landed correctly:
rg -n 'resolveFieldOverType' packages/react/src/hooks/useField.tsx
# Expected: one import line + two useMemo call lines (3 matches total).

rg -n 'effectiveParser|effectiveFormatter' packages/react/src/hooks/useField.tsx
# Expected: 2 useMemo declarations + 1 dep-array ref + 2 call-site refs.

rg -n 'inputConfig\.parser\b|inputConfig\.formatter\b' packages/react/src/hooks/useField.tsx
# Expected: ZERO matches at the parse/format CALL sites (they now use
# effectiveParser/effectiveFormatter). (inputConfig.parser may still appear
# inside the effectiveParser useMemo deps — that is correct and intended.)

rg -n 'Three-tier precedence' packages/core/src/types/config.ts
# Expected: two matches — the parser + formatter JSDoc blocks.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# §6.4.5 semantics proof through the adapter — a field-level parser that
# returns a FALSY value (0 / false / "") MUST still be the one applied (not
# the type parser). Optional extra test; the named-parser + field-parser-wins
# tests already prove "field wins". If you add it:
pnpm vitest run packages/react/src/__tests__/Field.test.tsx -t "falsy"

# Round-trip proof (parse ↔ format contract, §10.7) — optional sanity that a
# field-level parser/formatter pair round-trips. Not required by the contract
# (the helper only selects WHICH spec runs; the spec bodies are consumer-
# supplied), but useful if a regression looks value-shape related.

# PRD §6.4.3 / §6.4.0 anchor check — confirm the sections the JSDoc cites exist:
rg -n '#### 6.4.3 parser / formatter|#### 6.4.0 The precedence rule' PRD.md
# Expected: two matches. If absent, the PRD renumbered — update the §refs.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` passes with zero errors.
- [ ] `pnpm test` passes (baseline + 4 new tests; no regressions).
- [ ] `pnpm lint` passes; `pnpm format:check` passes.
- [ ] 90/90/90/90 coverage gate still green (`pnpm test` enforces it).

### Feature Validation

- [ ] `resolveFieldOverType` imported from `@formality-ui/core` in useField.tsx.
- [ ] `effectiveParser` + `effectiveFormatter` are `useMemo`s calling
      `resolveFieldOverType(fieldConfig.<lever>, inputConfig.<lever>)`.
- [ ] `handleChange` calls `parse(newValue, effectiveParser, providerConfig.parsers)`.
- [ ] `handleChange` dep array uses `effectiveParser` (not `inputConfig.parser`).
- [ ] `<Controller>` render callback calls
      `format(field.value, effectiveFormatter, providerConfig.formatters)`.
- [ ] Named registries (`providerConfig.parsers`/`.formatters`) UNCHANGED.
- [ ] JSDoc on `InputConfig.parser` + `.formatter` documents field → type → none.
- [ ] New tests: field-parser-wins, type-fallback, field-formatter-wins,
      named-parser-resolves. Existing 2 value-transformation tests unchanged.

### Code Quality Validation

- [ ] No `??` / truthiness check reintroduced (helper is CALLED — single rule).
- [ ] `handleChange` still passes `inputConfig` (whole) to `changeField` — that
      call + debounce resolution untouched (P1.M3.T2 scope).
- [ ] `InputConfig.parser`/`.formatter` TYPE annotations unchanged (JSDoc only).
- [ ] Import addition is the ONLY barrel-touching concern (no new export needed).
- [ ] Two new `useMemo`s are top-level (not conditional) — hooks-rules safe.

### Documentation & Deployment

- [ ] Mode A docs ride with the work — `InputConfig.parser`/`.formatter` JSDoc
      self-documents the three-tier precedence + `!== undefined` field-wins rule.
- [ ] §6.4.3 / §6.4.0 / §6.4.5 anchors verified present in PRD.md.
- [ ] No new env vars / config / package.json `exports` map change.

---

## Anti-Patterns to Avoid

- ❌ **Do NOT reimplement the `!== undefined` check inline** (no
  `fieldConfig.parser ?? inputConfig.parser`, no `if field… if type…`). The
  whole point of §6.4.0 is a single shared rule. CALL `resolveFieldOverType`.
- ❌ **Do NOT use `??`** anywhere in this change. `??` drops `null`/`false`/`0`/
  `""` — the precise opposite of §6.4.5. `resolveFieldOverType` uses
  `!== undefined`; rely on it.
- ❌ **Do NOT change the named registries** (`providerConfig.parsers` /
  `providerConfig.formatters`). They stay global; only the *effective spec*
  (2nd arg to `parse`/`format`) changes. A string effective spec still
  resolves against the same provider registry.
- ❌ **Do NOT remove `inputConfig` (whole) from handleChange's dep array.** It
  is passed to `changeField(name, parsedValue, inputConfig)`. Only replace the
  `inputConfig.parser` entry with `effectiveParser`.
- ❌ **Do NOT touch `changeField` / debounce resolution.** That is P1.M3.T2's
  scope. The `changeField(name, parsedValue, inputConfig)` call stays as-is.
- ❌ **Do NOT touch `transformValuesForSubmit` / getSubmitField / valueField.**
  That is P1.M3.T3's scope.
- ❌ **Do NOT modify the `InputConfig.parser`/`.formatter` TYPE annotations**
  in `packages/core/src/types/config.ts`. Only the JSDoc prose changes.
- ❌ **Do NOT add a barrel export for `resolveFieldOverType`.** S3 already
  exported it (`packages/core/src/index.ts:127`); just import it by name.
- ❌ **Do NOT modify the 2 existing value-transformation tests.** With no
  field-level parser/formatter set, `resolveFieldOverType(undefined,
  inputConfig.parser)` returns `inputConfig.parser` (identical behavior) —
  they stay green unchanged. Adding field-level cases is additive.
- ❌ **Do NOT expand scope to `resolveFieldOverType` / `FieldConfig` / barrel
  files** (all COMPLETE). This task CONSUMES them.
- ❌ **Do NOT add a dep array to the format call site.** The `<Controller>`
  render callback is inline JSX; `effectiveFormatter` is already memoized with
  the correct deps — the callback just closes over it.

---

## Confidence Score

**10/10.** A surgical, mechanical wiring of an already-landed, already-exported
helper into two existing call sites, with the exact current text of both sites
quoted for matching, the exact replacement code supplied verbatim, a precise
useMemo placement (above `// === CHANGE HANDLER ===`), a prose-only JSDoc
update with the exact before/after text, and additive tests mirroring the
existing proven Field.test.tsx harness. Both input dependencies (S1 type
surface + S2 helper, exported from the barrel) are verified present in code;
the parallel task (P1.M2.T1.S1) touches a disjoint file; the existing 2
value-transformation tests are regression-safe by construction (empty
fieldConfig → `undefined` → type spec applies). The only residual risk is a
prettier-wrapping nit (import order / JSDoc), which `pnpm format` resolves
deterministically.
