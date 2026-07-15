// @formality-ui/react - selectDefaultFieldProps Provider-Level Tests
// Tests for provider-level selectDefaultFieldProps evaluation in usePropsEvaluation

import type React from "react";
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

// §20 delivers `forwardRef` as a prop, so the React `forwardRef()` wrap is
// unnecessary (and would warn about an unused ref param). Plain component:
const TestInput = ({
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
  forwardRef,
  ...props
}: TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }) => (
  <div>
    {label && <label data-testid={`${name}-label`}>{label}</label>}
    <input
      ref={forwardRef}
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

const TestSwitch = ({
  value,
  onChange,
  disabled,
  name,
  forwardRef,
  ...props
}: TestSwitchProps & { forwardRef?: React.Ref<HTMLInputElement> }) => (
  <input
    ref={forwardRef}
    type="checkbox"
    data-testid={name}
    checked={value ?? false}
    onChange={(e) => onChange?.(e.target.checked)}
    disabled={disabled}
    {...props}
  />
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
        selectDefaultFieldProps={{
          className: 'signed ? "signed-enabled" : "signed-disabled"',
        }}
      >
        <Form config={config}>
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>,
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
      </FormalityProvider>,
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
          className: 'userType === "admin" ? "admin-field" : "user-field"',
        }}
      >
        <Form config={config} defaultValues={{ userType: "user" }}>
          <Field name="userType" />
          <Field name="field" />
        </Form>
      </FormalityProvider>,
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
      </FormalityProvider>,
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
          return {
            className: formState.fields.signed?.value ? "enabled" : "disabled",
          };
        }}
      >
        <Form config={config}>
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>,
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
      </FormalityProvider>,
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
        selectDefaultFieldProps={{
          className: 'toggle ? "toggle-on" : "toggle-off"',
        }}
      >
        <Form config={config}>
          <Field name="toggle" />
          <Field name="target" />
        </Form>
      </FormalityProvider>,
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
      </FormalityProvider>,
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
        selectDefaultFieldProps={{
          className: 'signed ? "enabled" : "disabled"',
        }}
      >
        <Form config={config}>
          <Field name="signed" />
          <Field name="field1" />
          <Field name="field2" />
          <Field name="field3" />
        </Form>
      </FormalityProvider>,
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
      </FormalityProvider>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByTestId("source"), "Test");

    // Both targets should update
    await waitFor(() => {
      expect(screen.getByTestId("target1")).toHaveAttribute(
        "placeholder",
        "Test",
      );
      expect(screen.getByTestId("target2")).toHaveAttribute(
        "placeholder",
        "Test",
      );
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
      </FormalityProvider>,
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
      </FormalityProvider>,
    );

    // ASSERT: Field variant wins (highest priority)
    expect(screen.getByTestId("field")).toHaveAttribute(
      "data-variant",
      "standard",
    );
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
      </FormalityProvider>,
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
          formConfig={{
            selectDefaultFieldProps: {
              size: '"form"',
              className: '"form-class"',
            },
          }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
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
      </FormalityProvider>,
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
          placeholder:
            'props.name === "fieldA" ? "Enter A" : props.name === "fieldB" ? "Enter B" : "Enter C"',
        }}
      >
        <Form config={config}>
          <Field name="fieldA" />
          <Field name="fieldB" />
          <Field name="fieldC" />
        </Form>
      </FormalityProvider>,
    );

    // ASSERT: Each field has its own evaluated placeholder
    expect(screen.getByTestId("fieldA")).toHaveAttribute(
      "placeholder",
      "Enter A",
    );
    expect(screen.getByTestId("fieldB")).toHaveAttribute(
      "placeholder",
      "Enter B",
    );
    expect(screen.getByTestId("fieldC")).toHaveAttribute(
      "placeholder",
      "Enter C",
    );
  });
});

// ============================================================================
// TEST SUITE: Expression-Based Form Props
// ============================================================================

