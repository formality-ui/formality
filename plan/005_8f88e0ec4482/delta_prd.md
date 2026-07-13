# Delta PRD — `Form` `mode` prop, mode-agnostic auto-save, two message/doc fixes

## What this delta is

A small PRD diff (66 changed lines, 4 change groups) that brings the
specification in line with code that is **already shipped and tested**. Like
plan 004, this is a **verify + documentation-alignment** delta — the runtime
work is done; this phase confirms zero drift and closes one user-facing doc gap
introduced by the changes.

### The 4 change groups (from the PRD diff)

| # | Change (PRD sections touched) | Shipped? | Where |
|---|-------------------------------|----------|-------|
| 1 | **New `FormProps.mode` prop** + forwarding to `useForm({ mode })` (§5.2 FormProps JSDoc+type, §5.2.2 init, Appendix A `FormProps`) | ✅ already shipped | `packages/react/src/components/Form.tsx` (type L80, destructure L168, `mode: mode ?? "onChange"` L198) |
| 2 | **Auto-save made mode-agnostic**: Gate 1 rewrites from reading `methods.getFieldState(name).error` to `methods.trigger(changedFields)`; new §11.1 #5 bullet | ✅ already shipped | `Form.tsx` `executeAutoSave` Gate 1 (L585–616) |
| 3 | **Fallback error message `"Invalid"` → `"Invalid value"`** (§9.3 table, §9.4 `resolveErrorMessage` ×2) | ✅ already shipped | `packages/core/src/validation/messages.ts` (L41, L61, L64, L100); asserted by `validation.test.ts` (L342, L373, L379, L385, L409, L415) |
| 4 | **`humanizeLabel` JSDoc example** `"HTMLParser" → "HTML Parser"` corrected to `→ "Html Parser"` (§15.3 only) | ✅ already shipped | `packages/core/src/labels/resolve.ts` JSDoc (L18); asserted by `labels.test.ts` (L32) |

> Group 4 is a pure doc-only correction: the algorithm lower-cases each word,
> so `"HTMLParser"` actually yields `"Html Parser"`. The PRD's old example was
> wrong; the code was already right. No code change.

### Implementation status (verified against current source)

- `mode` prop: present in `Form.tsx` with full JSDoc (L74–80) explaining
  mode-agnostic auto-save.
- Mode-agnostic Gate 1: `executeAutoSave` calls `methods.trigger(changedArray)`
  explicitly (NOT a pre-computed error read), with a comment citing §11.1 #5.
- `"Invalid value"`: returned from `resolveErrorMessage` and the default
  `messages.invalid` map; six test assertions pin it.
- `"Html Parser"`: JSDoc + test both match the corrected example.
- Full suite + coverage gate: **green** — 38 files / 1003 passed / 5 skipped;
  coverage 97.21% stmts · 94.57% branches · 99.11% functions · 97.21% lines
  (all above the §1.3.7 ≥90% floor).

### Scope boundaries

- **In scope:** (T1) read-only audit confirming all four change groups match
  the updated PRD with coverage ≥90%; (T2) the Mode-B doc sweep — add the
  `mode` prop row to the Form prop table in `packages/react/README.md` and
  confirm the rest of the user-facing docs are already aligned.
- **Out of scope:** any change to runtime logic (all four groups ship already),
  any re-implementation, any non-§5.2/§11.1/§9.3/§9.4/§15.3 PRD section, the
  forwardRef work completed in session 003, and Appendix C type-safety items
  (T2.2/T3.1 remain ❌ NOT STARTED and are not touched here).

## Documentation impact (Mode A / Mode B)

- **Mode A (doc-with-work):** none. Groups 1–4 carry no per-symbol contract doc
  that is out of sync with the code — `Form.tsx` JSDoc already documents
  `mode`; `messages.ts` and `resolve.ts` JSDoc already match. No implementing
  work is being done, so no Mode-A docs ride with it.
- **Mode B (changeset-level docs):** **applies.** The new `mode` prop is a
  consumer-facing capability and is **missing from the Form prop table** in
  `packages/react/README.md` (the table lists `config`, `formConfig`, `record`,
  `onSubmit`, `autoSave`, `debounce` — no `mode`). `CHANGELOG.md` (L6) already
  notes "make auto-save work under any validation mode", and the top-level
  `README.md` has no Form prop table, so neither needs a change. This is
  captured as Task T2 below.

## Backlog

### Phase P1 — Verify already-shipped `mode`/mode-agnostic auto-save/message fixes & align docs

**Purpose:** Confirm the four change groups in the updated PRD are fully and
correctly shipped (zero drift) with the coverage gate green, then close the one
Mode-B doc gap (the `mode` prop row in the react README Form prop table).

This phase does NOT re-implement any of the four behaviors. It mirrors the
structure of plan 004 (verification + single doc-alignment task).

#### Milestone P1.M1 — Confirm shipped behavior matches the updated PRD; align the react README

One audit + one doc-alignment task.

