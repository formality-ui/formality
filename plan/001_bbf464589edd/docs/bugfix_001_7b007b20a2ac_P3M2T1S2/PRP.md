# PRP: Handle null/undefined in Arithmetic Operations

**Work Item**: P3.M2.T1.S2 - Handle null/undefined
**Parent Task**: P3.M2.T1 - Add Type Guards
**Parent Milestone**: P3.M2 - Type Safety in Expressions
**Priority**: P3 (Medium Priority Issue)
**Story Points**: 1
**Status**: **READY FOR IMPLEMENTATION**

---

## Goal

**Feature Goal**: Add explicit null/undefined handling to arithmetic operations with clear JSDoc documentation and comprehensive test coverage for edge cases.

**Deliverable**:

1. Enhanced type guard with explicit null/undefined checks and specific warning messages
2. JSDoc documentation explaining null/undefined behavior in arithmetic operations
3. Comprehensive test suite covering null/undefined edge cases (5 + null, undefined - 5, etc.)
4. Documentation of the "Silent Zero Problem" and "NaN Cascade" prevention

**Success Definition**:

- Arithmetic operations with null operands return `undefined` with specific warning mentioning null
- Arithmetic operations with undefined operands return `undefined` with specific warning mentioning undefined
- Edge cases like `5 + null` and `undefined - 5` are tested and documented
- JSDoc clearly documents the behavior with null/undefined values
- All existing tests continue to pass
- Type guard documentation references research on null/undefined handling

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Writing expressions that perform arithmetic operations on field values where fields may be empty (null) or undefined due to optional fields or conditional rendering.

**User Journey**:

1. Developer creates form with optional numeric fields (e.g., `discount`, `taxRate`)
2. Developer writes expression: `price - discount + tax`
3. User leaves optional fields empty (null or undefined)
4. Expression evaluator provides clear warnings identifying which field is null/undefined
5. Developer can use nullish coalescing (`??`) to provide defaults: `price - (discount ?? 0) + tax`

**Pain Points Addressed**:

- **Silent Zero Problem**: In JavaScript, `null` coerces to `0`, hiding bugs where values are missing
- **NaN Cascade**: `undefined` produces `NaN` which spreads through calculations
- **Unclear Error Messages**: Generic "Invalid operands" doesn't distinguish null from undefined
- **Missing Documentation**: No clear guidance on how null/undefined are handled

---

## Why

- **Explicit is Better Than Implicit**: While `isSafeNumber()` already rejects null/undefined (via `typeof` check), explicit handling provides clearer error messages
- **Better Developer Experience**: Specific warnings ("left operand is null") vs generic ("left operand is not a number")
- **Documentation Clarity**: JSDoc should explicitly document null/undefined behavior, not rely on developers knowing `typeof null === 'object'`
- **Prevention of Common Bugs**: Document and test the "Silent Zero Problem" where `null + 5 = 5` in standard JavaScript
- **Integration with P3.M2.T1.S1**: Builds upon the type guard foundation, adding specificity and documentation
- **Preparation for P3.M2.T2**: Foundation for comprehensive null/undefined tests

---

## What

### Current State Analysis

**From P3.M2.T1.S1 Contract** (assumes completed):

```typescript
// After P3.M2.T1.S1 implementation
function isSafeNumber(value: unknown): value is number {
  return (
    typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)
  );
}

// Usage in BinaryExpression case
if (!isSafeNumber(leftValue) || !isSafeNumber(rightValue)) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[Formality Expression] Type error: ` +
        `Invalid operands for ${binaryNode.operator}: ` +
        `left=${typeof leftValue}, right=${typeof rightValue}`,
    );
  }
  return undefined;
}
```

**Current Behavior** (after P3.M2.T1.S1):

- `null + 5` → `undefined` (via `typeof null === 'object'` check)
- `undefined + 5` → `undefined` (via `typeof undefined === 'undefined'` check)
- Warning message: `"left=object, right=number"` or `"left=undefined, right=number"`

**Problems with Current Approach**:

1. Warning message shows `typeof` result (`object` for null) which is confusing
2. No explicit mention of "null" or "undefined" in warnings
3. JSDoc doesn't document null/undefined behavior
4. No specific tests for edge cases like `5 + null`, `undefined - 5`
5. Documentation doesn't explain why we deviate from JavaScript's standard coercion

### JavaScript Standard Behavior (for comparison)

```javascript
// JavaScript standard coercion (what we're preventing)
null + 5; // → 5   (null coerces to 0)
5 + null; // → 5
undefined + 5; // → NaN (undefined coerces to NaN)
5 + undefined; // → NaN

