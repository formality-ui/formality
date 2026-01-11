# PRP: P1.M1.T3.S1 - Test Provider-Level Evaluation

---

## Goal

**Feature Goal**: Create comprehensive tests for provider-level `selectDefaultFieldProps` evaluation in the `usePropsEvaluation` hook and Field component integration.

**Deliverable**: Test file at `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx` with provider-level evaluation tests covering expression evaluation, function callbacks, priority ordering, and async re-evaluation when dependencies change.

**Success Definition**:
- Provider-level expressions like `{ disabled: '!signed' }` evaluate correctly against form state
- Function callbacks receive `(formState, methods)` parameters
- Expression re-evaluates when dependencies change (useWatch triggers)
- Provider props have lower priority than form props (form overrides provider)
- Tests use `forwardRef` test components, `data-testid` selectors, and `waitFor` for async assertions
- All existing tests continue to pass

---

## User Persona

**Target User**: QA engineers and developers maintaining the formality codebase

**Use Case**: When implementing or modifying provider-level dynamic field props, tests verify that expressions evaluate correctly and maintain proper priority ordering

**User Journey**:
1. Developer adds provider-level `selectDefaultFieldProps` to `FormalityProvider`
2. Tests verify expressions evaluate against current form state
3. Tests verify re-evaluation when watched fields change
4. Tests verify priority order (form props override provider props)

**Pain Points Addressed**:
- **Current Gap**: No tests exist for provider-level `selectDefaultFieldProps` evaluation
- **Risk**: Untested functionality could regress or break silently
- **Validation Needed**: Verify the 8-layer priority order works correctly at provider level

---

## Why

### Business Value
- **Quality Assurance**: Ensures provider-level dynamic props work as designed
- **Regression Prevention**: Catches bugs before they reach production
- **Documentation**: Tests serve as executable documentation of expected behavior

### Integration with Existing Features
- Completes testing coverage for P1.M1.T1 (usePropsEvaluation hook)
- Validates integration from P1.M1.T2 (Field component consumes provider props)
- Tests the layer 7 priority in the 8-layer prop merging system

### Problems Solved
- **Untested Code**: Provider-level evaluation is implemented but has zero test coverage
- **Priority Verification**: Ensures provider props (layer 7) are correctly overridden by form props (layer 5)
- **Async Validation**: Verifies expression re-evaluation when form state changes

---

## What

Create a test file `selectDefaultFieldProps.test.tsx` that tests provider-level `selectDefaultFieldProps` evaluation through:

1. **Expression-based provider props**: `{ disabled: '!signed' }` evaluates to boolean
2. **Function callback provider props**: `(formState) => ({ variant: ... })` receives formState
3. **Re-evaluation on dependency change**: When watched field changes, provider props update
4. **Priority ordering**: Form-level props override provider-level props
5. **Multiple fields**: Provider props apply to all fields correctly

### Success Criteria

- [ ] Test file created at `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx`
- [ ] Provider-level expressions evaluate correctly (e.g., `'!signed'` → `true` when `signed=false`)
- [ ] Function callbacks receive `(formState, methods)` parameters
- [ ] Re-evaluation triggers when watched fields change
- [ ] Form props override provider props (priority order verified)
- [ ] All tests use `forwardRef` test components and `data-testid` selectors
- [ ] All tests use `waitFor` for async assertions
- [ ] All existing tests pass (no regressions)

---

## All Needed Context

### Context Completeness Check

*"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"*

**Answer**: YES - This PRP provides:
- Exact test file location and naming convention
- Complete test component fixtures with `forwardRef` pattern
- All import statements and type definitions needed
- Existing test patterns to follow (from `Field.test.tsx`)
- Validation commands verified to work in this codebase
- Specific test scenarios with expected outcomes

### Documentation & References

