# Issue 2 — `pnpm typecheck:examples` Fails (Minor) — SCOPE CORRECTION

## ⚠️ Important correction to the PRD
The PRD (§Minor / h3.1) states the failure is **"12 TypeScript errors, all in
`examples/09-string-vs-function.tsx`"**. **This materially understates the scope.**

### Verified reality (run on current `main`)
- **Total errors: 293** (not 12).
- **Files affected: ALL 9** example files (not just `09`).

| File | Errors |
|------|-------:|
| examples/04-validation.tsx | 57 |
| examples/08-real-world-example.tsx | 40 |
| examples/02-input-types.tsx | 34 |
| examples/07-advanced-features.tsx | 32 |
| examples/05-field-dependencies.tsx | 31 |
| examples/09-string-vs-function.tsx | 28 |
| examples/03-conditions.tsx | 26 |
| examples/06-auto-save.tsx | 24 |
| examples/01-basic-form.tsx | 21 |
| **TOTAL** | **293** |

Error-code breakdown: TS2339 (175), TS2322 (61), TS7031 (18), TS7006 (12),
TS2554 (7), TS2365 (6), TS2362 (5), TS2739 (4), TS2363 (3), TS2769 (1), TS2741 (1).

## Root cause (uniform across files)
Every example imports the **core** `InputConfig` (`@formality-ui/core`'s
framework-agnostic type, where `component: unknown`) instead of the **React
overlay** `ReactInputConfig` (`@formality-ui/react`, where
`component: ComponentType<any>`).

Evidence — every file follows the same broken pattern:
```tsx
import { type InputConfig } from "@formality-ui/react";   // WRONG (core type re-exported)
const inputs: Record<string, InputConfig> = {              // component: unknown → no contextual typing
  textField: { component: ({ value, onChange }) => … },    // → implicit any on every param
};
```
This single misuse cascades into the majority of errors:
- **TS2322** (61): `Record<string, InputConfig<unknown>>` not assignable to the
  `Record<string, ReactInputConfig<unknown>>` that `<FormalityProvider inputs={…}>` expects.
- **TS2339** (175): `Property 'value' does not exist on type '{}'` — inline components get
  `{}`/untyped props because `component` is `unknown` (no React component contextual typing).
- **TS7031 / TS7006** (30): implicit-any on destructured arrow params / unannotated params.
- **TS2739 / TS2741** (5): `config` typed as core `FormFieldsConfig` vs `<Form>`'s narrowed
  `ReactFormFieldsConfig<{…}>` key set.

The remaining errors are **secondary** (mostly resolved once components get real props):
- **TS2365 / TS2362 / TS2363** (14): arithmetic/comparison operators on widened `{}` operands —
  concentrated in `09-string-vs-function.tsx` string-expression DSL demos (e.g. `age >= 21`).
- **TS2554** (7): wrong number of arguments in a handful of call sites.
- **TS2769** (1): `toFixed`/`toString` overload on `{}`.

## The correct types to use (verified exported)
From `packages/react/src/index.ts` → re-exported from `packages/react/src/overlays.ts`:
- `ReactInputConfig<TValue = unknown>` — `component: ComponentType<any>`, `template?: ComponentType<InputTemplateProps>`.
- `ReactFormFieldsConfig<V extends FieldValues = FieldValues>` — keys narrowed to `Extract<keyof V, string>`.
- `defineInputs<T extends Record<string, ReactInputConfig>>(inputs: T): T` — identity helper for
  `keyof typeof inputs` derivation (zero runtime effect, tree-shaken).
- `ReactFieldConfig<V>`, `FormalityFieldComponentProps<P>` — also available.

## Recommended fix strategy (for implementing agent)
Two complementary patterns; apply whichever is most idiomatic per file:

1. **Type-annotation swap (minimal):** change `InputConfig` → `ReactInputConfig` and
   `FormFieldsConfig` → `ReactFormFieldsConfig` in import + annotations. Update imports to pull
   `ReactInputConfig` from `@formality-ui/react`. This restores `ComponentType<any>` contextual
   typing and resolves the bulk (TS2322/TS2339/TS7031/TS7006/TS2739).

2. **`defineInputs` (idiomatic, matches overlays.ts JSDoc):** wrap the inputs map:
   ```tsx
   const inputs = defineInputs({ textField: { component: TextField, defaultValue: "" }, … });
   ```
   This both types `component` correctly AND lets consumers derive `type InputType = keyof typeof inputs`.

3. **Residual sweep:** after (1)/(2), fix the expression/operator widening (TS2365/TS2362/TS2363)
   by annotating or casting operands to `number` in the string-expression demos (e.g.
   `examples/09-string-vs-function.tsx`), and any arg-count (TS2554) call sites. Iterate
   `pnpm typecheck:examples` until exit 0.

### Note on `02-input-types.tsx`
This file declares individual inputs as `const textField: InputConfig = {...}` (not just the map),
so EACH such annotation must also migrate to `ReactInputConfig` (some are generic:
`InputConfig<Option | null>` → `ReactInputConfig<Option | null>`).

## CI gap (compounding factor)
`pnpm typecheck:examples` is **not a CI step** (`ci.yml` only runs lint/typecheck/test/build).
So these 293 errors are latent — nothing fails until someone runs the script by hand. The PRD
explicitly recommends wiring the check into CI once the examples are clean.

## Why these are NOT introduced by P1 (per PRD scope note)
P1 (R2–R5) touched `ReactFormFieldsConfig` key-narrowing, `FieldProps<TName>`, `defineInputs`,
`FormalityFieldComponentProps`, the coverage gate, and READMEs. The `ReactInputConfig` overlay
predates P1 (added in a prior changeset `e2bf5a7`), and the examples were never updated to consume
it. Fixing them is housekeeping that makes the shipped examples type-safe.

## Validation
- `pnpm typecheck:examples` must exit **0**.
- No behavioral/runtime change to examples (type-only edits).
- Optionally add `pnpm typecheck:examples` to `ci.yml` verify job.
