// @formality-ui/react - useFieldDisabledState Hook Tests
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { Form } from "../components/Form";
import { FormalityProvider } from "../components/FormalityProvider";
import { useFieldDisabledState } from "../hooks/useFieldDisabledState";
import type { FormFieldsConfig } from "@formality-ui/core";

// Test inputs config
const testInputs = {
  textField: {
    component: ({ value, onChange, disabled }: any) => (
      <input value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} />
    ),
    defaultValue: "",
  },
};

// Create wrapper with record and config for testing conditions
const createWrapper = (record: Record<string, unknown> = {}, additionalConfig: FormFieldsConfig = {}) => {
  const config = { ...additionalConfig };
  return ({ children }: { children: React.ReactNode }) => (
    <FormalityProvider inputs={testInputs}>
      <Form config={config} record={record}>
        {children}
      </Form>
    </FormalityProvider>
  );
};

const wrapper = createWrapper();

describe("useFieldDisabledState", () => {
  describe("default state", () => {
    it("should return false when no sources provide disabled", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
        }),
        { wrapper }
      );

      expect(result.current).toBe(false);
    });
  });

  describe("JSX prop (highest priority)", () => {
    it("should prioritize JSX prop over config", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          disabledProp: true,
          fieldConfigDisabled: false,
        }),
        { wrapper }
      );

      // JSX prop (true) should override config (false)
      expect(result.current).toBe(true);
    });

    it("should prioritize JSX prop false over config true", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          disabledProp: false,
          fieldConfigDisabled: true,
        }),
        { wrapper }
      );

      // JSX prop (false) should override config (true)
      expect(result.current).toBe(false);
    });

    it("should use JSX prop when all other sources undefined", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          disabledProp: true,
        }),
        { wrapper }
      );

      expect(result.current).toBe(true);
    });
  });

  describe("field config priority", () => {
    it("should prioritize config over conditions", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          fieldConfigDisabled: true,
          conditions: [{ when: "otherField", is: false, disabled: false }],
        }),
        { wrapper }
      );

      // Config (true) should override conditions (false)
      expect(result.current).toBe(true);
    });

    it("should prioritize config over group", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          fieldConfigDisabled: false,
          groupDisabled: true,
        }),
        { wrapper }
      );

      // Config (false) should override group (true)
      expect(result.current).toBe(false);
    });
  });

  describe("conditions priority", () => {
    it("should prioritize conditions over group", () => {
      // otherField = false, so condition { when: "otherField", is: false, disabled: true } matches
      const testWrapper = createWrapper({ otherField: false }, { otherField: { type: "textField" } });
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          conditions: [{ when: "otherField", is: false, disabled: true }],
          groupDisabled: false,
        }),
        { wrapper: testWrapper }
      );

      // Conditions (true) should override group (false)
      expect(result.current).toBe(true);
    });

    it("should evaluate conditions with OR logic", () => {
      // otherField = false matches first condition
      const testWrapper = createWrapper(
        { otherField: false, anotherField: false },
        { otherField: { type: "textField" }, anotherField: { type: "textField" } }
      );
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          conditions: [
            { when: "otherField", is: false, disabled: true },
            { when: "anotherField", truthy: true, disabled: true },
          ],
        }),
        { wrapper: testWrapper }
      );

      // OR logic: any matching condition with disabled: true = disabled
      expect(result.current).toBe(true);
    });

    it("should return false when no disabled conditions match", () => {
      // otherField = false, but condition checks for is: true, so won't match
      const testWrapper = createWrapper({ otherField: false }, { otherField: { type: "textField" } });
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          conditions: [
            { when: "otherField", is: true, disabled: true }, // won't match (otherField is false)
          ],
        }),
        { wrapper: testWrapper }
      );

      // No conditions match, should return false
      expect(result.current).toBe(false);
    });
  });

  describe("group state priority", () => {
    it("should use group state when no other sources", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          groupDisabled: true,
        }),
        { wrapper }
      );

      expect(result.current).toBe(true);
    });

    it("should return true when group is disabled", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          groupDisabled: true,
        }),
        { wrapper }
      );

      expect(result.current).toBe(true);
    });
  });

  describe("disabled: false handling", () => {
    it("should handle disabled: false properly (undefined vs false)", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          disabledProp: false,
          fieldConfigDisabled: true,
        }),
        { wrapper }
      );

      // JSX prop (false) should override config (true)
      expect(result.current).toBe(false);
    });

    it("should treat undefined as 'not set' and false as 'explicitly enabled'", () => {
      const { result: resultUndefined } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          disabledProp: undefined,
          fieldConfigDisabled: true,
        }),
        { wrapper }
      );

      const { result: resultFalse } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          disabledProp: false,
          fieldConfigDisabled: true,
        }),
        { wrapper }
      );

      // undefined should fall through to config (true)
      expect(resultUndefined.current).toBe(true);
      // false should override config (true)
      expect(resultFalse.current).toBe(false);
    });
  });

  describe("subscription behavior", () => {
    it("should not create subscriptions when no conditions", () => {
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
        }),
        { wrapper }
      );

      // Should return false without issues (no subscriptions needed)
      expect(result.current).toBe(false);
    });

    it("should infer field dependencies from conditions", () => {
      // otherField = false, so condition matches
      const testWrapper = createWrapper({ otherField: false }, { otherField: { type: "textField" } });
      const { result } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          conditions: [{ when: "otherField", is: false, disabled: true }],
        }),
        { wrapper: testWrapper }
      );

      // Should infer "otherField" from conditions and evaluate to true
      expect(result.current).toBe(true);
    });
  });

  describe("priority order verification", () => {
    it("should follow full priority: prop > config > conditions > group > false", () => {
      // Test prop wins
      const { result: propResult } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          disabledProp: true,
          fieldConfigDisabled: false,
          conditions: [{ when: "x", disabled: false }],
          groupDisabled: false,
        }),
        { wrapper }
      );
      expect(propResult.current).toBe(true);

      // Test config wins when prop undefined
      const { result: configResult } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          fieldConfigDisabled: true,
          conditions: [{ when: "x", disabled: false }],
          groupDisabled: false,
        }),
        { wrapper }
      );
      expect(configResult.current).toBe(true);

      // Test conditions win when prop and config undefined
      // x = "yes" (truthy), so condition { when: "x", disabled: true } matches (truthy check)
      const testWrapper = createWrapper({ x: "yes" }, { x: { type: "textField" } });
      const { result: conditionsResult } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          conditions: [{ when: "x", disabled: true }],
          groupDisabled: false,
        }),
        { wrapper: testWrapper }
      );
      expect(conditionsResult.current).toBe(true); // x is truthy, condition matches

      // Test group wins when all above undefined
      const { result: groupResult } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
          groupDisabled: true,
        }),
        { wrapper }
      );
      expect(groupResult.current).toBe(true);

      // Test default false when all undefined
      const { result: defaultResult } = renderHook(
        () => useFieldDisabledState({
          fieldName: "email",
        }),
        { wrapper }
      );
      expect(defaultResult.current).toBe(false);
    });
  });
});
