name: "P1.M1.T1.S1 — Deliver field.ref as top-level `forwardRef` prop in Field.tsx; confirm merge pass-through"
description: |

---

## Goal

**Feature Goal**: Make `<Field>` deliver React Hook Form's `field.ref`
(`RefCallBack`) as a regular, top-level, **enumerable** prop named
`forwardRef` on the rendered component, instead of via React's special
reserved `ref` key. This aligns the **runtime** with the
`FormalityFieldComponentProps` type contract that already shipped in
`@formality-ui/react` 0.1.0 (PRD §20 / §20.1).

**Deliverable**: A single one-line edit at
`packages/react/src/components/Field.tsx:464` — change the `coreProps` key
`ref: field.ref,` → `forwardRef: field.ref,` (preserve 12-space indentation).
Plus a **minimal failing→passing test** proving a plain function component
rendered through `<Field>` receives a non-`undefined` `forwardRef` (implicit
TDD per the contract; the full §20.6 acceptance cluster lands in
P1.M1.T2.S1). Plus a **read-only verification** that `mergeFieldProps`
passes `forwardRef` through unchanged.

**Success Definition**:
1. Field.tsx:464 reads `forwardRef: field.ref,` (12-space indent preserved).
2. The reserved `ref` key is NO LONGER emitted anywhere in `coreProps` (no dual-delivery — PRD §20.4 decision).
3. A minimal unit test exists that fails before the edit and passes after: a plain (non-`React.forwardRef`) function component rendered via `<Field>` receives a non-`undefined` `forwardRef` prop.
4. `mergeFieldProps` / `mergeStaticProps` (`packages/core/src/config/merge.ts`) confirmed (read-only) to be plain `Object.assign` ordered spreads with no key allow-listing — `forwardRef` passes through unchanged. **No core edit required** (and none allowed unless a refactor has introduced filtering, in which case `forwardRef` must remain allowed).
5. `pnpm typecheck`, `pnpm test`, `pnpm test:coverage` (≥90% gate), and `pnpm lint` all green.
6. No documentation edited in THIS subtask (JSDoc + README caveats are P1.M1.T1.S2 / P1.M1.T3.S1).

## User Persona

**Target User**: React consumers of `@formality-ui/react` who write plain
function components typed as `ComponentType<FormalityFieldComponentProps<P>>`
and destructure `forwardRef` to wire RHF's ref to a DOM `<input>`.

**Use Case**: A consumer writes
`const TextField = ({ forwardRef, ...rest }) => <input ref={forwardRef} {...rest} />;`
and registers it as an input component. Today `forwardRef` arrives as
`undefined` (because Field delivers the ref via React's special `ref` key,
which plain function components cannot receive), so RHF focus-on-error never
reaches the input. After this change, `forwardRef` arrives populated.

**Pain Points Addressed**:
- Plain function components that follow the documented
  `FormalityFieldComponentProps` pattern receive `forwardRef: undefined`.
- The React 18 *"Function components cannot be given refs"* warning fires
  whenever the special `ref` key is spread onto a plain function component.
- RHF's focus-on-error silently fails to focus the input.

## Why

- **Business value**: Makes the shipped type contract (`forwardRef?:
  RefCallBack`) actually true at runtime — closes the gap between docs/types
  and behavior. Enables RHF focus-on-error for the documented component
  pattern.
- **Integration**: This is the foundational runtime change for PRD §20.
  Sibling subtasks build on it:
  - **P1.M1.T1.S2** rewrites the `FormalityFieldComponentProps` JSDoc +
    README "Runtime caveat" (Mode A docs).
  - **P1.M1.T2.S1** migrates the existing `TestInput`/`TestSwitch` test
    harness (currently `React.forwardRef`-wrapped) to consume `forwardRef`
    AND adds the full §20.6 acceptance cluster (no-warning, focus-on-error,
    regression).
  - **P1.M1.T3.S1** sweeps root/react README feature listings.
  This subtask touches ONLY Field.tsx (runtime) + one minimal proof test.
- **Scope boundary**: React-layer only. Do NOT touch `@formality-ui/core`
  (framework-agnostic) beyond the read-only pass-through confirmation. Do
  NOT re-type `FormalityFieldComponentProps` (already correct). Do NOT
  migrate the test harness or add the full §20.6 cluster here.

