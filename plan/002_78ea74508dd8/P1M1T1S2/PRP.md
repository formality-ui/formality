name: "P1.M1.T1.S2 — Make FieldProps generic over the field name"
description: |

---

## Goal

**Feature Goal**: Make `FieldProps` in `@formality-ui/react` generic over its
field name — `FieldProps<TName extends string = string>` with `name: TName` —
so that a **narrowed** `FieldProps<"name" | "email">` rejects `name: "typo"` at
compile time, while the **default** `FieldProps` (= `FieldProps<string>`) stays
byte-for-byte identical to today so `<Field name={anyString} />` compiles
unchanged. The `Field` function becomes
`Field<TName extends string = string>(props: FieldProps<TName>)`.

**Deliverable**:

1. A two-line type change in `packages/react/src/components/Field.tsx`:
   `interface FieldProps` → `interface FieldProps<TName extends string = string>`
   (with `name: TName`) and `function Field({...}: FieldProps)` →
   `function Field<TName extends string = string>({...}: FieldProps<TName>)`.
2. A JSDoc block on `FieldProps<TName>` (Mode A docs — rides with the work).
3. A new type-level assertion file
   `packages/react/src/__typechecks__/FieldProps.test-d.ts` proving BOTH:
   - default `FieldProps` accepts any string name (non-breaking), and
   - a narrowed `FieldProps<"name" | "email">` rejects `name: "typo"` (compile error).
4. No runtime changes. No core changes. No `FormProps`/`ReactFormFieldsConfig`
   changes (those landed in S1). No re-export change (`index.ts:54` already
   re-exports `FieldProps`; generic type re-exports need no edit).

**Success Definition**:

1. `pnpm typecheck` (root `tsc --build` — includes `__typechecks__/**`) is green.
2. `pnpm test` (vitest) is green — no runtime regressions (no runtime code changed).
3. The new `FieldProps.test-d.ts`'s `@ts-expect-error` lines are HONORED (the
   typo name IS rejected). If any `@ts-expect-error` becomes "unused" (TS2578),
   the narrowing is broken → CI failure.
4. Non-breaking: any code that compiled before still compiles (proven by the
   default-case assertion + the existing vitest suite mounting `<Field name="…"/>`).

## User Persona

**Target User**: React consumers of `@formality-ui/react` (e.g. the
`sellario-ui` downstream package) who want `<Field name="…"/>` typos caught at
compile time — the same class of "silent no-op" bug S1 closed for `config`
keys, now closed for the `Field` `name` prop.

**Use Case**: `type ClientValues = { name: string; email: string };`
A consumer (or a future wrapper component) declaring
`FieldProps<keyof ClientValues & string>` and passing `name="ofice"` should get
a **compile error**, while `<Field name="email" />` (untyped, default) still
works.

**Pain Points Addressed**: Today `<Field name="ofice" />` compiles and silently
renders nothing (the field is never registered against any config key). This is
the second half of PRD §C.4 / T2.1's "silent no-op" footgun.

**User Journey**:

1. Consumer imports `Field`/`FieldProps` from `@formality-ui/react`.
2. Default usage `<Field name="email" />` compiles exactly as before (zero migration).
3. Opt-in strict usage: a wrapper or explicit type arg `<Field<"name"|"email"> …/>`
   or `FieldProps<"name"|"email">` rejects typo names at compile time.

## Why

- **Business value**: Closes the `Field` name side of T2.1. Combined with S1
  (config-key checking), a typed `<Form<ClientValues>>` + typed `<Field>` now
  catches the two most common "renders nothing" typos at compile time.
