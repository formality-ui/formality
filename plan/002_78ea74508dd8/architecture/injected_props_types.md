# Injected Props — Runtime Types for `FormalityFieldComponentProps<P>` (R4)

Report-only. Determines the precise runtime types for the three props the PRD
(§5.3.8 / Appendix C T3.1) wants exported: `state`, `formState`, `forwardRef`.
All evidence quoted from `packages/` source + installed `react-hook-form@7.68.0`.

---

## TL;DR — recommended `FormalityFieldComponentProps<P>`

```ts
import type {
  RefCallBack,
  UseFormStateReturn,
  FieldValues,
} from "react-hook-form";
import type { CustomFieldState } from "./types"; // already exported from index.ts

/**
 * Props Formality injects onto every field component. Component authors should
 * destructure `state`, `formState`, `forwardRef` out before forwarding the rest
 * to the underlying DOM input (avoid leaking these to the DOM).
 *
 * @template P - the field component's own props (e.g. TextFieldProps)
 */
export type FormalityFieldComponentProps<P = unknown> = P & {
  /** Subscribed/own field state when provideState/passSubscriptions is on. */
  state?: CustomFieldState | Record<string, CustomFieldState>;
  /** React Hook Form form state threaded from <Controller>. */
  formState?: UseFormStateReturn<FieldValues>;
  /** RHF ref callback (spread as the React `ref` key); wire to the inner input. */
  forwardRef?: RefCallBack;
};
```

> R4 constraint (Appendix C.3 / delta R4): **new export only; no existing API
> changed; runtime unchanged.** The type is exported and reused internally to
> type the Component cast in `Field.tsx:426`. Wiring `state`/`formState` into
> `coreProps` for bare components is a **separate future task** (out of scope
> here) — the type ships the intended contract now.

---

## 1. `formState` → `UseFormStateReturn<FieldValues>`

**Evidence:**

- Field.tsx:13-19 imports `UseFormStateReturn, FieldValues` from `react-hook-form`.
- Field.tsx:393 `Controller render={({ field, fieldState, formState }) => {...}}` — `formState` straight from RHF Controller arg, no transform.
- RHF `controller.d.ts:24-31`: `formState: UseFormStateReturn<TFieldValues>`. Field renders `<Controller>` unparameterized → `TFieldValues = FieldValues`.
- Already typed this way at Field.tsx:82 (`FieldRenderAPI.formState`) and `types.ts:25` (`InputTemplateProps.formState`).

**Delivery today:** reaches templates + render-prop children; NOT in `coreProps`
(bare `<Component>` does not receive it). Type reflects the RHF contract regardless.

## 2. `state` → NOT injected today; intended = `CustomFieldState | Record<string, CustomFieldState>`

**Evidence — NOT injected:**

- Grep `provideState|passSubscriptions|passSubscriptionsAs` in `Field.tsx` → **zero matches**.
- `coreProps` (Field.tsx:413-423) has **no `state` key**; `mergeFieldProps` (merge.ts:180) is plain Object.assign — synthesizes nothing.
- `watchers` (Field.tsx:189) is `Record<string, boolean>` (presence-set), exposed only on `FieldRenderAPI.watchers`, never on the component.

**Evidence — intended contract:**

- Core `FieldConfig` knobs exist (config.ts:146-154): `provideState?`, `passSubscriptions?`, `passSubscriptionsAs?` (default `'state'`, ConfigContext.ts:51).
- `CustomFieldState` (types.ts:30-58): `{ value, isTouched, isDirty, isValidating, error?, invalid }`.
- `examples/07-advanced-features.tsx:67-82` (`provideState:true`) → component reads `state?.isTouched`, `state?.isDirty`, `state?.invalid` → single `CustomFieldState`.
- `examples/07-advanced-features.tsx:84-99` (`passSubscriptions:true`, `passSubscriptionsAs:'subscribedState'`) → component iterates `Object.entries(subscribedState)` → `Record<string, CustomFieldState>`.

