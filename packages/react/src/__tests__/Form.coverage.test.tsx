// @formality-ui/react - Form.tsx white-box coverage suite (P1.M2.T1.S2)
//
// Purpose: drive Form.tsx from 76.6/76.9/28.6 to >=90/90/90 (func 100%).
// The 5 uncovered functions are the Object.assign debounce-adapter helpers
// (cancel/flush/pending on both the immediateFn and lodash variants) exposed
// via FormContext.debouncedSubmit + FormContext.submitImmediate. A
// context-capturing consumer invokes them directly.
//
// Harness conventions copied verbatim from Form.test.tsx (TestInput/TestSwitch/
// testInputs) and autosave-validation.test.tsx (fake-timer + act/advance
// cadence, userEvent.type with { delay: null }).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { forwardRef, type MutableRefObject, type Ref } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import { useFormContext } from "../context/FormContext";
import type { InputConfig } from "@formality-ui/core";

// ============================================================================
// Shared harness (copied from Form.test.tsx)
// ============================================================================

interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<
  HTMLInputElement,
  TestInputProps & { forwardRef?: Ref<HTMLInputElement> }
>(({ value, onChange, disabled, name, forwardRef, ...props }) => (
  <input
    ref={forwardRef}
    data-testid={name}
    value={value ?? ""}
    onChange={(e) => onChange?.(e.target.value)}
    disabled={disabled}
    {...props}
  />
));
TestInput.displayName = "TestInput";

interface TestSwitchProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

const TestSwitch = forwardRef<
  HTMLInputElement,
  TestSwitchProps & { forwardRef?: Ref<HTMLInputElement> }
>(({ value, onChange, disabled, name, forwardRef, ...props }) => (
  <input
    ref={forwardRef}
    type="checkbox"
    data-testid={name}
    checked={value ?? false}
    onChange={(e) => onChange?.(e.target.checked)}
    disabled={disabled}
    {...props}
  />
));
TestSwitch.displayName = "TestSwitch";

const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
  switch: { component: TestSwitch, defaultValue: false },
};

// Provider inputs that also register an `autocomplete` type with
// valueField/getSubmitField transform config (PRD §5.2.5).
const inputsWithAutocomplete: Record<string, InputConfig> = {
  ...testInputs,
  autocomplete: {
    component: TestInput,
    defaultValue: null,
    valueField: "id",
    getSubmitField: (k: string) => `${k}Id`,
  },
};

// Context-capturing consumer. Stashes the FormContext onto a ref so tests can
// invoke the public debouncedSubmit / submitImmediate / addSubscription /
// registerWatcherSetter APIs directly.
function ContextCapture({ captureRef }: { captureRef: MutableRefObject<any> }) {
  captureRef.current = useFormContext();
  return null;
}

// Captures formConfig for assertions about mergedInputs.
function ConfigCapture({ captureRef }: { captureRef: MutableRefObject<any> }) {
  captureRef.current = useFormContext().formConfig;
  return null;
}

// Captures the RHF methods so tests can read formState.errors.
function MethodsCapture({ captureRef }: { captureRef: MutableRefObject<any> }) {
  captureRef.current = useFormContext().methods;
  return null;
}

// ============================================================================
// Task 2 + 3: form-level debounce={false}, context-capture of debounce helpers
// ============================================================================

