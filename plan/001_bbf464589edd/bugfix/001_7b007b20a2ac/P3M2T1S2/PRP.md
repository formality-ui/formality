# Product Requirement Prompt (PRP): Handle null/undefined in Arithmetic Operations

**Work Item:** P3.M2.T1.S2
**Parent Task:** P3.M2.T1 - Add Type Guards
**PRD Bugfix ID:** 001_7b007b20a2ac
**Date:** 2026-01-13

---

## Goal

**Feature Goal**: Extend the existing `isSafeNumber` type guard to explicitly check for `null` and `undefined` values, ensuring robust null/undefined handling in all arithmetic operations within the expression evaluator.

**Deliverable**: Enhanced type guard function with explicit null/undefined checks, comprehensive JSDoc documentation, and complete test coverage for edge cases.

**Success Definition**:

- The `isSafeNumber` type guard explicitly rejects `null` and `undefined` values
- All arithmetic operations (+, -, \*, /, %) return `undefined` when operands are null/undefined
- JSDoc documentation clearly specifies null/undefined behavior
- All edge cases (e.g., `5 + null`, `undefined - 5`, `null * null`) are tested
- Development warnings include specific messages for null/undefined operands
- No regression in existing type safety functionality

## User Persona

**Target User**: Formality library users who write dynamic expressions with form field values that may be null or undefined.

**Use Case**: A form field value is initially `null` or `undefined` (e.g., optional field, unsubmitted form) and is used in arithmetic expressions like `discount + 10` or `price * quantity`.

**User Journey**:

1. User creates a form with optional numeric fields
2. Field values start as `null` or `undefined`
3. User writes expression: `total = price * quantity + tax`
4. Expression evaluator safely handles null/undefined without errors
5. Result is `undefined` (not NaN, not silent 0), which can be handled downstream

**Pain Points Addressed**:

- **Silent Zero Problem**: JavaScript's default behavior treats `null` as `0`, hiding bugs (e.g., `100 - null = 100`)
- **NaN Cascade**: `undefined` produces `NaN` which spreads through calculations
- **Unclear Behavior**: Without explicit documentation, users don't know what happens with null/undefined

## Why

- **User Impact**: Prevents silent bugs where null values are treated as 0, leading to incorrect calculations in forms (e.g., discount calculations, tax computations)
- **Integration**: Builds upon P3.M2.T1.S1 (Add type checking) which already implements the `isSafeNumber` type guard
- **Problem Solved**: Explicit null/undefined handling provides predictable behavior that users can rely on, matching TypeScript best practices for strict null checking

## What

### User-Visible Behavior

**Before**: The existing `isSafeNumber` type guard implicitly rejects null/undefined because `typeof null === 'object'` and `typeof undefined === 'undefined'` (not 'number'). This works but is not documented.

**After**: The type guard will have explicit checks for null/undefined, comprehensive JSDoc documentation, and development warnings that specifically mention null/undefined.

**Expression Behavior Examples**:

```javascript
// All return undefined (not NaN, not 0)
evaluate("5 + null", {}); // → undefined
evaluate("null + 5", {}); // → undefined
evaluate("undefined - 5", {}); // → undefined
evaluate("10 * null", {}); // → undefined
evaluate("null / 2", {}); // → undefined
evaluate("null % 3", {}); // → undefined
evaluate("null + null", {}); // → undefined
evaluate("undefined * undefined", {}); // → undefined

// Valid numbers still work
evaluate("5 + 3", {}); // → 8
evaluate("10 - 4", {}); // → 6

// String concatenation still works (not affected)
evaluate('"text" + 5', {}); // → "text5"
```

### Success Criteria

- [ ] `isSafeNumber` type guard explicitly checks for `null === null` and `value === undefined`
- [ ] JSDoc for `isSafeNumber` documents null/undefined exclusion with examples
- [ ] All arithmetic operations return `undefined` for null/undefined operands
- [ ] Development warnings include "null/undefined" in error messages
- [ ] Test file includes dedicated section for null/undefined edge cases
- [ ] All existing tests pass (no regression)

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Exact file paths and line numbers for all modifications
- Complete existing code snippets showing current implementation
- Exact patterns to follow for JSDoc, testing, and error messages
- All external documentation references with specific URLs
- Specific test examples with expected behavior

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Primary Implementation File
- file: /packages/core/src/expression/evaluate.ts
  why: Contains the isSafeNumber type guard and all arithmetic operation handling
  pattern: Type guard pattern, JSDoc style, error handling with NODE_ENV check
  gotcha: The file uses jsep library for parsing; modifications only needed for evaluation logic

