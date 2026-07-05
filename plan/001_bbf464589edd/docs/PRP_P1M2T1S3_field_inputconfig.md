# PRP: Update Field to Pass inputConfig to changeField

**Work Item**: P1.M2.T1.S3 - Update Field to pass inputConfig
**Parent Task**: P1.M2.T1 - Modify Form Component
**Priority**: P1 (Critical)

---

## Goal

**Feature Goal**: Update the Field component's `handleChange` wrapper to pass the `inputConfig` as the third argument to `changeField`, enabling per-field debounce control for auto-save.

**Deliverable**: Modified `handleChange` function in `Field.tsx` that calls `changeField(name, value, inputConfig)` instead of `changeField(name, value)`.

**Success Definition**:

- `handleChange` passes `inputConfig` as third argument to `changeField`
- `inputConfig` is added to `useCallback` dependency array
- TypeScript compilation succeeds
- Existing Field component behavior is preserved
- Auto-save can now detect `inputConfig?.debounce === false` for immediate submission

---

## Why

- **User Impact**: This completes the wiring for per-field auto-save behavior. After P1.M2.T1.S1 (added parameter) and P1.M2.T1.S2 (conditional logic), this step actually passes the configuration through, enabling developers to use `debounce: false` on specific fields.
- **Integration**: This is the final piece that enables the feature defined in P1.M2.T1. The Form component is ready to receive `inputConfig`, and the Field component has the config available - this connects them.
- **Problems Solved**: Currently, even though Form.tsx checks `inputConfig?.debounce === false`, it never receives the config because Field doesn't pass it. This single-line change enables the entire feature.

---

## What

Update the `handleChange` wrapper in Field component to pass `inputConfig` to `changeField`.

**Current Implementation** (line 369):

```typescript
changeField(name, parsedValue);
```

**Target Implementation**:

```typescript
changeField(name, parsedValue, inputConfig);
```

Additionally, add `inputConfig` to the `useCallback` dependency array.

**Current Dependency Array** (line 371):

```typescript
[inputConfig.parser, providerConfig.parsers, changeField, name];
```

**Target Dependency Array**:

```typescript
[inputConfig.parser, providerConfig.parsers, changeField, name, inputConfig];
```

### Success Criteria

- [ ] `changeField` called with three arguments: `(name, parsedValue, inputConfig)`
- [ ] `inputConfig` added to `useCallback` dependency array
- [ ] No TypeScript errors after changes
- [ ] Existing Field component tests pass
- [ ] Auto-save integration tests pass (when combined with P1.M2.T1.S2)

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes. This PRP provides:

- Exact file path and line numbers
- Current and target code snippets
- Complete context on `inputConfig` source and structure
- Dependency array requirements
- Validation commands specific to this project
- Integration points with previous subtasks

### Documentation & References

