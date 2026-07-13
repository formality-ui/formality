# Research Notes — P2.M2.T1.S1: Update overlays.ts descriptive paragraph for forwardRef

## Mission
A **cosmetic JSDoc-only** fix in `packages/react/src/overlays.ts`. The
`FormalityFieldComponentProps` type's **descriptive paragraph** (the lead-in
before "Destructure before forwarding") still describes the `coreProps` ref
member as *"a React-special key — `ref`"*. That wording is **stale** after the
§20 forwardRef delivery change. PRD §20.7 requires all stale *"ref key"* /
*"future runtime task"* wording be removed. The §20.7-compliant
*"Runtime delivery (important)"* subsection is already correct — only the
earlier paragraph was missed. This task closes **gap_analysis.md G8**.

---

## §1. The exact stale text (the SOLE required edit)

File: `packages/react/src/overlays.ts` (currently **190 lines**).

The `FormalityFieldComponentProps` JSDoc block opens at line 139 (`/**`) and
the type is declared at line 181. The **descriptive paragraph** spans
**lines 142–150**. The stale wording is on **line 144**:

```ts
// packages/react/src/overlays.ts  — current lines 142-150
 * `<Field>` renders your input component via React Hook Form's `<Controller>`.
 * At runtime Formality merges a `coreProps` bundle onto the component (name,
 * value, onChange, onBlur, and — as a React-special key — `ref`). The three    // ← STALE (line 144)
 * members below are the **injected-props contract**: `formState` always
 * reaches templates and render-prop children, and reaches plain components
 * that have opted into Formality state via `provideState` /
 * `passSubscriptions`; `state` (subscribed field state) and a top-level
 * `forwardRef` key are delivered at runtime by `<Field>` (see "Runtime
 * delivery" below).
```

**The contradiction:** the SAME paragraph says both
* "as a React-special key — `ref`" (line 144, STALE) and
* "a top-level `forwardRef` key … delivered at runtime by `<Field>`"
  (lines 148–150, correct).

So the paragraph is internally inconsistent. The fix removes the stale half
and makes the `coreProps` enumeration name `forwardRef` correctly.

### Proposed revised paragraph (lines 142–150)
```ts
 * `<Field>` renders your input component via React Hook Form's `<Controller>`.
 * At runtime Formality merges a `coreProps` bundle onto the component (name,
 * value, onChange, onBlur, and `forwardRef` — RHF's ref callback, delivered as
 * a regular enumerable top-level prop, NOT React's special `ref` key; see §20.1
 * and "Runtime delivery" below). The three members below are the
 * **injected-props contract**: `formState` always reaches templates and
 * render-prop children, and reaches plain components that have opted into
 * Formality state via `provideState` / `passSubscriptions`; `state`
 * (subscribed field state) and `forwardRef` are delivered at runtime by
 * `<Field>` (see "Runtime delivery" below).
```

This: (a) removes the stale "React-special key — `ref`" wording; (b) states
`forwardRef` is a regular enumerable top-level prop, not React's special
`ref` key; (c) preserves "The three members below" coherence
(state/formState/forwardRef); (d) stays consistent with the §20.7
"Runtime delivery (important)" subsection.

---

## §2. What is ALREADY correct — DO NOT TOUCH

### 2a. The §20.7-compliant "Runtime delivery (important)" subsection (lines 169–176)
```ts
// packages/react/src/overlays.ts lines 169-176 — ALREADY CORRECT
 * **Runtime delivery (important).** `<Field>` delivers RHF's ref as a regular,
 * top-level, enumerable prop named `forwardRef` — no `React.forwardRef` wrap
 * is required for a plain function component that destructures `forwardRef`
 * and wires it to the inner input (`ref={forwardRef}`). Consumers migrating
 * off the old React-special `ref` key: a `React.forwardRef`-wrapped component
 * should consume `props.forwardRef` (PRD §20.4), and under React 19
 * ref-as-prop use `forwardRef` directly. …
```
gap_analysis.md row for §20.7 marks this **✅ DONE** ("Runtime caveat"
removed; "Runtime delivery (important)" added). The phrase *"off the old
React-special `ref` key"* on line 173 is **legitimate migration context**, NOT
stale wording — it describes migrating AWAY from the old mechanism. Leave it.

