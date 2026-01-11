# PRP: P1.M1.T3.S2 - Test Form-Level Evaluation

---

## Goal

**Feature Goal**: Create comprehensive tests for form-level `selectDefaultFieldProps` evaluation in the `usePropsEvaluation` hook and Field component integration, verifying that form-level expressions evaluate correctly and override provider-level props.

**Deliverable**: Additional test cases in `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx` with form-level evaluation tests covering expression evaluation, function callbacks, priority ordering (form overrides provider), and async re-evaluation when dependencies change.

**Success Definition**:
- Form-level expressions like `{ className: 'signed ? "signed-enabled" : "signed-disabled"' }` evaluate correctly against form state
- Function callbacks receive `(formState, methods)` parameters
- Expression re-evaluates when dependencies change (useWatch triggers)
- Form-level props override provider-level props (priority order: field > form > provider)
- Tests use existing test fixtures (TestInput, TestSwitch) from the provider-level tests
- Tests follow the same patterns as provider-level tests (AAA pattern, waitFor for async)
- All existing tests continue to pass

---

## User Persona

**Target User**: QA engineers and developers maintaining the formality codebase

**Use Case**: When implementing or modifying form-level dynamic field props, tests verify that expressions evaluate correctly, override provider-level props, and maintain proper priority ordering

**User Journey**:
1. Developer adds form-level `selectDefaultFieldProps` to `Form` component's `formConfig`
2. Tests verify expressions evaluate against current form state
3. Tests verify re-evaluation when watched fields change
4. Tests verify form props override provider props (priority order)

**Pain Points Addressed**:
- **Current Gap**: No tests exist for form-level `selectDefaultFieldProps` evaluation
- **Risk**: Untested functionality could regress or break silently
- **Validation Needed**: Verify that form-level props (layer 5) correctly override provider-level props (layer 7)

---

## Why

### Business Value
- **Quality Assurance**: Ensures form-level dynamic props work as designed
- **Regression Prevention**: Catches bugs before they reach production
- **Documentation**: Tests serve as executable documentation of expected behavior

### Integration with Existing Features
- Completes testing coverage for P1.M1.T1 (usePropsEvaluation hook - form-level evaluation implemented in P1.M1.T1.S2)
- Validates integration from P1.M1.T2 (Field component consumes form props)
- Tests the layer 5 priority in the 8-layer prop merging system
- Builds on provider-level tests (P1.M1.T3.S1) which are already complete

### Problems Solved
- **Untested Code**: Form-level evaluation is implemented but has zero test coverage
- **Priority Verification**: Ensures form props (layer 5) correctly override provider props (layer 7)
- **Async Validation**: Verifies expression re-evaluation when form state changes

---

## What

Add test cases to the existing `selectDefaultFieldProps.test.tsx` file that test form-level `selectDefaultFieldProps` evaluation through:

1. **Expression-based form props**: `{ className: 'signed ? "yes" : "no"' }` evaluates to boolean
2. **Function callback form props**: `(formState) => ({ variant: ... })` receives formState
3. **Re-evaluation on dependency change**: When watched field changes, form props update
4. **Priority ordering**: Form-level props override provider-level props
5. **Multiple fields**: Form props apply to all fields correctly

### Success Criteria

- [ ] Test cases added to existing `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx` file
- [ ] Form-level expressions evaluate correctly (e.g., `'signed ? "yes" : "no"'` → `"yes"` when `signed=true`)
- [ ] Function callbacks receive `(formState, methods)` parameters
- [ ] Re-evaluation triggers when watched fields change
- [ ] Form props override provider props (priority order verified)
- [ ] All tests use existing test fixtures (TestInput, TestSwitch, testInputs)
- [ ] All tests follow existing patterns (AAA pattern, waitFor for async)
- [ ] All existing tests pass (no regressions)

---

## All Needed Context

### Context Completeness Check

*"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"*

