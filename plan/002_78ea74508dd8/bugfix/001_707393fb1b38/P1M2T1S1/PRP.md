name: "P1.M2.T1.S1 — Migrate input & field-config type annotations to React overlay types across all 9 examples"
description: |

---

## Goal

**Feature Goal**: Eliminate the **root cause** of the bulk of the 293
`pnpm typecheck:examples` errors by migrating every example file's type
annotations from the **core** `InputConfig` / `FormFieldsConfig` (where
`component: unknown`) to the **React overlay** types `ReactInputConfig` /
`ReactFormFieldsConfig` (where `component: ComponentType<any>`). This is
PRD Issue-2 fix **step 1** (the type-annotation migration); step 2
(residual expression/operator widening) is the separate task
**P1.M2.T2.S1** and is explicitly out of scope here.

**Deliverable**:
1. TYPE-ONLY edits to all 9 files in `examples/0*.tsx`:
   `01-basic-form`, `02-input-types`, `03-conditions`, `04-validation`,
   `05-field-dependencies`, `06-auto-save`, `07-advanced-features`,
   `08-real-world-example`, `09-string-vs-function`.
2. In each file: swap `type InputConfig` → `type ReactInputConfig` and
   `type FormFieldsConfig` → `type ReactFormFieldsConfig` in the import, then
   swap every annotation (`Record<string, InputConfig>`,
   `const x: InputConfig`, `const cfg: FormFieldsConfig`, …) to its React
   counterpart. All imports continue to come from `@formality-ui/react`.
3. **No runtime change** — no JSX edits, no logic edits, no new components,
   no demonstrated-concept changes. Pure type-annotation swap.

**Success Definition**:
1. `pnpm typecheck:examples` error count drops from **293** to **only the
   residual expression/operator/arg-count errors** that P1.M2.T2.S1 owns
   (TS2365, TS2362, TS2363 in `09-string-vs-function.tsx`, plus TS2554/TS2769
   call sites). Concretely: **TS2322, TS2339, TS7031, TS7006, TS2739, TS2741
   go to ZERO**; an estimated 270+ of the 293 errors disappear.
2. No example's runtime behavior, JSX structure, or displayed output changes
   (verifiable by `git diff` showing only import lines + annotation lines).
3. The full repo still typechecks/lints/tests green:
   `pnpm typecheck`, `pnpm lint`, `pnpm test` all unchanged.
4. The residual error list (whatever remains) is captured and handed to
   P1.M2.T2.S1.

## User Persona

