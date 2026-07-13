// @formality-ui/react - useFormState Hook Tests
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { forwardRef } from "react";
import type { ReactNode } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Form } from "../components/Form";
import { FormalityProvider } from "../components/FormalityProvider";
import { useFormState } from "../hooks/useFormState";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";

// Test input component (mirrors Form.test.tsx so RHF register works through <Form>)
interface TestInputProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={(value as string) ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}
    />
  ),
);

TestInput.displayName = "TestInput";

// Test inputs config (verbatim shape from Form.test.tsx)
const testInputs: Record<string, InputConfig> = {
  textField: {
    component: TestInput,
    defaultValue: "",
  },
};

// Create wrapper with record and config for testing the hook inside <Form>.
const createWrapper = (
  record: Record<string, unknown> = {},
  config: FormFieldsConfig = {},
) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <FormalityProvider inputs={testInputs}>
        <Form config={config} record={record}>
          {children}
        </Form>
      </FormalityProvider>
    );
  };

// Dedicated wrapper for the outside-<Form> scenario.
// Provides an RHF FormContext (so rhfContext.control is valid) WITHOUT a
// Formality <Form>/<FormalityProvider>, so useFormalityFormContext() throws
// and the hook's try/catch degrades formalityContext to null.
function OutsideFormWrapper({ children }: { children: ReactNode }) {
  const methods = useForm({ defaultValues: { x: "val" } });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("useFormState", () => {
  describe("single watched name", () => {
    it("should expose the watched field with its record default value", () => {
      const wrapper = createWrapper(
        { x: "hello" },
        { x: { type: "textField" } },
      );
      const { result } = renderHook(() => useFormState({ name: "x" }), {
        wrapper,
      });

      expect(result.current.fields.x).toBeDefined();
      // The hook normalizes fieldNames to an array (Array.isArray ? array : [name])
      // before passing to useWatch, so useWatch always sees an array name and
      // returns an array. The hook then wraps single-length results again
      // (`fieldNames.length === 1 ? [watchedValues] : watchedValues`), so the
      // single-name field value is the watched array ["hello"].
      expect(result.current.fields.x.value).toEqual(["hello"]);

      // Each field is a proxy per makeProxyState — its inner properties
      // (value, isTouched, ...) are lazy getters, mirroring makeProxyState.test.ts
      const valueDescriptor = Object.getOwnPropertyDescriptor(
        result.current.fields.x,
        "value",
      );
      expect(valueDescriptor?.get).toBeTypeOf("function");
      expect(valueDescriptor?.set).toBeUndefined();
      expect(valueDescriptor?.value).toBeUndefined();

      // CustomFieldState hard-coded flags per hook body
      expect(result.current.fields.x.isTouched).toBe(false);
      expect(result.current.fields.x.isDirty).toBe(false);
      expect(result.current.fields.x.invalid).toBe(false);
      expect(result.current.fields.x.isValidating).toBe(false);
      expect(result.current.fields.x.error).toBeUndefined();
    });
  });

  describe("multiple watched names", () => {
    it("should expose all watched fields with their record default values", () => {
      const wrapper = createWrapper(
        { a: "A", b: "B" },
        { a: { type: "textField" }, b: { type: "textField" } },
      );
      const { result } = renderHook(() => useFormState({ name: ["a", "b"] }), {
        wrapper,
      });

      expect(Object.keys(result.current.fields).sort()).toEqual(["a", "b"]);
      // Multi-name path: useWatch returns [valA, valB] and length !== 1, so the
      // hook uses watchedValues directly → each field value is the bare value.
      expect(result.current.fields.a.value).toBe("A");
      expect(result.current.fields.b.value).toBe("B");
    });
  });

  describe("empty name array early return", () => {
    it("should return an empty fields object via the early-return branch", () => {
      const wrapper = createWrapper({}, {});
      const { result } = renderHook(
        () => useFormState({ name: [] as string[] }),
        { wrapper },
      );

      // Early `return result;` when fieldNames.length === 0
      expect(result.current.fields).toEqual({});

      // record getter is still wired even on the early-return path
      const recordDescriptor = Object.getOwnPropertyDescriptor(
        result.current,
        "record",
      );
      expect(recordDescriptor?.get).toBeTypeOf("function");
    });
  });

  describe("lazy record getter", () => {
    it("should define record as a lazy getter via Object.defineProperty", () => {
      const record = { id: 42, name: "rec" };
      const wrapper = createWrapper(record, {
        id: { type: "textField" },
      });
      const { result } = renderHook(() => useFormState({ name: "id" }), {
        wrapper,
      });

      const state = result.current;
      const recordDescriptor = Object.getOwnPropertyDescriptor(state, "record");

      // Getter contract (mirrors makeProxyState.test.ts assertions)
      expect(recordDescriptor?.get).toBeTypeOf("function");
      expect(recordDescriptor?.set).toBeUndefined();
      expect(recordDescriptor?.enumerable).toBe(true);
      expect(recordDescriptor?.configurable).toBe(true);
      expect(recordDescriptor?.value).toBeUndefined();

      // Reads FormContext.record (deep equality — robust to ref changes)
      expect(state.record).toEqual({ id: 42, name: "rec" });
    });
  });

  describe("outside a Form (try/catch null-context fallback)", () => {
    it("should swallow the thrown Formality context error and degrade record to {}", () => {
      const { result } = renderHook(() => useFormState({ name: "x" }), {
        wrapper: OutsideFormWrapper,
      });

      // Hook did not throw; returned a valid IsolatedFormState
      expect(result.current).toBeDefined();
      expect(result.current.fields.x).toBeDefined();

      // Formality context fell to null → record getter returns {}
      expect(result.current.record).toEqual({});

      const recordDescriptor = Object.getOwnPropertyDescriptor(
        result.current,
        "record",
      );
      expect(recordDescriptor?.get).toBeTypeOf("function");
    });
  });
});
