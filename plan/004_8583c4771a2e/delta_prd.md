# Delta PRD — Scoped Auto-Save Validation & Per-Field Debounce Coalescing

**Delta from:** session `003` (`plan/003_de060244cb57`)

## 1. What Actually Changed (diff analysis)

The ONLY diff between `plan/003`'s PRD snapshot and `plan/004`'s PRD snapshot is in
**§12 Auto-Save System** (~60 net added lines). Every other section is byte-identical.
The three sub-sections changed:

| PRD selector | Section | Change |
| --- | --- | --- |
| `h3.48` (§11.1 Behavior) | point 4 | Whole-form validity gate → **scoped validity** gate. "Only submits if form is valid" becomes "Only submits if the **changed field and its affected (dependent) fields** are valid", with the explicit rule that an unrelated invalid field does NOT block a valid edit; whole-form validity is still enforced on a full manual submit. |
| `h3.49` (§11.2 Implementation) | code block | Rewritten. The old `if (methods.formState.isValid) handleSubmit(onSubmit)()` is replaced by `executeAutoSave()`, a `pendingChangedFields` set, `getAffectedFields(changedFields)`, a two-gate scoped validator (Gate 1: changed-field `onChange` error; Gate 2: re-validate affected fields via `methods.trigger`), an explicit "no whole-form validity check" note, and an execution-version note to abort stale saves. `changeField` now branches on `inputConfig.debounce`: `false` → immediate `executeAutoSave()`; `number` → per-field timer via `getOrCreateDebounced(ms)`; `undefined` → form-level `debouncedSubmit()`. |
| `h3.50` (§11.3 Debounce Behavior) | Example 4 (added) | New example: multiple numeric `InputConfig.debounce` values **coalesce by interval** (fields sharing an ms share one timer; the faster timer submits the whole pending batch; a slower timer that fires with nothing pending is a no-op; a field with no debounce falls back to the Form-level `debounce` prop). |

**No other PRD section changed.** No type, context, condition, expression, or component-spec
section moved. Scope is strictly §12.

## 2. Size Check & Proportional Sizing

- Diff size: ~60 net added lines, single section → **medium feature modification**.
- However: the runtime behavior this delta specifies is **already shipped and tested**
  (see §3). The latest commit `a99e461` updated the PRD *to match already-implemented code*.
- Therefore the delta PRD is sized to the **remaining work** (verification + doc alignment),
  not to a greenfield build. → **1 phase, 1 milestone, 2 tasks.** No phases are fabricated.

## 3. Reference to Completed Work (do NOT re-implement)

The auto-save behavior described by the updated §12 is **already in the codebase**:

- **Runtime** — `packages/react/src/components/Form.tsx`:
  - `executeAutoSave` (the scoped two-gate save with `pendingChangedFields` /
    `pendingAffectedFields`, execution-version abort, and the explicit "no whole-form
    error guard" note).
  - `getAffectedFields` (dependents-via-conditions computation).
  - `getOrCreateDebounced` / `getOrCreateDebouncedRef` (per-interval memoized debounced fns
    → the coalescing-by-interval semantics of §11.3 Example 4), realized React-idiomatically
    via a `useCallback` + ref rather than the PRD's pseudocode bare-object map.
  - `changeField`'s three-way `inputConfig.debounce` branch (`false` → immediate,
    `number` → per-field timer, `undefined` → form-level).
- **Tests** — `packages/react/src/__tests__/autosave-*.test.tsx` (4 files, 3,681 lines):
  - `autosave-validation.test.tsx` — scoped validation: "Dependent Field Validation",
    "Async Validation Waiting", **"Unrelated Invalid Field (Issue 2)"** (asserts a valid edit
    saves while an unrelated required field is empty), "Validation Errors", "Immediate
    Submission (debounce: false)".
  - `autosave-field-debounce.test.tsx` — per-field debounce + coalescing: "Per-field numeric
    debounce is honored", **"Coalescing semantics"** (shared-interval coalesce; faster timer
    submits the batch; slower timer no-ops), "Mixed debounce: false + numeric",
    "Form-level fallback preserved".
  - `autosave-async-timing.test.tsx` / `autosave-rapid-changes.test.tsx` — execution-version /
    stale-save abort ("Version Checkpoint", "abort intermediate auto-save operations").
- **Verified green:** a targeted run of the two validation/coalescing suites passes
  **31/31 tests**.

Git timeline confirming spec-catch-up: `bbff475` (honor per-field numeric debounce + remove
whole-form error guard) and `b69f3fa` (wire debouncedSubmit during render) shipped the behavior;
`a99e461` (docs: specify scoped auto-save validation and per-field debounce coalescing) updated
the PRD to match.

## 4. Scope of the Delta (what this session actually does)