describe("Form coverage (P1.M2.T1.S2) — debounce adapter", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should submit immediately when form-level debounce is false (covers immediateFn body + useEffect 565-581)", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: "textField" } }}
          autoSave
          debounce={false}
          onSubmit={submitHandler}
        >
          <Field name="name" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    submitHandler.mockClear();

    const field = screen.getByTestId("name");
    await act(async () => {
      await userEvent.type(field, "x", { delay: null });
    });

    // Immediate path fires within a small advance — well inside the 1000ms
    // default debounce, proving immediacy.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ name: "x" }),
    );

    // No double-submit on subsequent micro-advances.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(submitHandler).toHaveBeenCalledTimes(1);
  });

  it("should expose working cancel/flush/pending on the immediateFn adapter (covers fn#1-#4 + submitImmediate 603-604)", async () => {
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: "textField" } }}
          autoSave
          debounce={false}
          onSubmit={submitHandler}
          record={{ name: "seed" }}
        >
          <Field name="name" />
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const debounced = ref.current.debouncedSubmit;
    expect(typeof debounced.cancel).toBe("function"); // fn#2
    expect(typeof debounced.flush).toBe("function"); // fn#3
    expect(typeof debounced.pending).toBe("function"); // fn#4

    // pending() returns false for the immediate adapter.
    expect(debounced.pending()).toBe(false); // fn#4 body

    // cancel() is a no-op; calling it must not throw and must not submit.
    submitHandler.mockClear();
    debounced.cancel(); // fn#2 body
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(submitHandler).not.toHaveBeenCalled();

    // flush() routes through executeAutoSave → handleSubmit → onSubmit.
    debounced.flush(); // fn#3 body
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    // No field change occurred, so changedFields is empty and executeAutoSave
    // returns early — flush itself is covered regardless.
    expect(typeof ref.current.submitImmediate).toBe("function");

    // submitImmediate() exercises the .flush() path (Form.tsx:603-604).
    ref.current.submitImmediate();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
  });

  it("should expose lodash .pending/.flush on the debounced adapter (covers fn#5 + 590)", async () => {
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: "textField" } }}
          autoSave
          debounce={500}
          onSubmit={submitHandler}
        >
          <Field name="name" />
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const debounced = ref.current.debouncedSubmit;
    expect(typeof debounced.pending).toBe("function");
    expect(typeof debounced.flush).toBe("function");
    expect(debounced.pending()).toBe(false); // fn#5 body
  });
});

// ============================================================================
// Task: first-render debouncedSubmit availability (autosave Issue 3)
// ============================================================================

describe("Form coverage — first-render debouncedSubmit availability (Issue 3)", () => {
  // Regression for autosave Issue 3: debouncedSubmitRef used to be assigned
  // inside a useEffect, so on the very first render pass the context's
  // `debouncedSubmit` was `undefined` until the effect ran (a window where the
  // `?.()` auto-save triggers would no-op). It is now assigned during render,
  // so it is available immediately. We capture the value synchronously in a
  // child's render body (before effects flush) to observe first-render state.
  it("should expose a fully-formed debouncedSubmit during the first render pass (before effects)", () => {
    const seen: unknown[] = [];
    function Capture() {
      // Read during RENDER (not in an effect) and record every observed value.
      // seen[0] is therefore the first-render-pass value, before any effect ran.
      seen.push(useFormContext().debouncedSubmit);
      return null;
    }

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: "textField" } }}
          autoSave
          debounce={500}
          onSubmit={vi.fn()}
        >
          <Field name="name" />
          <Capture />
        </Form>
      </FormalityProvider>,
    );

    // The first render pass must already carry a fully-formed debounced submit.
    // Under the old effect-time wiring, seen[0] was undefined here.
    const firstRenderDebouncedSubmit = seen[0];
    expect(firstRenderDebouncedSubmit).toBeDefined();
    expect(typeof firstRenderDebouncedSubmit).toBe("function");
    expect(typeof (firstRenderDebouncedSubmit as any).cancel).toBe("function");
    expect(typeof (firstRenderDebouncedSubmit as any).flush).toBe("function");
    expect(typeof (firstRenderDebouncedSubmit as any).pending).toBe("function");
  });
});

// ============================================================================
// Task 4: selectTitle → getFormState (364-397) + resolvedTitle branch (626-637)
// ============================================================================

describe("Form coverage (P1.M2.T1.S2) — selectTitle / getFormState", () => {
  it("should evaluate a function selectTitle descriptor and resolve the title (covers getFormState + resolvedTitle branch)", () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: "textField" } }}
          record={{ name: "Alice" }}
          formConfig={{ title: "Static", selectTitle: () => "Dynamic Title" }}
        >
          {({ resolvedTitle }) => (
            <span data-testid="title">{String(resolvedTitle)}</span>
          )}
        </Form>
      </FormalityProvider>,
    );

    // evaluateDescriptor returns the function as-is; resolveFormTitle String()s it.
    expect(screen.getByTestId("title")).toHaveTextContent("Dynamic Title");
  });
});

