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

describe("PROBE: cross-field isDisabled reference (string when)", () => {
  it("target disabled via source.isDisabled (string when + top-level isDisabled)", () => {
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
    } as any;
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config} record={{ trigger: "disable" } as any}>
          <Field name="trigger" />
          <Field name="source" />
          <Field name="target" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("source")).toBeDisabled();
    expect(screen.getByTestId("target")).toBeDisabled();
  });
});
