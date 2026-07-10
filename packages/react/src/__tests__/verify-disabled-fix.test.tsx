import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig, FormFieldsConfig, FormConfig } from "@formality-ui/core";
import type React from "react";
import { forwardRef } from "react";

interface IP {
  value?: any;
  onChange?: (v: any) => void;
  disabled?: boolean;
  name: string;
  [k: string]: unknown;
}
const Input = forwardRef<HTMLInputElement, IP & { forwardRef?: React.Ref<HTMLInputElement> }>(
  ({ value, onChange, disabled, name, forwardRef }) => (
    <input ref={forwardRef} data-testid={name} value={value ?? ""} disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)} />
  ),
);
Input.displayName = "Input";
const Switch = forwardRef<HTMLInputElement, IP & { forwardRef?: React.Ref<HTMLInputElement> }>(
  ({ value, onChange, disabled, name, forwardRef }) => (
    <input ref={forwardRef} type="checkbox" data-testid={name} checked={value ?? false} disabled={disabled}
      onChange={(e) => onChange?.(e.target.checked)} />
  ),
);
Switch.displayName = "Switch";
const inputs: Record<string, InputConfig> = {
  textField: { component: Input, defaultValue: "" },
  switch: { component: Switch, defaultValue: false },
};

describe("disabled via props-merge layers (FINDING 1 regression)", () => {
  it("selectProps.disabled disables field", async () => {
    const config: FormFieldsConfig = {
      country: { type: "textField" },
      state: { type: "textField", selectProps: { disabled: "!country" } },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config}>
          <Field name="country" />
          <Field name="state" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("state")).toBeDisabled();
    const user = userEvent.setup();
    await user.type(screen.getByTestId("country"), "US");
    await waitFor(() => expect(screen.getByTestId("state")).not.toBeDisabled());
  });

  it("selectProps.disabled='true' disables field", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField", selectProps: { disabled: "true" } },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("field")).toBeDisabled();
  });

  // NOTE: selectDefaultFieldProps applies to ALL fields, so using it with
  // `disabled: "!enableAll"` would also disable the `enableAll` toggle itself
  // (making it un-togglable). These tests assert the static (disabled) case,
  // which is what was silently broken before FINDING 1's fix.
  it("form selectDefaultFieldProps.disabled disables field", () => {
    const config: FormFieldsConfig = {
      enableAll: { type: "switch" },
      field: { type: "textField" },
    };
    const formConfig: FormConfig = {
      selectDefaultFieldProps: { disabled: "!enableAll" },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config} formConfig={formConfig}>
          <Field name="enableAll" />
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );
    // Both fields are disabled because enableAll=false and selectDefaultFieldProps
    // applies to ALL fields. The key assertion: `field` IS disabled (was enabled before fix).
    expect(screen.getByTestId("field")).toBeDisabled();
  });

  it("provider selectDefaultFieldProps.disabled disables field", () => {
    const config: FormFieldsConfig = {
      enableAll: { type: "switch" },
      field: { type: "textField" },
    };
    render(
      <FormalityProvider inputs={inputs} selectDefaultFieldProps={{ disabled: "!enableAll" }}>
        <Form config={config}>
          <Field name="enableAll" />
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("field")).toBeDisabled();
  });

  // Reactive test using field-level selectProps (applies only to target, not toggle).
  it("selectProps.disabled re-enables when condition becomes false", async () => {
    const config: FormFieldsConfig = {
      country: { type: "textField" },
      state: { type: "textField", selectProps: { disabled: "!country" } },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config}>
          <Field name="country" />
          <Field name="state" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("state")).toBeDisabled();
    const user = userEvent.setup();
    await user.type(screen.getByTestId("country"), "US");
    await waitFor(() => expect(screen.getByTestId("state")).not.toBeDisabled());
  });

  it("static defaultFieldProps.disabled disables field", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };
    const formConfig: FormConfig = {
      defaultFieldProps: { disabled: true },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config} formConfig={formConfig}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("field")).toBeDisabled();
  });

  it("inputConfig.props.disabled disables field", () => {
    const localInputs: Record<string, InputConfig> = {
      textField: { component: Input, defaultValue: "", props: { disabled: true } },
    };
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };
    render(
      <FormalityProvider inputs={localInputs}>
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("field")).toBeDisabled();
  });

  it("fieldConfig.props.disabled disables field", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField", props: { disabled: true } },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config}>
          <Field name="field" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("field")).toBeDisabled();
  });
});
