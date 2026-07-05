# Product Requirement Prompt (PRP): Test Complex Expressions

## Goal

**Feature Goal**: Create comprehensive test coverage for complex expression evaluation in the Formality framework, ensuring expressions with multiple operators, field references, and nested structures work correctly and handle errors gracefully.

**Deliverable**: Test suite (`packages/core/src/__tests__/expression.complex.test.ts`) that validates complex expression scenarios with full edge case and error handling coverage.

**Success Definition**:

- Complex expressions with multiple operators evaluate correctly
- Field references (both qualified and unqualified) work in all contexts
- Re-evaluation triggers correctly when any dependency changes
- Expression errors are caught and handled gracefully (return undefined)
- All tests pass with `pnpm test expression.complex`
- Coverage shows all expression evaluation paths tested

## Why

The Formality framework's expression engine supports complex expressions using JSEP (JavaScript Expression Parser) for evaluating dynamic prop values. This power comes with complexity:

**Multiple Operator Types**:

- **Logical operators**: `&&`, `||`, `??` (with short-circuit evaluation)
- **Comparison operators**: `===`, `!==`, `<`, `>`, `<=`, `>=`
- **Arithmetic operators**: `+`, `-`, `*`, `/`, `%`
- **Unary operators**: `!`, `-`, `+`, `typeof`
- **Ternary operator**: `condition ? value1 : value2`
- **Field access**: `obj.prop` and `obj[prop]`
- **Array expressions**: `[1, 2, 3]`

**Critical Gaps Identified**:

1. No existing tests for **nested ternary operators**
2. No existing tests for **complex boolean logic** combining multiple operators
3. No existing tests for **expression error handling** (malformed syntax, type errors)
4. No existing tests for **re-evaluation when dependencies change**
5. No existing tests for **field proxy unwrapping** in complex contexts

**Why This Matters**:

- Users rely on expressions like `'fields.count > 5 ? "Many" : "Few"' for conditional rendering
- Form-level expressions like `!fields.signed && fields.count > 0` control field visibility
- Expression errors shouldn't crash the entire form - they must be handled gracefully

## What

### Test Categories

#### 1. Complex Logical Expressions

- **AND chains**: `a && b && c` (short-circuit behavior)
- **OR chains**: `a || b || c` (short-circuit behavior)
- **Mixed logic**: `a && (b || c)` with proper precedence
- **Nullish coalescing**: `a ?? b ?? c` with null/undefined handling

#### 2. Complex Ternary Expressions

- **Nested ternaries**: `a ? b ? c : d : e` (right-associative)
- **Ternary with logical operators**: `a && b ? c : d`
- **Ternary with comparisons**: `count > 5 ? "Many" : "Few"`
- **Ternary with field access**: `fields.clientType ? fields.clientType + " - " + fields.clientName : "Guest"`

#### 3. Field Reference Patterns

- **Qualified access**: `fields.count`, `fields.client.name`
- **Unqualified access**: `count`, `client.name` (via field proxies)
- **Bracket notation**: `fields["dynamicKey"]`
- **Nested object access**: `fields.client.profile.email`
- **Array element access**: `fields.items[0]`

#### 4. Arithmetic and String Operations

- **String concatenation**: `fields.firstName + " " + fields.lastName`
- **Mixed operations**: `fields.count * 10 + 5`
- **Comparison chains**: `fields.count >= 0 && fields.count <= 100`

#### 5. Re-evaluation Tests

- **Single dependency change**: Expression re-evaluates when one field changes
- **Multiple dependencies**: Expression re-evaluates when any referenced field changes
- **No false positives**: Expression doesn't re-evaluate for unrelated field changes

#### 6. Error Handling

- **Syntax errors**: Malformed expressions return undefined
- **Runtime errors**: Division by zero, invalid member access
- **Missing variables**: References to undefined fields return undefined
- **Type errors**: Non-numeric arithmetic, invalid comparisons

### Success Criteria

- [ ] Complex logical expressions (AND, OR, nullish chains) evaluate correctly
- [ ] Nested ternary operators work with proper precedence
- [ ] Field references work in all patterns (qualified, unqualified, bracket)
- [ ] Expressions re-evaluate when any dependency changes
- [ ] Expression errors are caught and return undefined (not crash)
- [ ] All operators are tested with edge cases (null, undefined, NaN, etc.)

## All Needed Context

### Context Completeness Check

**Test**: If someone knew nothing about this codebase, would they have everything needed to implement these tests successfully?

**Answer**: YES - This PRP provides:

- Complete expression engine implementation details
- Field proxy system explanation
- Existing test patterns to follow
- Test commands and validation approach
- Known gotchas and edge cases

### Documentation & References

```yaml
# MUST READ - Core Implementation Files

