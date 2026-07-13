// @formality-ui/react - useField Hook Tests
import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useField } from "../hooks/useField";
import type { UseFieldParams } from "../hooks/useField";

describe("useField (stub — gap_analysis G6)", () => {
  it("throws until extraction in P2.M1.T1.S2", () => {
    const params = { name: "email" } as UseFieldParams;
    expect(() => renderHook(() => useField(params))).toThrow(
      /not implemented/i,
    );
  });
});
