// @formality-ui/react - Form Component Tests
import type React from "react";
import { forwardRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { FormalityProvider } from "../components/FormalityProvider";
import { useFormContext } from "../context/FormContext";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";

// Test input component
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<
  HTMLInputElement,
  TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }
>(({ value, onChange, disabled, name, forwardRef, ...props }) => (
  <input
    ref={forwardRef}
    data-testid={name}
    value={value ?? ""}
    onChange={(e) => onChange?.(e.target.value)}
    disabled={disabled}
    {...props}
  />
));

TestInput.displayName = "TestInput";

// Switch input for tests
interface TestSwitchProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

const TestSwitch = forwardRef<
  HTMLInputElement,
  TestSwitchProps & { forwardRef?: React.Ref<HTMLInputElement> }
>(({ value, onChange, disabled, name, forwardRef, ...props }) => (
  <input
    ref={forwardRef}
    type="checkbox"
    data-testid={name}
    checked={value ?? false}
    onChange={(e) => onChange?.(e.target.checked)}
    disabled={disabled}
    {...props}
  />
));

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

// Consumer component for testing context
function ContextConsumer() {
  const ctx = useFormContext();
  return (
    <div>
      <span data-testid="config-keys">{Object.keys(ctx.config).join(",")}</span>
      <span data-testid="unused-fields">{ctx.unusedFields.join(",")}</span>
    </div>
  );
}

