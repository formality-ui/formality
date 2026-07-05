# Product Requirement Prompt (PRP): Test Null Arithmetic

**Work Item:** P3.M2.T2.S1
**Parent Task:** P3.M2.T2 - Add Tests for Type Safety
**PRD Bugfix ID:** 001_7b007b20a2ac
**Date:** 2026-01-13

---

## Goal

**Feature Goal**: Create comprehensive test coverage for null/undefined arithmetic operations that verifies the enhanced `isSafeNumber` type guard returns `undefined` for null/undefined operands across all arithmetic operations.

**Deliverable**: Complete test suite in `/packages/core/src/__tests__/expression.complex.test.ts` with dedicated sections for null/undefined arithmetic operations, development warning verification, and environment-specific behavior.

**Success Definition**:

- All arithmetic operations (+, -, \*, /, %) return `undefined` when either operand is null/undefined
- Development mode shows specific warning messages mentioning null/undefined
- Production mode shows no warnings (clean console)
- No errors are thrown during null/undefined arithmetic
- All tests pass with proper edge case coverage
- Test coverage report shows 100% coverage for null/undefined arithmetic paths

## User Persona

**Target User**: Formality library developers who need to verify that null/undefined handling works correctly across all arithmetic operations.

**Use Case**: After implementing the enhanced `isSafeNumber` type guard (P3.M2.T1.S2), developers need to verify that:

1. The implementation correctly rejects null/undefined values
2. Development warnings are shown with proper context
3. Production builds remain clean and performant
4. All edge cases are covered

**User Journey**:

1. Developer runs the test suite after implementing null/undefined handling
2. All null/undefined arithmetic tests pass, confirming correct behavior
3. Development warning tests pass, verifying proper logging
4. Production mode tests pass, confirming no console output
5. Developer has confidence that the implementation is correct

**Pain Points Addressed**:

- **Unclear Test Coverage**: Without dedicated tests, it's unclear if null/undefined handling is complete
- **Silent Failures**: Without testing, bugs in null/undefined handling might go unnoticed
- **Environment Concerns**: Without explicit tests, warnings might leak to production

## Why

- **Quality Assurance**: Ensures the enhanced `isSafeNumber` type guard (P3.M2.T1.S2) works as specified
- **Regression Prevention**: Guards against future changes breaking null/undefined handling
- **Documentation**: Tests serve as living documentation of expected behavior
- **Confidence**: Developers can modify the codebase with confidence that tests will catch regressions

## What

### User-Visible Behavior

**Tests verify the following behavior**:

```javascript
// All return undefined (not NaN, not 0)
evaluate("5 + null", { null: null }); // → undefined
evaluate("null + 5", { null: null }); // → undefined
evaluate("undefined - 5", { undefined }); // → undefined
evaluate("10 - undefined", { undefined }); // → undefined
evaluate("null * 5", { null: null }); // → undefined
evaluate("undefined * 5", { undefined }); // → undefined
evaluate("null / 2", { null: null }); // → undefined
evaluate("null % 3", { null: null }); // → undefined
evaluate("null + null", { null: null }); // → undefined
evaluate("undefined * undefined", { undefined }); // → undefined

// Development mode shows warnings
// In NODE_ENV !== "production": console.warn called with "[Formality Expression] Type error: ..."

// Production mode shows no warnings
// In NODE_ENV === "production": console.warn NOT called

// No errors thrown
evaluate("null + 5", { null: null }); // No exception, returns undefined
```

### Success Criteria

- [ ] All 5 arithmetic operators (+, -, \*, /, %) tested with null left operand
- [ ] All 5 arithmetic operators (+, -, \*, /, %) tested with null right operand
- [ ] All 5 arithmetic operators (+, -, \*, /, %) tested with null + null
- [ ] All 5 arithmetic operators (+, -, \*, /, %) tested with undefined left operand
- [ ] All 5 arithmetic operators (+, -, \*, /, %) tested with undefined right operand
- [ ] All 5 arithmetic operators (+, -, \*, /, %) tested with undefined + undefined
- [ ] Development warning tests verify console.warn is called with expected messages
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

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Primary Test File to Modify
- file: /packages/core/src/__tests__/expression.complex.test.ts
  why: This is where all arithmetic operation tests are located
  pattern: Nested describe blocks, beforeEach with clearExpressionCache, vi.spyOn for console
  gotcha: jsep parses 'null' and 'undefined' as identifiers, so provide them in context
  location: Add new tests after existing "Type Guards - Arithmetic Operations" section (line ~1165)

