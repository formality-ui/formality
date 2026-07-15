# PRP — P1.M3.T2.S1: Wire field-level debounce via `resolveFieldOverType` in `changeField`

**Parent plan**: `plan/006_223c8a76c909` — §6.4 Field-Level Overrides.
**Status**: React adapter runtime — debounce resolution. The second of the
six §6.4 levers to be wired at the adapter level (parser/formatter land
in parallel under P1.M3.T1.S1), following the core helper (P1.M1.T1.S2 —
COMPLETE) and the type surface (P1.M1.T1.S1 — COMPLETE). A surgical change to
`packages/react/src/components/Form.tsx`: in the `changeField` `useCallback`,
resolve the **effective** debounce via the shared `resolveFieldOverType`
helper (`fieldConfig.debounce` over `inputConfig.debounce`) **before** the
existing three-way branch (`false` → immediate / `number` → per-field timer /
`undefined` → Form-level). The branch logic itself is untouched — the helper
only changes *which value* enters it, so `fieldConfig.debounce` now wins when
set. Add `config` to the `useCallback` dep array. A **Mode A** JSDoc update on
`InputConfig.debounce` in `packages/core/src/types/config.ts` extends the
existing two-tier statement to the three-tier precedence (§6.4.2) and rides
with the work.

---

## Goal

**Feature Goal**: Make `changeField` honor `fieldConfig.debounce` (set on the
`<Form config={...}>` prop for a field instance) when it is `!== undefined`,
falling back to `inputConfig.debounce` (the type-level value), then to the
Form-level `debounce` prop — the §6.4.2 three-tier precedence, implemented via
the single shared `resolveFieldOverType` helper (§6.4.0) so the `!== undefined`
rule lives in one place. The existing `false`/`number`/`undefined` branching is
unchanged; only the *effective value fed into it* changes.

**Deliverable**:
1. A modified `packages/react/src/components/Form.tsx`:
   - `resolveFieldOverType` added to the `@formality-ui/core` named import.
   - Inside `changeField`, `const fieldDebounce = inputConfig?.debounce;`
     replaced by `const fieldConfig = config[name];` +
     `resolveFieldOverType(fieldConfig?.debounce, inputConfig?.debounce)`.
   - The `if (fieldDebounce === false) … else if (typeof === "number") … else …`
     branch UNCHANGED.
   - `config` added to the `changeField` `useCallback` dependency array.
2. Updated JSDoc on `InputConfig.debounce` in
   `packages/core/src/types/config.ts` documenting the three-tier precedence
   (field → type → Form-level) and the single field-over-type rule from §6.4.0.
3. New tests proving a `debounce` set via `config[name]` (the `FieldConfig`)
   wins over the type-level `debounce` AND over the Form-level `debounce` prop,
   across all three cadences (`false` immediate, `number` per-field timer, and
   the `undefined` fall-through to the Form-level timer as a regression).

**Success Definition**:
1. A field with `debounce: <number>` in its `FieldConfig` (`config` prop)
   schedules auto-save at that interval, even when the input TYPE also sets a
   `debounce` (field wins) and even when the Form-level `debounce` prop differs.
2. A field with `debounce: false` in its `FieldConfig` submits immediately,
   even when the type-level or Form-level values would debounce.
3. When `fieldConfig.debounce` is `undefined`, the type-level
   `inputConfig.debounce` applies (no regression); when BOTH are `undefined`,
   the Form-level `debounce` prop applies (no regression — existing
   `Form-level fallback preserved` test stays green).
4. `resolveFieldOverType` is CALLED inside `changeField` (not an inline `??` or
   truthiness check) — single-rule integrity (§6.4.0).
5. `config` is present in `changeField`'s `useCallback` deps (so the effective
   debounce tracks config changes; also satisfies the `react-hooks/exhaustive-deps`
   lint rule introduced by reading `config[name]`).
6. `pnpm test` passes (baseline + new tests green, 90/90/90/90 coverage gate);
   `pnpm typecheck`, `pnpm lint`, `pnpm format:check` clean.

---

## Why

PRD §6.4.2 requires a per-instance `debounce` override. Without adapter wiring,
a field that needs a DIFFERENT auto-save cadence from its type siblings (e.g.
one autocomplete with a heavy remote search needing a longer debounce than its
siblings; one "notes" textarea on a different cadence than other `textField`s;
one switch that must fire immediately `debounce: false` even though its type
debounces) has no per-instance lever — it can only change the *type-level*
`debounce`, which affects every field of that type. S1 added `debounce?` to
the `FieldConfig` type surface; S2 added the shared precedence helper. **This
task is the runtime wiring that makes the field-level debounce actually take
effect in `changeField`.**

- **Business value / user impact**: a single field can override its auto-save
  cadence without affecting sibling fields of the same type. This is the
  user-visible payoff of §6.4.2: fine-grained control over *when* each field
  saves, independent of its type.
- **Integration with existing features**: the auto-save pipeline (§12 / §5.2.3)
  is unchanged in shape — only the *which debounce value feeds the branch*
  step changes, routed through `resolveFieldOverType`. The three branch arms
  (`executeAutoSaveRef` immediate, `getOrCreateDebouncedRef` numeric,
  `debouncedSubmitRef` Form-level) and the `pendingChangedFields` /
  `pendingAffectedFields` accumulation are all untouched. The fix for
  autosave Issue 1 (numeric debounces were previously dead config) stays intact.
