# Test Harness & Coverage — Current State (forwardRef Delta)

Repo root: `/home/dustin/projects/formality`. This report is read-only: it documents
the *exact* current state of the test harness touched by the Formality `forwardRef`
delta. No changes are proposed.

## Files Retrieved
1. `packages/react/src/__tests__/Field.test.tsx` (lines 1-1831) — main Field component test file; contains `TestInput`, `TestSwitch`, the shared `testInputs` registry, and the full `describe("Field")` suite.
2. `packages/react/src/__tests__/FormalityFieldComponentProps.test.tsx` (lines 1-57, whole file) — type-level smoke test for `FormalityFieldComponentProps`; contains `SmokeField`.
3. `vitest.config.ts` (whole file) — root-level coverage config.
4. `vitest.workspace.ts` (whole file) — workspace project list.
5. `package.json` (whole file) — test/coverage scripts.
6. `packages/react/src/overlays.ts` (lines 144-189) — `FormalityFieldComponentProps` type def + runtime-caveat JSDoc (read for cross-reference only).

---

## 1. `Field.test.tsx` — TestInput / TestSwitch

### TestInput (lines 27-42) — wrapped with `React.forwardRef`, ref via SECOND arg

Imports `forwardRef` at line 2: `import React, { forwardRef } from "react";`

```tsx
// Line 16-25: props interface
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
  [key: string]: unknown;
}

// Lines 27-42 — VERBATIM
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}
        data-testid={name}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        {...props}
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);

TestInput.displayName = "TestInput";  // line 44
```

Confirmed: `forwardRef<HTMLInputElement, TestInputProps>((props, ref) => ...)`. The
`ref` is read as the **second argument** and wired to the `<input ref={ref} />`.

### TestSwitch (lines 55-67) — wrapped with `React.forwardRef`, ref via SECOND arg

```tsx
// Lines 47-53: props interface
interface TestSwitchProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

// Lines 55-67 — VERBATIM
const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      data-testid={name}
      checked={value ?? false}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={disabled}
      {...props}
    />
  ),
);

TestSwitch.displayName = "TestSwitch";  // line 69
```

Confirmed: same forwardRef shape — `ref` is the **second arg**, wired to `<input ref={ref} />`.

### `testInputs` registry (lines 72-82)

```tsx
const testInputs: Record<string, InputConfig> = {
  textField: {
    component: TestInput,
    defaultValue: "",
  },
  switch: {
    component: TestSwitch,
    defaultValue: false,
  },
};
```

### Focus-on-error / ref-wiring assertions?

**No.** A repo-wide grep across `packages/react/src/__tests__` for
`focus|\.ref\b|focusOn|autoFocus|scrollIntoView` returned **zero** matches in
`Field.test.tsx` or `FormalityFieldComponentProps.test.tsx`. (The single match was
`render-isolation.test.tsx:181`, unrelated to focus-on-error.)

There is **no test that asserts focus moves to an input on validation error**, and
**no test that inspects the actual ref object** that Formality's `Field` passes
through. `ref={ref}` in `TestInput`/`TestSwitch` exists only to make the components
ref-compatible; nothing in the suite reads back the ref or checks focus.

### Test harness mounting pattern

Every test mounts through the real component stack via `@testing-library/react`'s
`render`:

```tsx
render(
  <FormalityProvider inputs={testInputs}>
    <Form config={{ name: { type: "textField" } }}>
      <Field name="name" />
    </Form>
  </FormalityProvider>,
);
```

- `FormalityProvider` (imported line 9 from `../components/FormalityProvider`) wraps
  with `inputs={testInputs}` (the registry above).
- `Form` (imported line 6 from `../components/Form`) receives a `config` of
  `FormFieldsConfig` and optionally `record`, `defaultValues`, or `formConfig`.
- `Field` (imported line 7 from `../components/Field`) renders the configured input.
- Render-prop variant: `<Form>{({ methods }) => ...}</Form>` and
  `<Field name="...">{({ fieldState, renderedField, watchers, fieldProps }) => ...}</Field>`.

### `describe`/`it` block inventory (top-level `describe("Field", ...)`)

Nested `describe` groups and representative `it()` titles (6 are `.skip`):

