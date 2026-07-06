name: "P1.M1.T2.S1 — Migrate TestInput/TestSwitch to consume `forwardRef`; add §20.6 acceptance tests"
description: |

---

## Goal

**Feature Goal**: After P1.M1.T1.S1 shipped the runtime change (Field.tsx
`coreProps` delivers `field.ref` as `forwardRef`, NOT the React-special `ref`
key), the existing test harness is **unrepresentative** and a fresh
**§20.6 acceptance suite** is needed to prove the new `forwardRef`-exclusive
delivery satisfies PRD §20.5. Two coordinated changes:

1. **Migrate the harness** (`packages/react/src/__tests__/Field.test.tsx`):
   `TestInput` (lines 27–42) and `TestSwitch` (lines 55–67) are
   `React.forwardRef`-wrapped and read the ref via the **second arg**
   (`<input ref={ref} />`). After S1 they no longer receive the special `ref`
   key, so the inner `<input>` silently loses RHF ref wiring. Per PRD §20.4,
   migrate them to consume `forwardRef` from props. Pick ONE option
   consistently for both and document the choice in a comment. Keep
   `displayName`.

2. **Add the §20.6 acceptance suite** (PRD §20.5 / §20.6): four tests proving
   the `forwardRef`-exclusive delivery works through the REAL
   `<FormalityProvider>/<Form>/<Field>` stack:
   - **PLAIN-COMPONENT DELIVERY** — a plain (non-`React.forwardRef`) function
     component destructures `forwardRef` and wires it to an `<input>`; assert
     the ref callback is invoked / the input is registered & focusable.
   - **NO REACT 18 REF WARNING** — spy on `console.error`/`console.warn`;
     assert the substring `"Function components cannot be given refs"` is
     NEVER emitted. Restore in `afterEach`.
   - **FOCUS-ON-ERROR** — mount a Field with a failing `required` rule; submit
     invalid; assert `toHaveFocus()` (jsdom sets `document.activeElement`).
   - **REACT.FORWARDREF MIGRATION REGRESSION** — a `React.forwardRef`-wrapped
     component consuming `props.forwardRef` (option A or B) still focuses
     correctly on error (this is the post-migration TestInput/TestSwitch shape).

**Deliverable**:
1. `packages/react/src/__tests__/Field.test.tsx` — `TestInput` & `TestSwitch`
   migrated to consume `forwardRef` (option A or B, consistent, commented).
2. `packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx` — NEW
   file with the four §20.6 acceptance tests using a NEW plain forwardRef-wired
   component rendered through the real stack.
3. `pnpm test:coverage` remains ≥90% on all four metrics (statements,
   branches, functions, lines). The acceptance tests ADD coverage; the gate
   must NOT be relaxed.

**Success Definition**:
1. `TestInput`/`TestSwitch` still pass every existing test in `Field.test.tsx`
   after migration (no regressions — the migration is a refactor that keeps
   the same rendered `<input>` shape, just re-routes the ref source).
2. The four §20.6 acceptance tests pass.
3. `pnpm test`, `pnpm test:coverage`, `pnpm typecheck`, `pnpm lint` all green.
4. `FormalityFieldComponentProps.test.tsx`'s `SmokeField` is **NOT modified**
   (it's already forward-compatible; renders directly, not through `<Field>` —
   confirmed in the contract, out of scope).
5. No production source code (Field.tsx, overlays.ts) is edited in THIS
   subtask (S1 owns runtime; S2 owns docs; this owns tests).

## User Persona

**Target User**: The Formality maintainer + downstream React consumers
(`sellario-ui`) who need confidence that `<Field>`'s ref delivery matches the
`FormalityFieldComponentProps` contract at runtime.

**Use Case**: A consumer writes
`const TextField = ({ forwardRef, ...rest }) => <input ref={forwardRef} {...rest} />;`
and relies on RHF focus-on-error reaching that input after an invalid submit.

**User Journey**: register a plain component → submit an invalid form → RHF
calls `.focus()` on the input wired via `forwardRef` → focus observable in
jsdom via `document.activeElement`.

**Pain Points Addressed**: Today there is NO test that asserts focus-on-error
or inspects the ref (repo-wide grep confirmed zero matches). After S1 the
`React.forwardRef`-wrapped `TestInput`/`TestSwitch` silently lose ref wiring
(no test fails, but the harness lies about reality). This subtask makes the
harness representative and adds the missing acceptance coverage.

## Why

- **Business value**: Converts the S1 runtime change from "shipped but
  unverified" to "shipped AND proven by an acceptance suite." Without these
  tests, a future regression of the `forwardRef` delivery (e.g. someone
  re-adding `ref: field.ref`) would go undetected — the existing suite has
  zero focus/ref assertions.
- **Integration**: Directly consumes P1.M1.T1.S1's output (the migrated
  `forwardRef`-delivering Field — now **Complete**). P1.M1.T3.S1 (Mode-B docs
  sweep) confirms the feature listing; this subtask provides the test evidence
  the docs reference. The migrated `TestInput`/`TestSwitch` keep the broader
  `Field.test.tsx` suite (rendering, conditions, validation, disabled
  priority, render-prop, coverage-backfill F1–F11) representative of the new
  runtime contract.