**Target User**: Developers who copy from `examples/` as the canonical
"how to use Formality" reference (per PRD Issue-2: examples are "shipped
user-facing documentation"). Also: the CI gate that P1.M2.T3.S1 will wire up.

**Use Case**: A consumer copies an example's `inputs` map into their app and
expects TypeScript autocomplete on `value`/`onChange` inside the inline
component. Today they get `any`/`{}` because the example mistyped `component`
as `unknown` (core type) instead of `ComponentType<any>` (React overlay).

**User Journey**: Consumer opens `examples/02-input-types.tsx` → copies the
`autocomplete` input → pastes into their form → TypeScript correctly types
the component's props because the example now annotates with
`ReactInputConfig<Option | null>`.

**Pain Points Addressed**: 293 red squiggles in the shipped examples that make
the library look broken to anyone who opens it in an IDE.

## Why

- **Correctness of shipped docs (PRD §1.3.7 / Issue-2).** Examples are excluded
  from the coverage gate but are the primary teaching artifact. 293 type
  errors there undermine the type-safety story the whole P1 milestone delivers.
- **Single root cause.** `examples_typecheck.md` proves ALL 9 files share one
  mistake: importing the core `InputConfig` (re-exported by the react package)
  whose `component: unknown` strips all React contextual typing. One uniform
  fix cascades into ~270 error resolutions.
- **Scope discipline.** This subtask is deliberately limited to the
  type-annotation migration (the uniform part). The non-uniform residuals
  (string-expression DSL operator widening in `09`, arg-count call sites) are
  assigned to P1.M2.T2.S1 so neither task is blocked by the other's edge cases.

## What

A mechanical, per-file type-annotation migration. Two patterns are valid; this
PRP mandates the **type-annotation swap** as primary (lowest risk, purely
type-level, no value-expression changes) and lists `defineInputs` as an
**optional idempotent enhancement** that an implementer may apply per file.

### Success Criteria

- [ ] All 9 `examples/0*.tsx` files import `ReactInputConfig` (and
      `ReactFormFieldsConfig` where applicable) from `@formality-ui/react`.
- [ ] No file still references the core `InputConfig` / `FormFieldsConfig`
      in an annotation (`grep -nE ":\s*(Record<string, )?InputConfig|:\s*FormFieldsConfig|InputConfig<|FormFieldsConfig<"` in examples/ → only matches inside JSDoc comments, if any).
- [ ] Special cases migrated:
      - `02-input-types.tsx`: **every** `const X: InputConfig[<T>] = {...}`
        (textField, switchInput, autocomplete `InputConfig<Option | null>`,
        decimal, currency, textArea, validatedTextField) AND the
        `Record<string, InputConfig>` map.
      - `07-advanced-features.tsx`: **both** `inputs` AND `templateInputs`
        maps, plus all `FormFieldsConfig` annotations
        (unusedFieldsConfig, orderedFieldsConfig, recordKeyConfig,
        formTitleConfig, provideStateConfig, passSubscriptionsConfig,
        renderFunctionConfig, templateConfig).
- [ ] `pnpm typecheck:examples` no longer reports ANY `TS2322 (Record<string,
      InputConfig<unknown>> not assignable to Record<string,
      ReactInputConfig<unknown>>)`, `TS2339 ('value' does not exist on '{}')`,
      `TS7031/TS7006 (implicit any)`, or `TS2739/TS2741 (config key mismatch)`.
- [ ] `git diff --stat` shows ONLY the 9 example files changed (no source,
      no config, no README, no CI).
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` remain green.

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: the exact
overlay-type names + which file exports them, the exact import/annotation
pattern repeated in every example, the special cases (02 + 07), the residual-
error boundary vs the sibling task, and the precondition that the react dist
must be built. All cited below with exact paths and line numbers. ✅ Passes
the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ - include in context window before implementing
- docfile: plan/002_78ea74508dd8/bugfix/001_707393fb1b38/architecture/examples_typecheck.md
  section: full doc (short) — esp. "Verified reality", "Root cause", "Recommended fix strategy"
  why: |
    Authoritative scope analysis. Confirms: 293 total errors across ALL 9
    files (PRD's "12 in 09" materially understates it), uniform root cause,
    per-file error counts, and the two valid fix patterns. The error-code
    breakdown (TS2339=175, TS2322=61, TS7031=18, TS7006=12, TS2739=4, TS2741=1)
    is what THIS task must zero out; the rest (TS2365/TS2362/TS2363/TS2554/
    TS2769) belongs to P1.M2.T2.S1.

- file: packages/react/src/overlays.ts
  why: |
    Defines the EXACT target types. The migration target names + semantics:
      ReactInputConfig<TValue = unknown>:
          extends Omit<InputConfig<TValue>, "component"|"template">,
          component: ComponentType<any>, template?: ComponentType<InputTemplateProps>
      ReactFormFieldsConfig<V extends FieldValues = FieldValues>:
          Record<Extract<keyof V, string>, ReactFieldConfig<V>>
      defineInputs<T extends Record<string, ReactInputConfig>>(inputs: T): T  (identity VALUE export)
      ReactFieldConfig<V>: extends Omit<FieldConfig, "rules">, rules?: RegisterOptions<V>
  pattern: |
    Use ReactFormFieldsConfig with its DEFAULT generic (V = FieldValues). Do NOT
    pass a concrete V here — narrowing the form's field-values type is the
    separate type-safety story (already shipped for <Form<TFieldValues>>); this
    task is purely about restoring component contextual typing.
  gotcha: |
    defineInputs is a VALUE export (function), not a type — import it without
    `type`. If used, the variable becomes `const inputs = defineInputs({...})`
    (inferred) rather than `const inputs: T = {...}`.

- file: packages/react/src/index.ts
  section: lines ~93–108
  why: |
    Confirms the overlay types are PUBLIC: `ReactInputConfig`, `ReactFieldConfig`,
    `ReactFormFieldsConfig` (types) and `defineInputs` (value) are all exported
    from the package entry point. So `import { type ReactInputConfig } from
    "@formality-ui/react"` resolves.
  gotcha: |
    Examples resolve against the BUILT dist (packages/react/dist/index.d.ts),
    not src. Verified: `ReactInputConfig` appears 8× in dist/index.d.ts. If the
    dist is stale, rebuild before validating (see Validation Level 1).

- file: examples/tsconfig.json
  why: |
    Explains the resolution model. `typecheck:examples` = `tsc -p
    examples/tsconfig.json --noEmit`, which references packages/core +
    packages/react (composite). tsc reads the referenced projects' emitted
    .d.ts from dist. So the react package MUST be built and current.
  pattern: |
    Pre-validation precondition: `pnpm --filter @formality-ui/react build`
    (tsup) before running `pnpm typecheck:examples`.

- file: examples/01-basic-form.tsx
  section: import block (lines ~11–19) + `const inputs` (line ~26) + `const config` (line ~91)
  why: |
    Canonical pattern to migrate — ALL 9 files share this exact shape:
      import { ..., type InputConfig, type FormFieldsConfig } from "@formality-ui/react";
      const inputs: Record<string, InputConfig> = { textField: { component: (...) => ... } };
      const config: FormFieldsConfig = { name: { type: "textField" } };
    Migrate → ReactInputConfig / ReactFormFieldsConfig.

- file: examples/02-input-types.tsx
  why: |
    SPECIAL CASE #1. Declares INDIVIDUAL typed inputs, not just a map:
      const textField: InputConfig = {...}            (line 30)
      const switchInput: InputConfig = {...}          (line 47)
      const autocomplete: InputConfig<Option | null>  (line 77)  ← GENERIC
      const decimal: InputConfig = {...}              (line 112)
      const currency: InputConfig = {...}             (line 134)
      const textArea: InputConfig = {...}             (line 171)
      const validatedTextField: InputConfig = {...}   (line 215)
      const inputs: Record<string, InputConfig> = {...}(line 231)
    Note: this file imports ONLY `InputConfig` (no FormFieldsConfig); its
    `const config = {...}` (line ~40) is UNANNOTATED and infers from <Form>,
    so no FormFieldsConfig migration is needed here.
  gotcha: |
    The generic annotation must be preserved verbatim:
    `InputConfig<Option | null>` → `ReactInputConfig<Option | null>` (NOT bare).

- file: examples/07-advanced-features.tsx
  why: |
    SPECIAL CASE #2. Has TWO inputs maps that BOTH need migration:
      const inputs: Record<string, InputConfig> = {...}        (line 32)
      const templateInputs: Record<string, InputConfig> = {...}(line 505)
    AND 9 `FormFieldsConfig` annotations (lines 126, 174, 214, 271, 339, 385,
    429, 513, …). ALL of them migrate to ReactFormFieldsConfig.
  gotcha: |
    templateInputs feeds a SECOND <FormalityProvider inputs={templateInputs}>
    (line 530). Do not miss it — it has the same root-cause error.

- url: https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads
  why: |
    Contextual typing reference — explains WHY swapping the annotation fixes
    the TS2339/TS7031/TS7006 cascade: once `component` is typed
    ComponentType<any>, the inline arrow `({ value, onChange }) => …` receives
    real prop types via contextual typing instead of implicit-any params.
```

### Current Codebase tree (relevant slice)

```bash
examples/
├── 01-basic-form.tsx          # 21 errors — 2 FormFieldsConfig refs
├── 02-input-types.tsx         # 34 errors — 0 FormFieldsConfig, 7 InputConfig decls (1 generic)
├── 03-conditions.tsx          # 26 errors — 10 FormFieldsConfig refs
├── 04-validation.tsx          # 57 errors (worst) — 7 FormFieldsConfig refs
├── 05-field-dependencies.tsx  # 31 errors — 8 FormFieldsConfig refs
├── 06-auto-save.tsx           # 24 errors — 7 FormFieldsConfig refs
├── 07-advanced-features.tsx   # 32 errors — 2 inputs maps (inputs+templateInputs), 9 FormFieldsConfig
├── 08-real-world-example.tsx  # 40 errors — 2 FormFieldsConfig refs
├── 09-string-vs-function.tsx  # 28 errors — 5 FormFieldsConfig refs + residual operator widening (T2.S1)
├── index.ts
├── package.json
├── tsconfig.json              # references packages/core + packages/react (composite)
└── README.md
packages/react/src/
├── overlays.ts                # ← defines ReactInputConfig, ReactFormFieldsConfig, defineInputs, ReactFieldConfig
└── index.ts                   # ← re-exports them (lines ~93–108)
packages/react/dist/
└── index.d.ts                 # ← what examples actually resolve against (8× ReactInputConfig)
```

### Desired Codebase tree with files to be added

```bash
# No files added. The 9 example files are EDITED IN PLACE (type-only):
examples/0{1..9}-*.tsx   # import + annotation swaps only
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Two DIFFERENT types named ~"InputConfig". Core's is framework-agnostic
//   (component: unknown); the React overlay's has component: ComponentType<any>.
//   The react package RE-EXPORTS core's InputConfig too, which is why the examples
//   accidentally pulled the wrong one. The fix is to switch the IMPORT NAME, not
//   the import source — both come from "@formality-ui/react":
//     type InputConfig          → type ReactInputConfig
//     type FormFieldsConfig     → type ReactFormFieldsConfig
//   (Core's InputConfig/FormFieldsConfig are NOT imported from "@formality-ui/core"
//    in any example — they all import from "@formality-ui/react". Keep the source.)

// CRITICAL: Examples resolve against BUILT dist, not src. If a type seems missing,
//   rebuild first: `pnpm --filter @formality-ui/react build` (tsup).
//   Verified ReactInputConfig is in dist/index.d.ts (8 occurrences).

// CRITICAL: Use ReactFormFieldsConfig with its DEFAULT generic. Do NOT pass a
//   concrete field-values type — that is <Form<TFieldValues>>'s job (already
//   shipped) and would narrow keys, potentially breaking example configs that mix
//   keys across multiple <Form> instances (e.g. 07-advanced-features.tsx).

// GOTCHA: 02-input-types.tsx has a GENERIC annotation `InputConfig<Option | null>`
//   (line 77). Preserve the generic: → `ReactInputConfig<Option | null>`.

// GOTCHA: 07-advanced-features.tsx has a SECOND inputs map `templateInputs`
//   (line 505) feeding a second <FormalityProvider inputs={templateInputs}>.
//   Migrate BOTH maps.

// GOTCHA: defineInputs is a VALUE export, not a type. If you adopt it, import
//   WITHOUT `type` and drop the explicit annotation:
//     const inputs = defineInputs({ textField: {...}, switch: {...} });
//   This is OPTIONAL and idempotent (zero runtime effect, tree-shaken). The
//   plain type-annotation swap is sufficient and lower-risk; prefer it.

// GOTCHA: Some files reference InputConfig/FormFieldsConfig inside JSDoc comments
//   (e.g. 02-input-types.tsx line 4 "full range of InputConfig options"). Leave
//   those prose mentions alone — they are documentation, not annotations.

// SCOPE: Residual errors TS2365 / TS2362 / TS2363 (operator widening in
//   09-string-vs-function.tsx string-expression DSL) and TS2554 / TS2769
//   (arg-count / overload on {}) are OUT OF SCOPE — owned by P1.M2.T2.S1.
//   Do NOT chase them here even if a few are easy; keep the diff pure.
```

## Implementation Blueprint

### Data models and structure

No new models. Pure type-annotation swap on existing constants. The migration
is value-level a no-op.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 0 (PRECONDITION): Ensure react dist is current
  - RUN: pnpm --filter @formality-ui/react build
  - WHY: examples resolve against packages/react/dist/index.d.ts. If the dist
         is stale (missing overlay exports), migration looks like it failed.
  - VERIFY: grep -c "ReactInputConfig" packages/react/dist/index.d.ts  → ≥ 1

Task 1: BASELINE the current error count (do this BEFORE editing)
  - RUN: pnpm typecheck:examples 2>&1 | tee /tmp/before.txt
  - CAPTURE: total error count + per-file counts. Expect 293 total.
  - WHY: Lets you prove the drop at the end and identify the residual set to
         hand to P1.M2.T2.S1.

Task 2: MIGRATE examples/01-basic-form.tsx (template file — do this first)
  - IMPORT (lines 16–17): 
      type InputConfig,        →  type ReactInputConfig,
      type FormFieldsConfig,   →  type ReactFormFieldsConfig,
  - ANNOTATION (line 26):  Record<string, InputConfig>  → Record<string, ReactInputConfig>
  - ANNOTATION (line 91):  FormFieldsConfig             → ReactFormFieldsConfig
  - VERIFY: pnpm typecheck:examples 2>&1 | grep "01-basic-form" → far fewer errors
  - WHY FIRST: Establishes the exact edit pattern you will repeat 8 more times.

Task 3: MIGRATE examples/03-conditions.tsx, 04-validation.tsx, 05-field-dependencies.tsx,
        06-auto-save.tsx, 08-real-world-example.tsx (uniform files)
  - PER FILE: same swap as Task 2 on the import block + every
      `Record<string, InputConfig>` and `: FormFieldsConfig` annotation.
  - COUNTS to migrate per file (FormFieldsConfig refs, from grep):
      03-conditions: 10   04-validation: 7   05-field-dependencies: 8
      06-auto-save: 7     08-real-world-example: 2
  - NAMING: keep the ReactFormFieldsConfig generic at its DEFAULT (no type arg).

Task 4: MIGRATE examples/02-input-types.tsx (SPECIAL CASE — individual input decls)
  - IMPORT (line 22): type InputConfig  → type ReactInputConfig
  - ANNOTATIONS — each individual input (preserve generics verbatim):
      line 30:  const textField: InputConfig             → ReactInputConfig
      line 47:  const switchInput: InputConfig           → ReactInputConfig
      line 77:  const autocomplete: InputConfig<Option | null> → ReactInputConfig<Option | null>
      line 112: const decimal: InputConfig               → ReactInputConfig
      line 134: const currency: InputConfig              → ReactInputConfig
      line 171: const textArea: InputConfig              → ReactInputConfig
      line 215: const validatedTextField: InputConfig    → ReactInputConfig
      line 231: const inputs: Record<string, InputConfig>→ Record<string, ReactInputConfig>
  - NOTE: NO FormFieldsConfig in this file; `const config` (line ~40) is
          unannotated and infers — leave it.
  - NOTE: JSDoc comment line 4 ("full range of InputConfig options") stays.

Task 5: MIGRATE examples/07-advanced-features.tsx (SPECIAL CASE — TWO inputs maps)
  - IMPORT (lines 22–23): InputConfig → ReactInputConfig, FormFieldsConfig → ReactFormFieldsConfig
  - ANNOTATION line 32:  inputs:  Record<string, InputConfig> → ReactInputConfig
  - ANNOTATION line 505: templateInputs: Record<string, InputConfig> → ReactInputConfig
  - ANNOTATIONS (9× FormFieldsConfig → ReactFormFieldsConfig, default generic):
      lines 126 (unusedFieldsConfig), 174 (orderedFieldsConfig), 214 (recordKeyConfig),
      271 (formTitleConfig), 339 (provideStateConfig), 385 (passSubscriptionsConfig),
      429 (renderFunctionConfig), 513 (templateConfig), +1 more (grep to confirm).
  - GOTCHA: Do not miss templateInputs (line 505) — it has the same root-cause error.

Task 6: MIGRATE examples/09-string-vs-function.tsx (partial — residuals owned by T2.S1)
  - IMPORT + annotations: same swap as Task 2 (5 FormFieldsConfig refs).
  - EXPECT: this file will STILL have errors after migration (TS2365/TS2362/TS2363
            operator widening on `age >= 21`-style string-expression DSL demos).
  - DO NOT fix those here — they are P1.M2.T2.S1's deliverable. Just do the
    type-annotation swap and move on.

Task 7: (OPTIONAL) apply defineInputs where idiomatic
  - ONLY IF a file would read more clearly, wrap its inputs map:
      const inputs = defineInputs({ textField: {...}, switch: {...} });
    and import defineInputs (VALUE, no `type`). This is idempotent and
    tree-shaken. SKIP if in doubt — the plain annotation swap is sufficient.

Task 8: VALIDATE + capture residual handoff
  - RUN: pnpm typecheck:examples 2>&1 | tee /tmp/after.txt
  - ASSERT: zero TS2322 / TS2339 / TS7031 / TS7006 / TS2739 / TS2741 remain.
  - CAPTURE: the remaining errors (TS2365/TS2362/TS2363/TS2554/TS2769) and save
            the list as the handoff input for P1.M2.T2.S1
            (research/ or PRP context of that task — NOT your deliverable to fix).
  - RUN: pnpm typecheck && pnpm lint && pnpm test  → all green (no regressions).
```

### Implementation Patterns & Key Details

```tsx
// PATTERN A (PRIMARY — minimal, type-only, lowest risk): annotation swap.
// Before:
import {
  FormalityProvider, Form, Field,
  type InputConfig,
  type FormFieldsConfig,
} from "@formality-ui/react";

const inputs: Record<string, InputConfig> = {
  textField: { component: ({ value, onChange }) => <input .../>, defaultValue: "" },
};
const config: FormFieldsConfig = { name: { type: "textField" } };

// After:
import {
  FormalityProvider, Form, Field,
  type ReactInputConfig,
  type ReactFormFieldsConfig,
} from "@formality-ui/react";

const inputs: Record<string, ReactInputConfig> = {
  textField: { component: ({ value, onChange }) => <input .../>, defaultValue: "" },
  //                ↑ now contextually typed (ComponentType<any>) → value/onChange get real types
};
const config: ReactFormFieldsConfig = { name: { type: "textField" } };
//              ↑ default generic V = FieldValues → any string key accepted (non-breaking)

// PATTERN A (generic preservation — 02-input-types.tsx line 77):
// Before:  const autocomplete: InputConfig<Option | null> = { ... };
// After:   const autocomplete: ReactInputConfig<Option | null> = { ... };

// PATTERN B (OPTIONAL — idiomatic, matches overlays.ts JSDoc): defineInputs.
// Use ONLY if you want `type InputType = keyof typeof inputs` derivation.
import { defineInputs } from "@formality-ui/react";   // VALUE export — no `type`
const inputs = defineInputs({
  textField: { component: TextField, defaultValue: "" },
});
export type InputType = keyof typeof inputs;          // "textField" | ...
// ⚠️ Pattern B changes the variable from annotated to inferred. If the file
//    later annotates `const inputs: SomeType = defineInputs(...)`, drop the
//    annotation (let defineInputs' return type drive). Idempotent; tree-shaken.
```

### Integration Points

```yaml
PACKAGE BUILD (precondition):
  - run: "pnpm --filter @formality-ui/react build"
  - why: |
      examples/tsconfig.json references packages/react (composite). typecheck
      reads dist/index.d.ts. If dist is stale, the new types appear missing.
  - verify: "grep -c ReactInputConfig packages/react/dist/index.d.ts  → ≥ 1"

TYPE RESOLUTION:
  - source: "@formality-ui/react" (UNCHANGED — both core + overlay types are
            re-exported here; we only change WHICH name is imported)
  - note: |
      Do NOT change any import to "@formality-ui/core". The overlay types live
      in the react package. Core's InputConfig stays the wrong choice.

CONFIG GENERIC:
  - rule: "Use ReactFormFieldsConfig with its DEFAULT generic (V = FieldValues)."
  - why: |
      Passing a concrete field-values type would narrow config keys and could
      break files that reuse one config type across multiple <Form> instances
      (07-advanced-features.tsx). Key-narrowing per-form is already delivered
      via <Form<TFieldValues>>; this task restores COMPONENT typing, not key typing.

CI / SCOPE FENCES (do NOT touch in this task):
  - .github/workflows/ci.yml        → P1.M1.T1.S1 (coverage gate) + P1.M2.T3.S1 (typecheck:examples gate)
  - README.md / packages/react/README.md  → P1.M2.T4.S1 (narrative)
  - vitest.config.ts thresholds     → already done (P1.M2.T1.S5); do not touch
  - examples/09 operator widening   → P1.M2.T2.S1 (residual sweep)

PARALLEL EXECUTION CONTRACT:
  - sibling P1.M1.T1.S1 edits ONLY .github/workflows/ci.yml (one line: pnpm test
    → pnpm test:coverage). It does NOT touch examples/. No file conflict; the
    two tasks are fully independent and can land in either order / in parallel.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# PRECONDITION — make sure the types the examples import actually ship in dist
pnpm --filter @formality-ui/react build
grep -c "ReactInputConfig" packages/react/dist/index.d.ts   # expect ≥ 1 (currently 8)

# After each file edit — fast type check on just that file's project
pnpm typecheck:examples 2>&1 | grep "<file-basename>" | head

# Repo-wide (must stay green — examples are excluded from the main build graph)
pnpm typecheck      # tsc --build
pnpm lint
# Expected: zero errors. Examples edits are type-only and cannot affect the
# package build or tests. If pnpm typecheck/lint regress, you changed real code.
```

### Level 2: Per-File Migration Verification (Component Validation)

```bash
# BASELINE before editing (capture for the end-of-task delta proof)
pnpm typecheck:examples 2>&1 | tee /tmp/before.txt
grep -cE "error TS" /tmp/before.txt        # expect ~293

# After each Task (2–6), re-run and watch that file's errors collapse:
pnpm typecheck:examples 2>&1 | grep -cE "examples/01-basic-form.*error TS"
pnpm typecheck:examples 2>&1 | grep -cE "examples/02-input-types.*error TS"
# … etc. Each migrated file's count should drop to ~0 (except 09, which keeps
# its residual operator-widening errors owned by P1.M2.T2.S1).

# Confirm no example still uses the core annotations (except in JSDoc prose):
grep -rnE ":\s*(Record<string, )?InputConfig\b|:\s*FormFieldsConfig\b" examples/
# Expected: no matches in CODE (only inside /* */ comments, if any).
```

### Level 3: Full typecheck:examples Validation (System Validation)

```bash
# The headline gate for this task
pnpm typecheck:examples 2>&1 | tee /tmp/after.txt
echo "=== error code breakdown (after) ==="
grep -oE "error TS[0-9]+" /tmp/after.txt | sort | uniq -c | sort -rn

# EXPECTED after this task:
#   TS2322 / TS2339 / TS7031 / TS7006 / TS2739 / TS2741  → 0 each  (THIS task's job)
#   TS2365 / TS2362 / TS2363 / TS2554 / TS2769           → residual (P1.M2.T2.S1)
# Total should drop from ~293 to a small residual count (roughly ≤ ~25, almost
# all in examples/09-string-vs-function.tsx).

# Sanity: full repo gates still green (no collateral damage)
pnpm typecheck && pnpm lint && pnpm test
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Prove the runtime is UNCHANGED (this is a type-only task — the strongest
# guarantee is a diff that touches only imports + annotations):
git diff --stat examples/
# Expected: exactly 9 files, all under examples/. No src/, no config, no README.
git diff examples/ | grep -E "^\+" | grep -vE "^\+\+\+|ReactInputConfig|ReactFormFieldsConfig|import|//|\*|^\+\s*$"
# Expected: essentially empty. Any remaining +line is a real code change → revert it.

# Prove contextual typing now works (the actual user-visible win): open any
# migrated file in an IDE and hover an inline component's `value` param — it
# should now show a real type (string/number/…) instead of `any`. (Manual check;
# no CLI equivalent. The disappearance of TS2339/TS7031/TS7006 is the proxy.)

# Capture the residual error list for the downstream task:
pnpm typecheck:examples 2>&1 | grep -E "error TS(2365|2362|2363|2554|2769)" > \
  plan/002_78ea74508dd8/bugfix/001_707393fb1b38/P1M2T2.S1-handoff-residuals.txt 2>/dev/null \
  || echo "(handoff file is optional — the main deliverable is the PRP.md only; \
           do not create files outside the allowed research/ dir)"
# NOTE: per the FORBIDDEN OPERATIONS rules, you may only write to your PRP.md
# and research/ subdir. Capture the residual list INSIDE your PRP's research
# notes or report it in your task completion summary instead.
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1: `pnpm --filter @formality-ui/react build` ran; dist has `ReactInputConfig`.
- [ ] Level 1: `pnpm typecheck`, `pnpm lint`, `pnpm test` all green (no regressions).
- [ ] Level 3: `pnpm typecheck:examples` shows **0** of TS2322/TS2339/TS7031/TS7006/TS2739/TS2741.
- [ ] Level 4: `git diff --stat` shows ONLY the 9 example files changed.

### Feature Validation

- [ ] All 9 `examples/0*.tsx` import `ReactInputConfig` from `@formality-ui/react`.
- [ ] Every `FormFieldsConfig` annotation migrated to `ReactFormFieldsConfig` (default generic).
- [ ] `02-input-types.tsx`: all 7 individual input decls migrated (generic `Option | null` preserved).
- [ ] `07-advanced-features.tsx`: BOTH `inputs` and `templateInputs` maps migrated.
- [ ] `09-string-vs-function.tsx`: annotation swap done; residual operator errors LEFT for T2.S1.
- [ ] No runtime/JSX/logic change (diff is imports + annotations only).
- [ ] Residual error set captured/reported for P1.M2.T2.S1.

### Code Quality Validation

- [ ] No example imports from `@formality-ui/core` for these types (source stays `@formality-ui/react`).
- [ ] `ReactFormFieldsConfig` used with DEFAULT generic (no concrete V passed).
- [ ] JSDoc prose mentions of "InputConfig" left intact (they are documentation, not annotations).
- [ ] No scope creep into operator-widening fixes, CI edits, or README changes.
- [ ] Anti-patterns avoided (see below).

### Documentation & Deployment

- [ ] No README/config/API surface change (item DOCS §6: none).
- [ ] The "examples are now type-clean" narrative is deferred to P1.M2.T4.S1.

---

## Anti-Patterns to Avoid

- ❌ Don't change the import SOURCE to `@formality-ui/core`. Both the core and
  overlay types are re-exported from `@formality-ui/react`; swap the NAME
  (`InputConfig` → `ReactInputConfig`), keep the source.
- ❌ Don't pass a concrete generic to `ReactFormFieldsConfig<V>` (e.g.
  `ReactFormFieldsConfig<MyValues>`). That narrows config keys and can break
  files that share one config type across forms. Use the default (`FieldValues`).
- ❌ Don't drop the generic on `02-input-types.tsx`'s `autocomplete` —
  `InputConfig<Option | null>` must become `ReactInputConfig<Option | null>`,
  not bare `ReactInputConfig`.
- ❌ Don't forget `07-advanced-features.tsx`'s SECOND inputs map `templateInputs`
  (line 505). It feeds a second `<FormalityProvider>` and has the same error.
- ❌ Don't chase the TS2365/TS2362/TS2363/TS2554 residual errors — even "easy"
  ones. They belong to P1.M2.T2.S1; mixing them in pollutes the diff and blurs
  task boundaries. Leave them red.
- ❌ Don't edit `.github/workflows/ci.yml`, `vitest.config.ts`, READMEs, or any
  `packages/**` source. Those are owned by P1.M1.T1.S1 / P1.M2.T3.S1 /
  P1.M2.T4.S1 / earlier milestones respectively.
- ❌ Don't use `as ReactInputConfig` casts to "fix" an annotation — change the
  annotation itself. Casts hide real type mismatches and defeat the purpose.
- ❌ Don't rebuild the react package and commit dist changes. `dist/` is build
  output (gitignored); rebuild is a local precondition only.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale: The task is mechanical and uniform — one import-name swap + one
annotation-name swap, repeated across 9 files with only two documented special
cases (02's individual decls, 07's second inputs map). The architecture doc
already verified the exact target types are exported (lines 93–108 of
packages/react/src/index.ts, 8× present in dist/index.d.ts), the root cause is
singular, and the residual-vs-owned error boundary is crisply defined by error
code. The -1 is for the small risk that an individual example has an
unforeseen annotation shape (e.g. a `FieldConfig` or inline `satisfies` clause)
not caught by the grep survey; the implementer should re-grep each file for
`InputConfig`/`FormFieldsConfig` occurrences before declaring it done, and
treat any `ReactFieldConfig`-shaped annotation as an additional migration target
using the same source-swap rule.