- **Single-rule integrity**: routing `changeField`'s debounce resolution
  through `resolveFieldOverType` means the `!== undefined` precedence rule
  lives in exactly one place — the same helper the core `resolveInitialValue`
  path (P1.M2.T1.S1), the parser/formatter sites (P1.M3.T1.S1, parallel), and
  the upcoming `transformValuesForSubmit` site (P1.M3.T3) all call.
- **Scope boundary**: this task edits ONLY the `changeField` import + resolution
  line + dep array in `Form.tsx`, the JSDoc on `InputConfig.debounce`, and adds
  tests. It does NOT touch `resolveFieldOverType` (done), `FieldConfig` (done),
  `useField` parser/formatter (P1.M3.T1.S1), `transformValuesForSubmit`
  getSubmitField/valueField (P1.M3.T3), or any barrel export (done in S3).

---

## What

Add `resolveFieldOverType` to the `@formality-ui/core` value-import block at
the top of `Form.tsx`. In the `changeField` `useCallback`, replace the single
line `const fieldDebounce = inputConfig?.debounce;` with a two-line resolution
that reads the field's `FieldConfig` from the `config` prop and resolves the
effective debounce via the helper. Leave the subsequent `if/else if/else`
branch exactly as-is — it already handles `false` / `number` / `undefined`
correctly, and `resolveFieldOverType` now feeds it the field-level value when
set (else the type-level, else `undefined` → Form-level arm). Add `config` to
the `useCallback` dependency array.

Update the JSDoc on `InputConfig.debounce` in
`packages/core/src/types/config.ts` to extend the existing two-tier statement
(type → Form-level) to the full three-tier precedence (field → type →
Form-level), citing §6.4.2 and the single field-over-type rule from §6.4.0
(Mode A — docs ride with the work).

### Success Criteria

- [ ] `resolveFieldOverType` is imported from `@formality-ui/core` in Form.tsx.
- [ ] `changeField` resolves `fieldDebounce` via
      `resolveFieldOverType(config[name]?.debounce, inputConfig?.debounce)`.
- [ ] The `false`/`number`/`else` branch is UNCHANGED.
- [ ] `config` is added to `changeField`'s `useCallback` dep array.
- [ ] No `??` / truthiness check is reintroduced at the resolution site
      (helper is CALLED).
- [ ] JSDoc on `InputConfig.debounce` documents the field → type → Form-level
      precedence and references §6.4.2 + §6.4.0 (the `!== undefined` rule).
- [ ] New tests: field-debounce-`false`-wins-over-type-and-form, field-debounce-
      numeric-wins-over-type-and-form, field-debounce-undefined-falls-back-to-type
      (regression), field-debounce-undefined-and-type-undefined-falls-back-to-form
      (regression).
- [ ] All existing tests pass (`pnpm test`); `pnpm typecheck`/`pnpm lint`/
      `pnpm format:check` clean; 90/90/90/90 coverage gate green.

---

## All Needed Context

### Context Completeness Check

> _"If someone knew nothing about this codebase, would they have everything
> needed to implement this successfully?"_ — **YES.** This PRP names the exact
> file + function, quotes the exact current text of the resolution line AND the
> surrounding branch (so the implementer can locate and match the edit without
> disturbing the branch), quotes the exact import block to extend, quotes the
> exact current `useCallback` dep array and gives the replacement, quotes the
> exact current `InputConfig.debounce` JSDoc and gives the replacement, names
> the exact test file + describe-block conventions + the fake-timer harness
> setup, and verifies both input dependencies (S1 type surface + S2 helper,
> exported from the core barrel) are present in code. The change is mechanical
> and localized.

### Documentation & References

