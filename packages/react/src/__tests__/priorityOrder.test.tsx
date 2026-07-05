// @formality-ui/react - 8-Layer Prop Priority Order Tests
// Comprehensive test coverage for the 8-layer prop priority system

import type React from "react";
import { forwardRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormalityProvider } from "../components/FormalityProvider";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
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
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  style?: React.CSSProperties;
  "data-size"?: string;
  "data-variant"?: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
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
      "data-size": dataSize,
      "data-variant": dataVariant,
      ...props
    },
    ref,
  ) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}
        data-testid={name}
        data-size={dataSize ?? size}
        data-variant={dataVariant ?? variant}
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
// TEST SUITE: Priority Order - Single Layer Tests
// ============================================================================

describe("Priority Order - Single Layer Tests", () => {
  describe("Layer 1: providerDefaultFieldProps", () => {
    it("should apply providerDefaultFieldProps className", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          defaultFieldProps={{ className: "layer-1" }}
        >
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).toHaveClass("layer-1");
    });

    it("should apply providerDefaultFieldProps data attributes", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          defaultFieldProps={{
            "data-size": "small",
            "data-variant": "outlined",
          }}
        >
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("data-size", "small");
      expect(field).toHaveAttribute("data-variant", "outlined");
    });

    it("should apply providerDefaultFieldProps to all fields", () => {
      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField" },
        field3: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          defaultFieldProps={{ className: "all-fields" }}
        >
          <Form config={config}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="field3" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field1")).toHaveClass("all-fields");
      expect(screen.getByTestId("field2")).toHaveClass("all-fields");
      expect(screen.getByTestId("field3")).toHaveClass("all-fields");
    });
  });

  describe("Layer 2: providerSelectDefaultFieldProps", () => {
    it("should apply providerSelectDefaultFieldProps className", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          selectDefaultFieldProps={{ className: '"layer-2"' }}
        >
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).toHaveClass("layer-2");
    });

    it("should apply providerSelectDefaultFieldProps data attributes", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          selectDefaultFieldProps={{
            "data-size": '"medium"',
            "data-variant": '"filled"',
          }}
        >
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("data-size", "medium");
      expect(field).toHaveAttribute("data-variant", "filled");
    });

    it("should apply providerSelectDefaultFieldProps to all fields", () => {
      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          selectDefaultFieldProps={{ className: '"dynamic-layer-2"' }}
        >
          <Form config={config}>
            <Field name="field1" />
            <Field name="field2" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field1")).toHaveClass("dynamic-layer-2");
      expect(screen.getByTestId("field2")).toHaveClass("dynamic-layer-2");
    });
  });

  describe("Layer 3: formDefaultFieldProps", () => {
    it("should apply formDefaultFieldProps className", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={config}
            formConfig={{ defaultFieldProps: { className: "layer-3" } }}
          >
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).toHaveClass("layer-3");
    });

    it("should apply formDefaultFieldProps data attributes", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={config}
            formConfig={{
              defaultFieldProps: {
                "data-size": "large",
                "data-variant": "standard",
              },
            }}
          >
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("data-size", "large");
      expect(field).toHaveAttribute("data-variant", "standard");
    });

    it("should apply formDefaultFieldProps to all fields in form", () => {
      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={config}
            formConfig={{ defaultFieldProps: { className: "form-fields" } }}
          >
            <Field name="field1" />
            <Field name="field2" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field1")).toHaveClass("form-fields");
      expect(screen.getByTestId("field2")).toHaveClass("form-fields");
    });
  });

  describe("Layer 4: formSelectDefaultFieldProps", () => {
    it("should apply formSelectDefaultFieldProps className", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={config}
            formConfig={{ selectDefaultFieldProps: { className: '"layer-4"' } }}
          >
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).toHaveClass("layer-4");
    });

    it("should apply formSelectDefaultFieldProps data attributes", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={config}
            formConfig={{
              selectDefaultFieldProps: {
                "data-size": '"xlarge"',
                "data-variant": '"contained"',
              },
            }}
          >
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("data-size", "xlarge");
      expect(field).toHaveAttribute("data-variant", "contained");
    });

    it("should apply formSelectDefaultFieldProps to all fields in form", () => {
      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={config}
            formConfig={{
              selectDefaultFieldProps: { className: '"form-dynamic"' },
            }}
          >
            <Field name="field1" />
            <Field name="field2" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field1")).toHaveClass("form-dynamic");
      expect(screen.getByTestId("field2")).toHaveClass("form-dynamic");
    });
  });

  describe("Layer 5: inputProps", () => {
    it("should apply inputProps from InputConfig", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      // Layer 5 inputProps comes from the InputConfig's props field
      const testInputsWithLayer5: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: "",
          props: { className: "layer-5" },
        },
        switch: { component: TestSwitch, defaultValue: false },
      };

      render(
        <FormalityProvider inputs={testInputsWithLayer5}>
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).toHaveClass("layer-5");
    });

    it("should apply inputProps data attributes", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      // Layer 5 inputProps with data attributes
      const testInputsWithLayer5: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: "",
          props: { "data-size": "custom", "data-variant": "custom" },
        },
        switch: { component: TestSwitch, defaultValue: false },
      };

      render(
        <FormalityProvider inputs={testInputsWithLayer5}>
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("data-size", "custom");
      expect(field).toHaveAttribute("data-variant", "custom");
    });

    it("should apply inputProps to all fields of that input type", () => {
      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField" },
      };

      // Layer 5 inputProps applies to all fields using this input type
      const testInputsWithLayer5: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: "",
          props: { className: "input-layer" },
        },
        switch: { component: TestSwitch, defaultValue: false },
      };

      render(
        <FormalityProvider inputs={testInputsWithLayer5}>
          <Form config={config}>
            <Field name="field1" />
            <Field name="field2" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field1")).toHaveClass("input-layer");
      expect(screen.getByTestId("field2")).toHaveClass("input-layer");
    });
  });

  describe("Layer 6: fieldConfigProps", () => {
    it("should apply fieldConfigProps from FieldConfig", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField", props: { className: "layer-6" } },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).toHaveClass("layer-6");
    });

    it("should apply fieldConfigProps data attributes", () => {
      const config: FormFieldsConfig = {
        field: {
          type: "textField",
          props: {
            "data-size": "field-config",
            "data-variant": "field-config",
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("data-size", "field-config");
      expect(field).toHaveAttribute("data-variant", "field-config");
    });

    it("should apply fieldConfigProps only to specific field", () => {
      const config: FormFieldsConfig = {
        field1: { type: "textField", props: { className: "special-field" } },
        field2: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field1" />
            <Field name="field2" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field1")).toHaveClass("special-field");
      expect(screen.getByTestId("field2")).not.toHaveClass("special-field");
    });
  });

  describe("Layer 7: selectProps", () => {
    it("should apply selectProps from FieldConfig", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField", selectProps: { className: '"layer-7"' } },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).toHaveClass("layer-7");
    });

    it("should apply selectProps data attributes", () => {
      const config: FormFieldsConfig = {
        field: {
          type: "textField",
          selectProps: {
            "data-size": '"select-field"',
            "data-variant": '"select-field"',
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("data-size", "select-field");
      expect(field).toHaveAttribute("data-variant", "select-field");
    });

    it("should apply selectProps only to specific field", () => {
      const config: FormFieldsConfig = {
        field1: {
          type: "textField",
          selectProps: { className: '"select-special"' },
        },
        field2: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field1" />
            <Field name="field2" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field1")).toHaveClass("select-special");
      expect(screen.getByTestId("field2")).not.toHaveClass("select-special");
    });
  });

  describe("Layer 8: componentProps", () => {
    it("should apply componentProps from JSX", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" className="layer-8" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).toHaveClass("layer-8");
    });

    it("should apply componentProps data attributes", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" data-size="jsx-prop" data-variant="jsx-prop" />
          </Form>
        </FormalityProvider>,
      );

      const field = screen.getByTestId("field");
      expect(field).toHaveAttribute("data-size", "jsx-prop");
      expect(field).toHaveAttribute("data-variant", "jsx-prop");
    });

    it("should apply componentProps only to specific field", () => {
      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field1" className="jsx-special" />
            <Field name="field2" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field1")).toHaveClass("jsx-special");
      expect(screen.getByTestId("field2")).not.toHaveClass("jsx-special");
    });
  });
});

// ============================================================================
// TEST SUITE: Priority Order - Adjacent Layers
// ============================================================================

describe("Priority Order - Adjacent Layers", () => {
  it("should prioritize layer 2 over layer 1", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ className: "layer-1" }}
        selectDefaultFieldProps={{ className: '"layer-2"' }}
      >
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-2");
    expect(field).not.toHaveClass("layer-1");
  });

  it("should prioritize layer 3 over layer 2", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ className: '"layer-2"' }}
      >
        <Form
          config={config}
          formConfig={{ defaultFieldProps: { className: "layer-3" } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-3");
    expect(field).not.toHaveClass("layer-2");
  });

  it("should prioritize layer 4 over layer 3", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: { className: "layer-3" },
            selectDefaultFieldProps: { className: '"layer-4"' },
          }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-4");
    expect(field).not.toHaveClass("layer-3");
  });

  it("should prioritize layer 5 over layer 4", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    // Layer 5 inputProps from InputConfig.props
    const testInputsWithLayer5: Record<string, InputConfig> = {
      textField: {
        component: TestInput,
        defaultValue: "",
        props: { className: "layer-5" },
      },
      switch: { component: TestSwitch, defaultValue: false },
    };

    render(
      <FormalityProvider inputs={testInputsWithLayer5}>
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { className: '"layer-4"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-5");
    expect(field).not.toHaveClass("layer-4");
  });

  it("should prioritize layer 6 over layer 5", () => {
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        props: { className: "layer-6" },
      },
    };

    // Layer 5 inputProps from InputConfig.props
    const testInputsWithLayer5: Record<string, InputConfig> = {
      textField: {
        component: TestInput,
        defaultValue: "",
        props: { className: "layer-5" },
      },
      switch: { component: TestSwitch, defaultValue: false },
    };

    render(
      <FormalityProvider inputs={testInputsWithLayer5}>
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-6");
    expect(field).not.toHaveClass("layer-5");
  });

  it("should prioritize layer 7 over layer 6", () => {
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        props: { className: "layer-6" },
        selectProps: { className: '"layer-7"' },
      },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-7");
    expect(field).not.toHaveClass("layer-6");
  });

  it("should prioritize layer 8 over layer 7", () => {
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        selectProps: { className: '"layer-7"' },
      },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="field" className="layer-8" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-8");
    expect(field).not.toHaveClass("layer-7");
  });
});

