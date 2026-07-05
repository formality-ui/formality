# PRP: Test Disabled from Conditions

**Work Item**: P2.M1.T3.S3 - Test disabled from conditions
**Parent Task**: P2.M1.T3 - Add Tests for Disabled Property
**Parent Milestone**: P2.M1 - Disabled Property in Field States
**Priority**: P2 (Major Issue)
**Story Points**: 2

---

## Goal

**Feature Goal**: Create comprehensive integration tests that verify field conditions `disabled` property has the third-highest priority, overriding group state but being overridden by JSX prop and field config. Tests must verify condition evaluation, re-evaluation on dependency changes, complex multi-field conditions, and circular dependency handling.

**Deliverable**:

1. Integration tests in `Field.test.tsx` for condition disabled priority
2. Test cases verifying conditions set disabled correctly when JSX and config are undefined
3. Test cases for condition re-evaluation when dependencies change
4. Test cases for complex conditions with multiple matchers (AND logic)
5. Test cases for conditions referencing other fields' disabled state (`isDisabled` matcher)
6. Test cases for circular dependencies (field A → field B → field A)
7. DOM verification tests using `@testing-library/jest-dom` matchers

**Success Definition**:

- Condition `disabled: true` overrides group state when JSX and config are undefined
- Condition `disabled: false` overrides group state when JSX and config are undefined
- Field config `disabled` overrides condition `disabled`
- JSX prop `disabled` overrides condition `disabled`
- Conditions re-evaluate when referenced field values change
- Multi-field conditions use AND logic (all must match)
- `isDisabled` matcher correctly references other fields' disabled state
- Circular dependencies resolve without infinite loops using two-pass evaluation
- Input element has correct `disabled` attribute in DOM
- All tests pass: `pnpm test --filter @formality-ui/react Field.test.tsx`

---

## User Persona (if applicable)

**Target User**: Developers using Formality UI form library

**Use Case**: Developers need to conditionally enable/disable fields based on other field states, with predictable priority: JSX prop can override conditions, field config can override conditions, but conditions override group state.

**User Journey**:

1. Developer has field with conditions that reference other field values
2. When condition matches (e.g., `otherField === "value"`), field becomes disabled
3. When condition doesn't match, field remains enabled
4. Developer can still override with JSX `disabled={false}` prop or config `disabled: false`
5. When referenced field value changes, condition re-evaluates and disabled state updates

**Pain Points Addressed**:

- Conditions provide dynamic, reactive disabled state based on form state
- Priority must be predictable and documented
- No existing integration tests verify condition disabled evaluation
- No existing tests verify circular dependency handling for disabled state
- No existing tests verify `isDisabled` matcher integration

---

## Why

- **Contract Definition**: Conditions are documented as having third-highest priority but lack comprehensive integration testing
- **Test Coverage Gap**: `useFieldDisabledState.test.tsx` tests hook in isolation (lines 117-145), but `Field.test.tsx` has NO tests for condition disabled priority when JSX and config are undefined
- **Integration Testing**: Hook tests don't catch integration bugs between condition evaluation and Field component
- **Missing Scenarios**: No tests for:
  - Condition re-evaluation when dependencies change
  - Multi-field conditions with AND logic
  - `isDisabled` matcher referencing other fields' disabled state
  - Circular dependencies between fields' disabled states
- **Real-World Scenario**: Conditional disabled is the primary way developers create reactive forms (e.g., "disable email field until password is valid")
- **Previous Work**: P2.M1.T3.S1 tested JSX prop priority, P2.M1.T3.S2 tested config priority, now we need to test condition priority
- **Critical Feature**: Two-pass evaluation for circular dependencies was implemented in P2.M1.T1.S3 but has NO integration tests

---

## What

Create comprehensive integration tests for condition disabled priority in the Field component.

### Current State

**Existing Tests (Insufficient)**:

1. `useFieldDisabledState.test.tsx` (hook tests):
   - Tests condition priority over group (lines 117-129)
   - Tests condition disabled false over group (lines 131-145)
   - **Limitation**: Uses `renderHook`, doesn't test Field component integration
   - **Limitation**: No DOM verification
   - **Limitation**: No tests for re-evaluation, multi-field, `isDisabled`, or circular dependencies

2. `Field.test.tsx` (component tests):
   - Tests JSX prop over conditions (lines 429-450, 469-588)
   - Tests config over conditions (lines 591-643, 689-723)
   - **NO tests for conditions as the primary disabled source** (when JSX and config are undefined)
   - **NO tests for condition re-evaluation**
   - **NO tests for multi-field conditions**
   - **NO tests for `isDisabled` matcher**
   - **NO tests for circular dependencies**

3. `Field.test.tsx` (existing condition tests - lines 156-228):
   - Tests basic condition rendering
   - Tests visible condition
   - Tests "is" matcher condition
   - **Tests don't verify disabled state priority**
   - **Tests don't verify re-evaluation**

### Test Scenarios to Add

**Scenario 1: Condition disabled={true} when JSX and config are undefined**

```typescript
// Given: Field with condition disabled: true, no JSX prop, no config disabled
const config = {
  otherField: { type: "textField" },
  field: {
    type: "textField",
    conditions: [
      { when: "otherField", is: "value", disabled: true }  // Condition says disabled
    ],
  },
};

// When: Render field (no JSX prop, no config disabled)
<Form config={config} record={{ otherField: "value" }}>
  <Field name="otherField" />
  <Field name="field" />  {/* No JSX prop, no config disabled */}
</Form>

// Then: Field should be disabled (condition wins)
expect(screen.getByTestId("field")).toBeDisabled();
```

