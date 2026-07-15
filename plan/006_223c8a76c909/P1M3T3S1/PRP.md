# PRP — P1.M3.T3.S1: Wire field-level `getSubmitField`/`valueField` via `resolveFieldOverType` in `transformValuesForSubmit`

**Parent plan**: `plan/006_223c8a76c909` — §6.4 Field-Level Overrides.
**Status**: React adapter runtime — submit-shape resolution. The last of the
six §6.4 levers to be wired at the adapter level (parser/formatter landed under
P1.M3.T1.S1; debounce under P1.M3.T2.S1 — both COMPLETE), following the core
helper (P1.M1.T1.S2 — COMPLETE) and the type surface (P1.M1.T1.S1 — COMPLETE).
A surgical change to the standalone `transformValuesForSubmit` function at the
bottom of `packages/react/src/components/Form.tsx` (L949–977): resolve the
**effective** `getSubmitField` and `valueField` via the shared
`resolveFieldOverType` helper (`fieldConfig.getSubmitField ?? inputConfig.getSubmitField`
semantically), and **collapse the `if (inputConfig) … else …` guard into a
single path** so a field-level override applies even when `inputConfig` is
undefined (per `prd_gaps.md` §6). When both field-level and type-level are
undefined, `transformFieldName`/`extractValueField` are already no-ops, so the
value passes through unchanged (`result[name] = value`) — the existing else-branch
behavior is preserved by construction. A **Mode A** JSDoc update on
`InputConfig.getSubmitField` and `InputConfig.valueField` in
`packages/core/src/types/config.ts` mentions the field-level override (§6.4.4)
and rides with the work.

> **NOTE — this task is SIMPLER than the debounce sibling (P1.M3.T2.S1).**
> `resolveFieldOverType` is **already imported** in Form.tsx (L26, added by the
> COMPLETED changeField task), and `transformValuesForSubmit` is a **standalone
> function** (not a `useCallback`) — so there is **no import change** and **no
> dependency-array change**. The only Form.tsx edit is restructuring the
> function body (collapse the guard + route the two specs through the helper).

---

## Goal

**Feature Goal**: Make `transformValuesForSubmit` honor
`fieldConfig.getSubmitField` / `fieldConfig.valueField` (set on the
`<Form config={...}>` prop for a field instance) when they are `!== undefined`,
falling back to `inputConfig.getSubmitField` / `inputConfig.valueField` (the
type-level values) — the §6.4.4 precedence `field ?? type`, implemented via the
single shared `resolveFieldOverType` helper (§6.4.0) so the `!== undefined` rule
lives in one place. Crucially, this resolution must apply **even when
`inputConfig` is undefined**: today the `if (inputConfig)` guard skips ALL
transforms for a field whose type isn't registered in `inputs`, so a field with
its own `getSubmitField`/`valueField` override (but no type-level InputConfig)
silently passes through untransformed. Collapsing the guard fixes that.

**Deliverable**:
1. A modified `packages/react/src/components/Form.tsx` `transformValuesForSubmit`
   (L949–977):
   - The `if (inputConfig) { … } else { result[name] = value; }` guard is
     **replaced by a single path** that resolves two effective specs via
     `resolveFieldOverType(fieldConfig?.getSubmitField, inputConfig?.getSubmitField)`
     and `resolveFieldOverType(fieldConfig?.valueField, inputConfig?.valueField)`,
     then calls `transformFieldName` / `extractValueField` with those effective
     specs unconditionally.
   - **No import change** (`resolveFieldOverType` already imported at L26).
   - **No dependency-array change** (standalone function, not a hook).
2. Updated JSDoc on `InputConfig.getSubmitField` and `InputConfig.valueField` in
   `packages/core/src/types/config.ts` (L92–96) mentioning the per-field override
   (§6.4.4) and the `!== undefined` field-wins rule (Mode A — docs ride with the work).
3. New tests proving: a `getSubmitField`/`valueField` set via `config[name]`
   (the `FieldConfig`) wins over the type-level specs; AND a field-level override
   applies even when its TYPE has no `InputConfig` (the guard-relaxation proof);
   PLUS regressions that field-undefined→type-applies and both-undefined→passthrough.

**Success Definition**:
1. A field whose `FieldConfig` sets `getSubmitField`/`valueField` submits under
   the field-level mapping even when its input TYPE also sets those specs (field
   wins).
2. A field whose `FieldConfig` sets `getSubmitField`/`valueField` but whose TYPE
   has NO `InputConfig` (inputConfig undefined) submits under the field-level
   mapping — NOT passed through untransformed (the new behavior unlocked by
   collapsing the guard).
3. When `fieldConfig.getSubmitField`/`valueField` are `undefined`, the type-level
   `inputConfig.getSubmitField`/`valueField` apply (no regression — existing Task 7
   transform test stays green).
4. When BOTH field-level and type-level are `undefined` (and/or `inputConfig` is
   undefined), the value passes through unchanged (`result[name] = value`) — no
   regression (existing Task 8 else-branch test stays green).
5. `resolveFieldOverType` is CALLED inside `transformValuesForSubmit` (not an
   inline `??` or truthiness check) — single-rule integrity (§6.4.0).
6. `pnpm test` passes (baseline + new tests green, 90/90/90/90 coverage gate);
   `pnpm typecheck`, `pnpm lint`, `pnpm format:check` clean.

---

## Why

PRD §6.4.4 requires per-instance `getSubmitField` / `valueField` overrides that
restore **read/write symmetry** with `recordKey` (read-side key mapping): a
field can now fully describe its own wire shape on BOTH read (record) and submit.
Without adapter wiring, a field that needs a DIFFERENT submit shape from its
type siblings (e.g. most `expandingAuto`/`autocomplete` fields submit `clientId`,
but one field submits `officeId`; one field whose complex value is extracted
from a different nested property at submit than its type default) has no
per-instance lever — it can only change the *type-level* spec, which affects
every field of that type. S1 added the fields to the `FieldConfig` type surface;
S2 added the shared precedence helper. **This task is the runtime wiring that
makes the field-level submit mapping actually take effect in
`transformValuesForSubmit`.**