- **rendering** — "should render the configured component"; "should resolve label from config"; "should auto-generate label from field name when not specified"; "should not render when hidden prop is true"; "should not render when field config has hidden: true"; "should use component prop label over config label".
- **conditions** — "should render field with conditions array"; "should support visible condition in config"; 'should support "is" condition type in config'.
- **selectProps** — "should evaluate selectProps expressions"; "should update selectProps when referenced field changes".
- **value transformation** — "should apply parser on change"; "should apply formatter for display".
- **validation** — "should run field-level validator on blur"; "should clear error when validation passes".
- **disabled prop override** — "should use disabled prop over condition result"; "should use disabled prop to force disable".
- **JSX disabled prop highest priority - ALL sources active** — 4 `it()` blocks.
- **Config disabled priority - second highest after JSX prop** — 5 `it()` blocks.
- **Conditions disabled priority - third highest after JSX prop and config** — active: "should disable when condition={true}…", "should enable when condition={false}…", "should prioritize config disabled={false}…", "should prioritize JSX disabled={false}…", "should re-evaluate condition when dependency field value changes", "should use AND logic for multi-field when conditions". **Skipped (6 total `.skip` in file):** "should reference isDisabled matcher from other field"; "should handle circular dependencies without infinite loops"; (nested `describe("two-field isDisabled conditions")`) "should disable result when both source fields are disabled"; "should not disable result when only one source field is disabled"; "should re-evaluate when source field disabled states change"; "should work with field state matchers in object when".
- **multi-field isDisabled with mixed matchers** — 5 `it()` blocks.
- **render prop** — "should pass field API to render function"; "should provide fieldProps to render function"; "should update touched state after blur".
- **shouldRegister prop** — "should register field by default"; "should not register field when shouldRegister={false}".
- **type override** — "should use type prop over config type".
- **Coverage backfill (PRP P1.M2.T1.S4) — regions F1–F11:** `config-less fields and type defaults (F1/F2)`, `form-level inputs overrides (F3/F4)`, `unknown-type fallback (F5)`, `set conditions (F6/F7)`, `FieldGroup disabled propagation (F8)`, `type-level validator (F10)`, `template rendering and render props (F11)`.

---

## 2. `FormalityFieldComponentProps.test.tsx` — SmokeField

Whole file is 57 lines. `SmokeField` is a **plain function component** typed by
`ComponentType<FormalityFieldComponentProps<SmokeProps>>`. It is **NOT** wrapped with
`React.forwardRef`. It reads `forwardRef` from destructured `props` and wires it to
the inner `<input>` via `ref={forwardRef as React.Ref<HTMLInputElement> | undefined}`.

```tsx
// Lines 1-9 — VERBATIM (imports)
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import type { FormalityFieldComponentProps } from "../overlays";

interface SmokeProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

// Lines 15-41 — VERBATIM
// Representative consumer component: strips state/formState/forwardRef out
// before spreading the rest onto the underlying <input>.
const SmokeField: ComponentType<FormalityFieldComponentProps<SmokeProps>> = ({
  state,
  formState,
  forwardRef,
  ...domProps
}) => (
  <input
    aria-label={(domProps as { label?: string }).label ?? "field"}
    // forwardRef is a RefCallBack; wiring it here is fine.
    ref={forwardRef as React.Ref<HTMLInputElement> | undefined}
    value={(domProps as { value?: string }).value ?? ""}
    onChange={(e) =>
      (domProps as { onChange?: (v: string) => void }).onChange?.(
        e.target.value,
      )
    }
    data-touched={
      state && "isTouched" in state ? String(state.isTouched) : "n/a"
    }
    data-formstate={formState ? "present" : "absent"}
  />
);

describe("FormalityFieldComponentProps", () => {
  it("renders a representative component typed by FormalityFieldComponentProps", () => {
    render(<SmokeField label="name" value="abc" onChange={() => {}} />);
    expect(screen.getByLabelText("name")).toHaveValue("abc");
    expect(screen.getByLabelText("name")).toHaveAttribute(
      "data-touched",
      "n/a",
    );
  });
});
```

### Findings

- **SmokeField does NOT render through `<Field>`.** It is rendered **directly** as a
  plain element: `render(<SmokeField label="name" value="abc" onChange={() => {}} />)`.
  No `FormalityProvider`, `Form`, or `Field` appears in this file.
- It destructures `state`, `formState`, `forwardRef` out of props (demonstrating the
  "destructure-before-forwarding" contract) and spreads the rest.
- It **asserts**: the rendered input has value `"abc"` and `data-touched="n/a"`
  (because no `state` is passed). It does **not** assert that `forwardRef` is actually
  delivered by Field at runtime — it only demonstrates the type-level contract and
  that destructuring `forwardRef` out does not break rendering. The comment on line 25
  notes `forwardRef` is a `RefCallBack` and "wiring it here is fine", but the test
  never passes a ref in.
- Per `overlays.ts` lines 167-174 (the "Runtime caveat"): today `Field` delivers the
  RHF ref via the React-special `ref` key (NOT a top-level `forwardRef` prop). A plain
  function component like `SmokeField` reading `props.forwardRef` will receive
  **`undefined`** unless wrapped with `React.forwardRef` (which is exactly why
  `TestInput`/`TestSwitch` use `forwardRef` instead).

---

## 3. Coverage config

### `vitest.config.ts` (repo root) — VERBATIM (whole file)