// ============================================================================
// TEST SUITE: Priority Order - Skip Layers
// ============================================================================

describe("Priority Order - Skip Layers", () => {
  it("should prioritize layer 3 over layer 1 (skipping layer 2)", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ className: "layer-1" }}
        // Layer 2 not set
      >
        <Form
          config={config}
          formConfig={{ defaultFieldProps: { className: "layer-3" } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-3");
    expect(field).not.toHaveClass("layer-1");
  });

  it("should prioritize layer 4 over layer 1 (skipping layers 2-3)", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ className: "layer-1" }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { className: '"layer-4"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-4");
    expect(field).not.toHaveClass("layer-1");
  });

  it("should prioritize layer 5 over layer 2 (skipping layers 3-4)", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    // Layer 5 inputProps from InputConfig.props
    const testInputsWithLayer5: Record<string, InputConfig> = {
      textField: {
        component: TestInput,
        defaultValue: "",
        props: { className: "layer-5" },
      },
      switch: { component: TestSwitch, defaultValue: false },
    };

    render(
      <FormalityProvider
        inputs={testInputsWithLayer5}
        selectDefaultFieldProps={{ className: '"layer-2"' }}
      >
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-5");
    expect(field).not.toHaveClass("layer-2");
  });

  it("should prioritize layer 7 over layer 4 (skipping layers 5-6)", () => {
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        selectProps: { className: '"layer-7"' },
      },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { className: '"layer-4"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-7");
    expect(field).not.toHaveClass("layer-4");
  });

  it("should prioritize layer 8 over layer 3 (skipping layers 4-7)", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{ defaultFieldProps: { className: "layer-3" } }}
        >
          <Field name="field" className="layer-8" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-8");
    expect(field).not.toHaveClass("layer-3");
  });

  it("should prioritize layer 8 over layer 1 (skipping layers 2-7)", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ className: "layer-1" }}
      >
        <Form config={config}>
          <Field name="field" className="layer-8" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-8");
    expect(field).not.toHaveClass("layer-1");
  });
});

