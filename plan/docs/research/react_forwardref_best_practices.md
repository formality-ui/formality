# React forwardRef Best Practices Research

## Purpose

Research on React.forwardRef TypeScript best practices for updating test components to support refs without warnings.

## Key Resources

### 1. forwardRef, memo, and displayName with TypeScript
- URL: https://stevekinney.com/courses/react-typescript/forwardref-memo-and-displayname
- Why: Covers how to compose `forwardRef` and `memo` without losing types, addresses devtools labeling
- Key Insight: Always set displayName for better debugging in React DevTools

### 2. Using forwardRef With Generic Components
- URL: https://www.danny.engineering/article/using-forwardref-with-generic-components
- Why: Explains how `forwardRef` works and why it's useful with proper typing
- Key Insight: Generic components require explicit type parameters: `forwardRef<TElement, TProps>`

### 3. TypeScript + React: Typing Generic forwardRefs
- URL: https://oida.dev/typescript-react-generic-forward-refs/
- Why: Shows how to properly set generic type variables when calling `React.forwardRef`
- Key Insight: The types shipped by @types/react have generic type variables for proper inference

### 4. TypeScript for React Developers: 12 Common Mistakes
- URL: https://www.greatfrontend.com/blog/typescript-for-react-developers
- Why: Covers TypeScript React best practices including proper component typing
- Key Insight: Always define explicit prop interfaces for test components

### 5. The Best Guide to React Forward Ref TypeScript
- URL: https://www.dhiwise.com/post/the-best-guide-to-react-forward-ref-typescript
- Why: Comprehensive guide covering practical applications and best practices
- Key Insight: forwardRef pattern prevents React warnings about refs on function components

## Pattern to Follow

From the completed subtasks (S1-S4), the established pattern is:

```tsx
import React, { forwardRef } from 'react';

// Define props interface
interface TestInputProps {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  name: string;
  [key: string]: unknown; // Important for spreading ...props
}

// Create forwardRef component
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, name, ...props }, ref) => (
    <input
      ref={ref}
      data-testid={name}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}
    />
  )
);

// Set displayName for debugging
TestInput.displayName = 'TestInput';
```

## Critical Gotchas

1. **Import forwardRef**: Must import `forwardRef` from 'react' alongside the default import
2. **Generic Types**: `forwardRef<TElement, TProps>` - Element type (e.g., HTMLInputElement) comes first, then Props interface
3. **displayName**: Always set after component definition for React DevTools debugging
4. **Ref Forwarding**: The ref parameter must be passed to the underlying DOM element
5. **Props Spreading**: Use `[key: string]: unknown` in interface to allow spread props like `{...props}`
6. **Null Coalescing**: Use `value ?? ''` instead of `value || ''` to handle zero values correctly

## Why This Matters

React Hook Form's Controller component passes refs to input components. Without forwardRef, React warns:
> "Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?"

This warning clutters test output and indicates potential ref-passing issues.