# Existing Test Pattern Reference (Lines 1023-1165)
- file: /packages/core/src/__tests__/expression.complex.test.ts:1023-1165
  why: Shows the exact pattern for type guard tests
  pattern: |
    describe("Type Guards - Arithmetic Operations", () => {
      describe("Addition (+)", () => {
        it("should return undefined for null + number", () => {
          expect(evaluate('null + 1', { null: null })).toBeUndefined();
        });
      });
    });
  gotcha: Must provide { null: null } in context because jsep parses 'null' as identifier

# Existing Development Warning Pattern (Lines 1167-1274)
- file: /packages/core/src/__tests__/expression.complex.test.ts:1167-1274
  why: Shows how to test console.warn with vi.spyOn
  pattern: |
    describe("Development Warnings", () => {
      beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it("should warn for non-numeric operands", () => {
        evaluate('"text" - 1', {});
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('[Formality Expression]')
        );
      });
    });
  gotcha: Must restore mocks in afterEach to prevent test pollution

# Implementation File to Understand Behavior
- file: /packages/core/src/expression/evaluate.ts
  why: Contains the isSafeNumber type guard and arithmetic operation logic
  pattern: All arithmetic operations check isSafeNumber before proceeding
  gotcha: The enhanced isSafeNumber now has explicit null/undefined checks

# Previous PRP for Context
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T1S2/PRP.md
  why: Defines the isSafeNumber enhancement that these tests verify
  section: "What" section for expected behavior

# Research Documentation
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P3M2T2S1/research/external-testing-patterns.md
  why: Comprehensive research on Vitest console testing patterns
  section: "Vitest Console Testing Patterns" for spy setup/teardown

# External Documentation - Vitest Mocking
- url: https://vitest.dev/guide/mocking.html
  why: Official Vitest documentation on mocking console methods
  critical: Shows vi.spyOn, vi.restoreAllMocks patterns used in this codebase

# External Documentation - Vitest Assertions
- url: https://vitest.dev/api/expect.html
  why: Official Vitest documentation on assertion matchers
  critical: expect.stringContaining, expect.stringMatching for partial matches

# External Documentation - TypeScript Null Handling
- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  why: Understanding type guards and why null/undefined must be explicitly tested
```

### Current Codebase Tree (Relevant Sections)

```bash
packages/core/src/
├── expression/
│   ├── evaluate.ts          # IMPLEMENTED in P3.M2.T1.S2 - Enhanced isSafeNumber with null/undefined checks
│   ├── context.ts           # Reference for unwrapFieldProxy pattern
│   └── index.ts             # Public API exports
├── __tests__/
│   ├── expression.test.ts           # Basic expression tests
│   └── expression.complex.test.ts   # MAIN FILE - Add tests here
└── types/
    └── (no changes needed)

# Key: expression.complex.test.ts already has extensive test structure
# Add new tests after line ~1165 (end of existing Type Guards section)
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
│   └── expression.complex.test.ts   # MODIFIED: Added null/undefined arithmetic tests
│                                               # Added "Null/Undefined Arithmetic" describe block
│                                               # Added "Development Warnings - Null/Undefined" describe block
│                                               # Added "Production Mode - No Warnings" describe block
└── types/
    └── (no changes needed)

# No new files needed - modifications only to existing test file
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: jsep parses 'null' and 'undefined' as Identifiers, not Literals
// Therefore, you MUST provide them in the context object for testing:
evaluate("null + 5", { null: null }); // CORRECT
evaluate("null + 5", {}); // INCORRECT - 'null' is undefined in context

// CRITICAL: typeof null returns 'object', not 'null' (JavaScript quirk)
typeof null; // → 'object'
typeof undefined; // → 'undefined'

// CRITICAL: The enhanced isSafeNumber function (from P3.M2.T1.S2) now has:
// - Explicit check: value === null || value === undefined
// - JSDoc documentation
// - Enhanced warning messages mentioning "null/undefined"

// CRITICAL: Development warnings use this pattern (existing code):
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `[Formality Expression] Type error: ` +
      `Invalid operands for + (null/undefined not allowed): ` +
      `left=${typeof leftValue}, right=${typeof rightValue}`,
  );
}

// CRITICAL: beforeEach(clearExpressionCache) must be called in test suites
// to prevent cached AST from affecting test isolation

// CRITICAL: When testing console.warn, use this pattern:
beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// CRITICAL: For testing environment-specific behavior, set NODE_ENV before test:
const originalEnv = process.env.NODE_ENV;
beforeEach(() => {
  process.env.NODE_ENV = originalEnv;
});

it("should warn in development", () => {
  process.env.NODE_ENV = "development";
  // ... test code
});