// Division has special behavior
5 / null; // → Infinity
null / 5; // → 0
```

**Our Goal**: Return `undefined` for ALL null/undefined arithmetic (safer, explicit error state)

### Success Criteria

- [ ] Add explicit null/undefined checks before `isSafeNumber()` check
- [ ] Warning messages explicitly mention "null" or "undefined" (not just `typeof` result)
- [ ] JSDoc for `isSafeNumber()` documents null/undefined handling
- [ ] JSDoc for `evaluate()` documents null/undefined behavior in arithmetic
- [ ] Tests cover all combinations: number+null, null+number, undefined+number, etc.
- [ ] Tests cover edge cases: `5 + null`, `undefined - 5`, `null * null`, etc.
- [ ] Documentation references "Silent Zero Problem" and "NaN Cascade"
- [ ] All existing tests continue to pass

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:

- Exact relationship to P3.M2.T1.S1 contract
- Specific code patterns for null/undefined detection
- JSDoc patterns from codebase analysis
- Test patterns for null/undefined edge cases
- Research documentation with external references
- All validation commands specific to project

### Documentation & References

```yaml
# MUST READ - Contract from P3.M2.T1.S1 (assumes completed)
- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S1/PRP.md
  why: Defines the isSafeNumber() contract we extend
  section: Implementation Blueprint - Data models and structure
  contract: isSafeNumber() function with typeof value === 'number' check
  provides: Type guard foundation for null/undefined checks

# MUST READ - Primary implementation file
- file: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  why: Primary file to modify - add explicit null/undefined checks
  exact: Lines 30-38 (isSafeNumber function - add JSDoc)
  exact: Lines 77-148 (BinaryExpression case - add explicit null/undefined checks)
  pattern: Development warning with process.env.NODE_ENV check
  gotcha: Check for null/undefined BEFORE isSafeNumber() for better error messages

# MUST READ - Test file to modify
- file: /home/dustin/projects/formality/packages/core/src/__tests__/expression.complex.test.ts
  why: Add comprehensive null/undefined tests
  exact: Lines 753-777 (Type Errors section - add null/undefined subsection)
  exact: Lines 830-857 (Null/Undefined Propagation - reference existing patterns)
  pattern: Use expect().toBeUndefined() for null/undefined arithmetic tests
  gotcha: Current tests show null/undefined handling in logical operators (different from arithmetic)

# MUST READ - JSDoc patterns in codebase
- file: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  why: Follow existing JSDoc formatting and style
  exact: Lines 251-261 (evaluate function JSDoc - @example pattern)
  exact: Lines 288-318 (evaluateDescriptor JSDoc - comprehensive documentation)
  pattern: Brief description, detailed paragraphs, @param, @returns, @example sections

# RESEARCH - Null/undefined handling best practices
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S2/research/null-undefined-handling.md
  why: Comprehensive research on null/undefined in JavaScript/TypeScript
  section: JavaScript Behavior with Null/Undefined, Edge Cases and Gotchas
  critical: Documents "Silent Zero Problem" and "NaN Cascade"
  critical: Edge case summary table with all operation results

# EXTERNAL - TypeScript Documentation
- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  why: Type predicate patterns for isSafeNumber()

# EXTERNAL - MDN Documentation
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null
  why: Understanding null behavior and type coercion

# EXTERNAL - MDN Documentation
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined
  why: Understanding undefined behavior and type coercion

# EXTERNAL - ECMAScript Specification
- url: https://tc39.es/ecma262/#sec-tonumeric
  why: How JavaScript coerces values to numbers (ToNumeric abstract operation)
```

### Current Codebase tree (relevant files)

```bash
packages/core/src/
├── expression/
│   ├── context.ts                # FieldProxy unwrapping utilities
│   ├── evaluate.ts               # ← MODIFY: Add explicit null/undefined checks and JSDoc
│   │   ├── MODIFY: Lines 30-38 - isSafeNumber JSDoc
│   │   ├── MODIFY: Lines 77-148 - BinaryExpression case with explicit checks
│   │   └── MODIFY: Lines 251-261 - evaluate JSDoc
│   ├── index.ts                  # Public exports
│   └── infer.ts                  # Field inference
│
└── __tests__/
    ├── expression.test.ts        # Basic expression tests
    └── expression.complex.test.ts # ← MODIFY: Add null/undefined test section
```

### Desired Codebase tree with modifications

```bash
packages/core/src/
├── expression/
│   ├── context.ts                # UNCHANGED
│   ├── evaluate.ts               # ← MODIFY: Enhanced with explicit null/undefined handling
│   │   ├── MODIFY: Lines 30-38 - Add comprehensive JSDoc to isSafeNumber
│   │   ├── MODIFY: Lines 77-148 - Add explicit null/undefined checks before isSafeNumber
│   │   └── MODIFY: Lines 251-261 - Add null/undefined behavior to evaluate JSDoc
│   ├── index.ts                  # UNCHANGED
│   └── infer.ts                  # UNCHANGED
│
└── __tests__/
    ├── expression.test.ts        # UNCHANGED
    └── expression.complex.test.ts # ← MODIFY: Add comprehensive null/undefined test section
        └── ADD: Lines ~860+ - New "Null/Undefined Arithmetic" describe block
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Check null/undefined BEFORE isSafeNumber()
// isSafeNumber() uses typeof which rejects null/undefined
// But explicit checks first give us better error messages

