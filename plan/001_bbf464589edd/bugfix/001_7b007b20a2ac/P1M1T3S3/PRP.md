# Product Requirement Prompt (PRP): Test 8-Layer Priority Order

## Goal

**Feature Goal**: Validate and test the 8-layer prop priority system in the Formality framework to ensure correct prop merging behavior across all configuration layers.

**Deliverable**: Comprehensive test suite (`packages/react/src/__tests__/priorityOrder.test.tsx`) that validates the complete priority order system with all edge cases.

**Success Definition**:
- All 8 layers (plus coreProps) are tested in isolation
- Adjacent layer priority tests verify each layer correctly overrides the previous
- Skip-layer tests verify non-adjacent priority relationships
- Full chain tests verify all layers working together
- Dynamic layer tests verify expression-based prop evaluation
- All tests pass with `pnpm test priorityOrder`
- Coverage report shows 100% of mergeFieldProps code paths tested

## Why

The Formality framework implements an 8-layer prop priority system that allows developers to configure form fields at multiple levels:
- **Provider level**: Global defaults for all forms
- **Form level**: Form-specific defaults
- **Input level**: Input type-specific defaults
- **Field level**: Individual field configuration
- **Component level**: JSX props for maximum specificity

This sophisticated system requires comprehensive testing to ensure:
1. Props merge correctly (shallow merge, not deep merge)
2. Higher priority layers correctly override lower ones
3. Expression-based props re-evaluate when dependencies change
4. Edge cases (undefined, null, empty objects) are handled gracefully
5. Core props (name, value, onChange) always win

## What

### The 8-Layer Priority System (Lowest to Highest Priority)

```
Layer 1 (lowest):  providerDefaultFieldProps (static)
Layer 2:           providerSelectDefaultFieldProps (dynamic)
Layer 3:           formDefaultFieldProps (static)
Layer 4:           formSelectDefaultFieldProps (dynamic)
Layer 5:           inputProps (static, from InputConfig.props)
Layer 6:           fieldConfigProps (static, from FieldConfig.props)
Layer 7:           selectProps (dynamic, from FieldConfig.selectProps)
Layer 8:           componentProps (static, from JSX props)

CoreProps (always wins): name, value, onChange, onBlur, ref, disabled, error
```

### Key Implementation Details

**Static vs Dynamic Layers**:
- Static layers (1, 3, 5, 6, 8): Props are merged directly using `mergeStaticProps`
- Dynamic layers (2, 4, 7): Props are evaluated using `usePropsEvaluation` hook with expression parsing

**Merge Behavior**:
- Uses `Object.assign` for shallow merge (NOT deep merge)
- Later layers override earlier layers for same keys
- Different keys from different layers are all applied
- Arrays are replaced, not merged

**Expression Evaluation**:
- Uses `jsep` parser for expression strings
- Dependencies are automatically tracked for re-evaluation
- Function callbacks receive `(formState, methods)` parameters

### Success Criteria

- [ ] Single layer tests: Each of 8 layers applies props correctly in isolation
- [ ] Adjacent layer tests: L2>L1, L3>L2, L4>L3, L5>L4, L6>L5, L7>L6, L8>L7
- [ ] Skip layer tests: L3>L1, L4>L1, L5>L2, L7>L4, L8>L3, L8>L1
- [ ] Full chain tests: All 8 layers with different props merge correctly
- [ ] Same property tests: When all layers have same property, L8 wins
- [ ] CoreProps tests: name, value, onChange always work correctly
- [ ] Dynamic layer tests: Expressions in L2, L4, L7 evaluate and re-evaluate
- [ ] Merge behavior tests: Different props merge, same props override
- [ ] Edge case tests: undefined, null, empty objects, frozen objects
- [ ] All tests pass with `pnpm test priorityOrder`

## All Needed Context

### Context Completeness Check

**Test**: If someone knew nothing about this codebase, would they have everything needed to implement these tests successfully?

**Answer**: YES - This PRP provides:
- Complete layer definitions with code examples
- Exact file paths to reference
- Test fixture patterns to follow
- Merge behavior explanation
- Validation commands specific to this project

### Documentation & References

