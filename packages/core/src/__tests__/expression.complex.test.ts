/**
 * @file packages/core/src/__tests__/expression.complex.test.ts
 * @description Complex expression evaluation tests for Formality
 *
 * Tests complex expressions with multiple operators, field references,
 * nested structures, and comprehensive error handling.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluate,
  evaluateDescriptor,
  clearExpressionCache,
  buildEvaluationContext,
} from "../expression";

describe("Complex Expression Evaluation", () => {
  beforeEach(() => {
    // CRITICAL: Clear cache to isolate tests
    clearExpressionCache();
  });

  describe("Complex Logical Expressions", () => {
    describe("AND Chains", () => {
      it("should short-circuit AND chain on first falsy", () => {
        let rightEvaluated = false;
        const context = {
          a: true,
          b: false,
          get c() {
            rightEvaluated = true;
            return true;
          },
        };

        const result = evaluate("a && b && c", context);
        expect(result).toBe(false);
        expect(rightEvaluated).toBe(false); // C was NOT evaluated
      });

      it("should return last truthy value in all-truthy AND chain", () => {
        const context = { a: 1, b: 2, c: 3 };
        expect(evaluate("a && b && c", context)).toBe(3);
      });

      it("should handle AND chain with field proxies", () => {
        const fields = {
          client: { value: "Acme" },
          signed: { value: true },
          count: { value: 5 },
        };
        const context = buildEvaluationContext(
          { client: fields.client.value, signed: fields.signed.value, count: fields.count.value },
          {},
          {},
          { client: fields.client, signed: fields.signed, count: fields.count }
        );

        const result = evaluate("client && signed && count > 0", context);
        expect(result).toBe(true);
      });

      it("should handle long AND chains", () => {
        const context = { a: true, b: true, c: true, d: true, e: true };
        expect(evaluate("a && b && c && d && e", context)).toBe(true);
      });

      it("should handle AND chain with mixed truthy values", () => {
        const context = { a: 1, b: "hello", c: true, d: [] };
        expect(evaluate("a && b && c && d", context)).toEqual([]);
      });
    });

    describe("OR Chains", () => {
      it("should short-circuit OR chain on first truthy", () => {
        let rightEvaluated = false;
        const context = {
          a: "value",
          get b() {
            rightEvaluated = true;
            return "other";
          },
        };

        const result = evaluate("a || b || c", context);
        expect(result).toBe("value");
        expect(rightEvaluated).toBe(false); // B was NOT evaluated
      });

      it("should return last falsy value in all-falsy OR chain", () => {
        const context = { a: false, b: 0, c: "" };
        expect(evaluate("a || b || c", context)).toBe("");
      });

      it("should handle OR chain with field proxies", () => {
        const fields = {
          primary: { value: null },
          secondary: { value: undefined },
          fallback: { value: "default" },
        };
        const context = buildEvaluationContext(
          { primary: fields.primary.value, secondary: fields.secondary.value, fallback: fields.fallback.value },
          {},
          {},
          { primary: fields.primary, secondary: fields.secondary, fallback: fields.fallback }
        );

        const result = evaluate("primary || secondary || fallback", context);
        expect(result).toBe("default");
      });

      it("should handle long OR chains", () => {
        const context = { a: false, b: 0, c: "", d: null, e: "value" };
        expect(evaluate("a || b || c || d || e", context)).toBe("value");
      });
    });

    describe("Nullish Coalescing", () => {
      it("should return first non-nullish value", () => {
        expect(evaluate("a ?? b ?? c", { a: null, b: undefined, c: "default" })).toBe("default");
        expect(evaluate("a ?? b ?? c", { a: 0, b: "", c: "default" })).toBe(0); // 0 is not nullish
        expect(evaluate("a ?? b ?? c", { a: false, b: "", c: "default" })).toBe(false); // false is not nullish
      });

      it("should handle nullish with field proxies", () => {
        const context = buildEvaluationContext(
          { required: null, optional: "value" },
          {},
          {},
          { required: { value: null }, optional: { value: "value" } }
        );

        expect(evaluate("required ?? optional", context)).toBe("value");
      });

      it("should distinguish nullish from falsy", () => {
        expect(evaluate("null ?? 0", {})).toBe(0);
        expect(evaluate("undefined ?? false", {})).toBe(false);
        expect(evaluate("0 ?? null", {})).toBe(0);
        expect(evaluate('"" ?? null', {})).toBe("");
        expect(evaluate("false ?? null", {})).toBe(false);
      });

      it("should handle long nullish chains", () => {
        expect(evaluate("a ?? b ?? c ?? d ?? e", { a: null, b: undefined, c: null, d: undefined, e: "final" })).toBe("final");
      });
    });

    describe("Mixed Logical Operators", () => {
      it("should handle AND with OR (a && b || c)", () => {
        const context = { a: true, b: false, c: true };
        expect(evaluate("a && b || c", context)).toBe(true); // (a && b) || c = c
        expect(evaluate("a && (b || c)", context)).toBe(true); // a && (b || c) = a && true
      });

      it("should handle nullish with logical operators", () => {
        expect(evaluate("a ?? b && c", { a: null, b: true, c: "value" })).toBe("value");
        // && has higher precedence than ??, so (a && b) ?? c
        expect(evaluate("a && b ?? c", { a: null, b: true, c: "default" })).toBe("default"); // (null && true) ?? "default" = null ?? "default" = "default"
      });

      it("should handle complex mixed expressions", () => {
        const context = { a: true, b: null, c: false, d: "result" };
        // (true && null) is null, which is nullish, so evaluate c (false)
        // null ?? false = false
        expect(evaluate("a && b ?? c || d", context)).toBe("result");
      });

      it("should handle precedence correctly", () => {
        // && has higher precedence than ||
        expect(evaluate("a || b && c", { a: false, b: true, c: "result" })).toBe("result"); // a || (b && c)
        expect(evaluate("a && b || c", { a: true, b: false, c: "result" })).toBe("result"); // (a && b) || c
      });
    });
  });

  describe("Nested Ternary Operators", () => {
    it("should evaluate basic nested ternary", () => {
      const context = { status: "pending" };
      const expr = 'status === "active" ? "Go" : status === "pending" ? "Wait" : "Stop"';
      expect(evaluate(expr, context)).toBe("Wait");
    });

    it("should handle right-associative ternary chains", () => {
      const context = { a: 1, b: 2, c: 3, d: 4 };
      // a ? b : c ? d : e is parsed as a ? b : (c ? d : e)
      expect(evaluate("a ? b : c ? d : e", context)).toBe(2); // a is truthy, return b
      expect(evaluate("false ? b : c ? d : e", { a: false, ...context })).toBe(4); // a falsy, c truthy, return d
    });

    it("should handle ternary with logical operators", () => {
      const context = { a: true, b: false, c: "yes", d: "no" };
      expect(evaluate("a && b ? c : d", context)).toBe("no"); // a && b = false
      expect(evaluate("a || b ? c : d", context)).toBe("yes"); // a || b = true
    });

    it("should handle ternary with field access", () => {
      const fields = {
        client: { value: { type: "Premium", name: "Acme" } },
        defaultType: { value: "Basic" },
      };
      const context = buildEvaluationContext(
        { client: fields.client.value, defaultType: fields.defaultType.value },
        {},
        {},
        { client: fields.client, defaultType: fields.defaultType }
      );

      const expr = 'client ? client.type + " - " + client.name : defaultType';
      expect(evaluate(expr, context)).toBe("Premium - Acme");
    });

    it("should handle ternary with arithmetic", () => {
      const context = { count: 3 };
      expect(evaluate("count > 5 ? count * 2 : count + 10", context)).toBe(13);
      expect(evaluate("count > 5 ? count * 2 : count + 10", { count: 10 })).toBe(20);
    });

    it("should handle complex expression from work item", () => {
      const fields = {
        count: { value: 10 },
        clientType: { value: "Premium" },
        clientName: { value: "Acme" },
      };
      const context = buildEvaluationContext(
        { count: fields.count.value, clientType: fields.clientType.value, clientName: fields.clientName.value },
        {},
        {},
        { count: fields.count, clientType: fields.clientType, clientName: fields.clientName }
      );

      // Work item example: 'fields.count > 5 ? "Many" : "Few"'
      expect(evaluate('count > 5 ? "Many" : "Few"', context)).toBe("Many");
      expect(evaluate('count > 5 ? "Many" : "Few"', { count: 3 })).toBe("Few");

      // Work item example: 'fields.clientType + " - " + fields.clientName'
      expect(evaluate('clientType + " - " + clientName', context)).toBe("Premium - Acme");
    });

    it("should handle deeply nested ternaries", () => {
      const context = { score: 85 };
      // grade >= 90 ? "A" : grade >= 80 ? "B" : grade >= 70 ? "C" : "F"
      const expr = 'score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "F"';
      expect(evaluate(expr, context)).toBe("B");
      expect(evaluate(expr, { score: 95 })).toBe("A");
      expect(evaluate(expr, { score: 75 })).toBe("C");
      expect(evaluate(expr, { score: 60 })).toBe("F");
    });

    it("should handle ternary with ternary in consequent", () => {
      const context = { a: true, b: false, c: 1, d: 2 };
      // a ? (b ? c : d) : e
      expect(evaluate("a ? b ? c : d : 0", context)).toBe(2);
      expect(evaluate("a ? b ? c : d : 0", { ...context, b: true })).toBe(1);
      expect(evaluate("a ? b ? c : d : 0", { ...context, a: false })).toBe(0);
    });
  });

  describe("Field Reference Patterns", () => {
    describe("Qualified Access (fields.*)", () => {
      it("should access simple field value", () => {
        const fields = { count: { value: 42 } };
        const context = buildEvaluationContext({ count: 42 }, {}, {}, { count: fields.count });

        expect(evaluate("fields.count.value", context)).toBe(42);
        // fields.count returns the FieldState object, not unwrapped
        expect(evaluate("fields.count", context)).toEqual({ value: 42 });
      });

      it("should access nested object properties", () => {
        const fields = {
          client: { value: { profile: { email: "test@example.com" } } },
        };
        const context = buildEvaluationContext(
          { client: fields.client.value },
          {},
          {},
          { client: fields.client }
        );

        // Need to use .value to access the actual value from FieldState
        expect(evaluate("fields.client.value.profile.email", context)).toBe("test@example.com");
        // Or use unqualified access (via proxy)
        expect(evaluate("client.profile.email", context)).toBe("test@example.com");
      });

      it("should access field metadata", () => {
        const fields = {
          client: { value: "Acme", isTouched: true, isDirty: false },
        };
        const context = buildEvaluationContext(
          { client: fields.client.value },
          {},
          {},
          { client: fields.client }
        );

        expect(evaluate("fields.client.isTouched", context)).toBe(true);
        expect(evaluate("fields.client.isDirty", context)).toBe(false);
        expect(evaluate("fields.client.value", context)).toBe("Acme");
      });

      it("should handle deep nesting", () => {
        const fields = {
          data: { value: { a: { b: { c: { d: "deep" } } } } },
        };
        const context = buildEvaluationContext(
          { data: fields.data.value },
          {},
          {},
          { data: fields.data }
        );

        // Need to use .value to access the actual value from FieldState
        expect(evaluate("fields.data.value.a.b.c.d", context)).toBe("deep");
        // Or use unqualified access (via proxy)
        expect(evaluate("data.a.b.c.d", context)).toBe("deep");
      });
    });

    describe("Unqualified Access (via Proxies)", () => {
      it("should access field value directly", () => {
        const fields = { count: { value: 42 } };
        const context = buildEvaluationContext({ count: 42 }, {}, {}, { count: fields.count });

        expect(evaluate("count", context)).toBe(42); // Proxy unwraps to value
      });

      it("should access nested properties on value", () => {
        const fields = {
          client: { value: { name: "Acme" } },
        };
        const context = buildEvaluationContext(
          { client: fields.client.value },
          {},
          {},
          { client: fields.client }
        );

        expect(evaluate("client.name", context)).toBe("Acme"); // Delegates to value.name
        expect(evaluate("client.value", context)).toEqual({ name: "Acme" }); // Proxy's .value returns the FieldState's value property
      });

      it("should access field metadata directly", () => {
        const fields = {
          client: { value: "Acme", isTouched: true },
        };
        const context = buildEvaluationContext(
          { client: fields.client.value },
          {},
          {},
          { client: fields.client }
        );

        expect(evaluate("client.isTouched", context)).toBe(true); // Returns metadata
        expect(evaluate("client", context)).toBe("Acme"); // Returns value when coerced
      });

      it("should handle null field values with metadata access", () => {
        const fields = {
          client: { value: null, isTouched: true, isDirty: false },
        };
        const context = buildEvaluationContext(
          { client: fields.client.value },
          {},
          {},
          { client: fields.client }
        );

        expect(evaluate("client.isTouched", context)).toBe(true);
        expect(evaluate("client", context)).toBe(null);
      });
    });

    describe("Bracket Notation", () => {
      it("should access property with string literal", () => {
        const fields = { client: { value: { name: "Acme" } } };
        const context = buildEvaluationContext(
          { client: fields.client.value },
          {},
          {},
          { client: fields.client }
        );

        // Use unqualified access (client) which uses a proxy
        expect(evaluate('client["name"]', context)).toBe("Acme");
        // Or use qualified with .value
        expect(evaluate('fields.client.value["name"]', context)).toBe("Acme");
      });

      it("should access property with variable", () => {
        const fields = {
          client: { value: { name: "Acme", type: "Premium" } },
          prop: { value: "name" },
        };
        const context = buildEvaluationContext(
          { client: fields.client.value, prop: fields.prop.value },
          {},
          {},
          { client: fields.client, prop: fields.prop }
        );

        // Use unqualified access (client) which uses a proxy
        expect(evaluate("client[prop]", context)).toBe("Acme");
      });

      it("should handle computed property names", () => {
        const fields = {
          items: { value: { first: "a", second: "b" } },
          prefix: { value: "fir" },
          suffix: { value: "st" },
        };
        const context = buildEvaluationContext(
          { items: fields.items.value, prefix: fields.prefix.value, suffix: fields.suffix.value },
          {},
          {},
          { items: fields.items, prefix: fields.prefix, suffix: fields.suffix }
        );

        expect(evaluate("items[prefix + suffix]", context)).toBe("a");
      });

      it("should handle bracket notation with numbers", () => {
        const context = { obj: { 1: "one", 2: "two" }, key: 1 };
        expect(evaluate("obj[1]", context)).toBe("one");
        expect(evaluate("obj[key]", context)).toBe("one");
        expect(evaluate("obj['1']", context)).toBe("one");
      });

      it("should handle nested bracket notation", () => {
        const fields = {
          data: { value: { items: { 0: "first", 1: "second" } } },
          idx: { value: 1 },
        };
        const context = buildEvaluationContext(
          { data: fields.data.value, idx: fields.idx.value },
          {},
          {},
          { data: fields.data, idx: fields.idx }
        );

        expect(evaluate("data.items[idx]", context)).toBe("second");
        expect(evaluate("data['items'][0]", context)).toBe("first");
      });
    });

    describe("Array Access", () => {
      it("should access array elements", () => {
        const fields = {
          items: { value: ["a", "b", "c"] },
        };
        const context = buildEvaluationContext(
          { items: fields.items.value },
          {},
          {},
          { items: fields.items }
        );

        expect(evaluate("items[0]", context)).toBe("a");
        expect(evaluate("items[1]", context)).toBe("b");
        expect(evaluate("items[2]", context)).toBe("c");
      });

      it("should return undefined for out-of-bounds access", () => {
        const fields = {
          items: { value: ["a", "b"] },
        };
        const context = buildEvaluationContext(
          { items: fields.items.value },
          {},
          {},
          { items: fields.items }
        );

        expect(evaluate("items[5]", context)).toBeUndefined();
        expect(evaluate("items[-1]", context)).toBeUndefined();
      });

      it("should handle array access with variables", () => {
        const fields = {
          items: { value: ["a", "b", "c"] },
          index: { value: 1 },
        };
        const context = buildEvaluationContext(
          { items: fields.items.value, index: fields.index.value },
          {},
          {},
          { items: fields.items, index: fields.index }
        );

        expect(evaluate("items[index]", context)).toBe("b");
      });
    });

    describe("Work Item Examples", () => {
      it("should evaluate '!fields.signed && fields.count > 0'", () => {
        const fields = {
          signed: { value: false },
          count: { value: 5 },
        };
        const context = buildEvaluationContext(
          { signed: fields.signed.value, count: fields.count.value },
          {},
          {},
          { signed: fields.signed, count: fields.count }
        );

        expect(evaluate("!signed && count > 0", context)).toBe(true);
        expect(evaluate("!signed && count > 0", { signed: true, count: 5 })).toBe(false);
        expect(evaluate("!signed && count > 0", { signed: false, count: 0 })).toBe(false);
      });

      it("should evaluate 'fields.count > 5 ? \"Many\" : \"Few\"'", () => {
        const fields = { count: { value: 10 } };
        const context = buildEvaluationContext(
          { count: fields.count.value },
          {},
          {},
          { count: fields.count }
        );

        expect(evaluate('count > 5 ? "Many" : "Few"', context)).toBe("Many");
        expect(evaluate('count > 5 ? "Many" : "Few"', { count: 3 })).toBe("Few");
      });

      it("should evaluate 'fields.clientType + \" - \" + fields.clientName'", () => {
        const fields = {
          clientType: { value: "Premium" },
          clientName: { value: "Acme" },
        };
        const context = buildEvaluationContext(
          { clientType: fields.clientType.value, clientName: fields.clientName.value },
          {},
          {},
          { clientType: fields.clientType, clientName: fields.clientName }
        );

        expect(evaluate('clientType + " - " + clientName', context)).toBe("Premium - Acme");
      });
    });
  });

  describe("Arithmetic and String Operations", () => {
    it("should handle string concatenation", () => {
      const fields = {
        firstName: { value: "John" },
        lastName: { value: "Doe" },
      };
      const context = buildEvaluationContext(
        { firstName: fields.firstName.value, lastName: fields.lastName.value },
        {},
        {},
        { firstName: fields.firstName, lastName: fields.lastName }
      );

      expect(evaluate('firstName + " " + lastName', context)).toBe("John Doe");
    });

    it("should handle mixed arithmetic", () => {
      const context = { a: 10, b: 3, c: 2 };
      expect(evaluate("a * b + c", context)).toBe(32); // (10 * 3) + 2
      expect(evaluate("a / b - c", context)).toBeCloseTo(1.33, 1);
      expect(evaluate("a % b + c", context)).toBe(3); // (10 % 3) + 2
    });

    it("should handle comparison chains", () => {
      const context = { count: 50 };
      expect(evaluate("count >= 0 && count <= 100", context)).toBe(true);
      expect(evaluate("count >= 0 && count <= 100", { count: 150 })).toBe(false);
      expect(evaluate("count >= 0 && count <= 100", { count: -10 })).toBe(false);
    });

    it("should handle arithmetic in ternary", () => {
      const context = { count: 3 };
      expect(evaluate("count > 5 ? count * 2 : count + 10", context)).toBe(13);
      expect(evaluate("count > 5 ? count * 2 : count + 10", { count: 10 })).toBe(20);
    });

    it("should handle complex expressions", () => {
      const fields = {
        a: { value: "A" },
        b: { value: "B" },
        c: { value: "C" },
      };
      const context = buildEvaluationContext(
        { a: fields.a.value, b: fields.b.value, c: fields.c.value },
        {},
        {},
        { a: fields.a, b: fields.b, c: fields.c }
      );

      expect(evaluate('a + "-" + b + "-" + c', context)).toBe("A-B-C");
    });

    it("should handle unary operators with arithmetic", () => {
      const context = { a: 5 };
      expect(evaluate("-a + 10", context)).toBe(5);
      expect(evaluate("+a - 3", context)).toBe(2);
      expect(evaluate("a * -2", context)).toBe(-10);
    });

    it("should handle division by zero", () => {
      expect(evaluate("1 / 0", {})).toBeUndefined();
      expect(evaluate("0 / 0", {})).toBeUndefined();
      expect(evaluate("10 / 0", {})).toBeUndefined();
    });

    it("should handle string coercion in arithmetic", () => {
      expect(evaluate('"5" * 2', {})).toBeUndefined();
      expect(evaluate('"10" - 3', {})).toBeUndefined();
      expect(evaluate('"3.5" / 2', {})).toBeUndefined();
    });

    it("should handle modulo operation", () => {
      expect(evaluate("10 % 3", {})).toBe(1);
      expect(evaluate("15 % 4", {})).toBe(3);
      expect(evaluate("7 % 2", {})).toBe(1);
    });
  });

  describe("Operator Precedence", () => {
    it("should handle logical vs comparison precedence (a && b > c)", () => {
      const context = { a: true, b: 5, c: 3 };
      expect(evaluate("a && b > c", context)).toBe(true); // a && (b > c) = true && true
      expect(evaluate("a && b > c", { a: true, b: 2, c: 3 })).toBe(false); // true && false
    });

    it("should handle comparison vs arithmetic precedence (a + b > c * d)", () => {
      const context = { a: 5, b: 3, c: 2, d: 4 };
      // (5 + 3) > (2 * 4) = 8 > 8 = false
      expect(evaluate("a + b > c * d", context)).toBe(false);
      expect(evaluate("a + b > c * d", { ...context, a: 6 })).toBe(true); // 9 > 8
    });

    it("should handle ternary vs logical precedence (a || b ? c : d)", () => {
      const context = { a: false, b: true, c: "yes", d: "no" };
      // (a || b) ? c : d = true ? c : d = "yes"
      expect(evaluate("a || b ? c : d", context)).toBe("yes");
      expect(evaluate("a || b ? c : d", { a: false, b: false, c: "yes", d: "no" })).toBe("no");
    });

    it("should handle unary operator precedence (!a && b, -a + b)", () => {
      const context = { a: true, b: true };
      expect(evaluate("!a && b", context)).toBe(false); // (!a) && b = false && true
      expect(evaluate("!a && b", { a: false, b: true })).toBe(true); // true && true

      const ctx2 = { a: 5, b: 3 };
      expect(evaluate("-a + b", ctx2)).toBe(-2); // (-a) + b = -5 + 3
      expect(evaluate("-(a + b)", ctx2)).toBe(-8); // parentheses change precedence
    });

    it("should handle parentheses override", () => {
      const context = { a: 2, b: 3, c: 4 };
      expect(evaluate("(a + b) * c", context)).toBe(20); // (2 + 3) * 4 = 20
      expect(evaluate("a + b * c", context)).toBe(14); // 2 + (3 * 4) = 14

      expect(evaluate("(a && b) || c", { a: true, b: false, c: true })).toBe(true);
      expect(evaluate("a && (b || c)", { a: true, b: false, c: true })).toBe(true);
    });

    it("should handle complex precedence chains", () => {
      const context = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      // 1 + 2 > 3 && 4 < 5 = 3 > 3 && true = false && true = false
      expect(evaluate("a + b > c && d < e", context)).toBe(false);

      // 1 * 2 + 3 * 4 = 2 + 12 = 14
      expect(evaluate("a * b + c * d", context)).toBe(14);
    });

    it("should handle ternary with arithmetic precedence", () => {
      const context = { a: 5, b: 10, c: 2 };
      // a > b ? a : b * c = 5 > 10 ? 5 : 20 = 20
      expect(evaluate("a > b ? a : b * c", context)).toBe(20);

      // a > b ? a * c : b = 5 > 10 ? 10 : 10 = 10
      expect(evaluate("a > b ? a * c : b", context)).toBe(10);
    });
  });

  describe("Error Handling", () => {
    describe("Syntax Errors", () => {
      it("should return undefined for incomplete expressions", () => {
        expect(evaluate("a +", { a: 1 })).toBeUndefined();
        expect(evaluate("(a + b", { a: 1, b: 2 })).toBeUndefined();
        expect(evaluate("a..b", { a: {} })).toBeUndefined();
      });

      it("should return undefined for invalid operators", () => {
        expect(evaluate("a *** b", { a: 1, b: 2 })).toBeUndefined();
        expect(evaluate("a <=> b", { a: 1, b: 2 })).toBeUndefined();
        expect(evaluate("a ::= b", { a: 1, b: 2 })).toBeUndefined();
      });

      it("should return undefined for mismatched brackets", () => {
        expect(evaluate("a[b", { a: {}, b: "key" })).toBeUndefined();
        expect(evaluate("a[b])", { a: {}, b: "key" })).toBeUndefined();
        expect(evaluate("a[[b]", { a: {}, b: "key" })).toBeUndefined();
      });

      it("should return undefined for unexpected tokens", () => {
        expect(evaluate("a & b", { a: 1, b: 2 })).toBeUndefined();
        expect(evaluate("a | b", { a: 1, b: 2 })).toBeUndefined();
        expect(evaluate("a ^ b", { a: 1, b: 2 })).toBeUndefined();
      });
    });

    describe("Runtime Errors", () => {
      it("should return undefined for function calls", () => {
        expect(evaluate("Math.max(1, 2)", {})).toBeUndefined();
        expect(evaluate("alert('hello')", {})).toBeUndefined();
        expect(evaluate("toString()", {})).toBeUndefined();
        expect(evaluate("obj.method()", { obj: { method: () => "result" } })).toBeUndefined();
      });

      it("should return undefined for invalid member access", () => {
        expect(evaluate("null.prop", {})).toBeUndefined();
        expect(evaluate("undefined.prop", {})).toBeUndefined();
        expect(evaluate("123.prop", {})).toBeUndefined();
        expect(evaluate("'string'.prop", {})).toBeUndefined();
      });

      it("should handle deep access on null/undefined gracefully", () => {
        expect(evaluate("a.b.c.d.e", { a: null })).toBeUndefined();
        expect(evaluate("a.b.c", { a: { b: null } })).toBeUndefined();
        expect(evaluate("a.b.c", { a: { b: undefined } })).toBeUndefined();
      });
    });

    describe("Missing Variables", () => {
      it("should return undefined for undefined variables", () => {
        expect(evaluate("missingVar", {})).toBeUndefined();
        expect(evaluate("a + b", { a: 1 })).toBeUndefined(); // 1 + undefined = undefined (type guard)
      });

      it("should return undefined for missing properties", () => {
        const context = { obj: {} };
        expect(evaluate("obj.missingProp", context)).toBeUndefined();
        expect(evaluate("obj.missing.nested", context)).toBeUndefined();
      });

      it("should handle missing variables in arithmetic", () => {
        const context = { a: 1 };
        const result = evaluate("a + missing", context);
        expect(result).toBeUndefined(); // Type guard prevents NaN
      });

      it("should handle missing variables in comparisons", () => {
        expect(evaluate("a === b", { a: 1 })).toBe(false); // 1 === undefined
        expect(evaluate("a == b", { a: 1 })).toBe(false); // 1 == undefined
      });
    });

    describe("Type Errors", () => {
      it("should handle non-numeric arithmetic", () => {
        expect(evaluate('"text" * 2', {})).toBeUndefined();
        expect(evaluate('"text" - 1', {})).toBeUndefined();
        expect(evaluate('"text" / 2', {})).toBeUndefined();
        expect(evaluate('"text" % 2', {})).toBeUndefined();
      });

      it("should handle division by zero", () => {
        expect(evaluate("1 / 0", {})).toBeUndefined();
        expect(evaluate("0 / 0", {})).toBeUndefined();
        expect(evaluate("-1 / 0", {})).toBeUndefined();
      });

      it("should handle object in arithmetic", () => {
        expect(evaluate("{} + 1", {})).toBeUndefined();
        expect(evaluate("{} * 2", {})).toBeUndefined();
      });

      it("should handle array in arithmetic", () => {
        // Array concatenation is supported for + operator
        expect(evaluate("[] + 1", {})).toBe("1"); // "" + "1" = "1"
        expect(evaluate("[1, 2] + 3", {})).toBe("1,23"); // "1,2" + "3" = "1,23"
      });
    });

    describe("Edge Cases", () => {
      it("should handle NaN in comparisons", () => {
        // NaN is parsed as an identifier, not a literal. Provide NaN in context
        const context = { NaN };
        expect(evaluate("NaN === NaN", context)).toBe(false); // NaN is not equal to itself
        expect(evaluate("NaN !== NaN", context)).toBe(true);
        expect(evaluate("NaN > 0", context)).toBe(false);
        expect(evaluate("NaN < 0", context)).toBe(false);
      });

      it("should handle typeof null", () => {
        // null is parsed as an identifier. Provide actual null in context
        expect(evaluate('typeof null', { null: null })).toBe("object"); // Historical bug
        expect(evaluate('typeof undefined', {})).toBe("undefined");
      });

      it("should handle typeof with field proxies", () => {
        const context = buildEvaluationContext(
          { value: "string", num: 42, bool: true },
          {},
          {},
          { value: { value: "string" }, num: { value: 42 }, bool: { value: true } }
        );

        expect(evaluate("typeof value", context)).toBe("string");
        expect(evaluate("typeof num", context)).toBe("number");
        expect(evaluate("typeof bool", context)).toBe("boolean");
      });

      it("should handle very long expressions", () => {
        const longExpr = "a + ".repeat(100) + "1";
        expect(evaluate(longExpr, { a: 1 })).not.toBeUndefined();
      });

      it("should handle deeply nested ternaries", () => {
        const deepTernary = "a ? b ? c ? d ? e ? 1 : 2 : 3 : 4 : 5 : 6";
        expect(evaluate(deepTernary, { a: true, b: true, c: true, d: true, e: true })).toBe(1);
        expect(evaluate(deepTernary, { a: true, b: true, c: true, d: true, e: false })).toBe(2);
        expect(evaluate(deepTernary, { a: false, b: true, c: true, d: true, e: true })).toBe(6);
      });

      it("should handle empty array expressions", () => {
        expect(evaluate("[]", {})).toEqual([]);
      });

      it("should handle mixed array expressions", () => {
        const context = { a: 1, b: "hello", c: true };
        expect(evaluate("[a, b, c, null, undefined]", context)).toEqual([1, "hello", true, null, undefined]);
      });
    });

    describe("Null/Undefined Propagation", () => {
      it("should handle null in member expression", () => {
        expect(evaluate("a.b", { a: null })).toBeUndefined();
        expect(evaluate("a.b.c", { a: null })).toBeUndefined();
      });

      it("should handle undefined in member expression", () => {
        expect(evaluate("a.b", { a: undefined })).toBeUndefined();
        expect(evaluate("a.b.c", { a: undefined })).toBeUndefined();
      });

      it("should handle null with bracket notation", () => {
        expect(evaluate("a['b']", { a: null })).toBeUndefined();
        expect(evaluate('a["b"]', { a: undefined })).toBeUndefined();
      });

      it("should handle null in logical expressions", () => {
        expect(evaluate("null && true", {})).toBe(null); // Returns null, not false
        expect(evaluate("null || true", {})).toBe(true); // Short-circuits to true
        expect(evaluate("null ?? true", {})).toBe(true); // Nullish coalescing
      });

      it("should handle undefined in logical expressions", () => {
        expect(evaluate("undefined && true", {})).toBe(undefined);
        expect(evaluate("undefined || true", {})).toBe(true);
        expect(evaluate("undefined ?? true", {})).toBe(true);
      });
    });

    describe("Security - Function Call Blocking", () => {
      it("should block Math functions", () => {
        expect(evaluate("Math.max(1, 2)", {})).toBeUndefined();
        expect(evaluate("Math.min(1, 2)", {})).toBeUndefined();
        expect(evaluate("Math.random()", {})).toBeUndefined();
      });

      it("should block Object functions", () => {
        expect(evaluate("Object.keys({})", {})).toBeUndefined();
        expect(evaluate("Object.values({})", {})).toBeUndefined();
      });

      it("should block Array functions", () => {
        expect(evaluate("Array.isArray([])", {})).toBeUndefined();
        expect(evaluate("Array.from('123')", {})).toBeUndefined();
      });

      it("should block custom function calls", () => {
        expect(evaluate("customFunc()", { customFunc: () => "result" })).toBeUndefined();
        expect(evaluate("obj.method()", { obj: { method: () => "result" } })).toBeUndefined();
      });

      it("should block function calls in expressions", () => {
        expect(evaluate("a ? b() : c", { a: true, b: () => "yes", c: "no" })).toBeUndefined();
        expect(evaluate("a && b()", { a: true, b: () => "yes" })).toBeUndefined();
      });
    });
  });

  describe("Unary Operators", () => {
    it("should handle logical NOT (!)", () => {
      expect(evaluate("!true", {})).toBe(false);
      expect(evaluate("!false", {})).toBe(true);
      expect(evaluate("!null", {})).toBe(true);
      expect(evaluate("!undefined", {})).toBe(true);
      expect(evaluate("!0", {})).toBe(true);
      expect(evaluate('!""', {})).toBe(true);
      expect(evaluate('!"text"', {})).toBe(false);
    });

    it("should handle unary minus (-)", () => {
      expect(evaluate("-5", {})).toBe(-5);
      expect(evaluate("--5", {})).toBe(5);
      expect(evaluate("-0", {})).toBe(-0);
    });

    it("should handle unary plus (+)", () => {
      expect(evaluate("+5", {})).toBe(5);
      expect(evaluate("+'5'", {})).toBe(5);
      expect(evaluate("+true", {})).toBe(1);
      expect(evaluate("+false", {})).toBe(0);
    });

    it("should handle typeof", () => {
      expect(evaluate('typeof "string"', {})).toBe("string");
      expect(evaluate('typeof 42', {})).toBe("number");
      expect(evaluate('typeof true', {})).toBe("boolean");
      expect(evaluate('typeof undefined', {})).toBe("undefined");
      expect(evaluate('typeof null', {})).toBe("object");
      // typeof {} and typeof [] need context variables because {} is parsed as a block
      expect(evaluate('typeof obj', { obj: {} })).toBe("object");
      expect(evaluate('typeof arr', { arr: [] })).toBe("object");
    });

    it("should handle typeof with identifiers", () => {
      const context = { a: "string", b: 42, c: true, d: undefined };
      expect(evaluate("typeof a", context)).toBe("string");
      expect(evaluate("typeof b", context)).toBe("number");
      expect(evaluate("typeof c", context)).toBe("boolean");
      expect(evaluate("typeof d", context)).toBe("undefined");
    });
  });

  describe("Array Expressions", () => {
    it("should evaluate simple array expressions", () => {
      expect(evaluate("[1, 2, 3]", {})).toEqual([1, 2, 3]);
      expect(evaluate('["a", "b", "c"]', {})).toEqual(["a", "b", "c"]);
      expect(evaluate("[true, false]", {})).toEqual([true, false]);
    });

    it("should evaluate array expressions with variables", () => {
      const context = { a: 1, b: 2 };
      expect(evaluate("[a, b, 3]", context)).toEqual([1, 2, 3]);
    });

    it("should evaluate nested array expressions", () => {
      expect(evaluate("[[1, 2], [3, 4]]", {})).toEqual([[1, 2], [3, 4]]);
      expect(evaluate("[1, [2, [3, 4]]]", {})).toEqual([1, [2, [3, 4]]]);
    });

    it("should evaluate array expressions with expressions", () => {
      const context = { a: 1, b: 2 };
      expect(evaluate("[a + b, a * b, a - b]", context)).toEqual([3, 2, -1]);
    });

    it("should handle sparse arrays", () => {
      // Sparse arrays are preserved with undefined elements (null in JSON, undefined in actual array)
      expect(evaluate("[1, , 3]", {})).toEqual([1, undefined, 3]);
      expect(evaluate("[, , ]", {})).toEqual([undefined, undefined]);
    });

    it("should handle mixed type arrays", () => {
      const context = { a: 1, b: "text", c: true };
      expect(evaluate("[a, b, c, null, undefined]", context)).toEqual([1, "text", true, null, undefined]);
    });
  });

  describe("evaluateDescriptor with Complex Expressions", () => {
    it("should evaluate nested objects with complex expressions", () => {
      const context = { a: 1, b: 2, c: 3 };
      const descriptor = {
        result: "a + b * c",
        nested: {
          value: "a > 0 ? 'positive' : 'negative'",
          complex: "a && b || c ? 'yes' : 'no'",
        },
      };

      expect(evaluateDescriptor(descriptor, context)).toEqual({
        result: 7,
        nested: {
          value: "positive",
          complex: "yes",
        },
      });
    });

    it("should evaluate arrays with complex expressions", () => {
      const context = { a: 5, b: 10, c: 2 };
      const descriptor = ["a > b ? a : b", "a * c + b", "a && b ? c : 0"];

      expect(evaluateDescriptor(descriptor, context)).toEqual([10, 20, 2]);
    });

    it("should handle mixed descriptors with primitives and expressions", () => {
      const context = { name: "John", age: 30, constant: "constant" };
      const descriptor = {
        static: "constant",
        dynamic: "name + ' is ' + age",
        number: 42,
        bool: true,
        null: null,
      };

      expect(evaluateDescriptor(descriptor, context)).toEqual({
        static: "constant",
        dynamic: "John is 30",
        number: 42,
        bool: true,
        null: null,
      });
    });

    it("should handle function descriptors (pass through)", () => {
      const fn = (ctx: any) => "result";
      expect(evaluateDescriptor(fn, {})).toBe(fn);
    });

    it("should handle null and undefined top-level descriptors", () => {
      expect(evaluateDescriptor(null, {})).toBe(null);
      expect(evaluateDescriptor(undefined, {})).toBe(undefined);
    });
  });

  describe("Type Guards - Arithmetic Operations", () => {
    describe("Addition (+)", () => {
      it("should concatenate string + number", () => {
        // String concatenation is supported for + operator
        expect(evaluate('"text" + 1', {})).toBe("text1");
      });

      it("should concatenate string + string", () => {
        expect(evaluate('"Hello" + "World"', {})).toBe("HelloWorld");
      });

      it("should concatenate number + string", () => {
        expect(evaluate('5 + "test"', {})).toBe("5test");
      });

      it("should return undefined for null + number", () => {
        expect(evaluate('null + 1', {})).toBeUndefined();
      });

      it("should return undefined for undefined + number", () => {
        expect(evaluate('undefined + 1', {})).toBeUndefined();
      });

      it("should return undefined for object + number", () => {
        expect(evaluate('{} + 1', {})).toBeUndefined();
      });

      it("should work with valid numbers", () => {
        expect(evaluate('5 + 3', {})).toBe(8);
        expect(evaluate('0 + 0', {})).toBe(0);
        expect(evaluate('-5 + 3', {})).toBe(-2);
      });
    });

    describe("Subtraction (-)", () => {
      it("should return undefined for string - number", () => {
        expect(evaluate('"text" - 1', {})).toBeUndefined();
      });

      it("should return undefined for null - number", () => {
        expect(evaluate('null - 1', {})).toBeUndefined();
      });

      it("should return undefined for undefined - number", () => {
        expect(evaluate('undefined - 1', {})).toBeUndefined();
      });

      it("should return undefined for object - number", () => {
        expect(evaluate('{} - 1', {})).toBeUndefined();
      });

      it("should work with valid numbers", () => {
        expect(evaluate('10 - 4', {})).toBe(6);
        expect(evaluate('5 - 5', {})).toBe(0);
        expect(evaluate('3 - 10', {})).toBe(-7);
      });
    });

    describe("Multiplication (*)", () => {
      it("should return undefined for string * number", () => {
        expect(evaluate('"text" * 2', {})).toBeUndefined();
      });

      it("should return undefined for null * number", () => {
        expect(evaluate('null * 2', {})).toBeUndefined();
      });

      it("should return undefined for undefined * number", () => {
        expect(evaluate('undefined * 2', {})).toBeUndefined();
      });

      it("should return undefined for object * number", () => {
        expect(evaluate('{} * 2', {})).toBeUndefined();
      });

      it("should work with valid numbers", () => {
        expect(evaluate('5 * 3', {})).toBe(15);
        expect(evaluate('0 * 100', {})).toBe(0);
        expect(evaluate('-5 * 3', {})).toBe(-15);
      });
    });

    describe("Division (/)", () => {
      it("should return undefined for string / number", () => {
        expect(evaluate('"text" / 2', {})).toBeUndefined();
      });

      it("should return undefined for null / number", () => {
        expect(evaluate('null / 2', {})).toBeUndefined();
      });

      it("should return undefined for undefined / number", () => {
        expect(evaluate('undefined / 2', {})).toBeUndefined();
      });

      it("should return undefined for object / number", () => {
        expect(evaluate('{} / 2', {})).toBeUndefined();
      });

      it("should return undefined for division by zero", () => {
        expect(evaluate('1 / 0', {})).toBeUndefined();
        expect(evaluate('-1 / 0', {})).toBeUndefined();
        expect(evaluate('0 / 0', {})).toBeUndefined();
        expect(evaluate('100 / 0', {})).toBeUndefined();
      });

      it("should work with valid numbers", () => {
        expect(evaluate('10 / 2', {})).toBe(5);
        expect(evaluate('7 / 2', {})).toBe(3.5);
        expect(evaluate('-10 / 2', {})).toBe(-5);
      });
    });

    describe("Modulo (%)", () => {
      it("should return undefined for string % number", () => {
        expect(evaluate('"text" % 2', {})).toBeUndefined();
      });

      it("should return undefined for null % number", () => {
        expect(evaluate('null % 2', {})).toBeUndefined();
      });

      it("should return undefined for undefined % number", () => {
        expect(evaluate('undefined % 2', {})).toBeUndefined();
      });

      it("should return undefined for object % number", () => {
        expect(evaluate('{} % 2', {})).toBeUndefined();
      });

      it("should return undefined for modulo by zero", () => {
        expect(evaluate('10 % 0', {})).toBeUndefined();
        expect(evaluate('1 % 0', {})).toBeUndefined();
        expect(evaluate('0 % 0', {})).toBeUndefined();
      });

      it("should work with valid numbers", () => {
        expect(evaluate('10 % 3', {})).toBe(1);
        expect(evaluate('15 % 4', {})).toBe(3);
        expect(evaluate('7 % 2', {})).toBe(1);
      });
    });

    describe("Null/Undefined Handling", () => {
      describe("Addition (+)", () => {
        it("should return undefined for number + null", () => {
          // jsep parses 'null' as identifier, so provide actual null in context
          expect(evaluate('5 + null', { null: null })).toBeUndefined();
        });

        it("should return undefined for null + number", () => {
          expect(evaluate('null + 1', { null: null })).toBeUndefined();
        });

        it("should return undefined for number + undefined", () => {
          expect(evaluate('5 + undefined', { undefined })).toBeUndefined();
        });

        it("should return undefined for undefined + number", () => {
          expect(evaluate('undefined + 1', { undefined })).toBeUndefined();
        });

        it("should return undefined for null + null", () => {
          expect(evaluate('null + null', { null: null })).toBeUndefined();
        });

        it("should return undefined for undefined + undefined", () => {
          expect(evaluate('undefined + undefined', { undefined })).toBeUndefined();
        });

        it("should work with valid numbers (regression test)", () => {
          expect(evaluate('5 + 3', {})).toBe(8);
        });
      });

      describe("Subtraction (-)", () => {
        it("should return undefined for number - null", () => {
          expect(evaluate('5 - null', { null: null })).toBeUndefined();
        });

        it("should return undefined for null - number", () => {
          expect(evaluate('null - 1', { null: null })).toBeUndefined();
        });

        it("should return undefined for number - undefined", () => {
          expect(evaluate('5 - undefined', { undefined })).toBeUndefined();
        });

        it("should return undefined for undefined - number", () => {
          expect(evaluate('undefined - 1', { undefined })).toBeUndefined();
        });

        it("should return undefined for null - null", () => {
          expect(evaluate('null - null', { null: null })).toBeUndefined();
        });

        it("should return undefined for undefined - undefined", () => {
          expect(evaluate('undefined - undefined', { undefined })).toBeUndefined();
        });

        it("should work with valid numbers (regression test)", () => {
          expect(evaluate('10 - 4', {})).toBe(6);
        });
      });

      describe("Multiplication (*)", () => {
        it("should return undefined for number * null", () => {
          expect(evaluate('10 * null', { null: null })).toBeUndefined();
        });

        it("should return undefined for null * number", () => {
          expect(evaluate('null * 2', { null: null })).toBeUndefined();
        });

        it("should return undefined for number * undefined", () => {
          expect(evaluate('10 * undefined', { undefined })).toBeUndefined();
        });

        it("should return undefined for undefined * number", () => {
          expect(evaluate('undefined * 2', { undefined })).toBeUndefined();
        });

        it("should return undefined for null * null", () => {
          expect(evaluate('null * null', { null: null })).toBeUndefined();
        });

        it("should return undefined for undefined * undefined", () => {
          expect(evaluate('undefined * undefined', { undefined })).toBeUndefined();
        });

        it("should work with valid numbers (regression test)", () => {
          expect(evaluate('5 * 3', {})).toBe(15);
        });
      });

      describe("Division (/)", () => {
        it("should return undefined for number / null", () => {
          expect(evaluate('10 / null', { null: null })).toBeUndefined();
        });

        it("should return undefined for null / number", () => {
          expect(evaluate('null / 2', { null: null })).toBeUndefined();
        });

        it("should return undefined for number / undefined", () => {
          expect(evaluate('10 / undefined', { undefined })).toBeUndefined();
        });

        it("should return undefined for undefined / number", () => {
          expect(evaluate('undefined / 2', { undefined })).toBeUndefined();
        });

        it("should return undefined for null / null", () => {
          expect(evaluate('null / null', { null: null })).toBeUndefined();
        });

        it("should return undefined for undefined / undefined", () => {
          expect(evaluate('undefined / undefined', { undefined })).toBeUndefined();
        });

        it("should work with valid numbers (regression test)", () => {
          expect(evaluate('10 / 2', {})).toBe(5);
        });
      });

      describe("Modulo (%)", () => {
        it("should return undefined for number % null", () => {
          expect(evaluate('10 % null', { null: null })).toBeUndefined();
        });

        it("should return undefined for null % number", () => {
          expect(evaluate('null % 3', { null: null })).toBeUndefined();
        });

        it("should return undefined for number % undefined", () => {
          expect(evaluate('10 % undefined', { undefined })).toBeUndefined();
        });

        it("should return undefined for undefined % number", () => {
          expect(evaluate('undefined % 3', { undefined })).toBeUndefined();
        });

        it("should return undefined for null % null", () => {
          expect(evaluate('null % null', { null: null })).toBeUndefined();
        });

        it("should return undefined for undefined % undefined", () => {
          expect(evaluate('undefined % undefined', { undefined })).toBeUndefined();
        });

        it("should work with valid numbers (regression test)", () => {
          expect(evaluate('10 % 3', {})).toBe(1);
        });
      });

      describe("Complex Expressions with Null/Undefined", () => {
        it("should return undefined for chained arithmetic with null", () => {
          expect(evaluate('5 + 3 - null', { null: null })).toBeUndefined();
          expect(evaluate('10 * null + 5', { null: null })).toBeUndefined();
        });

        it("should return undefined for chained arithmetic with undefined", () => {
          expect(evaluate('5 + 3 - undefined', { undefined })).toBeUndefined();
          expect(evaluate('10 * undefined + 5', { undefined })).toBeUndefined();
        });

        it("should handle mixed null/undefined in complex expression", () => {
          expect(evaluate('null + 5 * 2', { null: null })).toBeUndefined();
          expect(evaluate('5 * undefined + 10', { undefined })).toBeUndefined();
        });
      });
    });
  });

  describe("Development Warnings", () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should not warn for string concatenation (valid operation)", () => {
      evaluate('"text" + 1', {});

      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should not warn for string + string concatenation", () => {
      evaluate('"Hello" + "World"', {});

      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should warn for non-numeric operands in subtraction", () => {
      evaluate('"text" - 1', {});

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid operands')
      );
    });

    it("should warn for non-numeric operands in multiplication", () => {
      evaluate('"text" * 2', {});

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid operands')
      );
    });

    it("should warn for division by zero", () => {
      evaluate('1 / 0', {});

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Division by zero')
      );
    });

    it("should warn for modulo by zero", () => {
      evaluate('10 % 0', {});

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Modulo by zero')
      );
    });

    it("should warn for arithmetic overflow", () => {
      // Using very large numbers to trigger overflow
      evaluate('1e308 + 1e308', {});

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Arithmetic overflow')
      );
    });

    it("should not warn for valid arithmetic", () => {
      evaluate('5 + 3', {});

      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should not warn for valid division", () => {
      evaluate('10 / 2', {});

      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should show correct operand types in warning", () => {
      evaluate('null + 1', {});

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('left=object')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('right=number')
      );
    });

    it("should warn for null + number (not a valid operation)", () => {
      evaluate('null + 1', {});

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
    });
  });

  describe("Development Warnings - Null/Undefined", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      clearExpressionCache();
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    describe("Addition (+)", () => {
      it("should warn for null + number with correct message", () => {
        evaluate('null + 5', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Formality Expression]')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Type error')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid operands for +')
        );
      });

      it("should show operand types in warning for null + number", () => {
        evaluate('null + 5', { null: null });

        // typeof null is 'object'
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('left=object')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('right=number')
        );
      });

      it("should warn for number + null", () => {
        evaluate('5 + null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined + number", () => {
        evaluate('undefined + 5', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for number + undefined", () => {
        evaluate('5 + undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for null + null", () => {
        evaluate('null + null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined + undefined", () => {
        evaluate('undefined + undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });
    });

    describe("Subtraction (-)", () => {
      it("should warn for null - number with correct message", () => {
        evaluate('null - 5', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Formality Expression]')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Type error')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid operands for -')
        );
      });

      it("should show operand types in warning for null - number", () => {
        evaluate('null - 5', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('left=object')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('right=number')
        );
      });

      it("should warn for number - null", () => {
        evaluate('5 - null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined - number", () => {
        evaluate('undefined - 5', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for number - undefined", () => {
        evaluate('5 - undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for null - null", () => {
        evaluate('null - null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined - undefined", () => {
        evaluate('undefined - undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });
    });

    describe("Multiplication (*)", () => {
      it("should warn for null * number with correct message", () => {
        evaluate('null * 5', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Formality Expression]')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Type error')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid operands for *')
        );
      });

      it("should show operand types in warning for null * number", () => {
        evaluate('null * 5', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('left=object')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('right=number')
        );
      });

      it("should warn for number * null", () => {
        evaluate('10 * null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined * number", () => {
        evaluate('undefined * 5', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for number * undefined", () => {
        evaluate('10 * undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for null * null", () => {
        evaluate('null * null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined * undefined", () => {
        evaluate('undefined * undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });
    });

    describe("Division (/)", () => {
      it("should warn for null / number with correct message", () => {
        evaluate('null / 2', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Formality Expression]')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Type error')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid operands for /')
        );
      });

      it("should show operand types in warning for null / number", () => {
        evaluate('null / 2', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('left=object')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('right=number')
        );
      });

      it("should warn for number / null", () => {
        evaluate('10 / null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined / number", () => {
        evaluate('undefined / 2', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for number / undefined", () => {
        evaluate('10 / undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for null / null", () => {
        evaluate('null / null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined / undefined", () => {
        evaluate('undefined / undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });
    });

    describe("Modulo (%)", () => {
      it("should warn for null % number with correct message", () => {
        evaluate('null % 3', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Formality Expression]')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Type error')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid operands for %')
        );
      });

      it("should show operand types in warning for null % number", () => {
        evaluate('null % 3', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('left=object')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('right=number')
        );
      });

      it("should warn for number % null", () => {
        evaluate('10 % null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined % number", () => {
        evaluate('undefined % 3', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for number % undefined", () => {
        evaluate('10 % undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for null % null", () => {
        evaluate('null % null', { null: null });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });

      it("should warn for undefined % undefined", () => {
        evaluate('undefined % undefined', { undefined });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('null/undefined')
        );
      });
    });
  });

  describe("Production Mode - No Warnings", () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      clearExpressionCache();
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("should not warn for null arithmetic in production", () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      evaluate('null + 5', { null: null });
      evaluate('undefined * 3', { undefined });
      evaluate('10 - null', { null: null });
      evaluate('null / 2', { null: null });
      evaluate('15 % null', { null: null });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should still return undefined in production mode", () => {
      process.env.NODE_ENV = 'production';

      expect(evaluate('null + 5', { null: null })).toBeUndefined();
      expect(evaluate('undefined - 3', { undefined })).toBeUndefined();
      expect(evaluate('null * 2', { null: null })).toBeUndefined();
      expect(evaluate('undefined / 2', { undefined })).toBeUndefined();
      expect(evaluate('10 % null', { null: null })).toBeUndefined();
    });

    it("should not warn for undefined arithmetic in production", () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      evaluate('undefined + 5', { undefined });
      evaluate('undefined - 5', { undefined });
      evaluate('undefined * 5', { undefined });
      evaluate('undefined / 2', { undefined });
      evaluate('undefined % 3', { undefined });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should not warn for null + null in production", () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      evaluate('null + null', { null: null });
      evaluate('null - null', { null: null });
      evaluate('null * null', { null: null });
      evaluate('null / null', { null: null });
      evaluate('null % null', { null: null });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should not warn for undefined + undefined in production", () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      evaluate('undefined + undefined', { undefined });
      evaluate('undefined - undefined', { undefined });
      evaluate('undefined * undefined', { undefined });
      evaluate('undefined / undefined', { undefined });
      evaluate('undefined % undefined', { undefined });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should work with valid numbers in production mode (regression test)", () => {
      process.env.NODE_ENV = 'production';

      expect(evaluate('5 + 3', {})).toBe(8);
      expect(evaluate('10 - 4', {})).toBe(6);
      expect(evaluate('5 * 3', {})).toBe(15);
      expect(evaluate('10 / 2', {})).toBe(5);
      expect(evaluate('10 % 3', {})).toBe(1);
    });
  });
});
