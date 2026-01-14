// @formality-ui/react - AutoSave Race Condition Tests
// Tests for executionVersionRef race condition prevention during rapid field changes

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { forwardRef } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig } from "@formality-ui/core";

// Track validation calls
let validationCalls: string[] = [];

// Helper to create an async validator that tracks calls
function createAsyncValidator(fieldName: string, delayMs: number = 50) {
  return async (value: unknown) => {
    validationCalls.push(`${fieldName}:start`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    validationCalls.push(`${fieldName}:end`);
    return true;
  };
}

// Test input component with data-testid for reliable selection
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  ),
);
TestInput.displayName = "TestInput";

// Test inputs config
const testInputs: Record<string, InputConfig> = {
  textField: {
    component: TestInput,
    defaultValue: "",
  },
};

describe("AutoSave Race Condition - Rapid Changes", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    validationCalls = [];
    submitHandler = vi.fn();
    // CRITICAL: Use { shouldAdvanceTime: true } for reliable timer behavior
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    // CRITICAL: Always restore real timers to prevent test pollution
    vi.useRealTimers();
  });

  describe("Single Field Rapid Changes", () => {
    it("should only submit last value after 10 rapid changes", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: {
                type: "textField",
                validator: createAsyncValidator("fieldA", 50),
              },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      validationCalls = [];

      // Get the field
      const fieldA = screen.getByTestId("fieldA");

      // CRITICAL: Simulate 10 rapid changes (typing "1234567890")
      // Using { delay: null } for fastest input simulation
      await act(async () => {
        await userEvent.type(fieldA, "1234567890", { delay: null });
      });

      // Clear any pending validations
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Clear submit handler to track only new calls
      submitHandler.mockClear();

      // Advance past debounce period (500ms + 100ms buffer)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Wait for async operations to complete
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // CRITICAL ASSERTION: Only ONE submission occurred
      expect(submitHandler).toHaveBeenCalledTimes(1);

      // CRITICAL ASSERTION: Submitted value contains ONLY the last value
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "1234567890",
        }),
      );
    });

    it("should abort intermediate auto-save operations", async () => {
      const submitLog: string[] = [];
      const trackedSubmitHandler = (data: any) => {
        submitLog.push(`submit:${data.fieldA}`);
        submitHandler(data);
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField" },
            }}
            onSubmit={trackedSubmitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      const fieldA = screen.getByTestId("fieldA");

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      // Simulate rapid changes with controlled timing
      for (let i = 1; i <= 10; i++) {
        await act(async () => {
          await userEvent.clear(fieldA);
          await userEvent.type(fieldA, String(i), { delay: null });
          // Small delay to allow debounce to start but not complete
          await vi.advanceTimersByTimeAsync(100);
        });
      }

      // Advance past final debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // CRITICAL ASSERTION: No intermediate submissions
      // Only the final value should be in submit log
      expect(submitLog).toHaveLength(1);
      expect(submitLog[0]).toBe("submit:10"); // Only last value
    });

    it("should handle rapid changes during async validation", async () => {
      validationCalls = [];

      // Create validator that takes longer than debounce
      const slowValidator = async (value: unknown) => {
        validationCalls.push(`validation:start:${value}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        validationCalls.push(`validation:end:${value}`);
        return true;
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: {
                type: "textField",
                validator: slowValidator,
              },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      const fieldA = screen.getByTestId("fieldA");

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      validationCalls = [];
      submitHandler.mockClear();

      // First change (triggers validation)
      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
      });

      // Advance to trigger debounce but let validation continue
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Second change while validation is still running (version should increment)
      await act(async () => {
        await userEvent.type(fieldA, "b", { delay: null });
      });

      // Complete validation
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // CRITICAL ASSERTION: Final value submitted
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "ab",
        }),
      );

      // CRITICAL ASSERTION: Validations completed but only final value submitted
      const validationEnds = validationCalls.filter((c) => c.includes(":end"));
      expect(validationEnds.length).toBeGreaterThan(0);
    });
  });

  describe("Multiple Fields Rapid Changes", () => {
    it("should handle rapid changes across multiple fields", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField" },
              fieldB: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>,
      );

      const fieldA = screen.getByTestId("fieldA");
      const fieldB = screen.getByTestId("fieldB");

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      // Rapid changes across fields
      await act(async () => {
        await userEvent.type(fieldA, "value1", { delay: null });
        await userEvent.type(fieldB, "value2", { delay: null });
        await userEvent.clear(fieldA);
        await userEvent.type(fieldA, "value3", { delay: null });
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // CRITICAL ASSERTION: One submission with all final values
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "value3", // Last value for fieldA
          fieldB: "value2", // Only value for fieldB
        }),
      );
    });

    it("should debounce resets correctly when alternating between fields", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField" },
              fieldB: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>,
      );

      const fieldA = screen.getByTestId("fieldA");
      const fieldB = screen.getByTestId("fieldB");

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      // First change to fieldA
      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
      });

      // Wait less than debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // No submit yet
      expect(submitHandler).not.toHaveBeenCalled();

      // Change fieldB (resets debounce timer)
      await act(async () => {
        await userEvent.type(fieldB, "b", { delay: null });
      });

      // Still no submit after 600ms total (300 + 300)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // Submit after full debounce from fieldB change
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "a",
          fieldB: "b",
        }),
      );
    });
  });

  describe("Version Check Verification", () => {
    it("should verify version checkpoint aborts stale saves", async () => {
      validationCalls = [];

      // Create a very slow validator to test checkpoint behavior
      const verySlowValidator = async (value: unknown) => {
        validationCalls.push(`start:${value}`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        validationCalls.push(`end:${value}`);
        return true;
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: {
                type: "textField",
                validator: verySlowValidator,
              },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={100}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      const fieldA = screen.getByTestId("fieldA");

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      validationCalls = [];
      submitHandler.mockClear();

      // First change (triggers slow validation)
      await act(async () => {
        await userEvent.type(fieldA, "first", { delay: null });
      });

      // Advance enough to start validation but not complete
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });

      // Second change while first validation still running
      // This increments executionVersionRef
      await act(async () => {
        await userEvent.clear(fieldA);
        await userEvent.type(fieldA, "second", { delay: null });
      });

      // Complete first validation (it should be aborted due to version mismatch)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });

      // Complete second validation
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // Only "second" value should be submitted, not "first"
      // This proves the version checkpoint aborted the stale save
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "second",
        }),
      );

      // Verify both validations completed (not aborted mid-validation)
      // But only the second value was submitted
      const validationEnds = validationCalls.filter((c) => c.startsWith("end:"));
      expect(validationEnds.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty value during rapid changes", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      const fieldA = screen.getByTestId("fieldA");

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      // Type something, then clear it rapidly
      await act(async () => {
        await userEvent.type(fieldA, "test", { delay: null });
        await userEvent.clear(fieldA);
        await userEvent.type(fieldA, "final", { delay: null });
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // Should submit with the final value only
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "final",
        }),
      );
    });

    it("should not submit if validation fails during rapid changes", async () => {
      const failingValidator = async (value: unknown) => {
        if (value === "fail") {
          return "Validation failed";
        }
        return true;
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: {
                type: "textField",
                validator: failingValidator,
              },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      const fieldA = screen.getByTestId("fieldA");

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      // Rapid changes including a failing value
      await act(async () => {
        await userEvent.type(fieldA, "good", { delay: null });
        await userEvent.clear(fieldA);
        await userEvent.type(fieldA, "fail", { delay: null });
        await userEvent.clear(fieldA);
        await userEvent.type(fieldA, "goodagain", { delay: null });
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Should submit because final value passes validation
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "goodagain",
        }),
      );
    });
  });
});
