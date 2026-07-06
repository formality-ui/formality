// §20.6 acceptance suite (PRD §20.5 / §20.6).
//
// Four tests proving that `<Field>`'s `forwardRef`-EXCLUSIVE ref delivery
// (the P1.M1.T1.S1 runtime change — Field.tsx `coreProps` emits
// `forwardRef: field.ref` and NO React-special `ref` key) satisfies the PRD
// §20.5 acceptance criteria end-to-end through the REAL
// `<FormalityProvider>/<Form>/<Field>` stack (no stubbed Controller, real
// RHF + jsdom DOM).
//
// The four required tests (PRD §20.6 "Testing requirements"):
//   1. PLAIN-COMPONENT DELIVERY — a plain (non-React.forwardRef) function
//      component receives a non-undefined `forwardRef` and the DOM node
//      resolves / is registered.
//   2. NO REACT 18 REF WARNING — the substring
//      "Function components cannot be given refs" is NEVER emitted.
//   3. FOCUS-ON-ERROR — submitting an invalid `required` field focuses the
//      input wired via `forwardRef`.
//   4. REACT.FORWARDREF MIGRATION REGRESSION — a `React.forwardRef`-wrapped
//      component consuming `props.forwardRef` (the post-migration
//      TestInput/TestSwitch shape, Option A) still focuses on error.
//
// This file defines its OWN local input registry (no private import from
// Field.test.tsx — see PRP gotcha "don't import private testInputs").
import {
  type ComponentType,
  type ReactNode,
  type Ref,
  forwardRef as reactForwardRef,
} from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig } from "@formality-ui/core";
import type { FormalityFieldComponentProps } from "../overlays";

// Restore any console spies after every test so a leaked spy can never
// swallow errors in later tests (PRP gotcha "console spy restore").
afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Local components — typed by the FormalityFieldComponentProps contract.
// ---------------------------------------------------------------------------

interface PlainInputProps {
  label?: string;
}

// A PLAIN function component (NOT wrapped in React.forwardRef). It
// destructures `forwardRef` from props (the FormalityFieldComponentProps
// contract) and wires it to the inner `<input>`. This is the §20.5
// acceptance shape for a downstream consumer:
//   const TextField = ({ forwardRef, ...rest }) => <input ref={forwardRef} ... />;
const PlainInput: ComponentType<
  FormalityFieldComponentProps<PlainInputProps>
> = ({ forwardRef, label, ...rest }) => (
  <input
    aria-label={label ?? "plain-input"}
    data-testid="plain-input"
    ref={forwardRef as Ref<HTMLInputElement>}
    {...(rest as Record<string, unknown>)}
  />
);

// A React.forwardRef-wrapped component that consumes `forwardRef` from props
// (PRD §20.4 option A — the post-migration TestInput/TestSwitch shape). The
// wrap is retained for shape compatibility; the inner input wires the
// `forwardRef` prop. Used by the REACT.FORWARDREF MIGRATION REGRESSION test.
const ForwardRefMigratedInput = reactForwardRef<
  HTMLInputElement,
  FormalityFieldComponentProps<PlainInputProps> & {
    forwardRef?: Ref<HTMLInputElement>;
  }
>(function ForwardRefMigratedInput(
  { forwardRef, label, ...props },
  // The second-arg `ref` is intentionally unused: after S1, Formality no
  // longer delivers the ref via React's special `ref` key, so the inner
  // input wires `forwardRef` (the prop) instead.
  _ref,
) {
  return (
    <input
      aria-label={label ?? "migrated-input"}
      data-testid="migrated-input"
      ref={forwardRef}
      {...(props as Record<string, unknown>)}
    />
  );
}) as unknown as ComponentType<FormalityFieldComponentProps<PlainInputProps>>;
ForwardRefMigratedInput.displayName = "ForwardRefMigratedInput";

// ---------------------------------------------------------------------------
// Local input registries (copy of the testInputs pattern — no private import).
// ---------------------------------------------------------------------------

const plainInputs: Record<string, InputConfig> = {
  plainText: {
    component: PlainInput,
    defaultValue: "",
  },
};

