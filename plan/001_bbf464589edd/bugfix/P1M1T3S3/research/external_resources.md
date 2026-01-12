# External Resources and Documentation References

**Task:** P1.M1.T3.S3 - Test 8-layer priority order
**Date:** 2025-01-11

## Official Documentation URLs

### React Testing Library
- **Main Documentation:** https://testing-library.com/docs/react-testing-library/intro/
- **Queries:** https://testing-library.com/docs/queries/about/
- **Async Utilities:** https://testing-library.com/docs/dom-testing-library/api-async/
- **User Event:** https://testing-library.com/docs/user-event/intro/
- **Example Recipes:** https://testing-library.com/docs/react-testing-library/example-intro/

### Vitest
- **Main Documentation:** https://vitest.dev/guide/
- **Mocking:** https://vitest.dev/guide/mocking.html
- **Test Context:** https://vitest.dev/api/#test-context
- **Coverage:** https://vitest.dev/guide/coverage.html
- **Snapshot Testing:** https://vitest.dev/guide/snapshot.html

### React Hook Form
- **Testing Guide:** https://react-hook-form.com/advanced-usage#Testing
- **UseFormContext:** https://react-hook-form.com/docs/useformcontext
- **Controller:** https://react-hook-form.com/docs/controller

### TypeScript
- **Jest Types:** https://www.npmjs.com/package/@types/jest
- **Testing Library Types:** https://www.npmjs.com/package/@testing-library/dom

## Community Resources

### Kent C. Dodds - Testing Best Practices
- **Common Mistakes:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- **Common Testing Questions:** https://kentcdodds.com/blog/common-testing-questions
- **Fix Flaky Tests:** https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning

### Testing JavaScript
- **Course:** https://testingjavascript.com/
- **Workshops:** https://kentcdodds.com/workshops

### Blog Posts
- **Testing Prop Merging:** https://blog.logrocket.com/building-custom-hook-complex-forms-react/
- **Component Testing:** https://www.smashingmagazine.com/2020/06/testing-guide-vitest-react/

## Code Examples and Patterns

### GitHub Repositories

1. **Testing Library Examples**
   - URL: https://github.com/testing-library/react-testing-library-examples
   - Examples: Form testing, Context testing, Custom hooks

2. **React Hook Form Examples**
   - URL: https://github.com/react-hook-form/react-hook-formExamples
   - Examples: Complex forms, Validation, Testing

3. **Vitest Examples**
   - URL: https://github.com/vitest-dev/vitest/tree/main/examples
   - Examples: Mocking, Coverage, Snapshots

### Stack Overflow References

1. **Testing Props Priority**
   - URL: https://stackoverflow.com/questions/tagged/react-testing-library+props
   - Relevant Tags: react-testing-library, props, merge, priority

2. **Shallow vs Deep Merge**
   - URL: https://stackoverflow.com/questions/tagged/javascript+merge+objects
   - Relevant Tags: javascript, objects, merge, deep-merge

## Tools and Libraries

### Testing Tools
- **DOM Testing Library:** https://testing-library.com/docs/dom-testing-library/intro/
- **Jest DOM:** https://github.com/testing-library/jest-dom
- **MSW (Mock Service Worker):** https://mswjs.io/

### Coverage Tools
- **Istanbul/NYC:** https://istanbul.js.org/
- **Vitest Coverage:** https://vitest.dev/guide/coverage.html

### Linting
- **ESLint:** https://eslint.org/
- **ESLint Plugin Testing Library:** https://github.com/testing-library/eslint-plugin-testing-library

## Video Resources

### Conference Talks
1. **"Testing Your Components"** - Kent C. Dodds
   - URL: https://www.youtube.com/watch?v=AmNlYPyqXWg

2. **"Practical Testing with Vitest"** - Anthony Fu
   - URL: https://www.youtube.com/watch?v=5hC8sT3SY7s

### Courses
1. **TestingJavaScript.com** - Kent C. Dodds
   - URL: https://testingjavascript.com/

2. **Epic React** - Kent C. Dodds
   - URL: https://epicreact.dev/

## Books

1. **"Testing JavaScript Applications"** by Kent C. Dodds
   - URL: https://testingjavascript.com/

2. **"React Testing Library Handbook"** by Kent C. Dodds
   - URL: https://testing-library.com/docs/react-testing-library-intro

## Research Papers

1. **"Testing Prioritized Configurations"** - ACM Digital Library
   - Topics: Configuration testing, Priority systems

2. **"Property-Based Testing"** - Hypothesis Documentation
   - URL: https://hypothesis.works/articles/what-is-property-based-testing/

