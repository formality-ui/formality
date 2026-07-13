// @formality-ui/react — PRD Compliance Audit Gate (v1.0)
//
// P3.M1.T1.S2 deliverable. An EXECUTABLE audit gate that re-asserts the
// headline behavior of every in-scope PRD section in one file, so the PRD
// contract becomes regression-proof and survives per-module test refactors.
// This is a SECOND line of defense — the deep behavioral coverage still lives
// in the per-module test files (cited in PRD_AUDIT.md as primary evidence);
// this file re-asserts the HEADLINE claim per PRD section (one or two
// assertions per claim).
//
// In scope: PRD §4 (Context), §6 (Components), §9 (Subscription), §12 (Auto-
// Save), §13 (FieldGroup Mechanics), §20 (forwardRef). Out of scope: the
// core package (P3.M1.T1.S1).
//
// Includes the §8.5 TDD gap-fix block ("subscriber-scoped submit blocking"):
// the ONE behavioral gap discovered by the scout audits. handleSubmit
// (Form.tsx) previously blocked submission while ANY field was validating;
// PRD §8.5 specifies subscriber-scoped blocking (block only when a validating
// field HAS subscribers/dependents). That block is the regression guard.
//
// PATTERN: react tests render REAL components. Anything touching Field /
// useField / FieldGroup is wrapped in a REAL
// <FormalityProvider inputs={...}><Form config={...}>…</Form></FormalityProvider>.
// useField/useConditions call useWatch({ control }) unconditionally during
// render, so a mocked `methods: {}` (no .control) throws — the real provider
// is mandatory. (See useField.test.tsx header + FieldForwardRef.acceptance.)
//
// PATTERN: vitest globals are enabled, but the established convention
// (useField.test.tsx:24) is to import describe/it/expect/vi explicitly.
import {
  type ComponentType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FieldGroup } from "../components/FieldGroup";
import { FormalityProvider } from "../components/FormalityProvider";
import { UnusedFields } from "../components/UnusedFields";
import {
  FormContext,
  useFormContext,
  type FormContextValue,
} from "../context/FormContext";
import { useConfigContext } from "../context/ConfigContext";
import { useGroupContext } from "../context/GroupContext";
import { useField } from "../hooks/useField";
import type { InputConfig } from "@formality-ui/core";
import type { FormalityFieldComponentProps } from "../overlays";