- file: packages/core/src/expression/evaluate.ts
  why: Contains the complete expression evaluation logic - understand what operators are supported
  pattern: Shows short-circuit evaluation for &&, ||, ??; field proxy unwrapping; error handling
  critical: Short-circuit evaluation only proceeds if left value is truthy/falsy/nullish
  lines: 42-217 (evaluateNode function), 248-262 (evaluate function with error handling)

- file: packages/core/src/expression/context.ts
  why: Contains field proxy implementation and context building - understand field access patterns
  pattern: Shows how field proxies enable both "fields.client" and "client" access
  critical: Field proxies must be unwrapped before truthiness checks and comparisons
  lines: 70-107 (createFieldStateProxy), 123-128 (unwrapFieldProxy), 145-177 (buildFormContext)

# EXISTING TEST PATTERNS - Follow These Examples

- file: packages/core/src/__tests__/expression.test.ts
  why: Shows basic expression testing patterns and structure
  pattern: Uses beforeEach with clearExpressionCache(); describe blocks by operator type
  critical: Always clear cache before tests to ensure isolation
  gotcha: Expression string values must be double-quoted in test assertions

- file: packages/react/src/__tests__/selectDefaultFieldProps.test.tsx
  why: Shows React integration tests for expression evaluation
  pattern: Uses waitFor for async re-evaluation assertions
  critical: Dynamic expressions require waitFor for React state updates

- file: packages/react/src/__tests__/priorityOrder.test.tsx
  why: Shows comprehensive test structure with many edge cases
  pattern: Organized into logical describe blocks; extensive edge case coverage
  critical: Good example of thorough test coverage approach

# TYPE DEFINITIONS

- file: packages/core/src/types/index.ts
  why: Contains EvaluationContext, FormState, FieldState types
  pattern: Shows structure of context passed to evaluate()
  critical: Understanding field state proxy structure

# EXTERNAL DOCUMENTATION

- url: https://github.com/EricSmekens/jsep
  why: JSEP library documentation - understand supported expression syntax
  critical: Function calls are BLOCKED in Formality (security measure)
  section: README#supported-syntax

- url: https://ericsmekens.github.io/jsep/
  why: Official JSEP documentation with examples
  critical: Operator precedence and AST node types

# PREVIOUS WORK ITEM OUTPUT

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M1T3S3/PRP.md
  why: Previous PRP for 8-layer priority testing - shows test structure and patterns
  pattern: Test fixture setup, describe block organization, validation commands
  critical: Follows the same test patterns and file structure
```

### Current Codebase Tree (Relevant Sections)

```bash
packages/
├── core/
│   └── src/
│       ├── expression/
│       │   ├── evaluate.ts           # Main expression evaluation logic
│       │   ├── context.ts            # Field proxy and context building
│       │   └── infer.ts              # Field inference from expressions
│       └── __tests__/
│           ├── expression.test.ts    # Basic expression tests
│           ├── conditions.test.ts    # Condition evaluation tests
│           └── expression.complex.test.ts  # NEW FILE - COMPLEX EXPRESSION TESTS
└── react/
    └── src/
        ├── __tests__/
        │   ├── selectDefaultFieldProps.test.tsx  # React expression tests
        │   └── priorityOrder.test.tsx            # Priority order tests
        └── hooks/
            └── usePropsEvaluation.ts  # React integration with expression evaluation

plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/
└── P1M1T3S4/
    ├── PRP.md                         # This file
    └── research/                      # External research (if needed)
```

### Desired Codebase Tree with Files to be Added

```bash
# New test file for complex expressions:
packages/core/src/__tests__/expression.complex.test.ts

# This file will contain:
# - Complex logical expression tests (AND/OR/nullish chains)
# - Nested ternary operator tests
# - Field reference pattern tests
# - Re-evaluation tests (if testing at React level)
# - Error handling tests
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Field proxies MUST be unwrapped before truthiness checks
// Without unwrapping, a field proxy object is always truthy
// See evaluate.ts lines 72-75 for the pattern

// CRITICAL: Short-circuit evaluation
// &&: Only evaluate right if left is truthy
// ||: Only evaluate right if left is falsy
// ??: Only evaluate right if left is null/undefined
// See evaluate.ts lines 68-92