##### Task P1.M1.T1 — Audit the four change groups against the updated PRD; confirm coverage ≥90%

Gap audit (read-only unless a real gap is found). Walk each change group's
updated PRD text against the current source and tests, confirm a match, and
re-run `pnpm test:coverage` to confirm the §1.3.7 ≥90% gate holds. If — and only
if — a real gap is discovered, scope the minimal fix and note it; otherwise
record the "no drift, already ships" finding. Re-implementing already-passing
behavior is explicitly out of scope.

- **Mode A docs:** none (read-only audit).
- **Mode B docs:** none at this task (the doc sweep is T2, which depends on T1).

**Subtasks:**

- **P1.M1.T1.S1 — Audit `mode` prop + mode-agnostic auto-save (groups 1 & 2).**
  Walk PRD §5.2 (`FormProps.mode` JSDoc + type + the `useForm({ mode: mode ??
  'onChange' })` line in §5.2.2), §11.1 #4/#5 (mode-agnostic scoped validity
  gate), and §11.2 `executeAutoSave` Gate 1 (`methods.trigger(changedFields)`
  instead of `getFieldState(name).error`) against `packages/react/src/components/Form.tsx`.
  Confirm: (a) `mode` is a `FormProps` member defaulting to `"onChange"` and is
  forwarded to `useForm` unchanged; (b) auto-save Gate 1 triggers validation of
  the changed fields itself via `methods.trigger(...)`, so it is correct under
  any mode (not just `onChange`). Cross-check that the autosave test suites
  (`autosave-validation.test.tsx`, `autosave-field-debounce.test.tsx`,
  `autosave-async-timing.test.tsx`, `autosave-rapid-changes.test.tsx`) still
  pass and cover the scoped-gate behavior. (Story points: 1. Dependencies:
  none.)

- **P1.M1.T1.S2 — Audit message + label fixes (groups 3 & 4) and re-run the coverage gate.**
  Walk PRD §9.3 (`false` → `"Invalid value"`) and §9.4 (`return "Invalid value"`
  ×2) against `packages/core/src/validation/messages.ts`; confirm `messages.ts`
  returns `"Invalid value"` at its fallback/error paths and that
  `packages/core/src/__tests__/validation.test.ts` asserts it. Walk PRD §15.3's
  corrected `humanizeLabel("HTMLParser") → "Html Parser"` example against
  `packages/core/src/labels/resolve.ts` (JSDoc) and `labels.test.ts`. Then run
  `pnpm test:coverage` from the repo root and record all four coverage metrics,
  confirming each is ≥90% with no regression vs. the 97.21% / 94.57% / 99.11% /
  97.21% baseline. (Story points: 1. Dependencies: none.)

##### Task P1.M1.T2 — Mode-B doc sweep: add `mode` to the react README Form prop table; confirm CHANGELOG/top-level README aligned (depends on T1)

Cross-cutting documentation sweep. The `mode` prop is a consumer-facing
capability introduced by groups 1–2 and is **absent** from the Form prop table
in `packages/react/README.md` (currently lists `config`, `formConfig`,
`record`, `onSubmit`, `autoSave`, `debounce`). Add a `mode` row to that table
matching the JSDoc already in `Form.tsx` (§5.2): type
`'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all'`, default
`'onChange'`, forwarded to `useForm({ mode })`; briefly note that auto-save is
mode-agnostic (its gates trigger validation themselves via `methods.trigger`).
Then sweep the other user-facing docs and make NO edit if they are already
aligned — just record the decision:

- `CHANGELOG.md` (L6): already says "make auto-save work under any validation
  mode" — aligned, no change.
- Top-level `README.md`: has no Form prop table and no mode claim — no change.
- `packages/react/README.md` §"Auto-Save" (~L279): neutral (does not claim mode
  dependence) — no change unless the sweep finds a stale claim.
- `Form.tsx` `mode` JSDoc (L74–80): already accurate — no change.

After editing, run `npx vitest run` to confirm no example/type regression
(examples are type-checked but excluded from coverage per §1.3.7).

- **Mode A docs:** none (no implementing work).
- **Mode B docs:** this task **is** the changeset-level documentation sweep;
  the `mode` prop row is the only stale/missing cross-cutting item. No separate
  doc task is needed.

**Subtasks:**

- **P1.M1.T2.S1 — Add `mode` row to the Form prop table in `packages/react/README.md`; record alignment of CHANGELOG and top-level/react READMEs.**
  Edit the Form "Props:" table (currently a 6-row table) to add a `mode` row.
  Keep the description consistent with `Form.tsx`'s JSDoc and PRD §5.2: forward
  to RHF unchanged; default `'onChange'`; auto-save is mode-agnostic. Confirm
  (without editing) that `CHANGELOG.md` L6, the top-level `README.md`, the
  react README §"Auto-Save", and `Form.tsx` JSDoc are already aligned; note
  each as "no change" in the task output. (Story points: 1. Dependencies:
  `P1.M1.T1.S1`, `P1.M1.T1.S2` — the audit runs first.)
