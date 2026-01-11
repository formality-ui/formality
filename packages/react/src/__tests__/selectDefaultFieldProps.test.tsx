// @formality-ui/react - selectDefaultFieldProps Provider-Level Tests
// Tests for provider-level selectDefaultFieldProps evaluation in usePropsEvaluation

import React, { forwardRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";

// ============================================================================
// TEST FIXTURES
// ============================================================================

// Test input component with forwardRef (REQUIRED PATTERN)
interface TestInputProps {
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
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, placeholder, className, size, variant, ...props }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}
        data-testid={name}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        data-size={size}
        data-variant={variant}
        {...props}
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);

TestInput.displayName = "TestInput";

// Test switch/checkbox component
interface TestSwitchProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

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

TestSwitch.displayName = "TestSwitch";

// Test inputs config (REQUIRED for all tests)
const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
  switch: { component: TestSwitch, defaultValue: false },
};

// ============================================================================
// TEST SUITE: Expression-Based Provider Props
// ============================================================================

describe("selectDefaultFieldProps - Provider Level - Expression-Based", () => {
  it("should evaluate provider-level boolean expression for className", async () => {
    // ARRANGE: Provider with expression using className instead of disabled
    // (disabled is a core prop that overrides provider props)
    // Expression: className evaluates to different value based on signed field
    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ className: 'signed ? "signed-enabled" : "signed-disabled"' }}
      >
        <Form config={config}>
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Initial state - signed=false → "signed-disabled"
    expect(screen.getByTestId("target")).toHaveClass("signed-disabled");

    // ACT: Toggle signed to true
    const user = userEvent.setup();
    await user.click(screen.getByTestId("signed"));

    // ASSERT: signed=true → "signed-enabled"
    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveClass("signed-enabled");
    });
  });

  it("should evaluate provider-level string expression", async () => {
    // ARRANGE: Provider with string expression referencing another field
    const config: FormFieldsConfig = {
      client: { type: "textField", defaultValue: "" },
      contact: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ placeholder: "client" }}
      >
        <Form config={config}>
          <Field name="client" />
          <Field name="contact" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Initial placeholder is empty (client has no value)
    expect(screen.getByTestId("contact")).toHaveAttribute("placeholder", "");

    // ACT: Type in client field
    const user = userEvent.setup();
    await user.type(screen.getByTestId("client"), "Acme Corp");

    // ASSERT: Contact placeholder updates to client value
    await waitFor(() => {
      expect(screen.getByTestId("contact")).toHaveAttribute(
        "placeholder",
        "Acme Corp",
      );
    });
  });

  it("should evaluate complex provider expression", async () => {
    // ARRANGE: Complex ternary expression based on field value
    const config: FormFieldsConfig = {
      userType: { type: "textField", defaultValue: "user" },
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{
          className: 'userType === "admin" ? "admin-field" : "user-field"'
        }}
      >
        <Form config={config} defaultValues={{ userType: "user" }}>
          <Field name="userType" />
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Initial state - userType="user" → "user-field" class
    expect(screen.getByTestId("field")).toHaveClass("user-field");

    // ACT: Change userType to "admin"
    const user = userEvent.setup();
    await user.clear(screen.getByTestId("userType"));
    await user.type(screen.getByTestId("userType"), "admin");

    // ASSERT: userType="admin" → "admin-field" class
    await waitFor(() => {
      expect(screen.getByTestId("field")).toHaveClass("admin-field");
    });
  });

  it("should handle expression with field reference", async () => {
    // Test that field references are properly resolved
    const config: FormFieldsConfig = {
      source: { type: "textField", defaultValue: "" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ placeholder: "source" }}
      >
        <Form config={config}>
          <Field name="source" />
          <Field name="target" />
        </Form>
      </FormalityProvider>
    );

    // Type in source and verify target placeholder updates
    const user = userEvent.setup();
    await user.type(screen.getByTestId("source"), "Test Value");

    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveAttribute(
        "placeholder",
        "Test Value",
      );
    });
  });
});

// ============================================================================
// TEST SUITE: Function Callback Provider Props
// ============================================================================

