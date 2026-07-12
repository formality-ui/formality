name: "P1.M2.T1.S1 — Verify & finalize the wrapDebounced helper (explicit pending() tracking)"
description: |

---

## ⚠️ CRITICAL CONTEXT — READ FIRST: THE IMPLEMENTATION ALREADY EXISTS

Before any editing, the implementing agent MUST understand that the functional
work this task describes is **already complete and shipped** in the current
working tree. It landed in commit **`0dca79a`** — *"fix(react): flush
per-field debounce saves in submitImmediate; fix pending() ← Issues 1+3"* —
which was the **combined** Issue 1 + Issue 3 fix. The Issue-1 task
(`P1.M1.T1.S1`, marked Complete in the plan) folded in the Issue-3 work
(this task) because the two are tightly coupled: `submitImmediate`'s
"anything pending?" check (`Form.tsx:733`) calls `.pending()` on the very
`wrapDebounced` instances this task creates, so they had to ship together.

**Consequence for the implementer:**
- **DO NOT create `wrapDebounced` from scratch.** It exists at
  `packages/react/src/components/Form.tsx:862` and is already wired into both
  `getOrCreateDebounced` (`Form.tsx:659`) and `debouncedSubmit`
  (`Form.tsx:705`). Rewriting it risks regressing tested, working code.
- **DO NOT add regression tests for `pending()`.** Those belong to the sibling
  task `P1.M2.T1.S2` and ALSO already exist — see the describe block
  *"AutoSave DebouncedFunction.pending() reflects real state (Issue 3)"* at
  `packages/react/src/__tests__/autosave-submit-immediate.test.tsx:289`.
- This PRP is therefore a **VERIFY-AND-FINALIZE** PRP: confirm every contract
  clause is met (verification map below), apply the ONE residual doc touch-up
  (a comment-symmetry edit in `getOrCreateDebounced`), and run the validation
  gates to prove correctness. That is the entirety of new work.

The honest framing: the orchestrator's task status ("Researching") reflects a
planning-time assumption that this work was still open; the actual codebase
already satisfies the contract. This PRP's job is to (a) document that fact,
(b) give the agent a precise checklist to prove it, and (c) close the one
genuine doc gap.

---

## Goal

**Feature Goal**: Ensure `DebouncedFunction.pending()` reports the **real
scheduled state** for every debouncer Formality creates — Form-level
(`debouncedSubmit`) and per-field (`getOrCreateDebounced`) — by relying on a
single, documented `wrapDebounced` helper that tracks `isPending` explicitly,
while keeping the immediate adapter's `pending: () => false` (an immediate
function is never pending). Verify the already-shipped implementation meets
the contract and finalize its inline documentation.

**Deliverable**:
1. **Verification** (no code change): confirm, via the contract-verification
   map below, that `wrapDebounced` + both call sites + the immediate adapter
   match the Issue-3 contract line-for-line in the current `Form.tsx`.
2. **One residual doc touch-up** (Mode A, ride-with): add an explicit
   `wrapDebounced` reference to the inline comment in `getOrCreateDebounced`
   (`Form.tsx:~652-658`) for symmetry with the `debouncedSubmit` comment
   (`Form.tsx:704` already says *"wrapDebounced gives a correct pending()"*).
3. **Validation**: run the existing `pending()` regression suite and the
   full gate; all must be green.

**Success Definition**:
1. Every contract clause in the verification map is confirmed present
   (checked off) in `packages/react/src/components/Form.tsx`.
2. The `getOrCreateDebounced` inline comment names `wrapDebounced` (symmetry).
3. `pnpm test` (incl. the `pending()` describe block at
   `autosave-submit-immediate.test.tsx:289`) is green.
4. `pnpm typecheck`, `pnpm lint`, `pnpm test:coverage` (≥90%) all green.
5. **No rewrite** of `wrapDebounced`; no change to the immediate adapter's
   `pending: () => false`; no new test files.

## User Persona

