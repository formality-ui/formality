// @formality-ui/react - AutoSave Validation Tests
// Tests for coordinated validation during auto-save

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
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

// Test input components
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown;
}

// §20 delivers `forwardRef` as a prop, so the React `forwardRef()` wrap is
// unnecessary (and would warn about an unused ref param). Plain components:
const TestInput = ({
  value,
  onChange,
  name,
  forwardRef,
  ...props
}: TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }) => (
  <input
    ref={forwardRef}
    data-testid={name}
    value={value ?? ""}
    onChange={(e) => onChange?.(e.target.value)}
    {...props}
  />
);
TestInput.displayName = "TestInput";

interface TestSwitchProps {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown;
}

const TestSwitch = ({
  value,
  onChange,
  name,
  forwardRef,
  ...props
}: TestSwitchProps & { forwardRef?: React.Ref<HTMLInputElement> }) => (
  <input
    ref={forwardRef}
    type="checkbox"
    data-testid={name}
    checked={value ?? false}
    onChange={(e) => onChange?.(e.target.checked)}
    {...props}
  />
);
TestSwitch.displayName = "TestSwitch";

// Test inputs config
const testInputs: Record<string, InputConfig> = {
  textField: {
    component: TestInput,
    defaultValue: "",
  },
  switch: {
    component: TestSwitch,
    defaultValue: false,
  },
  anotherField: {
    component: TestInput,
    defaultValue: "",
  },
};