```yaml
# MUST READ - Core Implementation Files

- file: packages/core/src/config/merge.ts
  why: Contains mergeFieldProps and mergeStaticProps - the core priority logic
  pattern: Shows how layers are merged using Object.assign (shallow merge)
  critical: mergeStaticProps uses for loop with Object.assign - later layers override earlier
  lines: 155-167 (mergeStaticProps), 180-215 (mergeFieldProps)

- file: packages/react/src/hooks/usePropsEvaluation.ts
  why: Contains dynamic prop evaluation logic for layers 2, 4, 7
  pattern: Shows expression parsing and dependency tracking
  critical: Dynamic props are evaluated separately then passed to mergeFieldProps
  gotcha: Expressions use jsep parser - string values must be quoted in expressions

- file: packages/react/src/components/Field.tsx
  why: Shows how mergeFieldProps is called with all 8 layers
  pattern: Lines 395-414 show the complete merge call
  critical: coreProps are passed last - they always win
  lines: 395-414

# TEST PATTERNS - Follow These Examples

- file: packages/react/src/__tests__/selectDefaultFieldProps.test.tsx
  why: Shows test patterns for provider-level and form-level dynamic props
  pattern: Uses forwardRef components with data-testid for testing
  critical: Test input components must use forwardRef pattern
  gotcha: Expression string values must be double-quoted: '"value"'

- file: packages/react/src/__tests__/priorityOrder.simple.test.tsx
  why: Simplified test file showing basic priority test structure
  pattern: Minimal test setup for debugging
  critical: Good starting point for understanding test structure

- file: packages/react/src/__tests__/Form.test.tsx
  why: Shows Form component testing patterns with FormalityProvider
  pattern: How to wrap tests in provider
  gotcha: Always wrap tests in FormalityProvider with inputs config

# TYPE DEFINITIONS

- file: packages/core/src/types/index.ts
  why: Contains InputConfig, FieldConfig, FormConfig, FormalityProviderConfig types
  pattern: Shows structure of each configuration layer
  critical: Understanding which props belong to which layer

# TESTING CONFIGURATION

- file: vitest.workspace.ts
  why: Shows test workspace configuration
  pattern: Separate configs for core (node) and react (jsdom)
  critical: React tests use jsdom environment

- file: packages/react/vitest.config.ts
  why: React-specific test configuration
  pattern: Uses jsdom environment for React Testing Library
  critical: Tests must run in jsdom, not node

# DOCUMENTATION

- docfile: plan/001_bbf464589edd/bugfix/P1M1T3S3/research/quick_reference.md
  why: Quick reference for the 8-layer system (if exists)
  section: Layer definitions and priority order
```

### Current Codebase Tree (Relevant Sections)

```bash
packages/
├── core/
│   └── src/
│       ├── config/
│       │   └── merge.ts                    # mergeFieldProps, mergeStaticProps
│       └── types/
│           └── index.ts                    # InputConfig, FieldConfig, FormConfig types
└── react/
    └── src/
        ├── __tests__/
        │   ├── selectDefaultFieldProps.test.tsx    # S1/S2 tests (provider/form level)
        │   ├── priorityOrder.test.tsx              # S3 tests (8-layer priority) - MAIN FILE
        │   └── priorityOrder.simple.test.tsx       # Simplified tests for debugging
        ├── components/
        │   ├── Field.tsx                   # Calls mergeFieldProps with all 8 layers
        │   ├── Form.tsx
        │   └── FormalityProvider.tsx
        └── hooks/
            └── usePropsEvaluation.ts       # Dynamic prop evaluation (L2, L4, L7)

plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/
└── P1M1T3S3/
    ├── PRP.md                             # This file
    └── research/                          # Store any external research here
```

### Desired Codebase Tree with Files to be Added

```bash
# No new files needed - tests already exist at:
packages/react/src/__tests__/priorityOrder.test.tsx

# This PRP documents the test structure and validates completeness
# If implementing from scratch, create:
packages/react/src/__tests__/priorityOrder.test.tsx
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Expression string values must be double-quoted
// WRONG: selectDefaultFieldProps={{ className: "value" }}
// RIGHT: selectDefaultFieldProps={{ className: '"value"' }}
// The inner quotes are for the expression parser, outer for JS object

// CRITICAL: mergeStaticProps uses Object.assign (SHALLOW merge)
// This means objects are replaced, not deep-merged
// Example: { style: { color: "red" } } + { style: { fontSize: "14px" } }
// Result: { style: { fontSize: "14px" } } - color is LOST

// CRITICAL: Test components MUST use forwardRef
// The Field component passes ref to the input component
// Without forwardRef, tests will fail with ref errors

// CRITICAL: data-testid pattern is REQUIRED for test selectors
// Test components must pass data-testid={name} to the input element
// Use screen.getByTestId("fieldName") to select elements

// CRITICAL: coreProps ALWAYS win - they are passed last to mergeFieldProps
// name, value, onChange, onBlur, ref, disabled, error cannot be overridden
// Even if layer 8 tries to override these, coreProps win

// CRITICAL: Layer 5 (inputProps) comes from InputConfig.props
// This is configured in the FormalityProvider inputs prop
// To test layer 5, you must create custom testInputs with props

// CRITICAL: Dynamic layers (2, 4, 7) require waitFor for re-evaluation
// After changing a dependency field, use waitFor to assert updated values
// This is because expression evaluation is async via useEffect

// GOTCHA: disabled is a core prop - it cannot be tested at layer level
// The coreProps.disabled overrides any layer-level disabled prop
// Use className or data- attributes instead for priority testing

// GOTCHA: Arrays are replaced, not merged
// If layer 1 has { classNames: ["a", "b"] } and layer 2 has { classNames: ["c"] }
// Result is { classNames: ["c"] } - not ["a", "b", "c"]
```

