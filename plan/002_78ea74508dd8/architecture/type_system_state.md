# Type System State — Current Inventory (verified)

Report-only. Exact current reality at the touch points the type-safety delta
(R2/R3/R4) must modify. All file:line refs from `packages/`.

---

## 1. `packages/react/src/overlays.ts` (84 lines) — the overlay module

Imports `ComponentType` (react), `RegisterOptions, FieldValues` (react-hook-form),
`InputConfig, FieldConfig` (core), `InputTemplateProps` (./types).

### `ReactInputConfig<TValue>` — overlays.ts:42-49

```ts
export interface ReactInputConfig<TValue = unknown> extends Omit<
  InputConfig<TValue>,
  "component" | "template"
> {
  component: ComponentType<any>; // T1.1 DONE
  template?: ComponentType<InputTemplateProps>; // T1.3 DONE
}
```

### `ReactFieldConfig<V>` — overlays.ts:61-65

```ts
export interface ReactFieldConfig<
  V extends FieldValues = FieldValues,
> extends Omit<FieldConfig, "rules"> {
  rules?: RegisterOptions<V>; // T1.2 DONE
}
```

### `ReactFormFieldsConfig<V>` — overlays.ts:72-76 ← **R2 GAP**

```ts
export type ReactFormFieldsConfig<V extends FieldValues = FieldValues> = Record<
  string, // ← UNBOUNDED; should be Extract<keyof V, string>
  ReactFieldConfig<V>
>;
```

**Gap (R2):** key set is `string`, so `<Form<ClientValues> config={{ ofice: ... }}>`
compiles. Target: `Record<Extract<keyof V, string>, ReactFieldConfig<V>>`. When
`V = FieldValues` (default), `Extract<keyof FieldValues, string>` collapses to
`string` → identical to today (non-breaking).

## 2. `packages/react/src/components/Form.tsx`

### `FormProps<TFieldValues>` — Form.tsx:43-71 (key field)

```ts
export interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  children: ReactNode | ((api: FormRenderAPI<TFieldValues>) => ReactNode);
  config: ReactFormFieldsConfig<TFieldValues>; // ← inherits the string-key gap (Form.tsx:48)
  formConfig?: FormConfig;
  onSubmit?: (values: Partial<TFieldValues>) => void | Promise<void>;
  record?: Partial<TFieldValues>;
  autoSave?: boolean;
  debounce?: number | false;
  validate?: (
    values: Partial<TFieldValues>,
  ) => Record<string, string> | Promise<Record<string, string>>;
}
```

- `Form` function: `Form.tsx:130` `export function Form<TFieldValues ...>({` ; `:139` `}: FormProps<TFieldValues>): JSX.Element {`.
- `FormRenderAPI<TFieldValues>` — Form.tsx:74-85 (unusedFields, formState, methods, resolvedTitle).
- Internal: `Form.tsx:715` `config: FormFieldsConfig,` in `transformValuesForSubmit<T>` — uses **core** `FormFieldsConfig` (default `string`), NOT the overlay. Leave as-is (helper is internal).

## 3. `packages/react/src/components/Field.tsx` ← **R2 GAP (FieldProps)**

### `FieldProps` — Field.tsx:40-66 (non-generic today)

```ts
export interface FieldProps {
  // ← NOT generic
  name: string; // ← R2 target: name: TName
  type?: string;
  disabled?: boolean;
  hidden?: boolean;
  children?: ReactNode | ((api: FieldRenderAPI) => ReactNode);
  shouldRegister?: boolean;
  inputConfig?: Partial<InputConfig>;
  [key: string]: unknown; // index signature — arbitrary props pass through
}
```

- `FieldRenderAPI` — Field.tsx:69-85 (non-generic; `formState: UseFormStateReturn<FieldValues>`).
- Destructure: `Field.tsx:115-124` `function Field({ name, type: typeProp, ... restProps }: FieldProps): JSX.Element | null`.
- `fieldConfig: FieldConfig = config[name] ?? {}` — Field.tsx:132 (plain core type).

**R2 target:** `interface FieldProps<TName extends string = string> { name: TName; ... }`.
Default `TName = string` keeps `<Field name={anyString} />` compiling unchanged.
Additive — keep the index signature.

## 4. `packages/react/src/index.ts` — export surface