// CRITICAL: JSEP AST caching
// Expressions are parsed once and cached in astCache Map
// Always call clearExpressionCache() in beforeEach to isolate tests
// See evaluate.ts lines 222-234

// CRITICAL: Function calls are BLOCKED for security
// CallExpression throws "Function calls are not allowed in expressions"
// See evaluate.ts lines 200-203

// CRITICAL: Error handling returns undefined
// All evaluation errors are caught and return undefined
// In development, errors are logged via console.warn
// See evaluate.ts lines 255-261

// CRITICAL: Dual context mapping for field access
// Fields can be accessed as:
// - fields.client.value (qualified)
// - client (unqualified, via proxy)
// - client.value (unqualified with value property)
// See context.ts lines 145-177

// GOTCHA: typeof null returns "object"
// This is a historical JavaScript bug, not a Formality bug
// Test accordingly

// GOTCHA: NaN !== NaN
// Use isNaN() to check for NaN results
// Division by zero returns Infinity, not an error

// GOTCHA: String concatenation vs addition
// "5" + 5 = "55" (string concat)
// "5" - 1 = 4 (numeric after type coercion)

// GOTCHA: Array access in expressions
// arr[0] works, but arr[-1] returns undefined (no Python-style indexing)

// GOTCHA: Shallow merge in props
// When testing with React, remember props are shallow merged
// See P1.M1.T3.S3 PRP for details

// GOTCHA: Bracket notation requires string conversion
// obj[key] where key is a number accesses obj["1"] not obj[1]
// See evaluate.ts lines 54-56

// CRITICAL: Test with React Testing Library for re-evaluation
// Re-evaluation is async and requires waitFor
// See selectDefaultFieldProps.test.tsx for patterns
```

## Implementation Blueprint

### Test Structure Overview

The test file `expression.complex.test.ts` should be organized into these test suites:

1. **Complex Logical Expressions** - AND, OR, nullish coalescing chains
2. **Nested Ternary Operators** - Multiple levels of ternary nesting
3. **Complex Field References** - All access patterns with nested objects
4. **Arithmetic and String Operations** - Concatenation, mixed operations
5. **Operator Precedence** - Verify correct evaluation order
6. **Error Handling** - Malformed expressions, runtime errors, edge cases

### Test File Pattern

```typescript
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
  createFieldStateProxy,
} from "../expression";