## Implementation Blueprint

### Test Structure Overview

The test file `priorityOrder.test.tsx` is organized into these test suites:

1. **Single Layer Tests** - Each layer (1-8) tested in isolation
2. **Adjacent Layers** - Each layer correctly overrides its predecessor
3. **Skip Layers** - Non-adjacent layers respect priority
4. **CoreProps** - Core props always win
5. **Full Chain** - All layers together with different props
6. **Dynamic Layers** - Expression evaluation for L2, L4, L7
7. **Merge Behavior** - Shallow merge, not deep merge
8. **Edge Cases** - Null, undefined, frozen objects, etc.

### Test Fixture Pattern (REQUIRED)

```typescript
// Test input component with forwardRef (REQUIRED PATTERN)
interface TestInputProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
  placeholder?: string;
  className?: string;
  size?: string;
  variant?: string;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  style?: React.CSSProperties;
  "data-size"?: string;
  "data-variant"?: string;
  [key: string]: unknown;  // CRITICAL: Allow spread of additional props
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({
    value,
    onChange,
    disabled,
    label,
    error,
    name,
    placeholder,
    className,
    size,
    variant,
    required,
    readOnly,
    autoComplete,
    style,
    "data-size": dataSize,
    "data-variant": dataVariant,
    ...props  // CRITICAL: Spread additional props
  }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}  // CRITICAL: forwardRef required
        data-testid={name}  // CRITICAL: test selector
        data-size={dataSize ?? size}
        data-variant={dataVariant ?? variant}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        required={required}
        readOnly={readOnly}
        autoComplete={autoComplete}
        style={style}
        {...props}  // CRITICAL: spread additional props from merge
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);

TestInput.displayName = "TestInput";  // REQUIRED for React DevTools

// Test inputs config (REQUIRED for all tests)
const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
  switch: { component: TestSwitch, defaultValue: false },
};
```

### Layer-by-Layer Test Examples

```typescript
// Layer 1: providerDefaultFieldProps (static)
<FormalityProvider
  inputs={testInputs}
  defaultFieldProps={{ className: "layer-1" }}  // Static value
>
  <Form config={config}><Field name="field" /></Form>
</FormalityProvider>

// Layer 2: providerSelectDefaultFieldProps (dynamic)
<FormalityProvider
  inputs={testInputs}
  selectDefaultFieldProps={{ className: '"layer-2"' }}  // Expression string
>

// Layer 3: formDefaultFieldProps (static)
<Form
  config={config}
  formConfig={{ defaultFieldProps: { className: "layer-3" } }}
>

// Layer 4: formSelectDefaultFieldProps (dynamic)
<Form
  config={config}
  formConfig={{ selectDefaultFieldProps: { className: '"layer-4"' } }}
>

// Layer 5: inputProps (static, from InputConfig.props)
const testInputsWithLayer5: Record<string, InputConfig> = {
  textField: {
    component: TestInput,
    defaultValue: "",
    props: { className: "layer-5" }  // In InputConfig
  },
};

// Layer 6: fieldConfigProps (static, from FieldConfig.props)
const config: FormFieldsConfig = {
  field: { type: "textField", props: { className: "layer-6" } }
};

// Layer 7: selectProps (dynamic, from FieldConfig.selectProps)
const config: FormFieldsConfig = {
  field: {
    type: "textField",
    selectProps: { className: '"layer-7"' }  // Expression
  }
};

// Layer 8: componentProps (static, from JSX)
<Field name="field" className="layer-8" />
```

### Priority Test Examples

