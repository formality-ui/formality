# File Mappings for Bug Fixes

**Generated:** 2026-01-10
**Purpose:** Exact file paths for each issue to implement

---

## Issue #1: React Ref Warnings in Test Output

**Severity:** Major
**Affected Files:** 8 test files

### Files to Modify

| # | File Path | Lines | Components to Fix |
|---|-----------|-------|-------------------|
| 1 | `packages/react/src/__tests__/Field.test.tsx` | 11-26 | `TestInput`, `TestSwitch` |
| 2 | `packages/react/src/__tests__/FieldGroup.test.tsx` | 11-33 | `TestInput`, `TestSwitch` |
| 3 | `packages/react/src/__tests__/Form.test.tsx` | 11 | `TestInput` |
| 4 | `packages/react/src/__tests__/FormalityProvider.test.tsx` | 19 | `TestInput` |
| 5 | `packages/react/src/__tests__/UnusedFields.test.tsx` | 11 | `TestInput` |
| 6 | `packages/react/src/__tests__/autosave-validation.test.tsx` | 27-36 | `TestInput`, `TestSwitch` |
| 7 | `packages/react/src/__tests__/render-isolation.test.tsx` | 19-33 | `TestInput`, `TestSwitch` |
| 8 | `packages/react/src/__tests__/integration/complete-form.test.tsx` | 14-49 | `TestInput`, `TestSwitch`, `TestSelect` |

### Fix Pattern

**Before:**
```typescript
const TestInput = ({ value, onChange, disabled, label, error, ...props }: any) => (
  <input ... />
);
```

**After:**
```typescript
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => (
    <input ref={ref} ... />
  )
);
TestInput.displayName = 'TestInput';
```

---

## Issue #2: FieldGroup Config Missing Warning

**Severity:** Major
**Affected Files:** 1 component file

### Files to Modify

| # | File Path | Lines | Description |
|---||---|---------------|-------------|
| 1 | `packages/react/src/components/FieldGroup.tsx` | 73-78 | Warning implementation |

### Current Implementation

**Location:** `packages/react/src/components/FieldGroup.tsx:73-78`

```typescript
if (process.env.NODE_ENV !== 'production' && !formConfig.groups?.[name]) {
  console.warn(
    `FieldGroup: No config found for group "${name}". ` +
      `Make sure to define it in formConfig.groups.`
  );
}
```

### Fix Options

**Option A:** Throw error in development mode
```typescript
if (process.env.NODE_ENV !== 'production' && !formConfig.groups?.[name]) {
  const availableGroups = Object.keys(formConfig.groups || {});
  throw new Error(
    `FieldGroup: No config found for group "${name}".\n` +
    `Available groups: ${availableGroups.join(', ') || 'none'}\n` +
    `Make sure to define it in formConfig.groups.`
  );
}
```

**Option B:** Keep warning but improve message
```typescript
if (process.env.NODE_ENV !== 'production' && !formConfig.groups?.[name]) {
  const availableGroups = Object.keys(formConfig.groups || {});
  console.warn(
    `FieldGroup: No config found for group "${name}".\n` +
    `Available groups: ${availableGroups.join(', ') || 'none'}\n` +
    `Make sure to define it in formConfig.groups.`
  );
}
```

---

## Issue #3: No Built-in Circular Dependency Detection

**Severity:** Major
**Affected Files:** 3 files (1 new utility, 2 existing)

### Files to Modify

| # | File Path | Lines | Description |
|---|-----------|-------|-------------|
| 1 | `packages/react/src/utils/cycleDetection.ts` | **NEW** | Create cycle detection utility |
| 2 | `packages/react/src/components/Form.tsx` | 212-230 | Add detection in `addSubscription` |
| 3 | `packages/react/src/utils/cycleDetection.test.ts` | **NEW** | Add tests for detection |

### Implementation Plan

**Step 1:** Create `packages/react/src/utils/cycleDetection.ts`
```typescript
export function wouldCreateCycle(
  graph: Map<string, Set<string>>,
  target: string,
  subscriber: string
): boolean {
  // DFS-based cycle detection
  // Returns true if adding edge (subscriber → target) creates a cycle
}

export function getCyclePath(
  graph: Map<string, Set<string>>,
  start: string
): string {
  // Returns the cycle path as a string: "A → B → C → A"
}
```

