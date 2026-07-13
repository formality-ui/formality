// @formality-ui/react - Field Component
// Thin wrapper over `useField` (RHF Controller integration lives in the hook)

import { useEffect, type ReactNode } from "react";
import type {
  ControllerFieldState,
  UseFormStateReturn,
  FieldValues,
} from "react-hook-form";
import type { InputConfig } from "@formality-ui/core";
import { useFormContext } from "../context/FormContext";
import { useField } from "../hooks/useField";

/**
 * Field component props.
 *
 * `FieldProps` is generic over the field `name`:
 * `FieldProps<TName extends string = string>`. The default `TName = string`
 * means `<Field name={anyString} />` compiles unchanged (no migration) and a
 * bare `FieldProps` is identical to `FieldProps<string>`.
 *
 * To get compile-time checking of the field name, narrow `TName` explicitly —
 * e.g. `FieldProps<"name" | "email">` or a wrapper that threads a
 * `keyof ClientValues & string`. With a narrowed `TName`, a typo like
 * `name="ofice"` is rejected at compile time instead of silently rendering
 * nothing (the second half of PRD §C.4 / T2.1's "silent no-op" fix).
 *
 * Automatic per-form narrowing — where a `<Field>` automatically narrows its
 * `name` against the enclosing `<Form<TFieldValues>>`'s key set — is a planned
 * follow-up (PRD §C.4 T2.1) and is explicitly deferrable.
 *
 * @example
 * ```tsx
 * // Default usage — any string name compiles (unchanged behavior):
 * <Field name="email" />;
 *
 * // Opt-in strict usage — typo names are compile errors:
 * type Names = "name" | "email";
 * const props: FieldProps<Names> = { name: "email" };
 * ```
 */
export interface FieldProps<TName extends string = string> {
  /**
   * Field name (must match a key in Form's config).
   *
   * When `FieldProps` is narrowed (e.g. `FieldProps<"name" | "email">`), the
   * name is checked against `TName` at compile time. With the default
   * (`FieldProps` / `FieldProps<string>`), any string is accepted.
   */
  name: TName;

  /** Override the input type from config */
  type?: string;

  /** Override disabled state */
  disabled?: boolean;

  /** Override hidden state (inverse of visible) */
  hidden?: boolean;

  /** Custom render function for advanced use cases */
  children?: ReactNode | ((api: FieldRenderAPI) => ReactNode);

  /** Whether to register this field in Form's field registry (default: true) */
  shouldRegister?: boolean;

  /** Override input config for this field (e.g., debounce setting) */
  inputConfig?: Partial<InputConfig>;

  /** Additional props to pass to the input component */
  [key: string]: unknown;
}

/**
 * API passed to render function children
 */
export interface FieldRenderAPI {
  /** React Hook Form field state */
  fieldState: ControllerFieldState;

  /** The rendered input component */
  renderedField: ReactNode;

  /** Final merged props passed to input */
  fieldProps: Record<string, unknown>;

  /** Map of fields watching this field */
  watchers: Record<string, boolean>;

  /** React Hook Form form state */
  formState: UseFormStateReturn<FieldValues>;
}

/**
 * Field component - Thin wrapper over {@link useField}.
 *
 * The RHF Controller integration (props resolution / 8-layer merge, conditions,
 * parse/format, validation, forwardRef delivery, template/host rendering,
 * render-prop `children` application) lives in the {@link useField} hook
 * (PRD §1.3.3 / §5.3 / §20). This component owns ONLY:
 * - the form-registry registration `useEffect` (`registerField`/
 *   `unregisterField`, gated on `shouldRegister`) — contract bullet b; and
 * - delegating to `useField(params)` and returning its `renderedField`.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Field name="email" />
 *
 * // Override type
 * <Field name="status" type="select" />
 *
 * // Custom render
 * <Field name="name">
 *   {({ renderedField, fieldState }) => (
 *     <div className={fieldState.error ? "has-error" : ""}>
 *       {renderedField}
 *     </div>
 *   )}
 * </Field>
 * ```
 */
export function Field<TName extends string = string>({
  name,
  type: typeProp,
  disabled: disabledProp,
  hidden: hiddenProp,
  children,
  shouldRegister = true,
  inputConfig: inputConfigProp,
  ...restProps
}: FieldProps<TName>): JSX.Element | null {
  const { registerField, unregisterField } = useFormContext();

  // === REGISTRATION === (owned by Field per contract bullet b)
  useEffect(() => {
    if (shouldRegister) {
      registerField(name);
      return () => unregisterField(name);
    }
  }, [name, shouldRegister, registerField, unregisterField]);

  // Delegate the entire Controller lifecycle to useField (PRD §1.3.3 / §20).
  const { renderedField } = useField({
    name,
    type: typeProp,
    disabled: disabledProp,
    hidden: hiddenProp,
    children,
    inputConfig: inputConfigProp,
    ...restProps,
  });

  return renderedField as JSX.Element | null;
}
