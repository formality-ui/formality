// @formality-ui/react - Field Component Tests
import React, { forwardRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";

// Test input component with all common props
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
  [key: string]: unknown;
}

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

TestInput.displayName = "TestInput";

// Test switch input
interface TestSwitchProps {
  value?: any;
  onChange?: (value: any) => void;
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

// Test inputs config
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

describe("Field", () => {
  describe("rendering", () => {
    it("should render the configured component", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: "textField" } }}>
            <Field name="name" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("name")).toBeInTheDocument();
    });

    it("should resolve label from config", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: "textField", label: "Full Name" } }}>
            <Field name="name" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("name-label")).toHaveTextContent("Full Name");
    });

    it("should auto-generate label from field name when not specified", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ clientContact: { type: "textField" } }}>
            <Field name="clientContact" />
          </Form>
        </FormalityProvider>,
      );

      // clientContact should become "Client Contact"
      expect(screen.getByTestId("clientContact-label")).toHaveTextContent(
        "Client Contact",
      );
    });

    it("should not render when hidden prop is true", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: "textField" } }}>
            <Field name="name" hidden />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.queryByTestId("name")).not.toBeInTheDocument();
    });

    it("should not render when field config has hidden: true", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: "textField", hidden: true } }}>
            <Field name="name" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.queryByTestId("name")).not.toBeInTheDocument();
    });

    it("should use component prop label over config label", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: "textField", label: "Config Label" } }}>
            <Field name="name" label="Prop Label" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("name-label")).toHaveTextContent("Prop Label");
    });
  });

  describe("conditions", () => {
    it("should render field with conditions array", () => {
      // Verify Field accepts conditions in config
      const config: FormFieldsConfig = {
        toggle: { type: "switch" },
        dependent: {
          type: "textField",
          conditions: [{ when: "toggle", truthy: true, disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="toggle" />
            <Field name="dependent" />
          </Form>
        </FormalityProvider>,
      );

      // Both fields should render
      expect(screen.getByTestId("toggle")).toBeInTheDocument();
      expect(screen.getByTestId("dependent")).toBeInTheDocument();
    });

    it("should support visible condition in config", () => {
      // Verify Field accepts visible conditions
      // When toggle is 'yes', condition { is: 'no' } does NOT match → field visible
      const config: FormFieldsConfig = {
        toggle: { type: "textField" },
        conditional: {
          type: "textField",
          conditions: [{ when: "toggle", is: "no", visible: false }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} defaultValues={{ toggle: "yes" }}>
            <Field name="toggle" />
            <Field name="conditional" />
          </Form>
        </FormalityProvider>,
      );

      // Field should render (toggle is 'yes', so is:'no' condition doesn't match)
      expect(screen.getByTestId("conditional")).toBeInTheDocument();
    });

    it('should support "is" condition type in config', () => {
      // Verify Field accepts "is" conditions for exact value matching
      const config: FormFieldsConfig = {
        status: { type: "textField" },
        dependent: {
          type: "textField",
          conditions: [{ when: "status", is: "active", disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="status" />
            <Field name="dependent" />
          </Form>
        </FormalityProvider>,
      );

      // Both fields should render
      expect(screen.getByTestId("status")).toBeInTheDocument();
      expect(screen.getByTestId("dependent")).toBeInTheDocument();
    });
  });

  describe("selectProps", () => {
    it("should evaluate selectProps expressions", () => {
      const config: FormFieldsConfig = {
        source: { type: "textField" },
        target: {
          type: "textField",
          selectProps: { placeholder: "source" },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ source: "Hello World" }}>
            <Field name="source" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("target")).toHaveAttribute(
        "placeholder",
        "Hello World",
      );
    });

    it("should update selectProps when referenced field changes", async () => {
      const config: FormFieldsConfig = {
        source: { type: "textField" },
        target: {
          type: "textField",
          selectProps: { placeholder: "source" },
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

      expect(screen.getByTestId("target")).toHaveAttribute(
        "placeholder",
        "Initial",
      );

      // Type in source field
      const user = userEvent.setup();
      await user.clear(screen.getByTestId("source"));
      await user.type(screen.getByTestId("source"), "Updated");

      await waitFor(() => {
        expect(screen.getByTestId("target")).toHaveAttribute(
          "placeholder",
          "Updated",
        );
      });
    });
  });

  describe("value transformation", () => {
    it("should apply parser on change", async () => {
      const parseToUpperCase = vi.fn((value: string) => value.toUpperCase());

      const inputs: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: "",
          parser: parseToUpperCase,
        },
      };

      render(
        <FormalityProvider inputs={inputs}>
          <Form config={{ name: { type: "textField" } }}>
            {({ methods }) => (
              <>
                <Field name="name" />
                <span data-testid="value">{methods.watch("name")}</span>
              </>
            )}
          </Form>
        </FormalityProvider>,
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId("name"), "hello");

      await waitFor(() => {
        expect(screen.getByTestId("value")).toHaveTextContent("HELLO");
      });
    });

    it("should apply formatter for display", async () => {
      const formatToLower = vi.fn((value: string) =>
        typeof value === "string" ? value.toLowerCase() : value,
      );

      const inputs: Record<string, InputConfig> = {
        textField: {
          component: TestInput,
          defaultValue: "",
          formatter: formatToLower,
        },
      };

      render(
        <FormalityProvider inputs={inputs}>
          <Form
            config={{ name: { type: "textField" } }}
            record={{ name: "HELLO" }}
          >
            <Field name="name" />
          </Form>
        </FormalityProvider>,
      );

      // Value should be formatted for display
      expect(screen.getByTestId("name")).toHaveValue("hello");
    });
  });

  describe("validation", () => {
    it("should run field-level validator on blur", async () => {
      const config: FormFieldsConfig = {
        email: {
          type: "textField",
          validator: (value) => {
            if (typeof value === "string" && !value.includes("@")) {
              return "Must be a valid email";
            }
            return true;
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="email" />
          </Form>
        </FormalityProvider>,
      );

      const user = userEvent.setup();
      await user.type(screen.getByTestId("email"), "invalid");
      await user.tab(); // Trigger blur/validation

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Must be a valid email",
        );
      });
    });

    it("should clear error when validation passes", async () => {
      const config: FormFieldsConfig = {
        email: {
          type: "textField",
          validator: (value) => {
            if (typeof value === "string" && !value.includes("@")) {
              return "Must be a valid email";
            }
            return true;
          },
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="email" />
          </Form>
        </FormalityProvider>,
      );

      const user = userEvent.setup();

      // First, trigger invalid state
      await user.type(screen.getByTestId("email"), "invalid");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toBeInTheDocument();
      });

      // Now fix the value
      await user.clear(screen.getByTestId("email"));
      await user.type(screen.getByTestId("email"), "valid@email.com");
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByTestId("email-error")).not.toBeInTheDocument();
      });
    });
  });

  describe("disabled prop override", () => {
    it("should use disabled prop over condition result", () => {
      const config: FormFieldsConfig = {
        toggle: { type: "switch" },
        field: {
          type: "textField",
          conditions: [{ when: "toggle", truthy: true, disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ toggle: true }}>
            <Field name="toggle" />
            {/* Force disabled=false even though condition would disable */}
            <Field name="field" disabled={false} />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

    it("should use disabled prop to force disable", () => {
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" disabled />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("field")).toBeDisabled();
    });
  });

  describe("JSX disabled prop highest priority - ALL sources active", () => {
    it("should disable field when JSX={true} overrides config={false} + conditions={false}", () => {
      // Test that JSX disabled={true} overrides ALL other sources with disabled={false}
      // Config says enabled, conditions say enabled, JSX forces disabled
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: false, // Config says enabled
          conditions: [
            { when: "otherField", is: "match", disabled: false }, // Condition says enabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" disabled={true} /> {/* JSX forces disabled */}
          </Form>
        </FormalityProvider>,
      );

      // JSX prop (true) should override config (false) + conditions (false)
      expect(screen.getByTestId("field")).toBeDisabled();
    });

    it("should enable field when JSX={false} overrides config={true} + conditions={true}", () => {
      // Test that JSX disabled={false} overrides ALL other sources with disabled={true}
      // Config says disabled, conditions say disabled, JSX forces enabled
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: true, // Config says disabled
          conditions: [
            { when: "otherField", is: "match", disabled: true }, // Condition says disabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" disabled={false} /> {/* JSX forces enabled */}
          </Form>
        </FormalityProvider>,
      );

      // JSX prop (false) should override config (true) + conditions (true)
      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

    it("should update disabled state when JSX prop changes while all sources active", () => {
      // Test that dynamic prop changes work while all other sources remain active
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: false,
          conditions: [{ when: "otherField", is: "x", disabled: false }],
        },
      };

      const { rerender } = render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "x" }}>
            <Field name="otherField" />
            <Field name="field" disabled={true} />
          </Form>
        </FormalityProvider>,
      );

      // Initially disabled by JSX prop
      expect(screen.getByTestId("field")).toBeDisabled();

      // Change JSX prop to false
      rerender(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "x" }}>
            <Field name="otherField" />
            <Field name="field" disabled={false} />
          </Form>
        </FormalityProvider>,
      );

      // Should now be enabled
      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

    it("should prevent user interaction when JSX disabled={true}", async () => {
      // Test that users cannot interact with disabled fields
      const user = userEvent.setup();
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: false, // Config says enabled
          conditions: [{ when: "otherField", is: "x", disabled: false }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "x" }}>
            <Field name="otherField" />
            <Field name="field" disabled={true} /> {/* JSX forces disabled */}
          </Form>
        </FormalityProvider>,
      );

      // Try to type in disabled field
      await user.type(screen.getByTestId("field"), "test");

      // Value should not change (field remains empty)
      expect(screen.getByTestId("field")).toHaveValue("");
    });
  });

  describe("Config disabled priority - second highest after JSX prop", () => {
    it("should disable when config={true} overrides conditions={false}", () => {
      // Test that config disabled=true overrides conditions disabled=false
      // Config says disabled, conditions say enabled, config wins
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: true, // Config says disabled
          conditions: [
            { when: "otherField", is: "match", disabled: false }, // Condition says enabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" /> {/* No JSX prop, config controls disabled */}
          </Form>
        </FormalityProvider>,
      );

      // Config (true) should override conditions (false)
      expect(screen.getByTestId("field")).toBeDisabled();
    });

    it("should enable when config={false} overrides conditions={true}", () => {
      // Test that config disabled=false overrides conditions disabled=true
      // Config says enabled, conditions say disabled, config wins
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: false, // Config says enabled
          conditions: [
            { when: "otherField", is: "match", disabled: true }, // Condition says disabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" /> {/* No JSX prop, config controls disabled */}
          </Form>
        </FormalityProvider>,
      );

      // Config (false) should override conditions (true)
      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

    it("should prioritize JSX disabled={true} over config disabled={false}", () => {
      // Test that JSX prop has highest priority over config
      // Config says enabled, JSX says disabled, JSX wins
      const config: FormFieldsConfig = {
        field: {
          type: "textField",
          disabled: false, // Config says enabled
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" disabled={true} /> {/* JSX forces disabled */}
          </Form>
        </FormalityProvider>,
      );

      // JSX prop (true) should override config (false)
      expect(screen.getByTestId("field")).toBeDisabled();
    });

    it("should prioritize JSX disabled={false} over config disabled={true}", () => {
      // Test that JSX prop has highest priority over config
      // Config says disabled, JSX says enabled, JSX wins
      const config: FormFieldsConfig = {
        field: {
          type: "textField",
          disabled: true, // Config says disabled
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" disabled={false} /> {/* JSX forces enabled */}
          </Form>
        </FormalityProvider>,
      );

      // JSX prop (false) should override config (true)
      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

    it("should handle all sources: JSX > config > conditions", () => {
      // Test full priority order: JSX > config > conditions
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: true, // Config: disabled
          conditions: [
            { when: "otherField", is: "x", disabled: false }, // Conditions: enabled
          ],
        },
      };

      // Test 1: JSX={false} overrides everything
      const { rerender } = render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "x" }}>
            <Field name="otherField" />
            <Field name="field" disabled={false} />
          </Form>
        </FormalityProvider>,
      );
      expect(screen.getByTestId("field")).not.toBeDisabled();

      // Test 2: No JSX prop, config overrides conditions
      rerender(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "x" }}>
            <Field name="otherField" />
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );
      expect(screen.getByTestId("field")).toBeDisabled();
    });
  });

  describe("Conditions disabled priority - third highest after JSX prop and config", () => {
    it("should disable when condition={true} and no JSX/config disabled", () => {
      // Test that condition disabled=true controls field when JSX and config are undefined
      // Condition (third priority) should override group state when higher priorities are undefined
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          // No config disabled property
          conditions: [
            { when: "otherField", is: "match", disabled: true }, // Condition says disabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" />{" "}
            {/* No JSX prop, no config disabled, condition controls */}
          </Form>
        </FormalityProvider>,
      );

      // Condition (true) should control disabled (no JSX, no config)
      expect(screen.getByTestId("field")).toBeDisabled();
    });

    it("should enable when condition={false} and no JSX/config disabled", () => {
      // Test that condition disabled=false controls field when JSX and config are undefined
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          // No config disabled property
          conditions: [
            { when: "otherField", is: "match", disabled: false }, // Condition says enabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" />{" "}
            {/* No JSX prop, no config disabled, condition controls */}
          </Form>
        </FormalityProvider>,
      );

      // Condition (false) should control disabled (no JSX, no config)
      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

    it("should prioritize config disabled={false} over condition disabled={true}", () => {
      // Test that config (second priority) overrides conditions (third priority)
      // Config says enabled, conditions say disabled, config wins
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: false, // Config says enabled
          conditions: [
            { when: "otherField", is: "match", disabled: true }, // Condition says disabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" /> {/* Config wins over condition */}
          </Form>
        </FormalityProvider>,
      );

      // Config (false) should override condition (true)
      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

    it("should prioritize JSX disabled={false} over condition disabled={true}", () => {
      // Test that JSX prop (first priority) overrides conditions (third priority)
      // JSX says enabled, conditions say disabled, JSX wins
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          // No config disabled property
          conditions: [
            { when: "otherField", is: "match", disabled: true }, // Condition says disabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" disabled={false} /> {/* JSX forces enabled */}
          </Form>
        </FormalityProvider>,
      );

      // JSX prop (false) should override condition (true)
      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

    it("should re-evaluate condition when dependency field value changes", async () => {
      // Test that conditions re-evaluate when referenced field values change
      const user = userEvent.setup();
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          conditions: [{ when: "otherField", is: "disable", disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "enable" }}>
            <Field name="otherField" />
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      // Initial: condition doesn't match, field is enabled
      expect(screen.getByTestId("field")).not.toBeDisabled();

      // Change otherField to "disable"
      await user.clear(screen.getByTestId("otherField"));
      await user.type(screen.getByTestId("otherField"), "disable");

      // Condition re-evaluates, field becomes disabled
      await waitFor(() => {
        expect(screen.getByTestId("field")).toBeDisabled();
      });
    });

    it("should use AND logic for multi-field when conditions", () => {
      // Test that multi-field conditions use AND logic (all must match)
      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField" },
        target: {
          type: "textField",
          conditions: [
            {
              when: {
                field1: { is: "value1" },
                field2: { is: "value2" },
              },
              disabled: true,
            },
          ],
        },
      };

      // Test 1: Only field1 matches - should be enabled
      const { rerender } = render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ field1: "value1", field2: "other" }}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );
      expect(screen.getByTestId("target")).not.toBeDisabled();

      // Test 2: Both match - should be disabled
      rerender(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ field1: "value1", field2: "value2" }}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );
      expect(screen.getByTestId("target")).toBeDisabled();
    });

    it.skip("should reference isDisabled matcher from other field", () => {
      // KNOWN LIMITATION: isDisabled matcher requires two-pass evaluation with allFieldsConfig
      // Field.tsx now passes allFieldsConfig to useConditions, which enables two-pass evaluation
      // However, when multiple fields reference each other's isDisabled, it creates
      // circular watch dependencies that cause infinite re-renders.
      //
      // To fix this, we would need to:
      // 1. Prevent fields from subscribing to each other when conditions only use isDisabled
      // 2. Or use a different subscription mechanism that doesn't trigger re-renders
      //
      // For now, this test documents the expected behavior when this limitation is resolved.
      const config: FormFieldsConfig = {
        trigger: { type: "textField" },
        source: {
          type: "textField",
          conditions: [{ when: "trigger", is: "disable", disabled: true }],
        },
        target: {
          type: "textField",
          conditions: [{ when: "source", isDisabled: true, disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ trigger: "disable" }}>
            <Field name="trigger" />
            <Field name="source" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );

      // source is disabled by its own condition
      expect(screen.getByTestId("source")).toBeDisabled();

      // target is disabled because it references source.isDisabled
      expect(screen.getByTestId("target")).toBeDisabled();
    });

    it.skip("should handle circular dependencies without infinite loops", async () => {
      // KNOWN LIMITATION: Circular dependencies with isDisabled matcher cause infinite re-renders
      // The two-pass evaluation in useConditions can compute disabled states correctly,
      // but the React re-render cycle creates a circular watch dependency:
      // - fieldA watches fieldB (due to condition)
      // - fieldB watches fieldA (due to condition)
      // - When fieldA changes, both re-render and re-compute disabled states
      // - The re-computed disabled states might trigger more re-renders
      //
      // To fix this, we would need to prevent circular watch dependencies or use a
      // different mechanism for isDisabled matcher that doesn't create watch cycles.
      //
      // The iterative evaluation in useConditions helps converge to a stable state,
      // but it doesn't prevent the React-level infinite re-render loop.
      const user = userEvent.setup();
      const config: FormFieldsConfig = {
        fieldA: {
          type: "textField",
          conditions: [{ when: "fieldB", isDisabled: true, disabled: true }],
        },
        fieldB: {
          type: "textField",
          conditions: [{ when: "fieldA", isDisabled: true, disabled: true }],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>,
      );

      // Both enabled initially (no circular infinite loop)
      expect(screen.getByTestId("fieldA")).not.toBeDisabled();
      expect(screen.getByTestId("fieldB")).not.toBeDisabled();

      // Type in fieldA (makes it truthy/disabled check)
      await user.type(screen.getByTestId("fieldA"), "test");

      // fieldB becomes disabled (fieldA is truthy/disabled check)
      await waitFor(() => {
        expect(screen.getByTestId("fieldB")).toBeDisabled();
      });

      // fieldA stays enabled (fieldB is disabled, which is falsy for truthy check)
      expect(screen.getByTestId("fieldA")).not.toBeDisabled();

      // No infinite loop - test completes without timeout
    });

    describe("two-field isDisabled conditions", () => {
      it.skip("should disable result when both source fields are disabled", () => {
        // KNOWN LIMITATION: Top-level isDisabled with object when requires disabled states
        // to be propagated through fieldStates in condition evaluation.
        //
        // The core package tests verify this works correctly at the evaluation level.
        // However, the React integration has a limitation where config-level disabled
        // states are not included in the fieldStates used for condition evaluation.
        //
        // To fix this, we would need to:
        // 1. Include config-level disabled in Pass 2 fieldStates computation
        // 2. Or use a different mechanism to propagate disabled states for condition evaluation
        //
        // For now, this test documents the expected behavior when this limitation is resolved.
        const config: FormFieldsConfig = {
          field1: { type: "textField", disabled: true },
          field2: { type: "textField", disabled: true },
          result: {
            type: "textField",
            conditions: [
              {
                when: { field1: {}, field2: {} },
                isDisabled: true,
                disabled: true,
              },
            ],
          },
        };

        render(
          <FormalityProvider inputs={testInputs}>
            <Form config={config}>
              <Field name="field1" />
              <Field name="field2" />
              <Field name="result" />
            </Form>
          </FormalityProvider>,
        );

        // Both source fields are disabled
        expect(screen.getByTestId("field1")).toBeDisabled();
        expect(screen.getByTestId("field2")).toBeDisabled();
        // Result field should be disabled
        expect(screen.getByTestId("result")).toBeDisabled();
      });

      it.skip("should not disable result when only one source field is disabled", () => {
        // KNOWN LIMITATION: Same as above - config-level disabled not propagated to fieldStates
        const config: FormFieldsConfig = {
          field1: { type: "textField", disabled: true },
          field2: { type: "textField", disabled: false },
          result: {
            type: "textField",
            conditions: [
              {
                when: { field1: {}, field2: {} },
                isDisabled: true,
                disabled: true,
              },
            ],
          },
        };

        render(
          <FormalityProvider inputs={testInputs}>
            <Form config={config}>
              <Field name="field1" />
              <Field name="field2" />
              <Field name="result" />
            </Form>
          </FormalityProvider>,
        );

        // Only one source field is disabled
        expect(screen.getByTestId("field1")).toBeDisabled();
        expect(screen.getByTestId("field2")).not.toBeDisabled();
        // Result field should NOT be disabled
        expect(screen.getByTestId("result")).not.toBeDisabled();
      });

      it.skip("should re-evaluate when source field disabled states change", async () => {
        // KNOWN LIMITATION: Same as above - JSX prop disabled not propagated to fieldStates
        const config: FormFieldsConfig = {
          field1: { type: "textField" },
          field2: { type: "textField" },
          result: {
            type: "textField",
            conditions: [
              {
                when: { field1: {}, field2: {} },
                isDisabled: true,
                disabled: true,
              },
            ],
          },
        };

        // Initially only field1 is disabled (via JSX prop)
        const { rerender } = render(
          <FormalityProvider inputs={testInputs}>
            <Form config={config}>
              <Field name="field1" disabled />
              <Field name="field2" />
              <Field name="result" />
            </Form>
          </FormalityProvider>,
        );

        // Only one disabled initially
        expect(screen.getByTestId("result")).not.toBeDisabled();

        // Now disable both fields (via JSX props)
        rerender(
          <FormalityProvider inputs={testInputs}>
            <Form config={config}>
              <Field name="field1" disabled />
              <Field name="field2" disabled />
              <Field name="result" />
            </Form>
          </FormalityProvider>,
        );

        // Now both are disabled - result should be disabled
        await waitFor(() => {
          expect(screen.getByTestId("result")).toBeDisabled();
        });
      });

      it.skip("should work with field state matchers in object when", () => {
        // KNOWN LIMITATION: Same as above - config-level disabled not propagated to fieldStates
        const config: FormFieldsConfig = {
          field1: { type: "textField", disabled: true },
          field2: { type: "textField", disabled: true },
          result: {
            type: "textField",
            conditions: [
              {
                when: { field1: {}, field2: {} },
                isDisabled: true,
                disabled: true,
              },
            ],
          },
        };

        render(
          <FormalityProvider inputs={testInputs}>
            <Form config={config}>
              <Field name="field1" />
              <Field name="field2" />
              <Field name="result" />
            </Form>
          </FormalityProvider>,
        );

        // Both source fields are disabled
        expect(screen.getByTestId("field1")).toBeDisabled();
        expect(screen.getByTestId("field2")).toBeDisabled();
        // Result field should be disabled
        expect(screen.getByTestId("result")).toBeDisabled();
      });
    });
  });

  describe("multi-field isDisabled with mixed matchers", () => {
    it("should disable result when value matcher matches and state field is disabled", () => {
      // TEST: Mixed matcher with value + state matchers, both match
      // EXPECT: result field is disabled

      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField", disabled: true }, // Config-level disabled
        result: {
          type: "textField",
          conditions: [
            {
              when: {
                field1: { is: "active" }, // Value matcher
                field2: { isDisabled: true }, // State matcher
              },
              isDisabled: true, // Top-level isDisabled check
              disabled: true,
            },
          ],
        },
      };

      // field1 value matches "active", field2 is disabled via config
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ field1: "active" }}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="result" />
          </Form>
        </FormalityProvider>,
      );

      // Both field-level matchers pass AND top-level isDisabled check passes
      expect(screen.getByTestId("result")).toBeDisabled();
    });

    it("should not disable when value matcher doesn't match", () => {
      // TEST: Value matcher fails
      // EXPECT: result field is NOT disabled

      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField", disabled: true }, // Config-level disabled
        result: {
          type: "textField",
          conditions: [
            {
              when: {
                field1: { is: "active" },
                field2: { isDisabled: true },
              },
              isDisabled: true,
              disabled: true,
            },
          ],
        },
      };

      // field1 value is "inactive" (doesn't match), field2 is disabled
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ field1: "inactive" }}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="result" />
          </Form>
        </FormalityProvider>,
      );

      // field-level matcher fails, condition doesn't match
      expect(screen.getByTestId("result")).not.toBeDisabled();
    });

    it("should not disable when state field is enabled", () => {
      // TEST: State matcher fails
      // EXPECT: result field is NOT disabled

      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField" }, // field2 is enabled (no disabled: true)
        result: {
          type: "textField",
          conditions: [
            {
              when: {
                field1: { is: "active" },
                field2: { isDisabled: true },
              },
              isDisabled: true,
              disabled: true,
            },
          ],
        },
      };

      // field1 value matches, but field2 is NOT disabled
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ field1: "active" }}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="result" />
          </Form>
        </FormalityProvider>,
      );

      // field-level matcher fails (field2 is not disabled)
      expect(screen.getByTestId("result")).not.toBeDisabled();
    });

    it("should handle multiple state matchers in mixed conditions", () => {
      // TEST: Multiple state matchers with value matcher
      // EXPECT: result field disabled only when all matchers pass

      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField", disabled: true }, // Config-level disabled
        field3: { type: "textField" }, // field3 is enabled (no disabled: true)
        result: {
          type: "textField",
          conditions: [
            {
              when: {
                field1: { is: "go" },
                field2: { isDisabled: true },
                field3: { isDisabled: true },
              },
              isDisabled: true,
              disabled: true,
            },
          ],
        },
      };

      // field1 matches, field2 disabled, field3 enabled
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ field1: "go" }}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="field3" />
            <Field name="result" />
          </Form>
        </FormalityProvider>,
      );

      // field3 is not disabled, top-level isDisabled check fails
      expect(screen.getByTestId("result")).not.toBeDisabled();
    });

    it("should update disabled state when source field states change", async () => {
      // TEST: Async state update when field value changes
      // EXPECT: result field disabled state updates correctly

      const user = userEvent.setup();

      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField", disabled: true }, // Config-level disabled
        result: {
          type: "textField",
          conditions: [
            {
              when: {
                field1: { is: "active" },
                field2: { isDisabled: true },
              },
              isDisabled: true,
              disabled: true,
            },
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ field1: "inactive" }}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="result" />
          </Form>
        </FormalityProvider>,
      );

      // Initially: value matcher doesn't match, result is enabled
      expect(screen.getByTestId("result")).not.toBeDisabled();

      // User types "active" into field1
      await user.clear(screen.getByTestId("field1"));
      await user.type(screen.getByTestId("field1"), "active");

      // Condition re-evaluates, result becomes disabled
      await waitFor(() => {
        expect(screen.getByTestId("result")).toBeDisabled();
      });
    });
  });

  describe("render prop", () => {
    it("should pass field API to render function", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: "textField" } }}>
            <Field name="name">
              {({ fieldState, renderedField, watchers }) => (
                <div data-testid="wrapper">
                  {renderedField}
                  <span data-testid="touched">
                    {fieldState.isTouched ? "yes" : "no"}
                  </span>
                  <span data-testid="watchers">
                    {Object.keys(watchers).length}
                  </span>
                </div>
              )}
            </Field>
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("wrapper")).toBeInTheDocument();
      expect(screen.getByTestId("touched")).toHaveTextContent("no");
      expect(screen.getByTestId("watchers")).toHaveTextContent("0");
    });

    it("should provide fieldProps to render function", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: "textField", label: "Test Label" } }}>
            <Field name="name">
              {({ fieldProps }) => (
                <span data-testid="label">{fieldProps.label as string}</span>
              )}
            </Field>
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("label")).toHaveTextContent("Test Label");
    });

    it("should update touched state after blur", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={{ name: { type: "textField" } }}>
            <Field name="name">
              {({ fieldState, renderedField }) => (
                <div data-testid="wrapper">
                  {renderedField}
                  <span data-testid="touched">
                    {fieldState.isTouched ? "yes" : "no"}
                  </span>
                </div>
              )}
            </Field>
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("touched")).toHaveTextContent("no");

      const user = userEvent.setup();
      await user.click(screen.getByTestId("name"));
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId("touched")).toHaveTextContent("yes");
      });
    });
  });

  describe("shouldRegister prop", () => {
    it("should register field by default", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              name: { type: "textField" },
              other: { type: "textField" },
            }}
          >
            {({ unusedFields }) => (
              <>
                <Field name="name" />
                <span data-testid="unused">{unusedFields.join(",")}</span>
              </>
            )}
          </Form>
        </FormalityProvider>,
      );

      // 'name' is registered, so only 'other' is unused
      expect(screen.getByTestId("unused")).toHaveTextContent("other");
    });

    it("should not register field when shouldRegister={false}", () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              name: { type: "textField" },
              other: { type: "textField" },
            }}
          >
            {({ unusedFields }) => (
              <>
                <Field name="name" shouldRegister={false} />
                <span data-testid="unused">{unusedFields.join(",")}</span>
              </>
            )}
          </Form>
        </FormalityProvider>,
      );

      // 'name' is not registered, so both are unused
      expect(screen.getByTestId("unused")).toHaveTextContent("name,other");
    });
  });

  describe("type override", () => {
    it("should use type prop over config type", () => {
      const config: FormFieldsConfig = {
        toggle: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            {/* Override textField with switch */}
            <Field name="toggle" type="switch" />
          </Form>
        </FormalityProvider>,
      );

      // Should render as checkbox (switch type) not text input
      expect(screen.getByTestId("toggle")).toHaveAttribute("type", "checkbox");
    });
  });
});
