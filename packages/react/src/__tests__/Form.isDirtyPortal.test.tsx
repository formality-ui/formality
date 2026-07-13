// @formality-ui/react - isDirty false-positive regression (portal/StrictMode)
//
// Reproduces the bug documented in ISDIRITY_PORTAL_BUG.md: when a <Form> mounts
// inside a DEFERRED portal (MUI <Dialog>/<Portal>, or any faithful sim) under
// React.StrictMode, `formState.isDirty` was spuriously `true` on open whenever a
// rendered <Field> existed for a config field ABSENT from the record.
//
// Root cause: Formality fed RHF a resolved `defaultValues` but the RAW `record`
// as `values`. The `values`-prop effect rebuilt _defaultValues from the raw
// record (dropping absent config keys); then, under the deferred-portal +
// StrictMode lifecycle, the remounted Controller re-registered the absent field
// and wrote `<field>: undefined` into _formValues — a key _defaultValues lacked.
// RHF's `deepEqual` short-circuits on `Object.keys(a).length !==
// Object.keys(b).length`, so the key-set divergence made `isDirty = true` even
// though nothing was edited (and `dirtyFields` stayed `{}`).
//
// This test uses the library's own <Form>/<Field> + FormalityProvider, wraps in
// React.StrictMode, and mounts through a deferred-portal simulation (the same
// shape real MUI Portal uses: `useState(null)` + `useLayoutEffect` set +
// `createPortal`). It asserts the settled `isDirty` is `false` and that
// `_formValues`/`_defaultValues` share the same key set — i.e. the fix (a
// comprehensive baseline passed as BOTH defaultValues and values) holds
// regardless of Controller registration timing.

import React, { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Form } from "../components/Form";
import { Field } from "../components/Field";
import { FormalityProvider } from "../components/FormalityProvider";
import type { InputConfig } from "@formality-ui/core";

// Minimal input: a text field with defaultValue "" (resolves even when absent
// from record). Re-declared here so the test is self-contained.
const TestInput = ({
  value,
  onChange,
  disabled,
  name,
  forwardRef,
}: {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  forwardRef?: React.Ref<HTMLInputElement>;
}) => (
  <input
    ref={forwardRef}
    data-testid={name}
    value={value ?? ""}
    onChange={(e) => onChange?.(e.target.value)}
    disabled={disabled}
  />
);
TestInput.displayName = "TestInput";

const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput as any, defaultValue: "" },
};

// A type with NO defaultValue. Used to prove the §E.1 safety loop
// (Object.keys(config) ensures every configured field key is present in the
// baseline even when it resolves to undefined).
const NoDefaultInput = ({
  value,
  onChange,
  name,
  forwardRef,
}: {
  value?: any;
  onChange?: (value: any) => void;
  name: string;
  forwardRef?: React.Ref<HTMLInputElement>;
}) => (
  <input
    ref={forwardRef}
    data-testid={name}
    value={value ?? ""}
    onChange={(e) => onChange?.(e.target.value)}
  />
);
NoDefaultInput.displayName = "NoDefaultInput";

const noDefaultInputs: Record<string, InputConfig> = {
  rawText: { component: NoDefaultInput as any },
};