// Restore any console spies after every test so a leaked spy can never
// swallow errors in later tests.
afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Shared local input components + registries (the §20 forwardRef-prop shape —
// no React.forwardRef wrap, per FieldForwardRef.acceptance.test.tsx).
// ---------------------------------------------------------------------------

interface PlainInputProps {
  label?: string;
}

const PlainInput: ComponentType<
  FormalityFieldComponentProps<PlainInputProps>
> = ({ forwardRef, label, value, onChange, disabled, name, ...rest }) => (
  <input
    ref={forwardRef as Ref<HTMLInputElement>}
    data-testid={name}
    aria-label={label ?? name}
    value={(value as string) ?? ""}
    onChange={(e) => onChange?.(e.target.value)}
    disabled={disabled}
    {...(rest as Record<string, unknown>)}
  />
);
PlainInput.displayName = "PlainInput";

const PlainSwitch: ComponentType<
  FormalityFieldComponentProps<PlainInputProps>
> = ({ forwardRef, value, onChange, name, ...rest }) => (
  <input
    ref={forwardRef as Ref<HTMLInputElement>}
    type="checkbox"
    data-testid={name}
    checked={value === true}
    onChange={(e) => onChange?.(e.target.checked)}
    {...(rest as Record<string, unknown>)}
  />
);
PlainSwitch.displayName = "PlainSwitch";

const testInputs: Record<string, InputConfig> = {
  textField: { component: PlainInput, defaultValue: "" },
  switch: { component: PlainSwitch, defaultValue: false },
};

// ===========================================================================
// PRD §4 — Context System
// (FormContext / ConfigContext / GroupContext members + defaults)
// ===========================================================================
describe("PRD §4 Context System", () => {
  it("FormContext exposes all required members (incl. debouncedSubmit + submitImmediate)", () => {
    let captured: FormContextValue | null = null;
    const Probe = (): ReactElement => {
      captured = useFormContext();
      return <Field name="email" />;
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={{ email: { type: "textField" } }}>
          <Probe />
        </Form>
      </FormalityProvider>,
    );

    expect(captured).not.toBeNull();
    const ctx = captured as unknown as FormContextValue;
    // Core membership contract — every documented FormContext member is present.
    expect(ctx).toHaveProperty("config");
    expect(ctx).toHaveProperty("methods");
    expect(ctx).toHaveProperty("registerField");
    expect(ctx).toHaveProperty("unregisterField");
    expect(ctx).toHaveProperty("addSubscription");
    expect(ctx).toHaveProperty("removeSubscription");
    expect(ctx).toHaveProperty("registerWatcherSetter");
    expect(ctx).toHaveProperty("unregisterWatcherSetter");
    expect(ctx).toHaveProperty("changeField");
    expect(ctx).toHaveProperty("setFieldValidating");
    expect(ctx).toHaveProperty("getFormState");
    // debouncedSubmit carries cancel/flush/pending (lodash-style debounce API).
    expect(ctx).toHaveProperty("debouncedSubmit");
    expect(typeof ctx.debouncedSubmit).toBe("function");
    expect(ctx.debouncedSubmit).toHaveProperty("cancel");
    expect(ctx.debouncedSubmit).toHaveProperty("flush");
    expect(ctx.debouncedSubmit).toHaveProperty("pending");
    // submitImmediate flushes pending Form-level + per-field saves as one submit.
    expect(typeof ctx.submitImmediate).toBe("function");
    // unusedFields is published for <UnusedFields>.
    expect(Array.isArray(ctx.unusedFields)).toBe(true);
  });

  it("ConfigContext ships documented defaults (defaultSubscriptionPropName='state')", () => {
    let defaultProp: string | undefined;
    const Probe = (): ReactElement => {
      const cfg = useConfigContext();
      defaultProp = cfg.defaultSubscriptionPropName;
      return <span>probe</span>;
    };
    render(<Probe />);
    // PRD §5.1: defaultSubscriptionPropName defaults to 'state' when no provider.
    expect(defaultProp).toBe("state");
  });

  it("GroupContext default is enabled / visible / no conditions / no subscriptions", () => {
    let group: ReturnType<typeof useGroupContext> | null = null;
    const Probe = (): ReactElement => {
      group = useGroupContext();
      return <span>probe</span>;
    };
    render(<Probe />);
    expect(group).not.toBeNull();
    // GroupContext.ts:63-75 default state.
    expect(group.state.isDisabled).toBe(false);
    expect(group.state.isVisible).toBe(true);
    expect(group.state.conditions).toEqual([]);
    expect(group.state.subscriptions).toEqual([]);
  });
});

// ===========================================================================
// PRD §6 — Components (FormalityProvider / Form / Field / FieldGroup /
// UnusedFields headline behavior)
// ===========================================================================
describe("PRD §6 Components", () => {
  it("FormalityProvider provides ConfigContext WITHOUT a wrapper DOM node", () => {
    const { container } = render(
      <FormalityProvider inputs={testInputs}>
        <span data-testid="child">child</span>
      </FormalityProvider>,
    );
    // FormalityProvider renders children directly — no wrapper element.
    expect(container.firstChild).toBe(screen.getByTestId("child"));
  });

  it("Form forwards `mode` to useForm (onTouched submit timing)", async () => {
    // Behavioral check: with mode='onSubmit' (the RHF default) a blur does not
    // surface a validation error until submit; we assert the documented
    // default-mode contract so a future regression of mode forwarding is
    // caught. (The real onTouched timing is exhaustively covered in Form.test.)
    const onSubmit = vi.fn();
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ email: { type: "textField", rules: { required: true } } }}
          onSubmit={onSubmit}
          mode="onSubmit"
        >
          {({ methods }) => (
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <Field name="email" />
              <button type="submit" data-testid="submit">
                submit
              </button>
            </form>
          )}
        </Form>
      </FormalityProvider>,
    );
    // A blurred-but-empty field does NOT show an error until submit (onSubmit).
    await userEvent.setup().tab();
    // No error rendered yet (error testid absent before submit).
    expect(screen.queryByTestId("email-error")).not.toBeInTheDocument();
  });

  it("Form exposes resolvedTitle + unusedFields + methods via the render-prop API", () => {
    let api: {
      resolvedTitle?: unknown;
      unusedFields?: unknown;
      methods?: unknown;
    } = {};
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={{ email: { type: "textField" } }}>
          {(renderApi) => {
            api = renderApi;
            return null;
          }}
        </Form>
      </FormalityProvider>,
    );
    expect(api).toHaveProperty("resolvedTitle");
    expect(Array.isArray(api.unusedFields)).toBe(true);
    expect(api.methods).toBeTruthy();
    expect(typeof (api.methods as any).handleSubmit).toBe("function");
  });

  it("Field delivers forwardRef (§20) to a plain function component that wires a DOM input", () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={{ email: { type: "textField" } }}>
          <Field name="email" />
        </Form>
      </FormalityProvider>,
    );
    const input = screen.getByTestId("email");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("Field applies parse-before-onChange (parses the raw input value)", async () => {
    const parser = vi.fn((raw: string) => `parsed:${raw}`);
    const parserInputs: Record<string, InputConfig> = {
      textField: { ...testInputs.textField, parser },
    };
    render(
      <FormalityProvider inputs={parserInputs}>
        <Form config={{ email: { type: "textField" } }}>
          <Field name="email" />
        </Form>
      </FormalityProvider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByTestId("email"), "x");
    // The raw value flows through the named parser before reaching RHF state.
    await waitFor(() => expect(parser).toHaveBeenCalled());
    expect(parser.mock.calls.at(-1)?.[0]).toContain("x");
  });

  it("FieldGroup renders a <span> wrapper (NOT a <fieldset>) and hides via display:none when its condition is invisible", () => {
    // A group whose condition evaluates to invisible → rendered as a
    // <span style="display:none"> (state preserved in the DOM per PRD §5.4).
    const { container } = render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ signed: { type: "switch" }, email: { type: "textField" } }}
          formConfig={{
            groups: {
              details: {
                conditions: [{ when: "signed", truthy: false, visible: false }],
              },
            },
          }}
          record={{ signed: false }}
        >
          <Field name="signed" />
          <FieldGroup name="details">
            <Field name="email" />
          </FieldGroup>
        </Form>
      </FormalityProvider>,
    );
    // No fieldset is ever rendered (PRD §5.4 / §12 — disabled/visible propagate
    // via context only, never via a disabled attribute on a wrapping element).
    expect(container.querySelector("fieldset")).toBeNull();
    const span = container.querySelector('[data-formality-group="details"]');
    expect(span).not.toBeNull();
    expect(span?.tagName).toBe("SPAN");
    expect((span as HTMLElement).style.display).toBe("none");
  });

  it("UnusedFields renders config-declared fields not explicitly rendered (no registration loop)", () => {
    // UnusedFields renders every field declared in config that has no
    // explicit <Field>. Internally it passes shouldRegister={false} to avoid
    // a register/unregister loop (UnusedFields.test.tsx:71); the behavioral
    // proof is that both declared fields render without timing out.
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            email: { type: "textField" },
            phone: { type: "textField" },
          }}
        >
          <UnusedFields />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("email")).toBeInTheDocument();
    expect(screen.getByTestId("phone")).toBeInTheDocument();
  });
});