describe("AutoSave Validation Coordination", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    validationCalls = [];
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("ROOT CAUSE: All fields validating on any change", () => {
    it("should NOT validate ALL fields when ONE field changes with autoSave", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: {
                type: "textField",
                validator: createAsyncValidator("fieldA"),
              },
              fieldB: {
                type: "textField",
                validator: createAsyncValidator("fieldB"),
              },
              fieldC: {
                type: "textField",
                validator: createAsyncValidator("fieldC"),
              },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
            <Field name="fieldB" />
            <Field name="fieldC" />
          </Form>
        </FormalityProvider>,
      );

      // Wait for initial render and clear any initial validations
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      validationCalls = [];

      // Change ONLY fieldA
      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "x", { delay: null });
      });

      // Advance past debounce period
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // CRITICAL ASSERTION: Only fieldA should have validated, NOT fieldB or fieldC
      // This is the ROOT CAUSE test - if this fails, all fields are validating on every change
      const fieldBValidations = validationCalls.filter((c) =>
        c.startsWith("fieldB"),
      );
      const fieldCValidations = validationCalls.filter((c) =>
        c.startsWith("fieldC"),
      );

      // These should be empty - fieldB and fieldC should NOT validate when only fieldA changed
      expect(fieldBValidations).toHaveLength(0);
      expect(fieldCValidations).toHaveLength(0);
    });
  });

  describe("Dependent Field Validation", () => {
    it("should validate dependent fields but NOT independent fields", async () => {
      // fieldB depends on fieldA via condition
      // fieldC is independent
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "switch" },
              fieldB: {
                type: "textField",
                validator: createAsyncValidator("fieldB"),
                conditions: [{ when: "fieldA", is: true, disabled: true }],
              },
              fieldC: {
                type: "textField",
                validator: createAsyncValidator("fieldC"),
              },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
            <Field name="fieldB" />
            <Field name="fieldC" />
          </Form>
        </FormalityProvider>,
      );

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      validationCalls = [];

      // Change fieldA (which affects fieldB via condition)
      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.click(fieldA);
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // fieldC should NOT validate (it's independent of fieldA)
      const fieldCValidations = validationCalls.filter((c) =>
        c.startsWith("fieldC"),
      );
      expect(fieldCValidations).toHaveLength(0);
    });
  });

  describe("Async Validation Waiting", () => {
    it("should wait for async validators to complete before submitting", async () => {
      // Test that submit happens AFTER async validation completes, not before
      const validationLog: string[] = [];

      const asyncValidator = async (value: unknown) => {
        validationLog.push("validation:start");
        await new Promise((r) => setTimeout(r, 100));
        validationLog.push("validation:end");
        return true;
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField", validator: asyncValidator },
            }}
            onSubmit={() => {
              validationLog.push("submit");
              submitHandler();
            }}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      // Change field
      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "test", { delay: null });
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Advance past async validation delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      // Submit should have been called
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      // Verify submit happened AFTER validation completed
      const submitIndex = validationLog.indexOf("submit");
      const validationEndIndex = validationLog.lastIndexOf("validation:end");
      expect(submitIndex).toBeGreaterThan(validationEndIndex);
    });
  });

  describe("Cascading Changes", () => {
    it("should debounce multiple rapid changes and only submit once", async () => {
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

      // Type multiple characters rapidly
      await act(async () => {
        await userEvent.type(fieldA, "hello", { delay: null });
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Should only submit ONCE with final value
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "hello",
        }),
      );
    });

    it("should reset debounce timer when new change comes in", async () => {
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

      // Change fieldA
      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
      });

      // Wait 300ms (less than debounce)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // No submit yet
      expect(submitHandler).not.toHaveBeenCalled();

      // Change fieldB before debounce completes
      const fieldB = screen.getByTestId("fieldB");
      await act(async () => {
        await userEvent.type(fieldB, "b", { delay: null });
      });

      // Wait another 300ms (600ms total from first change, 300ms from second)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // Still no submit (debounce restarted)
      expect(submitHandler).not.toHaveBeenCalled();

      // Wait for full debounce from second change
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // NOW submit should happen, once, with both values
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

  describe("Validation Errors", () => {
    it("should NOT submit if validation fails", async () => {
      const failingValidator = async () => {
        return "Validation failed";
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField", validator: failingValidator },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={100}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      // Change field
      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "test", { delay: null });
      });

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // Submit should NOT be called (validation failed)
      expect(submitHandler).not.toHaveBeenCalled();
    });
  });

  describe("Unrelated Invalid Field (Issue 2)", () => {
    // Regression for BUG_REPORT.md Issue 2: executeAutoSave used to bail if ANY
    // field in the form had an error, so one invalid field silently blocked
    // auto-save of unrelated, perfectly-valid edits. The per-changed-field +
    // affected-field checks already gate the save on exactly the fields that
    // matter, so the whole-form guard was both redundant and over-broad.

    it("should auto-save a valid field even when an unrelated field is invalid", async () => {
      // fieldA is required + empty (invalid). fieldB is unconstrained (valid).
      // Editing fieldB must still submit, despite fieldA's error.
      const requiredValidator = async (value: unknown) =>
        value ? true : "required";

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              email: { type: "textField", validator: requiredValidator },
              notes: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={300}
          >
            {({ formState }) => (
              <>
                {/* Reading formState.errors here activates RHF's formState
                    proxy subscription, so the unrelated `email` error is
                    actually tracked — which is what made the old whole-form
                    guard trip (see BUG_REPORT.md Issue 2). */}
                <span data-testid="error-count">
                  {Object.keys(formState.errors).length}
                </span>
                <Field name="email" />
                <Field name="notes" />
              </>
            )}
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      // Establish the unrelated error: type into email, then clear it so it is
      // empty and fails the required validator. This drives the error into RHF
      // formState via onChange validation.
      const email = screen.getByTestId("email");
      await act(async () => {
        await userEvent.type(email, "x", { delay: null });
        await userEvent.clear(email);
      });

      // Let email's own auto-save attempt resolve (it must abort — email is
      // invalid) and its validation land in formState.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });
      // email is invalid → its auto-save correctly does NOT fire.
      expect(submitHandler).not.toHaveBeenCalled();
      // And the unrelated error is genuinely tracked in formState.errors.
      expect(screen.getByTestId("error-count")).toHaveTextContent("1");

      // Now edit the unrelated, valid `notes` field.
      const notes = screen.getByTestId("notes");
      await act(async () => {
        await userEvent.type(notes, "hello", { delay: null });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });

      // CRITICAL: notes' auto-save MUST fire even though email is still invalid.
      // Under the old whole-form-errors guard this returned silently → no save.
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ notes: "hello", email: "" }),
      );
    });

    it("should still NOT auto-save when the CHANGED field itself is invalid", async () => {
      // Safety check for the Issue 2 fix: removing the whole-form guard must not
      // also remove the per-changed-field guard. An invalid change is still blocked.
      const requiredValidator = async (value: unknown) =>
        value ? true : "required";

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField", validator: requiredValidator },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={300}
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "x", { delay: null });
        await userEvent.clear(fieldA); // ends up empty → invalid
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });

      // The changed field is invalid → still no auto-save (per-field guard holds).
      expect(submitHandler).not.toHaveBeenCalled();
    });
  });

  describe("Validation `mode` interplay with autoSave (PRD §11.1 #5)", () => {
    // Auto-save's Gate 1 triggers validation of changed fields itself (via
    // methods.trigger, which ignores `mode`), so auto-save is correct under any
    // mode — not just the default `onChange`. The critical case is `onTouched`:
    // a field's FIRST edit (before it loses focus) is NOT auto-validated by RHF,
    // so a naive "read the pre-computed error" gate would wrongly save an
    // invalid value. These tests lock in the mode-agnostic Gate 1 behavior.

    it("mode=onTouched: does NOT auto-save an invalid FIRST edit of an untouched field", async () => {
      const requiredValidator = async (value: unknown) =>
        value ? true : "required";

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField", validator: requiredValidator },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={300}
            mode="onTouched"
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");
      // First edit ends up empty → invalid. fieldA is never blurred, so under
      // onTouched RHF has NOT auto-validated it — only Gate 1's explicit
      // trigger() catches the error and blocks the save.
      await act(async () => {
        await userEvent.type(fieldA, "x", { delay: null });
        await userEvent.clear(fieldA);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });

      expect(submitHandler).not.toHaveBeenCalled();
    });

    it("mode=onTouched: DOES auto-save a valid FIRST edit of an untouched field", async () => {
      const requiredValidator = async (value: unknown) =>
        value ? true : "required";

      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField", validator: requiredValidator },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={300}
            mode="onTouched"
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "hello", { delay: null });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "hello" }),
      );
    });
  });

  describe("Immediate Submission (debounce: false)", () => {
    it("should call submitHandler immediately when inputConfig.debounce is false", async () => {
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
            <Field name="fieldA" inputConfig={{ debounce: false }} />
          </Form>
        </FormalityProvider>,
      );

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Clear any initial state
      submitHandler.mockClear();

      // Change field value (type single character to avoid multiple submissions)
      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "x", { delay: null });
      });

      // CRITICAL: submitHandler should be called WITHOUT waiting for debounce period
      // We only advance a small amount for async validation to complete (< debounce delay)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "x",
        }),
      );

      // Verify no pending debounce timers
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1 call
    });

    it("should contrast with normal debounce behavior", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              immediateField: { type: "textField" },
              debouncedField: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="immediateField" inputConfig={{ debounce: false }} />
            <Field name="debouncedField" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Change immediateField (type single character)
      const immediateField = screen.getByTestId("immediateField");
      await act(async () => {
        await userEvent.type(immediateField, "a", { delay: null });
      });

      // Should submit WITHOUT waiting for debounce (only wait for async validation)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          immediateField: "a",
        }),
      );

      // Change debouncedField (type single character)
      const debouncedField = screen.getByTestId("debouncedField");
      await act(async () => {
        await userEvent.type(debouncedField, "b", { delay: null });
      });

      // Should NOT submit yet (waiting for debounce)
      // Advance less than debounce period
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // Now should submit again with both values
      expect(submitHandler).toHaveBeenCalledTimes(2);
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          immediateField: "a",
          debouncedField: "b",
        }),
      );
    });
  });

  describe("Normal Debounce Preserved (Regression)", () => {
    // These tests explicitly verify that normal debounce behavior is preserved
    // after adding the debounce: false feature. They serve as regression tests
    // and documentation for expected behavior.

    beforeEach(() => {
      // Use the same setup from existing tests
      validationCalls = [];
      submitHandler = vi.fn();
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should use default 1000ms debounce when no debounce prop provided", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            // Note: No debounce prop - should use default 1000ms
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "test", { delay: null });
      });

      // CRITICAL: No immediate submission (normal debounce is active)
      expect(submitHandler).not.toHaveBeenCalled();

      // Advance past default 1000ms debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100); // 1000ms + buffer
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "test",
        }),
      );
    });

    it("should use form-level debounce prop when provided", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              fieldA: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={750} // Custom debounce value
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "test", { delay: null });
      });

      // No immediate submission
      expect(submitHandler).not.toHaveBeenCalled();

      // Advance past 750ms debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(850); // 750ms + buffer
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
    });

    it("should use normal debounce when inputConfig is undefined", async () => {
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
            {/* Field without inputConfig - uses normal debounce */}
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "test", { delay: null });
      });

      // CRITICAL: No immediate submission
      expect(submitHandler).not.toHaveBeenCalled();

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
    });

    it("should use normal debounce when inputConfig exists without debounce", async () => {
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
            {/* Field with empty inputConfig - uses normal debounce */}
            <Field name="fieldA" inputConfig={{}} />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");
      await act(async () => {
        await userEvent.type(fieldA, "test", { delay: null });
      });

      // No immediate submission
      expect(submitHandler).not.toHaveBeenCalled();

      // Advance past debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
    });

    it("should wait for debounce period before submitting (regression)", async () => {
      // This test explicitly documents that normal debounce waits for the
      // configured delay period before submitting. This is the key difference
      // from the debounce: false behavior (which submits immediately).

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

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");

      // Change field value
      await act(async () => {
        await userEvent.type(fieldA, "test", { delay: null });
      });

      // CRITICAL ASSERTION: submitHandler should NOT be called immediately
      // This is the key difference from debounce: false behavior
      expect(submitHandler).not.toHaveBeenCalled();

      // Partial debounce (300ms of 500ms)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // STILL no submission
      expect(submitHandler).not.toHaveBeenCalled();

      // Complete debounce (remaining 200ms + buffer)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // NOW submission should happen
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldA: "test",
        }),
      );
    });
  });

  describe("Mixed Debounce Settings (Integration)", () => {
    // These tests verify that fields with inputConfig.debounce === false submit
    // immediately while other fields use the form-level debounce.
    // This is crucial for forms containing both text fields (debounced)
    // and switches/toggles (immediate submission).

    beforeEach(() => {
      // Use the same setup from existing tests
      validationCalls = [];
      submitHandler = vi.fn();
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should submit immediately for debounce: false field while waiting for debounced fields", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              textField: { type: "textField" },
              switch: { type: "switch" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            {/* Uses form-level 500ms debounce */}
            <Field name="textField" />
            {/* Immediate submission */}
            <Field name="switch" inputConfig={{ debounce: false }} />
          </Form>
        </FormalityProvider>,
      );

      // Wait for initial render
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      submitHandler.mockClear();

      // CRITICAL: Change switch FIRST (immediate field)
      const switchField = screen.getByTestId("switch");
      await act(async () => {
        await userEvent.click(switchField);
      });

      // Advance a small amount for async validation
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // CRITICAL ASSERTION: submitHandler should be called IMMEDIATELY (1st call)
      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          switch: true,
        }),
      );

      // Now change textField (debounced field)
      const textField = screen.getByTestId("textField");
      await act(async () => {
        await userEvent.type(textField, "test", { delay: null });
      });

      // CRITICAL: submitHandler should NOT be called yet (waiting for debounce)
      expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1

      // Advance less than form-level 500ms debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // STILL no submission from textField
      expect(submitHandler).toHaveBeenCalledTimes(1);

      // Advance past form-level 500ms debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // NOW submitHandler should be called again (2nd call) with all values
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(2);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          textField: "test",
          switch: true,
        }),
      );
    });

    it("should use form-level debounce for fields without debounce: false", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              textField: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            {/* No inputConfig.debounce: false - uses form-level debounce */}
            <Field name="textField" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const textField = screen.getByTestId("textField");
      await act(async () => {
        await userEvent.type(textField, "test", { delay: null });
      });

      // No immediate submission
      expect(submitHandler).not.toHaveBeenCalled();

      // Advance less than form-level 500ms debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // STILL no submission
      expect(submitHandler).not.toHaveBeenCalled();

      // Advance past form-level 500ms debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // NOW submission happens
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          textField: "test",
        }),
      );
    });

    it("should use form-level debounce for fields with empty inputConfig", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              textField: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            {/* Empty inputConfig - still uses form-level debounce */}
            <Field name="textField" inputConfig={{}} />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const textField = screen.getByTestId("textField");
      await act(async () => {
        await userEvent.type(textField, "test", { delay: null });
      });

      // No immediate submission
      expect(submitHandler).not.toHaveBeenCalled();

      // Advance past form-level 500ms debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // NOW submission happens
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
    });

    it("should include all field values in final submission after debounce", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              textField: { type: "textField" },
              switch: { type: "switch" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="textField" />
            <Field name="switch" inputConfig={{ debounce: false }} />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const textField = screen.getByTestId("textField");
      const switchField = screen.getByTestId("switch");

      // Change switch (immediate)
      await act(async () => {
        await userEvent.click(switchField);
      });

      // Immediate submission with switch value
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ switch: true }),
      );

      // Change textField (debounced)
      await act(async () => {
        await userEvent.type(textField, "hello", { delay: null });
      });

      // Wait for form-level 500ms debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Final submission should include ALL field values
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(2);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          textField: "hello",
          switch: true,
        }),
      );
    });

    it("should handle rapid changes across mixed debounce fields correctly", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              textField: { type: "textField" },
              switch: { type: "switch" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="textField" />
            <Field name="switch" inputConfig={{ debounce: false }} />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const textField = screen.getByTestId("textField");
      const switchField = screen.getByTestId("switch");

      // Rapid changes across both fields
      await act(async () => {
        await userEvent.click(switchField); // Immediate submit
        await userEvent.type(textField, "a", { delay: null });
        await userEvent.click(switchField); // Another immediate submit
        await userEvent.type(textField, "b", { delay: null });
      });

      // Should have 2 immediate submissions from switch changes
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(submitHandler).toHaveBeenCalledTimes(2);

      // Advance past form-level debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Final submission with textField's last value
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(3);
      });

      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          textField: "ab",
          switch: false, // Switch was toggled twice, back to false
        }),
      );
    });

    it("should not cause timer conflicts between immediate and debounced fields", async () => {
      render(
        <FormalityProvider inputs={testInputs}>
          <Form
            config={{
              textField: { type: "textField" },
              switch: { type: "switch" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="textField" />
            <Field name="switch" inputConfig={{ debounce: false }} />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const textField = screen.getByTestId("textField");
      const switchField = screen.getByTestId("switch");

      // Change switch first
      await act(async () => {
        await userEvent.click(switchField);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Immediate submission for switch
      expect(submitHandler).toHaveBeenCalledTimes(1);

      // Verify no pending timers would trigger another immediate submission
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1

      // Change textField
      await act(async () => {
        await userEvent.type(textField, "test", { delay: null });
      });

      // Verify switch doesn't trigger another submission
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1); // Still just 1

      // Complete form-level debounce
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      // Now we get the second submission from textField
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(2);
      });
    });
  });
});
