# Implementation Guide: 8-Layer Prop Priority Tests

**Task:** P1.M1.T3.S3 - Test 8-layer priority order
**Date:** 2025-01-11
**Estimated Time:** 4 weeks (41 tests)

## Overview

This guide provides step-by-step instructions for implementing comprehensive tests for the 8-layer prop priority system in the Formality library.

## Prerequisites

### Required Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Project Structure

```
packages/react/src/
├── __tests__/
│   ├── helpers/
│   │   ├── test-components.tsx       # Mock components
│   │   ├── test-renderers.tsx        # Custom render functions
│   │   ├── test-assertions.ts        # Assertion helpers
│   │   └── test-factories.ts         # Data factories
│   ├── Field.test.tsx                # Existing tests
│   ├── selectDefaultFieldProps.test.tsx  # Existing tests
│   └── propPriority.test.tsx         # NEW: Priority tests
└── components/
    ├── Field.tsx
    └── Form.tsx
```

---

## Phase 1: Setup and Helpers (Week 1, Days 1-2)

### Step 1: Create Test Helper Directory

```bash
mkdir -p packages/react/src/__tests__/helpers
```

### Step 2: Create Test Components

File: `packages/react/src/__tests__/helpers/test-components.tsx`

```typescript
import React, { forwardRef } from "react";

// Test input with all common props
export interface TestInputProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
  placeholder?: string;
  className?: string;
  size?: string;
  variant?: string;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

export const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  (
    {
      value,
      onChange,
      disabled,
      label,
      error,
      name,
      placeholder,
      className,
      size,
      variant,
      required,
      readOnly,
      autoComplete,
      style,
      ...props
    },
    ref
  ) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}
        data-testid={name}
        data-size={size}
        data-variant={variant}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        required={required}
        readOnly={readOnly}
        autoComplete={autoComplete}
        style={style}
        {...props}
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  )
);

TestInput.displayName = "TestInput";

// Test switch component
export interface TestSwitchProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

export const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(
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
  )
);

TestSwitch.displayName = "TestSwitch";
```

### Step 3: Create Test Inputs Config

File: `packages/react/src/__tests__/helpers/test-inputs.ts`

```typescript
import { InputConfig } from "@formality-ui/core";
import { TestInput, TestSwitch } from "./test-components";

export const testInputs: Record<string, InputConfig> = {
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

### Step 4: Create Custom Render Function

File: `packages/react/src/__tests__/helpers/test-renderers.tsx`

```typescript
import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { FormalityProvider } from "../../components/FormalityProvider";
import { Form } from "../../components/Form";
import { Field } from "../../components/Field";
import type { FormFieldsConfig } from "@formality-ui/core";
import { testInputs } from "./test-inputs";

interface FormalityTestOptions {
  providerProps?: Record<string, unknown>;
  formProps?: Record<string, unknown>;
  fieldProps?: Record<string, unknown>;
  config?: FormFieldsConfig;
  renderOptions?: Omit<RenderOptions, "wrapper">;
}

export function renderFormalityTest({
  providerProps = {},
  formProps = {},
  fieldProps = {},
  config = { test: { type: "textField" } },
  renderOptions = {},
}: FormalityTestOptions) {
  const ui = (
    <FormalityProvider inputs={testInputs} {...providerProps}>
      <Form config={config} {...formProps}>
        <Field name="test" {...fieldProps} />
      </Form>
    </FormalityProvider>
  );

  return {
    ...render(ui, renderOptions),
    // Return helpers for easy access
    getTestInput: () => render(ui, renderOptions).getByTestId("test"),
  };
}
```

### Step 5: Create Assertion Helpers

File: `packages/react/src/__tests__/helpers/test-assertions.ts`

```typescript
import { screen } from "@testing-library/react";

