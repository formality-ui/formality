// @formality-ui/react - AutoSave submitImmediate + pending() Regression Tests
//
// Regression coverage for two issues found in the P1 auto-save validation:
//
//   Issue 1 (Major): `submitImmediate()` only flushed the Form-level debounce;
//     pending per-field numeric debounce saves were left on their own timers
//     (and `.cancel()`-ed on unmount → silent data loss). It must flush both.
//
//   Issue 3 (Minor): `DebouncedFunction.pending()` always returned `false`
//     because lodash-es does NOT expose `.pending()` and the adapters hardcoded
//     `() => false`. `pending()` must reflect the real scheduled state.
//
// Both issues share the same Form.tsx code path (the debounce adapters), so the
// regression coverage lives in one file.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import { useFormContext } from "../context/FormContext";
import type { MutableRefObject } from "react";
import type { InputConfig } from "@formality-ui/core";

// ----------------------------------------------------------------------------
// Shared harness (mirrors Form.coverage.test.tsx / autosave-field-debounce)
// ----------------------------------------------------------------------------

interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

// Plain function component — §20 delivers `forwardRef` as a prop, so the React
// `forwardRef()` wrap is unnecessary (see Issue 4). Consuming `forwardRef` from
// props and assigning it to the inner input keeps RHF's ref wired.
function TestInput({
  value,
  onChange,
  disabled,
  name,
  forwardRef,
  ...props
}: TestInputProps & { forwardRef?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      ref={forwardRef}
      data-testid={name}
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}
    />
  );
}

// Base inputs WITHOUT a per-field debounce (so the Form-level default applies).
const baseInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
};

// Context-capturing consumer. Stashes the FormContext onto a ref so tests can
// invoke the public `debouncedSubmit` / `submitImmediate` APIs directly.
function ContextCapture({ captureRef }: { captureRef: MutableRefObject<any> }) {
  captureRef.current = useFormContext();
  return null;
}