// Faithful deferred-portal sim (functionally identical to MUI <Portal> v9):
// container is null on the first render, set in a layout effect, and only then
// do children portal-mount. This is the timing that lets Controller
// (re)registration land AFTER the `values`-prop effect's _reset.
function DeferredPortal({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = useState<Element | null>(null);
  useLayoutEffect(() => {
    setContainer(document.body);
  }, []);
  return container ? createPortal(children, container) : null;
}

// undefined-aware key dump (JSON.stringify drops undefined-valued keys, which is
// what made the divergence invisible to earlier investigation).
const dumpKeys = (o: any) =>
  `{${Object.keys(o ?? {})
    .sort()
    .join(",")}}`;

function Probe({
  record,
  config,
  inputs,
  children,
}: {
  record: Record<string, unknown>;
  config: Record<string, any>;
  inputs: Record<string, InputConfig>;
  children: React.ReactNode;
}) {
  return (
    <FormalityProvider inputs={inputs}>
      <Form config={config as any} record={record as any} mode="onTouched">
        {({ formState, methods }: any) => {
          const control = methods.control;
          return (
            <div>
              {children}
              <span data-testid="isDirty">{String(formState.isDirty)}</span>
              <span data-testid="fvKeys">{dumpKeys(control._formValues)}</span>
              <span data-testid="dvKeys">{dumpKeys(control._defaultValues)}</span>
            </div>
          );
        }}
      </Form>
    </FormalityProvider>
  );
}

describe("Form isDirty — deferred-portal + StrictMode regression", () => {
  it("isDirty is false on open when a config field is absent from the record (textField default)", async () => {
    // `extra` is in config but absent from record. Both Fields render.
    render(
      <React.StrictMode>
        <DeferredPortal>
          <Probe
            record={{ name: "Original" }}
            config={{ name: { type: "textField" }, extra: { type: "textField" } }}
            inputs={testInputs}
          >
            <Field name="name" />
            <Field name="extra" />
          </Probe>
        </DeferredPortal>
      </React.StrictMode>,
    );

    const g = (k: string) => screen.getByTestId(k).textContent;
    await waitFor(() => {
      expect(g("isDirty")).toBe("false");
    });
    // The invariant the fix enforces: _formValues and _defaultValues share the
    // same key set, so RHF's deepEqual key-count check passes.
    expect(g("fvKeys")).toBe(g("dvKeys"));
    expect(g("fvKeys")).toBe("{extra,name}");
  });

  it("isDirty is false for a custom input type with NO defaultValue (§E.1 safety loop)", async () => {
    // `rawText` has no defaultValue; without the safety loop it would be absent
    // from the resolved baseline AND (under portal+StrictMode) re-introduced by
    // Controller registration as a stray undefined key.
    render(
      <React.StrictMode>
        <DeferredPortal>
          <Probe
            record={{ name: "Original" }}
            config={{ name: { type: "textField" }, extra: { type: "rawText" } }}
            inputs={{ ...testInputs, ...noDefaultInputs }}
          >
            <Field name="name" />
            <Field name="extra" />
          </Probe>
        </DeferredPortal>
      </React.StrictMode>,
    );

    const g = (k: string) => screen.getByTestId(k).textContent;
    await waitFor(() => {
      expect(g("isDirty")).toBe("false");
    });
    expect(g("fvKeys")).toBe(g("dvKeys"));
    expect(g("fvKeys")).toBe("{extra,name}");
  });

  it("record passthrough keys (not in config) are preserved in _formValues", async () => {
    // `passthrough` is in record but NOT in config — it must survive into the
    // form values (this is what a previous reverted `values: defaultValues`
    // attempt broke). The comprehensive baseline unions {...record, ...resolved}.
    render(
      <React.StrictMode>
        <DeferredPortal>
          <Probe
            record={{ name: "Original", passthrough: "keep-me" }}
            config={{ name: { type: "textField" }, extra: { type: "textField" } }}
            inputs={testInputs}
          >
            <Field name="name" />
            <Field name="extra" />
          </Probe>
        </DeferredPortal>
      </React.StrictMode>,
    );

    const g = (k: string) => screen.getByTestId(k).textContent;
    await waitFor(() => {
      expect(g("isDirty")).toBe("false");
    });
    // passthrough key present in both, alongside all config keys.
    expect(g("fvKeys")).toBe(g("dvKeys"));
    expect(g("fvKeys")).toBe("{extra,name,passthrough}");
  });

  it("a genuine edit DOES mark the form dirty (fix does not neuter isDirty)", async () => {
    // Sanity: the fix must not make isDirty always-false. Editing a field must
    // still flip it true.
    const { rerender } = render(
      <React.StrictMode>
        <DeferredPortal>
          <Probe
            record={{ name: "Original" }}
            config={{ name: { type: "textField" }, extra: { type: "textField" } }}
            inputs={testInputs}
          >
            <Field name="name" />
            <Field name="extra" />
          </Probe>
        </DeferredPortal>
      </React.StrictMode>,
    );

    const g = (k: string) => screen.getByTestId(k).textContent;
    await waitFor(() => expect(g("isDirty")).toBe("false"));

    // Edit the name field.
    const nameInput = screen.getByTestId("name") as HTMLInputElement;
    nameInput.focus();
    // Use the native input setter + event so RHF registers the change.
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(nameInput, "Edited");
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));

    await waitFor(() => expect(g("isDirty")).toBe("true"));
    // keep the linter happy about rerender being used if added later
    void rerender;
  });
});
