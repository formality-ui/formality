# PRP: Test Disabled from Config

**Work Item**: P2.M1.T3.S2 - Test disabled from config
**Parent Task**: P2.M1.T3 - Add Tests for Disabled Property
**Parent Milestone**: P2.M1 - Disabled Property in Field States
**Priority**: P2 (Major Issue)
**Story Points**: 2

---

## Goal

**Feature Goal**: Create comprehensive integration tests that verify field config `disabled` property has the second-highest priority, overriding conditions and group state, but being overridden by JSX prop.

**Deliverable**:

1. Integration tests in `Field.test.tsx` for config disabled priority
2. Test cases verifying config.disabled overrides conditions
3. Test cases verifying config.disabled overrides group state
4. Test cases verifying JSX prop overrides config.disabled
5. Test cases for dynamic config changes via Form changeField
6. DOM verification tests using `@testing-library/jest-dom` matchers

**Success Definition**:

- Config `disabled: true` overrides conditions `disabled: false` and group state
- Config `disabled: false` overrides conditions `disabled: true` and group state
- JSX `disabled={true}` prop overrides config `disabled: false`
- JSX `disabled={false}` prop overrides config `disabled: true`
- Dynamic config changes via changeField update disabled state
- Input element has correct `disabled` attribute in DOM
- All tests pass: `pnpm test --filter @formality-ui/react Field.test.tsx`

---

## User Persona (if applicable)

**Target User**: Developers using Formality UI form library

**Use Case**: Developers need to configure disabled state at the field config level, with predictable priority: JSX prop can override config, but config overrides conditions and group state.

**User Journey**:

1. Developer has field with conditions that would enable/disable
2. Developer sets `disabled: true` in field config
3. Field is rendered as disabled, conditions are overridden
4. Developer can still override with JSX `disabled={false}` prop
5. Developer can dynamically change config via changeField

**Pain Points Addressed**:

- Config-level disabled provides declarative control
- Priority must be predictable and documented
- No existing tests verify config vs conditions priority
- No existing tests verify config vs group state priority
- No existing tests verify JSX prop vs config priority

---

## Why

- **Contract Definition**: Config is documented as having second-highest priority but lacks comprehensive integration testing
- **Test Coverage Gap**: `useFieldDisabledState.test.tsx` tests config priority in isolation (lines 89-116), but `Field.test.tsx` has NO tests for config.disabled
- **Integration Testing**: Hook tests don't catch integration bugs between config resolution and Field component
- **DOM Verification**: Hook tests don't verify actual DOM state
- **Real-World Scenario**: Config-level disabled is the primary way developers declaratively set disabled state
- **Previous Work**: P2.M1.T3.S1 tested JSX prop priority, now we need to test config priority

---

## What

Create comprehensive integration tests for config disabled priority in the Field component.

### Current State

**Existing Tests (Insufficient)**:

1. `useFieldDisabledState.test.tsx` (hook tests):
   - Tests config priority over conditions (lines 89-102)
   - Tests config priority over group (lines 104-116)
   - **Limitation**: Uses `renderHook`, doesn't test Field component integration
   - **Limitation**: No DOM verification

2. `Field.test.tsx` (component tests):
   - Tests disabled prop over conditions (lines 429-450)
   - Tests disabled prop to force disable (lines 452-467)
   - **NO tests for config.disabled at all**

### Test Scenarios to Add

**Scenario 1: Config disabled={true} overrides conditions with disabled={false}**

```typescript
// Given: Field with config disabled: true, conditions disabled: false
const config = {
  field: {
    type: "textField",
    disabled: true,  // Config says disabled
    conditions: [
      { when: "other", is: "value", disabled: false }  // Condition says enabled
    ],
  },
};

// When: Render field (no JSX prop)
<Field name="field" />

// Then: Field should be disabled (config wins)
expect(screen.getByTestId("field")).toBeDisabled();
```

**Scenario 2: Config disabled={false} overrides conditions with disabled={true}**