```yaml
# MUST READ - Test Pattern Reference Files

- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Contains existing test patterns for selectProps evaluation - follow these patterns
  pattern: Lines 230-290 show selectProps expression evaluation tests
  critical: Uses waitFor for async assertions, userEvent.setup() for interactions
  gotcha: Test components must use forwardRef for ref forwarding

- file: /home/dustin/projects/formality/packages/react/src/__tests__/FormalityProvider.test.tsx
  why: Shows how to test provider-level context and config
  pattern: Test consumer component pattern to verify context values
  critical: useConfigContext() to access provider config in tests

- file: /home/dustin/projects/formality/plan/docs/test_coverage.md
  why: Architecture document outlining test patterns and coverage gaps
  section: Lines 241-302 describe the selectDefaultFieldProps test gap
  critical: "Use forwardRef test components, data-testid selectors, waitFor for async"

# IMPLEMENTATION FILES (To Understand What We're Testing)

- file: /home/dustin/projects/formality/packages/react/src/hooks/usePropsEvaluation.ts
  why: The hook being tested - evaluates providerDefaultFieldProps
  section: Lines 188-206 evaluate providerDefaultFieldProps
  pattern: Function callbacks get (formState, methods), expressions use buildFieldContext

- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows how provider props are consumed in Field component
  section: Lines 289-295 call usePropsEvaluation with providerDefaultFieldProps
  critical: providerConfig.selectDefaultFieldProps is passed to hook

- file: /home/dustin/projects/formality/packages/react/src/components/FormalityProvider.tsx
  why: Defines the selectDefaultFieldProps prop we're testing
  section: Lines 129 show selectDefaultFieldProps in FormalityProviderProps interface
  pattern: Provider passes selectDefaultFieldProps through ConfigContext

- file: /home/dustin/projects/formality/packages/core/src/config/merge.ts
  why: Documents the 8-layer priority order we need to verify
  section: Lines 180-215 show mergeFieldProps with priority layers
  critical: "providerDefaultFieldProps (layer 1-2) < formDefaultFieldProps (layer 3-4)"

# EXTERNAL RESEARCH (In plan/bugfix/P1M1T3S1/research/)

- docfile: plan/bugfix/P1M1T3S1/research/react_testing_library_patterns.md
  why: Research on React Testing Library best practices for context providers
  section: "Testing Provider-Level Configurations" and "Using Render with Custom Wrapper"

- docfile: plan/bugfix/P1M1T3S1/research/userEvent_testing_patterns.md
  why: Research on userEvent for form interactions and async testing
  section: "Testing User Interactions (type, click, clear)" and "Async Testing Patterns"

- docfile: plan/bugfix/P1M1T3S1/research/async_expression_testing.md
  why: Research on testing async expression evaluation with waitFor
  section: "Using waitFor for Async State Changes" and "Testing Expressions That Evaluate Based on Form State"
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
        │   ├── Field.tsx                   # Consumes providerDefaultFieldProps
        │   ├── Form.tsx                    # Form component
        │   └── FormalityProvider.tsx       # Provider with selectDefaultFieldProps prop
        ├── hooks/
        │   └── usePropsEvaluation.ts        # Hook being tested
        ├── context/
        │   ├── ConfigContext.ts            # Provider context
        │   └── FormContext.ts              # Form context
        └── __tests__/
            ├── Field.test.tsx              # Reference test patterns
            ├── FormalityProvider.test.tsx  # Provider test patterns
            ├── Form.test.tsx               # Form test patterns
            └── selectDefaultFieldProps.test.tsx  # NEW FILE - Create this
```

### Desired Codebase Structure with Changes

