# PRP — P1.M2.T1.S1: Insert field-level default tier in `resolveInitialValue` priority chain

**Parent plan**: `plan/006_223c8a76c909` — §6.4 Field-Level Overrides.
**Status**: Core logic (initial-value resolution). A single, surgical change to
`resolveInitialValue` in `packages/core/src/config/defaults.ts`: insert
`fieldConfig.defaultValue` as a **new Priority 3 tier** between the record
lookup and the input-type default, implemented by routing the existing
field-vs-type step through the already-landed `resolveFieldOverType` helper
(P1.M1.T1.S2 — COMPLETE, verified in code). `resolveAllInitialValues` delegates
to `resolveInitialValue`, so it picks up the new tier automatically. This is
the runtime that gives the type surface (S1) its observable behavior.

---

## Goal

**Feature Goal**: Make `resolveInitialValue` return `fieldConfig.defaultValue`
when neither the `defaultValues` prop nor the `record` supplies the field and
`fieldConfig.defaultValue !== undefined`, while still falling through to
`inputConfig.defaultValue` otherwise. This converts the priority chain from
3-tier to 4-tier (PRD §6.4.1 / §13.1):

1. `defaultValues[fieldName]` (Form prop)
2. `record[recordKey]`
3. **`fieldConfig.defaultValue`** ← NEW
4. `inputConfig.defaultValue`

The field-vs-type step (Priorities 3+4 combined) is implemented via the single
`resolveFieldOverType` helper, so `null` / `false` / `0` / `""` are honored as
**meaningful** field-level defaults (PRD §6.4.0 / §6.4.5).

**Deliverable**:
1. A modified `resolveInitialValue` in `packages/core/src/config/defaults.ts`
   whose Priority-3 block is replaced by a `resolveFieldOverType` call.
2. Updated JSDoc on `resolveInitialValue` (priority comment → 4-tier; deviation
   note's chain recital → 4-step; `@param fieldConfig` → mentions
   `defaultValue`; `@example` → includes a field-level-default scenario).
3. New test cases in `packages/core/src/__tests__/config.test.ts` inside the
   existing `describe("resolveInitialValue")` block (and one in
   `describe("resolveAllInitialValues")` proving delegation picks up the tier).
4. `resolveAllInitialValues` body is UNCHANGED (delegation — no edit needed).

**Success Definition**:
1. `resolveInitialValue` returns `fieldConfig.defaultValue` when record /
   defaultValues omit the field and `fieldConfig.defaultValue !== undefined`.
2. `resolveInitialValue` still returns `inputConfig.defaultValue` when
   `fieldConfig.defaultValue` is `undefined` (existing behavior preserved).
3. Falsy field-level defaults (`null` / `false` / `0` / `""`) are honored
   (NOT fallen through to the type default) — the §6.4.5 contract, verified
   end-to-end through the priority chain.
4. `record` and `defaultValues` still win over `fieldConfig.defaultValue`
   (Priorities 1 & 2 unchanged).
5. `pnpm test` passes (1085+ baseline held + new tests green); coverage gate
   90/90/90/90 green. `pnpm typecheck`, `pnpm lint`, `pnpm format:check` clean.
6. All 5 existing `resolveInitialValue` tests remain green (no regression).

---

## Why

PRD §6.4.1 / §13.1 requires that a per-instance `defaultValue` be a real
priority tier — *more specific* than the input-type default, but *less
authoritative* than actual record data or explicit per-call `defaultValues`.
Without this tier, a field that wants to default **on** (e.g. an "active"
switch) has no per-instance lever: it can only flip the *type* default, which
changes every switch of that type. S1 added the field to the type surface;
S2 added the precedence helper. **This task is the runtime wiring that makes
the field actually take effect at initial-value resolution time.**

- **Business value / user impact**: a single field can seed a default
  (`switch` defaulting on, a `select` defaulting to a specific option, a
  `textField` pre-filled with a computed constant) without affecting sibling
  fields of the same type. This is the core, user-visible payoff of §6.4.
- **Integration with existing features**: `resolveAllInitialValues`
  (Form initialization), `record[recordKey]` lookup, and the `defaultValues`
  Form prop are all preserved — the new tier slots *below* them. The React
  adapter (`Form.tsx` → `resolveAllInitialValues`) consumes the change with
  zero adapter edits because it delegates.
- **Single-rule integrity**: routing the field-vs-type step through
  `resolveFieldOverType` means the `!== undefined` precedence rule lives in
  exactly one place — the same helper every adapter will use (P1.M3.*). No
  bespoke inline check is reintroduced.
- **Scope boundary**: this task edits ONLY `resolveInitialValue`'s Priority-3
  block + its JSDoc + adds tests. It does NOT touch `resolveFieldOverType`
  (done), `resolveAllInitialValues` body (delegates — unchanged), the barrel
  exports (S3), the React adapter runtime (P1.M3.*), or `overlays.ts` (T2.S1).