- **Business value / user impact**: a single field can override its submit
  key/extracted property without affecting sibling fields of the same type, and
  — via the guard relaxation — a field can define a submit mapping even when its
  type carries no `InputConfig` at all. This is the user-visible payoff of §6.4.4:
  fine-grained, fully field-configurable submit shape.
- **Integration with existing features**: the submit pipeline (§10.3 Submit
  Pipeline / §5.2.5) is unchanged in shape — only the *which spec feeds
  `transformFieldName`/`extractValueField`* step changes, routed through
  `resolveFieldOverType`. The two helpers are already no-ops on `undefined`
  specs (verified in `transform/pipeline.ts`), so collapsing the guard is safe.
- **Single-rule integrity**: routing `transformValuesForSubmit`'s submit-spec
  resolution through `resolveFieldOverType` means the `!== undefined` precedence
  rule lives in exactly one place — the same helper the core `resolveInitialValue`
  path (P1.M2.T1.S1), the parser/formatter sites (P1.M3.T1.S1), and the
  `changeField` debounce site (P1.M3.T2.S1 — same Form.tsx file) all call.
- **Scope boundary**: this task edits ONLY the `transformValuesForSubmit`
  function body in `Form.tsx`, the JSDoc on `InputConfig.getSubmitField`/`valueField`,
  and adds tests. It does NOT touch `resolveFieldOverType` (done), `FieldConfig`
  (done), the import block (already has the helper — P1.M3.T2.S1 added it),
  `changeField`/debounce (done), or any barrel export (done in S3).

---

## What

In the standalone `transformValuesForSubmit` function (bottom of `Form.tsx`,
L949–977), **replace the `if (inputConfig) { … } else { result[name] = value; }`
block** with a single resolution path: compute
`effectiveGetSubmitField = resolveFieldOverType(fieldConfig?.getSubmitField, inputConfig?.getSubmitField)`
and `effectiveValueField = resolveFieldOverType(fieldConfig?.valueField, inputConfig?.valueField)`,
then unconditionally call `transformFieldName(name, effectiveGetSubmitField)` and
`extractValueField(value, effectiveValueField)` and assign to `result[submitName]`.
Because the two helpers are no-ops on `undefined`, the previous "else" pass-through
falls out naturally when both specs resolve to `undefined`.

Update the JSDoc on `InputConfig.getSubmitField` and `InputConfig.valueField`
in `packages/core/src/types/config.ts` (currently one-line each) to mention the
per-field override (§6.4.4), the `!== undefined` field-wins rule (§6.4.0), and the
read/write symmetry with `recordKey` (Mode A — docs ride with the work).

### Success Criteria

- [ ] `transformValuesForSubmit` resolves `effectiveGetSubmitField` and
      `effectiveValueField` via `resolveFieldOverType(fieldConfig?.…, inputConfig?.…)`.
- [ ] The `if (inputConfig) … else …` guard is REMOVED/collapsed into one path
      (no `else` pass-through branch remains — it falls out of the no-op helpers).
- [ ] `transformFieldName` and `extractValueField` are called with the
      *effective* (resolved) specs, unconditionally for every entry.
- [ ] No `??` / truthiness check is used at the resolution site (helper is CALLED).
- [ ] **No import change** (`resolveFieldOverType` already imported at Form.tsx L26).
- [ ] **No dependency-array change** (standalone function).
- [ ] JSDoc on `InputConfig.getSubmitField` and `InputConfig.valueField`
      documents the field-level override (§6.4.4), the `!== undefined` field-wins
      rule (§6.4.0), and read/write symmetry with `recordKey`.
- [ ] New tests: field-wins-over-type; field-applies-when-inputConfig-undefined
      (guard-relaxation proof); field-undefined-falls-back-to-type (regression).
      Existing Task 7 (type-applies) + Task 8 (else-branch passthrough) tests stay green.
- [ ] `pnpm test` passes; `pnpm typecheck`/`pnpm lint`/`pnpm format:check` clean;
      90/90/90/90 coverage gate green.

---

## All Needed Context

### Context Completeness Check

> _"If someone knew nothing about this codebase, would they have everything
> needed to implement this successfully?"_ — **YES.** This PRP names the exact
> file + function, quotes the exact current text of the function body (incl. the
> `if (inputConfig)` guard) AND its replacement verbatim, confirms the helper is
> ALREADY imported (so no import edit is needed), confirms the function is
> standalone (so no dep-array edit is needed), quotes the exact current
> `InputConfig.getSubmitField`/`valueField` JSDoc and gives the replacements,
> names the exact test file + describe-block conventions + the proven
> record+autoSave+sibling-toggle harness, and verifies both input dependencies
> (S1 type surface + S2 helper, exported from the core barrel + already imported
> by the completed changeField task) are present in code. The change is mechanical
> and localized.

### Documentation & References