```typescript
// Given: Field with config disabled: false, conditions disabled: true
const config = {
  field: {
    type: "textField",
    disabled: false,  // Config says enabled
    conditions: [
      { when: "other", is: "value", disabled: true }  // Condition says disabled
    ],
  },
};

// When: Render field (no JSX prop)
<Field name="field" />

// Then: Field should be enabled (config wins)
expect(screen.getByTestId("field")).not.toBeDisabled();
```

**Scenario 3: JSX disabled={true} overrides config disabled={false}**

```typescript
// Given: Field with config disabled: false
const config = {
  field: {
    type: "textField",
    disabled: false,  // Config says enabled
  },
};

// When: Render field with JSX disabled={true} prop
<Field name="field" disabled={true} />

// Then: Field should be disabled (JSX wins)
expect(screen.getByTestId("field")).toBeDisabled();
```

**Scenario 4: JSX disabled={false} overrides config disabled={true}**

```typescript
// Given: Field with config disabled: true
const config = {
  field: {
    type: "textField",
    disabled: true,  // Config says disabled
  },
};

// When: Render field with JSX disabled={false} prop
<Field name="field" disabled={false} />

// Then: Field should be enabled (JSX wins)
expect(screen.getByTestId("field")).not.toBeDisabled();
```

**Scenario 5: All sources active - JSX > config > conditions > group**

```typescript
// Given: Field with all sources: JSX, config, conditions, group
const config = {
  field: {
    type: "textField",
    disabled: true,  // Config: disabled
    conditions: [{ when: "other", is: "x", disabled: false }],  // Conditions: enabled
  },
};

// Test: JSX={false} should override config=true and conditions=false
<Field name="field" disabled={false} />
// Result: enabled

// Test: Remove JSX, config=true should override conditions=false
<Field name="field" />
// Result: disabled
```

**Scenario 6: Dynamic config change via changeField**

```typescript
// Given: Field initially disabled: false
// When: Call changeField to set disabled: true
// Then: Field should become disabled
```

### Success Criteria

- [ ] Test for config `disabled={true}` overriding conditions `disabled={false}`
- [ ] Test for config `disabled={false}` overriding conditions `disabled={true}`
- [ ] Test for config `disabled={true}` overriding group state
- [ ] Test for JSX `disabled={true}` overriding config `disabled={false}`
- [ ] Test for JSX `disabled={false}` overriding config `disabled={true}`
- [ ] Test for all sources active (JSX > config > conditions > group)
- [ ] Test for dynamic config changes via changeField
- [ ] All tests use Field component (not hook in isolation)
- [ ] All tests pass: `pnpm test --filter @formality-ui/react Field.test.tsx`

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:

- Exact file location for tests (`Field.test.tsx`)
- Complete test patterns from existing tests
- Priority order: prop > config > conditions > group > false
- Specific test scenarios with code examples
- Validation commands specific to this project
- Known gotchas and anti-patterns to avoid

### Documentation & References