---

## What

Replace the existing Priority-3 block in `resolveInitialValue` with a
`resolveFieldOverType` call that combines Priorities 3 and 4. The OLD block:

```typescript
  // Priority 3: Input type default value
  if (inputConfig?.defaultValue !== undefined) {
    return inputConfig.defaultValue;
  }
```

The NEW block (verbatim from the task contract):

```typescript
  // Priority 3+4: Field-level default overrides type-level (§6.4.1, §6.4.0)
  const resolvedDefault = resolveFieldOverType(
    fieldConfig?.defaultValue,
    inputConfig?.defaultValue,
  );
  if (resolvedDefault !== undefined) {
    return resolvedDefault;
  }
```

`resolveFieldOverType` returns `fieldConfig.defaultValue` when it is not
`undefined` (honoring `null`/`false`/`0`/`""`), otherwise
`inputConfig.defaultValue`. The outer `!== undefined` guard preserves the
existing "return undefined if neither is set" fall-through. The JSDoc priority
comment, the deviation-note chain recital, the `@param fieldConfig` line, and
the `@example` are updated to reflect the 4-tier order (Mode A docs ride with
the work).

### Success Criteria

- [ ] The Priority-3 inline `inputConfig?.defaultValue !== undefined` block is
      **replaced** by a `resolveFieldOverType(fieldConfig?.defaultValue,
      inputConfig?.defaultValue)` call wrapped in a `!== undefined` guard.
- [ ] `resolveFieldOverType` is called (not an inline reimplementation).
- [ ] JSDoc priority list is 4-tier: `defaultValues` → `record[recordKey]` →
      `fieldConfig.defaultValue` → `inputConfig.defaultValue`.
- [ ] JSDoc deviation-note chain recital is updated to the 4-step order.
- [ ] `@param fieldConfig` mentions `defaultValue` as the new Priority-3 source.
- [ ] `@example` includes a field-level-default scenario (field-level default
      wins when record/defaultValues omit the field).
- [ ] New tests assert: field-default-wins, field-default-falsy-honored
      (null/false/0/""), record-still-wins, defaultValues-still-wins,
      undefined-falls-through-to-type, and a `resolveAllInitialValues`
      delegation proof.
- [ ] All 5 existing `resolveInitialValue` tests still pass.
- [ ] `pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm format:check` pass.

---

## All Needed Context

### Context Completeness Check

> _"If someone knew nothing about this codebase, would they have everything
> needed to implement this successfully?"_ — **YES.** This PRP names the exact
> file, quotes the exact current Priority-3 block (so the implementer can
> locate and match it for the edit), supplies the exact replacement block
> verbatim from the task contract, specifies the exact JSDoc deltas (priority
> list, deviation-note chain, `@param`, `@example`), names the exact test
> file + describe block + insertion point, lists the exact new test cases
> (with ready-to-adapt `resolveInitialValue(...)` call shapes matching the
> existing test style), and verifies both input dependencies (S1 type surface
> + S2 helper) are already present in code. The change is a localized,
> mechanical edit plus focused tests.

### Documentation & References

