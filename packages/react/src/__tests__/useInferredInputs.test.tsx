// @formality-ui/react - useInferredInputs Hook Tests
//
// Regression guard for the "Maximum update depth exceeded" loop caused by an
// unstable return value. The hook infers which fields a Field should subscribe
// to; its result feeds Field.allSubscriptions, which is a dependency of
// useSubscriptions' useEffect. If this hook returns a NEW array reference on
// every render, that effect tears down + re-runs every render, calling
// addSubscription/removeSubscription (which setState via setWatchers) inside
// the effect — the textbook trigger for React's max-depth error.
//
// These tests assert the returned array is referentially stable across renders
// when the inferred content has not changed, including when callers pass
// `undefined` or freshly-allocated (but content-identical) inputs.
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInferredInputs } from "../hooks/useInferredInputs";
import type { ConditionDescriptor } from "@formality-ui/core";

describe("useInferredInputs", () => {
  describe("correctness", () => {
    it("returns no subscriptions when given no sources", () => {
      const { result } = renderHook(() => useInferredInputs({}));
      expect(result.current).toEqual([]);
    });

    it("infers explicit subscribesTo", () => {
      const { result } = renderHook(() =>
        useInferredInputs({ subscribesTo: ["fieldA", "fieldB"] }),
      );
      expect(result.current).toEqual(["fieldA", "fieldB"]);
    });

    it("deduplicates inferred sources", () => {
      const conditions: ConditionDescriptor[] = [
        { when: "signed", disabled: true },
      ];
      const { result } = renderHook(() =>
        useInferredInputs({
          subscribesTo: ["signed"],
          conditions,
        }),
      );
      expect(result.current).toEqual(["signed"]);
    });
  });

  describe("referential stability (regression: max-depth loop)", () => {
    it("returns the SAME array reference across rerenders when inputs are undefined", () => {
      const { result, rerender } = renderHook(() => useInferredInputs({}));

      const first = result.current;
      rerender();
      rerender();
      rerender();

      // Identity must be preserved: a new [] every render is what busts the
      // downstream useSubscriptions effect.
      expect(result.current).toBe(first);
    });

    it("stays stable when called with undefined conditions/subscribesTo (formerly defaulted to a fresh [])", () => {
      // Before the fix, `conditions = []` / `subscribesTo = []` defaults put a
      // fresh array in the useMemo deps every call → memo busted every render.
      const { result, rerender } = renderHook(() =>
        useInferredInputs({
          selectProps: undefined,
          conditions: undefined,
          subscribesTo: undefined,
        }),
      );

      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });

    it("stays stable when the caller passes a NEW inline subscribesTo array with identical content each render", () => {
      // The most insidious case: a consumer passes `subscribesTo={["client"]}`
      // inline in JSX, producing a new array reference per render. The hook
      // must NOT bust on reference change — only on content change.
      const { result, rerender } = renderHook(
        (props: { subs: string[] }) =>
          useInferredInputs({ subscribesTo: props.subs }),
        { initialProps: { subs: ["client"] } },
      );

      const first = result.current;
      rerender({ subs: ["client"] }); // new array, same content
      rerender({ subs: ["client"] });
      expect(result.current).toBe(first);
    });

    it("stays stable when the caller passes a NEW inline conditions array with identical content each render", () => {
      const makeConditions = (): ConditionDescriptor[] => [
        { when: "ein", truthy: false, hidden: true },
      ];
      const { result, rerender } = renderHook(
        (props: { conditions: ConditionDescriptor[] }) =>
          useInferredInputs({ conditions: props.conditions }),
        { initialProps: { conditions: makeConditions() } },
      );

      const first = result.current;
      rerender({ conditions: makeConditions() }); // new array, same content
      expect(result.current).toBe(first);
      expect(result.current).toEqual(["ein"]);
    });

    it("returns a NEW reference when the inferred content actually changes", () => {
      // Stability must not collapse real changes: a different target set must
      // produce a different array so downstream effects re-subscribe.
      const { result, rerender } = renderHook(
        (props: { subs: string[] }) =>
          useInferredInputs({ subscribesTo: props.subs }),
        { initialProps: { subs: ["client"] } },
      );

      const first = result.current;
      rerender({ subs: ["client", "contact"] });
      expect(result.current).not.toBe(first);
      expect(result.current).toEqual(["client", "contact"]);
    });
  });
});
