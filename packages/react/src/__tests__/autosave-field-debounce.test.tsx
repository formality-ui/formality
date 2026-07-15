// @formality-ui/react - AutoSave Per-Field Numeric Debounce Tests
//
// Regression coverage for BUG_REPORT.md Issue 1: a numeric `debounce` on an
// `InputConfig` was silently ignored — `changeField` only special-cased
// `debounce === false`, so any number (e.g. 4000) fell through to the single
// Form-level debounced submit (default 1000ms). These tests assert that a
// per-field numeric debounce is actually honored, that fields sharing a numeric
// debounce coalesce, that fields with different numeric debounces fire
// independently, and that `debounce: false` still submits immediately while a
// numeric-debounced field is still pending.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig } from "@formality-ui/core";

// Test input component with data-testid for reliable selection
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  [key: string]: unknown;
}

// §20 delivers `forwardRef` as a prop, so the React `forwardRef()` wrap is
// unnecessary (and would warn about an unused ref param). Plain component:
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
    type="text"
    value={value ?? ""}
    onChange={(e) => onChange?.(e.target.value)}
    {...props}
  />
);
TestInput.displayName = "TestInput";

// Base inputs WITHOUT a per-field debounce (so the Form-level default applies).
const baseInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
};

// Inputs where the `textField` type declares its own per-field debounce.
// This mirrors the consumer setup in BUG_REPORT.md (sellario config.tsx).
const inputsWithFieldDebounce: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "", debounce: 2000 },
  // A distinct type with a *different* numeric debounce, used to verify that
  // fields with different numeric debounces fire on independent timers.
  slowText: { component: TestInput, defaultValue: "", debounce: 4000 },
};

