# Architecture Summary — Field ref delivery via `forwardRef` (plan/003)

> Synthesis of the four research artifacts in this directory. Read this first;
> the individual reports hold verbatim quotes and line numbers.

## 1. What this delta is

A **single, focused React-layer runtime change** (PRD §20) that makes `<Field>`
deliver React Hook Form's `field.ref` (`RefCallBack`) as a regular, top-level,
enumerable prop named **`forwardRef`** instead of via React's reserved special
`ref` key. This makes the **runtime** match the `FormalityFieldComponentProps`
type contract that already shipped in `@formality-ui/react` 0.1.0 (T3.1, done in
plan/002). The type is already correct; only the runtime wiring is stale.

## 2. Scope boundaries (confirmed)

- **React-layer only** (`packages/react`). No `@formality-ui/core` change.
- **forwardRef-exclusive delivery** (PRD §20.4 decision). Do NOT dual-deliver
  the special `ref` key too — that re-triggers the React 18
  *"Function components cannot be given refs"* warning.
- **Minor breaking change, gated to components that opt into the ref:**
  `React.forwardRef`-wrapped components that read the ref via the 2nd arg must
  instead read `props.forwardRef`. Aligned with the 0.1.0 type contract.
- **Out of scope:** `state`/`formState` injection semantics; re-typing
  `FormalityFieldComponentProps` (already correct); `mergeFieldProps` behavior
  beyond `forwardRef` pass-through; Vue/Svelte adapters (stubbed).

## 3. Change site (verified against source)

### 3.1 The one-line runtime change — `packages/react/src/components/Field.tsx:464`
Inside the `<Controller render={({ field, ... }) => { ... }}>` block, the
`coreProps` object (lines 456–466), the 9th/final arg to `mergeFieldProps`:

```diff
       coreProps: {
         name,
         label,
         disabled: isDisabled,
         error: fieldState.error?.message,
         [inputConfig.inputFieldProp ?? "value"]: formattedValue,
         onChange: handleChange(field.onChange),
         onBlur: field.onBlur,
-        ref: field.ref,
+        forwardRef: field.ref,
       },
```

- `field.ref` is referenced **exactly once** in Field.tsx (line 464). No
  second delivery path, no destructuring of `ref` out of `field`.
- The internal cast at Field.tsx:469–470
  (`inputConfig.component as React.ComponentType<FormalityFieldComponentProps>`)
  already anticipates `forwardRef` — **no change** there.

### 3.2 Core pass-through — NO change required (`packages/core/src/config/merge.ts`)
- `mergeStaticProps` (lines 155–167) and `mergeFieldProps` (lines 180–215) are
  **plain `Object.assign` ordered spreads with NO key allow-listing/filtering**.
- `coreProps` is the **last** positional arg → wins outright.
- Therefore `forwardRef` passes through unchanged as a `coreProps` key. ✅
- (If a future refactor introduces key filtering, `forwardRef` MUST remain
  allowed — it is a `coreProps` key, not a stray consumer prop.)

### 3.3 Render paths in Field.tsx (lines 472–503)
- **No-template branch** (line 490): `<Component {...finalProps} />` — direct
  spread. `forwardRef` lands as a top-level prop. ✅ This is the branch the fix
  targets for bare function components.
- **Template branch** (lines 483–488): `finalProps` passed as named prop
  `fieldProps={finalProps}` (NOT spread). A consumer template must destructure
  and forward `forwardRef` itself (spread `fieldProps`, or wire
  `slotProps={{ input: { ref: forwardRef } }}` per §5.3.8). The runtime change
  puts `forwardRef` INTO `fieldProps` correctly; templates are consumer-supplied
  (no built-in default template in this repo).
- **Render-prop children** (lines 493–503): expose `finalProps` as `fieldProps`
  — same forward-on contract as templates.

## 4. Docs to update (Mode A — doc-with-work)

Both document the **same symbol** (`FormalityFieldComponentProps`) whose runtime
contract this delta changes.