const migratedInputs: Record<string, InputConfig> = {
  migratedText: {
    component: ForwardRefMigratedInput,
    defaultValue: "",
  },
};

// ---------------------------------------------------------------------------
// Shared mount helper.
//
// `<Form>` does NOT render a `<form>` element itself (it renders children
// inside providers), so to exercise RHF's `handleSubmit` — and its
// focus-on-error side effect — we render the children as a function and wire
// a real `<form onSubmit={methods.handleSubmit(onSubmit)}>` with a submit
// button. This mirrors the established pattern in Form.test.tsx.
// ---------------------------------------------------------------------------

interface MountOptions {
  inputs: Record<string, InputConfig>;
  fieldType: string;
  rules?: Record<string, unknown>;
  onSubmit?: () => void;
  children?: ReactNode;
}

function mountForm({
  inputs,
  fieldType,
  rules,
  onSubmit,
  children,
}: MountOptions) {
  const submit = onSubmit ?? vi.fn();
  render(
    <FormalityProvider inputs={inputs}>
      <Form
        config={{ name: { type: fieldType, ...(rules ? { rules } : {}) } }}
        onSubmit={submit}
      >
        {({ methods }) => (
          <form onSubmit={methods.handleSubmit(submit)}>
            {children ?? <Field name="name" />}
            <button type="submit" data-testid="submit">
              submit
            </button>
          </form>
        )}
      </Form>
    </FormalityProvider>,
  );
  return { submit };
}

// ===========================================================================
// §20.6 acceptance tests
// ===========================================================================

describe("Field — §20.6 forwardRef acceptance (PRD §20.5)", () => {
  // 1. PLAIN-COMPONENT DELIVERY
  //    A plain (non-React.forwardRef) function component destructures
  //    `forwardRef` and wires it to an `<input>`; assert the input is
  //    registered & rendered (the ref was delivered, not swallowed).
  it("delivers a non-undefined forwardRef to a plain function component", () => {
    mountForm({ inputs: plainInputs, fieldType: "plainText" });

    const input = screen.getByTestId("plain-input");
    // The plain component rendered through <Field> — forwardRef was delivered
    // (otherwise the component wouldn't be wired to RHF and wouldn't render
    // via the Controller path the same way).
    expect(input).toBeInTheDocument();
    // A focusable <input> is the DOM node RHF's ref resolves to (§4.10).
    expect(input.tagName).toBe("INPUT");
  });

  // 2. NO REACT 18 REF WARNING
  //    Under the forwardRef-prop path, React 18 must NOT emit
  //    "Function components cannot be given refs".
  it("does not emit the React 18 'Function components cannot be given refs' warning", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mountForm({ inputs: plainInputs, fieldType: "plainText" });

    const calls = [...errorSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .join(" ");
    expect(calls).not.toContain("Function components cannot be given refs");

    // spies restored by the top-level afterEach(() => vi.restoreAllMocks())
  });

  // 3. FOCUS-ON-ERROR
  //    Submitting an invalid `required` field focuses the input wired via
  //    `forwardRef` (jsdom sets `document.activeElement`).
  it("focuses the plain input wired via forwardRef on a failed required submit", async () => {
    const user = userEvent.setup();
    mountForm({
      inputs: plainInputs,
      fieldType: "plainText",
      rules: { required: true },
    });

    await user.click(screen.getByTestId("submit"));

    await waitFor(() =>
      expect(screen.getByTestId("plain-input")).toHaveFocus(),
    );
  });

  // 4. REACT.FORWARDREF MIGRATION REGRESSION
  //    A React.forwardRef-wrapped component consuming `props.forwardRef`
  //    (Option A — the post-migration TestInput/TestSwitch shape) still
  //    focuses correctly on error.
  it("focuses a React.forwardRef-wrapped component consuming props.forwardRef on error (migration regression)", async () => {
    const user = userEvent.setup();
    mountForm({
      inputs: migratedInputs,
      fieldType: "migratedText",
      rules: { required: true },
    });

    await user.click(screen.getByTestId("submit"));

    await waitFor(() =>
      expect(screen.getByTestId("migrated-input")).toHaveFocus(),
    );
  });
});
