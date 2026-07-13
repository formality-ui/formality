// @formality-ui/react - useField Hook
// RHF Controller integration for a single Field (contract + stub — S1)

import type { ReactNode } from "react";
import type {
  ControllerFieldState,
  UseFormStateReturn,
  FieldValues,
} from "react-hook-form";
import type { InputConfig } from "@formality-ui/core";

/**
 * Parameters for {@link useField}.
 *
 * Mirrors the subset of `FieldProps` (in `../components/Field`) that the hook
 * will consume once the Controller integration logic is extracted out of
 * `Field.tsx` in **P2.M1.T1.S2** (gap_analysis.md **G6**).
 *
 * Per PRD §1.3.3, `hooks/useField` is the module that owns **RHF Controller
 * integration** for a field — "Uses Core: transform/pipeline, validation/
 * validate". This interface is the **input contract** for that module: it
 * carries the field identity + the overrides + the passthrough props the real
 * implementation will thread into the parse/format pipeline (§5.3.5), change
 * handler (§5.3.6), validation wiring (§5.3.7), forwardRef delivery (§20.1),
 * and template/host rendering (§5.3.8).
 *
 * Generic over `TName` (default `string`) so a narrowed name type from
 * `FieldProps<TName>` can be threaded straight through (PRD §C.4 / T2.1). The
 * default keeps a bare `UseFieldParams` identical to `UseFieldParams<string>`,
 * so S1 is non-breaking.
 *
 * @template TName - Field name literal/union type (default `string`).
 */
export interface UseFieldParams<TName extends string = string> {
  /**
   * Field name (must match a key in Form's config). When `TName` is narrowed,
   * this is checked against `TName` at compile time.
   */
  name: TName;

  /** Override the input type resolved from config. */
  type?: string;

  /**
   * Override disabled state. Highest priority in the §5.3.4 disabled
   * resolution (prop > condition > config).
   */
  disabled?: boolean;

  /** Override hidden state (inverse of visible). */
  hidden?: boolean;

  /**
   * Whether to register this field in Form's field registry (default `true`).
   */
  shouldRegister?: boolean;

  /**
   * Per-field input-config override. Merged at the highest-priority layer over
   * provider/form config (e.g. per-field debounce). See `resolveInputConfig`.
   */
  inputConfig?: Partial<InputConfig>;

  /**
   * Optional render-prop. **Passed through** to the Field component, which
   * applies it against this hook's {@link UseFieldReturn} at the render layer
   * (§5.3.8). The hook itself returns the RAW
   * {@link UseFieldReturn.renderedField}; render-prop application is NOT done
   * inside the hook (getting this backwards breaks S3 behavioral parity).
   */
  children?: ReactNode | ((api: UseFieldReturn) => ReactNode);

  /**
   * Additional props forwarded to the input component (the 8-layer
   * `componentProps` merge layer, §5.3.2). Captured by `mergeFieldProps` in the
   * real implementation.
   */
  [key: string]: unknown;
}

/**
 * Return value of {@link useField}.
 *
 * **Structurally identical** to `FieldRenderAPI` (in `../components/Field`) —
 * the data the render layer (template / host / render-prop `children`) consumes.
 * This equivalence is enforced bidirectionally by
 * `__typechecks__/useField.test-d.ts`; S2/S3 may later alias
 * `type FieldRenderAPI = UseFieldReturn`.
 *
 * Per PRD §1.3.3, the hook owns the RHF Controller integration, so the fields
 * below are exactly the Controller-produced state the render layer needs:
 * `fieldState` + `formState` come from the Controller render callback;
 * `renderedField` is the RAW rendered input (template/component/host);
 * `fieldProps` is the final 8-layer-merged props (§5.3.2, via `mergeFieldProps`);
 * `watchers` is the map of fields currently watching this field (§5.3.1 step 3).
 */
export interface UseFieldReturn {
  /**
   * RHF field state from the Controller render callback
   * (`invalid` / `isTouched` / `isDirty` / `error` / …).
   */
  fieldState: ControllerFieldState;