- **Scope boundary (CRITICAL)**: This is a **test-only** subtask. It does NOT:
  - Edit `Field.tsx`, `overlays.ts`, `Form.tsx`, or any production source
    (S1 owns runtime; S2 owns docs; this owns tests).
  - Modify `SmokeField` in `FormalityFieldComponentProps.test.tsx` (already
    forward-compatible; renders directly, not through `<Field>` — confirmed
    out of scope by the contract).
  - Relax the §1.3.7 90% coverage threshold (the tests ADD coverage).
  - Re-type anything or change public API.
- **Parallel-safe**: P1.M1.T1.S2 (concurrent) edits `overlays.ts` JSDoc +
  `react/README.md` prose. This subtask edits only `__tests__/*.test.tsx`
  files. **ZERO file overlap.**

## What

### Part A — Migrate TestInput / TestSwitch (Field.test.tsx)

Both are currently `React.forwardRef<HTMLInputElement, Props>` reading the ref
as the second arg. After S1 they no longer receive the special `ref` key.
Migrate to ONE of (pick consistently for both, comment the choice):

- **Option A** (keep the wrap, also forward the prop) — minimal diff:
  ```tsx
  // PRD §20.4 option A — Formality delivers the RHF ref as the top-level
  // `forwardRef` prop (not React's special `ref` key), so consume it from props.
  // The React.forwardRef wrap is retained for shape compatibility; the inner
  // input wires the `forwardRef` prop.
  const TestInput = forwardRef<HTMLInputElement, TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }>(
    ({ value, onChange, disabled, label, error, name, forwardRef, ...props }) => (
      <div>
        {label && <label data-testid={`${name}-label`}>{label}</label>}
        <input ref={forwardRef} data-testid={name} value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)} disabled={disabled} {...props} />
        {error && <span data-testid={`${name}-error`}>{error}</span>}
      </div>
    ),
  );
  ```
- **Option B** (drop the wrap, consume `props.forwardRef` directly — the
  documented `FormalityFieldComponentProps` pattern):
  ```tsx
  // PRD §20.4 option B — plain function component consuming `forwardRef` from
  // props (the FormalityFieldComponentProps contract).
  const TestInput: ComponentType<FormalityFieldComponentProps<TestInputProps>> = ({
    forwardRef, value, onChange, disabled, label, error, name, ...props
  }) => (
    <input ref={forwardRef as React.Ref<HTMLInputElement>} ... />
  );
  ```

**Recommended: Option A.** Rationale: (1) it keeps `displayName` and the
`forwardRef<...>` typing minimal; (2) it minimizes diff vs. the current
shape; (3) the broader `Field.test.tsx` suite doesn't care HOW the ref
arrives, only that the `<input>` renders with the right props — Option A
preserves that exactly. Option B is also valid if the team prefers the
"documented pattern" as the canonical test shape; either satisfies §20.4.
**Document the choice in a one-line comment above each component.**

### Part B — §20.6 acceptance suite (NEW file)

