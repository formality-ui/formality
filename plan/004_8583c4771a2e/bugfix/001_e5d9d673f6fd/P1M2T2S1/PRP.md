name: "P1.M2.T2.S1 — Replace forwardRef-wrapped test input components with plain function components (Issue 4)"
description: |

---

## ⚠️ CRITICAL CONTEXT — READ FIRST: THE WORK IS ALREADY SHIPPED

Before any editing, the implementing agent MUST understand that the work this
task describes is **already complete and shipped** in the current working tree.
It landed in commit **`716b44c`** — *"test(react): drop unnecessary forwardRef
wraps to silence render warnings ← Issue 4"* — which converted every affected
test input component from `React.forwardRef()` wraps to plain function
components that consume `forwardRef` from props (per PRD §20.4 option A).

**Consequence for the implementer:**
- **DO NOT rewrite or re-convert the test components.** They are already plain
  function components. Re-introducing or re-removing `React.forwardRef()` wraps
  would be a no-op churn at best and a regression at worst.
- **DO NOT create new test files** or add `forwardRef`-warning assertions. The
  contract's output gate (zero warnings) is already provably satisfied.
- This PRP is therefore a **VERIFY-AND-FINALIZE** PRP: confirm — via the
  per-file verification map below — that every contract clause (a)-(e) is
  already satisfied in the current tree, then run the validation gates to prove
  it. The expected `git diff` is **EMPTY** (or, at most, an OPTIONAL 2-line
  stale-comment cleanup in `Field.test.tsx` — see "Optional nit" below).

The honest framing: the orchestrator's task status ("Researching") reflects a
planning-time assumption that this work was still open; the actual codebase
already satisfies the contract. This PRP's job is to (a) document that fact,
(b) give the agent a precise checklist to prove it, and (c) explicitly forbid
rewriting working test components. This is the exact same situation as the
sibling tasks `P1.M2.T1.S1` and `P1.M2.T1.S2` (see their PRPs' "ALREADY
EXISTS" banners). The parallel sibling `P1.M2.T1.S2` (pending() regression
tests) is likewise already shipped — its PRP established this verify-and-
finalize pattern for this milestone.

---

## Goal

**Feature Goal**: Guarantee that **zero** `Warning: forwardRef render functions
accept exactly two parameters: props and ref. Did you forget to use the ref
parameter?` warnings appear in the `@formality-ui/react` test-suite output, and
that every shared test input component that consumes the §20 `forwardRef` prop
is a **plain function component** (not a `React.forwardRef()` wrap that ignores
its `ref` parameter). This is PRD Issue-4 (Minor — test hygiene).

**Deliverable**:
1. **Verification** (no code change expected): confirm, via the per-file map
   below, that all 7 fix-list files already use plain function components
   consuming `forwardRef` from props, and that the 4 "fine" files either wire
   the `ref` parameter or accept a 2-param signature (so they don't warn).
2. **Validation**: run `npx vitest run` (react suite) and prove zero forwardRef
   warnings; confirm all tests still pass; confirm empty (or comment-only)
   `git diff`.
3. **No new files. No new tests. No component rewrites** unless a genuine gap
   is found (none is expected — the suite already runs with 0 warnings).

**Success Definition**:
1. `grep -c "forwardRef render functions accept exactly two parameters"` over
   the full react test-run output === **0**.
2. All 989 react tests still pass (5 skipped — unchanged).
3. `git diff --stat` is empty, OR contains only an optional 2-line stale-comment
   edit in `Field.test.tsx` (see "Optional nit").
4. No test component was re-wrapped in `React.forwardRef()` and none was
   reverted to the warning-triggering shape.

## User Persona

**Target User**: Maintainers running `npx vitest run` (and CI). The warnings
pollute test output, mask real failures, and signal (falsely) that the test
components are mis-authored.

**Use Case**: A maintainer runs the suite and sees clean output — no spurious
forwardRef warnings burying real signal.

**User Journey**: Maintainer runs `npx vitest run` → stderr is clean (no
forwardRef arity warnings) → only legitimate test logging remains → real
failures/warnings are immediately visible.

**Pain Points Addressed**: Dozens of cosmetic `forwardRef render functions
accept exactly two parameters` warnings in `--coverage` runs that made test
output noisy and suggested the §20 contract was being violated when it wasn't.

## Why

- **Test-suite hygiene (PRD Issue-4).** Cosmetic warnings undermine confidence
  in green runs and can hide real warnings. Zero-noise output is the bar.
- **Consistency with the §20 contract.** PRD §20.4 option A delivers the RHF
  ref as a top-level `forwardRef` prop; test components that consume it should
  be plain function components, not `React.forwardRef()` wraps (the wrap is
  unnecessary and — when the `ref` param is omitted — warns).
- **Closes out the P1.M2 milestone's test-hygiene half.** P1.M2.T1 (Issue 3,
  pending()) + P1.M2.T2 (Issue 4, this task) are the two Minor items; both are
  already shipped, so this task + its sibling finalize the milestone for
  documentation/changeset purposes (feeds P1.M3.T1).

