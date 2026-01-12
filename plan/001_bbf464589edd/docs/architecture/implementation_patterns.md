# Implementation Patterns & Code Conventions

**Generated:** 2026-01-10
**Purpose:** Ensure consistent code patterns across all bug fixes

---

## Error Handling Patterns

### Development vs Production Mode

**Pattern:**

```typescript
if (process.env.NODE_ENV !== "production") {
  // Throw errors for developer-facing issues
  throw new Error(`Configuration error: ${message}`);
} else {
  // Graceful degradation in production
  console.warn(message);
  return fallbackValue;
}
```

**Use Cases:**

- Missing validators/parsers/formatters
- Invalid field configuration
- Circular dependencies

**Example from Codebase:**

```typescript
// packages/core/src/validation/validate.ts:107-114
if (typeof spec === "string") {
  if (!namedValidators) {
    console.warn(
      `Named validator "${spec}" requested but no validators provided`,
    );
    return true; // Pass if no validators configured
  }

  const validator = resolveNamedValidator(spec, namedValidators);
  if (!validator) {
    console.warn(`Validator "${spec}" not found in validators config`);
    return true; // Pass if validator not found
  }
}
```

### Console Warn Pattern

**Current Convention:**

```typescript
if (process.env.NODE_ENV !== "production") {
  console.warn(
    `ComponentName: Clear message about the issue.\n` +
      `Suggestion: How to fix it.`,
  );
}
```

**Example:**

```typescript
// packages/react/src/components/FieldGroup.tsx:73-78
if (process.env.NODE_ENV !== "production" && !formConfig.groups?.[name]) {
  console.warn(
    `FieldGroup: No config found for group "${name}". ` +
      `Make sure to define it in formConfig.groups.`,
  );
}
```

---

## TypeScript Type Patterns

### Generic Component Types

**Pattern for forwardRef:**

```typescript
interface ComponentProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  name: string;
}

const Component = forwardRef<HTMLInputElement, ComponentProps>((props, ref) => {
  // Implementation
});

Component.displayName = "Component";
```

### Generic Function Types

**Pattern:**

```typescript
type SelectFunction<TReturn = unknown> = (
  formState: FormState,
  methods: UseFormReturn,
) => TReturn;
```

**Enhancement (Issue #7):**

```typescript
type SelectFunction<TFields extends Record<string, any>, TReturn = unknown> = (
  formState: FormState & { fields: TFields },
  methods: UseFormReturn,
) => TReturn;
```

---

## Test Component Patterns

### Standard Test Input Structure

**Current Pattern (to be updated):**

```typescript
const TestInput = ({ value, onChange, disabled, label, error, ...props }: any) => (
  <div data-testid={`field-wrapper-${props.name}`}>
    {label && <label htmlFor={props.name}>{label}</label>}
    <input
      id={props.name}
      data-testid={props.name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-invalid={!!error}
      {...props}
    />
    {error && <span data-testid={`${props.name}-error`}>{error}</span>}
  </div>
);
```

**Updated Pattern (with forwardRef):**

```typescript
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => {
    return (
      <div data-testid={`field-wrapper-${name}`}>
        {label && <label htmlFor={name}>{label}</label>}
        <input
          ref={ref}
          id={name}
          data-testid={name}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error}
          {...props}
        />
        {error && <span data-testid={`${name}-error`}>{error}</span>}
      </div>
    );
  }
);

TestInput.displayName = 'TestInput';
```

### Test Setup Pattern

**All test files should:**

1. Import test utilities from `@testing-library/react`
2. Use `setup` file for global configuration
3. Clean up after each test (automatic with vitest + @testing-library)
4. Use descriptive test names

**Example:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Form, Field } from '@formality-ui/react';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const mockConfig = { /* ... */ };

    // Act
    render(<Form config={mockConfig}>...</Form>);
    fireEvent.click(screen.getByTestId('button'));

    // Assert
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## Component Implementation Patterns

### Functional Component Structure

**Standard Pattern:**

```typescript
import { useCallback, useMemo, useEffect } from 'react';

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. Context access
  const { contextValue } = useContext(SomeContext);

  // 2. Memoized values
  const derivedValue = useMemo(() => {
    return expensiveCalculation(prop1, contextValue);
  }, [prop1, contextValue]);

  // 3. Callback functions
  const handleChange = useCallback((value: any) => {
    // Handle change
  }, [dependencies]);

  // 4. Effects
  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  // 5. Render
  return <div>{/* JSX */}</div>;
}
```

### Context Provider Pattern

**Form Context Pattern:**

```typescript
interface FormContextValue {
  // Methods
  addSubscription: (target: string, subscriber: string) => void;
  removeSubscription: (target: string, subscriber: string) => void;

  // State
  invertedSubscriptions: Map<string, Set<string>>;
  watcherSetters: Map<string, React.Dispatch<React.SetStateAction<any>>>;
}

export const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within Form");
  }
  return context;
}
```

### Custom Hook Pattern

**Hook Structure:**

```typescript
export function useSubscriptions({
  fieldName,
  subscribesTo,
  formState,
}: UseSubscriptionsParams): void {
  const { addSubscription, removeSubscription } = useFormContext();

  useEffect(() => {
    // Subscribe to dependencies
    subscribesTo.forEach((target) => {
      addSubscription(target, fieldName);
    });

    // Cleanup: unsubscribe on unmount
    return () => {
      subscribesTo.forEach((target) => {
        removeSubscription(target, fieldName);
      });
    };
  }, [fieldName, subscribesTo, addSubscription, removeSubscription]);
}
```