**Recommended type:** `state?: CustomFieldState | Record<string, CustomFieldState>`
(union honest about both shapes; consumer disambiguates by which config flag they set).

> **Scope note for R4:** shipping the type is in-scope; **building the runtime
> injection** (populate `coreProps.state` from `methods.getFieldState(name)` +
> subscribed-fields proxy map) is a **follow-up**, explicitly out of scope for
> this delta (runtime unchanged). The plumbing exists (`makeProxyState`,
> `usePropsEvaluation.ts:127-152` builds `Record<string, CustomFieldState>`).

## 3. `forwardRef` → RHF `RefCallBack`

**Evidence:**

- Field.tsx:421 `coreProps.ref = field.ref`; Field.tsx:451 `<Component {...finalProps} />` spreads it as the React-special `ref` key.
- RHF `controller.d.ts:14-18`: `ref: RefCallBack`; RHF `form.d.ts:125`: `type RefCallBack = (instance: any) => void`.
- Precise runtime type = `RefCallBack` (`(instance: any) => void`) — NOT `Ref<any>`, NOT RHF's `RefCallback` (note spelling: RHF uses `RefCallBack` capital B).

**Prior research** (`plan/001/.../react_forwardref_best_practices.md`,
`react_forwardref_research_P1M1T1S7.md`):

- React 19 deprecates `forwardRef` (refs become a normal `ref` prop). Field already spreads `ref` → forward-compatible.
- Established test-component pattern: `forwardRef<HTMLInputElement, P>(({...}, ref) => <input ref={ref} ... />)` with `displayName`.
- `FieldProps` already has `[key: string]: unknown` so spread props survive.

**Recommended type:** `forwardRef?: RefCallBack` (precise — exactly what RHF
hands Field). `RefCallBack` is callable, so the MUI v9 `slotProps={{ input: { ref: forwardRef } }}`
pattern (PRD §5.3.8) works cleanly at the call site. Document that pattern in JSDoc.

**⚠️ Naming mismatch (flag, NOT resolved in R4):** at runtime Field spreads this
as `ref` (React-special). The PRD/consumer `WithFormality` names the prop
`forwardRef`. R4 is type-only (runtime unchanged), so the type uses
`forwardRef` (matching PRD/consumer intent) but the runtime still delivers via
the `ref` key. To make plain function components receive it as `forwardRef` (no
`React.forwardRef` wrap), Field.tsx would need `coreProps.forwardRef = field.ref`
— a **future runtime task**, out of R4 scope. JSDoc should note this.

## 4. What R4 (T3.1) must do (precise, minimal)

1. **Add** `FormalityFieldComponentProps<P>` to `packages/react/src/overlays.ts`
   (or a new small module re-exported alongside overlays) with the three props
   above + JSDoc (destructure-before-forward guidance; MUI v9 `slotProps` note;
   the `ref`-vs-`forwardRef` runtime caveat).
2. **Export** it from `packages/react/src/index.ts` (type export, overlays section).
3. **Reuse internally:** type the Component cast in `Field.tsx:426` — e.g.
   `const Component = inputConfig.component as React.ComponentType<FormalityFieldComponentProps>;`
   (keeps the type in sync with reality by construction; no behavior change).
4. Re-export `UseFormStateReturn`, `FieldValues`, `RefCallBack` from
   `react-hook-form` (via `@formality-ui/react`) so consumers don't need a
   direct RHF import — OR rely on consumers already importing RHF types.
5. **Constraints:** type-only; runtime unchanged; no existing API changed; new export only.

## 5. Sources of truth

| Prop                   | Source                             | file:line                                                                 |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `formState` type       | RHF `controller.d.ts`              | :24-31; Field.tsx:13-19,82; types.ts:25                                   |
| `state` intended shape | core config knobs + examples       | config.ts:146-154; ConfigContext.ts:51; types.ts:30-58; examples/07:67,84 |
| `forwardRef` type      | RHF `controller.d.ts`, `form.d.ts` | :14-18, :125; Field.tsx:421,451                                           |
