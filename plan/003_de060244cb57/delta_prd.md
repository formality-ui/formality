# Delta PRD — Field ref delivery via `forwardRef`

**Delta from:** plan/002_78ea74508dd8 (Previous PRD: "Formality v1.0 - Complete Specification")
**Scope:** Single focused runtime change to `<Field>`'s ref delivery. React-layer only.

---

## 1. Diff Summary (what actually changed)

The Previous PRD and Current PRD are **byte-identical except for two additions** (diff-verified, ~185 lines added, 0 removed, 0 modified elsewhere across a 6107-line document):

1. **TOC entry (1 line):** `20. [Field ref delivery via forwardRef](#20-field-ref-delivery-via-forwardref)`
2. **New Section 20 (subsectionss 20.1–20.7):** "Field ref delivery via `forwardRef`"

No other section, type, requirement, or appendix was modified. This is a minimal, single-feature addition.

---

## 2. What This Delta Is

Section 20 is the **runtime follow-up** to the previous session's Appendix C **T3.1** work (P1.M1.T3.S1, status: ✅ DONE), which shipped the type `FormalityFieldComponentProps<P>` (with `forwardRef?: RefCallBack`) as a **type-only** export.

The prior research (`plan/002_78ea74508dd8/architecture/injected_props_types.md` §3) explicitly flagged the unresolved mismatch as a **future runtime task, out of R4 scope**:

> ⚠️ **Naming mismatch (NOT resolved in R4):** at runtime Field spreads this as `ref` (React-special). The PRD/consumer `WithFormality` names the prop `forwardRef`. R4 is type-only (runtime unchanged) … To make plain function components receive it as `forwardRef` (no `React.forwardRef` wrap), Field.tsx would need `coreProps.forwardRef = field.ref` — a **future runtime task**, out of R4 scope.

**This delta resolves that mismatch.** `<Field>` currently delivers RHF's ref via React's special `ref` key (`Field.tsx:464`: `ref: field.ref`). Section 20 requires it be delivered as a regular, top-level enumerable prop named `forwardRef` — so the **runtime** matches the `FormalityFieldComponentProps` type contract that already shipped in `@formality-ui/react` 0.1.0.

**The runtime change is literally one line.** The rest of the work is confirming core pass-through (no change needed — already verified), rewriting the now-stale "Runtime caveat" prose on the symbol, and adding the §20.6 tests.

---

## 3. Requirements (the delta)

### R1 — Deliver RHF ref as a top-level `forwardRef` prop (PRD §20.1, §20.2)

`<Field>` MUST deliver `field.ref` (`RefCallBack`) as a prop named `forwardRef` in the `coreProps` object passed to `mergeFieldProps`. It MUST NOT rely on React's special `ref` key as the delivery mechanism.

- **Change site:** `packages/react/src/components/Field.tsx`, inside the `Controller render={({ field, ... }) => { ... }}` block, in the `coreProps` object (Field.tsx:456–465). Single edit:
  ```diff
       coreProps: {
         ...
         onBlur: field.onBlur,
  -      ref: field.ref,
  +      forwardRef: field.ref,
       },
  ```
- **Pass-through (PRD §20.2):** Confirm `mergeFieldProps` (`packages/core/src/config/merge.ts:180`) → `mergeStaticProps` is a plain ordered spread with **no key allow-listing/filtering**, so `forwardRef` passes through unchanged as a `coreProps` key. **Already verified against source** (`merge.ts:180-228` is `Object.assign`-style ordered merge; `coreProps` applied last). If a future refactor introduces key filtering, `forwardRef` MUST remain allowed (it is a `coreProps` key, not a stray consumer prop). **No core change is required** unless filtering is later introduced.
- This is a **React-layer-only** change (`packages/react`). No framework-agnostic core logic is touched beyond confirming the pass-through above. The type is **already correct** (T3.1) — this re-types nothing. The existing internal cast `inputConfig.component as React.ComponentType<FormalityFieldComponentProps>` (Field.tsx:470) already anticipates this and needs no change.

### R2 — Confirm the forwardRef-exclusive delivery decision (PRD §20.4)

PRD §20.4 states a **DECISION**: deliver `forwardRef` exclusively; do NOT also spread React's special `ref` key. Dual-delivery is **rejected** (spreading `ref` onto a plain function component re-triggers the React 18 *"Function components cannot be given refs"* warning — the exact problem this work removes).