**Answer**: YES - This PRP provides:
- Exact test file location and existing structure
- Complete test fixtures to reuse (TestInput, TestSwitch, testInputs)
- All import statements and type definitions needed
- Existing test patterns to follow (from provider-level tests in same file)
- Validation commands verified to work in this codebase
- Specific test scenarios with expected outcomes

### Documentation & References

```yaml
# MUST READ - Test Pattern Reference Files

- file: /home/dustin/projects/formality/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx
  why: Contains existing provider-level tests to mirror for form-level tests
  pattern: Lines 90-225 show expression-based tests, lines 231-324 show function callback tests
  critical: Uses waitFor for async assertions, userEvent.setup() for interactions
  gotcha: Test components must use forwardRef for ref forwarding

- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Contains existing test patterns for selectProps evaluation at field level
  pattern: Lines 230-290 show selectProps expression evaluation tests
  critical: Shows how to test re-evaluation when dependencies change

- file: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  why: The hook being tested - evaluates formDefaultFieldProps
  section: Lines 208-224 evaluate formDefaultFieldProps
  pattern: Function callbacks get (formState, methods), expressions use buildFieldContext
  critical: Form-level evaluation happens AFTER provider-level evaluation

- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows how form-level props are consumed in Field component
  section: Lines 289-295 call usePropsEvaluation with formDefaultFieldProps
  critical: formConfig.selectDefaultFieldProps is passed to hook

- file: /home/dustin/projects/formality/packages/react/src/components/Form.tsx
  why: Defines the formConfig prop that contains selectDefaultFieldProps
  section: Shows how formConfig is passed to FormContext
  pattern: formConfig.selectDefaultFieldProps is the form-level dynamic props

- file: /home/dustin/projects/formality/packages/core/src/config/merge.ts
  why: Documents the 8-layer priority order we need to verify
  section: Lines 180-215 show mergeFieldProps with priority layers
  critical: "providerSelectDefaultFieldProps (layer 7) < formSelectDefaultFieldProps (layer 5)"

# EXTERNAL RESEARCH (In plan/bugfix/P1M1T3S2/research/)

- docfile: plan/bugfix/P1M1T3S2/research/form_level_testing_patterns.md
  why: Research on testing form-level props evaluation patterns
  section: "Test Patterns" section shows specific test patterns for form-level evaluation

- docfile: plan/bugfix/P1M1T3S2/research/form_level_priority_testing.md
  why: Research on testing priority order between form and provider levels
  section: "Test Patterns for Priority Testing" shows override and merge tests

- docfile: plan/bugfix/P1M1T3S2/research/form_reevaluation_patterns.md
  why: Research on testing re-evaluation with waitFor
  section: "Test Patterns" shows specific patterns for testing async re-evaluation
```

### Current Codebase Structure

```bash
packages/
├── core/
│   └── src/
│       ├── config/
│       │   └── merge.ts                    # 8-layer priority order
│       ├── evaluation/
│       │   ├── index.ts                    # evaluateDescriptor, buildFieldContext
│       │   └── evaluate.ts                 # Expression evaluation
│       └── types/
│           └── config.ts                   # SelectValue type definition
└── react/
    └── src/
        ├── components/
        │   ├── Field.tsx                   # Consumes formDefaultFieldProps
        │   ├── Form.tsx                    # Form component with formConfig prop
        │   └── FormalityProvider.tsx       # Provider component
        ├── hooks/
        │   └── usePropsEvaluation.ts        # Hook being tested (lines 208-224 for form-level)
        ├── context/
        │   ├── ConfigContext.ts            # Provider context
        │   └── FormContext.ts              # Form context
        └── __tests__/
            ├── Field.test.tsx              # Reference test patterns
            ├── Form.test.tsx               # Form test patterns
            └── selectDefaultFieldProps.test.tsx  # EXISTING FILE - Add tests to this
```

### Desired Codebase Structure with Changes

