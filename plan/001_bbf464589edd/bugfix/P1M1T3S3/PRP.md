# PRP: Test 8-Layer Priority Order (P1.M1.T3.S3)

---

## Goal

**Feature Goal**: Implement comprehensive test coverage for the 8-layer prop priority system in Formality, ensuring correct prop merging behavior across all layers with proper isolation, priority verification, and edge case handling.

**Deliverable**: Complete test suite in `packages/react/src/__tests__/priorityOrder.test.tsx` with 40+ tests covering single layer, adjacent layer, skip layer, merge behavior, dynamic layer, and edge case scenarios.

**Success Definition**: All tests pass (`pnpm test`), coverage meets 80%+ for priority order logic, tests follow existing patterns from `selectDefaultFieldProps.test.tsx`, and the test suite verifies that higher priority layers correctly override lower priority layers while coreProps (layer 9) always wins.

---

## Why

- **Quality Assurance**: The 8-layer prop priority system is critical infrastructure. Without proper tests, regressions could break prop inheritance across the entire form system
- **Developer Confidence**: Comprehensive tests enable safe refactoring of merge logic and prop evaluation system
- **Documentation**: Tests serve as living documentation of how the priority system works
- **Integration**: Completes the testing story for selectDefaultFieldProps (P1.M1.T3) alongside completed S1 (provider-level) and S2 (form-level) tests
- **Risk Mitigation**: Complex merge logic is prone to edge cases (undefined values, null handling, deep merging) that need explicit verification

---

## What

Implement a comprehensive test suite that verifies the 8-layer prop priority system works correctly. Tests must:

### Success Criteria

- [ ] All 8 layers are individually testable with mock isolation
- [ ] Priority order is verified: componentProps > selectProps > fieldConfigProps > inputProps > formSelectDefaultFieldProps > formDefaultFieldProps > providerSelectDefaultFieldProps > providerDefaultFieldProps
- [ ] CoreProps (layer 9 - name, value, onChange, etc.) always wins and cannot be overridden
- [ ] Skip layer tests verify next highest layer takes precedence
- [ ] Adjacent layer tests verify proper override behavior
- [ ] Dynamic layers (2, 4, 7) work with expression evaluation
- [ ] Merge behavior (not replacement) works for nested objects
- [ ] Edge cases handled: undefined, null, empty objects, conflicting types
- [ ] All tests pass: `pnpm test -- priorityOrder`
- [ ] 80%+ coverage for priority order logic
- [ ] Tests follow existing patterns from `selectDefaultFieldProps.test.tsx`

---

## All Needed Context

### Context Completeness Check

_Before writing tests, validate: "If someone knew nothing about this codebase, would they have everything needed to implement these tests successfully?"_

**Answer**: YES - This PRP provides all necessary context including exact file paths, code patterns, test structure templates, validation commands, and comprehensive research documentation.

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: packages/react/src/__tests__/selectDefaultFieldProps.test.tsx
  why: PRIMARY PATTERN REFERENCE - Shows exact test structure for prop evaluation tests
  pattern: ARRANGE-ACT-ASSERT structure, forwardRef components, userEvent patterns, waitFor assertions
  gotcha: Always use forwardRef for test components, always include data-testid attributes

- file: packages/core/src/config/merge.ts
  why: Contains mergeFieldProps function and the 8-layer priority logic
  pattern: mergeStaticProps function (lines 155-167), deepMerge function (lines 19-57)
  gotcha: Layer 9 (coreProps) always wins - it's passed separately and never overridden

- file: packages/react/src/hooks/usePropsEvaluation.ts
  why: Hook that evaluates dynamic prop layers (2, 4, 7) against form state
  pattern: useInferredInputs for dependency tracking, makeProxyState for minimal state creation
  gotcha: Only watches fields actually referenced in expressions for performance

- file: packages/react/src/components/Field.tsx
  why: Shows how all 8 layers are integrated and passed to mergeFieldProps
  pattern: Lines 289-295 (usePropsEvaluation call), lines 395-414 (mergeFieldProps call)
  gotcha: The hook returns 3 separate objects (providerSelectProps, formSelectProps, fieldSelectProps) which must be passed to mergeFieldProps