# Existing Type Guard Implementation (Lines 31-38)
- file: /packages/core/src/expression/evaluate.ts:31-38
  why: This is the exact code that needs to be modified
  pattern: |
    function isSafeNumber(value: unknown): value is number {
      return typeof value === 'number' &&
             !Number.isNaN(value) &&
             Number.isFinite(value);
    }
  gotcha: Currently implicitly rejects null/undefined; need explicit checks + JSDoc

# Test File for Reference
- file: /packages/core/src/__tests__/expression.complex.test.ts
  why: Contains existing test patterns for type guards and arithmetic operations
  pattern: |
    describe("Type Guards - Arithmetic Operations", () => {
      describe("Addition (+)", () => {
        it("should return undefined for null + number", () => {
          expect(evaluate('null + 1', {})).toBeUndefined();
        });
      });
    });
  gotcha: Tests use vitest, beforeEach clears cache, use nested describe for organization

# JSDoc Pattern in Same File (Lines 321-334)
- file: /packages/core/src/expression/evaluate.ts:321-334
  why: Shows the JSDoc style used for public functions in this codebase
  pattern: Multi-line JSDoc with @param, @returns, @example sections

# Research Documentation
- docfile: plan/001_bbf464589edd/docs/bugfix_001_7b007b20a2ac_P3M2T1S2/research/null-undefined-handling.md
  why: Comprehensive research on JavaScript/TypeScript null/undefined handling best practices
  section: "3. TypeScript Best Practices" for type guard patterns

# External Documentation - TypeScript Type Guards
- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  why: Official TypeScript documentation on type guard patterns
  critical: Use type predicate `value is number` for proper type narrowing

# External Documentation - Nullish Coalescing
- url: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing
  why: Context on why ?? is preferred over || for default values

# External Documentation - MDN Type Coercion
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#type_coercion
  why: Understanding JavaScript's default behavior with null/undefined in arithmetic
  critical: Shows why explicit handling is necessary (null → 0, undefined → NaN)

# Previous Related Work (P3.M2.T1.S1)
- docfile: plan/001_bbf464589edd/docs/bugfix_001_7b007b20a2ac_P3M2T1S1/PRP.md
  why: Shows the pattern for implementing type guards in this codebase
  section: "Implementation Blueprint" for task structure
```

### Current Codebase Tree (Relevant Sections)

```bash
packages/core/src/
├── expression/
│   ├── evaluate.ts          # MAIN FILE - Modify isSafeNumber here
│   ├── context.ts           # Reference for unwrapFieldProxy pattern
│   └── index.ts             # Public API exports
├── __tests__/
│   ├── expression.test.ts           # Basic expression tests
│   └── expression.complex.test.ts   # MAIN TEST FILE - Add tests here
└── types/
    └── (no changes needed)
```

### Desired Codebase Tree with Changes

```bash
packages/core/src/
├── expression/
│   ├── evaluate.ts          # MODIFIED: Enhanced isSafeNumber with explicit null/undefined checks
│   ├── context.ts           # (unchanged)
│   └── index.ts             # (unchanged)
├── __tests__/
│   ├── expression.test.ts           # (unchanged)
│   └── expression.complex.test.ts   # MODIFIED: Added null/undefined edge case tests
└── types/
    └── (no changes needed)

# No new files needed - modifications only
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: isSafeNumber is used in multiple places
// MUST preserve the function signature: function isSafeNumber(value: unknown): value is number
// The type predicate "value is number" is essential for TypeScript narrowing

// CRITICAL: All arithmetic operations use this pattern (lines 117-210)
// if (!isSafeNumber(leftValue) || !isSafeNumber(rightValue)) {
//   // Development warning
//   // return undefined
// }

// CRITICAL: Development warnings use this pattern (existing code)
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `[Formality Expression] Type error: ` +
      `Invalid operands for +: ` +
      `left=${typeof leftValue}, right=${typeof rightValue}`,
  );
}

// CRITICAL: typeof null returns 'object', not 'null' (JavaScript quirk)
typeof null; // → 'object'
typeof undefined; // → 'undefined'

// CRITICAL: jsep library parses null as an Identifier, not a Literal
// So 'null + 5' is parsed as two identifiers, not null literal + 5
// The context must provide the actual null value for testing