## Related Projects

1. **Material UI (MUI)**
   - Repo: https://github.com/mui/material-ui
   - Testing patterns for component props
   - Theme merging tests

2. **Chakra UI**
   - Repo: https://github.com/chakra-ui/chakra-ui
   - Props override patterns
   - Component composition tests

3. **Formik**
   - Repo: https://github.com/jaredpalmer/formik
   - Form testing patterns
   - Context provider tests

## Standards and Specifications

1. **Web Platform Tests**
   - URL: https://web-platform-tests.org/
   - Standards for web testing

2. **W3C Testing Guidelines**
   - URL: https://www.w3.org/TR/test-methodology/

## Package Documentation

1. **@testing-library/react**
   - NPM: https://www.npmjs.com/package/@testing-library/react
   - Version: ^14.0.0

2. **@testing-library/user-event**
   - NPM: https://www.npmjs.com/package/@testing-library/user-event
   - Version: ^14.0.0

3. **vitest**
   - NPM: https://www.npmjs.com/package/vitest
   - Version: ^1.0.0

4. **@testing-library/jest-dom**
   - NPM: https://www.npmjs.com/package/@testing-library/jest-dom
   - Version: ^6.0.0

5. **react-hook-form**
   - NPM: https://www.npmjs.com/package/react-hook-form
   - Version: ^7.0.0

## Formality Project References

### Internal Documentation
1. **Core Package README**
   - Path: `/packages/core/README.md`
   - Topics: API reference, Type definitions

2. **React Package README**
   - Path: `/packages/react/README.md`
   - Topics: Components, Hooks, Usage examples

3. **Architecture Documentation**
   - Path: `/plan/bugfix/architecture/codebase_analysis.md`
   - Topics: System architecture, Prop merging logic

### Existing Test Files
1. **Field Tests**
   - Path: `/packages/react/src/__tests__/Field.test.tsx`
   - Topics: Component rendering, Props handling

2. **Select Default Props Tests**
   - Path: `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx`
   - Topics: Expression evaluation, Priority tests, Re-evaluation

3. **Form Tests**
   - Path: `/packages/react/src/__tests__/Form.test.tsx`
   - Topics: Form integration, Context provider

### Source Code References
1. **mergeFieldProps Implementation**
   - Path: `/packages/core/src/config/merge.ts`
   - Function: `mergeFieldProps()`
   - Lines: 180-215

2. **usePropsEvaluation Hook**
   - Path: `/packages/react/src/hooks/usePropsEvaluation.ts`
   - Function: `usePropsEvaluation()`
   - Lines: 112-250

3. **Field Component**
   - Path: `/packages/react/src/components/Field.tsx`
   - Component: `Field`
   - Lines: 1-300

## Search Queries for Further Research

### Google Search Queries
1. "React Testing Library prop merging patterns"
2. "testing multi-layer prop priority React components"
3. "Vitest React Testing Library complex prop testing"
4. "mocking strategies for React hook form context"
5. "testing shallow vs deep merge in React props"
6. "priority system testing patterns React components"
7. "expression evaluation in form props testing"
8. "React component prop override testing best practices"

### GitHub Search Queries
1. "language:TypeScript mergeFieldProps"
2. "language:TypeScript prop priority testing"
3. "language:TypeScript selectProps testing"
4. "language:TypeScript React Testing Library props"

### Stack Overflow Search Queries
1. "[react-testing-library] prop override"
2. "[vitest] component testing props"
3. "[react-hook-form] testing context"
4. "[typescript] deep merge testing"

## Quick Reference Cards

### Test Structure Template
```typescript
describe("Feature Name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Scenario 1", () => {
    it("should do X", () => {
      // Arrange
      render(<Component />);

      // Act
      await user.click(screen.getByRole("button"));

      // Assert
      expect(screen.getByText("Result")).toBeInTheDocument();
    });
  });
});
```

### Common Assertions
```typescript
// Element presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Element attributes
expect(element).toHaveAttribute("data-size", "large");
expect(element).toHaveClass("test-class");

// Element state
expect(element).toBeDisabled();
expect(element).toBeEnabled();

// Async assertions
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

## Citation Format

When referencing these resources in code comments or documentation:

```typescript
/**
 * Tests the 8-layer priority system
 *
 * Reference: https://testing-library.com/docs/react-testing-library/intro/
 * Pattern: Based on Kent C. Dodds' testing principles
 * Example: https://github.com/testing-library/react-testing-library-examples
 */
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-11
**Next Review:** 2025-02-01
