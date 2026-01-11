# Codebase Pattern Analysis - forwardRef Updates

## Purpose

Analysis of completed forwardRef update tasks (P1.M1.T1.S1-S5) to extract the established pattern for updating test components.

## Analyzed Files

1. `packages/react/src/__tests__/Field.test.tsx`
2. `packages/react/src/__tests__/FieldGroup.test.tsx`
3. `packages/react/src/__tests__/Form.test.tsx`
4. `packages/react/src/__tests__/UnusedFields.test.tsx`

## Established forwardRef Pattern

### TestInput Component Pattern

```tsx
import React, { forwardRef } from "react";

interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown;
}

const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}
    />
  ),
);

TestInput.displayName = "TestInput";
```

### TestSwitch Component Pattern

```tsx
import React, { forwardRef } from "react";

interface TestSwitchProps {
  value?: any;
  onChange?: (value: any) => void;
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
```

## Key Conventions

| Aspect             | Convention                                             |
| ------------------ | ------------------------------------------------------ |
| Import             | `import React, { forwardRef } from 'react';`           |
| Props Interface    | Must include `[key: string]: unknown` for spread props |
| Generic Type 1     | `HTMLInputElement` for both text and checkbox inputs   |
| Generic Type 2     | The props interface name                               |
| Ref Parameter      | Second parameter: `ref`                                |
| Ref Placement      | On the underlying DOM element: `ref={ref}`             |
| displayName        | Must be set after component definition                 |
| Optional Callbacks | Use optional chaining: `onChange?.()`                  |
| Nullish Coalescing | Use `value ?? ''` or `value ?? false`                  |

## Changes Required for autosave-validation.test.tsx

1. **Line 5**: Update React import to include forwardRef
2. **Lines 27-34**: Rewrite TestInput with forwardRef pattern
3. **Lines 36-44**: Rewrite TestSwitch with forwardRef pattern
4. **Add props interfaces** before component definitions