```bash
# New test file to create:
packages/react/src/__tests__/selectDefaultFieldProps.test.tsx

# Test file contents:
├── Imports (vitest, testing-library, formality components)
├── Test Fixtures (TestInput, TestSwitch with forwardRef)
├── Test Suite 1: Expression-based provider props
│   ├── Test: Boolean expression evaluation
│   ├── Test: String expression evaluation
│   └── Test: Complex expression evaluation
├── Test Suite 2: Function callback provider props
│   ├── Test: Function receives formState parameter
│   └── Test: Function receives methods parameter
├── Test Suite 3: Re-evaluation on dependency change
│   ├── Test: Props update when watched field changes
│   └── Test: Multiple fields watching same dependency
├── Test Suite 4: Priority ordering
│   ├── Test: Form props override provider props
│   └── Test: Field props override both
└── Test Suite 5: Multiple fields
    └── Test: Provider props apply to all fields
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: Test components MUST use forwardRef pattern
// Field component uses React.forwardRef internally and passes ref to input
// Your test fixtures must match this pattern
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={props.name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}
    />
  )
);
TestInput.displayName = "TestInput";

// CRITICAL: Always use data-testid for selectors in tests
// This matches the pattern in existing tests (Field.test.tsx)
screen.getByTestId("fieldName")
screen.queryByTestId("fieldName")  // For testing absence

// CRITICAL: Always use waitFor for async assertions
// Expression evaluation happens after render cycle
await waitFor(() => {
  expect(screen.getByTestId("field")).toHaveAttribute("disabled", "");
});

// CRITICAL: Always use userEvent.setup() per test
// This creates a fresh userEvent instance for each test
const user = userEvent.setup();

// CRITICAL: All userEvent methods are async - always await
await user.type(screen.getByTestId("field"), "value");
await user.click(screen.getByTestId("button"));

// CRITICAL: Provider props have LOWER priority than form props
// Layer 7 (providerDefaultFieldProps) < Layer 5 (formDefaultFieldProps)
// When form provides selectDefaultFieldProps, it overrides provider

// CRITICAL: Expression evaluation uses jsep syntax
// Field references: 'fieldName' evaluates to field value
// Negation: '!fieldName' evaluates to NOT field value
// Comparison: 'fieldName === "value"' evaluates to boolean

// CRITICAL: Function callbacks receive (formState, methods)
// formState.fields contains field state proxies
// methods contains react-hook-form methods (getValues, setValue, etc.)

// CRITICAL: Re-evaluation happens via useWatch
// When a watched field changes, useWatch triggers re-render
// This causes usePropsEvaluation to re-evaluate expressions

// GOTCHA: Default values matter for expression evaluation
// If field has no default value, it's undefined in formState
// Use defaultValues or record to set initial state

// GOTCHA: FormalityProvider must wrap the entire test
// All tests must render: <FormalityProvider inputs={testInputs}>...</FormalityProvider>

// GOTCHA: Test inputs must be registered in provider inputs config
// const testInputs = { textField: { component: TestInput, defaultValue: "" } };
// <FormalityProvider inputs={testInputs}>...</FormalityProvider>

// GOTCHA: Form config must specify field types
// <Form config={{ fieldName: { type: "textField" } }}>...</Form>
```

---

## Implementation Blueprint

### Test Fixture Components

Create reusable test components that match the production Field component interface:

```typescript
// Test input component with forwardRef (REQUIRED PATTERN)
interface TestInputProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}
        data-testid={name}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        {...props}
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);

TestInput.displayName = "TestInput";

// Test switch/checkbox component
interface TestSwitchProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

const TestSwitch = forwardRef<HTMLInputElement, TestSwitchProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      data-testid={name}
      checked={value ?? false}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={disabled}
      {...props}
    />
  ),
);

TestSwitch.displayName = "TestSwitch";

// Test inputs config (REQUIRED for all tests)
const testInputs: Record<string, InputConfig> = {
  textField: { component: TestInput, defaultValue: "" },
  switch: { component: TestSwitch, defaultValue: false },
};
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE test file at packages/react/src/__tests__/selectDefaultFieldProps.test.tsx
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx
  - IMPORTS: vitest (describe, it, expect), @testing-library/react (render, screen, waitFor),
             @testing-library/user-event (userEvent), formality components
  - CREATE: Test fixture components (TestInput, TestSwitch with forwardRef)
  - CREATE: testInputs constant with InputConfig

Task 2: IMPLEMENT Expression-Based Provider Props Tests
  - TEST: "should evaluate provider-level boolean expression"
    - Provider: selectDefaultFieldProps={{ disabled: '!signed' }}
    - Form: config={{ signed: { type: 'switch' } }}
    - Assert: field is disabled when signed=false, enabled when signed=true
  - TEST: "should evaluate provider-level string expression"
    - Provider: selectDefaultFieldProps={{ placeholder: 'client' }}
    - Form: config={{ client: { type: 'textField' }, target: { type: 'textField' } }}
    - Assert: target placeholder equals client value
  - TEST: "should evaluate complex provider expression"
    - Provider: selectDefaultFieldProps={{ className: 'userType === "admin" ? "admin-field" : "user-field"' }}
    - Form: config={{ userType: { type: 'textField' }, field: { type: 'textField' } }}
    - Assert: className changes based on userType value

Task 3: IMPLEMENT Function Callback Provider Props Tests
  - TEST: "should call provider-level function with formState"
    - Provider: selectDefaultFieldProps={(formState) => ({ disabled: !formState.fields.signed?.value })}
    - Verify: formState.fields contains field states
  - TEST: "should call provider-level function with methods"
    - Provider: selectDefaultFieldProps={(formState, methods) => ({ ... })}
    - Verify: methods contains react-hook-form methods

Task 4: IMPLEMENT Re-Evaluation Tests
  - TEST: "should re-evaluate provider props when dependency changes"
    - Provider: selectDefaultFieldProps={{ disabled: '!signed' }}
    - Action: Toggle signed field
    - Assert: Disabled state updates after change (use waitFor)
  - TEST: "should re-evaluate for multiple fields watching same dependency"
    - Provider: selectDefaultFieldProps={{ disabled: '!signed' }}
    - Form: Multiple fields watching 'signed'
    - Action: Toggle signed
    - Assert: All fields update disabled state

Task 5: IMPLEMENT Priority Ordering Tests
  - TEST: "should prioritize form props over provider props"
    - Provider: selectDefaultFieldProps={{ size: 'small', disabled: true }}
    - Form: selectDefaultFieldProps={{ size: 'large' }}
    - Assert: size='large' (form overrides), disabled=true (provider default)
  - TEST: "should prioritize field props over both"
    - Provider: selectDefaultFieldProps={{ variant: 'filled' }}
    - Form: selectDefaultFieldProps={{ variant: 'outlined' }}
    - Field: selectProps={{ variant: 'standard' }}
    - Assert: variant='standard' (field wins)

Task 6: VALIDATE test file runs successfully
  - RUN: cd /home/dustin/projects/formality && pnpm -F @formality-ui/react test -- selectDefaultFieldProps.test.tsx
  - EXPECT: All new tests pass
  - VERIFY: No existing tests break

Task 7: RUN full test suite
  - RUN: cd /home/dustin/projects/formality && pnpm -F @formality-ui/react test
  - EXPECT: All tests pass (new + existing)
  - VERIFY: Test count increased correctly
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Basic Provider-Level Expression Test
// ============================================================================

describe("selectDefaultFieldProps - Provider Level", () => {
  it("should evaluate provider-level boolean expression", async () => {
    // ARRANGE: Provider with expression, Form with dependency field
    render(
      <FormalityProvider
        inputs={testInputs}
        selectDefaultFieldProps={{ disabled: "!signed" }}
      >
        <Form config={{ signed: { type: "switch" }, target: { type: "textField" } }}>
          <Field name="signed" />
          <Field name="target" />
        </Form>
      </FormalityProvider>
    );

    // ASSERT: Initial state - signed=false, so !signed=true → disabled
    expect(screen.getByTestId("target")).toBeDisabled();

    // ACT: Toggle signed to true
    const user = userEvent.setup();
    await user.click(screen.getByTestId("signed"));

    // ASSERT: signed=true, so !signed=false → enabled
    await waitFor(() => {
      expect(screen.getByTestId("target")).not.toBeDisabled();
    });
  });
});

// ============================================================================
// PATTERN 2: String Expression Test
// ============================================================================

it("should evaluate provider-level string expression", async () => {
  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{ placeholder: "client" }}
    >
      <Form config={{
        client: { type: "textField" },
        contact: { type: "textField" }
      }}>
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
    expect(screen.getByTestId("contact")).toHaveAttribute(
      "placeholder",
      "Acme Corp"
    );
  });
});

// ============================================================================
// PATTERN 3: Function Callback Test
// ============================================================================

it("should call provider-level function with formState", () => {
  let capturedFormState: FormState | undefined;

  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={(formState, methods) => {
        capturedFormState = formState;
        return { disabled: !formState.fields.signed?.value };
      }}
    >
      <Form config={{ signed: { type: "switch" }, target: { type: "textField" } }}>
        <Field name="signed" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: Function was called with formState
  expect(capturedFormState).toBeDefined();
  expect(capturedFormState?.fields).toHaveProperty("signed");
});

// ============================================================================
// PATTERN 4: Priority Ordering Test
// ============================================================================

it("should prioritize form props over provider props", () => {
  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{ size: "small", disabled: true }}
    >
      <Form
        config={{ field: { type: "textField" } }}
        formConfig={{ selectDefaultFieldProps: { size: "large" } }}
      >
        <Field name="field" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: Form size overrides provider size
  // Provider disabled applies because form doesn't override it
  const field = screen.getByTestId("field");
  expect(field).toHaveAttribute("size", "large"); // Form wins
  expect(field).toBeDisabled(); // Provider default applies
});

// ============================================================================
// PATTERN 5: Multiple Fields Test
// ============================================================================

it("should apply provider props to all fields", async () => {
  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{ disabled: "!signed" }}
    >
      <Form config={{
        signed: { type: "switch" },
        field1: { type: "textField" },
        field2: { type: "textField" },
        field3: { type: "textField" },
      }}>
        <Field name="signed" />
        <Field name="field1" />
        <Field name="field2" />
        <Field name="field3" />
      </Form>
    </FormalityProvider>
  );

  // ASSERT: All fields disabled initially (signed=false)
  expect(screen.getByTestId("field1")).toBeDisabled();
  expect(screen.getByTestId("field2")).toBeDisabled();
  expect(screen.getByTestId("field3")).toBeDisabled();

  // ACT: Toggle signed
  const user = userEvent.setup();
  await user.click(screen.getByTestId("signed"));

  // ASSERT: All fields enabled (signed=true)
  await waitFor(() => {
    expect(screen.getByTestId("field1")).not.toBeDisabled();
    expect(screen.getByTestId("field2")).not.toBeDisabled();
    expect(screen.getByTestId("field3")).not.toBeDisabled();
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
  - Use real FormalityProvider and Form components (not mocked)
  - Use real Field component (integration testing)
  - Only mock the input components (TestInput, TestSwitch)
  - This provides true integration testing of the feature

FILES CREATED:
  - packages/react/src/__tests__/selectDefaultFieldProps.test.tsx (NEW)

FILES REFERENCED (NOT MODIFIED):
  - packages/react/src/hooks/usePropsEvaluation.ts (code under test)
  - packages/react/src/components/Field.tsx (integration point)
  - packages/react/src/components/FormalityProvider.tsx (integration point)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating the test file, run type checking
cd /home/dustin/projects/formality
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors in new test file
# Common errors to watch for:
# - "Property 'forwardRef' does not exist on 'React'" → import { forwardRef } from "react"
# - "Cannot find name 'describe'" → import from vitest
# - "Type 'X' is not assignable to type 'SelectValue'" → Check expression syntax

# Check imports are correct
grep -E "import.*from" packages/react/src/__tests__/selectDefaultFieldProps.test.tsx

# Expected imports:
# - vitest: describe, it, expect
# - @testing-library/react: render, screen, waitFor
# - @testing-library/user-event: userEvent
# - react: React, forwardRef
# - @formality-ui/react: FormalityProvider, Form, Field
# - @formality-ui/core: InputConfig, type FormFieldsConfig
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run only the new test file
pnpm -F @formality-ui/react test -- selectDefaultFieldProps.test.tsx

# Expected: All new tests pass
# Watch output for:
# - ✓ should evaluate provider-level boolean expression
# - ✓ should evaluate provider-level string expression
# - ✓ should call provider-level function with formState
# - ✓ should re-evaluate provider props when dependency changes
# - ✓ should prioritize form props over provider props
# - ✓ should apply provider props to all fields

# Run with coverage
pnpm -F @formality-ui/react test -- selectDefaultFieldProps.test.tsx --coverage

# Expected: New code paths are covered
# - usePropsEvaluation lines 188-206 (provider evaluation)
# - Field component lines 289-295 (hook call with provider props)
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
# Create a demo test file to manually verify behavior
cat > /tmp/test-provider-props.tsx << 'EOF'
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormalityProvider, Form, Field } from '@formality-ui/react';
import { forwardRef } from 'react';

const TestInput = forwardRef(({ value, onChange, disabled, name, ...props }, ref) => (
  <input
    ref={ref}
    data-testid={name}
    value={value ?? ''}
    onChange={(e) => onChange?.(e.target.value)}
    disabled={disabled}
    {...props}
  />
));
TestInput.displayName = "TestInput";

const testInputs = {
  textField: { component: TestInput, defaultValue: '' },
  switch: { component: TestInput, defaultValue: false },
};

async function test() {
  render(
    <FormalityProvider
      inputs={testInputs}
      selectDefaultFieldProps={{ disabled: '!signed' }}
    >
      <Form config={{ signed: { type: 'switch' }, target: { type: 'textField' } }}>
        <Field name="signed" />
        <Field name="target" />
      </Form>
    </FormalityProvider>
  );

  console.log('Initial disabled:', screen.getByTestId('target').disabled);

  const user = userEvent.setup();
  await user.click(screen.getByTestId('signed'));

  // Wait for update
  await new Promise(r => setTimeout(r, 100));
  console.log('After toggle disabled:', screen.getByTestId('target').disabled);
}

test().catch(console.error);
EOF

# Run with tsx or ts-node to verify manually (if available)
# npx tsx /tmp/test-provider-props.tsx
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Test file created at correct path: `packages/react/src/__tests__/selectDefaultFieldProps.test.tsx`
- [ ] TypeScript compiles without errors: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] All new tests pass: `pnpm -F @formality-ui/react test -- selectDefaultFieldProps.test.tsx`
- [ ] All existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] No new linting errors introduced
- [ ] Test count increased by expected number

### Feature Validation

- [ ] Provider-level boolean expressions evaluate correctly (`!signed` → boolean)
- [ ] Provider-level string expressions evaluate correctly (`client` → string value)
- [ ] Provider-level function callbacks receive `(formState, methods)` parameters
- [ ] Provider props re-evaluate when watched fields change
- [ ] Multiple fields receive provider props correctly
- [ ] Form props override provider props (priority order verified)
- [ ] Field props override both form and provider props

### Code Quality Validation

- [ ] All test components use `forwardRef` pattern
- [ ] All selectors use `data-testid` attributes
- [ ] All async assertions use `waitFor`
- [ ] All user interactions use `userEvent.setup()`
- [ ] Test names are descriptive and follow convention: "should..."
- [ ] Tests follow existing patterns from `Field.test.tsx`
- [ ] No implementation details tested (only behavior)

### Test Coverage Validation

- [ ] `usePropsEvaluation` provider evaluation path covered (lines 188-206)
- [ ] `Field` component provider prop consumption covered (lines 289-295)
- [ ] `FormalityProvider` `selectDefaultFieldProps` prop covered
- [ ] Expression evaluation with `buildFieldContext` covered
- [ ] Function callback evaluation covered
- [ ] Re-evaluation via `useWatch` covered

### Dependencies & Handoff

- [ ] P1.M1.T1 (usePropsEvaluation hook) complete
- [ ] P1.M1.T2 (Field integration) complete
- [ ] Ready for P1.M1.T3.S2 (form-level evaluation tests)
- [ ] Ready for P1.M1.T3.S3 (8-layer priority tests)
- [ ] Ready for P1.M1.T3.S4 (complex expression tests)

---

## Anti-Patterns to Avoid

- ❌ **Don't forget forwardRef on test components** - Field component passes ref to input
- ❌ **Don't use getByText for inputs** - Use `data-testid` selectors instead
- ❌ **Don't skip waitFor for async updates** - Expression evaluation happens after render
- ❌ **Don't use fireEvent instead of userEvent** - userEvent provides realistic interaction
- ❌ **Don't forget to await userEvent methods** - All userEvent methods return promises
- ❌ **Don't use queryByTestId for presence assertions** - Use `getByTestId` for elements that should exist
- ❌ **Don't test implementation details** - Test behavior, not internal state
- ❌ **Don't mock FormalityProvider or Form** - Use real components for integration tests
- ❌ **Don't create test files in wrong location** - Must be in `__tests__` directory
- ❌ **Don't forget displayName on forwardRef components** - Required for React DevTools

---

## Related Work Items

### Prerequisites (Must be Complete)
- **P1.M1.T1.S1**: Hook parameters added to interface ✅
- **P1.M1.T1.S2**: Form-level evaluation implemented ✅
- **P1.M1.T1.S3**: Provider-level evaluation implemented ✅
- **P1.M1.T1.S4**: TypeScript exports added ✅
- **P1.M1.T2.S1**: Field consumes evaluated props ✅
- **P1.M1.T2.S2**: Props passed to mergeFieldProps ✅

### This Task Enables
- **P1.M1.T3.S2**: Form-level evaluation tests (will build on this test file)
- **P1.M1.T3.S3**: 8-layer priority order tests (will verify complete chain)
- **P1.M1.T3.S4**: Complex expression tests (will add edge case coverage)

### Blocked By
- **P1.M1.T1**: All subtasks (S1-S4) must be complete ✅
- **P1.M1.T2**: All subtasks (S1-S2) must be complete ✅

---

## Research Findings Summary

### Test Framework Configuration

**Vitest Setup** (from `vitest.config.ts`):
- Test environment: `jsdom`
- Test files: `src/**/*.test.{ts,tsx}`
- Setup file: `src/__tests__/setup.ts`
- Coverage: `c8` provider

**Test Count Reference**:
- @formality-ui/react: ~184 tests (before this task)
- @formality-ui/core: ~145 tests
- Total: ~329 tests

### Existing Test Patterns (from Field.test.tsx)

**Pattern 1: SelectProps Expression Evaluation** (lines 230-290)
```typescript
it("should update selectProps when referenced field changes", async () => {
  const config: FormFieldsConfig = {
    source: { type: "textField" },
    target: { type: "textField", selectProps: { placeholder: "source" } },
  };

  render(<FormalityProvider inputs={testInputs}><Form config={config}>...</Form></FormalityProvider>);

  const user = userEvent.setup();
  await user.clear(screen.getByTestId("source"));
  await user.type(screen.getByTestId("source"), "Updated");

  await waitFor(() => {
    expect(screen.getByTestId("target")).toHaveAttribute("placeholder", "Updated");
  });
});
```

**Pattern 2: forwardRef Test Component** (lines 12-39)
```typescript
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => (
    <div>
      {label && <label data-testid={`${name}-label`}>{label}</label>}
      <input
        ref={ref}
        data-testid={name}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        {...props}
      />
      {error && <span data-testid={`${name}-error`}>{error}</span>}
    </div>
  ),
);
TestInput.displayName = "TestInput";
```

### 8-Layer Priority Order (from merge.ts lines 180-215)

```typescript
// Priority order (LOWEST to HIGHEST):
// 1. providerDefaultFieldProps        ← Provider static defaults
// 2. providerSelectDefaultFieldProps  ← Provider dynamic defaults (THIS TEST)
// 3. formDefaultFieldProps            ← Form static defaults
// 4. formSelectDefaultFieldProps      ← Form dynamic defaults
// 5. inputProps                       ← Input config props
// 6. fieldConfigProps                 ← Field config props
// 7. selectProps                      ← Field dynamic props
// 8. componentProps                   ← Component JSX props
// 9. coreProps                        ← Core props (name, value, onChange) - ALWAYS WIN
```

### Expression Evaluation (from usePropsEvaluation.ts lines 188-206)

```typescript
// Provider-level evaluation (layer 7 priority)
let providerResult: Record<string, unknown> = {};
if (providerDefaultFieldProps) {
  if (typeof providerDefaultFieldProps === "function") {
    providerResult =
      (providerDefaultFieldProps(formState, methods) as Record<string, unknown>) ??
      {};
  } else {
    const context = buildFieldContext(formState, fieldName);
    providerResult =
      (evaluateDescriptor(providerDefaultFieldProps, context) as Record<string, unknown>) ??
      {};
  }
}
```

### Test Coverage Gap (from test_coverage.md lines 241-302)

**Status**: ❌ **CRITICAL GAP** - NO TESTS EXIST for `selectDefaultFieldProps`

**What's Missing**:
1. Tests for provider-level `selectDefaultFieldProps` evaluation
2. Tests for form-level `selectDefaultFieldProps` evaluation
3. Tests for proper merging of evaluated default props
4. Tests for priority order (default props < field props)

**Why This Matters**:
- Feature is completely untested
- No test coverage to validate fix
- Risk of regression after implementation

---

## Confidence Score

**10/10** for one-pass implementation success

**Rationale**:
- ✅ Comprehensive research completed with full understanding of codebase
- ✅ Exact file path, patterns, and validation commands provided
- ✅ Reference test patterns available from existing test files
- ✅ Clear anti-patterns and gotchas documented
- ✅ Test fixture components fully specified
- ✅ All test scenarios defined with expected outcomes
- ✅ Validation commands verified to work in this codebase
- ✅ External research artifacts saved for reference

**This is a straightforward test creation task following well-established patterns in the codebase.**
