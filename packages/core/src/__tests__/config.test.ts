import { describe, it, expect } from "vitest";
import {
  deepMerge,
  mergeInputConfigs,
  resolveInputConfig,
  resolveFieldType,
  mergeStaticProps,
  mergeFieldProps,
  mergeConfigs,
  createConfigContext,
  resolveInitialValue,
  resolveAllInitialValues,
  isEmptyValue,
  getInputDefaultValue,
  mergeRecordWithDefaults,
} from "../index";
import { resolveFieldOverType } from "../config/defaults";
import type {
  InputConfig,
  FieldConfig,
  FormConfig,
  FormalityProviderConfig,
} from "../index";

describe("Config Module", () => {
  describe("resolveFieldOverType", () => {
    it("returns the field value when it is not undefined (override wins)", () => {
      expect(resolveFieldOverType("field", "type")).toBe("field");
    });

    it("returns the type value when field is undefined (fallback)", () => {
      expect(resolveFieldOverType(undefined, "type")).toBe("type");
    });

    it("returns undefined when both are undefined", () => {
      expect(resolveFieldOverType(undefined, undefined)).toBeUndefined();
    });

    it("treats null as a meaningful override (§6.4.5)", () => {
      expect(resolveFieldOverType(null, "type")).toBeNull();
    });

    it("treats false as a meaningful override (§6.4.5)", () => {
      expect(resolveFieldOverType(false, true)).toBe(false);
    });

    it("treats 0 as a meaningful override (§6.4.5)", () => {
      expect(resolveFieldOverType(0, 100)).toBe(0);
    });

    it('treats "" as a meaningful override (§6.4.5)', () => {
      expect(resolveFieldOverType("", "fallback")).toBe("");
    });

    it("passes through a type-level null when field is undefined", () => {
      expect(resolveFieldOverType(undefined, null)).toBeNull();
    });

    it("preserves type inference over the generic (number | false)", () => {
      // Mirrors a debounce-shaped call site (§6.4.0): field false wins over type 500.
      const d: number | false | undefined = resolveFieldOverType(false, 500);
      expect(d).toBe(false);
    });
  });

  describe("deepMerge", () => {
    it("should merge flat objects", () => {
      const base = { a: 1, b: 2 };
      const override = { b: 3, c: 4 };

      expect(deepMerge(base, override)).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("should merge nested objects", () => {
      const base = { a: 1, nested: { x: 1, y: 2 } };
      const override = { nested: { y: 3, z: 4 } };

      expect(deepMerge(base, override)).toEqual({
        a: 1,
        nested: { x: 1, y: 3, z: 4 },
      });
    });

    it("should override arrays (not merge)", () => {
      const base = { items: [1, 2, 3] };
      const override = { items: [4, 5] };

      expect(deepMerge(base, override)).toEqual({ items: [4, 5] });
    });

    it("should handle undefined override", () => {
      const base = { a: 1 };
      expect(deepMerge(base, undefined)).toBe(base);
    });

    it("should skip undefined values in override", () => {
      const base = { a: 1, b: 2 };
      const override = { a: undefined, b: 3 };

      expect(deepMerge(base, override as any)).toEqual({ a: 1, b: 3 });
    });
  });

  describe("mergeInputConfigs", () => {
    const providerInputs: Record<string, InputConfig> = {
      textField: {
        component: "TextField",
        defaultValue: "",
        debounce: 300,
      } as InputConfig,
      switch: {
        component: "Switch",
        defaultValue: false,
      } as InputConfig,
    };

    it("should return provider inputs when no form inputs", () => {
      expect(mergeInputConfigs(providerInputs, undefined)).toBe(providerInputs);
    });

    it("should merge object-form form inputs", () => {
      const formInputs = {
        textField: { debounce: 500 },
      };

      const merged = mergeInputConfigs(providerInputs, formInputs);

      expect(merged.textField.debounce).toBe(500);
      expect(merged.textField.defaultValue).toBe("");
    });

    it("should handle function-form form inputs", () => {
      const formInputs = (allInputs: Record<string, InputConfig>) => ({
        textField: { debounce: (allInputs.textField?.debounce as number) * 2 },
      });

      const merged = mergeInputConfigs(providerInputs, formInputs);

      expect(merged.textField.debounce).toBe(600);
    });

    // --- Coverage backfill (PRD §6.1) ---
    // C2: new-key arm (object-form form inputs introducing a NEW type)
    it("should add a new input type introduced by form inputs", () => {
      const merged = mergeInputConfigs(providerInputs, {
        custom: { component: "Custom", defaultValue: "" },
      } as any);

      expect(merged.custom).toEqual({
        component: "Custom",
        defaultValue: "",
      });
    });
  });

  describe("resolveInputConfig", () => {
    const inputs: Record<string, InputConfig> = {
      textField: { component: "TextField", defaultValue: "" } as InputConfig,
      switch: { component: "Switch", defaultValue: false } as InputConfig,
    };

    it("should resolve existing type", () => {
      expect(resolveInputConfig("textField", inputs)).toBe(inputs.textField);
      expect(resolveInputConfig("switch", inputs)).toBe(inputs.switch);
    });

    it("should fallback to default type", () => {
      expect(resolveInputConfig("nonExistent", inputs)).toBe(inputs.textField);
    });

    it("should return undefined if default not found", () => {
      expect(
        resolveInputConfig("nonExistent", {}, "alsoNonExistent"),
      ).toBeUndefined();
    });
  });

  describe("resolveFieldType", () => {
    it("should prefer component prop", () => {
      expect(resolveFieldType("componentType", { type: "configType" })).toBe(
        "componentType",
      );
    });

    it("should use field config type", () => {
      expect(resolveFieldType(undefined, { type: "configType" })).toBe(
        "configType",
      );
    });

    it("should fallback to default", () => {
      expect(resolveFieldType(undefined, {})).toBe("textField");
      expect(resolveFieldType(undefined, undefined, "custom")).toBe("custom");
    });
  });

  describe("mergeStaticProps", () => {
    it("should merge layers in order", () => {
      const merged = mergeStaticProps(
        { a: 1, b: 2 },
        { b: 3, c: 4 },
        { c: 5, d: 6 },
      );

      expect(merged).toEqual({ a: 1, b: 3, c: 5, d: 6 });
    });

    it("should skip undefined layers", () => {
      const merged = mergeStaticProps({ a: 1 }, undefined, { b: 2 });
      expect(merged).toEqual({ a: 1, b: 2 });
    });
  });

  describe("mergeFieldProps", () => {
    it("should merge all prop layers", () => {
      const merged = mergeFieldProps({
        providerDefaultFieldProps: { size: "small" },
        providerSelectDefaultFieldProps: { variant: "outlined" },
        formDefaultFieldProps: { margin: "dense" },
        inputProps: { type: "text" },
        fieldConfigProps: { required: true },
        selectProps: { disabled: false },
        componentProps: { className: "custom" },
        coreProps: { name: "myField", value: "test" },
      });

      expect(merged).toEqual({
        size: "small",
        variant: "outlined",
        margin: "dense",
        type: "text",
        required: true,
        disabled: false,
        className: "custom",
        name: "myField",
        value: "test",
      });
    });

    it("should let later layers override earlier", () => {
      const merged = mergeFieldProps({
        providerDefaultFieldProps: { disabled: true },
        selectProps: { disabled: false },
      });

      expect(merged.disabled).toBe(false);
    });
  });

  // --- PRD §1.3.2 headline export: mergeConfigs() ---
  // Thin composition wrapper over mergeInputConfigs / resolveFieldType /
  // resolveInputConfig / mergeStaticProps. Static-only (no FormState).
  describe("mergeConfigs", () => {
    it("resolves an inputConfig from provider inputs (provider-only)", () => {
      const provider: FormalityProviderConfig = {
        inputs: {
          textField: { component: null, defaultValue: "" } as InputConfig,
        },
      };

      const { inputConfig } = mergeConfigs(provider);

      // No form override → identity to the registered textField input.
      expect(inputConfig).toBe(provider.inputs.textField);
    });

    it("merges form.inputs overrides over provider.inputs (provider+form)", () => {
      const provider: FormalityProviderConfig = {
        inputs: {
          textField: { component: null, defaultValue: "" } as InputConfig,
        },
      };
      const form: FormConfig = {
        inputs: { textField: { defaultValue: "default" } },
      };

      const { inputConfig } = mergeConfigs(provider, form);

      expect(inputConfig?.defaultValue).toBe("default");
      // component preserved from provider (not overridden by form).
      expect(inputConfig?.component).toBeNull();
    });

    it("resolves the inputConfig for the field's type (provider+form+field)", () => {
      const provider: FormalityProviderConfig = {
        inputs: {
          textField: { component: null, defaultValue: "" } as InputConfig,
          switch: { component: null, defaultValue: false } as InputConfig,
        },
      };
      const field: FieldConfig = { type: "switch" };

      const { inputConfig } = mergeConfigs(provider, undefined, field);

      // resolveFieldType(undefined, field) === "switch" → resolveInputConfig picks it.
      expect(inputConfig).toBe(provider.inputs.switch);
    });

    it("falls back to textField when field.type is unregistered", () => {
      const provider: FormalityProviderConfig = {
        inputs: {
          textField: { component: null, defaultValue: "" } as InputConfig,
        },
      };
      const field: FieldConfig = { type: "nope" };

      const { inputConfig } = mergeConfigs(provider, undefined, field);

      // resolveInputConfig(type="nope", ...) → inputs["nope"] ?? inputs["textField"].
      expect(inputConfig).toBe(provider.inputs.textField);
    });

    it("merges static field-config props in priority order (override priority)", () => {
      const provider: FormalityProviderConfig = {
        inputs: {
          textField: { component: null, defaultValue: "" } as InputConfig,
        },
        defaultFieldProps: { disabled: true, label: "P" },
      };
      const form: FormConfig = {
        defaultFieldProps: { disabled: false }, // form beats provider
      };
      const field: FieldConfig = {
        props: { label: "F" }, // field beats both
      };

      const { fieldConfig } = mergeConfigs(provider, form, field);

      // disabled: form's false wins over provider's true; label: field's "F" wins.
      expect(fieldConfig.props).toEqual({ disabled: false, label: "F" });
    });

    it("preserves the field's own config fields (type, label, ...)", () => {
      const provider: FormalityProviderConfig = {
        inputs: {
          textField: { component: null, defaultValue: "" } as InputConfig,
        },
      };
      const field: FieldConfig = { type: "switch", label: "On" };

      const { fieldConfig } = mergeConfigs(provider, undefined, field);

      // Spread preserves the field's own config; only .props is the merged result.
      expect(fieldConfig.type).toBe("switch");
      expect(fieldConfig.label).toBe("On");
    });

    it("returns undefined inputConfig when the type is unregistered and no textField default", () => {
      const provider: FormalityProviderConfig = {
        inputs: {
          other: { component: null, defaultValue: "" } as InputConfig,
        },
      };
      // No field.type and no textField registered → resolveInputConfig returns undefined.
      const { inputConfig } = mergeConfigs(provider);

      expect(inputConfig).toBeUndefined();
    });
  });

  // --- Coverage backfill (PRD §6.1) ---
  // C1: createConfigContext full shape (was 0% function coverage)
  describe("createConfigContext", () => {
    it("merges provider and form config into a context", () => {
      const provider: FormalityProviderConfig = {
        inputs: {
          textField: { component: "T", defaultValue: "" },
        } as any,
        formatters: { f: () => "x" },
        defaultFieldProps: { size: "small" },
        selectDefaultFieldProps: { label: "props.name" },
      };

      const ctx = createConfigContext(provider, {
        defaultFieldProps: { margin: "dense" },
        selectDefaultFieldProps: { placeholder: "p" },
      } as any);

      expect(ctx.defaultFieldProps).toEqual({
        size: "small",
        margin: "dense",
      });
      // Form-level selectDefaultFieldProps takes precedence over provider's
      expect(ctx.selectDefaultFieldProps).toEqual({ placeholder: "p" });
      expect(ctx.formatters.f("y")).toBe("x");
      // Missing optional collections default to {}
      expect(ctx.parsers).toEqual({});
      expect(ctx.validators).toEqual({});
      expect(ctx.errorMessages).toEqual({});
      expect(ctx.inputs.textField).toBeDefined();
    });

    it("merges form inputs into provider inputs", () => {
      const provider: FormalityProviderConfig = {
        inputs: {
          textField: { component: "T", defaultValue: "" },
        } as any,
      };

      const ctx = createConfigContext(provider, {
        inputs: { custom: { component: "C", defaultValue: "" } },
      } as any);

      expect(ctx.inputs.textField).toBeDefined();
      expect(ctx.inputs.custom).toBeDefined();
    });

    it("falls back to provider selectDefaultFieldProps when form omits it", () => {
      const provider: FormalityProviderConfig = {
        inputs: {} as any,
        selectDefaultFieldProps: { label: "props.name" },
      };

      const ctx = createConfigContext(provider);

      expect(ctx.selectDefaultFieldProps).toEqual({ label: "props.name" });
      // Both defaultFieldProps layers omitted → {}
      expect(ctx.defaultFieldProps).toEqual({});
    });

    it("uses empty defaults when provider omits optional collections", () => {
      const provider: FormalityProviderConfig = {
        inputs: {} as any,
      };

      const ctx = createConfigContext(provider);

      expect(ctx.formatters).toEqual({});
      expect(ctx.parsers).toEqual({});
      expect(ctx.validators).toEqual({});
      expect(ctx.errorMessages).toEqual({});
      expect(ctx.defaultFieldProps).toEqual({});
      expect(ctx.selectDefaultFieldProps).toBeUndefined();
    });
  });

  describe("Initial Value Resolution", () => {
    describe("resolveInitialValue", () => {
      it("should use defaultValues first", () => {
        expect(
          resolveInitialValue(
            "client",
            {},
            { defaultValue: "input default" } as InputConfig,
            { client: "record value" },
            { client: "default value" },
          ),
        ).toBe("default value");
      });

      it("should use record value with recordKey", () => {
        expect(
          resolveInitialValue(
            "client",
            { recordKey: "selectedClient" },
            { defaultValue: "input default" } as InputConfig,
            { selectedClient: "mapped value" },
          ),
        ).toBe("mapped value");
      });

      it("should use record value by field name", () => {
        expect(
          resolveInitialValue(
            "client",
            {},
            { defaultValue: "input default" } as InputConfig,
            { client: "record value" },
          ),
        ).toBe("record value");
      });

      it("should use input default value", () => {
        expect(
          resolveInitialValue("client", {}, {
            defaultValue: "input default",
          } as InputConfig),
        ).toBe("input default");
      });

      it("should return undefined when no value found", () => {
        expect(resolveInitialValue("client", {}, undefined)).toBeUndefined();
      });

      it("uses field-level defaultValue over the input-type default (Priority 3)", () => {
        expect(
          resolveInitialValue(
            "active",
            { type: "switch", defaultValue: true },
            { defaultValue: false } as InputConfig,
          ),
        ).toBe(true);
      });

      it("honors a null field-level default over the type default (§6.4.5)", () => {
        expect(
          resolveInitialValue(
            "note",
            { type: "textField", defaultValue: null },
            { defaultValue: "fallback" } as InputConfig,
          ),
        ).toBeNull();
      });

      it("honors a false field-level default (§6.4.5)", () => {
        expect(
          resolveInitialValue("flag", { type: "switch", defaultValue: false }, {
            defaultValue: true,
          } as InputConfig),
        ).toBe(false);
      });

      it('honors a "" field-level default (§6.4.5)', () => {
        expect(
          resolveInitialValue("code", { type: "textField", defaultValue: "" }, {
            defaultValue: "typeDefault",
          } as InputConfig),
        ).toBe("");
      });

      it("falls through to the input-type default when fieldConfig.defaultValue is undefined", () => {
        expect(
          resolveInitialValue("name", { type: "textField" }, {
            defaultValue: "typeDefault",
          } as InputConfig),
        ).toBe("typeDefault");
      });

      it("still lets the record beat the field-level default (Priority 2 > 3)", () => {
        expect(
          resolveInitialValue(
            "active",
            { type: "switch", defaultValue: true },
            { defaultValue: false } as InputConfig,
            { active: false },
          ),
        ).toBe(false);
      });

      it("still lets defaultValues prop beat the field-level default (Priority 1 > 3)", () => {
        expect(
          resolveInitialValue(
            "active",
            { type: "switch", defaultValue: true },
            { defaultValue: false } as InputConfig,
            undefined,
            { active: "fromProp" },
          ),
        ).toBe("fromProp");
      });
    });

    describe("resolveAllInitialValues", () => {
      const inputs: Record<string, InputConfig> = {
        textField: { component: null, defaultValue: "" } as InputConfig,
        switch: { component: null, defaultValue: false } as InputConfig,
      };

      const fieldConfigs: Record<string, FieldConfig> = {
        name: { type: "textField" },
        active: { type: "switch" },
      };

      it("should resolve values for all fields", () => {
        const values = resolveAllInitialValues(fieldConfigs, inputs, {
          name: "John",
        });

        expect(values).toEqual({
          name: "John",
          active: false, // from input default
        });
      });

      it("should include extra default values", () => {
        const values = resolveAllInitialValues(
          fieldConfigs,
          inputs,
          {},
          { extra: "value" },
        );

        expect(values.extra).toBe("value");
      });

      it("picks up field-level defaultValue via resolveInitialValue delegation", () => {
        const inputs = {
          switch: { component: null, defaultValue: false } as InputConfig,
        };
        const fieldConfigs = {
          active: { type: "switch", defaultValue: true },
          paused: { type: "switch" },
        };
        const values = resolveAllInitialValues(fieldConfigs, inputs);
        expect(values.active).toBe(true); // field-level default
        expect(values.paused).toBe(false); // type-level default
      });
    });

    describe("isEmptyValue", () => {
      it("should detect empty values", () => {
        expect(isEmptyValue(undefined)).toBe(true);
        expect(isEmptyValue(null)).toBe(true);
        expect(isEmptyValue("")).toBe(true);
        expect(isEmptyValue([])).toBe(true);
      });

      it("should not flag non-empty values", () => {
        expect(isEmptyValue(0)).toBe(false);
        expect(isEmptyValue(false)).toBe(false);
        expect(isEmptyValue("value")).toBe(false);
        expect(isEmptyValue([1])).toBe(false);
      });
    });

    describe("getInputDefaultValue", () => {
      it("should use explicit default", () => {
        expect(
          getInputDefaultValue({
            component: null,
            defaultValue: "explicit",
          } as InputConfig),
        ).toBe("explicit");
      });

      it("should infer from type name", () => {
        expect(getInputDefaultValue(undefined, "switch")).toBe(false);
        expect(getInputDefaultValue(undefined, "checkbox")).toBe(false);
        expect(getInputDefaultValue(undefined, "number")).toBe(0);
        expect(getInputDefaultValue(undefined, "autocomplete")).toBe(null);
        expect(getInputDefaultValue(undefined, "multiSelect")).toEqual([]);
        expect(getInputDefaultValue(undefined, "textField")).toBe("");
      });
    });

    describe("mergeRecordWithDefaults", () => {
      it("should merge record over defaults", () => {
        const defaults = { a: 1, b: 2 };
        const record = { b: 3, c: 4 };

        expect(mergeRecordWithDefaults(record, defaults)).toEqual({
          a: 1,
          b: 3,
          c: 4,
        });
      });

      it("should preserve intentional nulls in record", () => {
        const defaults = { value: "default" };
        const record = { value: null };

        expect(mergeRecordWithDefaults(record, defaults)).toEqual({
          value: null,
        });
      });
    });
  });
});