export function assertProps(
  testId: string,
  props: Record<string, unknown>
): void {
  const element = screen.getByTestId(testId);

  Object.entries(props).forEach(([key, value]) => {
    switch (key) {
      case "className":
        if (Array.isArray(value)) {
          value.forEach((cls) => expect(element).toHaveClass(cls));
        } else {
          expect(element).toHaveClass(value as string);
        }
        break;

      case "disabled":
        value
          ? expect(element).toBeDisabled()
          : expect(element).not.toBeDisabled();
        break;

      case "required":
        value
          ? expect(element).toBeRequired()
          : expect(element).not.toBeRequired();
        break;

      case "readOnly":
        value
          ? expect(element).toHaveAttribute("readonly")
          : expect(element).not.toHaveAttribute("readonly");
        break;

      case "style":
        Object.entries(value as Record<string, string>).forEach(
          ([styleKey, styleValue]) => {
            expect((element as HTMLElement).style[styleKey as any]).toBe(
              styleValue
            );
          }
        );
        break;

      case "data-size":
        expect(element).toHaveAttribute("data-size", value as string);
        break;

      case "data-variant":
        expect(element).toHaveAttribute("data-variant", value as string);
        break;

      case "placeholder":
        expect(element).toHaveAttribute("placeholder", value as string);
        break;

      case "autoComplete":
        expect(element).toHaveAttribute("autocomplete", value as string);
        break;

      case "value":
        expect(element).toHaveAttribute("value", value as string);
        break;

      default:
        if (typeof value === "boolean") {
          expect(element).toHaveAttribute(key, value.toString());
        } else if (value !== undefined) {
          expect(element).toHaveAttribute(key, value as string);
        }
    }
  });
}
```

---

## Phase 2: Single Layer Tests (Week 1, Days 3-5)

### Test File Structure

File: `packages/react/src/__tests__/propPriority.test.tsx`

```typescript
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderFormalityTest, assertProps } from "./helpers/test-renderers";
import { testInputs } from "./helpers/test-inputs";

describe("8-Layer Prop Priority System", () => {
  beforeEach(() => {
    // Reset any global state
    vi.clearAllMocks();
  });
});
```

### Layer 1: providerDefaultFieldProps

```typescript
describe("Layer 1: providerDefaultFieldProps", () => {
  it("should apply providerDefaultFieldProps", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: {
          size: "small",
          variant: "outlined",
          className: "provider-class",
        },
      },
    });

    assertProps("test", {
      "data-size": "small",
      "data-variant": "outlined",
      className: "provider-class",
    });
  });

  it("should apply to all fields when set at provider level", () => {
    const { getByTestId } = render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ className: "all-fields" }}
      >
        <Form config={{ field1: { type: "textField" } }}>
          <Field name="field1" />
          <Field name="field2" />
          <Field name="field3" />
        </Form>
      </FormalityProvider>
    );

    expect(getByTestId("field1")).toHaveClass("all-fields");
    expect(getByTestId("field2")).toHaveClass("all-fields");
    expect(getByTestId("field3")).toHaveClass("all-fields");
  });

  it("should deep merge nested objects", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: {
          style: { color: "red", fontSize: "14px" },
        },
      },
    });

    const element = screen.getByTestId("test");
    expect(element.style.color).toBe("red");
    expect(element.style.fontSize).toBe("14px");
  });
});
```

### Layer 2: providerSelectDefaultFieldProps

```typescript
describe("Layer 2: providerSelectDefaultFieldProps", () => {
  it("should override providerDefaultFieldProps", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: { size: "small" },
        selectDefaultFieldProps: { size: "medium" },
      },
    });

    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "medium");
  });

  it("should evaluate expressions", async () => {
    const config = {
      toggle: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{
          className: "toggle ? 'enabled' : 'disabled'",
        }}
      >
        <Form config={config}>
          <Field name="toggle" />
          <Field name="target" />
        </Form>
      </FormalityProvider>
    );

    // Initial state
    expect(screen.getByTestId("target")).toHaveClass("disabled");

    // Toggle
    const user = userEvent.setup();
    await user.click(screen.getByTestId("toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveClass("enabled");
    });
  });
});
```

### Complete Single Layer Tests Template

```typescript
const layerTests = [
  {
    layer: 1,
    name: "providerDefaultFieldProps",
    providerProp: "defaultFieldProps",
    formProp: undefined,
  },
  {
    layer: 2,
    name: "providerSelectDefaultFieldProps",
    providerProp: "selectDefaultFieldProps",
    formProp: undefined,
  },
  {
    layer: 3,
    name: "formDefaultFieldProps",
    providerProp: undefined,
    formProp: "defaultFieldProps",
  },
  {
    layer: 4,
    name: "formSelectDefaultFieldProps",
    providerProp: undefined,
    formProp: "selectDefaultFieldProps",
  },
  {
    layer: 5,
    name: "inputProps",
    providerProp: undefined,
    formProp: undefined,
    fieldProp: "inputProps",
  },
  {
    layer: 6,
    name: "fieldConfigProps",
    providerProp: undefined,
    formProp: undefined,
    fieldProp: "props",
  },
  {
    layer: 7,
    name: "selectProps",
    providerProp: undefined,
    formProp: undefined,
    fieldProp: "selectProps",
  },
  {
    layer: 8,
    name: "componentProps",
    providerProp: undefined,
    formProp: undefined,
    fieldProp: undefined, // Passed directly to Field
  },
];