```ts
import { defineConfig, coverageConfigDefaults } from "vitest/config";

// Root-level vitest config. The per-package configs (referenced by
// vitest.workspace.ts) define WHAT runs in each project; this root config
// holds cross-cutting settings — in particular coverage, which vitest resolves
// against the workspace root (`ctx.config.root`), not the individual project
// roots. See PRD §1.3.7.
//
// Note: setting `coverage.exclude` REPLACES vitest's defaults rather than
// extending them, so we spread `coverageConfigDefaults.exclude` first and then
// add the PRD §1.3.7 out-of-scope directories.
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      exclude: [
        ...coverageConfigDefaults.exclude,
        // PRD §1.3.7 — out of scope: demo apps and stubbed adapters.
        "examples/**",
        "packages/svelte/**",
        "packages/vue/**",
        // vitest's default `dist/**` is root-anchored; this also catches nested
        // package build output (e.g. packages/*/dist/**).
        "**/dist/**",
      ],
      // Hard gate — CI fails (exit 1) if any of these drop below 90%. PRD §1.3.7.
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
```

### Confirmation against criteria

- **Provider:** `v8` ✅
- **`coverage.exclude` includes** (after spreading vitest defaults): `examples/**` ✅,
  `packages/svelte/**` ✅, `packages/vue/**` ✅, `**/dist/**` ✅.
- **Thresholds:** all four (`statements`, `branches`, `functions`, `lines`) set to
  `90` ✅. Note (per comment): these are a **hard gate** — CI exits 1 if any drops
  below 90.

### `vitest.workspace.ts` — VERBATIM

```ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/core/vitest.config.ts",
  "packages/react/vitest.config.ts",
]);
```

Only `core` and `react` projects run. `svelte`/`vue` are excluded from the workspace
entirely (and additionally excluded from coverage).

---

## 4. Test run command (root `package.json`)

`scripts` block (lines 11-26):

```json
"scripts": {
  "build": "pnpm -r build",
  "dev": "pnpm -r --parallel dev",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "typecheck": "tsc --build",
  "typecheck:examples": "tsc -p examples/tsconfig.json --noEmit",
  "lint": "eslint .",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "clean": "pnpm -r exec rm -rf dist",
  "release": "semantic-release",
  "release:dry": "semantic-release --dry-run"
}
```

- **Test:** `pnpm test` → `vitest run` ✅ (single, non-watch run across the workspace).
- **Coverage:** `pnpm test:coverage` → `vitest run --coverage` ✅ (applies the
  root-level coverage config with the 90% hard gate).
- **Watch:** `pnpm test:watch` → `vitest` (interactive).

Relevant devDeps for the harness: `@vitest/coverage-v8@^2.0.0`, `vitest@^2.0.0`,
`typescript@^5.5.0`, `tsup@^8.0.0`. `packageManager`: `pnpm@8.15.0`.

---

## Architecture

- **Workspace = two projects** (`core`, `react`) declared in `vitest.workspace.ts`.
  Each project has its own `vitest.config.ts`; the **root** `vitest.config.ts` owns
  cross-cutting coverage only (vitest resolves coverage against the workspace root,
  per its comment quoting `ctx.config.root`).
- **Coverage excludes are additive on top of vitest defaults** — the file spreads
  `coverageConfigDefaults.exclude` before adding the four PRD §1.3.7 exclusions, so
  default excludes (e.g. `**/*.config.*`, `coverage/**`, `**/*.d.ts`) are retained.
- **Test harness shape:** all Field tests go through the real component tree
  (`FormalityProvider` → `Form` → `Field`). The two ref-bearing test components
  (`TestInput`, `TestSwitch`) are `React.forwardRef`-wrapped so they receive the
  React-special `ref` key — this is the path that actually works today per
  `overlays.ts` §"Runtime caveat".
- **Type-only smoke harness** (`SmokeField`) demonstrates the *intended* injected-props
  contract (`forwardRef` as a top-level prop) but is rendered in isolation (no
  `Field`), so it cannot catch a runtime regression in how `Field` delivers the ref.

## Start Here

Open `packages/react/src/__tests__/Field.test.tsx` lines **16-69** (props interfaces +
`TestInput` + `TestSwitch`) — these are the two ref-bearing consumer components whose
shape the forwardRef delta must keep passing. Then read
`packages/react/src/__tests__/FormalityFieldComponentProps.test.tsx` lines **15-41**
(`SmokeField`) for the *alternative* shape (plain component reading `props.forwardRef`)
that the delta may need to make work at runtime. Cross-reference with
`packages/react/src/overlays.ts` lines **162-174** (the documented "Runtime caveat")
to confirm whether the delta is meant to close that caveat.

## Supervisor coordination

None needed — read-only scouting task, no decisions or ambiguity. All five target
files were present and read in full.