```bash
# Add test cases to existing file:
packages/react/src/__tests__/selectDefaultFieldProps.test.tsx

# New test suites to add:
├── Test Suite 6: Form-Level Expression-Based Tests
│   ├── Test: Boolean expression evaluation
│   ├── Test: String expression evaluation
│   └── Test: Complex expression evaluation
├── Test Suite 7: Form-Level Function Callback Tests
│   ├── Test: Function receives formState parameter
│   └── Test: Function receives methods parameter
├── Test Suite 8: Form-Level Re-Evaluation Tests
│   ├── Test: Props update when dependency changes
│   ├── Test: Toggle back and forth
│   └── Test: Multiple fields watching same dependency
└── Test Suite 9: Form-Level Priority Tests
    ├── Test: Form props override provider props
    ├── Test: Form and provider merge for different props
    └── Test: Complete priority chain (field > form > provider)
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: Reuse existing test fixtures from provider-level tests
// The TestInput, TestSwitch, and testInputs are already defined at the top of the file
// DO NOT redefine them - just use them

// CRITICAL: Form-level props override provider-level props
// Layer 5 (formSelectDefaultFieldProps) > Layer 7 (providerSelectDefaultFieldProps)
// When both provide the same property, form wins

// CRITICAL: Always use data-testid for selectors in tests
// This matches the pattern in existing tests
screen.getByTestId("fieldName")
screen.queryByTestId("fieldName")  // For testing absence

// CRITICAL: Always use waitFor for async assertions
// Expression evaluation happens after render cycle
await waitFor(() => {
  expect(screen.getByTestId("field")).toHaveClass("enabled");
});

// CRITICAL: Always use userEvent.setup() per test
// This creates a fresh userEvent instance for each test
const user = userEvent.setup();

// CRITICAL: All userEvent methods are async - always await
await user.type(screen.getByTestId("field"), "value");
await user.click(screen.getByTestId("button"));

// CRITICAL: Form config uses formConfig prop, not config prop
// <Form config={fieldConfig} formConfig={formConfig}>
// NOT: <Form config={fieldConfig, selectDefaultFieldProps: {...}}>

// CRITICAL: Expression evaluation uses jsep syntax
// Field references: 'fieldName' evaluates to field value
// Negation: '!fieldName' evaluates to NOT field value
// Comparison: 'fieldName === "value"' evaluates to boolean
// Ternary: 'condition ? "yes" : "no"' evaluates to string

// CRITICAL: Function callbacks receive (formState, methods)
// formState.fields contains field state proxies
// methods contains react-hook-form methods (getValues, setValue, etc.)

// CRITICAL: Re-evaluation happens via useWatch
// When a watched field changes, useWatch triggers re-render
// This causes usePropsEvaluation to re-evaluate expressions

// CRITICAL: Test fixtures must use forwardRef pattern
// TestInput and TestSwitch are already defined with forwardRef
// Just use them, don't redefine

// GOTCHA: Default values matter for expression evaluation
// If field has no default value, it's undefined in formState
// Use defaultValues prop on Form to set initial state

// GOTCHA: Form-level props apply only to that form
// Provider-level props apply to ALL forms
// This is the key distinction to test

// GOTCHA: Test both override and merge behavior
// Same property: form overrides provider
// Different properties: both apply (merge)

// GOTCHA: Expressions at both levels are both evaluated
// But form result wins for conflicting properties

// GOTCHA: Test initial state before interactions
// Don't assume initial state - verify it first
```

---

## Implementation Blueprint

### Test Fixtures (Reuse Existing)

The test file already has these fixtures defined at the top. DO NOT redefine them - just use them.