it("should not warn in production", () => {
  process.env.NODE_ENV = "production";
  // ... test code
});

// CRITICAL: The existing test file has multiple describe blocks.
// New tests should follow the same nested structure and be added
// after the "Type Guards - Arithmetic Operations" section.
```

---

## Implementation Blueprint

### Data Models and Structure

**No new data models needed** - This task only adds test coverage for existing functionality.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD "Null/Undefined Arithmetic" test section
  - CREATE new describe block after "Type Guards - Arithmetic Operations" (after line ~1165)
  - IMPLEMENT nested describe blocks for each arithmetic operator (+, -, *, /, %)
  - IMPLEMENT test cases for null + number, number + null, null + null
  - IMPLEMENT test cases for undefined + number, number + undefined, undefined + undefined
  - FOLLOW pattern: Existing "Type Guards - Arithmetic Operations" structure at lines 1023-1165
  - NAMING: "should return undefined for {operator} with null/undefined"
  - PLACEMENT: In /packages/core/src/__tests__/expression.complex.test.ts

Task 2: ADD "Development Warnings - Null/Undefined" test section
  - CREATE new describe block for development warning tests
  - IMPLEMENT beforeEach with vi.spyOn(console, 'warn')
  - IMPLEMENT afterEach with vi.restoreAllMocks()
  - IMPLEMENT tests that verify console.warn is called for null/undefined operands
  - IMPLEMENT tests that verify warning message contains "null/undefined" text
  - FOLLOW pattern: Existing "Development Warnings" structure at lines 1167-1274
  - NAMING: "should warn when {operator} has null/undefined operand"
  - PLACEMENT: In /packages/core/src/__tests__/expression.complex.test.ts

Task 3: ADD "Production Mode - No Warnings" test section
  - CREATE new describe block for production mode tests
  - IMPLEMENT tests that verify console.warn is NOT called when NODE_ENV=production
  - IMPLEMENT environment variable setup/teardown (save/restore original NODE_ENV)
  - FOLLOW pattern: Environment testing from research/external-testing-patterns.md
  - NAMING: "should not warn in production mode for {operator}"
  - PLACEMENT: In /packages/core/src/__tests__/expression.complex.test.ts

Task 4: VERIFY all tests pass
  - RUN: pnpm test expression.complex.test.ts
  - CHECK: All new tests pass
  - CHECK: All existing tests still pass (no regression)
  - VALIDATE: Test coverage includes new null/undefined paths

Task 5: RUN full test suite validation
  - RUN: pnpm test --filter core
  - CHECK: No test failures
  - CHECK: No TypeScript errors
  - VALIDATE: Complete test suite passes
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Null/Undefined Arithmetic Tests
// LOCATION: After line ~1165 in expression.complex.test.ts

describe("Null/Undefined Arithmetic", () => {
  beforeEach(() => {
    clearExpressionCache();
  });

  describe("Addition (+)", () => {
    it("should return undefined for null + number", () => {
      // jsep parses 'null' as identifier, so provide it in context
      expect(evaluate("null + 5", { null: null })).toBeUndefined();
    });

    it("should return undefined for number + null", () => {
      expect(evaluate("5 + null", { null: null })).toBeUndefined();
    });

    it("should return undefined for null + null", () => {
      expect(evaluate("null + null", { null: null })).toBeUndefined();
    });

    it("should return undefined for undefined + number", () => {
      expect(evaluate("undefined + 5", { undefined })).toBeUndefined();
    });

    it("should return undefined for number + undefined", () => {
      expect(evaluate("5 + undefined", { undefined })).toBeUndefined();
    });

    it("should return undefined for undefined + undefined", () => {
      expect(evaluate("undefined + undefined", { undefined })).toBeUndefined();
    });

    it("should work with valid numbers (regression test)", () => {
      expect(evaluate("5 + 3", {})).toBe(8);
    });
  });

  // Repeat similar patterns for -, *, /, %
  describe("Subtraction (-)", () => {
    it("should return undefined for null - number", () => {
      expect(evaluate("null - 5", { null: null })).toBeUndefined();
    });

    it("should return undefined for number - null", () => {
      expect(evaluate("5 - null", { null: null })).toBeUndefined();
    });

    it("should return undefined for null - null", () => {
      expect(evaluate("null - null", { null: null })).toBeUndefined();
    });

    it("should return undefined for undefined - number", () => {
      expect(evaluate("undefined - 5", { undefined })).toBeUndefined();
    });

    it("should return undefined for number - undefined", () => {
      expect(evaluate("5 - undefined", { undefined })).toBeUndefined();
    });

    it("should return undefined for undefined - undefined", () => {
      expect(evaluate("undefined - undefined", { undefined })).toBeUndefined();
    });

    it("should work with valid numbers (regression test)", () => {
      expect(evaluate("10 - 4", {})).toBe(6);
    });
  });

  // Multiplication, Division, Modulo follow same pattern
});

// PATTERN 2: Development Warning Tests
// LOCATION: After Null/Undefined Arithmetic section

describe("Development Warnings - Null/Undefined", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clearExpressionCache();
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Addition (+)", () => {
    it("should warn for null + number", () => {
      evaluate("null + 5", { null: null });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Formality Expression]"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Type error"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("null/undefined"),
      );
    });

    it("should show operand types in warning", () => {
      evaluate("null + 5", { null: null });

      // typeof null is 'object'
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("left=object"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("right=number"),
      );
    });
  });

  // Similar tests for -, *, /, %
});

// PATTERN 3: Production Mode Tests
// LOCATION: After Development Warnings section

describe("Production Mode - No Warnings", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    clearExpressionCache();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should not warn for null arithmetic in production", () => {
    process.env.NODE_ENV = "production";
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    evaluate("null + 5", { null: null });
    evaluate("undefined * 3", { undefined });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should still return undefined in production", () => {
    process.env.NODE_ENV = "production";

    expect(evaluate("null + 5", { null: null })).toBeUndefined();
    expect(evaluate("undefined - 3", { undefined })).toBeUndefined();
  });
});
```

