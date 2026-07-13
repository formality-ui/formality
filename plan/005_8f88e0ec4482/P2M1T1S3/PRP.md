name: "P2.M1.T1.S3 — Verify Field behavioral parity after extraction"
description: |

---

## Goal

**Feature Goal**: PROVE that the `useField` extraction (P2.M1.T1.S2) preserved
**100% of `<Field>`'s behavior**, DIAGNOSE & FIX any regression by reconciling
the extracted logic against the original `Field.tsx` (git-diff comparison), and
ADD isolated `renderHook` tests so `useField` is directly testable in isolation
(not only indirectly through `<Field>`). This is the **behavioral-parity gate**
that closes gap_analysis **G6** for P2.M1.T1 — the extraction is only "done"
when the full suite is green and the hook is independently exercisable.

**Deliverable**:
1. **Green full test suite** at the verified baseline of **1018 passed | 5 skipped**
   (`pnpm test`) — the 7 parity-gate test files pass UNMODIFIED.
2. **Green `pnpm typecheck`** — including the `__typechecks__/useField.test-d.ts`
   `UseFieldReturn ≡ FieldRenderAPI` assertion.
3. **Green `pnpm test:coverage`** — ≥ 90% on statements/branches/functions/lines.
4. **`packages/react/src/__tests__/useField.test.tsx` (MODIFY)**: expand S2's
   single smoke test into a focused set of **isolated `renderHook` tests**
   asserting the `useField` DIRECT contract (`UseFieldReturn` shape, watcher
   ownership, hidden→`null`, render-prop application) — adding tests only for
   branches the integration tests reach obliquely, not duplicating `Field.test.tsx`.
5. **(CONDITIONAL) FIXES to `useField.ts` / `Field.tsx`**: if ANY parity-gate
   test fails, reconcile the drifted block back to byte-identity with the
   original `Field.tsx` (git diff) and re-run. Fixes are "restore original
   behavior," NEVER "change behavior to fit a test."

