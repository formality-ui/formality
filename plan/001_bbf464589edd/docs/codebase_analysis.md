# Formality Codebase Analysis Report

## Executive Summary

This report documents the current implementation state of the Formality codebase to validate the bug report findings and provide architectural context for implementing fixes.

**Analysis Date**: 2025-01-11
**Scope**: All packages in the Formality monorepo
**Focus Areas**: Bug validation, architectural patterns, implementation guidance

---

## File Structure

### Core Package (`packages/core/src/`)

#### 1. **`config/merge.ts`** - Configuration Merging Pipeline

**Purpose**: Implements the 8-layer props merge pipeline defined in the PRD.

**Key Functions**:
- `mergeFieldProps()` - Merges all 8 prop layers in priority order
- `selectDefaultFieldProps()` - Resolves default props from config
- Priority order (highest to lowest):
  1. Component props (JSX attributes)
  2. Field config `selectProps` (evaluated dynamically)
  3. Field config `props` (static)
  4. Input config `props` (static)
  5. Form config `selectDefaultFieldProps` (evaluated dynamically)
  6. Form config `defaultFieldProps` (static)
  7. Provider config `selectDefaultFieldProps` (evaluated dynamically)
  8. Provider config `defaultFieldProps` (static)

**Current Implementation Status**:
- ✅ Static props layers work correctly
- ❌ `selectDefaultFieldProps` are NOT evaluated (passed as empty objects)
- ✅ `selectProps` evaluation works via `usePropsEvaluation` hook

**Code Reference**: `packages/core/src/config/merge.ts`

---

#### 2. **`conditions/evaluate.ts`** - Condition Evaluation Engine

**Purpose**: Evaluates field conditions (disabled, visible, setValue, etc.).

**Key Functions**:
- `evaluateConditions()` - Main condition evaluation function
- `evaluateFieldMatcher()` - Evaluates individual field matchers including `isDisabled`
- `conditionMatches()` - Checks if a condition matches current field values
- `mergeConditionResults()` - Merges multiple condition results

**Condition Matchers Supported**:
- Value matchers: `is`, `isNot`, `pattern`, `truthy`, `falsy`
- Field state matchers: `isValid`, `isDisabled`
- Array matchers: `includes`, `doesNotInclude`
- Range matchers: `gt`, `gte`, `lt`, `lte`

**Current Implementation Status**:
- ✅ `isDisabled` matcher implemented in `evaluateFieldMatcher()` (lines 78-84)
- ✅ Field state interface includes `disabled` property
- ❌ Field states are built WITHOUT `disabled` property (line 114 in `useConditions.ts`)

**Code Reference**: `packages/core/src/conditions/evaluate.ts`

---

#### 3. **`expression/evaluate.ts`** - Expression Evaluation Engine

**Purpose**: Safely evaluates expressions against form state.

**Key Functions**:
- `evaluate()` - Evaluates an expression string with context
- `parseExpression()` - Parses expression using jsep
- `inferFieldsFromExpression()` - Extracts field dependencies from expression

**Expression Capabilities**:
- Field value access: `client.id`, `signed && approved`
- Logical operators: `&&`, `||`, `!`
- Comparison operators: `===`, `!==`, `>`, `<`, `>=`, `<=`
- Arithmetic operators: `+`, `-`, `*`, `/`, `%`
- Ternary operators: `condition ? trueValue : falseValue`
- Member access: `object.property`, `array[index]`

**Security Constraints**:
- No function calls allowed
- Sandboxed evaluation context
- Only form state and field metadata accessible

**Current Implementation Status**:
- ✅ Expression parsing and evaluation work correctly
- ⚠️ Type safety issues with arithmetic operations (Issue 6)
- ✅ Caching of parsed ASTs for performance

**Code Reference**: `packages/core/src/expression/evaluate.ts`

---

#### 4. **`types/config.ts`** - Type Definitions

**Purpose**: Defines TypeScript types for configuration.

**Key Types**:
- `InputConfig<T>` - Defines input type configuration
  - `debounce?: number | false` - Supports immediate (false) or delayed (number)
- `FieldConfig` - Field instance configuration
- `SelectValue<T>` - Polymorphic type for dynamic properties (string or function)
- `FieldStateInput` - Field state interface with `disabled?: boolean`

**Current Implementation Status**:
- ✅ Type definitions support all PRD requirements
- ✅ `debounce: false` is properly typed
- ✅ Field state includes `disabled` property

**Code Reference**: `packages/core/src/types/config.ts`

---

### React Package (`packages/react/src/`)

#### 1. **`components/Field.tsx`** - Field Component

