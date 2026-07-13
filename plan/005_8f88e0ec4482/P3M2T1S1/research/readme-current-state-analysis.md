# README.md Current-State Analysis (P3.M2.T1.S1 input)

Captured 2026-07-13 by reading the actual `README.md` (856 lines) and the
actual package sources. This is the ground truth for what the README currently
says vs. what the codebase actually is after P1 + P2 + P3.M1.

## 1. README.md section line map (verified)

| Section | Line | Relevant to this task? |
|---------|------|------------------------|
| `## Packages` | 202 | ✅ (b) — add validate/mergeConfigs note |
| `## Type Safety` | 663 | ✅ (d) — already accurate; verify |
| `## Architecture` | 684 | ✅ (c) — mention useField hook |
| `### Expression Engine` | 711 | (no change — accurate) |
| `## Development` | 759 | (no change) |
| `### Project Structure` | 777 | ✅ (a) — expand tree, add ordering.ts + useField.tsx |

The contract's line numbers (684/777/202/663/711/759) match EXACTLY. Good.

## 2. Current `## Packages` table (line 202) — what it says now

```
| Package                                   | Description                  | Status  |
| @formality-ui/core                        | Framework-agnostic utilities | Stable  |
| @formality-ui/react                       | React implementation         | Stable  |
| @formality-ui/vue                         | Vue implementation           | Planned |
| @formality-ui/svelte                      | Svelte implementation        | Planned |
```

→ No mention of headline exports `validate()` / `mergeConfigs()`. NEEDS a note.

## 3. Current `### Project Structure` tree (line 777) — too coarse

```
formality/
├── packages/
│   ├── core/        # Framework-agnostic utilities
│   └── react/       # React implementation
├── examples/        # Comprehensive examples
├── PRD.md           # Developer documentation
└── package.json
```

→ Does NOT list `config/ordering.ts` or `hooks/useField.tsx`. NEEDS expansion.
→ Does NOT mention useFieldDisabledState (so nothing to remove here).

## 4. Current `## Architecture` diagram (line 684) — Field box omits useField

The 3-layer diagram (Provider → Form → Field). Field box bullets:
`Props resolution & evaluation / Value transformation / Condition application`.
→ Does NOT mention that Field delegates to the `useField` hook. NEEDS a note.

## 5. Current `## Type Safety` section (line 663) — ALREADY ACCURATE

Already lists all 4 capabilities:
- Checked `Form` config keys (`<Form<TFieldValues>>`)
- Checked `Field` names (opt-in via `FieldProps<TName>`)
- `defineInputs` / `InputType` (opt-in)
- `FormalityFieldComponentProps<P>`

Links to `packages/react/README.md#type-safety`.

## 6. Actual codebase structure (verified — the v1.0 ground truth)

### @formality-ui/core (`packages/core/src/`)
```
conditions/   evaluate.ts, index.ts
config/       defaults.ts, index.ts, merge.ts, ordering.ts   ← ordering.ts is NEW (P1.M1)
expression/   context.ts, evaluate.ts, index.ts, infer.ts
labels/       index.ts, resolve.ts
transform/    index.ts, pipeline.ts
types/        conditions.ts, config.ts, index.ts, state.ts, validation.ts
validation/   index.ts, messages.ts, validate.ts              ← validate() is NEW (P1.M2.T1)
index.ts                                                       (barrel)
```

### @formality-ui/react (`packages/react/src/`)
```
components/    Field.tsx, FieldGroup.tsx, FormalityProvider.tsx, Form.tsx, UnusedFields.tsx
context/       ConfigContext.ts, FormContext.ts, GroupContext.ts
hooks/         useConditions.ts, useField.tsx, useFormState.ts,
               useInferredInputs.ts, usePropsEvaluation.ts, useSubscriptions.ts
                            ← useField.tsx is a DISTINCT module (P2.M1.T1); .tsx not .ts
                            ← useFieldDisabledState.ts GONE (P2.M1.T2)
index.ts       (barrel)
overlays.ts    ← React type overlays; forwardRef JSDoc accurate (P2.M2)
typeAssertions/ injectedProps.types.ts
types.ts
utils/         makeProxyState.ts
```

## 7. Verified headline-export signatures (for accurate README usage)

From `packages/core/src/validation/validate.ts:41`:
```ts
export async function validate(
  value: unknown,
  rules: ValidatorSpec,
  validators?: ValidatorsConfig,
  formValues?: Record<string, unknown>,
): Promise<ValidationResult | undefined>
```

