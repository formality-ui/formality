# P1.M2.T2.S1 — mergeConfigs() design analysis

## Task

Add `mergeConfigs()` — the PRD §1.3.2 headline export for the `config/merge`
module — as a thin wrapper over the existing merge functions. Closes gap G3.

## Existing functions in packages/core/src/config/merge.ts (verified signatures)

```typescript
// L19 — generic deep merge
export function deepMerge<T extends object>(base: T, override: Partial<T> | undefined): T

// L70 — merge provider + form input MAPS (handles function-form form.inputs too)
export function mergeInputConfigs(
  providerInputs: Record<string, InputConfig>,
  formInputs?: FormConfig["inputs"],   // FormConfig["inputs"] = object | function
): Record<string, InputConfig>

// L107 — resolve a SINGLE InputConfig for a type (returns undefined if neither
//        type nor defaultType is registered)
export function resolveInputConfig(
  type: string,
  inputs: Record<string, InputConfig>,
  defaultType: string = "textField",
): InputConfig | undefined

// L128 — derive the type string from component-prop / field-config / default
export function resolveFieldType(
  componentType?: string,
  fieldConfig?: FieldConfig,
  defaultType: string = "textField",
): string    // returns componentType ?? fieldConfig?.type ?? defaultType

// L155 — ordered spread merge of N prop layers (later overrides earlier)
export function mergeStaticProps(
  ...layers: Array<Record<string, unknown> | undefined>
): Record<string, unknown>

// L180 — FULL 9-layer props merge (needs EVALUATED selectProps/selectDefaultFieldProps)
export function mergeFieldProps(options: {
  providerDefaultFieldProps?; providerSelectDefaultFieldProps?;
  formDefaultFieldProps?; formSelectDefaultFieldProps?;
  inputProps?; fieldConfigProps?; selectProps?; componentProps?; coreProps?;
}): Record<string, unknown>
// ⚠️ mergeFieldProps is NOT usable by mergeConfigs: it requires the EVALUATED
//    dynamic layers (selectProps/selectDefaultFieldProps), which need a FormState
//    (expression evaluation). mergeConfigs is a PURE function with no state.
//    => mergeConfigs merges ONLY the STATIC layers via mergeStaticProps.

// L227 — build a ConfigContextValue (the established 2-source wrapper pattern)
export function createConfigContext(
  providerConfig: FormalityProviderConfig,
  formConfig?: FormConfig,   // ← NOTE: form is OPTIONAL here (precedent for mergeConfigs)
): { inputs; formatters; parsers; validators; errorMessages; defaultFieldProps; selectDefaultFieldProps }
```

## Types (packages/core/src/types/config.ts, verified)

```typescript
// L198 — all fields OPTIONAL
interface FormConfig {
  inputs?: Record<string, Partial<InputConfig>> | ((allInputs) => Record<string, Partial<InputConfig>>);
  groups?; defaultFieldProps?: Record<string, unknown>; selectDefaultFieldProps?: SelectValue; title?; selectTitle?;
}

// L235 — inputs REQUIRED, rest optional
interface FormalityProviderConfig {
  inputs: Record<string, InputConfig>;   // REQUIRED
  formatters?; parsers?; validators?; errorMessages?;
  defaultInputTemplate?; inputTemplates?; defaultSubscriptionPropName?;
  defaultFieldProps?: Record<string, unknown>; selectDefaultFieldProps?: SelectValue;
}

// FieldConfig: { type?; label?; title?; disabled?; hidden?; order?; recordKey?;
//   rules?; validator?; props?: Record<string, unknown>; selectProps?; conditions?;
//   subscribesTo?; provideState?; passSubscriptions?; passSubscriptionsAs? }

// InputConfig: { component; defaultValue; debounce?; inputFieldProp?; valueField?;
//   getSubmitField?; parser?; formatter?; validator?; template?; inputTemplate?; props? }
```

## 3 DESIGN DECISIONS (resolved — document prominently in PRP)

### DECISION 1: `form` is OPTIONAL (`form?: FormConfig`), not required
- Contract says `form: FormConfig` (required), but the contract ALSO lists a
  "provider-only" test case — these are in tension if form is required.
- `createConfigContext(providerConfig, formConfig?: FormConfig)` — the SIBLING
  wrapper in the SAME module — already makes form optional. Precedent.
- Every FormConfig field is optional, so "empty form `{}`" ≡ "no form".
- Optional is a strict SUPERSET of required (callers can still pass form);
  does not break the contract's intent; enables provider-only ergonomics.
- ⇒ `mergeConfigs(provider, form?, field?)`.