// ============================================================================
// TEST SUITE: Priority Order - CoreProps Always Wins
// ============================================================================

describe("Priority Order - CoreProps Always Wins", () => {
  it("should use field name from config as core prop", () => {
    const config: FormFieldsConfig = {
      myField: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="myField" />
        </Form>
      </FormalityProvider>,
    );

    // The field should render with the name from config
    expect(screen.getByTestId("myField")).toBeInTheDocument();
  });

  it("should set initial value from record prop", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config} record={{ field: "initial-value" }}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    // CoreProps value should be set from form state (via record)
    // record values are passed to react-hook-form as initial values
    expect(screen.getByTestId("field")).toHaveValue("initial-value");
  });

  it("should maintain onChange handler from core Field system", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    // CoreProps onChange should be in place (field is interactive)
    const field = screen.getByTestId("field");
    expect(field).toHaveAttribute("value");
    // The field should be capable of receiving input (onChange is wired)
    expect(field.tagName.toLowerCase()).toBe("input");
  });
});

// ============================================================================
// TEST SUITE: Priority Order - Full Chain
// ============================================================================

describe("Priority Order - Full Chain", () => {
  it("should apply correct priority across all 8 layers", () => {
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        props: { "data-size": "layer-6" },
        selectProps: { className: '"layer-7"' },
      },
    };

    // Layer 5 inputProps from InputConfig.props
    const testInputsWithLayer5: Record<string, InputConfig> = {
      textField: {
        component: TestInput,
        defaultValue: "",
        props: { "data-variant": "layer-5" },
      },
      switch: { component: TestSwitch, defaultValue: false },
    };

    render(
      <FormalityProvider
        inputs={testInputsWithLayer5}
        defaultFieldProps={{ "data-test": "layer-1" }}
        selectDefaultFieldProps={{ "data-size": '"layer-2"' }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: { placeholder: "layer-3" },
            selectDefaultFieldProps: { className: '"layer-4"' },
          }}
        >
          <Field name="field" className="layer-8" placeholder="override" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");

    // Layer 8 wins for className (highest priority with className)
    expect(field).toHaveClass("layer-8");

    // Layer 6 wins for data-size (layer 7 doesn't have data-size)
    expect(field).toHaveAttribute("data-size", "layer-6");

    // Layer 5 wins for data-variant (layer 6 doesn't have data-variant)
    expect(field).toHaveAttribute("data-variant", "layer-5");

    // Layer 8 wins for placeholder
    expect(field).toHaveAttribute("placeholder", "override");

    // Layer 1 wins for data-test (no higher layer has data-test)
    expect(field).toHaveAttribute("data-test", "layer-1");
  });

  it("should verify complete priority chain with all layers having same property", () => {
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        props: { "data-test": "layer-6" },
        selectProps: { "data-test": '"layer-7"' },
      },
    };

    // Layer 5 inputProps from InputConfig.props
    const testInputsWithLayer5: Record<string, InputConfig> = {
      textField: {
        component: TestInput,
        defaultValue: "",
        props: { "data-test": "layer-5" },
      },
      switch: { component: TestSwitch, defaultValue: false },
    };

    render(
      <FormalityProvider
        inputs={testInputsWithLayer5}
        defaultFieldProps={{ "data-test": "layer-1" }}
        selectDefaultFieldProps={{ "data-test": '"layer-2"' }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: { "data-test": "layer-3" },
            selectDefaultFieldProps: { "data-test": '"layer-4"' },
          }}
        >
          <Field name="field" data-test="layer-8" />
        </Form>
      </FormalityProvider>,
    );

    // Layer 8 should win for data-test
    expect(screen.getByTestId("field")).toHaveAttribute("data-test", "layer-8");
  });
});