| File | Lines | Action |
|------|-------|--------|
| `packages/react/src/overlays.ts` | 167–174 (the `**Runtime caveat (important).**` JSDoc para) | Remove the "FUTURE runtime task" / "out of scope for this type-only change" wording (171–173). State `forwardRef` is delivered at runtime as a top-level prop by `<Field>` (no `React.forwardRef` wrap needed for plain function components). KEEP the "Destructure before forwarding" guidance (150–160) and the MUI v9 `slotProps={{ input: { ref: forwardRef } }}` note (162–165). Also revisit the back-reference at line 148 (`...see "Runtime caveat" below`). |
| `packages/react/README.md` | 609–615 (the README's copy of the caveat para) | Same edit (wording differs slightly: "bare function component", "future runtime task;"). KEEP wrap/ref-as-prop guidance (609–612 head) + closer (614–615). |
| `README.md` (root) | 584 (feature bullet only) | **Verified: no caveat prose.** Needs no Mode-A edit. Mode-B sweep verifies the feature bullet still reads accurately. |

**Wording asymmetry:** overlays.ts uses `FUTURE runtime task (out of scope for
this type-only change)`; the README uses `a future runtime task;`. Any
find/replace MUST be file-specific, not a single global pattern.

## 5. Test harness state (must migrate + extend)

### 5.1 `packages/react/src/__tests__/Field.test.tsx`
- `TestInput` (lines 27–42) and `TestSwitch` (lines 55–67) are
  `React.forwardRef<HTMLInputElement, ...>`-wrapped and read `ref` via the
  **second argument**, wiring `<input ref={ref} />`.
- After `coreProps.ref → forwardRef`, these no longer receive the special `ref`
  key, so their inner `<input ref={ref}>` would silently lose RHF ref wiring.
- **They MUST be migrated** per §20.4: option A (keep the wrap, also spread
  `forwardRef={ref}`) OR option B (drop the wrap, consume `props.forwardRef`).
- **No focus-on-error / ref-inspection assertions exist today** — confirmed by
  repo-wide grep. So changing `ref → forwardRef` does NOT fail existing tests,
  but the harness becomes unrepresentative until migrated.

### 5.2 `packages/react/src/__tests__/FormalityFieldComponentProps.test.tsx`
- `SmokeField` (lines 15–41) is a **plain function component** typed
  `ComponentType<FormalityFieldComponentProps<SmokeProps>>` that destructures
  `forwardRef` out of props and wires `ref={forwardRef as ...}`.
- It is rendered **directly** (`render(<SmokeField ...>)`) — **NOT** through
  `<Field>`. So today it does NOT verify that `<Field>` delivers `forwardRef`
  at runtime (it would receive `undefined` via Field today). It is
  forward-compatible and needs no edit, but R3 adds the real Field-rendered
  plain-component path.

## 6. Coverage gate (PRD §1.3.7) — must stay green at ≥90%
- `vitest.config.ts` (repo root): provider `v8`; `coverage.exclude` spreads
  `coverageConfigDefaults.exclude` then adds `examples/**`,
  `packages/svelte/**`, `packages/vue/**`, `**/dist/**`; **thresholds = 90** on
  statements/branches/functions/lines. **Hard gate** (CI exit 1 below 90%).
- `vitest.workspace.ts` runs only `core` and `react` projects.
- Tests: `pnpm test` (`vitest run`); coverage: `pnpm test:coverage`.
- The new §20.6 tests are **genuine new coverage** (ADD tests, do NOT relax the
  threshold).

## 7. External behavior (RHF + React 18) — confirmed safe
- `field.ref` is a **`RefCallBack`** (`(instance | null) => void`). RHF stores
  the DOM node it captures for focus-on-error (`shouldFocusError`, default
  true). Forwarding the SAME callback as a regular `forwardRef` prop and wiring
  `ref={forwardRef}` to the inner `<input>` preserves focus-on-error identically.
- React 18's *"Function components cannot be given refs"* warning fires
  **only** for the reserved `ref` key on an unwrapped function component. A
  regular prop named `forwardRef` does NOT trigger it.
- jsdom sets `document.activeElement` on `.focus()`, so focus-on-error IS
  observable in tests via `toHaveFocus()` / `document.activeElement`. The ref
  must target a focusable `<input>`.
- Universal across React 18 and 19 (React 19 also allows `ref` as a prop, but
  the `forwardRef`-prop path works identically).

## 8. Dependency graph (subtask ordering)
```
T1.S1 (runtime change + merge pass-through confirm)
  ├─> T1.S2 (Mode-A docs: overlays.ts JSDoc + react README caveat)
  └─> T2.S1 (migrate TestInput/TestSwitch + add §20.6 acceptance tests)
T1.S1, T1.S2, T2.S1 ─> T3.S1 (Mode-B changeset-level doc sweep: root README)
```

## 9. Acceptance (PRD §20.5)
- A plain (non-`React.forwardRef`) function component typed
  `ComponentType<FormalityFieldComponentProps<MyProps>>` that destructures
  `forwardRef` and attaches it to a DOM `<input>` receives a non-`undefined`
  ref callback, and the DOM node resolves.
- No *"Function components cannot be given refs"* warning under React 18.
- RHF focus-on-error reaches the input wired via `forwardRef`.
- The template path delivers `forwardRef` inside `fieldProps` and it reaches
  the input (for any consumer-supplied template that spreads `fieldProps`).
- A `React.forwardRef`-wrapped component that consumes `props.forwardRef`
  focuses correctly on error.
- `pnpm test:coverage` remains green at ≥90% on all four metrics.
