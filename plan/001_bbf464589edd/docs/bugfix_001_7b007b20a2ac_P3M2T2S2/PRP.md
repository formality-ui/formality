# Product Requirement Prompt (PRP): Test Mixed Types

**Work Item:** P3.M2.T2.S2
**Parent Task:** P3.M2.T2 - Add Tests for Type Safety
**PRD Bugfix ID:** 001_7b007b20a2ac
**Date:** 2026-01-13

---

## Goal

**Feature Goal**: Create comprehensive test coverage for mixed-type (non-numeric) arithmetic operations that verifies the `isSafeNumber` type guard returns `undefined` for arrays, booleans, objects, and strings (where appropriate) across all arithmetic operations, while validating that string/array concatenation continues to work correctly.

**Deliverable**: Complete test suite in `/packages/core/src/__tests__/expression.complex.test.ts` with dedicated sections for array arithmetic, boolean arithmetic, comprehensive mixed-type development warnings, and array concatenation validation.

**Success Definition**:
- All arithmetic operations (-, *, /, %) return `undefined` when either operand is an array
- All arithmetic operations (+, -, *, /, %) return `undefined` when either operand is a boolean
- All arithmetic operations (-, *, /, %) return `undefined` when either operand is a string
- Array/string concatenation (+) works correctly and produces no warnings
- Development mode shows specific warning messages for mixed-type operations
- Production mode shows no warnings (clean console)
- No errors are thrown during mixed-type arithmetic
- All tests pass with proper edge case coverage

## User Persona

**Target User**: Formality library developers who need to verify that mixed-type handling works correctly across all arithmetic operations.

**Use Case**: After implementing the enhanced `isSafeNumber` type guard (P3.M2.T1.S2) and null/undefined tests (P3.M2.T2.S1), developers need to verify that:
1. Arrays, booleans, objects, and strings are properly rejected in arithmetic contexts
2. String and array concatenation still works for the + operator
3. Development warnings are shown with proper context for all mixed-type scenarios
4. Production builds remain clean and performant
5. All edge cases are covered

**User Journey**:
1. Developer runs the test suite after implementing the test cases
2. All mixed-type arithmetic tests pass, confirming correct behavior
3. Development warning tests pass, verifying proper logging for all non-numeric types
4. Production mode tests pass, confirming no console output
5. Array/string concatenation tests pass, confirming this feature is preserved
6. Developer has confidence that the implementation handles all mixed-type scenarios correctly

**Pain Points Addressed**:
- **Incomplete Test Coverage**: Existing tests only cover basic string/object mixed types, missing arrays and booleans
- **Silent Failures**: Without testing, bugs in mixed-type handling might go unnoticed
- **Feature Regression Risk**: String/array concatenation could be inadvertently broken

## Why

- **Quality Assurance**: Ensures the `isSafeNumber` type guard (P3.M2.T1.S2) correctly rejects all non-numeric types, not just null/undefined
- **Regression Prevention**: Guards against future changes breaking mixed-type handling
- **Feature Preservation**: Ensures string/array concatenation continues to work as intended
- **Documentation**: Tests serve as living documentation of expected behavior for all type combinations
- **Confidence**: Developers can modify the codebase with confidence that tests will catch regressions

## What

### User-Visible Behavior

**Tests verify the following behavior**:

```javascript
// ARRAY ARITHMETIC (except + concatenation)
evaluate('[] - 5', {})      // → undefined (array subtraction undefined)
evaluate('[1] * 2', {})     // → undefined (array multiplication undefined)
evaluate('[] / 2', {})      // → undefined (array division undefined)
evaluate('[] % 2', {})      // → undefined (array modulo undefined)

// ARRAY CONCATENATION (supported)
evaluate('[] + 5', {})      // → "5" (empty array → "" + "5" = "5")
evaluate('[1,2] + 3', {})   // → "1,23" (array joins + concatenation)
evaluate('[] + []', {})     // → "" (both arrays become empty strings)

// BOOLEAN ARITHMETIC (all operators)
evaluate('true + false', {})   // → undefined (booleans rejected in all arithmetic)
evaluate('true - 5', {})       // → undefined
evaluate('false * 2', {})      // → undefined
evaluate('true / 2', {})       // → undefined
evaluate('false % 2', {})      // → undefined

// STRING ARITHMETIC (except + concatenation)
evaluate('"hello" - 5', {})   // → undefined (string subtraction undefined)
evaluate('"text" * 2', {})    // → undefined (string multiplication undefined)
evaluate('"x" / 2', {})       // → undefined (string division undefined)
evaluate('"y" % 2', {})       // → undefined (string modulo undefined)

// STRING CONCATENATION (supported)
evaluate('"hello" + 5', {})   // → "hello5" (string concatenation supported)
evaluate('5 + "world"', {})   // → "5world"
evaluate('"a" + "b"', {})     // → "ab"

// OBJECT ARITHMETIC (all operators)
evaluate('{} + 5', {})        // → undefined (object arithmetic undefined)
evaluate('{} - 5', {})        // → undefined
evaluate('{} * 2', {})        // → undefined
evaluate('{} / 2', {})        // → undefined
evaluate('{} % 2', {})        // → undefined

// Development mode shows warnings for all invalid mixed types
// In NODE_ENV !== "production": console.warn called with "[Formality Expression] Type error: ..."

// Production mode shows no warnings
// In NODE_ENV === "production": console.warn NOT called

// No errors thrown
evaluate('"hello" - 5', {})   // No exception, returns undefined
```