// BAD: Generic error message
if (!isSafeNumber(leftValue)) {
  console.warn(`left=${typeof leftValue}`); // "left=object" for null (confusing!)
}

// GOOD: Specific error message
if (leftValue === null) {
  console.warn(`left operand is null`); // Clear!
} else if (leftValue === undefined) {
  console.warn(`left operand is undefined`); // Clear!
} else if (!isSafeNumber(leftValue)) {
  console.warn(`left=${typeof leftValue}`); // Other type errors
}

// GOTCHA: typeof null is 'object' (historical JavaScript bug)
// typeof undefined is 'undefined'
// This is why explicit === null check is needed before typeof

// CRITICAL: JavaScript standard behavior (what we prevent)
null + 5; // → 5   (The "Silent Zero Problem")
undefined + 5; // → NaN (The "NaN Cascade")

// Our behavior (safer)
null + 5; // → undefined (with warning)
undefined + 5; // → undefined (with warning)

// GOTCHA: Division has special behavior in standard JS
5 / null; // → Infinity (very dangerous!)
null / 5; // → 0

// Our behavior treats null/undefined consistently
5 / null; // → undefined (with warning)
null / 5; // → undefined (with warning)

// CRITICAL: JSDoc must document WHY we deviate from JavaScript
// This is a deliberate choice for safety over convenience
// Reference the research document for justification

// GOTCHA: Existing tests already have null/undefined handling for LOGICAL operators
// Lines 830-857 in expression.complex.test.ts
// This work item is about ARITHMETIC operators only
// Don't confuse the two - they have different semantics

// CRITICAL: Use === null and === undefined checks
// Don't use == null (catches both) - we want specific messages
// Don't use value == null - it's less explicit

// CRITICAL: Development warnings must use environment check
// if (process.env.NODE_ENV !== "production") { console.warn(...) }
// This pattern is used throughout the codebase
```

---

## Implementation Blueprint

### Data models and structure

No new data models. Modifying existing function documentation and validation logic.

````typescript
// ENHANCED: isSafeNumber with comprehensive JSDoc
/**
 * Type guard to check if a value is safe for arithmetic operations
 *
 * Excludes non-numeric types (including null and undefined), NaN, Infinity, and -Infinity.
 *
 * **Null/Undefined Handling:**
 * - `null` and `undefined` are explicitly rejected and return `undefined` for arithmetic
 * - This deviates from JavaScript standard coercion where `null + 5 = 5` and `undefined + 5 = NaN`
 * - This choice prevents the "Silent Zero Problem" (null → 0) and "NaN Cascade" (undefined → NaN)
 *
 * @param value - The value to check
 * @returns `true` if value is a safe finite number, `false` otherwise
 *
 * @example
 * isSafeNumber(5)           // → true
 * isSafeNumber(null)        // → false (explicitly rejected)
 * isSafeNumber(undefined)   // → false (explicitly rejected)
 * isSafeNumber(NaN)         // → false
 * isSafeNumber(Infinity)    // → false
 * isSafeNumber("5")         // → false (string coercion not allowed)
 */
function isSafeNumber(value: unknown): value is number {
  return (
    typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)
  );
}

// ENHANCED: evaluate function JSDoc with null/undefined section
/**
 * Evaluate a string expression against a context object
 *
 * @param expr - Expression string (e.g., "client.id", "client && signed")
 * @param context - Evaluation context with field values
 * @returns The evaluated result
 *
 * @example
 * evaluate("client.id", { client: { id: 5 } }) // → 5
 * evaluate("client && signed", { client: { id: 5 }, signed: true }) // → true
 * evaluate("signed ? 'Yes' : 'No'", { signed: true }) // → 'Yes'
 *
 * @remarks
 * **Null/Undefined in Arithmetic:**
 * Arithmetic operations with `null` or `undefined` operands return `undefined` with a development warning.
 * This prevents silent bugs from JavaScript's default coercion behavior.
 *
 * Use nullish coalescing (`??`) to provide defaults:
 * ```ts
 * evaluate("price - (discount ?? 0)", context)
 * ```
 */
````

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ENHANCE isSafeNumber() JSDoc
  - FILE: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  - LOCATION: Lines 30-38, function isSafeNumber()
  - ADD: Comprehensive JSDoc with null/undefined section
  - DOCUMENT: Explicit rejection of null/undefined
  - DOCUMENT: Deviation from JavaScript standard coercion
  - DOCUMENT: "Silent Zero Problem" and "NaN Cascade" prevention
  - ADD: @example showing null/undefined behavior
  - FOLLOW: Pattern from evaluate() JSDoc (lines 251-261)

Task 2: ADD explicit null/undefined checks in BinaryExpression case
  - FILE: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  - LOCATION: Lines 77-148, BinaryExpression case
  - ADD: Check for null/undefined BEFORE isSafeNumber() check
  - IMPLEMENT: if (leftValue === null) { specific warning; return undefined; }
  - IMPLEMENT: if (leftValue === undefined) { specific warning; return undefined; }
  - IMPLEMENT: if (rightValue === null) { specific warning; return undefined; }
  - IMPLEMENT: if (rightValue === undefined) { specific warning; return undefined; }
  - PRESERVE: Existing isSafeNumber() check for other type errors
  - PRESERVE: All comparison operators (===, !==, <, >, <=, >=)
  - PRESERVE: All logical operators (&&, ||, ??)

Task 3: ENHANCE evaluate() function JSDoc
  - FILE: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  - LOCATION: Lines 251-261, evaluate function
  - ADD: @remarks section about null/undefined in arithmetic
  - DOCUMENT: Return undefined for null/undefined arithmetic
  - DOCUMENT: Use of ?? operator for defaults
  - ADD: @example showing nullish coalescing pattern
  - FOLLOW: Pattern from existing JSDoc in codebase

Task 4: ADD comprehensive null/undefined arithmetic tests
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/expression.complex.test.ts
  - LOCATION: After existing tests (after line 857)
  - ADD: describe("Null/Undefined Arithmetic")
  - ADD TESTS:
    - Addition with null: 5 + null, null + 5, null + null
    - Addition with undefined: 5 + undefined, undefined + 5, undefined + undefined
    - Subtraction edge cases
    - Multiplication edge cases
    - Division edge cases (note: 5 / null → Infinity in standard JS!)
    - Modulo edge cases
    - Mixed null/undefined: null + undefined
  - PATTERN: Follow existing test structure from "Type Errors" section
  - EXPECTED: All tests expect undefined (not NaN, not 0, not Infinity)

Task 5: ADD development warning tests for null/undefined
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/expression.complex.test.ts
  - LOCATION: In new describe block for development warnings
  - ADD: describe("Development Warnings - Null/Undefined")
  - ADD TESTS:
    - Warning mentions "null" when operand is null
    - Warning mentions "undefined" when operand is undefined
    - No warning for valid arithmetic
  - PATTERN: Use vi.spyOn(console, 'warn') before each test
  - RESTORE: Use vi.restoreAllMocks() after each test
  - FOLLOW: Pattern from existing development warning tests

Task 6: RUN tests to verify implementation
  - COMMAND: pnpm test --filter @formality-ui/core expression.complex.test.ts
  - VERIFY: All new null/undefined tests pass
  - VERIFY: All existing tests still pass
  - EXPECTED: Zero test failures

Task 7: RUN full test suite for regressions
  - COMMAND: pnpm test --filter @formality-ui/core
  - VERIFY: All core tests pass
  - EXPECTED: Zero test failures
```