**Step 2:** Modify `packages/react/src/components/Form.tsx:212-230`
```typescript
import { wouldCreateCycle, getCyclePath } from '../utils/cycleDetection';

const addSubscription = useCallback((target: string, subscriber: string) => {
  // Check for circular dependency
  if (wouldCreateCycle(invertedSubscriptions.current, target, subscriber)) {
    // Temporarily add edge to get the cycle path
    const tempGraph = cloneGraph(invertedSubscriptions.current);
    if (!tempGraph.has(subscriber)) {
      tempGraph.set(subscriber, new Set());
    }
    tempGraph.get(subscriber)!.add(target);

    throw new Error(
      `[CircularDependencyError] Circular dependency detected in form subscriptions:\n` +
      `  ${getCyclePath(tempGraph, subscriber)}\n\n` +
      `This can cause infinite render loops and performance issues.\n\n` +
      `Possible solutions:\n` +
      `  - Refactor your field dependencies to break the circular reference\n` +
      `  - Use computed fields for derived values instead of subscriptions\n` +
      `  - Consider consolidating related fields into a FieldGroup\n` +
      `  - Review your subscribesTo configuration\n\n` +
      `Learn more: https://formality.dev/docs/circular-deps`
    );
  }

  // Update inverted index
  if (!invertedSubscriptions.current.has(target)) {
    invertedSubscriptions.current.set(target, new Set());
  }
  invertedSubscriptions.current.get(target)!.add(subscriber);

  // ... rest of implementation
}, []);
```

---

## Issue #4: UnusedFields Render Prop

**Severity:** Minor
**Status:** **ALREADY IMPLEMENTED**

**Finding:** The UnusedFields component already supports a render function for custom layouts.

**Location:** `packages/react/src/components/UnusedFields.tsx:54-86`

```typescript
if (children) {
  // Custom render function
  return (
    <>
      {sortedFields.map((name) =>
        children({
          name,
          component: <Field key={name} name={name} shouldRegister={false} />,
        })
      )}
    </>
  );
}
```

**Action:** No changes needed. Mark issue as resolved.

---

## Issue #5: Expression Error Handling Could Be More Configurable

**Severity:** Minor
**Affected Files:** 2 core files, 1 React file

### Files to Modify

| # | File Path | Lines | Description |
|---|-----------|-------|-------------|
| 1 | `packages/core/src/types/config.ts` | - | Add `onExpressionError` to config type |
| 2 | `packages/core/src/expression/evaluate.ts` | 248-252 | Use callback in error handler |
| 3 | `packages/react/src/components/FormalityProvider.tsx` | - | Pass callback to core |

### Implementation Plan

**Step 1:** Update type in `packages/core/src/types/config.ts`
```typescript
export interface FormalityConfig {
  validators?: Record<string, Validator>;
  parsers?: Record<string, Parser>;
  formatters?: Record<string, Formatter>;
  onExpressionError?: (expr: string, error: Error) => void; // NEW
}
```

**Step 2:** Modify `packages/core/src/expression/evaluate.ts:248-252`
```typescript
} catch (error) {
  // Call custom error handler if provided
  if (config.onExpressionError) {
    config.onExpressionError(expr, error as Error);
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn(`Expression evaluation error for "${expr}":`, error);
  }
  return undefined;
}
```

**Step 3:** Update `packages/react/src/components/FormalityProvider.tsx`
```typescript
interface FormalityProviderConfig {
  // ... existing props
  onExpressionError?: (expr: string, error: Error) => void;
}
```

---

## Issue #6: Validator/Parser/Formatter Not Found Warnings Could Be Errors

**Severity:** Minor
**Affected Files:** 3 core files

### Files to Modify

| # | File Path | Lines | Description |
|---|-----------|-------|-------------|
| 1 | `packages/core/src/validation/validate.ts` | 107-114 | Validator not found |
| 2 | `packages/core/src/transform/pipeline.ts` | 69-81 | Parser not found |
| 3 | `packages/core/src/transform/pipeline.ts` | 132-144 | Formatter not found |

### Fix Pattern

**Before:**
```typescript
if (!validator) {
  console.warn(`Validator "${spec}" not found in validators config`);
  return true; // Pass if validator not found
}
```

**After:**
```typescript
if (!validator) {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(
      `Validator "${spec}" not found in validators config.\n` +
      `Available validators: ${Object.keys(namedValidators || {}).join(', ') || 'none'}\n` +
      `Make sure to define it in your config.`
    );
  }
  return true; // Pass in production
}
```

**Apply same pattern to:**
- Parser not found (pipeline.ts:69-81)
- Formatter not found (pipeline.ts:132-144)

---

## Issue #7: Type Safety - SelectFunction Signature Could Be Stricter

**Severity:** Minor
**Affected Files:** 1 type definition file

### Files to Modify

| # | File Path | Lines | Description |
|---|-----------|-------|-------------|
| 1 | `packages/core/src/types/conditions.ts` | - | SelectFunction type definition |

### Current Type

```typescript
type SelectFunction<TReturn = unknown> = (
  formState: FormState,
  methods: UseFormReturn
) => TReturn;
```

### Enhanced Type

```typescript
type SelectFunction<
  TFields extends Record<string, any> = Record<string, any>,
  TReturn = unknown