### 2b. The type body (lines 181–190)
```ts
export type FormalityFieldComponentProps<P = unknown> = P & {
  state?: CustomFieldState | Record<string, CustomFieldState>;
  formState?: UseFormStateReturn<FieldValues>;
  forwardRef?: RefCallBack;   // ← already the real RHF type, no edit
};
```
The contract is explicit: **re-typing is out of scope (the type is already
correct)**. No type changes.

### 2c. Everything above line 139
The module header, `ReactInputConfig`, `ReactFieldConfig`,
`ReactFormFieldsConfig`, and `defineInputs` JSDoc blocks are unrelated to
forwardRef. No edits.

---

## §3. The runtime truth (confirms the JSDoc fix is accurate)

The §20.1 runtime change is **already implemented** in the working tree
(`Field`'s Controller render logic was extracted into `useField.tsx` by
P2.M1.T1). `useField.tsx:670-678`:

```ts
// packages/react/src/hooks/useField.tsx (coreProps construction, §20.1 DONE)
coreProps: {
  name,
  label,
  disabled: isDisabled,
  error: fieldState.error?.message,
  [inputConfig.inputFieldProp ?? "value"]: formattedValue,
  onChange: handleChange(field.onChange),
  onBlur: field.onBlur,
  forwardRef: field.ref,   // ← delivered as a REGULAR enumerable prop, NOT React's special ref key
},
```

So at runtime `forwardRef` is a normal enumerable key on the merged props,
spread onto the component via `{...finalProps}`. The overlays.ts JSDoc must
match this. (useField.tsx:185-188 also documents "delivers the input's ref
via the merged props' `forwardRef` key (the CURRENT implemented behavior)".)

---

## §4. Whole-file stale-wording audit (proves the edit is the ONLY one needed)

`grep -n "future runtime\|out of scope\|type-only change\|Runtime caveat\|special key\|ref key" packages/react/src/overlays.ts`

| Match | Line | Verdict |
|---|---|---|
| "and — as a React-special key — `ref`" | 144 | **STALE — fix this** |
| "off the old React-special `ref` key" | 173 | LEGITIMATE migration context — keep |

No *"future runtime task"*, *"out of scope for this type-only change"*, or
*"Runtime caveat (important)"* strings exist anywhere in the file (the §20.7
work already removed them). **The line-144 edit is the sole change.**

---

## §5. Validation commands (verified from root package.json scripts)

```bash
pnpm typecheck        # tsc --build   — comment change can't break types, but run for safety
pnpm lint             # eslint .      — comment change can't break lint, but run for safety
pnpm format:check     # prettier --check .  — ensure the edited JSDoc stays formatted
pnpm test             # vitest run    — JSDoc is comment-only; suite unchanged
pnpm build            # pnpm -r build (tsup) — emit unaffected
```
**Critical:** this is a **JSDoc/comment-only** change. No test count changes,
no coverage delta, no type/lint regressions are possible from prose. The gates
are run defensively, not because behavior can change.

`pnpm format` / `format:check` is the one to watch: prettier wraps the JSDoc
lines. The proposed paragraph is pre-wrapped to ≤ ~72 cols of comment text to
match surrounding lines, so `format:check` should pass as-is.

---

## §6. Parallel-work & scope boundaries

- **P2.M1.T2.S1** (running in parallel) deletes `useFieldDisabledState.ts` +
  its test and cleans one comment in `useFormState.test.tsx`. It does **not**
  touch `overlays.ts`. **No conflict.** Neither task edits a file the other
  edits.
- This task touches **only `packages/react/src/overlays.ts`** and only
  **lines ~142–150** of it.
- **Out of scope (per PRD §20.7):** any `@formality-ui/core` change; re-typing
  `FormalityFieldComponentProps`; changing runtime Field/useField logic;
  editing CHANGELOG (append-only) or any `plan/**` / `prd_snapshot.md` file.

---

## §7. Risk assessment

**Risk: effectively zero.**
- Single file, single comment paragraph, no behavioral surface.
- The required edit is fully specified (exact before/after in §1).
- The §20.7 reference section + the runtime (useField.tsx:678) both already
  say exactly what the revised paragraph will say — so the PRP is internally
  consistent and matches shipped behavior.
- The only residual "gotcha" is over-editing: an implementer who *also*
  rewrites the "Runtime delivery (important)" section or the type body would
  violate scope. The PRP explicitly forbids that.

Confidence for one-pass success: **10/10**.