describe("AutoSave Per-Field Numeric Debounce (Issue 1)", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    // CRITICAL: { shouldAdvanceTime: true } matches the rest of the autosave suite
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Per-field numeric debounce is honored", () => {
    it("should NOT submit before the field's numeric debounce elapses (regression for Issue 1)", async () => {
      // Before the fix, `debounce: 2000` was dead config and the field saved at
      // the Form-level default (1000ms). This test asserts that no submit happens
      // at 1000ms — which would have happened under the old behavior.
      render(
        <FormalityProvider inputs={inputsWithFieldDebounce}>
          <Form
            config={{ fieldA: { type: "textField" } }}
            onSubmit={submitHandler}
            autoSave
            // No Form-level debounce → default 1000ms fallback (the value the
            // bug caused the field to erroneously use).
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
      });

      // Advance past the Form-level default (1000ms) but NOT past the field's
      // 2000ms debounce. Under the old behavior a submit would fire here.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // Advance past the field's 2000ms debounce → submit fires.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "x" }),
      );
    });

    it("should submit after exactly the field's numeric debounce", async () => {
      render(
        <FormalityProvider inputs={inputsWithFieldDebounce}>
          <Form
            config={{ fieldA: { type: "textField" } }}
            onSubmit={submitHandler}
            autoSave
            debounce={500} // Form-level fallback (must NOT be used for fieldA)
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

      // 500ms (Form-level) — must NOT submit, fieldA uses its own 2000ms.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // 1000ms total — still no.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // 2000ms total — now submit.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "hello" }),
      );
    });

    it("should honor a numeric debounce passed via the Field inputConfig prop", async () => {
      // The Field prop is merged on top of provider inputs; verify the override
      // path also reaches the per-field debounce cache.
      render(
        <FormalityProvider inputs={baseInputs}>
          <Form
            config={{ fieldA: { type: "textField" } }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" inputConfig={{ debounce: 1500 }} />
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
      });

      // 500ms (Form-level) — no submit.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // Past 1500ms — submit.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "x" }),
      );
    });

    it("should debounce (reset on each keystroke) within a single field", async () => {
      render(
        <FormalityProvider inputs={inputsWithFieldDebounce}>
          <Form
            config={{ fieldA: { type: "textField" } }}
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

      // Type three keystrokes spaced 1000ms apart. Each keystroke resets the
      // 2000ms debounce, so no submit should fire until 2000ms after the LAST one.
      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
        await vi.advanceTimersByTimeAsync(1000);
        await userEvent.type(fieldA, "b", { delay: null });
        await vi.advanceTimersByTimeAsync(1000);
        await userEvent.type(fieldA, "c", { delay: null });
      });

      // 1000ms after the last keystroke — no submit yet (needs 2000ms).
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // 2000ms after the last keystroke → single submit with final value.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "abc" }),
      );
    });
  });

  describe("Coalescing semantics", () => {
    it("should coalesce fields that share the same numeric debounce into one submit", async () => {
      // Two fields of the same type → same numeric debounce (2000ms). They must
      // share a single timer and produce a single submit containing both values.
      render(
        <FormalityProvider inputs={inputsWithFieldDebounce}>
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

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");
      const fieldB = screen.getByTestId("fieldB");

      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
        await userEvent.type(fieldB, "b", { delay: null });
      });

      // Before the shared 2000ms — no submit.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // Past 2000ms → exactly one submit with both values.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
      });

      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "a", fieldB: "b" }),
      );
    });

    it("should let the faster debounce submit a coalesced batch; the slower timer no-ops", async () => {
      // Documents the chosen semantics (see BUG_REPORT.md "semantics decision"):
      // pending changes accumulate across ALL fields, so when a 2000ms field and
      // a 4000ms field are both dirty, the faster (2000ms) timer submits the
      // whole pending batch (both values). The slower (4000ms) timer then fires
      // later with nothing new pending → executeAutoSave returns early → no
      // double-submit.
      const submitLog: string[] = [];
      const tracked = (data: any) => {
        submitLog.push(`A=${data.fieldA},B=${data.fieldB}`);
        submitHandler(data);
      };

      render(
        <FormalityProvider inputs={inputsWithFieldDebounce}>
          <Form
            config={{
              fieldA: { type: "textField" }, // debounce 2000
              fieldB: { type: "slowText" }, // debounce 4000
            }}
            onSubmit={tracked}
            autoSave
            debounce={500}
          >
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldA = screen.getByTestId("fieldA");
      const fieldB = screen.getByTestId("fieldB");

      // Edit both within the same instant.
      await act(async () => {
        await userEvent.type(fieldA, "a", { delay: null });
        await userEvent.type(fieldB, "b", { delay: null });
      });

      // fieldA's 2000ms timer fires first and carries BOTH pending values.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2100);
      });
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitLog[0]).toBe("A=a,B=b");

      // fieldB's 4000ms timer fires later — with no NEW pending changes it is a
      // no-op (changedFields empty → executeAutoSave returns early). Confirm no
      // spurious second submit arrives from the slower timer.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });

    it("should fire a lone slow field on its own longer cadence", async () => {
      // Complement to the test above: when only the 4000ms field is edited, it
      // waits its FULL 4000ms (not the faster field's 2000ms, and not the
      // Form-level fallback). Proves each numeric debounce owns its own timer.
      render(
        <FormalityProvider inputs={inputsWithFieldDebounce}>
          <Form
            config={{ fieldB: { type: "slowText" } }} // debounce 4000
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      const fieldB = screen.getByTestId("fieldB");
      await act(async () => {
        await userEvent.type(fieldB, "x", { delay: null });
      });

      // 2000ms — the *other* field's cadence; must NOT submit.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // 3000ms total — still no.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // Past 4000ms → submit.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldB: "x" }),
      );
    });
  });

  describe("Mixed debounce: false + numeric in the same form", () => {
    it("should submit a debounce:false field immediately while a numeric-debounced field is still pending", async () => {
      // Directly mirrors the BUG_REPORT.md repro table: a numeric-debounced
      // text field plus an immediate (debounce: false) field in the same form.
      // Order is immediate-field-first so each field produces its own submit
      // (matching the established pattern in autosave-validation.test.tsx).
      render(
        <FormalityProvider inputs={baseInputs}>
          <Form
            config={{
              textField: { type: "textField" },
              switch: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="textField" inputConfig={{ debounce: 2000 }} />
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

      // Edit the immediate field FIRST → submits right away, without waiting.
      await act(async () => {
        await userEvent.type(switchField, "x", { delay: null });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(submitHandler).toHaveBeenLastCalledWith(
        expect.objectContaining({ switch: "x" }),
      );

      // Now edit the numeric-debounced field — schedules a 2000ms timer.
      await act(async () => {
        await userEvent.type(textField, "typing", { delay: null });
      });

      // Well before the 2000ms numeric debounce → no second submit yet.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1);

      // Past 2000ms → the debounced submit fires with the text field value.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(2);
      });
      expect(submitHandler).toHaveBeenLastCalledWith(
        expect.objectContaining({ textField: "typing", switch: "x" }),
      );
    });

    it("should coalesce a pending numeric-debounced field into an immediate submit", async () => {
      // Companion to the test above: when the numeric-debounced field is edited
      // FIRST and the immediate field SECOND, the immediate submit flushes the
      // whole pending batch (both fields) — so there is exactly ONE submit and
      // the numeric timer later no-ops. Documents the coalescing behavior.
      render(
        <FormalityProvider inputs={baseInputs}>
          <Form
            config={{
              textField: { type: "textField" },
              switch: { type: "textField" },
            }}
            onSubmit={submitHandler}
            autoSave
            debounce={500}
          >
            <Field name="textField" inputConfig={{ debounce: 2000 }} />
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

      // Numeric-debounced field first (pending = {textField})...
      await act(async () => {
        await userEvent.type(textField, "typing", { delay: null });
      });
      // ...then the immediate field flushes BOTH pending values at once.
      await act(async () => {
        await userEvent.type(switchField, "x", { delay: null });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(submitHandler).toHaveBeenLastCalledWith(
        expect.objectContaining({ textField: "typing", switch: "x" }),
      );

      // The numeric timer later no-ops (pending already cleared) → no 2nd submit.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2200);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Form-level fallback preserved", () => {
    it("should fall back to the Form-level debounce when the field debounce is unset", async () => {
      // Ensure the new per-field branch did not regress the default path:
      // a field with no inputConfig.debounce still uses the Form-level prop.
      render(
        <FormalityProvider inputs={baseInputs}>
          <Form
            config={{ fieldA: { type: "textField" } }}
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
      await act(async () => {
        await userEvent.type(fieldA, "x", { delay: null });
      });

      // 300ms of 500ms — no submit.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // Past 500ms — submit on the Form-level cadence.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "x" }),
      );
    });
  });

  describe("FieldConfig.debounce (config prop) overrides type + Form-level", () => {
    it("should honor a numeric debounce set via config[name] over the type-level debounce (§6.4.2)", async () => {
      // The type says 2000; the FIELD (config prop) says 1500 → 1500 wins.
      render(
        <FormalityProvider inputs={inputsWithFieldDebounce}>
          <Form
            config={{ fieldA: { type: "textField", debounce: 1500 } }}
            onSubmit={submitHandler}
            autoSave
            debounce={500} // Form-level fallback (must NOT be used)
          >
            <Field name="fieldA" />
          </Form>
        </FormalityProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      submitHandler.mockClear();

      await act(async () => {
        await userEvent.type(screen.getByTestId("fieldA"), "hi", {
          delay: null,
        });
      });

      // 500ms (Form-level) — no submit.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(submitHandler).not.toHaveBeenCalled();
      // 1500ms (FIELD) — NOT 2000ms (type). Submit now.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "hi" }),
      );

      // Sanity: the type-level 2000 was NOT the cadence (it would still be pending here).
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });

    it("should submit immediately when config[name] sets debounce:false, even if the type debounces (§6.4.2)", async () => {
      // Type debounces (2000); FIELD says false → immediate.
      render(
        <FormalityProvider inputs={inputsWithFieldDebounce}>
          <Form
            config={{ fieldA: { type: "textField", debounce: false } }}
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

      await act(async () => {
        await userEvent.type(screen.getByTestId("fieldA"), "x", {
          delay: null,
        });
      });

      // Immediate — well under the type's 2000ms.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "x" }),
      );
    });

    it("should fall back to the type-level debounce when config[name] omits debounce (regression)", async () => {
      // No field-level debounce → type's 2000 applies (existing behavior; proves resolveFieldOverType(undefined, 2000) === 2000).
      render(
        <FormalityProvider inputs={inputsWithFieldDebounce}>
          <Form
            config={{ fieldA: { type: "textField" } }}
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

      await act(async () => {
        await userEvent.type(screen.getByTestId("fieldA"), "hi", {
          delay: null,
        });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      // Type-level 2000ms cadence.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "hi" }),
      );
    });

    it("should fall back to the Form-level debounce when both config[name] and type omit debounce (regression)", async () => {
      // baseInputs.textField has NO debounce; config omits it too → Form-level 500.
      render(
        <FormalityProvider inputs={baseInputs}>
          <Form
            config={{ fieldA: { type: "textField" } }}
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

      await act(async () => {
        await userEvent.type(screen.getByTestId("fieldA"), "x", {
          delay: null,
        });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(submitHandler).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() => {
        expect(submitHandler).toHaveBeenCalledTimes(1);
      });
      expect(submitHandler).toHaveBeenCalledWith(
        expect.objectContaining({ fieldA: "x" }),
      );
    });
  });
});