```yaml
# MUST READ - Critical implementation references

# CONTRACT FROM PREVIOUS SUBTASKS
- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S1/PRP.md
  why: Defines the inputConfig parameter contract - changeField signature is (name, value, inputConfig?)
  contract: The third parameter is optional and typed as InputConfig
  critical: This is the foundational contract that enables this feature

- file: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P1M2T1S2/PRP.md
  why: Defines the conditional execution logic that consumes inputConfig
  contract: When inputConfig?.debounce === false, submitImmediate() is called
  critical: This PRP assumes Field will pass inputConfig - this is that task

# IMPLEMENTATION TARGET
- file: packages/react/src/components/Field.tsx
  why: Contains handleChange wrapper (lines 356-372) and changeField call (line 369)
  pattern: Curried useCallback wrapper with proper dependency array
  gotcha: inputConfig is NOT a prop - it's computed locally via useMemo (lines 143-168)

# TYPE DEFINITIONS
- file: packages/core/src/types/config.ts
  why: InputConfig type definition with debounce property (lines 45-78)
  pattern: Interface with optional debounce?: number | false
  critical: debounce: false means immediate submission, undefined uses form default

- file: packages/react/src/context/FormContext.ts
  why: FormContextValue interface showing changeField signature (line 93)
  pattern: Callback signature with optional third parameter
  contract: changeField: (name: string, value: unknown, inputConfig?: InputConfig) => void

# CONTEXT SOURCE
- file: packages/react/src/components/Field.tsx
  why: Shows where inputConfig comes from - computed via useMemo (lines 143-168)
  pattern: Merges provider, form, and field-level input configurations
  gotcha: Uses resolveInputConfig() helper to get type-specific config

# VALIDATION REFERENCES
- file: packages/react/src/__tests__/Field.test.tsx
  why: Reference for Field component testing patterns
  pattern: TestInput component with data-testid, userEvent.setup() for interactions

- file: packages/react/src/__tests__/autosave-validation.test.tsx
  why: Reference for auto-save behavior testing with fake timers
  pattern: vi.useFakeTimers(), vi.advanceTimersByTimeAsync(), waitFor expectations
  gotcha: Always clean up with vi.useRealTimers() in afterEach

# EXTERNAL RESEARCH
- url: https://react.dev/reference/react/useCallback
  why: Understanding useCallback dependency arrays with complex objects
  critical: When using inputConfig in the callback body, it must be in dependency array

- url: https://react.dev/learn/render-and-commit#referencing-values-with-refs
  why: Understanding when to use values vs refs in callbacks
  critical: inputConfig is a value (not a ref), so must be in dependency array
```

### Current Codebase Tree

```bash
/home/dustin/projects/formality/
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── types/
│   │       │   └── config.ts          # InputConfig type definition (line 45)
│   │       └── index.ts
│   └── react/
│       └── src/
│           ├── components/
│           │   ├── Form.tsx           # changeField with conditional logic (from P1.M2.T1.S2)
│           │   └── Field.tsx          # TARGET: handleChange at lines 356-372
│           ├── context/
│           │   └── FormContext.ts     # FormContextValue.changeField signature
│           └── __tests__/
│               ├── Field.test.tsx
│               └── autosave-validation.test.tsx
├── plan/
│   └── 001_bbf464589edd/
│       └── bugfix/
│           └── 001_7b007b20a2ac/
│               ├── P1M2T1S1/PRP.md    # Previous: Added inputConfig parameter
│               ├── P1M2T1S2/PRP.md    # Previous: Implemented conditional execution
│               └── P1M2T1S3/PRP.md    # This file
└── package.json
```

### Desired Codebase Tree (Files to Modify)

```bash
# Modified files:
packages/react/src/components/Field.tsx        # Update handleChange to pass inputConfig

# No new files created in this subtask
# Tests will be added in P1.M2.T2 (Add Tests for debounce: false)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: inputConfig is NOT a prop passed to Field
// It is computed INTERNALLY via useMemo at lines 143-168
// DO NOT look for inputConfig in FieldProps - it won't be there

// CRITICAL: The changeField call is inside a curried wrapper
// handleChange is: (onChange) => (newValue) => { ... }
// This pattern allows capturing context (name, inputConfig) while accepting onChange

// GOTCHA: Adding inputConfig to dependency array is REQUIRED
// Since inputConfig is used in the function body (passed to changeField),
// React requires it in the dependency array for useCallback

// GOTCHA: inputConfig is a computed value from useMemo
// It changes when: type changes, providerConfig.inputs changes, or formConfig.inputs changes
// This is correct - we want to re-create handleChange when config changes

// PATTERN: This codebase uses curried onChange wrappers
// handleChange(field.onChange) returns the actual onChange handler
// The curried pattern captures name and inputConfig in closure

// GOTCHA: Only ONE call site for changeField exists in the codebase
// Location: packages/react/src/components/Field.tsx line 369
// This is the only place that needs to be updated

// CRITICAL: The changeField signature expects (name, value, inputConfig?)
// The parameter is OPTIONAL, so not passing it is backward compatible
// But we WANT to pass it to enable the debounce: false feature
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - this task uses existing `InputConfig` type and `changeField` callback.

**InputConfig Type** (already exists):

```typescript
// packages/core/src/types/config.ts:45-78
export interface InputConfig<TValue = unknown> {
  component: unknown;
  defaultValue: TValue;
  debounce?: number | false; // Key property: false = immediate, number = delay
  parser?: string | ((value: unknown) => TValue);
  formatter?: string | ((value: TValue) => unknown);
  // ... other properties
}
```

**changeField Signature** (from P1.M2.T1.S1):

```typescript
changeField: (name: string, value: unknown, inputConfig?: InputConfig) => void;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ AND VERIFY current handleChange implementation
  - FILE: packages/react/src/components/Field.tsx
  - VERIFY: handleChange function exists at lines 356-372
  - VERIFY: changeField call exists at line 369
  - VERIFY: inputConfig is computed at lines 143-168
  - VERIFY: Current dependency array at line 371
  - DEPENDENCIES: P1.M2.T1.S1 and P1.M2.T1.S2 must be complete