describe("AutoSave submitImmediate flushes per-field debounce (Issue 1)", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    // CRITICAL: { shouldAdvanceTime: true } matches the rest of the autosave suite.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should flush a pending Form-level debounce save immediately", async () => {
    // Baseline: the existing Form-level flush path still works.
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={baseInputs}>
        <Form
          config={{ fieldA: { type: "textField" } }}
          onSubmit={submitHandler}
          autoSave
          debounce={3000}
        >
          <Field name="fieldA" />
          <ContextCapture captureRef={ref} />
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

    // Well before the 3000ms Form-level debounce → no submit yet.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(submitHandler).not.toHaveBeenCalled();

    // submitImmediate must flush it now.
    act(() => {
      ref.current.submitImmediate();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ fieldA: "x" }),
    );
  });

  it("should flush a pending per-field numeric debounce save immediately (Issue 1 repro)", async () => {
    // THE BUG: before the fix this produced 0 submits — the per-field timer was
    // never flushed by submitImmediate, so the save only landed when the field's
    // own 3000ms timer later fired.
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={baseInputs}>
        <Form
          config={{ fieldA: { type: "textField" } }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="fieldA" inputConfig={{ debounce: 3000 }} />
          <ContextCapture captureRef={ref} />
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

    // Well before the field's 3000ms debounce → no submit yet.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(submitHandler).not.toHaveBeenCalled();

    // submitImmediate must flush the per-field timer now (was 0 before fix).
    act(() => {
      ref.current.submitImmediate();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ fieldA: "x" }),
    );

    // And advancing further (the field's own timer) must NOT double-submit.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  it("should flush both a Form-level and a per-field pending save as a single submit (no double, no drop)", async () => {
    // Guards the version-abort race: flushing two timers naively would run
    // executeAutoSave twice — the empty second invocation bumps the execution
    // version and aborts the real first one (→ dropped save). submitImmediate
    // must coalesce both into exactly one submit.
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={baseInputs}>
        <Form
          config={{
            fieldA: { type: "textField" }, // Form-level debounce (2000)
            fieldB: { type: "textField" }, // per-field debounce (3000)
          }}
          onSubmit={submitHandler}
          autoSave
          debounce={2000}
        >
          <Field name="fieldA" />
          <Field name="fieldB" inputConfig={{ debounce: 3000 }} />
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const fieldA = screen.getByTestId("fieldA");
    const fieldB = screen.getByTestId("fieldB");

    // Edit both within the same instant — both timers become pending.
    await act(async () => {
      await userEvent.type(fieldA, "a", { delay: null });
      await userEvent.type(fieldB, "b", { delay: null });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(submitHandler).not.toHaveBeenCalled();

    act(() => {
      ref.current.submitImmediate();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Exactly one submit, carrying both pending values.
    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ fieldA: "a", fieldB: "b" }),
    );

    // Neither idle timer (2000ms / 3000ms) double-fires afterward.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  it("should be a no-op when nothing is pending (no spurious empty save)", async () => {
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={baseInputs}>
        <Form
          config={{ fieldA: { type: "textField" } }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="fieldA" />
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    // No edit yet → nothing pending → submitImmediate must not fire a save.
    act(() => {
      ref.current.submitImmediate();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(submitHandler).not.toHaveBeenCalled();
  });
});

describe("AutoSave DebouncedFunction.pending() reflects real state (Issue 3)", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debouncedSubmit.pending() should be true while a Form-level save is scheduled and false after it fires", async () => {
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={baseInputs}>
        <Form
          config={{ fieldA: { type: "textField" } }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="fieldA" />
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const debounced = ref.current.debouncedSubmit;
    // Nothing scheduled yet.
    expect(debounced.pending()).toBe(false);

    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "x", { delay: null });
    });

    // A 500ms save is now scheduled → pending must be true (was false before fix).
    expect(debounced.pending()).toBe(true);

    // After the timer fires, pending returns to false.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(debounced.pending()).toBe(false);
  });

  it("debouncedSubmit.pending() should be false after cancel() clears a scheduled save", async () => {
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={baseInputs}>
        <Form
          config={{ fieldA: { type: "textField" } }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="fieldA" />
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const debounced = ref.current.debouncedSubmit;
    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "x", { delay: null });
    });
    expect(debounced.pending()).toBe(true);

    // Cancel the scheduled save → pending must clear (and no save fires).
    act(() => {
      debounced.cancel();
    });
    expect(debounced.pending()).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(submitHandler).not.toHaveBeenCalled();
  });

  it("debouncedSubmit.flush() should fire a pending numeric-debounce save immediately", async () => {
    // Covers the wrapDebounced `flush()` body (Form.tsx) on the numeric
    // adapter. `debouncedSubmit.flush()` is a public API method; it must fire
    // the scheduled save right away and clear the pending state.
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={baseInputs}>
        <Form
          config={{ fieldA: { type: "textField" } }}
          onSubmit={submitHandler}
          autoSave
          debounce={500}
        >
          <Field name="fieldA" />
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const debounced = ref.current.debouncedSubmit;
    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "x", { delay: null });
    });
    expect(debounced.pending()).toBe(true);

    // flush() fires the pending save immediately and clears pending.
    act(() => {
      debounced.flush();
    });
    expect(debounced.pending()).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ fieldA: "x" }),
    );

    // Advancing past the original window must NOT double-submit.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  it("the immediate (debounce: false) adapter is never pending", async () => {
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={baseInputs}>
        <Form
          config={{ fieldA: { type: "textField" } }}
          onSubmit={submitHandler}
          autoSave
          debounce={false}
        >
          <Field name="fieldA" />
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const debounced = ref.current.debouncedSubmit;
    const fieldA = screen.getByTestId("fieldA");
    await act(async () => {
      await userEvent.type(fieldA, "x", { delay: null });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Immediate adapter submits right away and is never "pending".
    expect(debounced.pending()).toBe(false);
  });
});