```typescript
// These are already in the file - DO NOT recreate
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(...);
const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(...);
const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
  switch: { component: TestSwitch, defaultValue: false },
};
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD Form-Level Expression-Based Tests to selectDefaultFieldProps.test.tsx
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx
  - LOCATION: After line 634 (after existing provider-level tests)
  - ADD: New describe block "selectDefaultFieldProps - Form Level - Expression-Based"
  - TEST: "should evaluate form-level boolean expression for className"
    - Form: formConfig={{ selectDefaultFieldProps: { className: 'signed ? "signed-enabled" : "signed-disabled"' } }}
    - Provider: No selectDefaultFieldProps (or with different props for comparison)
    - Assert: className evaluates correctly based on signed field
  - TEST: "should evaluate form-level string expression"
    - Form: formConfig={{ selectDefaultFieldProps: { placeholder: "client" } }}
    - Assert: placeholder equals client field value
  - TEST: "should evaluate complex form expression"
    - Form: formConfig={{ selectDefaultFieldProps: { className: 'userType === "admin" ? "admin-field" : "user-field"' } }}
    - Assert: className changes based on userType value

Task 2: ADD Form-Level Function Callback Tests
  - LOCATION: After Task 1 tests
  - ADD: New describe block "selectDefaultFieldProps - Form Level - Function Callbacks"
  - TEST: "should call form-level function with formState"
    - Form: formConfig={{ selectDefaultFieldProps: (formState) => ({ ... }) }}
    - Capture and verify formState parameter
  - TEST: "should call form-level function with methods"
    - Form: formConfig={{ selectDefaultFieldProps: (formState, methods) => ({ ... }) }}
    - Capture and verify methods parameter

Task 3: ADD Form-Level Re-Evaluation Tests
  - LOCATION: After Task 2 tests
  - ADD: New describe block "selectDefaultFieldProps - Form Level - Re-Evaluation"
  - TEST: "should re-evaluate form props when dependency changes"
    - Form: formConfig={{ selectDefaultFieldProps: { className: 'signed ? "yes" : "no"' } }}
    - Action: Toggle signed field twice
    - Assert: className updates after each toggle (use waitFor)
  - TEST: "should re-evaluate for multiple fields watching same dependency"
    - Form: Multiple fields, formConfig with expression
    - Action: Toggle dependency
    - Assert: All fields update together
  - TEST: "should re-evaluate string expression when dependency changes"
    - Form: formConfig={{ selectDefaultFieldProps: { placeholder: "source" } }}
    - Action: Type in source field
    - Assert: All dependent fields update placeholder

Task 4: ADD Form-Level Priority Ordering Tests
  - LOCATION: After Task 3 tests
  - ADD: New describe block "selectDefaultFieldProps - Form Level - Priority Ordering"
  - TEST: "should prioritize form props over provider props"
    - Provider: selectDefaultFieldProps={{ size: '"small"', variant: '"provider"' }}
    - Form: formConfig={{ selectDefaultFieldProps: { size: '"large"' } }}
    - Assert: size="large" (form overrides), variant="provider" (provider default)
  - TEST: "should merge form and provider props when different"
    - Provider: selectDefaultFieldProps={{ size: '"small"', className: '"provider-class"' }}
    - Form: formConfig={{ selectDefaultFieldProps: { variant: '"form"' } }}
    - Assert: All three props applied (merged)
  - TEST: "should apply correct priority: field > form > provider"
    - Provider: selectDefaultFieldProps={{ size: '"provider"', variant: '"provider"', className: '"provider-class"' }}
    - Form: formConfig={{ selectDefaultFieldProps: { size: '"form"', variant: '"form"', className: '"form-class"' } }}
    - Field: selectProps={{ size: '"field"' }}
    - Assert: Priority: field > form > provider for each prop

Task 5: VALIDATE all tests run successfully
  - RUN: cd /home/dustin/projects/formality && pnpm -F @formality-ui/react test -- selectDefaultFieldProps.test.tsx
  - EXPECT: All new tests pass
  - VERIFY: No existing tests break

Task 6: RUN full test suite
  - RUN: cd /home/dustin/projects/formality && pnpm -F @formality-ui/react test
  - EXPECT: All tests pass (new + existing)
  - VERIFY: Test count increased correctly
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Basic Form-Level Expression Test
// ============================================================================

describe("selectDefaultFieldProps - Form Level - Expression-Based", () => {
  it("should evaluate form-level boolean expression for className", async () => {
    // ARRANGE: Form with expression, Provider without (or with different props)
    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { className: 'signed ? "signed-enabled" : "signed-disabled"' } }}
        >
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Initial state - signed=false → "signed-disabled"
    expect(screen.getByTestId("target")).toHaveClass("signed-disabled");

    // ACT: Toggle signed to true
    const user = userEvent.setup();
    await user.click(screen.getByTestId("signed"));

    // ASSERT: signed=true → "signed-enabled"
    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveClass("signed-enabled");
    });
  });
});

// ============================================================================
// PATTERN 2: String Expression Test
// ============================================================================

it("should evaluate form-level string expression", async () => {
  const config: FormFieldsConfig = {
    client: { type: "textField", defaultValue: "" },
    contact: { type: "textField" },
  };

  render(
    <FormalityProvider inputs={testInputs}>
      <Form
        config={config}
        formConfig={{ selectDefaultFieldProps: { placeholder: "client" } }}
      >
        <Field name="client" />
        <Field name="contact" />
      </Form>
    </FormalityProvider>
  );

  // ACT: Type in client field
  const user = userEvent.setup();
  await user.type(screen.getByTestId("client"), "Acme Corp");

  // ASSERT: Contact placeholder updates to client value
  await waitFor(() => {
    expect(screen.getByTestId("contact")).toHaveAttribute("placeholder", "Acme Corp");
  });
});

// ============================================================================
// PATTERN 3: Function Callback Test
// ============================================================================

describe("selectDefaultFieldProps - Form Level - Function Callbacks", () => {
  it("should call form-level function with formState", () => {
    let capturedFormState: any;

    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{
            selectDefaultFieldProps: (formState, methods) => {
              capturedFormState = formState;
              return { className: formState.fields.field?.value ? "has-value" : "no-value" };
            }
          }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Function was called with formState
    expect(capturedFormState).toBeDefined();
  });
});

// ============================================================================
// PATTERN 4: Re-Evaluation Test
// ============================================================================

describe("selectDefaultFieldProps - Form Level - Re-Evaluation", () => {
  it("should re-evaluate form props when dependency changes", async () => {
    const config: FormFieldsConfig = {
      signed: { type: "switch" },
      target: { type: "textField" },
    };

    render(
      <FormalityProvider inputs={testInputs}>
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { className: 'signed ? "yes" : "no"' } }}
        >
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>
    );

    const user = userEvent.setup();

    // ASSERT: Initial state - signed=false → "no"
    expect(screen.getByTestId("target")).toHaveClass("no");

    // ACT: Toggle signed to true
    await user.click(screen.getByTestId("signed"));

    // ASSERT: signed=true → "yes"
    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveClass("yes");
    });

    // ACT: Toggle signed back to false
    await user.click(screen.getByTestId("signed"));

    // ASSERT: signed=false → "no"
    await waitFor(() => {
      expect(screen.getByTestId("target")).toHaveClass("no");
    });
  });
});

// ============================================================================
// PATTERN 5: Priority Override Test
// ============================================================================

describe("selectDefaultFieldProps - Form Level - Priority Ordering", () => {
  it("should prioritize form props over provider props", () => {
    const config: FormFieldsConfig = {
      field: { type: "textField" },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ size: '"small"', variant: '"provider"' }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { size: '"large"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    const field = screen.getByTestId("field");

    // ASSERT: Form size overrides provider size
    expect(field).toHaveAttribute("data-size", "large");

    // ASSERT: Provider variant applies because form doesn't override it
    expect(field).toHaveAttribute("data-variant", "provider");
  });

  it("should apply correct priority: field > form > provider", () => {
    const config: FormFieldsConfig = {
      field: {
        type: "textField",
        selectProps: { size: '"field"' },
      },
    };

    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ size: '"provider"', variant: '"provider"', className: '"provider-class"' }}
      >
        <Form
          config={config}
          formConfig={{ selectDefaultFieldProps: { size: '"form"', variant: '"form"', className: '"form-class"' } }}
        >
          <Field name="field" />
        </Form>
      </FormalityProvider>
    );

    const field = screen.getByTestId("field");

    // ASSERT: Priority: field > form > provider
    expect(field).toHaveAttribute("data-size", "field");      // Field wins
    expect(field).toHaveAttribute("data-variant", "form");     // Form wins (field didn't provide variant)
    expect(field).toHaveClass("form-class");                  // Form wins
    expect(field).not.toHaveClass("provider-class");         // Provider overridden
  });
});
```