- docfile: plan/bugfix/P1M1T3S3/research/implementation_guide.md
  why: Step-by-step implementation guide with 41 test templates
  section: Complete test suite structure with code examples for each test category

- docfile: plan/bugfix/P1M1T3S3/research/quick_reference.md
  why: Quick reference for test patterns, assertions, and component templates
  section: Test Structure Templates and Common Assertion Patterns

- docfile: plan/bugfix/P1M1T3S3/research/prop_merging_testing_best_practices.md
  why: Best practices for testing prop merging systems
  section: Priority System Testing Strategies and Mocking Strategies

- url: https://testing-library.com/docs/react-testing-library/intro/
  why: React Testing Library official documentation for queries and assertions
  critical: Use getByTestId, waitFor, and userEvent for reliable tests

- url: https://vitest.dev/guide/
  why: Vitest documentation for test runner and assertion patterns
  critical: Use describe/it syntax, vi.fn() for mocking, expect() for assertions
```

### Current Codebase Tree

```bash
formality/
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── config/
│   │       │   └── merge.ts                    # mergeFieldProps, deepMerge, mergeStaticProps
│   │       └── types/
│   │           └── config.ts                    # FormalityProviderConfig, FormConfig types
│   └── react/
│       └── src/
│           ├── __tests__/
│           │   ├── selectDefaultFieldProps.test.tsx  # S1, S2 tests (PATTERN REFERENCE)
│           │   ├── Field.test.tsx                    # Field component tests
│           │   └── setup.ts                         # Test setup file
│           ├── components/
│           │   ├── Field.tsx                     # Field component (8-layer integration)
│           │   ├── Form.tsx                      # Form component
│           │   └── FormalityProvider.tsx         # Provider component
│           ├── hooks/
│           │   ├── usePropsEvaluation.ts        # Hook for evaluating dynamic layers
│           │   └── useInferredInputs.ts         # Dependency inference
│           └── utils/
│               └── makeProxyState.ts            # Minimal state creation
└── plan/
    └── bugfix/
        └── P1M1T3S3/
            ├── research/                        # Research documents (created)
            │   ├── README.md
            │   ├── implementation_guide.md
            │   ├── quick_reference.md
            │   ├── prop_merging_testing_best_practices.md
            │   ├── external_resources.md
            │   └── url_reference_list.md
            └── PRP.md                           # This file
```

### Desired Codebase Tree with Files to be Added

```bash
formality/
└── packages/
    └── react/
        └── src/
            └── __tests__/
                └── priorityOrder.test.tsx       # NEW: 8-layer priority order tests
                    # Responsibility: Test all 8 layers + coreProps priority,
                    # skip layer behavior, adjacent layer overrides, merge behavior,
                    # dynamic layer evaluation, and edge cases
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: The 8-layer priority order is LOWEST to HIGHEST priority
// Layer 1 (lowest) -> Layer 8 (high) -> Layer 9 (always wins)
const PRIORITY_ORDER = {
  1: 'providerDefaultFieldProps',           // Static, lowest priority
  2: 'providerSelectDefaultFieldProps',     // Dynamic (expressions/functions)
  3: 'formDefaultFieldProps',               // Static
  4: 'formSelectDefaultFieldProps',         // Dynamic
  5: 'inputProps',                          // From InputConfig
  6: 'fieldConfigProps',                    // From FieldConfig.props
  7: 'selectProps',                         // Dynamic, from FieldConfig.selectProps
  8: 'componentProps',                      // JSX props passed to Field
  9: 'coreProps'                            // ALWAYS WINS: name, value, onChange, etc.
};

// GOTCHA: usePropsEvaluation returns 3 separate objects, NOT one merged object
const { providerSelectProps, formSelectProps, fieldSelectProps } = usePropsEvaluation({
  selectProps,              // Returns fieldSelectProps
  formDefaultFieldProps,    // Returns formSelectProps
  providerDefaultFieldProps, // Returns providerSelectProps
  subscribesTo,
  fieldName,
});

// GOTCHA: The 8-layer merge in Field.tsx has a SPECIFIC order that must match
// See Field.tsx lines 395-414 for the exact mergeFieldProps call order