### Implementation Patterns & Key Details

````typescript
// ============================================================================
// PATTERN 1: Enhanced isSafeNumber JSDoc
// ============================================================================
// MODIFY lines 30-38 in evaluate.ts

/**
 * Type guard to check if a value is safe for arithmetic operations
 *
 * Excludes non-numeric types (including null and undefined), NaN, Infinity, and -Infinity.
 *
 * **Null/Undefined Handling:**
 * - `null` and `undefined` are explicitly rejected and return `undefined` for arithmetic
 * - This deviates from JavaScript standard coercion where `null + 5 = 5` and `undefined + 5 = NaN`
 * - This choice prevents the "Silent Zero Problem" (null → 0) and "NaN Cascade" (undefined → NaN)
 *
 * @param value - The value to check
 * @returns `true` if value is a safe finite number, `false` otherwise
 *
 * @example
 * isSafeNumber(5)           // → true
 * isSafeNumber(null)        // → false (explicitly rejected)
 * isSafeNumber(undefined)   // → false (explicitly rejected)
 * isSafeNumber(NaN)         // → false
 * isSafeNumber(Infinity)    // → false
 * isSafeNumber("5")         // → false (string coercion not allowed)
 */
function isSafeNumber(value: unknown): value is number {
  return typeof value === 'number' &&
         !Number.isNaN(value) &&
         Number.isFinite(value);
}

// ============================================================================
// PATTERN 2: Explicit null/undefined checks in BinaryExpression case
// ============================================================================
// MODIFY lines 77-148 in evaluate.ts
// Add these checks BEFORE the arithmetic operators switch statement

