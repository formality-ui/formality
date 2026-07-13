name: "P1.M3.T1.S1 — Add deviation documentation to affected core functions"
description: |

---

## Goal

**Feature Goal**: Document three accepted core-API signature deviations
(gap_analysis.md **G4** and **G5**) as JSDoc on the affected functions, so the
gap between the PRD §1.3.2 *table* text (simplified) and the *implemented*
signatures (richer supersets) is explained in code. This closes the last two
doc-only gaps in the v1.0 spec-compliance audit with **zero behavioral change**.

**Deliverable**: Updated JSDoc on exactly three functions in three files:
1. `packages/core/src/conditions/evaluate.ts` → **ADD** a function-level JSDoc
   block to `evaluateConditions(input: EvaluateConditionsInput)` explaining the
   object-arg form matches PRD §1.3.2's own example code (the table's
   `(conditions, state)` is the stale/simplified text). [G4]
2. `packages/core/src/config/defaults.ts` → **AUGMENT** the existing
   `resolveInitialValue` JSDoc with a deviation-note paragraph (implemented
   signature is a richer superset of PRD's `resolveInitialValue(record, config,
   inputConfig)`). [G5]
3. `packages/core/src/labels/resolve.ts` → **AUGMENT** the existing
   `resolveLabel` JSDoc with a deviation-note paragraph (implemented signature
   is a richer superset of PRD's `resolveLabel(config, fieldName)`). [G5]

**Success Definition**:
- All three functions carry a JSDoc deviation note that (a) states the actual
  signature, (b) names it a superset of the PRD simplified form, (c) explains
  WHY the deviation exists (internal API consumed by the react adapter's
  priority chain / object-arg pattern), and (d) cites the gap_analysis ID.
- `evaluateConditions` gains a function-level JSDoc it currently lacks; the
  existing `resolveInitialValue` / `resolveLabel` JSDoc (priority lists,
  `@param`, `@example`) is **preserved** — only a deviation paragraph is added.
- **No signature, logic, test, or barrel changes.** `pnpm --filter
  @formality-ui/core build` + `pnpm typecheck` + `pnpm test` + `pnpm lint` all
  green with an unchanged test count.
- `git diff --stat` touches exactly three files (the source files above).

## User Persona (if applicable)

**Target User**: Core-library maintainer / future Vue/Svelte adapter author
reading core source and comparing against PRD §1.3.2.

**Use Case**: A maintainer notices `evaluateConditions` takes one object arg
while the PRD table says `(conditions, state)`, and wants the in-code rationale
rather than hunting through plan docs.

**User Journey**: Open `evaluate.ts` / `defaults.ts` / `resolve.ts` → read the
JSDoc → immediately understand the deviation is accepted, intentional, and why
(richer superset for the adapter priority chain; object-arg form matches the
PRD's own example code).

**Pain Points Addressed**: Silent divergence between PRD table text and code;
maintainers unsure whether the implemented signature is a bug or intended.

## Why

- **Spec-compliance reconciliation (PRD §1.3.2).** gap_analysis.md G4/G5 are
  classified "API — Low / doc-only": "No code change needed — document as
  accepted deviation." This task IS that documentation.
- **Closes the doc-only tail of P1.M3.** G1 (ordering move), G2 (validate),
  G3 (mergeConfigs) are code/structural; G4/G5 are pure docs. This task retires
  the last two gaps in the audit's "document the decision" bucket.
- **Accuracy over literalism.** The deviations are *correct* — the implemented
  signatures are richer supersets that the react adapter actually depends on
  (verified: `useConditions.ts`, `Field.tsx`). Changing the signatures to match
  the PRD literal form would BREAK the adapter. Documenting is the only safe
  resolution, and it matches the gap_analysis decision.

## What

JSDoc-only edits. No code, no signatures, no tests, no barrels, no runtime. The
new prose is transcribed from / checked against the real consumers
(`packages/react/src/hooks/useConditions.ts`, `packages/react/src/components/Field.tsx`)
and the gap_analysis decisions.

### Success Criteria

- [ ] `evaluateConditions` has a function-level JSDoc stating it takes a single
      `EvaluateConditionsInput` object arg, that this matches PRD §1.3.2's
      example code, and that the §1.3.2 table `(conditions, state)` is the
      simplified form (G4).
- [ ] `resolveInitialValue` JSDoc includes a deviation paragraph: implemented
      `(fieldName, fieldConfig?, inputConfig?, record?, defaultValues?)` is a
      richer superset of PRD's `(record, config, inputConfig)`; internal API
      driving the priority chain (G5). Existing priority list / `@param` /
      `@example` preserved.
- [ ] `resolveLabel` JSDoc includes a deviation paragraph: implemented
      `(fieldName, fieldConfig?, evaluatedSelectProps?, componentProps?)` is a
      richer superset of PRD's `(config, fieldName)`; internal API for the 6-source
      chain, consumed by react `Field` (G5). Existing priority list / `@param`
      preserved.
- [ ] No `{@link}` is broken (all targets exist: `EvaluateConditionsInput`,
      `ConditionResult`, `resolveAllInitialValues`).
- [ ] `git diff --stat` = exactly the 3 source files; diff shows only `/** ... */`
      block changes (no signature/body edits).
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm test` green; test count unchanged.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: which three
functions, which get a NEW vs. AUGMENTED JSDoc (critical), the exact PRD table
form vs. actual form for each, the verified rationale (which adapter consumer
uses the richer signature), the gap_analysis IDs, and the no-overlap boundaries
with parallel siblings. All cited below with exact paths/lines. ✅ Passes the
"No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/005_8f88e0ec4482/P1M3T1S1/research/signature-deviations.md
  why: |
    THIS TASK'S FIELD GUIDE. Contains: the NEW-vs-AUGMENT table (the #1
    implementation error to avoid), the verified PRD-form-vs-actual-form for
    each function with consumer line numbers, DROP-IN suggested JSDoc wording
    for all three, the sibling boundaries, and the validation harness. READ
    THIS FIRST.