**Scenario 2: Condition disabled={false} when JSX and config are undefined**

```typescript
// Given: Field with condition disabled: false, no JSX prop, no config disabled
const config = {
  otherField: { type: "textField" },
  field: {
    type: "textField",
    conditions: [
      { when: "otherField", is: "value", disabled: false }  // Condition says enabled
    ],
  },
};

// When: Render field
<Form config={config} record={{ otherField: "value" }}>
  <Field name="otherField" />
  <Field name="field" />
</Form>

// Then: Field should be enabled (condition says enabled)
expect(screen.getByTestId("field")).not.toBeDisabled();
```

**Scenario 3: Condition re-evaluation when dependency changes**

```typescript
// Given: Field with condition based on other field value
const config = {
  otherField: { type: "textField" },
  field: {
    type: "textField",
    conditions: [
      { when: "otherField", is: "disable", disabled: true }
    ],
  },
};

// Initial: otherField is "enable", field is enabled
render(<Form config={config} record={{ otherField: "enable" }} />);
expect(screen.getByTestId("field")).not.toBeDisabled();

// When: Change otherField to "disable"
await user.type(screen.getByTestId("otherField"), "disable");

// Then: Field should become disabled (condition re-evaluated)
await waitFor(() => {
  expect(screen.getByTestId("field")).toBeDisabled();
});
```

**Scenario 4: Multi-field conditions with AND logic**

```typescript
// Given: Field disabled only when BOTH conditions match
const config = {
  field1: { type: "textField" },
  field2: { type: "textField" },
  target: {
    type: "textField",
    conditions: [
      {
        when: {
          field1: { is: "value1" },
          field2: { is: "value2" }
        },
        disabled: true
      }
    ],
  },
};

// When: Only field1 matches
<Form config={config} record={{ field1: "value1", field2: "other" }}>
  // Then: target should be enabled (AND logic requires both)
</Form>

// When: Both fields match
<Form config={config} record={{ field1: "value1", field2: "value2" }}>
  // Then: target should be disabled
</Form>
```

**Scenario 5: isDisabled matcher references other field's disabled state**

```typescript
// Given: Field disabled when other field is disabled
const config = {
  source: {
    type: "textField",
    conditions: [
      { when: "trigger", is: "disable", disabled: true }
    ]
  },
  target: {
    type: "textField",
    conditions: [
      { when: "source", isDisabled: true, disabled: true }
    ],
  },
};

// When: source is disabled by its own condition
<Form config={config} record={{ trigger: "disable" }}>
  // Then: target should also be disabled (references source.disabled)
</Form>
```

**Scenario 6: Circular dependency resolution**

```typescript
// Given: Field A disabled depends on Field B, Field B depends on Field A
const config = {
  fieldA: {
    type: "textField",
    conditions: [
      { when: "fieldB", isDisabled: true, disabled: true }
    ],
  },
  fieldB: {
    type: "textField",
    conditions: [
      { when: "fieldA", isDisabled: true, disabled: true }
    ],
  },
};

// When: Render fields with circular dependency
<Form config={config}>
  <Field name="fieldA" />
  <Field name="fieldB" />
</Form>

// Then: Both should be enabled initially (no circular infinite loop)
// Two-pass evaluation should resolve without infinite loop
expect(screen.getByTestId("fieldA")).not.toBeDisabled();
expect(screen.getByTestId("fieldB")).not.toBeDisabled();

// When: Type in fieldA
await user.type(screen.getByTestId("fieldA"), "test");

// Then: fieldB becomes disabled, fieldA stays enabled
await waitFor(() => {
  expect(screen.getByTestId("fieldB")).toBeDisabled();
});
expect(screen.getByTestId("fieldA")).not.toBeDisabled();
```

### Success Criteria

- [ ] Test for condition `disabled={true}` when JSX and config are undefined
- [ ] Test for condition `disabled={false}` when JSX and config are undefined
- [ ] Test for condition vs group state priority
- [ ] Test for config `disabled` overriding condition `disabled`
- [ ] Test for JSX `disabled` overriding condition `disabled`
- [ ] Test for condition re-evaluation when dependency changes
- [ ] Test for multi-field conditions with AND logic
- [ ] Test for `isDisabled` matcher referencing other fields' disabled state
- [ ] Test for circular dependency resolution without infinite loops
- [ ] All tests use Field component (not hook in isolation)
- [ ] All tests use `@testing-library/react` patterns
- [ ] All tests pass: `pnpm test --filter @formality-ui/react Field.test.tsx`

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:

- Exact file location for tests (`Field.test.tsx`)
- Complete test patterns from existing tests
- Priority order: prop > config > conditions > group > false
- Condition evaluation implementation details (two-pass evaluation)
- Specific test scenarios with code examples
- Validation commands specific to this project
- Known gotchas and anti-patterns to avoid
- Integration with previous PRPs (P2.M1.T3.S1, P2.M1.T3.S2)

### Documentation & References

