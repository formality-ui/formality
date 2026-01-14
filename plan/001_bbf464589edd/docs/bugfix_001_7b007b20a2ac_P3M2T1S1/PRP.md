# PRP: Add Type Checking for Arithmetic Operations

**Work Item**: P3.M2.T1.S1 - Add type checking
**Parent Task**: P3.M2.T1 - Add Type Guards
**Parent Milestone**: P3.M2 - Type Safety in Expressions
**Priority**: P3 (Medium Priority Issue)
**Story Points**: 2
**Status**: **READY FOR IMPLEMENTATION**

---

## Goal

**Feature Goal**: Add runtime type guards to BinaryExpression arithmetic operations to prevent NaN and Infinity results from invalid operands.

**Deliverable**:
1. Type guard function (`isSafeNumber`) for validating numeric operands
2. Type validation before arithmetic operations (+, -, *, /, %) in BinaryExpression handler
3. Development warning console logs for non-numeric operands
4. Return `undefined` instead of NaN/Infinity for invalid operations
5. Test suite covering all type error scenarios with development warnings

**Success Definition**:
- Arithmetic operations with non-numeric operands return `undefined` instead of NaN
- Division by zero returns `undefined` instead of Infinity
- Development warnings are logged for invalid operations
- All existing tests continue to pass (with updated expectations where behavior changes)
- Type guard tests cover all arithmetic operators (+, -, *, /, %)

---

## User Persona (if applicable)

**Target User**: Form developers using the Formality library

**Use Case**: Writing expressions that perform arithmetic operations on field values where the values may be undefined, null, or non-numeric strings due to user input or conditional rendering.

**User Journey**:
1. Developer creates form with numeric fields (e.g., `quantity`, `price`, `discount`)
2. Developer writes expression: `quantity * price - discount`
3. User leaves some fields empty or enters non-numeric values
4. Expression evaluator handles invalid values gracefully with clear error messages

**Pain Points Addressed**:
- **Silent NaN propagation**: Arithmetic with invalid values produces NaN which spreads through calculations
- **Unclear errors**: When expressions produce NaN, it's hard to identify which field caused the issue
- **Unexpected Infinity**: Division by zero produces Infinity instead of a clear error state

---

## Why

- **Type Safety**: Prevents NaN and Infinity from propagating through form calculations
- **Better Debugging**: Development warnings clearly identify invalid operations and operand types
- **Consistent Error Handling**: Returns `undefined` for all invalid operations (consistent with other error cases)
- **Integration with Existing Patterns**: Follows existing development warning patterns in codebase
- **Preparation for P3.M2.T2**: Foundation for comprehensive type safety testing

---

## What

### Current State Analysis

**From Contract Definition**:
1. **INPUT**: Current BinaryExpression handler with left and right operands
2. **LOGIC**: Before arithmetic operations (+, -, *, /, %), check `typeof left === 'number' && typeof right === 'number'`. If not numbers, return undefined. Add development warning for non-numeric operands. Handle NaN result.
3. **OUTPUT**: Type-guarded arithmetic operations returning undefined for invalid types.

**Current Implementation** (packages/core/src/expression/evaluate.ts:99-137):

```typescript
// Lines 99-137: BinaryExpression case WITHOUT type guards
case "BinaryExpression": {
  const binaryNode = node as BinaryExpression;

  // Logical operators (handled separately)

  // Non-short-circuit operators evaluate both sides
  const left = evaluateNode(binaryNode.left, context);
  const right = evaluateNode(binaryNode.right, context);
  const leftValue = unwrapFieldProxy(left);
  const rightValue = unwrapFieldProxy(right);

  switch (binaryNode.operator) {
    case "+":
      return (leftValue as number) + (rightValue as number);
    case "-":
      return (leftValue as number) - (rightValue as number);
    case "*":
      return (leftValue as number) * (rightValue as number);
    case "/":
      return (leftValue as number) / (rightValue as number);
    case "%":
      return (leftValue as number) % (rightValue as number);
    // ... comparison operators
  }
}
```

