# System Context — Formality v1.0 Spec Compliance

## 1. Project Overview

Formality is a multi-package monorepo form framework built on React Hook Form.
It separates framework-agnostic logic (`@formality-ui/core`) from framework
adapters (`@formality-ui/react`, with `@formality-ui/vue` and
`@formality-ui/svelte` stubbed).

**Current version:** 0.2.5 (per `package.json` + CHANGELOG)
**Target:** v1.0 (full PRD compliance)

## 2. Codebase Maturity Assessment

The codebase is **~95% PRD-complete**. This is NOT a greenfield build — it is a
spec-compliance reconciliation and release-hardening effort.

### Verified Green Baseline (2026-07-13)
| Check | Status |
|-------|--------|
| `pnpm typecheck` (tsc --build) | ✅ Clean |
| `pnpm test` | ✅ 1003 passed, 5 skipped (38 files) |
| `pnpm test:coverage` | ✅ 97.21% stmts / 94.57% branches / 99.11% funcs / 97.21% lines (all >90% gate) |
| `pnpm lint` + `pnpm format:check` | ✅ (CI enforces) |
| CI pipeline | ✅ Full: lint → format → typecheck → typecheck:examples → test:coverage → build |
| Build (tsup) | ✅ Both core + react build cleanly |

### Package Status
| Package | State | Notes |
|---------|-------|-------|
| `@formality-ui/core` | ✅ Substantially complete | Framework-independent (verified: 14/14 independence tests pass; only deps: jsep, jse-eval) |
| `@formality-ui/react` | ✅ Substantially complete | All 5 components + 6 hooks implemented; 1003 tests |
| `@formality-ui/vue` | 🔲 Stubbed | PRD §1.3.5 accepts "Coming soon" placeholder for v1.0 |
| `@formality-ui/svelte` | 🔲 Stubbed | PRD §1.3.5 accepts "Coming soon" placeholder for v1.0 |

## 3. Three-Layer Architecture (PRD §1.1)

```
FormalityProvider (global config: inputs, formatters, parsers, validators, errorMessages)
       ↓
Form (RHF integration, field registry, subscriptions, conditions, auto-save)
       ↓
Field (Controller, props resolution, value transform, condition application)
```

All three layers are **implemented and tested**.

## 4. Key Architectural Patterns (already implemented)

1. **Proxy State Pattern** (§2.1) — `makeProxyState` in `packages/react/src/utils/makeProxyState.ts`; applied to field states and record.
2. **Inverted Subscription Index** (§2.2) — `Map<target, Set<subscriber>>` in Form.
3. **Content-signature memoization** (§2.3) — `useInferredInputs` memoizes on JSON signature to prevent re-render storms.
4. **Dual Context Mapping** (§5.4.1.4) — expression engine provides both qualified (`fields.client.value`) and unqualified (`client`) access via field-state proxies.
5. **forwardRef delivery** (§20) — `Field.tsx:605` delivers `forwardRef: field.ref` as top-level prop (forwardRef-exclusive per §20.4).
6. **8-layer props merge** (§5.3.2 / §6.1) — `mergeFieldProps` in `core/config/merge.ts`.
7. **Scoped auto-save** (§11) — `executeAutoSave` validates only changed + affected fields, with execution-version guard.

## 5. Source File Map (actual current layout)

### @formality-ui/core (`packages/core/src/`)
```
conditions/evaluate.ts    — evaluateConditions, conditionMatches, mergeConditionResults, inferFieldsFromConditions
config/merge.ts           — deepMerge, mergeInputConfigs, resolveInputConfig, mergeStaticProps, mergeFieldProps, createConfigContext
config/defaults.ts        — resolveInitialValue, resolveAllInitialValues, isEmptyValue, getInputDefaultValue, mergeRecordWithDefaults
config/index.ts           — barrel (merge + defaults) — NO ordering
expression/evaluate.ts    — evaluate, evaluateDescriptor, clearExpressionCache
expression/infer.ts       — inferFieldsFromExpression, inferFieldsFromDescriptor
expression/context.ts     — buildFormContext, buildFieldContext, buildEvaluationContext, createFieldStateProxy
labels/resolve.ts         — humanizeLabel, resolveLabel, resolveFormTitle, sortFieldsByOrder, getUnusedFields, getOrderedUnusedFields  ← ordering lives HERE
labels/index.ts           — barrel
transform/pipeline.ts     — parse, format, extractValueField, transformFieldName, createFloatParser/Formatter, createDefaultParsers/Formatters
validation/validate.ts    — runValidator, runValidatorSync, isValid, composeValidators, required, minLength, maxLength, pattern
validation/messages.ts    — resolveErrorMessage, formatTypeAsMessage, createErrorMessages, getErrorType, createValidationError
types/config.ts           — SelectValue, InputConfig, FieldConfig, FormFieldsConfig, GroupConfig, FormConfig, FormalityProviderConfig, InputTemplateProps
types/state.ts            — FieldError, FieldState, FormState
types/conditions.ts       — ConditionDescriptor, ConditionResult
types/validation.ts       — ValidationResult, ValidatorFunction, ValidatorSpec, ValidatorsConfig, ErrorMessagesConfig
types/index.ts            — barrel
```

### @formality-ui/react (`packages/react/src/`)
```
components/Form.tsx              — 961 lines; useForm, subscriptions, auto-save, submit transform
components/Field.tsx             — 702 lines; Controller, props merge, conditions, transform, validation, forwardRef
components/FieldGroup.tsx        — 158 lines; nesting, <span> display:none wrapper
components/FormalityProvider.tsx — 211 lines; ConfigContext provider
components/UnusedFields.tsx      — 86 lines; shouldRegister={false}
hooks/useConditions.ts           — 315 lines; condition eval w/ two-pass disabled logic
hooks/useSubscriptions.ts        — 89 lines; inverted-index subscription mgmt
hooks/usePropsEvaluation.ts      — 270 lines; 3-layer selectDefaultFieldProps eval
hooks/useFormState.ts            — 141 lines; isolated proxy-wrapped state
hooks/useInferredInputs.ts       — 110 lines; signature-stable dep inference
hooks/useFieldDisabledState.ts   — 197 lines; ⚠️ ORPHANED (unexported, unused by Field)
context/FormContext.ts           — FormContextValue
context/ConfigContext.ts         — ConfigContextValue
context/GroupContext.ts          — GroupContextValue
overlays.ts                      — ReactInputConfig, ReactFieldConfig, ReactFormFieldsConfig, FormalityFieldComponentProps, defineInputs
utils/makeProxyState.ts          — makeProxyState, makeDeepProxyState
types.ts                         — InputTemplateProps, CustomFieldState, ExtendedFormState, DebouncedFunction, WatcherSetterFn
```

## 6. Tooling
- **Package manager:** pnpm 8.15.0 (workspace: `packages/*` + `examples`)
- **Build:** tsup (per-package)
- **Test:** vitest 2.x with v8 coverage provider
- **Type checking:** tsc --build (project references)
- **Lint:** eslint 9 + typescript-eslint + eslint-plugin-react/react-hooks
- **Format:** prettier 3
- **Release:** semantic-release (Conventional Commits → shared version for core + react)
- **CI:** `.github/workflows/ci.yml` (verify job) + `.github/workflows/release.yml`