### Integration Points

```yaml
TEST FRAMEWORK (already configured):
  - Vitest v2.0.0
  - jsdom environment
  - Test setup: src/__tests__/setup.ts
  - Test location pattern: src/**/*.test.{ts,tsx}

DEPENDENCIES (already installed):
  - vitest
  - @testing-library/react
  - @testing-library/user-event
  - @formality-ui/react (components to test)
  - @formality-ui/core (types)

MOCKING STRATEGY:
  - Use real FormalityProvider, Form, and Field components (not mocked)
  - Use real usePropsEvaluation hook (integration testing)
  - Reuse existing test fixtures (TestInput, TestSwitch, testInputs)

FILES MODIFIED:
  - packages/react/src/__tests__/selectDefaultFieldProps.test.tsx (ADD tests)

FILES REFERENCED (NOT MODIFIED):
  - packages/react/src/hooks/usePropsEvaluation.ts (code under test)
  - packages/react/src/components/Field.tsx (integration point)
  - packages/react/src/components/Form.tsx (integration point)
  - packages/core/src/config/merge.ts (priority order reference)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After adding test cases, run type checking
cd /home/dustin/projects/formality
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors in new test cases
# Common errors to watch for:
# - "Property 'forwardRef' does not exist on 'React'" → Already imported in file
# - "Cannot find name 'describe'" → Already imported in file
# - "Type 'X' is not assignable to type 'SelectValue'" → Check expression syntax

# Verify imports are correct (already in file)
grep -E "import.*from" packages/react/src/__tests__/selectDefaultFieldProps.test.tsx

# Expected imports (already present):
# - vitest: describe, it, expect
# - @testing-library/react: render, screen, waitFor
# - @testing-library/user-event: userEvent
# - react: React, forwardRef
# - @formality-ui/react: FormalityProvider, Form, Field
# - @formality-ui/core: InputConfig, type FormFieldsConfig
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run only the modified test file
pnpm -F @formality-ui/react test -- selectDefaultFieldProps.test.tsx

# Expected: All tests pass (existing provider-level + new form-level)
# Watch output for:
# ✓ selectDefaultFieldProps - Provider Level - Expression-Based (existing)
# ✓ selectDefaultFieldProps - Provider Level - Function Callbacks (existing)
# ✓ selectDefaultFieldProps - Provider Level - Re-Evaluation (existing)
# ✓ selectDefaultFieldProps - Provider Level - Priority Ordering (existing)
# ✓ selectDefaultFieldProps - Form Level - Expression-Based (NEW)
# ✓ selectDefaultFieldProps - Form Level - Function Callbacks (NEW)
# ✓ selectDefaultFieldProps - Form Level - Re-Evaluation (NEW)
# ✓ selectDefaultFieldProps - Form Level - Priority Ordering (NEW)

# Run with coverage
pnpm -F @formality-ui/react test -- selectDefaultFieldProps.test.tsx --coverage

# Expected: New code paths are covered
# - usePropsEvaluation lines 208-224 (form evaluation)
# - Field component lines 289-295 (hook call with form props)
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full React package test suite
pnpm -F @formality-ui/react test

# Expected: All tests pass (existing + new)
# Test count should increase by number of new tests
# Check for any test failures in existing tests (regressions)

# Run tests in watch mode for development
pnpm -F @formality-ui/react test -- --watch

# Expected: All tests pass in watch mode
# Useful for iterating on test failures

# Build the package
pnpm -F @formality-ui/react build

# Expected: Successful build with no errors
# Verify test file doesn't break build
```