**Purpose**: Renders individual form fields with full props pipeline.

**Key Responsibilities**:
- Implements 8-layer props pipeline via `mergeFieldProps()` (lines 393-402)
- Evaluates conditions via `useConditions` hook
- Handles disabled/visible resolution (lines 257-285)
- Integrates with React Hook Form `Controller` component

**Props Pipeline Implementation** (lines 393-402):
```typescript
const finalProps = mergeFieldProps({
  providerDefaultFieldProps: providerConfig.defaultFieldProps,
  providerSelectDefaultFieldProps: {}, // ❌ NOT EVALUATED
  formDefaultFieldProps: formConfig.defaultFieldProps,
  formSelectDefaultFieldProps: {}, // ❌ NOT EVALUATED
  inputProps: inputConfig.props,
  fieldProps: fieldConfig.props,
  selectProps: evaluatedSelectProps, // ✅ Evaluated
  componentProps: props, // JSX props
});
```

**Current Implementation Status**:
- ✅ `selectProps` evaluation works via `usePropsEvaluation` hook
- ❌ `selectDefaultFieldProps` are empty objects, never evaluated
- ✅ Condition evaluation for disabled/visible works
- ⚠️ Disabled state resolution is complex (prop, config, condition, group)

**Code Reference**: `packages/react/src/components/Field.tsx`

---

#### 2. **`components/Form.tsx`** - Form Component

**Purpose**: Manages form state, auto-save, and submission.

**Key Responsibilities**:
- Provides `FormContext` for all child components
- Implements auto-save with debouncing (lines 299-317)
- Coordinates async validation before submission (lines 404-430)
- Handles field change callbacks

**Auto-Save Implementation** (lines 299-317):
```typescript
const changeField = useCallback(
  (name: string, value: unknown) => {
    if (autoSave) {
      pendingChangedFields.current.add(name);
      const affected = getAffectedFields(name);
      for (const field of affected) {
        pendingAffectedFields.current.add(field);
      }
      debouncedSubmit(); // ❌ No check for debounce: false
    }
  },
  [autoSave, getAffectedFields],
);
```

**Debounce Configuration** (line 136):
```typescript
debounceMs = props.debounce ?? 1000; // ❌ Ignores debounce: false
```

**Current Implementation Status**:
- ❌ Does NOT support `debounce: false` for immediate submission
- ✅ Debounce timer implementation works correctly for number values
- ✅ Async validation coordination is well-implemented
- ✅ Execution versioning prevents stale submissions

**Code Reference**: `packages/react/src/components/Form.tsx`

---

#### 3. **`hooks/useConditions.ts`** - Condition Evaluation Hook

**Purpose**: Evaluates field conditions and returns disabled/visible state.

**Key Responsibilities**:
- Watches dependent fields via `useWatch`
- Builds field states for condition evaluation
- Calls core `evaluateConditions()` function
- Returns merged condition results

**Field State Building** (lines 98-119):
```typescript
const fieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  watchFields.forEach((fieldName) => {
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false, // ❌ Hardcoded
      // ❌ MISSING: disabled property
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);
```

**Current Implementation Status**:
- ✅ Condition evaluation logic is correct
- ❌ Field states do NOT include `disabled` property
- ❌ `isValidating` is hardcoded to `false`
- ✅ Subscription inference works correctly

**Code Reference**: `packages/react/src/hooks/useConditions.ts`

---

#### 4. **`hooks/usePropsEvaluation.ts`** - Dynamic Props Evaluation Hook

**Purpose**: Evaluates dynamic props (`selectProps`) against form state.

**Key Responsibilities**:
- Evaluates expressions with field context
- Infers field dependencies automatically
- Creates proxy-wrapped field states for evaluation

**Evaluation Pattern**:
```typescript
const evaluatedProps = useMemo(() => {
  if (typeof selectProps === 'function') {
    return selectProps(proxyFieldStates);
  }
  return selectProps;
}, [selectProps, proxyFieldStates]);
```

**Current Implementation Status**:
- ✅ Expression evaluation works correctly
- ✅ Proxy state pattern enables reactive access
- ✅ Dependency inference prevents unnecessary re-evaluation
- ❌ Only used for `selectProps`, not `selectDefaultFieldProps`

**Code Reference**: `packages/react/src/hooks/usePropsEvaluation.ts`

---

## Current Implementation State vs. PRD Claims

### Issue 1: `selectDefaultFieldProps` Not Implemented

**PRD Requirement**:
- Section 6.3.2 defines 8-layer props pipeline
- Layers 2 and 4 should evaluate `selectDefaultFieldProps` functions
- Evaluation should happen against form state