### Success Criteria

- [ ] All arithmetic operators (-, *, /, %) tested with array left operand
- [ ] All arithmetic operators (-, *, /, %) tested with array right operand
- [ ] Array concatenation (+) tested and verified to work correctly
- [ ] All arithmetic operators (+, -, *, /, %) tested with boolean left operand
- [ ] All arithmetic operators (+, -, *, /, %) tested with boolean right operand
- [ ] All arithmetic operators (-, *, /, %) tested with string left operand
- [ ] String concatenation (+) tested and verified to work correctly
- [ ] Object arithmetic tests verified for all operators
- [ ] Development warning tests verify console.warn is called for arrays
- [ ] Development warning tests verify console.warn is called for booleans
- [ ] Development warning tests verify console.warn is called for strings (non-+ operators)
- [ ] Development warning tests verify console.warn is NOT called for valid concatenation
- [ ] Production mode tests verify console.warn is NOT called
- [ ] All tests verify no exceptions are thrown (errors are handled gracefully)
- [ ] Test suite runs successfully with `pnpm test expression.complex.test.ts`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact file path and location for test additions
- Complete existing test patterns to follow
- Exact code snippets for test structure
- All external documentation references
- Specific test examples with expected behavior
- Console spying patterns for development/production testing
- Clarification of existing test coverage to avoid duplication

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Primary Test File to Modify
- file: /packages/core/src/__tests__/expression.complex.test.ts
  why: This is where all arithmetic operation tests are located
  pattern: Nested describe blocks, beforeEach with clearExpressionCache, vi.spyOn for console
  gotcha: Array concatenation IS supported for + operator (see evaluate.ts lines 136-149)
  location: Add new tests after "Development Warnings - Null/Undefined" section (after line ~1700)

# Implementation File to Understand Behavior
- file: /packages/core/src/expression/evaluate.ts
  why: Contains the isSafeNumber type guard and arithmetic operation logic
  pattern: Lines 136-149 show string/array concatenation support for + operator
  pattern: Lines 176-230 show isSafeNumber validation for -, *, /, % operators
  gotcha: String/array concatenation is an intentional feature, NOT a bug
  gotcha: The + operator has special handling - it supports concatenation when either operand is string/array

# Existing Mixed-Type Test Pattern Reference (Lines 1023-1165)
- file: /packages/core/src/__tests__/expression.complex.test.ts:1023-1165
  why: Shows existing mixed-type tests for strings, objects, null, undefined
  pattern: |
    describe("Type Guards - Arithmetic Operations", () => {
      describe("Addition (+)", () => {
        it("should concatenate string + number", () => {
          expect(evaluate('"text" + 1', {})).toBe("text1");
        });
        it("should return undefined for object + number", () => {
          expect(evaluate('{} + 1', {})).toBeUndefined();
        });
      });
      describe("Subtraction (-)", () => {
        it("should return undefined for string - number", () => {
          expect(evaluate('"text" - 1', {})).toBeUndefined();
        });
      });
    });
  gotcha: Note that string+number concatenation IS supported and tested
  gotcha: Only object+number returns undefined for + operator (besides null/undefined)

# Existing Array Concatenation Test (Lines 772-776)
- file: /packages/core/src/__tests__/expression.complex.test.ts:772-776
  why: Shows that array concatenation is already tested for + operator
  pattern: |
    it("should handle array in arithmetic", () => {
      expect(evaluate("[] + 1", {})).toBe("1"); // "" + "1" = "1"
      expect(evaluate("[1, 2] + 3", {})).toBe("1,23"); // "1,2" + "3" = "1,23"
    });
  gotcha: Arrays convert to comma-joined strings for concatenation

# Existing Development Warning Pattern (Lines 1337-1444)
- file: /packages/core/src/__tests__/expression.complex.test.ts:1337-1444
  why: Shows how to test console.warn with vi.spyOn
  pattern: |
    describe("Development Warnings", () => {
      beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it("should warn for non-numeric operands in subtraction", () => {
        evaluate('"text" - 1', {});
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('[Formality Expression]')
        );
      });
    });
  gotcha: Must restore mocks in afterEach to prevent test pollution