- **Integration / scope boundaries**:
  - This is the **second half of PRD T2.1** (the `FieldProps` generic half).
  - S1 (`ReactFormFieldsConfig<V>` key-narrowing → `FormProps.config`) is DONE.
    Do NOT touch S1's work.
  - Per-form name-linkage (a `<Field>` automatically narrowing its `name`
    against the enclosing `<Form<TFieldValues>>`'s key set via context typing)
    is **OPTIONAL and explicitly deferrable** per PRD §C.4 T2.1 step 3(c) /
    R2. This subtask delivers the **generic `FieldProps` public surface** plus
    the generic `Field` function. If auto per-form linkage proves to require
    non-trivial context-threading churn, SCOPE IT OUT and note it in the PR
    (Appendix C explicitly permits this). The deliverable here stands on its own.
  - Core `FormFieldsConfig<TName=string>` is already generic — DO NOT touch core.
- **For whom**: Downstream React consumers (sellario-ui) and any consumer who
  wants compile-time name checking.

## What

A type-only change to `packages/react/src/components/Field.tsx`:

```typescript
// BEFORE (Field.tsx:40-66):
export interface FieldProps {
  name: string;
  type?: string;
  // ...other members unchanged...
  [key: string]: unknown;
}
// BEFORE (Field.tsx:115-124):
export function Field({
  name,
  /* ...destructure... */
}: FieldProps): JSX.Element | null {

// AFTER:
export interface FieldProps<TName extends string = string> {
  name: TName;
  type?: string;
  // ...other members unchanged...
  [key: string]: unknown;   // KEEP — additive change, index signature preserved
}
// AFTER:
export function Field<TName extends string = string>({
  name,
  /* ...destructure... */
}: FieldProps<TName>): JSX.Element | null {
```

**Why this is non-breaking (the math):**

- `<Field name="email" />` → JSX infers `TName` from the props object literal;
  the string `"email"` widens to `string` in object-literal position, so
  `TName = string` → `name: string` → identical to today. ✓
- `FieldProps` (no arg) = `FieldProps<string>` → `name: string` → identical. ✓
- A consumer who opts in via `FieldProps<"name"|"email">` or
  `<Field<"name"|"email"> …/>` gets `name: "name" | "email"` → typos rejected. ✓

**Why the function body stays safe (critical internal detail):**
`useFormContext()` inside `Field` (Field.tsx ~line 126) is called **without a
type argument**, so `methods: UseFormReturn<FieldValues>` and therefore
`methods.control: Control<FieldValues>`. RHF's `<Controller name={name}>`
requires `name: FieldPath<FieldValues>`, and `FieldPath<FieldValues> === string`.
A generic `name: TName extends string` is assignable to `string`, so the
Controller call compiles unchanged. Likewise `config[name]` (where `config` is
core's `FormFieldsConfig` = `Record<string, FieldConfig>` default) is indexable
by any string subtype. **No internal call site breaks.**

### Success Criteria

- [ ] `packages/react/src/components/Field.tsx` exports
      `FieldProps<TName extends string = string>` with `name: TName`.
- [ ] The `Field` function is generic:
      `Field<TName extends string = string>(props: FieldProps<TName>): JSX.Element | null`.
- [ ] All other `FieldProps` members (incl. `[key: string]: unknown` index sig)
      preserved unchanged.
- [ ] `FieldRenderAPI` (Field.tsx:69-85) left non-generic (out of scope — it has
      no `name` field; do not churn it).
- [ ] A new `__typechecks__/FieldProps.test-d.ts` asserts:
      default `FieldProps` accepts any string name; narrowed
      `FieldProps<"name"|"email">` rejects a typo via `@ts-expect-error`.
- [ ] `pnpm typecheck` green; `pnpm test` green; `pnpm lint` clean.
- [ ] JSDoc on `FieldProps<TName>` notes name is checked when narrowed (Mode A).
- [ ] No core files modified; no S1 (`overlays.ts` / `FormProps`) changes.

## All Needed Context

### Context Completeness Check

_Pass._ The change is two lines in one source file plus a new type-test file.
All internal call sites were grepped (see Documentation & References): the only
references to `FieldProps` are its definition (Field.tsx:40), the `Field`
function signature (Field.tsx:124), and the re-export (index.ts:54). The
internal Controller/`config[name]` usages are provably safe because
`useFormContext()` is un-parameterized (→ `Control<FieldValues>`,
`FieldPath<FieldValues> = string`). The type-test harness already exists
(`__typechecks__/`, verified included by `tsc --build`).

### Documentation & References

```yaml
# MUST READ
- url: PRD §C.4 T2.1 (heading:h4.60) — the work item being implemented.
  why: Defines the exact target signature, the non-breaking default, and the
        explicit permission to DROP per-form name-linkage if a clean thread is
        impossible (step 3c / "Stronger per-form name checking is a follow-up").
  critical: "Keep the default TName = string so <Field name={anyString} /> still
             compiles as before. (Stronger per-form name checking is a follow-up.)"

- url: PRD §C.3 (heading:h3.112) — Non-Negotiable Constraints.
  why: "No breaking public API changes. Generic defaults must preserve today's
        behavior. Runtime unchanged. After every item: rebuild, full test suite,
        tsc --noEmit — do not move on if anything is red."
  critical: This is a TYPE-ONLY change. Do NOT touch runtime logic.

- url: PRD §C.2 (heading:h3.110) — framework-agnostic core constraint.
  why: Core must NOT import react. React precision lives in the overlay/components.
  critical: Do NOT modify packages/core. Only packages/react/src/components/Field.tsx.

- url: PRD Appendix A — `FieldProps<TName>` (heading:h2.21) — the target shape.
  why: The PRD's complete type reference already specifies the generic FieldProps
        with `name: TName` and the `[key: string]: unknown` index signature.
  critical: "interface FieldProps<TName extends string = string> { name: TName; ...
             [key: string]: unknown; }" — match this exactly.

- url: plan/002_78ea74508dd8/delta_prd.md §R2 (REACT strict key-checking).
  why: R2.2 = "Make FieldProps generic: interface FieldProps<TName extends string
        = string> { name: TName; ... }. Default TName = string keeps
        <Field name={anyString} /> compiling unchanged."
  critical: Lists the exact verification (tsc --noEmit green; full pnpm test green;
            a type-level assertion that an unknown name fails to compile).

- file: packages/react/src/components/Field.tsx
  section: "FieldProps (lines 40-66); Field function (lines 115-124);
            Controller render (lines 391-393); useFormContext destructure (~126-138)"
  why: THE file to edit. Contains the interface, the function signature, and the
        only internal usages of `name` that must keep compiling.
  pattern: Generic-function-component + generic-interface with a safe default,
           matching the existing `FormProps<TFieldValues = FieldValues>` style in
           Form.tsx:43.
  gotcha: "`useFormContext()` is called WITHOUT a type arg → methods.control is
           Control<FieldValues> → Controller accepts any string name. DO NOT add a
           type arg to that useFormContext() call (it would couple Field to a
           concrete TFieldValues and break the internal Controller assignment)."

- file: packages/react/src/__typechecks__/ReactFormFieldsConfig.test-d.ts
  why: THE pattern to clone for the new FieldProps type test. Created by sibling
        subtask S1 — proves the __typechecks__ harness is already wired into
        `tsc --build`.
  pattern: Pure type-check file (no runtime). `// @ts-expect-error` directives on
           the offending property line; `void x;` to silence unused bindings;
           header comment explaining the file is consumed by tsc --build, NOT vitest.
  gotcha: "This file MUST be named *.test-d.ts (NOT *.test.ts/.tsx) so it is:
           (a) INCLUDED by tsc --build (react tsconfig excludes only *.test.ts /
               *.test.tsx / __tests__/**), and
           (b) EXCLUDED from vitest (react vitest include is src/**/*.test.{ts,tsx})."

- file: packages/react/src/components/Form.tsx
  section: "FormProps<TFieldValues = FieldValues> (lines 43-71); useForm<TFieldValues> (166)"
  why: Reference for the existing generic-component pattern to mirror on Field.
        Also confirms `methods` is created via `useForm<TFieldValues>` and passed
        to context — Field's `useFormContext()` (un-parameterized) widens it back
        to FieldValues internally.
  gotcha: "Do NOT edit Form.tsx in this subtask (S1 owns config key-checking;
           FormProps.config is already ReactFormFieldsConfig<TFieldValues>)."

- file: packages/react/src/index.ts
  section: "Line 54 — `export type { FieldProps, FieldRenderAPI } from './components/Field';`"
  why: Confirms FieldProps is public. A generic type re-export needs NO edit
        (TypeScript re-exports generic types transparently).
  gotcha: "Do NOT change this line. Verify the generic still exports by importing
           it from the package in the type test (or by `pnpm typecheck` on root)."

- file: packages/react/src/context/FormContext.ts
  section: "FormContextValue.config: FormFieldsConfig (line 28, CORE type — default string)"
  why: Confirms the `config` that Field indexes with `config[name]` is the CORE
        Record<string, FieldConfig> (unbounded), so `config[TName]` compiles for
        any TName extends string. No edit needed.
  gotcha: Leave FormContext.ts untouched.

- file: node_modules/.pnpm/react-hook-form@7.68.0_react@18.3.1/.../dist/types/controller.d.ts
  why: ControllerProps<TFieldValues, TName extends FieldPath<TFieldValues>>.
        `name: TName`. Proves that when control = Control<FieldValues>,
        FieldPath<FieldValues> === string, so any string subtype is accepted.
  critical: "Controller name is checked against the CONTROL's TFieldValues, not
             against Field's TName. Because Field's useFormContext() is un-typed,
             control = Control<FieldValues> and the check collapses to string.
             This is the load-bearing reason the generic Field is internally safe."

- file: plan/001_bbf464589edd/docs/research/typescript_interface_extension_best_practices.md
  why: Prior research on backward-compatible interface evolution / generic defaults.
        Confirms adding a generic param with a default that preserves the prior
        shape is a non-breaking (minor) change.
  section: "§1.1 (adding optional/parameterized members is safe) and §2.1
            (backward-compatible type evolution)."
```

### Current Codebase tree (relevant slice)

```bash
packages/
  core/src/types/config.ts        # FormFieldsConfig<TName=string> — ALREADY GENERIC, DO NOT TOUCH
  react/src/
    components/
      Field.tsx                   # ← EDIT HERE: FieldProps (40-66) + Field fn (115-124)
      Form.tsx                    # NO EDIT (S1 owns config key-checking)
    context/FormContext.ts        # config: FormFieldsConfig (core) — NO EDIT
    overlays.ts                   # ReactFormFieldsConfig<V> (S1 done) — NO EDIT
    index.ts                      # line 54 re-export — NO EDIT (generic re-export is transparent)
    __typechecks__/
      ReactFormFieldsConfig.test-d.ts   # S1's test — PATTERN TO CLONE
      FieldProps.test-d.ts              # ← NEW: type-level assertions for this subtask
```

### Desired Codebase tree with files to be added

```bash
packages/react/src/
  components/Field.tsx             # MODIFIED — generic FieldProps<TName=string> + generic Field fn + JSDoc
  __typechecks__/FieldProps.test-d.ts   # NEW — type-level assertions (default accepts / narrowed rejects)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: The generic DEFAULT must be `= string` exactly.
//   FieldProps<TName extends string = string>
// Dropping the default (e.g. `FieldProps<TName extends string>`) would FORCE every
// consumer to supply TName → breaking change. The default makes FieldProps === FieldProps<string>
// → name: string → identical to today.

// CRITICAL: Do NOT add a type argument to the useFormContext() call inside Field
// (Field.tsx ~line 126). Today it is `useFormContext()` (un-parameterized) →
// FormContextValue<FieldValues> → methods.control: Control<FieldValues>. RHF's
// <Controller name={name}> then requires FieldPath<FieldValues> === string, which a
// generic `name: TName extends string` satisfies. If you parameterized useFormContext
// to match Field's TName, Controller's name check would become `FieldPath<TName>`,
// which is far narrower and would BREAK the internal assignment. Leave it un-typed.

// GOTCHA: JSX generic inference WIDENS string literals. `<Field name="email" />`
// infers TName = string (NOT "email"), so the default case compiles unchanged.
// Narrowing only happens when the consumer opts in explicitly
// (e.g. FieldProps<"name"|"email"> or <Field<"name"|"email"> .../>). This is by design
// and is why the change is non-breaking AND why per-form auto-narrowing is a separate,
// optional follow-up.

// GOTCHA: Keep the `[key: string]: unknown` index signature. FieldProps deliberately
// passes arbitrary extra props through to the input component (Field.tsx render layer
// spreads restProps). Removing it would break every test that passes extra props.

// GOTCHA: The type test file MUST be named *.test-d.ts (NOT *.test.ts / *.test.tsx):
//   - Included by tsc --build: react tsconfig `include: ["src/**/*"]`, `exclude` lists
//     only *.test.ts, *.test.tsx, __tests__/**. *.test-d.ts matches NEITHER exclusion.
//   - Excluded from vitest: react vitest `include: ["src/**/*.test.{ts,tsx}"]`.
// If mis-named *.test.ts, vitest will try to RUN it (it has no runtime) and tsc will
// EXCLUDE it from the build gate (defeating the assertion). Both are wrong.

// GOTCHA: `@ts-expect-error` must sit on the line that ACTUALLY errors. For a
// `const x: FieldProps<...> = { name: "typo" }` the error is on the `name: "typo"`
// property line (TS2353 excess-property / TS2322). Mirror the S1 test file's placement
// exactly. An UNUSED @ts-expect-error (TS2578) means the narrowing is NOT working = FAILURE.

// GOTCHA: This is type-only. There is no runtime behavior to functionally test; the
// proof of correctness is the type-level test + green tsc --build.
```

## Implementation Blueprint

### Data models and structure

No new data models. The only model change is the `FieldProps` interface gaining a
generic parameter, and the `Field` function gaining a matching one.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (read-only sanity check)
  - READ packages/react/src/components/Field.tsx lines 40-66 (confirm non-generic FieldProps, name: string, [key:string]:unknown).
  - READ packages/react/src/components/Field.tsx lines 115-124 (confirm `function Field({...}: FieldProps)`).
  - READ packages/react/src/components/Field.tsx lines ~126-138 (confirm `useFormContext()` is called WITHOUT a type arg).
  - READ packages/react/src/components/Field.tsx lines 391-393 (confirm `<Controller control={methods.control} name={name} ...>`).
  - READ packages/react/src/components/Field.tsx line 132 (confirm `config[name] ?? {}` indexing).
  - GREP: `rg -n "FieldProps" packages/ --glob '!**/dist/**'` → expect exactly:
        packages/react/src/components/Field.tsx:40 (def),
        packages/react/src/components/Field.tsx:124 (fn sig usage),
        packages/react/src/index.ts:54 (re-export),
        (plus README/docs references which are out of scope for S2).
  - READ packages/react/src/__typechecks__/ReactFormFieldsConfig.test-d.ts (the pattern to clone).
  - WHY: Confirm the exact audit set before editing so nothing surprises you.

Task 2: MODIFY packages/react/src/components/Field.tsx — make FieldProps generic
  - EDIT the interface declaration (lines 40-66):
      FROM: `export interface FieldProps {`
      TO:   `export interface FieldProps<TName extends string = string> {`
      FROM: `  name: string;`
      TO:   `  name: TName;`
  - PRESERVE: every other member verbatim (type?, disabled?, hidden?, children?,
              shouldRegister?, inputConfig?) AND the `[key: string]: unknown;` index signature.
  - PRESERVE: the existing `/** Field component props */` / per-field JSDoc (Task 4 enriches it).
  - DEPENDENCIES: none (pure type change).

Task 3: MODIFY packages/react/src/components/Field.tsx — make the Field function generic
  - EDIT the function signature (lines 115-124):
      FROM: `export function Field({`
      TO:   `export function Field<TName extends string = string>({`
      FROM: `}: FieldProps): JSX.Element | null {`
      TO:   `}: FieldProps<TName>): JSX.Element | null {`
  - DO NOT change the destructure list or the body.
  - DO NOT add a type argument to the `useFormContext()` call inside (see Gotchas).
  - WHY it compiles: inside the body `name: TName` is a subtype of string; `config[name]`
        indexes core Record<string, FieldConfig>; `<Controller name={name}>` needs
        FieldPath<FieldValues> === string (control is Control<FieldValues>). All safe.
  - DEPENDENCIES: Task 2.

Task 4: MODIFY packages/react/src/components/Field.tsx — JSDoc on FieldProps<TName> (Mode A)
  - UPDATE the JSDoc above the FieldProps interface to note:
      - `name` is `TName`, which defaults to `string` (so `<Field name={anyString} />`
        compiles unchanged).
      - To get compile-time checking of the name, narrow `TName` explicitly — e.g.
        `FieldProps<"name" | "email">` or a wrapper that threads a `keyof ClientValues & string`.
      - One-line note that automatic per-form narrowing (against an enclosing
        `<Form<TFieldValues>>`) is a planned follow-up (PRD §C.4 T2.1).
  - INCLUDE a short `@example` showing both the default and the narrowed/strict usage.
  - FOLLOW pattern: the JSDoc style on `FormProps<TFieldValues>` (Form.tsx) and on
        `ReactFormFieldsConfig<V>` (overlays.ts — added by S1, a strong direct template).

Task 5: CREATE packages/react/src/__typechecks__/FieldProps.test-d.ts
  - CLONE the header-comment + structure of ReactFormFieldsConfig.test-d.ts (S1).
  - ASSERT (compiles): `FieldProps` (default) accepts `name: anyString`.
  - ASSERT (compiles): `FieldProps<"name" | "email">` accepts `{ name: "name" }` and `{ name: "email" }`.
  - ASSERT (ERROR via @ts-expect-error on the property line):
        `const bad: FieldProps<"name" | "email"> = { name: "typo" };` → must error.
  - ASSERT (ERROR via @ts-expect-error): a non-string name is rejected, e.g.
        `const bad2: FieldProps = { name: 123 };` → must error (TName extends string).
  - SILENCE unused bindings with `void x;` (mirror S1 test file).
  - HEADER COMMENT must state: not a runtime test; consumed by `tsc --build`; an
        unused @ts-expect-error (TS2578) means the feature is broken.
  - NAMING/PLACEMENT: exactly `packages/react/src/__typechecks__/FieldProps.test-d.ts`
        (see Gotchas on why the `.test-d.ts` extension is load-bearing).
  - COVERAGE: positive (default accepts anything, narrowed accepts known) +
              negative (narrowed rejects typo, non-string rejected).

Task 6: BUILD + TYPECHECK + TEST the react package
  - RUN: `pnpm --filter @formality-ui/react build` (tsup — emits dist/).
  - RUN: `pnpm typecheck` (root `tsc --build` — exercises core + react AND the new
            __typechecks__ file, since react tsconfig includes src/**/* and does not
            exclude *.test-d.ts).
  - RUN: `pnpm --filter @formality-ui/react test` (vitest run — existing runtime suite).
  - EXPECT: all green. If tsc surfaces an inference break INSIDE Field.tsx (e.g. the
        Controller name line), fix at that INTERNAL site ONLY (e.g. cast `name as string`
        at the single Controller call — NOT a public change). Per the audit in Task 1,
        no break is expected because useFormContext() is un-parameterized.

Task 7: ROOT typecheck + full test sweep (PRD §C.6 gate)
  - RUN: `pnpm typecheck` (root `tsc --build`).
  - RUN: `pnpm test` (root vitest — full suite).
  - RUN: `pnpm lint` (eslint . — react + root).
  - EXPECT: green. "Do not move on if anything is red" (PRD §C.6).
  - VERIFY the @ts-expect-error directives in FieldProps.test-d.ts are USED: if tsc
        reports TS2578 ("unused '@ts-expect-error' directive") the narrowing did not
        take effect → the feature is broken → fix before finishing.
```

### Implementation Patterns & Key Details

```typescript
// === packages/react/src/components/Field.tsx — THE change (Tasks 2 & 3) ===

// BEFORE (interface, lines 40-66):
//   export interface FieldProps {
//     name: string;
//     type?: string;
//     /* ...other members... */
//     [key: string]: unknown;
//   }
// AFTER:
export interface FieldProps<TName extends string = string> {
  /** Field name (must match a key in Form's config). Narrow `TName` to get
   *  compile-time checking of the name (defaults to `string` = unchecked). */
  name: TName;
  type?: string;
  /* ...other members UNCHANGED... */
  [key: string]: unknown; // KEPT — additive change
}

// BEFORE (function, lines 115-124):
//   export function Field({ name, type: typeProp, ...restProps }: FieldProps): JSX.Element | null {
// AFTER:
export function Field<TName extends string = string>({
  name,
  type: typeProp,
  ...restProps
}: FieldProps<TName>): JSX.Element | null {
  // ... body UNCHANGED ...
  // `useFormContext()` stays UN-parameterized → control = Control<FieldValues>
  // → <Controller name={name}> accepts any string. DO NOT type useFormContext().
}

// === Why non-breaking (the two cases that must keep compiling) ===
// 1) Default: <Field name="email" />  →  JSX widens "email" to string  →  TName = string
//    → FieldProps<string> → name: string  →  identical to today.
// 2) Default type: FieldProps (no arg) === FieldProps<string> → name: string → identical.

// === Why strict checking works when opted in ===
//    type V = { name: string; email: string };
//    const a: FieldProps<"name" | "email"> = { name: "name" };     // OK
//    const b: FieldProps<"name" | "email"> = { name: "typo" };     // TS2322/2353 ✗
//    const c: FieldProps = { name: 123 };                          // TS2322 ✗ (TName extends string)

// === Type-level test sketch (Task 5) — clone S1's __typechecks__ file ===
//   import type { FieldProps } from "../components/Field";
//
//   // default accepts any string name
//   const dflt: FieldProps = { name: "whatever" };
//   void dflt;
//
//   // narrowed accepts known names
//   type Names = "name" | "email";
//   const ok: FieldProps<Names> = { name: "name" };
//   void ok;
//
//   const bad: FieldProps<Names> = {
//     // @ts-expect-error — `typo` is not in Names; must error
//     name: "typo",
//   };
//   void bad;
//
//   const nonString: FieldProps = {
//     // @ts-expect-error — name must be a string; must error
//     name: 123,
//   };
//   void nonString;
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
PUBLIC API:
  - `FieldProps<TName extends string = string>` (re-exported at
    packages/react/src/index.ts:54) — generic param ADDITIVE; default `string`
    preserves prior behavior. No re-export edit needed (transparent).
  - `Field<TName extends string = string>` (value export at index.ts:53) —
    generic function component; default keeps `<Field name={s}/>` compiling.
INTERNAL:
  - Field function body: `useFormContext()` MUST stay un-parameterized (control =
    Control<FieldValues> keeps Controller's name check == string). No edit.
  - `config[name]` indexing: config is core FormFieldsConfig (Record<string,...>) —
    indexes fine under TName extends string. No edit.
  - `FieldRenderAPI` (Field.tsx:69-85): left non-generic (no name field; out of scope).
NOT TOUCHED (owned by other subtasks):
  - packages/core/** (core FormFieldsConfig already generic).
  - overlays.ts / ReactFormFieldsConfig<V> (S1 done).
  - Form.tsx FormProps.config (S1 done).
  - README docs (R5 / P1.M3 sync — Mode B, separate subtask).
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing Field.tsx (Tasks 2/3/4)
pnpm --filter @formality-ui/react exec tsc --noEmit   # quick per-package check
pnpm format            # prettier — keep style consistent
pnpm lint              # eslint — should be clean (type-only change)

# Expected: Zero errors.
```

### Level 2: Unit Tests (Component Validation)

```bash
# React package runtime tests — must stay green (no runtime code changed)
pnpm --filter @formality-ui/react test

# Full suite (catches cross-package regressions)
pnpm test

# Expected: all green. Existing tests mount <Field name="..."/> extensively
# (Field.test.tsx, integration/complete-form.test.tsx, render-isolation, autosave-*, etc.)
# — all must pass UNCHANGED, proving the non-breaking default.
```

### Level 3: Build & Typecheck (System Validation)

```bash
# Build the react package (tsup emits dist/)
pnpm --filter @formality-ui/react build

# Root typecheck — tsconfig project references (core + react) AND __typechecks__/**
pnpm typecheck   # = tsc --build

# Expected: green. The new __typechecks__/FieldProps.test-d.ts IS checked here
# (react tsconfig includes src/**/* and does not exclude *.test-d.ts).
```

### Level 4: Type-Level Validation (the actual proof of this feature)

```bash
# The .test-d.ts file (Task 5) is the proof. It is consumed by `tsc --build` (Level 3),
# NOT by vitest. Confirm both properties:
pnpm typecheck   # must be green AND must NOT report TS2578 "unused @ts-expect-error"

# Sanity: confirm vitest did NOT try to run the type-only file (it has no runtime):
pnpm --filter @formality-ui/react test
# → vitest's include is src/**/*.test.{ts,tsx}; *.test-d.ts is excluded. If vitest
#   unexpectedly errors on the new file, its name is wrong (rename to *.test-d.ts).

# Expected: the @ts-expect-error lines in FieldProps.test-d.ts are HONORED (the typo
# name IS rejected, the non-string name IS rejected). A TS2578 "unused directive"
# error means the narrowing is NOT working → FAILURE → fix before finishing.
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm --filter @formality-ui/react build` succeeds.
- [ ] `pnpm typecheck` (root `tsc --build`) is green — INCLUDES the new
      `__typechecks__/FieldProps.test-d.ts`.
- [ ] `pnpm test` (root vitest) is green.
- [ ] `pnpm lint` is clean.
- [ ] No `TS2578` ("unused '@ts-expect-error' directive") on the new test file
      (i.e. the typo/non-string cases really ARE rejected).

### Feature Validation

- [ ] `FieldProps` (default) accepts `name: anyString` — non-breaking.
- [ ] `FieldProps<"name" | "email">` accepts `{ name: "name" }` and `{ name: "email" }`.
- [ ] `FieldProps<"name" | "email">` rejects `{ name: "typo" }` (compile error).
- [ ] `FieldProps` rejects `{ name: 123 }` (TName extends string).
- [ ] `<Field name="email" />` (default JSX usage) still compiles — proven by the
      existing runtime test suite staying green.
- [ ] The `Field` function carries the generic (`Field<TName extends string = string>`).
- [ ] `useFormContext()` inside Field is UN-parameterized (Controller name check stays `string`).

### Code Quality Validation

- [ ] JSDoc on `FieldProps<TName>` updated (Mode A): default behavior + how to opt
      into strict checking + note that per-form auto-narrowing is a follow-up.
- [ ] Generic default `= string` preserved exactly.
- [ ] All other `FieldProps` members + `[key: string]: unknown` index signature preserved.
- [ ] No runtime code added (type-only change).
- [ ] Follows existing generic-component style (`FormProps<TFieldValues>` in Form.tsx;
      `ReactFormFieldsConfig<V>` JSDoc in overlays.ts from S1).

### Documentation & Deployment

- [ ] JSDoc self-documents the consumer-facing behavior (Mode A — rides with the work).
- [ ] Per-form auto-narrowing deferral noted in JSDoc + PR description (PRD §C.4 permits this).
- [ ] No new environment variables or config.

### Scope Boundaries (do NOT cross)

- [ ] Core `FormFieldsConfig` was NOT modified.
- [ ] `overlays.ts` / `ReactFormFieldsConfig<V>` was NOT modified (S1's work).
- [ ] `Form.tsx` `FormProps.config` was NOT modified (S1's work).
- [ ] `index.ts` re-export line was NOT modified (transparent generic re-export).
- [ ] `FieldRenderAPI` was NOT made generic (out of scope).
- [ ] No README/doc-sync changes (those are P1.M3 / R5, a separate subtask).

---

## Anti-Patterns to Avoid

- ❌ Don't drop the generic default (`FieldProps<TName extends string>` without
  `= string`) — that forces every consumer to supply TName → breaking change.
- ❌ Don't add a type argument to the `useFormContext()` call inside Field — it
  would couple Field to a concrete TFieldValues and break the internal
  `<Controller name={name}>` assignment (FieldPath would narrow below `string`).
- ❌ Don't remove the `[key: string]: unknown` index signature — Field passes
  arbitrary extra props through to the input component.
- ❌ Don't make `FieldRenderAPI` generic in this subtask — it has no `name` field;
  churning it is out of scope and risks unrelated test breakage.
- ❌ Don't name the type-test file `*.test.ts` or `*.test.tsx` — vitest would try
  to run it (no runtime) and `tsc --build` would exclude it. It MUST be `*.test-d.ts`.
- ❌ Don't attempt full per-form auto-narrowing here if it requires non-trivial
  context threading — PRD §C.4 T2.1 explicitly allows deferring it. Deliver the
  generic public surface + type test; note the deferral.
- ❌ Don't touch `packages/core`, `overlays.ts`, or `Form.tsx` — owned by S1 / done.
- ❌ Don't skip the type-level test — runtime tests CANNOT prove name-narrowing;
  only a `*.test-d.ts` consumed by `tsc --build` can.
- ❌ Don't widen `TName` back to `string` in the function body to "fix" a phantom
  Controller error — first confirm the error is real (it shouldn't be, per the
  `Control<FieldValues>` reasoning); if real, cast `name as string` at the single
  Controller `name={...}` site only.

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is a two-line type change (interface + function signature) with a
mathematically guaranteed non-breaking default (`TName = string` ⇒ `name: string` ⇒
identical to today). The only internal usages of `name` (`config[name]` indexing and
`<Controller name={name}>`) are provably safe because `useFormContext()` is
un-parameterized ⇒ `methods.control: Control<FieldValues>` ⇒ Controller's name check
collapses to `string`, and core `FormFieldsConfig` is `Record<string, FieldConfig>`.
The audit set is tiny (3 references, all confirmed by grep). The type-test harness
already exists from sibling S1 (`__typechecks__/` is wired into `tsc --build` and
excluded from vitest) — clone it. The single residual risk is an unexpected inference
quirk in JSX generic-component instantiation, which is fully mitigated by the existing
runtime test suite (it mounts `<Field name="…"/>` dozens of times) staying green as the
non-breaking proof. Per-form auto-narrowing is explicitly deferrable per PRD §C.4.