Task 2: MODIFY changeField call to pass inputConfig
  - FILE: packages/react/src/components/Field.tsx
  - LOCATION: Line 369 inside handleChange
  - CURRENT: changeField(name, parsedValue);
  - TARGET: changeField(name, parsedValue, inputConfig);
  - PRESERVE: All surrounding logic (parsing, onChange call)

Task 3: UPDATE useCallback dependency array
  - FILE: packages/react/src/components/Field.tsx
  - LOCATION: Line 371
  - CURRENT: [inputConfig.parser, providerConfig.parsers, changeField, name]
  - TARGET: [inputConfig.parser, providerConfig.parsers, changeField, name, inputConfig]
  - REASON: inputConfig is now used in the function body

Task 4: VERIFY TypeScript compilation
  - RUN: pnpm -F @formality-ui/react run tsc --noEmit
  - EXPECT: No type errors
  - VALIDATE: Optional parameter syntax is correct

Task 5: VERIFY existing tests pass
  - RUN: pnpm -F @formality-ui/react test
  - EXPECT: All existing tests pass
  - REASON: Changes are backward compatible (inputConfig is optional)
  - NO NEW TESTS: Tests will be added in P1.M2.T2
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Curried onChange wrapper (Field.tsx lines 356-372)
const handleChange = useCallback(
  (onChange: (value: unknown) => void) => (newValue: unknown) => {
    // Parse value using inputConfig.parser
    const parsedValue = parse(
      newValue,
      inputConfig.parser,
      providerConfig.parsers,
    );

    // Update React Hook Form value
    onChange(parsedValue);

    // ===== P1.M2.T1.S3 MODIFICATION START =====
    // Notify form of change (now passes inputConfig for debounce control)
    changeField(name, parsedValue, inputConfig); // ADDED: inputConfig
    // ===== P1.M2.T1.S3 MODIFICATION END =====
  },
  [inputConfig.parser, providerConfig.parsers, changeField, name, inputConfig], // ADDED: inputConfig
);

// PATTERN: inputConfig computation (Field.tsx lines 143-168)
const inputConfig = useMemo((): InputConfig => {
  const formInputs =
    typeof formConfig.inputs === "function"
      ? formConfig.inputs(providerConfig.inputs)
      : (formConfig.inputs ?? {});

  // Merge provider inputs with form-level overrides
  const mergedInputs: Record<string, InputConfig> = {
    ...providerConfig.inputs,
  };
  for (const [key, override] of Object.entries(formInputs)) {
    if (mergedInputs[key]) {
      mergedInputs[key] = {
        ...mergedInputs[key],
        ...override,
      } as InputConfig;
    }
  }

  return (
    resolveInputConfig(type, mergedInputs) ?? {
      component: "input",
      defaultValue: "",
    }
  );
}, [type, providerConfig.inputs, formConfig.inputs]);