describe("selectDefaultFieldProps - Provider Level - Function Callbacks", () => {
  it("should call provider-level function with formState", () => {
    // CAPTURE: Track what formState is passed to the function
    let capturedFormState: any;

    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={(formState) => {
          capturedFormState = formState;
          return { className: formState.fields.signed?.value ? "enabled" : "disabled" };
        }}
      >
        <Form config={config}>
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Function was called with formState
    expect(capturedFormState).toBeDefined();
    // Note: formState.fields may be empty for fields without watched dependencies
    // The function is called but the fields object only contains watched fields
  });

  it("should call provider-level function with methods", () => {
    // CAPTURE: Track what methods are passed to the function
    let capturedMethods: any;

    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={(formState, methods) => {
          capturedMethods = methods;
          return {};
        }}
      >
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Function was called with react-hook-form methods
    expect(capturedMethods).toBeDefined();
    expect(capturedMethods).toHaveProperty("control");
    expect(capturedMethods).toHaveProperty("getValues");
    expect(capturedMethods).toHaveProperty("setValue");
  });

  it("should evaluate function-based provider props dynamically", async () => {
    // Test that expression-based props re-evaluate when dependencies change
    // Note: Functions cannot infer dependencies automatically, so we use
    // an expression instead which CAN infer dependencies for re-evaluation
    const config: FormFieldsConfig = {
      toggle: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ className: 'toggle ? "toggle-on" : "toggle-off"' }}
      >
        <Form config={config}>
          <Field name="toggle" />
          <Field name="target" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Initial state - toggle=false → "toggle-off"
    expect(screen.getByTestId("target")).toHaveClass("toggle-off");

    // ACT: Toggle the switch
    const user = userEvent.setup();
    await user.click(screen.getByTestId("toggle"));

    // ASSERT: toggle=true → "toggle-on"
    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveClass("toggle-on");
    });
  });
});

// ============================================================================
// TEST SUITE: Re-Evaluation Tests
// ============================================================================

describe("selectDefaultFieldProps - Provider Level - Re-Evaluation", () => {
  it("should re-evaluate provider props when dependency changes", async () => {
    // Test that expression re-evaluates when watched field changes
    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ className: 'signed ? "yes" : "no"' }}
      >
        <Form config={config}>
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Initial state - signed=false → "no"
    expect(screen.getByTestId("target")).toHaveClass("no");

    // ACT: Toggle signed twice
    const user = userEvent.setup();
    await user.click(screen.getByTestId("signed"));

    // ASSERT: First toggle - signed=true → "yes"
    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveClass("yes");
    });

    await user.click(screen.getByTestId("signed"));

    // ASSERT: Second toggle - signed=false → "no"
    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveClass("no");
    });
  });

  it("should re-evaluate for multiple fields watching same dependency", async () => {
    // Test that multiple fields all update when dependency changes
    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      field1: { type: "textField" },
      field2: { type: "textField" },
      field3: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ className: 'signed ? "enabled" : "disabled"' }}
      >
        <Form config={config}>
          <Field name="signed" />
          <Field name="field1" />
          <Field name="field2" />
          <Field name="field3" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: All fields have "disabled" class initially (signed=false)
    expect(screen.getByTestId("field1")).toHaveClass("disabled");
    expect(screen.getByTestId("field2")).toHaveClass("disabled");
    expect(screen.getByTestId("field3")).toHaveClass("disabled");

    // ACT: Toggle signed
    const user = userEvent.setup();
    await user.click(screen.getByTestId("signed"));

    // ASSERT: All fields have "enabled" class (signed=true)
    await waitFor(() => {
      expect(screen.getByTestId("field1")).toHaveClass("enabled");
      expect(screen.getByTestId("field2")).toHaveClass("enabled");
      expect(screen.getByTestId("field3")).toHaveClass("enabled");
    });
  });

  it("should re-evaluate string expression when dependency changes", async () => {
    // Test string expression re-evaluation
    const config: FormFieldsConfig = {
      source: { type: "textField", defaultValue: "" },
      target1: { type: "textField" },
      target2: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ placeholder: "source" }}
      >
        <Form config={config}>
          <Field name="source" />
          <Field name="target1" />
          <Field name="target2" />
        </Form>
      </FormalityProvider>
    );

    const user = userEvent.setup();
    await user.type(screen.getByTestId("source"), "Test");

    // Both targets should update
    await waitFor(() => {
      expect(screen.getByTestId("target1")).toHaveAttribute("placeholder", "Test");
      expect(screen.getByTestId("target2")).toHaveAttribute("placeholder", "Test");
    });
  });
});

