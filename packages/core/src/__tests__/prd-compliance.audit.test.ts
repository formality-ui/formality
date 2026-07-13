// @formality-ui/core — PRD Compliance Audit Gate
//
// Executable, regression-proof re-assertion of every in-scope PRD section
// (§3 types, §5 Expression, §8 Conditions, §9 core context contribution,
// §10 Validation, §11 Transform, §14 Initial Value, §15 Ordering, §16 Labels).
//
// This is a SECOND line of defense over the per-module test files
// (expression.test.ts, conditions.test.ts, validation.test.ts, transform.test.ts,
// config.test.ts, labels.test.ts). The redundancy is intentional: it makes the
// PRD §1.3.2 contract executable in ONE place and survives per-module test
// refactors. Do NOT delete the per-module tests — they hold the deep coverage.
//
// References:
//  - PRD §1.3.2 "What Belongs in @formality-ui/core" (API-surface table)
//  - PRD §10.7  "Parser/Formatter Contract" (the inverse-contract mandate)
//  - plan/005_8f88e0ec4482/P3M1T1S1/research/audit-findings.md (field guide)
//
// All imports go through the public barrel (`../index`) — check (a) is partly
// "is this reachable from the public surface?".

import { describe, it, expect, vi } from "vitest";
import * as Core from "../index";
import {
  // Expression
  evaluate,
  buildEvaluationContext,
  createFieldStateProxy,
  // Conditions
  evaluateConditions,
  // Validation
  validate,
  resolveErrorMessage,
  // Transform
  parse,
  format,
  extractValueField,
  transformFieldName,
  createFloatParser,
  createFloatFormatter,
  createDefaultParsers,
  createDefaultFormatters,
  // Config / defaults
  resolveInitialValue,
  // Ordering
  sortFieldsByOrder,
  getUnusedFields,
  getOrderedUnusedFields,
  // Labels
  resolveLabel,
  humanizeLabel,
} from "../index";

// ============================================================================
// PRD §1.3.2 API SURFACE
// ============================================================================
// Check (a): every required §1.3.2 "Key Exports" entry (and its documented
// companions surfaced on the core barrel) is reachable from the public surface
// and is a function. A non-function / missing export here is a §1.3.2 violation.
describe("PRD §1.3.2 API surface (check a — exports exist & are functions)", () => {
  const REQUIRED_FUNCTIONS: Array<keyof typeof Core> = [
    // expression/evaluate + companions
    "evaluate",
    "evaluateDescriptor",
    "inferFieldsFromDescriptor",
    "buildEvaluationContext",
    "buildFormContext",
    "buildFieldContext",
    "createFieldStateProxy",
    // expression/companions (proxy helpers)
    // (isFieldProxy / unwrapFieldProxy / clearExpressionCache also exported)
    // conditions/evaluate + companions
    "evaluateConditions",
    "conditionMatches",
    "mergeConditionResults",
    "inferFieldsFromConditions",
    // validation/validate + messages
    "validate",
    "runValidator",
    "runValidatorSync",
    "isValid",
    "composeValidators",
    "resolveErrorMessage",
    // transform/pipeline
    "parse",
    "format",
    "extractValueField",
    "transformFieldName",
    // config/merge + defaults
    "mergeConfigs",
    "resolveInputConfig",
    "resolveInitialValue",
    "resolveAllInitialValues",
    // ordering
    "sortFieldsByOrder",
    "getUnusedFields",
    "getOrderedUnusedFields",
    // labels/resolve
    "resolveLabel",
    "humanizeLabel",
    "resolveFormTitle",
  ];

  it.each(REQUIRED_FUNCTIONS)(
    "%s is exported from the core barrel as a function",
    (name) => {
      expect(typeof Core[name]).toBe("function");
    },
  );
});