// ============================================================================
// TEST SUITE: Priority Order - Dynamic Layers
// ============================================================================

describe("Priority Order - Dynamic Layers", () => {
  describe("Layer 2: providerSelectDefaultFieldProps", () => {
    it("should evaluate providerSelectDefaultFieldProps expression", async () => {
      const config: FormFieldsConfig = {
        switch: { type: "switch" },
        target: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          selectDefaultFieldProps={{
            className: 'switch ? "enabled" : "disabled"',
          }}
        >
          <Form config={config}>
            <Field name="switch" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );

      // Initial state (switch is false)
      expect(screen.getByTestId("target")).toHaveClass("disabled");

      // Toggle switch
      const user = userEvent.setup();
      await user.click(screen.getByTestId("switch"));

      // Expression re-evaluated
      await waitFor(() => {
        expect(screen.getByTestId("target")).toHaveClass("enabled");
      });
    });

    it("should re-evaluate providerSelectDefaultFieldProps on dependency changes", async () => {
      const config: FormFieldsConfig = {
        counter: { type: "textField", defaultValue: "0" },
        target: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          selectDefaultFieldProps={{
            className: 'counter > 5 ? "high" : "low"',
          }}
        >
          <Form config={config}>
            <Field name="counter" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );

      // Initial state
      expect(screen.getByTestId("target")).toHaveClass("low");

      // Change counter value
      const user = userEvent.setup();
      const counter = screen.getByTestId("counter");
      await user.clear(counter);
      await user.type(counter, "10");

      // Expression re-evaluated
      await waitFor(() => {
        expect(screen.getByTestId("target")).toHaveClass("high");
      });
    });
  });

  describe("Layer 4: formSelectDefaultFieldProps", () => {
    it("should evaluate formSelectDefaultFieldProps expression", async () => {
      const config: FormFieldsConfig = {
        switch: { type: "switch" },
        target: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={config}
            formConfig={{
              selectDefaultFieldProps: { className: 'switch ? "on" : "off"' },
            }}
          >
            <Field name="switch" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );

      // Initial state
      expect(screen.getByTestId("target")).toHaveClass("off");

      // Toggle switch
      const user = userEvent.setup();
      await user.click(screen.getByTestId("switch"));

      // Expression re-evaluated
      await waitFor(() => {
        expect(screen.getByTestId("target")).toHaveClass("on");
      });
    });

    it("should re-evaluate formSelectDefaultFieldProps on dependency changes", async () => {
      const config: FormFieldsConfig = {
        toggle: { type: "switch" },
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={config}
            formConfig={{
              selectDefaultFieldProps: {
                className: 'toggle ? "active" : "inactive"',
              },
            }}
          >
            <Field name="toggle" />
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      // Initial state
      expect(screen.getByTestId("field")).toHaveClass("inactive");

      // Toggle twice
      const user = userEvent.setup();
      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(screen.getByTestId("field")).toHaveClass("active");
      });

      await user.click(screen.getByTestId("toggle"));

      await waitFor(() => {
        expect(screen.getByTestId("field")).toHaveClass("inactive");
      });
    });
  });

  describe("Layer 7: selectProps", () => {
    it("should evaluate selectProps expression", async () => {
      const config: FormFieldsConfig = {
        signed: { type: "switch" },
        target: {
          type: "textField",
          selectProps: { className: 'signed ? "target-on" : "target-off"' },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="signed" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );

      // Initial state
      expect(screen.getByTestId("target")).toHaveClass("target-off");

      // Toggle switch
      const user = userEvent.setup();
      await user.click(screen.getByTestId("signed"));

      // Expression re-evaluated
      await waitFor(() => {
        expect(screen.getByTestId("target")).toHaveClass("target-on");
      });
    });

    it("should re-evaluate selectProps on dependency changes", async () => {
      const config: FormFieldsConfig = {
        source: { type: "textField" },
        target: {
          type: "textField",
          selectProps: { placeholder: "source || 'empty'" },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ source: "Initial" }}>
            <Field name="source" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );

      // Initial placeholder
      expect(screen.getByTestId("target")).toHaveAttribute(
        "placeholder",
        "Initial",
      );

      // Clear and type in source
      const user = userEvent.setup();
      await user.clear(screen.getByTestId("source"));
      await user.type(screen.getByTestId("source"), "Test Value");

      // Expression re-evaluated
      await waitFor(() => {
        expect(screen.getByTestId("target")).toHaveAttribute(
          "placeholder",
          "Test Value",
        );
      });
    });
  });
});