case "BinaryExpression": {
  const binaryNode = node as BinaryExpression;

  // ... existing logical operator handling (lines 80-106) ...

  // Non-short-circuit operators evaluate both sides
  const left = evaluateNode(binaryNode.left, context);
  const right = evaluateNode(binaryNode.right, context);
  const leftValue = unwrapFieldProxy(left);
  const rightValue = unwrapFieldProxy(right);

  // NEW: Explicit null/undefined checks for arithmetic operators
  const arithmeticOps = ['+', '-', '*', '/', '%'] as const;
  if (arithmeticOps.includes(binaryNode.operator)) {
    // Check left operand
    if (leftValue === null) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Formality Expression] Arithmetic error: ` +
          `Left operand is null for operator "${binaryNode.operator}"`
        );
      }
      return undefined;
    }
    if (leftValue === undefined) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Formality Expression] Arithmetic error: ` +
          `Left operand is undefined for operator "${binaryNode.operator}"`
        );
      }
      return undefined;
    }

    // Check right operand
    if (rightValue === null) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Formality Expression] Arithmetic error: ` +
          `Right operand is null for operator "${binaryNode.operator}"`
        );
      }
      return undefined;
    }
    if (rightValue === undefined) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Formality Expression] Arithmetic error: ` +
          `Right operand is undefined for operator "${binaryNode.operator}"`
        );
      }
      return undefined;
    }

    // Still use isSafeNumber for other type errors (strings, objects, etc.)
    if (!isSafeNumber(leftValue) || !isSafeNumber(rightValue)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Formality Expression] Type error: ` +
          `Invalid operands for ${binaryNode.operator}: ` +
          `left=${typeof leftValue}, right=${typeof rightValue}`
        );
      }
      return undefined;
    }

    // Division/modulo by zero checks (from P3.M2.T1.S1)
    if ((binaryNode.operator === '/' || binaryNode.operator === '%') &&
        (rightValue as number) === 0) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Formality Expression] Division/modulo by zero`
        );
      }
      return undefined;
    }

    // Perform arithmetic (now safe to assert as number)
    const l = leftValue as number;
    const r = rightValue as number;
    let result: number;

    switch (binaryNode.operator) {
      case '+': result = l + r; break;
      case '-': result = l - r; break;
      case '*': result = l * r; break;
      case '/': result = l / r; break;
      case '%': result = l % r; break;
      default: throw new Error(`Unknown operator: ${binaryNode.operator}`);
    }

    // Validate result (catch overflow)
    if (!Number.isFinite(result)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Formality Expression] Arithmetic overflow: ` +
          `${l} ${binaryNode.operator} ${r} produced ${result}`
        );
      }
      return undefined;
    }

    return result;
  }

  // Comparison operators (existing code, unchanged)
  switch (binaryNode.operator) {
    case "===":
      return leftValue === rightValue;
    case "!==":
      return leftValue !== rightValue;
    // ... rest of comparison operators
  }
}

// ============================================================================
// PATTERN 3: Enhanced evaluate() JSDoc
// ============================================================================
// MODIFY lines 251-261 in evaluate.ts

/**
 * Evaluate a string expression against a context object
 *
 * @param expr - Expression string (e.g., "client.id", "client && signed")
 * @param context - Evaluation context with field values
 * @returns The evaluated result
 *
 * @example
 * evaluate("client.id", { client: { id: 5 } }) // → 5
 * evaluate("client && signed", { client: { id: 5 }, signed: true }) // → true
 * evaluate("signed ? 'Yes' : 'No'", { signed: true }) // → 'Yes'
 *
 * @remarks
 * **Null/Undefined in Arithmetic:**
 * Arithmetic operations with `null` or `undefined` operands return `undefined` with a
 * development warning. This prevents silent bugs from JavaScript's default coercion
 * behavior where `null + 5 = 5` (Silent Zero Problem) and `undefined + 5 = NaN` (NaN Cascade).
 *
 * Use nullish coalescing (`??`) to provide defaults for optional values:
 * ```ts
 * evaluate("price - (discount ?? 0)", context)
 * evaluate("(taxRate ?? 0.1) * price", context)
 * ```
 */
export function evaluate(expr: string, context: EvaluationContext): unknown {

// ============================================================================
// PATTERN 4: Test Structure for Null/Undefined Arithmetic
// ============================================================================
// ADD in expression.complex.test.ts after line 857

describe("Null/Undefined Arithmetic", () => {
  describe("Addition (+)", () => {
    it("should return undefined for number + null", () => {
      expect(evaluate("5 + null", {})).toBeUndefined();
    });

    it("should return undefined for null + number", () => {
      expect(evaluate("null + 5", {})).toBeUndefined();
    });

    it("should return undefined for null + null", () => {
      expect(evaluate("null + null", {})).toBeUndefined();
    });

    it("should return undefined for number + undefined", () => {
      expect(evaluate("5 + undefined", {})).toBeUndefined();
    });

    it("should return undefined for undefined + number", () => {
      expect(evaluate("undefined + 5", {})).toBeUndefined();
    });

    it("should return undefined for undefined + undefined", () => {
      expect(evaluate("undefined + undefined", {})).toBeUndefined();
    });

    it("should return undefined for null + undefined", () => {
      expect(evaluate("null + undefined", {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate("5 + 3", {})).toBe(8);
    });
  });

  describe("Subtraction (-)", () => {
    it("should return undefined for number - null", () => {
      expect(evaluate("5 - null", {})).toBeUndefined();
    });

    it("should return undefined for null - number", () => {
      expect(evaluate("null - 5", {})).toBeUndefined();
    });

    it("should return undefined for undefined - number", () => {
      expect(evaluate("undefined - 5", {})).toBeUndefined();
    });

    it("should return undefined for number - undefined", () => {
      expect(evaluate("5 - undefined", {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate("10 - 4", {})).toBe(6);
    });
  });

  describe("Multiplication (*)", () => {
    it("should return undefined for number * null", () => {
      expect(evaluate("5 * null", {})).toBeUndefined();
    });

    it("should return undefined for null * null", () => {
      expect(evaluate("null * null", {})).toBeUndefined();
    });

    it("should return undefined for number * undefined", () => {
      expect(evaluate("5 * undefined", {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate("5 * 3", {})).toBe(15);
    });
  });

  describe("Division (/)", () => {
    it("should return undefined for number / null", () => {
      // In standard JS: 5 / null → Infinity (very dangerous!)
      expect(evaluate("5 / null", {})).toBeUndefined();
    });

    it("should return undefined for null / number", () => {
      expect(evaluate("null / 5", {})).toBeUndefined();
    });

    it("should return undefined for number / undefined", () => {
      expect(evaluate("5 / undefined", {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate("10 / 2", {})).toBe(5);
    });
  });

  describe("Modulo (%)", () => {
    it("should return undefined for number % null", () => {
      expect(evaluate("10 % null", {})).toBeUndefined();
    });

    it("should return undefined for null % number", () => {
      expect(evaluate("null % 3", {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate("10 % 3", {})).toBe(1);
    });
  });

  describe("Complex Expressions", () => {
    it("should handle null in multi-operation expressions", () => {
      expect(evaluate("5 + 10 - null", {})).toBeUndefined();
      expect(evaluate("null * 2 + 3", {})).toBeUndefined();
    });

    it("should handle undefined in multi-operation expressions", () => {
      expect(evaluate("5 * 2 + undefined", {})).toBeUndefined();
      expect(evaluate("undefined - 3 * 2", {})).toBeUndefined();
    });

    it("should handle mixed null/undefined", () => {
      expect(evaluate("null + undefined", {})).toBeUndefined();
      expect(evaluate("5 * null + undefined", {})).toBeUndefined();
    });
  });
});

// ============================================================================
// PATTERN 5: Test Structure for Development Warnings
// ============================================================================

describe("Development Warnings - Null/Undefined", () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should warn specifically about null in left operand", () => {
    evaluate("5 + null", {});

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[Formality Expression]')
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Left operand is null')
    );
  });

  it("should warn specifically about undefined in left operand", () => {
    evaluate("undefined - 5", {});

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[Formality Expression]')
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Left operand is undefined')
    );
  });

  it("should warn specifically about null in right operand", () => {
    evaluate("5 * null", {});

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Right operand is null')
    );
  });

  it("should warn specifically about undefined in right operand", () => {
    evaluate("5 / undefined", {});

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Right operand is undefined')
    );
  });

  it("should not warn for valid arithmetic", () => {
    evaluate("5 + 3", {});

    expect(console.warn).not.toHaveBeenCalled();
  });

  it("should mention the operator in warning", () => {
    evaluate("null + 5", {});

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('operator "+"')
    );
  });
});
````

### Integration Points

```yaml
EXPRESSION_EVALUATION:
  - file: packages/core/src/expression/evaluate.ts
  - modify: BinaryExpression case (lines 77-148)
  - modify: isSafeNumber JSDoc (lines 30-38)
  - modify: evaluate JSDoc (lines 251-261)
  - preserves: All other expression types (Literal, Identifier, MemberExpression, etc.)
  - preserves: All logical operators (&&, ||, ??)
  - preserves: All comparison operators (===, !==, <, >, <=, >=)
  - enhances: Arithmetic operators (+, -, *, /, %) with explicit null/undefined checks

