// @formality-ui/react - 8-Layer Prop Priority Order Tests (Simplified)
// Minimal test to debug timeout issue

import React, { forwardRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormalityProvider } from "../components/FormalityProvider";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";

// Test input component
interface TestInputProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  name: string;
  className?: string;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, name, className }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      className={className}
    />
  ),
);

TestInput.displayName = "TestInput";

const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
};

describe("Priority Order - Basic Test", () => {
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
});
