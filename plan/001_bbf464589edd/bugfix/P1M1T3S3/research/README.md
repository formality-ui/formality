# Research Index: 8-Layer Prop Priority Testing

**Task ID:** P1.M1.T3.S3
**Task Title:** Test 8-layer priority order
**Status:** Research Complete, Implementation Pending
**Date:** 2025-01-11

## Overview

This directory contains comprehensive research and implementation guidance for testing the Formality library's 8-layer prop priority system. The research covers testing patterns, best practices, implementation strategies, and external resources.

## The 8-Layer Priority System

```
Layer 1 (lowest):  providerDefaultFieldProps
Layer 2:           providerSelectDefaultFieldProps (dynamic)
Layer 3:           formDefaultFieldProps
Layer 4:           formSelectDefaultFieldProps (dynamic)
Layer 5:           inputProps
Layer 6:           fieldConfigProps
Layer 7:           selectProps (dynamic)
Layer 8:           componentProps
Layer 9 (highest): coreProps (always wins)
```

## Research Documents

### 1. Best Practices Guide
**File:** `prop_merging_testing_best_practices.md`
**Size:** Comprehensive
**Topics:**
- Testing Library best practices
- Prop override testing patterns
- Shallow vs deep prop merging
- Vitest/React Testing Library patterns
- Mocking strategies
- Priority system testing
- Comprehensive test coverage
- Documentation references

**When to read:** Before starting implementation. Provides the theoretical foundation and best practices.

### 2. External Resources
**File:** `external_resources.md`
**Size:** Reference
**Topics:**
- Official documentation URLs
- Community resources
- Code examples and patterns
- GitHub repositories
- Stack Overflow references
- Books and videos
- Related projects
- Package documentation

**When to read:** When you need specific documentation links or community resources.

### 3. Implementation Guide
**File:** `implementation_guide.md`
**Size:** Step-by-step instructions
**Topics:**
- Phase 1: Setup and Helpers (Week 1)
- Phase 2: Single Layer Tests (Week 1-2)
- Phase 3: Adjacent Layer Tests (Week 2)
- Phase 4: Skip Layer Tests (Week 2)
- Phase 5: Merge Behavior Tests (Week 3)
- Phase 6: Dynamic Layer Tests (Week 3)
- Phase 7: Edge Cases (Week 4)
- Phase 8: Performance Tests (Week 4)

**When to read:** During implementation. Follow the phases sequentially.

### 4. Quick Reference
**File:** `quick_reference.md`
**Size:** Condensed
**Topics:**
- The 8 layers overview
- Test component template
- Test structure template
- Common assertion patterns
- Testing priority order
- Test coverage checklist
- Key implementation files
- Running tests
- Best practices summary
- Common pitfalls

**When to read:** For quick lookup while implementing tests.

## Research Summary

### Key Findings

1. **Test Isolation is Critical**
   - Each layer must be testable independently
   - Tests should not depend on other tests
   - Use `beforeEach` to reset state

2. **Use Reliable Selectors**
   - Always use `data-testid` attributes
   - Avoid implementation details (classes, internal state)
   - Test what users see and interact with

3. **forwardRef is Essential**
   - Test components must use `forwardRef`
   - The Field component passes ref to inputs
   - Without forwardRef, tests miss ref-related bugs

4. **Async Testing Patterns**
   - Use `waitFor` for state-dependent assertions
   - Use `userEvent` over `fireEvent` for realistic interactions
   - Always `await` userEvent actions

5. **Comprehensive Coverage Requires 40+ Tests**
   - Single layer tests: 24 tests
   - Adjacent layer tests: 7 tests
   - Skip layer tests: 6 tests
   - Merge behavior tests: 4 tests
   - Dynamic layer tests: 6 tests
   - Edge cases: 8 tests
   - Performance tests: 2 tests
   - **Total: 41 tests**

### Test Categories

#### 1. Single Layer Tests (24 tests)
Test each layer in isolation with 3 assertions per layer:
- Layer applies correctly
- Layer is overridden by higher layers
- Layer overrides lower layers

#### 2. Adjacent Layer Tests (7 tests)
Test each layer against the next higher layer:
- L2 > L1, L3 > L2, L4 > L3, L5 > L4, L6 > L5, L7 > L6, L8 > L7

#### 3. Skip Layer Tests (6 tests)
Test priority with gaps:
- L3 > L1, L4 > L1, L5 > L2, L7 > L4, L8 > L3, L8 > L1

#### 4. Merge Behavior Tests (4 tests)
- Deep merge nested objects
- Replace arrays (not merge)
- Merge different properties
- Override same properties

#### 5. Dynamic Layer Tests (6 tests)
Test expression evaluation for layers 2, 4, 7:
- Expression evaluation
- Re-evaluation on dependency changes

#### 6. Edge Cases (8 tests)
- Undefined layers
- Null values
- Empty objects
- Function callbacks
- Frozen objects
- Symbol properties
- Circular references
- Property descriptors

#### 7. Performance Tests (2 tests)
- Rapid changes without memory leaks
- Only re-evaluate affected layers

### Key Implementation Files

**Core Logic:**
- `/packages/core/src/config/merge.ts` - `mergeFieldProps()` function (lines 180-215)

**React Integration:**
- `/packages/react/src/hooks/usePropsEvaluation.ts` - Dynamic prop evaluation (lines 112-250)
- `/packages/react/src/components/Field.tsx` - Field component

**Existing Tests:**
- `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx` - Reference patterns