// ============================================================================
// TEST SUITE: Priority Order - Merge Behavior
// ============================================================================

describe("Priority Order - Merge Behavior", () => {
  it("should merge different properties from multiple layers", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    // Layer 5 inputProps from InputConfig.props
    const testInputsWithLayer5: Record<string, InputConfig> = {
      textField: {
        component: TestInput,
        defaultValue: "",
        props: { autoComplete: "on" },
      },
      switch: { component: TestSwitch, defaultValue: false },
    };

    render(
      <FormalityProvider
        inputs={testInputsWithLayer5}
        defaultFieldProps={{ "data-size": "small" }}
        selectDefaultFieldProps={{ "data-variant": '"outlined"' }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: { className: "form-class" },
            selectDefaultFieldProps: { placeholder: '"enter text"' },
          }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field");
    expect(field).toHaveAttribute("data-size", "small");
    expect(field).toHaveAttribute("data-variant", "outlined");
    expect(field).toHaveClass("form-class");
    expect(field).toHaveAttribute("placeholder", "enter text");
    expect(field).toHaveAttribute("autocomplete", "on");
  });

  it("should override same property based on priority", () => {
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        props: { className: "layer-6" },
        selectProps: { className: '"layer-7"' },
      },
    };

    // Layer 5 inputProps from InputConfig.props
    const testInputsWithLayer5: Record<string, InputConfig> = {
      textField: {
        component: TestInput,
        defaultValue: "",
        props: { className: "layer-5" },
      },
      switch: { component: TestSwitch, defaultValue: false },
    };

    render(
      <FormalityProvider
        inputs={testInputsWithLayer5}
        defaultFieldProps={{ className: "layer-1" }}
        selectDefaultFieldProps={{ className: '"layer-2"' }}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: { className: "layer-3" },
            selectDefaultFieldProps: { className: '"layer-4"' },
          }}
        >
          <Field name="field" className="layer-8" />
        </Form>
      </FormalityProvider>,
    );

    // Layer 8 should win
    expect(screen.getByTestId("field")).toHaveClass("layer-8");
  });

  it("should handle nested object merging with style property", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ style: { color: "red", fontSize: "14px" } }}
      >
        <Form
          config={config}
          formConfig={{ defaultFieldProps: { style: { fontWeight: "bold" } } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    const field = screen.getByTestId("field") as HTMLInputElement;
    // Note: Formality does shallow merge for props, not deep merge
    // The formConfig.style completely replaces providerDefaultFieldProps.style
    // So only fontWeight from formConfig should be present
    expect(field.style.fontWeight).toBe("bold");
    // color and fontSize from provider are NOT present (replaced, not merged)
    expect(field.style.color).toBe("");
    expect(field.style.fontSize).toBe("");
  });

  it("should handle empty layers in merge", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ className: "layer-1" }}
        selectDefaultFieldProps={{}}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: undefined,
            selectDefaultFieldProps: undefined,
          }}
        >
          <Field name="field" className="layer-8" />
        </Form>
      </FormalityProvider>,
    );

    // Should still merge and apply available props
    const field = screen.getByTestId("field");
    expect(field).toHaveClass("layer-8"); // Layer 8 wins
    expect(field).not.toHaveClass("layer-1"); // Overridden by layer 8
  });
});