EXISTING_TESTS:
  - file: packages/core/src/__tests__/expression.complex.test.ts
  - reference: Lines 830-857 (Null/Undefined Propagation - for logical operators only)
  - add: New "Null/Undefined Arithmetic" section after line 857
  - add: New "Development Warnings - Null/Undefined" section
  - preserves: All other existing tests

P3M2T1S1_CONTRACT:
  - dependency: P3.M2.T1.S1 implements isSafeNumber() type guard
  - consumed_by: This work item (P3.M2.T1.S2) extends the type guard
  - builds_upon: isSafeNumber() function foundation
  - adds: Explicit null/undefined checks BEFORE isSafeNumber()
  - adds: JSDoc documentation for null/undefined behavior
  - adds: Comprehensive tests for null/undefined edge cases

P3M2T2_CONTRACT:
  - dependency: This work item (P3.M2.T1.S2) provides explicit null/undefined handling
  - consumed_by: P3.M2.T2 (Add Tests for Type Safety)
  - provides: Null/undefined test patterns for P3.M2.T2 to extend
  - note: P3.M2.T2 will add additional comprehensive tests
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after code modifications - fix before proceeding
pnpm lint --fix                    # Auto-format and fix linting issues
pnpm typecheck                     # Type checking

# Expected: Zero errors.
# If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific expression files
pnpm test --filter @formality-ui/core expression.test.ts
pnpm test --filter @formality-ui/core expression.complex.test.ts