```yaml
# PRD — authoritative source for the 4-tier priority order and §6.4.5 semantics.
- docfile: PRD.md
  section: §13.1 Sources of Initial Values (the 4-tier priority order)
  why: "Defines the exact precedence: defaultValues → record → fieldConfig.defaultValue → inputConfig.defaultValue."
  critical: "§13.1 explicitly states the field-level default sits BETWEEN the record and the type default — it is a new priority tier, NOT a bare `??` of the type default."
- docfile: PRD.md
  section: §6.4.1 defaultValue (FieldConfig)
  why: "Defines `defaultValue?: unknown` and its precedence; use cases (switch defaulting on, select defaulting to an option)."
  critical: "Honored when `!== undefined`; null/false/0/\"\" are meaningful defaults."
- docfile: PRD.md
  section: §6.4.0 (The precedence rule — single rule for all six) + §6.4.5 (Edge cases & semantics)
  why: "The `resolveFieldOverType` helper encodes the `!== undefined` rule; §6.4.5 enumerates the falsy-but-meaningful cases the tests must assert."
  critical: "Do NOT reimplement the check inline — CALL `resolveFieldOverType`. `??` would be wrong (drops null/false/0/\"\")."
- docfile: PRD.md
  section: §13.3 Initial Value Pipeline (shows the intended resolveInitialValue with the field-level tier as Priority 3)
  why: "Reference implementation of the 4-tier chain — matches the task-contract replacement block."

# The single source file being edited.
- file: packages/core/src/config/defaults.ts
  why: "Home of resolveInitialValue (the edit target) AND resolveFieldOverType (the already-landed helper it must call). Zero framework deps."
  pattern: "resolveFieldOverType is at the TOP of the file (S2). resolveInitialValue follows. The Priority-3 block to replace is ~line 132-135."
  gotcha: "resolveFieldOverType is in the SAME file — no import is needed to call it. Do NOT add an import for it (it would be a self-import)."

# The test file to extend.
- file: packages/core/src/__tests__/config.test.ts
  why: "Vitest suite. resolveInitialValue describe is at line 438 (inside 'Initial Value Resolution' at line 437). resolveAllInitialValues describe at line 486."
  pattern: "Tests call resolveInitialValue(fieldName, fieldConfigObj, inputConfigObj?, record?, defaultValues?) positionally with `as InputConfig` casts on inputConfig. Assertions: .toBe(...) / .toBeUndefined() / .toBeNull() / .toEqual({...})."
  gotcha: "fieldConfig is typed `FieldConfig` (inferred from the object literal — NO `as` cast needed since S1 made defaultValue optional/unknown). inputConfig literals use `as InputConfig` because component is unknown. Match existing call shapes exactly."

# Input dependency #1 — the type surface (COMPLETE, verified).
- file: packages/core/src/types/config.ts
  section: FieldConfig interface, line 152 (defaultValue?: unknown)
  why: "Proves fieldConfig?.defaultValue is a valid type-level access — S1 added it after recordKey (line 140), before rules (line 186)."
  critical: "Read-only here. Do NOT edit types/config.ts in this task."

# Input dependency #2 — the helper (COMPLETE, verified).
- docfile: plan/006_223c8a76c909/P1M1T1S2/PRP.md
  why: "Defines resolveFieldOverType's exact signature/behavior. Confirms it is in defaults.ts (same file as resolveInitialValue) — so no import is needed."
  critical: "The helper uses `!== undefined` (not `??`). Calling it with (fieldConfig?.defaultValue, inputConfig?.defaultValue) yields T=unknown and returns the field value when set, else the type value."

# Parallel task — NO file overlap (safe).
- docfile: plan/006_223c8a76c909/P1M1T2S1/PRP.md
  why: "Touches ONLY packages/react/src/overlays.ts (ReactFieldConfig JSDoc). Does not touch defaults.ts or config.test.ts. Zero conflict."

# Validation tooling (root package.json).
- file: package.json
  section: scripts (test, typecheck, lint, format, format:check)
  why: "Exact commands for the validation loop."
- file: vitest.config.ts
  section: coverage thresholds (90/90/90/90)
  why: "Coverage gate enforced under `pnpm test` — new code must stay covered."
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/config/defaults.ts        # ← EDIT TARGET (resolveInitialValue Priority-3 block + JSDoc)
packages/core/src/config/index.ts           # barrel — NO EDIT (S3)
packages/core/src/index.ts                  # root barrel — NO EDIT (S3)
packages/core/src/__tests__/config.test.ts  # ← EDIT TARGET (add tests to resolveInitialValue + resolveAllInitialValues describes)
packages/core/src/types/config.ts           # FieldConfig.defaultValue (S1) — READ ONLY
vitest.config.ts                            # coverage gate 90/90/90/90
package.json                                # scripts: pnpm test/typecheck/lint/format:check
```

### Desired Codebase tree with files to be changed