// ============================================================================
// PRD §5 Expression Engine
// ============================================================================
describe("PRD §5 Expression Engine", () => {
  it("resolves an unqualified field path to the field value (via proxy)", () => {
    const fieldValues = { client: { id: 5 } };
    const context = buildEvaluationContext(fieldValues, {}, {}, {});
    // Unqualified access proxies to the field value.
    expect(evaluate("client", context)).toEqual({ id: 5 });
    expect(evaluate("client.id", context)).toBe(5);
  });

  it("keeps qualified record.* paths literal (dual context, PRD §5.4.1)", () => {
    const fieldValues = { count: 42 };
    const record = { name: "Acme Corp" };
    const context = buildEvaluationContext(fieldValues, record, {}, {});
    // record.* is literal; fields.* / unqualified proxy to field value.
    expect(evaluate("record.name", context)).toBe("Acme Corp");
    expect(evaluate("count", context)).toBe(42);
  });

  it("exposes field metadata via the field-state proxy (isTouched)", () => {
    const proxy = createFieldStateProxy({
      value: "Acme",
      isTouched: true,
      isDirty: false,
    });
    // The proxy coerces to the raw value and exposes state props.
    expect(proxy.isTouched).toBe(true);
    expect(proxy.isDirty).toBe(false);
  });
});

// ============================================================================
// PRD §8 Conditions (OR disabled / AND visible / last-wins set)
// ============================================================================
describe("PRD §8 Conditions", () => {
  it("disabled uses OR logic (any matching true → true)", () => {
    const result = evaluateConditions({
      conditions: [
        { when: "a", is: 1, disabled: true },
        { when: "b", is: 2, disabled: false },
      ],
      fieldValues: { a: 1, b: 2 },
    });
    expect(result.disabled).toBe(true);
    expect(result.hasDisabledCondition).toBe(true);
  });

  it("visible uses AND logic (any matching false → false)", () => {
    const result = evaluateConditions({
      conditions: [
        { when: "a", is: 1, visible: true },
        { when: "b", is: 2, visible: false },
      ],
      fieldValues: { a: 1, b: 2 },
    });
    expect(result.visible).toBe(false);
    expect(result.hasVisibleCondition).toBe(true);
  });

  it("setValue: last matching condition wins", () => {
    const result = evaluateConditions({
      conditions: [
        { when: "a", is: 1, set: "first" },
        { when: "a", is: 1, set: "second" },
      ],
      fieldValues: { a: 1 },
    });
    expect(result.setValue).toBe("second");
    expect(result.hasSetCondition).toBe(true);
  });
});

// ============================================================================
// PRD §10 Validation (RULES-layer primitives — core scope)
// ============================================================================
// NOTE: §10.9.1's 4-layer composition (RHF rules → field → type → form) is the
// React Field Controller's job (validate.ts JSDoc states this explicitly) and
// is audited in P3.M1.T1.S2. Core ships ONLY the RULES-layer primitives.
describe("PRD §10 Validation (RULES-layer primitives)", () => {
  it("named validator resolves via the validators registry", async () => {
    const result = await validate("", "required", { required: Core.required });
    expect(Core.isValid(result)).toBe(false);
  });

  it("factory referenced by name materializes into a validator", async () => {
    // PRD §10.2: when a validator is referenced by name AND it is a factory
    // (a function that, probed with the validator call signature, returns a
    // function), core materializes the inner validator by calling the factory
    // with no arguments. Here the factory (no args) yields a validator that
    // always rejects — proving the factory-by-name path ran the materialized
    // validator, not the factory directly.
    const alwaysReject = () => () => ({ type: "rejected", message: "no" });
    const result = await validate("anything", "alwaysReject", {
      alwaysReject,
    });
    expect(Core.isValid(result)).toBe(false);
  });

  it("array spec short-circuits on the first failure", async () => {
    const result = await validate("", ["required", "minLength"], {
      required: Core.required,
      minLength: (n: number) => Core.minLength(n),
    });
    expect(Core.isValid(result)).toBe(false);
  });

  it("resolveErrorMessage table maps each ValidationResult shape", () => {
    expect(resolveErrorMessage(false)).toBe("Invalid value");
    expect(resolveErrorMessage("Custom error")).toBe("Custom error");
    expect(
      resolveErrorMessage({ type: "required" }, { required: "Need it" }),
    ).toBe("Need it");
    expect(resolveErrorMessage(true)).toBeUndefined();
    expect(resolveErrorMessage(undefined)).toBeUndefined();
  });
});