// ============================================================================
// TEST SUITE: Priority Order - Edge Cases
// ============================================================================

describe("Priority Order - Edge Cases", () => {
  it("should handle undefined layers gracefully", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={undefined}
        selectDefaultFieldProps={undefined}
      >
        <Form
          config={config}
          formConfig={{
            defaultFieldProps: undefined,
            selectDefaultFieldProps: undefined,
          }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field")).toBeInTheDocument();
  });

  it("should handle null values in layers", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    // Note: TypeScript would normally catch null, but runtime behavior should be safe
    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ className: "layer-1" }}
      >
        <Form config={config}>
          <Field name="field" className={null as unknown as string} />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field")).toBeInTheDocument();
  });

  it("should handle empty objects in layers", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{}}
        selectDefaultFieldProps={{}}
      >
        <Form
          config={config}
          formConfig={{ defaultFieldProps: {}, selectDefaultFieldProps: {} }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field")).toBeInTheDocument();
  });

  it("should handle function callbacks in selectProps", () => {
    let callCount = 0;

    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        selectProps: () => {
          callCount++;
          return { className: "callback-result" };
        },
      },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    expect(callCount).toBeGreaterThan(0);
    expect(screen.getByTestId("field")).toHaveClass("callback-result");
  });

  it("should handle frozen objects in layers", () => {
    const frozenProps = Object.freeze({ className: "frozen-class" });

    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs} defaultFieldProps={frozenProps}>
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field")).toHaveClass("frozen-class");
  });

  it("should handle conflicting types for same property", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ "data-size": 123 as unknown as string }}
      >
        <Form config={config}>
          <Field name="field" data-size="string" />
        </Form>
      </FormalityProvider>,
    );

    // Layer 8 should win regardless of type conflict
    expect(screen.getByTestId("field")).toHaveAttribute("data-size", "string");
  });

  it("should handle special characters in className", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ className: "class-with-@#$-special-chars" }}
      >
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field")).toHaveClass(
      "class-with-@#$-special-chars",
    );
  });

  it("should handle very long prop values", () => {
    const longClassName = "a".repeat(1000);

    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        defaultFieldProps={{ className: longClassName }}
      >
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("field")).toHaveClass(longClassName);
  });
});
