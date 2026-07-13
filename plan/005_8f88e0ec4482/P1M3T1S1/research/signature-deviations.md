# P1.M3.T1.S1 — Core API Signature Deviations (research)

> Field guide for the JSDoc-only task documenting three accepted core-API
> signature deviations (gap_analysis.md G4–G5; PRD §1.3.2). Every fact below
> was read directly from the working tree. **Read this BEFORE editing** — it
> tells you which function gets a NEW JSDoc vs. an AUGMENTED one, and gives the
> exact rationale text.

---

## 0. Headline: this is a Mode A, JSDoc-only, no-behavioral-change task

- **No code logic changes. No signature changes. No test changes. No new tests.**
- The deliverable is JSDoc on exactly THREE functions in THREE files:
  1. `packages/core/src/conditions/evaluate.ts` → `evaluateConditions`
  2. `packages/core/src/config/defaults.ts` → `resolveInitialValue`
  3. `packages/core/src/labels/resolve.ts` → `resolveLabel`
- Validation = `pnpm typecheck` + `pnpm lint` + `pnpm test` all green (no
  behavioral change, so the suite is unaffected). The only "new" check is that
  the JSDoc renders (no broken `{@link}`).

---

## 1. Per-function state — NEW vs. AUGMENT (CRITICAL distinction)

| Function | Current JSDoc? | Action | PRD §1.3.2 table form | Actual implemented form |
|---|---|---|---|---|
| `evaluateConditions` | **NONE** on the function (only a 2-line stub on the `EvaluateConditionsInput` interface) | **ADD a full function-level JSDoc block** | `evaluateConditions(conditions, state)` | `evaluateConditions(input: EvaluateConditionsInput)` — single object arg `{ conditions, fieldValues, fieldStates?, record?, props? }` |
| `resolveInitialValue` | **YES** — detailed (priority list + `@param` + `@example`) | **AUGMENT** — insert a deviation-note paragraph; DO NOT delete existing content | `resolveInitialValue(record, config, inputConfig)` | `resolveInitialValue(fieldName, fieldConfig?, inputConfig?, record?, defaultValues?)` |
| `resolveLabel` | **YES** — detailed (priority list + `@param`) | **AUGMENT** — insert a deviation-note paragraph; DO NOT delete existing content | `resolveLabel(config, fieldName)` | `resolveLabel(fieldName, fieldConfig?, evaluatedSelectProps?, componentProps?)` |

> The biggest implementation error would be (a) rewriting/deleting the existing
> `resolveInitialValue` / `resolveLabel` JSDoc, or (b) adding a JSDoc to
> `evaluateConditions` that duplicates or contradicts the `EvaluateConditionsInput`
> interface JSDoc. This table prevents both.

---

## 2. The three deviations (source-of-truth)

### 2a. `evaluateConditions` — object-arg form (G4)

- **PRD §1.3.2 TABLE text** (h4.1, the "Key Exports" table): lists
  `evaluateConditions(conditions, state)`.
- **PRD §1.3.2 EXAMPLE code** (same section, the fenced block): defines
  `interface EvaluateConditionsInput { conditions; fieldValues; record; props? }`
  and `function evaluateConditions(input: EvaluateConditionsInput)`.
- **Implemented** (`packages/core/src/conditions/evaluate.ts`):
  `export function evaluateConditions(input: EvaluateConditionsInput)` where
  `EvaluateConditionsInput = { conditions, fieldValues, fieldStates?, record?, props? }`
  (the `fieldStates?` field is an additive enhancement for state-based matchers
  like `isValid`/`isDisabled`).
- **Conclusion:** the implementation matches the PRD's own example code; the
  table text is the simplified/stale representation. The object-arg form is the
  stable public contract.
- **Consumers (verified):**
  - `packages/react/src/hooks/useConditions.ts:208` and `:307` — `evaluateConditions({...})`
  - `packages/react/src/hooks/useFieldDisabledState.ts:165` — `evaluateConditions({...})`
  - `EvaluateConditionsInput` + `FieldStateInput` are exported as types from the
    core root barrel (`packages/core/src/index.ts:61`) and the conditions barrel
    (`packages/core/src/conditions/index.ts:3`).

