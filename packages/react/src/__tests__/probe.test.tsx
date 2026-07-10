import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FieldGroup } from "../components/FieldGroup";
import { FormalityProvider } from "../components/FormalityProvider";
import { humanizeLabel, evaluate, evaluateConditions } from "@formality-ui/core";

const Input = ({ value, onChange, label, disabled, forwardRef, ...p }: any) => (
  <div>
    {label && <label htmlFor={p.name}>{label}</label>}
    <input
      ref={forwardRef}
      id={p.name}
      data-testid={p.name}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  </div>
);

const Switch = ({ value, onChange, forwardRef, ...p }: any) => (
  <input
    ref={forwardRef}
    type="checkbox"
    data-testid={p.name}
    checked={value ?? false}
    onChange={(e) => onChange(e.target.checked)}
  />
);

const inputs = {
  textField: { component: Input, defaultValue: "" },
  switch: { component: Switch, defaultValue: false },
  autocomplete: { component: Input, defaultValue: null, valueField: "id", getSubmitField: (k: string) => `${k}Id` },
};

describe("PROBE: recordKey mapping", () => {
  it("recordKey should map API field name to form field name", () => {
    const config = {
      clientContact: { type: "textField", recordKey: "clientContactId" },
    } as any;
    const record = { clientContactId: "From API" };
    let watched: any;
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config} record={record}>
          {({ methods }) => {
            watched = methods.getValues();
            return (
              <span data-testid="val">{String(methods.getValues("clientContact"))}</span>
            );
          }}
        </Form>
      </FormalityProvider>,
    );
    const el = screen.getByTestId("val");
    console.log("PROBE recordKey value:", JSON.stringify(el.textContent));
    console.log("PROBE recordKey all values:", JSON.stringify(watched));
  });
  it("STRING selectSet works (contrast)", async () => {
    const config = {
      a: { type: "textField" },
      b: { type: "textField" },
      sum: {
        type: "textField",
        disabled: true,
        conditions: [{ selectWhen: "a && b", selectSet: "a + b" }],
      },
    } as any;
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config}>
          <Field name="a" />
          <Field name="b" />
          <Field name="sum" />
          {({ methods }: any) => <span data-testid="sum">{String(methods.watch("sum"))}</span>}
        </Form>
      </FormalityProvider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByTestId("a"), "Hello ");
    await user.type(screen.getByTestId("b"), "World");
    await waitFor(() => {
      console.log("PROBE STRING selectSet sum:", JSON.stringify(screen.getByTestId("sum").textContent));
    });
  });
});

describe("PROBE: humanizeLabel", () => {
  it("check HTMLParser and ID cases", () => {
    console.log("HTMLParser ->", JSON.stringify(humanizeLabel("HTMLParser")));
    console.log("userID ->", JSON.stringify(humanizeLabel("userID")));
    console.log("minGrossMarginPercent ->", JSON.stringify(humanizeLabel("minGrossMarginPercent")));
  });
});

describe("PROBE: selectTitle resolution", () => {
  it("resolves selectTitle from record", () => {
    const config = { name: { type: "textField" } } as any;
    render(
      <FormalityProvider inputs={inputs}>
        <Form
          config={config}
          record={{ name: "x", clientName: "Acme Corp" } as any}
          formConfig={{ selectTitle: "record.clientName", title: "Static" } as any}
        >
          {({ resolvedTitle }) => (
            <span data-testid="title">{String(resolvedTitle)}</span>
          )}
        </Form>
      </FormalityProvider>,
    );
    console.log("PROBE selectTitle:", JSON.stringify(screen.getByTestId("title").textContent));
  });
});

describe("PROBE: render API handleSubmit + transform", () => {
  it("render-API handleSubmit transforms valueField + getSubmitField", async () => {
    const onSubmit = vi.fn();
    const config = {
      client: { type: "autocomplete" },
    } as any;
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config} onSubmit={onSubmit} record={{ client: { id: 5, name: "Acme" } } as any}>
          {({ handleSubmit }) => (
            <form onSubmit={handleSubmit(onSubmit as any)}>
              <Field name="client" />
              <button type="submit" data-testid="submit">Go</button>
            </form>
          )}
        </Form>
      </FormalityProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId("submit"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    console.log("PROBE render handleSubmit transform:", JSON.stringify(onSubmit.mock.calls[0]?.[0]));
  });
});

describe("PROBE: condition selectSet function", () => {
  it("function-based selectSet with subscribesTo", async () => {
    const config = {
      a: { type: "textField" },
      b: { type: "textField" },
      sum: {
        type: "textField",
        disabled: true,
        subscribesTo: ["a", "b"],
        conditions: [
          {
            selectWhen: "a && b",
            selectSet: function selectSet(arg: any) {
              console.log("PROBE selectSet called with arg keys:", arg ? Object.keys(arg) : "NO ARG", "fields?", arg && typeof arg === "object" && "fields" in arg ? "present" : "MISSING");
              const f = arg && arg.fields;
              return (f?.a?.value || "") + (f?.b?.value || "");
            },
          },
        ],
      },
    } as any;
    render(
      <FormalityProvider inputs={inputs}>
        <Form config={config}>
          <Field name="a" />
          <Field name="b" />
          <Field name="sum" />
          {({ methods }: any) => <span data-testid="sum">{String(methods.watch("sum"))}</span>}
        </Form>
      </FormalityProvider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByTestId("a"), "Hello ");
    await user.type(screen.getByTestId("b"), "World");
    await waitFor(() => {
      console.log("PROBE selectSet function sum:", JSON.stringify(screen.getByTestId("sum").textContent));
    });
  });
});

describe("PROBE: evaluate arithmetic with null", () => {
  it("null operands", () => {
    console.log("null + 5 ->", JSON.stringify(evaluate("a + b", { a: null, b: 5 })));
    console.log("undefined + 5 ->", JSON.stringify(evaluate("a + b", { a: undefined, b: 5 })));
    console.log("'5' + 3 ->", JSON.stringify(evaluate("a + b", { a: "5", b: 3 })));
    console.log("5 < 3 ->", JSON.stringify(evaluate("a < b", { a: 5, b: 3 })));
  });
});