## What

A verification that the forwardRef-warning fix (commit `716b44c`) is complete
and correct. No user-visible behavior, no API surface, no config — test-only
hygiene, already shipped.

### Success Criteria

- [ ] `npx vitest run` (react suite) exits 0 with 989 passed / 5 skipped.
- [ ] **Zero** `forwardRef render functions accept exactly two parameters`
      warnings in the run output (`grep -c` → 0).
- [ ] All 7 fix-list files confirmed to use plain function components
      consuming `forwardRef` from props with `ref={forwardRef}` on the inner
      DOM element.
- [ ] The 4 "fine" files confirmed to not warn (wire `ref`, or 2-param arity).
- [ ] `git diff --stat` is empty OR comment-only (Field.test.tsx stale comments).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the exact
warning string and its trigger condition (forwardRef render fn with < 2
params), the §20.4 option A contract (forwardRef delivered as a prop), the
exact list of fix-list vs. "fine" files, the already-shipped commit, the per-
file verification map with line numbers, and the validation commands. All
cited below with exact paths/lines. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ - include in context window before implementing
- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M2T2S1/research/issue4_verification.md
  section: full doc (short)
  why: |
    AUTHORITATIVE verification evidence. Contains the definitive proof (full
    suite: 989 passed, grep -c warnings = 0), the per-file verification table
    for all 7 fix-list files + 4 "fine" files with exact line numbers, the
    false-positive disambiguation for Field.test.tsx, and the contract-to-code
    traceability matrix. Read this FIRST.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/system_context.md
  section: "Issue 4 (Minor): forwardRef warnings — ✅ FIXED" (~L169-176)
  why: |
    Architecture doc's own assessment that Issue 4 is fixed and which files are
    intentionally left using forwardRef (they wire the ref). Confirms commit
    716b44c. NOTE: this doc predates the final verify; trust the research doc's
    live test-run evidence as the ground truth.

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M2T1S2/PRP.md
  section: "⚠️ CRITICAL CONTEXT — READ FIRST" banner
  why: |
    The PARALLEL SIBLING. It established the verify-and-finalize pattern for
    this milestone (its work — pending() regression tests — was also already
    shipped in the same combined commit). This PRP mirrors that framing. The
    two tasks are fully independent (different files, different concerns) and
    can finalize in either order.

- file: packages/react/src/__tests__/Field.test.tsx
  section: TestInput (L28-50) + TestSwitch (L65-86)
  why: |
    The canonical example of the ALREADY-APPLIED target pattern. Note the
    slightly STALE comments at L31-32 and L71 ("The React.forwardRef wrap is
    retained for shape compatibility") — the wrap is NOT retained (the code is
    a plain component); these comments are the ONLY optional cleanup (see
    "Optional nit"). The component code itself is correct.
  pattern: |
    const TestInput = ({ value, onChange, ..., forwardRef, ...props }:
      TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }) => (
      <input ref={forwardRef} ... />
    );