**Target User**: Formality consumers who read the `DebouncedFunction` contract
(`types.ts:117-123`) and rely on `.pending()` — directly, or implicitly via
`ctx.submitImmediate()`, whose flush logic (`Form.tsx:733-734`) gates on
`pending()` across both timer sources.

**Use Case**: A "Save Now" button calls `ctx.submitImmediate()`. Correctness
of that flush (Issue 1, already fixed) **depends on** `pending()` being
truthy while a save is scheduled (this task, already fixed) — otherwise the
flush's "nothing pending → early-return" guard (`Form.tsx:738`) would skip a
real pending save.

**Pain Points Addressed**: PRD §4.1 documents `pending: () => boolean; //
Check if there's a pending invocation`. Before commit `0dca79a` every
debouncer hardcoded `pending: () => false` (lodash's real `.pending()` was
shadowed by `Object.assign`), so the API misreported "not pending" while a
save was scheduled. This is now fixed; this PRP verifies the fix is intact.

## Why

- **Contract accuracy (PRD §4.1 / Issue 3).** `DebouncedFunction.pending()`
  is a documented public surface. Silently returning `false` violates it.
- **Enables Issue 1's correctness.** `submitImmediate`'s "anything pending?"
  guard reads `.pending()`. Wrong `pending()` ⇒ skipped flush (Issue 1
  regression). The two fixes are co-dependent — which is exactly why they
  shipped in one commit.
- **Scope discipline.** This subtask owns only the implementation +
  ride-with docs. Regression tests are `P1.M2.T1.S2`; the public-API /
  CHANGELOG narrative is `P1.M3.T1`. Both already exist or are tracked
  separately — do not duplicate.

## What

A verify-and-finalize pass over the existing `wrapDebounced` implementation
in `packages/react/src/components/Form.tsx`, plus one inline-comment
symmetry edit in `getOrCreateDebounced`. No new files, no new tests, no
behavior change.

### Success Criteria

- [ ] Contract-verification map (below) fully checked — every clause present.
- [ ] `getOrCreateDebounced` inline comment explicitly references `wrapDebounced`.
- [ ] Immediate adapter (`debounceMs === false` branch) still returns
      `pending: () => false` (UNCHANGED).