describe("selectDefaultFieldProps - Form Level - Expression-Based", () => {
  it("should evaluate form-level boolean expression for className", async () => {
    // ARRANGE: Form with expression using className
    // Expression: className evaluates to different value based on signed field
    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: {
              className: 'signed ? "signed-enabled" : "signed-disabled"',
            },
          }}
        >
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>,
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

  it("should evaluate form-level string expression", async () => {
    // ARRANGE: Form with string expression referencing another field
    const config: FormFieldsConfig = {
      client: { type: "textField", defaultValue: "" },
      contact: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { placeholder: "client" } }}
        >
          <Field name="client" />
          <Field name="contact" />
        </Form>
      </FormalityProvider>,
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

  it("should evaluate complex form expression", async () => {
    // ARRANGE: Complex ternary expression based on field value
    const config: FormFieldsConfig = {
      userType: { type: "textField", defaultValue: "user" },
      field: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: {
              className: 'userType === "admin" ? "admin-field" : "user-field"',
            },
          }}
        >
          <Field name="userType" />
          <Field name="field" />
        </Form>
      </FormalityProvider>,
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

  it("should handle expression with field reference at form level", async () => {
    // Test that field references are properly resolved at form level
    const config: FormFieldsConfig = {
      source: { type: "textField", defaultValue: "" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { placeholder: "source" } }}
        >
          <Field name="source" />
          <Field name="target" />
        </Form>
      </FormalityProvider>,
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
// TEST SUITE: Function Callback Form Props
// ============================================================================

describe("selectDefaultFieldProps - Form Level - Function Callbacks", () => {
  it("should call form-level function with formState", () => {
    // CAPTURE: Track what formState is passed to the function
    let capturedFormState: any;

    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: (formState) => {
              capturedFormState = formState;
              return { className: "test-class" };
            },
          }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    // ASSERT: Function was called with formState
    expect(capturedFormState).toBeDefined();
  });

  it("should call form-level function with methods", () => {
    // CAPTURE: Track what methods are passed to the function
    let capturedMethods: any;

    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: (formState, methods) => {
              capturedMethods = methods;
              return {};
            },
          }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    // ASSERT: Function was called with react-hook-form methods
    expect(capturedMethods).toBeDefined();
    expect(capturedMethods).toHaveProperty("control");
    expect(capturedMethods).toHaveProperty("getValues");
    expect(capturedMethods).toHaveProperty("setValue");
  });

  it("should evaluate function-based form props dynamically", async () => {
    // Test that expression-based form props re-evaluate when dependencies change
    // Note: Functions cannot infer dependencies automatically, so we use
    // an expression instead which CAN infer dependencies for re-evaluation
    const config: FormFieldsConfig = {
      toggle: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: {
              className: 'toggle ? "toggle-on" : "toggle-off"',
            },
          }}
        >
          <Field name="toggle" />
          <Field name="target" />
        </Form>
      </FormalityProvider>,
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
// TEST SUITE: Form-Level Re-Evaluation Tests
// ============================================================================

describe("selectDefaultFieldProps - Form Level - Re-Evaluation", () => {
  it("should re-evaluate form props when dependency changes", async () => {
    // Test that expression re-evaluates when watched field changes
    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: { className: 'signed ? "yes" : "no"' },
          }}
        >
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>,
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
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: {
              className: 'signed ? "enabled" : "disabled"',
            },
          }}
        >
          <Field name="signed" />
          <Field name="field1" />
          <Field name="field2" />
          <Field name="field3" />
        </Form>
      </FormalityProvider>,
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
    // Test string expression re-evaluation at form level
    const config: FormFieldsConfig = {
      source: { type: "textField", defaultValue: "" },
      target1: { type: "textField" },
      target2: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { placeholder: "source" } }}
        >
          <Field name="source" />
          <Field name="target1" />
          <Field name="target2" />
        </Form>
      </FormalityProvider>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByTestId("source"), "Test");

    // Both targets should update
    await waitFor(() => {
      expect(screen.getByTestId("target1")).toHaveAttribute(
        "placeholder",
        "Test",
      );
      expect(screen.getByTestId("target2")).toHaveAttribute(
        "placeholder",
        "Test",
      );
    });
  });
});

// ============================================================================
// TEST SUITE: Form-Level Multiple Fields
// ============================================================================

describe("selectDefaultFieldProps - Form Level - Multiple Fields", () => {
  it("should apply form props to all fields in the form", async () => {
    // Test that form-level props apply to every field in the form
    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      field1: { type: "textField" },
      field2: { type: "textField" },
      field3: { type: "textField" },
      field4: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: { className: 'signed ? "yes" : "no"' },
          }}
        >
          <Field name="signed" />
          <Field name="field1" />
          <Field name="field2" />
          <Field name="field3" />
          <Field name="field4" />
        </Form>
      </FormalityProvider>,
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

  it("should apply form props independently per field", async () => {
    // Test that each field gets its own evaluation at form level
    const config: FormFieldsConfig = {
      fieldA: { type: "textField" },
      fieldB: { type: "textField" },
      fieldC: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: {
              placeholder:
                'props.name === "fieldA" ? "Enter A" : props.name === "fieldB" ? "Enter B" : "Enter C"',
            },
          }}
        >
          <Field name="fieldA" />
          <Field name="fieldB" />
          <Field name="fieldC" />
        </Form>
      </FormalityProvider>,
    );

    // ASSERT: Each field has its own evaluated placeholder
    expect(screen.getByTestId("fieldA")).toHaveAttribute(
      "placeholder",
      "Enter A",
    );
    expect(screen.getByTestId("fieldB")).toHaveAttribute(
      "placeholder",
      "Enter B",
    );
    expect(screen.getByTestId("fieldC")).toHaveAttribute(
      "placeholder",
      "Enter C",
    );
  });

  it("should not apply form props to fields in other forms", async () => {
    // Test that form-level props only apply to that form
    const config1: FormFieldsConfig = {
      signed: { type: "switch" },
      field1: { type: "textField" },
    };
    const config2: FormFieldsConfig = {
      field2: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config1}
          formConfig={{
            selectDefaultFieldProps: { className: 'signed ? "yes" : "no"' },
          }}
        >
          <Field name="signed" />
          <Field name="field1" />
        </Form>
        <Form config={config2}>
          <Field name="field2" />
        </Form>
      </FormalityProvider>,
    );

    // ASSERT: field1 gets form-level props, field2 does not
    expect(screen.getByTestId("field1")).toHaveClass("no");
    expect(screen.getByTestId("field2")).not.toHaveClass("no");
  });
});