## What

### The change (PRD §20.1)

In `packages/react/src/components/Field.tsx`, inside the
`<Controller render={({ field, fieldState, formState }) => { ... }}>` block,
in the `coreProps` object (the 9th/final argument to `mergeFieldProps`),
line 464:

```diff
   coreProps: {
     name,
     label,
     disabled: isDisabled,
     error: fieldState.error?.message,
     [inputConfig.inputFieldProp ?? "value"]: formattedValue,
     onChange: handleChange(field.onChange),
     onBlur: field.onBlur,
-    ref: field.ref,
+    forwardRef: field.ref,
   },
```

After this, `forwardRef` is a regular enumerable prop on `finalProps` and
reaches the rendered component via the same `{...finalProps}` spread that
delivers `name`, `value`, `onChange`, `onBlur`. React no longer intercepts
it as a special key.

### Pass-through verification (PRD §20.2) — READ-ONLY

Confirm (by reading, not editing) `packages/core/src/config/merge.ts`:
- `mergeStaticProps` (lines 155-167): plain loop of `Object.assign(result,
  layer)` — **no key allow-listing/filtering**.
- `mergeFieldProps` (lines 180-215): composes result via `mergeStaticProps(
  providerDefaultFieldProps, providerSelectDefaultFieldProps,
  formDefaultFieldProps, formSelectDefaultFieldProps, inputProps,
  fieldConfigProps, selectProps, componentProps, coreProps)` — `coreProps`
  is applied **last** (line 213) and wins outright.

→ `forwardRef` passes through unchanged. **No core edit required.** Only if
a refactor has since introduced key filtering would an edit be needed, and
then ONLY to keep `forwardRef` allowed (it is a `coreProps` key, not a
stray consumer prop).

### Render paths (PRD §20.3) — confirm both carry `forwardRef`

- **No-template branch** (Field.tsx:490): `<Component {...finalProps} />` —
  direct spread → `forwardRef` lands as a top-level prop. ✅ (This is the
  branch the minimal proof test exercises.)
- **Template branch** (Field.tsx:483-488): `finalProps` passed as named
  prop `fieldProps={finalProps}` → templates must forward it themselves
  (spread `fieldProps` or wire `forwardRef` explicitly). No built-in
  default template exists in this repo, so no in-repo template audit needed.
- **Render-prop children** (Field.tsx:493-503): `finalProps` exposed as
  `fieldProps` to consumer render functions — same forward-on contract.

### Success Criteria

