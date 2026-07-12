# P1.M2.T2.S1 — Issue 4 (forwardRef warnings) verification evidence

## TL;DR

**Issue 4 is ALREADY FULLY FIXED** in the current working tree (commit
`716b44c` — *"test(react): drop unnecessary forwardRef wraps to silence render
warnings"*). The orchestrator's task status ("Researching") reflects a
planning-time assumption that the work was still open; the codebase already
satisfies the contract. This is the **same "already-done" situation** as the
sibling tasks P1.M2.T1.S1 and P1.M2.T1.S2 (see their PRPs' "ALREADY EXISTS"
banners). This PRP is therefore a **VERIFY-AND-FINALIZE** PRP.

## Definitive proof (run on current tree)

```
$ npx vitest run --dir packages/react/src/__tests__
 Test Files  37 passed (37)
      Tests  989 passed | 5 skipped (994)

$ grep -c "forwardRef render functions accept exactly two parameters" /tmp/issue4_testrun.txt
0
```

**Zero** "forwardRef render functions accept exactly two parameters" warnings.
The contract's OUTPUT gate ("verify NO 'forwardRef render functions accept
exactly two parameters' warnings appear in stderr", item-description LOGIC (e))
is satisfied.

## Per-file verification — the 7 "fix-list" files (ALL already plain components)

For each file, `TestInput`/`TestSwitch` is a **plain function component**
consuming `forwardRef` from props and wiring `ref={forwardRef}` on the inner
DOM element — exactly the target pattern in the contract:

```tsx
const TestInput = ({
  value, onChange, ..., forwardRef, ...props
}: TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }) => (
  <input ref={forwardRef} ... />
);
```

| File | Status | Evidence |
|------|--------|----------|
| `Field.test.tsx` | ✅ PLAIN | `const TestInput = ({...}) => (...)` @ L35-48; `TestSwitch` @ L73-82; `forwardRef` consumed from props, `ref={forwardRef}` on inner input |
| `Form.coverage.test.tsx` | ✅ PLAIN | `TestInput` @ L37-46; `TestSwitch` @ L64-73; §20 comment @ L35 |
| `autosave-validation.test.tsx` | ✅ PLAIN | `TestInput` @ L37-47; `TestSwitch` @ L57-66; §20 comment @ L34 |
| `autosave-field-debounce.test.tsx` | ✅ PLAIN | §20 comment @ L29; `forwardRef` @ L35; `ref={forwardRef}` @ L39 |
| `autosave-rapid-changes.test.tsx` | ✅ PLAIN | §20 comment @ L34; `forwardRef` @ L40; `ref={forwardRef}` @ L44 |
| `autosave-async-timing.test.tsx` | ✅ PLAIN | §20 comment @ L37; `forwardRef` @ L43; `ref={forwardRef}` @ L47 |
| `autosave-submit-immediate.test.tsx` | ✅ PLAIN | "Plain function component" comment @ L39; `forwardRef` @ L47; `ref={forwardRef}` @ L52 |

None of these still wrap the component in `React.forwardRef(...)`. The
"STILL WRAPPED" grep hit on `Field.test.tsx` is a **false positive** — every
match is in COMMENT text (L31, L71, L2128, L2131, L2134) or the deliberate
migration-regression section (L2131+), not in the `TestInput`/`TestSwitch`
definitions.

## The 4 "fine" files (item-description NOTE) — why they don't warn

The contract explicitly says these are fine (they use `forwardRef<...>((props,
ref) => ...)` legitimately). Verified:

| File | Pattern | Why no warning |
|------|---------|----------------|
| `FormalityProvider.test.tsx` | `forwardRef<HTMLInputElement, TestInputProps>((props, ref) => (<input ref={ref} />))` @ L28 | 2-param signature AND wires `ref={ref}` |
| `useFormState.test.tsx` | `({ value, ... }, ref) => (... ref={ref})` @ L22-24 | 2-param signature AND wires `ref={ref}` |
| `priorityOrder.simple.test.tsx` | `({ value, ... }, ref) => (... ref={ref})` @ L21-23 | 2-param signature AND wires `ref={ref}` |
| `Field.subscriptionStability.test.tsx` | `forwardRef<...>((..., _ref) => (... ref={forwardRef}))` @ L36-39 | 2-param signature (arity correct; `_ref` unused but accepted) — React only warns when arity < 2 |

React's warning ("forwardRef render functions accept exactly two parameters")
fires ONLY when the render function has **fewer than 2 parameters** (i.e. it
omits the `ref` param entirely). All 4 files accept a 2-param signature, so
none warn — confirmed by the zero-warning test run.

## One optional nit (NOT required by the contract)

`Field.test.tsx` has two **stale comments** that describe a shape that no
longer exists:
- L31-32: *"The React.forwardRef wrap is retained for shape compatibility; the
  inner input wires the forwardRef prop."*
- L71: *"the React.forwardRef wrap is retained for shape compatibility."*

The wrap is NOT retained (the components are plain). These comments are
harmless (no functional impact, no warning) but misleading. Cleaning them up is
OPTIONAL and is the only edit this task might make. If the implementer touches
anything, it should be ONLY these two comment lines — nothing else.

## git diff expectation

**EMPTY** (or, if the optional comment cleanup is applied, a 2-line comment
edit in `Field.test.tsx` only). No source changes, no new files, no test logic
changes.

## Contract-to-code traceability

| Item-description contract clause | Where it is satisfied |
|----------------------------------|----------------------|
| (a) identify TestInput/TestSwitch | present in all 7 fix-list files |
| (b) if it uses React.forwardRef and ignores ref → convert to plain | DONE: all 7 are plain, consume forwardRef from props |
| (c) wire ref={forwardRef} on inner DOM element | DONE: every component has `ref={forwardRef}` |
| (d) add comment explaining §20.4 option A | DONE: §20 comment present in all 7 files |
| (e) run vitest, verify NO forwardRef warnings | DONE: 0 warnings (grep -c = 0) |
| OUTPUT: zero warnings, plain components, tests pass | DONE: 989 passed, 0 warnings |