# Previous PRP for Context
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T2S1/PRP.md
  why: Defines the null/undefined test patterns that complement this work item
  section: "Implementation Patterns & Key Details" for console testing patterns

# Previous PRP for Context
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S2/PRP.md
  why: Defines the isSafeNumber enhancement that these tests verify
  section: "What" section for expected behavior

# Research Documentation - Mixed-Type Arithmetic
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T2S2/research/external-mixed-type-research.md
  why: Comprehensive research on JavaScript mixed-type arithmetic behavior and why Formality rejects it
  section: "JavaScript's Default Mixed-Type Arithmetic Behavior" for comparison
  section: "Why Formality Returns undefined" for design rationale

# External Documentation - MDN Arithmetic Operators
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators#arithmetic_operators
  why: Reference for JavaScript's default type coercion behavior
  critical: Understanding why Formality chooses to reject this behavior

# External Documentation - Vitest Mocking
- url: https://vitest.dev/guide/mocking.html
  why: Official Vitest documentation on mocking console methods
  critical: Shows vi.spyOn, vi.restoreAllMocks patterns used in this codebase

# External Documentation - Vitest Assertions
- url: https://vitest.dev/api/expect.html
  why: Official Vitest documentation on assertion matchers
  critical: expect.stringContaining, expect.stringMatching for partial matches
```

### Current Codebase Tree (Relevant Sections)

```bash
packages/core/src/
├── expression/
│   ├── evaluate.ts          # IMPLEMENTED in P3.M2.T1.S2 - Enhanced isSafeNumber with type guards
│   ├── context.ts           # Reference for unwrapFieldProxy pattern
│   └── index.ts             # Public API exports
├── __tests__/
│   ├── expression.test.ts           # Basic expression tests
│   └── expression.complex.test.ts   # MAIN FILE - Add tests here
└── types/
    └── (no changes needed)

# Key: expression.complex.test.ts already has extensive test structure
# Add new tests after line ~1700 (after "Development Warnings - Null/Undefined" section)

# Existing test sections:
# - Lines 1023-1165: Type Guards - Arithmetic Operations (basic mixed types)
# - Lines 1166-1335: Null/Undefined Handling (from P3.M2.T2.S1)
# - Lines 1337-1444: Development Warnings (basic mixed-type warnings)
# - Lines 1446-1700+: Development Warnings - Null/Undefined (from P3.M2.T2.S1)
```

### Desired Codebase Tree with Changes

```bash
packages/core/src/
├── expression/
│   ├── evaluate.ts          # (unchanged - already modified in P3.M2.T1.S2)
│   ├── context.ts           # (unchanged)
│   └── index.ts             # (unchanged)
├── __tests__/
│   ├── expression.test.ts           # (unchanged)
│   └── expression.complex.test.ts   # MODIFIED: Added mixed-type tests
│                                               # Added "Array Arithmetic" describe block
│                                               # Added "Boolean Arithmetic" describe block
│                                               # Added "Array Concatenation Validation" describe block
│                                               # Added "Development Warnings - Mixed Types" describe block
│                                               # Added "Production Mode - No Mixed-Type Warnings" describe block
└── types/
    └── (no changes needed)

# No new files needed - modifications only to existing test file
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: String and array concatenation IS supported for + operator
// This is an intentional feature, NOT a bug
// See evaluate.ts lines 136-149
evaluate('"hello" + 5', {})   // → "hello5" (string concatenation)
evaluate('5 + "world"', {})   // → "5world"
evaluate('[] + 5', {})        // → "5" (array → empty string → "5")
evaluate('[1,2] + 3', {})     // → "1,23" (array joins with comma)

// CRITICAL: All other operators (-, *, /, %) reject non-numeric types
evaluate('"hello" - 5', {})   // → undefined (no string subtraction)
evaluate('[] * 2', {})        // → undefined (no array multiplication)
evaluate('true + false', {})  // → undefined (no boolean arithmetic)
evaluate('{} + 5', {})        // → undefined (no object arithmetic)

// CRITICAL: Arrays convert to comma-joined strings for + concatenation
// Empty array → empty string → ""
// [1, 2] → "1,2" → then concatenated
evaluate('[] + []', {})       // → "" (both arrays become empty strings)
evaluate('[1] + [2]', {})     // → "1,2" (arrays join then concatenate)

// CRITICAL: typeof array returns 'object' (JavaScript quirk)
typeof []      // → 'object'
Array.isArray([])  // → true

// CRITICAL: typeof null returns 'object', not 'null' (JavaScript quirk)
typeof null      // → 'object'
typeof undefined // → 'undefined'

// CRITICAL: The isSafeNumber function (from P3.M2.T1.S2) rejects:
// - null, undefined (explicit checks)
// - NaN, Infinity, -Infinity (not finite)
// - non-number types (typeof !== 'number')
// This means arrays, booleans, objects, strings ALL fail isSafeNumber