```yaml
# MUST READ - Test patterns and existing tests

# TARGET FILE - Add tests here
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Main test file for Field component - add config disabled priority tests
  exact: Add new describe block after P2.M1.T3.S1 tests (after JSX disabled prop tests)
  pattern: Follow existing test structure with describe/it blocks
  gotcha: Use `data-testid` for element selection, not CSS selectors

# EXISTING TESTS TO REFERENCE - JSX prop tests
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Existing disabled prop tests (lines 429-467) - follow this pattern
  exact: Lines 429-467 ("disabled prop override" describe block)
  pattern: Render Field with config, verify disabled state with toBeDisabled()
  critical: Tests JSX prop over conditions only, missing config tests

# EXISTING TESTS TO REFERENCE - Condition tests
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Existing condition tests (lines 156-228) - follow this pattern
  exact: Lines 156-228 ("conditions" describe block)
  pattern: Config with conditions array, record prop to set values
  critical: Shows how to set up conditions with record prop

# HOOK TESTS - For reference (do NOT copy - wrong approach)
- file: /home/dustin/projects/formality/packages/react/src/__tests__/useFieldDisabledState.test.tsx
  why: Shows config priority logic - use for understanding, NOT for patterns
  exact: Lines 89-116 (config priority tests)
  pattern: Uses renderHook - DO NOT USE THIS for integration tests
  critical: Integration tests must use Field component, not renderHook

# FIELD COMPONENT - Understanding disabled resolution
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows how disabled flows through Field component
  exact: Lines 265-278 (isDisabled resolution logic)
  pattern: Priority order: prop > config > condition > group > false
  critical: Config (fieldConfig.disabled) is checked SECOND, after JSX prop

# HOOK IMPLEMENTATION - Understanding config priority
- file: /home/dustin/projects/formality/packages/react/src/hooks/useFieldDisabledState.ts
  why: Hook that implements disabled priority logic
  exact: Lines 82-86 (baseDisabled resolution), Lines 177-196 (final resolution)
  pattern: useMemo with dependency array for performance
  critical: Config is resolved in baseDisabled, then conditions, then group

# PREVIOUS WORK - JSX prop tests (P2.M1.T3.S1)
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T3S1/PRP.md
  why: Previous PRP that tested JSX prop priority
  contract: Assumes JSX prop tests exist and pass
  critical: Config tests should be in separate describe block after JSX tests

# TEST SETUP - Configuration
- file: /home/dustin/projects/formality/packages/react/src/__tests__/setup.ts
  why: Test setup file with @testing-library/jest-dom configuration
  action: NO CHANGE - just for reference
  critical: Automatically imports custom matchers like toBeDisabled()

# TEST INPUT PATTERN - Reusable test components
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: TestInput component pattern to follow
  exact: Lines 12-39 (TestInput component definition)
  pattern: forwardRef with disabled prop, data-testid attribute
  critical: Must use forwardRef for Field components

# TESTING LIBRARY DOCUMENTATION
- url: https://testing-library.com/docs/react-testing-library/intro/
  why: React Testing Library best practices
  section: Queries (getByTestId, etc.)

- url: https://github.com/testing-library/jest-dom#tobedisabled
  why: Custom matcher for disabled state
  section: toBeDisabled() / not.toBeDisabled()
```

### Current Codebase tree (react package tests)

```bash
packages/react/src/
├── __tests__/
│   ├── setup.ts                    # Test configuration (jsdom, jest-dom)
│   ├── Field.test.tsx              # ← TARGET: Add config disabled tests here
│   ├── useFieldDisabledState.test.tsx  # Hook tests (for reference, not modification)
│   ├── Form.test.tsx               # Form component tests
│   └── [other test files]
├── components/
│   ├── Field.tsx                   # Field component with disabled resolution (lines 265-278)
│   └── [other components]
└── hooks/
    └── useFieldDisabledState.ts    # Hook implementing priority logic
```

### Desired Codebase tree with tests to be added