**Success Definition**:
- `pnpm test` reports **1018 passed | 5 skipped** (the pre-S2 baseline) PLUS any
  new isolated `useField` tests S3 adds. NO parity-gate test count drops.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` all green.
- `pnpm test:coverage` ≥ 90% on all four metrics.
- `useField` is exercisable directly via `renderHook` (new isolated tests pass).
- The 7 parity-gate test files (`Field.test.tsx`, `Field.forwardRef.test.tsx`,
  `FieldForwardRef.acceptance.test.tsx`, `Field.subscriptionStability.test.tsx`,
  `render-isolation.test.tsx`, `integration/complete-form.test.tsx`,
  `validation-report-fixes.test.tsx`) are **byte-for-byte UNCHANGED** from their
  pre-S2 state (`git diff` on these files is empty).

## User Persona (if applicable)

**Target User**: Formality React-adapter maintainer responsible for shipping the
v1.0 `useField` extraction without behavioral regressions, and future adapter
authors who want to call `useField` directly (not via `<Field>`).

**Use Case**: After the S2 extraction, the maintainer runs the full suite to
confirm no regression, then exercises `useField` in isolation to prove the hook
is independently testable — both gates must be green before P2.M1.T1 is closed.

**User Journey**: S2 lands the extraction → S3 runs `pnpm test` → (a) all green:
add isolated `useField` tests + run coverage/typecheck → done; OR (b) a test
fails: `git diff` the extracted block against the original, reconcile to
byte-identity, re-run → then add isolated tests → done.

**Pain Points Addressed**: The riskiest move in P2 (moving ~270 lines out of a
702-line `Field.tsx`) can silently break subtle behaviors (forwardRef delivery,
setValue ref pattern, subscription stability). S3 is the safety net that catches
& fixes those regressions before P2.M1.T1 is declared complete.

## Why

- **The extraction is only "done" when parity is proven.** S2 relocated logic
  block-by-block; a single drifted line (a dropped ref assignment, a changed
  effect dep array, a reordered hook) can break a behavior that only surfaces in
  one of 1018 tests. S3 is the verification step that catches it.
- **De-risk the highest-risk change in P2.** Moving the Controller + parse/format
  + validation + forwardRef + subscription logic is the riskiest refactor in the
  plan. The 7-file parity gate + the git-diff diagnostic procedure give a
  deterministic way to find and fix regressions.
- **Make `useField` independently testable.** Today every `useField` behavior is
  asserted only through `<Field>`. Adding isolated `renderHook` tests proves the
  hook's direct contract and gives future adapter authors a testable seam.
- **Non-breaking by construction.** S3 only restores original behavior (never
  changes it) and only adds tests. The 1018/5 baseline is preserved.

## What

S3 is a **verify → diagnose → fix-back-to-parity → add-isolated-tests** loop.
Run the 4 gates; if all green, add the isolated tests and finish. If a gate
fails, diff the extracted block against the original `Field.tsx`, reconcile to
byte-identity, re-run, then add the isolated tests.

### Success Criteria

- [ ] `pnpm test` reports **1018 passed | 5 skipped** (baseline) + new isolated
      `useField` tests. NO parity-gate test count drops.
- [ ] The 7 parity-gate test files are UNCHANGED (`git diff` empty on them).
- [ ] `pnpm typecheck` green (incl. `useField.test-d.ts` equivalence).
- [ ] `pnpm lint` green; `pnpm build` green.
- [ ] `pnpm test:coverage` ≥ 90% on statements/branches/functions/lines.
- [ ] `useField.test.tsx` contains isolated `renderHook` tests (beyond S2's smoke
      test) asserting the `UseFieldReturn` contract directly.
- [ ] IF any parity regression was found, the fix reconciles `useField.ts`/
      `Field.tsx` to byte-identity with the original (documented in the PRP).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the verified
baseline test count (1018/5), the exact 7 parity-gate files and what each
guards, the three high-risk regression areas (forwardRef/setValue/subscription)
with their PRD anchors and guards, the git-diff diagnostic procedure, the
isolated-hook renderHook pattern (`useFormState.test.tsx`'s `createWrapper`),
the validation commands, and the sibling boundaries. All cited below with paths.
✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/005_8f88e0ec4482/P2M1T1S3/research/research-notes.md
  why: |
    THIS TASK'S FIELD GUIDE. The verified baseline (§1), the 7 parity-gate files
    + what each guards (§2), the 3 high-risk regression areas with PRD anchors +
    guards + regression symptoms (§3), the git-diff diagnostic procedure (§4), the
    isolated-hook test pattern + candidate tests (§5), the validation gates (§6).
    READ THIS FIRST.

- docfile: plan/005_8f88e0ec4482/P2M1T1S2/PRP.md
  why: |
    The PREV step (the extraction) — the CONTRACT for what S2 produced. Read the
    "Design Decision: Controller ownership" (hook owns <Controller> + callback,
    NOT useController, NO state-capture), the "What MUST be preserved verbatim"
    parity contract (§5 of S2 research), and the Anti-Patterns (FORBIDDEN:
    useController, state-capture during Controller render, moving registration
    into the hook, reordering relocated logic). If S3 finds a regression, it is
    almost always a violation of one of these.

- docfile: plan/005_8f88e0ec4482/P2M1T1S2/research/research-notes.md
  section: "§2 The extractable logic in Field.tsx (line map)"
  why: |
    The line-by-line map of each Field.tsx block → its destination in useField.ts.
    This is the reconciliation key for the git-diff diagnostic: if a test fails,
    find the responsible block in this table, diff it, and restore byte-identity.

- docfile: plan/005_8f88e0ec4482/P2M1T1S1/PRP.md
  why: |
    The contract step. It LOCKED `UseFieldParams`/`UseFieldReturn` field sets and
    established the `UseFieldReturn ≡ FieldRenderAPI` bidirectional-assignability
    assertion. S3 must NOT touch these interfaces; the test-d file guards them.

- docfile: PRD.md §20 Field ref delivery via forwardRef (h2.21)
  why: |
    The forwardRef delivery contract — the #1 high-risk regression area. §20.1
    (component path: forwardRef-exclusive), §20.4 (host-element path: translate
    forwardRef→ref + strip non-DOM keys), §20.5 (acceptance criteria), §20.6
    (testing requirements). If a forwardRef test fails, the extracted block
    diverged from §20.1/§20.4 — reconcile.

- docfile: PRD.md §5.3 Field Component (h3.18) + §7.1.1 setValue Application
    Mechanism (h4.48)
  why: |
    §5.3 is the Field behavior catalog (the parity contract). §7.1.1 is the
    setValue ref pattern (the #2 high-risk area: refs assigned every render, NOT
    in deps, + the `currentValue !== value` infinite-loop guard).

- docfile: PRD.md §1.3.7 Testing Strategy (h4.6)
  why: The 90% coverage gate (statements/branches/functions/lines) that S3 must keep green.

- file: packages/react/src/__tests__/useFormState.test.tsx
  section: L1-58 (imports, TestInput, testInputs, createWrapper)
  why: |
    The CANONICAL isolated-hook pattern. `createWrapper` mounts
    <FormalityProvider inputs={testInputs}><Form config={...} record={...}>{children}</Form></FormalityProvider>
    and is passed to renderHook(callback, { wrapper }). REUSE this exact shape
    for useField's isolated tests (useField needs the full FormContext/ConfigContext/
    GroupContext that a real <Form> provides — a bare FormContext.Provider mock
    is insufficient because useField mounts a <Controller> against methods.control).

- file: packages/react/src/__tests__/useSubscriptions.test.tsx
  section: L1-90 (createMockContext, createWrapper with FormContext.Provider)
  why: |
    The MOCKED-context renderHook pattern — useful ONLY for asserting that useField
    calls registerWatcherSetter/unregisterWatcherSetter (spy on the mock fns).
    Prefer the REAL-Form wrapper (useFormState pattern) for behavior assertions;
    use the mock only for call-count/arg assertions on context fns.

- file: packages/react/src/__tests__/Field.test.tsx
  why: |
    THE master parity gate (95 describes/its across 24 describe blocks). Do NOT
    edit it. Read its describe headers (§2 of research-notes catalogs them) to
    map a failing assertion → the Field behavior → the responsible relocated block.

- file: packages/react/src/__tests__/Field.subscriptionStability.test.tsx
  why: |
    The dedicated max-update-depth regression guard. Its file header documents
    the EXACT root cause it pins (useInferredInputs returning a new array ref
    every render → allSubscriptions busts → subscription effect re-runs every
    render → setState-in-effect → max-depth). If THIS test fails, the extraction
    broke the signature-stable memo or the effect deps.

- file: packages/react/src/hooks/useField.ts
  why: |
    The S2 implementation. If a parity test fails, the regression is a drifted
    block HERE (or in the thinned Field.tsx). Reconcile against the original.

- file: packages/react/src/components/Field.tsx
  why: |
    The S2-thinned wrapper. After S2 it should contain ONLY: prop destructure,
    useFormContext() for registerField/unregisterField, the registration useEffect,
    the useField(params) call, and `return renderedField`. If it still contains
    Controller/mergeFieldProps/parse/format logic, S2 is incomplete → flag it.

- file: packages/react/src/__typechecks__/useField.test-d.ts
  why: |
    The UseFieldReturn ≡ FieldRenderAPI bidirectional-assignability assertion.
    Consumed by `pnpm typecheck`. If it errors, the interface field set drifted
    (S2/S3 must NOT have touched it — investigate S1's contract).
```