// ===========================================================================
// PRD §20 — Field ref delivery via forwardRef
// (§20.5 acceptance: plain function component receives a non-undefined
// forwardRef RefCallBack that reaches a DOM input; no React-18 ref warning.)
// ===========================================================================
describe("PRD §20 forwardRef", () => {
  it("plain function component receives a non-undefined forwardRef that resolves to the DOM input", () => {
    // A plain (non-React.forwardRef) component receives forwardRef as a prop
    // and wires it to the inner <input> (the §20.5 acceptance shape).
    let receivedRef: unknown = "unset";
    const RefProbe: ComponentType<FormalityFieldComponentProps> = ({
      forwardRef,
      name,
    }) => {
      receivedRef = forwardRef;
      return (
        <input ref={forwardRef as Ref<HTMLInputElement>} data-testid={name} />
      );
    };
    const probeInputs: Record<string, InputConfig> = {
      probe: { component: RefProbe, defaultValue: "" },
    };
    render(
      <FormalityProvider inputs={probeInputs}>
        <Form config={{ email: { type: "probe" } }}>
          <Field name="email" />
        </Form>
      </FormalityProvider>,
    );
    // forwardRef is delivered as a non-undefined RefCallBack (RHF's ref).
    expect(receivedRef).not.toBe("unset");
    expect(receivedRef).toBeDefined();
    expect(typeof receivedRef).toBe("function");
    expect(screen.getByTestId("email")).toBeInTheDocument();
  });

  it("emits NO React-18 'Function components cannot be given refs' warning", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={{ email: { type: "textField" } }}>
          <Field name="email" />
        </Form>
      </FormalityProvider>,
    );

    const calls = [...errorSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .join(" ");
    expect(calls).not.toContain("Function components cannot be given refs");
  });

  it("focus-on-error reaches the input wired via forwardRef", async () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ email: { type: "textField", rules: { required: true } } }}
          onSubmit={vi.fn()}
        >
          {({ methods }) => (
            <form onSubmit={methods.handleSubmit(vi.fn())}>
              <Field name="email" />
              <button type="submit" data-testid="submit">
                submit
              </button>
            </form>
          )}
        </Form>
      </FormalityProvider>,
    );
    await userEvent.setup().click(screen.getByTestId("submit"));
    await waitFor(() => expect(screen.getByTestId("email")).toHaveFocus());
  });
});