// ============================================================================
// PRD §11 Transform Pipeline + §10.7 Parser/Formatter Inverse Contract
// ============================================================================
describe("PRD §11 Transform Pipeline", () => {
  it("parse applies a named/inline parser; format applies a named/inline formatter", () => {
    expect(parse("42.69", createFloatParser())).toBe(42.69);
    expect(format(42.69, createFloatFormatter(2))).toBe("42.69");
  });

  it("extractValueField extracts the id for submit (PRD §11.10.3)", () => {
    expect(extractValueField({ id: 5, name: "Acme" }, "id")).toBe(5);
    // Non-object value passes through unchanged.
    expect(extractValueField("simple", "id")).toBe("simple");
  });

  it("transformFieldName renames a field for submit", () => {
    expect(transformFieldName("client", (n) => `${n}Id`)).toBe("clientId");
    // No transform fn → original name.
    expect(transformFieldName("status")).toBe("status");
  });
});

// ----------------------------------------------------------------------------
// THE GAP FIX — PRD §10.7 Parser/Formatter Inverse Contract
// ----------------------------------------------------------------------------
// PRD §10.7 mandates: "Parsers and formatters MUST be inverses of each other.
// Test all parser/formatter pairs with real data to ensure no precision loss."
//
// Before this audit, NO test in packages/core/src/__tests__/ verified
// parse(format(value)) === value. This block closes that coverage gap using
// MATCHING-precision pairs, and documents the precision-mismatch (truncation)
// case (the PRD §10.7 "Invalid" example) as the consumer's responsibility
// (G9 deferral: named formatters float2/float3/float4 are the accepted
// equivalent to an explicit InputConfig.precision field).
describe("PRD §10.7 Parser/Formatter Inverse Contract", () => {
  it("float parser/formatter round-trip at precision 2 (both directions)", () => {
    const p = createFloatParser();
    const f = createFloatFormatter(2);
    const v = 42.69;
    // parse(format(v)) === v
    expect(parse(format(v, f), p)).toBe(v);
    // format(parse(s)) === s
    expect(format(parse("42.69", p), f)).toBe("42.69");
  });

  it("float3 and float4 precision pairs round-trip", () => {
    for (const prec of [3, 4]) {
      const f = createFloatFormatter(prec);
      const p = createFloatParser();
      // e.g. 42.699 (prec 3) / 42.6999 (prec 4)
      const v = Number(`42.6${"9".repeat(prec - 1)}`);
      // parse(format(v)) === v (within float tolerance at this precision)
      expect(parse(format(v, f), p)).toBeCloseTo(v, prec);
    }
  });

  it("default parsers/formatters round-trip via named 'float' pair", () => {
    const ps = createDefaultParsers();
    const fs = createDefaultFormatters();
    // Default 'float' formatter is precision 2; parser is fallback-0 float.
    expect(parse(format(42.5, fs.float), ps.float)).toBe(42.5);
  });

  it("documents precision-mismatch truncation as the consumer's job (PRD §10.7 Invalid)", () => {
    // A precision-2 formatter truncates a 3-place value. This is BY DESIGN
    // (the documented §10.7 "Invalid" example), NOT a contract violation.
    // A consumer wanting 3-place fidelity must use float3 (G9 deferral).
    const f2 = createFloatFormatter(2);
    expect(format(42.691, f2)).toBe("42.69"); // truncated, by design
    // And re-parsing the truncated form yields the truncated value, not the
    // original — which is exactly the precision-loss the PRD warns about.
    expect(parse(format(42.691, f2), createFloatParser())).toBe(42.69);
  });
});