// CRITICAL: Development warnings use this pattern (existing code):
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `[Formality Expression] Type error: ` +
    `Invalid operands for + (null/undefined not allowed): ` +
    `left=${typeof leftValue}, right=${typeof rightValue}`
  );
}

// CRITICAL: beforeEach(clearExpressionCache) must be called in test suites
// to prevent cached AST from affecting test isolation

// CRITICAL: When testing console.warn, use this pattern:
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// CRITICAL: For testing environment-specific behavior, set NODE_ENV before test:
const originalEnv = process.env.NODE_ENV;
beforeEach(() => {
  process.env.NODE_ENV = originalEnv;
});

it('should warn in development', () => {
  process.env.NODE_ENV = 'development';
  // ... test code
});

it('should not warn in production', () => {
  process.env.NODE_ENV = 'production';
  // ... test code
});

// CRITICAL: The existing test file has multiple describe blocks.
// New tests should follow the same nested structure and be added
// after the "Development Warnings - Null/Undefined" section.

// CRITICAL: Avoid duplicating existing tests
// Lines 1023-1165 already test string, object mixed types
// Lines 772-776 already test array concatenation
// Lines 1082-1084 already test string * number
// Lines 1058-1060 already test string - number
// Focus on NEW test coverage: arrays (-,*,/,%), booleans, comprehensive warnings