From `packages/core/src/config/merge.ts:293`:
```ts
export function mergeConfigs(
  provider: FormalityProviderConfig,
  form?: FormConfig,
  field?: FieldConfig,
): { inputConfig: InputConfig | undefined; fieldConfig: FieldConfig }
```

Both are exported from `packages/core/src/index.ts` (verified: `validate` from
`./validation`, `mergeConfigs` from `./config`). The PRD §1.3.2 headline names
are present.

## 8. Appendix C — ACTUAL status (contradicts stale PRD snapshot)

The PRD snapshot (from plan-start) marked T2.2 + T3.1 "NOT STARTED" and T2.1
"PARTIAL". **The actual codebase contradicts this — all items are DONE:**

| Item | Snapshot | ACTUAL (verified in source) |
|------|----------|-----------------------------|
| T1.1 ReactInputConfig | ✅ DONE | ✅ exported (index.ts:98) |
| T1.2 ReactFieldConfig/ReactFormFieldsConfig | ✅ DONE | ✅ exported (index.ts:99-100) |
| T1.3 template fields | ✅ DONE | ✅ |
| T2.1 Form<TFieldValues> + FieldProps<TName> | ⚠️ PARTIAL | ✅ DONE — react README documents both; FormProps<TFieldValues> generic works |
| T2.2 defineInputs | ❌ NOT STARTED | ✅ DONE — `export { defineInputs } from "./overlays"` (index.ts:113); identity helper verified |
| T3.1 FormalityFieldComponentProps | ❌ NOT STARTED | ✅ DONE — exported (index.ts:101); defined in overlays.ts + typeAssertions |
| T3.2 InputConfig<TValue> docs | ✅ DONE | ✅ DONE |

→ **CONCLUSION: all Appendix C items are complete in the actual codebase.** The
README Type Safety section (which already lists all 4) is ACCURATE. Task (d) is
mostly a verification/confirm step; the wording is already correct.

## 9. forwardRef / §20 delivery — handled at package level

- `overlays.ts` JSDoc accurately documents `forwardRef` as RHF's `RefCallBack`
  delivered as a top-level enumerable prop (P2.M2 — DONE in code).
- The **react** README (`## Type Safety → Field component props`) has the full
  forwardRef guidance (wiring, MUI slots, React 19 ref-as-prop).
- The **root** README does NOT mention forwardRef anywhere and does NOT list
  overlays.ts. The root README links to react README for type-safety detail.
→ forwardRef documentation is satisfied at the package level; the root README
  does NOT need a forwardRef section (would duplicate react README). The §20.7
  doc requirement is met by the react package README + overlays.ts JSDoc.

## 10. Critical interaction with P3.M1.T2.S1 (runs FIRST, in P3.M1)

- P3.M1.T2.S1 is a CI-verification + prettier-reformat task. It runs
  `pnpm format` (`prettier --write .`).
- `.prettierignore` does NOT ignore README.md → `pnpm format` WILL reformat
  README.md if it has prettier violations.
- P3.M2.T1.S1 (this task) runs AFTER P3.M1 completes → by the time README is
  edited, `format:check` is green.
- **IMPLICATION:** README edits MUST keep `pnpm format:check` green. Run
  `pnpm format` (or `pnpm prettier --write README.md`) after editing, then
  `pnpm format:check`. This is a binding validation gate.

## 11. `typecheck:examples` scope clarification

- `typecheck:examples` = `tsc -p examples/tsconfig.json --noEmit` → covers the
  `examples/` directory ONLY (01–09 + index.ts). It does NOT type-check README
  code blocks (markdown is not compiled).
- The contract phrase "the README's code examples still compile
  (type-checked via typecheck:examples)" is slightly loose: the binding check
  is that **examples/ still compiles** (it's unchanged by this task) AND that
  any NEW code snippet added to README is type-valid against real signatures
  (validate/mergeConfigs — see §7).
- README edits in this task are: a tree diagram (ASCII), a table note (prose),
  and an architecture note (prose). NO new executable TypeScript is required.
  So typecheck:examples stays green trivially; run it as a no-regression guard.

## 12. Nothing stale to REMOVE

grep for `useFieldDisabledState`, old hook names, `validate(`, `mergeConfigs`
in README.md → only hit is `examples/07...ordering...` (a real example link).
There is no stale mention of removed modules to delete. The work is purely
ADDITIVE (add the 5 deltas to existing sections).