```yaml
# PRD — authoritative source for the three-tier precedence + single rule.
- docfile: PRD.md
  section: §6.4.2 debounce (FieldConfig field-level override)
  why: "Defines `fieldConfig.debounce` overriding `inputConfig.debounce`, falling back to the Form-level `debounce` prop (default 1000). `false` = immediate, `number` = ms."
  critical: "Precedence is field → type → Form-level. Governs auto-save timing ONLY — the value is still committed to form state on every change."
- docfile: PRD.md
  section: §6.4.0 (The precedence rule — single rule for all six) + §6.4.5 (Edge cases)
  why: "resolveFieldOverType encodes the `!== undefined` rule; §6.4.5 enumerates falsy-but-meaningful cases (null/false/0/\"\")."
  critical: "Do NOT reimplement with `??` or truthiness — CALL resolveFieldOverType. For debounce the `??` happens to agree, but single-rule integrity (§6.4.0) mandates the helper."
- docfile: PRD.md
  section: §12 Auto-Save System (§11.1 Behavior #2 + §11.2 Implementation + §11.3 Debounce Behavior)
  why: "Establishes the three-way branch semantics (false→immediate, number→per-field timer, undefined→Form-level) and the per-interval coalescing (getOrCreateDebounced)."
  critical: "The branch arms are ALREADY implemented in changeField (Issue 1 fix). This task changes only the VALUE fed into the branch, not the arms. Example 3 (mixed form) in §11.3 shows field-level cadence differing from Form-level."

# The primary file being edited (React adapter).
- file: packages/react/src/components/Form.tsx
  section: changeField useCallback (declared L368; resolution line ~L389; branch L390–399; dep array L400)
  why: "Home of the debounce resolution that must consume the field-level value. `config` (the <Form> prop) is in scope throughout the component; `inputConfig` is the 3rd changeField arg."
  pattern: "useCallback hooks read component props + args; debounce branch dispatches to three refs (executeAutoSaveRef / getOrCreateDebouncedRef / debouncedSubmitRef)."
  gotcha: "`config` is NOT currently in the changeField dep array — it MUST be added (reading config[name] inside the callback creates a missing-dep; react-hooks/exhaustive-deps would otherwise warn/lint-fail)."

# The Mode-A JSDoc edit target (core types).
- file: packages/core/src/types/config.ts
  section: InputConfig.debounce JSDoc (L67–80) + declaration `debounce?: number | false;` (L81)
  why: "Current JSDoc is a TWO-tier statement (type → Form-level). Extend to THREE tiers (field → type → Form-level) per §6.4.2."
  pattern: "Multi-line `/** … */` JSDoc with a bullet list. PRESERVE the existing bullets (false/number semantics, coalescing) — ADD a precedence paragraph."
  gotcha: "Do NOT change the field TYPE (`number | false`) — only the JSDoc prose. The FieldConfig.debounce JSDoc (L154–160) already references §6.4.2; no change needed there."

# Input dependency #1 — the helper (COMPLETE, exported).
- file: packages/core/src/config/defaults.ts
  section: resolveFieldOverType (L30)
  why: "Defines the helper's exact signature/behavior: `resolveFieldOverType<T>(fieldVal, typeVal) => fieldVal !== undefined ? fieldVal : typeVal`."
  critical: "Already exported from @formality-ui/core (index.ts:127, config/index.ts:15). Import by name in the React package — NO new barrel work."

# Input dependency #2 — the type surface (COMPLETE, S1).
- file: packages/core/src/types/config.ts
  section: FieldConfig.debounce (L154–160)
  why: "Proves `config[name].debounce` is a valid typed access (S1 added it). React overlay: ReactFieldConfig extends FieldConfig (overlays.ts:74), so config[name]?.debounce returns number | false | undefined."

# Test harness to reuse.
- file: packages/react/src/__tests__/autosave-field-debounce.test.tsx
  section: describe("AutoSave Per-Field Numeric Debounce (Issue 1)") at L63; nested describes at L76 / L270 / L437 / L558
  why: "Proven harness for debounce timing end-to-end: TestInput + fake timers (vi.useFakeTimers({ shouldAdvanceTime: true })) + userEvent.type({ delay: null }) + vi.advanceTimersByTimeAsync + submitHandler assertions. Mirror EXACTLY for the FieldConfig variants (move `debounce` from inputs[type]/<Field inputConfig> into config[name])."
  pattern: "`<FormalityProvider inputs={...}><Form config={{ fieldA: { type, debounce } }} onSubmit={submitHandler} autoSave debounce={500}><Field name=\"fieldA\"/></Form></FormalityProvider>`; drive + advance + assert `submitHandler` call count + `expect.objectContaining({ fieldA: \"x\" })`."
  gotcha: "Existing tests cover debounce via TYPE (inputs[type].debounce) and via FIELD PROP (<Field inputConfig={{ debounce }}>). The NEW FieldConfig path (config[name].debounce) is UNCOVERED today — that is precisely the gap this task fills."

# Architecture — confirms the site + the conceptual spec.
- docfile: plan/006_223c8a76c909/architecture/external_deps.md
  section: "debounce (§6.4.2)" (L50–58)
  why: "Names the exact resolution site (`Form.tsx` changeField) and the conceptual spec `config[name]?.debounce ?? inputConfig?.debounce`."
  critical: "The doc writes `??`; the IMPLEMENTATION must use `resolveFieldOverType` per the item description + §6.4.0 (behaviorally identical for debounce, but single-rule integrity is mandatory)."
- docfile: plan/006_223c8a76c909/architecture/prd_gaps.md
  section: debounce row (L20)
  why: "Confirms fieldConfig.debounce is the MISSING lever, site = changeField."
- docfile: plan/006_223c8a76c909/architecture/system_context.md
  section: L67 + L102–103
  why: "Confirms resolution = field → type → Form-level, and that changeField currently uses inputConfig?.debounce but not config[name]?.debounce."

# Parallel task — NO file conflict (disjoint regions).
- docfile: plan/006_223c8a76c909/P1M3T1S1/PRP.md
  why: "Touches packages/react/src/hooks/useField.tsx + InputConfig.parser/.formatter JSDoc (config.ts L91–96). This task touches Form.tsx + InputConfig.debounce JSDoc (config.ts L67–80). Disjoint React files; disjoint JSDoc regions in config.ts — clean merge. Treat P1.M3.T1.S1's outputs as a CONTRACT."

# Validation tooling (root package.json).
- file: package.json
  section: scripts (test, typecheck, lint, format, format:check)
  why: "Exact commands for the validation loop."
- file: vitest.config.ts
  section: coverage thresholds (90/90/90/90)
  why: "Coverage gate enforced under `pnpm test` — the new changeField branch is already covered by the existing + new autosave-field-debounce tests."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/components/Form.tsx              # ← EDIT (import + changeField resolution + dep array)
packages/react/src/__tests__/autosave-field-debounce.test.tsx  # ← EDIT (add FieldConfig debounce tests)
packages/core/src/types/config.ts                   # ← EDIT (InputConfig.debounce JSDoc only)
packages/core/src/config/defaults.ts                # resolveFieldOverType — READ ONLY (S2 complete)
packages/core/src/index.ts                          # barrel — READ ONLY (resolveFieldOverType already exported, S3)
packages/react/src/hooks/useField.tsx               # useField — READ ONLY (parser/formatter = P1.M3.T1.S1 scope)
vitest.config.ts                                    # coverage gate 90/90/90/90
package.json                                        # scripts: pnpm test/typecheck/lint/format:check
```

### Desired Codebase tree with files to be changed

```bash
packages/react/src/components/Form.tsx              # MODIFY — import resolveFieldOverType; replace the
                                                     #          `const fieldDebounce = inputConfig?.debounce;`
                                                     #          line; add `config` to the useCallback dep array.