**Actual Implementation**:
- `selectDefaultFieldProps` are passed to `mergeFieldProps()` as empty objects
- Comments indicate "should be evaluated" but evaluation never happens
- `usePropsEvaluation` hook exists but only evaluates `selectProps`

**Bug Confirmed**: ✅ YES - Feature is completely missing

**Root Cause**: The `usePropsEvaluation` hook was created for `selectProps` but was never extended to handle form/provider-level `selectDefaultFieldProps`.

---

### Issue 2: Per-Field `debounce: false` Not Implemented

**PRD Requirement**:
- Section 11.1 states: "If field has `debounce: false`, submit immediately"
- Section 6.3.1 defines `debounce?: number | false`

**Actual Implementation**:
- Type definition correctly supports `debounce?: number | false`
- Form component defaults to `1000` if `debounce` prop is falsy (line 136)
- No check for `inputConfig.debounce === false` in `changeField` callback

**Bug Confirmed**: ✅ YES - Feature is completely missing

**Root Cause**: The `changeField` callback always calls `debouncedSubmit()` without checking if the field has `debounce: false`.

---

### Issue 3: `disabled` Property Missing From Field States

**PRD Requirement**:
- Section 7.1 documents `isDisabled` condition matcher
- Section 8.3 shows `isDisabled` usage in conditions

**Actual Implementation**:
- `evaluateFieldMatcher()` correctly checks `isDisabled` matcher
- `FieldStateInput` interface includes `disabled?: boolean`
- Field states are built WITHOUT `disabled` property (line 114 in `useConditions.ts`)

**Bug Confirmed**: ✅ YES - Property is not populated

**Root Cause**: `methods.getFieldState()` from React Hook Form does NOT return `disabled` property. The disabled state comes from condition evaluation, creating a circular dependency.

**Complexity**: HIGH - Disabled state has multiple sources:
1. JSX prop: `<Field disabled />`
2. Field config: `{ disabled: true }`
3. Condition evaluation: `conditions: [{ disabled: true }]`
4. Group state: Parent `FieldGroup` disabled state

---

### Issue 4: `isDisabled` Condition Matcher Only Works for String `when`

**PRD Requirement**:
- Section 8.3 shows multi-field conditions with `isDisabled`

**Actual Implementation**:
- `isDisabled` matcher is only checked when `condition.when` is a string (lines 177-199 in `evaluate.ts`)
- For object `when` conditions, `isDisabled` is ignored

**Bug Confirmed**: ✅ YES - Multi-field conditions don't work

**Root Cause**: The `isDisabled` check is inside the `if (typeof condition.when === "string")` block.

---

### Issue 5: Potential Memory Leak in Subscription Cleanup

**PRD Requirement**:
- N/A (general robustness)

**Actual Implementation**:
- `useSubscriptions` hook manages field subscriptions
- Cleanup function may not handle rapid subscription changes

**Bug Confirmed**: ⚠️ POSSIBLE - Needs investigation

**Complexity**: MEDIUM - Requires testing rapid subscription changes

---

### Issue 6: Type Safety Issues in Expression Evaluation

**PRD Requirement**:
- Section 5.2 defines expression evaluation

**Actual Implementation**:
- Arithmetic operations assume `number` type without runtime checks
- `evaluate("null + 5", context)` would throw error

**Bug Confirmed**: ✅ YES - No type checking

**Complexity**: LOW - Easy to fix with type guards

---

### Issue 7: Race Condition in Auto-Save Validation

**PRD Requirement**:
- Section 12 defines auto-save system

**Actual Implementation**:
- Current implementation has version checking (`executionVersionRef`)
- May have edge cases where validation completes after version check

**Bug Confirmed**: ⚠️ MINOR - Edge cases may exist

**Complexity**: LOW - Existing safeguards are good

---

## Architecture Patterns

### Expression Evaluation Pattern

**Pattern**: Safe, sandboxed expression evaluation with field context

**Implementation**:
1. **Parsing**: jsep library parses expressions into AST
2. **Caching**: Parsed ASTs are cached in Map for performance
3. **Evaluation**: Safe evaluation with context containing field values
4. **Proxy Unwrapping**: Field proxies are unwrapped to get raw values

**Example**:
```typescript
// Expression: "client.id && approved"
const context = {
  client: { id: 123 },
  approved: true
};
evaluate("client.id && approved", context)
// → true
```

**Usage in Fixes**:
- Use same `evaluate()` function for `selectDefaultFieldProps`
- Follow same caching pattern for performance
- Use same proxy unwrapping logic

