# Bug Fix Sprint - Summary

**Generated:** 2026-01-10
**Status:** Ready for Implementation
**Total Story Points:** 43.5 SP

---

## Executive Summary

This document outlines the breakdown of a bug fix and enhancement sprint for the **Formality** form framework. The framework is **production-ready** with 329 passing tests and excellent coverage. This sprint focuses on:

1. **Major Issues** (3 issues): React ref warnings, FieldGroup warnings, circular dependency detection
2. **Minor Enhancements** (5 issues): Expression error handling, validation improvements, type safety
3. **Already Resolved** (1 issue): UnusedFields render prop (feature already exists)

**Overall Goal:** Improve developer experience and prevent runtime errors while maintaining backward compatibility.

---

## Quick Stats

| Metric                     | Value                    |
| -------------------------- | ------------------------ |
| **Total Phases**           | 1                        |
| **Total Milestones**       | 3                        |
| **Total Tasks**            | 10                       |
| **Total Subtasks**         | 48                       |
| **Estimated Story Points** | 43.5 SP                  |
| **Major Issues**           | 3 (Critical)             |
| **Minor Enhancements**     | 5 (Developer Experience) |
| **Already Implemented**    | 1 (Issue #4)             |

---

## Milestone Breakdown

### Milestone 1: Major Issue Resolution

**Estimate:** 24 SP | **Status:** Planned

**Tasks:**

1. **Fix React Ref Warnings** (9 subtasks, 7 SP)
   - Update 8 test files to use `React.forwardRef()`
   - Components: TestInput, TestSwitch, TestSelect
   - Verify all 329 tests pass with no warnings

2. **Improve FieldGroup Warning** (3 subtasks, 2.5 SP)
   - Add available group names to error message
   - Decide on throwing errors vs warnings
   - Add test coverage

3. **Add Circular Dependency Detection** (5 subtasks, 14.5 SP)
   - Create cycle detection utility (DFS algorithm)
   - Integrate into `Form.addSubscription()`
   - Comprehensive test coverage
   - Performance verification

**Impact:** Prevents runtime errors, improves debugging experience

---

### Milestone 2: Minor Enhancements

**Estimate:** 14.5 SP | **Status:** Planned

**Tasks:**

1. **Configurable Expression Error Handling** (4 subtasks, 3 SP)
   - Add `onExpressionError` callback to config
   - Update expression evaluator
   - Test custom error handlers

2. **Validator/Parser/Formatter Errors** (4 subtasks, 5 SP)
   - Convert warnings to errors in development mode
   - Include available options in error messages
   - Test both development and production modes

3. **SelectFunction Type Safety** (2 subtasks, 1.5 SP)
   - Add generic `TFields` parameter
   - Verify TypeScript compilation

4. **Auto-Save Debounce Validation** (2 subtasks, 2 SP)
   - Validate debounce is positive number
   - Test edge cases

5. **Field Order Type Safety** (2 subtasks, 2 SP)
   - Add runtime validation in `sortFieldsByOrder`
   - Test invalid order values

6. **Humanize Label Documentation** (2 subtasks, 2 SP)
   - Add comprehensive JSDoc
   - Test edge cases

**Impact:** Better type safety, clearer error messages, improved DX

---

### Milestone 3: Validation & Documentation

**Estimate:** 5 SP | **Status:** Planned

**Tasks:**

1. **Run Full Test Suite** (2 subtasks, 1 SP)
   - Verify all 329 tests pass
   - Check coverage remains high

2. **TypeScript Compilation** (1 subtask, 0.5 SP)
   - Ensure no type errors

3. **Build Verification** (1 subtask, 0.5 SP)
   - Build all packages successfully

4. **Update Documentation** (2 subtasks, 1.5 SP)
   - Create/update CHANGELOG
   - Document Issue #4 resolution

**Impact:** Confirms production readiness, maintains quality standards

---

## Critical Implementation Notes

### Issue #1: React Ref Warnings

**Pattern to Apply:**

```typescript
const TestInput = forwardRef<HTMLInputElement, TestInputProps>(
  ({ value, onChange, disabled, label, error, name, ...props }, ref) => {
    return (
      <div data-testid={`field-wrapper-${name}`}>
        {label && <label htmlFor={name}>{label}</label>}
        <input
          ref={ref}  // Critical: Forward the ref
          id={name}
          data-testid={name}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);

TestInput.displayName = 'TestInput';  // Critical: For debugging
```

**Files Affected:** 8 test files
**Complexity:** Low | **Risk:** Very low (test-only changes)

---

### Issue #2: FieldGroup Config Warning

**Decision Required:** Throw errors vs improve warnings?

**Option A (Throw Errors):**

```typescript
if (process.env.NODE_ENV !== "production" && !formConfig.groups?.[name]) {
  const availableGroups = Object.keys(formConfig.groups || {});
  throw new Error(
    `FieldGroup: No config found for group "${name}".\n` +
      `Available groups: ${availableGroups.join(", ") || "none"}`,
  );
}
```

**Option B (Improve Warnings):**

```typescript
if (process.env.NODE_ENV !== "production" && !formConfig.groups?.[name]) {
  const availableGroups = Object.keys(formConfig.groups || {});
  console.warn(
    `FieldGroup: No config found for group "${name}".\n` +
      `Available groups: ${availableGroups.join(", ") || "none"}`,
  );
}
```

**Recommendation:** Option A (throw errors in dev) for consistency with Issue #6

---

### Issue #3: Circular Dependency Detection

**Algorithm:** DFS with Recursion Stack

**Implementation:**

```typescript
// packages/react/src/utils/cycleDetection.ts (NEW)
export function wouldCreateCycle(
  graph: Map<string, Set<string>>,
  target: string,
  subscriber: string,
): boolean {
  // DFS-based cycle detection
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(node: string): boolean {
    if (visiting.has(node)) return true; // Cycle detected
    if (visited.has(node)) return false; // Already checked

    visiting.add(node);

    for (const neighbor of graph.get(node) || []) {
      if (dfs(neighbor)) return true;
    }

    visiting.delete(node);
    visited.add(node);
    return false;
  }

  // Temporarily add edge and check
  const tempGraph = cloneGraph(graph);
  if (!tempGraph.has(subscriber)) {
    tempGraph.set(subscriber, new Set());
  }
  tempGraph.get(subscriber)!.add(target);

  return dfs(subscriber);
}
```

**Integration:** Add to `Form.tsx:addSubscription()` before adding subscription
**Complexity:** High | **Risk:** Medium (new critical path)

**Performance Impact:** O(V+E) per subscription, acceptable for typical forms (<50 fields)

---

## Risk Assessment

| Task                          | Risk Level   | Mitigation                                      |
| ----------------------------- | ------------ | ----------------------------------------------- |
| React ref warnings            | **Very Low** | Test-only changes, easily verified              |
| FieldGroup warnings           | **Low**      | Simple message enhancement                      |
| Circular dependency detection | **Medium**   | Comprehensive tests, performance benchmarks     |
| Expression error handling     | **Low**      | Optional feature, backward compatible           |
| Validator/parser errors       | **Medium**   | Could break existing code using invalid configs |
| Type safety improvements      | **Very Low** | Type-only changes, compile-time verification    |
| Debounce validation           | **Very Low** | Simple validation                               |
| Field order validation        | **Very Low** | Defensive programming only                      |
| Humanize label docs           | **None**     | Documentation only                              |

**Overall Risk:** **Medium** (mitigated by comprehensive testing)

---

## Testing Strategy

### Pre-Implementation Baseline

```bash
pnpm test              # 329 tests passing
pnpm typecheck         # Clean compilation
pnpm build             # Successful build
```

### During Implementation

- Run tests after each subtask completion
- Verify no React warnings in output (Issue #1)
- Test circular dependency detection with various patterns (Issue #3)
- Validate error messages are helpful (Issues #2, #5, #6)

### Post-Implementation Verification

```bash
pnpm test              # Still 329 tests passing
pnpm test:coverage     # Coverage maintained
pnpm typecheck         # No type errors
pnpm build             # Clean build
```

### New Test Coverage Required

- **Issue #1:** Verify no ref warnings (existing tests)
- **Issue #2:** Test enhanced warning/error (new test)
- **Issue #3:** ~15 new tests for cycle detection utility and integration
- **Issue #5:** Test expression error callback (new test)
- **Issue #6:** Test missing config errors (new tests)
- **Issue #8:** Test debounce validation (new tests)
- **Issue #9:** Test order validation (new tests)
- **Issue #10:** Test humanize label edge cases (new tests)

---

## Dependencies and Ordering

### Critical Path

1. **Must Complete First:** Issue #3 (circular dependency detection) - highest risk
2. **Parallel Work:** Issues #1, #2, #5, #6, #8, #9, #10 - independent tasks
3. **Must Complete Last:** Milestone 3 (validation) - depends on all implementation

### Recommended Order

```
Week 1:
  - Issue #1 (React ref warnings) - Low risk, high visibility improvement
  - Issue #2 (FieldGroup warnings) - Quick win

Week 2:
  - Issue #3 (Circular dependency detection) - Major effort, requires care

Week 3:
  - Issues #5-10 (Minor enhancements) - Can parallelize
  - Milestone 3 (Validation & documentation)
```

---

## Success Criteria

### Functional Requirements

✅ All 329 tests pass
✅ No React warnings in test output
✅ Circular dependencies detected and prevented
✅ Invalid configurations throw errors in development
✅ TypeScript compilation succeeds
✅ All packages build successfully

### Non-Functional Requirements

✅ No performance regression (test duration < 3s)
✅ Backward compatibility maintained (except for invalid configs)
✅ Code coverage remains high (Core ~100%, React ~83%)
✅ Clear error messages for common mistakes

### Developer Experience Improvements

✅ Easier debugging (better error messages)
✅ Prevented runtime errors (circular dependencies)
✅ Better type safety (SelectFunction generics)
✅ Comprehensive documentation (JSDoc, CHANGELOG)

---

## Rollback Plan

If critical issues arise:

1. **Issue #3 (Circular Dependency Detection):**
   - Feature can be disabled via environment variable
   - Fallback to current behavior (no detection)
   - Revert specific commit if needed

2. **Issue #6 (Validator/Parser Errors):**
   - Can revert to warnings via config flag
   - Most teams want this, but easy to revert

3. **Other Issues:**
   - Low risk, straightforward rollbacks
   - Test-only changes (#1) are safe

---

## Next Steps

1. **Review this breakdown** with team to confirm approach
2. **Create branch** for Issue #3 (highest risk, start early)
3. **Set up CI/CD checks** to catch regressions early
4. **Begin implementation** following the dependency order
5. **Update this document** as implementation progresses

---

## Questions for Team Decision

1. **Issue #2:** Should we throw errors or just improve warnings for missing FieldGroup configs?
   - Recommendation: **Throw errors** in development (consistent with Issue #6)

2. **Issue #3:** Should cycle detection be configurable (enable/disable flag)?
   - Recommendation: **Always enabled** (prevents critical errors)

3. **Issue #6:** Should we provide migration guide for teams using invalid configs?
   - Recommendation: **Yes**, add documentation on how to fix configs

4. **Timeline:** Is 3-week timeline acceptable for this sprint?
   - Recommendation: **Yes**, with focus on Issue #3 in Week 2

---

## Resources

### Architecture Documentation

- `plan_bugfix/architecture/system_context.md` - System overview
- `plan_bugfix/architecture/external_deps.md` - External research
- `plan_bugfix/architecture/implementation_patterns.md` - Code patterns
- `plan_bugfix/architecture/file_mappings.md` - Exact file paths

### Task Breakdown

- `./bug_fix_tasks.json` - Complete JSON backlog

### Original PRD

- Bug fix requirements document with 10 issues identified

---

## Appendix: Issue Status Matrix

| Issue | Title                         | Severity | Status          | SP Estimate |
| ----- | ----------------------------- | -------- | --------------- | ----------- |
| #1    | React Ref Warnings            | Major    | 🔄 To Do        | 7           |
| #2    | FieldGroup Warnings           | Major    | 🔄 To Do        | 2.5         |
| #3    | Circular Dependency Detection | Major    | 🔄 To Do        | 14.5        |
| #4    | UnusedFields Render Prop      | Minor    | ✅ Already Done | 0           |
| #5    | Expression Error Handling     | Minor    | 🔄 To Do        | 3           |
| #6    | Validator/Parser Errors       | Minor    | 🔄 To Do        | 5           |
| #7    | SelectFunction Types          | Minor    | 🔄 To Do        | 1.5         |
| #8    | Debounce Validation           | Minor    | 🔄 To Do        | 2           |
| #9    | Field Order Validation        | Minor    | 🔄 To Do        | 2           |
| #10   | Humanize Label Docs           | Minor    | 🔄 To Do        | 2           |

**Total Active Issues:** 9 | **Total SP:** 39.5 (excluding Issue #4)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-10
**Prepared By:** Lead Technical Architect & Project Synthesizer