### Current Codebase tree (relevant slice — POST-S2 state assumed)

```bash
packages/react/src/
├── components/
│   └── Field.tsx              # POST-S2: THIN wrapper (registration effect + useField + return renderedField)
├── hooks/
│   └── useField.ts            # POST-S2: REAL impl (owns Controller + parse/format + validation + forwardRef + ...)
├── __tests__/
│   ├── Field.test.tsx                       # PARITY GATE — UNCHANGED (24 describes / ~60 its)
│   ├── Field.forwardRef.test.tsx            # PARITY GATE — UNCHANGED (1 it: §20.1 proof)
│   ├── FieldForwardRef.acceptance.test.tsx  # PARITY GATE — UNCHANGED (4 its: §20.6 acceptance)
│   ├── Field.subscriptionStability.test.tsx # PARITY GATE — UNCHANGED (1 it: max-depth guard)
│   ├── render-isolation.test.tsx            # PARITY GATE — UNCHANGED (15 its)
│   ├── integration/complete-form.test.tsx   # PARITY GATE — UNCHANGED (37 describes/its)
│   ├── validation-report-fixes.test.tsx     # PARITY GATE — UNCHANGED (provideState/passSubscriptions)
│   └── useField.test.tsx                    # S2 smoke test → S3 EXPANDS with isolated renderHook tests
├── __typechecks__/
│   └── useField.test-d.ts    # UseFieldReturn ≡ FieldRenderAPI (UNCHANGED — typecheck guard)
└── index.ts                  # POST-S2: exports useField + UseFieldParams + UseFieldReturn
```

### Desired Codebase tree with files to be modified by S3