Re-exports core types; exports context, components (`Form/Field/FieldGroup/UnusedFields/FormalityProvider` + their prop types), utilities (`makeProxyState`, `makeDeepProxyState`), hooks, and the **React Type Overlays** section (last):

```ts
export type {
  ReactInputConfig,
  ReactFieldConfig,
  ReactFormFieldsConfig,
} from "./overlays";
```

**R3/R4 slot:** `defineInputs` (R3) and `FormalityFieldComponentProps` (R4) join
this overlays section. `defineInputs` is a **value** export (function), the others
are **type** exports. Grep confirms NONE of `defineInputs`,
`FormalityFieldComponentProps`, `WithFormality`, `FormalityInjectedProps` exist
anywhere in `packages/`.

## 5. Field.tsx render layer — Field.tsx:393-460 (relevant to R4)

`Controller render={({ field, fieldState, formState }) => {...}}`. Constructs:

```ts
const finalProps = mergeFieldProps({
  providerDefaultFieldProps: providerConfig.defaultFieldProps,
  providerSelectDefaultFieldProps: providerSelectProps,
  formDefaultFieldProps: formConfig.defaultFieldProps,
  formSelectDefaultFieldProps: formSelectProps,
  inputProps: inputConfig.props,
  fieldConfigProps: fieldConfig.props,
  selectProps: fieldSelectProps,
  componentProps: restProps,
  coreProps: {
    name,
    label,
    disabled: isDisabled,
    error: fieldState.error?.message,
    [inputConfig.inputFieldProp ?? "value"]: formattedValue,
    onChange: handleChange(field.onChange),
    onBlur: field.onBlur,
    ref: field.ref,
  }, // ← ref = field.ref (RHF RefCallBack)
});
const Component = inputConfig.component as React.ComponentType<any>; // Field.tsx:426 — cast discards prop typing
// template path: <TemplateComponent Field={Component} fieldProps={finalProps} fieldState={fieldState} formState={formState} />
// direct path:   <Component {...finalProps} />
```

- `formState` reaches templates + render-prop children, **NOT** bare `<Component>` (not in coreProps).
- `state` is **NOT** injected (`provideState`/`passSubscriptions` config knobs exist in core `FieldConfig` but are unconsumed in Field.tsx).
- `ref` (= `field.ref`, RHF `RefCallBack`) IS in coreProps, spread as the React-special `ref` key.

See `architecture/injected_props_types.md` for the precise types R4 should use.

## 6. `packages/core/src/config/merge.ts` — `mergeFieldProps` (merge.ts:155-211)

```ts
export function mergeFieldProps(options: { providerDefaultFieldProps?, ...,
  componentProps?, coreProps? }): Record<string, unknown>
```

Returns untyped `Record<string, unknown>` bag (shallow `mergeStaticProps` Object.assign). Used by Field.tsx; lives in **core** (framework-agnostic). R4 does **not** change this — it types the Component cast in Field.tsx.

## 7. `packages/core/src/types/config.ts` — core generics

- `FormFieldsConfig<TName extends string = string> = Record<TName, FieldConfig>` (config.ts:130-133) — **already key-generic**. R2 closes the gap only on the **react overlay** side.
- `FieldConfig.rules?: Record<string, unknown>` (config.ts:140-156) — loose by design; overlay narrows.
- `provideState?`/`passSubscriptions?`/`passSubscriptionsAs?` (config.ts:146-154) — declared, unconsumed at runtime.

## 8. Confirmed gaps table

| Touch point                                 | Current                                              | Target                                  | Req    |
| ------------------------------------------- | ---------------------------------------------------- | --------------------------------------- | ------ |
| `ReactFormFieldsConfig<V>` (overlays.ts:72) | `Record<string, ...>`                                | `Record<Extract<keyof V, string>, ...>` | R2     |
| `FormProps.config` (Form.tsx:48)            | inherits string-key gap                              | rejects unknown keys                    | R2     |
| `FieldProps` (Field.tsx:40)                 | non-generic `name: string`                           | `FieldProps<TName=string>`              | R2     |
| `Field.tsx:426` Component cast              | `as React.ComponentType<any>`                        | reuse `FormalityFieldComponentProps`    | R4     |
| `index.ts` overlays section                 | no `defineInputs`, no `FormalityFieldComponentProps` | export both                             | R3, R4 |