layerTests.forEach(({ layer, name }) => {
  describe(`Layer ${layer}: ${name}`, () => {
    it(`should apply ${name}`, () => {
      // Implementation based on layer
    });

    it(`should be overrideable by higher layers`, () => {
      // Test that next layer can override
    });

    it(`should override lower layers`, () => {
      // Test that current layer overrides previous
    });
  });
});
```

---

## Phase 3: Adjacent Layer Tests (Week 2, Days 1-3)

```typescript
describe("Adjacent Layer Priority", () => {
  const adjacentTests = [
    {
      name: "L2 overrides L1",
      lower: { layer: 1, prop: "size", value: "L1" },
      higher: { layer: 2, prop: "size", value: "L2" },
      expected: "L2",
    },
    {
      name: "L3 overrides L2",
      lower: { layer: 2, prop: "size", value: "L2" },
      higher: { layer: 3, prop: "size", value: "L3" },
      expected: "L3",
    },
    {
      name: "L4 overrides L3",
      lower: { layer: 3, prop: "size", value: "L3" },
      higher: { layer: 4, prop: "size", value: "L4" },
      expected: "L4",
    },
    {
      name: "L5 overrides L4",
      lower: { layer: 4, prop: "size", value: "L4" },
      higher: { layer: 5, prop: "size", value: "L5" },
      expected: "L5",
    },
    {
      name: "L6 overrides L5",
      lower: { layer: 5, prop: "size", value: "L5" },
      higher: { layer: 6, prop: "size", value: "L6" },
      expected: "L6",
    },
    {
      name: "L7 overrides L6",
      lower: { layer: 6, prop: "size", value: "L6" },
      higher: { layer: 7, prop: "size", value: "L7" },
      expected: "L7",
    },
    {
      name: "L8 overrides L7",
      lower: { layer: 7, prop: "size", value: "L7" },
      higher: { layer: 8, prop: "size", value: "L8" },
      expected: "L8",
    },
  ];

  adjacentTests.forEach(({ name, lower, higher, expected }) => {
    it(name, () => {
      // Implement test based on layer configuration
      // Verify that 'higher' overrides 'lower'
      expect(screen.getByTestId("test")).toHaveAttribute(
        "data-size",
        expected
      );
    });
  });
});
```

---

## Phase 4: Skip Layer Tests (Week 2, Days 4-5)

```typescript
describe("Skip Layer Priority", () => {
  it("L3 overrides L1 (skipping L2)", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: { size: "L1" },
        // L2 not set
      },
      formProps: {
        formConfig: {
          defaultFieldProps: { size: "L3" },
        },
      },
    });

    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "L3");
  });

  it("L5 overrides L2 (skipping L3, L4)", () => {
    renderFormalityTest({
      providerProps: {
        selectDefaultFieldProps: { size: "L2" },
      },
      formProps: {
        // L3, L4 not set
      },
      fieldProps: {
        inputProps: { size: "L5" },
      },
    });

    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "L5");
  });

  it("L8 overrides L3 (skipping L4-L7)", () => {
    renderFormalityTest({
      formProps: {
        formConfig: {
          defaultFieldProps: { size: "L3" },
        },
      },
      fieldProps: {
        componentProps: { size: "L8" },
      },
    });

    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "L8");
  });
});
```

---

## Phase 5: Merge Behavior Tests (Week 3, Day 1)

```typescript
describe("Merge Behavior", () => {
  it("should deep merge nested objects", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: {
          style: { color: "red", fontSize: "14px" },
        },
      },
      formProps: {
        formConfig: {
          defaultFieldProps: {
            style: { fontWeight: "bold" },
          },
        },
      },
    });

    const element = screen.getByTestId("test");
    expect(element.style.color).toBe("red");
    expect(element.style.fontSize).toBe("14px");
    expect(element.style.fontWeight).toBe("bold");
  });

  it("should replace arrays instead of merging", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: {
          classes: ["provider-class"],
        },
      },
      formProps: {
        formConfig: {
          defaultFieldProps: {
            classes: ["form-class"],
          },
        },
      },
    });

    const element = screen.getByTestId("test");
    expect(element).not.toHaveClass("provider-class");
    expect(element).toHaveClass("form-class");
  });

  it("should merge different properties from all layers", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: { size: "small" },
        selectDefaultFieldProps: { variant: "outlined" },
      },
      formProps: {
        formConfig: {
          defaultFieldProps: { className: "form-class" },
          selectDefaultFieldProps: { placeholder: "enter text" },
        },
      },
      fieldProps: {
        inputProps: { autoComplete: "on" },
        fieldConfigProps: { required: true },
        selectProps: { readOnly: false },
      },
    });

    const element = screen.getByTestId("test");
    expect(element).toHaveAttribute("data-size", "small");
    expect(element).toHaveAttribute("data-variant", "outlined");
    expect(element).toHaveClass("form-class");
    expect(element).toHaveAttribute("placeholder", "enter text");
    expect(element).toHaveAttribute("autocomplete", "on");
    expect(element).toHaveAttribute("required");
  });

  it("should override same properties based on priority", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: { size: "L1" },
        selectDefaultFieldProps: { size: "L2" },
      },
      formProps: {
        formConfig: {
          defaultFieldProps: { size: "L3" },
          selectDefaultFieldProps: { size: "L4" },
        },
      },
      fieldProps: {
        inputProps: { size: "L5" },
        fieldConfigProps: { size: "L6" },
        selectProps: { size: "L7" },
        componentProps: { size: "L8" },
      },
    });

    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "L8");
  });
});
```

---

## Phase 6: Dynamic Layer Tests (Week 3, Days 2-4)

```typescript
describe("Dynamic Layer Evaluation", () => {
  describe("Layer 2: providerSelectDefaultFieldProps", () => {
    it("should evaluate expressions", async () => {
      const config = {
        toggle: { type: "switch" },
        target: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          selectDefaultFieldProps={{
            className: "toggle ? 'on' : 'off'",
          }}
        >
          <Form config={config}>
            <Field name="toggle" />
            <Field name="target" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId("target")).toHaveClass("off");

      const user = userEvent.setup();
      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(screen.getByTestId("target")).toHaveClass("on");
      });
    });

    it("should re-evaluate on dependency changes", async () => {
      const config = {
        counter: { type: "textField", defaultValue: "0" },
        target: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          selectDefaultFieldProps={{
            className: "counter > 5 ? 'high' : 'low'",
          }}
        >
          <Form config={config}>
            <Field name="counter" />
            <Field name="target" />
          </Form>
        </FormalityProvider>
      );

      expect(screen.getByTestId("target")).toHaveClass("low");

      const user = userEvent.setup();
      const counter = screen.getByTestId("counter");
      await user.clear(counter);
      await user.type(counter, "10");

      await waitFor(() => {
        expect(screen.getByTestId("target")).toHaveClass("high");
      });
    });
  });

  describe("Layer 4: formSelectDefaultFieldProps", () => {
    // Similar tests for form-level dynamic props
  });

  describe("Layer 7: selectProps", () => {
    // Similar tests for field-level dynamic props
  });
});
```

---

## Phase 7: Edge Cases (Week 4, Days 1-3)

```typescript
describe("Edge Cases", () => {
  it("handles undefined layers", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: undefined,
        selectDefaultFieldProps: undefined,
      },
      formProps: {
        formConfig: {
          defaultFieldProps: undefined,
          selectDefaultFieldProps: undefined,
        },
      },
    });

    expect(screen.getByTestId("test")).toBeInTheDocument();
  });

  it("handles null values", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: { size: null },
      },
    });

    // Should handle null gracefully
    expect(screen.getByTestId("test")).toBeInTheDocument();
  });

  it("handles empty objects", () => {
    renderFormalityTest({
      providerProps: {
        defaultFieldProps: {},
        selectDefaultFieldProps: {},
      },
      formProps: {
        formConfig: {
          defaultFieldProps: {},
          selectDefaultFieldProps: {},
        },
      },
    });

    expect(screen.getByTestId("test")).toBeInTheDocument();
  });

  it("handles function callbacks", () => {
    let callCount = 0;

    renderFormalityTest({
      providerProps: {
        selectDefaultFieldProps: () => {
          callCount++;
          return { className: "callback" };
        },
      },
    });

    expect(callCount).toBeGreaterThan(0);
    expect(screen.getByTestId("test")).toHaveClass("callback");
  });

  it("handles frozen objects", () => {
    const frozenProps = Object.freeze({ size: "frozen" });

    renderFormalityTest({
      providerProps: {
        defaultFieldProps: frozenProps,
      },
    });

    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "frozen");
  });

  it("handles Symbol properties", () => {
    const symbol = Symbol("test");
    const props: Record<string, unknown> = { size: "test" };
    props[symbol] = "symbol-value";

    renderFormalityTest({
      providerProps: {
        defaultFieldProps: props,
      },
    });

    // Symbol properties should be handled
    expect(screen.getByTestId("test")).toHaveAttribute("data-size", "test");
  });
});
```

---

## Phase 8: Performance Tests (Week 4, Days 4-5)

```typescript
describe("Performance", () => {
  it("handles rapid prop changes without memory leaks", async () => {
    const config = {
      field: { type: "textField" },
    };

    const { unmount } = render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ className: "test" }}
      >
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    const user = userEvent.setup();
    const input = screen.getByTestId("field");

    // Rapid changes
    for (let i = 0; i < 100; i++) {
      await user.clear(input);
      await user.type(input, `value-${i}`);
    }

    // Should not crash or cause memory issues
    expect(screen.getByTestId("field")).toBeInTheDocument();

    unmount();
  });

  it("only re-evaluates affected layers", async () => {
    let providerEvalCount = 0;
    let formEvalCount = 0;
    let fieldEvalCount = 0;

    const config = {
      toggle: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={() => {
          providerEvalCount++;
          return { className: "provider" };
        }}
      >
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: () => {
              formEvalCount++;
              return { variant: "form" };
            },
          }}
        >
          <Field
            name="target"
            selectProps={() => {
              fieldEvalCount++;
              return { size: "field" };
            }}
          />
        </Form>
      </FormalityProvider>
    );

    // Initial evaluation
    expect(providerEvalCount).toBe(1);
    expect(formEvalCount).toBe(1);
    expect(fieldEvalCount).toBe(1);

    // Trigger re-evaluation
    const user = userEvent.setup();
    await user.click(screen.getByTestId("toggle"));

    await waitFor(() => {
      // All dynamic layers should re-evaluate
      expect(providerEvalCount).toBeGreaterThan(1);
      expect(formEvalCount).toBeGreaterThan(1);
      expect(fieldEvalCount).toBeGreaterThan(1);
    });
  });
});
```

---

## Running the Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test propPriority
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Run in Watch Mode

```bash
npm test -- --watch
```

### Run with UI

```bash
npm test -- --ui
```

---

## Coverage Targets

### Minimum Coverage Requirements

- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

### Coverage Configuration

File: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/__tests__/**",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

---

## Continuous Integration

### GitHub Actions Workflow

File: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

---

## Checklist

### Phase 1: Setup
- [ ] Create test helpers directory
- [ ] Create test components
- [ ] Create test inputs config
- [ ] Create custom render function
- [ ] Create assertion helpers
- [ ] Verify helpers work with existing tests

### Phase 2: Single Layer Tests
- [ ] Layer 1: providerDefaultFieldProps (3 tests)
- [ ] Layer 2: providerSelectDefaultFieldProps (3 tests)
- [ ] Layer 3: formDefaultFieldProps (3 tests)
- [ ] Layer 4: formSelectDefaultFieldProps (3 tests)
- [ ] Layer 5: inputProps (3 tests)
- [ ] Layer 6: fieldConfigProps (3 tests)
- [ ] Layer 7: selectProps (3 tests)
- [ ] Layer 8: componentProps (3 tests)

### Phase 3: Adjacent Layer Tests
- [ ] L2 > L1 (1 test)
- [ ] L3 > L2 (1 test)
- [ ] L4 > L3 (1 test)
- [ ] L5 > L4 (1 test)
- [ ] L6 > L5 (1 test)
- [ ] L7 > L6 (1 test)
- [ ] L8 > L7 (1 test)

### Phase 4: Skip Layer Tests
- [ ] L3 > L1 (1 test)
- [ ] L5 > L2 (1 test)
- [ ] L7 > L4 (1 test)
- [ ] L8 > L3 (1 test)
- [ ] More skip combinations (2 tests)

### Phase 5: Merge Behavior Tests
- [ ] Deep merge nested objects (1 test)
- [ ] Replace arrays (1 test)
- [ ] Merge different properties (1 test)
- [ ] Override same properties (1 test)

### Phase 6: Dynamic Layer Tests
- [ ] L2 expression evaluation (2 tests)
- [ ] L2 re-evaluation (2 tests)
- [ ] L4 expression evaluation (2 tests)
- [ ] L4 re-evaluation (2 tests)
- [ ] L7 expression evaluation (2 tests)
- [ ] L7 re-evaluation (2 tests)

### Phase 7: Edge Cases
- [ ] Undefined layers (1 test)
- [ ] Null values (1 test)
- [ ] Empty objects (1 test)
- [ ] Function callbacks (1 test)
- [ ] Frozen objects (1 test)
- [ ] Symbol properties (1 test)
- [ ] More edge cases (2 tests)

### Phase 8: Performance Tests
- [ ] Rapid changes (1 test)
- [ ] Re-evaluation efficiency (1 test)

### Final Tasks
- [ ] Review all tests
- [ ] Update documentation
- [ ] Set up CI/CD
- [ ] Verify coverage targets
- [ ] Create test report

---

**Total Tests:** 41
**Estimated Time:** 4 weeks
**Status:** Ready for implementation

**Document Version:** 1.0.0
**Last Updated:** 2025-01-11