// CRITICAL: Work Item Note
// The work item description says '5 + "hello"' should be undefined
// but the code clearly implements string concatenation support
// This appears to be an error in the work item - string concatenation is a feature
// See evaluate.ts lines 136-149 for the concatenation implementation
```

---

## Implementation Blueprint

### Data Models and Structure

**No new data models needed** - This task only adds test coverage for existing functionality.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD "Array Arithmetic" test section
  - CREATE new describe block after "Development Warnings - Null/Undefined" (after line ~1700)
  - IMPLEMENT nested describe blocks for -, *, /, % operators with arrays
  - IMPLEMENT test cases for [] - number, number - [], [] * number, etc.
  - IMPLEMENT test cases for [1,2] - number (non-empty array)
  - DO NOT test + operator (array concatenation is already tested at lines 772-776)
  - FOLLOW pattern: Existing "Type Guards - Arithmetic Operations" structure
  - NAMING: "should return undefined for array {operator} number"
  - PLACEMENT: In /packages/core/src/__tests__/expression.complex.test.ts

Task 2: ADD "Boolean Arithmetic" test section
  - CREATE new describe block for boolean arithmetic tests
  - IMPLEMENT nested describe blocks for all operators (+, -, *, /, %)
  - IMPLEMENT test cases for true + false, true - 5, false * 2, etc.
  - IMPLEMENT test cases for boolean + boolean combinations
  - IMPLEMENT test cases for boolean with number combinations
  - FOLLOW pattern: Existing "Type Guards - Arithmetic Operations" structure
  - NAMING: "should return undefined for boolean {operator} value"
  - PLACEMENT: In /packages/core/src/__tests__/expression.complex.test.ts

Task 3: ADD "Array Concatenation Validation" test section
  - CREATE new describe block to validate array/string concatenation still works
  - IMPLEMENT tests for [] + number (empty array + number)
  - IMPLEMENT tests for [1,2] + number (non-empty array + number)
  - IMPLEMENT tests for array + array concatenation
  - IMPLEMENT tests that verify no warnings for valid concatenation
  - FOLLOW pattern: Existing "Type Guards - Arithmetic Operations" string concatenation tests
  - NAMING: "should concatenate array + number", "should not warn for array concatenation"
  - PLACEMENT: In /packages/core/src/__tests__/expression.complex.test.ts

Task 4: ADD "Development Warnings - Mixed Types" test section
  - CREATE new describe block for mixed-type development warning tests
  - IMPLEMENT beforeEach with vi.spyOn(console, 'warn')
  - IMPLEMENT afterEach with vi.restoreAllMocks()
  - IMPLEMENT tests that verify console.warn is called for array arithmetic (-, *, /, %)
  - IMPLEMENT tests that verify console.warn is called for boolean arithmetic
  - IMPLEMENT tests that verify console.warn is called for string arithmetic (-, *, /, %)
  - IMPLEMENT tests that verify console.warn shows correct type information (typeof)
  - IMPLEMENT tests that verify console.warn is NOT called for valid concatenation
  - FOLLOW pattern: Existing "Development Warnings" structure at lines 1337-1444
  - NAMING: "should warn when {operator} has array operand"
  - PLACEMENT: In /packages/core/src/__tests__/expression.complex.test.ts

Task 5: ADD "Production Mode - No Mixed-Type Warnings" test section
  - CREATE new describe block for production mode tests
  - IMPLEMENT tests that verify console.warn is NOT called when NODE_ENV=production
  - IMPLEMENT tests for arrays, booleans, strings in production mode
  - IMPLEMENT environment variable setup/teardown (save/restore original NODE_ENV)
  - FOLLOW pattern: Environment testing from P3.M2.T2.S1 PRP
  - NAMING: "should not warn in production mode for {type}"
  - PLACEMENT: In /packages/core/src/__tests__/expression.complex.test.ts

Task 6: VERIFY all tests pass
  - RUN: pnpm test expression.complex.test.ts
  - CHECK: All new tests pass
  - CHECK: All existing tests still pass (no regression)
  - VALIDATE: Test coverage includes new mixed-type paths

Task 7: RUN full test suite validation
  - RUN: pnpm test --filter core
  - CHECK: No test failures
  - CHECK: No TypeScript errors
  - VALIDATE: Complete test suite passes
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Array Arithmetic Tests
// LOCATION: After line ~1700 in expression.complex.test.ts

describe("Array Arithmetic", () => {
  beforeEach(() => {
    clearExpressionCache();
  });

  describe("Subtraction (-)", () => {
    it("should return undefined for empty array - number", () => {
      expect(evaluate('[] - 5', {})).toBeUndefined();
    });

    it("should return undefined for number - empty array", () => {
      expect(evaluate('5 - []', {})).toBeUndefined();
    });

    it("should return undefined for non-empty array - number", () => {
      expect(evaluate('[1, 2] - 5', {})).toBeUndefined();
    });

    it("should return undefined for array - array", () => {
      expect(evaluate('[] - []', {})).toBeUndefined();
    });

    it("should work with valid numbers (regression test)", () => {
      expect(evaluate('5 - 3', {})).toBe(2);
    });
  });

  describe("Multiplication (*)", () => {
    it("should return undefined for array * number", () => {
      expect(evaluate('[] * 2', {})).toBeUndefined();
    });

    it("should return undefined for number * array", () => {
      expect(evaluate('2 * []', {})).toBeUndefined();
    });

    it("should return undefined for non-empty array * number", () => {
      expect(evaluate('[1] * 3', {})).toBeUndefined();
    });
  });

  // Similar patterns for /, %
  // Note: Do NOT test + operator here - that's covered in "Array Concatenation Validation"
});

// PATTERN 2: Boolean Arithmetic Tests
// LOCATION: After Array Arithmetic section

describe("Boolean Arithmetic", () => {
  beforeEach(() => {
    clearExpressionCache();
  });

  describe("Addition (+)", () => {
    it("should return undefined for boolean + boolean", () => {
      expect(evaluate('true + false', {})).toBeUndefined();
    });

    it("should return undefined for boolean + number", () => {
      expect(evaluate('true + 5', {})).toBeUndefined();
    });

    it("should return undefined for number + boolean", () => {
      expect(evaluate('5 + false', {})).toBeUndefined();
    });
  });

  describe("Subtraction (-)", () => {
    it("should return undefined for boolean - boolean", () => {
      expect(evaluate('true - false', {})).toBeUndefined();
    });

    it("should return undefined for boolean - number", () => {
      expect(evaluate('true - 5', {})).toBeUndefined();
    });

    it("should return undefined for number - boolean", () => {
      expect(evaluate('5 - false', {})).toBeUndefined();
    });

    it("should work with valid numbers (regression test)", () => {
      expect(evaluate('5 - 3', {})).toBe(2);
    });
  });

  // Similar patterns for *, /, %
});

// PATTERN 3: Array Concatenation Validation Tests
// LOCATION: After Boolean Arithmetic section

describe("Array Concatenation Validation", () => {
  beforeEach(() => {
    clearExpressionCache();
  });

  describe("Addition (+)", () => {
    it("should concatenate empty array + number", () => {
      // Empty array becomes empty string, then concatenated
      expect(evaluate('[] + 5', {})).toBe("5");
    });

    it("should concatenate number + empty array", () => {
      expect(evaluate('5 + []', {})).toBe("5");
    });

    it("should concatenate non-empty array + number", () => {
      // [1, 2] becomes "1,2" then concatenated with "3"
      expect(evaluate('[1, 2] + 3', {})).toBe("1,23");
    });

    it("should concatenate array + array", () => {
      // Both arrays become empty strings
      expect(evaluate('[] + []', {})).toBe("");
    });

    it("should concatenate non-empty arrays", () => {
      expect(evaluate('[1] + [2]', {})).toBe("1,2");
    });

    it("should concatenate array + string", () => {
      expect(evaluate('[] + "test"', {})).toBe("test");
      expect(evaluate('[1,2] + "test"', {})).toBe("1,2test");
    });
  });
});

// PATTERN 4: Development Warning Tests
// LOCATION: After Array Concatenation Validation section

describe("Development Warnings - Mixed Types", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clearExpressionCache();
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Array Arithmetic Warnings", () => {
    it("should warn for array subtraction", () => {
      evaluate('[] - 5', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Type error')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid operands')
      );
    });

    it("should show correct type information for array", () => {
      evaluate('[] - 5', {});

      // typeof [] is 'object'
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('left=object')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('right=number')
      );
    });

    it("should warn for array multiplication", () => {
      evaluate('[1] * 2', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
    });
  });

  describe("Boolean Arithmetic Warnings", () => {
    it("should warn for boolean addition", () => {
      evaluate('true + false', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Type error')
      );
    });

    it("should show correct type information for boolean", () => {
      evaluate('true + 5', {});

      // typeof true is 'boolean'
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('left=boolean')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('right=number')
      );
    });

    it("should warn for boolean subtraction", () => {
      evaluate('false - 5', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid operands')
      );
    });
  });

  describe("String Arithmetic Warnings (non-addition)", () => {
    it("should warn for string subtraction", () => {
      evaluate('"hello" - 5', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Formality Expression]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Type error')
      );
    });

    it("should show correct type information for string", () => {
      evaluate('"text" * 2', {});

      // typeof "text" is 'string'
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('left=string')
      );
    });
  });

  describe("No Warnings for Valid Concatenation", () => {
    it("should not warn for string + number concatenation", () => {
      evaluate('"hello" + 5', {});

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should not warn for array + number concatenation", () => {
      evaluate('[] + 5', {});

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should not warn for string + string concatenation", () => {
      evaluate('"hello" + "world"', {});

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should not warn for array + array concatenation", () => {
      evaluate('[] + []', {});

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});

// PATTERN 5: Production Mode Tests
// LOCATION: After Development Warnings section

describe("Production Mode - No Mixed-Type Warnings", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    clearExpressionCache();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should not warn for array arithmetic in production", () => {
    process.env.NODE_ENV = 'production';
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    evaluate('[] - 5', {});
    evaluate('[1] * 2', {});

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should not warn for boolean arithmetic in production", () => {
    process.env.NODE_ENV = 'production';
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    evaluate('true + false', {});
    evaluate('true - 5', {});

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should not warn for string arithmetic in production", () => {
    process.env.NODE_ENV = 'production';
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    evaluate('"hello" - 5', {});
    evaluate('"text" * 2', {});

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should still return undefined in production for mixed types", () => {
    process.env.NODE_ENV = 'production';

    expect(evaluate('[] - 5', {})).toBeUndefined();
    expect(evaluate('true + false', {})).toBeUndefined();
    expect(evaluate('"hello" - 5', {})).toBeUndefined();
  });

  it("should still concatenate in production", () => {
    process.env.NODE_ENV = 'production';

    expect(evaluate('"hello" + 5', {})).toBe("hello5");
    expect(evaluate('[] + 5', {})).toBe("5");
  });
});
```

