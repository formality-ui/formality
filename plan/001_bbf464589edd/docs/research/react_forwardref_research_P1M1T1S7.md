# React forwardRef Best Practices Research

> Research conducted: 2026-01-11
> Focus: Official React documentation, displayName best practices, and testing patterns

---

## Table of Contents

1. [Official React Documentation](#official-react-documentation)
2. [Best Practices for Forwarding Refs to DOM Elements](#best-practices-for-forwarding-refs-to-dom-elements)
3. [Setting displayName on forwardRef Components](#setting-displayname-on-forwardref-components)
4. [Common Patterns for Test Components with forwardRef](#common-patterns-for-test-components-with-forwardref)
5. [TypeScript Integration](#typescript-integration)
6. [Important: React 19 Changes](#important-react-19-changes)
7. [Sources](#sources)

---

## Official React Documentation

### Primary Documentation URLs

1. **[forwardRef – React Official Docs](https://react.dev/reference/react/forwardRef)**
   - **Status:** ⚠️ **DEPRECATED in React 19**
   - React 19 deprecation notice: "In React 19, `forwardRef` is no longer necessary. Pass `ref` as a prop instead."
   - Complete API reference with parameters, returns, and caveats
   - Usage examples including:
     - Exposing a DOM node to parent component
     - Forwarding refs through multiple components
     - Exposing imperative handles instead of DOM nodes

2. **[Forwarding Refs – React Legacy Docs](https://legacy.reactjs.org/docs/forwarding-refs.html)**
   - Comprehensive guide on ref forwarding technique
   - **Section: Forwarding refs to DOM components** - Basic pattern explanation
   - **Section: Note for component library maintainers** - Breaking change guidance
   - **Section: Forwarding refs in higher-order components** - HOC patterns with displayName

### Key Documentation Sections with Anchors

#### React 19 Documentation

- **Reference Section:** `forwardRef(render)` - Parameters and returns
- **Usage: Exposing a DOM node** - Basic pattern
- **Usage: Forwarding through multiple components** - Chain forwarding
- **Usage: Exposing imperative handle** - `useImperativeHandle` pattern
- **Troubleshooting:** "My component is wrapped in forwardRef, but ref is always null"

#### Legacy Documentation

- **Forwarding refs to DOM components** - Step-by-step explanation
- **Note for component library maintainers** - Breaking change considerations
- **Forwarding refs in higher-order components** - HOC patterns

---

## Best Practices for Forwarding Refs to DOM Elements

### 1. Basic Pattern

```javascript
import { forwardRef } from "react";

const MyInput = forwardRef(function MyInput(props, ref) {
  const { label, ...otherProps } = props;
  return (
    <label>
      {label}
      <input {...otherProps} ref={ref} />
    </label>
  );
});
```

**Key Points:**

- Use named function expressions for better DevTools display
- Spread props to pass through all DOM attributes
- Forward `ref` to the actual DOM element you want to expose

### 2. When to Use forwardRef

**✅ Use Cases:**

- Building reusable UI components (inputs, buttons)
- Creating component libraries
- When parent components need imperative access to DOM elements
- Leaf components that need focus, selection, or animation control

**❌ Avoid:**

- Every component (only use when refs are actually needed)
- Application-level components (like avatars or comments)
- Components that don't need to expose DOM nodes

### 3. Breaking Change Consideration

From official docs:

> "When you start using `forwardRef` in a component library, you should treat it as a breaking change and release a new major version of your library."

**Why:** Your library's behavior changes observably (what refs get assigned to, exported types).

### 4. Conditional Ref Forwarding (Anti-Pattern)

```javascript
// ❌ AVOID: Conditional ref forwarding
const MyInput = forwardRef(function MyInput({ label, showInput }, ref) {
  return (
    <label>
      {label}
      {showInput && <input ref={ref} />}
    </label>
  );
});
```

**Problem:** If `showInput` is `false`, the ref won't be forwarded to any node, and a ref to `MyInput` will remain empty.

---

## Setting displayName on forwardRef Components

### Why displayName Matters

From [Steve Kinney's guide](https://stevekinney.com/courses/react-typescript/forwardref-memo-and-displayname):

> "`displayName` is crucial for debugging. Without it, your DevTools show generic names that make debugging a nightmare."

### Pattern 1: Named Function Expression (Recommended)

```javascript
const MyComponent = forwardRef(function MyComponent(props, ref) {
  return <div ref={ref}>{props.children}</div>;
});
```

**DevTools Display:** `MyComponent`

### Pattern 2: Anonymous Function + displayName Property

```javascript
const MyComponent = forwardRef((props, ref) => {
  return <div ref={ref}>{props.children}</div>;
});

MyComponent.displayName = "MyComponent";
```

**DevTools Display:** `MyComponent`

### Pattern 3: With HOCs (Higher-Order Components)

From legacy React docs:

```javascript
function logProps(Component) {
  class LogProps extends React.Component {
    componentDidUpdate(prevProps) {
      console.log("old props:", prevProps);
      console.log("new props:", this.props);
    }
    render() {
      const { forwardedRef, ...rest } = this.props;
      return <Component ref={forwardedRef} {...rest} />;
    }
  }

  function forwardRef(props, ref) {
    return <LogProps {...props} forwardedRef={ref} />;
  }

  // Give this component a more helpful display name in DevTools
  const name = Component.displayName || Component.name;
  forwardRef.displayName = `logProps(${name})`;

  return React.forwardRef(forwardRef);
}
```

**DevTools Display:** `logProps(MyComponent)`

### Pattern 4: Combining forwardRef with memo

From [Steve Kinney's TypeScript guide](https://stevekinney.com/courses/react-typescript/forwardref-memo-and-displayname):

```javascript
// Step 1: Create the base component with forwardRef
const ButtonBase = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const classes = `btn btn-${variant} btn-${size} ${className || ''}`.trim();
    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);

// Step 2: Wrap with memo
const Button = memo(ButtonBase);

// Step 3: Set display names
ButtonBase.displayName = 'Button';
Button.displayName = 'memo(Button)';

// Step 4: Export the memoized version
export { Button };
```

**DevTools Display:**

```
App
└── memo(Button)
```

### ESLint react/display-name Rule

**Resources:**

- [Stack Overflow: Component definition is missing display name for forwardRef](https://stackoverflow.com/questions/67992894/component-definition-is-missing-display-name-for-forwardRef)
- [GitHub Issue: display name --fix for forwardRef #2898](https://github.com/yannickcr/eslint-plugin-react/issues/2898)

**Common Error:**

```
Component definition is missing display name for forwardRef
```

**Solutions:**

1. Use named function expression
2. Set `displayName` property explicitly
3. Configure ESLint to ignore certain patterns if needed

### Known Issues

From GitHub issue discussions:

- [False positive display-name when using forwardRef #2269](https://github.com/jsx-eslint/eslint-plugin-react/issues/2269)
- React derives names differently for forwardRef components via `type.render`
- Consider using [ESLint React](https://www.eslint-react.xyz) as a modern alternative

---

## Common Patterns for Test Components with forwardRef

### 1. Testing Basic Ref Forwarding

From [React Testing Library best practices](https://tianyaschool.medium.com/jest-and-react-testing-library-best-practices-for-front-end-testing-f4a2b9ab69c0):

```javascript
import { render, screen } from "@testing-library/react";
import { forwardRef } from "react";

const MyInput = forwardRef(function MyInput(props, ref) {
  return <input ref={ref} {...props} />;
});

test("forwards ref to input element", () => {
  const ref = { current: null };

  render(<MyInput ref={ref} data-testid="input" />);

  // Verify ref is attached to the input
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current).toHaveAttribute("data-testid", "input");
});
```

### 2. Testing Imperative Handles

From [useImperativeHandle testing guide](https://blog.stackademic.com/ref-erence-for-useimperative-handle-90131a4c9296):

```javascript
import { forwardRef, useImperativeHandle } from "react";
import { render, screen } from "@testing-library/react";

const MyComponent = forwardRef(function MyComponent(props, ref) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  return <input ref={inputRef} />;
});

test("exposes focus method through imperative handle", () => {
  const ref = { current: null };
  render(<MyComponent ref={ref} />);

  // Test the exposed methods
  expect(ref.current).toBeDefined();
  expect(typeof ref.current.focus).toBe("function");
  expect(typeof ref.current.blur).toBe("function");

  // Test the actual behavior
  ref.current.focus();
  expect(document.activeElement).toBeInstanceOf(HTMLInputElement);
});
```

### 3. Mocking forwardRef Components

From [Stack Overflow: How to mock a react function component that takes a ref](https://stackoverflow.com/questions/71916701/how-to-mock-a-react-function-component-that-takes-a-ref-prop):

```javascript
import { forwardRef } from "react";

// Original component
const MyComponent = forwardRef(function MyComponent(props, ref) {
  return <div ref={ref}>{props.children}</div>;
});

// Test file
jest.mock("./MyComponent", () => ({
  __esModule: true,
  default: forwardRef(function MockMyComponent(props, ref) {
    return (
      <div ref={ref} data-testid="mock-myc">
        {props.children}
      </div>
    );
  }),
}));

test("renders mocked component", () => {
  const ref = { current: null };
  render(<MyComponent ref={ref}>Hello</MyComponent>);

  expect(screen.getByTestId("mock-myc")).toBeInTheDocument();
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
});
```

### 4. Testing with TypeScript

From [Steve Kinney's TypeScript testing guide](https://stevekinney.com/courses/react-typescript/testing-react-typescript):

```typescript
import { forwardRef, type ForwardedRef } from 'react';
import { render, screen } from '@testing-library/react';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'primary', ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant}`}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

test('button forwards ref correctly', () => {
  const ref: ForwardedRef<HTMLButtonElement> = createRef<HTMLButtonElement>();

  render(<Button ref={ref}>Click me</Button>);

  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current).toHaveTextContent('Click me');
});
```

### 5. Testing Components That Accept Refs

When testing parent components that pass refs to forwardRef children:

```javascript
import { render, screen } from "@testing-library/react";

function Form() {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.focus();
  };

  return (
    <form>
      <MyInput ref={inputRef} label="Name" />
      <button type="button" onClick={handleClick}>
        Focus Input
      </button>
    </form>
  );
}

test("parent can focus child input through ref", () => {
  render(<Form />);

  const input = screen.getByLabelText("Name");
  const button = screen.getByRole("button", { name: "Focus Input" });

  expect(input).not.toHaveFocus();

  button.click();

  expect(input).toHaveFocus();
});
```

---

## TypeScript Integration

### Basic Typing Pattern

```typescript
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, ...props }, ref) {
    return (
      <label>
        {label}
        <input ref={ref} {...props} />
      </label>
    );
  },
);

Input.displayName = 'Input';
```

### Generic Components with forwardRef

From [Steve Kinney's guide](https://stevekinney.com/courses/react-typescript/forwardref-memo-and-displayname):

```typescript
interface ListProps<T> extends ComponentPropsWithoutRef<'ul'> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

// Note: We need to cast the result to preserve generics
const List = forwardRef(
  <T,>({ items, renderItem, ...props }: ListProps<T>, ref: React.Ref<HTMLUListElement>) => (
    <ul ref={ref} {...props}>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  ),
) as <T>(props: ListProps<T> & { ref?: React.Ref<HTMLUListElement> }) => React.ReactElement;

List.displayName = 'List';
```

---

## Important: React 19 Changes

### Major Deprecation

From the [official React 19 documentation](https://react.dev/reference/react/forwardRef):

> **In React 19, `forwardRef` is no longer necessary. Pass `ref` as a prop instead. `forwardRef` will be deprecated in a future release.**

### React 19 Pattern

```javascript
// OLD (React 18 and earlier)
const MyInput = forwardRef(function MyInput(props, ref) {
  return <input ref={ref} {...props} />;
});

// NEW (React 19+)
function MyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}
```

### Migration Considerations

From [React 19 Update articles](https://medium.com/@beenakawat004/react-19-update-goodbye-forwardref-hello-simpler-ref-management-2025-1676202d8cb1):

1. **React 19 allows refs to be passed directly as props**
2. **No need for forwardRef wrapper**
3. **Simplifies component composition**
4. **Better TypeScript inference**

### Backward Compatibility

If you need to support both React 18 and React 19:

```javascript
// Use forwardRef for now, plan migration to React 19
const MyInput = forwardRef(function MyInput(props, ref) {
  return <input ref={ref} {...props} />;
});

MyInput.displayName = "MyInput";
```

---

## Sources

### Official Documentation

- [forwardRef – React Official Docs](https://react.dev/reference/react/forwardRef) - React 19.2
- [Forwarding Refs – React Legacy Docs](https://legacy.reactjs.org/docs/forwarding-refs.html)

### displayName Best Practices

- [forwardRef, memo, and displayName with TypeScript – Steve Kinney](https://stevekinney.com/courses/react-typescript/forwardref-memo-and-displayname)
- [Avoid Anonymous Components With the displayName Property – Jules Blom](https://julesblom.com/writing/component-displayname)
- [Component definition is missing display name for forwardRef – Stack Overflow](https://stackoverflow.com/questions/67992894/component-definition-is-missing-display-name-for-forwardRef)
- [display name --fix for forwardRef – GitHub Issue #2898](https://github.com/yannickcr/eslint-plugin-react/issues/2898)

### Testing Resources

- [How to mock a react function component that takes a ref – Stack Overflow](https://stackoverflow.com/questions/71916701/how-to-mock-a-react-function-component-that-takes-a-ref-prop)
- [Jest and React Testing Library: Best Practices – Medium](https://tianyaschool.medium.com/jest-and-react-testing-library-best-practices-for-front-end-testing-f4a2b9ab69c0)
- [Testing React Components with TypeScript – Steve Kinney](https://stevekinney.com/courses/react-typescript/testing-react-typescript)
- [Mastering useImperativeHandle hook – Stackademic](https://blog.stackademic.com/ref-erence-for-useimperative-handle-90131a4c9296)
- [React Testing Library Recipes – Dev.to](https://dev.to/mbellagamba/react-testing-library-recipes-getting-started-1agd)

### ESLint & Tooling

- [eslint-plugin-react – npm](https://www.npmjs.com/package/eslint-plugin-react)
- [False positive display-name when using forwardRef – GitHub Issue #2269](https://github.com/jsx-eslint/eslint-plugin-react/issues/2269)
- [Overview | ESLint React](https://www.eslint-react.xyz/docs/rules/overview)

### React 19 Updates

- [React 19 Update: Goodbye forwardRef – Medium](https://medium.com/@beenakawat004/react-19-update-goodbye-forwardref-hello-simpler-ref-management-2025-1676202d8cb1)
- [React 19 Ref Updates – Saeloun Blog](https://blog.saeloun.com/2025/03/24/react-19-ref-as-prop/)

### Additional Learning Resources

- [React forwardRef explained – LogRocket](https://blog.logrocket.com/use-forwardref-react/)
- [Ref Forwarding with React forwardRef – Refine.dev Blog](https://refine.dev/blog/react-forwardref/)
- [Understanding React's forwardRef – Dev.to](https://dev.to/gervaisamoah/understanding-reacts-forwardref-once-and-forall-3g16)

---

## Summary of Key Findings

1. **Official Documentation:** Both [React 19 docs](https://react.dev/reference/react/forwardRef) and [legacy docs](https://legacy.reactjs.org/docs/forwarding-refs.html) provide comprehensive guidance, with React 19 deprecating forwardRef entirely.

2. **displayName is Critical:** Always set displayName on forwardRef components for better debugging. Use named function expressions or explicitly set the displayName property.

3. **Testing Patterns:** Use React Testing Library's type-safe queries, test ref forwarding with `createRef()`, and mock forwardRef components carefully when needed.

4. **TypeScript Support:** Use `ComponentPropsWithoutRef<'element'>` for proper prop inference and explicitly type the ref parameter.

5. **React 19 Changes:** Plan migration strategy for React 19's ref-as-prop pattern, which eliminates the need for forwardRef.

6. **ESLint Integration:** The `react/display-name` rule enforces displayName usage, but has known false positives with forwardRef.

---

_This research document was compiled on 2026-01-11 and reflects the current state of React documentation and community best practices._