### 2b. `resolveInitialValue` — richer superset (G5)

- **PRD §1.3.2 TABLE:** `resolveInitialValue(record, config, inputConfig)`.
- **Implemented** (`packages/core/src/config/defaults.ts`):
  `resolveInitialValue(fieldName, fieldConfig?, inputConfig?, record?, defaultValues?): unknown`
- **Why the deviation:** the implemented signature drives the full 3-priority
  chain in one call — `defaultValues[fieldName]` → `record[recordKey]` →
  `inputConfig.defaultValue` (see the existing JSDoc priority list). That requires
  `fieldName` first (the natural key), plus `defaultValues`, which the PRD literal
  form omits.
- **Consumers (verified):** exercised by `packages/core/src/__tests__/config.test.ts`
  (the `resolveInitialValue` describe block, ~L284–328) and by
  `resolveAllInitialValues` (same file). Exported from the core root barrel
  (`index.ts:126`). It is an internal API consumed by the framework adapters /
  resolver pipeline, not a simplified end-user entry point.

### 2c. `resolveLabel` — richer superset (G5)

- **PRD §1.3.2 TABLE:** `resolveLabel(config, fieldName)`.
- **Implemented** (`packages/core/src/labels/resolve.ts`):
  `resolveLabel(fieldName, fieldConfig?, evaluatedSelectProps?, componentProps?): string`
- **Why the deviation:** the implemented signature resolves the full 6-source
  label priority chain in one call (component prop → `fieldConfig.props.label` →
  evaluated `selectProps.label` → `fieldConfig.label` → `fieldConfig.title` →
  `humanizeLabel(fieldName)`). That requires the pre-evaluated `selectProps` and
  the JSX `componentProps`, which the PRD literal form omits.
- **Consumers (verified):** `packages/react/src/components/Field.tsx:390` —
  `resolveLabel(name, fieldConfig, fieldSelectProps, restProps)` — exactly the
  4-arg form. Exported from the core root barrel (`index.ts:138`).

---

## 3. Concrete suggested JSDoc wording (drop-in, accurate)

> These are *suggestions* the implementer may adopt verbatim or lightly edit.
> They were written against the verified consumers in §2. Keep the tone/structure
> consistent with neighboring JSDoc in each file (prose paragraphs, `@param`,
> `@returns`, `{@link}`).

### 3a. `evaluateConditions` — ADD a full function-level block immediately above `export function evaluateConditions(...)`

```
/**
 * Evaluate an array of conditions against the current form state and return the
 * cumulative disabled / visible / setValue outcome (PRD §7.1, §7.7).
 *
 * **Signature — object-arg form.** Takes a single {@link EvaluateConditionsInput}
 * object (`{ conditions, fieldValues, fieldStates?, record?, props? }`) rather
 * than positional `(conditions, state)` arguments.
 *
 * **PRD deviation note (accepted, gap_analysis G4).** PRD §1.3.2's *table*
 * summarizes this export as `evaluateConditions(conditions, state)`, but PRD
 * §1.3.2's own *example code* defines and uses the identical
 * {@link EvaluateConditionsInput} object-arg form implemented here. The table
 * text is a simplified representation; the object-arg form is the actual, stable
 * contract and is the shape every framework adapter passes (see e.g.
 * `@formality-ui/react`'s `useConditions`). No code change is planned.
 *
 * @param input - {@link EvaluateConditionsInput}
 * @returns {@link ConditionResult} — cumulative `disabled` (OR logic),
 *   `visible` (AND logic), `setValue` (last matching condition wins), plus
 *   per-action `has*Condition` flags.
 */
```

### 3b. `resolveInitialValue` — AUGMENT the existing block (insert the deviation paragraph after the priority list, before `@param fieldName`)