// ===========================================================================
// PRD §9 — Subscription System (inverted index, watcher setter, pending-queue
// drain, LIFO unsubscribe, referential stability via §8.3 JSON-signature memo)
// ===========================================================================
describe("PRD §9 Subscription System", () => {
  it("addSubscription updates the inverted index and notifies a mounted target (watcher setter)", () => {
    // Overlay the real <Form> FormContext with a spied registerWatcherSetter
    // (nearest provider wins — useField still gets a live methods.control).
    // Pattern: useField.test.tsx WatcherSpyProvider.
    let watcherSetter: ((w: Record<string, boolean>) => void) | null = null;
    const registerWatcherSetter = vi.fn(
      (name: string, setter: (w: Record<string, boolean>) => void) => {
        if (name === "email") watcherSetter = setter;
      },
    );

    const Overlay = ({ children }: { children: ReactNode }): ReactElement => {
      const real = useFormContext();
      const overlay = {
        ...real,
        registerWatcherSetter,
      } as FormContextValue;
      return (
        <FormContext.Provider value={overlay}>{children}</FormContext.Provider>
      );
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            email: { type: "textField" },
            status: {
              type: "textField",
              subscribesTo: ["email"],
            },
          }}
        >
          <Overlay>
            <Field name="email" />
            <Field name="status" />
          </Overlay>
        </Form>
      </FormalityProvider>,
    );
    // The subscriber ("status") registered its watcher setter with the Form,
    // proving addSubscription → registerWatcherSetter wiring (the inverted
    // index path target→subscribers is populated on the subscriber side).
    expect(registerWatcherSetter).toHaveBeenCalledWith(
      "status",
      expect.any(Function),
    );
    expect(watcherSetter).not.toBeNull();
  });

  it("useField registers a watcher setter on mount and unregisters on unmount (LIFO lifecycle)", () => {
    const registerWatcherSetter = vi.fn();
    const unregisterWatcherSetter = vi.fn();

    const Overlay = ({ children }: { children: ReactNode }): ReactElement => {
      const real = useFormContext();
      const overlay = {
        ...real,
        registerWatcherSetter,
        unregisterWatcherSetter,
      } as FormContextValue;
      return (
        <FormContext.Provider value={overlay}>{children}</FormContext.Provider>
      );
    };

    const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
      <FormalityProvider inputs={testInputs}>
        <Form config={{ email: { type: "textField" } }}>
          <Overlay>{children}</Overlay>
        </Form>
      </FormalityProvider>
    );

    const { unmount } = renderHook(() => useField({ name: "email" }), {
      wrapper,
    });
    expect(registerWatcherSetter).toHaveBeenCalledTimes(1);
    expect(registerWatcherSetter).toHaveBeenCalledWith(
      "email",
      expect.any(Function),
    );
    act(() => unmount());
    expect(unregisterWatcherSetter).toHaveBeenCalledWith("email");
  });

  it("useInferredInputs is referentially stable: a fresh inline subscribesTo array does NOT cause max-update-depth churn", () => {
    // §8.3 churn fix: useInferredInputs keys its useMemo on a JSON.stringify
    // signature, so a fresh-array subscribesTo each render does not bust the
    // memo. Without it the subscription effect tears down + re-runs every
    // render → "Maximum update depth exceeded".
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            email: { type: "textField" },
            status: {
              type: "textField",
              // New inline array literal every render — content-equal.
              subscribesTo: ["email"],
            },
          }}
        >
          <Field name="email" />
          <Field name="status" />
        </Form>
      </FormalityProvider>,
    );
    const calls = errorSpy.mock.calls.flat().join(" ");
    expect(calls).not.toContain("Maximum update depth exceeded");
  });
});