**Problems**:
1. Type assertions (`as number`) bypass TypeScript without runtime validation
2. Non-numeric operands produce NaN (e.g., `"text" * 2` → `NaN`)
3. Division by zero produces Infinity (e.g., `1 / 0` → `Infinity`)
4. No development warnings for invalid operations
5. Silent failures - hard to debug which field caused NaN

### Success Criteria

- [ ] `isSafeNumber()` type guard function added to evaluate.ts
- [ ] All arithmetic operators (+, -, *, /, %) validate operands before operation
- [ ] Non-numeric operands return `undefined` with development warning
- [ ] Division by zero returns `undefined` with development warning
- [ ] Operations producing Infinity return `undefined` with development warning
- [ ] Existing tests updated to expect `undefined` instead of NaN/Infinity
- [ ] New tests added for type guard behavior
- [ ] New tests added for development warnings

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:
- Exact file paths and line numbers for code modification
- Complete implementation patterns with code examples
- All validation commands specific to project
- Research documentation stored in work item directory
- Clear test patterns and assertion strategies
- Known gotchas and anti-patterns identified

### Documentation & References

```yaml
# MUST READ - Primary implementation file
- file: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  why: Primary file to modify - add type guards to BinaryExpression handler
  exact: Lines 67-137 (BinaryExpression case)
  exact: Lines 99-116 (Arithmetic operators - NEED TYPE GUARDS)
  exact: Lines 252-266 (evaluate function - error handling pattern)
  pattern: Development warning with process.env.NODE_ENV check
  gotcha: Expression string not available in evaluateNode - must pass from outer scope

# MUST READ - Test files to modify
- file: /home/dustin/projects/formality/packages/core/src/__tests__/expression.complex.test.ts
  why: Contains existing type error tests that need updates
  exact: Lines 753-777 (Type Errors describe block - CURRENT BEHAVIOR)
  exact: Lines 602-606 (Division by zero tests - CURRENT BEHAVIOR)
  exact: Lines 608-612 (String coercion tests - CURRENT BEHAVIOR)
  pattern: Use expect(isNaN(...as number)).toBe(true) for NaN tests
  gotcha: After implementation, these tests will fail - need to update expectations

# MUST READ - Existing test patterns
- file: /home/dustin/projects/formality/packages/core/src/__tests__/expression.test.ts
  why: Basic expression test patterns
  exact: Lines 40-47 (Binary expressions tests)
  pattern: renderHook-like pattern with evaluate() and context objects

# RESEARCH - Type guard patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S1/research/type-guard-patterns.md
  why: TypeScript type guard best practices for arithmetic
  section: isSafeNumber function, safe arithmetic implementation

# RESEARCH - Development warning patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S1/research/development-warning-patterns.md
  why: Existing development warning patterns in codebase
  section: Console.warn with environment check, warning message format

# RESEARCH - Test patterns
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S1/research/test-patterns.md
  why: Test patterns for type safety in expression evaluation
  section: Test Naming Conventions, Behavior Changes After Implementation

# RESEARCH - NaN handling
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S1/research/nan-handling.md
  why: NaN handling best practices
  section: Prevention in Expression Evaluation, Result Validation

# EXTERNAL - TypeScript Documentation
- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  why: Type predicates and type guard functions

# EXTERNAL - MDN Documentation
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
  why: Number.isNaN() vs isNaN() - use Number.isNaN() to avoid coercion

# EXTERNAL - MDN Documentation
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite
  why: Number.isFinite() to exclude NaN and Infinity

# EXTERNAL - MDN Documentation
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
  why: typeof operator for runtime type checking
```

### Current Codebase tree (relevant files)

