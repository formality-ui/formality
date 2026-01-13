// @formality-ui/core - State Type Tests
// Behavioral tests for FieldState and FieldStateInput type consistency

import { describe, it, expect } from "vitest";
import type { FieldState, FieldStateInput } from "../types";

describe("FieldState type with disabled property", () => {
  it("should accept disabled property", () => {
    const fieldState: FieldState = {
      value: "test",
      isTouched: false,
      isDirty: false,
      isValidating: false,
      invalid: false,
      disabled: true,
    };
    expect(fieldState.disabled).toBe(true);
  });

  it("should accept disabled: false", () => {
    const fieldState: FieldState = {
      value: "test",
      isTouched: false,
      isDirty: false,
      isValidating: false,
      invalid: false,
      disabled: false,
    };
    expect(fieldState.disabled).toBe(false);
  });

  it("should work without disabled property (backward compatibility)", () => {
    const fieldState: FieldState = {
      value: "test",
      isTouched: false,
      isDirty: false,
      isValidating: false,
      invalid: false,
      // disabled not provided
    };
    expect(fieldState.disabled).toBeUndefined();
  });

  it("should accept all required properties without disabled", () => {
    const fieldState: FieldState = {
      value: null,
      isTouched: true,
      isDirty: true,
      isValidating: false,
      invalid: true,
      error: { type: "required", message: "This field is required" },
    };
    expect(fieldState.disabled).toBeUndefined();
    expect(fieldState.error).toBeDefined();
    expect(fieldState.error?.type).toBe("required");
  });

  it("should accept watchers property along with disabled", () => {
    const fieldState: FieldState = {
      value: "test",
      isTouched: false,
      isDirty: false,
      isValidating: false,
      invalid: false,
      disabled: true,
      watchers: { field1: true, field2: true },
    };
    expect(fieldState.disabled).toBe(true);
    expect(fieldState.watchers).toEqual({ field1: true, field2: true });
  });
});

describe("FieldStateInput type with disabled property", () => {
  it("should accept disabled property", () => {
    const fieldStateInput: FieldStateInput = {
      value: "test",
      disabled: true,
    };
    expect(fieldStateInput.disabled).toBe(true);
  });

  it("should accept disabled: false", () => {
    const fieldStateInput: FieldStateInput = {
      value: "test",
      disabled: false,
    };
    expect(fieldStateInput.disabled).toBe(false);
  });

  it("should work without disabled property", () => {
    const fieldStateInput: FieldStateInput = {
      value: "test",
    };
    expect(fieldStateInput.disabled).toBeUndefined();
  });

  it("should accept all optional properties including disabled", () => {
    const fieldStateInput: FieldStateInput = {
      value: "test",
      isTouched: true,
      isDirty: true,
      isValidating: false,
      error: { type: "custom" },
      invalid: false,
      disabled: true,
    };
    expect(fieldStateInput.disabled).toBe(true);
    expect(fieldStateInput.isTouched).toBe(true);
    expect(fieldStateInput.isDirty).toBe(true);
  });
});

describe("FieldState type consistency", () => {
  it("should have same property types for common fields", () => {
    // Both FieldState and FieldStateInput have value: unknown
    const fieldState: FieldState = {
      value: "test",
      isTouched: false,
      isDirty: false,
      isValidating: false,
      invalid: false,
      disabled: true,
    };

    const fieldStateInput: FieldStateInput = {
      value: "test",
      disabled: true,
    };

    expect(typeof fieldState.value).toBe(typeof fieldStateInput.value);
    expect(fieldState.disabled).toBe(fieldStateInput.disabled);
  });

  it("should support disabled property assignment from FieldStateInput", () => {
    const fieldStateInput: FieldStateInput = {
      value: "test",
      disabled: true,
    };

    // This demonstrates type compatibility for disabled property
    const isDisabled = fieldStateInput.disabled ?? false;
    expect(isDisabled).toBe(true);
  });
});