// ============================================================================
// Task 5: formConfig.inputs as a FUNCTION (covers mergedInputs line 147)
// ============================================================================

describe("Form coverage (P1.M2.T1.S2) — mergedInputs function form", () => {
  it("should invoke formConfig.inputs when it is a function (covers line 147)", () => {
    const inputsFn = vi.fn(() => ({ textField: { debounce: 500 } }));
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: "textField" } }}
          formConfig={{ inputs: inputsFn as any }}
        >
          <ConfigCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    expect(inputsFn).toHaveBeenCalledTimes(1);
    // formConfig is stored verbatim on context.
    expect(ref.current.inputs).toBe(inputsFn);
  });
});

// ============================================================================
// Task 6: form-level validate (covers handleSubmit 411-418)
// ============================================================================

describe("Form coverage (P1.M2.T1.S2) — form-level validate", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should block submit and setError when validate returns errors (covers 411-418)", async () => {
    const validate = vi.fn(async () => ({ name: "too short" }));
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: "textField" } }}
          autoSave
          debounce={300}
          validate={validate}
          onSubmit={submitHandler}
          record={{ name: "x" }}
        >
          <Field name="name" />
          <MethodsCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const field = screen.getByTestId("name");
    await act(async () => {
      await userEvent.type(field, "y", { delay: null });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    // validate branch ran (proves handleSubmit reached the validate block).
    expect(validate).toHaveBeenCalled();
    // onSubmit was blocked by setError + return.
    expect(submitHandler).not.toHaveBeenCalled();
    // The error was set on the field.
    expect(ref.current.formState.errors.name).toBeDefined();
  });

  it("should submit when validate returns no errors (happy path through transformValuesForSubmit + onSubmit)", async () => {
    const validate = vi.fn(async () => ({}));

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ name: { type: "textField" } }}
          autoSave
          debounce={300}
          validate={validate}
          onSubmit={submitHandler}
          record={{ name: "x" }}
        >
          <Field name="name" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const field = screen.getByTestId("name");
    await act(async () => {
      await userEvent.type(field, "y", { delay: null });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(validate).toHaveBeenCalled();
    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
  });
});

// ============================================================================
// Task 7: valueField + getSubmitField transform (PRD §5.2.5)
// ============================================================================

describe("Form coverage (P1.M2.T1.S2) — valueField/getSubmitField transform", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should extract valueField and rename via getSubmitField (covers transformValuesForSubmit extraction)", async () => {
    render(
      <FormalityProvider inputs={inputsWithAutocomplete}>
        <Form
          config={{
            client: { type: "autocomplete" },
            signed: { type: "switch" },
          }}
          autoSave
          debounce={300}
          onSubmit={submitHandler}
          record={{ client: { id: 5, name: "Acme" }, signed: true }}
        >
          <Field name="signed" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Drive a change on `signed` to trigger autoSave → handleSubmit → transform.
    const toggle = screen.getByTestId("signed");
    await act(async () => {
      await userEvent.click(toggle);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 5, // valueField extraction (obj.id) + getSubmitField rename
        signed: false, // toggled
      }),
    );
  });
});

// ============================================================================
// Task 8: transformValuesForSubmit else branch (covers line 737-738)
// ============================================================================

describe("Form coverage (P1.M2.T1.S2) — transform else branch", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should pass values through untransformed when config type is absent from provider inputs (covers 737-738)", async () => {
    // testInputs has NO "autocomplete" entry → inputConfig undefined → else branch.
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            client: { type: "autocomplete" },
            signed: { type: "switch" },
          }}
          autoSave
          debounce={300}
          onSubmit={submitHandler}
          record={{ client: { id: 5 }, signed: true }}
        >
          <Field name="signed" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const toggle = screen.getByTestId("signed");
    await act(async () => {
      await userEvent.click(toggle);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
    // `client` passed through UNTRANSFORMED (else branch result[name] = value).
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        client: { id: 5 },
        signed: false,
      }),
    );
  });
});