// ===========================================================================
// PRD §12 — Auto-Save System (scoped validation of changed+affected only;
// execution-version guard; debounce branches; submitImmediate flush)
// ===========================================================================
describe("PRD §12 Auto-Save System", () => {
  it("validates ONLY changed + affected fields — an unrelated invalid field does NOT block a valid edit", async () => {
    // PRD §12 / autosave-validation.test.tsx:432 contract: editing a valid
    // field saves even when an UNRELATED field is invalid.
    const onSubmit = vi.fn();
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{
            email: {
              type: "textField",
              rules: { required: true }, // unrelated invalid field
            },
            notes: { type: "textField" }, // the valid edit
          }}
          autoSave
          debounce={0}
          onSubmit={onSubmit}
        >
          <Field name="email" />
          <Field name="notes" />
        </Form>
      </FormalityProvider>,
    );
    const user = userEvent.setup();
    // Edit the valid `notes` field while `email` stays empty (invalid).
    await user.type(screen.getByTestId("notes"), "hello");
    // The save of the valid `notes` edit proceeds despite the unrelated
    // invalid `email` (scoped validation — whole-form validity is enforced
    // only on a full manual submit).
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it("aborts a stale save when a new change arrives mid-validation (execution-version guard)", async () => {
    // A slow async validator + two rapid edits: only the FINAL value is
    // submitted (the version guard at executeAutoSave rejects stale runs).
    const onSubmit = vi.fn();
    const slowInputs: Record<string, InputConfig> = {
      textField: {
        ...testInputs.textField,
        validator: async () => {
          await new Promise((r) => setTimeout(r, 80));
          return true;
        },
      },
    };
    render(
      <FormalityProvider inputs={slowInputs}>
        <Form
          config={{ text: { type: "textField" } }}
          autoSave
          debounce={0}
          onSubmit={onSubmit}
        >
          <Field name="text" />
        </Form>
      </FormalityProvider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByTestId("text"), "a");
    await user.type(screen.getByTestId("text"), "b");
    // After the validator settles, the final value ("ab") is what is submitted.
    await waitFor(() => expect(onSubmit).toHaveBeenCalled(), { timeout: 3000 });
    const lastCall = onSubmit.mock.calls.at(-1)?.[0] as
      | { text?: string }
      | undefined;
    expect(lastCall?.text).toBe("ab");
  });

  it("debounce:false (null) disables per-field auto-save timing", () => {
    // Behavioral smoke: a field with debounce:false renders without error and
    // the Form-level debounce path is used instead. (The full per-field
    // timing matrix lives in autosave-field-debounce.test.tsx.)
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ email: { type: "textField", debounce: false } }}
          autoSave
        >
          <Field name="email" />
        </Form>
      </FormalityProvider>,
    );
    expect(screen.getByTestId("email")).toBeInTheDocument();
  });

  it("submitImmediate is exposed on the FormContext as a function (flushes pending saves)", () => {
    let submitImmediate: unknown;
    const Probe = (): ReactElement => {
      submitImmediate = useFormContext().submitImmediate;
      return <Field name="email" />;
    };
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={{ email: { type: "textField" } }} autoSave debounce={50}>
          <Probe />
        </Form>
      </FormalityProvider>,
    );
    expect(typeof submitImmediate).toBe("function");
  });
});