- [ ] `pnpm test` green — specifically the
      `"AutoSave DebouncedFunction.pending() reflects real state (Issue 3)"`
      describe block at `autosave-submit-immediate.test.tsx:289`.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test:coverage` green.
- [ ] `git diff` touches at most a few comment lines in `Form.tsx` (nothing else).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the
`DebouncedFunction` interface, the exact current `wrapDebounced` source and
its two call sites, the lodash shadowing rationale, the existing regression
tests, and the precise residual doc gap. All cited below with exact paths
and line numbers. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ - include in context window before implementing
- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/system_context.md
  section: "DebouncedFunction Contract" + "Issue 3" + the wrapDebounced row (Form.tsx:862-884)
  why: |
    Authoritative system map. Confirms wrapDebounced lives at Form.tsx:862-884
    ("Wraps lodash debounce with correct pending() tracking"), that
    submitImmediate reads .pending() across both timer sources, and that the
    per-field cache is keyed by ms in fieldDebouncersRef.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/external_deps.md
  section: "lodash-es debounce"
  why: |
    Explains the ROOT CAUSE this task addresses: lodash's debounce DOES expose
    .pending(), BUT the project wraps the lodash fn via Object.assign(()
    => {...}, { cancel, flush, pending }) which creates a NEW function object
    that does NOT share lodash's internal pending state. Hence the wrapper's
    .pending() must track isPending explicitly. This is exactly what
    wrapDebounced does. Quote it in the JSDoc (already done) and in the
    getOrCreateDebounced comment touch-up.

- file: packages/react/src/components/Form.tsx
  section: wrapDebounced definition (lines 851-884) + call sites (659, 705) + immediate adapter (692-702)
  why: |
    The System Under Verification. The contract-verification map below maps
    each Issue-3 contract clause to a specific line in THIS file. Read these
    ranges first.
  pattern: |
    wrapDebounced(callback, ms):
      let isPending = false;
      const debounced = debounce(() => { isPending = false; callback(); }, ms);
      return Object.assign(() => { isPending = true; debounced(); },
        { cancel: () => { isPending = false; debounced.cancel(); },
          flush:  () => { isPending = false; debounced.flush();  },
          pending: () => isPending }) as DebouncedFunction;
  gotcha: |
    The trailing-invocation isPending=false MUST come BEFORE callback() inside
    the lodash debounce body (so the flag clears when the save actually fires,
    not after). Verify ordering is preserved on any touch.

- file: packages/react/src/types.ts
  section: lines 117-123 (DebouncedFunction interface)
  why: |
    The contract being satisfied: `(): void; cancel: () => void;
    flush: () => void; pending: () => boolean;`. wrapDebounced's return is
    cast to this type. No change to this interface is needed or wanted.

- file: packages/react/src/__tests__/autosave-submit-immediate.test.tsx
  section: describe block at line 289 ("...pending() reflects real state (Issue 3)")
  why: |
    PROVES the implementation works. Contains the regression tests for the
    SIBLING task P1.M2.T1.S2 — they already exist and pass. Tests assert
    pending()===true while a Form-level save is scheduled, false after it
    fires, false after cancel(), and the per-field/coalesced transitions.
    DO NOT duplicate these. Run them as your validation gate.

- file: packages/react/src/__tests__/Form.coverage.test.tsx
  section: lines ~207, ~257 (pending() assertions on the immediate adapter fn#4/fn#5)
  why: |
    Confirms the immediate-adapter path (pending: () => false) is itself
    covered. Reinforces why that adapter must NOT be changed.
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
├── types.ts                         # DebouncedFunction interface (lines 117-123) — UNCHANGED
├── components/
│   └── Form.tsx                     # ← all work here
│       ├── import { debounce } from "lodash-es"     (line 18)
│       ├── getOrCreateDebounced  (lines 650-668)    ← uses wrapDebounced (659); comment touch-up here
│       ├── debouncedSubmit useMemo (lines 689-711)
│       │     ├── immediate adapter  (692-702)       ← pending: () => false  (UNCHANGED)
│       │     └── normal branch      (705)           ← uses wrapDebounced
│       ├── submitImmediate       (lines 724-745)    ← reads .pending() (733-734) — the consumer
│       └── wrapDebounced         (lines 851-884)    ← the helper (ALREADY IMPLEMENTED)
└── __tests__/
    ├── autosave-submit-immediate.test.tsx           ← Issue 3 regression suite (describe @289) — EXISTS
    ├── autosave-field-debounce.test.tsx             ← per-field coalescing tests
    └── Form.coverage.test.tsx                        ← immediate-adapter pending coverage
```

### Desired Codebase tree with files to be added