- file: packages/react/src/__tests__/Form.coverage.test.tsx
  section: TestInput (L37-46) + TestSwitch (L64-73)
  why: |
    Second fix-list file; same plain-component pattern. §20 comment at L35.

- file: packages/react/src/__tests__/autosave-validation.test.tsx
  section: TestInput (L37-47) + TestSwitch (L57-66)
  why: |
    Representative of the 5 autosave-*.test.tsx fix-list files (validation,
    field-debounce, rapid-changes, async-timing, submit-immediate all share the
    identical pattern + §20 comment). Verify each has `forwardRef` in the destructure
    list and `ref={forwardRef}` on the inner input.

- file: packages/react/src/__tests__/FormalityProvider.test.tsx
  why: |
    A "fine" file (NOT to be changed). Uses forwardRef<HTMLInputElement, ...>(
    (props, ref) => (<input ref={ref} />)) @ L28 — 2-param signature AND wires
    ref={ref}, so it does NOT warn. Listed here so the implementer knows to
    LEAVE IT ALONE.

- file: packages/react/src/__tests__/Field.subscriptionStability.test.tsx
  section: TestInput (L36-49)
  why: |
    A "fine" file (NOT to be changed) that is the subtle case: it uses
    forwardRef<...>((..., _ref) => (... ref={forwardRef})) — wrapped in
    React.forwardRef but accepts the ref param as `_ref` (2-param arity) and
    wires the forwardRef PROP instead. React only warns when arity < 2, so this
    does NOT warn. The item description explicitly lists it as fine. Do NOT
    convert it (out of scope).

- url: https://react.dev/reference/react/forwardRef
  why: |
    Documents the render-function contract: forwardRef render functions receive
    (props, ref). React warns when the function is declared with fewer than 2
    parameters (the common mistake of writing (props) => ... and forgetting
    ref). This is WHY the fix is "plain component consuming forwardRef prop"
    (avoids the wrap entirely) OR "2-param signature that uses ref" — both are
    warning-free. Confirms the 4 "fine" files are correct.
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/__tests__/
├── Field.test.tsx                       # ✅ PLAIN TestInput/TestSwitch (L35,L73) — FIX-LIST, DONE
├── Form.coverage.test.tsx               # ✅ PLAIN TestInput/TestSwitch (L37,L64) — FIX-LIST, DONE
├── autosave-validation.test.tsx         # ✅ PLAIN (L37,L57)              — FIX-LIST, DONE
├── autosave-field-debounce.test.tsx     # ✅ PLAIN (L35)                  — FIX-LIST, DONE
├── autosave-rapid-changes.test.tsx      # ✅ PLAIN (L40)                  — FIX-LIST, DONE
├── autosave-async-timing.test.tsx       # ✅ PLAIN (L43)                  — FIX-LIST, DONE
├── autosave-submit-immediate.test.tsx   # ✅ PLAIN (L47)                  — FIX-LIST, DONE
├── FormalityProvider.test.tsx           # — uses forwardRef, WIRES ref    — FINE (no change)
├── useFormState.test.tsx                # — uses forwardRef, WIRES ref    — FINE (no change)
├── priorityOrder.simple.test.tsx        # — uses forwardRef, WIRES ref    — FINE (no change)
├── Field.subscriptionStability.test.tsx # — forwardRef + _ref (2-param)   — FINE (no change)
├── Field.forwardRef.test.tsx            # — tests forwardRef delivery     — FINE (no change)
└── FieldForwardRef.acceptance.test.tsx  # — tests forwardRef delivery     — FINE (no change)
```

### Desired Codebase tree with files to be added

```bash
# No files added. No structural change. (Optional: 2 stale-comment lines in
# Field.test.tsx may be tidied — see "Optional nit".)
packages/react/src/__tests__/   # unchanged structure
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: The React warning fires ONLY when a forwardRef render function is
// declared with FEWER THAN 2 parameters. A 2-param signature (props, ref) —
// even if `ref` is renamed `_ref` and unused — does NOT warn. This is why
// Field.subscriptionStability.test.tsx (forwardRef + _ref) is "fine" and must
// NOT be converted (out of scope, and it doesn't warn).