```yaml
# PRD — authoritative source for the field??type precedence + single rule.
- docfile: PRD.md
  section: §6.4.4 getSubmitField / valueField (read/submit symmetry)
  why: "Defines `fieldConfig.getSubmitField ?? inputConfig.getSubmitField` and `fieldConfig.valueField ?? inputConfig.valueField`; cites read/write symmetry with recordKey."
  critical: "Precedence is field ?? type. getSubmitField transforms the field NAME for submission; valueField selects which property of a complex value to submit."
- docfile: PRD.md
  section: §6.4.0 (The precedence rule — single rule for all six) + §6.4.5 (Edge cases)
  why: "resolveFieldOverType encodes the `!== undefined` rule; §6.4.5 enumerates falsy-but-meaningful cases (null/false/0/\"\")."
  critical: "Do NOT reimplement with `??` or truthiness — CALL resolveFieldOverType. For getSubmitField/valueField `??` agrees, but single-rule integrity (§6.4.0) mandates the helper."
- docfile: PRD.md
  section: §5.2.5 Submission Flow / Value transformation for submission + §10.3 Submit Pipeline
  why: "Establishes the transformValuesForSubmit shape: iterate Object.entries(values), look up config[name] + inputs[type], apply getSubmitField rename + valueField extraction. The PRD's own pseudocode already uses `fieldConfig?.getSubmitField ?? inputConfig?.getSubmitField`."
  critical: "The PRD pseudocode (§5.2.5) shows field-level overrides feeding the SAME transformFieldName/extractValueField calls — exactly this task's target shape."

# The primary file being edited (React adapter).
- file: packages/react/src/components/Form.tsx
  section: transformValuesForSubmit standalone function (declared L949; body L951–977)
  why: "Home of the submit-spec resolution that must consume the field-level value. `config` (form's field configs) and `inputs` (provider inputs) are FUNCTION PARAMETERS, captured fresh on each call."
  pattern: "Standalone (non-hook) helper at the bottom of the file; called from the submit/auto-save path at L~502. No useCallback, no dependency array."
  gotcha: "Because it's a standalone function (NOT a useCallback), there is NO dependency-array edit — unlike the debounce sibling P1.M3.T2.S1. `config`/`inputs` are params."

# The Mode-A JSDoc edit target (core types).
- file: packages/core/src/types/config.ts
  section: InputConfig.valueField JSDoc (L92) + InputConfig.getSubmitField JSDoc (L95)
  why: "Current JSDoc is a ONE-LINE description each. Extend to mention the field-level override (§6.4.4) and the `!== undefined` rule (§6.4.0)."
  pattern: "Short `/** … */` JSDoc above each field. PRESERVE the existing one-liner's intent; add an override/precedence sentence."
  gotcha: "Do NOT change the field TYPES (`string` / `(fieldName: string) => string`) — only the JSDoc prose. The FieldConfig counterparts (L195–205, S1) ALREADY cite §6.4.4 — no change there."

# Input dependency #1 — the helper (COMPLETE, already imported in Form.tsx).
- file: packages/core/src/config/defaults.ts
  section: resolveFieldOverType (L30)
  why: "Defines the helper's exact signature/behavior: `resolveFieldOverType<T>(fieldVal, typeVal) => fieldVal !== undefined ? fieldVal : typeVal`."
  critical: "ALREADY exported from @formality-ui/core (index.ts L127, config/index.ts L15) AND ALREADY IMPORTED in Form.tsx (L26, added by the completed P1.M3.T2.S1 changeField task). NO import change and NO barrel work for this task."

# Input dependency #2 — the type surface (COMPLETE, S1).
- file: packages/core/src/types/config.ts
  section: FieldConfig.getSubmitField / FieldConfig.valueField (L195–205)
  why: "Proves `config[name].getSubmitField`/`.valueField` are valid typed accesses (S1 added them). React overlay: ReactFieldConfig extends FieldConfig, so config[name]?.getSubmitField/.valueField are typed."

# The no-op-on-undefined helpers (verified) — WHY the guard can collapse.
- file: packages/core/src/transform/pipeline.ts
  section: transformFieldName (no-ops when getSubmitField falsy) + extractValueField (no-ops when valueField falsy)
  why: "Proves that when BOTH effective specs resolve to undefined, the pipeline is a pure pass-through: `transformFieldName(name, undefined) === name` and `extractValueField(value, undefined) === value`, so `result[name] = value` — exactly the old else-branch behavior."
  critical: "This is WHY removing the `if (inputConfig)` guard is SAFE: the helpers already implement the no-op-on-undefined semantics, so there is no need for a separate else branch."

# Test harness to reuse.
- file: packages/react/src/__tests__/Form.coverage.test.tsx
  section: testInputs (L84–87) + inputsWithAutocomplete (L89–99); Task 7 describe (L454) "valueField/getSubmitField transform"; Task 8 describe (~L526) "transform else branch"
  why: "Proven harness for transformValuesForSubmit end-to-end: FormalityProvider inputs + <Form config={{...}} autoSave debounce={300} onSubmit record> + render ONE sibling <Field> + userEvent.click + vi.advanceTimersByTimeAsync + submitHandler assertions. The `client` field need NOT be rendered — it flows in via record→defaultValues→RHF state (see Task 7)."
  pattern: "`<FormalityProvider inputs={inputsWithAutocomplete}><Form config={{ client: { type: 'autocomplete' }, signed: { type: 'switch' } }} autoSave debounce={300} onSubmit={submitHandler} record={{ client: {...}, signed: true }}><Field name="signed"/></Form></FormalityProvider>`; `act + userEvent.click(toggle)`; `act + vi.advanceTimersByTimeAsync(400)`; `waitFor + expect(submitHandler).toHaveBeenCalledWith(objectContaining({ clientId: 5, signed: false }))`."
  gotcha: "To test the guard-relaxation case (inputConfig UNDEFINED but field-level override set), use a TYPE that is NOT in `inputs` (e.g. a custom `refPicker`) in config. Because `resolveAllInitialValues` still resolves the field's value from record (Priority 2, independent of inputConfig), the value IS in form state even for an unregistered type — so it flows into transformValuesForSubmit. Render a sibling `<Field>` (e.g. `signed`) to drive the autoSave."

# Architecture — confirms the site + the conceptual spec.
- docfile: plan/006_223c8a76c909/architecture/external_deps.md
  section: "getSubmitField/valueField (§6.4.4)" (L72–81)
  why: "Names the exact resolution site (`Form.tsx` transformValuesForSubmit) and the conceptual spec `config[name]?.getSubmitField ?? inputConfig?.getSubmitField`."
  critical: "The doc writes `??`; the IMPLEMENTATION must use `resolveFieldOverType` per the item description + §6.4.0 (behaviorally identical for getSubmitField/valueField, but single-rule integrity is mandatory)."
- docfile: plan/006_223c8a76c909/architecture/prd_gaps.md
  section: §6 React Form transformValuesForSubmit (L87–90)
  why: "Names the current code (`transformFieldName(name, inputConfig.getSubmitField)` / `extractValueField(value, inputConfig.valueField)`), the target (`resolveFieldOverType(fieldConfig?.getSubmitField, inputConfig?.getSubmitField)`), AND the guard relaxation requirement: 'the `if (inputConfig)` guard must be relaxed — a field-level override should apply even when inputConfig is undefined.'"
  critical: "This is the ONLY §6.4 site that needs a structural guard collapse (not just a value replacement) — because a field-level override must work even with no type-level InputConfig."
- docfile: plan/006_223c8a76c909/architecture/system_context.md
  section: L70–71 + L106–107
  why: "Confirms resolution = field ?? type, and that transformValuesForSubmit currently uses inputConfig.getSubmitField/valueField but not field-level overrides."

# Sibling tasks — NO file conflict.
- docfile: plan/006_223c8a76c909/P1M3T2S1/PRP.md
  why: "P1.M3.T2.S1 (changeField debounce — COMPLETE) ALREADY added the resolveFieldOverType import to Form.tsx (L26) and calls it in changeField (L393). This task reuses that import — NO import edit. Treat its output as a CONTRACT."
- docfile: plan/006_223c8a76c909/P1M3T1S1/PRP.md
  why: "P1.M3.T1.S1 (parser/formatter in useField.tsx — COMPLETE) edits a DISJOINT React file (useField.tsx) and a DISJOINT JSDoc region in config.ts (parser/formatter at L101–116 vs valueField/getSubmitField at L92–96). No merge conflict."

# Validation tooling (root package.json).
- file: package.json
  section: scripts (test→vitest run; typecheck→tsc --build; lint→eslint .; format→prettier --write .; format:check→prettier --check .; build→pnpm -r build)
  why: "Exact commands for the validation loop."
- file: vitest.config.ts
  section: coverage thresholds (90/90/90/90)
  why: "Coverage gate enforced under `pnpm test` — the transformValuesForSubmit body is covered by existing Task 7/8 tests + the new field-level tests."
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/components/Form.tsx        # ← EDIT (transformValuesForSubmit body only; import ALREADY present)
packages/react/src/__tests__/Form.coverage.test.tsx  # ← EDIT (add field-level override tests)
packages/core/src/types/config.ts             # ← EDIT (InputConfig.getSubmitField/valueField JSDoc only)
packages/core/src/config/defaults.ts          # resolveFieldOverType — READ ONLY (S2 complete)
packages/core/src/transform/pipeline.ts       # transformFieldName/extractValueField — READ ONLY (no-op-on-undefined, verified)
packages/core/src/index.ts                    # barrel — READ ONLY (resolveFieldOverType already exported, S3)
vitest.config.ts                              # coverage gate 90/90/90/90
package.json                                  # scripts: pnpm test/typecheck/lint/format:check
```

