// Minimal proof test for PRD §20.1: <Field> delivers RHF's field.ref as a
// top-level enumerable `forwardRef` prop (instead of React's reserved `ref`
// key) so that PLAIN function components (not wrapped in React.forwardRef)
// can receive it.
//
// This test deliberately uses a plain function component — NO React.forwardRef
// wrap — typed as ComponentType<FormalityFieldComponentProps>. Before the
// Field.tsx runtime change, `forwardRef` arrived as `undefined` (the ref was
// delivered via the reserved `ref` key, which plain function components cannot
// receive). After the change, `forwardRef` is populated and is RHF's
// RefCallBack (a function).
//
// The full §20.6 acceptance cluster (no-warning, focus-on-error, regression)
// and the TestInput/TestSwitch harness migration land in P1.M1.T2.S1.
import { type ComponentType, type Ref } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig } from "@formality-ui/core";
import type { FormalityFieldComponentProps } from "../overlays";

// Module-level capture for the forwardRef handed to the plain component.
let capturedForwardRef: unknown;

interface PlainInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  name: string;
}

// A PLAIN function component (NOT React.forwardRef). It receives forwardRef
// as a regular prop because FormalityFieldComponentProps declares it.
const PlainInput: ComponentType<
  FormalityFieldComponentProps<PlainInputProps>
> = ({ forwardRef, ...rest }) => {
  capturedForwardRef = forwardRef;
  const domProps = rest as PlainInputProps;
  return (
    <input
      ref={forwardRef as Ref<HTMLInputElement>}
      data-testid={domProps.name}
      value={domProps.value ?? ""}
      onChange={(e) => domProps.onChange?.(e.target.value)}
      disabled={domProps.disabled}
    />
  );
};

const forwardRefInputs: Record<string, InputConfig> = {
  textField: {
    component: PlainInput,
    defaultValue: "",
  },
};

describe("Field — forwardRef delivery (PRD §20.1)", () => {
  it("delivers a non-undefined forwardRef to a plain function component", () => {
    render(
      <FormalityProvider inputs={forwardRefInputs}>
        <Form config={{ email: { type: "textField" } }}>
          <Field name="email" />
        </Form>
      </FormalityProvider>,
    );

    expect(capturedForwardRef).toBeDefined();
    // RHF's field.ref is a RefCallBack (a function), not a Ref object.
    expect(typeof capturedForwardRef).toBe("function");
  });
});