### Integration Points

```yaml
NO NEW INTEGRATIONS NEEDED

This task only adds tests to verify existing behavior:

TEST_SUITE:
  - file: packages/core/src/__tests__/expression.complex.test.ts
  - section: After "Type Guards - Arithmetic Operations" (line ~1165)
  - impact: Adds comprehensive null/undefined test coverage
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

# Run only new null/undefined tests
pnpm test expression.complex.test.ts --grep "Null/Undefined Arithmetic"

# Run only development warning tests
pnpm test expression.complex.test.ts --grep "Development Warnings - Null/Undefined"

# Run only production mode tests
pnpm test expression.complex.test.ts --grep "Production Mode"

# Full test suite for core package
pnpm test --filter core

# Expected:
# - All new tests pass
# - All existing tests pass (no regression)
# - Test coverage for null/undefined arithmetic is 100%
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify tests work in different environments
cd /home/dustin/projects/formality

# Test in development mode (default)
NODE_ENV=development pnpm test expression.complex.test.ts --grep "Null/Undefined"

# Test in production mode
NODE_ENV=production pnpm test expression.complex.test.ts --grep "Null/Undefined"

# Expected:
# - Development mode: All tests pass, warnings are verified
# - Production mode: All tests pass, no warnings expected

# Verify no errors are thrown during execution
pnpm test expression.complex.test.ts --grep "Null/Undefined" --reporter=verbose

# Expected: All tests complete without unhandled exceptions
```

### Level 4: Coverage Verification