// CRITICAL: Test setup uses buildEvaluationContext for field proxy scenarios
// Direct null/undefined tests use empty context {} with literals

// CRITICAL: beforeEach(clearExpressionCache) must be called in test suites
// to prevent cached AST from affecting test isolation

// CRITICAL: For testing null/undefined in expressions, use:
// evaluate('null + 5', { null: null })  // Provide null in context
// Because jsep parses 'null' as an identifier

// CRITICAL: The existing test file (expression.complex.test.ts) already has
// some null/undefined tests at lines 1038-1043, 1062-1068, etc.
// New tests should follow the same pattern and location
```

---

## Implementation Blueprint

### Data Models and Structure

**No new data models needed** - This task only enhances existing type guard function.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY isSafeNumber type guard in /packages/core/src/expression/evaluate.ts
  - ADD explicit null check: value === null
  - ADD explicit undefined check: value === undefined
  - PRESERVE existing checks: typeof value === 'number', !Number.isNaN(value), Number.isFinite(value)
  - FOLLOW pattern: Keep function signature exactly as is
  - NAMING: Function name unchanged, just enhanced implementation
  - PLACEMENT: Lines 31-38 in evaluate.ts

Task 2: UPDATE JSDoc for isSafeNumber function
  - ADD documentation for null/undefined exclusion
  - ADD examples showing null/undefined return false
  - FOLLOW pattern: Existing JSDoc style in same file (lines 321-334)
  - FORMAT: Multi-line comment with @param, @returns, @example sections
  - PLACEMENT: Immediately before function definition (lines 30-38)

Task 3: ENHANCE development warning messages (optional but recommended)
  - MODIFY warning message in arithmetic operations to explicitly mention null/undefined
  - FOLLOW pattern: Existing warning format at lines 132-137, 160-165
  - PRESERVE: [Formality Expression] prefix and structure
  - PLACEMENT: Inside each arithmetic operation's validation block

Task 4: ADD tests for null/undefined edge cases
  - CREATE new describe block: "Null/Undefined Handling" under "Type Guards - Arithmetic Operations"
  - IMPLEMENT tests for each arithmetic operator with null and undefined
  - FOLLOW pattern: Existing test structure at lines 1023-1165
  - NAMING: "should return undefined for {operator} with null/undefined"
  - COVERAGE: Test null + number, undefined + number, null + null, undefined + undefined for each operator
  - PLACEMENT: In /packages/core/src/__tests__/expression.complex.test.ts after line 1164

Task 5: VERIFY all existing tests pass
  - RUN: pnpm test from project root
  - CHECK: No regression in existing functionality
  - VALIDATE: All type guard tests still pass
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Enhanced isSafeNumber type guard
// CURRENT IMPLEMENTATION (lines 31-38):
function isSafeNumber(value: unknown): value is number {
  return (
    typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)
  );
}

// ENHANCED IMPLEMENTATION (add explicit null/undefined checks):
/**
 * Type guard to check if a value is safe for arithmetic operations
 *
 * Excludes: null, undefined, NaN, Infinity, -Infinity, and non-numeric types
 *
 * @param value - The value to check
 * @returns True if the value is a safe finite number (not null, undefined, NaN, or Infinity)
 *
 * @example
 * isSafeNumber(42);        // → true
 * isSafeNumber(0);         // → true
 * isSafeNumber(-3.14);     // → true
 * isSafeNumber(null);      // → false (explicitly excluded)
 * isSafeNumber(undefined); // → false (explicitly excluded)
 * isSafeNumber(NaN);       // → false
 * isSafeNumber(Infinity);  // → false
 * isSafeNumber('42');      // → false
 * isSafeNumber({});        // → false
 */
function isSafeNumber(value: unknown): value is number {
  // Explicitly check for null and undefined first
  if (value === null || value === undefined) {
    return false;
  }
  // Then check for valid finite number
  return (
    typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)
  );
}

// PATTERN 2: Enhanced warning message (existing pattern at lines 132-137)
// CURRENT:
console.warn(
  `[Formality Expression] Type error: ` +
    `Invalid operands for +: ` +
    `left=${typeof leftValue}, right=${typeof rightValue}`,
);

// ENHANCED (explicitly mention null/undefined):
console.warn(
  `[Formality Expression] Type error: ` +
    `Invalid operands for + (null/undefined not allowed): ` +
    `left=${typeof leftValue}, right=${typeof rightValue}`,
);

// PATTERN 3: Test structure (following existing pattern at lines 1023-1165)
describe("Null/Undefined Handling", () => {
  describe("Addition (+)", () => {
    it("should return undefined for null + number", () => {
      // Note: jsep parses 'null' as identifier, so provide it in context
      expect(evaluate("null + 1", { null: null })).toBeUndefined();
    });

    it("should return undefined for undefined + number", () => {
      expect(evaluate("undefined + 1", { undefined })).toBeUndefined();
    });

    it("should return undefined for null + null", () => {
      expect(evaluate("null + null", { null: null })).toBeUndefined();
    });

    it("should return undefined for undefined + undefined", () => {
      expect(evaluate("undefined + undefined", { undefined })).toBeUndefined();
    });

    it("should work with valid numbers (regression test)", () => {
      expect(evaluate("5 + 3", {})).toBe(8);
    });
  });

  // Repeat similar tests for -, *, /, %
});
```