// PATTERN: Test components MUST use forwardRef or props won't be passed correctly
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => (
    <input
      ref={ref}                    // REQUIRED for React Hook Form integration
      data-testid={name}           // REQUIRED for test selectors
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}                   // REQUIRED for spreading merged props
    />
  )
);

// GOTCHA: Always use userEvent.setup() NOT fireEvent for realistic interactions
const user = userEvent.setup();
await user.click(screen.getByTestId("signed"));

// GOTCHA: Always use waitFor() for async assertions after state changes
await waitFor(() => {
  expect(screen.getByTestId("target")).toHaveClass("signed-enabled");
});

// CRITICAL: coreProps (name, value, onChange, onBlur, ref, disabled, error, label) CANNOT be overridden
// Even if you pass disabled: false in componentProps, coreProps.disabled will win if true

// GOTCHA: Dynamic layers (2, 4, 7) use expression evaluation
// Expressions: 'signed ? "yes" : "no"' or '!active' or 'client.name'
// Functions: (formState, methods) => ({ disabled: !formState.fields.signed?.value })

// GOTCHA: For testing priority, each test must EXPLICITLY set conflicting values
// Don't rely on defaults - set explicit values on each layer being tested

// PATTERN: Test file should follow selectDefaultFieldProps.test.tsx structure
// - Test components at top of file
// - testInputs config below components
// - describe blocks organized by feature
// - Each test is self-contained with its own render
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Tests will verify existing types:

```typescript
// Existing types to reference (from packages/core/src/types/config.ts)
interface FormalityProviderConfig {
  defaultFieldProps?: Record<string, unknown>;           // Layer 1
  selectDefaultFieldProps?: SelectValue;                 // Layer 2
}

interface FormConfig {
  defaultFieldProps?: Record<string, unknown>;           // Layer 3
  selectDefaultFieldProps?: SelectValue;                 // Layer 4
}

interface InputConfig {
  props?: Record<string, unknown>;                        // Layer 5
}

interface FieldConfig {
  props?: Record<string, unknown>;                       // Layer 6
  selectProps?: SelectValue;                             // Layer 7
}

// Layer 8 is JSX props: <Field name="foo" className="bar" />
// Layer 9 is implicit: { name, value, onChange, onBlur, ref, disabled, error, label }
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE packages/react/src/__tests__/priorityOrder.test.tsx
  - IMPLEMENT: Test file skeleton with imports and test components
  - FOLLOW pattern: packages/react/src/__tests__/selectDefaultFieldProps.test.tsx (lines 1-88)
  - INCLUDE: TestInput and TestSwitch components with forwardRef
  - INCLUDE: testInputs config with InputConfig
  - INCLUDE: Essential imports (render, screen, waitFor, userEvent, etc.)
  - NAMING: File name uses priorityOrder.test.tsx (matches test naming convention)
  - PLACEMENT: packages/react/src/__tests__/priorityOrder.test.tsx

Task 2: IMPLEMENT Single Layer Tests (24 tests)
  - IMPLEMENT: Tests for each of the 8 layers individually applying props
  - FOLLOW pattern: selectDefaultFieldProps.test.tsx expression-based tests (lines 90-225)
  - MOCK: Only the layer being tested, all other layers undefined
  - ASSERT: Props from the single layer are applied to the field
  - COVERAGE: 3 tests per layer (static string, boolean, nested object)
  - PLACEMENT: Inside "Priority Order - Single Layer" describe block

Task 3: IMPLEMENT Adjacent Layer Tests (7 tests)
  - IMPLEMENT: Tests for each adjacent layer pair (1v2, 2v3, 3v4, 4v5, 5v6, 6v7, 7v8)
  - FOLLOW pattern: selectDefaultFieldProps.test.tsx priority tests (lines 446-554)
  - MOCK: Two adjacent layers with conflicting values for same property
  - ASSERT: Higher priority layer value wins
  - COVERAGE: One test per adjacent pair
  - PLACEMENT: Inside "Priority Order - Adjacent Layers" describe block

Task 4: IMPLEMENT Skip Layer Tests (6 tests)
  - IMPLEMENT: Tests removing middle layers to verify next highest takes precedence
  - FOLLOW pattern: Create tests with gaps (e.g., layer 1 + layer 3, no layer 2)
  - MOCK: Non-adjacent layers with conflicting values
  - ASSERT: Highest priority layer present wins
  - COVERAGE: Tests with 2-layer gaps, 3-layer gaps, etc.
  - PLACEMENT: Inside "Priority Order - Skip Layers" describe block

Task 5: IMPLEMENT CoreProps Always Wins Tests (3 tests)
  - IMPLEMENT: Tests verifying coreProps (layer 9) cannot be overridden
  - FOLLOW pattern: Attempt to override name, value, onChange, disabled
  - MOCK: All 8 layers trying to override coreProps
  - ASSERT: CoreProps values always applied regardless of other layers
  - COVERAGE: Test each core prop (name, value, onChange)
  - PLACEMENT: Inside "Priority Order - CoreProps" describe block

Task 6: IMPLEMENT Full Priority Chain Test (1 test)
  - IMPLEMENT: One comprehensive test with all 8 layers + coreProps
  - FOLLOW pattern: selectDefaultFieldProps.test.tsx complete chain test (lines 485-554)
  - MOCK: All 8 layers with different values for multiple properties
  - ASSERT: Verify exact priority order with multiple properties
  - COVERAGE: Single test covering full chain
  - PLACEMENT: Inside "Priority Order - Full Chain" describe block

Task 7: IMPLEMENT Dynamic Layer Tests (6 tests)
  - IMPLEMENT: Tests for dynamic layers (2, 4, 7) with expression evaluation
  - FOLLOW pattern: selectDefaultFieldProps.test.tsx expression tests (lines 90-225)
  - MOCK: Dynamic layers with expressions referencing other fields
  - ASSERT: Expressions evaluate correctly and apply at right priority
  - COVERAGE: 2 tests per dynamic layer (simple expression, complex expression)
  - PLACEMENT: Inside "Priority Order - Dynamic Layers" describe block

Task 8: IMPLEMENT Merge Behavior Tests (4 tests)
  - IMPLEMENT: Tests verifying merge (not replacement) for nested objects
  - FOLLOW pattern: Test nested object merging across layers
  - MOCK: Layers with nested objects having different properties
  - ASSERT: Nested properties are merged, not replaced
  - COVERAGE: Deep merge with different keys, deep merge with same keys
  - PLACEMENT: Inside "Priority Order - Merge Behavior" describe block

Task 9: IMPLEMENT Edge Case Tests (8 tests)
  - IMPLEMENT: Tests for undefined, null, empty objects, conflicting types
  - FOLLOW pattern: Edge case testing patterns
  - MOCK: Layers with edge case values
  - ASSERT: Proper handling of edge cases without crashes
  - COVERAGE: undefined values, null values, empty objects, type conflicts
  - PLACEMENT: Inside "Priority Order - Edge Cases" describe block

Task 10: RUN tests and verify coverage
  - EXECUTE: pnpm test -- priorityOrder
  - VERIFY: All tests pass
  - CHECK: Coverage with pnpm test:coverage -- priorityOrder
  - ADJUST: Any failing tests until 100% pass rate
```

### Implementation Patterns & Key Details

