# Research Notes — P2.M1.T1.S3: Verify Field behavioral parity after extraction

Scope: This is a **VERIFICATION + DIAGNOSTIC/FIX** task. It runs AFTER P2.M1.T1.S2
(which extracted the `useField` hook out of `Field.tsx` and thinned `Field.tsx`
into a wrapper). S3's job is to PROVE the extraction preserved 100% of Field's
behavior, DIAGNOSE & FIX any regression via git-diff comparison, and ADD isolated
`renderHook` tests for the `useField` hook contract where the integration tests
only cover it indirectly.

The hard gate: **the full test suite passes unchanged** (baseline verified below)
+ typecheck green + coverage ≥ 90% + `useField` is testable in isolation.

## 1. Verified baseline (run `pnpm test` at repo root, pre-S2 state)

```
 Test Files  39 passed (39)
      Tests  1018 passed | 5 skipped (1023)
```

**This is the regression gate.** After S2 + S3 the count MUST stay at
**1018 passed | 5 skipped** (the `useField.test.tsx` file's single test count
is unchanged — S2 replaced the "stub throws" test with a real smoke test, so
the net count is identical). If the count DROPS, the extraction broke behavior.

The task description cites "1003+ passed, 5 skipped" — that was an earlier
baseline; the repo has grown to **1018 passed | 5 skipped**. Use 1018 as the
authoritative floor. (A HIGHER count is expected only if S3 itself ADDS new
isolated `useField` tests — see §5.)

## 2. The parity-gate test files (what MUST pass UNMODIFIED)

These 7 files exercise `<Field>` end-to-end and are the regression net for the
S2 extraction. ALL must pass with their test bodies UNCHANGED (S3 must not edit
these to "make them pass" — that would mask a regression):

| File | Tests | What it guards |
|---|---|---|
| `__tests__/Field.test.tsx` | 24 describe blocks / ~60 `it`s | The master parity gate: rendering, conditions, selectProps, value-transform, validation, disabled resolution (prop/config/condition/group/merge-layer/JSX), render-prop, shouldRegister, type-override, config-less defaults, host-element fallback, setValue conditions, FieldGroup propagation, templates, forwardRef delivery. |
| `__tests__/Field.forwardRef.test.tsx` | 1 `it` | §20.1 proof: plain (non-`React.forwardRef`) function component receives a non-`undefined` `forwardRef` that is RHF's `RefCallBack` (a function). |
| `__tests__/FieldForwardRef.acceptance.test.tsx` | 4 `it`s | §20.6 acceptance cluster: forwardRef delivery; NO React 18 "Function components cannot be given refs" warning; focus-on-error reaches the input wired via `forwardRef`; `React.forwardRef`-wrapped component consuming `props.forwardRef` still focuses (migration regression). |
| `__tests__/Field.subscriptionStability.test.tsx` | 1 `it` | The "Maximum update depth exceeded" guard: typing into a watched field must NOT churn subscriptions (subscription effect re-runs only on subscription-set change, not value change). |
| `__tests__/render-isolation.test.tsx` | 15 `it`s | Render-function children don't cause cross-validation; rules-change detection; render performance. |
| `__tests__/integration/complete-form.test.tsx` | 37 `it`s/describes | End-to-end: full form render, submit, validation, UnusedFields, FieldGroup. |
| `__tests__/validation-report-fixes.test.tsx` | (multiple) | The ONLY test covering `provideState`/`passSubscriptions` state injection + `defaultSubscriptionPropName`/`passSubscriptionsAs`. |

## 3. The three high-risk areas to scrutinize on a regression (PRD-grounded)

The task description calls out three areas that are the most likely regression
sites if S2's relocation drifted from the original. If ANY test fails, diff the
extracted block against the original and confirm these are byte-identical:

### 3a. forwardRef delivery — host-element vs component path (§20.1 / §20.4)
- **Component path:** `coreProps.forwardRef = field.ref` (NOT the legacy `ref`
  key). A plain function component typed `ComponentType<FormalityFieldComponentProps>`
  destructures `forwardRef` and wires it to the DOM input.