### Integration Points

```yaml
NO NEW INTEGRATIONS NEEDED

This task modifies existing code only:

EXPRESSION_EVALUATOR:
  - file: packages/core/src/expression/evaluate.ts
  - function: isSafeNumber (lines 31-38)
  - usage: Called in lines 131, 159 for all arithmetic operations
  - impact: All arithmetic operations (+, -, *, /, %) benefit from enhanced null/undefined checks

TEST_SUITE:
  - file: packages/core/src/__tests__/expression.complex.test.ts
  - section: "Type Guards - Arithmetic Operations" (starting line 1023)
  - impact: Adds comprehensive null/undefined test coverage
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after making changes to evaluate.ts
cd /home/dustin/projects/formality

# Type checking (TypeScript)
pnpm exec tsc --noEmit --project packages/core/tsconfig.json

# Expected: Zero type errors. The type predicate "value is number" must work correctly.

# Linting (if ESLint is configured)
pnpm run lint 2>/dev/null || echo "No lint script configured"

# Format check (if Prettier is configured)
pnpm run format:check 2>/dev/null || echo "No format check script configured"
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run specific test file for expression evaluation
cd /home/dustin/projects/formality
pnpm test expression.complex.test.ts

# Run only type guard tests
pnpm test expression.complex.test.ts --grep "Type Guards"

# Run only new null/undefined tests
pnpm test expression.complex.test.ts --grep "Null/Undefined Handling"

# Full test suite for core package
pnpm test --filter core

# Expected:
# - All new tests pass
# - All existing tests pass (no regression)
# - Test coverage for isSafeNumber includes null/undefined branches
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual verification with test expressions
cd /home/dustin/projects/formality

# Create a simple test script to verify behavior
cat > /tmp/test_null_undefined.js << 'EOF'
import { evaluate } from './packages/core/src/expression/index.js';

console.log('Testing null/undefined handling:');
console.log('null + 5 =', evaluate('null + 5', { null: null }));
console.log('undefined - 5 =', evaluate('undefined - 5', { undefined }));
console.log('10 * null =', evaluate('10 * null', { null: null }));
console.log('null / 2 =', evaluate('null / 2', { null: null }));
console.log('null % 3 =', evaluate('null % 3', { null: null }));
console.log('5 + 3 =', evaluate('5 + 3', {})); // Should work
EOF

# Run the test (if package allows direct execution)
node --loader ts-node/esm /tmp/test_null_undefined.js 2>/dev/null || echo "Manual test skipped - use vitest instead"

# Expected output:
# null + 5 = undefined
# undefined - 5 = undefined
# 10 * null = undefined
# null / 2 = undefined
# null % 3 = undefined
# 5 + 3 = 8
```

### Level 4: Development Warning Verification