---

### Hook Consistency Pattern

**Pattern**: All hooks follow consistent structure for state management

**Implementation**:
1. **Subscription Inference**: Use `useInferredInputs` to determine dependencies
2. **Isolated Watching**: Use `useWatch` with specific field names
3. **State Building**: Build minimal required state on change
4. **Memoization**: Cache results with proper dependencies

**Example from `useConditions`**:
```typescript
const watchFields = useInferredInputs({ conditions, subscribesTo });
const watchedValues = useWatch({ control: methods.control, name: watchFields });

const fieldStates = useMemo(() => {
  // Build minimal state object
}, [watchFields, watchedValues, methods]);
```

**Usage in Fixes**:
- Follow same pattern for new `useDefaultPropsEvaluation` hook
- Use `useInferredInputs` for dependency inference
- Use `useWatch` for isolated subscriptions

---

### Proxy State Pattern

**Pattern**: Field states use proxy objects to provide dual access (value + metadata)

**Implementation**:
1. **Minimal Wrapper**: Only expose necessary properties
2. **Value Proxies**: Wrap values to enable reactive updates
3. **State Metadata**: Include touched/dirty/validating states
4. **Unwrapping**: Special handling to unwrap proxies for evaluation

**Example**:
```typescript
const proxyState = createFieldStateProxy(fieldName, fieldValue, fieldMetadata);

// Can access value
proxyState.client.id → 123

// Can access metadata
proxyState.client.isTouched → true
```

**Usage in Fixes**:
- Use same proxy pattern for `selectDefaultFieldProps` evaluation
- Ensure proxies are properly unwrapped before evaluation

---

### Props Pipeline Pattern

**Pattern**: 8-layer merge with strict priority order

**Implementation**:
1. **Layer Separation**: Each layer has distinct purpose
2. **Priority Order**: Higher layers override lower layers
3. **Static vs Dynamic**: Static props merged first, dynamic evaluated last
4. **Type Safety**: TypeScript ensures layer compatibility

**Layer Order** (highest to lowest):
1. Component props (JSX)
2. Field config `selectProps` (dynamic)
3. Field config `props` (static)
4. Input config `props` (static)
5. Form config `selectDefaultFieldProps` (dynamic) ❌ NOT EVALUATED
6. Form config `defaultFieldProps` (static)
7. Provider config `selectDefaultFieldProps` (dynamic) ❌ NOT EVALUATED
8. Provider config `defaultFieldProps` (static)

**Usage in Fixes**:
- Insert evaluated `selectDefaultFieldProps` at layers 5 and 7
- Ensure evaluated props override static props
- Maintain strict priority order

---

## Critical Dependencies

### Module Dependency Graph

```
@formality-ui/core
├── expression/evaluate.ts (used by conditions, config)
├── conditions/evaluate.ts (used by React hooks)
├── config/merge.ts (used by Field component)
└── types/config.ts (used everywhere)

@formality-ui/react
├── components/Field.tsx (depends on: useConditions, usePropsEvaluation, core)
├── components/Form.tsx (depends on: core types, React Hook Form)
├── hooks/useConditions.ts (depends on: core conditions, React Hook Form)
└── hooks/usePropsEvaluation.ts (depends on: core expression, React Hook Form)
```

### External Library Dependencies

1. **react-hook-form** (^7.50.0):
   - `useWatch` - Isolated field subscriptions
   - `useForm` - Form state management
   - `Controller` - Field component integration
   - `getFieldState` - Field state access (NOTE: does NOT include `disabled`)

2. **lodash-es** (^4.17.21):
   - `debounce` - Debounce utility
   - Tree-shakeable ES modules

3. **jsep** (^1.4.0):
   - Expression parsing
   - AST generation

4. **React** (^18.0.0):
   - Hooks (useState, useMemo, useCallback, useEffect)
   - Context API
   - forwardRef pattern

---

## Implementation Guidance

### For Issue 1: `selectDefaultFieldProps` Evaluation

**Approach**:
1. Extend `usePropsEvaluation` hook to handle form/provider level props
2. Add new parameters for `selectDefaultFieldProps` from form and provider
3. Evaluate these using the same expression engine
4. Pass evaluated results to `mergeFieldProps()`

**Files to Modify**:
- `packages/react/src/hooks/usePropsEvaluation.ts` - Add evaluation logic
- `packages/react/src/components/Field.tsx` - Pass evaluated props
- `packages/react/src/components/Form.tsx` - Provide form-level props
- `packages/react/src/components/FormalityProvider.tsx` - Provide provider-level props