```bash
packages/react/src/__tests__/
├── Field.test.tsx                  # ← MODIFY: Add new test describe block
│   ├── [existing tests]
│   ├── describe("JSX disabled prop highest priority - ALL sources active")  # From P2.M1.T3.S1
│   └── describe("Config disabled priority - second highest after JSX prop")  # ← ADD THIS
│       ├── it("should disable when config={true} overrides conditions={false}")
│       ├── it("should enable when config={false} overrides conditions={true}")
│       ├── it("should disable when config={true} overrides group state")
│       ├── it("should prioritize JSX={true} over config={false}")
│       ├── it("should prioritize JSX={false} over config={true}")
│       └── it("should handle all sources: JSX > config > conditions > group")
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Use Field component, NOT renderHook
// renderHook tests the hook in isolation
// We need integration tests with full Field component rendering
// WRONG: renderHook(() => useFieldDisabledState(...))
// RIGHT: render(<Form><Field name="field" /></Form>)

// CRITICAL: Test components MUST use forwardRef
// Field components require forwardRef for react-hook-form integration
// Pattern: forwardRef<HTMLInputElement, Props>(({ value, onChange, disabled, ... }, ref) => ...)

// CRITICAL: Use data-testid for element selection
// Pattern: <input data-testid={name} />
// Query: screen.getByTestId("field")
// DO NOT use CSS selectors like screen.getByRole("input")

// GOTCHA: Condition evaluation depends on field values
// Condition { when: "other", is: "value", disabled: true } only matches when other field = "value"
// Must include other field in config and set its value via record prop

// GOTCHA: toBeDisabled() checks actual DOM attribute
// @testing-library/jest-dom toBeDisabled() checks <input disabled> attribute
// This is the correct way to test disabled state

// CRITICAL: Priority order in Field.tsx (lines 265-278)
// 1. JSX prop (disabledProp) - checked FIRST
// 2. Field config (fieldConfig.disabled) - checked SECOND ← TARGET OF THIS PRP
// 3. Conditions (conditionResult.disabled) - checked THIRD
// 4. Group state (groupContext.state.isDisabled) - checked FOURTH
// 5. Default: false

// GOTCHA: Config priority means config overrides conditions AND group
// Config disabled=true means field is disabled, regardless of conditions or group
// Config disabled=false means field is enabled, regardless of conditions or group
// ONLY JSX prop can override config

// GOTCHA: Test file location
// Add tests to Field.test.tsx, NOT useFieldDisabledState.test.tsx
// We need Field component integration tests

// CRITICAL: Run specific test file during development
// Command: pnpm test --filter @formality-ui/react Field.test.tsx
// This runs only Field tests, faster feedback during development

// GOTCHA: changeField for dynamic config testing
// changeField allows modifying field config at runtime
// Available in Form context: methods.changeField(name, newConfig)
```

---

## Implementation Blueprint

### Data models and structure

**No new data models needed** - this PRP is purely testing existing functionality.

**Test Data Structure**:

```typescript
// Form config with config disabled
const config: FormFieldsConfig = {
  // Other field for condition evaluation
  otherField: { type: "textField" },

  // Target field with config disabled
  field: {
    type: "textField",
    disabled: boolean,  // Config disabled (second highest priority)
    conditions: [
      {
        when: "otherField",
        is: "value",
        disabled: boolean,  // Condition disabled (third priority)
      },
    ],
  },
};

// JSX prop (highest priority - optional)
<Field name="field" disabled={boolean} />
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing Field.test.tsx test file
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - READ: Lines 1-610 (entire file)
  - UNDERSTAND: Test structure, TestInput component, test patterns
  - IDENTIFY: Where to add new tests (after P2.M1.T3.S1 JSX prop tests)
  - PATTERN: Follow existing describe/it structure
  - OUTPUT: Understanding of test file structure

Task 2: ANALYZE existing condition tests
  - READ: Lines 156-228 ("conditions" describe block)
  - UNDERSTAND: How conditions are set up with record prop
  - IDENTIFY: Pattern for setting up conditions
  - PATTERN: config with conditions array, record prop to match condition
  - OUTPUT: Pattern to follow for condition setup

Task 3: ADD new describe block for config disabled priority
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - LOCATION: After P2.M1.T3.S1 describe block (JSX disabled prop tests)
  - ADD: describe("Config disabled priority - second highest after JSX prop", () => { ... })
  - PATTERN: Follow existing describe block structure
  - PLACEMENT: After JSX tests, before other tests

Task 4: IMPLEMENT test - config disabled={true} overrides conditions
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should disable when config={true} overrides conditions={false}", () => { ... })
  - CONFIG: field with disabled: true, conditions with disabled: false
  - RECORD: Set otherField to match condition
  - JSX: <Field name="field" /> (no disabled prop)
  - VERIFY: expect(screen.getByTestId("field")).toBeDisabled()
  - PATTERN: |
    it("should disable when config={true} overrides conditions={false}", () => {
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: true,  // Config says disabled
          conditions: [
            { when: "otherField", is: "match", disabled: false },  // Condition says enabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" />  {/* No JSX prop, config controls disabled */}
          </Form>
        </FormalityProvider>,
      );

      // Config (true) should override conditions (false)
      expect(screen.getByTestId("field")).toBeDisabled();
    });

Task 5: IMPLEMENT test - config disabled={false} overrides conditions
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should enable when config={false} overrides conditions={true}", () => { ... })
  - CONFIG: field with disabled: false, conditions with disabled: true
  - RECORD: Set otherField to match condition
  - JSX: <Field name="field" /> (no disabled prop)
  - VERIFY: expect(screen.getByTestId("field")).not.toBeDisabled()
  - PATTERN: Similar to Task 4, but inverted boolean values

Task 6: IMPLEMENT test - config disabled={true} overrides group
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should disable when config={true} overrides group disabled state", () => { ... })
  - USE: FieldGroup with disabled state (if available) or simulate group context
  - CONFIG: field with disabled: true
  - VERIFY: expect(screen.getByTestId("field")).toBeDisabled()
  - NOTE: May need to check if FieldGroup.disabled exists or skip if not implemented
  - PATTERN: |
    // Note: Only implement if FieldGroup supports disabled state
    // Otherwise, this test can be deferred to P2.M2 (Multi-Field isDisabled Conditions)

Task 7: IMPLEMENT test - JSX disabled={true} overrides config disabled={false}
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should prioritize JSX disabled={true} over config disabled={false}", () => { ... })
  - CONFIG: field with disabled: false
  - JSX: <Field name="field" disabled={true} />
  - VERIFY: expect(screen.getByTestId("field")).toBeDisabled()
  - PATTERN: |
    it("should prioritize JSX disabled={true} over config disabled={false}", () => {
      const config: FormFieldsConfig = {
        field: {
          type: "textField",
          disabled: false,  // Config says enabled
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="field" disabled={true} />  {/* JSX forces disabled */}
          </Form>
        </FormalityProvider>,
      );

      // JSX prop (true) should override config (false)
      expect(screen.getByTestId("field")).toBeDisabled();
    });

Task 8: IMPLEMENT test - JSX disabled={false} overrides config disabled={true}
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should prioritize JSX disabled={false} over config disabled={true}", () => { ... })
  - CONFIG: field with disabled: true
  - JSX: <Field name="field" disabled={false} />
  - VERIFY: expect(screen.getByTestId("field")).not.toBeDisabled()
  - PATTERN: Similar to Task 7, but inverted boolean values

Task 9: IMPLEMENT test - All sources active (JSX > config > conditions)
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should handle all sources: JSX > config > conditions > group", () => { ... })
  - CONFIG: field with disabled: true, conditions with disabled: false
  - JSX: Test both disabled={true} and disabled={false}
  - VERIFY: Correct priority at each level
  - PATTERN: |
    it("should handle all sources: JSX > config > conditions", () => {
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: true,  // Config: disabled
          conditions: [
            { when: "otherField", is: "x", disabled: false },  // Conditions: enabled
          ],
        },
      };

      // Test 1: JSX={false} overrides everything
      const { rerender } = render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "x" }}>
            <Field name="otherField" />
            <Field name="field" disabled={false} />
          </Form>
        </FormalityProvider>,
      );
      expect(screen.getByTestId("field")).not.toBeDisabled();

      // Test 2: No JSX prop, config overrides conditions
      rerender(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "x" }}>
            <Field name="otherField" />
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );
      expect(screen.getByTestId("field")).toBeDisabled();
    });

Task 10: RUN tests to verify implementation
  - COMMAND: pnpm test --filter @formality-ui/react Field.test.tsx
  - VERIFY: All new tests pass
  - VERIFY: All existing tests still pass (no regressions)
  - EXPECTED: Zero failures
  - IF_FAILURES: Read output and fix implementation
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Test structure for config disabled priority
// ============================================================================

describe("Config disabled priority - second highest after JSX prop", () => {
  // Test 1: config true overrides conditions false
  // Test 2: config false overrides conditions true
  // Test 3: config true overrides group (if available)
  // Test 4: JSX true overrides config false
  // Test 5: JSX false overrides config true
  // Test 6: All sources active
});

// ============================================================================
// PATTERN: Config with conditions
// ============================================================================

const config: FormFieldsConfig = {
  // Other field for condition evaluation
  otherField: { type: "textField" },

  // Target field with config disabled
  field: {
    type: "textField",
    disabled: boolean,  // Config level (second highest priority)
    conditions: [
      {
        when: "otherField",
        is: "value",
        disabled: boolean,  // Condition level (third priority)
      },
    ],
  },
};

// ============================================================================
// PATTERN: Render Field with config disabled
// ============================================================================

render(
  <FormalityProvider inputs={testInputs}>
    <Form config={config} record={{ otherField: "value" }}>
      <Field name="otherField" />  {/* For condition evaluation */}
      <Field name="field" />  {/* Config disabled applies */}
    </Form>
  </FormalityProvider>,
);

// ============================================================================
// PATTERN: Verify disabled state
// ============================================================================

// Field is disabled
expect(screen.getByTestId("field")).toBeDisabled();

// Field is enabled
expect(screen.getByTestId("field")).not.toBeDisabled();

// ============================================================================
// PATTERN: JSX prop overrides config
// ============================================================================

render(
  <FormalityProvider inputs={testInputs}>
    <Form config={config}>
      <Field name="field" disabled={boolean} />  {/* JSX overrides config */}
    </Form>
  </FormalityProvider>,
);

// ============================================================================
// CRITICAL: Priority order verification
// ============================================================================

// Priority: JSX prop > config > conditions > group > false

// When JSX prop is set, it always wins (highest priority)
<Field name="field" disabled={true} />  // Disabled, regardless of config/conditions

// When JSX prop is undefined, config wins (second highest)
<Field name="field" />  // Uses config.disabled

// When JSX and config are undefined, conditions win (third highest)
<Field name="field" />  // Uses condition evaluation

// ============================================================================
// GOTCHA: Condition must match for it to be active
// ============================================================================

// Condition: { when: "otherField", is: "match", disabled: true }
// For condition to be active, otherField must equal "match"
// Use record prop to set initial value: record={{ otherField: "match" }}

render(
  <Form config={config} record={{ otherField: "match" }}>
    <Field name="otherField" />
    <Field name="field" />
  </Form>
);

// ============================================================================
// PATTERN: Test naming convention
// ============================================================================

// Good: "should disable when config={true} overrides conditions={false}"
// - Describes what happens
// - Specifies input values
// - Clear expected outcome

// Avoid: "should work" or "test config"
// - Too vague
// - Doesn't specify scenario
```