packages/react/src/__tests__/autosave-field-debounce.test.tsx  # MODIFY — add ~4 tests (FieldConfig debounce path).
packages/core/src/types/config.ts                   # MODIFY — extend InputConfig.debounce JSDoc to 3 tiers.
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: import resolveFieldOverType from "@formality-ui/core" VALUE import
// block (Form.tsx L19–26), NOT the type-only block (L28–33). It is exported
// (index.ts:127). Do NOT add any barrel export; S3 already did it.

// CRITICAL: do NOT reimplement the check inline. Even though `??` is
// behaviorally identical for `number | false` (no null/0/"" possible), §6.4.0
// mandates the helper so the rule lives in one place. CALL it:
//   resolveFieldOverType(config[name]?.debounce, inputConfig?.debounce)

// CRITICAL: do NOT touch the three-way branch. The whole point of the helper
// is that it returns the correct effective value; the existing
//   if (fieldDebounce === false) …
//   else if (typeof fieldDebounce === "number") …
//   else …
// already handles false / number / undefined correctly. Changing the branch
// would risk regressing the Issue 1 numeric-debounce fix.

// GOTCHA: `config` must be added to the changeField useCallback dep array.
// Reading `config[name]` inside the callback without `config` in deps triggers
// `react-hooks/exhaustive-deps` (eslint) and would close over a stale config.
// Existing dep array is `[autoSave, getAffectedFields]` → becomes
// `[autoSave, getAffectedFields, config]`. This mirrors the existing precedent
// `getFormState` (which already depends on `config`).

// GOTCHA: `config` as a prop may change identity if a consumer passes an inline
// literal `config={{...}}` on every render. That recreates `changeField`, which
// flows through FormContextValue to useField's handleChange useCallback. This
// is CORRECT (a config change SHOULD re-resolve debounce) and matches how
// getFormState already behaves. Real consumers typically memoize config.

// GOTCHA (prettier): Form.tsx is prettier-managed. Run `pnpm format` after the
// edits and re-run `pnpm format:check` if it complains (wrapping/import-order).

// SCOPE — do NOT touch:
#   • resolveFieldOverType / FieldConfig / barrel exports (all COMPLETE).
#   • useField.tsx parser/formatter (P1.M3.T1.S1 — parallel; disjoint file).
#   • transformValuesForSubmit getSubmitField/valueField (P1.M3.T3.S1).
#   • resolveInitialValue field-level default (P1.M2.T1.S1 — complete).
#   • The InputConfig.debounce TYPE annotation `number | false` (JSDoc only).
#   • FieldConfig.debounce JSDoc (already references §6.4.2; no change).
#   • InputConfig.parser/.formatter JSDoc (P1.M3.T1.S1 scope; disjoint region).
```

---

## Implementation Blueprint

### Data models and structure

No new data models. This task threads the already-defined field-level
`debounce` through an existing resolution site. The exact addition (the two
replacement lines inside `changeField`):

```typescript
        // Resolve the effective debounce via the single field-over-type rule
        // (§6.4.2 precedence: field → type → Form-level; §6.4.0 helper so the
        // `!== undefined` semantics live in one place). The three-way branch
        // below then dispatches exactly as before (false→immediate,
        // number→per-field timer, undefined→Form-level debounce prop).
        const fieldConfig = config[name];
        const fieldDebounce = resolveFieldOverType(
          fieldConfig?.debounce,
          inputConfig?.debounce,
        );
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 0 (PRECHECK): confirm both input dependencies are present
  - RUN: rg -n 'export function resolveFieldOverType' packages/core/src/config/defaults.ts
    EXPECT: one match (S2 helper exists at L30).
  - RUN: rg -n 'resolveFieldOverType' packages/core/src/index.ts
    EXPECT: one match (S3 exported it from the barrel at L127 — importable by name).
  - RUN: rg -n 'Per-instance auto-save debounce' packages/core/src/types/config.ts
    EXPECT: one match (FieldConfig.debounce JSDoc, L154 — S1 added the field).
  - IF ANY MISSING: STOP. This task depends on S1+S2+S3; sequence after them.
    (All three are verified present — see research/changeField-and-dependencies.md.)

Task 1: MODIFY packages/react/src/components/Form.tsx — add the import
  - FIND the existing @formality-ui/core VALUE import block (Form.tsx L19–26):
        import {
          resolveAllInitialValues,
          resolveFormTitle,
          evaluateDescriptor,
          buildFormContext,
          extractValueField,
          transformFieldName,
        } from "@formality-ui/core";
  - ADD `resolveFieldOverType,` to the named imports (e.g. after
    `transformFieldName,` — placement is cosmetic; prettier normalizes).
  - RESULT:
        import {
          resolveAllInitialValues,
          resolveFormTitle,
          evaluateDescriptor,
          buildFormContext,
          extractValueField,
          transformFieldName,
          resolveFieldOverType,
        } from "@formality-ui/core";
  - DO NOT touch the SECOND @formality-ui/core import (type-only, L28–33) —
    this is a runtime helper.

Task 2: MODIFY packages/react/src/components/Form.tsx — replace the debounce resolution line
  - LOCATE inside changeField (L368–401) the single line:
        const fieldDebounce = inputConfig?.debounce;
    (immediately above the `if (fieldDebounce === false) {` branch.)
  - REPLACE that ONE line with:
        const fieldConfig = config[name];
        const fieldDebounce = resolveFieldOverType(
          fieldConfig?.debounce,
          inputConfig?.debounce,
        );
  - LEAVE the comment block above it (the 4-line `// Resolve the auto-save
    cadence …` comment) AS-IS — it still accurately describes the branch.
    (Optional: you may extend the comment to mention the field tier, but it is
    not required; the branch semantics are unchanged.)
  - LEAVE the entire `if (fieldDebounce === false) { … } else if (typeof
    fieldDebounce === "number") { … } else { … }` branch UNCHANGED.