### Desired Codebase tree with files to be changed

```bash
packages/react/src/components/Form.tsx        # MODIFY — replace the `if (inputConfig){…}else{…}` block in
                                               #          transformValuesForSubmit (L949–977) with a single
                                               #          resolveFieldOverType-based path. NO import edit.
packages/react/src/__tests__/Form.coverage.test.tsx  # MODIFY — add ~3 tests (field-level override path) in a
                                                     #          new describe block.
packages/core/src/types/config.ts             # MODIFY — extend InputConfig.getSubmitField + .valueField
                                               #          JSDoc to mention §6.4.4 override + §6.4.0 rule.
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: resolveFieldOverType is ALREADY imported in Form.tsx (L26) — the
// COMPLETED changeField task (P1.M3.T2.S1) added it. Do NOT re-add the import,
// and do NOT assume it's missing. Verified: rg -n resolveFieldOverType Form.tsx
// → L26 (import) + L393 (changeField call). This task reuses that import.

// CRITICAL: transformValuesForSubmit is a STANDALONE function (bottom of
// Form.tsx, L949), NOT a useCallback. There is NO dependency array to edit.
// `config` and `inputs` are function PARAMETERS captured fresh on each call.
// (This is the key difference from the debounce sibling P1.M3.T2.S1, which had
// to add `config` to a useCallback dep array.)

// CRITICAL: do NOT reimplement the field??type check inline. Even though `??`
// is behaviorally identical for `(name)=>string` / `string` (the only meaningful
// override is a defined function/string; null/false/0/"" aren't valid specs
// here), §6.4.0 mandates the helper so the rule lives in one place. CALL it:
//   resolveFieldOverType(fieldConfig?.getSubmitField, inputConfig?.getSubmitField)

// CRITICAL: the `if (inputConfig) { … } else { result[name] = value; }` guard
// must be COLLAPSED into a single path, NOT merely extended. A field-level
// override must apply even when inputConfig is UNDEFINED (prd_gaps.md §6). The
// collapse is safe because transformFieldName/extractValueField are no-ops on
// undefined (verified in transform/pipeline.ts), so when both specs resolve to
// undefined the pipeline naturally yields `result[name] = value` (the old else
// branch). KEEP the `const fieldConfig = config[name]; const type = …; const
// inputConfig = inputs[type];` lines — only the if/else block is replaced.

// GOTCHA: `fieldConfig` can be undefined (an unconfigured name) — always use
// `fieldConfig?.getSubmitField` / `fieldConfig?.valueField`. Same for
// `inputConfig?.…` (inputConfig may be undefined when the type isn't registered).
// resolveFieldOverType handles undefined on either side.

// GOTCHA (prettier): Form.tsx + config.ts are prettier-managed. Run `pnpm format`
// after the edits and re-run `pnpm format:check` if it complains (JSDoc wrapping).