Because the implementation and tests already satisfy the updated §12, this delta is a
**verification + documentation-alignment** delta, not an implementation delta:

1. **Confirm zero drift** between the updated PRD §11.1–§11.3 and the shipped runtime + tests
   (gap audit), with the full suite + ≥90% coverage gate green.
2. **Align documentation** so no user-facing doc still implies the OLD whole-form-validity
   auto-save gate.

### Documentation impact

- **Mode A (doc-with-work):** none beyond confirming alignment. The Form prop JSDoc
  (`packages/react/src/components/Form.tsx`, `debounce` prop, ~lines 62–71) already documents
  per-field debounce override; the READMEs (`README.md` §"Auto-Save", `packages/react/README.md`
  §"Auto-Save") describe auto-save only at the high level (debounced submission + input-level
  debounce) and make **no** validation-scope claim that would now be false. If the Mode-B sweep
  finds a stale claim, it is fixed inline as part of that task; no standalone doc task is
  warranted.
- **Mode B (changeset-level docs):** applies — see Task T2. A cross-cutting sweep confirms the
  README capability summaries don't imply auto-save blocks on whole-form validity.

## 5. Phase

### Phase P1 — Scoped Auto-Save Validation & Per-Field Debounce Coalescing: verify & align

**Status:** Not started.

**Description:** The updated PRD §12 specifies two auto-save behavior changes —
(a) a **scoped validity gate** (changed field + dependent/affected fields only; an unrelated
invalid field no longer blocks a valid edit; whole-form validity still enforced on full manual
submit) and (b) **per-field numeric debounce that coalesces by interval** (shared ms → shared
timer; faster timer submits the pending batch; slower timer no-ops; no-debounce falls back to
the Form-level `debounce`). Both are **already implemented and tested** in `Form.tsx` and the
`autosave-*.test.tsx` suites (§3). This phase does NOT re-implement them. It (1) audits the
shipped code/tests against the now-updated PRD to confirm there is no drift and the coverage
gate stays green, and (2) sweeps user-facing docs to ensure none still describe the legacy
whole-form-validity auto-save gate.

**Out of scope:** any change to the auto-save runtime logic, any non-§12 PRD section, the
forwardRef work completed in session `003` (Phase P1 there is unrelated and stays complete).

#### Milestone P1.M1 — Confirm shipped behavior matches updated PRD §12; align docs

**Status:** Not started.

**Description:** One audit milestone: (T1) verify the shipped `executeAutoSave` /
`getOrCreateDebounced` / `changeField` and the four autosave test files cover every requirement
in PRD §11.1–§11.3, with `pnpm test:coverage` green at ≥90% (§1.3.7); then (T2) the Mode-B
documentation sweep to retire any stale whole-form-validity framing.

##### Task P1.M1.T1 — Audit shipped auto-save implementation & tests against updated PRD §11.1–§11.3

**Status:** Not started. **Story points:** 1.

**Description:** Gap audit (read-only unless a real gap is found). Walk PRD §11.1 point 4,
§11.2 (scoped `executeAutoSave`, two gates, no-whole-form-check note, execution-version abort,
`pendingChangedFields`, `getAffectedFields`, per-field-debounce `changeField` branches), and
§11.3 Example 4 (coalescing) against `packages/react/src/components/Form.tsx` and the
`autosave-*.test.tsx` suites. Confirm each specified behavior is both implemented and covered by
a test (mapping provided in §3 of this PRD). Run `pnpm test:coverage` and confirm all four
coverage metrics stay ≥90% (PRD §1.3.7) with no regression. If — and only if — the audit finds a
real gap between spec and shipped behavior, scope the minimal fix and note it; otherwise record
the "no drift, already ships" finding. Re-implementing already-passing behavior is explicitly
out of scope.

**Dependencies:** none (builds on already-shipped code).

##### Task P1.M1.T2 — Sync changeset-level documentation (Mode B)

**Status:** Not started. **Story points:** 0.5.

**Description:** Cross-cutting doc sweep (Mode B) confirming no user-facing doc still implies
auto-save blocks submission on whole-form validity. Review `README.md` §"Auto-Save"
(feature blurb + capability list at ~line 502, and the "validation awareness" bullet at ~643),
`packages/react/README.md` §"Auto-Save" (~279) and its `autoSave`/`debounce` prop table
(~121, ~137), and the `Form.tsx` `autoSave`/`debounce` prop JSDoc (~57–71). If any wording now
misrepresents the scoped gate or per-field debounce coalescing, update it to match PRD §11.1–§11.3;
if all wording is already accurate (current evidence says it is), make NO edit and record the
"docs already aligned" decision in the PR/PRP. Do NOT duplicate per-symbol prose work — this
delta touched no symbol-level contract docs. Depends on T1 so it runs last.

**Dependencies:** P1.M1.T1.