### Integration Points

```yaml
TEST_FILE:
  - modify: packages/react/src/__tests__/Field.test.tsx
    file: Field.test.tsx
    change: Add new describe block after P2.M1.T3.S1 JSX prop tests
    placement: After "JSX disabled prop highest priority" describe block
    structure: |
      describe("Config disabled priority - second highest after JSX prop", () => {
        // Test 1: config true overrides conditions false
        // Test 2: config false overrides conditions true
        // Test 3: config true overrides group (if available)
        // Test 4: JSX true overrides config false
        // Test 5: JSX false overrides config true
        // Test 6: All sources active
      });

DEPENDENCIES:
  - no_code_changes: This PRP only adds tests, no code modifications
  - requires: P2.M1.T1.S1-S3 (useFieldDisabledState implementation)
  - requires: P2.M1.T2.S1 (FieldState.disabled type verification)
  - requires: P2.M1.T3.S1 (JSX disabled prop tests)
  - assumes: Field component disabled resolution works (lines 265-278 of Field.tsx)

TESTING:
  - framework: vitest + @testing-library/react
  - matchers: @testing-library/jest-dom (toBeDisabled, not.toBeDisabled)
  - environment: jsdom (configured in vitest.config.ts)

VALIDATION:
  - command: pnpm test --filter @formality-ui/react Field.test.tsx
  - expected: All tests pass, including new tests
  - coverage: Should increase coverage for config disabled scenarios
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after adding tests - fix before proceeding
pnpm typecheck                    # Type checking
pnpm lint --fix                   # Lint and auto-fix

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific test file with new tests
pnpm test --filter @formality-ui/react Field.test.tsx -v

# Test specific describe block
pnpm test --filter @formality-ui/react Field.test.tsx -t "Config disabled priority"

# Run all react tests to ensure no regressions
pnpm test --filter @formality-ui/react -v

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test config disabled priority in browser-like environment
pnpm test --filter @formality-ui/react Field.test.tsx --reporter=verbose

# Verify DOM state is correct
pnpm test --filter @formality-ui/react Field.test.tsx -t "should disable when config"

# Expected: All integration tests pass, DOM state verified.
```