```typescript
// Adjacent Layer Test: L2 > L1
it("should prioritize layer 2 over layer 1", () => {
  render(
    <FormalityProvider
      inputs={testInputs}
      defaultFieldProps={{ className: "layer-1" }}
      selectDefaultFieldProps={{ className: '"layer-2"' }}
    >
      <Form config={config}><Field name="field" /></Form>
    </FormalityProvider>
  );
  expect(screen.getByTestId("field")).toHaveClass("layer-2");
  expect(screen.getByTestId("field")).not.toHaveClass("layer-1");
});

// Skip Layer Test: L3 > L1 (skipping L2)
it("should prioritize layer 3 over layer 1 (skipping layer 2)", () => {
  render(
    <FormalityProvider
      inputs={testInputs}
      defaultFieldProps={{ className: "layer-1" }}
      // Layer 2 not set
    >
      <Form
        config={config}
        formConfig={{ defaultFieldProps: { className: "layer-3" } }}
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );
  expect(screen.getByTestId("field")).toHaveClass("layer-3");
});

// Full Chain Test: All layers with different props
it("should apply correct priority across all 8 layers", () => {
  const config: FormFieldsConfig = {
    field: {
      type: "textField",
      props: { "data-size": "layer-6" },
      selectProps: { className: '"layer-7"' },
    },
  };

  render(
    <FormalityProvider
      inputs={testInputsWithLayer5}
      defaultFieldProps={{ "data-test": "layer-1" }}
      selectDefaultFieldProps={{ "data-size": '"layer-2"' }}
    >
      <Form
        config={config}
        formConfig={{
          defaultFieldProps: { placeholder: "layer-3" },
          selectDefaultFieldProps: { className: '"layer-4"' },
        }}
      >
        <Field name="field" className="layer-8" placeholder="override" />
      </Form>
    </FormalityProvider>
  );

  // L8 wins for className and placeholder
  expect(screen.getByTestId("field")).toHaveClass("layer-8");
  expect(screen.getByTestId("field")).toHaveAttribute("placeholder", "override");
  // L6 wins for data-size (L7 doesn't have data-size)
  expect(screen.getByTestId("field")).toHaveAttribute("data-size", "layer-6");
  // L1 wins for data-test (no higher layer has it)
  expect(screen.getByTestId("field")).toHaveAttribute("data-test", "layer-1");
});
```

### Dynamic Layer Test Pattern

```typescript
// Dynamic layers use async testing with waitFor
it("should evaluate providerSelectDefaultFieldProps expression", async () => {
  const config: FormFieldsConfig = {
    switch: { type: "switch" },
    target: { type: "textField" },
  };

  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{
        className: 'switch ? "enabled" : "disabled"',
      }}
    >
      <Form config={config}>
        <Field name="switch" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  // Initial state (switch is false)
  expect(screen.getByTestId("target")).toHaveClass("disabled");

  // Toggle switch
  const user = userEvent.setup();
  await user.click(screen.getByTestId("switch"));

  // Expression re-evaluated - use waitFor for async update
  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveClass("enabled");
  });
});
```

### Merge Behavior Test Pattern

```typescript
// Shallow merge test - objects are REPLACED, not deep-merged
it("should handle nested object merging with style property", () => {
  render(
    <FormalityProvider
      inputs={testInputs}
      defaultFieldProps={{ style: { color: "red", fontSize: "14px" } }}
    >
      <Form
        config={config}
        formConfig={{ defaultFieldProps: { style: { fontWeight: "bold" } } }}
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );

  const field = screen.getByTestId("field") as HTMLInputElement;
  // Style is REPLACED, not merged
  expect(field.style.fontWeight).toBe("bold");
  expect(field.style.color).toBe("");  // LOST - replaced by formConfig
  expect(field.style.fontSize).toBe("");  // LOST - replaced by formConfig
});
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after writing tests - fix before proceeding
cd /home/dustin/projects/formality
pnpm exec eslint packages/react/src/__tests__/priorityOrder.test.tsx --fix

# TypeScript type checking
pnpm exec tsc --noEmit --project packages/react/tsconfig.json

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the priorityOrder file specifically
pnpm test priorityOrder

# Run with coverage to see what's tested
pnpm test -- --coverage --reporter=verbose priorityOrder

# Run all react tests to ensure no regressions
pnpm test --filter=react

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run complete test suite
pnpm test

# Test file with watch mode for development
pnpm test:watch -- priorityOrder

# Expected: All tests pass, no new failures introduced elsewhere.
```

### Level 4: Manual & Visual Validation

```bash
# For dynamic layer tests, verify manually:
# 1. Expression evaluation works correctly
# 2. Dependencies trigger re-evaluation
# 3. Multiple fields update when shared dependency changes
# 4. Expression errors are handled gracefully

# Run tests with verbose output
pnpm test priorityOrder --reporter=verbose

# Check test coverage meets project standards
pnpm test:coverage
# Look at packages/react/coverage/index.html to verify coverage
```