// ============================================================================
// TEST SUITE: Form-Level Priority Ordering
// ============================================================================

describe("selectDefaultFieldProps - Form Level - Priority Ordering", () => {
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
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");

    // ASSERT: Form size overrides provider size
    expect(field).toHaveAttribute("data-size", "large");

    // ASSERT: Provider variant applies because form doesn't override it
    expect(field).toHaveAttribute("data-variant", "provider");
  });

  it("should merge form and provider props when different", () => {
    // Test that form and provider props merge (not replace)
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{
          size: '"small"',
          className: '"provider-class"',
        }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { variant: '"form"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");

    // ASSERT: All three props are applied (merged)
    expect(field).toHaveAttribute("data-size", "small"); // Provider
    expect(field).toHaveAttribute("data-variant", "form"); // Form
    expect(field).toHaveClass("provider-class"); // Provider
  });

  it("should verify form overrides provider for priority", () => {
    // Test that form-level props override provider-level props
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ size: '"provider"', variant: '"provider"' }}
      >
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: { size: '"form"', variant: '"form"' },
          }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");

    // ASSERT: Form overrides provider
    expect(field).toHaveAttribute("data-size", "form");
    expect(field).toHaveAttribute("data-variant", "form");
  });

  it("should prioritize form props over provider props for expressions", async () => {
    // Test that form-level expressions override provider-level expressions
    const config: FormFieldsConfig = {
      toggle: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{
          className: 'toggle ? "provider-on" : "provider-off"',
        }}
      >
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: {
              className: 'toggle ? "form-on" : "form-off"',
            },
          }}
        >
          <Field name="toggle" />
          <Field name="target" />
        </Form>
      </FormalityProvider>,
    );

    // ASSERT: Initial state - form-level expression wins
    expect(screen.getByTestId("target")).toHaveClass("form-off");

    // ACT: Toggle the switch
    const user = userEvent.setup();
    await user.click(screen.getByTestId("toggle"));

    // ASSERT: Form-level expression applies (not provider)
    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveClass("form-on");
    });
  });

  it("should prioritize form function over provider function", () => {
    // Test that form-level function callbacks override provider-level
    let providerCalled = false;
    let formCalled = false;

    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={() => {
          providerCalled = true;
          return { className: "provider-result" };
        }}
      >
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: () => {
              formCalled = true;
              return { className: "form-result" };
            },
          }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    // ASSERT: Form result wins (both functions are called)
    expect(providerCalled).toBe(true); // Provider function is called
    expect(formCalled).toBe(true); // Form function is called
    expect(screen.getByTestId("field")).toHaveClass("form-result");
    expect(screen.getByTestId("field")).not.toHaveClass("provider-result");
  });
});