- **Sign-off gate (open):** §20.4 carries an explicit "requires sign-off" note. Confirm the default **forwardRef-exclusive** path. Only if strict non-breaking behavior is required may dual-delivery be requested (not recommended; the React 18 warning trade-off must then be documented). **Implement the forwardRef-exclusive default unless explicitly overridden.**
- **Migration impact (minor breaking change, gated to components that opt into the ref):** `React.forwardRef`-wrapped components that today rely on React intercepting the special `ref` key MUST instead read `forwardRef` from props (PRD §20.4 options A/B). This is aligned with the 0.1.0 type contract.
  - **Existing test harness affected:** `packages/react/src/__tests__/Field.test.tsx` `TestInput`/`TestSwitch` (Field.test.tsx:27, 55) are `React.forwardRef`-wrapped and read the ref via the second arg. After this change they no longer receive a special `ref` key, so their inner `<input ref={ref}>` would silently lose RHF ref wiring. They MUST be migrated (option A: also spread `forwardRef={ref}`; or option B: drop the wrap and consume `props.forwardRef`). Confirm whether any existing test asserts focus-on-error / ref behavior before migrating; if not, the migration is cosmetic but required to keep the harness representative.
  - The existing `FormalityFieldComponentProps.test.tsx` `SmokeField` is already a plain function component reading `props.forwardRef` — it is forward-compatible and needs no change (it does not currently render through `<Field>`; R3 adds that path).

### R3 — Tests for runtime ref delivery (PRD §20.5, §20.6)

Add tests covering the §20.6 requirements (all in scope for the §1.3.7 ≥90% coverage gate):

- **Plain function component delivery:** render a plain (non-`React.forwardRef`) component typed `ComponentType<FormalityFieldComponentProps<MyProps>>` that destructures `forwardRef` and attaches it to a DOM `<input>` (`ref={forwardRef}`); assert the ref callback is invoked / the input DOM node is registered with RHF (non-`undefined`).
- **No React 18 ref warning:** assert no *"Function components cannot be given refs"* warning is emitted (via a `console.error` spy or rendered-tree assertion).
- **Focus-on-error:** trigger a validation error and assert the input wired via `forwardRef` is focused (RHF focus-on-error reaches the input).
- **Migration regression:** a `React.forwardRef`-wrapped component that consumes `props.forwardRef` (§20.4 option A/B) still focuses correctly on error.
- Reuse the existing `<Form>` + `<Field>` + `FormalityProvider` test harness from `Field.test.tsx`. These are genuine new coverage, not a threshold relaxation — coverage is cleared by ADDING tests (PRD §1.3.7).

### R4 — Update `FormalityFieldComponentProps` docs (PRD §20.7, Mode A doc-with-work)

Rewrite the `FormalityFieldComponentProps` JSDoc to remove the now-false "Runtime caveat" prose, and sync the identical stale paragraph in the React README.

- **`packages/react/src/overlays.ts`** (the `FormalityFieldComponentProps` JSDoc, overlays.ts:147–178):
  - Remove the **"Runtime caveat (important)"** paragraph and all *"future runtime task"* / *"out of scope for this type-only change"* wording (overlays.ts:167–171).
  - State that `forwardRef` is delivered at runtime as a top-level prop by `<Field>` (no `React.forwardRef` wrap required for plain function components).
  - KEEP the "Destructure before forwarding" guidance and the MUI v9 `slotProps={{ input: { ref: forwardRef } }}` note (cross-ref PRD §5.3.8).