### Level 4: Manual Verification (Optional)

```bash
# Run specific test suite to verify behavior
pnpm -F @formality-ui/react test -- selectDefaultFieldProps.test.tsx -t "Form Level"

# Expected: Only form-level tests run
# Verify all form-level tests pass individually
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test cases added to existing file: `packages/react/src/__tests__/selectDefaultFieldProps.test.tsx`
- [ ] TypeScript compiles without errors: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] All new tests pass: `pnpm -F @formality-ui/react test -- selectDefaultFieldProps.test.tsx`
- [ ] All existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] No new linting errors introduced
- [ ] Test count increased by expected number

### Feature Validation

- [ ] Form-level boolean expressions evaluate correctly (`'signed ? "yes" : "no"'` → `"yes"` when `signed=true`)
- [ ] Form-level string expressions evaluate correctly (`'client'` → client field value)
- [ ] Form-level function callbacks receive `(formState, methods)` parameters
- [ ] Form props re-evaluate when watched fields change
- [ ] Multiple fields receive form props correctly
- [ ] Form props override provider props (priority order verified)
- [ ] Field props override both form and provider props

### Code Quality Validation

- [ ] All tests use existing test fixtures (TestInput, TestSwitch, testInputs)
- [ ] All selectors use `data-testid` attributes
- [ ] All async assertions use `waitFor`
- [ ] All user interactions use `userEvent.setup()`
- [ ] Test names are descriptive and follow convention: "should..."
- [ ] Tests follow existing patterns from provider-level tests
- [ ] No implementation details tested (only behavior)
- [ ] Tests use formConfig prop correctly (not config prop)

### Test Coverage Validation

- [ ] `usePropsEvaluation` form evaluation path covered (lines 208-224)
- [ ] `Field` component form prop consumption covered (lines 289-295)
- [ ] `Form` component `formConfig` prop covered
- [ ] Expression evaluation with `buildFieldContext` covered
- [ ] Function callback evaluation covered
- [ ] Re-evaluation via `useWatch` covered
- [ ] Priority order (form > provider) verified

### Dependencies & Handoff

- [ ] P1.M1.T1 (usePropsEvaluation hook) complete ✅
- [ ] P1.M1.T2 (Field integration) complete ✅
- [ ] P1.M1.T3.S1 (provider-level tests) complete ✅
- [ ] Ready for P1.M1.T3.S3 (8-layer priority tests)
- [ ] Ready for P1.M1.T3.S4 (complex expression tests)

---

## Anti-Patterns to Avoid

- ❌ **Don't recreate test fixtures** - TestInput, TestSwitch, testInputs already exist in the file
- ❌ **Don't use getByText for inputs** - Use `data-testid` selectors instead
- ❌ **Don't skip waitFor for async updates** - Expression evaluation happens after render
- ❌ **Don't use fireEvent instead of userEvent** - userEvent provides realistic interaction
- ❌ **Don't forget to await userEvent methods** - All userEvent methods return promises
- ❌ **Don't use queryByTestId for presence assertions** - Use `getByTestId` for elements that should exist
- ❌ **Don't test implementation details** - Test behavior, not internal state
- ❌ **Don't mock FormalityProvider, Form, or Field** - Use real components for integration tests
- ❌ **Don't use config prop for form-level props** - Use `formConfig` prop instead
- ❌ **Don't forget displayName on forwardRef components** - Required for React DevTools
- ❌ **Don't test only initial state** - Also test state changes and re-evaluation
- ❌ **Don't test provider override only** - Also test merge behavior for different props

---

## Related Work Items

### Prerequisites (Must be Complete)
- **P1.M1.T1.S1**: Hook parameters added to interface ✅
- **P1.M1.T1.S2**: Form-level evaluation implemented ✅
- **P1.M1.T1.S3**: Provider-level evaluation implemented ✅
- **P1.M1.T1.S4**: TypeScript exports added ✅
- **P1.M1.T2.S1**: Field consumes evaluated props ✅
- **P1.M1.T2.S2**: Props passed to mergeFieldProps ✅
- **P1.M1.T3.S1**: Provider-level evaluation tests ✅

### This Task Enables
- **P1.M1.T3.S3**: 8-layer priority order tests (will verify complete chain)
- **P1.M1.T3.S4**: Complex expression tests (will add edge case coverage)

### Blocked By
- **P1.M1.T1**: All subtasks (S1-S4) must be complete ✅
- **P1.M1.T2**: All subtasks (S1-S2) must be complete ✅
- **P1.M1.T3.S1**: Provider-level tests must be complete ✅

---

## Research Findings Summary

### Existing Test Structure (from selectDefaultFieldProps.test.tsx)

The existing test file has this structure:
```typescript
// Lines 1-85: Imports and test fixtures
// Lines 90-225: Provider Level - Expression-Based tests
// Lines 231-324: Provider Level - Function Callbacks tests
// Lines 330-440: Provider Level - Re-Evaluation tests
// Lines 446-554: Provider Level - Priority Ordering tests
// Lines 560-634: Provider Level - Multiple Fields tests
// ADD NEW TESTS HERE (after line 634)
```

### Test Naming Convention

```
"selectDefaultFieldProps - [Layer] - [Specific Behavior]"