Four tests in a new `packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx`,
all rendering through the REAL `<FormalityProvider>/<Form>/<Field>` stack.
Define a NEW plain forwardRef-wired component local to this file (do NOT reuse
`SmokeField` — it's not rendered through `<Field>`). Mocking: none beyond the
`console` spy (real RHF + jsdom DOM).

### Success Criteria

- [ ] `TestInput` (Field.test.tsx:27–42) and `TestSwitch` (55–67) migrated to
      consume `forwardRef` from props (Option A or B, consistent, commented).
- [ ] `displayName` preserved on both.
- [ ] Every existing test in `Field.test.tsx` still passes (no regressions).
- [ ] NEW file `FieldForwardRef.acceptance.test.tsx` with 4 tests:
      PLAIN-COMPONENT DELIVERY, NO REACT 18 REF WARNING, FOCUS-ON-ERROR,
      REACT.FORWARDREF MIGRATION REGRESSION.
- [ ] All 4 acceptance tests render through real `<Form>+<Field>` (no stubbed
      Controller).
- [ ] `pnpm test`, `pnpm test:coverage` (≥90% all metrics), `pnpm typecheck`,
      `pnpm lint` green.
- [ ] `SmokeField` / `FormalityFieldComponentProps.test.tsx` UNCHANGED.
- [ ] No production source file edited (Field.tsx, overlays.ts, Form.tsx).

## All Needed Context

### Context Completeness Check

_Pass._ The architecture reports
(`test_harness_and_coverage.md`, `rhf_ref_and_focus_behavior.md`) provide
verbatim quotes with exact line numbers for `TestInput`, `TestSwitch`, the
`testInputs` registry, the mounting pattern, the coverage config, AND a
practical jsdom focus-on-error recipe with assertion mechanics. The S1 PRP
confirms the exact runtime input (Field.tsx `forwardRef: field.ref`) and S1
is now **Complete**. The §20.5/§20.6 PRD sections enumerate the acceptance
criteria. Live source was re-verified during PRP creation (TestInput 27–42,
TestSwitch 55–67, testInputs 72–82 — line numbers match).

### Documentation & References

```yaml
# MUST READ
- url: PRD §20.6 (heading:h3.100) — "Testing requirements"
  why: Authoritative list of the 4 required tests + the coverage-gate note.
  critical: "Coverage gate: the new tests are in scope for the §1.3.7 ≥ 90% threshold.
             ADD tests, do NOT relax the threshold."

- url: PRD §20.5 (heading:h3.99) — "Acceptance criteria"
  why: The 5 acceptance bullets the tests must prove (plain-component delivery,
        no React 18 warning, focus-on-error reaches input, template path,
        React.forwardRef migration focuses correctly).
  critical: "A plain (non-React.forwardRef) function component … receives a
             non-undefined ref callback, and the DOM node resolves." + "No
             'Function components cannot be given refs' warning under React 18."

- url: PRD §20.4 (heading:h3.98) — "Backward compatibility & migration"
  why: The Option A / Option B migration shapes for TestInput/TestSwitch + the
        forwardRef-EXCLUSIVE decision (no dual-delivery).
  critical: "Components that today rely on React intercepting the special `ref`
             key MUST instead read `forwardRef` from props." Option A (keep wrap,
             forward prop) and Option B (drop wrap, consume props.forwardRef).

- url: PRD §1.3.7 (heading:h4.6) — "Testing Strategy"
  why: The 90% coverage gate (statements/branches/functions/lines). The new
        tests ADD coverage; the gate must NOT be relaxed.
  critical: "`pnpm test:coverage` enforces ≥90% on all four metrics; CI fails
             if any drops below."

- docfile: plan/003_de060244cb57/architecture/test_harness_and_coverage.md
  why: VERBATIM TestInput/TestSwitch/testInputs source with exact line numbers;
        confirms ZERO existing focus/ref assertions; documents the mounting
        pattern and the describe/it inventory.
  section: "§1 (Field.test.tsx), §2 (FormalityFieldComponentProps.test.tsx),
            §3 (coverage config), §4 (test commands)"
  critical: "SmokeField renders DIRECTLY (no <Field>) — out of scope for runtime
             delivery. The §20.6 suite must render a NEW plain component THROUGH
             the real <Form>+<Field> stack."

- docfile: plan/003_de060244cb57/architecture/rhf_ref_and_focus_behavior.md
  why: The jsdom focus-on-error recipe + the React 18 warning mechanics + why
        `forwardRef`-prop delivery preserves focus-on-error and avoids the warning.
  section: "§3 (focus-on-error mechanism), §4 (testing in jsdom), 'Practical
            recipe for the implementer (§20.6)'"
  critical: "jsdom `.focus()` sets `document.activeElement` (§4.9). The ref MUST
             target a focusable `<input>` (§4.10 — a bare <div> is a no-op).
             Use `await userEvent.click(submit)` or `fireEvent.submit(form)` +
             `await waitFor(...)`. `toHaveFocus()` asserts activeElement."

# INPUTS (already shipped — treat as the contract)
- file: plan/003_de060244cb57/P1M1T1S1/PRP.md
  section: "Goal + Success Definition (Field.tsx forwardRef: field.ref) — COMPLETE"
  why: S1 shipped the runtime input this suite verifies. Contract: `<Field>`
        delivers `field.ref` as a top-level enumerable `forwardRef` prop; the
        React-special `ref` key is NO LONGER emitted (forwardRef-EXCLUSIVE per
        §20.4). S1 is marked Complete in plan_status.
  critical: "S1's PRP anti-pattern list: 'Don't edit overlays.ts JSDoc or any
             README.' S1 edited Field.tsx + a minimal proof test ONLY. This
             subtask (T2.S1) adds the FULL §20.6 acceptance cluster + migrates
             the harness. S1's minimal proof test is a subset — DO NOT duplicate
             it; extend into the full cluster here."

- file: packages/react/src/components/Field.tsx
  section: "coreProps block (Field.tsx ~464) — now `forwardRef: field.ref`"
  why: CONFIRM S1's runtime is live before writing tests. The suite depends on it.
  verify: "`grep -n 'ref: field.ref\|forwardRef: field.ref' packages/react/src/components/Field.tsx`
           → expect `forwardRef: field.ref` only."

# PARALLEL-EXECUTION CONTEXT (S2 is being implemented concurrently)
- file: plan/003_de060244cb57/P1M1T1S2/PRP.md
  section: "Goal (doc-only: overlays.ts JSDoc + react README prose)"
  why: S2 (concurrent) edits overlays.ts JSDoc + react/README.md. ZERO overlap
        with this subtask (which edits only __tests__/*.test.tsx).
  critical: "Do NOT edit overlays.ts or README.md here — that's S2's territory."

- file: packages/react/src/__tests__/Field.test.tsx
  section: "TestInput (27–42), TestSwitch (55–67), testInputs (72–82), mounting pattern (88+)"
  why: THE file to migrate. Reuse the testInputs registry SHAPE for the new
        acceptance suite (define a local registry in the new file — do NOT
        import the private testInputs; copy the pattern).
  pattern: "forwardRef<HTMLInputElement, TestInputProps>((props, ref) => <input ref={ref} .../>)"
  gotcha: "After migration the inner <input> MUST still have data-testid={name}
           so the existing rendering/conditions/disabled tests (which query by
           testid) keep passing. Do NOT change the rendered DOM shape — only
           re-route the ref source."

- file: packages/react/src/__tests__/FormalityFieldComponentProps.test.tsx
  section: "SmokeField (15–41)"
  why: REFERENCE for the plain-component forwardRef pattern (destructures
        forwardRef, wires ref={forwardRef}). DO NOT modify it. Use it as the
        template for the NEW plain component in the acceptance suite.
  gotcha: "SmokeField is rendered directly (render(<SmokeField .../>)), NOT
           through <Field>. The acceptance suite must render its plain component
           THROUGH <Field> to verify Field's runtime delivery. Copy the
           SmokeField SHAPE into the new file, not its render call."

- file: packages/react/src/overlays.ts
  section: "FormalityFieldComponentProps type (179–188)"
  why: The type the new plain component must be typed by:
        ComponentType<FormalityFieldComponentProps<MyProps>>. Confirms
        forwardRef?: RefCallBack (the RHF callback-ref type).
  gotcha: "Import the TYPE: `import type { FormalityFieldComponentProps } from
           '../overlays';`. Do NOT edit this file — S2 owns its JSDoc concurrently."

- file: packages/react/src/__tests__/setup.ts
  why: vitest setupFiles entry (globals: true, jest-dom matchers like
        toHaveFocus). Confirms `@testing-library/jest-dom` is wired —
        toHaveFocus() works without extra import.
```

### Current Codebase tree (relevant slice)

```bash
packages/react/src/
  __tests__/
    setup.ts                                     # globals + jest-dom matchers (toHaveFocus available)
    Field.test.tsx                               # ← EDIT: migrate TestInput (27-42) + TestSwitch (55-67)
    FormalityFieldComponentProps.test.tsx        # REFERENCE only — SmokeField; DO NOT MODIFY
    Form.test.tsx                                # existing — must stay green
    ... (other suites)
  components/
    Field.tsx                                    # S1 COMPLETE — delivers forwardRef; READ ONLY here
  overlays.ts                                    # S2's territory — DO NOT TOUCH (read FormalityFieldComponentProps type only)
vitest.config.ts                                 # root — 90% coverage gate (all 4 metrics)
vitest.workspace.ts                              # core + react projects
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/__tests__/
  Field.test.tsx                                  # MODIFIED — TestInput & TestSwitch consume forwardRef (Option A or B)
  FieldForwardRef.acceptance.test.tsx             # NEW — §20.6 acceptance suite (4 tests, real <Form>+<Field>)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (S1 dependency): This suite REQUIRES S1's runtime to be live
// (Field.tsx coreProps `forwardRef: field.ref`). S1 is marked Complete in
// plan_status, but VERIFY with grep before writing tests (Task 1). If S1's
// change is somehow absent, the PLAIN-COMPONENT DELIVERY and FOCUS-ON-ERROR
// tests will FAIL (forwardRef arrives undefined) — STOP and coordinate.

// CRITICAL (jsdom focusability): jsdom only focuses <input>/<button>/<textarea>/<select>/
// <a href>/[tabindex]. A bare <div> is a no-op. The ref MUST target an actual <input>
// (per rhf_ref_and_focus_behavior.md §4.10). Both TestInput and TestSwitch already render
// <input> — keep it that way after migration.

// CRITICAL (focus assertion): `toHaveFocus()` (from @testing-library/jest-dom, wired in
// setup.ts) asserts `document.activeElement === element`. jsdom's `.focus()` sets
// activeElement (§4.9). Use `expect(await screen.findByTestId(...)).toHaveFocus()` or
// `expect(document.activeElement).toBe(input)`.

// CRITICAL (timing): RHF focus-on-error runs SYNCHRONOUSLY inside handleSubmit. Prefer
// `await userEvent.click(submitButton)` (handles async microtasks) or
// `fireEvent.submit(form)` + `await waitFor(() => expect(...).toHaveFocus())`. After the
// submit settles, activeElement reflects the focused errored field. Preconditions:
// shouldFocusError NOT disabled (default true), the field HAS a validation error
// (submit an empty required field), and the ref resolves to a focusable <input>.

// CRITICAL (console spy restore): the React 18 warning test spies on console.error and/or
// console.warn. ALWAYS restore in afterEach (vi.restoreAllMocks() or spy.mockRestore()).
// A leaked spy will swallow errors in subsequent tests and corrupt the suite. Use a
// top-level afterEach(() => vi.restoreAllMocks()) OR scope the spy inside the test and
// restore at the end.

// CRITICAL (warning substring): the exact React 18 warning is:
//   "Warning: Function components cannot be given refs. Attempts to access this ref will
//    fail. Did you mean to use React.forwardRef()?"
// Assert the SUBSTRING "Function components cannot be given refs" appears in the spy's
// calls. Under the forwardRef-prop path this substring must NEVER appear. (Optional
// control: the special-ref-key path WOULD warn — but since S1 removed the ref key, you
// can't easily reproduce the warning in-repo without reverting S1; skip the control or
// document it as a known contrast.)

// GOTCHA (Option A vs B consistency): Pick ONE option for BOTH TestInput and TestSwitch.
// Mixing (A for one, B for the other) is confusing and serves no purpose. The contract
// REQUIRES consistency + a documenting comment.

// GOTCHA (don't change rendered DOM): The broader Field.test.tsx suite queries by
// data-testid={name} (e.g. screen.getByTestId("name")). After migration the inner
// <input> MUST still carry data-testid={name}, value={value ?? ""}, onChange, disabled,
// and (for TestInput) the label/error spans. Only the REF SOURCE changes (second arg →
// forwardRef prop). Do NOT add/remove/renamed any other prop or testid.

// GOTCHA (don't import private testInputs): The acceptance suite should define its OWN
// local input registry (copy the testInputs pattern) rather than importing the private
// testInputs from Field.test.tsx. Cross-test-file imports of non-exported helpers are
// fragile and break test isolation.

// GOTCHA (S1's minimal proof test): S1 added a minimal "plain component receives
// non-undefined forwardRef" test. The PLAIN-COMPONENT DELIVERY test in THIS suite is the
// FULL version (rendered through <Form>+<Field>, asserts the ref callback is invoked
// with the node / the input is focusable). If S1's minimal test already lives in
// Field.test.tsx or a new file, do NOT duplicate it verbatim — extend/supersede it with
// the full acceptance cluster here, or coordinate so the two files don't assert the same
// thing twice.

// GOTCHA (coverage): The new acceptance suite ADDS coverage (exercises the forwardRef
// delivery path, the focus-on-error path, the console-spy path). It must NOT cause any
// metric to drop below 90%. Run `pnpm test:coverage` and confirm all four metrics stay
// green. If a metric is borderline, the new tests should only help (more lines exercised).

// GOTCHA (no stubbed Controller): Render through the REAL <Form>+<Field>. Do NOT mock
// react-hook-form's Controller — the whole point is to verify Field's runtime delivery
// through the actual RHF integration. jsdom provides the DOM; RHF runs for real.
```

## Implementation Blueprint

### Data models and structure

No production data models. The only "models" are test-local React components:

```typescript
// Pattern for the NEW plain forwardRef-wired component (acceptance suite).
// Typed by the FormalityFieldComponentProps contract (imported as a type).
import type { ComponentType } from "react";
import type { FormalityFieldComponentProps } from "../overlays";

interface PlainInputProps {
  label?: string;
}

// Plain function component (NO React.forwardRef wrap). Destructures forwardRef
// and wires it to the inner <input>. This is the §20.5 acceptance shape.
const PlainInput: ComponentType<FormalityFieldComponentProps<PlainInputProps>> = ({
  forwardRef,
  label,
  ...rest
}) => (
  <input
    aria-label={label ?? "plain-input"}
    data-testid="plain-input"
    ref={forwardRef as React.Ref<HTMLInputElement>}
    {...(rest as Record<string, unknown>)}
  />
);
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (confirm S1 landed + re-confirm line numbers)
  - GREP: `grep -n "ref: field.ref\|forwardRef: field.ref" packages/react/src/components/Field.tsx`
    → expect `forwardRef: field.ref` (S1 landed — Complete). If still `ref: field.ref`,
    S1 hasn't actually merged — STOP and coordinate (this suite depends on S1's runtime).
  - READ Field.test.tsx lines 1-90 (imports, TestInput 27-42, TestSwitch 55-67, testInputs 72-82).
  - READ FormalityFieldComponentProps.test.tsx (SmokeField shape — reference for PlainInput).
  - READ overlays.ts lines 179-188 (FormalityFieldComponentProps type body — confirm forwardRef?: RefCallBack).
  - GREP: `rg -n "toHaveFocus|focus|console.error|spyOn" packages/react/src/__tests__/`
    → expect ZERO focus/ref assertions (confirms the gap this suite fills).
  - WHY: Confirm S1's runtime is in place and the harness gap is real before editing.

Task 2: MIGRATE TestInput (Field.test.tsx:27-42) — consume forwardRef
  - DECIDE Option A or B (recommended: A — minimal diff, keeps forwardRef wrap + displayName).
  - OPTION A: change the destructure to read `forwardRef` from props and wire the inner
    <input ref={forwardRef}>. Keep the React.forwardRef wrap (harmless; preserves the
    ComponentType shape and displayName). Add a one-line comment citing PRD §20.4 option A.
    Widen the props generic to include `forwardRef?: React.Ref<HTMLInputElement>` so the
    prop typechecks inside the wrap.
  - OPTION B: drop the wrap, type as ComponentType<FormalityFieldComponentProps<TestInputProps>>,
    destructure forwardRef, wire <input ref={forwardRef as React.Ref<HTMLInputElement>}>.
    Add a one-line comment citing PRD §20.4 option B.
  - PRESERVE: data-testid={name}, value={value ?? ""}, onChange, disabled, label span,
    error span, the {...props} spread, displayName = "TestInput".
  - DEPENDENCIES: Task 1 (S1 confirmed).

Task 3: MIGRATE TestSwitch (Field.test.tsx:55-67) — consume forwardRef (SAME option as Task 2)
  - Apply the SAME option (A or B) chosen in Task 2. Consistency is mandatory.
  - PRESERVE: type="checkbox", data-testid={name}, checked={value ?? false}, onChange,
    disabled, {...props} spread, displayName = "TestSwitch".
  - DEPENDENCIES: Task 2 (option chosen).

Task 4: RUN existing Field.test.tsx suite — confirm no regressions
  - RUN: `pnpm --filter @formality-ui/react test Field.test.tsx`
  - EXPECT: all green. The migration re-routes the ref source but does NOT change the
    rendered DOM shape, so every rendering/conditions/validation/disabled/render-prop/
    coverage-backfill test passes unchanged.
  - IF any test fails: it likely depends on a ref-source assumption — re-read the failing
    assertion and confirm the <input> still has the expected testid/props.

Task 5: CREATE the §20.6 acceptance suite — FieldForwardRef.acceptance.test.tsx
  - CREATE packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx.
  - DEFINE a local input registry (copy the testInputs pattern):
      const forwardRefInputs = {
        plainText: { component: PlainInput, defaultValue: "" },
        // plus a forwardRef-wrapped variant for the regression test (see Task 5d)
      };
  - DEFINE PlainInput (plain function component, FormalityFieldComponentProps-typed,
    destructures forwardRef, wires <input ref={forwardRef}> — see Data Models above).
  - DEFINE ForwardRefMigratedInput (React.forwardRef-wrapped, Option A or B matching
    Tasks 2/3, consumes props.forwardRef) for the regression test.
  - TEST 5a — PLAIN-COMPONENT DELIVERY:
      render(<FormalityProvider inputs={forwardRefInputs}>
        <Form config={{ name: { type: "plainText", rules: { required: true } } }}>
          <Field name="name" />
        </Form>
      </FormalityProvider>);
      // assert the input is in the document (Field rendered it) AND the ref was wired:
      const input = await screen.findByTestId("plain-input");
      expect(input).toBeInTheDocument();
      // Optionally capture the RefCallBack via a spy to assert it was called with the node:
      //   (harder; prefer the focus-on-error test below as the behavioral proof.)
  - TEST 5b — NO REACT 18 REF WARNING:
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});  // + warn if desired
      render(<FormalityProvider inputs={forwardRefInputs}>
        <Form config={{ name: { type: "plainText" } }}><Field name="name" /></Form>
      </FormalityProvider>);
      // assert the warning substring NEVER appears:
      const calls = spy.mock.calls.flat().join(" ");
      expect(calls).not.toContain("Function components cannot be given refs");
      spy.mockRestore();  // OR rely on a top-level afterEach(() => vi.restoreAllMocks())
  - TEST 5c — FOCUS-ON-ERROR:
      render(<FormalityProvider inputs={forwardRefInputs}>
        <Form config={{ name: { type: "plainText", rules: { required: true } } }}
              onSubmit={vi.fn()}>
          <Field name="name" />
          <button type="submit">submit</button>
        </Form>
      </FormalityProvider>);
      const submit = screen.getByText("submit");
      // submit invalid (empty required field):
      await userEvent.click(submit);
      // assert the input wired via forwardRef is focused:
      await waitFor(() => expect(screen.getByTestId("plain-input")).toHaveFocus());
      // (Form must render a <form> element wrapping the submit button for fireEvent.submit
      //  to work if userEvent.click doesn't trigger submit — confirm Form's render.)
  - TEST 5d — REACT.FORWARDREF MIGRATION REGRESSION:
      // reuse ForwardRefMigratedInput (Option A or B); render through <Form>+<Field>;
      // submit invalid; assert toHaveFocus() on its input. This is the post-migration
      // TestInput/TestSwitch shape, proving the migration preserves focus-on-error.
  - FOLLOW pattern: existing __tests__ use describe/it/expect from vitest, render/screen
    from @testing-library/react, userEvent from @testing-library/user-event.
  - MOCKING: none beyond the console spy (real RHF + jsdom DOM).
  - COVERAGE: all 4 §20.6 bullets (unit delivery, no-warning, behavioral focus, regression).
  - PLACEMENT: __tests__/ (vitest include is src/**/*.test.{ts,tsx}).

Task 6: FULL VALIDATION
  - RUN: `pnpm --filter @formality-ui/react test` (react suite — Field.test.tsx migrated + new acceptance file).
  - RUN: `pnpm test` (full root suite — cross-package regression).
  - RUN: `pnpm test:coverage` (≥90% on statements/branches/functions/lines — hard gate).
  - RUN: `pnpm typecheck` (root tsc --build).
  - RUN: `pnpm lint`.
  - EXPECT: all green. If coverage drops below 90% on any metric, the new tests should
    only ADD coverage — investigate whether a migration inadvertently stopped exercising
    a code path (unlikely; the rendered DOM shape is unchanged).

Task 7: SCOPE-LEAK CHECK
  - RUN: `git diff --stat` → expect EXACTLY:
        packages/react/src/__tests__/Field.test.tsx                         (modified)
        packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx   (new)
  - RUN: `git diff --exit-code packages/react/src/components/Field.tsx packages/react/src/overlays.ts packages/react/README.md README.md packages/core`
    → expect exit 0 (untouched — S1/S2/core territory).
  - RUN: `git diff --exit-code packages/react/src/__tests__/FormalityFieldComponentProps.test.tsx`
    → expect exit 0 (SmokeField unchanged).
```

### Implementation Patterns & Key Details

```typescript
// ===== Task 2/3: TestInput/TestSwitch migration (Option A — recommended) =====

// BEFORE (TestInput, Field.test.tsx:27-42):
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input ref={ref} data-testid={name} value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)} disabled={disabled} {...props} />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);

// AFTER (Option A — keep wrap, consume forwardRef prop):
// PRD §20.4 option A: Formality delivers the RHF ref as the top-level `forwardRef`
// prop (not React's special `ref` key), so consume it from props. The forwardRef
// wrap is retained for shape compatibility; the inner input wires the `forwardRef` prop.
const TestInput = forwardRef<HTMLInputElement, TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }>(
  ({ value, onChange, disabled, label, error, name, forwardRef, ...props }) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input ref={forwardRef} data-testid={name} value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)} disabled={disabled} {...props} />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);
TestInput.displayName = "TestInput";

// NOTE on the typing: widening the props to include `forwardRef?` keeps forwardRef's
// generic happy while letting the inner <input> receive the prop. If this causes
// inference friction in the broader suite, prefer Option B (drop the wrap, type as
// ComponentType<FormalityFieldComponentProps<TestInputProps>>). Both satisfy §20.4.

// ===== Task 5: acceptance suite patterns =====

// PLAIN-COMPONENT DELIVERY + FOCUS-ON-ERROR share the same mount. The key assertions:
//   const input = await screen.findByTestId("plain-input");
//   expect(input).toBeInTheDocument();                        // delivery
//   await userEvent.click(submit);
//   await waitFor(() => expect(input).toHaveFocus());         // focus-on-error

// NO-WARNING spy pattern (restore is CRITICAL):
//   const spy = vi.spyOn(console, "error").mockImplementation(() => {});
//   try {
//     render(...);
//     expect(spy.mock.calls.flat().join(" "))
//       .not.toContain("Function components cannot be given refs");
//   } finally {
//     spy.mockRestore();
//   }
// OR add a top-level: afterEach(() => vi.restoreAllMocks());

// GOTCHA: if Form doesn't render a <form> element wrapping the submit button,
// userEvent.click(submit) won't trigger RHF's handleSubmit. Check Form's render
// (it should render a <form onSubmit={methods.handleSubmit(onSubmit)>). If not,
// use fireEvent.submit(container.querySelector("form")!) and await waitFor.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
RUNTIME: none (test-only — no production source edited).
PUBLIC API: none changed.
TESTS:
  - packages/react/src/__tests__/Field.test.tsx — TestInput/TestSwitch migrated (consume forwardRef).
  - packages/react/src/__tests__/FieldForwardRef.acceptance.test.tsx — NEW §20.6 suite (4 tests).
  - packages/react/src/__tests__/FormalityFieldComponentProps.test.tsx — UNCHANGED (SmokeField out of scope).
COVERAGE:
  - vitest.config.ts 90% gate (statements/branches/functions/lines) — NOT relaxed; new tests ADD coverage.
PARALLEL-SAFE:
  - S1 (Complete) shipped Field.tsx + minimal proof test; S2 (concurrent) edits overlays.ts JSDoc + react README prose.
  - This subtask edits ONLY __tests__/Field.test.tsx + adds __tests__/FieldForwardRef.acceptance.test.tsx.
  - No edited-region overlap with S1 or S2.
  - Coordinate with S1 only on the minimal proof test (don't duplicate — see gotcha).
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing Field.test.tsx (Tasks 2/3) and creating the acceptance file (Task 5)
pnpm --filter @formality-ui/react exec tsc --noEmit   # typecheck the test files
pnpm format                                          # prettier
pnpm lint                                            # eslint

# Expected: Zero errors. If tsc complains about the forwardRef prop typing on
# TestInput/TestSwitch (Option A), switch to Option B or widen the props interface.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Migrated Field.test.tsx — NO regressions
pnpm --filter @formality-ui/react test Field.test.tsx

# New acceptance suite — all 4 tests pass
pnpm --filter @formality-ui/react test FieldForwardRef.acceptance

# Full react suite
pnpm --filter @formality-ui/react test

# Full root suite (cross-package regression)
pnpm test

# Expected: all green. The migration must not change any rendered DOM shape, so the
# broader Field.test.tsx suite passes unchanged.
```

### Level 3: Coverage Gate (Hard — PRD §1.3.7)

```bash
# The 90% gate on all four metrics
pnpm test:coverage

# Expected: all four metrics (statements/branches/functions/lines) ≥ 90% AND green.
# The new acceptance suite ADDS coverage (forwardRef delivery, focus-on-error, console
# spy paths). If ANY metric drops below 90%, investigate — the migration may have
# stopped exercising a code path (unlikely; DOM shape unchanged).
```

### Level 4: Acceptance-Specific Validation (the actual proof)

```bash
# Confirm the focus-on-error test really exercises focus (manual confidence check):
#   temporarily comment out the forwardRef wiring in PlainInput (ref={forwardRef} → ref={undefined})
#   and re-run the acceptance suite — the FOCUS-ON-ERROR test should now FAIL (input not focused).
#   Revert after. This proves the test is sensitive to the ref wiring.

# Confirm the no-warning spy is restored (no leaked spy corrupting later tests):
#   add a trivial test AFTER the no-warning test that does `console.error("x")` and assert
#   it appears — if the spy leaked, it wouldn't. (Optional; vi.restoreAllMocks in afterEach
#   is the safer guard.)

# Confirm S1's runtime is in place (the suite depends on it):
grep -n "forwardRef: field.ref" packages/react/src/components/Field.tsx
# Expected: one match. If zero or if `ref: field.ref` is present, S1 hasn't landed — coordinate.
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm --filter @formality-ui/react test` green (migrated + new).
- [ ] `pnpm test` (root) green — no cross-package regressions.
- [ ] `pnpm test:coverage` green — all four metrics ≥ 90%.
- [ ] `pnpm typecheck` green.
- [ ] `pnpm lint` clean.

### Feature Validation

- [ ] TestInput migrated to consume `forwardRef` (Option A or B), `displayName` kept.
- [ ] TestSwitch migrated to consume `forwardRef` (SAME option), `displayName` kept.
- [ ] Migration choice documented in a one-line comment on each component.
- [ ] Every existing Field.test.tsx test still passes (no rendered-DOM-shape change).
- [ ] NEW acceptance suite has 4 tests covering PRD §20.5 / §20.6:
      PLAIN-COMPONENT DELIVERY, NO REACT 18 REF WARNING, FOCUS-ON-ERROR,
      REACT.FORWARDREF MIGRATION REGRESSION.
- [ ] All 4 acceptance tests render through real `<FormalityProvider>/<Form>/<Field>`.
- [ ] The console spy is restored (afterEach / mockRestore) — no leaked spy.
- [ ] `SmokeField` / `FormalityFieldComponentProps.test.tsx` UNCHANGED.

### Code Quality Validation

- [ ] TestInput/TestSwitch use the SAME migration option (consistency).
- [ ] The inner `<input>` keeps data-testid, value, onChange, disabled (and label/error for TestInput).
- [ ] The acceptance suite defines its OWN local input registry (no private-import from Field.test.tsx).
- [ ] The plain forwardRef-wired component is typed `ComponentType<FormalityFieldComponentProps<MyProps>>`.
- [ ] No stubbed Controller — real RHF + jsdom DOM throughout.

### Scope & Documentation

- [ ] `git diff --stat` shows EXACTLY: Field.test.tsx (modified) + FieldForwardRef.acceptance.test.tsx (new).
- [ ] No production source (Field.tsx, overlays.ts, Form.tsx) or README edited.
- [ ] No core package file edited.
- [ ] Migration option choice is self-documenting via inline comments (per contract §5 DOCS).

---

## Anti-Patterns to Avoid

- ❌ Don't mix Option A and B across TestInput/TestSwitch — pick ONE, consistently, comment it.
- ❌ Don't change the rendered DOM shape of TestInput/TestSwitch (testid, value, onChange, disabled, label/error) — only the REF SOURCE changes. The broader suite queries by testid.
- ❌ Don't relax the 90% coverage gate — the new tests ADD coverage; if a metric drops, investigate, don't threshold-shop.
- ❌ Don't edit `Field.tsx`, `overlays.ts`, `Form.tsx`, or any README — S1 (Complete) / S2 (concurrent) / runtime / docs territory.
- ❌ Don't modify `SmokeField` / `FormalityFieldComponentProps.test.tsx` — it's forward-compatible and renders directly (out of scope per contract).
- ❌ Don't stub/mock react-hook-form's Controller — render through the REAL `<Form>+<Field>` to verify runtime delivery.
- ❌ Don't leak the `console.error`/`console.warn` spy — always restore in `afterEach` or `mockRestore`; a leaked spy swallows errors in later tests.
- ❌ Don't import the private `testInputs` from Field.test.tsx into the acceptance suite — define a local registry (test isolation).
- ❌ Don't assert focus on a non-focusable element (bare `<div>`) — jsdom only focuses `<input>`/`<button>`/etc.; the ref must target an `<input>`.
- ❌ Don't forget the `await waitFor(...)` / `await userEvent.click(...)` async handling — RHF focus-on-error is synchronous inside handleSubmit but the test must await the submit settling.
- ❌ Don't duplicate S1's minimal proof test verbatim — extend it into the full §20.6 cluster (or coordinate file placement).
- ❌ Don't run this suite before confirming S1 landed — it depends on Field.tsx delivering `forwardRef` (Task 1 verifies).

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is a well-bounded, test-only subtask whose every input is
verified: (1) the S1 runtime change (`forwardRef: field.ref`) is the contract
AND S1 is now marked **Complete**, so the runtime dependency is satisfied;
(2) verbatim TestInput/TestSwitch/testInputs source with exact line numbers
is in `test_harness_and_coverage.md`; (3) the jsdom focus-on-error recipe,
the React 18 warning mechanics, and the assertion patterns are in
`rhf_ref_and_focus_behavior.md` §3–§4; (4) PRD §20.5/§20.6 enumerate the
exact acceptance criteria. The only residual risks are (a) Option A typing
friction on the forwardRef-wrapped component (mitigated by the Option B
fallback documented inline), (b) Form not rendering a `<form>` element for
submit-trigger (mitigated by the fireEvent.submit fallback + the Task 5
gotcha), and (c) the console-spy-restore discipline (mitigated by the
explicit afterEach guidance). The migration is a pure ref-source re-route
with no DOM-shape change, so the broader Field.test.tsx suite passes
unchanged. The 1-point deduction accounts for the inherent async/timing
sensitivity of focus-on-error tests in jsdom.