- **Host-element path:** when `typeof inputConfig.component === "string"`
  (e.g. `"input"`), translate `forwardRef` → React's reserved `ref` key AND strip
  non-DOM keys (`forwardRef`, `formState`, `state`, `subsPropName`) before
  `createElement`.
- **Guards:** `Field.forwardRef.test.tsx`, `FieldForwardRef.acceptance.test.tsx`,
  the `Field.test.tsx` `forwardRef delivery` describe, and the host-element
  fallback describes (`does not leak forwardRef onto the fallback host element`).
- **Git history anchor:** commits `512023c` (deliver forwardRef) and `09a6464`
  (translate forwardRef→ref for host fallback) introduced this — useful context
  if a forwardRef regression appears.

### 3b. setValue effect ref pattern (§7.1.1)
- `setValueRef`/`getValuesRef` are **`useRef`s assigned on every render** (NOT in
  the effect's dependency array) so the effect doesn't tear down/re-subscribe when
  `methods.setValue` changes identity.
- The effect guards against infinite loops with
  `if (currentValue !== effectiveSetValue.value)` before calling `setValue`.
- **Guards:** `Field.test.tsx` `set conditions (F6/F7)` describe (~L1925-1987):
  `applies a field-level set condition`, `applies a group-level set condition`.
- **Regression symptom:** "Maximum update depth exceeded" OR the setValue never
  applies (one-render-behind). Both mean the ref pattern was broken in the move.

### 3c. subscription lifecycle cleanup
- `useInferredInputs` must return a **reference-stable** memo (signature-stable
  input → same array out) so `allSubscriptions` doesn't bust identity every render.
- The subscription `useEffect` deps include the subscription SET (not the value);
  cleanup (`removeSubscription`) must run exactly once per real subscription change.
- **Guard:** `Field.subscriptionStability.test.tsx` (the dedicated max-depth
  regression test — see the file header for the exact root cause it pins).
- **Regression symptom:** dozens of `[Formality Subscription]` log lines on each
  keystroke, or a hard "Maximum update depth exceeded" error.

## 4. The diagnostic procedure (when a test fails)

S2 relocated logic block-by-block from `Field.tsx` into `useField.ts`. If a test
fails, the regression is almost certainly a **drifted block** (missing line, reordered
hook, changed dep array, dropped ref assignment). The fix workflow:

1. **Isolate the failing assertion.** Read the test name + the Field behavior it
   exercises (map to §2's catalog / §3's risk areas).
2. **Diff the extracted block against the original.** The original `Field.tsx`
   is in git history (S2's changes are either unstaged/staged or in the most
   recent commit). Compare:
   ```bash
   # If S2 is uncommitted working changes:
   git diff HEAD -- packages/react/src/components/Field.tsx
   git diff HEAD -- packages/react/src/hooks/useField.ts
   # If S2 is committed, diff against the commit BEFORE S2:
   git log --oneline -3 -- packages/react/src/components/Field.tsx
   git diff <pre-S2-commit> -- packages/react/src/components/Field.tsx packages/react/src/hooks/useField.ts
   ```
3. **Reconcile each relocated block to byte-identity** with the original. The S2
   PRP mandated a verbatim RELOCATION (no rewrite). Any divergence = the bug.
   Cross-check the S2 research line-map
   (`P2M1T1S2/research/research-notes.md` §2) which maps each Field.tsx line range
   to its destination in useField.ts.
4. **Re-run the specific failing test** after the fix:
   `pnpm test -- <failing-file>`.

## 5. Isolated useField hook tests (the "testable in isolation" deliverable)

The work item requires: *"Add new tests for useField hook in isolation using
renderHook if the existing integration tests don't cover edge cases directly."*

### 5a. What "covered indirectly" means today
Every `Field.test.tsx` assertion exercises `useField` **indirectly** (via
`<Field>` rendered inside `<FormalityProvider><Form>`). That proves behavioral
parity but does NOT assert the hook's **direct contract** (`UseFieldReturn`
shape) or its behavior when called WITHOUT `<Field>`.

### 5b. The renderHook + Form wrapper pattern (REUSE, don't reinvent)
`__tests__/useFormState.test.tsx` already defines the canonical pattern for a
hook that needs a full form context: a `createWrapper` that mounts
`<FormalityProvider inputs={testInputs}><Form config={...} record={...}>{children}</Form></FormalityProvider>`
and is passed to `renderHook(callback, { wrapper })`. S3's isolated useField
tests MUST reuse this exact wrapper shape (it gives useField the live
`FormContext`/`ConfigContext`/`GroupContext` it reads internally).