// CRITICAL: This is a VERIFY-AND-FINALIZE task. The fix shipped in commit
// 716b44c. Do NOT re-wrap or re-unwrap components. Do NOT add @ts-ignore or
// suppress-warnings config. Do NOT add eslint rules to silence the warning —
// the components are genuinely correct now.

// GOTCHA: Field.test.tsx contains the strings "React.forwardRef" in COMMENTS
// (L31, L71, L2128, L2131, L2134) and in a deliberate migration-REGRESSION
// test section (L2131+). A naive `grep React.forwardRef` will flag it as
// "still wrapped" — it is NOT. The actual TestInput/TestSwitch (L35, L73) are
// plain function components. Trust the component definitions, not the grep.

// GOTCHA: §20.4 option A = Formality delivers RHF's ref as a top-level
// enumerable `forwardRef` PROP (not React's reserved `ref` key). So test
// components destructure `forwardRef` from props and wire `ref={forwardRef}`
// on the inner DOM element. This is the target shape; it is already in place.

// SCOPE FENCES (do NOT touch in this task):
#   FormalityProvider.test.tsx, useFormState.test.tsx,
#   priorityOrder.simple.test.tsx, Field.subscriptionStability.test.tsx,
#   Field.forwardRef.test.tsx, FieldForwardRef.acceptance.test.tsx → FINE, no change
#   packages/react/src/** (non-test source)        → READ ONLY
#   packages/react/README.md, CHANGELOG.md         → P1.M3.T1 (changeset docs)
#   vitest.config.ts, tsconfig*.json               → no change
#   The pending() work (Issue 3 / P1.M2.T1.*)      → sibling task, fully independent
```

## Implementation Blueprint

### Data models and structure

No models. No new code. This is a verification of an already-shipped test-only
hygiene fix.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY the fix is already in place (no edits — read-only audit)
  - FOR EACH of the 7 fix-list files, open it and confirm TestInput/TestSwitch
    is a PLAIN function component:
      const Test{Input,Switch} = ({ ..., forwardRef, ... }: ... & {
        forwardRef?: React.Ref<HTMLInputElement>
      }) => (<... ref={forwardRef} ... />);
    Files + component locations:
      Field.test.tsx                     L35 (TestInput), L73 (TestSwitch)
      Form.coverage.test.tsx             L37 (TestInput), L64 (TestSwitch)
      autosave-validation.test.tsx       L37 (TestInput), L57 (TestSwitch)
      autosave-field-debounce.test.tsx   L35 (TestInput)
      autosave-rapid-changes.test.tsx    L40 (TestInput)
      autosave-async-timing.test.tsx     L43 (TestInput)
      autosave-submit-immediate.test.tsx L47 (TestInput)
  - ASSERT per file: (a) NO `React.forwardRef(` / `forwardRef<...>(` wrap around
    the component; (b) `forwardRef` is in the destructure list; (c) the inner
    DOM element has `ref={forwardRef}`; (d) a §20.4 option A comment is present.
  - NOTE: Field.test.tsx will show "React.forwardRef" in COMMENTS/Regression
    section only — that is expected; the component itself is plain. Do not flag.

Task 2: VERIFY the "fine" files do not warn (no edits)
  - Confirm each "fine" file either wires the ref param OR uses a 2-param
    signature (so arity ≥ 2 → no React warning):
      FormalityProvider.test.tsx         forwardRef<...>((props, ref) => <input ref={ref}/>)  ✓ wires ref
      useFormState.test.tsx              (..., ref) => <input ref={ref}/>                      ✓ wires ref
      priorityOrder.simple.test.tsx      (..., ref) => <input ref={ref}/>                      ✓ wires ref
      Field.subscriptionStability.test.tsx  forwardRef<...>((..., _ref) => <input ref={forwardRef}/>) ✓ 2-param
  - ASSERT: none of these need changing (item-description NOTE explicitly lists
    them as fine). Do NOT convert Field.subscriptionStability (out of scope).

Task 3: RUN the validation gates (the actual proof)
  - RUN: npx vitest run --dir packages/react/src/__tests__ 2>&1 | tee /tmp/t4_run.txt
  - ASSERT: "Test Files  37 passed (37)" and "Tests  989 passed | 5 skipped".
  - ASSERT: grep -c "forwardRef render functions accept exactly two parameters" /tmp/t4_run.txt → 0
  - ASSERT: grep -ciE "forwardRef render|exactly two parameters" /tmp/t4_run.txt → 0
  - WHY: this is the contract's OUTPUT gate. Zero warnings = done.

Task 4 (OPTIONAL — only if you choose to tidy stale comments): Field.test.tsx
  - IF DESIRED (not required by contract), update the two stale comments in
    Field.test.tsx that say "The React.forwardRef wrap is retained for shape
    compatibility" (L31-32 and L71) to reflect reality, e.g.:
      "// Plain function component — §20 delivers forwardRef as a prop, so the
       // React.forwardRef() wrap is unnecessary (and would warn about an unused
       // ref param). The inner input wires the forwardRef prop."
  - CONSTRAINT: touch ONLY those comment lines. Do NOT change any component code.
  - IF you skip this, the contract is still satisfied (comments are cosmetic).
  - SKIP IF IN DOUBT — an empty diff fully satisfies the task.

Task 5: FINAL regression sweep
  - RUN: npx vitest run (full repo, or at least the react workspace)
  - ASSERT: all green, zero forwardRef warnings.
  - RUN: git diff --stat
  - ASSERT: empty, OR only Field.test.tsx comment lines (if Task 4 applied).
  - ASSERT: git status shows no new/untracked test files.
```

### Implementation Patterns & Key Details

```tsx
// ===== The ALREADY-SHIPPED target pattern (do not recreate — just verify) =====
// Before (commit 716b44c, the warning-triggering shape):
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, name, forwardRef, ...props }) => (   // ← 1 param: ignores ref → WARNS
    <input ref={forwardRef} ... />
  ),
);
// After (current tree — already in place in all 7 fix-list files):
const TestInput = ({
  value, onChange, name, forwardRef, ...props               // ← forwardRef consumed from props
}: TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }) => (
  <input ref={forwardRef} ... />                            // ← wired on inner DOM element
);
// No React.forwardRef wrap → no render-function arity check → no warning. ✓

// ===== Why the "fine" files don't warn (do NOT change them) =====
// Pattern 1 — wires the ref param (FormalityProvider, useFormState, priorityOrder):
const TestInput = forwardRef<HTMLInputElement, TestInputProps>((props, ref) => (
  <input ref={ref} />     // ← 2-param signature + ref used → no warning
));
// Pattern 2 — 2-param arity, ref accepted-but-renamed (Field.subscriptionStability):
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, ...rest }, _ref) => (     // ← 2 params → arity OK → no warning
    <input ref={forwardRef} ... />     // ← wires the forwardRef PROP instead
  ),
);
// React only warns when arity < 2. Both patterns are warning-free. Leave them.
```

### Integration Points

```yaml
NONE — this is a test-only hygiene task with no integration surface.
  - No source changes (packages/react/src/** non-test files untouched).
  - No config changes (vitest.config.ts, tsconfig*.json untouched).
  - No API/config/docs surface change (item DOCS §5: none).
  - The "examples are type-clean / tests are warning-free" narrative feeds the
    changeset docs task P1.M3.T1 (README/CHANGELOG), which is separate.

PARALLEL/SEQUENCE CONTRACT:
  - Sibling P1.M2.T1.S2 (pending() regression tests) is ALSO already shipped
    and is a verify-and-finalize task. It touches autosave-submit-immediate.test.tsx
    (the pending() describe block) — a DIFFERENT section than this task's
    TestInput/TestSwitch components in the same file. No textual conflict: this
    task audits the component definitions (top of file), the sibling audits the
    pending() describe block (mid file). Both can finalize in either order.
  - Dependency: none blocked. Issue 4 (this) and Issue 3 (sibling) are independent.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Confirm no test file still wraps a fix-list component in React.forwardRef.
# (Field.test.tsx will match on COMMENT text — that is a known false positive;
#  verify the actual const TestInput/TestSwitch definitions are plain.)
for f in Field.test.tsx Form.coverage.test.tsx \
         autosave-validation.test.tsx autosave-field-debounce.test.tsx \
         autosave-rapid-changes.test.tsx autosave-async-timing.test.tsx \
         autosave-submit-immediate.test.tsx; do
  echo "--- $f ---"
  grep -nE "const Test(Input|Switch) =|ref=\{forwardRef\}|forwardRef\?" \
    "packages/react/src/__tests__/$f" | head -6
done
# Expected: each file shows `const TestInput = ({` (plain) + `ref={forwardRef}`.

# Repo-wide lint/typecheck must stay green (we changed nothing, but confirm):
pnpm lint
pnpm typecheck
# Expected: zero errors.
```

### Level 2: Per-File Component Verification (Component Validation)

```bash
# For each fix-list file, assert the component is plain + wires forwardRef:
for f in Field.test.tsx Form.coverage.test.tsx autosave-validation.test.tsx \
         autosave-field-debounce.test.tsx autosave-rapid-changes.test.tsx \
         autosave-async-timing.test.tsx autosave-submit-immediate.test.tsx; do
  if grep -qE "= forwardRef<|React\.forwardRef\(" "packages/react/src/__tests__/$f" \
     && ! grep -qE "// (React\.)?forwardRef|migration regression|acceptance" "packages/react/src/__tests__/$f"; then
    echo "REVIEW (possible real wrap outside comments): $f"
  else
    echo "PLAIN or comment-only: $f"
  fi
done
# Expected: all "PLAIN or comment-only". Field.test.tsx is comment-only — OK.

# Confirm the §20.4 option A comment is present in each fix-list file:
grep -rln "§20 delivers .forwardRef. as a prop\|§20.4 option A\|Plain function component" \
  packages/react/src/__tests__/{Field,Form.coverage,autosave-*}.test.tsx
# Expected: all 7 files listed.
```

### Level 3: Full Test-Suite Validation (System Validation)

```bash
# THE headline gate for this task: zero forwardRef warnings + all green.
npx vitest run --dir packages/react/src/__tests__ 2>&1 | tee /tmp/t4_run.txt | tail -8
# Expected: "Test Files  37 passed (37)", "Tests  989 passed | 5 skipped".

# The contract's OUTPUT gate — must be ZERO:
grep -c "forwardRef render functions accept exactly two parameters" /tmp/t4_run.txt
# Expected: 0
grep -ciE "forwardRef render|exactly two parameters" /tmp/t4_run.txt
# Expected: 0

# Full repo sanity (no collateral damage — we changed nothing):
pnpm test
# Expected: green.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Prove the diff is empty (or comment-only) — the strongest guarantee for an
# already-shipped verify task:
git diff --stat
# Expected: empty, OR only packages/react/src/__tests__/Field.test.tsx (if the
# optional stale-comment cleanup was applied).

# If Field.test.tsx was touched, prove ONLY comment lines changed:
git diff packages/react/src/__tests__/Field.test.tsx | grep -E "^[+-]" | grep -vE "^[+-]{3}|//|^\s*$"
# Expected: empty (no code lines changed, only // comment lines).

# Prove no NEW test files were created:
git status --short packages/react/src/__tests__/
# Expected: no untracked .test.tsx files.

# (Optional) Cross-check with coverage run, since the original report used --coverage:
npx vitest run --coverage --dir packages/react/src/__tests__ 2>&1 | \
  grep -c "forwardRef render functions accept exactly two parameters"
# Expected: 0 (coverage run is also warning-free).
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `pnpm lint`, `pnpm typecheck` green (no regressions — nothing changed).
- [ ] Level 3: `npx vitest run --dir packages/react/src/__tests__` → 37 files, 989 passed / 5 skipped.
- [ ] Level 3: `grep -c "forwardRef render functions accept exactly two parameters"` → **0**.
- [ ] Level 4: `git diff --stat` empty OR Field.test.tsx comment-only.

### Feature Validation

- [ ] All 7 fix-list files: TestInput/TestSwitch are plain function components.
- [ ] All 7 fix-list files: `forwardRef` destructured from props; `ref={forwardRef}` on inner DOM.
- [ ] All 7 fix-list files: §20.4 option A explanatory comment present.
- [ ] The 4 "fine" files unchanged and confirmed non-warning (wire ref / 2-param arity).
- [ ] Zero forwardRef warnings in the full test-run output.

### Code Quality Validation

- [ ] No component was re-wrapped in `React.forwardRef()`.
- [ ] No component was reverted to the warning-triggering (1-param) shape.
- [ ] No `@ts-ignore` / warning-suppression config / eslint silencing added.
- [ ] No new test files created.
- [ ] Anti-patterns avoided (see below).

### Documentation & Deployment

- [ ] No README/CHANGELOG/config/API surface change (item DOCS §5: none).
- [ ] The "test suite is warning-free" fact is available to feed P1.M3.T1
      (changeset docs) — but this task makes no doc edits itself.

---

## Anti-Patterns to Avoid

- ❌ Don't rewrite or re-convert the test components — they are already plain
  function components (commit `716b44c`). Re-wrapping/rewriting is pure churn
  and risks introducing a regression.
- ❌ Don't convert `Field.subscriptionStability.test.tsx` — it uses
  `forwardRef<...>((..., _ref) => ...)` with 2-param arity, so it does NOT warn.
  The item description explicitly lists it as fine. It is out of scope.
- ❌ Don't touch `FormalityProvider.test.tsx`, `useFormState.test.tsx`, or
  `priorityOrder.simple.test.tsx` — they wire the `ref` param legitimately and
  do not warn. They are reference examples of the *correct* forwardRef usage.
- ❌ Don't add `@ts-ignore`, console-suppression, or an eslint rule to silence
  the warning. The components are genuinely correct now; suppression would hide
  future real warnings.
- ❌ Don't create new test files or add a "no forwardRef warning" assertion test.
  The contract's output gate is a runtime grep, not a new test.
- ❌ Don't trust a naive `grep React.forwardRef` on `Field.test.tsx` — it matches
  COMMENT text and the migration-regression section, not the component defs.
  Read the actual `const TestInput = (...)` definitions.
- ❌ Don't conflate this task with the sibling `P1.M2.T1.S2` (pending() tests).
  They share `autosave-submit-immediate.test.tsx` but touch different sections
  (components vs. pending() describe block). No conflict, but stay in your lane.
- ❌ Don't edit `packages/react/src/**` non-test source, READMEs, CHANGELOG, or
  config — out of scope (owned by source authors / P1.M3.T1).
- ❌ Don't declare the task done without running `npx vitest run` and grepping
  the output — the runtime zero-warning proof IS the deliverable.

---

**Confidence Score: 10/10** for one-pass finalization success.

Rationale: The work is **already shipped and verified**. A full `npx vitest run`
on the current tree produced **989 passed / 5 skipped with zero** forwardRef
warnings (`grep -c` = 0). Every one of the 7 fix-list files was read and
confirmed to contain a plain function component consuming `forwardRef` from
props with `ref={forwardRef}` on the inner DOM element. The 4 "fine" files were
confirmed non-warning (3 wire the `ref` param; `Field.subscriptionStability`
uses 2-param arity). The only conceivable edit is an OPTIONAL 2-line stale-
comment cleanup in `Field.test.tsx`, which is explicitly not required by the
contract. There is no implementation risk because there is no implementation to
do — only verification, and the verification is already complete and
reproducible. The 10/10 (vs the sibling's 9/10) reflects that this task's
success criterion (a runtime grep) is binary and already green, with no
dependency on the sibling's outcome.