// GOTCHA: inputConfig is a memoized value
// It changes when type, providerConfig.inputs, or formConfig.inputs change
// Adding it to dependency array is correct - we want new closure when config changes

// PATTERN: How handleChange is used (Field.tsx line ~410)
onChange: handleChange(field.onChange);

// This creates a closure that captures:
// - name (field name)
// - inputConfig (computed config with debounce setting)
// - changeField (callback from useFormContext)
// - parser dependencies
```

### Integration Points

```yaml
CHANGEFIELD_CALL:
  - file: packages/react/src/components/Field.tsx
  - update: line 369
  - from: changeField(name, parsedValue);
  - to: changeField(name, parsedValue, inputConfig);

DEPENDENCY_ARRAY:
  - file: packages/react/src/components/Field.tsx
  - update: line 371
  - from: [inputConfig.parser, providerConfig.parsers, changeField, name]
  - to: [inputConfig.parser, providerConfig.parsers, changeField, name, inputConfig]

BACKWARD_COMPATIBILITY:
  - parameter: inputConfig is optional in changeField signature
  - existing: Fields without explicit config work (inputConfig has default values)
  - new: Fields with debounce: false trigger immediate submission

FORM_COMPONENT:
  - file: packages/react/src/components/Form.tsx
  - state: Ready to receive inputConfig (from P1.M2.T1.S2)
  - logic: if (inputConfig?.debounce === false) { submitImmediate() } else { debouncedSubmit() }
  - integration: This change enables that logic to work
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type checking - Run after modification
pnpm -F @formality-ui/react run tsc --noEmit

# Expected: Zero type errors
# Common errors to fix:
# - "Expected 2 arguments, but got 3" - Change signature first in P1.M2.T1.S1
# - "Cannot find name 'inputConfig'" - Verify inputConfig is in scope (it is, defined above)
# - "Argument of type 'InputConfig' is not assignable to parameter" - Check import

# Linting (if project uses ESLint)
pnpm -F @formality-ui/react run lint

# Expected: Zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run Field component tests
pnpm test packages/react/src/__tests__/Field.test.tsx

# Expected: All tests pass
# Any failures indicate breaking changes were introduced

# Run all react package tests
pnpm -F @formality-ui/react test

# Expected: All tests pass
# This includes integration tests that use Field components

# Manual smoke test - verify the code compiles
pnpm -F @formality-ui/react run build

# Expected: Build completes without errors
```

### Level 3: Integration Testing (System Validation)

```bash
# Note: Full integration testing requires P1.M2.T1.S2 to be complete
# The conditional execution logic must exist for inputConfig to have effect

# However, we can verify the wiring is correct:
grep -A 2 "changeField(name, parsedValue, inputConfig)" packages/react/src/components/Field.tsx

# Expected output should show:
# changeField(name, parsedValue, inputConfig);

# Verify dependency array includes inputConfig
grep "inputConfig.parser, providerConfig.parsers, changeField, name, inputConfig" packages/react/src/components/Field.tsx

# Expected: Should find the dependency array with inputConfig
```

### Level 4: End-to-End Validation (Feature Testing)

```bash
# This validation requires P1.M2.T1.S2 AND P1.M2.T1.S3 to be complete
# The feature won't be fully active until both are done

# Once both are complete, test with:
cat > /tmp/test-debounce-false.tsx << 'EOF'
import { Form, Field } from '@formality-ui/react';
import { FormalityProvider } from '@formality-ui/react';

const config = {
  inputs: {
    text: {
      component: 'input',
      defaultValue: '',
      debounce: false, // Should trigger immediate submission
    },
  },
};

function TestApp() {
  const handleSubmit = (data) => console.log('Submitted:', data);

  return (
    <FormalityProvider config={{ inputs: config }}>
      <Form config={{ inputs: {} }} onSubmit={handleSubmit}>
        <Field name="testField" type="text" />
      </Form>
    </FormalityProvider>
  );
}
EOF