```bash
packages/react/src/__tests__/useField.test.tsx   # MODIFY: expand smoke test → focused isolated renderHook tests
# CONDITIONAL (only if a parity regression is found):
#   packages/react/src/hooks/useField.ts         # FIX: reconcile drifted block to byte-identity with original Field.tsx
#   packages/react/src/components/Field.tsx      # FIX: (only if the wrapper itself drifted)
# NEVER MODIFIED by S3: the 7 parity-gate test files, useField.test-d.ts, index.ts, overlays.ts, UseFieldParams/UseFieldReturn
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL — S3 is VERIFY-FIRST. Do NOT preemptively rewrite useField.ts/Field.tsx.
// Run the gates; only edit source if a parity test FAILS, and only to RESTORE the
// original behavior (byte-identity with pre-S2 Field.tsx via git diff).

// CRITICAL — the 7 parity-gate test files are READ-ONLY for S3. Editing them to
// "make a test pass" MASKS the regression and defeats the gate. If a test fails,
// fix the SOURCE (useField.ts/Field.tsx), never the test.

// CRITICAL — do NOT introduce useController or state-capture in the Controller
// render callback. Both are FORBIDDEN by the S2 design decision. useController
// always RHF-registers the field (breaks the hidden-field invariant — hidden
// fields must NOT mount a Controller today). State-capture triggers the
// "Maximum update depth" regression Field.subscriptionStability.test.tsx guards.
// If a fix seems to require either, STOP — the real bug is a drifted block, not
// a missing architectural change.

// CRITICAL — do NOT touch UseFieldParams/UseFieldReturn field sets or
// FieldRenderAPI. S1 locked them; __typechecks__/useField.test-d.ts enforces
// UseFieldReturn ≡ FieldRenderAPI. If the test-d file errors, investigate S1's
// contract (someone touched the interface) — do NOT "fix" it by changing the type.

// CRITICAL (verbatimModuleSyntax: true) — if S3 adds imports to useField.test.tsx,
// type-only imports MUST be `import type`. The existing test files follow this.

// GOTCHA — the verified baseline is 1018 passed | 5 skipped (NOT 1003). The task
// description cites an older number; the repo has grown. Use 1018 as the floor.

// GOTCHA — isolated useField tests need a REAL <Form> wrapper, not a bare
// FormContext.Provider mock. useField mounts a <Controller control={methods.control}>
// internally — a mocked `methods: {} as any` has no `control`, so the Controller
// throws. REUSE useFormState.test.tsx's createWrapper (real <FormalityProvider><Form>).

// GOTCHA — coverage discipline: isolated tests must add MEANINGFUL coverage on a
// branch the integration tests reach only obliquely. Don't duplicate Field.test.tsx.
// The gate is "useField is testable in isolation," not "re-assert everything twice."

// GOTCHA — if a parity test fails, map the assertion to a Field behavior (research
// §2 catalog), then to the responsible relocated block (S2 research §2 line map),
// then git-diff that block against the original. The fix is byte-identity, not rewrite.

// GOTCHA — git diff workflow depends on S2's commit state:
//   - S2 UNCOMMITTED: `git diff HEAD -- packages/react/src/{hooks/useField.ts,components/Field.tsx}`
//   - S2 COMMITTED: `git log --oneline -3 -- packages/react/src/components/Field.tsx`
//                    then `git diff <pre-S2-sha> -- <both files>`
// ForwardRef-relevant history: commits 512023c (deliver forwardRef) + 09a6464
// (translate forwardRef→ref for host fallback) — context if a forwardRef regression appears.
```

## Implementation Blueprint

### Data models and structure

No new data models. S3 verifies existing ones. The `UseFieldReturn` contract
(LOCKED by S1, asserted by `useField.test-d.ts`) is the shape the isolated tests
assert against:

```typescript
// The contract S3's isolated tests assert (DO NOT MODIFY — S1 locked it):
export interface UseFieldReturn {
  fieldState: ControllerFieldState;
  renderedField: ReactNode;
  fieldProps: Record<string, unknown>;
  watchers: Record<string, boolean>;
  formState: UseFormStateReturn<FieldValues>;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — read the field guide + the S2 outputs + the parity contract
  - READ: plan/.../P2M1T1S3/research/research-notes.md   (FIRST — esp. §1 baseline, §2 gate files, §3 risk areas)
  - READ: plan/.../P2M1T1S2/PRP.md   (the extraction contract — Design Decision + Anti-Patterns + parity contract)
  - READ: plan/.../P2M1T1S2/research/research-notes.md §2   (the line map: each Field.tsx block → useField.ts destination)
  - CONFIRM the post-S2 state:
      grep -n "Controller\|mergeFieldProps\|parse\|format\|runValidator" packages/react/src/components/Field.tsx
      # Expected: EMPTY (Field.tsx is thin post-S2). If these still appear, S2 is incomplete → flag.
      wc -l packages/react/src/hooks/useField.ts packages/react/src/components/Field.tsx
      # Expected: useField.ts is large (owns the logic); Field.tsx is small (thin wrapper).
      grep -n "export { useField }" packages/react/src/index.ts   # Expected: present (S2 added it)

Task 2: VERIFY GATE 1 — the full test suite (the primary parity check)
  - RUN: pnpm test
  - EXPECTED: "Tests  1018 passed | 5 skipped (1023)" (+ the S2 useField.test.tsx test, unchanged count).
  - IF GREEN: proceed to Task 3.
  - IF RED: proceed to Task 4 (diagnose & fix). Do NOT proceed to Task 3 until green.

Task 3: VERIFY GATES 2-4 — typecheck, coverage, lint, build
  - 3a. pnpm typecheck
        # Expected: zero errors. Includes __typechecks__/useField.test-d.ts
        # (UseFieldReturn ≡ FieldRenderAPI). If it errors, the interface drifted — investigate S1.
  - 3b. pnpm test:coverage
        # Expected: statements/branches/functions/lines ALL ≥ 90% (root vitest.config.ts threshold).
        # If a metric drops below 90%, the extraction left a branch uncovered — add a targeted test
        # (Task 5) or reconcile the drifted block (Task 4).
  - 3c. pnpm lint && pnpm build
        # Expected: zero errors. If lint flags unused imports in Field.tsx (Controller/useWatch/etc.
        # left behind by an incomplete S2 cleanup), that's an S2 completion bug — clean them.
  - IF ALL GREEN: proceed to Task 5 (add isolated useField tests).
  - IF RED: proceed to Task 4.

Task 4: DIAGNOSE & FIX a parity regression (ONLY if a gate failed)
  - 4a. ISOLATE the failing assertion. Read the test name; map it to a Field behavior
       (research §2 catalog) and to the high-risk area it touches (research §3):
         - forwardRef delivery → §3a (component path: forwardRef=field.ref; host path: translate+strip)
         - setValue effect      → §3b (refs assigned every render, NOT in deps; currentValue!==value guard)
         - subscription churn   → §3c (useInferredInputs signature-stable memo; effect deps = set, not value)
         - disabled/render/merge → Field.test.tsx describe header tells you which concern
  - 4b. DIFF the extracted block against the original. The S2 research line-map
       (P2M1T1S2/research/research-notes.md §2) maps each Field.tsx line range to its
       useField.ts destination. Diff that range:
         # If S2 is uncommitted:
         git diff HEAD -- packages/react/src/hooks/useField.ts packages/react/src/components/Field.tsx
         # If S2 is committed, find the pre-S2 commit:
         git log --oneline -5 -- packages/react/src/components/Field.tsx
         git diff <pre-S2-sha> -- packages/react/src/hooks/useField.ts packages/react/src/components/Field.tsx
  - 4c. RECONCILE each relocated block to byte-identity with the original. The S2 PRP
       mandated a verbatim RELOCATION (no rewrite). Hunt for:
         - a dropped line (e.g. setValueRef.current = methods.setValue assignment missing)
         - a changed effect dep array (e.g. allSubscriptions replaced with JSON.stringify or vice versa)
         - a reordered hook call (rules-of-hooks is OK if unconditional, but ordering can change effect timing)
         - forwardRef vs ref typo (coreProps.forwardRef must be field.ref, NOT ref)
         - host-element path missing the forwardRef→ref translation or the non-DOM-key stripping
         - state-capture introduced inside the Controller render callback (FORBIDDEN — see Anti-Patterns)
         - registration effect moved INTO the hook (must STAY in Field.tsx)
  - 4d. FIX by restoring byte-identity. Do NOT introduce useController, state-capture, or any
       architectural change. Do NOT edit the failing test. Do NOT touch UseFieldParams/UseFieldReturn.
  - 4e. RE-RUN the specific failing file: pnpm test -- <failing-file>. Then re-run the FULL suite
       (Task 2) to confirm no new regression. Loop 4a-4e until green.
  - 4f. DOCUMENT the regression + fix in the PR/commit (which block drifted, how it was restored).

Task 5: ADD isolated useField hook tests (the "testable in isolation" deliverable)
  - FILE: packages/react/src/__tests__/useField.test.tsx  (MODIFY — expand S2's smoke test)
  - REUSE the createWrapper pattern from __tests__/useFormState.test.tsx (L37-58):
      const createWrapper = (config, record={}) =>
        function Wrapper({ children }) {
          return (
            <FormalityProvider inputs={testInputs}>
              <Form config={config} record={record}>{children}</Form>
            </FormalityProvider>
          );
        };
    (useField needs a REAL <Form> — it mounts <Controller control={methods.control}>; a mocked
    methods:{} has no control.)
  - ADD focused isolated tests (only branches the integration tests reach obliquely —
    do NOT duplicate Field.test.tsx). Candidates, in priority order:
    5a. useField returns the full UseFieldReturn shape: assert the result has
        fieldState, renderedField, fieldProps, watchers, formState keys.
    5b. useField returns renderedField as a ReactElement when visible (not null/undefined).
    5c. useField returns watchers as Record<string, boolean> (the hook OWNS watcher state —
        no integration test asserts on the return shape directly).
    5d. useField with hidden={true} returns null renderedField (the hidden-field invariant —
        Controller does NOT mount when hidden).
    5e. useField with a function children applies the render-prop (returns the children's
        output, not the raw input).
    5f. (Optional, via createMockContext from useSubscriptions.test.tsx) useField calls
        registerWatcherSetter on mount and unregisterWatcherSetter on unmount.
  - NAMING: describe("useField (isolated — direct hook contract)") with it(test-scenario).
  - COVERAGE discipline: each test must add MEANINGFUL coverage. If a candidate is already
    exhaustively covered by Field.test.tsx through <Field>, SKIP it. The gate is "useField
    is testable in isolation," not "re-assert everything twice."
  - Run: pnpm test -- packages/react/src/__tests__/useField.test.tsx  (expect all pass).

Task 6: FINAL VERIFICATION — all gates green with the expanded test suite
  - 6a. pnpm test
        # Expected: 1018 passed | 5 skipped + the NEW isolated useField tests (count grew by N).
  - 6b. pnpm typecheck && pnpm lint && pnpm build   (all green).
  - 6c. pnpm test:coverage   (≥ 90% on all metrics — the new isolated tests should hold/improve it).
  - 6d. PARITY-GATE PURITY: git diff --stat on the 7 parity-gate files = EMPTY (unchanged):
        git diff --stat -- packages/react/src/__tests__/Field.test.tsx \
          packages/react/src/__tests__/Field.forwardRef.test.tsx \
          packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx \
          packages/react/src/__tests__/Field.subscriptionStability.test.tsx \
          packages/react/src/__tests__/render-isolation.test.tsx \
          packages/react/src/__tests__/integration/complete-form.test.tsx \
          packages/react/src/__tests__/validation-report-fixes.test.tsx
        # Expected: no output (all unchanged).
```