```bash
packages/core/src/
├── expression/
│   ├── context.ts                # FieldProxy unwrapping utilities
│   ├── evaluate.ts               # ← MODIFY: Add type guards (lines 99-137)
│   ├── index.ts                  # Public exports
│   └── infer.ts                  # Field inference
│
└── __tests__/
    ├── expression.test.ts        # Basic expression tests
    └── expression.complex.test.ts # ← MODIFY: Update type error tests (lines 753-777)
```

### Desired Codebase tree with modifications

```bash
packages/core/src/
├── expression/
│   ├── context.ts                # UNCHANGED
│   ├── evaluate.ts               # ← MODIFY: Add isSafeNumber() and type guards
│   │   ├── ADD: isSafeNumber() type guard function (after imports, before evaluateNode)
│   │   ├── MODIFY: Lines 99-116 - Add type validation before arithmetic operations
│   │   └── MODIFY: Lines 67-137 - Pass expression string for error messages
│   ├── index.ts                  # UNCHANGED
│   └── infer.ts                  # UNCHANGED
│
└── __tests__/
    ├── expression.test.ts        # UNCHANGED (no type error tests here)
    └── expression.complex.test.ts # ← MODIFY: Update type error tests
        ├── MODIFY: Lines 753-777 - Update Type Errors tests (expect undefined instead of NaN)
        ├── MODIFY: Lines 602-606 - Update division by zero tests
        └── ADD: New describe block for development warning tests
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Expression string not available in evaluateNode()
// evaluateNode() receives (node: Expression, context: EvaluationContext)
// The original expression string is in the outer evaluate() function
// Solution: Pass expression string as optional parameter or use closure

// GOTCHA: unwrapFieldProxy() returns unknown, not number
// After unwrapping, must validate type before arithmetic
// Always use isSafeNumber() type guard before operations

// CRITICAL: Number.isNaN() vs isNaN()
// Use Number.isNaN() - doesn't coerce values
// isNaN("hello") returns true (coerces to NaN)
// Number.isNaN("hello") returns false

// CRITICAL: Division by zero produces Infinity, not NaN
// 1 / 0 → Infinity
// 0 / 0 → NaN
// -1 / 0 → -Infinity
// Must check for zero divisor explicitly

// GOTCHA: String coercion in arithmetic
// "5" * 2 → 10 (string coerced to number)
// After type guard, this should return undefined
// This is a BEHAVIOR CHANGE from current implementation

// CRITICAL: Existing tests expect NaN/Infinity
// expression.complex.test.ts lines 753-777 expect NaN
// expression.complex.test.ts lines 602-606 expect Infinity
// These tests MUST be updated to expect undefined

// CRITICAL: Development warnings must use environment check
// if (process.env.NODE_ENV !== "production") { console.warn(...) }
// This pattern is used throughout the codebase

// GOTCHA: Type assertion "as number" is unsafe
// Current code uses (leftValue as number) without validation
// After type guard, still need assertion but it's now safe
// The isSafeNumber() type guard narrows the type

// CRITICAL: Comparison operators also need type guards
// <, >, <=, >= also use (leftValue as number)
// Current work item scope: ONLY arithmetic operators (+, -, *, /, %)
// Comparison operators will be handled in future work items if needed
```

---

## Implementation Blueprint

### Data models and structure

No new data models. Adding type guard function and modifying existing function.