```bash
# No files added. Only packages/react/src/components/Form.tsx is touched,
# and only inside the getOrCreateDebounced inline comment (a few characters).
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: wrapDebounced ALREADY EXISTS (commit 0dca79a). Do NOT recreate it.
//   A from-scratch rewrite would either no-op (wasting the turn) or, worse,
//   subtly reorder the isPending=false / callback() lines and regress the
//   Issue-3 tests at autosave-submit-immediate.test.tsx:289.

// CRITICAL: lodash's debounce .pending() is SHADOWED by Object.assign.
//   Object.assign(() => {...}, adapters) returns a NEW function object that
//   does not share lodash's internal pending flag. That is WHY wrapDebounced
//   tracks isPending explicitly instead of delegating to debounced.pending().
//   (See external_deps.md "lodash-es debounce".) This rationale must appear
//   in the JSDoc (it does) and, after the touch-up, in the getOrCreateDebounced
//   comment too.

// GOTCHA: The immediate adapter (debounceMs === false) MUST keep
//   pending: () => false. An immediate function is never "pending" — it
//   executes synchronously. submitImmediate's guard relies on this being
//   false so it doesn't try to flush a non-existent timer. Do not "fix" it.

// GOTCHA: submitImmediate (Form.tsx:733-734) reads .pending() on BOTH
//   debouncedSubmitRef.current AND every fn in fieldDebouncersRef.current.
//   That read is the real consumer of this task's output — it is why
//   wrapDebounced's pending() MUST be correct. Changing pending()'s semantics
//   here would silently change submitImmediate's flush/no-flush decision.

// SCOPE: Regression tests for pending() are P1.M2.T1.S2 — and they ALREADY
//   EXIST at autosave-submit-immediate.test.tsx:289. Do not write more here.
//   The CHANGELOG/README narrative is P1.M3.T1. Do not touch those files.

// PARALLEL CONTEXT: P1.M1.T2.S2 (in progress) tracks the isDisabled React-
//   adapter limitation in project docs. It does NOT touch Form.tsx. No
//   conflict with this task's single-file (Form.tsx) comment edit.
```

## Implementation Blueprint

### Data models and structure

No model changes. `DebouncedFunction` (`types.ts:117-123`) is the existing
contract; `wrapDebounced` produces values satisfying it. Nothing to add.

### Contract-Verification Map (PERFORM FIRST — this IS the core of the task)

Read each cited range in `packages/react/src/components/Form.tsx` and confirm
the clause. Check the box only after visual confirmation. **If ANY clause is
NOT present, stop and flag it** (that would mean the working tree diverged
from commit `0dca79a` and the task becomes real implementation work).