### Implementation Patterns & Key Details

```typescript
// PATTERN — isolated useField test (REUSE useFormState.test.tsx's createWrapper)
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Form } from "../components/Form";
import { FormalityProvider } from "../components/FormalityProvider";
import { useField } from "../hooks/useField";
import type { UseFieldParams } from "../hooks/useField";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";
import { isValidElement } from "react";

// Test input + inputs config (mirror useFormState.test.tsx / Field.forwardRef.test.tsx)
const testInputs: Record<string, InputConfig> = { textField: { component: TestInput, defaultValue: "" } };

const createWrapper = (config: FormFieldsConfig, record: Record<string, unknown> = {}) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <FormalityProvider inputs={testInputs}>
        <Form config={config} record={record}>{children}</Form>
      </FormalityProvider>
    );
  };

describe("useField (isolated — direct hook contract)", () => {
  it("returns the full UseFieldReturn shape", () => {
    const { result } = renderHook(
      () => useField({ name: "email" } as UseFieldParams),
      { wrapper: createWrapper({ email: { type: "textField" } }) },
    );
    expect(result.current).toHaveProperty("fieldState");
    expect(result.current).toHaveProperty("renderedField");
    expect(result.current).toHaveProperty("fieldProps");
    expect(result.current).toHaveProperty("watchers");
    expect(result.current).toHaveProperty("formState");
  });

  it("returns renderedField as a ReactElement when visible", () => {
    const { result } = renderHook(
      () => useField({ name: "email" } as UseFieldParams),
      { wrapper: createWrapper({ email: { type: "textField" } }) },
    );
    expect(result.current.renderedField).not.toBeNull();
    expect(isValidElement(result.current.renderedField)).toBe(true);
  });

  it("returns null renderedField when hidden (hidden-field invariant)", () => {
    const { result } = renderHook(
      () => useField({ name: "email", hidden: true } as UseFieldParams),
      { wrapper: createWrapper({ email: { type: "textField" } }) },
    );
    expect(result.current.renderedField).toBeNull();
  });

  it("returns watchers as Record<string, boolean>", () => {
    const { result } = renderHook(
      () => useField({ name: "email" } as UseFieldParams),
      { wrapper: createWrapper({ email: { type: "textField" } }) },
    );
    expect(result.current.watchers).toEqual(expect.any(Object));
  });
});
// (Add 5e render-prop + 5f watcher-registration only if not already obliquely covered.)

// PATTERN — git-diff diagnostic for a parity regression (Task 4)
// Step 1: find the failing behavior's block in the S2 line map
//   (P2M1T1S2/research/research-notes.md §2 — e.g. forwardRef = Field.tsx ~620-684)
// Step 2: diff that block's destination (useField.ts) against the original (Field.tsx)
git diff HEAD -- packages/react/src/hooks/useField.ts packages/react/src/components/Field.tsx
# Step 3: reconcile to byte-identity (restore the original line verbatim). Re-run the failing file:
pnpm test -- packages/react/src/__tests__/Field.forwardRef.test.tsx
```

### Integration Points

```yaml
FILES MODIFIED (this task):
  - packages/react/src/__tests__/useField.test.tsx   # expand smoke test → isolated renderHook tests

CONDITIONALLY MODIFIED (only if a parity regression is found in Task 4):
  - packages/react/src/hooks/useField.ts             # reconcile drifted block → byte-identity with original
  - packages/react/src/components/Field.tsx          # (only if the thin wrapper itself drifted)

NEVER MODIFIED (S3 must not touch):
  - The 7 parity-gate test files (Field.test.tsx, Field.forwardRef.test.tsx,
    FieldForwardRef.acceptance.test.tsx, Field.subscriptionStability.test.tsx,
    render-isolation.test.tsx, integration/complete-form.test.tsx,
    validation-report-fixes.test.tsx)
  - packages/react/src/__typechecks__/useField.test-d.ts   # UseFieldReturn ≡ FieldRenderAPI guard
  - packages/react/src/index.ts                            # S2 already exported useField
  - UseFieldParams / UseFieldReturn / FieldRenderAPI       # S1-locked contract
  - packages/react/src/overlays.ts                         # sibling P2.M2.T1.S1 owns it

NO DATABASE / CONFIG / ROUTES — pure React/TypeScript verification + test addition.
```

