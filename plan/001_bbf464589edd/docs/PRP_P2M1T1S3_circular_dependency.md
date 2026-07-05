# PRP: Handle Circular Dependency in Field State Evaluation

**Work Item**: P2.M1.T1.S3 - Handle Circular Dependency
**Parent Task**: P2.M1.T1 - Resolve Disabled State
**Parent Milestone**: P2.M1 - Disabled Property in Field States
**Priority**: P2 (Major Issue)

---

## Goal

**Feature Goal**: Implement two-pass evaluation in `useConditions` to resolve the circular dependency where conditions need to know disabled state, but disabled state is computed from conditions.

**Deliverable**: Updated `/packages/react/src/hooks/useConditions.ts` with a robust two-pass evaluation pattern that:

1. Pass 1: Builds base field states **without** the `disabled` property
2. Pass 2: Computes `disabled` for each field using Pass 1 states for condition evaluation
3. Pass 3: Merges Pass 1 states with Pass 2 `disabled` values into final field states

**Success Definition**:

- Field states returned by `useConditions` include the `disabled` property for each field
- Two-pass evaluation prevents circular dependency (conditions use Pass 1 states without disabled)
- The `isDisabled` matcher in conditions now works correctly (can reference other fields' disabled state)
- No infinite loops or circular dependency errors
- Existing tests continue to pass
- No performance regression (isolated subscriptions maintained)
- Conditions that reference `isDisabled` matcher work properly

---

## User Persona (if applicable)

**Target User**: Developers using Formality UI form library

**Use Case**: Developers need to write conditions that reference the `disabled` state of other fields

**User Journey**:

1. Developer defines a field with conditions like `{ when: { field1: { isDisabled: true } }, disabled: true }`
2. The condition system evaluates whether field1 is disabled
3. Based on field1's disabled state, the current field becomes disabled
4. This creates a circular dependency that must be resolved via two-pass evaluation

**Pain Points Addressed**:

- Currently, field states don't include `disabled` property, so `isDisabled` matcher doesn't work
- Developers cannot write conditions based on whether other fields are disabled
- Multi-field disabled conditions are impossible without circular dependency resolution

---

## Why

- **Enables isDisabled Matcher**: The `isDisabled` matcher in conditions (lines 78-84 of evaluate.ts) currently returns `false` because `fieldState?.disabled` is always `undefined`

- **Supports Multi-Field Disabled Conditions**: Users need to write conditions like:

  ```typescript
  { when: { field1: { isDisabled: true }, field2: { isDisabled: true } }, disabled: true }
  ```

  This requires knowing the disabled state of other fields during condition evaluation.

- **Circular Dependency Challenge**: This creates a circular dependency:
  - Conditions need `disabled` in field states to evaluate `isDisabled` matcher
  - `disabled` comes from condition evaluation (via `useFieldDisabledState`)
  - Without resolution: **infinite loop** or stale values

- **Builds on Previous Work**:
  - P2.M1.T1.S1: Created `useFieldDisabledState` hook (COMPLETE)
  - P2.M1.T1.S2: Integrated disabled property into useConditions (IN PROGRESS)
  - P2.M1.T1.S3: Handles the circular dependency properly (THIS ITEM)

---

## What

Implement robust two-pass evaluation in `useConditions` hook at `/packages/react/src/hooks/useConditions.ts` to resolve the circular dependency between condition evaluation and disabled state computation.

### The Circular Dependency Problem

```
┌─────────────────────────────────────────────────────────────┐
│                     CIRCULAR DEPENDENCY                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Conditions need fieldStates.disabled ──────────┐           │
│                     │                            │           │
│                     ▼                            │           │
│  isDisabled matcher checks disabled state       │           │
│                     │                            │           │
│                     ▼                            │           │
│  Disabled state computed from conditions ───────┘           │
│                     │                                        │
│                     └──────────────────→ (INFINITE LOOP)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### The Two-Pass Solution

```
┌─────────────────────────────────────────────────────────────┐
│                    TWO-PASS EVALUATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PASS 1: Build base fieldStates (NO disabled)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ {                                                    │   │
│  │   field1: { value, isTouched, isDirty, error, ... } │   │
│  │   field2: { value, isTouched, isDirty, error, ... } │   │
│  │ }                                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  PASS 2: Compute disabled using Pass 1 states               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ {                                                    │   │
│  │   field1.disabled = evaluateConditions(field1)       │   │
│  │   field2.disabled = evaluateConditions(field2)       │   │
│  │ }                                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  PASS 3: Merge into final fieldStates                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ {                                                    │   │
│  │   field1: { value, ..., disabled: true }             │   │
│  │   field2: { value, ..., disabled: false }            │   │
│  │ }                                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Success Criteria

- [ ] Two-pass evaluation implemented in `useConditions` (Pass 1: base, Pass 2: disabled, Pass 3: merge)
- [ ] Field states include `disabled` property for each watched field
- [ ] Circular dependency resolved (conditions evaluate using Pass 1 states without disabled)
- [ ] `isDisabled` matcher in conditions works correctly
- [ ] useMemo dependencies properly configured (Pass 2 depends on Pass 1, Pass 3 depends on both)
- [ ] No Rules of Hooks violations (no hooks called in loops)
- [ ] All existing tests pass
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Answer**: Yes. This PRP provides:

- Exact file locations and line numbers for modifications
- Complete two-pass evaluation pattern with specific implementation guidance
- All necessary imports and type definitions
- Dependency ordering for useMemo hooks
- Validation commands specific to this project
- Known gotchas with solutions (Rules of Hooks, dependency ordering, etc.)
- Research documentation from external sources

### Documentation & References

```yaml
# MUST READ - Core implementation files

# TARGET FILE - The file to modify
- file: /home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts
  why: This is the file being modified - contains field states building loop
  exact: Lines 98-119 (fieldStates useMemo) - must be converted to two-pass pattern
  pattern: 4-step pattern: subscription inference, isolated watching, state building, memoization
  critical: Current implementation does NOT add disabled property (circular dependency workaround)
  modification: Replace single-pass fieldStates with three-pass: baseFieldStates, disabledStates, fieldStates

# CREATED IN S1 - Hook for disabled state computation (reference only)
- file: /home/dustin/projects/formality/packages/react/src/hooks/useFieldDisabledState.ts
  why: Shows two-pass pattern for priority resolution - use as reference
  exact: Lines 76-196 (three-pass: base sources, conditions, final resolution)
  pattern: Separate useMemo blocks for each pass, each depending on previous
  critical: This hook builds its own fieldStates WITHOUT disabled (lines 128-150)
  note: Do NOT call this hook in loops (Rules of Hooks violation)

# CORE TYPES - FieldStateInput definition
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Contains FieldStateInput type with disabled property
  exact: Lines 20-28
  definition: |
    export interface FieldStateInput {
      value: unknown;
      isTouched?: boolean;
      isDirty?: boolean;
      isValidating?: boolean;
      error?: unknown;
      invalid?: boolean;
      disabled?: boolean;  // ← Target property for two-pass evaluation
    }
  critical: disabled property is the target for integration

# CONDITION EVALUATION - How isDisabled matcher works
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Shows how isDisabled matcher consumes fieldState.disabled
  exact: Lines 78-84 (evaluateFieldMatcher function)
  pattern: if (matcher.isDisabled !== undefined) { const isFieldDisabled = fieldState?.disabled ?? false; ... }
  critical: Returns false when disabled is undefined - this is why two-pass is needed

# CONDITION EVALUATION - Main evaluate function
- file: /home/dustin/projects/formality/packages/core/src/conditions/evaluate.ts
  why: Main function that evaluates conditions - needs fieldStates with disabled
  exact: Lines 122-201 (evaluateConditions function)
  signature: |
    export function evaluateConditions(options: {
      conditions: ConditionDescriptor[];
      fieldValues: Record<string, unknown>;
      fieldStates: Record<string, FieldStateInput>;
      record?: Record<string, unknown>;
      props?: Record<string, unknown>;
    }): ConditionResult
  critical: fieldStates parameter must include disabled property for isDisabled matcher to work

# HELPER HOOK - For inferring field dependencies
- file: /home/dustin/projects/formality/packages/react/src/hooks/useInferredInputs.ts
  why: Used by useConditions to determine which fields to watch
  pattern: Infers from conditions, selectProps, defaultFieldProps, subscribesTo
  critical: Returns string[] of field names to watch

# FIELD CONFIG ACCESS - How to get field configuration
- file: /home/dustin/projects/formality/packages/react/context/ConfigContext.ts
  why: Contains field configuration including conditions for each field
  pattern: useConfig() hook returns config with fields object
  note: May need access to all field configs for computing disabled states

# RESEARCH DOCUMENTATION
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T1S3/research/two_pass_evaluation.md
  why: Comprehensive research on two-pass evaluation patterns
  section: Pattern 1: Two-Pass Field State Building

- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T1S3/research/circular_dependency_patterns.md
  why: Research on circular dependency resolution in reactive systems
  section: Actionable Patterns and Implementation Guidance

# EXTERNAL DOCUMENTATION
- url: https://react.dev/reference/react/useMemo
  why: Official React documentation on useMemo - essential for correct dependency arrays
  section: Usage, Reference

- url: https://react.dev/learn/you-might-not-need-an-effect
  why: Official React guidance on derived state - use useMemo not useEffect
  critical: "Derived state" section shows disabled should be computed, not stored

- url: https://react-hook-form.com/docs/useform/getfieldstate
  why: getFieldState documentation - explains non-reactive state access pattern
  critical: "This will return the isolate formState without re-rendering"

- url: https://react-hook-form.com/docs/usewatch
  why: useWatch documentation - shows isolated subscription pattern
  critical: useWatch with array of names returns array of values

# PREVIOUS PRP - Contract dependencies
- docfile: plan/001_bbf464589edd/bugfix/001_7b007b20a2ac/P2M1T1S2/PRP.md
  why: Previous subtask that integrates disabled into useConditions
  note: Assumes S2 will be implemented - this PRP builds on that foundation
  critical: S2 implements basic two-pass pattern; S3 refines for full circular dependency handling
```

### Current Codebase tree (react package hooks)

```bash
packages/react/src/hooks/
├── useConditions.ts              # ← TARGET FILE FOR MODIFICATION
├── useFieldDisabledState.ts      # ← Created in S1 (reference for patterns)
├── useInferredInputs.ts          # Helper for dependency inference
├── useFormState.ts               # Form state hook
├── usePropsEvaluation.ts         # Props evaluation hook
└── useSubscriptions.ts           # Subscription management
```

### Desired Codebase tree with files to be modified

```bash
packages/react/src/hooks/
├── useConditions.ts              # ← MODIFY: Add two-pass evaluation with disabled property
│   ├── Pass 1: baseFieldStates (without disabled) - EXISTING PATTERN
│   ├── Pass 2: disabledStates via evaluateConditions - NEW
│   ├── Pass 3: fieldStates merge (base + disabled) - NEW
│   └── Updated evaluateConditions call to use new fieldStates
├── useFieldDisabledState.ts      # ← NO CHANGE (created in S1)
└── [other hooks - no change]
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Rules of Hooks - Cannot call hooks in loops
// WRONG:
watchFields.forEach((field) => {
  const isDisabled = useFieldDisabledState({ fieldName: field }); // ❌
});
// RIGHT: Call evaluateConditions directly (it's a pure function)
watchFields.forEach((field) => {
  const result = evaluateConditions({
    /* ... */
  }); // ✅
});

// CRITICAL: useWatch with array of names returns array of values, not object
// WRONG: const watchedValues = useWatch({ control, name: ['field1', 'field2'] });
//        const value1 = watchedValues.field1; // undefined!
// RIGHT: const value1 = watchedValues[0]; // array access

// CRITICAL: getFieldState() does NOT create subscriptions - prevents re-renders
// Use it in useMemo for field metadata (isTouched, isDirty, error, invalid)
// DO NOT use useFormState() - this subscribes to entire form state

// CRITICAL: Circular dependency prevention
// Pass 1 fieldStates must NOT include disabled property
// Pass 2 uses Pass 1 states to evaluate conditions
// This breaks the cycle: conditions → disabled → conditions

// CRITICAL: useMemo dependency ordering matters for two-pass evaluation
// Pass 2 useMemo must depend on Pass 1 result
// Pass 3 useMemo must depend on Pass 1 AND Pass 2 results
// Missing dependencies cause stale closures or infinite loops

// GOTCHA: Getting field conditions for each field
// useConditions only receives conditions for the CALLING field
// To compute disabled for ALL watched fields, need conditions for EACH field
// May need to: 1) Add allFieldsConfig parameter, 2) Use ConfigContext, or 3) Limit to current field

// GOTCHA: evaluateConditions needs field config for each field's conditions array
// Current useConditions signature: { conditions, subscribesTo?, props? }
// May need to extend to: { conditions, subscribesTo?, props?, allFieldsConfig? }

// GOTCHA: Empty conditions array handling
// When a field has no conditions, evaluateConditions returns default values
// disabled: undefined needs to be handled: disabled ?? false
```

---

## Implementation Blueprint

### Data models and structure

No new data models - using existing types from core and react packages.

```typescript
// Existing types from @formality-ui/core
import type {
  ConditionDescriptor,
  ConditionResult,
  FieldStateInput,
} from "@formality-ui/core";

// Existing hook interface (may need extension)
interface UseConditionsOptions {
  conditions: ConditionDescriptor[];
  subscribesTo?: string[];
  props?: Record<string, unknown>;
  // POTENTIAL ADDITION: allFieldsConfig for accessing all field conditions
  allFieldsConfig?: Record<string, { conditions?: ConditionDescriptor[] }>;
}

// FieldStateInput type (from core) - disabled property exists but not populated
export interface FieldStateInput {
  value: unknown;
  isTouched?: boolean;
  isDirty?: boolean;
  isValidating?: boolean;
  error?: unknown;
  invalid?: boolean;
  disabled?: boolean; // ← Target property for two-pass evaluation
}

// ConditionResult type (from core) - returned by evaluateConditions
export interface ConditionResult {
  disabled?: boolean;
  visible?: boolean;
  setValue?: unknown;
  hasDisabledCondition: boolean;
  hasVisibleCondition: boolean;
  hasSetCondition: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ANALYZE current useConditions implementation
  - READ: /home/dustin/projects/formality/packages/react/src/hooks/useConditions.ts
  - IDENTIFY: Lines 98-119 (current fieldStates useMemo - single pass)
  - UNDERSTAND: Current pattern builds fieldStates without disabled property
  - NOTE: watchFields, fieldValues, methods, record are available in scope
  - OUTPUT: Clear understanding of what needs to change

Task 2: DESIGN two-pass evaluation approach
  - DECIDE: How to get field conditions for each watched field
  - OPTIONS:
    A) Add allFieldsConfig parameter to useConditions (API change, most complete)
    B) Use ConfigContext to access field configs internally (no API change)
    C) Limit to current field's conditions only (simplest, less functional)
  - DECISION: Start with Option A (allFieldsConfig parameter) for complete functionality
  - ALTERNATIVE: If API change is undesirable, use Option B (ConfigContext)

Task 3: CREATE Pass 1 - Base field states (without disabled)
  - RENAME: Existing fieldStates useMemo to baseFieldStates
  - PRESERVE: All existing logic (lines 98-119)
  - ENSURE: disabled property is NOT added (maintain existing behavior)
  - DEPENDENCIES: [watchFields, fieldValues, methods]
  - PATTERN: |
    const baseFieldStates = useMemo(() => {
      const states: Record<string, FieldStateInput> = {};
      if (watchFields.length === 0) return states;
      watchFields.forEach((fieldName) => {
        const fieldState = methods.getFieldState(fieldName as any);
        states[fieldName] = {
          value: fieldValues[fieldName],
          isTouched: fieldState.isTouched,
          isDirty: fieldState.isDirty,
          error: fieldState.error,
          invalid: fieldState.invalid,
          isValidating: false,
          // ❌ NO disabled property - this breaks the cycle
        };
      });
      return states;
    }, [watchFields, fieldValues, methods]);

Task 4: EXTEND useConditions interface (if using Option A)
  - MODIFY: UseConditionsOptions interface to include allFieldsConfig
  - ADD: allFieldsConfig?: Record<string, { conditions?: ConditionDescriptor[] }>
  - DEFAULT: undefined for backward compatibility
  - LOCATION: Top of useConditions.ts file, interface definition
  - NOTE: This allows access to all field conditions for computing disabled states

Task 5: CREATE Pass 2 - Compute disabled states for each field
  - IMPLEMENT: New useMemo to compute disabled for each field
  - CALL: evaluateConditions for each field (NOT useFieldDisabledState - Rules of Hooks)
  - INPUT: baseFieldStates from Pass 1 (without disabled)
  - GET: conditions for each field from allFieldsConfig parameter
  - PATTERN: |
    const disabledStates = useMemo(() => {
      const disabled: Record<string, boolean> = {};
      if (watchFields.length === 0) return disabled;

      watchFields.forEach((fieldName) => {
        // Get conditions for this field
        const fieldConditions = allFieldsConfig?.[fieldName]?.conditions || [];

        // Evaluate conditions using Pass 1 states (without disabled)
        const result = evaluateConditions({
          conditions: fieldConditions,
          fieldValues,
          fieldStates: baseFieldStates, // ← Use Pass 1 states!
          record,
          props: { name: fieldName },
        });

        disabled[fieldName] = result.disabled ?? false;
      });

      return disabled;
    }, [watchFields, allFieldsConfig, fieldValues, baseFieldStates, record]);
  - CRITICAL: Uses evaluateConditions directly (pure function), not useFieldDisabledState (hook)

Task 6: CREATE Pass 3 - Merge base states with disabled
  - IMPLEMENT: New useMemo to merge baseFieldStates with disabledStates
  - COMBINE: Each field state gets disabled property added
  - PATTERN: |
    const fieldStates = useMemo(() => {
      return Object.entries(baseFieldStates).reduce(
        (acc, [fieldName, state]) => {
          acc[fieldName] = {
            ...state,
            disabled: disabledStates[fieldName],
          };
          return acc;
        },
        {} as Record<string, FieldStateInput>
      );
    }, [baseFieldStates, disabledStates]);

Task 7: UPDATE evaluateConditions call to use new fieldStates
  - FIND: Lines 122-142 (final useMemo that calls evaluateConditions)
  - REPLACE: fieldStates → new fieldStates with disabled property from Pass 3
  - VERIFY: Dependencies include fieldStates from Pass 3
  - ENSURE: isDisabled matcher now works because fieldStates includes disabled

Task 8: HANDLE current field's conditions specially (if needed)
  - PROBLEM: Current field's conditions are passed separately as parameter
  - SOLUTION: For current field, use conditions parameter; for other fields, use allFieldsConfig
  - IMPLEMENTATION: In Pass 2, check if fieldName matches current field
  - PATTERN: |
    const fieldConditions = (fieldName === currentFieldName)
      ? conditions  // Use the conditions parameter for current field
      : allFieldsConfig?.[fieldName]?.conditions || [];  // Use config for other fields

Task 9: VERIFY TYPE SAFETY
  - CHECK: FieldStateInput type includes disabled property
  - VERIFY: fieldStates return type matches ConditionResult expectation
  - ADD: allFieldsConfig parameter to UseConditionsOptions interface
  - RUN: pnpm typecheck

Task 10: UPDATE EXPORT (if needed)
  - CHECK: useConditions is exported from hooks index
  - VERIFY: No export changes needed (function signature extension is backward compatible)

Task 11: UPDATE CONSUMERS (if API changed)
  - FIND: All places that call useConditions
  - UPDATE: Add allFieldsConfig parameter where needed
  - VERIFY: Backward compatibility (undefined default value)

Task 12: RUN VALIDATION
  - RUN: pnpm lint --fix
  - RUN: pnpm typecheck
  - RUN: pnpm test (packages/react tests)
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL: Two-pass evaluation pattern to break circular dependency
// ============================================================================

// ============================================================================
// PROBLEM: Circular dependency
// ============================================================================
// Conditions need to check isDisabled matcher
// isDisabled matcher needs fieldState.disabled
// fieldState.disabled comes from condition evaluation
// This creates: conditions → disabled → conditions (infinite loop)

// ============================================================================
// SOLUTION: Two-pass evaluation
// ============================================================================

// Pass 1: Build base field states WITHOUT disabled property
// This breaks the cycle - conditions can use these states for evaluation
const baseFieldStates = useMemo(() => {
  const states: Record<string, FieldStateInput> = {};

  if (watchFields.length === 0) {
    return states;
  }

  watchFields.forEach((fieldName) => {
    // getFieldState() reads current state without creating subscriptions
    const fieldState = methods.getFieldState(fieldName as any);
    states[fieldName] = {
      value: fieldValues[fieldName],
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      error: fieldState.error,
      invalid: fieldState.invalid,
      isValidating: false,
      // ❌ NO disabled property - this is critical for Pass 1
    };
  });

  return states;
}, [watchFields, fieldValues, methods]);

// Pass 2: Compute disabled for each field using Pass 1 states
// IMPORTANT: We use baseFieldStates (without disabled) for condition evaluation
// This prevents the circular dependency
const disabledStates = useMemo(() => {
  const disabled: Record<string, boolean> = {};

  if (watchFields.length === 0) {
    return disabled;
  }

  watchFields.forEach((fieldName) => {
    // Get conditions for this specific field
    const fieldConditions = allFieldsConfig?.[fieldName]?.conditions || [];

    // Evaluate conditions using Pass 1 states (without disabled)
    const result = evaluateConditions({
      conditions: fieldConditions,
      fieldValues,
      fieldStates: baseFieldStates, // ← Use Pass 1 states!
      record,
      props: { name: fieldName },
    });

    disabled[fieldName] = result.disabled ?? false;
  });

  return disabled;
}, [watchFields, allFieldsConfig, fieldValues, baseFieldStates, record]);

// Pass 3: Merge base states with disabled into final field states
// This is the final fieldStates object that includes all properties
const fieldStates = useMemo(() => {
  return Object.entries(baseFieldStates).reduce(
    (acc, [fieldName, state]) => {
      acc[fieldName] = {
        ...state,
        disabled: disabledStates[fieldName],
      };
      return acc;
    },
    {} as Record<string, FieldStateInput>,
  );
}, [baseFieldStates, disabledStates]);

// ============================================================================
// GOTCHA: Rules of Hooks - Cannot call hooks in loops
// ============================================================================
// WRONG: This will fail React's Rules of Hooks
// watchFields.forEach((field) => {
//   const isDisabled = useFieldDisabledState({ fieldName: field }); // ❌
// });

// RIGHT: Call evaluateConditions directly (it's a pure function)
// OR: Restructure to call hook once per component (not in loop)

// ============================================================================
// GOTCHA: useMemo dependency ordering
// ============================================================================
// Pass 2 must depend on Pass 1 result
// Pass 3 must depend on Pass 1 AND Pass 2 results
// This ensures correct evaluation order when values change

// ============================================================================
// GOTCHA: Handling current field vs other fields
// ============================================================================
// The current field's conditions are passed as the `conditions` parameter
// Other fields' conditions come from `allFieldsConfig`
// Need to handle both cases in Pass 2

// ============================================================================
// PATTERN: Non-reactive state access with getFieldState
// ============================================================================
// getFieldState() does NOT create subscriptions
// Use it in useMemo for field metadata
// DO NOT use useFormState() - it subscribes to entire form state
const fieldState = methods.getFieldState(fieldName as any);
// Returns: { invalid, isDirty, isTouched, error } without triggering re-render

// ============================================================================
// PATTERN: Evaluate conditions for each field
// ============================================================================
// evaluateConditions is a PURE FUNCTION from core package
// Can be called anywhere (including in loops)
// Returns ConditionResult with disabled, visible, setValue properties

// ============================================================================
// PATTERN: Default value handling for disabled
// ============================================================================
// When a field has no conditions, evaluateConditions returns:
// { disabled: undefined, hasDisabledCondition: false, ... }
// Convert undefined to false: result.disabled ?? false
```

### Integration Points

```yaml
HOOKS:
  - modify: packages/react/src/hooks/useConditions.ts
    change: Add two-pass evaluation for disabled property in fieldStates
    lines: 98-119 (existing fieldStates → baseFieldStates + disabledStates + fieldStates)
    add: Pass 1 (baseFieldStates), Pass 2 (disabledStates), Pass 3 (merge)
    import: No new imports needed (evaluateConditions already imported)
    parameter: Add allFieldsConfig?: Record<string, { conditions?: ConditionDescriptor[] }>

TYPES:
  - no_change: FieldStateInput already has disabled?: boolean property
  - verify: @formality-ui/core exports FieldStateInput correctly
  - check: disabled property is used in isDisabled matcher (evaluate.ts:78-84)
  - extend: UseConditionsOptions interface to include allFieldsConfig parameter

CONDITION EVALUATION:
  - modify: evaluateConditions call (lines 122-142)
    change: Use new fieldStates with disabled property from Pass 3
    effect: isDisabled matcher now works correctly

FIELD COMPONENT:
  - no_change: Field component continues to use its own disabled resolution
  - future: Field could potentially use fieldStates.disabled from useConditions
  - note: This integration is about field STATES, not Field component

CONSUMERS:
  - find: All files that call useConditions
  - update: Add allFieldsConfig parameter where conditions need to reference other fields
  - backward_compatible: allFieldsConfig is optional with undefined default
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
pnpm lint --fix
pnpm typecheck

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test useConditions hook specifically
pnpm test packages/react/src/__tests__/useConditions.test.tsx -v
pnpm test packages/react/src/__tests__/useFieldDisabledState.test.tsx -v

# Full react package tests
pnpm test --filter @formality-ui/react -v

# Coverage validation (if coverage tools available)
pnpm test --coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test field dependencies example (uses conditions)
pnpm test examples/05-field-dependencies.test.tsx -v

# Test conditions example
pnpm test examples/03-conditions.test.tsx -v

# Manual testing if needed:
# 1. Create a form with isDisabled matcher in conditions
# 2. Verify field states include disabled property
# 3. Verify conditions can reference other fields' disabled state
# 4. Test circular dependency: field1.disabled depends on field2.value, field2.disabled depends on field1.disabled

# Expected: All integrations working, disabled property populated in field states
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Test two-pass evaluation specifically
# Create test that verifies:
# 1. Pass 1 fieldStates don't have disabled
# 2. Pass 2 computes disabled correctly
# 3. Pass 3 merges them into final fieldStates

# Test circular dependency prevention
# 1. Create conditions that reference isDisabled
# 2. Verify no infinite loop occurs
# 3. Verify disabled states are computed correctly

# Test isDisabled matcher functionality
# 1. Create condition: { when: { field1: { isDisabled: true } }, disabled: true }
# 2. Disable field1 via prop/config
# 3. Verify current field becomes disabled
# 4. Verify no infinite loop

# Performance validation
# 1. Verify isolated subscriptions still work (no cascading re-renders)
# 2. Profile with React DevTools if available

# Expected: Two-pass evaluation works, no circular dependency, no performance regression
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `pnpm test --filter @formality-ui/react`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`
- [ ] Two-pass evaluation implemented correctly (Pass 1, Pass 2, Pass 3)
- [ ] Circular dependency resolved (conditions use Pass 1 states)
- [ ] No Rules of Hooks violations (evaluateConditions called, not useFieldDisabledState)

### Feature Validation

- [ ] Field states include `disabled` property for each watched field
- [ ] `isDisabled` matcher in conditions works correctly
- [ ] Conditions can reference other fields' disabled state
- [ ] No infinite loops or circular dependency issues
- [ ] Isolated subscriptions maintained (no performance regression)
- [ ] allFieldsConfig parameter works correctly (if implemented)

### Code Quality Validation

- [ ] Follows existing hook patterns (useConditions structure maintained)
- [ ] useMemo dependencies properly configured (Pass 2 → Pass 1, Pass 3 → Pass 1 + Pass 2)
- [ ] No Rules of Hooks violations
- [ ] Code is self-documenting with clear variable names (baseFieldStates, disabledStates, fieldStates)
- [ ] Comments explain two-pass evaluation pattern
- [ ] Error handling for edge cases (empty watchFields, undefined conditions)

### Documentation & Deployment

- [ ] JSDoc comments updated if function signature changed
- [ ] Type exports verified (FieldStateInput with disabled)
- [ ] Backward compatibility maintained (allFieldsConfig is optional)
- [ ] Integration notes documented for consumers

---

## Anti-Patterns to Avoid

- ❌ **Don't call hooks in loops** - Cannot call `useFieldDisabledState` in forEach loop (Rules of Hooks)
- ❌ **Don't skip two-pass evaluation** - Will cause circular dependency (infinite loop)
- ❌ **Don't add disabled to Pass 1 states** - Defeats the purpose of two-pass evaluation
- ❌ **Don't use useFormState()** - Causes unwanted subscriptions, use getFieldState() instead
- ❌ **Don't forget useMemo dependencies** - Missing dependencies cause stale closures or infinite loops
- ❌ **Don't assume all fields have conditions** - Handle undefined/empty conditions gracefully
- ❌ **Don't break existing API without backward compatibility** - Make allFieldsConfig optional
- ❌ **Don't ignore type errors** - FieldStateInput.disabled must be boolean | undefined
- ❌ **Don't create new subscriptions** - Field states should use existing watchFields
- ❌ **Don't use disabled from Pass 1 states** - Pass 1 states don't have disabled (that's the point!)

---

## Related Work Items

- **Previous**: P2.M1.T1.S1 - Create useFieldDisabledState hook (COMPLETED)
- **Previous**: P2.M1.T1.S2 - Integrate disabled into useConditions (IN PROGRESS / assumed complete)
- **Current**: P2.M1.T1.S3 - Handle circular dependency (THIS ITEM)
- **Related**: P2.M1.T2.S1 - Verify FieldStateInput type (uses disabled property added by this work)
- **Future**: P2.M2.T1 - Modify Condition Evaluation for Multi-Field isDisabled

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Reasoning**:

- Two-pass evaluation pattern is well-researched and documented
- Existing codebase shows similar patterns in useFieldDisabledState
- Clear target location and implementation approach
- Known gotchas identified with solutions provided
- Validation commands are project-specific and tested
- Comprehensive research documentation available

**Deduction (10→9)**:

- **(-1)** API design question: Whether to add allFieldsConfig parameter vs use ConfigContext (both options provided)

---

## References

### Internal Documentation

- [useFieldDisabledState Hook](../../../../packages/react/src/hooks/useFieldDisabledState.ts) - Hook created in S1, pattern reference
- [useConditions Hook](../../../../packages/react/src/hooks/useConditions.ts) - Target file for modification
- [FieldStateInput Type](../../../../packages/core/src/conditions/evaluate.ts) - Type definition with disabled property
- [isDisabled Matcher](../../../../packages/core/src/conditions/evaluate.ts) - Lines 78-84, consumes disabled state
- [P2.M1.T1.S1 PRP](../P2M1T1S1/PRP.md) - Previous subtask creating the hook
- [P2.M1.T1.S2 PRP](../P2M1T1S2/PRP.md) - Previous subtask integrating disabled property

### Research Documentation

- [Two-Pass Evaluation Research](./research/two_pass_evaluation.md) - Detailed research on two-pass patterns
- [Circular Dependency Patterns](./research/circular_dependency_patterns.md) - Circular dependency resolution strategies
- [React Memoization Patterns](./research/react_memoization_patterns.md) - useMemo best practices
- [Field Component Analysis](./research/field_component_patterns.md) - How Field currently consumes disabled

### External Documentation

- [React useMemo Reference](https://react.dev/reference/react/useMemo) - Official useMemo documentation
- [React Derived State](https://react.dev/learn/you-might-not-need-an-effect) - Derived state patterns
- [React Hook Form getFieldState](https://react-hook-form.com/docs/useform/getfieldstate) - Non-reactive state access
- [React Hook Form useWatch](https://react-hook-form.com/docs/usewatch) - Isolated subscriptions

### Example Code

- [Field Dependencies Example](../../../../examples/05-field-dependencies.tsx) - Shows condition usage patterns
- [Conditions Example](../../../../examples/03-conditions.tsx) - Basic condition evaluation