### 5c. Candidate isolated tests (add the ones the integration tests don't hit directly)
- `useField` returns an object with `renderedField` defined (a `ReactElement`
  when visible). *(S2's smoke test likely covers this — verify before duplicating.)*
- `useField` returns `watchers` as a `Record<string, boolean>` (the hook OWNS
  watcher state — no integration test asserts on the return shape directly).
- `useField` returns the full `UseFieldReturn` shape
  (`fieldState`, `renderedField`, `fieldProps`, `watchers`, `formState`).
- `useField` with `hidden={true}` returns `null` renderedField (Controller does
  not mount — the hidden-field invariant).
- `useField` registers a watcher setter on mount and cleans it up on unmount
  (spy on `registerWatcherSetter`/`unregisterWatcherSetter` via a context mock,
  mirroring `useSubscriptions.test.tsx`'s `createMockContext` approach).
- `useField` with a function `children` applies the render-prop (returns the
  children's output, not the raw input).

**Coverage discipline:** each isolated test must add MEANINGFUL coverage on a
branch the integration tests reach only obliquely. Do NOT duplicate what
`Field.test.tsx` already asserts through `<Field>`. The gate is "testable in
isolation" — the hook can be exercised directly — not "re-assert everything twice."

## 6. Validation gates (verified commands, repo root)

| Command | What it checks | Expected after S3 |
|---|---|---|
| `pnpm typecheck` | `tsc --build`; validates `useField.ts`, refactored `Field.tsx`, AND `__typechecks__/useField.test-d.ts` (the `UseFieldReturn ≡ FieldRenderAPI` assertion) | Zero errors |
| `pnpm test` | `vitest run`; full suite | **1018 passed \| 5 skipped** (baseline) + any new isolated `useField` tests S3 adds |
| `pnpm lint` | `eslint .`; incl. `verbatimModuleSyntax` + `rules-of-hooks` | Zero errors |
| `pnpm build` | `pnpm -r build` (tsup) | Both packages compile & emit |
| `pnpm test:coverage` | v8 coverage with the root `vitest.config.ts` 90% threshold gate (statements/branches/functions/lines all ≥ 90%) | ≥ 90% on all metrics; CI-style exit 0 |

## 7. Parallel/sibling boundaries

- **P2.M1.T1.S2 (PREV, the extraction):** S3 consumes its outputs (refactored
  `Field.tsx` + implemented `useField.ts` + updated `useField.test.tsx` + barrel
  export). If S2 introduced a regression, S3 is where it's caught & fixed.
  S3 may EDIT `useField.ts`/`Field.tsx` to fix a parity regression — that is in
  scope. S3 must NOT re-do the extraction (no architectural change beyond fixing
  drifted blocks back to byte-identity with the original).
- **P2.M1.T1.S1 (the contract):** complete; `UseFieldReturn`/`UseFieldParams`
  are LOCKED. S3 must not touch the interface field sets (the test-d file guards this).
- **P2.M1.T2.S1 (sibling, planned):** removes `useFieldDisabledState.ts` — a
  DIFFERENT file. No overlap with S3.
- **P2.M2.T1.S1 (sibling, planned):** edits `overlays.ts` forwardRef wording —
  READ ONLY for S3.

## 8. Scope discipline (what S3 is NOT)

- S3 is NOT a feature build. It is verify → diagnose → fix-back-to-parity → add
  isolated tests.
- S3 must NOT change the `<Field>` PUBLIC behavior or API (that would defeat the
  parity gate). Fixes are "restore the original behavior," not "change behavior."
- S3 must NOT edit the 7 parity-gate test files to make them pass.
- S3 must NOT touch `UseFieldParams`/`UseFieldReturn` field sets or `FieldRenderAPI`.
- S3 must NOT introduce `useController` or state-capture inside the Controller
  render callback (both are FORBIDDEN by the S2 design decision — see S2 PRP
  "Anti-Patterns"; reintroducing them would risk the very regressions S3 guards).