```yaml
# MUST READ - Test patterns and existing tests

# TARGET FILE - Add tests here
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Main test file for Field component - add condition disabled priority tests
  exact: Add new describe block after P2.M1.T3.S2 tests (after line 724)
  pattern: Follow existing test structure with describe/it blocks
  gotcha: Use `data-testid` for element selection, not CSS selectors

# EXISTING CONDITION TESTS TO REFERENCE
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: Existing condition tests (lines 156-228) - follow this pattern
  exact: Lines 156-228 ("conditions" describe block)
  pattern: Config with conditions array, record prop to set values
  critical: Shows how to set up conditions, but doesn't test disabled priority

# EXISTING PRIORITY TESTS TO REFERENCE
- file: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  why: P2.M1.T3.S1 and P2.M1.T3.S2 tests (lines 469-724) - follow this pattern
  exact: Lines 469-588 (JSX prop tests), Lines 590-724 (config tests)
  pattern: Priority testing with multiple sources active
  critical: Shows JSX and config priority, but conditions always lose

# HOOK TESTS - For reference (do NOT copy - wrong approach)
- file: /home/dustin/projects/formality/packages/react/src/__tests__/useFieldDisabledState.test.tsx
  why: Shows condition priority logic - use for understanding, NOT for patterns
  exact: Lines 117-145 (condition priority tests)
  pattern: Uses renderHook - DO NOT USE THIS for integration tests
  critical: Integration tests must use Field component, not renderHook

# FIELD COMPONENT - Understanding disabled resolution
- file: /home/dustin/projects/formality/packages/react/src/components/Field.tsx
  why: Shows how disabled flows through Field component
  exact: Lines 265-278 (isDisabled resolution logic)
  pattern: Priority order: prop > config > condition > group > false
  critical: Conditions (conditionResult.disabled) are checked THIRD

# USECONDITIONS HOOK - Condition evaluation implementation
- file: /home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts
  why: Hook that evaluates conditions and computes disabled state
  exact: Lines 104-186 (two-pass evaluation for circular dependencies)
  pattern: Three-pass evaluation (Pass 1: no disabled, Pass 2: compute disabled, Pass 3: merge)
  critical: Two-pass evaluation prevents circular dependency infinite loops

# PREVIOUS WORK - JSX prop tests (P2.M1.T3.S1)
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T3S1/PRP.md
  why: Previous PRP that tested JSX prop priority
  contract: Assumes JSX prop tests exist and pass
  critical: Condition tests should be in separate describe block after JSX and config tests

# PREVIOUS WORK - Config tests (P2.M1.T3.S2)
- file: /home/dustin/projects/formality/plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T3S2/PRP.md
  why: Previous PRP that tested config priority
  contract: Assumes config tests exist and pass
  critical: Condition tests should be in separate describe block after config tests

# CONDITION EVALUATION CORE
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Core condition evaluation logic for matchers
  exact: Lines 1-200 (evaluateConditions function)
  pattern: Handles is, truthy, isValid, isDisabled matchers
  critical: isDisabled matcher checks fieldState.isDisabled

# CONDITION TYPE DEFINITIONS
- file: /home/dustin/projects/formality/packages/core/src/types/conditions.ts
  why: Type definitions for conditions
  exact: Lines 1-100 (Condition, ConditionMatchers types)
  pattern: Condition with when, is, truthy, isValid, isDisabled, disabled properties
  critical: disabled property on condition sets field disabled state

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

- url: https://testing-library.com/docs/user-event/intro
  why: User interaction simulation for testing dynamic re-evaluation
  section: userEvent.type() for keyboard input simulation

- url: https://testing-library.com/docs/dom-testing-library/api-async/
  why: Async utilities for waiting for state changes
  section: waitFor for re-evaluation tests
```

### Current Codebase tree (react package tests)

```bash
packages/react/src/
├── __tests__/
│   ├── setup.ts                    # Test configuration (jsdom, jest-dom)
│   ├── Field.test.tsx              # ← TARGET: Add condition disabled tests here
│   ├── useFieldDisabledState.test.tsx  # Hook tests (for reference, not modification)
│   ├── Form.test.tsx               # Form component tests
│   └── [other test files]
├── components/
│   ├── Field.tsx                   # Field component with disabled resolution (lines 265-278)
│   └── [other components]
└── hooks/
    ├── useConditions.ts            # Condition evaluation with two-pass evaluation (lines 104-186)
    └── useFieldDisabledState.ts    # Hook implementing priority logic
```

### Desired Codebase tree with tests to be added