  /**
   * The RAW rendered input (template / component / host element). **NOT**
   * children-applied — the Field component applies the render-prop `children`
   * against this return value at the render layer (§5.3.8).
   */
  renderedField: ReactNode;

  /**
   * Final merged props passed to the input — the output of the 8-layer
   * `mergeFieldProps` pipeline (§5.3.2).
   */
  fieldProps: Record<string, unknown>;

  /**
   * Map of fields watching this field (`true` = currently subscribed). Populated
   * via the watcher-setter registered with `useSubscriptions` (§5.3.1 step 3).
   */
  watchers: Record<string, boolean>;

  /**
   * RHF form state from the Controller. Typed as `UseFormStateReturn<FieldValues>`
   * to match `FieldRenderAPI` exactly (NOT bare `UseFormStateReturn`).
   */
  formState: UseFormStateReturn<FieldValues>;
}

/**
 * useField — **STUB (design step only).**
 *
 * This is the public hook contract for **PRD §1.3.3** module
 * `hooks/useField` — "RHF Controller integration — Uses Core: transform/
 * pipeline, validation/validate". It is the single seam through which a Field
 * will (once implemented) own the entire Controller lifecycle.
 *
 * ## Responsibilities (deferred to P2.M1.T1.S2)
 *
 * The real implementation will compose, per PRD §1.3.3 + §5.3.x + §20:
 * - **Controller integration** — wrap RHF's `<Controller>` render callback.
 * - **Parse/format pipeline (§5.3.5)** — Core `parse` / `format` from
 *   `@formality-ui/core` (`transform/pipeline`).
 * - **Change handler (§5.3.6)** — `changeField` + watcher fan-out.
 * - **Validation (§5.3.7)** — Core `runValidator` / `resolveErrorMessage`
 *   (`validation/validate`).
 * - **forwardRef delivery (§20.1)** — deliver the input's ref via the merged
 *   props' `forwardRef` key (the CURRENT implemented behavior — NOT the legacy
 *   `ref` key shown in the stale §5.3.2 pseudo-code).
 * - **Props merge (§5.3.2)** — `resolveInputConfig` + `resolveLabel` +
 *   `mergeFieldProps` (the 8-layer merge).
 * - **Template/host render (§5.3.8)** — produce the RAW `renderedField`.
 *
 * It will consume these context hooks (`useFormContext`, `useConfigContext`,
 * `useGroupContext`) and composed hooks (`useConditions`, `usePropsEvaluation`,
 * `useInferredInputs`, `useSubscriptions`), and the Core fns above.
 *
 * ## Current state — NOT IMPLEMENTED
 *
 * All of that logic **currently lives INLINE in `Field.tsx`** (the Controller
 * render block). Extraction into this hook is tracked in gap_analysis.md **G6**
 * (STRUCTURAL — Medium, decision: **extract**) and lands in **P2.M1.T1.S2**.
 * S1 (this file) lands ONLY the type contract + this throwing stub so S2 has a
 * fixed, reviewed target and S3 has an explicit shape to assert parity against.
 *
 * The stub is intentionally NOT wired into `Field.tsx` and NOT exported from the
 * public barrel (`packages/react/src/index.ts`) — a throwing stub in the public
 * barrel would expose an unimplemented API.
 *
 * @param _params - Field parameters (see {@link UseFieldParams}). Underscored
 *   because the stub does not read it.
 * @returns Never — always throws (see {@link UseFieldReturn} for the contract).
 * @throws {Error} Always — "useField is not implemented yet …".
 *
 * @example
 * ```tsx
 * // Intended S2 usage (NOT available yet — stub throws today):
 * const { fieldState, renderedField, fieldProps, watchers, formState } =
 *   useField({ name: "email" });
 * ```
 */
export function useField(_params: UseFieldParams): UseFieldReturn {
  throw new Error(
    "useField is not implemented yet. The RHF Controller integration currently " +
      "lives inline in Field.tsx; extraction into this hook is tracked in " +
      "gap_analysis.md G6 / PRD §1.3.3 and lands in P2.M1.T1.S2.",
  );
}