## Final Validation Checklist

### Technical Validation

- [ ] All 8 layers tested in isolation (24+ tests)
- [ ] Adjacent layer priority verified (7 tests: L2>L1, L3>L2, L4>L3, L5>L4, L6>L5, L7>L6, L8>L7)
- [ ] Skip-layer priority verified (6+ tests)
- [ ] Full chain test with all 8 layers works correctly
- [ ] Same property override test (all layers have same prop, L8 wins)
- [ ] Dynamic layer tests pass (L2, L4, L7 expression evaluation)
- [ ] Merge behavior tests pass (shallow merge verified)
- [ ] Edge case tests pass (undefined, null, empty, frozen objects)
- [ ] CoreProps tests pass (name, value, onChange always work)
- [ ] All tests pass: `pnpm test priorityOrder`

### Feature Validation

- [ ] Test file exists at `packages/react/src/__tests__/priorityOrder.test.tsx`
- [ ] Tests follow existing test patterns (forwardRef, data-testid, etc.)
- [ ] Test fixtures match the TestInput pattern
- [ ] Dynamic tests use `waitFor` for async assertions
- [ ] Expression strings use proper double-quoting: `'"value"'`

### Code Quality Validation

- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Tests are organized into logical describe blocks
- [ ] Test names are descriptive and follow pattern: "should [do something]"
- [ ] Each test is independent (no shared state between tests)
- [ ] Comments explain complex test scenarios

### Coverage Validation

- [ ] `mergeFieldProps` function is 100% covered
- [ ] `mergeStaticProps` function is 100% covered
- [ ] All 8 layer inputs are tested
- [ ] Core props override behavior is tested
- [ ] Expression evaluation paths are tested

## Anti-Patterns to Avoid

- ❌ Don't use `disabled` prop for priority testing (it's a core prop that always wins)
- ❌ Don't forget `forwardRef` on test components (Field component passes ref)
- ❌ Don't forget `data-testid` on test components (needed for screen.getByTestId)
- ❌ Don't forget to spread `...props` in test components (props from merge need to be applied)
- ❌ Don't use unquoted strings in expressions: `className: "value"` is wrong, use `'"value"'`
- ❌ Don't expect deep merge for objects (style, etc.) - merge is shallow
- ❌ Don't forget `waitFor` when testing dynamic layer re-evaluation
- ❌ Don't test props that can't be overridden (name, value, onChange from coreProps)
- ❌ Don't create test inputs without the `[key: string]: unknown` index signature
- ❌ Don't forget to set `displayName` on forwardRef components
- ❌ Don't use `describe` blocks that are too deeply nested (keep it flat)
- ❌ Don't share mutable state between tests (each test should be independent)
- ❌ Don't forget to wrap tests in `FormalityProvider` with `inputs` prop

## Implementation Notes

### Existing Test Status

The file `packages/react/src/__tests__/priorityOrder.test.tsx` already exists with comprehensive test coverage:

- **Single Layer Tests**: All 8 layers tested (24 tests)
- **Adjacent Layers**: All 7 adjacent relationships tested
- **Skip Layers**: 6 skip-layer scenarios tested
- **Full Chain**: Complete 8-layer integration tested
- **Dynamic Layers**: L2, L4, L7 expression evaluation tested
- **Merge Behavior**: Shallow merge vs replacement tested
- **Edge Cases**: 10+ edge case scenarios tested

**Total**: 60+ comprehensive test cases covering the complete 8-layer priority system.

### If Implementing from Scratch

If starting from scratch (e.g., for a new feature), follow this structure:

1. Create test fixtures (TestInput, TestSwitch, testInputs)
2. Write single layer tests first (one describe block per layer)
3. Add adjacent layer tests
4. Add skip-layer tests
5. Add full chain integration test
6. Add dynamic layer tests (async with waitFor)
7. Add merge behavior tests
8. Add edge case tests
9. Verify all tests pass
10. Check coverage meets standards

### Test Commands Reference

```bash
# Run priority order tests
pnpm test priorityOrder

# Run with coverage
pnpm test:coverage -- priorityOrder

# Run in watch mode during development
pnpm test:watch -- priorityOrder

# Run all tests
pnpm test

# Run with verbose output
pnpm test priorityOrder --reporter=verbose
```

---

## Summary

This PRP provides complete context for implementing or validating the 8-layer priority order test suite in the Formality framework. The existing test file at `packages/react/src/__tests__/priorityOrder.test.tsx` already contains comprehensive coverage of all requirements.

**Confidence Score**: 10/10 for one-pass implementation success - all necessary context, patterns, and examples are provided in this PRP.