```bash
packages/core/src/config/defaults.ts        # MODIFY — replace Priority-3 block + update JSDoc (4-tier)
packages/core/src/__tests__/config.test.ts  # MODIFY — add ~7 test cases (resolveInitialValue + resolveAllInitialValues)
# (No other files touched. resolveAllInitialValues body UNCHANGED — it delegates.)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: resolveFieldOverType lives in the SAME FILE (defaults.ts). Do NOT
// add an import for it — that would be a self-import and is unnecessary. Just
// call it directly: `resolveFieldOverType(fieldConfig?.defaultValue,
// inputConfig?.defaultValue)`.

// CRITICAL: do NOT reimplement the check inline. The whole point of §6.4.0 is
// that the `!== undefined` precedence rule lives in ONE place
// (resolveFieldOverType). Writing `if (fieldConfig?.defaultValue !== undefined)
// return fieldConfig.defaultValue; if (inputConfig?.defaultValue !== undefined)
// return inputConfig.defaultValue;` would WORK but violates the single-rule
// invariant and duplicates S2. CALL the helper.

// CRITICAL: the outer `if (resolvedDefault !== undefined) return resolvedDefault;`
// guard is REQUIRED. Without it, resolveInitialValue would return undefined at
// the end anyway — but keeping the explicit guard (matching the contract) makes
// the fall-through-to-undefined path identical to the old behavior and keeps
// the JSDoc's "return undefined when nothing set" contract literal.

// GOTCHA: keep the recordKey resolution (Priority 2) ABOVE the new Priority-3
// block. The new block is inserted in place of the OLD Priority-3 block — i.e.
// AFTER the `if (record && recordKey in record) {…}` block and BEFORE the
// final `return undefined;`. Do not reorder Priorities 1 and 2.

// GOTCHA: FieldConfig.defaultValue is `unknown`. resolveFieldOverType<T>
// infers T=unknown here, so the return is `unknown` — matching
// resolveInitialValue's `: unknown` return type. No type annotation needed on
// `resolvedDefault` (it is inferred). If you add one, use `unknown`.

// GOTCHA (test regression-safety): the 5 existing resolveInitialValue tests
// pass `fieldConfig = {}` (empty object) in 4 of 5 cases. `({} as FieldConfig)
// .defaultValue === undefined`, so resolveFieldOverType(undefined, ...) returns
// the type value — identical to old behavior. These tests MUST stay green
// unchanged. Verify by running them before/after.

// GOTCHA (prettier): defaults.ts JSDoc is prettier-managed. Write the updated
// priority list + example close to printWidth 80 and run `pnpm format` to
// normalize if `pnpm format:check` complains. Do not hand-fight prettier.

// SCOPE — do NOT touch:
#   • resolveFieldOverType (S2 — complete).
#   • resolveAllInitialValues BODY (delegates — contract explicitly says no
#     change needed; only ADD a test proving delegation picks up the tier).
#   • barrel exports (config/index.ts, src/index.ts — S3).
#   • packages/react/** (adapter runtime = P1.M3.*; overlays JSDoc = T2.S1).
#   • packages/core/src/types/config.ts (FieldConfig — S1, complete).
```

---

## Implementation Blueprint

### Data models and structure

No new data models. This task re-routes an existing priority block through an
existing helper. The exact replacement block (Priority 3 → Priority 3+4) is:

```typescript
  // Priority 3+4: Field-level default overrides type-level (§6.4.1, §6.4.0)
  const resolvedDefault = resolveFieldOverType(
    fieldConfig?.defaultValue,
    inputConfig?.defaultValue,
  );
  if (resolvedDefault !== undefined) {
    return resolvedDefault;
  }
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 0 (PRECHECK): confirm both input dependencies are present in code
  - RUN: rg -n 'export function resolveFieldOverType' packages/core/src/config/defaults.ts
    EXPECT: one match (S2 — the helper exists in the SAME file as resolveInitialValue).
  - RUN: rg -n 'defaultValue\?: unknown' packages/core/src/types/config.ts
    EXPECT: one match (S1 — the field exists on FieldConfig).
  - IF EITHER IS MISSING: STOP. This task depends on S1+S2; sequence after them.
    (At time of writing, both are verified present — see research/dependencies_verified.md.)

Task 1: MODIFY packages/core/src/config/defaults.ts — replace the Priority-3 block
  - LOCATE: the `resolveInitialValue` function (the JSDoc `/** Resolve the
    initial value for a field … */` precedes it; function signature is
    `export function resolveInitialValue(fieldName, fieldConfig?, inputConfig?,
    record?, defaultValues?): unknown`).
  - FIND the EXACT current block (match it for the edit):
        // Priority 3: Input type default value
        if (inputConfig?.defaultValue !== undefined) {
          return inputConfig.defaultValue;
        }
  - REPLACE with:
        // Priority 3+4: Field-level default overrides type-level (§6.4.1, §6.4.0)
        const resolvedDefault = resolveFieldOverType(
          fieldConfig?.defaultValue,
          inputConfig?.defaultValue,
        );
        if (resolvedDefault !== undefined) {
          return resolvedDefault;
        }
  - DO NOT:
      • Add any import for resolveFieldOverType (same-file call).
      • Reorder or touch the Priority-1 (defaultValues) or Priority-2 (record/
        recordKey) blocks.
      • Touch the trailing `return undefined;`.
      • Touch resolveAllInitialValues, resolveFieldOverType, or any other fn.
  - RESULT (the tail of resolveInitialValue after the edit):
        // Priority 1: Explicit default value for this field
        if (defaultValues && fieldName in defaultValues) {
          return defaultValues[fieldName];
        }
        // Priority 2: Record value (using recordKey if specified)
        const recordKey = fieldConfig?.recordKey ?? fieldName;
        if (record && recordKey in record) {
          return record[recordKey];
        }
        // Priority 3+4: Field-level default overrides type-level (§6.4.1, §6.4.0)
        const resolvedDefault = resolveFieldOverType(
          fieldConfig?.defaultValue,
          inputConfig?.defaultValue,
        );
        if (resolvedDefault !== undefined) {
          return resolvedDefault;
        }
        // No default - return undefined
        return undefined;

Task 2: MODIFY packages/core/src/config/defaults.ts — update the resolveInitialValue JSDoc
  - The JSDoc block sits directly above the `export function resolveInitialValue`
    signature. Make FOUR coordinated edits (all Mode A — docs ride with the work):
  - EDIT 2a — priority list (3-tier → 4-tier). FIND:
        * Priority order (highest to lowest):
        * 1. defaultValues[fieldName] (from Form props)
        * 2. record[recordKey] (using recordKey if specified, else fieldName)
        * 3. inputConfig.defaultValue (from input type definition)
    REPLACE with:
        * Priority order (highest to lowest):
        * 1. defaultValues[fieldName] (from Form props)
        * 2. record[recordKey] (using recordKey if specified, else fieldName)
        * 3. fieldConfig.defaultValue (per-instance default; §6.4.1, §13.1)
        * 4. inputConfig.defaultValue (from input type definition)
  - EDIT 2b — deviation-note chain recital. FIND (inside the G5 deviation note):
        * … it drives the full priority chain above (defaultValues →
        * record[recordKey] → inputConfig.defaultValue) from a single call. …
    REPLACE the chain fragment with the 4-step order:
        * … it drives the full priority chain above (defaultValues →
        * record[recordKey] → fieldConfig.defaultValue → inputConfig.defaultValue)
        * from a single call. …
    (Leave the rest of the deviation note — the signature superset explanation
    and "No code change is planned" — UNCHANGED. Only the chain recital changes.)
  - EDIT 2c — @param fieldConfig. FIND:
        * @param fieldConfig - Field configuration
    REPLACE with:
        * @param fieldConfig - Field configuration; `defaultValue` (when set)
        *   is the Priority-3 per-instance default (§6.4.1), honored for any
        *   value `!== undefined` (so null/false/0/"" are meaningful).
  - EDIT 2d — @example (add a field-level-default scenario). The existing
    @example has two scenarios ("Field with recordKey mapping" and "Field with
    explicit defaultValue"). APPEND a third scenario demonstrating the new
    Priority-3 tier, e.g.:
        *
        * // Field-level default wins over the type default (§6.4.1)
        * resolveInitialValue(
        *   'active',
        *   { type: 'switch', defaultValue: true }, // field default: true
        *   { defaultValue: false },                 // type default: false
        *   undefined,
        *   undefined,
        * )
        * // → true (field-level default honored; null/false/0/"" would also win)
    PLACE it after the second existing scenario, before the closing ` */ `.
  - DO NOT: rewrite the two existing examples, the @returns line, or the
    deviation-note's signature/PRD-§1.3.2 prose. Only the four deltas above.
  - RUN `pnpm format` after to normalize prettier wrapping; then `pnpm format:check`.

Task 3: MODIFY packages/core/src/__tests__/config.test.ts — add Priority-3 tests
  - LOCATE: `describe("resolveInitialValue", () => { … })` at line 438 (inside
    `describe("Initial Value Resolution")` at line 437). The block currently
    has 5 `it(...)` cases ending ~line 483.
  - ADD these new `it(...)` cases INSIDE the resolveInitialValue describe,
    AFTER the existing 5 (before the closing `});` of the describe). Match the
    existing call shape: `resolveInitialValue(name, fieldConfigObj,
    inputConfigObj? as InputConfig, record?, defaultValues?)`.
  - CASES:
      it("uses field-level defaultValue over the input-type default (Priority 3)")
        expect(
          resolveInitialValue(
            "active",
            { type: "switch", defaultValue: true },
            { defaultValue: false } as InputConfig,
          ),
        ).toBe(true);

      it("honors a null field-level default over the type default (§6.4.5)")
        expect(
          resolveInitialValue(
            "note",
            { type: "textField", defaultValue: null },
            { defaultValue: "fallback" } as InputConfig,
          ),
        ).toBeNull();

      it("honors a false field-level default (§6.4.5)")
        expect(
          resolveInitialValue(
            "flag",
            { type: "switch", defaultValue: false },
            { defaultValue: true } as InputConfig,
          ),
        ).toBe(false);

      it('honors a "" field-level default (§6.4.5)')
        expect(
          resolveInitialValue(
            "code",
            { type: "textField", defaultValue: "" },
            { defaultValue: "typeDefault" } as InputConfig,
          ),
        ).toBe("");

      it("falls through to the input-type default when fieldConfig.defaultValue is undefined")
        expect(
          resolveInitialValue(
            "name",
            { type: "textField" }, // no defaultValue
            { defaultValue: "typeDefault" } as InputConfig,
          ),
        ).toBe("typeDefault");

      it("still lets the record beat the field-level default (Priority 2 > 3)")
        expect(
          resolveInitialValue(
            "active",
            { type: "switch", defaultValue: true },
            { defaultValue: false } as InputConfig,
            { active: false }, // record supplies the field
          ),
        ).toBe(false);

      it("still lets defaultValues prop beat the field-level default (Priority 1 > 3)")
        expect(
          resolveInitialValue(
            "active",
            { type: "switch", defaultValue: true },
            { defaultValue: false } as InputConfig,
            undefined,
            { active: "fromProp" }, // defaultValues prop wins
          ),
        ).toBe("fromProp");
  - NOTE on the existing 5 tests: they pass `{}` or `{ recordKey }` as
    fieldConfig. Because `({}).defaultValue === undefined`, they exercise the
    fall-through path and REMAIN GREEN unchanged. Do not modify them.
  - FOLLOW pattern: positional args, `as InputConfig` on inputConfig literals
    (component is unknown), `expect(...).toBe/.toBeNull/.toEqual` assertions.
  - NAMING: `it("…")` sentence form, matching the existing block's style.

Task 4: MODIFY packages/core/src/__tests__/config.test.ts — add resolveAllInitialValues delegation proof
  - LOCATE: `describe("resolveAllInitialValues", () => { … })` at line 486.
  - ADD one case proving the new tier flows through delegation (no body change
    to resolveAllInitialValues itself — this is a regression net):
      it("picks up field-level defaultValue via resolveInitialValue delegation", () => {
        const inputs = {
          switch: { component: null, defaultValue: false } as InputConfig,
        };
        const fieldConfigs = {
          active: { type: "switch", defaultValue: true }, // field default on
          paused: { type: "switch" },                      // falls to type default
        };
        const values = resolveAllInitialValues(fieldConfigs, inputs);
        expect(values.active).toBe(true);  // field-level default
        expect(values.paused).toBe(false); // type-level default
      });
  - PLACE inside the resolveAllInitialValues describe, after its existing 2 cases.

Task 5: FORMAT + VALIDATE
  - RUN: pnpm format        # prettier --write (normalize JSDoc + test wrapping)
  - RUN: pnpm format:check  # confirm clean
  - RUN: pnpm typecheck     # tsc --build (core + react) — must be clean
  - RUN: pnpm lint          # eslint
  - RUN: pnpm test          # full suite + 90/90/90/90 coverage gate
  - IF format:check FAILS: re-run `pnpm format` and re-check (wrapping nit).
  - IF a test FAILS: read the assertion vs. the actual return; the most likely
    cause is a misplaced Priority block or a typo in a test literal.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — resolveInitialValue priority blocks are each a `// Priority N: …`
// comment followed by an `if (…) { return …; }` early-return. The new
// Priority-3+4 block follows the same shape: a `// Priority 3+4: …` comment,
// a `const resolvedDefault = resolveFieldOverType(…);`, and an
// `if (resolvedDefault !== undefined) { return resolvedDefault; }` guard.

// PATTERN — same-file helper call. resolveFieldOverType is defined ABOVE
// resolveInitialValue in defaults.ts (S2 placed it primitive-first). Calling
// it requires NO import. This is the intended design (one file, pure helpers).

// PATTERN — test call shape (from existing tests, line 441+):
//   resolveInitialValue(
//     "client",                              // fieldName
//     { recordKey: "selectedClient" },       // fieldConfig (FieldConfig literal)
//     { defaultValue: "input default" } as InputConfig,  // inputConfig
//     { selectedClient: "mapped value" },    // record
//   )
// New tests mirror this exactly; fieldConfig literals now set `defaultValue`
// (legal since S1 made it `unknown` & optional — no `as` cast needed).

// GOTCHA — the field-vs-type step uses resolveFieldOverType, which checks
// `!== undefined` (NOT truthiness, NOT `??`). A field-level `defaultValue:
// null` MUST win over a type-level `defaultValue: "x"`. The Task-3 cases
// "honors a null/false/0/\"\" field-level default" are the regression net for
// this — they fail if anyone reintroduces `??` or an inline truthiness check.

// GOTCHA — do NOT change resolveInitialValue's return type. It stays
// `: unknown`. resolveFieldOverType<unknown> returns `unknown`, so the
// `resolvedDefault` const is inferred as `unknown` — no annotation needed.

// GOTCHA — the JSDoc deviation note is ACCEPTED gap G5 and must NOT be
// removed; only its chain recital is updated to 4 steps. Keep the "No code
// change is planned." sentence (it refers to the SIGNATURE superset vs. PRD
// §1.3.2's condensed form, which is still accurate — the signature is
// unchanged by this task).
```

### Integration Points

```yaml
DATABASE:
  - none (pure function; no persistence, no migration).

CONFIG:
  - none (no settings/env vars).

ROUTES / EXPORTS:
  - resolveInitialValue is already exported from config/defaults.ts and
    re-exported via config/index.ts + src/index.ts (root barrel). NO change to
    any barrel (S3 owns resolveFieldOverType's barrel export; this task only
    CALLS it, in-file).
  - resolveAllInitialValues (same file) delegates to resolveInitialValue —
    picks up the new tier with zero body change.

DOWNSTREAM (awareness only — none are triggered by this task):
  - React Form.tsx → resolveAllInitialValues → resolveInitialValue. The Form
    initialization path now honors field-level defaultValue automatically.
    No adapter edit is part of THIS task (P1.M3.* owns parser/formatter/
    debounce/getSubmitField/valueField adapter wiring separately).
  - P1.M3.* resolution sites will also call resolveFieldOverType (the same
    helper) at their respective field-vs-type steps — this task establishes the
    canonical in-core usage pattern.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# From repo root. Type-check the core package (tsc --build). Note: core tsconfig
# EXCLUDES *.test.ts and __tests__/**, so this checks defaults.ts itself.
pnpm typecheck      # = tsc --build across packages/core + packages/react

# Lint + format-check.
pnpm lint
pnpm format:check

# If prettier flags the updated JSDoc or new tests, run:
#   pnpm prettier --write packages/core/src/config/defaults.ts packages/core/src/__tests__/config.test.ts

# Expected: ZERO errors. The only plausible TS error would be a malformed
# resolveFieldOverType call (wrong arg count) — read the message and fix.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Targeted (fastest feedback) — run just the config suite.
pnpm vitest run packages/core/src/__tests__/config.test.ts

# Run just the resolveInitialValue + resolveAllInitialValues cases:
pnpm vitest run packages/core/src/__tests__/config.test.ts -t "resolveInitialValue"
pnpm vitest run packages/core/src/__tests__/config.test.ts -t "resolveAllInitialValues"

# Full suite (enforces the 90% coverage gate).
pnpm test

# Coverage on the touched module (optional, sanity):
pnpm vitest run packages/core/src/__tests__/config.test.ts --coverage

# Expected:
#   - All 5 EXISTING resolveInitialValue tests pass (no regression).
#   - All 7 NEW resolveInitialValue tests pass (incl. the 4 §6.4.5 falsy cases).
#   - The new resolveAllInitialValues delegation test passes.
#   - 1085 + ~8 new tests pass, 5 skipped. Coverage gate 90/90/90/90 green
#     (the new resolveFieldOverType call adds a fully-covered branch: field-set
#      vs field-unset vs both-unset).
```

### Level 3: Integration Testing (System Validation)

```bash
# Confirm the core package builds (resolveInitialValue is an internal export
# consumed by the React adapter's Form initialization).
pnpm -r build
# Expected: build succeeds. No "cannot find name resolveFieldOverType" errors.

# Behavioral proof (the contract's OUTPUT clause) — a throwaway node/tsx snippet:
#   import { resolveInitialValue } from "./packages/core/src/config/defaults.ts";
#   console.log(resolveInitialValue("active", { type: "switch", defaultValue: true },
#                                    { defaultValue: false } as any));
#   // → true  (field-level default honored)
# (If tsx isn't wired, the vitest "uses field-level defaultValue" case is the
#  authoritative proof — it IS this assertion. Do NOT commit scratch files.)

# Grep proof the edit landed correctly:
rg -n 'Priority 3\+4|fieldConfig.defaultValue' packages/core/src/config/defaults.ts
# Expected: matches in the new comment + the resolveFieldOverType call arg.
rg -n 'fieldConfig.defaultValue \(per-instance' packages/core/src/config/defaults.ts
# Expected: one match — the updated JSDoc priority list.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# §6.4.5 semantics proof through the FULL priority chain (not just the helper).
# The Task-3 cases "honors a null/false/0/\"\" field-level default" are the
# regression net: they fail if anyone reintroduces `??` or truthiness at the
# resolveInitialValue level. Re-run them in isolation if anything looks off:
pnpm vitest run packages/core/src/__tests__/config.test.ts -t "field-level default"

# Cross-tier precedence proof — record & defaultValues still beat the field
# default (Priorities 1 & 2 unchanged):
pnpm vitest run packages/core/src/__tests__/config.test.ts -t "still lets"

# PRD §13.1 anchor check — confirm the priority order the JSDoc cites exists:
rg -n '### 13.1 Sources of Initial Values' PRD.md
# Expected: one match (the §13.1 heading). If absent, the PRD renumbered —
# update the JSDoc §13.1 reference to the current number.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` passes with zero errors.
- [ ] `pnpm test` passes (baseline 1085 + new tests; 5 skipped; no regressions).
- [ ] `pnpm lint` passes; `pnpm format:check` passes.
- [ ] 90/90/90/90 coverage gate still green (`pnpm test` enforces it).

### Feature Validation

- [ ] The Priority-3 inline block is **replaced** by a `resolveFieldOverType`
      call (not an inline reimplementation).
- [ ] `resolveFieldOverType` is called in-file (no import added).
- [ ] `record` (Priority 2) and `defaultValues` (Priority 1) blocks are
      UNCHANGED and still precede the new block.
- [ ] JSDoc priority list is 4-tier (defaultValues → record →
      fieldConfig.defaultValue → inputConfig.defaultValue).
- [ ] JSDoc deviation-note chain recital is updated to the 4-step order.
- [ ] `@param fieldConfig` mentions `defaultValue` as the Priority-3 source.
- [ ] `@example` includes a field-level-default scenario.
- [ ] New tests cover: field-default-wins, null/false/0/"" honored (§6.4.5),
      undefined-falls-through, record-still-wins, defaultValues-still-wins.
- [ ] New `resolveAllInitialValues` test proves delegation picks up the tier.
- [ ] All 5 existing `resolveInitialValue` tests still pass.

### Code Quality Validation

- [ ] Matches the file's `// Priority N:` block-comment + early-return pattern.
- [ ] No import added for `resolveFieldOverType` (same-file call).
- [ ] No `??` or truthiness check reintroduced (single-rule integrity held).
- [ ] `resolveAllInitialValues` body is UNCHANGED (delegation only).
- [ ] Barrel files (`config/index.ts`, `src/index.ts`) UNCHANGED (S3's scope).
- [ ] No adapter / overlay / types files touched.

### Documentation & Deployment

- [ ] Mode A docs ride with the work — JSDoc is self-documenting (priority list,
      deviation-note chain, `@param`, `@example` all reflect the 4-tier order).
- [ ] §6.4.1 / §13.1 / §6.4.0 / §6.4.5 anchors verified present in PRD.md.
- [ ] No new env vars / config / package.json `exports` map change.

---

## Anti-Patterns to Avoid

- ❌ **Do NOT reimplement the `!== undefined` check inline** in
  `resolveInitialValue`. The whole point of §6.4.0 is a single shared rule.
  Write `const resolvedDefault = resolveFieldOverType(fieldConfig?.defaultValue,
  inputConfig?.defaultValue);` — do NOT write a two-step `if field… if type…`.
- ❌ **Do NOT use `??`** anywhere in this change. `??` drops `null`/`false`/`0`/
  `""` — the precise opposite of §6.4.5. `resolveFieldOverType` already uses
  `!== undefined`; rely on it.
- ❌ **Do NOT add an import for `resolveFieldOverType`.** It is defined in the
  SAME file (`defaults.ts`) above `resolveInitialValue`. A self-import is both
  unnecessary and incorrect.
- ❌ **Do NOT touch `resolveAllInitialValues`'s body.** The contract is
  explicit: it delegates to `resolveInitialValue`, so it picks up the new tier
  automatically. Only ADD a test proving the delegation works.
- ❌ **Do NOT reorder Priorities 1 and 2.** The new block REPLACES the old
  Priority-3 block in place — after the record/recordKey block, before the
  final `return undefined;`.
- ❌ **Do NOT edit the barrel files** (`config/index.ts`, `src/index.ts`).
  `resolveFieldOverType`'s barrel export is S3's scope; this task only CALLS it.
- ❌ **Do NOT touch `resolveFieldOverType`** (S2 — complete) or
  `FieldConfig` (`types/config.ts`, S1 — complete). This task CONSUMES both.
- ❌ **Do NOT modify the 5 existing `resolveInitialValue` tests.** They pass
  `{}`/`{ recordKey }` as fieldConfig; with `defaultValue === undefined` they
  hit the fall-through path and stay green. Adding field-level cases is additive.
- ❌ **Do NOT expand scope to the React adapter** (`useField`, `changeField`,
  `transformValuesForSubmit`). Those are P1.M3.* — separate tasks that will
  reuse this same helper at their own field-vs-type sites.
- ❌ **Do NOT remove or rewrite the G5 deviation note.** It is an accepted
  gap-analysis note about the signature superset. Only its chain recital
  (the `defaultValues → record → typeDefault` fragment) is updated to 4 steps.

---

## Confidence Score

**10/10.** A single, surgical block replacement with verbatim contract text,
calling an already-landed helper in the same file, plus a focused JSDoc update
and additive tests. Both input dependencies (S1 type field, S2 helper) are
verified present in code; the parallel task (T2.S1) touches a disjoint file;
the existing 5 tests are regression-safe by construction (empty fieldConfig →
`undefined` → fall-through). The new tier's behavior is fully specified by
`resolveFieldOverType`'s existing, tested semantics. The only residual risk is
a prettier-wrapping nit on the JSDoc, which `pnpm format` resolves
deterministically.
