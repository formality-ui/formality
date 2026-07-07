// @formality-ui/react - Field subscription-stability regression test
//
// End-to-end guard for the "Maximum update depth exceeded" loop reported at the
// consuming app's ?detail=order screen. A field with a `when`/`truthy` condition
// (here `password`, watching `ein`) must NOT tear down and re-run its
// subscription effect when the *watched* field's VALUE changes — only when the
// inferred subscription set changes. Changing a value is not a subscription
// change, so additional keystrokes after mount must produce zero subscription
// churn and never trip React's max-depth guard.
//
// Root cause this pins: useInferredInputs returned a new array reference every
// render, which made Field.allSubscriptions bust every render, which made
// useSubscriptions' effect (deps include `subscriptions`) re-run every render —
// calling addSubscription/removeSubscription (setState via setWatchers) inside
// the effect. Before the fix this test logs dozens of subscription warnings for
// a few keystrokes; after the fix it logs only the single mount-time setup.
import type React from "react";
import { forwardRef } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig } from "@formality-ui/core";

interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  forwardRef?: React.Ref<HTMLInputElement>;
  [k: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, name, forwardRef, ...rest }, _ref) => (
    <input
      ref={forwardRef}
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...rest}
    />
  ),
);
TestInput.displayName = "TestInput";

const inputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
};

const config = {
  ein: { type: "textField" },
  password: {
    type: "textField",
    conditions: [{ when: "ein", truthy: true, disabled: true }],
  },
} as const;

const SUBSCRIPTION_LOG = /\[Formality Subscription\]/;
const MAX_DEPTH = /maximum update depth/i;

describe("Field subscription stability across value changes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("typing into a watched field does not churn subscriptions or hit max update depth", async () => {
    const user = userEvent.setup();

    const warns: string[] = [];
    const errs: string[] = [];
    vi.spyOn(console, "warn").mockImplementation((...a: unknown[]) => {
      warns.push(a.map(String).join(" "));
    });
    vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => {
      errs.push(a.map(String).join(" "));
    });

    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config}>
          <Field name="ein" />
          <Field name="password" />
        </Form>
      </FormalityProvider>,
    );

    // Let the mount-time registration cascade (Field registers → Form state →
    // context recompute) and its effects fully settle before we start
    // measuring. We measure only churn caused by value changes.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const baseline = warns.filter((m) => SUBSCRIPTION_LOG.test(m)).length;
    expect(baseline).toBeGreaterThan(0); // sanity: mount registered a watcher

    // Mutate the watched field's value several times.
    await user.type(screen.getByTestId("ein"), "12-3456789");

    const churn = warns.filter((m) => SUBSCRIPTION_LOG.test(m)).length - baseline;

    // 1. No "Maximum update depth exceeded" anywhere.
    const maxDepthHits =
      errs.filter((m) => MAX_DEPTH.test(m)).length +
      warns.filter((m) => MAX_DEPTH.test(m)).length;
    expect(maxDepthHits).toBe(0);

    // 2. Changing a value is not a subscription change: the subscription
    //    effect must not re-run on subsequent keystrokes. With the fix this is
    //    0; before the fix every keystroke re-ran the effect for every field
    //    (dozens of warnings for a few keystrokes).
    expect(churn).toBe(0);
  });
});