- docfile: plan/005_8f88e0ec4482/architecture/gap_analysis.md
  section: "G4" and "G5" entries
  why: |
    The authoritative gap statements this task closes. G4: "The PRD's own
    example code already uses the object-arg form. The §1.3.2 table is stale
    text. The current implementation is correct. No code change needed —
    document the decision." G5: "The current signatures are richer supersets
    used internally by the React adapter. No code change needed — document as
    accepted deviation."

- file: packages/core/src/conditions/evaluate.ts
  why: |
    File #1. evaluateConditions has NO function-level JSDoc today (only a 2-line
    stub on the EvaluateConditionsInput interface at ~L31). ADD a full block
    directly above `export function evaluateConditions(...)`. Locate with
    `grep -n "export function evaluateConditions"`.
  pattern: |
    Match the neighboring JSDoc style in this file — e.g. the block on
    `evaluateFieldMatcher` (prose + `@param` + `@returns`) and
    `buildFormStateFromInput` (multi-paragraph explanation). Use {@link} for
    type cross-refs.
  gotcha: |
    Do NOT duplicate or contradict the EvaluateConditionsInput interface JSDoc.
    The function block should LINK to it ({@link EvaluateConditionsInput}), not
    re-list its fields.

- file: packages/core/src/config/defaults.ts
  why: |
    File #2. resolveInitialValue ALREADY has a detailed JSDoc (priority list +
    @param + @example, ~L14–44). AUGMENT it by inserting the deviation paragraph
    AFTER the priority list and BEFORE the `@param fieldName` line. DO NOT
    rewrite or delete the existing content.
  pattern: Existing block uses "Priority order (highest to lowest): 1./2./3."
    followed by `@param`/`@returns`/`@example`. Insert the deviation paragraph
    as a new `* **PRD deviation note ...**` block in the same prose style.
  gotcha: |
    Preserve the existing @example code blocks verbatim. Only ADD prose.