## Validation Loop

### Level 1: The Parity Gate (the primary check)

```bash
# Run the FULL suite first — this is the regression gate.
pnpm test
# Expected: "Tests  1018 passed | 5 skipped (1023)" (+ new isolated useField tests after Task 5).
# IF ANY of the 7 parity-gate files has a failure, go to Level 1b (diagnose).

# Level 1b — run each parity-gate file individually to pinpoint failures:
pnpm test -- packages/react/src/__tests__/Field.test.tsx
pnpm test -- packages/react/src/__tests__/Field.forwardRef.test.tsx
pnpm test -- packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx
pnpm test -- packages/react/src/__tests__/Field.subscriptionStability.test.tsx
pnpm test -- packages/react/src/__tests__/render-isolation.test.tsx
pnpm test -- packages/react/src/__tests__/integration/complete-form.test.tsx
pnpm test -- packages/react/src/__tests__/validation-report-fixes.test.tsx
# Expected: all green. If one fails → Task 4 (git-diff diagnose & fix).

# Parity-gate purity — these files must be UNCHANGED:
git diff --stat -- packages/react/src/__tests__/Field.test.tsx \
  packages/react/src/__tests__/Field.forwardRef.test.tsx \
  packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx \
  packages/react/src/__tests__/Field.subscriptionStability.test.tsx \
  packages/react/src/__tests__/render-isolation.test.tsx \
  packages/react/src/__tests__/integration/complete-form.test.tsx \
  packages/react/src/__tests__/validation-report-fixes.test.tsx
# Expected: empty output (no changes).
```

### Level 2: Type Checking, Lint & Build

```bash
pnpm typecheck   # tsc --build; validates useField.ts, Field.tsx, AND useField.test-d.ts
# Expected: zero errors. If useField.test-d.ts errors, UseFieldReturn ≠ FieldRenderAPI → investigate S1.

pnpm lint        # eslint .; verbatimModuleSyntax + rules-of-hooks + unused-args
# Expected: zero errors. If Field.tsx has unused imports (Controller/useWatch left by incomplete S2),
# clean them — that's an S2 completion bug S3 surfaces & fixes.

pnpm build       # pnpm -r build (tsup)
# Expected: both packages compile & emit.
```

### Level 3: Coverage Gate

```bash
pnpm test:coverage   # v8 coverage with the root vitest.config.ts 90% threshold
# Expected: statements/branches/functions/lines ALL ≥ 90% (CI exits 1 if any drops below).
# The relocated logic is now in useField.ts; coverage must hold. The new isolated tests (Task 5)
# should hold or improve coverage on the hook's direct branches.
```

### Level 4: Isolated useField Tests (the "testable in isolation" deliverable)