Task 3: MODIFY packages/react/src/components/Form.tsx — add `config` to the useCallback deps
  - FIND the changeField useCallback dependency array (currently):
        [autoSave, getAffectedFields],
  - REPLACE with:
        [autoSave, getAffectedFields, config],
  - WHY: the callback now reads `config[name]`; `config` must be a dep (eslint
    react-hooks/exhaustive-deps + correct staleness behavior). This matches the
    existing precedent `getFormState` (deps include `config`).

Task 4: MODIFY packages/core/src/types/config.ts — extend InputConfig.debounce JSDoc to three tiers
  - FIND (InputConfig interface, L67–81):
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
  - REPLACE with (add a Three-tier precedence paragraph; preserve all bullets):
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
         * Three-tier precedence (§6.4.2): a field-level `FieldConfig.debounce`
         * wins when set; otherwise this type-level value; otherwise the
         * Form-level `debounce` prop (default 1000). All three share the single
         * field-over-type rule from §6.4.0 (resolved via `resolveFieldOverType`,
         * so a field-level `false`/`number` is honored when `!== undefined`).
         *
         * This governs *auto-save timing only*. The field value is still committed
         * to the form state on every change (it does not throttle re-renders).
         */
        debounce?: number | false;
  - DO NOT change the field TYPE annotation `debounce?: number | false;` —
    only the JSDoc prose. Do NOT touch FieldConfig.debounce's JSDoc (L154–160,
    already references §6.4.2).

Task 5: MODIFY packages/react/src/__tests__/autosave-field-debounce.test.tsx — add FieldConfig debounce tests
  - ADD a new nested `describe("FieldConfig.debounce (config prop) overrides type + Form-level", ...)`
    block INSIDE the top-level `describe("AutoSave Per-Field Numeric Debounce (Issue 1)", ...)`
    (i.e. as a sibling of the existing L76 / L270 / L437 / L558 describes, before
    the file's final closing `});`).
  - REUSE the existing module-level `TestInput`, `baseInputs`, the per-test
    `submitHandler` (re-assigned in beforeEach), and the fake-timer setup
    (`vi.useFakeTimers({ shouldAdvanceTime: true })`). Mirror the existing
    "drive + advanceTimersByTimeAsync + assert submitHandler" pattern EXACTLY.
  - CASES (verbatim — adapt only the `config` / `debounce` values):
      describe("FieldConfig.debounce (config prop) overrides type + Form-level", () => {
        it("should honor a numeric debounce set via config[name] over the type-level debounce (§6.4.2)", async () => {
          // The type says 2000; the FIELD (config prop) says 1500 → 1500 wins.
          render(
            <FormalityProvider inputs={inputsWithFieldDebounce /* textField.debounce: 2000 */}>
              <Form
                config={{ fieldA: { type: "textField", debounce: 1500 } }}
                onSubmit={submitHandler}
                autoSave
                debounce={500} // Form-level fallback (must NOT be used)
              >
                <Field name="fieldA" />
              </Form>
            </FormalityProvider>,
          );

          await act(async () => {
            await vi.advanceTimersByTimeAsync(100);
          });
          submitHandler.mockClear();

          await act(async () => {
            await userEvent.type(screen.getByTestId("fieldA"), "hi", { delay: null });
          });

          // 500ms (Form-level) — no submit.
          await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
          });
          expect(submitHandler).not.toHaveBeenCalled();
          // 1500ms (FIELD) — NOT 2000ms (type). Submit now.
          await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
          });
          await waitFor(() => {
            expect(submitHandler).toHaveBeenCalledTimes(1);
          });
          expect(submitHandler).toHaveBeenCalledWith(
            expect.objectContaining({ fieldA: "hi" }),
          );

          // Sanity: the type-level 2000 was NOT the cadence (it would still be pending here).
          await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
          });
          expect(submitHandler).toHaveBeenCalledTimes(1);
        });

        it("should submit immediately when config[name] sets debounce:false, even if the type debounces (§6.4.2)", async () => {
          // Type debounces (2000); FIELD says false → immediate.
          render(
            <FormalityProvider inputs={inputsWithFieldDebounce /* textField.debounce: 2000 */}>
              <Form
                config={{ fieldA: { type: "textField", debounce: false } }}
                onSubmit={submitHandler}
                autoSave
                debounce={500}
              >
                <Field name="fieldA" />
              </Form>
            </FormalityProvider>,
          );

          await act(async () => {
            await vi.advanceTimersByTimeAsync(100);
          });
          submitHandler.mockClear();

          await act(async () => {
            await userEvent.type(screen.getByTestId("fieldA"), "x", { delay: null });
          });

          // Immediate — well under the type's 2000ms.
          await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
          });
          await waitFor(() => {
            expect(submitHandler).toHaveBeenCalledTimes(1);
          });
          expect(submitHandler).toHaveBeenCalledWith(
            expect.objectContaining({ fieldA: "x" }),
          );
        });

        it("should fall back to the type-level debounce when config[name] omits debounce (regression)", async () => {
          // No field-level debounce → type's 2000 applies (existing behavior; proves resolveFieldOverType(undefined, 2000) === 2000).
          render(
            <FormalityProvider inputs={inputsWithFieldDebounce /* textField.debounce: 2000 */}>
              <Form
                config={{ fieldA: { type: "textField" } }}
                onSubmit={submitHandler}
                autoSave
                debounce={500}
              >
                <Field name="fieldA" />
              </Form>
            </FormalityProvider>,
          );

          await act(async () => {
            await vi.advanceTimersByTimeAsync(100);
          });
          submitHandler.mockClear();

          await act(async () => {
            await userEvent.type(screen.getByTestId("fieldA"), "hi", { delay: null });
          });

          await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
          });
          expect(submitHandler).not.toHaveBeenCalled();

          // Type-level 2000ms cadence.
          await act(async () => {
            await vi.advanceTimersByTimeAsync(1500);
          });
          await waitFor(() => {
            expect(submitHandler).toHaveBeenCalledTimes(1);
          });
          expect(submitHandler).toHaveBeenCalledWith(
            expect.objectContaining({ fieldA: "hi" }),
          );
        });

        it("should fall back to the Form-level debounce when both config[name] and type omit debounce (regression)", async () => {
          // baseInputs.textField has NO debounce; config omits it too → Form-level 500.
          render(
            <FormalityProvider inputs={baseInputs}>
              <Form
                config={{ fieldA: { type: "textField" } }}
                onSubmit={submitHandler}
                autoSave
                debounce={500}
              >
                <Field name="fieldA" />
              </Form>
            </FormalityProvider>,
          );

          await act(async () => {
            await vi.advanceTimersByTimeAsync(100);
          });
          submitHandler.mockClear();

          await act(async () => {
            await userEvent.type(screen.getByTestId("fieldA"), "x", { delay: null });
          });

          await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
          });
          expect(submitHandler).not.toHaveBeenCalled();

          await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
          });
          await waitFor(() => {
            expect(submitHandler).toHaveBeenCalledTimes(1);
          });
          expect(submitHandler).toHaveBeenCalledWith(
            expect.objectContaining({ fieldA: "x" }),
          );
        });
      });
  - NOTE on existing tests: the existing describe blocks (numeric via TYPE at L76,
    numeric via <Field inputConfig> at L174, `false` via <Field inputConfig> at
    L438, Form-level fallback at L559) all STILL PASS UNCHANGED. With no
    field-level debounce in config, resolveFieldOverType(undefined,
    inputConfig?.debounce) returns inputConfig?.debounce (identical behavior).
    Do NOT modify them — the new describe is purely ADDITIVE.
  - FOLLOW pattern: module-level `baseInputs` / `inputsWithFieldDebounce`,
    `<FormalityProvider>` + `<Form config={{...}} onSubmit={submitHandler}
    autoSave debounce={N}>`, `<Field name="...">`, `act + userEvent.type({
    delay: null })`, `act + vi.advanceTimersByTimeAsync`, `waitFor +
    expect(submitHandler).toHaveBeenCalled[Times]` + `objectContaining`.

