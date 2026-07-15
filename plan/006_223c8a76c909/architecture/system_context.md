# System Context — Formality Codebase State

## Overview

Formality is a **declarative form logic layer** built on React Hook Form, architected as a
multi-package monorepo. The PRD is a complete specification for v1.0; the codebase is
**extremely mature** — the vast majority of PRD sections are already implemented, tested
(1085 tests passing), and meet a 90% coverage gate.

## Package Architecture (§1.3)

```
packages/
├── core/    — @formality-ui/core    — Zero framework deps (jsep, jse-eval, lodash-es only)
├── react/   — @formality-ui/react   — React/RHF implementation (primary)
├── vue/     — @formality-ui/vue     — STUBBED
└── svelte/  — @formality-ui/svelte  — STUBBED
```

**Import rule enforcement**: Core has zero React/RHF imports. Verified by
`packages/core/src/__tests__/framework-independence.test.ts`.

## What Is ALREADY IMPLEMENTED (Mature)

| PRD Section | Status | Key Files |
|---|---|---|
| §1.3 Package Architecture | ✅ Done | Monorepo, pnpm workspace |
| §1.3.7 Testing (90% gate) | ✅ Done | `vitest.config.ts`, `vitest.workspace.ts` |
| §2 Performance (Proxy Pattern) | ✅ Done | `react/src/utils/makeProxyState.ts` |
| §2.2 Inverted Subscription Index | ✅ Done | `Form.tsx` (invertedSubscriptions ref) |
| §2.3 Memoization | ✅ Done | All critical points memoized |
| §3 Type System | ✅ Done | `core/src/types/config.ts` |
| §3.2.1 React Overlay Types | ✅ Done | `react/src/overlays.ts` |
| §3.3-3.4 Provider/Form Config | ✅ Done | Types in core |
| §4 Context System | ✅ Done | `react/src/context/{Form,Config,Group}Context.ts` |
| §5 Expression Engine | ✅ Done | `core/src/expression/{evaluate,context,infer}.ts` |
| §5.1 FormalityProvider | ✅ Done | `react/src/components/FormalityProvider.tsx` |
| §5.2 Form Component | ✅ Done | `react/src/components/Form.tsx` |
| §5.3 Field Component | ✅ Done | `react/src/hooks/useField.tsx` (Controller lifecycle) |
| §5.4 FieldGroup | ✅ Done | `react/src/components/FieldGroup.tsx` |
| §5.5 UnusedFields | ✅ Done | `react/src/components/UnusedFields.tsx` |
| §6.1-6.3 Config System | ✅ Done | `core/src/config/{merge,defaults,ordering}.ts` |
| §8 Conditions System | ✅ Done | `core/src/conditions/evaluate.ts` |
| §9 Subscription System | ✅ Done | `react/src/hooks/useSubscriptions.ts` |
| §10 Validation System | ✅ Done | `core/src/validation/{validate,messages}.ts` |
| §11 Value Transformation | ✅ Done | `core/src/transform/pipeline.ts` |
| §12 Auto-Save System | ✅ Done | `Form.tsx` (scoped validation, version tracking) |
| §13 FieldGroup Mechanics | ✅ Done | Nesting, state accumulation |
| §14 Initial Value Resolution | ✅ Done | `core/src/config/defaults.ts` (but MISSING field-level default) |
| §15 Field Ordering | ✅ Done | `core/src/config/ordering.ts` |
| §16 Label Resolution | ✅ Done | `core/src/labels/resolve.ts` (humanizeLabel) |
| §17 Props Evaluation | ✅ Done | `react/src/hooks/usePropsEvaluation.ts` |
| §19 Edge Cases | ✅ Done | Mount order, pending queue, etc. |
| §20 forwardRef Delivery | ✅ Done | `useField.tsx` delivers `forwardRef` as regular prop |
| Appendix C: T1.1-T3.2 | ✅ Done | All overlay types, defineInputs, FormalityFieldComponentProps |

## THE PRIMARY GAP — §6.4 Field-Level Overrides

**This is the only significant unimplemented feature in the PRD.**

The PRD §6.4 specifies that `FieldConfig` should mirror six "levers" that currently only
exist on `InputConfig`, allowing per-field-instance overrides of type-level behavior:

| Lever | InputConfig (type-level) | FieldConfig (field-level) | Resolution Rule |
|---|---|---|---|
| `defaultValue` | `inputConfig.defaultValue` | `fieldConfig.defaultValue` | **NEW priority tier** (below record, above type) |
| `debounce` | `inputConfig.debounce` | `fieldConfig.debounce` | Field → type → Form-level `debounce` prop |
| `parser` | `inputConfig.parser` | `fieldConfig.parser` | `fieldConfig ?? inputConfig` |
| `formatter` | `inputConfig.formatter` | `fieldConfig.formatter` | `fieldConfig ?? inputConfig` |
| `getSubmitField` | `inputConfig.getSubmitField` | `fieldConfig.getSubmitField` | `fieldConfig ?? inputConfig` |
| `valueField` | `inputConfig.valueField` | `fieldConfig.valueField` | `fieldConfig ?? inputConfig` |

### Single Precedence Rule (§6.4.0)

All six implement **one** rule via a core helper `resolveFieldOverType`:
> The field-level value wins over the type-level value when it is **not `undefined`** —
> so `null`, `false`, `0`, and `""` are *meaningful* overrides/defaults.

```typescript
export function resolveFieldOverType<T>(
  fieldVal: T | undefined,
  typeVal: T | undefined,
): T | undefined {
  return fieldVal !== undefined ? fieldVal : typeVal;
}
```

**This helper does NOT exist yet.** It is not exported from core.

### Override vs Compose (§6.4 — intentional asymmetry)

- The six new levers: **OVERRIDE** (single value, field wins)
- `validator`: **COMPOSE** (field runs, then type runs — already implemented in §10)
- `props`: **MERGE** (layered spread — already implemented in §5.3.2/§16)

### Specific Code Locations That Need Changes

1. **`packages/core/src/types/config.ts`** — `FieldConfig` interface lacks the six fields
2. **`packages/core/src/config/defaults.ts`** — No `resolveFieldOverType`; `resolveInitialValue`
   jumps from record (Priority 2) to inputConfig.defaultValue (Priority 3) — missing the
   fieldConfig.defaultValue tier between them
3. **`packages/react/src/components/Form.tsx`** — `changeField` uses `inputConfig?.debounce`
   but not `config[name]?.debounce`
4. **`packages/react/src/hooks/useField.tsx`** — `handleChange` uses `inputConfig.parser`/
   `inputConfig.formatter` but not field-level overrides
5. **`packages/react/src/components/Form.tsx`** — `transformValuesForSubmit` uses
   `inputConfig.getSubmitField`/`inputConfig.valueField` but not field-level overrides

### React Overlay Type (§3.2.1)

`ReactFieldConfig` extends `FieldConfig` with only `rules` overridden:
```typescript
export interface ReactFieldConfig<V extends FieldValues = FieldValues>
  extends Omit<FieldConfig, "rules"> {
  rules?: RegisterOptions<V>;
}
```

The six new field-level fields will automatically be inherited from the updated `FieldConfig`.
No structural change needed to `ReactFieldConfig` — only JSDoc updates.

## External Dependencies

- **React Hook Form (RHF)** — `react-hook-form` — Form state management, Controller, validation
- **jsep / jse-eval** — Expression parsing and evaluation (used by core's expression engine)
- **lodash-es** — `debounce` function for auto-save
- **tsup** — Build tooling
- **vitest** — Testing framework with coverage
- **typescript** — Type checking

## Key Architectural Patterns

1. **Core/Adapter split**: Pure logic in `@formality-ui/core`, React-specific glue in
   `@formality-ui/react`. Every core function is a pure function with zero framework deps.
2. **Type overlay pattern**: Core types use `unknown` for framework-shaped fields; React
   overlay types (`ReactInputConfig`, `ReactFieldConfig`) narrow them to precise types.
3. **Proxy state pattern** (§2.1): `makeProxyState` creates lazy getter objects to prevent
   unnecessary re-renders when expression evaluation accesses field state properties.
4. **Inverted subscription index** (§2.2): `Map<target, Set<subscriber>>` for O(1) subscriber
   lookup on field change.
5. **Content-signature memoization** (§2.3): `useInferredInputs` memoizes on `JSON.stringify`
   of inputs to maintain referential stability across renders.