```typescript
// ===== TEST FILE STRUCTURE =====
// Import test utilities
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { forwardRef } from "react";

// Import formal components
import { FormalityProvider, Form, Field } from "@formality-ui/react";
import type { FormFieldsConfig, InputConfig } from "@formality-ui/core";

// ===== TEST COMPONENTS (REQUIRED PATTERN) =====
interface TestInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name?: string;
  className?: string;
  placeholder?: string;
  "data-size"?: string;
  "data-variant"?: string;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, className, placeholder, "data-size": dataSize, "data-variant": dataVariant, ...props }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}
        data-testid={name}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={className}
        placeholder={placeholder}
        data-size={dataSize}
        data-variant={dataVariant}
        {...props}
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);

TestInput.displayName = "TestInput";

// ===== TEST INPUTS CONFIG (REQUIRED) =====
const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
  switch: { component: TestSwitch, defaultValue: false },
};

// ===== TEST STRUCTURE TEMPLATE =====
describe("Priority Order", () => {
  describe("Single Layer Tests", () => {
    it("should apply props from providerDefaultFieldProps (layer 1)", () => {
      // ARRANGE: Configure only layer 1
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          defaultFieldProps={{ className: "layer-1", "data-size": "small" }}
        >
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>
      );

      // ASSERT: Verify layer 1 props applied
      const field = screen.getByTestId("field");
      expect(field).toHaveClass("layer-1");
      expect(field).toHaveAttribute("data-size", "small");
    });

    it("should apply props from componentProps (layer 8)", () => {
      // ARRANGE: Configure layer 8 via JSX props
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" className="layer-8" data-size="large" />
          </Form>
        </FormalityProvider>
      );

      // ASSERT: Verify layer 8 props applied
      const field = screen.getByTestId("field");
      expect(field).toHaveClass("layer-8");
      expect(field).toHaveAttribute("data-size", "large");
    });
  });

  describe("Adjacent Layer Tests", () => {
    it("should prioritize layer 2 over layer 1", () => {
      // ARRANGE: Layer 1 and 2 with conflicting values
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          defaultFieldProps={{ className: "layer-1" }}
          selectDefaultFieldProps={{ className: '"layer-2"' }}
        >
          <Form config={config}>
            <Field name="field" />
          </Form>
        </FormalityProvider>
      );

      // ASSERT: Layer 2 wins
      const field = screen.getByTestId("field");
      expect(field).toHaveClass("layer-2");
      expect(field).not.toHaveClass("layer-1");
    });
  });

  describe("CoreProps Always Wins", () => {
    it("should prevent layer 8 from overriding coreProps", () => {
      // ARRANGE: Try to override core props via JSX
      const config: FormFieldsConfig = {
        field: { type: "textField" },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            {/* Even though we pass value="override", coreProps.value wins */}
            <Field name="field" value="override" />
          </Form>
        </FormalityProvider>
      );

      // ASSERT: CoreProps value wins (empty string from defaultValue)
      const field = screen.getByTestId("field");
      expect(field).toHaveValue("");
      expect(field).not.toHaveValue("override");
    });
  });

  describe("Dynamic Layer Tests", () => {
    it("should evaluate providerSelectDefaultFieldProps (layer 2) expression", async () => {
      // ARRANGE: Dynamic layer 2 with expression
      const config: FormFieldsConfig = {
        switch: { type: "switch" },
        target: { type: "textField" },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          selectDefaultFieldProps={{ className: 'switch ? "enabled" : "disabled"' }}
        >
          <Form config={config}>
            <Field name="switch" />
            <Field name="target" />
          </Form>
        </FormalityProvider>
      );

      // ASSERT: Initial state (switch is false)
      expect(screen.getByTestId("target")).toHaveClass("disabled");

      // ACT: Toggle switch
      const user = userEvent.setup();
      await user.click(screen.getByTestId("switch"));

      // ASSERT: Expression re-evaluated
      await waitFor(() => {
        expect(screen.getByTestId("target")).toHaveClass("enabled");
      });
    });
  });

  describe("Full Priority Chain", () => {
    it("should apply correct priority across all 8 layers", () => {
      // ARRANGE: All 8 layers with different values
      const config: FormFieldsConfig = {
        field: {
          type: "textField",
          props: { "data-size": "layer-6" },           // fieldConfigProps
          selectProps: { className: '"layer-7"' },     // selectProps (dynamic)
        },
      };

      render(
        <FormalityProvider
          inputs={testInputs}
          defaultFieldProps={{ "data-variant": "layer-1" }}
          selectDefaultFieldProps={{ "data-size": '"layer-2"' }}
        >
          <Form
            config={config}
            formConfig={{
              defaultFieldProps: { placeholder: "layer-3" },
              selectDefaultFieldProps: { className: '"layer-4"' },
            }}
            inputConfig={{ props: { "data-variant": "layer-5" } }}
          >
            {/* Layer 8: componentProps via JSX */}
            <Field name="field" className="layer-8" placeholder="override" />
          </Form>
        </FormalityProvider>
      );

      // ASSERT: Verify priority order
      const field = screen.getByTestId("field");
      expect(field).toHaveClass("layer-8");      // Layer 8 wins
      expect(field).toHaveAttribute("data-size", "layer-6");  // Layer 6 (next highest with data-size)
      expect(field).toHaveAttribute("data-variant", "layer-5"); // Layer 5 (layer 1 overridden by 5)
      expect(field).toHaveAttribute("placeholder", "override"); // Layer 8 wins
    });
  });
});

// ===== KEY ASSERTION PATTERNS =====
// Class assertion
expect(element).toHaveClass("class-name");
expect(element).not.toHaveClass("other-class");

// Attribute assertion
expect(element).toHaveAttribute("data-size", "large");
expect(element).toHaveAttribute("disabled");

// Value assertion
expect(element).toHaveValue("test-value");

// Disabled state
expect(element).toBeDisabled();
expect(element).not.toBeDisabled();

// Async assertion with waitFor
await waitFor(() => {
  expect(element).toHaveClass("updated");
});

// Multiple assertions
expect(field).toHaveAttribute("data-size", "layer-6");
expect(field).toHaveAttribute("data-variant", "layer-5");
expect(field).toHaveClass("layer-8");
```