```yaml
CLAUSE 1 — wrapDebounced is a MODULE-LEVEL function in Form.tsx
  - expected: "function wrapDebounced(callback: () => void, ms: number): DebouncedFunction {"
  - location: Form.tsx:862
  - check: [ ] present and exported at module scope (not nested in a component)

CLAUSE 2 — isPending closure variable
  - expected: "let isPending = false;"
  - location: Form.tsx:863
  - check: [ ] declared inside wrapDebounced, BEFORE the lodash debounce()

CLAUSE 3 — isPending = false in the lodash TRAILING invocation
  - expected: "const debounced = debounce(() => { isPending = false; callback(); }, ms);"
  - location: Form.tsx:864-867
  - check: [ ] isPending=false runs BEFORE callback() in the trailing body
              (so the flag clears exactly when the save fires)

CLAUSE 4 — isPending = true when the WRAPPER function is called
  - expected: "() => { isPending = true; debounced(); }"
  - location: Form.tsx:877 (the Object.assign target function)
  - check: [ ] sets true then delegates to the lodash debounced()

CLAUSE 5 — cancel() clears isPending AND cancels lodash
  - expected: "cancel: () => { isPending = false; debounced.cancel(); }"
  - location: Form.tsx:870-872
  - check: [ ] clears flag then cancels the lodash timer

CLAUSE 6 — flush() clears isPending AND flushes lodash
  - expected: "flush: () => { isPending = false; debounced.flush(); }"
  - location: Form.tsx:873-876
  - check: [ ] clears flag then flushes the lodash timer

CLAUSE 7 — pending: () => isPending
  - expected: "pending: () => isPending,"
  - location: Form.tsx:882
  - check: [ ] returns the closure flag (NOT a hardcoded value)

CLAUSE 8 — getOrCreateDebounced uses wrapDebounced (per-field path)
  - expected: "const fn = wrapDebounced(() => { executeAutoSaveRef.current?.(); }, ms);"
  - location: Form.tsx:659
  - check: [ ] no leftover inline Object.assign with pending: () => false in this fn

CLAUSE 9 — debouncedSubmit NORMAL branch uses wrapDebounced (Form-level path)
  - expected: "return wrapDebounced(() => { executeAutoSaveRef.current?.(); }, debounceMs);"
  - location: Form.tsx:705
  - check: [ ] the normal (numeric-debounce) branch delegates to wrapDebounced

CLAUSE 10 — immediate adapter (debounceMs === false) keeps pending: () => false
  - expected: "pending: () => false, // Never pending when immediate"
  - location: Form.tsx:699
  - check: [ ] UNCHANGED — an immediate fn is never pending (correct as-is)

DOCS A — wrapDebounced JSDoc explains lodash shadowing (why)
  - expected: a JSDoc block above wrapDebounced (Form.tsx:851-861) stating
              lodash-es has cancel/flush but the wrapper must track pending
              explicitly because Object.assign creates a new function object.
  - check: [ ] present and accurate

DOCS B — wrapDebounced JSDoc references autosave Issue 3
  - expected: "See autosave Issue 3 (`pending()` always returned false)." (Form.tsx:860)
  - check: [ ] present

DOCS C — debouncedSubmit inline comment references wrapDebounced
  - expected: "// Normal debounce behavior — wrapDebounced gives a correct pending()." (Form.tsx:704)
  - check: [ ] present
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY (read-only) — run the Contract-Verification Map above
  - ACTION: open packages/react/src/components/Form.tsx and confirm every
            clause (1–10) and doc (A–C) is present at the cited line.
  - OUTCOME: all boxes checked. If any is missing → STOP; the tree has
             diverged from commit 0dca79a and this becomes real implementation
             (re-create per the pattern in the map). Do NOT silently proceed.
  - WHY FIRST: establishes that 95% of the task is already done; scopes the
               remaining work to exactly one comment edit.

Task 2: CONFIRM the only residual gap
  - ACTION: read the getOrCreateDebounced inline comment (Form.tsx:~652-658).
  - OBSERVE: the comment explains executeAutoSaveRef forwarding but does NOT
             name wrapDebounced (unlike the debouncedSubmit comment at 704,
             which does). This asymmetry is the one genuine doc gap.
  - DECIDE: if the comment already implicitly makes the wrapDebounced linkage
            clear enough, this task may require ZERO edits. Otherwise apply
            Task 3.

Task 3: (RESIDUAL DOC TOUCH-UP — Mode A ride-with) getOrCreateDebounced comment
  - FILE: packages/react/src/components/Form.tsx
  - TARGET: the inline comment inside getOrCreateDebounced (Form.tsx:~652-658),
            above the `const fn = wrapDebounced(...)` call at line 659.
  - EDIT: append a one-line note naming wrapDebounced and its pending()
          correctness, mirroring the debouncedSubmit comment. Suggested wording:
            // Built via wrapDebounced so this per-field timer reports a
            // correct pending() (autosave Issue 3) — the cache therefore also
            // stays pending-accurate for its whole lifetime.
  - CONSTRAINT: comment-only. Do NOT touch the wrapDebounced(...) call itself,
                the cache set/get, the deps array, or any logic.
  - GOTCHA: preserve the existing comment's substance (executeAutoSaveRef
            forwarding / cache-stability rationale) — ADD the wrapDebounced
            note, do not replace it.

Task 4: VALIDATE (no edits) — run the gates
  - RUN: pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage
  - ASSERT: the "AutoSave DebouncedFunction.pending() reflects real state
            (Issue 3)" describe block (autosave-submit-immediate.test.tsx:289)
            is green; coverage stays ≥90%.
  - ASSERT: git diff --stat shows at most packages/react/src/components/Form.tsx
            with a tiny comment-only delta (or NO diff if Task 3 was deemed
            unnecessary in Task 2).
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: the wrapDebounced shape (ALREADY in the tree — for reference only).
// Use this to sanity-check the verified code, NOT to rewrite it.
function wrapDebounced(callback: () => void, ms: number): DebouncedFunction {
  let isPending = false;
  const debounced = debounce(() => {
    isPending = false; // clear WHEN the trailing save fires (before callback)
    callback();
  }, ms);
  return Object.assign(
    () => {
      isPending = true; // a scheduling call marks us pending
      debounced();
    },
    {
      cancel: () => {
        isPending = false;
        debounced.cancel();
      },
      flush: () => {
        isPending = false;
        debounced.flush();
      },
      pending: () => isPending,
    },
  ) as DebouncedFunction;
}

// PATTERN: immediate adapter stays as-is (debounceMs === false).
//   An immediate function is never pending — keep pending: () => false.
//   submitImmediate's guard (Form.tsx:733-734) relies on this.

// CRITICAL ordering invariant: in the lodash trailing body, isPending=false
//   MUST precede callback(). If a future edit reorders these, the Issue-3
//   tests at autosave-submit-immediate.test.tsx:301+ will catch it — but do
//   not rely on that; preserve the order by inspection.
```