# Run with verbose output
pnpm test --filter @formality-ui/core expression.complex.test.ts --reporter=verbose

# Expected: All tests pass including new null/undefined tests.
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test full core package
pnpm test --filter @formality-ui/core

# Expected: All core tests pass, no regressions.
# Focus areas: expression evaluation, conditions, validation
```

### Level 4: Documentation Validation

```bash
# Verify JSDoc is properly formatted
pnpm lint  # JSDoc comments should pass linting

# Manual verification: Check that JSDoc renders correctly
# Open the files and verify documentation is clear

# Expected: All JSDoc is properly formatted and informative.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] `isSafeNumber()` JSDoc documents null/undefined behavior
- [ ] `evaluate()` JSDoc documents null/undefined behavior
- [ ] Explicit null/undefined checks added before `isSafeNumber()` check
- [ ] Warning messages specifically mention "null" or "undefined"
- [ ] All tests pass: `pnpm test --filter @formality-ui/core`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] All existing tests continue to pass

### Feature Validation

- [ ] `5 + null` returns `undefined` with warning mentioning "null"
- [ ] `undefined - 5` returns `undefined` with warning mentioning "undefined"
- [ ] `5 / null` returns `undefined` (not Infinity!)
- [ ] All arithmetic operators have explicit null/undefined checks
- [ ] Valid numbers still produce correct results
- [ ] Development warnings NOT logged in production mode
- [ ] Null/undefined tests cover all arithmetic operators
- [ ] Development warning tests verify specific messages

### Code Quality Validation

- [ ] Follows existing JSDoc formatting patterns from codebase
- [ ] Null/undefined checks BEFORE `isSafeNumber()` for better error messages
- [ ] Uses `=== null` and `=== undefined` (not `== null`)
- [ ] Warning messages follow `[Formality Expression]` format
- [ ] Code is self-documenting with clear variable names
- [ ] No modifications to comparison or logical operators
- [ ] Documentation explains deviation from JavaScript standard behavior

### Documentation & Deployment

- [ ] Research document referenced in JSDoc
- [ ] "Silent Zero Problem" documented in comments
- [ ] "NaN Cascade" documented in comments
- [ ] @example sections show null/undefined behavior
- [ ] @remarks sections explain design decisions
- [ ] Tests demonstrate expected behavior

---

## Anti-Patterns to Avoid

- **Don't use `== null` check** - Use `=== null` for explicit null detection (we want specific messages)
- **Don't check only `typeof`** - Explicit `=== null` check gives better error messages than `typeof === 'object'`
- **Don't skip explicit undefined check** - `typeof undefined === 'undefined'` is correct but explicit check is clearer
- **Don't check after isSafeNumber()** - Check for null/undefined FIRST for better error messages
- **Don't document only in tests** - JSDoc must document the behavior too
- **Don't modify comparison operators** - Only arithmetic operators are in scope
- **Don't modify logical operators** - They already handle null/undefined correctly (short-circuit semantics)
- **Don't test implementation details** - Test observable behavior (return values, console output)
- **Don't forget to document deviation** - Explain WHY we don't follow JavaScript coercion
- **Don't assume readers know typeof behavior** - Document that `typeof null === 'object'`

---

## Related Work Items

- **Parent**: P3.M2 - Type Safety in Expressions (Planned)
- **Parent**: P3.M2.T1 - Add Type Guards (Planned)
- **Sibling**: P3.M2.T1.S1 - Add type checking (Implementing in parallel)
- **Child**: P3.M2.T2 - Add Tests for Type Safety (Planned)
- **Parallel**: P3.M1 - Memory Leak Prevention (Implementing in parallel)

---

## Contract Dependencies

### From P3.M2.T1.S1 - Add type checking (Implementing in parallel)

The P3.M2.T1.S1 PRP implements the `isSafeNumber()` type guard foundation.

**This PRP Builds Upon**:

1. P3.M2.T1.S1 provides `isSafeNumber()` function with `typeof value === 'number'` check
2. P3.M2.T1.S1 adds type guards to arithmetic operators
3. P3.M2.T1.S1 handles division by zero, NaN, Infinity
4. P3.M2.T1.S1 establishes development warning pattern