### Integration Points

```yaml
TEST_FILE:
  - location: packages/react/src/__tests__/priorityOrder.test.tsx
  - imports: "@testing-library/react", "@formality-ui/react", "@formality-ui/core"
  - pattern: Follow selectDefaultFieldProps.test.tsx structure

TEST_RUNNER:
  - command: pnpm test -- priorityOrder
  - framework: Vitest
  - environment: jsdom

COVERAGE:
  - command: pnpm test:coverage -- priorityOrder
  - target: 80%+ statements, branches, functions, lines

EXISTING_TESTS:
  - reference: packages/react/src/__tests__/selectDefaultFieldProps.test.tsx
  - follow: ARRANGE-ACT-ASSERT pattern
  - use: describe/it blocks with descriptive names
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript type checking on new test file
pnpm exec tsc --noEmit packages/react/src/__tests__/priorityOrder.test.tsx

# Run linter
pnpm exec eslint packages/react/src/__tests__/priorityOrder.test.tsx

# Format check
pnpm exec prettier --check packages/react/src/__tests__/priorityOrder.test.tsx

# Auto-fix any issues
pnpm exec eslint --fix packages/react/src/__tests__/priorityOrder.test.tsx
pnpm exec prettier --write packages/react/src/__tests__/priorityOrder.test.tsx

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the priority order tests specifically
pnpm test -- priorityOrder

# Run tests in watch mode for rapid iteration
pnpm test:watch -- priorityOrder

# Run with coverage for the specific test file
pnpm test:coverage -- priorityOrder.test.tsx

# Expected: All tests pass. If failing, debug root cause:
# 1. Check test component has forwardRef
# 2. Check data-testid attributes are present
# 3. Check usePropsEvaluation is being called correctly
# 4. Verify mergeFieldProps call order matches Field.tsx
```

### Level 3: Integration Testing (System Validation)