> = (
  formState: FormState & { fields: TFields },
  methods: UseFormReturn<TFields>
) => TReturn;
```

---

## Issue #8: Auto-Save Debounce Configuration Validation

**Severity:** Minor
**Affected Files:** 1 React component file

### Files to Modify

| # | File Path | Lines | Description |
|---|-----------|-------|-------------|
| 1 | `packages/react/src/components/Form.tsx` | 136 | Add validation |

### Implementation

**Location:** `packages/react/src/components/Form.tsx:136`

**Before:**
```typescript
debounce?: number;
```

**After:** Add validation in component body
```typescript
interface FormProps<TFieldValues extends FieldValues> {
  debounce?: number | false;
  // ... other props
}

export function Form<TFieldValues extends FieldValues>({
  debounce = 500,
  ...props
}: FormProps<TFieldValues>) {
  // Validate debounce prop
  if (typeof debounce === 'number' && (debounce < 0 || !Number.isFinite(debounce))) {
    throw new Error(
      `Form: debounce must be a positive number or false, received: ${debounce}\n` +
      `Example: <Form debounce={1000}> or <Form debounce={false}>`
    );
  }

  // ... rest of component
}
```

---

## Issue #9: Field Order Property Type Could Be Stricter

**Severity:** Minor
**Affected Files:** 1 core file

### Files to Modify

| # | File Path | Lines | Description |
|---|-----------|-------|-------------|
| 1 | `packages/core/src/labels/resolve.ts` | 177-186 | sortFieldsByOrder function |

### Implementation

**Location:** `packages/core/src/labels/resolve.ts:177-186`

**Before:**
```typescript
export function sortFieldsByOrder(
  fieldNames: string[],
  fieldConfigs: Record<string, FieldConfig>
): string[] {
  return [...fieldNames].sort((a, b) => {
    const orderA = fieldConfigs[a]?.order ?? Infinity;
    const orderB = fieldConfigs[b]?.order ?? Infinity;
    return orderA - orderB;
  });
}
```

**After:** Add runtime validation
```typescript
export function sortFieldsByOrder(
  fieldNames: string[],
  fieldConfigs: Record<string, FieldConfig>
): string[] {
  return [...fieldNames].sort((a, b) => {
    const configA = fieldConfigs[a];
    const configB = fieldConfigs[b];

    // Validate order property
    if (configA?.order !== undefined && typeof configA.order !== 'number') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `sortFieldsByOrder: Field "${a}" has invalid order property: ${configA.order}. ` +
          `Order must be a number. Using Infinity.`
        );
      }
      configA.order = Infinity;
    }

    if (configB?.order !== undefined && typeof configB.order !== 'number') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `sortFieldsByOrder: Field "${b}" has invalid order property: ${configB.order}. ` +
          `Order must be a number. Using Infinity.`
        );
      }
      configB.order = Infinity;
    }

    const orderA = configA?.order ?? Infinity;
    const orderB = configB?.order ?? Infinity;
    return orderA - orderB;
  });
}
```

---

## Issue #10: Humanize Label Edge Cases

**Severity:** Minor
**Affected Files:** 1 core file + documentation

### Files to Modify

| # | File Path | Lines | Description |
|---|-----------|-------|-------------|
| 1 | `packages/core/src/labels/resolve.ts` | 21-46 | humanizeLabel function |
| 2 | `packages/core/src/labels/resolve.ts` | - | Add JSDoc comments |
| 3 | `packages/core/src/__tests__/labels.test.ts` | - | Add edge case tests |

### Current Implementation

**Location:** `packages/core/src/labels/resolve.ts:21-46`

```typescript
export function humanizeLabel(fieldName: string): string {
  // Empty string
  if (!fieldName) {
    return '';
  }

  // Handle special characters (preserve as-is with first letter capitalized)
  if (/[^a-zA-Z0-9]/.test(fieldName)) {
    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  }

  // Split on camelCase boundaries
  const words = fieldName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(' ');

  // Capitalize each word
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
```

### Enhancement: Add Documentation

```typescript
/**
 * Converts a field name into a human-readable label.
 *
 * @example
 * humanizeLabel('firstName')      // → "First Name"
 * humanizeLabel('userAge')        // → "User Age"
 * humanizeLabel('URL')            // → "Url" (Note: capitalization normalized)
 * humanizeLabel('field123name')   // → "Field123name" (Note: numbers not split)
 * humanizeLabel('x')              // → "X"
 *
 * @param fieldName - The field name to humanize
 * @returns The humanized label
 *
 * @remarks
 * - Special characters are preserved as-is (e.g., "field_name" → "Field_name")
 * - Consecutive numbers are NOT split (e.g., "field123name" → "Field123name")
 * - All-caps words are normalized (e.g., "URL" → "Url")
 * - Single-letter fields are capitalized (e.g., "x" → "X")
 *
 * For custom labels, use the `label` property in field config:
 * ```tsx
 * <Field name="userProfile" label="User Profile" />
 * ```
 */
export function humanizeLabel(fieldName: string): string {
  // ... implementation unchanged
}
```

### Add Edge Case Tests

**Location:** `packages/core/src/__tests__/labels.test.ts`

```typescript
describe('humanizeLabel edge cases', () => {
  it('should handle consecutive numbers', () => {
    expect(humanizeLabel('field123name')).toBe('Field123name');
    expect(humanizeLabel('test123')).toBe('Test123');
  });

  it('should handle all-caps words', () => {
    expect(humanizeLabel('URL')).toBe('Url'); // Normalized
    expect(humanizeLabel('userID')).toBe('User Id'); // Split on caps
  });

  it('should handle single letters', () => {
    expect(humanizeLabel('x')).toBe('X');
    expect(humanizeLabel('y')).toBe('Y');
  });

  it('should handle special characters', () => {
    expect(humanizeLabel('field_name')).toBe('Field_name'); // Preserved
    expect(humanizeLabel('field-name')).toBe('Field-name'); // Preserved
  });

  it('should handle empty string', () => {
    expect(humanizeLabel('')).toBe('');
  });
});
```

---

## Summary Matrix

| Issue | Severity | Files Modified | Lines Changed | Complexity |
|-------|----------|----------------|---------------|------------|
| #1 | Major | 8 test files | ~100 lines | Low |
| #2 | Major | 1 component | ~10 lines | Low |
| #3 | Major | 3 files (1 new) | ~150 lines | High |
| #4 | Minor | **NONE** | **Already implemented** | N/A |
| #5 | Minor | 3 files | ~30 lines | Medium |
| #6 | Minor | 3 files | ~30 lines | Low |
| #7 | Minor | 1 type file | ~10 lines | Low |
| #8 | Minor | 1 component | ~15 lines | Low |
| #9 | Minor | 1 utility | ~20 lines | Low |
| #10 | Minor | 2 files (1 test) | ~30 lines | Low |

**Total Estimated Effort:**
- **Major Issues:** ~260 lines (mostly Issue #3)
- **Minor Issues:** ~105 lines
- **Total:** ~365 lines across 22 files

**Testing Strategy:**
- All changes must maintain 329 passing tests
- Add new tests for Issue #3 (cycle detection)
- Add new tests for Issue #10 (edge cases)
- Verify no React warnings in test output (Issue #1)