- **`packages/react/README.md`** (lines ~609–613): contains the **same** "Runtime caveat (important)" paragraph (verbatim) documenting the same symbol. Sync it identically — remove the caveat, state that `forwardRef` is delivered at runtime as a top-level prop. (This is Mode A — the README documents the same symbol's contract, so it rides with the implementation, not a standalone task.)
- **Out of scope (PRD §20.7):** `state` / `formState` injection semantics; `mergeFieldProps` behavior beyond `forwardRef` pass-through; re-typing `FormalityFieldComponentProps` (already correct); any `@formality-ui/core` change (React-layer only).

### Documentation impact — Mode A vs Mode B

- **Mode A (doc-with-work, included in R4):** `packages/react/src/overlays.ts` (JSDoc) and `packages/react/README.md` (the "Runtime caveat" paragraph + the `FormalityFieldComponentProps` section that quotes it). Both document the same symbol whose contract this delta changes.
- **Mode B (changeset-level cross-cutting docs): Does NOT apply.** This delta changes a single symbol's runtime contract; it introduces no new top-level capability requiring a README feature blurb or architecture-overview update. `FormalityFieldComponentProps` is already listed in `packages/react/README.md` and root `README.md` as a shipped type — those feature listings remain accurate (the type was already shipped by T3.1; only its runtime backing changed). The root `README.md` does not carry the "Runtime caveat" prose and needs no edit.

---

## 4. Relationship to Completed Work (previous session)

| Prior work (plan/002) | Status | Relationship to this delta |
| --- | --- | --- |
| **P1.M1.T3.S1 (T3.1)** — exported `FormalityFieldComponentProps<P>` with `forwardRef?: RefCallBack`; added "Runtime caveat" JSDoc; reused internally to cast the Component in Field.tsx | ✅ DONE | **Direct dependency.** This delta makes the runtime match that type and removes the caveat T3.1 added. The internal cast at Field.tsx:470 already anticipates `forwardRef` — no change there. |
| **P1.M3.T1.S1** — documented `FormalityFieldComponentProps` in `packages/react/README.md` (incl. the "Runtime caveat" paragraph) | ✅ DONE | **Mode A doc impact.** That README paragraph (the same caveat) must be synced in R4. |
| `plan/002/.../injected_props_types.md` | Research | Authoritative source for the three prop types; flagged this exact runtime task as future work. |

No other prior task is affected. The coverage gate (P1.M2.T1.S5) and the other Appendix C items (T1.1–T3.2) are untouched by this delta.

---

## 5. Implementation Plan

**Sizing:** This is a small, focused change — one runtime line, one core pass-through confirmation (no change), one symbol's doc prose (two files), and a focused test cluster. The plan is deliberately minimal: **1 Phase, 1 Milestone, 2 Tasks, 3 Subtasks.**

### Phase P1 — Field ref delivery via `forwardRef`

**Goal:** Make `<Field>` deliver RHF's ref as a top-level `forwardRef` prop so the runtime matches the already-shipped `FormalityFieldComponentProps` type, with updated docs and tests.

#### Milestone P1.M1 — Runtime delivery + docs + tests

##### Task P1.M1.T1 — Implement `forwardRef` runtime delivery + sync contract docs (R1, R2, R4)

- **Subtask P1.M1.T1.S1** — Change `coreProps.ref` → `coreProps.forwardRef` in Field.tsx; confirm `mergeFieldProps` pass-through (R1).
- **Subtask P1.M1.T1.S2** — Rewrite `FormalityFieldComponentProps` JSDoc (overlays.ts) + sync the "Runtime caveat" paragraph in `packages/react/README.md` (R4, Mode A).

##### Task P1.M1.T2 — Test runtime ref delivery + backward-compat migration (R3, R2)

- **Subtask P1.M1.T2.S1** — Add the §20.6 tests (plain-component `forwardRef` delivery; no React 18 ref warning; focus-on-error; `React.forwardRef` migration regression); migrate the affected `TestInput`/`TestSwitch` harness in Field.test.tsx per §20.4 (R3, R2).

---

## 6. Acceptance (PRD §20.5)

- A plain (non-`React.forwardRef`) function component typed `ComponentType<FormalityFieldComponentProps<MyProps>>` that destructures `forwardRef` and attaches it to a DOM `<input>` receives a non-`undefined` ref callback, and the DOM node resolves.
- No *"Function components cannot be given refs"* warning under React 18.
- RHF focus-on-error reaches the input wired via `forwardRef`.
- The template path delivers `forwardRef` inside `fieldProps` and it reaches the input (for any consumer-supplied template that spreads `fieldProps`).
- A `React.forwardRef`-wrapped component that consumes `props.forwardRef` focuses correctly on error.
- `pnpm test:coverage` remains green at ≥90% on all four metrics (§1.3.7); new tests are added, not the threshold relaxed.

---

## 7. Out of Scope

- `state` / `formState` injection semantics (PRD §20.7 — these remain a separate future task; the type reflects the intended contract).
- `mergeFieldProps` behavior beyond confirming `forwardRef` pass-through (PRD §20.2).
- Re-typing `FormalityFieldComponentProps` (the type is already correct — T3.1).
- Any `@formality-ui/core` change (this is React-layer only; the core pass-through is confirmed unchanged).
- Vue/Svelte adapters (stubbed; §1.3.5).