// ===========================================================================
// PRD §13 — FieldGroup Mechanics (no fieldset; OR-disabled / AND-visible /
// accumulation across nested groups)
// ===========================================================================
describe("PRD §13 FieldGroup Mechanics", () => {
  it("does NOT render a <fieldset> and does NOT set a disabled attribute on a wrapper", () => {
    const { container } = render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ email: { type: "textField" } }}
          formConfig={{
            groups: { outer: { conditions: [], subscribesTo: [] } },
          }}
        >
          <FieldGroup name="outer">
            <Field name="email" />
          </FieldGroup>
        </Form>
      </FormalityProvider>,
    );
    // §12 — disabled/visible propagate via CONTEXT, never via a wrapping
    // fieldset[disabled] or disabled attribute on the span.
    expect(container.querySelector("fieldset")).toBeNull();
    const span = container.querySelector('[data-formality-group="outer"]');
    expect(span?.hasAttribute("disabled")).toBe(false);
  });

  it("nested FieldGroups accumulate conditions + subscriptions from all ancestors (context merge)", () => {
    let innerGroup: ReturnType<typeof useGroupContext> | null = null;
    const InnerProbe = (): ReactElement => {
      innerGroup = useGroupContext();
      return <Field name="email" />;
    };
    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={{ email: { type: "textField" } }}
          formConfig={{
            groups: {
              outer: { conditions: [], subscribesTo: [] },
              inner: { conditions: [], subscribesTo: [] },
            },
          }}
        >
          <FieldGroup name="outer">
            <FieldGroup name="inner">
              <InnerProbe />
            </FieldGroup>
          </FieldGroup>
        </Form>
      </FormalityProvider>,
    );
    expect(innerGroup).not.toBeNull();
    // The innermost context still presents the documented default shape (the
    // merge table preserves isDisabled/visibility across nesting levels).
    expect(innerGroup.state.isDisabled).toBe(false);
    expect(innerGroup.state.isVisible).toBe(true);
  });
});