### Integration Points

```yaml
CONSUMER (the reason pending() must be correct):
  - location: "Form.tsx:733-734 (submitImmediate)"
  - reads: |
      const anyPending =
        debouncedSubmitRef.current?.pending() === true ||
        [...fieldDebouncersRef.current.values()].some((fn) => fn.pending());
  - note: |
      This is the real caller of wrapDebounced's pending(). Issue 1
      (submitImmediate flush) is co-dependent on Issue 3 (correct pending) —
      both shipped in commit 0dca79a. Do not change one without the other.

TYPES CONTRACT:
  - file: "packages/react/src/types.ts (lines 117-123)"
  - shape: "DebouncedFunction { (): void; cancel; flush; pending: () => boolean }"
  - note: "No interface change. wrapDebounced casts its Object.assign result to this."

SCOPE FENCES (do NOT touch in this task):
  - tests: "packages/react/src/__tests__/autosave-submit-immediate.test.tsx → P1.M2.T1.S2 (already exists)"
  - CHANGELOG / README: "P1.M3.T1 (Planned)"
  - immediate adapter: "Form.tsx:692-702 → preserve pending: () => false"
  - isDisabled limitation docs: "P1.M1.T2.S2 (in progress, parallel) → docs-only, no Form.tsx conflict"

PARALLEL EXECUTION CONTRACT:
  - P1.M1.T2.S2 (in progress) edits project docs to track the isDisabled
    React-adapter limitation. It does NOT touch Form.tsx. This task edits at
    most a comment in Form.tsx. Zero file overlap; fully independent.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After the (comment-only) touch-up
pnpm typecheck        # tsc --build — comments can't break this, but confirm
pnpm lint             # 0 errors
# Expected: zero errors. A comment edit cannot introduce a type/lint failure;
# if it does, you accidentally edited code — revert to comment-only.
```

### Level 2: Unit Tests (Component Validation)

```bash
# THE regression suite that proves pending() correctness (Issue 3) — run it.
pnpm vitest run packages/react/src/__tests__/autosave-submit-immediate.test.tsx
# Expected: the describe block at line 289 ("...pending() reflects real state")
# passes all cases (pending true-while-scheduled, false-after-fire,
# false-after-cancel, per-field + coalesced transitions).

# Per-field coalescing tests (also exercise getOrCreateDebounced → wrapDebounced)
pnpm vitest run packages/react/src/__tests__/autosave-field-debounce.test.tsx

# Immediate-adapter coverage (confirms pending: () => false path still covered)
pnpm vitest run packages/react/src/__tests__/Form.coverage.test.tsx
```

### Level 3: Full Gate Validation (System Validation)

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage
# Expected: all green; coverage ≥90% (currently ~97% statements).
# pnpm test:coverage also enforces the PRD §1.3.7 thresholds.

# Confirm the diff is comment-only (or empty):
git diff --stat
git diff packages/react/src/components/Form.tsx | grep -E "^[+-]" | grep -vE "^(\+\+\+|---|//|\*|^\+\s*$|^\-\s*$)"
# Expected: empty (no code +/- lines; only comment lines, if any).
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Prove the contract is genuinely exercised end-to-end, not just unit-tested:
# trigger a real auto-save and observe pending() flip via the test harness.
# (Already covered by autosave-submit-immediate.test.tsx:301 — no extra step
#  needed; this is a pointer, not a new command.)