```bash
# Test that development warnings are shown correctly
cd /home/dustin/projects/formality

# Run vitest with console output for warning tests
pnpm test expression.complex.test.ts --grep "Development Warnings" --reporter=verbose

# Expected:
# - Tests pass (warnings are spy-checked)
# - Warning messages include "null/undefined" text
# - No warnings in production mode (NODE_ENV=production)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] isSafeNumber explicitly checks for `value === null`
- [ ] isSafeNumber explicitly checks for `value === undefined`
- [ ] JSDoc documents null/undefined exclusion with examples
- [ ] All arithmetic operations return `undefined` for null/undefined operands
- [ ] Development warnings mention null/undefined explicitly
- [ ] All existing tests pass: `pnpm test --filter core`
- [ ] New tests cover all edge cases (null + number, undefined + number, null + null, undefined + undefined for each operator)
- [ ] No TypeScript type errors

### Feature Validation

- [ ] `evaluate('5 + null', { null: null })` returns `undefined`
- [ ] `evaluate('undefined - 5', { undefined })` returns `undefined`
- [ ] `evaluate('10 * null', { null: null })` returns `undefined`
- [ ] `evaluate('null / 2', { null: null })` returns `undefined`
- [ ] `evaluate('null % 3', { null: null })` returns `undefined`
- [ ] `evaluate('null + null', { null: null })` returns `undefined`
- [ ] `evaluate('undefined * undefined', { undefined })` returns `undefined`
- [ ] Valid number operations still work correctly (regression check)
- [ ] String concatenation unaffected by changes

### Code Quality Validation

- [ ] Function signature preserved: `function isSafeNumber(value: unknown): value is number`
- [ ] Type predicate `value is number` still works for TypeScript narrowing
- [ ] JSDoc follows existing codebase style (multi-line with @param, @returns, @example)
- [ ] Warning messages follow existing pattern: `[Formality Expression] Type error: ...`
- [ ] Test structure follows existing pattern (nested describe blocks)
- [ ] Test file placement: `/packages/core/src/__tests__/expression.complex.test.ts`

### Documentation & Deployment

- [ ] JSDoc includes specific examples for null and undefined
- [ ] JSDoc explains why null/undefined are excluded
- [ ] Test names are descriptive: "should return undefined for X with Y"
- [ ] Comments are clear about explicit vs implicit null/undefined checking

---

## Anti-Patterns to Avoid

- ❌ Don't change the function signature - the type predicate `value is number` is critical
- ❌ Don't remove existing checks for NaN and Infinity
- ❌ Don't use `value == null` (it catches both null and undefined implicitly - be explicit)
- ❌ Don't throw errors - return `undefined` like other invalid operands
- ❌ Don't skip tests - null/undefined edge cases must be explicitly tested
- ❌ Don't forget to provide `null: null` in test context (jsep parses 'null' as identifier)
- ❌ Don't modify comparison operators - only arithmetic operators are in scope
- ❌ Don't change string concatenation behavior - `+` with strings should still work
- ❌ Don't use `||` for defaults in tests - use `??` to distinguish from falsy values
- ❌ Don't skip JSDoc - explicit documentation is a requirement of this task

---

## Additional Context

### Relationship to Previous Work (P3.M2.T1.S1)

This task builds upon P3.M2.T1.S1 "Add type checking" which implemented the initial `isSafeNumber` type guard. The previous task established the pattern of using type guards for arithmetic operations. This task enhances that implementation with:

1. **Explicit null/undefined checks** (previously implicit via `typeof` check)
2. **Comprehensive JSDoc documentation** (previously minimal)
3. **Complete test coverage** for null/undefined edge cases (previously partial)

### Why Explicit Checks Matter

While the existing implementation works correctly (implicit rejection via `typeof value === 'number'`), explicit checks provide:

1. **Self-documenting code**: Future maintainers immediately see null/undefined are considered
2. **Performance**: Short-circuit evaluation for null/undefined before typeof check
3. **Debugging**: Easier to set breakpoints on specific null/undefined cases
4. **Documentation**: JSDoc can explicitly list what's excluded

### Test Execution Note

When testing expressions with `null` or `undefined`, remember that jsep parses these as identifiers, not literals. Therefore:

```typescript
// CORRECT: Provide null/undefined in context
evaluate("null + 5", { null: null });

// INCORRECT: This won't work as expected
evaluate("null + 5", {}); // 'null' is undefined in context, but we want to test the literal null
```

---

## Confidence Score

**8/10** for one-pass implementation success

**Reasoning**:

- ✅ Clear, specific implementation target (single function enhancement)
- ✅ Comprehensive existing context (exact file paths, line numbers, patterns)
- ✅ Well-defined success criteria with testable outcomes
- ✅ No new dependencies or architectural changes
- ⚠️ Minor uncertainty: Test setup for null/undefined literals requires understanding jsep parsing
- ✅ Existing tests provide clear pattern to follow

**Validation**: The completed PRP includes exact code snippets, file locations, test patterns, and comprehensive documentation references. An AI agent unfamiliar with the codebase should be able to implement this successfully using only the PRP content and codebase access.

---

**PRP Version:** 1.0
**Last Updated:** 2026-01-13
**Status:** Ready for Implementation
