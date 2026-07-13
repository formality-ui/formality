// @formality-ui/react - useField Hook Tests
//
// Smoke tests for the real `useField` implementation (PRD §1.3.3 / §5.3 / §20).
// The hook owns the entire RHF Controller lifecycle for a single field; these
// tests render it through the real <FormalityProvider><Form> wrapper (the same
// provider stack the public <Field> component runs in) and assert the
// UseFieldReturn contract holds. The exhaustive behavioral parity gate lives
// in Field.test.tsx / Field.forwardRef.test.tsx /
// Field.subscriptionStability.test.tsx / validation-report-fixes.test.tsx
// (which exercise the same logic through the thin <Field> wrapper).
import { describe, it, expect } from "vitest";
import { render, renderHook } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Form } from "../components/Form";
import { FormalityProvider } from "../components/FormalityProvider";
import { useField } from "../hooks/useField";
import type { UseFieldParams, UseFieldReturn } from "../hooks/useField";
import type { InputConfig } from "@formality-ui/core";

// Test input component (consumes §20.4 `forwardRef` prop).
interface TestInputProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  name: string;
  forwardRef?: React.Ref<HTMLInputElement>;
}
const TestInput = ({
  value,
  onChange,
  disabled,
  name,
  forwardRef,
}: TestInputProps) => (
  <input
    ref={forwardRef}
    data-testid={name}
    value={(value as string) ?? ""}
    onChange={(e) => onChange?.(e.target.value)}
    disabled={disabled}
  />
);
TestInput.displayName = "TestInput";

const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
};

// Wrapper that mounts useField inside a real <FormalityProvider><Form>.
const createWrapper =
  () =>
  ({ children }: { children: ReactNode }): ReactElement => (
    <FormalityProvider inputs={testInputs}>
      <Form config={{ email: { type: "textField" } }}>{children}</Form>
    </FormalityProvider>
  );

describe("useField (gap_analysis G6 — PRD §1.3.3)", () => {
  it("returns the UseFieldReturn contract (renderedField is a ReactElement)", () => {
    const params = { name: "email" } as UseFieldParams;
    const { result } = renderHook(() => useField(params), {
      wrapper: createWrapper(),
    });

    const ret: UseFieldReturn = result.current;
    // renderedField is the <Controller> element (a valid ReactElement) when
    // the field is visible, null when hidden. The default email field is
    // visible → a ReactElement.
    expect(ret.renderedField).not.toBeNull();
    expect(typeof ret.renderedField).toBe("object");
    // The contract fields are present (structural shape).
    expect(ret).toHaveProperty("fieldState");
    expect(ret).toHaveProperty("fieldProps");
    expect(ret).toHaveProperty("watchers");
    expect(ret).toHaveProperty("formState");
    // watchers is a plain object (no subscribers → empty).
    expect(ret.watchers).toEqual({});
  });

  it("returns null renderedField when the field is hidden via the hidden prop", () => {
    const params = { name: "email", hidden: true } as UseFieldParams;
    const { result } = renderHook(() => useField(params), {
      wrapper: createWrapper(),
    });

    // Hidden → Controller never mounts → renderedField is null.
    expect(result.current.renderedField).toBeNull();
  });

  it("applies the render-prop children against the live Controller state", () => {
    // Render via the public <Field> wrapper (which threads children through to
    // useField) to exercise the render-prop path end-to-end. The render-prop
    // receives the UseFieldReturn-shaped api with the live fieldState.
    let captured: UseFieldReturn | null = null;
    const RenderPropProbe = (): ReactElement => {
      const params = {
        name: "email",
        children: (api: UseFieldReturn) => {
          captured = api;
          return <span data-testid="render-prop-output">rendered</span>;
        },
      } as unknown as UseFieldParams;
      // Use useField directly so the render-prop is the hook's own path.
      const { renderedField } = useField(params);
      return <>{renderedField}</>;
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={{ email: { type: "textField" } }}>
          <RenderPropProbe />
        </Form>
      </FormalityProvider>,
    );

    expect(captured).not.toBeNull();
    expect(captured).toHaveProperty("fieldState");
    expect(captured).toHaveProperty("renderedField");
    expect(captured).toHaveProperty("fieldProps");
    expect(captured).toHaveProperty("watchers");
    expect(captured).toHaveProperty("formState");
  });
});