**Pattern to Follow**: Same as existing `selectProps` evaluation

---

### For Issue 2: `debounce: false` Support

**Approach**:
1. Modify `changeField` callback to accept `inputConfig` parameter
2. Check if `inputConfig.debounce === false`
3. If true, call `submitImmediate()` instead of `debouncedSubmit()`
4. Create `submitImmediate()` function that bypasses debounce

**Files to Modify**:
- `packages/react/src/components/Form.tsx` - Add immediate submission logic

**Pattern to Follow**: Similar to existing debounced submit, but without debounce

---

### For Issue 3 & 4: `isDisabled` Conditions

**Approach**:
1. Resolve actual disabled state for each field (from all sources)
2. Include `disabled` property in field states
3. Move `isDisabled` matcher check outside string-only block
4. Support multi-field conditions with `isDisabled`

**Files to Modify**:
- `packages/react/src/hooks/useConditions.ts` - Build field states with disabled
- `packages/core/src/conditions/evaluate.ts` - Support multi-field isDisabled
- `packages/react/src/components/Field.tsx` - Expose resolved disabled state

**Complexity**: HIGH - Disabled state has multiple sources that must be resolved

---

### For Issue 5: Memory Leak Prevention

**Approach**:
1. Add tracking of subscriptions per effect invocation
2. Ensure cleanup only removes subscriptions added in that invocation
3. Test with rapid subscription changes

**Files to Modify**:
- `packages/react/src/hooks/useSubscriptions.ts` - Improve cleanup logic

**Pattern to Follow**: Similar to existing useEffect cleanup patterns

---

### For Issue 6: Type Safety in Expressions

**Approach**:
1. Add type guards before arithmetic operations
2. Return `undefined` or handle gracefully for non-numeric values
3. Add tests for type edge cases

**Files to Modify**:
- `packages/core/src/expression/evaluate.ts` - Add type checking

**Pattern to Follow**: Same as other error handling in expression evaluation

---

### For Issue 7: Race Condition Prevention

**Approach**:
1. Review existing version checking logic
2. Add additional safeguards if needed
3. Test with rapid field changes

**Files to Modify**:
- `packages/react/src/components/Form.tsx` - Strengthen validation coordination

**Pattern to Follow**: Enhance existing execution versioning

---

## Test Patterns

### Test Structure

Tests follow consistent patterns:
- **Vitest** for testing framework
- **Testing Library** for DOM testing
- **forwardRef** components for test fixtures
- **Provider wrapping** for context

### Example Test Pattern

```typescript
describe("Feature", () => {
  it("should behave correctly", () => {
    render(
      <FormalityProvider inputs={testInputs}>
        <Form config={testConfig}>
          <Field name="testField" />
        </Form>
      </FormalityProvider>
    );

    // Test behavior
    userEvent.click(screen.getByTestId("testField"));
    expect(screen.getByTestId("result")).toHaveTextContent("expected");
  });
});
```

### Testing Utilities

1. **Test Input Components**: Reusable forwardRef components
2. **Mock Contexts**: Simulate form and provider configs
3. **User Event Testing**: Simulate user interactions
4. **State Assertion**: Check disabled, visible, error states

---

## Recommendations

### General Implementation Notes

1. **Follow existing patterns** - Use same hook structure and evaluation logic
2. **Maintain backward compatibility** - Don't break existing functionality
3. **Add comprehensive tests** - Cover all edge cases and scenarios
4. **Use TypeScript strictly** - Leverage existing type system
5. **Document changes** - Update inline comments and JSDoc

### Priority Order

**Critical (Must Fix)**:
1. Issue 1: `selectDefaultFieldProps` - Core feature missing
2. Issue 2: `debounce: false` - Breaking expected behavior

**Major (Should Fix)**:
3. Issue 3: `disabled` property - Blocks condition functionality
4. Issue 4: Multi-field `isDisabled` - Limits condition expressiveness
5. Issue 5: Memory leak - Could cause production issues

**Medium (Consider Fixing)**:
6. Issue 6: Type safety - Could cause runtime crashes
7. Issue 7: Race condition - Could lead to inconsistent state

---

## Conclusion

The Formality codebase is well-architected with clear separation of concerns. The bugs identified in the PRD are valid and can be fixed by following existing patterns. The main challenges are:

1. **Issue 3 complexity** - Disabled state resolution from multiple sources
2. **Backward compatibility** - Ensuring fixes don't break existing behavior
3. **Test coverage** - Adding tests for previously untested features

The architectural patterns documented in this report provide a clear roadmap for implementing all fixes while maintaining consistency with the existing codebase.