```bash
# Check test coverage for null/undefined paths
cd /home/dustin/projects/formality

# Run with coverage (if coverage tools are configured)
pnpm test --coverage --filter core 2>/dev/null || echo "Coverage not configured"

# Check specifically for isSafeNumber coverage
pnpm test --coverage 2>/dev/null | grep -A 5 "isSafeNumber" || echo "Use vitest UI for detailed coverage"

# Expected:
# - isSafeNumber function shows 100% coverage
# - All arithmetic operation branches covered
# - null/undefined specific branches covered
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All arithmetic operators (+, -, \*, /, %) have null operand tests
- [ ] All arithmetic operators (+, -, \*, /, %) have undefined operand tests
- [ ] All tests use proper context: `{ null: null }` and `{ undefined }`
- [ ] Development warning tests verify console.warn is called
- [ ] Production mode tests verify console.warn is NOT called
- [ ] Environment variable setup/teardown is correct
- [ ] All tests pass: `pnpm test expression.complex.test.ts`
- [ ] No TypeScript type errors in test file
- [ ] beforeEach(clearExpressionCache) is called in all describe blocks

### Feature Validation

- [ ] `evaluate('5 + null', { null: null })` returns `undefined`
- [ ] `evaluate('null - 5', { null: null })` returns `undefined`
- [ ] `evaluate('null * null', { null: null })` returns `undefined`
- [ ] `evaluate('undefined / 2', { undefined })` returns `undefined`
- [ ] `evaluate('10 % undefined', { undefined })` returns `undefined`
- [ ] Console.warn shows "[Formality Expression]" in development mode
- [ ] Console.warn shows "null/undefined" in warning messages
- [ ] Console.warn is NOT called in production mode
- [ ] No exceptions are thrown during null/undefined arithmetic
- [ ] Valid number operations still work (regression check)

### Code Quality Validation

- [ ] Test structure follows existing pattern (nested describe blocks)
- [ ] Test names are descriptive: "should return undefined for X"
- [ ] Console spy setup/teardown is correct (beforeEach/afterEach)
- [ ] Environment variable setup/teardown is correct (save/restore)
- [ ] Test file placement: `/packages/core/src/__tests__/expression.complex.test.ts`
- [ ] Tests added after existing "Type Guards - Arithmetic Operations" section
- [ ] No duplicate test cases

### Documentation & Deployment

- [ ] Test comments explain why null/undefined must be in context
- [ ] Test names clearly indicate what is being tested
- [ ] Test assertions use appropriate matchers (toBeUndefined, toHaveBeenCalled, etc.)
- [ ] Console assertions use partial matchers (expect.stringContaining)

---

## Anti-Patterns to Avoid

- ❌ Don't test `evaluate('null + 5', {})` - must provide `{ null: null }` in context
- ❌ Don't forget to call `clearExpressionCache()` in beforeEach
- ❌ Don't forget to restore console mocks in afterEach
- ❌ Don't forget to save/restore NODE_ENV in environment tests
- ❌ Don't use exact string matches for console warnings - use `expect.stringContaining`
- ❌ Don't test implementation details - test behavior (undefined return, no errors)
- ❌ Don't skip production mode tests - environment-specific behavior must be verified
- ❌ Don't duplicate existing tests - check what's already tested first
- ❌ Don't add tests outside the existing test file structure
- ❌ Don't forget regression tests for valid number operations

---

## Additional Context

### Relationship to Previous Work (P3.M2.T1.S2)

This task validates the implementation from P3.M2.T1.S2 "Handle null/undefined in Arithmetic Operations". The previous task:

1. **Enhanced `isSafeNumber`** with explicit null/undefined checks
2. **Added JSDoc documentation** for null/undefined exclusion
3. **Enhanced warning messages** to mention "null/undefined"

This task (P3.M2.T2.S1) **verifies** that implementation by:

1. Testing all arithmetic operations with null/undefined operands
2. Verifying development warnings are shown correctly
3. Verifying production mode has no warnings
4. Ensuring no errors are thrown

### Why Comprehensive Testing Matters

While the enhanced `isSafeNumber` type guard works correctly (via explicit null/undefined checks), comprehensive tests are essential for:

1. **Regression Prevention**: Future changes won't break null/undefined handling
2. **Documentation**: Tests serve as executable documentation of expected behavior
3. **Confidence**: Developers can modify code with confidence tests will catch issues
4. **Coverage**: Ensures all code paths are exercised

### Test Execution Note

When testing expressions with `null` or `undefined`:

```typescript
// CORRECT: Provide null/undefined in context
evaluate("null + 5", { null: null }); // Works as expected
evaluate("undefined + 5", { undefined }); // Works as expected

// INCORRECT: Without context, jsep can't resolve the identifier
evaluate("null + 5", {}); // 'null' is undefined in context, but we want to test null literal

// GOTCHA: jsep parses 'null' and 'undefined' as Identifiers
// So we MUST provide them in the context object for testing
```

### Expected Test Count

For comprehensive coverage, expect to write approximately:

- **30 tests** for null/undefined arithmetic (5 operators × 6 scenarios each)
- **5 tests** for development warnings (one per operator)
- **2 tests** for production mode (one for warnings, one for return values)
- **5 tests** for regression (valid number operations per operator)

Total: ~42 test cases

---

## Confidence Score

**9/10** for one-pass implementation success

**Reasoning**:

- ✅ Clear, specific testing target (test coverage for null/undefined arithmetic)
- ✅ Comprehensive existing context (exact file paths, line numbers, patterns)
- ✅ Well-defined success criteria with testable outcomes
- ✅ No new dependencies or architectural changes
- ✅ Previous PRP (P3.M2.T1.S2) defines exact behavior to test
- ✅ Existing test patterns provide clear structure to follow
- ✅ External research provides console testing patterns
- ⚠️ Minor complexity: Environment variable setup/teardown for production tests

**Validation**: The completed PRP includes exact test patterns, file locations, console spying setup, and comprehensive coverage requirements. An AI agent unfamiliar with the codebase should be able to implement these tests successfully using only the PRP content and codebase access.

---

**PRP Version:** 1.0
**Last Updated:** 2026-01-13
**Status:** Ready for Implementation