```bash
packages/react/src/__tests__/
├── Field.test.tsx                  # ← MODIFY: Add new test describe block
│   ├── [existing tests]
│   ├── describe("JSX disabled prop highest priority - ALL sources active")  # From P2.M1.T3.S1
│   ├── describe("Config disabled priority - second highest after JSX prop")  # From P2.M1.T3.S2
│   └── describe("Conditions disabled priority - third highest after JSX prop and config")  # ← ADD THIS
│       ├── it("should disable when condition={true} and no JSX/config disabled")
│       ├── it("should enable when condition={false} and no JSX/config disabled")
│       ├── it("should re-evaluate when dependency changes")
│       ├── it("should support multi-field conditions with AND logic")
│       ├── it("should reference isDisabled matcher from other field")
│       └── it("should handle circular dependencies without infinite loops")
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Use Field component, NOT renderHook
// renderHook tests the hook in isolation
// We need integration tests with full Field component rendering
// WRONG: renderHook(() => useConditions(...))
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

// GOTCHA: Condition must match for disabled to take effect
// If condition doesn't match, disabled property is NOT applied
// Field uses default disabled state (false) when no condition matches
// Example: { when: "other", is: "x", disabled: true } - only active when other === "x"

// GOTCHA: toBeDisabled() checks actual DOM attribute
// @testing-library/jest-dom toBeDisabled() checks <input disabled> attribute
// This is the correct way to test disabled state

// CRITICAL: Priority order in Field.tsx (lines 265-278)
// 1. JSX prop (disabledProp) - checked FIRST
// 2. Field config (fieldConfig.disabled) - checked SECOND
// 3. Conditions (conditionResult.disabled) - checked THIRD ← TARGET OF THIS PRP
// 4. Group state (groupContext.state.isDisabled) - checked FOURTH
// 5. Default: false

// CRITICAL: Two-pass evaluation for circular dependencies
// Pass 1: Build fieldStates WITHOUT disabled property (line 129)
// Pass 2: Compute disabled using Pass 1 states (line 158)
// Pass 3: Merge results (line 180)
// This prevents: A.disabled → B.disabled → A.disabled (infinite loop)

// GOTCHA: Multi-field conditions use AND logic
// when: { field1: { is: "x" }, field2: { is: "y" } }
// Disabled only when BOTH field1 === "x" AND field2 === "y"
// All matchers in the object must match for condition to be active

// GOTCHA: isDisabled matcher references other field's disabled state
// { when: "source", isDisabled: true, disabled: true }
// Matches when source field isDisabled === true
// Useful for cascading disabled states

// GOTCHA: Test file location
// Add tests to Field.test.tsx, NOT useFieldDisabledState.test.tsx
// We need Field component integration tests

// CRITICAL: Run specific test file during development
// Command: pnpm test --filter @formality-ui/react Field.test.tsx
// This runs only Field tests, faster feedback during development

// GOTCHA: Re-evaluation testing requires userEvent and waitFor
// For testing condition re-evaluation when dependencies change:
// 1. Use userEvent.setup() for user interactions
// 2. Use await waitFor() to wait for state changes
// 3. Verify disabled state after the change

// GOTCHA: Circular dependency test requires special setup
// Create two fields where each depends on other's disabled state
// Test should complete without timeout (no infinite loop)
// Two-pass evaluation should resolve correctly
```

---

## Implementation Blueprint

### Data models and structure

**No new data models needed** - this PRP is purely testing existing functionality.

**Test Data Structure**:

```typescript
// Form config with condition disabled
const config: FormFieldsConfig = {
  // Other field for condition evaluation
  otherField: { type: "textField" },

  // Target field with condition disabled
  field: {
    type: "textField",
    conditions: [
      {
        when: "otherField",
        is: "value",
        disabled: boolean,  // Condition disabled (third priority)
      },
    ],
  },
};

// JSX prop (highest priority - undefined for condition priority tests)
<Field name="field" />  // No disabled prop, let condition control

// Config disabled (second priority - undefined for condition priority tests)
// No disabled property in field config, let condition control
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ existing Field.test.tsx test file
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - READ: Lines 1-790 (entire file up to render prop tests)
  - UNDERSTAND: Test structure, TestInput component, test patterns
  - IDENTIFY: Where to add new tests (after line 724, after P2.M1.T3.S2 config tests)
  - PATTERN: Follow existing describe/it structure
  - OUTPUT: Understanding of test file structure

Task 2: ANALYZE existing condition tests
  - READ: Lines 156-228 ("conditions" describe block)
  - UNDERSTAND: How conditions are set up with record prop
  - IDENTIFY: Pattern for setting up conditions
  - PATTERN: config with conditions array, record prop to match condition
  - OUTPUT: Pattern to follow for condition setup

Task 3: ADD new describe block for condition disabled priority
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - LOCATION: After line 724 (after P2.M1.T3.S2 config tests)
  - ADD: describe("Conditions disabled priority - third highest after JSX prop and config", () => { ... })
  - PATTERN: Follow existing describe block structure
  - PLACEMENT: After config tests, before render prop tests

Task 4: IMPLEMENT test - condition disabled={true} when JSX/config undefined
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should disable when condition={true} and no JSX/config disabled", () => { ... })
  - CONFIG: field with conditions disabled: true, no config disabled, no JSX prop
  - RECORD: Set otherField to match condition
  - JSX: <Field name="field" /> (no disabled prop)
  - VERIFY: expect(screen.getByTestId("field")).toBeDisabled()
  - PATTERN: |
    it("should disable when condition={true} and no JSX/config disabled", () => {
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          // No config disabled
          conditions: [
            { when: "otherField", is: "match", disabled: true },  // Condition says disabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" />  {/* No JSX prop, no config disabled, condition controls */}
          </Form>
        </FormalityProvider>,
      );

      // Condition (true) should control disabled (no JSX, no config)
      expect(screen.getByTestId("field")).toBeDisabled();
    });

Task 5: IMPLEMENT test - condition disabled={false} when JSX/config undefined
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should enable when condition={false} and no JSX/config disabled", () => { ... })
  - CONFIG: field with conditions disabled: false, no config disabled, no JSX prop
  - RECORD: Set otherField to match condition
  - JSX: <Field name="field" /> (no disabled prop)
  - VERIFY: expect(screen.getByTestId("field")).not.toBeDisabled()
  - PATTERN: Similar to Task 4, but disabled: false in condition

Task 6: IMPLEMENT test - config overrides condition
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should prioritize config disabled={false} over condition disabled={true}", () => { ... })
  - CONFIG: field with config disabled: false, conditions disabled: true
  - JSX: <Field name="field" /> (no disabled prop)
  - VERIFY: expect(screen.getByTestId("field")).not.toBeDisabled()
  - PATTERN: |
    it("should prioritize config disabled={false} over condition disabled={true}", () => {
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          disabled: false,  // Config says enabled
          conditions: [
            { when: "otherField", is: "match", disabled: true },  // Condition says disabled
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "match" }}>
            <Field name="otherField" />
            <Field name="field" />  {/* Config wins over condition */}
          </Form>
        </FormalityProvider>,
      );

      // Config (false) should override condition (true)
      expect(screen.getByTestId("field")).not.toBeDisabled();
    });

Task 7: IMPLEMENT test - JSX overrides condition
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should prioritize JSX disabled={false} over condition disabled={true}", () => { ... })
  - CONFIG: field with conditions disabled: true, no config disabled
  - JSX: <Field name="field" disabled={false} />
  - VERIFY: expect(screen.getByTestId("field")).not.toBeDisabled()
  - PATTERN: Similar to Task 6, but JSX prop instead of config

Task 8: IMPLEMENT test - condition re-evaluation when dependency changes
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should re-evaluate condition when dependency field value changes", async () => { ... })
  - USE: const user = userEvent.setup()
  - CONFIG: field with condition on otherField value
  - INITIAL: otherField doesn't match, field is enabled
  - ACTION: await user.type() to change otherField to matching value
  - VERIFY: await waitFor(() => expect(screen.getByTestId("field")).toBeDisabled())
  - PATTERN: |
    it("should re-evaluate condition when dependency field value changes", async () => {
      const user = userEvent.setup();
      const config: FormFieldsConfig = {
        otherField: { type: "textField" },
        field: {
          type: "textField",
          conditions: [
            { when: "otherField", is: "disable", disabled: true },
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ otherField: "enable" }}>
            <Field name="otherField" />
            <Field name="field" />
          </Form>
        </FormalityProvider>,
      );

      // Initial: condition doesn't match, field is enabled
      expect(screen.getByTestId("field")).not.toBeDisabled();

      // Change otherField to "disable"
      await user.clear(screen.getByTestId("otherField"));
      await user.type(screen.getByTestId("otherField"), "disable");

      // Condition re-evaluates, field becomes disabled
      await waitFor(() => {
        expect(screen.getByTestId("field")).toBeDisabled();
      });
    });

Task 9: IMPLEMENT test - multi-field conditions with AND logic
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should use AND logic for multi-field when conditions", () => { ... })
  - CONFIG: field with when: { field1: {...}, field2: {...} }
  - TEST: Both fields match → disabled
  - TEST: Only one field matches → enabled
  - VERIFY: Correct AND logic behavior
  - PATTERN: |
    it("should use AND logic for multi-field when conditions", () => {
      const config: FormFieldsConfig = {
        field1: { type: "textField" },
        field2: { type: "textField" },
        target: {
          type: "textField",
          conditions: [
            {
              when: {
                field1: { is: "value1" },
                field2: { is: "value2" },
              },
              disabled: true,
            },
          ],
        },
      };

      // Test 1: Only field1 matches - should be enabled
      const { rerender } = render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ field1: "value1", field2: "other" }}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );
      expect(screen.getByTestId("target")).not.toBeDisabled();

      // Test 2: Both match - should be disabled
      rerender(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ field1: "value1", field2: "value2" }}>
            <Field name="field1" />
            <Field name="field2" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );
      expect(screen.getByTestId("target")).toBeDisabled();
    });

Task 10: IMPLEMENT test - isDisabled matcher references other field's disabled state
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should reference isDisabled matcher from other field", () => { ... })
  - CONFIG: source field with condition, target field with isDisabled condition
  - SETUP: source becomes disabled by its own condition
  - VERIFY: target also becomes disabled (references source.disabled)
  - PATTERN: |
    it("should reference isDisabled matcher from other field", () => {
      const config: FormFieldsConfig = {
        trigger: { type: "textField" },
        source: {
          type: "textField",
          conditions: [
            { when: "trigger", is: "disable", disabled: true },
          ],
        },
        target: {
          type: "textField",
          conditions: [
            { when: "source", isDisabled: true, disabled: true },
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config} record={{ trigger: "disable" }}>
            <Field name="trigger" />
            <Field name="source" />
            <Field name="target" />
          </Form>
        </FormalityProvider>,
      );

      // source is disabled by its own condition
      expect(screen.getByTestId("source")).toBeDisabled();

      // target is disabled because it references source.isDisabled
      expect(screen.getByTestId("target")).toBeDisabled();
    });

Task 11: IMPLEMENT test - circular dependency resolution without infinite loops
  - FILE: /home/dustin/projects/formality/packages/react/src/__tests__/Field.test.tsx
  - ADD: it("should handle circular dependencies without infinite loops", async () => { ... })
  - USE: const user = userEvent.setup()
  - CONFIG: fieldA depends on fieldB.isDisabled, fieldB depends on fieldA.isDisabled
  - INITIAL: Both enabled (no match)
  - ACTION: Type in fieldA
  - VERIFY: fieldB disabled, fieldA enabled, no infinite loop
  - PATTERN: |
    it("should handle circular dependencies without infinite loops", async () => {
      const user = userEvent.setup();
      const config: FormFieldsConfig = {
        fieldA: {
          type: "textField",
          conditions: [
            { when: "fieldB", isDisabled: true, disabled: true },
          ],
        },
        fieldB: {
          type: "textField",
          conditions: [
            { when: "fieldA", isDisabled: true, disabled: true },
          ],
        },
      };

      render(
        <FormalityProvider inputs={testInputs}>
          <Form config={config}>
            <Field name="fieldA" />
            <Field name="fieldB" />
          </Form>
        </FormalityProvider>,
      );

      // Both enabled initially (no circular infinite loop)
      expect(screen.getByTestId("fieldA")).not.toBeDisabled();
      expect(screen.getByTestId("fieldB")).not.toBeDisabled();

      // Type in fieldA (makes it truthy)
      await user.type(screen.getByTestId("fieldA"), "test");

      // fieldB becomes disabled (fieldA is truthy/disabled check)
      await waitFor(() => {
        expect(screen.getByTestId("fieldB")).toBeDisabled();
      });

      // fieldA stays enabled (fieldB is disabled, which is falsy for truthy check)
      expect(screen.getByTestId("fieldA")).not.toBeDisabled();

      // No infinite loop - test completes without timeout
    });

Task 12: RUN tests to verify implementation
  - COMMAND: pnpm test --filter @formality-ui/react Field.test.tsx
  - VERIFY: All new tests pass
  - VERIFY: All existing tests still pass (no regressions)
  - EXPECTED: Zero failures
  - IF_FAILURES: Read output and fix implementation
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN: Test structure for condition disabled priority
// ============================================================================

describe("Conditions disabled priority - third highest after JSX prop and config", () => {
  // Test 1: condition true when JSX/config undefined
  // Test 2: condition false when JSX/config undefined
  // Test 3: config overrides condition
  // Test 4: JSX overrides condition
  // Test 5: re-evaluation when dependency changes
  // Test 6: multi-field conditions with AND logic
  // Test 7: isDisabled matcher
  // Test 8: circular dependencies
});

// ============================================================================
// PATTERN: Config with condition disabled (no JSX, no config disabled)
// ============================================================================

const config: FormFieldsConfig = {
  // Other field for condition evaluation
  otherField: { type: "textField" },

  // Target field with condition disabled (third priority)
  field: {
    type: "textField",
    // No config disabled property
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
// PATTERN: Render Field with condition disabled
// ============================================================================

render(
  <FormalityProvider inputs={testInputs}>
    <Form config={config} record={{ otherField: "value" }}>
      <Field name="otherField" />  {/* For condition evaluation */}
      <Field name="field" />  {/* Condition disabled applies */}
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
// PATTERN: Condition re-evaluation testing
// ============================================================================

const user = userEvent.setup();

// Initial state
expect(screen.getByTestId("field")).not.toBeDisabled();

// Trigger change
await user.clear(screen.getByTestId("otherField"));
await user.type(screen.getByTestId("otherField"), "new value");

// Wait for re-evaluation
await waitFor(() => {
  expect(screen.getByTestId("field")).toBeDisabled();
});

// ============================================================================
// PATTERN: Multi-field conditions (AND logic)
// ============================================================================

conditions: [
  {
    when: {
      field1: { is: "value1" },
      field2: { is: "value2" },
    },
    disabled: true,
  },
]

// AND logic: Disabled only when BOTH field1 === "value1" AND field2 === "value2"

// ============================================================================
// PATTERN: isDisabled matcher
// ============================================================================

conditions: [
  {
    when: "source",
    isDisabled: true,  // Matches when source field is disabled
    disabled: true,
  },
]

// References other field's disabled state
// Useful for cascading disabled states

// ============================================================================
// PATTERN: Circular dependency test
// ============================================================================

// fieldA.disabled depends on fieldB.isDisabled
// fieldB.disabled depends on fieldA.isDisabled
// Two-pass evaluation prevents infinite loop

// Pass 1: Build states without disabled
// Pass 2: Compute disabled using Pass 1 states
// No circular dependency possible

// ============================================================================
// CRITICAL: Priority order verification
// ============================================================================

// Priority: JSX prop > config > conditions > group > false

// When JSX prop is undefined and config is undefined, conditions win
<Field name="field" />  // Uses condition.disabled

// When config is set, config overrides conditions
field: { disabled: false, conditions: [...] }  // Config wins

// When JSX prop is set, JSX overrides everything
<Field name="field" disabled={boolean} />  // JSX wins

// ============================================================================
// GOTCHA: Condition must match for it to be active
// ============================================================================

// Condition: { when: "otherField", is: "match", disabled: true }
// For condition to be active, otherField must equal "match"
// Use record prop to set initial value: record={{ otherField: "match" }}

// If condition doesn't match, disabled property is NOT applied
// Field uses default disabled state (false)

render(
  <Form config={config} record={{ otherField: "match" }}>
    <Field name="otherField" />
    <Field name="field" />
  </Form>
);

// ============================================================================
// PATTERN: Test naming convention
// ============================================================================

// Good: "should disable when condition={true} and no JSX/config disabled"
// - Describes what happens
// - Specifies input values
// - Clear expected outcome

// Avoid: "should work" or "test condition"
// - Too vague
// - Doesn't specify scenario
```