# The above should:
# 1. Render without errors
# 2. Trigger immediate submission when field changes (debounce: false)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Field.tsx handleChange updated to pass inputConfig (line 369)
- [ ] Dependency array updated to include inputConfig (line 371)
- [ ] TypeScript compilation succeeds: `pnpm -F @formality-ui/react run tsc --noEmit`
- [ ] All existing tests pass: `pnpm -F @formality-ui/react test`
- [ ] Build succeeds: `pnpm -F @formality-ui/react run build`

### Feature Validation

- [ ] `changeField` called with three arguments: `(name, parsedValue, inputConfig)`
- [ ] `inputConfig` in dependency array triggers re-creation when config changes
- [ ] Existing Field component behavior preserved (backward compatible)
- [ ] Ready for P1.M2.T1.S2 conditional logic to consume inputConfig
- [ ] No breaking changes to existing Field usage

### Code Quality Validation

- [ ] Follows existing useCallback pattern in Field component
- [ ] Proper dependency array (all used values included)
- [ ] No eslint/prettier warnings introduced
- [ ] Code is self-documenting with clear variable names

### Integration Readiness

- [ ] P1.M2.T1.S1 contract satisfied (changeField accepts third parameter)
- [ ] P1.M2.T1.S2 logic can now receive inputConfig
- [ ] Ready for P1.M2.T2 (comprehensive tests for debounce: false)
- [ ] Feature chain complete: parameter → logic → wiring

---

## Anti-Patterns to Avoid

- **Don't look for inputConfig in FieldProps** - It's computed internally, not passed as a prop
- **Don't forget to add inputConfig to dependency array** - React requires it when used in callback body
- **Don't modify the parsing logic** - Only add the third parameter to changeField
- **Don't change the curried wrapper pattern** - The (onChange) => (newValue) => {} structure is intentional
- **Don't add new imports** - InputConfig is already available in scope
- **Don't add tests yet** - Tests will be added in P1.M2.T2 after all subtasks complete
- **Don't modify onChange call** - Keep `onChange(parsedValue)` unchanged
- **Don't pass inputConfig to onChange** - Only changeField gets the third parameter

---

## Related Work Items

- **Previous**: P1.M2.T1.S1 - Add inputConfig parameter to changeField (COMPLETED)
- **Previous**: P1.M2.T1.S2 - Implement conditional execution logic (COMPLETED in parallel)
- **Next**: P1.M2.T1.S4 - Fix Form debounce prop type to allow `false`
- **Finally**: P1.M2.T2 - Add comprehensive tests for debounce: false behavior

---

## Confidence Score

**10/10** - Maximum confidence for one-pass implementation success

**Reasoning**:

- Single-line change with clear before/after
- Exact file path and line number specified
- No new code to write, only pass existing value
- All dependencies are already in place
- Comprehensive validation commands provided
- Previous PRPs provide complete contract context
- No external dependencies or libraries needed
- Backward compatible (parameter is optional)
- Only one call site exists in entire codebase

**Risk Assessment**: Minimal risk. This is a wiring task that connects two existing pieces of functionality. The parameter exists, the logic exists, this just passes the value through.

---

## References

- [Previous PRP: P1.M2.T1.S1](../P1M2T1S1/PRP.md) - InputConfig parameter contract
- [Previous PRP: P1.M2.T1.S2](../P1M2T1S2/PRP.md) - Conditional execution logic
- [InputConfig Type Definition](../../../../packages/core/src/types/config.ts#L45) - debounce property
- [FormContextValue Interface](../../../../packages/react/src/context/FormContext.ts#L93) - changeField signature
- [Field Component](../../../../packages/react/src/components/Field.tsx#L356) - handleChange implementation
- [React useCallback Documentation](https://react.dev/reference/react/useCallback) - Dependency arrays
