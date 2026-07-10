import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";

const Input = ({ value, onChange, disabled, name, forwardRef, ...p }: any) => (
  <input
    ref={forwardRef}
    data-testid={name}
    value={value ?? ""}
    onChange={(e: any) => onChange(e.target.value)}
    disabled={disabled}
  />
);
const inputs: Record<string, InputConfig> = {
  textField: { component: Input, defaultValue: "" },
};

describe("PROBE: per-field isDisabled matcher", () => {
  it("result disabled via per-field isDisabled matchers (both disabled)", () => {
    const config: FormFieldsConfig = {
      field1: { type: "textField", disabled: true },
      field2: { type: "textField", disabled: true },
      result: {
        type: "textField",
        conditions: [
          {
            when: { field1: { isDisabled: true }, field2: { isDisabled: true } },
            disabled: true,
          },
        ],
      },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config}>
          <Field name="field1" />
          <Field name="field2" />
          <Field name="result" />
        </Form>
      </FormalityProvider>,
    );
    console.log("PROBE field1 disabled?", screen.getByTestId("field1"));
    console.log("PROBE field2 disabled?", screen.getByTestId("field2"));
    console.log("PROBE result disabled?", screen.getByTestId("result"));
    expect(screen.getByTestId("field1")).toBeDisabled();
    expect(screen.getByTestId("field2")).toBeDisabled();
    expect(screen.getByTestId("result")).toBeDisabled();
  });

  it("result NOT disabled when only one disabled (per-field matchers)", () => {
    const config: FormFieldsConfig = {
      field1: { type: "textField", disabled: true },
      field2: { type: "textField", disabled: false },
      result: {
        type: "textField",
        conditions: [
          {
            when: { field1: { isDisabled: true }, field2: { isDisabled: true } },
            disabled: true,
          },
        ],
      },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config}>
          <Field name="field1" />
          <Field name="field2" />
          <Field name="result" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("field1")).toBeDisabled();
    expect(screen.getByTestId("field2")).not.toBeDisabled();
    expect(screen.getByTestId("result")).not.toBeDisabled();
  });
});
