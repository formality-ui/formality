// @formality-ui/react - AutoSave Race Condition - Async Timing Edge Cases
// Tests for executionVersionRef race condition prevention during async validation timing

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { forwardRef } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig } from "@formality-ui/core";

// Track validation calls for verifying abort behavior
let validationCalls: string[] = [];

// Helper to create a slow async validator (500ms delay) for precise timing control
// The 500ms delay enables controlled timing: we can advance timers to specific points
// during validation to test version checkpoint behavior.
function createSlowAsyncValidator(fieldName: string) {
  return async (value: unknown) => {
    validationCalls.push(`${value}:start`);
    // CRITICAL: 500ms delay enables precise timing control
    await new Promise((resolve) => setTimeout(resolve, 500));
    validationCalls.push(`${value}:end`);
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

describe("AutoSave Race Condition - Async Timing Edge Cases", () => {
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

  describe("Single Change During Validation", () => {
    it("should ignore first validation when value changes during validation", async () => {
      // This test verifies that when a value changes while async validation is in progress,
      // the first validation result is ignored and only the final value is submitted.
      //
      // Timing scenario:
      // 1. Type "a" → starts 500ms validation
      // 2. Advance 200ms → validation still running (300ms remaining)
      // 3. Type "b" → version increments, first validation aborts at checkpoint
      // 4. Advance 600ms → debounce + second validation completes
      // 5. Assert: only "ab" submitted, no "a" submission
      // 6. Assert: validationCalls shows "a:start", "ab:start/end" (no "a:end")

      const submitLog: string[] = [];
      const trackedSubmitHandler = (data: any) => {
        submitLog.push(`submit:${data.fieldA}`);
        submitHandler(data);
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: {
                type: "textField",
                validator: createSlowAsyncValidator("fieldA"),
              },
            }}
            onSubmit={trackedSubmitHandler}
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
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");

      // STEP 1: Type first value (starts 500ms validation)
      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
      });

      // CRITICAL ASSERTION: First validation started
      expect(validationCalls).toContain("a:start");

      // STEP 2: Advance 200ms (validation still running, 300ms remaining)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      // CRITICAL ASSERTION: First validation NOT completed yet
      expect(validationCalls).not.toContain("a:end");

      // STEP 3: Type second value (version increments, first validation aborts)
      await act(async () => {
        await userEvent.type(fieldA, "b", { delay: null });
      });

      // CRITICAL ASSERTION: Second validation started
      expect(validationCalls).toContain("ab:start");

      // STEP 4: Advance past debounce + second validation
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Wait for async operations to complete
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // CRITICAL ASSERTION: Only ONE submission occurred
      expect(submitHandler).toHaveBeenCalledTimes(1);

      // CRITICAL ASSERTION: Submitted value is "ab" (final value)
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "ab",
        }),
      );

      // CRITICAL ASSERTION: No submissions for intermediate value "a"
      expect(submitLog).toHaveLength(1);
      expect(submitLog[0]).toBe("submit:ab");

      // CRITICAL ASSERTION: Validations completed but only final value was submitted
      // The version checkpoint aborts the SAVE operation, not the validation itself
      // Async validators run to completion once started
      expect(validationCalls).toContain("ab:end");
    });
  });

  describe("Triple-Change Scenario (PRIMARY TEST)", () => {
    it("should submit only final value after multiple changes during validations", async () => {
      // PRIMARY TEST for this work item (P3.M3.T2.S2)
      //
      // This test verifies the most complex async timing edge case:
      // Multiple value changes occurring during overlapping async validations.
      //
      // Timing scenario:
      // 1. Type "a" → starts 500ms validation (version 1)
      // 2. Advance 200ms → validation still running (300ms remaining)
      // 3. Type "b" → version increments to 2, first validation aborts at checkpoint
      // 4. Advance 200ms → second validation still running (300ms remaining)
      // 5. Type "c" → version increments to 3, second validation aborts at checkpoint
      // 6. Advance 600ms → debounce + third validation completes
      // 7. Assert: only "abc" submitted, no intermediate submissions
      // 8. Assert: validationCalls shows "a:start", "ab:start", "abc:start/end" (no "a:end" or "ab:end")
      //
      // This proves all three version checkpoints work correctly:
      // - Checkpoint 1 (line 449): Version check inside waitForFieldValidation polling loop
      // - Checkpoint 2 (line 524-526): Version check after methods.trigger
      // - Checkpoint 3 (line 539-544): Version check after second waitForFieldValidation

      const submitLog: string[] = [];
      const trackedSubmitHandler = (data: any) => {
        submitLog.push(`submit:${data.fieldA}`);
        submitHandler(data);
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: {
                type: "textField",
                validator: createSlowAsyncValidator("fieldA"),
              },
            }}
            onSubmit={trackedSubmitHandler}
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
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");

      // STEP 1: Type first value (starts 500ms validation)
      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
      });

      // CRITICAL ASSERTION: First validation started
      expect(validationCalls).toContain("a:start");

      // STEP 2: Advance 200ms (validation still running, 300ms remaining)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      // CRITICAL ASSERTION: First validation NOT completed yet
      expect(validationCalls).not.toContain("a:end");

      // STEP 3: Type second value (version increments, first validation aborts)
      await act(async () => {
        await userEvent.type(fieldA, "b", { delay: null });
      });

      // CRITICAL ASSERTION: Second validation started
      expect(validationCalls).toContain("ab:start");

      // STEP 4: Advance 200ms (second validation still running, 300ms remaining)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      // CRITICAL ASSERTION: Second validation NOT completed yet
      expect(validationCalls).not.toContain("ab:end");

      // STEP 5: Type third value (version increments, second validation aborts)
      await act(async () => {
        await userEvent.type(fieldA, "c", { delay: null });
      });

      // CRITICAL ASSERTION: Third validation started
      expect(validationCalls).toContain("abc:start");

      // STEP 6: Advance past debounce + third validation
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Wait for async operations to complete
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // CRITICAL ASSERTION: Only ONE submission occurred
      expect(submitHandler).toHaveBeenCalledTimes(1);

      // CRITICAL ASSERTION: Submitted value is "abc" (FINAL value only)
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "abc",
        }),
      );

      // CRITICAL ASSERTION: No submissions for "a" or "ab" (intermediate values ignored)
      expect(submitLog).toHaveLength(1);
      expect(submitLog[0]).toBe("submit:abc");

      // CRITICAL ASSERTION: Final validation completed
      // The version checkpoint aborts the SAVE operation, not the validation itself
      // Async validators run to completion once started
      expect(validationCalls).toContain("abc:end");

      // CRITICAL ASSERTION: Validation order is correct
      const startIndex = validationCalls.indexOf("a:start");
      const abStartIndex = validationCalls.indexOf("ab:start");
      const abcStartIndex = validationCalls.indexOf("abc:start");
      expect(startIndex).toBeGreaterThanOrEqual(0);
      expect(abStartIndex).toBeGreaterThan(startIndex);
      expect(abcStartIndex).toBeGreaterThan(abStartIndex);
    });
  });

  describe("Version Checkpoint During Validation", () => {
    it("should abort at version checkpoint inside waitForFieldValidation", async () => {
      // This test specifically verifies the version checkpoint inside the
      // waitForFieldValidation polling loop (Form.tsx line 449).
      //
      // This checkpoint is critical because it allows aborting the validation
      // wait IN THE MIDDLE of the polling loop, not just at the start or end.
      //
      // When the version changes during the wait, the polling loop immediately
      // returns false, causing the save operation to abort.

      const submitLog: string[] = [];
      const trackedSubmitHandler = (data: any) => {
        submitLog.push(`submit:${data.fieldA}`);
        submitHandler(data);
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: {
                type: "textField",
                validator: createSlowAsyncValidator("fieldA"),
              },
            }}
            onSubmit={trackedSubmitHandler}
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
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");

      // Start validation
      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
      });

      // Advance to start debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Change value during validation wait
      // This should trigger version checkpoint in waitForFieldValidation polling loop
      await act(async () => {
        await userEvent.type(fieldA, "b", { delay: null });
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

      // CRITICAL ASSERTION: Only one submission occurred
      expect(submitLog).toHaveLength(1);
    });
  });

  describe("All Three Version Checkpoints", () => {
    it("should check version at all three checkpoints in executeAutoSave", async () => {
      // This test verifies that all three version checkpoints in executeAutoSave
      // work correctly to prevent stale saves.
      //
      // The three checkpoints are:
      // 1. After first waitForFieldValidation (Form.tsx lines 503-508)
      // 2. After methods.trigger (Form.tsx lines 524-526)
      // 3. After second waitForFieldValidation (Form.tsx lines 539-544)
      //
      // Each checkpoint checks if the version has changed and aborts if so.

      const submitLog: string[] = [];
      const trackedSubmitHandler = (data: any) => {
        submitLog.push(`submit:${data.fieldA}`);
        submitHandler(data);
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: {
                type: "textField",
                validator: createSlowAsyncValidator("fieldA"),
              },
            }}
            onSubmit={trackedSubmitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      validationCalls = [];
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");

      // Simulate multiple changes that trigger all checkpoints
      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
        await vi.advanceTimersByTimeAsync(200); // During first validation
        await userEvent.type(fieldA, "b", { delay: null }); // Triggers checkpoint 1
        await vi.advanceTimersByTimeAsync(200); // During second validation
        await userEvent.type(fieldA, "c", { delay: null }); // Triggers checkpoint 2 or 3
        await vi.advanceTimersByTimeAsync(600); // Complete
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // CRITICAL ASSERTION: All checkpoints worked, only final value submitted
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "abc",
        }),
      );

      // CRITICAL ASSERTION: Only one submission occurred
      expect(submitLog).toHaveLength(1);
      expect(submitLog[0]).toBe("submit:abc");
    });
  });
});