// ============================================================================
// Task 8b: transformValuesForSubmit `fieldConfig?.type ?? "textField"` default
// (covers the default arm of the nullish-coalescing at Form.tsx:725)
// ============================================================================

describe("Form coverage (P1.M2.T1.S2) — transform type-default arm", () => {
  let submitHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submitHandler = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should default a missing field type to textField (covers ?? default at 725)", async () => {
    // `extra` is in the record/values but NOT in config → fieldConfig is
    // undefined → `fieldConfig?.type ?? "textField"` falls through to the
    // default. textField IS registered in testInputs so the inputConfig truthy
    // branch runs with the defaulted type.
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ signed: { type: "switch" } }}
          autoSave
          debounce={300}
          onSubmit={submitHandler}
          record={{ signed: true, extra: "hello" }}
        >
          <Field name="signed" />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const toggle = screen.getByTestId("signed");
    await act(async () => {
      await userEvent.click(toggle);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    await waitFor(() => {
      expect(submitHandler).toHaveBeenCalledTimes(1);
    });
    // `extra` passes through under its original name (textField has no transform).
    expect(submitHandler).toHaveBeenCalledWith(
      expect.objectContaining({ extra: "hello", signed: false }),
    );
  });
});
// (covers 233-237 + 283-291)
// ============================================================================

// ============================================================================
// Task 9: pendingWatcherUpdates queue + registerWatcherSetter processing
// (covers 233-237 + 283-291)
// ============================================================================

describe("Form coverage (P1.M2.T1.S2) — watcher subscription queue", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // addSubscription emits a dev-warn on every call; silence it.
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.useRealTimers();
  });

  it("should queue a subscription when target is not mounted, then process it on registerWatcherSetter (covers 233-237 + 283-291)", async () => {
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            lateTarget: { type: "textField" },
            sub: { type: "textField" },
          }}
          autoSave
          debounce={500}
          onSubmit={vi.fn()}
        >
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // No Field for "lateTarget" is mounted → addSubscription queues pending.
    expect(() =>
      ref.current.addSubscription("lateTarget", "sub"),
    ).not.toThrow(); // covers 233-237

    // Manually register a watcher setter for the late target → processes the
    // pending queue (covers 283-291). Use a real state-like setter that
    // invokes the updater function so the pending-processing body runs.
    let state: Record<string, boolean> = {};
    const setter = vi.fn((updater: any) => {
      state = updater(state);
    });
    expect(() =>
      ref.current.registerWatcherSetter("lateTarget", setter as any),
    ).not.toThrow();
    expect(setter).toHaveBeenCalled();
    // The pending "sub" entry should have been applied to the state.
    expect(state).toEqual({ sub: true });
  });
});

// ============================================================================
// Task 10: removeSubscription dev-warns (covers 256-260)
// ============================================================================

describe("Form coverage (P1.M2.T1.S2) — removeSubscription dev-warns", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.useRealTimers();
  });

  it("should warn on exists-then-remove and on double-cleanup (covers 256-260)", async () => {
    const ref: MutableRefObject<any> = { current: null };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ a: { type: "textField" }, b: { type: "textField" } }}
          autoSave
          debounce={500}
          onSubmit={vi.fn()}
        >
          <ContextCapture captureRef={ref} />
        </Form>
      </FormalityProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    warnSpy.mockClear();

    // Add then remove → "removed from watching" arm.
    ref.current.addSubscription("a", "b");
    ref.current.removeSubscription("a", "b");
    expect(
      warnSpy.mock.calls.some((c) =>
        /removed from watching/.test(String(c[0])),
      ),
    ).toBe(true);

    // Remove again → "Double-cleanup attempt" arm.
    ref.current.removeSubscription("a", "b");
    expect(
      warnSpy.mock.calls.some((c) => /Double-cleanup/.test(String(c[0]))),
    ).toBe(true);
  });
});