```bash
pnpm test -- packages/react/src/__tests__/useField.test.tsx
# Expected: all pass (S2's smoke test + S3's isolated renderHook tests).
# Confirm useField is exercisable WITHOUT <Field>:
#   - renderHook(() => useField({name:"email"}), {wrapper: createWrapper(...)}) returns UseFieldReturn
#   - hidden={true} → null renderedField
#   - watchers is Record<string,boolean>
#   - (render-prop application if added)
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `pnpm test` reports **1018 passed | 5 skipped** + new isolated useField tests;
      all 7 parity-gate files pass; `git diff --stat` on the 7 files is EMPTY.
- [ ] Level 2: `pnpm typecheck` clean (incl. `useField.test-d.ts`); `pnpm lint` clean;
      `pnpm build` clean.
- [ ] Level 3: `pnpm test:coverage` ≥ 90% on statements/branches/functions/lines.
- [ ] Level 4: `useField.test.tsx` passes with isolated `renderHook` tests proving the hook
      is exercisable directly (not only through `<Field>`).

### Feature Validation (Parity)

- [ ] No `<Field>` behavior changed — the extraction preserved 100% of behavior.
- [ ] IF a regression was found & fixed: the fix reconciles `useField.ts`/`Field.tsx` to
      byte-identity with the original `Field.tsx` (documented which block drifted).
- [ ] The three high-risk areas are confirmed intact:
      - forwardRef delivery: component path (`forwardRef: field.ref`) + host-element path
        (translate forwardRef→ref + strip non-DOM keys) — `Field.forwardRef.test.tsx` +
        `FieldForwardRef.acceptance.test.tsx` green.
      - setValue ref pattern: refs assigned every render (not in deps) + `currentValue !== value`
        guard — `Field.test.tsx` `set conditions (F6/F7)` green.
      - subscription stability: `useInferredInputs` signature-stable memo + effect deps = set —
        `Field.subscriptionStability.test.tsx` green (no max-depth, zero churn).

### Code Quality Validation

- [ ] Isolated `useField` tests REUSE the `useFormState.test.tsx` `createWrapper` pattern
      (real `<FormalityProvider><Form>`, not a bare mock).
- [ ] New tests add MEANINGFUL coverage (not duplicating `Field.test.tsx`).
- [ ] No `useController` or state-capture-in-Controller-render introduced (Anti-Patterns).
- [ ] Anti-patterns avoided (check against Anti-Patterns section).

### Documentation & Deployment

- [ ] IF a regression was fixed: the PR/commit documents which block drifted + how it was restored.
- [ ] No README/CHANGELOG required (verification + test addition; changeset-level docs sync is P3.M2).

---

## Anti-Patterns to Avoid

- ❌ Don't edit the 7 parity-gate test files to make a failing test pass. That MASKS the
  regression. Fix the SOURCE (`useField.ts`/`Field.tsx`), never the test.
- ❌ Don't preemptively rewrite `useField.ts`/`Field.tsx`. Run the gates FIRST. Only edit source
  if a parity test FAILS, and only to RESTORE the original behavior (byte-identity via git diff).
- ❌ Don't introduce `useController`. It always RHF-registers the field; current behavior mounts
  `<Controller>` ONLY when visible, so hidden fields are NOT RHF-registered today. useController
  changes that → breaks the hidden-field invariant. Keep `<Controller>`.
- ❌ Don't introduce state-capture inside the Controller render callback (`setState` during
  Controller render). That's the "Maximum update depth" pattern
  `Field.subscriptionStability.test.tsx` exists to prevent.
- ❌ Don't touch `UseFieldParams`/`UseFieldReturn`/`FieldRenderAPI` field sets. S1 locked them;
  `__typechecks__/useField.test-d.ts` enforces `UseFieldReturn ≡ FieldRenderAPI`. If the test-d
  file errors, investigate S1's contract — do NOT "fix" it by changing the type.
- ❌ Don't move the registration `useEffect` (`registerField`/`unregisterField`) into the hook.
  The contract says Field handles registration. If a registration-related test fails, the fix is
  to keep/restore the effect in `Field.tsx`, not relocate it.
- ❌ Don't use a bare `FormContext.Provider` mock for isolated `useField` behavior tests.
  `useField` mounts `<Controller control={methods.control}>` — a mocked `methods: {} as any` has
  no `control`, so it throws. Use the REAL `<FormalityProvider><Form>` wrapper
  (`useFormState.test.tsx`'s `createWrapper`). Reserve the mock-context pattern
  (`useSubscriptions.test.tsx`) for call-count/arg assertions on context fns only.
- ❌ Don't duplicate `Field.test.tsx` assertions in the isolated tests. The gate is "useField is
  testable in isolation," not "re-assert everything twice." Add only branches the integration
  tests reach obliquely (return-shape, hidden→null, watchers ownership).
- ❌ Don't treat the task description's "1003 passed" as the floor. The verified baseline is
  **1018 passed | 5 skipped** (the repo has grown). Use 1018.
- ❌ Don't declare S3 done while any of the 5 gates (`test`, `typecheck`, `lint`, `build`,
  `test:coverage`) is red. All must be green AND the 7 parity-gate files unchanged.
- ❌ Don't touch `overlays.ts` (sibling P2.M2.T1.S1), `useFieldDisabledState.ts`
  (sibling P2.M1.T2.S1), `index.ts` (S2 already exported useField), or `useField.test-d.ts`.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is fundamentally a **verification + targeted-fix + test-addition** task with a
  deterministic diagnostic procedure. The hardest part (the extraction) was S2's job; S3's
  value is catching & fixing regressions via a byte-identity git-diff reconciliation, which is
  mechanical once the drifted block is located.
- The 7-file parity gate is a comprehensive regression net (Field.test.tsx alone has 24 describe
  blocks / ~60 assertions covering every Field behavior). If S2 preserved behavior, S3 is "run
  gates + add isolated tests" — low risk.
- The three high-risk regression areas (forwardRef, setValue ref pattern, subscription stability)
  are explicitly cataloged with their PRD anchors, guards, and regression symptoms, so a failure
  maps directly to a block to diff.
- The isolated-test pattern is REUSED verbatim from `useFormState.test.tsx`'s `createWrapper` —
  no novel test infrastructure.
- The 1-point risk: if S2 introduced a SUBTLE regression that passes the suite but changes a
  behavior only observable in a downstream consumer (not in the 1018 tests), S3 won't catch it.
  The git-diff byte-identity mandate mitigates this for the relocated blocks, but a latent
  interaction (e.g. hook-call-order timing) could theoretically slip through. The mitigation is
  the explicit "reconcile each block to byte-identity" discipline + the subscription-stability
  max-depth guard.