### Integration Points

```yaml
NO NEW INTEGRATIONS NEEDED

This task only adds tests to verify existing behavior:

TEST_SUITE:
  - file: packages/core/src/__tests__/expression.complex.test.ts
  - section: After "Development Warnings - Null/Undefined" (line ~1700)
  - impact: Adds comprehensive mixed-type test coverage
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after adding tests to expression.complex.test.ts
cd /home/dustin/projects/formality

# Type checking (TypeScript)
pnpm exec tsc --noEmit --project packages/core/tsconfig.json

# Expected: Zero type errors in test file

# Linting (if ESLint is configured)
pnpm run lint 2>/dev/null || echo "No lint script configured"

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run specific test file for expression evaluation
cd /home/dustin/projects/formality
pnpm test expression.complex.test.ts

# Run only new array arithmetic tests
pnpm test expression.complex.test.ts --grep "Array Arithmetic"

# Run only new boolean arithmetic tests
pnpm test expression.complex.test.ts --grep "Boolean Arithmetic"

# Run only new concatenation validation tests
pnpm test expression.complex.test.ts --grep "Array Concatenation Validation"

# Run only new mixed-type warning tests
pnpm test expression.complex.test.ts --grep "Development Warnings - Mixed Types"

# Run only production mode tests
pnpm test expression.complex.test.ts --grep "Production Mode - No Mixed-Type Warnings"

# Full test suite for core package
pnpm test --filter core

# Expected:
# - All new tests pass
# - All existing tests pass (no regression)
# - Test coverage for mixed-type arithmetic is comprehensive
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify tests work in different environments
cd /home/dustin/projects/formality

# Test in development mode (default)
NODE_ENV=development pnpm test expression.complex.test.ts --grep "Array"

# Test in production mode
NODE_ENV=production pnpm test expression.complex.test.ts --grep "Array"

# Expected:
# - Development mode: All tests pass, warnings are verified
# - Production mode: All tests pass, no warnings expected

# Verify no errors are thrown during execution
pnpm test expression.complex.test.ts --grep "Boolean" --reporter=verbose

# Expected: All tests complete without unhandled exceptions

# Verify concatenation still works
pnpm test expression.complex.test.ts --grep "Array Concatenation Validation"

# Expected: All concatenation tests pass, no warnings
```