- [ ] Field.tsx:464 reads `forwardRef: field.ref,` (12-space indent).
- [ ] `grep -n "ref: field.ref\|field\.ref" packages/react/src/components/Field.tsx` returns only the new `forwardRef: field.ref` line (no lingering `ref:` key).
- [ ] `mergeFieldProps`/`mergeStaticProps` confirmed (read-only) to have no key filtering; `coreProps` applied last.
- [ ] Minimal proof test added: plain function component receives non-`undefined` `forwardRef` (fails before, passes after the edit).
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm test:coverage` (≥90%), `pnpm lint` all green.
- [ ] No edits to `packages/core/*`, `overlays.ts`, or any README in this subtask.

## All Needed Context

### Context Completeness Check

_Pass._ The architecture report
(`plan/003_de060244cb57/architecture/field_ref_change_site.md`) was verified
against live source during research: the exact line, indentation, surrounding
`coreProps` block, the component cast, both render branches, and the merge
pass-through functions all match. The implementing agent needs only to
re-confirm the line numbers (they may have shifted) and make the edit.

### Documentation & References

```yaml
# MUST READ
- url: PRD §20.1 (heading:h3.95) — "Requirement (the change)"
  why: Authoritative statement of the exact diff (ref → forwardRef in coreProps).
  critical: "After this change forwardRef is a regular, enumerable prop on finalProps… React no longer intercepts it as a special key."

- url: PRD §20.2 (heading:h3.96) — "Pass-through verification (mergeFieldProps)"
  why: Confirms core requires NO edit (plain Object.assign, coreProps last → wins).
  critical: "If a future refactor introduces key allow-listing, forwardRef MUST remain in the allow-list (it is a coreProps key, not a stray consumer prop)."

- url: PRD §20.4 (heading:h3.98) — "Backward compatibility & migration (DECISION)"
  why: The signed-off decision is forwardRef-EXCLUSIVE. Do NOT dual-deliver.
  critical: "Dual-delivery is REJECTED: spreading ref onto a plain function component re-triggers the React 18 'Function components cannot be given refs' warning."

- url: PRD §20.5 (heading:h3.99) — "Acceptance criteria"
  why: Defines what "done" means at the feature level (full cluster lands in P1.M1.T2.S1; this subtask proves the first criterion).
  critical: "A plain function component… receives a non-undefined ref callback, and the DOM node resolves."

- url: PRD §5.3.8 (heading:h4.36) — "Template Rendering"
  why: Confirms the two render branches (no-template spread vs template fieldProps prop).
  critical: No built-in default template exists; template path is consumer-supplied and optional.

- docfile: plan/003_de060244cb57/architecture/field_ref_change_site.md
  why: Verified change-site map with verbatim quotes + exact line numbers for Field.tsx coreProps (456-466), component cast (469-470), render path (472-491), and merge.ts pass-through (155-167, 180-215).
  section: "§1 coreProps block", "§2 merge pass-through", "§3 render path"
  critical: Confirms `field.ref` appears EXACTLY ONCE in Field.tsx (line 464) — no second delivery path, no `ref` destructured out of `field`. Single edit is complete for delivery.

- file: packages/react/src/components/Field.tsx
  section: "line 464 (coreProps.ref) inside the Controller render block"
  why: THE line to edit. Re-confirm the line number before editing (may have shifted).
  pattern: "coreProps: { name, label, disabled, error, [inputFieldProp ?? 'value']: formattedValue, onChange, onBlur, ref: field.ref }"
  gotcha: "Preserve 12-space indentation. Do NOT also keep `ref: field.ref` — forwardRef-exclusive per §20.4."

- file: packages/react/src/components/Field.tsx
  section: "lines 469-470 (Component cast)"
  why: The cast `inputConfig.component as React.ComponentType<FormalityFieldComponentProps>` already anticipates forwardRef — DO NOT TOUCH.
  pattern: Cast targets the type that already declares `forwardRef?: RefCallBack`.
  gotcha: No literal ref/forwardRef token in the cast; it just names the type. Leave it alone.

- file: packages/react/src/components/Field.tsx
  section: "lines 482-491 (render branches)"
  why: Confirm forwardRef reaches the component on BOTH paths.
  pattern: "No-template: `<Component {...finalProps} />` (line 490). Template: `fieldProps={finalProps}` (line 485)."
  gotcha: Template branch passes finalProps as a NAMED prop, not a spread — templates must forward forwardRef themselves (consumer contract).

- file: packages/core/src/config/merge.ts
  section: "mergeStaticProps (155-167), mergeFieldProps (180-215)"
  why: READ-ONLY confirmation that forwardRef passes through. Plain Object.assign; coreProps last → wins.
  pattern: "for (const layer of layers) { if (layer) Object.assign(result, layer); }"
  gotcha: "If a refactor has introduced key filtering since this report, forwardRef MUST remain allowed. Otherwise NO core edit."

- file: packages/react/src/overlays.ts
  section: "lines 179-188 (FormalityFieldComponentProps type)"
  why: The type contract is ALREADY correct (`forwardRef?: RefCallBack`). This subtask re-types nothing.
  pattern: "export type FormalityFieldComponentProps<P = unknown> = P & { state?: ...; formState?: ...; forwardRef?: RefCallBack; }"
  gotcha: "DO NOT edit the JSDoc here — that is P1.M1.T1.S2 (Mode A docs). This subtask touches only Field.tsx + the proof test."

- file: packages/react/src/__tests__/Field.test.tsx
  section: "TestInput (line 27, React.forwardRef-wrapped), TestSwitch (line 55)"
  why: Existing test harness uses React.forwardRef — that migration is P1.M1.T2.S1, NOT this subtask. Read it to follow the existing render/mount pattern for the minimal proof test.
  pattern: "const TestInput = forwardRef<HTMLInputElement, TestInputProps>((props, ref) => <input ... />);"
  gotcha: "Do NOT migrate TestInput/TestSwitch here. Add a SEPARATE minimal plain-function-component test that proves forwardRef delivery."
```

### Current Codebase tree (relevant slice)

```bash
packages/
  core/src/config/
    merge.ts              # mergeStaticProps (155-167), mergeFieldProps (180-215) — READ-ONLY, no edit expected
  react/src/
    components/
      Field.tsx           # ← EDIT line 464: ref → forwardRef (coreProps block)
    overlays.ts           # FormalityFieldComponentProps already declares forwardRef — DO NOT EDIT (docs = S2)
    __tests__/
      Field.test.tsx      # ← ADD minimal proof test (plain fn component receives forwardRef)
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/
  components/Field.tsx            # MODIFIED — one line (coreProps key ref → forwardRef)
  __tests__/Field.forwardRef.test.tsx  # NEW (or append to Field.test.tsx) — minimal proof test
# (no core changes; no overlays.ts changes; no README changes)
```

> Prefer appending the proof test to the existing `Field.test.tsx` to stay
> consistent with where Field behavior is tested, UNLESS a separate file is
> the local convention. The full §20.6 cluster (no-warning, focus-on-error,
> regression) is a separate, larger test file owned by P1.M1.T2.S1.

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: forwardRef-EXCLUSIVE (PRD §20.4 signed-off decision).
// Do NOT keep `ref: field.ref` alongside `forwardRef: field.ref`.
// Dual-delivery re-triggers the React 18 "Function components cannot be given refs"
// warning when the special `ref` key is spread onto a plain function component.

// CRITICAL: `field.ref` (RHF RefCallBack) is referenced EXACTLY ONCE in Field.tsx
// (line 464). There is no second delivery path and no `ref` destructured out of
// `field`. The single key rename is the COMPLETE delivery change.

// GOTCHA: The component cast at Field.tsx:469-470
//   (`inputConfig.component as React.ComponentType<FormalityFieldComponentProps>`)
// already anticipates forwardRef (the type declares it). DO NOT touch the cast.

// GOTCHA: `mergeFieldProps` passes `coreProps` as the LAST positional argument
// (merge.ts:213) so it wins outright over all 8 prior layers. `forwardRef` rides
// through unchanged — NO core edit. (Only edit core if a refactor introduced key
// filtering, and then only to keep forwardRef allowed.)

// GOTCHA: The no-template branch spreads finalProps directly
// (`<Component {...finalProps} />`, Field.tsx:490) — forwardRef lands as a
// top-level enumerable prop. ✅ This is what the proof test exercises.
// The template branch (Field.tsx:485) passes finalProps as `fieldProps={...}`
// (a named prop, NOT a spread) — templates must forward forwardRef themselves.

// GOTCHA: The existing test harness (TestInput/TestSwitch in Field.test.tsx) is
// React.forwardRef-wrapped. That harness MIGRATION is P1.M1.T2.S1 — out of scope
// here. Add a SEPARATE plain-function-component test for the proof.

// GOTCHA: RHF's `field.ref` is a `RefCallBack` (a function `(instance) => void`),
// NOT a Ref object. The proof test should capture it via a spy or assert the DOM
// node is registered, not assert `ref.current`.

// GOTCHA: vitest + @testing-library/react are the test stack (see existing
// Field.test.tsx imports). The coverage gate is ≥90% (PRD §1.3.7) — the new test
// is in scope for that threshold.
```

## Implementation Blueprint

### Data models and structure

No data models change. The `FormalityFieldComponentProps` type already
declares `forwardRef?: RefCallBack` (overlays.ts:187) — re-typing is out of
scope. This is a pure runtime wiring change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (read-only sanity check — line numbers may have shifted)
  - READ packages/react/src/components/Field.tsx around the Controller render block; locate the `coreProps: { ... }` object.
  - CONFIRM the line `            ref: field.ref,` (12-space indent) exists and is the ONLY `field.ref` usage:
      `grep -n "field\.ref" packages/react/src/components/Field.tsx`  → expect exactly ONE match.
  - READ packages/core/src/config/merge.ts mergeStaticProps (155-167) + mergeFieldProps (180-215); CONFIRM no key filtering and coreProps is the last arg.
  - READ packages/react/src/overlays.ts:179-188; CONFIRM FormalityFieldComponentProps already declares `forwardRef?: RefCallBack`.
  - WHY: Guard against line drift and confirm the no-core-edit assumption before touching anything.

Task 2: WRITE the minimal failing test FIRST (implicit TDD per contract item 4)
  - CREATE or APPEND-TO packages/react/src/__tests__/Field.forwardRef.test.tsx (or Field.test.tsx).
  - DEFINE a PLAIN function component (NOT React.forwardRef) typed as ComponentType<FormalityFieldComponentProps>
    that captures `forwardRef` into a module-level spy/variable and renders `<input ref={forwardRef} />`.
  - RENDER it through `<Field name="x" type="text" />` inside a `<FormalityProvider>` + `<Form>` (follow the
    mount pattern in Field.test.tsx — provider inputs map "text" → the plain component).
  - ASSERT: the captured forwardRef is NOT undefined (and ideally that it's a function — RHF RefCallBack).
  - RUN: `pnpm --filter @formality-ui/react test -- Field.forwardRef` (or the appended suite).
  - EXPECT: FAILS before Task 3 (forwardRef is undefined today). This proves the test is meaningful.

Task 3: EDIT packages/react/src/components/Field.tsx — the one-line change
  - EDIT line 464 (re-confirm number): change `            ref: field.ref,` → `            forwardRef: field.ref,`.
  - PRESERVE: 12-space indentation exactly.
  - DO NOT: keep a `ref: field.ref` line (forwardRef-exclusive, PRD §20.4).
  - DO NOT: touch the component cast (469-470), the render branches (482-491), merge.ts, overlays.ts, or any README.

Task 4: RE-RUN the proof test — now PASSES
  - RUN: `pnpm --filter @formality-ui/react test -- Field.forwardRef`
  - EXPECT: PASSES. The plain function component now receives a non-undefined forwardRef.
  - IF FAILING: re-check that (a) the edit landed on the coreProps key actually consumed by the no-template
    spread path, and (b) the test component is wired as the provider's input for the rendered field type.

Task 5: FULL VALIDATION (PRD §1.3.7 + §C.6 checklist)
  - RUN: `pnpm typecheck` (root tsc --build — core + react).
  - RUN: `pnpm --filter @formality-ui/react build` (tsup).
  - RUN: `pnpm test` (full vitest suite — must stay green; no regressions).
  - RUN: `pnpm test:coverage` (≥90% gate — the new test is in scope).
  - RUN: `pnpm lint` (0 errors).
  - EXPECT: all green. If typecheck complains about the cast, re-read overlays.ts:179-188 — the type already
    declares forwardRef, so the cast should be unaffected. Do NOT widen the cast.

Task 6: SCOPE-LEAK CHECK
  - RUN: `git diff --stat` → expect ONLY `packages/react/src/components/Field.tsx` + the new test file.
  - RUN: `git diff --exit-code packages/core packages/react/src/overlays.ts README.md packages/react/README.md`
    → expect exit 0 for overlays.ts and all READMEs (untouched). core may show no diff either.
  - EXPECT: clean, minimal diff. No incidental edits.
```

### Implementation Patterns & Key Details

```tsx
// packages/react/src/components/Field.tsx — the entire runtime change (Task 3):

// BEFORE (coreProps block, line 464):
//     onChange: handleChange(field.onChange),
//     onBlur: field.onBlur,
//     ref: field.ref,                  // ← React intercepts this special key
//   },

// AFTER:
//     onChange: handleChange(field.onChange),
//     onBlur: field.onBlur,
//     forwardRef: field.ref,           // ← regular enumerable prop; React ignores it
//   },

// PATTERN: keep the coreProps key style identical (no trailing comma changes, no reordering).
// GOTCHA: 12-space indentation (the object literal is inside mergeFieldProps({...}) inside the render arrow).
// CRITICAL: forwardRef-EXCLUSIVE — do NOT also emit `ref: field.ref` (PRD §20.4).

// --- Minimal proof test sketch (Task 2) ---

// A PLAIN function component (no React.forwardRef wrap) that captures forwardRef:
let capturedForwardRef: unknown;
const PlainInput: ComponentType<FormalityFieldComponentProps> = ({ forwardRef, ...rest }) => {
  capturedForwardRef = forwardRef;
  return <input ref={forwardRef as React.Ref<HTMLInputElement>} {...(rest as any)} />;
};

// Mount through Field (follow Field.test.tsx provider+form mount pattern):
render(
  <FormalityProvider inputs={{ text: { component: PlainInput, defaultValue: "" } }}>
    <Form config={{ x: { type: "text" } }}>
      <Field name="x" type="text" />
    </Form>
  </FormalityProvider>,
);

// Assert:
expect(capturedForwardRef).toBeDefined();
expect(typeof capturedForwardRef).toBe("function"); // RHF RefCallBack is a function

// BEFORE Task 3: capturedForwardRef is undefined → test FAILS.
// AFTER  Task 3: capturedForwardRef is the RHF RefCallBack → test PASSES.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
RUNTIME:
  - Field.tsx coreProps: `ref` key removed, `forwardRef` key added (the change).
  - mergeFieldProps (core): UNCHANGED — read-only confirmation only (no filtering; coreProps last → wins).
  - Render paths: no-template spread (Field.tsx:490) delivers forwardRef directly;
    template branch (485) puts it in fieldProps for consumer templates to forward.
PUBLIC API: none changed. FormalityFieldComponentProps type already declares forwardRef (overlays.ts:187).
DOCS: none in THIS subtask. JSDoc + README "Runtime caveat" rewrite = P1.M1.T1.S2. README feature sweep = P1.M1.T3.S1.
TESTS:
  - NEW minimal proof test (plain fn component receives forwardRef) — this subtask.
  - Full §20.6 acceptance cluster (no-warning, focus-on-error, regression) — P1.M1.T2.S1.
  - TestInput/TestSwitch migration to consume forwardRef — P1.M1.T2.S1.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing Field.tsx (Task 3)
pnpm --filter @formality-ui/react exec tsc --noEmit
pnpm format            # prettier — only touches formatting if needed
pnpm lint              # eslint — should be clean (one key rename)

# Confirm the diff is minimal and correct
git diff packages/react/src/components/Field.tsx
# Expected: exactly one line changed: `ref: field.ref,` → `forwardRef: field.ref,`.

# Confirm no lingering ref delivery
grep -n "field\.ref" packages/react/src/components/Field.tsx
# Expected: exactly ONE match — the new `forwardRef: field.ref` line.
```

### Level 2: Unit Tests (Component Validation)

```bash
# The proof test (Task 2/4) — fails before the edit, passes after
pnpm --filter @formality-ui/react test -- Field.forwardRef   # or the appended suite name

# Full react test suite — no regressions
pnpm --filter @formality-ui/react test

# Root full suite
pnpm test

# Expected: all green. If the proof test still fails after the edit, the component is likely being
# rendered through a path that doesn't spread finalProps (re-check Task 4 debugging notes).
```

### Level 3: Coverage Gate (PRD §1.3.7 — ≥90% enforced)

```bash
# The new test is in scope for the 90% gate
pnpm test:coverage
# Expected: green. Current baseline is ~97%/95%/99%/97% — a single new test will not drop it below 90%.
# If coverage drops below 90%, the gate fails CI (see the CI test:coverage step). This test ADDS coverage,
# so it should only help.
```

### Level 4: Typecheck & Build (System Validation)

```bash
# Root typecheck (tsc --build — core + react + project refs)
pnpm typecheck
# Expected: green. The component cast (Field.tsx:469-470) targets FormalityFieldComponentProps,
# which already declares forwardRef — the cast is unaffected by the runtime rename.

# Build the react package (tsup emits dist/)
pnpm --filter @formality-ui/react build
# Expected: green.
```

### Level 5: Pass-Through & Scope Verification (domain-specific)

```bash
# READ-ONLY: confirm merge.ts has no key filtering (PRD §20.2)
grep -n "Object.assign\|allow\|filter\|whitelist\|deny" packages/core/src/config/merge.ts
# Expected: only Object.assign calls in mergeStaticProps; NO allow-list/filter/whitelist tokens.
# If filtering exists, forwardRef MUST remain allowed (edit core minimally — otherwise leave untouched).

# Confirm coreProps is the LAST positional arg to mergeFieldProps (wins outright)
sed -n '203,215p' packages/core/src/config/merge.ts
# Expected: coreProps is the final argument in the mergeStaticProps(...) call.

# Confirm both render branches carry finalProps
sed -n '482,491p' packages/react/src/components/Field.tsx
# Expected: template branch `fieldProps={finalProps}`; no-template branch `<Component {...finalProps} />`.

# Scope-leak check
git diff --stat
# Expected: ONLY Field.tsx + the new test file changed.
git diff --exit-code packages/react/src/overlays.ts README.md packages/react/README.md
# Expected: exit 0 (no docs/overlay edits in this subtask).
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` green (root tsc --build).
- [ ] `pnpm --filter @formality-ui/react build` green.
- [ ] `pnpm test` green (full suite, no regressions).
- [ ] `pnpm test:coverage` green (≥90% gate).
- [ ] `pnpm lint` clean (0 errors).
- [ ] `git diff --stat` shows ONLY Field.tsx + the new test file.

### Feature Validation

- [ ] Field.tsx:464 reads `forwardRef: field.ref,` (12-space indent).
- [ ] `grep -n "field\.ref" packages/react/src/components/Field.tsx` → exactly ONE match (the new line).
- [ ] No `ref: field.ref` remains (forwardRef-exclusive, PRD §20.4).
- [ ] Minimal proof test: plain function component receives non-`undefined` `forwardRef` (fails before, passes after).
- [ ] `mergeFieldProps`/`mergeStaticProps` confirmed read-only: no key filtering; coreProps applied last.
- [ ] No-template branch `<Component {...finalProps} />` confirmed (Field.tsx:490).
- [ ] Template branch `fieldProps={finalProps}` confirmed (Field.tsx:485).

### Code Quality Validation

- [ ] Minimal diff — one runtime line + one test file.
- [ ] 12-space indentation preserved on the edited line.
- [ ] coreProps key style unchanged (no reordering, no trailing-comma churn).
- [ ] Component cast (Field.tsx:469-470) untouched.
- [ ] No edits to `packages/core/*`, `overlays.ts`, or any README.
- [ ] Test follows existing Field.test.tsx mount pattern (provider + form + field).

### Documentation & Deployment

- [ ] No JSDoc edit here (FormalityFieldComponentProps JSDoc = P1.M1.T1.S2).
- [ ] No README edit here (feature sweep = P1.M1.T3.S1).
- [ ] No new env vars or config.
- [ ] The change is self-documenting via the proof test + the existing (soon-to-be-rewritten) type contract.

---

## Anti-Patterns to Avoid

- ❌ Don't dual-deliver (`ref` AND `forwardRef`) — PRD §20.4 explicitly rejects this (re-triggers the React 18 ref warning).
- ❌ Don't touch `packages/core/src/config/merge.ts` unless a refactor introduced key filtering (and then only to keep `forwardRef` allowed).
- ❌ Don't touch the component cast at Field.tsx:469-470 — it already targets a type that declares `forwardRef`.
- ❌ Don't edit `overlays.ts` JSDoc or any README — those are P1.M1.T1.S2 / P1.M1.T3.S1.
- ❌ Don't migrate `TestInput`/`TestSwitch` or add the full §20.6 cluster — that's P1.M1.T2.S1. Add only the minimal forwardRef proof test here.
- ❌ Don't assert on `ref.current` — RHF's `field.ref` is a `RefCallBack` (function), not a `Ref` object. Assert the captured value is defined and is a function.
- ❌ Don't skip the "fails before" step — the proof test must be observed failing pre-edit, else it proves nothing.
- ❌ Don't reorder coreProps keys or change indentation on the edited line.

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is a single key-rename in one file (`ref` → `forwardRef`),
with the type contract already correct, the merge pass-through verified as
plain `Object.assign` (no filtering), and both render branches already
spreading/passing `finalProps`. The architecture report verified `field.ref`
appears exactly once in Field.tsx, so the edit is complete for delivery.
The only residual risk is test-mount mechanics (provider inputs mapping,
FormalForm wiring) for the proof test — mitigated by following the existing
`Field.test.tsx` mount pattern. The 1-point deduction accounts for possible
line-number drift since the architecture report was written (Task 1
re-confirms before editing).
