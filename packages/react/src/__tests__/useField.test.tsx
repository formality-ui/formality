// @formality-ui/react - useField Hook Tests
//
// Isolated tests for the real `useField` implementation (PRD §1.3.3 / §5.3 /
// §20). The hook owns the entire RHF Controller lifecycle for a single field.
//
// The exhaustive behavioral parity gate lives in Field.test.tsx /
// Field.forwardRef.test.tsx / Field.subscriptionStability.test.tsx /
// validation-report-fixes.test.tsx (which exercise the same logic through the
// thin <Field> wrapper). These tests assert the hook's **direct contract** —
// the `UseFieldReturn` shape and watcher ownership — exercised via `renderHook`
// WITHOUT <Field>, on branches the integration tests reach only obliquely.
//
// All tests use a REAL <FormalityProvider><Form> wrapper because `useField`
// unconditionally calls `useWatch({ control: methods.control })` during render
// (inside `useConditions`), NOT only when the field is visible — so a mocked
// `methods: {}` (no `.control`) throws on every render regardless of the
// `hidden` prop. For the watcher-registration lifecycle test, the real
// <Form>'s FormContext value is overlaid with a copy whose
// registerWatcherSetter / unregisterWatcherSetter are vi.fn spies (the nearest
// provider wins), giving both a live RHF form AND call-count/arg assertions.
import { describe, it, expect, vi } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Form } from "../components/Form";
import { FormalityProvider } from "../components/FormalityProvider";
import { FormContext, useFormContext } from "../context/FormContext";
import type { FormContextValue } from "../context/FormContext";
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

// Wrapper that mounts useField inside a REAL <FormalityProvider><Form>.
// useField mounts <Controller control={methods.control}> when visible AND calls
// useWatch({control}) unconditionally during render, so the real <Form> (which
// provides a live RHF `methods`) is required for every test. (Pattern reused
// from useFormState.test.tsx.)
const createRealFormWrapper =
  () =>
  ({ children }: { children: ReactNode }): ReactElement => (
    <FormalityProvider inputs={testInputs}>
      <Form config={{ email: { type: "textField" } }}>{children}</Form>
    </FormalityProvider>
  );

// Build a WatcherSpies record: vi.fn spies that record the setter so it can be
// invoked later (proves the hook's `watchers` state is owned + driven by the
// setter registered with the context).
type WatcherSpies = {
  registerWatcherSetter: ReturnType<typeof vi.fn>;
  unregisterWatcherSetter: ReturnType<typeof vi.fn>;
  watcherSetters: Map<string, (w: Record<string, boolean>) => void>;
};

const createWatcherSpies = (): WatcherSpies => {
  const watcherSetters = new Map<
    string,
    (w: Record<string, boolean>) => void
  >();
  return {
    registerWatcherSetter: vi.fn((name: string, setter) => {
      watcherSetters.set(
        name,
        setter as (w: Record<string, boolean>) => void,
      );
    }),
    unregisterWatcherSetter: vi.fn((name: string) => {
      watcherSetters.delete(name);
    }),
    watcherSetters,
  };
};

// Renders INSIDE <Form>: reads the REAL FormContext the <Form> just provided
// (a live value with a valid `methods.control`), then overlays a copy whose
// watcher fns are spies. The nearest provider wins for `useField`, so the hook
// sees the spied fns while still getting a valid `methods`. (Rendering outside
// <Form> would throw — useFormContext asserts a provider exists.)
const WatcherSpyProvider = ({
  children,
  spies,
}: {
  children: ReactNode;
  spies: WatcherSpies;
}): ReactElement => {
  const real = useFormContext();
  const overlay = {
    ...real,
    registerWatcherSetter: spies.registerWatcherSetter,
    unregisterWatcherSetter: spies.unregisterWatcherSetter,
  } as FormContextValue;
  return (
    <FormContext.Provider value={overlay}>{children}</FormContext.Provider>
  );
};

describe("useField (gap_analysis G6 — PRD §1.3.3)", () => {
  it("returns the UseFieldReturn contract (renderedField is a ReactElement)", () => {
    const params = { name: "email" } as UseFieldParams;
    const { result } = renderHook(() => useField(params), {
      wrapper: createRealFormWrapper(),
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
      wrapper: createRealFormWrapper(),
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

// ---------------------------------------------------------------------------
// Direct hook contract — isolated branches Field.test.tsx reaches only
// obliquely (through <Field>). These prove `useField` is testable WITHOUT
// <Field>: the hook owns watcher registration + the `watchers` state, and
// `watchers` is typed as Record<string, boolean>.
// ---------------------------------------------------------------------------
describe("useField (isolated — direct hook contract)", () => {
  it("registers a watcher setter on mount and unregisters it on unmount", () => {
    // Overlay the real <Form> context with spied watcher fns. The hook still
    // gets a live `methods.control` (required — useField calls useWatch
    // unconditionally during render), so the field can be visible here.
    const spies = createWatcherSpies();
    const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
      <FormalityProvider inputs={testInputs}>
        <Form config={{ email: { type: "textField" } }}>
          <WatcherSpyProvider spies={spies}>{children}</WatcherSpyProvider>
        </Form>
      </FormalityProvider>
    );
    const params = { name: "email" } as UseFieldParams;

    const { unmount } = renderHook(() => useField(params), { wrapper });

    // On mount the hook registers its watcher setter under the field name.
    expect(spies.registerWatcherSetter).toHaveBeenCalledTimes(1);
    expect(spies.registerWatcherSetter).toHaveBeenCalledWith(
      "email",
      expect.any(Function),
    );
    expect(spies.unregisterWatcherSetter).not.toHaveBeenCalled();

    unmount();

    // On unmount the hook unregisters the watcher setter (lifecycle cleanup).
    expect(spies.unregisterWatcherSetter).toHaveBeenCalledTimes(1);
    expect(spies.unregisterWatcherSetter).toHaveBeenCalledWith("email");
  });

  it("returns watchers as Record<string, boolean> and owns the watcher state", () => {
    // The hook owns `watchers` (useState) and registers its setter with the
    // context. Invoking the registered setter with a watcher map must update
    // the hook's returned `watchers` — proving the hook OWNS the watcher state
    // (no integration test asserts on this return shape directly).
    const spies = createWatcherSpies();
    const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
      <FormalityProvider inputs={testInputs}>
        <Form config={{ email: { type: "textField" } }}>
          <WatcherSpyProvider spies={spies}>{children}</WatcherSpyProvider>
        </Form>
      </FormalityProvider>
    );
    const params = { name: "email" } as UseFieldParams;

    const { result, rerender } = renderHook(() => useField(params), {
      wrapper,
    });

    // Initial watchers is an empty plain object.
    expect(result.current.watchers).toEqual({});
    expect(Object.keys(result.current.watchers)).toEqual([]);

    // Simulate another field subscribing to "email": invoke the setter the
    // hook registered (mirrors what the subscription system does at runtime).
    // The setter calls the hook's setWatchers → wrap in act() so React flushes
    // the state update synchronously (avoids the act() warning).
    const setter = spies.watcherSetters.get("email");
    expect(setter).toBeTypeOf("function");
    act(() => {
      setter!({ country: true });
    });

    // Re-render so the hook returns the updated `watchers` state.
    rerender();

    // watchers is now { country: true } — a Record<string, boolean>.
    expect(result.current.watchers).toEqual({ country: true });
    expect(result.current.watchers.country).toBe(true);
  });
});