// ============================================================================
// PRD §14 Initial Value Resolution
// ============================================================================
describe("PRD §14 Initial Value Resolution", () => {
  const inputConfig = { defaultValue: "fallback" };

  it("priority: defaultValues > record[recordKey] > inputConfig.defaultValue", () => {
    const record = { status: "fromRecord" };
    const defaultValues = { status: "fromDefaults" };
    // All three present → defaultValues wins.
    expect(
      resolveInitialValue("status", {}, inputConfig, record, defaultValues),
    ).toBe("fromDefaults");
    // Drop defaultValues → record wins.
    expect(resolveInitialValue("status", {}, inputConfig, record, {})).toBe(
      "fromRecord",
    );
    // Drop record → inputConfig.defaultValue wins.
    expect(resolveInitialValue("status", {}, inputConfig, {}, {})).toBe(
      "fallback",
    );
  });

  it("recordKey maps the record key to the field name", () => {
    expect(
      resolveInitialValue(
        "client",
        { recordKey: "clientId" },
        {},
        { clientId: 5 },
        {},
      ),
    ).toBe(5);
  });
});

// ============================================================================
// PRD §15 Field Ordering
// ============================================================================
describe("PRD §15 Field Ordering", () => {
  it("sortFieldsByOrder orders by the order prop; undefined order sorts last (Infinity)", () => {
    const names = ["c", "a", "b", "d"];
    const configs = {
      a: { order: 1 },
      b: { order: 2 },
      c: { order: 3 },
      d: {}, // no order → Infinity → last
    };
    expect(sortFieldsByOrder(names, configs)).toEqual(["a", "b", "c", "d"]);
  });

  it("getUnusedFields excludes the declared set", () => {
    const all = ["a", "b", "c", "d"];
    const declared = new Set(["a", "c"]);
    expect(getUnusedFields(all, declared)).toEqual(["b", "d"]);
  });

  it("getOrderedUnusedFields composes both (excludes + orders)", () => {
    const all = ["c", "a", "b", "d"];
    const declared = new Set(["a"]);
    const configs = {
      a: { order: 1 },
      b: { order: 2 },
      c: { order: 3 },
      d: {},
    };
    expect(getOrderedUnusedFields(all, declared, configs)).toEqual([
      "b",
      "c",
      "d",
    ]);
  });
});

// ============================================================================
// PRD §16 Label Resolution (6-source priority chain)
// ============================================================================
describe("PRD §16 Label Resolution", () => {
  const baseFieldConfig = {
    label: "Field Label",
    title: "Field Title",
    props: { label: "Props Label" },
  };

  it("6-source priority: componentProps.label > fieldConfig.props.label > evaluatedSelectProps.label > fieldConfig.label > fieldConfig.title > humanize", () => {
    // 1. componentProps.label wins over everything.
    expect(
      resolveLabel(
        "camelCase",
        baseFieldConfig,
        { label: "Select Label" },
        { label: "Component Label" },
      ),
    ).toBe("Component Label");

    // 2. fieldConfig.props.label wins below componentProps.
    expect(
      resolveLabel("camelCase", baseFieldConfig, { label: "Select Label" }, {}),
    ).toBe("Props Label");

    // 3. evaluatedSelectProps.label wins below props.label.
    expect(
      resolveLabel(
        "camelCase",
        { ...baseFieldConfig, props: {} },
        { label: "Select Label" },
        {},
      ),
    ).toBe("Select Label");

    // 4. fieldConfig.label wins below selectProps.label.
    expect(
      resolveLabel("camelCase", { ...baseFieldConfig, props: {} }, {}, {}),
    ).toBe("Field Label");

    // 5. fieldConfig.title (legacy alias) wins below label.
    expect(resolveLabel("camelCase", { title: "Field Title" }, {}, {})).toBe(
      "Field Title",
    );

    // 6. humanizeLabel(fieldName) is the final fallback.
    expect(resolveLabel("clientContact", {}, {}, {})).toBe("Client Contact");
  });

  it("humanizeLabel converts camelCase to space-separated words", () => {
    expect(humanizeLabel("clientContact")).toBe("Client Contact");
    expect(humanizeLabel("firstName")).toBe("First Name");
  });
});