### Level 4: Coverage Verification

```bash
# Check test coverage for mixed-type paths
cd /home/dustin/projects/formality

# Run with coverage (if coverage tools are configured)
pnpm test --coverage --filter core 2>/dev/null || echo "Coverage not configured"

# Check specifically for isSafeNumber coverage
pnpm test --coverage 2>/dev/null | grep -A 5 "isSafeNumber" || echo "Use vitest UI for detailed coverage"

# Expected:
# - isSafeNumber function shows 100% coverage
# - All arithmetic operation branches covered
# - Mixed-type specific branches covered
# - String/array concatenation branches covered
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All arithmetic operators (-, *, /, %) have array operand tests
- [ ] All arithmetic operators (+, -, *, /, %) have boolean operand tests
- [ ] All arithmetic operators (-, *, /, %) have string operand tests (where not already tested)
- [ ] Array concatenation (+) tests verify correct behavior
- [ ] String concatenation (+) tests verify correct behavior
- [ ] Development warning tests verify console.warn is called for arrays
- [ ] Development warning tests verify console.warn is called for booleans
- [ ] Development warning tests verify console.warn is NOT called for valid concatenation
- [ ] Production mode tests verify console.warn is NOT called
- [ ] Environment variable setup/teardown is correct
- [ ] All tests pass: `pnpm test expression.complex.test.ts`
- [ ] No TypeScript type errors in test file
- [ ] beforeEach(clearExpressionCache) is called in all describe blocks

### Feature Validation

- [ ] `evaluate('[] - 5', {})` returns `undefined`
- [ ] `evaluate('[1] * 2', {})` returns `undefined`
- [ ] `evaluate('[] / 2', {})` returns `undefined`
- [ ] `evaluate('[] % 2', {})` returns `undefined`
- [ ] `evaluate('true + false', {})` returns `undefined`
- [ ] `evaluate('true - 5', {})` returns `undefined`
- [ ] `evaluate('false * 2', {})` returns `undefined`
- [ ] `evaluate('true / 2', {})` returns `undefined`
- [ ] `evaluate('false % 2', {})` returns `undefined`
- [ ] `evaluate('"hello" - 5', {})` returns `undefined`
- [ ] `evaluate('"text" * 2', {})` returns `undefined`
- [ ] `evaluate('"x" / 2', {})` returns `undefined`
- [ ] `evaluate('"y" % 2', {})` returns `undefined`
- [ ] `evaluate('[] + 5', {})` returns `"5"` (array concatenation works)
- [ ] `evaluate('"hello" + 5', {})` returns `"hello5"` (string concatenation works)
- [ ] Console.warn shows "[Formality Expression]" in development mode for mixed types
- [ ] Console.warn shows "Type error" in development mode
- [ ] Console.warn shows correct type information (typeof)
- [ ] Console.warn is NOT called for valid concatenation operations
- [ ] Console.warn is NOT called in production mode
- [ ] No exceptions are thrown during mixed-type arithmetic
- [ ] Valid number operations still work (regression check)

### Code Quality Validation

- [ ] Test structure follows existing pattern (nested describe blocks)
- [ ] Test names are descriptive: "should return undefined for X"
- [ ] Console spy setup/teardown is correct (beforeEach/afterEach)
- [ ] Environment variable setup/teardown is correct (save/restore)
- [ ] Test file placement: `/packages/core/src/__tests__/expression.complex.test.ts`
- [ ] Tests added after existing "Development Warnings - Null/Undefined" section
- [ ] No duplicate test cases (verified against existing tests at lines 1023-1444)
- [ ] Boolean tests are NEW (not previously tested)
- [ ] Array arithmetic tests are NEW (only concatenation was tested)

### Documentation & Deployment

- [ ] Test comments explain key behaviors (array concatenation, typeof quirks)
- [ ] Test names clearly indicate what is being tested
- [ ] Test assertions use appropriate matchers (toBeUndefined, toBe, toHaveBeenCalled, etc.)
- [ ] Console assertions use partial matchers (expect.stringContaining)
- [ ] Work item error noted: '5 + "hello"' is "5hello" (feature, not bug)

---

## Anti-Patterns to Avoid

- ❌ Don't test `evaluate('5 + "hello"', {})` expecting `undefined` - string concatenation is a feature
- ❌ Don't test + operator for arrays in "Array Arithmetic" section - use "Array Concatenation Validation"
- ❌ Don't duplicate existing tests - lines 1023-1165 already test string/object mixed types
- ❌ Don't duplicate existing tests - lines 772-776 already test array concatenation
- ❌ Don't forget to call `clearExpressionCache()` in beforeEach
- ❌ Don't forget to restore console mocks in afterEach
- ❌ Don't forget to save/restore NODE_ENV in environment tests
- ❌ Don't use exact string matches for console warnings - use `expect.stringContaining`
- ❌ Don't test implementation details - test behavior (undefined return, no errors)
- ❌ Don't skip production mode tests - environment-specific behavior must be verified
- ❌ Don't assume `typeof []` is 'array' - it's 'object' (JavaScript quirk)
- ❌ Don't assume `typeof null` is 'null' - it's 'object' (JavaScript quirk)
- ❌ Don't forget regression tests for valid number operations
- ❌ Don't add tests outside the existing test file structure

---

## Additional Context

### Relationship to Previous Work

This task builds on previous work items in the Type Safety in Expressions milestone:

**P3.M2.T1.S2 - Handle null/undefined in Arithmetic Operations**:
- Enhanced `isSafeNumber` with explicit null/undefined checks
- Added JSDoc documentation
- Enhanced warning messages

**P3.M2.T2.S1 - Test Null Arithmetic** (Currently Being Implemented):
- Tests for null/undefined arithmetic operations
- Development warning verification for null/undefined
- Production mode validation

This task **(P3.M2.T2.S2)** completes the type safety test coverage by:
1. Testing array arithmetic (beyond concatenation)
2. Testing boolean arithmetic
3. Testing comprehensive mixed-type warnings
4. Validating string/array concatenation continues to work

### Scope Clarification

The work item description says `'5 + "hello"'` should be `undefined`, but **this appears to be an error in the work item**. The code clearly implements string concatenation support:

```typescript
// evaluate.ts lines 136-149
if (leftIsString || rightIsString || leftIsArray || rightIsArray) {
  // Convert arrays to strings for concatenation
  const leftStr = leftIsArray ? (leftValue as unknown[]).join(',') : String(leftValue ?? '');
  const rightStr = rightIsArray ? (rightValue as unknown[]).join(',') : String(rightValue ?? '');
  return leftStr + rightStr;
}
```

This is an **intentional feature** of the Formality library - string and array concatenation is supported for the + operator. The existing tests at lines 1025-1036 and 772-776 confirm this.

### Why Mixed-Type Testing Matters

While the `isSafeNumber` type guard works correctly (via explicit type checking), comprehensive tests for arrays and booleans are essential for:

1. **Coverage Completeness**: Arrays and booleans were not explicitly tested
2. **Regression Prevention**: Future changes won't break mixed-type handling
3. **Documentation**: Tests serve as executable documentation of expected behavior
4. **Confidence**: Developers can modify code with confidence tests will catch issues
5. **Feature Preservation**: Ensures concatenation feature is not inadvertently broken

### JavaScript Quirks to Remember

```javascript
// typeof returns 'object' for arrays and null
typeof []      // → 'object' (not 'array')
typeof null    // → 'object' (not 'null')
typeof {}      // → 'object'
typeof true    // → 'boolean'
typeof "text"  // → 'string'