Task 6: FORMAT + VALIDATE
  - RUN: pnpm format        # prettier --write (normalize import order + JSDoc + tests)
  - RUN: pnpm format:check  # confirm clean
  - RUN: pnpm typecheck     # tsc --build (core + react) — must be clean
  - RUN: pnpm lint          # eslint . (includes react-hooks/exhaustive-deps)
  - RUN: pnpm test          # full suite + 90/90/90/90 coverage gate
  - IF format:check FAILS: re-run `pnpm format` and re-check (wrapping nit).
  - IF lint FAILS on exhaustive-deps: confirm `config` is in the changeField
    dep array (Task 3). If it fails elsewhere, read the message.
  - IF a test FAILS: read the assertion vs. actual submitHandler call count;
    the most likely cause is a `debounce` value typo or a config placed in the
    wrong field (type vs field).
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — effective-debounce resolution via the shared helper. Identical
// shape to the parser/formatter resolution (P1.M3.T1.S1) and to be reused by
// P1.M3.T3 (getSubmitField/valueField):
//   const fieldDebounce = resolveFieldOverType(
//     config[name]?.debounce,   // field-level (instance)
//     inputConfig?.debounce,    // type-level (InputConfig)
//   );
// `config[name]` is the ReactFieldConfig (or undefined for an unconfigured
// name); `config[name]?.debounce` is `number | false | undefined`.

// PATTERN — the branch is UNCHANGED. resolveFieldOverType returns:
//   - fieldConfig.debounce  when !== undefined (false OR number)
//   - else inputConfig?.debounce (false | number | undefined)
//   - else undefined
// The existing branch then dispatches: false→executeAutoSaveRef,
// number→getOrCreateDebouncedRef, else→debouncedSubmitRef (Form-level).

// GOTCHA — `config` is a `<Form>` prop (ReactFormFieldsConfig<TFieldValues>).
// It is destructured in the FormProps binding (alongside autoSave, debounce,
// mode, validate, record, formConfig). Reading config[name] inside changeField
// requires `config` in the useCallback deps. Existing precedent: getFormState
// already lists `config` in its deps.

// GOTCHA — do NOT add `config[name]` (a derived value) to the deps. Add the
// STABLE `config` prop. (Deriving `const fieldConfig = config[name]` inside the
// callback body is fine; only `config` needs to be a dep — it's what closes over.)

// GOTCHA — the architecture doc (external_deps.md:53) writes the conceptual
// spec as `config[name]?.debounce ?? inputConfig?.debounce`. For debounce
// (number | false) `??` and resolveFieldOverType agree (false survives both).
// But the IMPLEMENTATION must CALL resolveFieldOverType — §6.4.0 single-rule
// integrity is non-negotiable, and the item description mandates it.

