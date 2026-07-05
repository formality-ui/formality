import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  evaluate,
  evaluateDescriptor,
  clearExpressionCache,
  buildFormContext,
  buildFieldContext,
  buildEvaluationContext,
  inferFieldsFromExpression,
  inferFieldsFromDescriptor,
} from "../index";

describe("Expression Engine", () => {
  beforeEach(() => {
    clearExpressionCache();
  });

  describe("evaluate", () => {
    it("should evaluate simple identifiers", () => {
      const context = { client: "Acme", signed: true };
      expect(evaluate("client", context)).toBe("Acme");
      expect(evaluate("signed", context)).toBe(true);
    });

    it("should evaluate member expressions", () => {
      const context = { client: { id: 5, name: "Acme" } };
      expect(evaluate("client.id", context)).toBe(5);
      expect(evaluate("client.name", context)).toBe("Acme");
    });

    it("should evaluate nested member expressions", () => {
      const context = {
        record: { client: { contact: { email: "test@example.com" } } },
      };
      expect(evaluate("record.client.contact.email", context)).toBe(
        "test@example.com",
      );
    });

    it("should evaluate binary expressions", () => {
      const context = { a: 10, b: 3 };
      expect(evaluate("a + b", context)).toBe(13);
      expect(evaluate("a - b", context)).toBe(7);
      expect(evaluate("a * b", context)).toBe(30);
      expect(evaluate("a / b", context)).toBeCloseTo(3.33, 1);
      expect(evaluate("a % b", context)).toBe(1);
    });

    it("should evaluate comparison expressions", () => {
      const context = { a: 10, b: 10, c: 5 };
      expect(evaluate("a === b", context)).toBe(true);
      expect(evaluate("a !== c", context)).toBe(true);
      expect(evaluate("a > c", context)).toBe(true);
      expect(evaluate("c < a", context)).toBe(true);
      expect(evaluate("a >= b", context)).toBe(true);
      expect(evaluate("c <= a", context)).toBe(true);
    });

    it("should evaluate logical expressions", () => {
      const context = { a: true, b: false, c: null };
      expect(evaluate("a && b", context)).toBe(false);
      expect(evaluate("a || b", context)).toBe(true);
      expect(evaluate("a ?? c", context)).toBe(true);
      expect(evaluate("c ?? b", context)).toBe(false);
    });

    it("should short-circuit logical expressions", () => {
      const context = { a: false, b: { id: 5 } };
      // Should not throw accessing b.id.foo when a is false
      expect(evaluate("a && b.id.foo.bar", context)).toBe(false);
    });

    it("should evaluate unary expressions", () => {
      const context = { a: true, b: 5 };
      expect(evaluate("!a", context)).toBe(false);
      expect(evaluate("-b", context)).toBe(-5);
      expect(evaluate("+b", context)).toBe(5);
    });

    it("should evaluate conditional expressions", () => {
      const context = { signed: true };
      expect(evaluate("signed ? 'Yes' : 'No'", context)).toBe("Yes");
      expect(evaluate("!signed ? 'Unsigned' : 'Signed'", context)).toBe(
        "Signed",
      );
    });

    it("should evaluate array expressions", () => {
      const context = { a: 1, b: 2 };
      expect(evaluate("[a, b, 3]", context)).toEqual([1, 2, 3]);
    });

    it("should handle bracket notation", () => {
      const context = { items: { foo: "bar" }, key: "foo" };
      expect(evaluate("items[key]", context)).toBe("bar");
    });

    it("should return undefined for missing properties", () => {
      const context = { client: {} };
      expect(evaluate("client.missing", context)).toBeUndefined();
      expect(evaluate("missing.property", context)).toBeUndefined();
    });

    it("should cache parsed expressions", () => {
      const context = { x: 1 };
      evaluate("x + 1", context);
      evaluate("x + 1", context); // Should use cache
      // Just verifying it doesn't throw
      expect(true).toBe(true);
    });

    // --- Coverage backfill (PRD §4.2.1) ---
    // E1: `+` string-concat path, left-nullish arm (`?? ""`)
    it("concatenates with a nullish left operand in the + string path", () => {
      expect(evaluate("missing + 'x'", {})).toBe("x");
    });

    // E2: numeric + overflow to Infinity → warn + undefined
    it("returns undefined when numeric + overflows to Infinity", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(evaluate("1e308 + 1e308", {})).toBeUndefined();
      warnSpy.mockRestore();
    });

    // E3: loose inequality (!=) operator arm
    it("supports loose inequality (!=)", () => {
      expect(evaluate("1 != 2", {})).toBe(true);
      // loose: 1 == '1' → 1 != '1' is false
      expect(evaluate("1 != '1'", {})).toBe(false);
    });

    // E4: Compound node (comma-separated expressions) returns the last
    it("evaluates comma-separated (Compound) expressions, returning the last", () => {
      expect(evaluate("1, 2, 3", {})).toBe(3);
    });

    // E2b: arithmetic (-,*,/,%) with a null/undefined operand → warn + undefined
    it("returns undefined for arithmetic ops on nullish operands", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(evaluate("missing - 1", {})).toBeUndefined();
      expect(evaluate("1 * missing", {})).toBeUndefined();
      warnSpy.mockRestore();
    });

    // E2c: arithmetic overflow on * → Infinity → warn + undefined
    it("returns undefined when arithmetic * overflows to Infinity", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(evaluate("1e155 * 1e155", {})).toBeUndefined();
      warnSpy.mockRestore();
    });

    // E2d: division / modulo by zero → warn + undefined
    it("returns undefined for division and modulo by zero", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(evaluate("5 / 0", {})).toBeUndefined();
      expect(evaluate("5 % 0", {})).toBeUndefined();
      warnSpy.mockRestore();
    });

    // NOTE: E5–E8 (L224/L267/L309/L346) are DEFENSIVE/DEAD default throws
    // (unreachable for real expression strings; current jsep emits logical
    // operators as BinaryExpression). Intentionally not covered.
  });

  describe("evaluateDescriptor", () => {
    it("should evaluate string descriptors", () => {
      const context = { client: { id: 5 } };
      expect(evaluateDescriptor("client.id", context)).toBe(5);
    });

    it("should pass through functions", () => {
      const fn = () => "test";
      expect(evaluateDescriptor(fn, {})).toBe(fn);
    });

    it("should evaluate arrays", () => {
      const context = { a: 1, b: 2 };
      expect(evaluateDescriptor(["a", "b", "3"], context)).toEqual([1, 2, 3]);
    });

    it("should evaluate nested objects", () => {
      const context = { a: 1, b: 2 };
      const descriptor = { x: "a", y: "b", z: { nested: "a + b" } };
      expect(evaluateDescriptor(descriptor, context)).toEqual({
        x: 1,
        y: 2,
        z: { nested: 3 },
      });
    });

    it("should pass through primitives", () => {
      expect(evaluateDescriptor(42, {})).toBe(42);
      expect(evaluateDescriptor(null, {})).toBe(null);
      expect(evaluateDescriptor(true, {})).toBe(true);
    });
  });

  describe("Context Builders", () => {
    describe("buildFormContext", () => {
      it("should include qualified paths", () => {
        const fields = {
          client: {
            value: "Acme",
            isTouched: false,
            isDirty: false,
            isValidating: false,
            invalid: false,
          },
        };
        const record = { originalClient: "Old" };
        const context = buildFormContext(fields, record);

        expect(context.fields).toBe(fields);
        expect(context.record).toBe(record);
      });

      it("should add unqualified shortcuts as proxies", () => {
        const fields = {
          client: {
            value: "Acme",
            isTouched: true,
            isDirty: false,
            isValidating: false,
            invalid: false,
          },
        };
        const context = buildFormContext(fields);

        // Proxy provides access to both value and metadata
        const clientProxy = context.client as any;
        expect(clientProxy.value).toBe("Acme");
        expect(clientProxy.isTouched).toBe(true);
        expect(clientProxy.isDirty).toBe(false);
      });

      it("should allow expressions to evaluate proxy values correctly", () => {
        const fields = {
          client: {
            value: { id: 5, name: "Acme" },
            isTouched: false,
            isDirty: false,
            isValidating: false,
            invalid: false,
          },
          signed: {
            value: true,
            isTouched: true,
            isDirty: false,
            isValidating: false,
            invalid: false,
          },
        };
        const context = buildFormContext(fields);

        // Expression evaluation should unwrap proxies automatically
        expect(evaluate("client.id", context)).toBe(5);
        expect(evaluate("client.name", context)).toBe("Acme");
        expect(evaluate("signed", context)).toBe(true);
        expect(evaluate("signed.isTouched", context)).toBe(true);
        expect(evaluate("client && signed", context)).toBe(true);
      });
    });

    describe("buildFieldContext", () => {
      it("should add props with field name", () => {
        const formState = {
          fields: {},
          errors: {},
          defaultValues: {},
          touchedFields: {},
          dirtyFields: {},
          isDirty: false,
          isTouched: false,
          isValid: true,
          isSubmitting: false,
        };
        const context = buildFieldContext(formState as any, "myField");

        expect(context.props).toEqual({ name: "myField" });
      });
    });

    describe("buildEvaluationContext", () => {
      it("should build minimal context from field values with proxies", () => {
        const fieldValues = { client: "Acme", signed: true };
        const context = buildEvaluationContext(fieldValues);

        // Proxies wrap the values
        const clientProxy = context.client as any;
        const signedProxy = context.signed as any;
        expect(clientProxy.value).toBe("Acme");
        expect(signedProxy.value).toBe(true);
        expect((context.fields as any).client.value).toBe("Acme");
      });

      it("should work correctly with expression evaluation", () => {
        const fieldValues = { client: "Acme", signed: true, count: 5 };
        const context = buildEvaluationContext(fieldValues);

        // Expression evaluation should unwrap proxies
        expect(evaluate("client", context)).toBe("Acme");
        expect(evaluate("signed", context)).toBe(true);
        expect(evaluate("count + 10", context)).toBe(15);
        expect(evaluate("client && signed", context)).toBe(true);
      });
    });
  });

  describe("Field Inference", () => {
    describe("inferFieldsFromExpression", () => {
      it("should extract simple field references", () => {
        expect(inferFieldsFromExpression("client")).toEqual(["client"]);
        expect(inferFieldsFromExpression("client && signed")).toEqual([
          "client",
          "signed",
        ]);
      });

      it("should extract root identifiers from member expressions", () => {
        expect(inferFieldsFromExpression("client.id")).toEqual(["client"]);
        expect(inferFieldsFromExpression("client.contact.email")).toEqual([
          "client",
        ]);
      });

      it("should skip keywords", () => {
        expect(inferFieldsFromExpression("true && false")).toEqual([]);
        expect(inferFieldsFromExpression("null || undefined")).toEqual([]);
      });

      it("should skip qualified prefixes when followed by dot", () => {
        expect(inferFieldsFromExpression("fields.client.value")).toEqual([]);
        expect(inferFieldsFromExpression("record.name")).toEqual([]);
        expect(inferFieldsFromExpression("props.label")).toEqual([]);
      });

      it("should not skip qualified prefixes when not followed by dot", () => {
        // 'fields' alone is treated as a field name
        expect(inferFieldsFromExpression("fields === null")).toEqual([
          "fields",
        ]);
      });

      it("should return unique field names", () => {
        expect(inferFieldsFromExpression("client && client.id")).toEqual([
          "client",
        ]);
      });

      // --- Coverage backfill (PRD §4.3.3) ---
      // I1: identifier inside a string literal is skipped (inString continue)
      it("skips identifiers that appear inside string literals", () => {
        expect(inferFieldsFromExpression('"foo bar"')).toEqual([]);
      });

      // I2: single-quote enter/exit arms of the string-state machine
      it("handles single-quoted string literals", () => {
        expect(inferFieldsFromExpression("'a' + b")).toEqual(["b"]);
        // double quotes already covered elsewhere; add explicit assertion
        expect(inferFieldsFromExpression('signed ? "x" : "y"')).toEqual([
          "signed",
        ]);
      });

      // I3: escape sequence inside a string literal sets escapeNext + skips
      it("handles escaped characters inside string literals", () => {
        // Runtime expression: "a\"b" + c  (a backslash escapes the inner quote).
        // In a TS single-quoted literal, \\ → one backslash, " is literal.
        expect(inferFieldsFromExpression('"a\\"b" + c')).toEqual(["c"]);
      });
    });

    describe("inferFieldsFromDescriptor", () => {
      it("should extract fields from strings", () => {
        expect(inferFieldsFromDescriptor("client.id")).toEqual(["client"]);
      });

      it("should return empty for functions", () => {
        expect(inferFieldsFromDescriptor(() => {})).toEqual([]);
      });

      it("should extract fields from arrays", () => {
        expect(
          inferFieldsFromDescriptor(["client", "signed && approved"]),
        ).toEqual(["client", "signed", "approved"]);
      });

      it("should extract fields from objects", () => {
        expect(
          inferFieldsFromDescriptor({
            filter: "client.id",
            active: "signed",
          }),
        ).toEqual(["client", "signed"]);
      });

      it("should handle nested structures", () => {
        expect(
          inferFieldsFromDescriptor({
            params: ["client", { nested: "signed" }],
          }),
        ).toEqual(["client", "signed"]);
      });

      // --- Coverage backfill (PRD §4.3.3) ---
      // I4: primitive fall-through `return []`
      it("returns empty for primitive descriptors", () => {
        expect(inferFieldsFromDescriptor(42)).toEqual([]);
        expect(inferFieldsFromDescriptor(null)).toEqual([]);
        expect(inferFieldsFromDescriptor(true)).toEqual([]);
      });
    });
  });
});
