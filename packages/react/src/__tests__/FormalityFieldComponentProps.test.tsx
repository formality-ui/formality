import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import type { FormalityFieldComponentProps } from "../overlays";

interface SmokeProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

// Representative consumer component: strips state/formState/forwardRef out
// before spreading the rest onto the underlying <input>.
const SmokeField: ComponentType<FormalityFieldComponentProps<SmokeProps>> = ({
  state,
  formState,
  forwardRef,
  ...domProps
}) => (
  <input
    aria-label={(domProps as { label?: string }).label ?? "field"}
    // forwardRef is a RefCallBack; wiring it here is fine.
    ref={forwardRef as React.Ref<HTMLInputElement> | undefined}
    value={(domProps as { value?: string }).value ?? ""}
    onChange={(e) =>
      (domProps as { onChange?: (v: string) => void }).onChange?.(
        e.target.value,
      )
    }
    data-touched={
      state && "isTouched" in state ? String(state.isTouched) : "n/a"
    }
    data-formstate={formState ? "present" : "absent"}
  />
);

describe("FormalityFieldComponentProps", () => {
  it("renders a representative component typed by FormalityFieldComponentProps", () => {
    render(<SmokeField label="name" value="abc" onChange={() => {}} />);
    expect(screen.getByLabelText("name")).toHaveValue("abc");
    expect(screen.getByLabelText("name")).toHaveAttribute(
      "data-touched",
      "n/a",
    );
  });
});