```
 * **PRD deviation note (accepted, gap_analysis G5).** PRD §1.3.2's table
 * summarizes this export as `resolveInitialValue(record, config, inputConfig)`.
 * The implemented signature is a richer superset —
 * `(fieldName, fieldConfig?, inputConfig?, record?, defaultValues?)` — because
 * it drives the full priority chain above (defaultValues → record[recordKey] →
 * inputConfig.defaultValue) from a single call. This is an internal API
 * consumed by the framework adapters and by {@link resolveAllInitialValues},
 * not a simplified end-user entry point; the PRD literal form is a condensed
 * representation. No code change is planned.
```

### 3c. `resolveLabel` — AUGMENT the existing block (insert the deviation paragraph after the priority list, before `@param fieldName`)

```
 * **PRD deviation note (accepted, gap_analysis G5).** PRD §1.3.2's table
 * summarizes this export as `resolveLabel(config, fieldName)`. The implemented
 * signature is a richer superset —
 * `(fieldName, fieldConfig?, evaluatedSelectProps?, componentProps?)` — because
 * it resolves the full 6-source priority chain above in one call, which
 * requires the pre-evaluated `selectProps` and the JSX `componentProps`. This
 * is an internal API consumed by the framework adapters (e.g.
 * `@formality-ui/react`'s `Field` calls
 * `resolveLabel(name, fieldConfig, fieldSelectProps, restProps)`), not a
 * simplified end-user entry point; the PRD literal form is a condensed
 * representation. No code change is planned.
```

---

## 4. Sibling boundaries (anti-overlap)

| Sibling | Owns | Overlap with this task? |
|---|---|---|
| `P1.M2.T2.S1` (parallel, in flight) | `config/merge.ts` (mergeConfigs), `config/index.ts`, root `index.ts`, `config.test.ts` | **NONE** — this task touches `conditions/evaluate.ts`, `config/defaults.ts`, `labels/resolve.ts` (different files; only JSDoc) |
| `P1.M2.T1.S1` (done) | `validation/validate.ts` (validate) | NONE |
| `P1.M1.T1.S1/S2` (done/planned) | `config/ordering.ts` move | NONE (touches `labels/resolve.ts` *re-export tail* only, not the `resolveLabel` JSDoc region — but coordinate: see gotcha) |

> **Coordination gotcha with P1.M1.T1:** G1 moves the ordering functions out of
> `labels/resolve.ts` into `config/ordering.ts`, leaving a re-export stub at the
> tail of `resolve.ts`. This task edits the `resolveLabel` JSDoc higher up in the
> same file. The two edits do not overlap (different regions), but if P1.M1.T1
> lands first, confirm the `resolveLabel` function + its JSDoc are still at the
> expected location before editing. Use `grep -n "export function resolveLabel"`
> to locate it regardless of ordering-move state.

---

## 5. Validation harness (for the implementer)

```bash
# 1. Confirm only the 3 target files changed, and only JSDoc (no signature/logic):
git diff --stat
# Expected: conditions/evaluate.ts, config/defaults.ts, labels/resolve.ts ONLY.
git diff packages/core/src/conditions/evaluate.ts packages/core/src/config/defaults.ts packages/core/src/labels/resolve.ts
# Expected: only /** ... */ block changes; NO changes to function signatures,
# parameter lists, return types, or body logic.

# 2. No behavioral change → suite unaffected:
pnpm --filter @formality-ui/core build
pnpm typecheck
pnpm test
pnpm lint
# Expected: all green; test count identical to pre-task.

# 3. JSDoc {@link} targets resolve (EvaluateConditionsInput, ConditionResult,
#    resolveAllInitialValues exist):
grep -rn "export interface EvaluateConditionsInput\|export interface ConditionResult\|export function resolveAllInitialValues" packages/core/src/

# 4. evaluateConditions now HAS a function-level JSDoc; the other two STILL have
#    their existing @param/@example (augmented, not deleted):
awk '/^export function evaluateConditions/{print NR": "$0}' packages/core/src/conditions/evaluate.ts
grep -n "@param fieldName" packages/core/src/config/defaults.ts packages/core/src/labels/resolve.ts
# Expected: evaluateConditions JSDoc present directly above it; @param fieldName
# still present in both defaults.ts and resolve.ts.
```