Examples:
- "selectDefaultFieldProps - Form Level - Expression-Based"
- "selectDefaultFieldProps - Form Level - Function Callbacks"
- "selectDefaultFieldProps - Form Level - Re-Evaluation"
- "selectDefaultFieldProps - Form Level - Priority Ordering"
```

### 8-Layer Priority Order (from merge.ts)

```typescript
// Priority order (LOWEST to HIGHEST):
// 1. providerDefaultFieldProps        ← Provider static defaults
// 2. providerSelectDefaultFieldProps  ← Provider dynamic defaults (layer 7)
// 3. formDefaultFieldProps            ← Form static defaults (layer 6)
// 4. formSelectDefaultFieldProps      ← Form dynamic defaults (layer 5) ← THIS TEST
// 5. inputProps                       ← Input config props (layer 4)
// 6. fieldConfigProps                 ← Field config props (layer 3)
// 7. selectProps                      ← Field dynamic props (layer 2)
// 8. componentProps                   ← Component JSX props (layer 1)
// 9. coreProps                        ← Core props (name, value, onChange) - ALWAYS WIN
```

### Expression Evaluation (from usePropsEvaluation.ts lines 208-224)

```typescript
// Form-level evaluation (layer 5 priority)
let formResult: Record<string, unknown> = {};
if (formDefaultFieldProps) {
  if (typeof formDefaultFieldProps === "function") {
    formResult =
      (formDefaultFieldProps(formState, methods) as Record<string, unknown>) ?? {};
  } else {
    const context = buildFieldContext(formState, fieldName);
    formResult =
      (evaluateDescriptor(formDefaultFieldProps, context) as Record<string, unknown>) ??
      {};
  }
}
```

### Key Test Patterns from Provider-Level Tests

1. **Expression Tests**: Verify expressions evaluate against form state
2. **Function Tests**: Verify function callbacks receive correct parameters
3. **Re-evaluation Tests**: Verify props update when dependencies change
4. **Priority Tests**: Verify form props override provider props
5. **Multiple Fields Tests**: Verify props apply to all fields

---

## Confidence Score

**10/10** for one-pass implementation success

**Rationale**:
- ✅ Comprehensive research completed with full understanding of codebase
- ✅ Exact file path, patterns, and validation commands provided
- ✅ Reference test patterns available from existing test file
- ✅ Test fixtures already defined (TestInput, TestSwitch, testInputs)
- ✅ Clear anti-patterns and gotchas documented
- ✅ All test scenarios defined with expected outcomes
- ✅ Validation commands verified to work in this codebase
- ✅ External research artifacts saved for reference
- ✅ Provider-level tests (P1.M1.T3.S1) completed successfully as reference

**This is a straightforward test creation task following well-established patterns in the existing test file. The provider-level tests provide a complete template to mirror for form-level tests.**