```bash
# Run all React package tests to ensure no regressions
pnpm --filter @formality-ui/react test

# Run entire test suite
pnpm test

# Verify specific test categories pass
pnpm test -- selectDefaultFieldProps  # Verify S1, S2 tests still pass
pnpm test -- Field                    # Verify Field component tests still pass

# Expected: All tests pass. The new tests should not break existing tests.
# If existing tests fail, the priority system may have been broken.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual testing with real components (if applicable)
# Create a test form with all 8 layers and verify in browser

# Performance testing - ensure tests run quickly
time pnpm test -- priorityOrder
# Expected: Tests should complete in under 5 seconds

# Mutation testing (if mutation testing framework available)
# This verifies tests actually catch bugs

# Code coverage verification
pnpm test:coverage
# Check that priority order logic in merge.ts has 80%+ coverage

# Visual regression (if applicable)
# Verify rendered output matches expectations

# Expected: All creative validations pass with no performance degradation.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `pnpm test -- priorityOrder`
- [ ] No TypeScript errors: `pnpm exec tsc --noEmit`
- [ ] No ESLint errors: `pnpm exec eslint packages/react/src/__tests__/priorityOrder.test.tsx`
- [ ] Proper formatting: `pnpm exec prettier --check`
- [ ] Coverage meets 80%+: `pnpm test:coverage -- priorityOrder`
- [ ] Existing tests still pass: `pnpm test -- selectDefaultFieldProps && pnpm test -- Field`

### Feature Validation

- [ ] All 8 layers individually tested
- [ ] All adjacent layer pairs tested (7 tests)
- [ ] Skip layer behavior verified
- [ ] CoreProps always wins verified
- [ ] Full priority chain tested
- [ ] Dynamic layers (2, 4, 7) with expressions tested
- [ ] Merge behavior (not replacement) tested
- [ ] Edge cases handled (undefined, null, empty objects)

### Code Quality Validation

- [ ] Follows existing test patterns from `selectDefaultFieldProps.test.tsx`
- [ ] Test names follow `"should [action] [what] for [property]"` pattern
- [ ] Test components use forwardRef
- [ ] All elements have data-testid attributes
- [ ] Uses userEvent.setup() for interactions
- [ ] Uses waitFor() for async assertions
- [ ] Each test is self-contained with its own render

### Documentation & Completion

- [ ] Test file has describe blocks organized by feature
- [ ] Comments explain complex test scenarios
- [ ] Edge cases are documented in test descriptions
- [ ] Total test count is 40+ (aim for comprehensive coverage)

---

## Anti-Patterns to Avoid

- ❌ Don't use `fireEvent` - use `userEvent.setup()` for realistic interactions
- ❌ Don't forget `forwardRef` on test components - props won't pass correctly
- ❌ Don't skip `data-testid` attributes - DOM queries will be flaky
- ❌ Don't use `setTimeout` - use `waitFor()` for async assertions
- ❌ Don't share state between tests - each test must be independent
- ❌ Don't test only happy paths - include edge cases and error conditions
- ❌ Don't hardcode test values - use descriptive constants
- ❌ Don't skip testing dynamic layers - expressions need verification too
- ❌ Don't assume merge works - test actual merge behavior with nested objects
- ❌ Don't forget coreProps - they always win and need explicit testing
- ❌ Don't create new test patterns - follow existing patterns from S1/S2 tests
- ❌ Don't skip type checking - TypeScript errors indicate real issues
- ❌ Don't ignore test failures - fix the root cause before proceeding

---

## Confidence Score

**One-Pass Implementation Success Likelihood: 9/10**

### Justification

1. **Comprehensive Research**: 3,500+ lines of research documentation covering all aspects of the 8-layer priority system
2. **Exact Pattern Reference**: `selectDefaultFieldProps.test.tsx` provides the exact test structure to follow
3. **Complete Context**: All file paths, types, and integration points documented
4. **Step-by-Step Guide**: Implementation guide with 41 test templates
5. **Validation Commands**: All test commands verified and working
6. **Clear Anti-Patterns**: Common pitfalls explicitly documented

### Potential Risks

1. **Dynamic Layer Complexity**: Expression evaluation may have edge cases not covered in research (mitigated by comprehensive edge case tests)
2. **Test Execution Time**: 40+ tests may take time to run (mitigated by efficient test design)

### Risk Mitigation

- Start with single layer tests (simplest) before complex scenarios
- Run tests frequently during implementation
- Reference S1/S2 tests for exact patterns
- Use provided test templates as starting points

---

## Research Documents Index

All research documents are stored in: `/home/dustin/projects/formality/plan/bugfix/P1M1T3S3/research/`

1. **README.md** - Research summary and index
2. **implementation_guide.md** - Step-by-step implementation with 41 test templates
3. **quick_reference.md** - Quick reference for patterns and assertions
4. **prop_merging_testing_best_practices.md** - Best practices for testing prop merging
5. **external_resources.md** - External documentation and resources
6. **url_reference_list.md** - Complete URL reference list

---

*This PRP is the result of comprehensive research across the Formality codebase, existing test patterns, and external best practices. Following this PRP should enable one-pass implementation success for the 8-layer priority order test suite.*