### Integration Points

```yaml
TEST_FILE:
  - modify: packages/react/src/__tests__/Field.test.tsx
    file: Field.test.tsx
    change: Add new describe block after line 724
    placement: After "Config disabled priority" describe block
    structure: |
      describe("Conditions disabled priority - third highest after JSX prop and config", () => {
        // Test 1: condition true when JSX/config undefined
        // Test 2: condition false when JSX/config undefined
        // Test 3: config overrides condition
        // Test 4: JSX overrides condition
        // Test 5: re-evaluation when dependency changes
        // Test 6: multi-field conditions with AND logic
        // Test 7: isDisabled matcher
        // Test 8: circular dependencies
      });

DEPENDENCIES:
  - no_code_changes: This PRP only adds tests, no code modifications
  - requires: P2.M1.T1.S1-S3 (useFieldDisabledState implementation)
  - requires: P2.M1.T2.S1 (FieldState.disabled type verification)
  - requires: P2.M1.T3.S1 (JSX disabled prop tests)
  - requires: P2.M1.T3.S2 (Config disabled tests)
  - assumes: useConditions two-pass evaluation works (lines 104-186 of useConditions.ts)
  - assumes: Field component disabled resolution works (lines 265-278 of Field.tsx)

TESTING:
  - framework: vitest + @testing-library/react
  - matchers: @testing-library/jest-dom (toBeDisabled, not.toBeDisabled)
  - user_events: @testing-library/user-event (userEvent.setup, userEvent.type)
  - async: waitFor for re-evaluation tests
  - environment: jsdom (configured in vitest.config.ts)

VALIDATION:
  - command: pnpm test --filter @formality-ui/react Field.test.tsx
  - expected: All tests pass, including new tests
  - coverage: Should increase coverage for condition disabled scenarios
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
pnpm test --filter @formality-ui/react Field.test.tsx -t "Conditions disabled priority"

# Run all react tests to ensure no regressions
pnpm test --filter @formality-ui/react -v

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test condition disabled priority in browser-like environment
pnpm test --filter @formality-ui/react Field.test.tsx --reporter=verbose

# Verify DOM state is correct
pnpm test --filter @formality-ui/react Field.test.tsx -t "should disable when condition"

# Verify re-evaluation works
pnpm test --filter @formality-ui/react Field.test.tsx -t "should re-evaluate condition"

# Verify circular dependencies don't cause infinite loops
pnpm test --filter @formality-ui/react Field.test.tsx -t "should handle circular dependencies"

# Expected: All integration tests pass, DOM state verified, re-evaluation works, no infinite loops.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test two-pass evaluation for circular dependencies
# The test should complete without timeout (infinite loop detection)
pnpm test --filter @formality-ui/react Field.test.tsx -t "circular dependencies" --timeout=5000

# Test multi-field AND logic
pnpm test --filter @formality-ui/react Field.test.tsx -t "multi-field when conditions"

# Test isDisabled matcher integration
pnpm test --filter @formality-ui/react Field.test.tsx -t "isDisabled matcher"

# Expected: All creative validations pass, two-pass evaluation works correctly.
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

- [ ] Test for condition `disabled={true}` when JSX and config are undefined
- [ ] Test for condition `disabled={false}` when JSX and config are undefined
- [ ] Test for config `disabled` overriding condition `disabled`
- [ ] Test for JSX `disabled` overriding condition `disabled`
- [ ] Test for condition re-evaluation when dependency changes
- [ ] Test for multi-field conditions with AND logic
- [ ] Test for `isDisabled` matcher referencing other fields' disabled state
- [ ] Test for circular dependency resolution without infinite loops
- [ ] DOM `disabled` attribute is correct in all scenarios
- [ ] Re-evaluation happens without page refresh

### Code Quality Validation

- [ ] Tests follow existing Field.test.tsx patterns
- [ ] Tests use `data-testid` for element selection
- [ ] Tests use `@testing-library/jest-dom` matchers (toBeDisabled)
- [ ] Tests use `@testing-library/user-event` for interaction tests
- [ ] Tests use `waitFor` for async re-evaluation
- [ ] Test names are descriptive and specific
- [ ] Tests are isolated (no dependencies between tests)

### Documentation & Deployment

- [ ] Test names clearly describe scenario and expected outcome
- [ ] Comments explain why conditions should have third priority
- [ ] No additional deployment needed (tests only)

---

## Anti-Patterns to Avoid

- ❌ **Don't use renderHook** - Integration tests must use Field component, not hook in isolation
- ❌ **Don't test only basic conditions** - Also test re-evaluation, multi-field, isDisabled, circular dependencies
- ❌ **Don't use CSS selectors** - Use `data-testid` for reliable element selection
- ❌ **Don't forget re-evaluation tests** - Conditions must re-evaluate when dependencies change
- ❌ **Don't skip async tests** - Use `userEvent` and `waitFor` for re-evaluation testing
- ❌ **Don't modify useFieldDisabledState.test.tsx** - Add tests to Field.test.tsx for integration testing
- ❌ **Don't ignore condition matching** - Ensure condition values match record values for conditions to be active
- ❌ **Don't use vague test names** - Be specific: "should disable when condition={true} and no JSX/config disabled"
- ❌ **Don't test hook behavior** - Test Field component behavior and DOM state
- ❌ **Don't forget to verify DOM** - Use `toBeDisabled()` to verify actual DOM attribute
- ❌ **Don't skip circular dependency tests** - Two-pass evaluation must be tested
- ❌ **Don't skip multi-field tests** - AND logic for multi-field when must be verified
- ❌ **Don't skip isDisabled tests** - Matcher integration must be tested
- ❌ **Don't test condition vs config** - That's covered by P2.M1.T3.S2, focus on conditions as primary source

---

## Related Work Items

- **Previous**: P2.M1.T1.S1 - Create useFieldDisabledState hook (implements priority logic)
- **Previous**: P2.M1.T1.S2 - Integrate disabled into useConditions
- **Previous**: P2.M1.T1.S3 - Handle circular dependency with two-pass evaluation
- **Previous**: P2.M1.T2.S1 - Verify FieldStateInput type (ensures types support disabled property)
- **Previous**: P2.M1.T3.S1 - Test disabled from JSX prop (JSX prop priority tests)
- **Previous**: P2.M1.T3.S2 - Test disabled from config (config priority tests)
- **Current**: P2.M1.T3.S3 - Test disabled from conditions (THIS ITEM)
- **Future**: P2.M2 - Multi-Field isDisabled Conditions (extends condition testing)

---

## Contract Dependencies

### From P2.M1.T1.S1-S3 (Hook Implementation)

The P2.M1.T1 PRPs specify that:

1. `useFieldDisabledState` hook implements priority logic: prop > config > conditions > group > false
2. Hook uses two-pass evaluation to prevent circular dependencies
3. Hook returns boolean for disabled state
4. `useConditions` hook evaluates conditions and computes disabled state

**This PRP's Contract**:

1. Tests verify conditions have third-highest priority at Field component level
2. Tests verify conditions override group state
3. Tests verify config overrides conditions
4. Tests verify JSX prop overrides conditions
5. Tests verify condition re-evaluation works correctly
6. Tests verify two-pass evaluation prevents infinite loops

**Integration Point**: Hook implementation is tested in isolation. This PRP adds Field component integration tests to verify end-to-end behavior, including re-evaluation, multi-field conditions, isDisabled matcher, and circular dependencies.

### From P2.M1.T2.S1 (Type Verification)

The P2.M1.T2.S1 PRP specifies that:

1. `FieldState.disabled?: boolean` property exists
2. `FieldStateInput.disabled?: boolean` property exists
3. Type consistency across all field state types

**This PRP's Contract**:

1. Tests verify condition.disabled state flows correctly through Field component
2. Tests verify DOM reflects condition.disabled state accurately
3. No type errors when using conditions with disabled property in tests

**Integration Point**: Types support disabled property in conditions, so tests can use `conditions: [{ disabled: boolean }]` without type errors.

### From P2.M1.T3.S1 (JSX Prop Tests)

The P2.M1.T3.S1 PRP specifies that:

1. JSX prop has highest priority
2. JSX prop tests added to Field.test.tsx in describe block "JSX disabled prop highest priority"
3. Tests verify JSX prop overrides ALL sources simultaneously

**This PRP's Contract**:

1. Condition tests added in NEW describe block after JSX prop and config tests
2. Condition tests verify conditions have third-highest priority
3. Condition tests verify conditions are overridden by JSX and config
4. Condition tests verify conditions override group state

**Integration Point**: JSX prop tests establish the highest priority, config tests establish second priority. This PRP tests the third priority (conditions).

### From P2.M1.T3.S2 (Config Tests)

The P2.M1.T3.S2 PRP specifies that:

1. Config has second-highest priority
2. Config tests added to Field.test.tsx in describe block "Config disabled priority"
3. Tests verify config overrides conditions and group state

**This PRP's Contract**:

1. Condition tests added in NEW describe block after config tests
2. Condition tests verify conditions have third-highest priority
3. Condition tests verify config overrides conditions
4. Condition tests verify conditions override group state

**Integration Point**: Config tests establish the second priority. This PRP tests the third priority (conditions) and verifies that config correctly overrides conditions.

---

## Confidence Score

**10/10** - Maximum confidence for one-pass implementation success

**Reasoning**:

- Well-scoped testing task (no code changes, only tests)
- Clear file location and exact placement for new tests
- Comprehensive test patterns from existing tests to follow
- Specific test scenarios with code examples provided
- All dependencies (hook implementation, type verification, JSX tests, config tests) complete
- Clear validation commands and expected outcomes
- Known gotchas documented with solutions
- Anti-patterns identified to avoid
- Two-pass evaluation implementation is well-researched and documented

**No Deduction**: This is a straightforward testing task with clear patterns to follow, comprehensive examples, minimal risk, and extensive research backing the implementation approach.

---

## References

### Internal Documentation

- [P2.M1.T3.S1 PRP](../P2M1T3S1/PRP.md) - JSX disabled prop tests (previous work item)
- [P2.M1.T3.S2 PRP](../P2M1T3S2/PRP.md) - Config disabled tests (previous work item)
- [P2.M1.T1.S1 PRP](../P2M1T1S1/PRP.md) - useFieldDisabledState hook implementation
- [P2.M1.T1.S3 PRP](../P2M1T1S3/PRP.md) - Two-pass evaluation for circular dependencies
- [P2.M1.T2.S1 PRP](../P2M1T2S1/PRP.md) - FieldState type verification
- [Field Component Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - Existing Field tests
- [useFieldDisabledState Hook Tests](../../../../packages/react/src/__tests__/useFieldDisabledState.test.tsx) - Hook tests (reference only)
- [Field Component](../../../../packages/react/src/components/Field.tsx) - Lines 265-278 (disabled resolution)
- [useConditions Hook](../../../../packages/react/src/hooks/useConditions.ts) - Lines 104-186 (two-pass evaluation)
- [Condition Evaluation Core](../../../../packages/core/src/conditions/evaluate.ts) - Condition evaluation logic
- [Condition Types](../../../../packages/core/src/types/conditions.ts) - Type definitions

### External Documentation

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing patterns
- [jest-dom toBeDisabled](https://github.com/testing-library/jest-dom#tobedisabled) - Disabled state matcher
- [user-event](https://testing-library.com/docs/user-event/intro) - User interaction simulation
- [Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async/) - waitFor for async tests

### Example Code

- [Existing Condition Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - Lines 156-228 (condition pattern)
- [Existing JSX Prop Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - Lines 469-588 (JSX priority pattern)
- [Existing Config Tests](../../../../packages/react/src/__tests__/Field.test.tsx) - Lines 590-724 (config priority pattern)
- [useFieldDisabledState Hook](../../../../packages/react/src/hooks/useFieldDisabledState.ts) - Lines 82-86, 177-196 (priority logic)