# If you want a manual sanity check, render a form with a numeric debounce,
# fire a change, and — before the timer elapses — assert via a context
# capture that debouncedSubmit.pending() === true. The existing test does
# exactly this; do not duplicate it.
```

## Final Validation Checklist

### Technical Validation

- [ ] Contract-Verification Map clauses 1–10 ALL confirmed present.
- [ ] Docs A, B, C confirmed present (JSDoc + debouncedSubmit comment).
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:coverage` green.

### Feature Validation

- [ ] `pending()` regression suite (autosave-submit-immediate.test.tsx:289) green.
- [ ] Immediate adapter `pending: () => false` UNCHANGED.
- [ ] `wrapDebounced` NOT rewritten (diff is comment-only or empty).
- [ ] `getOrCreateDebounced` comment names `wrapDebounced` (symmetry touch-up applied, OR explicitly deemed unnecessary).

### Code Quality Validation

- [ ] No new files; no new tests (those are P1.M2.T1.S2 / P1.M3.T1).
- [ ] No change to `types.ts` `DebouncedFunction` interface.
- [ ] `git diff` confined to a Form.tsx comment block.
- [ ] Anti-patterns avoided (see below).

### Documentation & Deployment

- [ ] wrapDebounced JSDoc accurate (lodash-shadowing rationale + Issue 3 ref).
- [ ] Both call sites' comments reference wrapDebounced (after touch-up).
- [ ] No README/CHANGELOG edits (P1.M3.T1's scope).

---

## Anti-Patterns to Avoid

- ❌ **Don't recreate `wrapDebounced`.** It exists (commit `0dca79a`) and is
  tested. A from-scratch rewrite is the single biggest risk in this task — it
  could reorder `isPending=false`/`callback()` and silently regress Issue 3.
- ❌ Don't add `pending()` regression tests — they're `P1.M2.T1.S2` and
  ALREADY exist at `autosave-submit-immediate.test.tsx:289`. Duplicating them
  wastes effort and can cause flaky double-coverage.
- ❌ Don't "fix" the immediate adapter's `pending: () => false`. An immediate
  function is genuinely never pending; `submitImmediate`'s guard depends on it.
- ❌ Don't delegate `pending()` to lodash's `debounced.pending()`. The whole
  point of `wrapDebounced` is that `Object.assign` creates a NEW function
  object that does NOT share lodash's internal pending flag — hence the
  explicit `isPending` closure. Delegating would reintroduce Issue 3.
- ❌ Don't reorder `isPending = false` and `callback()` in the lodash trailing
  body. The clear-then-invoke order is load-bearing for correct pending state.
- ❌ Don't touch `types.ts`, `CHANGELOG.md`, `README.md`, or test files. Each
  is owned by another task (types unchanged; docs = P1.M3.T1; tests = P1.M2.T1.S2).
- ❌ Don't treat "status: Researching" in the plan as evidence the work is
  undone. The codebase is the source of truth, and it already satisfies the
  contract. Verify, finalize, and move on.

---

**Confidence Score: 9/10** for one-pass *completion* success.

Rationale: The functional implementation and its regression tests already
exist and are green in the current tree (commit `0dca79a`, combined Issue 1+3
fix). The contract-verification map lets an agent confirm every clause in a
single read of `Form.tsx:651-884`. The only genuine edit is an optional
one-line comment-symmetry touch-up in `getOrCreateDebounced`. The -1 covers
the small risk that the implementing agent, seeing "Researching" status,
ignores this PRP's "ALREADY EXISTS" banner and rewrites working code — the
banner + verification map + anti-patterns section exist precisely to prevent
that. If the agent follows the map, completion is essentially guaranteed and
the diff will be near-empty.