// GOTCHA — types/config.ts JSDoc edit is PROSE ONLY. The field type stays
// `debounce?: number | false;`. Only the /** … */ block changes (add the
// Three-tier precedence paragraph).
```

### Integration Points

```yaml
DATABASE:
  - none (pure React callback change; no persistence, no migration).

CONFIG:
  - none (no settings/env vars).

ROUTES / EXPORTS:
  - none. resolveFieldOverType is already exported from @formality-ui/core
    (S3). changeField is an internal useCallback exposed (unchanged signature)
    via FormContextValue; its public surface is UNCHANGED.

DOWNSTREAM (awareness only — none are triggered by this task):
  - changeField is consumed by useField's handleChange (via FormContextValue).
    The call signature `changeField(name, parsedValue, inputConfig)` is
    UNCHANGED. The only observable effect: a field whose config sets `debounce`
    now auto-saves on its own cadence.
  - P1.M3.T1.S1 (parser/formatter in useField — parallel) edits a DISJOINT file
    (useField.tsx) and a DISJOINT JSDoc region in config.ts (parser/formatter
    at L91–96 vs debounce at L67–80). No merge conflict.
  - P1.M3.T3 (getSubmitField/valueField in transformValuesForSubmit — upcoming)
    will reuse this same resolveFieldOverType pattern at its own field-vs-type
    site within the SAME Form.tsx (transformValuesForSubmit already reads
    config[name]). This task establishes the canonical Form.tsx usage.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# From repo root. Type-check core + react (tsc --build). Catches a malformed
# resolveFieldOverType call (wrong arg count) or a JSDoc that broke the type.
pnpm typecheck

# Lint (includes react-hooks/exhaustive-deps — will flag a missing `config` dep)
# + format-check.
pnpm lint
pnpm format:check

# If prettier flags the new import order / JSDoc / tests, run:
#   pnpm prettier --write packages/react/src/components/Form.tsx packages/core/src/types/config.ts packages/react/src/__tests__/autosave-field-debounce.test.tsx

# Expected: ZERO errors. The only plausible TS error is a wrong-arity
# resolveFieldOverType(...) call or a stray edit to a type annotation; the only
# plausible lint error is a missing `config` dep (Task 3 fixes it).
```

### Level 2: Unit Tests (Component Validation)

```bash
# Targeted (fastest feedback) — run just the autosave debounce suite.
pnpm vitest run packages/react/src/__tests__/autosave-field-debounce.test.tsx

# Run just the new FieldConfig describe by name:
pnpm vitest run packages/react/src/__tests__/autosave-field-debounce.test.tsx -t "FieldConfig.debounce"

# Full react suite (autosave + Field + useField + integration).
pnpm vitest run packages/react/

# Full suite (enforces the 90% coverage gate across the workspace).
pnpm test

# Expected:
#   - ALL existing autosave-field-debounce tests pass (no regression — with no
#     field-level debounce, resolveFieldOverType(undefined, inputConfig?.debounce)
#     returns inputConfig?.debounce: identical behavior).
#   - The 4 NEW FieldConfig tests pass (numeric-wins, false-wins,
#     type-fallback-regression, form-fallback-regression).
#   - Full suite green; 90/90/90/90 coverage gate green (the changeField
#     resolution line is covered by both existing and new tests).
```

### Level 3: Integration Testing (System Validation)

```bash
# Confirm the react package builds (changeField is consumed by <Form>/<Field>).
pnpm -r build
# Expected: build succeeds. No "cannot find name resolveFieldOverType" /
# "resolveFieldOverType is not exported" errors.

# Grep proof the edits landed correctly:
rg -n 'resolveFieldOverType' packages/react/src/components/Form.tsx
# Expected: one import line + one call line inside changeField (2 matches).

rg -n 'const fieldDebounce' packages/react/src/components/Form.tsx
# Expected: the new line `const fieldDebounce = resolveFieldOverType(` — NOT
# `const fieldDebounce = inputConfig?.debounce;`.

rg -n '\[autoSave, getAffectedFields, config\]' packages/react/src/components/Form.tsx
# Expected: one match — the updated changeField dep array.

rg -n 'inputConfig\?\.debounce' packages/react/src/components/Form.tsx
# Expected: ONE match — inside the resolveFieldOverType(...) call (as the 2nd
# arg). It must NOT appear as a bare `const fieldDebounce = inputConfig?.debounce;`.

rg -n 'Three-tier precedence' packages/core/src/types/config.ts
# Expected: one match — the InputConfig.debounce JSDoc paragraph. (parser/
# formatter JSDoc from P1.M3.T1.S1 does not contain this exact phrase, so no
# false collision.)
```

### Level 4: Creative & Domain-Specific Validation

```bash
# §6.4.2 / §6.4.0 anchor check — confirm the sections the JSDoc cites exist:
rg -n '#### 6.4.2 debounce|#### 6.4.0 The precedence rule' PRD.md
# Expected: two matches. If absent, the PRD renumbered — update the §refs.

# §6.4.5 falsy-proof (optional extra) — a field-level debounce is honored even
# though `false` is falsy (proves resolveFieldOverType !== `??`/truthiness for
# the one falsy value debounce can take). The "false-wins" test already proves
# this; no separate test needed.