**This PRP Adds**:

1. Explicit null/undefined checks BEFORE `isSafeNumber()` for better error messages
2. JSDoc documentation of null/undefined behavior
3. Explanation of deviation from JavaScript standard coercion
4. Comprehensive tests for null/undefined edge cases
5. Specific warning messages mentioning "null" or "undefined"

**Integration Point**: This PRP extends P3.M2.T1.S1's work, adding specificity and documentation without changing the core behavior.

### To P3.M2.T2 - Add Tests for Type Safety (Planned)

The P3.M2.T2 PRP will add comprehensive tests for type safety.

**This PRP's Contract**:

1. This PRP provides null/undefined test patterns for P3.M2.T2 to extend
2. This PRP establishes the behavior that P3.M2.T2 will verify
3. This PRP adds basic tests for null/undefined arithmetic
4. This PRP documents expected null/undefined behavior

**Integration Point**: P3.M2.T2 will add additional comprehensive tests for mixed types and edge cases beyond the basic null/undefined coverage in this PRP.

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:

- Clear scope: Add explicit null/undefined checks and documentation
- Comprehensive research documented with specific URLs and examples
- Clear implementation patterns from codebase analysis
- Specific file paths and line numbers provided
- Test patterns identified and documented
- Known gotchas and anti-patterns listed
- Existing JSDoc patterns to follow
- All validation commands specific to project
- Builds upon P3.M2.T1.S1 contract with clear integration points

**Remaining 1 point uncertainty**:

- Ensuring JSDoc adequately explains the deviation from JavaScript standard behavior (subjective)

---

## References

### Internal Documentation

- [Null/Undefined Handling Research](./research/null-undefined-handling.md) - Comprehensive research on null/undefined in JavaScript/TypeScript
- [P3.M2.T1.S1 PRP](../P3M2T1S1/PRP.md) - Type guard foundation contract

### Internal Code Files

- [evaluate.ts](../../../../packages/core/src/expression/evaluate.ts) - Primary implementation file
- [expression.complex.test.ts](../../../../packages/core/src/__tests__/expression.complex.test.ts) - Test file to extend

### External Documentation

- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) - Type predicate documentation
- [MDN: Null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null) - Null behavior and type coercion
- [MDN: Undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined) - Undefined behavior and type coercion
- [ECMAScript ToNumeric](https://tc39.es/ecma262/#sec-tonumeric) - How JavaScript coerces values to numbers

### Research Artifacts

- `/home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S2/research/null-undefined-handling.md` - All research documentation

---

## Appendix: Quick Reference

### Implementation Summary

```typescript
// 1. ENHANCE isSafeNumber JSDoc (lines 30-38)
// Add comprehensive documentation with null/undefined section

// 2. ADD explicit null/undefined checks (lines 77-148)
// Check BEFORE isSafeNumber() for better error messages
if (leftValue === null) {
  console.warn(`Left operand is null`);
  return undefined;
}
if (leftValue === undefined) {
  console.warn(`Left operand is undefined`);
  return undefined;
}
// Repeat for rightValue...

// 3. ENHANCE evaluate JSDoc (lines 251-261)
// Add @remarks section about null/undefined behavior

// 4. ADD comprehensive tests (expression.complex.test.ts)
// Cover all operators with null/undefined combinations
```

### JavaScript vs Our Behavior

| Expression      | JavaScript | Our Behavior | Why                 |
| --------------- | ---------- | ------------ | ------------------- |
| `5 + null`      | `5`        | `undefined`  | Silent Zero Problem |
| `5 + undefined` | `NaN`      | `undefined`  | NaN Cascade         |
| `5 / null`      | `Infinity` | `undefined`  | Dangerous: Infinity |
| `null / 5`      | `0`        | `undefined`  | Silent Zero Problem |
| `5 * null`      | `0`        | `undefined`  | Silent Zero Problem |
| `5 * undefined` | `NaN`      | `undefined`  | NaN Cascade         |

### Warning Messages

```
[Formality Expression] Arithmetic error: Left operand is null for operator "+"
[Formality Expression] Arithmetic error: Right operand is undefined for operator "-"
[Formality Expression] Arithmetic error: Left operand is null for operator "/"
```

### Test Coverage Matrix

| Operator | +null | null+ | +undefined | undefined+ | null+null | undefined+undefined |
| -------- | ----- | ----- | ---------- | ---------- | --------- | ------------------- |
| `+`      | ✓     | ✓     | ✓          | ✓          | ✓         | ✓                   |
| `-`      | ✓     | ✓     | ✓          | ✓          | ✓         | ✓                   |
| `*`      | ✓     | ✓     | ✓          | ✓          | ✓         | ✓                   |
| `/`      | ✓     | ✓     | ✓          | ✓          | ✓         | ✓                   |
| `%`      | ✓     | ✓     | ✓          | ✓          | ✓         | ✓                   |