**New Tests (To Be Created):**
- `/packages/react/src/__tests__/propPriority.test.tsx` - Priority system tests
- `/packages/react/src/__tests__/helpers/test-components.tsx` - Mock components
- `/packages/react/src/__tests__/helpers/test-renderers.tsx` - Custom render functions
- `/packages/react/src/__tests__/helpers/test-assertions.ts` - Assertion helpers

### Best Practices

#### Do's ✅
- Test what users see and interact with
- Use `data-testid` for selectors
- Use `userEvent` for interactions
- Use `waitFor` for async assertions
- Use `forwardRef` on test components
- Test both merge and override behavior
- Test dynamic expression evaluation
- Test edge cases (null, undefined)
- Measure performance
- Aim for 80%+ coverage

#### Don'ts ❌
- Use implementation details (internal state, methods)
- Forget forwardRef on test components
- Use fireEvent instead of userEvent
- Forget waitFor for async updates
- Test props that don't affect output
- Make tests depend on each other
- Ignore edge cases
- Skip performance testing

## Implementation Timeline

### Week 1: Foundation
- [ ] Create test helpers directory
- [ ] Create test components (test-components.tsx)
- [ ] Create test inputs config (test-inputs.ts)
- [ ] Create custom render function (test-renderers.tsx)
- [ ] Create assertion helpers (test-assertions.ts)
- [ ] Implement single layer tests (24 tests)

### Week 2: Priority Testing
- [ ] Implement adjacent layer tests (7 tests)
- [ ] Implement skip layer tests (6 tests)
- [ ] Document test results

### Week 3: Dynamic Testing
- [ ] Implement merge behavior tests (4 tests)
- [ ] Implement dynamic layer tests (6 tests)
- [ ] Test expression caching
- [ ] Performance benchmarks

### Week 4: Edge Cases & Performance
- [ ] Implement edge case tests (8 tests)
- [ ] Implement performance tests (2 tests)
- [ ] Regression test suite
- [ ] Documentation updates
- [ ] Verify coverage targets (80%)

## Success Criteria

### Quantitative Metrics
- **Test Count:** 41 tests minimum
- **Coverage:** 80%+ statements, branches, functions, lines
- **Test Duration:** < 5 seconds for full suite
- **Memory Leaks:** 0 detected during rapid changes

### Qualitative Metrics
- All priority combinations tested
- Edge cases covered
- Performance validated
- Documentation complete
- Tests maintainable and readable

## Related Documentation

### Formality Project
- **Core API:** `/packages/core/README.md`
- **React API:** `/packages/react/README.md`
- **Architecture:** `/plan/bugfix/architecture/codebase_analysis.md`
- **Bug Fix Tasks:** `/bug_fix_tasks.json`

### Existing Tests
- **Field Tests:** `/packages/react/src/__tests__/Field.test.tsx`
- **Select Props Tests:** `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx`
- **Form Tests:** `/packages/react/src/__tests__/Form.test.tsx`

## External Resources

### Official Documentation
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest](https://vitest.dev/guide/)
- [React Hook Form Testing](https://react-hook-form.com/advanced-usage#Testing)
- [userEvent](https://testing-library.com/docs/user-event/intro/)

### Community Resources
- [Kent C. Dodds - Testing](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TestingJavaScript.com](https://testingjavascript.com/)
- [Testing Library Examples](https://github.com/testing-library/react-testing-library-examples)

## Commands

### Running Tests
```bash
# Run all tests
npm test

# Run specific file
npm test propPriority

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run with UI
npm test -- --ui
```

### Coverage
```bash
# Generate coverage report
npm test -- --coverage

# Open HTML coverage report
open coverage/index.html
```

## Team Coordination

### Roles and Responsibilities
- **Developer:** Implement tests following the implementation guide
- **Senior Developer:** Review test patterns and coverage
- **Tech Lead:** Approve test suite and merge

### Communication
- Daily standups: Report progress on implementation phases
- Code reviews: All tests must be reviewed before merging
- Documentation: Update this README with lessons learned

## Status

- **Research Phase:** ✅ Complete
- **Documentation Phase:** ✅ Complete
- **Implementation Phase:** 🔄 Pending
- **Testing Phase:** ⏳ Not started
- **Review Phase:** ⏳ Not started

## Next Steps

1. **Review Research Documents**
   - Read `prop_merging_testing_best_practices.md`
   - Review `external_resources.md`
   - Study `implementation_guide.md`

2. **Set Up Environment**
   - Ensure dependencies are installed
   - Verify test configuration
   - Create test helpers directory

3. **Start Implementation**
   - Follow the 4-week implementation timeline
   - Begin with Phase 1: Setup and Helpers
   - Track progress using checkboxes

4. **Validate and Review**
   - Run tests regularly
   - Monitor coverage
   - Document issues and solutions

## Questions or Issues?

If you have questions about the research or implementation:

1. Check the `prop_merging_testing_best_practices.md` for detailed explanations
2. Review the `quick_reference.md` for common patterns
3. Consult the `external_resources.md` for official documentation
4. Refer to existing tests in `/packages/react/src/__tests__/selectDefaultFieldProps.test.tsx`

## Version History

- **v1.0.0** (2025-01-11): Initial research complete
  - Best practices guide created
  - External resources documented
  - Implementation guide written
  - Quick reference prepared

---

**Document Index Version:** 1.0.0
**Last Updated:** 2025-01-11
**Maintained By:** Development Team
**Status:** Ready for Implementation
