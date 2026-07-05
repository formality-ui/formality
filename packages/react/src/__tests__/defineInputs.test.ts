// @formality-ui/react - defineInputs runtime tests (PRD §C.4 / T2.2)
import { describe, it, expect } from "vitest";
import { defineInputs } from "../overlays";
import type { ComponentType } from "react";

// A minimal stand-in component so the ReactInputConfig constraint is satisfied.
const Stub: ComponentType<any> = () => null;

describe("defineInputs", () => {
  it("returns its input referentially unchanged (identity)", () => {
    const inputs = {
      textField: { component: Stub, defaultValue: "" },
      switch: { component: Stub, defaultValue: false },
    };
    // SAME reference, not a clone.
    expect(defineInputs(inputs)).toBe(inputs);
  });

  it("preserves all keys and values", () => {
    const inputs = {
      textField: { component: Stub, defaultValue: "" },
      switch: { component: Stub, defaultValue: false },
    };
    const result = defineInputs(inputs);
    expect(Object.keys(result).sort()).toEqual(["switch", "textField"]);
    expect(result.textField).toBe(inputs.textField);
    expect(result.switch).toBe(inputs.switch);
  });

  it("handles an empty record", () => {
    const empty = defineInputs({});
    expect(empty).toEqual({});
  });
});