describe("Form", () => {
  const config: FormFieldsConfig = {
    name: { type: "textField" },
    email: { type: "textField" },
    active: { type: "switch" },
  };

  it("should provide FormContext to children", () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <ContextConsumer />
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("config-keys")).toHaveTextContent(
      "name,email,active",
    );
  });

  it("should track unused fields", () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <ContextConsumer />
        </Form>
      </FormalityProvider>,
    );

    // All fields are unused initially
    expect(screen.getByTestId("unused-fields")).toHaveTextContent(
      "name,email,active",
    );
  });

  it("should expose render API via function children", () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config} formConfig={{ title: "Test Form" }}>
          {({ resolvedTitle, unusedFields }) => (
            <div>
              <span data-testid="title">{resolvedTitle}</span>
              <span data-testid="unused">{unusedFields.length}</span>
            </div>
          )}
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("title")).toHaveTextContent("Test Form");
    expect(screen.getByTestId("unused")).toHaveTextContent("3");
  });

  it("should initialize with default values from input config", () => {
    const configWithDefaults: FormFieldsConfig = {
      name: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={configWithDefaults}>
          {({ methods }) => {
            const value = methods.getValues("name");
            return (
              <span data-testid="value">
                {value === "" ? "empty-string" : (value ?? "undefined")}
              </span>
            );
          }}
        </Form>
      </FormalityProvider>,
    );

    // Default value should be from InputConfig.defaultValue (empty string)
    expect(screen.getByTestId("value")).toHaveTextContent("empty-string");
  });

  it("should initialize with record values", () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          record={{ name: "John", email: "john@example.com" }}
        >
          {({ methods }) => (
            <div>
              <span data-testid="name">{methods.getValues("name")}</span>
              <span data-testid="email">{methods.getValues("email")}</span>
            </div>
          )}
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("name")).toHaveTextContent("John");
    expect(screen.getByTestId("email")).toHaveTextContent("john@example.com");
  });

  it("should call onSubmit with form values", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: "textField" } }}
          onSubmit={onSubmit}
          record={{ name: "Test" }}
        >
          {({ methods }) => (
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <button type="submit" data-testid="submit">
                Submit
              </button>
            </form>
          )}
        </Form>
      </FormalityProvider>,
    );

    await user.click(screen.getByTestId("submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  // Regression for validation Issue #6: the render-API handleSubmit must run
  // form-level validate + transformValuesForSubmit on the manual-submit path,
  // not only on auto-save.
  describe("manual submit pipeline (render-API handleSubmit)", () => {
    const inputsWithAutocomplete: Record<string, InputConfig> = {
      ...testInputs,
      autocomplete: {
        component: TestInput,
        defaultValue: null,
        valueField: "id",
        getSubmitField: (k: string) => `${k}Id`,
      },
    };

    it("applies transformValuesForSubmit on manual submit", async () => {
      const user = userEvent.setup();
      const received = vi.fn();

      render(
        <FormalityProvider inputs={inputsWithAutocomplete}>
          <Form
            config={{ client: { type: "autocomplete" } }}
            record={{ client: { id: "42", name: "Acme" } }}
            onSubmit={received}
          >
            {({ handleSubmit }) => (
              <form onSubmit={handleSubmit(received)}>
                <button type="submit" data-testid="submit">
                  Submit
                </button>
              </form>
            )}
          </Form>
        </FormalityProvider>,
      );

      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(received).toHaveBeenCalledTimes(1);
      });
      expect(received).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: "42" }),
      );
    });

    it("runs form-level validate on manual submit and blocks on error", async () => {
      const user = userEvent.setup();
      const received = vi.fn();
      const validate = vi.fn().mockReturnValue({ name: "required" });

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{ name: { type: "textField" } }}
            record={{ name: "" }}
            validate={validate}
            onSubmit={received}
          >
            {({ handleSubmit }) => (
              <form onSubmit={handleSubmit(received)}>
                <button type="submit" data-testid="submit">
                  Submit
                </button>
              </form>
            )}
          </Form>
        </FormalityProvider>,
      );

      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(validate).toHaveBeenCalledTimes(1);
      });
      // Blocked because validate returned an error.
      expect(received).not.toHaveBeenCalled();
    });
  });

  it("should expose methods via render API", () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          {({ methods }) => (
            <span data-testid="has-methods">
              {typeof methods.register === "function" ? "yes" : "no"}
            </span>
          )}
        </Form>
      </FormalityProvider>,
    );

    expect(screen.getByTestId("has-methods")).toHaveTextContent("yes");
  });

  it("should expose formState via render API", () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          {({ formState }) => (
            <span data-testid="is-valid">
              {formState.isValid ? "valid" : "invalid"}
            </span>
          )}
        </Form>
      </FormalityProvider>,
    );

    // Form should be valid by default (no validation rules)
    expect(screen.getByTestId("is-valid")).toHaveTextContent("valid");
  });

  it("should merge form-level input overrides with provider inputs", () => {
    // Capture the merged inputs via context
    let capturedConfig: any;

    function ConfigCapture() {
      const ctx = useFormContext();
      capturedConfig = ctx.formConfig;
      return null;
    }

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            inputs: {
              textField: { debounce: 500 },
            },
          }}
        >
          <ConfigCapture />
        </Form>
      </FormalityProvider>,
    );

    expect(capturedConfig.inputs).toEqual({
      textField: { debounce: 500 },
    });
  });

  describe("Auto-Save", () => {
    it("should accept autoSave prop", () => {
      const onSubmit = vi.fn();

      // Verify the Form component accepts autoSave prop without error
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{ name: { type: "textField" } }}
            autoSave={true}
            onSubmit={onSubmit}
          >
            <TestInput name="name" value="" onChange={() => {}} />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("name")).toBeInTheDocument();
    });

    it("should accept debounce prop", () => {
      const onSubmit = vi.fn();

      // Verify the Form component accepts debounce prop
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{ name: { type: "textField" } }}
            autoSave
            debounce={500}
            onSubmit={onSubmit}
          >
            <TestInput name="name" value="" onChange={() => {}} />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("name")).toBeInTheDocument();
    });

    it("should allow immediate submit via handleSubmit", async () => {
      const onSubmit = vi.fn();

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{ name: { type: "textField" } }}
            onSubmit={onSubmit}
            record={{ name: "initial" }}
          >
            {({ methods }) => (
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <TestInput
                  name="name"
                  value={methods.watch("name")}
                  onChange={(v: string) => methods.setValue("name", v)}
                />
                <button type="submit" data-testid="submit">
                  Submit
                </button>
              </form>
            )}
          </Form>
        </FormalityProvider>,
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });

    it("should expose debouncedSubmit and submitImmediate via FormContext", () => {
      let formContextValue: any;

      function ContextCapture() {
        formContextValue = useFormContext();
        return null;
      }

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{ name: { type: "textField" } }}
            autoSave
            debounce={500}
          >
            <ContextCapture />
          </Form>
        </FormalityProvider>,
      );

      // Auto-save related functions should be available in context
      expect(formContextValue.submitImmediate).toBeDefined();
      expect(typeof formContextValue.submitImmediate).toBe("function");
    });
  });
});