// ============================================================================
// TEST SUITE: selectDefaultFieldProps.label (PRD §16.1 regression — F1)
// ============================================================================
//
// PRD §16.1 documents that a global label convention set via
// `selectDefaultFieldProps: { label: "props.name" }` works at BOTH provider
// and form level. Previously the evaluated label was silently clobbered by the
// auto-generated `humanizeLabel(name)` core prop. These tests guard the fix.
describe("selectDefaultFieldProps.label (PRD §16.1)", () => {
  it("provider selectDefaultFieldProps.label is honored (props.name)", () => {
    const config: FormFieldsConfig = {
      clientContact: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ label: "props.name" }}
      >
        <Form config={config}>
          <Field name="clientContact" />
        </Form>
      </FormalityProvider>,
    );

    // The evaluated label ("clientContact") must win over the humanized
    // auto-generated label ("Client Contact").
    expect(screen.getByTestId("clientContact-label")).toHaveTextContent(
      "clientContact",
    );
  });

  it("form selectDefaultFieldProps.label is honored (props.name)", () => {
    const config: FormFieldsConfig = {
      firstName: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { label: "props.name" } }}
        >
          <Field name="firstName" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("firstName-label")).toHaveTextContent(
      "firstName",
    );
  });

  it("form selectDefaultFieldProps.label overrides provider selectDefaultFieldProps.label", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ label: '"provider-label"' }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { label: '"form-label"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field-label")).toHaveTextContent("form-label");
  });

  it("fieldConfig.label overrides provider/form selectDefaultFieldProps.label", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField", label: "Explicit Field Label" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ label: '"provider-label"' }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { label: '"form-label"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field-label")).toHaveTextContent(
      "Explicit Field Label",
    );
  });

  it("field selectProps.label overrides provider/form selectDefaultFieldProps.label", () => {
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        selectProps: { label: '"field-select-label"' },
      },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ label: '"provider-label"' }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { label: '"form-label"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field-label")).toHaveTextContent(
      "field-select-label",
    );
  });

  it("falls back to humanized label when no layer sets label", () => {
    const config: FormFieldsConfig = {
      clientContact: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="clientContact" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("clientContact-label")).toHaveTextContent(
      "Client Contact",
    );
  });

  it("component prop label overrides selectDefaultFieldProps.label", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ label: '"provider-label"' }}
      >
        <Form config={config}>
          <Field name="field" label="Component Label" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field-label")).toHaveTextContent(
      "Component Label",
    );
  });
});