### Level 4: Coverage Validation

```bash
# Check test coverage for disabled scenarios
pnpm test --filter @formality-ui/react --coverage

# Verify Field.test.tsx covers config disabled scenarios
# Look for high coverage percentage on Field component disabled logic

# Expected: Coverage increases or stays high for disabled state code paths.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] New tests added to Field.test.tsx (not useFieldDisabledState.test.tsx)
- [ ] Tests use Field component (not renderHook)
- [ ] All tests pass: `pnpm test --filter @formality-ui/react Field.test.tsx`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] No regressions in existing tests

### Feature Validation

- [ ] Test for config `disabled={true}` overriding conditions `disabled={false}`
- [ ] Test for config `disabled={false}` overriding conditions `disabled={true}`
- [ ] Test for JSX `disabled={true}` overriding config `disabled={false}`
- [ ] Test for JSX `disabled={false}` overriding config `disabled={true}`
- [ ] Test for all sources active (JSX > config > conditions > group)
- [ ] DOM `disabled` attribute is correct in all scenarios

### Code Quality Validation

- [ ] Tests follow existing Field.test.tsx patterns
- [ ] Tests use `data-testid` for element selection
- [ ] Tests use `@testing-library/jest-dom` matchers (toBeDisabled)
- [ ] Test names are descriptive and specific
- [ ] Tests are isolated (no dependencies between tests)

### Documentation & Deployment

- [ ] Test names clearly describe scenario and expected outcome
- [ ] Comments explain why config should override conditions
- [ ] No additional deployment needed (tests only)

---

## Anti-Patterns to Avoid

- ❌ **Don't use renderHook** - Integration tests must use Field component, not hook in isolation
- ❌ **Don't test only config vs conditions** - Also test JSX prop vs config priority
- ❌ **Don't use CSS selectors** - Use `data-testid` for reliable element selection
- ❌ **Don't forget JSX vs config tests** - Verify JSX prop can override config
- ❌ **Don't modify useFieldDisabledState.test.tsx** - Add tests to Field.test.tsx for integration testing
- ❌ **Don't ignore condition matching** - Ensure condition values match record values
- ❌ **Don't use vague test names** - Be specific: "should disable when config={true} overrides conditions={false}"
- ❌ **Don't test hook behavior** - Test Field component behavior and DOM state
- ❌ **Don't forget to verify DOM** - Use `toBeDisabled()` to verify actual DOM attribute
- ❌ **Don't skip priority order** - Test full priority: JSX > config > conditions > group

---

## Related Work Items

- **Previous**: P2.M1.T1.S1 - Create useFieldDisabledState hook (implements priority logic)
- **Previous**: P2.M1.T1.S2 - Integrate disabled into useConditions
- **Previous**: P2.M1.T1.S3 - Handle circular dependency with two-pass evaluation
- **Previous**: P2.M1.T2.S1 - Verify FieldStateInput type (ensures types support disabled property)
- **Previous**: P2.M1.T3.S1 - Test disabled from JSX prop (JSX prop priority tests)
- **Current**: P2.M1.T3.S2 - Test disabled from config (THIS ITEM)
- **Future**: P2.M1.T3.S3 - Test disabled from conditions

---

## Contract Dependencies

### From P2.M1.T1.S1-S3 (Hook Implementation)

The P2.M1.T1 PRPs specify that:

1. `useFieldDisabledState` hook implements priority logic: prop > config > conditions > group > false
2. Hook uses two-pass evaluation to prevent circular dependencies
3. Hook returns boolean for disabled state

**This PRP's Contract**:

1. Tests verify config.disabled has second-highest priority at Field component level
2. Tests verify config overrides conditions and group state
3. Tests verify JSX prop overrides config.disabled
4. Tests verify DOM state and user interaction

**Integration Point**: Hook implementation is tested in isolation (useFieldDisabledState.test.tsx lines 89-116). This PRP adds Field component integration tests to verify end-to-end behavior.

### From P2.M1.T2.S1 (Type Verification)

The P2.M1.T2.S1 PRP specifies that:

1. `FieldState.disabled?: boolean` property exists
2. `FieldStateInput.disabled?: boolean` property exists
3. Type consistency across all field state types

**This PRP's Contract**:

1. Tests verify config.disabled state flows correctly through Field component
2. Tests verify DOM reflects config.disabled state accurately
3. No type errors when using config.disabled in tests

**Integration Point**: Types support disabled property in config, so tests can use `config: { field: { disabled: boolean } }` without type errors.

### From P2.M1.T3.S1 (JSX Prop Tests)

The P2.M1.T3.S1 PRP specifies that:

1. JSX prop has highest priority
2. JSX prop tests added to Field.test.tsx in describe block "JSX disabled prop highest priority"
3. Tests verify JSX prop overrides ALL sources simultaneously

**This PRP's Contract**:

1. Config tests added in NEW describe block after JSX prop tests
2. Config tests verify config has second-highest priority
3. Config tests verify config overrides conditions and group
4. Config tests verify JSX prop still overrides config

**Integration Point**: JSX prop tests establish the highest priority. This PRP tests the second-highest priority (config).

---

## Confidence Score

**10/10** - Maximum confidence for one-pass implementation success

**Reasoning**:

- Well-scoped testing task (no code changes, only tests)
- Clear file location and exact placement for new tests
- Comprehensive test patterns from existing tests to follow
- Specific test scenarios with code examples provided
- All dependencies (hook implementation, type verification, JSX tests) complete
- Clear validation commands and expected outcomes
- Known gotchas documented with solutions
- Anti-patterns identified to avoid

**No Deduction**: This is a straightforward testing task with clear patterns to follow, comprehensive examples, and minimal risk.

---

## References

### Internal Documentation

- [P2.M1.T3.S1 PRP](../P2M1T3S1/PRP.md) - JSX disabled prop tests (previous work item)
- [P2.M1.T1.S1 PRP](../P2M1T1S1/PRP.md) - useFieldDisabledState hook implementation
- [P2.M1.T2.S1 PRP](../P2M1T2S1/PRP.md) - FieldState type verification
- [Field Component Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - Existing Field tests
- [useFieldDisabledState Hook Tests](../../../../packages/react/src/__tests__/useFieldDisabledState.test.tsx) - Hook tests (reference only)
- [Field Component](../../../../packages/react/src/components/Field.tsx) - Lines 265-278 (disabled resolution)

### External Documentation

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing patterns
- [jest-dom toBeDisabled](https://github.com/testing-library/jest-dom#tobedisabled) - Disabled state matcher

### Example Code

- [Existing Disabled Prop Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - Lines 429-467 (JSX prop pattern)
- [Existing Condition Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - Lines 156-228 (condition pattern)
- [useFieldDisabledState Hook](../../../../packages/react/src/hooks/useFieldDisabledState.ts) - Lines 82-86, 177-196 (priority logic)