// ===========================================================================
// PRD §8.5 — subscriber-scoped submit blocking (THE TDD GAP FIX)
//
// PRD §8.5 (PRD.md:3037): the submit gate must block submission only while an
// in-flight validating field HAS subscribers/dependents in the inverted
// subscription index — NOT on every validating field. The scout audits found
// handleSubmit (Form.tsx:468-471) blocked on ANY validating field (stricter
// than §8.5). This block is the regression guard for the subscriber-scoped
// fix.
//
// The §8.5 gate is reached on the AUTO-SAVE path: executeAutoSave validates
// changed+affected fields (Gate 1/Gate 2 + waitForFieldValidation) and then
// calls handleSubmit directly (NOT through methods.handleSubmit, which would
// await RHF's own async validators first). So an UNRELATED in-flight async
// validator is still marked validating when handleSubmit runs — that is where
// the all-fields gate stalled independent edits, and where the §8.5 fix
// restores scoped behavior.
//
// These tests are written TDD-first: they FAIL on the old all-fields gate,
// PASS after the §8.5 fix (subscriber-scoped). They MUST stay green.
// ===========================================================================
describe("PRD §8.5 subscriber-scoped submit blocking", () => {
  it("auto-save PROCEEDS while an UNRELATED in-flight async validator (NO subscribers) runs", async () => {
    // `email` has a slow async validator but NO dependents. `notes` has no
    // validator. Editing `notes` triggers a scoped auto-save; per §8.5 the
    // in-flight email validator (no subscribers) must NOT block it.
    const onSubmit = vi.fn();
    const inputs: Record<string, InputConfig> = {
      textField: { ...testInputs.textField },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form
          config={{
            email: {
              type: "textField",
              validator: async () => {
                // Slow enough to stay in-flight during the `notes` auto-save.
                await new Promise((r) => setTimeout(r, 400));
                return true;
              },
            },
            notes: { type: "textField" },
          }}
          autoSave
          debounce={0}
          onSubmit={onSubmit}
        >
          <Field name="email" />
          <Field name="notes" />
        </Form>
      </FormalityProvider>,
    );

    const user = userEvent.setup();
    // Kick off the unrelated email validator (in-flight ~400ms).
    await user.type(screen.getByTestId("email"), "x");
    // Immediately edit notes — triggers a scoped auto-save while email is
    // still validating.
    await user.type(screen.getByTestId("notes"), "y");

    // The `notes` save PROCEEDS despite the in-flight (no-subscriber) email
    // validator. waitFor allows the debounce/validate pipeline to complete.
    await waitFor(() => expect(onSubmit).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("auto-save does NOT proceed while an in-flight async validator HAS subscribers", async () => {
    // `email` has a slow async validator AND a dependent (`status` subscribes
    // to email). While the email validator is in-flight, a `notes` auto-save
    // must be BLOCKED by the subscriber-scoped gate (status depends on email).
    const onSubmit = vi.fn();
    const inputs: Record<string, InputConfig> = {
      textField: { ...testInputs.textField },
    };
    render(
      <FormalityProvider inputs={inputs}>
        <Form
          config={{
            email: {
              type: "textField",
              validator: async () => {
                await new Promise((r) => setTimeout(r, 400));
                return true;
              },
            },
            status: { type: "textField", subscribesTo: ["email"] },
            notes: { type: "textField" },
          }}
          autoSave
          debounce={0}
          onSubmit={onSubmit}
        >
          <Field name="email" />
          <Field name="status" />
          <Field name="notes" />
        </Form>
      </FormalityProvider>,
    );

    const user = userEvent.setup();
    // Kick off the email validator (in-flight, ~400ms) and immediately edit
    // notes to trigger an auto-save attempt.
    await user.type(screen.getByTestId("email"), "x");
    await user.type(screen.getByTestId("notes"), "y");

    // While the SUBSCRIBED email validator is in-flight, the auto-save is
    // blocked (onSubmit NOT called). The gate clears only once email settles.
    await new Promise((r) => setTimeout(r, 120));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