---

## Validation Patterns

### Validator Structure

**Named Validator:**

```typescript
const validators = {
  required: (value: any) => {
    if (value === undefined || value === null || value === "") {
      return "This field is required";
    }
    return true;
  },

  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return true;
  },

  email: (value: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Must be a valid email address";
    }
    return true;
  },
};
```

### Async Validator Pattern

```typescript
const asyncValidators = {
  uniqueEmail: async (value: string) => {
    const response = await fetch(`/api/check-email?email=${value}`);
    const data = await response.json();

    if (data.exists) {
      return "Email is already taken";
    }
    return true;
  },
};
```

---

## Expression Evaluation Patterns

### Expression Type Safety

**Pattern:**

```typescript
import { evaluate } from "@formality-ui/core";

// Type-safe expression evaluation
const result = evaluate("form.values.user.age > 18", {
  form: {
    values: {
      user: { age: 25 },
    },
  },
}); // Returns: true

// Error handling
const invalidResult = evaluate("form.values.nonExistent.field", context); // Returns: undefined (with console.warn)
```

### Expression Context Building

**Pattern:**

```typescript
function buildExpressionContext(formState: FormState, methods: UseFormReturn) {
  return {
    form: {
      values: formState.values, // Use recordValues for subscription checks
      state: formState,
      errors: formState.errors,
    },
    methods: {
      setValue: methods.setValue,
      trigger: methods.trigger,
      getValues: methods.getValues,
    },
    utils: {
      hasValue: (fieldName: string) => {
        const value = get(formState.values, fieldName);
        return value !== undefined && value !== null && value !== "";
      },
    },
  };
}
```

---

## Performance Patterns

### Memoization Strategy

**When to Memoize:**

- ✅ Expensive calculations (expression evaluation, complex sorting)
- ✅ Array/object transformations (field sorting, filtering)
- ❌ Simple value access (use raw values)

**Pattern:**

```typescript
const sortedFields = useMemo(() => {
  return sortFieldsByOrder(fieldNames, config);
}, [fieldNames, config]);

const proxyState = useMemo(() => {
  return makeProxyState(formState, watcherSetters);
}, [formState, watcherSetters]);
```

### Callback Optimization

**Pattern:**

```typescript
const addSubscription = useCallback((target: string, subscriber: string) => {
  // Implementation
}, []); // Empty deps if no external dependencies

const handleSubmit = useCallback(
  async (data: FormValues) => {
    await onSubmit(data);
  },
  [onSubmit],
);
```

---

## File Organization

### Core Package Structure

```
packages/core/src/
├── conditions/      # Condition evaluation
├── config/          # Configuration management
├── expression/      # Expression parsing & evaluation
├── labels/          # Label resolution
├── transform/       # Value transformation pipeline
├── types/           # TypeScript type definitions
├── validation/      # Validation pipeline
├── __tests__/       # Core tests
└── index.ts         # Main export
```

### React Package Structure

```
packages/react/src/
├── components/      # React components
├── context/         # React contexts
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── __tests__/       # React tests
├── types.ts         # React-specific types
└── index.ts         # Main export
```

---

## Naming Conventions

### Component Naming

- **PascalCase** for components: `Form`, `Field`, `FieldGroup`
- **camelCase** for hooks: `useFormState`, `useSubscriptions`
- **camelCase** for utilities: `sortFieldsByOrder`, `humanizeLabel`

### File Naming

- **Components:** `Form.tsx`, `Field.tsx` (PascalCase)
- **Hooks:** `useFormState.ts` (camelCase with use prefix)
- **Utilities:** `makeProxyState.ts` (camelCase)
- **Types:** `types.ts`, `config.ts` (camelCase)

### Test Naming

- **Test Files:** `Form.test.tsx`, `useFormState.test.ts` (matches source)
- **Test Descriptions:** `should [verb] [expected outcome]`
  - ✅ `should validate only changed fields`
  - ❌ `test validation`

---

## Git Commit Patterns

**Commit Message Format:**

```
type(scope): brief description

Detailed explanation (optional)

Refs: #issue-number
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/config changes

**Examples:**

```
fix(react): add circular dependency detection in subscriptions

Implements DFS-based cycle detection to prevent infinite render loops
when developers create circular subscribesTo configurations.

Refs: #3

feat(core): add configurable expression error handling

Allows applications to customize how expression errors are handled
through onExpressionError callback in FormalityProviderConfig.

Refs: #5
```

---

## Code Quality Standards

### TypeScript Strict Mode

- All code must compile with `strict: true`
- No `any` types unless absolutely necessary
- Proper generic typing for reusable components

### Test Coverage

- Core package: ~100% coverage of critical paths
- React package: ~83% coverage (excellent for components)
- All new code must have corresponding tests

### Linting

- Use ESLint with React and TypeScript rules
- No console.log in production code
- Prefer const over let
- Use template literals over string concatenation

---

## Summary

**Key Takeaways:**

1. **Error Handling:** Throw errors in dev, warn in prod
2. **TypeScript:** Use strict typing, avoid `any`
3. **Testing:** Wrap test components with `forwardRef`
4. **Performance:** Memoize expensive operations
5. **Consistency:** Follow established patterns from codebase
6. **Documentation:** Update relevant docs when changing behavior

**Critical Reminder:**
The framework is production-ready. Focus on developer experience improvements, maintain backward compatibility, and ensure all tests pass after changes.