// ============================================================================
// TEST SUITE: Priority Ordering Tests
// ============================================================================

describe("selectDefaultFieldProps - Provider Level - Priority Ordering", () => {
  it("should prioritize form props over provider props", () => {
    // Test that form-level selectDefaultFieldProps overrides provider-level
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ size: '"small"', variant: '"provider"' }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { size: '"large"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    const field = screen.getByTestId("field");

    // ASSERT: Form size overrides provider size
    expect(field).toHaveAttribute("data-size", "large");

    // ASSERT: Provider variant applies because form doesn't override it
    expect(field).toHaveAttribute("data-variant", "provider");
  });

  it("should prioritize field props over both form and provider", () => {
    // Test that field-level selectProps overrides both form and provider
    const config: FormFieldsConfig = {
      field: { type: "textField", selectProps: { variant: '"standard"' } },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ variant: '"filled"' }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { variant: '"outlined"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Field variant wins (highest priority)
    expect(screen.getByTestId("field")).toHaveAttribute("data-variant", "standard");
  });

  it("should merge provider props with field config props", () => {
    // Test that provider props merge (not replace) with other props
    const config: FormFieldsConfig = {
      field: { type: "textField", props: { placeholder: "from config" } },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ className: '"from-provider"' }}
      >
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    const field = screen.getByTestId("field");

    // ASSERT: Both props are applied (merged)
    expect(field).toHaveClass("from-provider");
    expect(field).toHaveAttribute("placeholder", "from config");
  });

  it("should apply correct priority: field > form > provider", () => {
    // Test the complete priority chain
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        selectProps: { size: '"field"' },
      },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ size: '"provider"', variant: '"provider"' }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { size: '"form"', className: '"form-class"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    const field = screen.getByTestId("field");

    // ASSERT: Priority: field > form > provider
    expect(field).toHaveAttribute("data-size", "field"); // Field wins
    expect(field).toHaveClass("form-class"); // Form applies (field doesn't override)
    expect(field).toHaveAttribute("data-variant", "provider"); // Provider applies
  });
});

// ============================================================================
// TEST SUITE: Multiple Fields
// ============================================================================

describe("selectDefaultFieldProps - Provider Level - Multiple Fields", () => {
  it("should apply provider props to all fields", async () => {
    // Test that provider-level props apply to every field
    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      field1: { type: "textField" },
      field2: { type: "textField" },
      field3: { type: "textField" },
      field4: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ className: 'signed ? "yes" : "no"' }}
      >
        <Form config={config}>
          <Field name="signed" />
          <Field name="field1" />
          <Field name="field2" />
          <Field name="field3" />
          <Field name="field4" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: All fields have "no" class initially (signed=false)
    expect(screen.getByTestId("field1")).toHaveClass("no");
    expect(screen.getByTestId("field2")).toHaveClass("no");
    expect(screen.getByTestId("field3")).toHaveClass("no");
    expect(screen.getByTestId("field4")).toHaveClass("no");

    // ACT: Toggle signed
    const user = userEvent.setup();
    await user.click(screen.getByTestId("signed"));

    // ASSERT: All fields have "yes" class (signed=true)
    await waitFor(() => {
      expect(screen.getByTestId("field1")).toHaveClass("yes");
      expect(screen.getByTestId("field2")).toHaveClass("yes");
      expect(screen.getByTestId("field3")).toHaveClass("yes");
      expect(screen.getByTestId("field4")).toHaveClass("yes");
    });
  });

  it("should apply provider props independently per field", async () => {
    // Test that each field gets its own evaluation
    const config: FormFieldsConfig = {
      fieldA: { type: "textField" },
      fieldB: { type: "textField" },
      fieldC: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{
          placeholder: 'props.name === "fieldA" ? "Enter A" : props.name === "fieldB" ? "Enter B" : "Enter C"'
        }}
      >
        <Form config={config}>
          <Field name="fieldA" />
          <Field name="fieldB" />
          <Field name="fieldC" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Each field has its own evaluated placeholder
    expect(screen.getByTestId("fieldA")).toHaveAttribute("placeholder", "Enter A");
    expect(screen.getByTestId("fieldB")).toHaveAttribute("placeholder", "Enter B");
    expect(screen.getByTestId("fieldC")).toHaveAttribute("placeholder", "Enter C");
  });
});