describe("Complex Expression Evaluation", () => {
  beforeEach(() => {
    // CRITICAL: Clear cache to isolate tests
    clearExpressionCache();
  });

  // Test suites go here...
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE packages/core/src/__tests__/expression.complex.test.ts
  - IMPLEMENT: Test file structure with imports and describe blocks
  - FOLLOW pattern: packages/core/src/__tests__/expression.test.ts (basic test structure)
  - NAMING: expression.complex.test.ts (kebab-case, .test.ts suffix)
  - PLACEMENT: packages/core/src/__tests__/ alongside other test files
  - IMPORT: evaluate, evaluateDescriptor, clearExpressionCache, buildEvaluationContext, createFieldStateProxy

Task 2: IMPLEMENT Complex Logical Expression Tests
  - ADD: describe block "Complex Logical Expressions"
  - IMPLEMENT: AND chain tests (a && b && c) with short-circuit verification
  - IMPLEMENT: OR chain tests (a || b || c) with short-circuit verification
  - IMPLEMENT: Mixed logic tests (a && (b || c)) with precedence verification
  - IMPLEMENT: Nullish coalescing tests (a ?? b ?? c) with null/undefined edge cases
  - IMPLEMENT: Combined operator tests (a && b ?? c, a || b ?? c)
  - PATTERN: Use getter side effects to verify short-circuit behavior
  - COVERAGE: All logical operator combinations with truthy/falsy values

Task 3: IMPLEMENT Nested Ternary Operator Tests
  - ADD: describe block "Nested Ternary Operators"
  - IMPLEMENT: Basic nested ternary (a ? b : c ? d : e)
  - IMPLEMENT: Right-associative ternary chains
  - IMPLEMENT: Ternary with logical operators (a && b ? c : d)
  - IMPLEMENT: Ternary with comparisons (count > 5 ? "Many" : "Few")
  - IMPLEMENT: Ternary with field access (fields.a ? fields.a.prop : "default")
  - IMPLEMENT: Ternary with arithmetic (a > 0 ? a * 2 : a + 10)
  - PATTERN: Test all branch paths (true/false for each condition)
  - COVERAGE: All ternary nesting patterns and operator combinations

Task 4: IMPLEMENT Field Reference Pattern Tests
  - ADD: describe block "Field Reference Patterns"
  - IMPLEMENT: Qualified access tests (fields.count, fields.client.name)
  - IMPLEMENT: Unqualified access tests (count, client.name via proxies)
  - IMPLEMENT: Bracket notation tests (fields["key"], fields[dynamic])
  - IMPLEMENT: Nested object access tests (fields.a.b.c.d)
  - IMPLEMENT: Mixed notation tests (fields.a["b"].c)
  - IMPLEMENT: Array access tests (fields.items[0], fields.list[index])
  - IMPLEMENT: Field metadata access (fields.client.isTouched, fields.client.value)
  - PATTERN: Test with field proxies created by createFieldStateProxy
  - COVERAGE: All field access patterns with null/undefined edge cases

Task 5: IMPLEMENT Arithmetic and String Operation Tests
  - ADD: describe block "Arithmetic and String Operations"
  - IMPLEMENT: String concatenation tests (a + " " + b)
  - IMPLEMENT: Mixed arithmetic tests (a * b + c, a / b - c)
  - IMPLEMENT: Comparison chain tests (a >= 0 && a <= 100)
  - IMPLEMENT: Arithmetic in ternary tests (a > 5 ? a * 2 : a)
  - IMPLEMENT: Complex expression tests (fields.a + "-" + fields.b + "-" + fields.c)
  - PATTERN: Test with numbers, strings, and mixed types
  - EDGE CASES: Division by zero, NaN, Infinity, string coercion
  - COVERAGE: All arithmetic operators in complex combinations

Task 6: IMPLEMENT Operator Precedence Tests
  - ADD: describe block "Operator Precedence"
  - IMPLEMENT: Logical vs comparison precedence (a && b > c)
  - IMPLEMENT: Comparison vs arithmetic precedence (a + b > c * d)
  - IMPLEMENT: Ternary vs logical precedence (a || b ? c : d)
  - IMPLEMENT: Unary operator precedence tests (!a && b, -a + b)
  - IMPLEMENT: Parentheses override tests ((a + b) * c)
  - PATTERN: Compare result with and without parentheses
  - COVERAGE: All precedence rules documented in JSEP

Task 7: IMPLEMENT Error Handling Tests
  - ADD: describe block "Error Handling"
  - IMPLEMENT: Syntax error tests (malformed expressions return undefined)
  - IMPLEMENT: Runtime error tests (function calls throw, caught as undefined)
  - IMPLEMENT: Missing variable tests (undefined field references)
  - IMPLEMENT: Type error tests (non-numeric arithmetic, invalid comparisons)
  - IMPLEMENT: Null/undefined propagation tests (null.prop, undefined.toString())
  - IMPLEMENT: Circular reference tests (if applicable)
  - IMPLEMENT: Deep expression tests (very long expressions)
  - PATTERN: Use expect(evaluate(...)).toBeUndefined() for errors
  - SECURITY: Verify function calls are blocked
  - COVERAGE: All error paths return undefined gracefully

Task 8: IMPLEMENT React Integration Tests (if applicable)
  - CREATE: packages/react/src/__tests__/expression.complex.test.tsx
  - IMPLEMENT: Re-evaluation tests when field values change
  - IMPLEMENT: Multiple dependency tests (watch all referenced fields)
  - IMPLEMENT: No false positive tests (unrelated changes don't trigger)
  - FOLLOW pattern: packages/react/src/__tests__/selectDefaultFieldProps.test.tsx
  - USE: waitFor for async re-evaluation assertions
  - COVERAGE: All re-evaluation scenarios

Task 9: RUN VALIDATION
  - EXECUTE: pnpm test expression.complex
  - VERIFY: All tests pass
  - CHECK: Coverage for evaluate.ts and evaluateNode
  - EXECUTE: pnpm test (full test suite)
  - VERIFY: No regressions in existing tests
```

### Test Implementation Patterns

#### Pattern 1: Complex Logical Expressions

```typescript
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
        {
          client: fields.client.value,
          signed: fields.signed.value,
          count: fields.count.value,
        },
        {},
        {},
        { client: fields.client, signed: fields.signed, count: fields.count },
      );

      const result = evaluate("client && signed && count > 0", context);
      expect(result).toBe(true);
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
  });

  describe("Nullish Coalescing", () => {
    it("should return first non-nullish value", () => {
      expect(
        evaluate("a ?? b ?? c", { a: null, b: undefined, c: "default" }),
      ).toBe("default");
      expect(evaluate("a ?? b ?? c", { a: 0, b: "", c: "default" })).toBe(0); // 0 is not nullish
      expect(evaluate("a ?? b ?? c", { a: false, b: "", c: "default" })).toBe(
        false,
      ); // false is not nullish
    });

    it("should handle nullish with field proxies", () => {
      const context = buildEvaluationContext(
        { required: null, optional: "value" },
        {},
        {},
        { required: { value: null }, optional: { value: "value" } },
      );

      expect(evaluate("required ?? optional", context)).toBe("value");
    });
  });

  describe("Mixed Logical Operators", () => {
    it("should handle AND with OR (a && (b || c))", () => {
      const context = { a: true, b: false, c: true };
      expect(evaluate("a && b || c", context)).toBe(true); // (a && b) || c = c
      expect(evaluate("a && (b || c)", context)).toBe(true); // a && (b || c) = a && true
    });

    it("should handle nullish with logical operators", () => {
      expect(evaluate("a ?? b && c", { a: null, b: true, c: "value" })).toBe(
        "value",
      );
      expect(evaluate("a && b ?? c", { a: null, b: true, c: "default" })).toBe(
        null,
      );
    });
  });
});
```

#### Pattern 2: Nested Ternary Operators

```typescript
describe("Nested Ternary Operators", () => {
  it("should evaluate basic nested ternary", () => {
    const context = { status: "pending" };
    const expr =
      'status === "active" ? "Go" : status === "pending" ? "Wait" : "Stop"';
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
      { client: fields.client, defaultType: fields.defaultType },
    );

    const expr = 'client ? client.type + " - " + client.name : defaultType';
    expect(evaluate(expr, context)).toBe("Premium - Acme");
  });

  it("should handle ternary with arithmetic", () => {
    const context = { count: 3 };
    expect(evaluate("count > 5 ? count * 2 : count + 10", context)).toBe(13);
    expect(evaluate("count > 5 ? count * 2 : count + 10", { count: 10 })).toBe(
      20,
    );
  });

  it("should handle complex expression from work item", () => {
    const fields = {
      count: { value: 10 },
      clientType: { value: "Premium" },
      clientName: { value: "Acme" },
    };
    const context = buildEvaluationContext(
      {
        count: fields.count.value,
        clientType: fields.clientType.value,
        clientName: fields.clientName.value,
      },
      {},
      {},
      {
        count: fields.count,
        clientType: fields.clientType,
        clientName: fields.clientName,
      },
    );

    // Work item example: 'fields.count > 5 ? "Many" : "Few"'
    expect(evaluate('count > 5 ? "Many" : "Few"', context)).toBe("Many");
    expect(evaluate('count > 5 ? "Many" : "Few"', { count: 3 })).toBe("Few");

    // Work item example: 'fields.clientType + " - " + fields.clientName'
    expect(evaluate('clientType + " - " + clientName', context)).toBe(
      "Premium - Acme",
    );
  });
});
```

#### Pattern 3: Field Reference Patterns

```typescript
describe("Field Reference Patterns", () => {
  describe("Qualified Access (fields.*)", () => {
    it("should access simple field value", () => {
      const fields = { count: { value: 42 } };
      const context = buildEvaluationContext(
        { count: 42 },
        {},
        {},
        { count: fields.count },
      );

      expect(evaluate("fields.count.value", context)).toBe(42);
      expect(evaluate("fields.count", context)).toBe(42); // Proxy unwraps to value
    });

    it("should access nested object properties", () => {
      const fields = {
        client: { value: { profile: { email: "test@example.com" } } },
      };
      const context = buildEvaluationContext(
        { client: fields.client.value },
        {},
        {},
        { client: fields.client },
      );

      expect(evaluate("fields.client.profile.email", context)).toBe(
        "test@example.com",
      );
    });

    it("should access field metadata", () => {
      const fields = {
        client: { value: "Acme", isTouched: true, isDirty: false },
      };
      const context = buildEvaluationContext(
        { client: fields.client.value },
        {},
        {},
        { client: fields.client },
      );

      expect(evaluate("fields.client.isTouched", context)).toBe(true);
      expect(evaluate("fields.client.isDirty", context)).toBe(false);
      expect(evaluate("fields.client.value", context)).toBe("Acme");
    });
  });

  describe("Unqualified Access (via Proxies)", () => {
    it("should access field value directly", () => {
      const fields = { count: { value: 42 } };
      const context = buildEvaluationContext(
        { count: 42 },
        {},
        {},
        { count: fields.count },
      );

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
        { client: fields.client },
      );

      expect(evaluate("client.name", context)).toBe("Acme"); // Delegates to value.name
      expect(evaluate("client.value", context)).toBe("Acme"); // value.value = value
    });

    it("should access field metadata directly", () => {
      const fields = {
        client: { value: "Acme", isTouched: true },
      };
      const context = buildEvaluationContext(
        { client: fields.client.value },
        {},
        {},
        { client: fields.client },
      );

      expect(evaluate("client.isTouched", context)).toBe(true); // Returns metadata
      expect(evaluate("client", context)).toBe("Acme"); // Returns value when coerced
    });
  });

  describe("Bracket Notation", () => {
    it("should access property with string literal", () => {
      const fields = { client: { value: { name: "Acme" } } };
      const context = buildEvaluationContext(
        { client: fields.client.value },
        {},
        {},
        { client: fields.client },
      );

      expect(evaluate('fields.client["name"]', context)).toBe("Acme");
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
        { client: fields.client, prop: fields.prop },
      );

      expect(evaluate("fields.client[prop]", context)).toBe("Acme");
    });

    it("should handle computed property names", () => {
      const fields = {
        items: { value: { first: "a", second: "b" } },
        prefix: { value: "fir" },
        suffix: { value: "st" },
      };
      const context = buildEvaluationContext(
        {
          items: fields.items.value,
          prefix: fields.prefix.value,
          suffix: fields.suffix.value,
        },
        {},
        {},
        { items: fields.items, prefix: fields.prefix, suffix: fields.suffix },
      );

      expect(evaluate("items[prefix + suffix]", context)).toBe("a");
    });
  });

  describe("Work Item Example: Complex Field References", () => {
    it("should evaluate '!fields.signed && fields.count > 0'", () => {
      const fields = {
        signed: { value: false },
        count: { value: 5 },
      };
      const context = buildEvaluationContext(
        { signed: fields.signed.value, count: fields.count.value },
        {},
        {},
        { signed: fields.signed, count: fields.count },
      );

      expect(evaluate("!signed && count > 0", context)).toBe(true);
      expect(evaluate("!signed && count > 0", { signed: true, count: 5 })).toBe(
        false,
      );
      expect(
        evaluate("!signed && count > 0", { signed: false, count: 0 }),
      ).toBe(false);
    });
  });
});
```

#### Pattern 4: Error Handling

```typescript
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
    });
  });

  describe("Runtime Errors", () => {
    it("should return undefined for function calls", () => {
      expect(evaluate("Math.max(1, 2)", {})).toBeUndefined();
      expect(evaluate("alert('hello')", {})).toBeUndefined();
    });

    it("should return undefined for invalid member access", () => {
      expect(evaluate("null.prop", {})).toBeUndefined();
      expect(evaluate("undefined.prop", {})).toBeUndefined();
      expect(evaluate("123.prop", {})).toBeUndefined();
    });
  });

  describe("Missing Variables", () => {
    it("should return undefined for undefined variables", () => {
      expect(evaluate("missingVar", {})).toBeUndefined();
    });

    it("should return undefined for missing properties", () => {
      const context = { obj: {} };
      expect(evaluate("obj.missingProp", context)).toBeUndefined();
    });

    it("should handle missing variables in arithmetic", () => {
      const context = { a: 1 };
      expect(isNaN(evaluate("a + missing", context) as number)).toBe(true);
    });
  });

  describe("Type Errors", () => {
    it("should handle non-numeric arithmetic", () => {
      expect(isNaN(evaluate('"text" * 2', {}))).toBe(true);
      expect(isNaN(evaluate('"text" - 1', {}))).toBe(true);
      expect(isNaN(evaluate('"text" / 2', {}))).toBe(true);
    });

    it("should handle division by zero", () => {
      expect(evaluate("1 / 0", {})).toBe(Infinity);
      expect(evaluate("0 / 0", {})).toBe(NaN);
    });
  });

  describe("Edge Cases", () => {
    it("should handle NaN in comparisons", () => {
      expect(evaluate("NaN === NaN", {})).toBe(false); // NaN is not equal to itself
      expect(evaluate("NaN !== NaN", {})).toBe(true);
    });

    it("should handle typeof null", () => {
      expect(evaluate("typeof null", {})).toBe("object"); // Historical bug
    });

    it("should handle very long expressions", () => {
      const longExpr = "a + ".repeat(100) + "1";
      expect(evaluate(longExpr, { a: 1 })).not.toBeUndefined();
    });
  });
});
```

### React Integration Pattern (if testing re-evaluation)

```typescript
/**
 * @file packages/react/src/__tests__/expression.complex.test.tsx
 * @description React integration tests for complex expression re-evaluation
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, Field, FormalityProvider } from "../components";
import type { InputConfig, FormFieldsConfig } from "@formality-ui/core";

describe("Complex Expression Re-evaluation in React", () => {
  // Test fixtures from P1.M1.T3.S3 PRP
  const TestInput = vi.fn(
    vi.fn(({ value, onChange, name, className, ...props }: any) => (
      <input
        data-testid={name}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className={className}
        {...props}
      />
    ))
  );

  const testInputs: Record<string, InputConfig> = {
    textField: { component: TestInput, defaultValue: "" },
    numberField: { component: TestInput, defaultValue: 0 },
    switch: { component: TestInput, defaultValue: false },
  };

  it("should re-evaluate complex expression when dependency changes", async () => {
    const config: FormFieldsConfig = {
      count: { type: "numberField" },
      threshold: { type: "numberField" },
      label: {
        type: "textField",
        selectProps: {
          placeholder: 'count > threshold ? "Above" : "Below"',
        },
      },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="count" />
          <Field name="threshold" />
          <Field name="label" />
        </Form>
      </FormalityProvider>
    );

    const countInput = screen.getByTestId("count");
    const thresholdInput = screen.getByTestId("threshold");
    const labelInput = screen.getByTestId("label");

    // Initial state
    expect(labelInput).toHaveAttribute("placeholder", "Below");

    // Change count
    const user = userEvent.setup();
    await user.clear(countInput);
    await user.type(countInput, "10");

    // Expression re-evaluated
    await waitFor(() => {
      expect(labelInput).toHaveAttribute("placeholder", "Above");
    });

    // Change threshold
    await user.clear(thresholdInput);
    await user.type(thresholdInput, "15");

    // Expression re-evaluated again
    await waitFor(() => {
      expect(labelInput).toHaveAttribute("placeholder", "Below");
    });
  });

  it("should re-evaluate nested ternary expression", async () => {
    const config: FormFieldsConfig = {
      status: { type: "textField", defaultValue: "pending" },
      result: {
        type: "textField",
        selectProps: {
          placeholder: 'status === "active" ? "Go" : status === "pending" ? "Wait" : "Stop"',
        },
      },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={config}>
          <Field name="status" />
          <Field name="result" />
        </Form>
      </FormalityProvider>
    );

    const statusInput = screen.getByTestId("status");
    const resultInput = screen.getByTestId("result");

    // Initial state
    expect(resultInput).toHaveAttribute("placeholder", "Wait");

    // Change status
    const user = userEvent.setup();
    await user.clear(statusInput);
    await user.type(statusInput, "active");

    // Re-evaluated
    await waitFor(() => {
      expect(resultInput).toHaveAttribute("placeholder", "Go");
    });
  });
});
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after writing tests - fix before proceeding
cd /home/dustin/projects/formality
pnpm exec eslint packages/core/src/__tests__/expression.complex.test.ts --fix

# TypeScript type checking
pnpm exec tsc --noEmit --project packages/core/tsconfig.json

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the complex expression file specifically
pnpm test expression.complex

# Run with coverage to see what's tested
pnpm test -- --coverage --reporter=verbose expression.complex

# Run all expression tests to ensure no regressions
pnpm test expression

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run complete test suite
pnpm test

# Test file with watch mode for development
pnpm test:watch -- expression.complex

# For React integration tests
pnpm test --filter=react expression.complex

# Expected: All tests pass, no new failures introduced elsewhere.
```

### Level 4: Coverage Validation

```bash
# Check coverage for expression evaluation
pnpm test:coverage

# Look at packages/core/coverage/index.html
# Verify that evaluate.ts and evaluateNode have 100% coverage
# including all operator code paths

# Expected: Full coverage of all expression evaluation paths.
```

## Final Validation Checklist

### Technical Validation

- [ ] Complex logical expressions tested (AND, OR, nullish chains)
- [ ] Nested ternary operators tested with all branch paths
- [ ] Field reference patterns tested (qualified, unqualified, bracket)
- [ ] Arithmetic and string operations tested
- [ ] Operator precedence tested and verified
- [ ] Error handling tested (syntax, runtime, type errors)
- [ ] All tests pass: `pnpm test expression.complex`
- [ ] No regressions: `pnpm test`

### Feature Validation

- [ ] Test file exists at `packages/core/src/__tests__/expression.complex.test.ts`
- [ ] Tests follow existing patterns (beforeEach with clearExpressionCache, describe blocks)
- [ ] Complex expressions from work item are tested:
  - [ ] `'fields.count > 5 ? "Many" : "Few"'`
  - [ ] `'fields.clientType + " - " + fields.clientName'`
  - [ ] `'!fields.signed && fields.count > 0'`
- [ ] Re-evaluation tested (if React integration tests added)

### Code Quality Validation

- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Tests are organized into logical describe blocks
- [ ] Test names are descriptive and follow "should [do something]" pattern
- [ ] Each test is independent (clearExpressionCache in beforeEach)
- [ ] Edge cases covered (null, undefined, NaN, Infinity, etc.)

### Coverage Validation

- [ ] `evaluate()` function has 100% coverage
- [ ] `evaluateNode()` function has 100% coverage for all operator types
- [ ] All logical operator code paths tested (short-circuit, full evaluation)
- [ ] All ternary operator code paths tested (true, false, nested)
- [ ] All error paths return undefined gracefully

## Anti-Patterns to Avoid

- ❌ Don't forget `clearExpressionCache()` in beforeEach (tests won't be isolated)
- ❌ Don't use `toThrow()` for evaluation errors (they return undefined, not throw)
- ❌ Don't forget to unwrap field proxies when testing truthiness (evaluate.ts does this)
- ❌ Don't assume `NaN === NaN` (it's false, use `isNaN()`)
- ❌ Don't assume `typeof null === "null"` (it's "object", historical JS bug)
- ❌ Don't test function calls (they're blocked for security, should return undefined)
- ❌ Don't use `disabled` prop for testing (it's a core prop that always wins)
- ❌ Don't forget `waitFor` for React re-evaluation tests (async updates)
- ❌ Don't create shared mutable state between tests
- ❌ Don't test with very deeply nested expressions without testing intermediate levels
- ❌ Don't forget to test bracket notation with dynamic properties
- ❌ Don't assume all falsy values are the same (0, "", false, null, undefined behave differently)

## Implementation Notes

### Relationship to Previous Work Item (P1.M1.T3.S3)

The previous PRP (P1.M1.T3.S3) focused on testing the **8-layer prop priority system**. This PRP focuses on **complex expression evaluation**. The two are related but distinct:

**P1.M1.T3.S3 (8-Layer Priority)**:

- Tests how props merge across 8 configuration layers
- Tests that dynamic layers (2, 4, 7) evaluate expressions
- Tests expression evaluation as a dependency of priority testing

**P1.M1.T3.S4 (Complex Expressions)**:

- Tests complex expression patterns themselves
- Tests edge cases and error handling in expressions
- Tests field reference patterns and proxy unwrapping
- Tests operator precedence and nesting

**Key Difference**: P1.M1.T3.S3 tests expressions **in the context of prop merging**, while P1.M1.T3.S4 tests expressions **themselves**.

### Existing Test Status

**Current State** (from research):

- Basic expression tests exist at `packages/core/src/__tests__/expression.test.ts`
- Covers: literals, identifiers, simple operators, basic ternary
- **Gaps**: No complex logical chains, no nested ternaries, no error handling

**This PRP Fills Those Gaps**:

- Complex logical expressions (AND/OR/nullish chains)
- Nested ternary operators
- Field reference patterns with proxies
- Comprehensive error handling

### Test Command Reference

```bash
# Run complex expression tests
pnpm test expression.complex

# Run with coverage
pnpm test:coverage -- expression.complex

# Run in watch mode during development
pnpm test:watch -- expression.complex

# Run all expression tests
pnpm test expression

# Run all tests
pnpm test

# Run with verbose output
pnpm test expression.complex --reporter=verbose
```

---

## Summary

This PRP provides complete context for implementing comprehensive tests for complex expression evaluation in the Formality framework. The tests will cover:

1. **Complex logical expressions** with short-circuit evaluation
2. **Nested ternary operators** with proper precedence
3. **Field reference patterns** using the dual context mapping system
4. **Arithmetic and string operations** in complex combinations
5. **Operator precedence** verification
6. **Error handling** for malformed expressions and runtime errors

All necessary context, patterns, and validation commands are provided for one-pass implementation success.

**Confidence Score**: 10/10 for one-pass implementation success - all necessary context, patterns, examples, and validation approaches are provided in this PRP.