// SCOPE — do NOT touch:
#   • resolveFieldOverType / FieldConfig / barrel exports (all COMPLETE).
#   • The Form.tsx import block (resolveFieldOverType ALREADY imported, P1.M3.T2.S1).
#   • changeField / debounce resolution in Form.tsx (P1.M3.T2.S1 — complete).
#   • useField.tsx parser/formatter (P1.M3.T1.S1 — complete; disjoint file).
#   • resolveInitialValue field-level default (P1.M2.T1.S1 — complete).
#   • The transformFieldName / extractValueField helpers (correct as-is; no-op on undefined).
#   • The InputConfig.getSubmitField/valueField TYPE annotations (JSDoc only).
#   • The FieldConfig.getSubmitField/valueField JSDoc (already cites §6.4.4; no change).
#   • The InputConfig.parser/.formatter/.debounce JSDoc (other tasks' scope; disjoint regions).
```

---

## Implementation Blueprint

### Data models and structure

No new data models. This task threads the already-defined field-level
`getSubmitField`/`valueField` through an existing resolution site. The exact
replacement of the function body (the whole if/else block becomes one path):

**CURRENT** (Form.tsx L950–977):

```typescript
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
```

**TARGET** (collapse the guard; route specs through the helper):

```typescript
  const result: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(values)) {
    const fieldConfig = config[name];
    const type = fieldConfig?.type ?? "textField";
    const inputConfig = inputs[type];

    // Resolve the effective submit specs: a field-level override
    // (FieldConfig.getSubmitField/valueField, §6.4.4) wins when !== undefined,
    // otherwise the type-level spec. Routed through resolveFieldOverType so the
    // single field-over-type rule lives in one place (§6.4.0). This applies
    // even when inputConfig is undefined: a field with its own submit mapping
    // transforms independently of its type.
    const effectiveGetSubmitField = resolveFieldOverType(
      fieldConfig?.getSubmitField,
      inputConfig?.getSubmitField,
    );
    const effectiveValueField = resolveFieldOverType(
      fieldConfig?.valueField,
      inputConfig?.valueField,
    );

    // transformFieldName / extractValueField are no-ops when their spec is
    // undefined, so when BOTH field- and type-level are unset this naturally
    // yields result[name] = value (the former else-branch pass-through).
    const submitName = transformFieldName(name, effectiveGetSubmitField);
    const submitValue = extractValueField(value, effectiveValueField);

    result[submitName] = submitValue;
  }

  return result as Partial<T>;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 0 (PRECHECK): confirm both input dependencies + the already-present import
  - RUN: rg -n 'export function resolveFieldOverType' packages/core/src/config/defaults.ts
    EXPECT: one match (S2 helper exists at L30).
  - RUN: rg -n 'resolveFieldOverType' packages/react/src/components/Form.tsx
    EXPECT: TWO matches — L26 (the import, added by P1.M3.T2.S1) and L393 (the
    changeField call). The import is ALREADY present → NO import edit needed.
  - RUN: rg -n 'Submit-side value extraction' packages/core/src/types/config.ts
    EXPECT: one match (FieldConfig.valueField JSDoc, L195 — S1 added the field).
  - RUN: rg -n 'function transformValuesForSubmit' packages/react/src/components/Form.tsx
    EXPECT: one match (L949 — the edit target).
  - IF the import is MISSING (e.g. P1.M3.T2.S1 somehow reverted): STOP — it must
    land first. (It is verified present today.)

Task 1: MODIFY packages/react/src/components/Form.tsx — replace the transformValuesForSubmit body
  - LOCATE the standalone `function transformValuesForSubmit<T extends FieldValues>(…)`
    at L949–977 (bottom of the file, just before `export type { FormContextValue };`).
  - REPLACE the body's `if (inputConfig) { … } else { result[name] = value; }`
    block (L962–974) with the single-path resolution shown in the TARGET block
    above. Keep the `const fieldConfig = config[name]; const type = …; const
    inputConfig = inputs[type];` lines (L960–961) UNCHANGED. Keep the
    `const result = {};` + `for … of Object.entries(values)` + `return result`
    wrapper UNCHANGED.
  - DO NOT add an import — `resolveFieldOverType` is ALREADY imported (L26).
  - DO NOT add a dependency array — this is a standalone function, not a hook.