// This affects warning message content:
// evaluate('[] - 5', {}) will show "left=object, right=number"
// evaluate('null + 5', {}) will show "left=object, right=number"

// Use Array.isArray() to distinguish arrays from objects
Array.isArray([])   // → true
Array.isArray({})   // → false
Array.isArray(null) // → false
```

### Expected Test Count

For comprehensive coverage, expect to write approximately:
- **16 tests** for array arithmetic (-, *, /, % with various combinations)
- **20 tests** for boolean arithmetic (5 operators × 4 scenarios each)
- **8 tests** for array concatenation validation
- **12 tests** for development warnings (arrays, booleans, strings)
- **5 tests** for production mode validation
- **5 tests** for regression (valid number operations per operator)

Total: ~66 test cases

---

## Confidence Score

**9/10** for one-pass implementation success

**Reasoning**:
- ✅ Clear, specific testing target (mixed-type test coverage)
- ✅ Comprehensive existing context (exact file paths, line numbers, patterns)
- ✅ Well-defined success criteria with testable outcomes
- ✅ No new dependencies or architectural changes
- ✅ Previous PRPs (P3.M2.T1.S2, P3.M2.T2.S1) define exact behavior to test
- ✅ Existing test patterns provide clear structure to follow
- ✅ External research provides comprehensive context on mixed-type behavior
- ✅ Work item error identified and clarified (string concatenation is a feature)
- ⚠️ Minor complexity: Distinguishing new tests from existing tests requires care

**Validation**: The completed PRP includes exact test patterns, file locations, console spying setup, comprehensive coverage requirements, and clarification of the string concatenation feature. An AI agent unfamiliar with the codebase should be able to implement these tests successfully using only the PRP content and codebase access.

---

**PRP Version:** 1.0
**Last Updated:** 2026-01-13
**Status:** Ready for Implementation
