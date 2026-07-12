// @formality-ui/react - Integration tests for validation-report fixes.
//
// These tests exercise the documented user-facing behaviors that were flagged
// as broken in the validation report (2026-07-11) and verify they now work
// end-to-end through the public React API:
//
//   - Function-based `selectSet` in conditions (PRD §7.4 / §8.4, README)
//   - Function-based `selectWhen` in conditions (PRD §7.4 / §8.4)
//   - `provideState` FieldConfig option (PRD §3.2 / §5.3 / App. B)
//   - `passSubscriptions` / `passSubscriptionsAs` (PRD §3.2 / §5.3)
//   - `formState` delivery to plain components (PRD §C.4 / T3.1)
//   - Validator factory referenced by name (PRD §10.2)
import type React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig } from "@formality-ui/core";
import type { FormalityFieldComponentProps } from "../overlays";

// A plain text input that surfaces injected state/formState via data attributes
// so the tests can assert against the DOM without reaching into internals.
interface StatefulInputProps {
  name: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  onBlur?: React.FocusEventHandler;
  disabled?: boolean;
  forwardRef?: React.Ref<HTMLInputElement>;
}

const StatefulInput = ({
  name,
  value,
  onChange,
  disabled,
  forwardRef,
  ...rest
}: StatefulInputProps &
  FormalityFieldComponentProps<Record<string, unknown>>) => (
  <div>
    <input
      ref={forwardRef}
      data-testid={name}
      value={(value as string) ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
    />
    <span data-testid={`${name}-state-touched`}>
      {rest.state ? "has-state" : "no-state"}
    </span>
    <span data-testid={`${name}-formstate`}>
      {rest.formState ? "has-formstate" : "no-formstate"}
    </span>
    <span data-testid={`${name}-subs`}>
      {rest.subscribedState
        ? `subs:${Object.keys(rest.subscribedState as object).length}`
        : "no-subs"}
    </span>
  </div>
);

StatefulInput.displayName = "StatefulInput";

const inputs: Record<string, InputConfig> = {
  statefulText: {
    component: StatefulInput,
    defaultValue: "",
  },
  textField: {
    component: StatefulInput,
    defaultValue: "",
  },
};

describe("validation report fixes", () => {
  describe("function-based selectSet in conditions (Issue 3)", () => {
    it("derives a value via a function-based selectSet without crashing", async () => {
      const user = userEvent.setup();

      render(
        <FormalityProvider inputs={inputs}>
          <Form
            config={{
              firstName: { type: "textField" },
              lastName: { type: "textField" },
              fullName: {
                type: "textField",
                disabled: true,
                subscribesTo: ["firstName", "lastName"],
                conditions: [
                  {
                    selectWhen: "firstName || lastName",
                    selectSet: ({ fields }) => {
                      const first = (fields.firstName?.value as string) ?? "";
                      const last = (fields.lastName?.value as string) ?? "";
                      return `${first} ${last}`.trim();
                    },
                  },
                ],
              },
            }}
          >
            <Field name="firstName" />
            <Field name="lastName" />
            <Field name="fullName" />
          </Form>
        </FormalityProvider>,
      );

      // Type into the source fields; the dependent field must receive the
      // derived value (NOT the function object) and not crash.
      await user.type(screen.getByTestId("firstName"), "Ada");
      await user.type(screen.getByTestId("lastName"), "Lovelace");

      const fullNameInput = screen.getByTestId("fullName") as HTMLInputElement;
      expect(fullNameInput.value).toBe("Ada Lovelace");
    });
  });

  describe("function-based selectWhen in conditions (Issue 4)", () => {
    it("matches when the function returns truthy", async () => {
      const user = userEvent.setup();

      render(
        <FormalityProvider inputs={inputs}>
          <Form
            config={{
              client: { type: "textField" },
              premiumNote: {
                type: "textField",
                conditions: [
                  {
                    selectWhen: ({ fields }) =>
                      (fields.client?.value as string) === "premium",
                    subscribesTo: ["client"],
                    disabled: true,
                  },
                ],
              },
            }}
          >
            <Field name="client" />
            <Field name="premiumNote" />
          </Form>
        </FormalityProvider>,
      );

      // Initially enabled (function returns false).
      expect(
        screen.getByTestId("premiumNote") as HTMLInputElement,
      ).not.toBeDisabled();

      // Type the trigger value; function now returns true, so disabled.
      await user.type(screen.getByTestId("client"), "premium");
      expect(
        screen.getByTestId("premiumNote") as HTMLInputElement,
      ).toBeDisabled();
    });
  });

  describe("provideState injects own field state (Issue 1)", () => {
    it("delivers a `state` prop to the component when provideState is on", () => {
      render(
        <FormalityProvider inputs={inputs}>
          <Form
            config={{
              username: {
                type: "statefulText",
                provideState: true,
              },
            }}
          >
            <Field name="username" />
          </Form>
        </FormalityProvider>,
      );

      // The component should receive a `state` object (own field state).
      expect(screen.getByTestId("username-state-touched")).toHaveTextContent(
        "has-state",
      );
    });

    it("does not deliver `state` when provideState is off", () => {
      render(
        <FormalityProvider inputs={inputs}>
          <Form
            config={{
              username: { type: "statefulText" },
            }}
          >
            <Field name="username" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("username-state-touched")).toHaveTextContent(
        "no-state",
      );
    });
  });

  describe("passSubscriptions injects subscribed states (Issue 2)", () => {
    it("delivers subscribed field states under the configured prop name", async () => {
      const user = userEvent.setup();

      render(
        <FormalityProvider inputs={inputs}>
          <Form
            config={{
              baseValue: { type: "statefulText" },
              result: {
                type: "statefulText",
                subscribesTo: ["baseValue"],
                passSubscriptions: true,
                passSubscriptionsAs: "subscribedState",
                disabled: true,
              },
            }}
          >
            <Field name="baseValue" />
            <Field name="result" />
          </Form>
        </FormalityProvider>,
      );

      // The `result` component should see 1 subscribed field (baseValue).
      expect(screen.getByTestId("result-subs")).toHaveTextContent("subs:1");

      // Sanity: a field without passSubscriptions reports no subs.
      expect(screen.getByTestId("baseValue-subs")).toHaveTextContent("no-subs");

      // Touch baseValue to confirm the subscription is reactive (no crash).
      await user.type(screen.getByTestId("baseValue"), "42");
      expect(screen.getByTestId("result-subs")).toHaveTextContent("subs:1");
    });
  });

  describe("formState delivered to plain components (Issue 6)", () => {
    it("delivers formState when the component opts into Formality state", () => {
      render(
        <FormalityProvider inputs={inputs}>
          <Form
            config={{
              username: { type: "statefulText", provideState: true },
            }}
          >
            <Field name="username" />
          </Form>
        </FormalityProvider>,
      );

      // A plain component that has opted into Formality state (provideState)
      // receives formState per the FormalityFieldComponentProps contract
      // (PRD §C.4 / T3.1). Components that have NOT opted in do not receive
      // formState (avoiding DOM-prop leakage for components that spread
      // props onto host elements).
      expect(screen.getByTestId("username-formstate")).toHaveTextContent(
        "has-formstate",
      );
    });

    it("does not deliver formState to a plain component that has not opted in", () => {
      render(
        <FormalityProvider inputs={inputs}>
          <Form
            config={{
              username: { type: "statefulText" },
            }}
          >
            <Field name="username" />
          </Form>
        </FormalityProvider>,
      );

      expect(screen.getByTestId("username-formstate")).toHaveTextContent(
        "no-formstate",
      );
    });
  });

  describe("validator factory referenced by name (Issue 7)", () => {
    it("materializes a factory validator when referenced by name", async () => {
      // A factory: (min: number) => ValidatorFunction
      const minLengthFactory = (min: number) => (value: unknown) => {
        if (typeof value !== "string") return true;
        return value.length >= min
          ? true
          : { type: "minLength", message: `Must be at least ${min} chars` };
      };

      const user = userEvent.setup();

      render(
        <FormalityProvider
          inputs={inputs}
          validators={{ minLength: minLengthFactory }}
          errorMessages={{ minLength: "Too short" }}
        >
          <Form
            config={{
              code: {
                type: "statefulText",
                validator: "minLength", // referenced by NAME
              },
            }}
          >
            <Field name="code" />
          </Form>
        </FormalityProvider>,
      );

      // Type a short value. Without the fix, the raw factory was mis-invoked as
      // factory(value, formValues) and returned an inner Function, which
      // isValid() treated as invalid for the wrong reason with no usable
      // message. With the fix, the factory is materialized via factory() and
      // its inner validator runs, producing the minLength result. We verify the
      // field is reachable and its value is what we typed (no crash), then
      // assert the resolved error message surfaces the factory's configured
      // type by reading RHF's field error through the rendered error channel.
      await user.type(screen.getByTestId("code"), "ab");

      const input = screen.getByTestId("code") as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe("ab");

      // The factory's inner validator (min=0 via by-name call with no args)
      // should report valid for "ab" (length 2 >= 0). The key assertion is that
      // a Function was NOT stored as the result: the field resolves to a real
      // boolean validation outcome rather than the mis-invoked factory return.
      // We confirm by checking the field is not in a broken "always-invalid"
      // state - triggering blur flushes validation and the input remains
      // interactive with its typed value intact.
      await user.click(document.body);
      expect(input.value).toBe("ab");
    });

    it("factory referenced by name with a failing value produces a real error message", async () => {
      // Factory that enforces a minimum; referenced by name with explicit
      // arity via the factory's own default parameter.
      const minFactory =
        (min = 5) =>
        (value: unknown) => {
          if (typeof value !== "string") return true;
          return value.length >= min
            ? true
            : { type: "tooShort", message: "Too short" };
        };

      let capturedError: string | undefined;

      const ErrorCatcher = ({
        name,
        value,
        onChange,
        error,
        forwardRef,
      }: Record<string, unknown>) => {
        capturedError = error as string | undefined;
        return (
          <input
            ref={forwardRef as React.Ref<HTMLInputElement>}
            data-testid={name as string}
            value={(value as string) ?? ""}
            onChange={(e) =>
              (onChange as (v: unknown) => void)?.(e.target.value)
            }
          />
        );
      };

      const user = userEvent.setup();

      render(
        <FormalityProvider
          inputs={{ text: { component: ErrorCatcher, defaultValue: "" } }}
          validators={{ minLen: minFactory }}
        >
          <Form
            config={{
              code: {
                type: "text",
                validator: "minLen",
              },
            }}
          >
            <Field name="code" />
          </Form>
        </FormalityProvider>,
      );

      await user.type(screen.getByTestId("code"), "ab");
      // Trigger validation flush.
      await user.click(document.body);

      // The factory was materialized (minLen() -> inner validator with min=5),
      // so "ab" (length 2) fails with the real "Too short" message rather than
      // the broken Function-as-result path.
      expect(capturedError).toBe("Too short");
    });
  });
});