### DECISION 2: `inputConfig` return type is `InputConfig | undefined`
- Contract says `{ inputConfig: InputConfig }` (non-undefined), but
  `resolveInputConfig(type, inputs)` returns `inputs[type] ?? inputs["textField"]`
  which is GENUINELY `undefined` when the type is unregistered AND no textField
  default exists. mergeConfigs cannot synthesize an InputConfig (component is
  framework-shaped `unknown`; pure core can't fabricate one).
- Casting to `InputConfig` (to satisfy the contract type) is an anti-pattern
  (the sibling PRP P1.M2.T1.S1 explicitly forbids casts). Throwing would make a
  pure convenience wrapper impure/unpredictable.
- ⇒ Honest return: `{ inputConfig: InputConfig | undefined; fieldConfig: FieldConfig }`.
  In practice (well-formed provider with textField registered) it is defined;
  the JSDoc documents when undefined occurs.

### DECISION 3: field-level merge uses `mergeStaticProps` (3 static layers), NOT `mergeFieldProps`
- Contract clause (b) explicitly lists ONLY: provider defaultFieldProps → form
  defaultFieldProps → field config.props. These are the 3 STATIC layers.
- `mergeFieldProps` (the full 9-layer merge) requires EVALUATED selectProps /
  selectDefaultFieldProps — which need FormState (expression evaluation).
  mergeConfigs is pure (no state) and CANNOT evaluate them.
- ⇒ field-level merge = `mergeStaticProps(provider.defaultFieldProps, form?.defaultFieldProps, field?.props)`.
  The result becomes `fieldConfig.props` on a spread of the field config.
- This makes mergeConfigs a STATIC-ONLY convenience wrapper; the granular
  functions (mergeFieldProps, resolveInputConfig, mergeInputConfigs) remain
  available for advanced/dynamic use — exactly as the contract states
  ("the granular functions remain available for advanced use").

## Final design (verified against existing signatures)

```typescript
import type { InputConfig, FieldConfig, FormConfig, FormalityProviderConfig } from "../types";

/**
 * Merge provider + form + (optional) field configs into a resolved
 * { inputConfig, fieldConfig } pair — PRD §1.3.2 headline export.
 * ...JSDoc...
 */
export function mergeConfigs(
  provider: FormalityProviderConfig,
  form?: FormConfig,
  field?: FieldConfig,
): { inputConfig: InputConfig | undefined; fieldConfig: FieldConfig } {
  // (a) Resolve the InputConfig for the field's type.
  //     mergeInputConfigs merges provider.inputs + form.inputs (handles fn form),
  //     resolveFieldType derives the type from the field config (default textField),
  //     resolveInputConfig picks inputs[type] ?? inputs["textField"].
  const mergedInputs = mergeInputConfigs(provider.inputs, form?.inputs);
  const type = resolveFieldType(undefined, field, "textField");
  const inputConfig = resolveInputConfig(type, mergedInputs);

  // (b) Merge the 3 STATIC field-config prop layers (provider → form → field).
  //     Dynamic layers (selectProps / selectDefaultFieldProps) require a FormState
  //     and are NOT merged here — use mergeFieldProps for the full pipeline.
  const fieldConfig: FieldConfig = {
    ...field,
    props: mergeStaticProps(
      provider.defaultFieldProps,
      form?.defaultFieldProps,
      field?.props,
    ),
  };

  return { inputConfig, fieldConfig };
}
```

All three helpers (mergeInputConfigs, resolveFieldType, resolveInputConfig,
mergeStaticProps) are already defined in merge.ts — no new imports beyond the
type block (which already imports InputConfig, FieldConfig, FormConfig,
FormalityProviderConfig at L5-10). Pure delegation; zero new logic branches.

## Barrel placement (verified)

- `packages/core/src/config/index.ts` — `export { deepMerge, mergeInputConfigs,
  resolveInputConfig, resolveFieldType, mergeStaticProps, mergeFieldProps,
  createConfigContext } from "./merge";` → add `mergeConfigs,` FIRST.
- `packages/core/src/index.ts` — "Configuration" block (L117-130): same list
  from "./config" → add `mergeConfigs,` FIRST.

## Test placement (verified)

- `packages/core/src/__tests__/config.test.ts` — imports from `"../index"`;
  structure `describe("Config Module", () => { describe("deepMerge", …) … })`.
  Add sibling `describe("mergeConfigs", () => { … })`. Types InputConfig,
  FieldConfig, FormalityProviderConfig already imported; add FormConfig +
  mergeConfigs to the import lists.
- Cases: provider-only, provider+form, provider+form+field, override priority.

## Parallel-task barrel safety

- Sibling P1.M2.T1.S1 (validate() wrapper) edits the "Validation" block of root
  index.ts (L72-87) + validation barrels. THIS task edits the "Configuration"
  block (L117-130) + config barrels. Disjoint blocks, ~30+ lines apart. No
  conflict; keep both edits at merge.
- P1.M1.T1.S2 (Implementing) may touch the "Labels & Ordering" block (~L133).
  Also disjoint from Configuration. No conflict.

## Validation gates (verified commands)
- `pnpm --filter @formality-ui/core build`
- `pnpm vitest run packages/core/src/__tests__/config.test.ts`
- `pnpm --filter @formality-ui/core test` (full suite, ~1003 tests, no regressions)
- `pnpm typecheck` (root tsc --build — resolves barrels)
- `pnpm lint`
- `pnpm vitest run packages/core/src/__tests__/framework-independence.test.ts`
  (mergeConfigs must have zero framework imports)