- file: packages/core/src/labels/resolve.ts
  why: |
    File #3. resolveLabel ALREADY has a detailed JSDoc (6-step priority list +
    @param, ~L60–75). AUGMENT it by inserting the deviation paragraph AFTER the
    priority list and BEFORE `@param fieldName`. DO NOT rewrite or delete.
  gotcha: |
    COORDINATION with P1.M1.T1 (G1 ordering move): that task relocates the
    ordering functions out of resolve.ts into config/ordering.ts, leaving a
    re-export stub at the TAIL of resolve.ts. This task edits the resolveLabel
    JSDoc HIGHER UP. The regions do not overlap, but locate resolveLabel with
    `grep -n "export function resolveLabel"` (don't assume a fixed line number).

- file: packages/react/src/hooks/useConditions.ts
  section: L208, L307 — `evaluateConditions({...})`
  why: Evidence the object-arg form is the real consumer contract (cited in the
        evaluateConditions deviation note).

- file: packages/react/src/components/Field.tsx
  section: L390 — `resolveLabel(name, fieldConfig, fieldSelectProps, restProps)`
  why: Evidence the 4-arg resolveLabel signature is the real consumer contract
        (cited in the resolveLabel deviation note).

- file: packages/core/src/index.ts
  why: Confirms all three functions + EvaluateConditionsInput are part of the
        public core surface (L61 type export, L64 evaluateConditions,
        L126 resolveInitialValue, L138 resolveLabel). The deviation notes can
        safely reference them as public.

- docfile: PRD.md §1.3.2 (h4.1)
  why: |
    The section whose TABLE text is the "simplified form" and whose EXAMPLE
    CODE is the "actual form" (for evaluateConditions). The deviation notes
    cite this section by number.

- docfile: plan/005_8f88e0ec4482/P1M2T2S1/PRP.md
  section: Goal + "All Needed Context" (file list)
  why: |
    The PARALLEL SIBLING (mergeConfigs). Confirms its file scope is
    config/merge.ts + config/index.ts + root index.ts + config.test.ts — ZERO
    overlap with this task's three files. Safe to run in parallel.
```

### Current Codebase tree (relevant slice)

```bash
packages/core/src/conditions/evaluate.ts   # ← MODIFY: add evaluateConditions JSDoc (G4)
packages/core/src/config/defaults.ts       # ← MODIFY: augment resolveInitialValue JSDoc (G5)
packages/core/src/labels/resolve.ts        # ← MODIFY: augment resolveLabel JSDoc (G5)
packages/core/src/index.ts                 # public barrel (reference only; NOT modified)
packages/core/src/__tests__/conditions.test.ts   # existing tests (verify still green)
packages/core/src/__tests__/labels.test.ts       # existing tests (verify still green)
packages/core/src/__tests__/config.test.ts       # existing resolveInitialValue tests (verify green)
plan/005_8f88e0ec4482/P1M3T1S1/research/signature-deviations.md  # field guide
```

### Desired Codebase tree with files to be modified

```bash
packages/core/src/conditions/evaluate.ts   # MODIFIED — add fn-level JSDoc to evaluateConditions
packages/core/src/config/defaults.ts       # MODIFIED — augment resolveInitialValue JSDoc
packages/core/src/labels/resolve.ts        # MODIFIED — augment resolveLabel JSDoc
# (no other files change — no barrels, no tests, no react code, no PRD)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (NEW-vs-AUGMENT): evaluateConditions has NO function JSDoc today →
// ADD a full block. resolveInitialValue and resolveLabel ALREADY have detailed
// JSDoc (priority list + @param + @example) → AUGMENT only (insert a deviation
// paragraph); DO NOT rewrite or delete existing content. Getting this backwards
// is the #1 failure mode (deleting good existing JSDoc, or leaving
// evaluateConditions undocumented).

// CRITICAL (no behavioral change): this is Mode A documentation. Do NOT change
// any function signature, parameter list, return type, or body logic. Do NOT
// add/rename exports. Do NOT touch barrels (index.ts), tests, or react code.
// The diff must show ONLY /** ... */ block changes.

// CRITICAL (accuracy): the deviation notes must NOT call the implementation
// "wrong". It is a documented, accepted SUPERSET. The PRD §1.3.2 TABLE text is
// the simplified/stale form; for evaluateConditions the PRD §1.3.2 EXAMPLE
// code already uses the identical object-arg form — say so explicitly.

// GOTCHA ({@link} integrity): only {@link} symbols that actually exist:
// EvaluateConditionsInput, ConditionResult (conditions/evaluate.ts),
// resolveAllInitialValues (config/defaults.ts). Do NOT {@link} symbols from
// other packages (e.g. don't {@link} react's Field — mention it in prose with
// a backtick path instead).

// GOTCHA (coordination with P1.M1.T1 G1): the ordering-move task relocates
// functions at the TAIL of labels/resolve.ts. This task edits resolveLabel's
// JSDoc HIGHER UP. No overlap, but locate resolveLabel via grep, not a fixed
// line number.

// GOTCHA (zero sibling overlap): P1.M2.T2.S1 (parallel) owns config/merge.ts +
// barrels + config.test.ts. This task owns conditions/evaluate.ts +
// config/defaults.ts + labels/resolve.ts. No file overlap; safe in parallel.
```

## Implementation Blueprint

### Data models and structure

None — pure JSDoc. No data models, no code.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — read the field guide + the 3 source files + confirm consumers
  - READ: plan/.../P1M3T1S1/research/signature-deviations.md  (the field guide — FIRST)
  - READ: the JSDoc + signature regions of the 3 target functions:
      grep -n "export function evaluateConditions" packages/core/src/conditions/evaluate.ts
      grep -n "export function resolveInitialValue" packages/core/src/config/defaults.ts
      grep -n "export function resolveLabel" packages/core/src/labels/resolve.ts
  - CONFIRM consumers (grounds the rationale text):
      grep -n "evaluateConditions(" packages/react/src/hooks/useConditions.ts      # L208, L307
      grep -n "resolveLabel(" packages/react/src/components/Field.tsx              # L390
  - CONFIRM {@link} targets exist:
      grep -rn "export interface EvaluateConditionsInput\|export interface ConditionResult" packages/core/src/conditions/
      grep -n "export function resolveAllInitialValues" packages/core/src/config/defaults.ts
  - NOTE the NEW-vs-AUGMENT distinction from the field guide §1.

Task 2: ADD a function-level JSDoc block to evaluateConditions (G4)
  - FILE: packages/core/src/conditions/evaluate.ts
  - WHERE: immediately ABOVE `export function evaluateConditions(input: ...): ConditionResult {`.
  - ACTION: insert a full /** ... */ block (currently there is NONE on the fn).
  - CONTENT: state (a) it evaluates conditions → cumulative disabled/visible/
    setValue (PRD §7.1, §7.7); (b) SIGNATURE = single EvaluateConditionsInput
    object arg; (c) PRD deviation note (G4): the §1.3.2 TABLE says
    (conditions, state) but the §1.3.2 EXAMPLE code uses the identical
    EvaluateConditionsInput form implemented here → table is simplified, object
    arg is the stable contract used by every adapter; no code change planned.
  - USE {@link EvaluateConditionsInput} and {@link ConditionResult}; add @param
    and @returns. (See field guide §3a for drop-in wording.)
  - DO NOT touch the EvaluateConditionsInput interface JSDoc or any code.

Task 3: AUGMENT the existing resolveInitialValue JSDoc (G5)
  - FILE: packages/core/src/config/defaults.ts
  - WHERE: inside the EXISTING /** ... */ block on resolveInitialValue, AFTER
    the priority list ("3. inputConfig.defaultValue ...") and BEFORE the first
    `@param`.
  - ACTION: INSERT a deviation-note paragraph (do NOT delete/rewrite existing
    priority list, @param, @returns, or @example).
  - CONTENT: PRD §1.3.2 table says resolveInitialValue(record, config,
    inputConfig); implemented is a richer superset
    (fieldName, fieldConfig?, inputConfig?, record?, defaultValues?) that drives
    the full priority chain in one call; internal API consumed by the framework
    adapters and by {@link resolveAllInitialValues}; PRD literal form is a
    condensed representation; no code change planned (G5). (Field guide §3b.)

Task 4: AUGMENT the existing resolveLabel JSDoc (G5)
  - FILE: packages/core/src/labels/resolve.ts
  - WHERE: inside the EXISTING /** ... */ block on resolveLabel, AFTER the
    6-step priority list and BEFORE the first `@param`.
  - ACTION: INSERT a deviation-note paragraph (do NOT delete/rewrite existing
    priority list or @param).
  - CONTENT: PRD §1.3.2 table says resolveLabel(config, fieldName); implemented
    is a richer superset (fieldName, fieldConfig?, evaluatedSelectProps?,
    componentProps?) that resolves the full 6-source chain in one call;
    internal API consumed by the framework adapters (e.g. @formality-ui/react's
    Field calls resolveLabel(name, fieldConfig, fieldSelectProps, restProps));
    PRD literal form is a condensed representation; no code change planned (G5).
    (Field guide §3c.)

Task 5: VERIFY — scope, no behavioral change, JSDoc integrity
  - 5a. SCOPE: `git diff --stat` shows EXACTLY the 3 source files. Inspect
       `git diff` on each — only /** ... */ blocks changed; NO signature,
       parameter, return-type, or body edits.
  - 5b. NO BEHAVIORAL CHANGE:
       pnpm --filter @formality-ui/core build
       pnpm typecheck
       pnpm test        # count identical to pre-task
       pnpm lint
  - 5c. JSDoc integrity: the evaluateConditions block is present directly above
       the fn; resolveInitialValue + resolveLabel STILL have their @param
       fieldName (augmented, not deleted); all {@link} targets exist.
       (Run the harness in field guide §5.)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — evaluateConditions ADD (new block, currently none). Tone matches
// neighbor blocks (buildFormStateFromInput, evaluateFieldMatcher):
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
 * @returns {@link ConditionResult} — cumulative `disabled` (OR), `visible`
 *   (AND), `setValue` (last matching wins), plus `has*Condition` flags.
 */

// PATTERN — resolveInitialValue / resolveLabel AUGMENT (insert ONE paragraph
// inside the existing block, after the priority list, before @param):
 * **PRD deviation note (accepted, gap_analysis G5).** PRD §1.3.2's table
 * summarizes this export as `<PRD literal form>`. The implemented signature is
 * a richer superset — `<actual form>` — because <one-line reason tied to the
 * priority chain>. This is an internal API consumed by the framework adapters
 * <(and by {@link resolveAllInitialValues}) / (e.g. react Field calls ...)>, not
 * a simplified end-user entry point; the PRD literal form is a condensed
 * representation. No code change is planned.

// GOTCHA: keep @param/@returns/@example lines of the augmented blocks BYTE-
// IDENTICAL to the originals — only insert the new prose paragraph above them.
```

### Integration Points

```yaml
DOCUMENTATION (this task — JSDoc only):
  - file: packages/core/src/conditions/evaluate.ts  → ADD evaluateConditions fn JSDoc (G4)
  - file: packages/core/src/config/defaults.ts      → AUGMENT resolveInitialValue JSDoc (G5)
  - file: packages/core/src/labels/resolve.ts       → AUGMENT resolveLabel JSDoc (G5)

NOT IN SCOPE:
  - barrels (packages/core/src/index.ts, conditions/index.ts, config/index.ts, labels/index.ts) → unchanged
  - tests (conditions.test.ts, labels.test.ts, config.test.ts) → unchanged (still green)
  - react package → unchanged
  - PRD.md / gap_analysis.md → READ-ONLY (owned by humans / orchestrator)
  - sibling P1.M2.T2.S1 files (merge.ts, config.test.ts) → owned by sibling
```

## Validation Loop

### Level 1: JSDoc & Style (Immediate Feedback)

```bash
# 1. Lint (eslint covers JSDoc/JSX in .ts; type-doc linting is implicit via tsc):
pnpm lint
# Expected: zero errors.

# 2. Prettier (accept its formatting for the new /** ... */ lines):
pnpm exec prettier --check packages/core/src/conditions/evaluate.ts \
  packages/core/src/config/defaults.ts packages/core/src/labels/resolve.ts || \
  pnpm exec prettier --write packages/core/src/conditions/evaluate.ts \
    packages/core/src/config/defaults.ts packages/core/src/labels/resolve.ts

# 3. Structure check — new block present, existing @param preserved:
grep -n "export function evaluateConditions" packages/core/src/conditions/evaluate.ts
awk 'NR>=<evalCondLine>-12 && NR<=<evalCondLine>' packages/core/src/conditions/evaluate.ts  # JSDoc sits above
grep -n "@param fieldName" packages/core/src/config/defaults.ts packages/core/src/labels/resolve.ts
# Expected: @param fieldName STILL present in both (augmented, not deleted).
```

### Level 2: No Behavioral Change (THE key gate)

```bash
# JSDoc-only → build/typecheck/test must be unaffected; test count unchanged.
pnpm --filter @formality-ui/core build
pnpm typecheck
pnpm test
# Expected: all green. Capture the test count before & after — they MUST match.
# (If the count changes, the diff leaked beyond JSDoc — re-run `git diff`.)
```

### Level 3: {@link} & Cross-Reference Integrity

```bash
# Every {@link} target in the new JSDoc must resolve to a real export in core:
for sym in EvaluateConditionsInput ConditionResult resolveAllInitialValues; do
  grep -rn "export interface $sym\|export function $sym\|export type $sym" \
    packages/core/src/ >/dev/null \
    && echo "OK: $sym" || echo "MISSING {@link} target: $sym"
done
# Expected: all OK. (Do NOT {@link} react-only symbols; mention them in prose.)

# Confirm the deviation notes actually cite G4 / G5 and PRD §1.3.2:
grep -niE "G4|gap_analysis|§1\.3\.2|object-arg|superset|internal API" \
  packages/core/src/conditions/evaluate.ts \
  packages/core/src/config/defaults.ts \
  packages/core/src/labels/resolve.ts
# Expected: hits in all three files.
```

### Level 4: Scope & Diff Purity (final)

```bash
# Exactly 3 files, JSDoc-only diffs:
git diff --stat
# Expected: conditions/evaluate.ts, config/defaults.ts, labels/resolve.ts ONLY.

# Purity: no signature/body lines changed — only /** ... */ blocks:
git diff packages/core/src/conditions/evaluate.ts packages/core/src/config/defaults.ts packages/core/src/labels/resolve.ts | \
  grep -E '^[+-]' | grep -vE '^[+-]\s*\*|^[+-]\s*/\*\*|^[+-]\s*\*/|^\+\+\+|^---'
# Expected: EMPTY (every changed line is inside a JSDoc block). Any hit here =
# a non-JSDoc line changed → revert it.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: lint clean; prettier clean; evaluateConditions JSDoc present above the fn; existing `@param fieldName` preserved in the other two.
- [ ] Level 2 passed: build + typecheck + test green; **test count unchanged**.
- [ ] Level 3 passed: all `{@link}` targets resolve; G4/G5 + §1.3.2 + "superset"/"internal API" wording present.
- [ ] Level 4 passed: `git diff --stat` = 3 files; diff is JSDoc-only (Level 4 purity grep empty).

### Feature Validation

- [ ] `evaluateConditions` documents the object-arg form + that PRD §1.3.2 example code matches (G4).
- [ ] `resolveInitialValue` documents the richer-superset signature + priority-chain reason (G5).
- [ ] `resolveLabel` documents the richer-superset signature + 6-source-chain reason + react Field consumer (G5).
- [ ] Each note states the deviation is ACCEPTED and "no code change is planned".

### Code Quality Validation

- [ ] New JSDoc matches neighboring block style (prose + `{@link}` + `@param`/`@returns`).
- [ ] Existing priority lists / `@param` / `@example` in defaults.ts and resolve.ts preserved verbatim.
- [ ] No `{@link}` to cross-package symbols (react Field mentioned in prose with a backtick path).
- [ ] No signature, body, barrel, test, or react changes.

### Documentation & Deployment

- [ ] The three deviations are now self-documenting in code (a maintainer need not open gap_analysis.md).
- [ ] No CHANGELOG/README required for this Mode A subtask (JSDoc is the deliverable; changeset-level docs sync is P3.M2).

---

## Anti-Patterns to Avoid

- ❌ Don't rewrite or delete the existing `resolveInitialValue` / `resolveLabel`
  JSDoc. They already have correct priority lists, `@param`, and `@example` —
  AUGMENT (insert one deviation paragraph), nothing more.
- ❌ Don't leave `evaluateConditions` undocumented. It is the one function that
  has NO function-level JSDoc today — it needs a full NEW block, not an augment.
- ❌ Don't change any signature, parameter, return type, or body line. This is
  JSDoc-only. The Level 4 purity grep must be empty.
- ❌ Don't call the implementation "wrong" or "non-compliant". It is a
  documented, accepted SUPERSET. For `evaluateConditions`, the PRD's own example
  code uses the identical form — say so.
- ❌ Don't `{@link}` react-only symbols (e.g. `Field`). Mention them in prose
  with a backtick path (`@formality-ui/react`'s `Field`). `{@link}` only core
  symbols that exist in `packages/core/src/`.
- ❌ Don't edit barrels (`index.ts`), tests, the react package, `PRD.md`, or
  `gap_analysis.md`. Sibling P1.M2.T2.S1 owns `merge.ts`/barrels/`config.test.ts`;
  this task owns the three JSDoc files only.
- ❌ Don't assume fixed line numbers in `labels/resolve.ts` — P1.M1.T1 (G1) may
  have relocated the ordering tail. Locate `resolveLabel` with grep.
- ❌ Don't add new tests or "deviation" test cases. The item is explicit: "No
  behavioral change. All tests still pass." — the existing suite is the proof.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **JSDoc-only, three-file, no-behavioral-change** task with the entire
  rationale pre-read and distilled into the research note (`signature-deviations.md`):
  the NEW-vs-AUGMENT table (the one real failure mode), drop-in suggested wording
  for all three functions, verified consumer evidence, and the gap_analysis
  decisions.
- The biggest risk (deleting existing JSDoc, or mis-handling the NEW vs. AUGMENT
  distinction) is neutralized by an explicit per-function table + a Level 1 grep
  that confirms `@param fieldName` is still present after editing.
- The second risk (accidental code change) is neutralized by the Level 4 purity
  grep (every diff line must be inside a `/** ... */` block) + an unchanged test
  count.
- The sibling-overlap risk is zero by file partition (P1.M2.T2.S1 owns
  merge.ts/barrels/config.test.ts; this task owns evaluate.ts/defaults.ts/resolve.ts).
- Residual 1 point: JSDoc wording/tone is subjective; the implementer must match
  neighboring block style (Task 1 + field guide §3 make this explicit).
