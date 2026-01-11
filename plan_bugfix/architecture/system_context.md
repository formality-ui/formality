# Formality System Context

**Generated:** 2026-01-10
**Project:** Formality - Form Framework
**Type:** Bug Fix & Enhancement Sprint

---

## Project Overview

Formality is a production-ready form framework built with a three-layer architecture:

1. **Core Package** (`@formality-ui/core`) - Framework-agnostic business logic
2. **React Package** (`@formality-ui/react`) - React adapter with components
3. **Placeholder Packages** (`@formality-ui/svelte`, `@formality-ui/vue`) - Future adapters

**Current Status:**
- Production-ready with 329 passing tests
- Core package: ~100% coverage of critical paths
- React package: ~83% coverage
- Total source code: ~7,371 lines

---

## Architecture Patterns

### Three-Layer Design

```
FormalityProvider (Global Config)
    ↓
Form (Form Instance)
    ↓
Field/FieldGroup (Components)
```

### Subscription System

**Purpose:** Manage reactive dependencies between form fields.

**Implementation:**
- **Data Structure:** `Map<target, Set<subscribers>>` (inverted index)
- **Location:** `packages/react/src/components/Form.tsx:180-230`
- **Hook:** `useSubscriptions.ts` manages lifecycle
- **Mount Order Handling:** Pending queue prevents race conditions

**Critical Gap:** No circular dependency detection (Issue #3).

### Expression Engine

**Purpose:** Evaluate conditional expressions for field visibility/enabled state.

**Tech Stack:**
- **Parser:** `jsep` (JavaScript Expression Parser)
- **Evaluation:** Custom AST walker with short-circuit logic
- **Location:** `packages/core/src/expression/evaluate.ts`

**Features:**
- Member access: `form.values.user.age`
- Logical operators: `&&`, `||`, `!`
- Comparison operators: `===`, `!==`, `>`, `<`, etc.
- Ternary operators: `condition ? trueValue : falseValue`
- Function calls: `hasValue('fieldName')`

### Validation Isolation

**Purpose:** Only validate affected fields when values change.

**Implementation:**
- **Location:** `packages/core/src/validation/validate.ts`
- **Strategy:** Dependent field tracking via subscription system
- **Performance:** Prevents full form validation on every keystroke

### Proxy Pattern

**Purpose:** Optimize field state access performance.

**Implementation:**
- **Location:** `packages/react/src/utils/makeProxyState.ts`
- **Benefit:** Prevents unnecessary re-renders of unrelated fields

---

## Test Infrastructure

### Test Runner: Vitest

**Workspace Configuration:** `vitest.workspace.ts`

**Core Tests:** 145 tests
- Expression evaluation
- Condition logic
- Validation pipeline
- Transform pipeline
- Framework independence
- Label resolution

**React Tests:** 184 tests
- Component integration
- Auto-save coordination
- Render isolation
- FieldGroup nesting
- Complete form workflows

### Test Component Pattern

**Current Implementation:**
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
      {...props}
    />
  </div>
);
```

**Issue:** Missing `React.forwardRef()` wrapper causes React warnings.

---

## Build System

### Package Manager: pnpm Workspace

**Root Scripts:**
```json
{
  "build": "pnpm -r build",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --build"
}
```

### Build Tool: tsup

**Output Format:** Dual ESM/CJS
- ESM: `./dist/index.js`
- CJS: `./dist/index.cjs`
- Types: `./dist/index.d.ts`

**Features:**
- Source maps enabled
- Tree-shaking supported
- Clean builds (dist cleared before build)

---

## Key Dependencies

### Core Package
```json
{
  "jsep": "^1.4.0",
  "jse-eval": "^1.5.2"
}
```

### React Package
```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-hook-form": "^7.0.0"
  },
  "dependencies": {
    "lodash-es": "^4.17.21"
  }
}
```

---

## Critical Issues to Address

### 1. React Ref Warnings (Major)
- **Impact:** Test output clutter, potential integration issues
- **Root Cause:** Test components not wrapped with `forwardRef`
- **Fix Pattern:** Wrap all test input components

### 2. FieldGroup Config Warning (Major)
- **Impact:** Developers may miss console warnings
- **Root Cause:** Uses `console.warn` instead of throwing errors
- **Fix Pattern:** Throw errors in development mode

### 3. Circular Dependency Detection (Major)
- **Impact:** Runtime errors, infinite loops
- **Root Cause:** No cycle detection in subscription system
- **Fix Pattern:** Add DFS-based cycle detection

### 4-10. Minor Enhancements
- UnusedFields render prop (already implemented!)
- Expression error handling configurability
- Stronger validation for missing configs
- Debounce validation
- Field order type safety
- Humanize label edge cases

---

## Development Workflow

1. **Making Changes:**
   ```bash
   pnpm test              # Run all tests
   pnpm test:watch        # Watch mode
   pnpm typecheck         # TypeScript validation
   pnpm build             # Build all packages
   ```

2. **Testing Strategy:**
   - Write tests first (TDD implicit)
   - Verify no existing tests break
   - Check for React warnings in output
   - Validate TypeScript compilation

3. **Error Handling Pattern:**
   - Development mode: Throw errors for configuration mistakes
   - Production mode: Graceful degradation with warnings
   - Expression errors: Always log and return undefined

---

## Next Steps for PRP Agents

1. **Read This Document:** Understand the three-layer architecture
2. **Review `external_deps.md`:** Learn about circular dependency algorithms
3. **Check `implementation_patterns.md`:** See code patterns to follow
4. **Use `file_mappings.md`:** Get exact file paths for each issue

**Critical Reminder:** The framework is production-ready. Focus on developer experience improvements, not functional fixes.