Task 2: MODIFY packages/core/src/types/config.ts — extend InputConfig.valueField + getSubmitField JSDoc
  - FIND (InputConfig interface, L92–96):
        /** For complex values (objects), which property contains the actual value */
        valueField?: string;

        /** Transform field name for submission (e.g., 'client' → 'clientId') */
        getSubmitField?: (fieldName: string) => string;
  - REPLACE with (add a field-override sentence each; preserve the one-liner intent;
    cite §6.4.4 + §6.4.0 + recordKey symmetry):
        /**
         * For complex values (objects), which property contains the actual value to submit.
         *
         * Per-field override via `FieldConfig.valueField` (§6.4.4); the field-level
         * value wins when `!== undefined`, otherwise this type-level value applies.
         * Resolved via `resolveFieldOverType` (§6.4.0), restoring read/write symmetry
         * with `recordKey`.
         */
        valueField?: string;

        /**
         * Transform the field name for submission (e.g. `'client' → 'clientId'`).
         *
         * Per-field override via `FieldConfig.getSubmitField` (§6.4.4); the
         * field-level value wins when `!== undefined`, otherwise this type-level
         * value applies. Resolved via `resolveFieldOverType` (§6.4.0), restoring
         * read/write symmetry with `recordKey`.
         */
        getSubmitField?: (fieldName: string) => string;
  - DO NOT change the field TYPES (`string` / `(fieldName: string) => string`) —
    only the JSDoc prose. Do NOT touch FieldConfig.getSubmitField/.valueField's
    JSDoc (L195–205, already cites §6.4.4). Do NOT touch InputConfig.parser/
    .formatter/.debounce JSDoc (other tasks' scope).

Task 3: MODIFY packages/react/src/__tests__/Form.coverage.test.tsx — add field-level override tests
  - ADD a new `describe("Form coverage (P1.M3.T3.S1) — field-level getSubmitField/valueField override", () => { … })`
    block as a sibling of the existing Task 7 ("valueField/getSubmitField transform")
    and Task 8 ("transform else branch") describes, before the file's final
    closing `});`. Reuse the module-level `testInputs`, `inputsWithAutocomplete`,
    `TestInput`, `TestSwitch`, and the per-test `submitHandler`/fake-timer setup.
  - FOLLOW the Task 7 harness EXACTLY: `<FormalityProvider inputs={…}><Form
    config={{…}} autoSave debounce={300} onSubmit={submitHandler} record={{…}}>
    <Field name="signed" /></Form></FormalityProvider>`; `act + vi.advanceTimersByTimeAsync(100)`;
    `act + userEvent.click(screen.getByTestId("signed"))`; `act + vi.advanceTimersByTimeAsync(400)`;
    `waitFor + expect(submitHandler).toHaveBeenCalledWith(objectContaining({…}))`.
  - CASES (adapt only the inputs/config/record/expected — see full verbatim bodies
    in `research/transform-site-and-dependencies.md`; the three essential cases):
      CASE A — field wins over type (§6.4.4):
        inputs = inputsWithAutocomplete (autocomplete: valueField "id",
                getSubmitField (k)=>`${k}Id`)
        config = { client: { type: "autocomplete",
                  valueField: "code", getSubmitField: (k)=>`${k}Code` },
                  signed: { type: "switch" } }
        record = { client: { id: 5, code: "ACME" }, signed: true }
        EXPECT submit contains { clientCode: "ACME" }  // FIELD's valueField "code"
                                          + FIELD's rename  — NOT { clientId: 5 }
      CASE B — field override applies when inputConfig is undefined
               (the guard-relaxation proof; prd_gaps.md §6):
        inputs = testInputs (NO "refPicker" entry → inputConfig undefined)
        config = { client: { type: "refPicker",
                  valueField: "id", getSubmitField: (k)=>`${k}Id` },
                  signed: { type: "switch" } }
        record = { client: { id: 7 }, signed: true }
        EXPECT submit contains { clientId: 7 }  // field-level transform applied
                                  even though inputConfig is undefined — NOT
                                  { client: { id: 7 } } (the old else-branch)
      CASE C — regression: field undefined falls back to type (existing behavior):
        inputs = inputsWithAutocomplete
        config = { client: { type: "autocomplete" }, signed: { type: "switch" } }
                  // NO field-level override
        record = { client: { id: 5, name: "Acme" }, signed: true }
        EXPECT submit contains { clientId: 5 }  // TYPE's transform applies
  - NOTE on existing tests: Task 7 (type-applies) and Task 8 (else-branch
    passthrough when inputConfig undefined AND no field override) BOTH still pass
    UNCHANGED. After the guard collapse, Task 8's field has no field-level
    override (fieldConfig?.getSubmitField → undefined) and no inputConfig
    (inputConfig?.getSubmitField → undefined) → resolveFieldOverType(undefined,
    undefined) → undefined → transformFieldName/extractValueField no-ops →
    result[name] = value. Do NOT modify Task 7/8 — the new describe is ADDITIVE.

Task 4: FORMAT + VALIDATE
  - RUN: pnpm format        # prettier --write (normalize JSDoc wrapping + tests)
  - RUN: pnpm format:check  # confirm clean
  - RUN: pnpm typecheck     # tsc --build (core + react) — must be clean
  - RUN: pnpm lint          # eslint . (no exhaustive-deps concern — standalone fn)
  - RUN: pnpm test          # full suite + 90/90/90/90 coverage gate
  - IF format:check FAILS: re-run `pnpm format` and re-check (JSDoc wrapping nit).
  - IF a test FAILS: read the assertion vs. actual submitHandler payload; the
    most likely cause is a valueField/getSubmitField typo or a config placed at
    the wrong level (type vs field).
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — effective-spec resolution via the shared helper. Identical shape to
// the debounce resolution in changeField (P1.M3.T2.S1) and the parser/formatter
// resolution in useField (P1.M3.T1.S1):
//   const effectiveGetSubmitField = resolveFieldOverType(
//     fieldConfig?.getSubmitField,   // field-level (instance)
//     inputConfig?.getSubmitField,   // type-level (InputConfig)
//   );
//   const effectiveValueField = resolveFieldOverType(
//     fieldConfig?.valueField,       // field-level (instance)
//     inputConfig?.valueField,       // type-level (InputConfig)
//   );
// `config[name]` is the ReactFieldConfig (or undefined for an unconfigured name);
// `config[name]?.getSubmitField` is `((fieldName: string) => string) | undefined`;
// `config[name]?.valueField` is `string | undefined`.

// PATTERN — the guard is COLLAPSED, not extended. resolveFieldOverType returns:
//   - fieldConfig?.getSubmitField / .valueField  when !== undefined
//   - else inputConfig?.getSubmitField / .valueField (or undefined)
//   - else undefined
// transformFieldName/extractValueField then no-op on undefined → passthrough.
// So there is exactly ONE assignment path: result[submitName] = submitValue.

// GOTCHA — there is NO useCallback here, so NO exhaustive-deps lint risk and NO
// dep-array edit. (Contrast: P1.M3.T2.S1 had to add `config` to a dep array.)
// transformValuesForSubmit(values, config, inputs) is a plain function.

// GOTCHA — the architecture doc (external_deps.md:76–77) and the PRD pseudocode
// (§5.2.5) write the conceptual spec as `config[name]?.getSubmitField ??
// inputConfig?.getSubmitField`. For getSubmitField/valueField `??` and
// resolveFieldOverType agree (the only meaningful override is a defined
// function/string). But the IMPLEMENTATION must CALL resolveFieldOverType —
// §6.4.0 single-rule integrity is non-negotiable, and the item description
// mandates it.

// GOTCHA — types/config.ts JSDoc edit is PROSE ONLY. The field types stay
// `string` and `(fieldName: string) => string`. Only the /** … */ blocks change.
```

### Integration Points

```yaml
DATABASE:
  - none (pure function change; no persistence, no migration).

CONFIG:
  - none (no settings/env vars).

ROUTES / EXPORTS:
  - none. resolveFieldOverType is already exported from @formality-ui/core (S3)
    AND already imported in Form.tsx (P1.M3.T2.S1). transformValuesForSubmit is
    an internal function with an UNCHANGED signature `(values, config, inputs) =>
    Partial<T>`; its only caller (~L502 in the submit/auto-save path) is unchanged.

DOWNSTREAM (awareness only — none are triggered by this task):
  - transformValuesForSubmit is called by the submit pipeline (manual submit via
    render-API handleSubmit + auto-save debouncedSubmit). The call signature is
    UNCHANGED. The only observable effect: a field whose config sets
    getSubmitField/valueField now submits under its own mapping, and a field with
    an override but no registered type now transforms (instead of passing through).
  - P1.M3.T2.S1 (changeField debounce — COMPLETE) already added the helper import
    to this SAME Form.tsx file; this task reuses it (no re-import).
  - P1.M3.T1.S1 (parser/formatter in useField — COMPLETE) edits a DISJOINT file
    (useField.tsx) and a DISJOINT JSDoc region in config.ts (parser/formatter at
    L101–116 vs valueField/getSubmitField at L92–96). No merge conflict.
  - P1.M4 (documentation sync — PLANNED) will verify README + cross-export JSDoc
    consistency; this task's config.ts JSDoc edits land first and ride with the work.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# From repo root. Type-check core + react (tsc --build). Catches a malformed
# resolveFieldOverType call (wrong arg count) or a JSDoc that broke the type.
pnpm typecheck

# Lint + format-check. (No exhaustive-deps concern — transformValuesForSubmit is
# a standalone function, not a hook.)
pnpm lint
pnpm format:check

# If prettier flags the new JSDoc wrapping / tests, run:
#   pnpm prettier --write packages/react/src/components/Form.tsx packages/core/src/types/config.ts packages/react/src/__tests__/Form.coverage.test.tsx

# Expected: ZERO errors. The only plausible TS error is a wrong-arity
# resolveFieldOverType(...) call or a stray edit to a type annotation; prettier
# may rewrap the JSDoc (resolved by `pnpm format`).
```

### Level 2: Unit Tests (Component Validation)

```bash
# Targeted (fastest feedback) — run just the Form coverage suite.
pnpm vitest run packages/react/src/__tests__/Form.coverage.test.tsx

# Run just the new field-level describe by name:
pnpm vitest run packages/react/src/__tests__/Form.coverage.test.tsx -t "field-level getSubmitField/valueField override"

# Full react suite (Form + Field + useField + integration).
pnpm vitest run packages/react/

# Full suite (enforces the 90% coverage gate across the workspace).
pnpm test

# Expected:
#   - ALL existing Form.coverage tests pass — incl. Task 7 (type-applies) and
#     Task 8 (else-branch passthrough). After the guard collapse, Task 8's field
#     has no override + no inputConfig → resolveFieldOverType(undefined, undefined)
#     → undefined → no-op helpers → result[name] = value (identical behavior).
#   - The 3 NEW field-level tests pass (field-wins-over-type,
#     field-applies-when-inputConfig-undefined, field-undefined-falls-back-to-type).
#   - Full suite green; 90/90/90/90 coverage gate green (the transformValuesForSubmit
#     body is covered by existing Task 7/8 + the new field-level tests).
```

### Level 3: Integration Testing (System Validation)

```bash
# Confirm the react package builds (transformValuesForSubmit is exercised by the
# submit path at runtime).
pnpm -r build
# Expected: build succeeds. No "cannot find name resolveFieldOverType" errors
# (it's already imported) and no "resolveFieldOverType is not exported" errors.

# Grep proof the edits landed correctly:
rg -n 'resolveFieldOverType' packages/react/src/components/Form.tsx
# Expected: THREE matches now — L26 (import) + L393 (changeField) + the new
# transformValuesForSubmit call site (the effectiveGetSubmitField call). If a
# FOURTH appears, check whether effectiveValueField was split onto a separate
# line that rg counts separately (acceptable).

rg -n 'if \(inputConfig\)' packages/react/src/components/Form.tsx
# Expected: ZERO matches inside transformValuesForSubmit (the guard was
# collapsed). If any remain, the guard was not fully removed — re-check Task 1.

rg -n 'effectiveGetSubmitField|effectiveValueField' packages/react/src/components/Form.tsx
# Expected: both names present (each declared once + used once) inside
# transformValuesForSubmit.

rg -n 'Per-field override' packages/core/src/types/config.ts
# Expected: TWO matches — the InputConfig.valueField JSDoc and the
# InputConfig.getSubmitField JSDoc. (FieldConfig counterparts use different
# phrasing — "Overrides the input type's …" — so no false collision.)
```

### Level 4: Creative & Domain-Specific Validation

```bash
# §6.4.4 / §6.4.0 anchor check — confirm the sections the JSDoc cites exist:
rg -n '#### 6.4.4 getSubmitField / valueField|#### 6.4.0 The precedence rule' PRD.md
# Expected: two matches. If absent, the PRD renumbered — update the §refs.

# §5.2.5 pseudocode check — the PRD's own transformValuesForSubmit pseudocode
# already uses fieldConfig?.getSubmitField ?? inputConfig?.getSubmitField; confirm
# it's present (it is the spec this implementation matches):
rg -n 'fieldConfig\?\.getSubmitField \?\? inputConfig\?\.getSubmitField' PRD.md
# Expected: one+ match (the §5.2.5 pseudocode).

# Guard-relaxation proof (CASE B) is the domain-specific validation here: it
# proves a field-level override now applies even when the field's TYPE is absent
# from provider `inputs` — the exact behavior prd_gaps.md §6 required. No extra
# command beyond the CASE B test.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` passes with zero errors.
- [ ] `pnpm test` passes (baseline + 3 new tests; no regressions — Task 7 + Task 8 stay green).
- [ ] `pnpm lint` passes; `pnpm format:check` passes.
- [ ] 90/90/90/90 coverage gate still green (`pnpm test` enforces it).

### Feature Validation

- [ ] `transformValuesForSubmit` resolves `effectiveGetSubmitField` and
      `effectiveValueField` via `resolveFieldOverType(fieldConfig?.…, inputConfig?.…)`.
- [ ] The `if (inputConfig) … else …` guard is COLLAPSED into one path
      (no `else result[name] = value` branch remains — it falls out of the no-op helpers).
- [ ] A field-level override applies even when `inputConfig` is undefined (CASE B green).
- [ ] A field-level override wins over the type-level spec when both are set (CASE A green).
- [ ] Field-undefined falls back to type-level (CASE C / Task 7 green).
- [ ] JSDoc on `InputConfig.getSubmitField` + `InputConfig.valueField` documents
      §6.4.4 override + §6.4.0 `!== undefined` rule + recordKey symmetry.

### Code Quality Validation

- [ ] No `??` / truthiness check reintroduced at the resolution site (helper is CALLED — single rule per §6.4.0).
- [ ] No import edit (helper ALREADY imported at Form.tsx L26).
- [ ] No dependency-array edit (standalone function).
- [ ] `InputConfig.getSubmitField`/`valueField` TYPE annotations unchanged (JSDoc only).
- [ ] The `const fieldConfig`/`const type`/`const inputConfig` lookup lines + the function signature are unchanged.

### Documentation & Deployment

- [ ] Mode A docs ride with the work — `InputConfig.getSubmitField`/`valueField`
      JSDoc self-documents the field-level override + `!== undefined` field-wins rule.
- [ ] §6.4.4 / §6.4.0 / §5.2.5 anchors verified present in PRD.md.
- [ ] No new env vars / config / package.json `exports` map change.

---

## Anti-Patterns to Avoid

- ❌ **Do NOT reimplement the field??type check inline** (no
  `config[name]?.getSubmitField ?? inputConfig?.getSubmitField`, no `if field… if type…`).
  The architecture doc + PRD §5.2.5 pseudocode write `??`, but the item
  description + §6.4.0 mandate CALLING `resolveFieldOverType`. Single rule, one place.
- ❌ **Do NOT add a new import for `resolveFieldOverType`.** It is ALREADY imported
  in Form.tsx (L26, added by the COMPLETED P1.M3.T2.S1 changeField task). Re-adding
  it causes a duplicate-import lint/TS error.
- ❌ **Do NOT touch the import block at all.** This task makes NO import change.
- ❌ **Do NOT add a dependency array or treat `transformValuesForSubmit` as a hook.**
  It is a standalone function; `config`/`inputs` are parameters, not closure deps.
- ❌ **Do NOT preserve the `if (inputConfig)` guard** and merely swap the inner
  resolution. That would leave field-level overrides INERT whenever a field's TYPE
  has no `InputConfig` (inputConfig undefined) — exactly the gap prd_gaps.md §6
  calls out. The guard must be COLLAPSED into a single path.
- ❌ **Do NOT remove the `const fieldConfig = config[name]; const type = …; const
  inputConfig = inputs[type];` lookup lines.** Only the if/else block is replaced;
  the lookups stay (they feed the helper's second argument).
- ❌ **Do NOT touch `changeField` / debounce** in Form.tsx (P1.M3.T2.S1 — complete).
- ❌ **Do NOT touch `useField.tsx` / parser / formatter** (P1.M3.T1.S1 — complete; disjoint file).
- ❌ **Do NOT touch the `transformFieldName` / `extractValueField` helpers.** They
  are correct (no-op on undefined); changing them would break the no-op guarantee
  that makes the guard collapse safe.
- ❌ **Do NOT modify the `InputConfig.getSubmitField`/`valueField` TYPE annotations**
  (`string` / `(fieldName: string) => string`). Only the JSDoc prose changes. Do NOT
  touch `FieldConfig.getSubmitField`/`valueField` JSDoc either (already cites §6.4.4).
- ❌ **Do NOT modify the existing Task 7 / Task 8 Form.coverage tests.** With no
  field-level override (Task 7) or no override + no inputConfig (Task 8),
  `resolveFieldOverType(undefined, inputConfig?.…)` returns `inputConfig?.…`
  (or undefined) → the helpers behave identically → both stay green unchanged.
- ❌ **Do NOT expand scope to `resolveFieldOverType` / `FieldConfig` / barrel files**
  (all COMPLETE). This task CONSUMES them.

---

## Confidence Score

**10/10.** A surgical, mechanical wiring of an already-landed, already-exported,
already-imported helper into the body of a single standalone function, with the
exact current text of that body + the exact replacement text quoted for matching,
a prose-only JSDoc update with the exact before/after text, and additive tests
mirroring the proven `Form.coverage.test.tsx` Task 7 record+autoSave+sibling-toggle
harness. Both input dependencies (S1 type surface + S2 helper) are verified
present in code; the helper import is verified ALREADY present in Form.tsx (so no
import edit); the function is verified standalone (so no dep-array edit); the two
transform helpers are verified no-op-on-undefined (so the guard collapse is
provably behavior-preserving for the else-branch regression). The two sibling
adapter tasks (P1.M3.T1.S1 parser/formatter, P1.M3.T2.S1 debounce) are COMPLETE
and touch disjoint files / disjoint JSDoc regions (no merge conflict). The only
residual risk is a prettier JSDoc-wrapping nit, which `pnpm format` resolves
deterministically.