# Mixed-cadence proof (optional sanity, mirrors PRD §11.3 Example 3): a form
# with one field using config debounce:1500 and a sibling using config
# debounce:false — assert the false-field submits immediately while the
# numeric-field is still pending. The existing L438 mixed test already covers
# the <Field inputConfig> variant; a config variant is additive but not
# required (the helper is unit-covered).
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` passes with zero errors.
- [ ] `pnpm test` passes (baseline + 4 new tests; no regressions).
- [ ] `pnpm lint` passes (incl. `react-hooks/exhaustive-deps`); `pnpm
      format:check` passes.
- [ ] 90/90/90/90 coverage gate still green (`pnpm test` enforces it).

### Feature Validation

- [ ] `resolveFieldOverType` imported from `@formality-ui/core` in Form.tsx.
- [ ] `changeField` resolves `fieldDebounce` via
      `resolveFieldOverType(config[name]?.debounce, inputConfig?.debounce)`.
- [ ] The `false`/`number`/`else` branch is UNCHANGED.
- [ ] `config` added to `changeField`'s `useCallback` dep array.
- [ ] JSDoc on `InputConfig.debounce` documents field → type → Form-level
      precedence + §6.4.2 + §6.4.0.
- [ ] New tests: numeric-wins, false-wins, type-fallback (regression),
      form-fallback (regression). Existing tests unchanged.

### Code Quality Validation

- [ ] No `??` / truthiness check reintroduced at the resolution site (helper
      is CALLED — single rule per §6.4.0).
- [ ] The three-way dispatch branch (Issue 1 fix) is untouched.
- [ ] `InputConfig.debounce` TYPE annotation unchanged (JSDoc only).
- [ ] Import addition is the ONLY barrel-touching concern (no new export).
- [ ] changeField's `inputConfig` arg + call signature unchanged (P1.M3.T1.S1
      passes inputConfig through unchanged).

### Documentation & Deployment

- [ ] Mode A docs ride with the work — `InputConfig.debounce` JSDoc
      self-documents the three-tier precedence + `!== undefined` field-wins rule.
- [ ] §6.4.2 / §6.4.0 anchors verified present in PRD.md.
- [ ] No new env vars / config / package.json `exports` map change.

---

## Anti-Patterns to Avoid

- ❌ **Do NOT reimplement the `!== undefined` check inline** (no
  `config[name]?.debounce ?? inputConfig?.debounce`, no `if field… if type…`).
  The architecture doc writes `??` as the conceptual spec, but the item
  description + §6.4.0 mandate CALLING `resolveFieldOverType`. Single rule, one
  place.
- ❌ **Do NOT touch the three-way branch.** `resolveFieldOverType` returns the
  correct effective value; the existing `if false / else if number / else`
  dispatch already works. Editing it risks regressing the Issue 1 numeric-debounce
  fix.
- ❌ **Do NOT forget to add `config` to the changeField dep array.** Reading
  `config[name]` inside the callback without `config` in deps is an
  `exhaustive-deps` lint failure AND a staleness bug. Existing dep array is
  `[autoSave, getAffectedFields]` → `[autoSave, getAffectedFields, config]`.
- ❌ **Do NOT add `config[name]` (derived) to the deps** — add the stable
  `config` prop. `const fieldConfig = config[name]` is a local derivation inside
  the callback body; only `config` closes over.
- ❌ **Do NOT touch `useField.tsx` / parser / formatter.** That is P1.M3.T1.S1's
  scope (parallel; disjoint file). changeField's call to
  `changeField(name, parsedValue, inputConfig)` stays as-is.
- ❌ **Do NOT touch `transformValuesForSubmit` / getSubmitField / valueField.**
  That is P1.M3.T3's scope.
- ❌ **Do NOT modify the `InputConfig.debounce` TYPE annotation**
  (`number | false`) in `packages/core/src/types/config.ts`. Only the JSDoc prose
  changes. Do NOT touch `FieldConfig.debounce`'s JSDoc either (already cites §6.4.2).
- ❌ **Do NOT add a barrel export for `resolveFieldOverType`.** S3 already
  exported it (`packages/core/src/index.ts:127`); just import it by name.
- ❌ **Do NOT modify the existing autosave-field-debounce tests.** With no
  field-level debounce in config, `resolveFieldOverType(undefined,
  inputConfig?.debounce)` returns `inputConfig?.debounce` (identical behavior) —
  they stay green unchanged. Adding the FieldConfig describe is additive.
- ❌ **Do NOT expand scope to `resolveFieldOverType` / `FieldConfig` / barrel
  files** (all COMPLETE). This task CONSUMES them.
- ❌ **Do NOT edit the type-only `@formality-ui/core` import block** (Form.tsx
  L28–33). `resolveFieldOverType` is a runtime value — it belongs in the value
  import block (L19–26).

---

## Confidence Score

**10/10.** A surgical, mechanical wiring of an already-landed, already-exported
helper into a single resolution line inside an existing `useCallback`, with the
exact current text of that line + its surrounding (unchanged) branch quoted for
matching, the exact replacement code supplied verbatim, the exact current
`useCallback` dep array + its replacement quoted, a prose-only JSDoc update with
the exact before/after text, and additive tests mirroring the existing proven
`autosave-field-debounce.test.tsx` fake-timer harness. Both input dependencies
(S1 type surface + S2 helper, exported from the barrel) are verified present in
code; the parallel task (P1.M3.T1.S1) touches a disjoint React file and a
disjoint JSDoc region in config.ts (debounce at L67–80 vs parser/formatter at
L91–96 — no merge conflict); the existing autosave-field-debounce tests are
regression-safe by construction (empty fieldConfig.debounce → `undefined` → type
spec applies). The only residual risks are (a) a prettier-wrapping nit
(import order / JSDoc), which `pnpm format` resolves deterministically, and (b)
an `exhaustive-deps` lint nudge if `config` is omitted from the dep array —
Task 3 adds it explicitly.