```typescript
// NEW: Type guard function
function isSafeNumber(value: unknown): value is number {
  return typeof value === 'number' &&
         !Number.isNaN(value) &&
         Number.isFinite(value);
}

// MODIFIED: Safe arithmetic with validation
function safeArithmetic(
  operator: string,
  left: unknown,
  right: unknown,
  expr: string  // For error messages
): number | undefined {
  if (!isSafeNumber(left) || !isSafeNumber(right)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[Formality Expression] Type error in "${expr}": ` +
        `Invalid operands for ${operator}: ` +
        `left=${typeof left}, right=${typeof right}`
      );
    }
    return undefined;
  }

  const l = left as number;
  const r = right as number;
  let result: number;

  switch (operator) {
    case '+': result = l + r; break;
    case '-': result = l - r; break;
    case '*': result = l * r; break;
    case '/':
      if (r === 0) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[Formality Expression] Division by zero in "${expr}"`
          );
        }
        return undefined;
      }
      result = l / r;
      break;
    case '%':
      if (r === 0) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[Formality Expression] Modulo by zero in "${expr}"`
          );
        }
        return undefined;
      }
      result = l % r;
      break;
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }

  // Validate result (catch overflow to Infinity)
  if (!Number.isFinite(result)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[Formality Expression] Arithmetic overflow in "${expr}": ` +
        `Operation ${l} ${operator} ${r} produced ${result}`
      );
    }
    return undefined;
  }

  return result;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD isSafeNumber() type guard function
  - FILE: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  - LOCATION: After imports (line 24), before getProperty() function (line 32)
  - ADD: isSafeNumber() function with type predicate
  - IMPLEMENT:
    typeof value === 'number'
    && !Number.isNaN(value)
    && Number.isFinite(value)
  - NAMING: isSafeNumber (lowercase 'i' following utility function convention)
  - RETURN: value is number (type predicate for TypeScript narrowing)

Task 2: MODIFY evaluateNode() signature to accept expression string
  - FILE: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  - LOCATION: Line 46, function evaluateNode()
  - ADD: Optional third parameter: expr?: string
  - UPDATE: All recursive calls to pass expr parameter
  - PRESERVE: All existing functionality
  - GOTCHA: Only add expr parameter, don't change existing behavior

Task 3: MODIFY BinaryExpression case - Add type guard validation
  - FILE: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  - LOCATION: Lines 67-137, BinaryExpression case
  - MODIFY: Before arithmetic operations switch, add type guard check
  - IMPLEMENT:
    1. Define arithmeticOps array: ['+', '-', '*', '/', '%']
    2. Check if operator is arithmetic operation
    3. If yes, validate with isSafeNumber()
    4. If validation fails, log warning and return undefined
  - PRESERVE: All comparison operators (===, !==, <, >, <=, >=)
  - GOTCHA: Don't modify comparison operators in this work item

Task 4: ADD division/modulo by zero checks
  - FILE: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  - LOCATION: Inside arithmetic operations type guard block
  - ADD: For '/' and '%' operators, check if rightValue === 0
  - IMPLEMENT: Log warning and return undefined if dividing by zero
  - PRESERVE: All other operator handling

Task 5: ADD result validation for arithmetic overflow
  - FILE: /home/dustin/projects/formality/packages/core/src/expression/evaluate.ts
  - LOCATION: After arithmetic operation, before return
  - ADD: Check if !Number.isFinite(result) for overflow to Infinity
  - IMPLEMENT: Log warning and return undefined if overflow detected
  - GOTCHA: Very large numbers can overflow to Infinity even with valid inputs

Task 6: UPDATE existing type error tests
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/expression.complex.test.ts
  - LOCATION: Lines 753-777, "Type Errors" describe block
  - MODIFY: Change expectations from NaN to undefined
  - UPDATE:
    "should handle non-numeric arithmetic" tests
    expect(isNaN(...)) → expect(...).toBeUndefined()
  - PRESERVE: All other test structure

Task 7: UPDATE division by zero tests
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/expression.complex.test.ts
  - LOCATION: Lines 602-606
  - MODIFY: Change expectations from Infinity to undefined
  - UPDATE:
    "should handle division by zero" tests
    expect(Infinity) → expect(undefined)
  - PRESERVE: All other test structure

Task 8: UPDATE string coercion tests
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/expression.complex.test.ts
  - LOCATION: Lines 608-612
  - MODIFY: Change expectations from number to undefined
  - UPDATE:
    "should handle string coercion in arithmetic" tests
    expect(number) → expect(undefined)
  - PRESERVE: All other test structure

Task 9: ADD new describe block for type guard tests
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/expression.complex.test.ts
  - LOCATION: After existing "Type Errors" block (after line 777)
  - ADD: describe("Type Guards - Arithmetic Operations")
  - ADD TESTS:
    - Each operator with string operands (expect undefined)
    - Each operator with null operands (expect undefined)
    - Each operator with undefined operands (expect undefined)
    - Each operator with object operands (expect undefined)
    - Valid numbers should still work
  - PATTERN: Follow existing test naming conventions

Task 10: ADD new describe block for development warnings
  - FILE: /home/dustin/projects/formality/packages/core/src/__tests__/expression.complex.test.ts
  - LOCATION: After type guard tests block
  - ADD: describe("Development Warnings")
  - ADD TESTS:
    - Console warning for non-numeric operands
    - Console warning for division by zero
    - Console warning for arithmetic overflow
  - PATTERN: Use vi.spyOn(console, 'warn') before each test
  - RESTORE: Use vi.restoreAllMocks() after each test

Task 11: RUN tests to verify implementation
  - COMMAND: pnpm test --filter @formality-ui/core expression.test.ts
  - COMMAND: pnpm test --filter @formality-ui/core expression.complex.test.ts
  - VERIFY: All new tests pass
  - VERIFY: All updated tests pass
  - EXPECTED: Zero test failures

Task 12: RUN full test suite for regressions
  - COMMAND: pnpm test --filter @formality-ui/core
  - VERIFY: All core tests pass
  - EXPECTED: Zero test failures
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Type Guard Function
// ============================================================================
// ADD after imports (line 24), before getProperty() (line 32)

/**
 * Type guard to check if a value is safe for arithmetic operations
 * Excludes: NaN, Infinity, -Infinity, and non-numeric types
 */
function isSafeNumber(value: unknown): value is number {
  return typeof value === 'number' &&
         !Number.isNaN(value) &&
         Number.isFinite(value);
}

// ============================================================================
// PATTERN 2: Modified evaluateNode signature (OPTIONAL APPROACH)
// ============================================================================

// APPROACH 1: Add optional expr parameter (less invasive)
function evaluateNode(
  node: Expression,
  context: EvaluationContext,
  expr?: string  // NEW: Optional for error messages
): unknown {
  // Pass expr to recursive calls
  switch (node.type) {
    case "BinaryExpression":
      // ... use expr for warnings
    case "MemberExpression":
      const object = evaluateNode(memberNode.object, context, expr);  // Pass expr
      // ...
  }
}

// APPROACH 2: Use closure in evaluate() (simpler, no signature change)
// Keep evaluateNode() signature unchanged
// In evaluate() function, capture expr in closure
// Type guard warnings reference expr from outer scope

// RECOMMENDED: APPROACH 2 (closure) - less invasive change

// ============================================================================
// PATTERN 3: BinaryExpression Type Guard Implementation
// ============================================================================
// MODIFY lines 67-137 in evaluate.ts

case "BinaryExpression": {
  const binaryNode = node as BinaryExpression;

  // ... existing logical operator handling (lines 70-96) ...

  // Non-short-circuit operators evaluate both sides
  const left = evaluateNode(binaryNode.left, context);
  const right = evaluateNode(binaryNode.right, context);
  const leftValue = unwrapFieldProxy(left);
  const rightValue = unwrapFieldProxy(right);

  // NEW: Type guard validation for arithmetic operators
  const arithmeticOps = ['+', '-', '*', '/', '%'] as const;
  if (arithmeticOps.includes(binaryNode.operator)) {
    // Validate operands
    if (!isSafeNumber(leftValue) || !isSafeNumber(rightValue)) {
      // Development warning
      if (process.env.NODE_ENV !== "production") {
        // Note: expr is from outer evaluate() function scope
        console.warn(
          `[Formality Expression] Type error: ` +
          `Invalid operands for ${binaryNode.operator}: ` +
          `left=${typeof leftValue}, right=${typeof rightValue}`
        );
      }
      return undefined;
    }

    // Special handling for division/modulo by zero
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
// PATTERN 4: Test Structure for Type Guards
// ============================================================================
// ADD in expression.complex.test.ts after line 777

describe("Type Guards - Arithmetic Operations", () => {
  describe("Addition (+)", () => {
    it("should return undefined for string + number", () => {
      expect(evaluate('"text" + 1', {})).toBeUndefined();
    });

    it("should return undefined for null + number", () => {
      expect(evaluate('null + 1', {})).toBeUndefined();
    });

    it("should return undefined for undefined + number", () => {
      expect(evaluate('undefined + 1', {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate('5 + 3', {})).toBe(8);
    });
  });

  describe("Subtraction (-)", () => {
    it("should return undefined for string - number", () => {
      expect(evaluate('"text" - 1', {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate('10 - 4', {})).toBe(6);
    });
  });

  describe("Multiplication (*)", () => {
    it("should return undefined for string * number", () => {
      expect(evaluate('"text" * 2', {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate('5 * 3', {})).toBe(15);
    });
  });

  describe("Division (/)", () => {
    it("should return undefined for string / number", () => {
      expect(evaluate('"text" / 2', {})).toBeUndefined();
    });

    it("should return undefined for division by zero", () => {
      expect(evaluate('1 / 0', {})).toBeUndefined();
      expect(evaluate('-1 / 0', {})).toBeUndefined();
      expect(evaluate('0 / 0', {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate('10 / 2', {})).toBe(5);
    });
  });

  describe("Modulo (%)", () => {
    it("should return undefined for string % number", () => {
      expect(evaluate('"text" % 2', {})).toBeUndefined();
    });

    it("should return undefined for modulo by zero", () => {
      expect(evaluate('10 % 0', {})).toBeUndefined();
    });

    it("should work with valid numbers", () => {
      expect(evaluate('10 % 3', {})).toBe(1);
    });
  });
});

// ============================================================================
// PATTERN 5: Test Structure for Development Warnings
// ============================================================================

describe("Development Warnings", () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should warn for non-numeric operands in addition", () => {
    evaluate('"text" + 1', {});

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
      expect.stringContaining('Division by zero')
    );
  });

  it("should not warn for valid arithmetic", () => {
    evaluate('5 + 3', {});

    expect(console.warn).not.toHaveBeenCalled();
  });
});
```

### Integration Points

```yaml
EXPRESSION_EVALUATION:
  - file: packages/core/src/expression/evaluate.ts
  - modify: BinaryExpression case (lines 67-137)
  - modify: Add isSafeNumber() function (line ~25)
  - preserves: All other expression types (Literal, Identifier, MemberExpression, etc.)
  - preserves: Logical operators (&&, ||, ??)
  - preserves: Comparison operators (===, !==, <, >, <=, >=)
  - changes: Arithmetic operators (+, -, *, /, %) now validate operands

EXISTING_TESTS:
  - file: packages/core/src/__tests__/expression.complex.test.ts
  - modify: Lines 753-777 (Type Errors - update expectations)
  - modify: Lines 602-606 (Division by zero - update expectations)
  - modify: Lines 608-612 (String coercion - update expectations)
  - add: New describe blocks for type guards and warnings
  - preserves: All other existing tests

P3M2T2_CONTRACT:
  - dependency: This work item (P3.M2.T1.S1) implements type guards
  - consumed_by: P3.M2.T2 (Add Tests for Type Safety)
  - provides: isSafeNumber() function for testing
  - provides: Type guard behavior to test
  - note: P3.M2.T2 will add comprehensive tests for null/undefined handling
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

# Expected: All tests pass including new type guard tests.
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test full core package
pnpm test --filter @formality-ui/core

# Expected: All core tests pass, no regressions.
# Focus areas: expression evaluation, conditions, validation
```

### Level 4: Cross-Package Testing (Optional)

```bash
# Test react package integration (if expression changes affect React usage)
pnpm test --filter @formality-ui/react

# Expected: All React tests pass, expression evaluation works correctly.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] `isSafeNumber()` function added with correct implementation
- [ ] All arithmetic operators (+, -, *, /, %) have type guards
- [ ] Division/modulo by zero returns `undefined` with warning
- [ ] Arithmetic overflow returns `undefined` with warning
- [ ] All tests pass: `pnpm test --filter @formality-ui/core`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] Existing tests updated to expect `undefined` instead of NaN/Infinity

### Feature Validation

- [ ] Non-numeric operands return `undefined`
- [ ] Division by zero returns `undefined`
- [ ] Valid numbers still produce correct results
- [ ] Development warnings logged for invalid operations
- [ ] Development warnings NOT logged in production
- [ ] Type guard tests cover all arithmetic operators
- [ ] Development warning tests verify console output
- [ ] No console warnings in production mode

### Code Quality Validation

- [ ] Follows existing development warning pattern (`process.env.NODE_ENV !== "production"`)
- [ ] Type guard uses `Number.isNaN()` not `isNaN()`
- [ ] Type guard uses `Number.isFinite()` to exclude Infinity
- [ ] Warning messages follow format `[Formality Expression]`
- [ ] Function naming follows conventions (`isSafeNumber`)
- [ ] Code is self-documenting with clear variable names
- [ ] No modifications to comparison operators (out of scope)

### Documentation & Deployment

- [ ] Research documents stored in work item directory
- [ ] PRP includes all context and references
- [ ] Test changes documented in PRP
- [ ] Known gotchas documented for future reference

---

## Anti-Patterns to Avoid

- **Don't modify comparison operators** - Only arithmetic operators (+, -, *, /, %) are in scope
- **Don't use `isNaN()`** - Use `Number.isNaN()` which doesn't coerce values
- **Don't forget `Number.isFinite()`** - Must exclude NaN AND Infinity
- **Don't skip division by zero check** - Explicitly check for `/ 0` and `% 0`
- **Don't skip result validation** - Overflow can produce Infinity even with valid inputs
- **Don't use try-catch for validation** - Type guards are faster and clearer
- **Don't modify test names** - Only update expectations, keep test structure
- **Don't skip environment check** - Always use `process.env.NODE_ENV !== "production"` for warnings
- **Don't modify `evaluateNode` signature** - Use closure to access expr string (simpler)
- **Don't test implementation details** - Test observable behavior (return values, console output)

---

## Related Work Items

- **Parent**: P3.M2 - Type Safety in Expressions (Planned)
- **Parent**: P3.M2.T1 - Add Type Guards (Planned)
- **Sibling**: P3.M2.T1.S2 - Handle null/undefined (Planned)
- **Child**: P3.M2.T2 - Add Tests for Type Safety (Planned)
- **Parallel**: P3.M1 - Memory Leak Prevention (Implementing in parallel)

---

## Contract Dependencies

### From P3.M2.T1.S2 - Handle null/undefined (Planned)

The P3.M2.T1.S2 PRP will handle additional null/undefined edge cases.

**This PRP's Contract**:
1. This PRP implements basic type guards for arithmetic operators
2. This PRP handles non-numeric types (strings, objects, arrays)
3. This PRP handles division by zero
4. This PRP DOES NOT handle complex null/undefined propagation scenarios (P3.M2.T1.S2 scope)
5. This PRP focuses on arithmetic operators only

**Integration Point**: P3.M2.T1.S2 builds upon the type guard foundation established in this PRP.

### To P3.M2.T2 - Add Tests for Type Safety (Planned)

The P3.M2.T2 PRP will add comprehensive tests for type safety.

**This PRP's Contract**:
1. This PRP provides `isSafeNumber()` function for P3.M2.T2 to test
2. This PRP establishes the behavior that P3.M2.T2 will verify
3. This PRP adds basic tests for type guards
4. This PRP DOES NOT add exhaustive edge case tests (P3.M2.T2 scope)

**Integration Point**: P3.M2.T2 will add tests for null arithmetic, mixed types, and comprehensive coverage.

---

## Confidence Score

**9/10** - High confidence for one-pass implementation success

**Reasoning**:
- Clear scope: Add type guards to 5 arithmetic operators only
- Comprehensive research documented with code examples
- Clear implementation patterns from codebase analysis
- Specific file paths and line numbers provided
- Test patterns identified and documented
- Known gotchas and anti-patterns listed
- Existing development warning pattern to follow
- External research provides best practices
- All validation commands specific to project

**Remaining 1 point uncertainty**:
- Existing tests expect NaN/Infinity - updating them is straightforward but requires care to ensure all affected tests are identified

---

## References

### Internal Documentation

- [Type Guard Patterns](./research/type-guard-patterns.md) - TypeScript type guard best practices
- [Development Warning Patterns](./research/development-warning-patterns.md) - Codebase development warning patterns
- [Test Patterns](./research/test-patterns.md) - Test patterns for type safety
- [NaN Handling](./research/nan-handling.md) - NaN handling best practices

### Internal Code Files

- [evaluate.ts](../../../../packages/core/src/expression/evaluate.ts) - Primary implementation file
- [expression.test.ts](../../../../packages/core/src/__tests__/expression.test.ts) - Basic expression tests
- [expression.complex.test.ts](../../../../packages/core/src/__tests__/expression.complex.test.ts) - Complex expression tests (to modify)

### External Documentation

- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) - Type predicate documentation
- [Number.isNaN() MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN) - Use over global isNaN()
- [Number.isFinite() MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite) - Excludes NaN and Infinity
- [typeof MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof) - Runtime type checking

### Research Artifacts

- `/home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S1/research/` - All research documentation

---

## Appendix: Quick Reference

### Implementation Summary

```typescript
// 1. ADD type guard function (after imports, line ~25)
function isSafeNumber(value: unknown): value is number {
  return typeof value === 'number' &&
         !Number.isNaN(value) &&
         Number.isFinite(value);
}

// 2. MODIFY BinaryExpression case (lines 67-137)
// Add type guard check before arithmetic operations
const arithmeticOps = ['+', '-', '*', '/', '%'] as const;
if (arithmeticOps.includes(binaryNode.operator)) {
  if (!isSafeNumber(leftValue) || !isSafeNumber(rightValue)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Formality Expression] Type error...`);
    }
    return undefined;
  }
  // Handle division by zero, perform operation, validate result
}
```

### Test Changes Summary

```typescript
// OLD tests (will fail)
expect(isNaN(evaluate('"text" * 2', {}) as number)).toBe(true);
expect(evaluate('1 / 0', {})).toBe(Infinity);

// NEW tests (after implementation)
expect(evaluate('"text" * 2', {})).toBeUndefined();
expect(evaluate('1 / 0', {})).toBeUndefined();
```

### Operators Affected

| Operator | Type Guard | Division Check | Result Check |
|----------|------------|----------------|--------------|
| `+` | Yes | No | Yes |
| `-` | Yes | No | Yes |
| `*` | Yes | No | Yes |
| `/` | Yes | Yes (zero divisor) | Yes |
| `%` | Yes | Yes (zero divisor) | Yes |

### Operators NOT Affected

| Operator | Reason |
|----------|--------|
| `&&`, `||`, `??` | Logical operators with short-circuit evaluation |
| `===`, `!==` | Strict equality checks (type-safe already) |
| `<`, `>`, `<=`, `>=` | Comparison operators (out of scope) |
| `==`, `!=` | Loose equality (out of scope) |

### Warning Message Format

```
[Formality Expression] Type error in "expr": Invalid operands for +: left=string, right=number
[Formality Expression] Division by zero in "expr"
[Formality Expression] Arithmetic overflow in "expr": Operation 1e308 + 1e308 produced Infinity
```
