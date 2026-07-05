# React Libraries Peer Dependencies Best Practices

Research conducted on: 2026-01-12

## Table of Contents

1. [Why React Libraries Use peerDependencies](#why-react-libraries-use-peerdependencies)
2. [Version Range Syntax Guide](#version-range-syntax-guide)
3. [Popular Library Patterns](#popular-library-patterns)
4. [Best Practices Summary](#best-practices-summary)
5. [Optional Peer Dependencies](#optional-peer-dependencies)
6. [DevDependencies for Testing](#devdependencies-for-testing)
7. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
8. [React 19 Compatibility](#react-19-compatibility)

---

## Why React Libraries Use peerDependencies

### Key Differences: peerDependencies vs dependencies

**peerDependencies:**

- NOT automatically installed when someone installs your package
- Expect the consumer (the application) to provide them
- Ensures a single version is used across the entire dependency tree
- Prevents duplicate copies of React that can cause issues with hooks, context, and state
- Best for: Major frameworks like React, React DOM, and other UI libraries

**dependencies:**

- Automatically installed when someone installs your package
- Used for libraries your package requires internally
- Each package gets its own copy
- Best for: Internal utilities, smaller libraries, dependencies unlikely to conflict

### Why React MUST Be a peerDependency

1. **React Hooks**: Hooks rely on the React instance; multiple React copies will break hooks
2. **Context API**: Context providers and consumers must use the same React instance
3. **State Management**: React's internal state management requires a single instance
4. **Bundle Size**: Prevents multiple React copies in the final bundle (saves ~100KB+)
5. **Version Conflicts**: Prevents "Invalid hook call" errors from mixed React versions

### Official Resources

- **npm Documentation**: https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependencies
- **React Documentation**: https://react.dev/learn/installation (for latest installation practices)
- **npm peerDependenciesMeta**: https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependenciesmeta

---

## Version Range Syntax Guide

### Semantic Versioning Ranges

| Range             | Matches                        | Does Not Match   | Use Case                                                            |
| ----------------- | ------------------------------ | ---------------- | ------------------------------------------------------------------- |
| `^18.0.0`         | 18.0.0, 18.1.0, 18.3.0         | 19.0.0, 17.0.0   | Most common - allows patch/minor updates, prevents breaking changes |
| `>=18.0.0`        | 18.0.0, 18.1.0, 19.0.0, 20.0.0 | (anything lower) | Forward compatibility - supports all future versions                |
| `~18.0.0`         | 18.0.0, 18.0.1                 | 18.1.0, 19.0.0   | Conservative - only patch updates                                   |
| `18.x`            | 18.0.0, 18.1.0, 18.99.0        | 19.0.0           | Same as `^18.0.0`                                                   |
| `*`               | Any version                    | (none)           | Not recommended - too permissive                                    |
| `18.0.0 - 19.0.0` | 18.0.0 to 19.0.0               | 17.0.0, 19.0.1   | Specific range                                                      |

### Multiple Version Support (OR syntax)

```json
{
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0 || ^19.0.0"
  }
}
```

This allows any of the specified major versions.

---

## Popular Library Patterns

### Material UI (MUI) - @mui/material v7.3.7

**Latest React Support**: 17, 18, 19

```json
{
  "peerDependencies": {
    "@emotion/react": "^11.5.0",
    "@emotion/styled": "^11.3.0",
    "@types/react": "^17.0.0 || ^18.0.0 || ^19.0.0",
    "react": "^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^17.0.0 || ^18.0.0 || ^19.0.0",
    "@mui/material-pigment-css": "^7.3.7"
  },
  "peerDependenciesMeta": {
    "@types/react": { "optional": true },
    "@emotion/react": { "optional": true },
    "@emotion/styled": { "optional": true },
    "@mui/material-pigment-css": { "optional": true }
  }
}
```

**Pattern Notes**:

- Supports React 17, 18, and 19 with OR syntax
- Makes Emotion libraries optional (for CSS-in-JS alternatives)
- Makes TypeScript types optional
- Includes specific styling library requirements

**Documentation**: https://mui.com/material-ui/getting-started/installation/

---

### Chakra UI v3.31.0

**Latest React Support**: 18+

```json
{
  "peerDependencies": {
    "@emotion/react": ">=11",
    "react": ">=18",
    "react-dom": ">=18"
  }
}
```

**Pattern Notes**:

- Uses `>=` for forward compatibility (supports React 19+)
- Requires React 18 as minimum (features use React 18 APIs)
- Requires Emotion 11+ as peer dependency
- More conservative with lower bound, more permissive with upper bound

**Documentation**: https://chakra-ui.com/docs/getting-started

---

### React Hook Form v7.71.0

**Latest React Support**: 16.8+, 17, 18, 19

```json
{
  "peerDependencies": {
    "react": "^16.8.0 || ^17 || ^18 || ^19"
  }
}
```

**Pattern Notes**:

- Very broad support - back to React 16.8 (when hooks were introduced)
- Concise OR syntax for major versions
- No `react-dom` requirement (works with React Native)
- Minimal peer dependencies (just React)

**Documentation**: https://react-hook-form.com

---

### TanStack Query (React Query) v5.90.16

**Latest React Support**: 18, 19

```json
{
  "peerDependencies": {
    "react": "^18 || ^19"
  }
}
```

**Pattern Notes**:

- Modern: only supports React 18 and 19
- Concise caret syntax without patch versions
- No `react-dom` required (React Native compatible)
- Drop-in replacement for older React Query versions

**Documentation**: https://tanstack.com/query/latest

---

### Radix UI (Dialog component) v1.1.15

**Latest React Support**: 16.8+, 17, 18, 19

```json
{
  "peerDependencies": {
    "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
    "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
    "@types/react": "*",
    "@types/react-dom": "*"
  }
}
```

**Pattern Notes**:

- Supports React 16.8+ (hooks introduction)
- Includes release candidates (`-rc`) in version range
- Requires both `react` and `react-dom`
- TypeScript types as peer dependencies (unusual pattern)
- Very permissive version ranges

**Documentation**: https://radix-ui.com/primitives

---

### React Router DOM v7

**Latest React Support**: 18, 19

```json
{
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  }
}
```

**Pattern Notes**:

- Uses `>=18` for React 18+ forward compatibility
- Requires `react-dom` (web-only, not React Native)
- Modern: requires React 18 features (uses new Suspense patterns)

**Documentation**: https://reactrouter.com

---

### Headless UI v2

**Latest React Support**: 18, 19

```json
{
  "peerDependencies": {
    "react": "^18 || ^19 || ^19.0.0-rc"
  }
}
```

**Pattern Notes**:

- Modern only: React 18+
- Supports release candidates
- No `react-dom` requirement (works with React Native)

**Documentation**: https://headlessui.com

---

### Ant Design (antd) v5

**Latest React Support**: 18+

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

**Pattern Notes**:

- Requires React 18+
- Uses `>=` for forward compatibility
- Includes `react-dom` requirement

**Documentation**: https://ant.design/

---

### React Testing Library v16

**Latest React Support**: 18, 19

```json
{
  "peerDependencies": {
    "@testing-library/dom": "^10.0.0",
    "@types/react": "^18.0.0 || ^19.0.0",
    "@types/react-dom": "^18.0.0 || ^19.0.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

**Pattern Notes**:

- More strict: only React 18 or 19
- Requires DOM testing library as peer
- Includes TypeScript type requirements
- Requires both React and React DOM

**Documentation**: https://testing-library.com/react

---

### Zustand v5

**Latest React Support**: 18+

```json
{
  "peerDependencies": {
    "@types/react": ">=18.0.0",
    "immer": ">=9.0.6",
    "react": ">=18.0.0",
    "use-sync-external-store": ">=1.2.0"
  }
}
```

**Pattern Notes**:

- Requires React 18+
- Makes `immer` optional via peerDependenciesMeta (not shown)
- Includes `use-sync-external-store` for React 18 compatibility
- TypeScript types as peer dependencies

**Documentation**: https://zustand-demo.pmnd.rs

---

### React Select v5

**Latest React Support**: 16.8+, 17, 18, 19

```json
{
  "peerDependencies": {
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  }
}
```

**Pattern Notes**:

- Broad support back to React 16.8
- Explicit version ranges including patch version
- Requires both React and React DOM

**Documentation**: https://react-select.com

---

### React Bootstrap v2

**Latest React Support**: 16.14+, 17, 18, 19

```json
{
  "peerDependencies": {
    "react": ">=16.14.0",
    "react-dom": ">=16.14.0",
    "@types/react": ">=16.14.8"
  }
}
```

**Pattern Notes**:

- Uses `>=` for forward compatibility
- Specific minimum versions (16.14.0)
- Includes TypeScript types as peer dependencies

**Documentation**: https://react-bootstrap.github.io

---

### MUI X Date Pickers v7

**Latest React Support**: 17, 18, 19

```json
{
  "peerDependencies": {
    "@emotion/react": "^11.9.0",
    "@emotion/styled": "^11.8.1",
    "@mui/material": "^5.15.14 || ^6.0.0 || ^7.0.0",
    "@mui/system": "^5.15.14 || ^6.0.0 || ^7.0.0",
    "date-fns": "^2.25.0 || ^3.2.0 || ^4.0.0",
    "date-fns-jalali": "^2.13.0-0 || ^3.2.0-0 || ^4.0.0-0",
    "dayjs": "^1.10.7",
    "luxon": "^3.0.2",
    "moment": "^2.29.4",
    "react": "^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^17.0.0 || ^18.0.0 || ^19.0.0"
  }
}
```

**Pattern Notes**:

- Complex: multiple date library options as peer dependencies
- Requires MUI core as peer dependency
- Supports multiple MUI major versions
- Very comprehensive version specifications

**Documentation**: https://mui.com/x/react-date-pickers/

---

## Best Practices Summary

### 1. React Version Specification

**Recommended Pattern for 2026**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

**Why**:

- React 18 introduced concurrent features that many libraries now use
- React 19 is stable and widely adopted
- Caret syntax (`^`) allows patch/minor updates but prevents breaking changes
- OR syntax supports multiple major versions

### 2. When to Use Different Version Ranges

| Scenario                                | Recommended Range |
| --------------------------------------- | ----------------- | --- | --------- | --- | ------- | --- | --------- |
| Modern library (React 18+ features)     | `"^18.0.0         |     | ^19.0.0"` |
| Maximum compatibility                   | `"^16.8.0         |     | ^17.0.0   |     | ^18.0.0 |     | ^19.0.0"` |
| Forward compatible (tested with future) | `">=18.0.0"`      |
| Conservative (only tested versions)     | `"^18.0.0"`       |

### 3. Optional Peer Dependencies

Use `peerDependenciesMeta` for truly optional dependencies:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "@types/react": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "@types/react": {
      "optional": true
    }
  }
}
```

**Best practices for optional peers**:

- TypeScript type packages (`@types/*`)
- Alternative styling libraries (e.g., Emotion vs styled-components)
- Development/debugging tools
- Enhancement features that aren't required for core functionality

### 4. React-Native Compatible Libraries

If your library works with React Native, don't require `react-dom`:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

**Examples**: React Hook Form, TanStack Query, Zustand

### 5. TypeScript Types as Peer Dependencies

**Current Practice (2026)**: Mixed

- **Some libraries** include `@types/react` as an optional peer dependency (MUI, Zustand)
- **Most libraries** don't specify types in peer dependencies (React Hook Form, TanStack Query)

**Recommendation**: Make TypeScript types optional if you want to support TypeScript users:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "@types/react": {
      "optional": true
    }
  }
}
```

---

## Optional Peer Dependencies

### How to Specify Optional Peers

**Using peerDependenciesMeta** (npm 7+):

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "@types/react": "^18.0.0 || ^19.0.0",
    "@emotion/styled": "^11.0.0"
  },
  "peerDependenciesMeta": {
    "@types/react": {
      "optional": true
    },
    "@emotion/styled": {
      "optional": true
    }
  }
}
```

### When to Make Dependencies Optional

1. **TypeScript Types**: Users may not use TypeScript
2. **Alternative Implementations**: Multiple styling libraries (Emotion, styled-components, etc.)
3. **Enhancement Features**: Features that add functionality but aren't required
4. **Development Tools**: Debugging, logging, or dev-only features

### Real-World Examples

**MUI makes Emotion optional** (supports alternative CSS solutions):

```json
{
  "peerDependencies": {
    "@emotion/react": "^11.5.0",
    "@emotion/styled": "^11.3.0"
  },
  "peerDependenciesMeta": {
    "@emotion/react": { "optional": true },
    "@emotion/styled": { "optional": true }
  }
}
```

**Zustand makes Immer optional** (for immutable updates):

```json
{
  "peerDependencies": {
    "immer": ">=9.0.6"
  }
}
```

(Note: Uses peerDependenciesMeta not shown, Immer is optional)

---

## DevDependencies for Testing

### Should React Be in DevDependencies?

**YES!** Always include React and peer dependencies in devDependencies for testing.

### Recommended Pattern

```json
{
  "name": "your-react-library",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.5.0",
    "vitest": "^2.0.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

### Why Include in DevDependencies?

1. **Testing**: You need React to run tests
2. **Type Checking**: TypeScript needs type definitions
3. **Development**: You need React to run the development build
4. **CI/CD**: Automated tests need React installed
5. **Linking**: Local development with `pnpm link` requires dependencies

### Version Strategy for DevDependencies

**Test with the latest version** you support:

```json
{
  "devDependencies": {
    "react": "^19.0.0", // Test with latest
    "react-dom": "^19.0.0"
  }
}
```

### Real-World Examples

**React Hook Form** (v7.71.0):

```json
{
  "peerDependencies": {
    "react": "^16.8.0 || ^17 || ^18 || ^19"
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "react": "^19.2.7" // Tests with React 19
  }
}
```

**Zustand** (v5):

```json
{
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "devDependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@types/react": "^19.0.7"
  }
}
```

### Testing Library Versions

**Critical**: Match testing library versions with React versions:

```json
{
  "devDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@testing-library/react": "^16.0.0" // v16+ for React 19
  }
}
```

**Testing Library Compatibility**:

- `@testing-library/react` v15+ → React 18
- `@testing-library/react` v16+ → React 19

---

## Common Pitfalls to Avoid

### 1. Using Regular dependencies for React

**BAD**:

```json
{
  "dependencies": {
    "react": "^18.0.0"
  }
}
```

**Why It's Bad**:

- Multiple React copies in bundle
- Hooks break (Invalid hook call errors)
- Context providers/consumers can't communicate
- Wasted bundle size (~100KB+ per copy)

**GOOD**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

### 2. Too Strict Version Ranges

**BAD**:

```json
{
  "peerDependencies": {
    "react": "18.2.0"
  }
}
```

**Why It's Bad**:

- Prevents users from updating to React 18.3.0, 19.0.0, etc.
- Creates dependency conflicts
- Users can't use your library with other libraries requiring different React versions

**GOOD**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

### 3. Too Permissive Version Ranges

**BAD**:

```json
{
  "peerDependencies": {
    "react": "*"
  }
}
```

**Why It's Bad**:

- Your library may break with React 15 or earlier
- No guarantee of compatibility
- Users encounter runtime errors

**GOOD**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

### 4. Forgetting react-dom

**BAD** (for web-only libraries):

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

**Why It's Bad**:

- `react-dom` contains web-specific renderers
- Your library likely uses DOM-specific APIs
- TypeScript types reference `react-dom`

**GOOD** (for web libraries):

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

**Exception**: Skip `react-dom` if your library works with React Native.

### 5. Not Including React in DevDependencies

**BAD**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0"
  }
}
```

**Why It's Bad**:

- Tests fail because React isn't installed
- TypeScript can't find React types
- Development build fails

**GOOD**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

### 6. Mismatched Testing Library Versions

**BAD**:

```json
{
  "devDependencies": {
    "react": "^19.0.0",
    "@testing-library/react": "^14.0.0" // v14 doesn't support React 19
  }
}
```

**Why It's Bad**:

- Tests fail with React 19
- Incompatible APIs

**GOOD**:

```json
{
  "devDependencies": {
    "react": "^19.0.0",
    "@testing-library/react": "^16.0.0" // v16+ supports React 19
  }
}
```

### 7. Not Testing All Supported React Versions

**BAD**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "react": "^19.0.0" // Only testing with React 19
  }
}
```

**Why It's Bad**:

- Your library might break with React 18
- Users report bugs you didn't catch

**GOOD**:
Test with multiple React versions in CI:

```yaml
# Example CI matrix
test:
  matrix:
    react: [18.3.0, 19.0.0]
```

### 8. Using Wrong Caret Range

**BAD**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^18.0.0 || ^19.0.0" // Redundant
  }
}
```

**GOOD**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

### 9. Not Documenting React Version Requirements

**BAD**: No README mention of React requirements

**GOOD**:

````markdown
# Your Library

## Requirements

- React 18.3.0 or 19.0.0+
- React DOM 18.3.0 or 19.0.0+ (for web)

## Installation

```bash
npm install your-library react react-dom
```
````

````

### 10. Ignoring peerDependencyWarnings

**BAD**: Silencing npm warnings without fixing

**GOOD**:
- Fix the peer dependency mismatch
- Or document why a warning is safe to ignore
- Use `npm config set fund false` for fund messages only

---

## React 19 Compatibility

### What's New in React 19

React 19.0.0 was released in 2025 and includes:
- New Server Components support
- Improved Suspense behavior
- New use() hook for resources
- Transitions API improvements
- Enhanced Concurrent Rendering

### React 19 Adoption

**As of January 2026**:
- React 19 stable: `v19.2.3` (latest)
- React 19 adoption: Growing rapidly
- Most major libraries support React 19

### Library Support Status

| Library | React 19 Support |
|---------|------------------|
| Material UI | ✅ v7+ |
| Chakra UI | ✅ v3+ (via `>=18`) |
| React Hook Form | ✅ v7+ |
| TanStack Query | ✅ v5+ |
| Radix UI | ✅ Latest |
| React Router | ✅ v7+ (via `>=18`) |
| Ant Design | ✅ v5+ (via `>=18`) |
| React Testing Library | ✅ v16+ |

### Recommended peerDependencies for 2026

**For New Libraries**:
```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
````

**For Modern-Only Libraries**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

**For Forward-Compatible Libraries**:

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

### Testing with React 19

**CI/CD Matrix**:

```yaml
test:
  matrix:
    react: [18.3.0, 19.2.3]
    node: [18, 20]
```

**Package.json**:

```json
{
  "devDependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.0.0"
  }
}
```

---

## Complete Example: Recommended package.json

```json
{
  "name": "@your-org/your-react-library",
  "version": "1.0.0",
  "description": "Your awesome React library",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "@types/react": {
      "optional": true
    }
  },
  "dependencies": {
    "tiny-invariant": "^1.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "jsdom": "^25.0.0",
    "prettier": "^3.4.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  },
  "publishConfig": {
    "access": "public"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Key Takeaways

1. **Always use `peerDependencies` for React and React DOM**
   - Prevents duplicate React copies
   - Avoids hooks and context errors

2. **Use caret ranges for flexibility**: `^18.0.0 || ^19.0.0`
   - Allows patch and minor updates
   - Prevents breaking changes

3. **Test with multiple React versions**
   - Include React in `devDependencies`
   - Use CI matrix for testing

4. **Make TypeScript types optional**
   - Use `peerDependenciesMeta`
   - Supports non-TypeScript users

5. **Document React version requirements**
   - README installation instructions
   - Minimum supported versions

6. **Stay current with React 19**
   - Update peer dependencies
   - Test with React 19
   - Update testing libraries

7. **Skip `react-dom` for React Native libraries**
   - Only include if web-specific
   - Reduces unnecessary constraints

---

## Additional Resources

### Official Documentation

- **npm peerDependencies**: https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependencies
- **npm peerDependenciesMeta**: https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependenciesmeta
- **React Installation**: https://react.dev/learn/installation
- **Semantic Versioning**: https://semver.org/

### Library Documentation

- **Material UI**: https://mui.com/material-ui/getting-started/installation/
- **Chakra UI**: https://chakra-ui.com/docs/getting-started
- **React Hook Form**: https://react-hook-form.com
- **TanStack Query**: https://tanstack.com/query/latest
- **Radix UI**: https://radix-ui.com/primitives
- **React Router**: https://reactrouter.com
- **React Testing Library**: https://testing-library.com/react

### Tools and Utilities

- **npm view**: Check any package's peer dependencies: `npm view <package> peerDependencies`
- **npm semver calculator**: https://semver.npmjs.com/
- **Bundle size analysis**: https://bundlephobia.com/

---

## References

### npm Package Information Retrieved (January 2026)

All peer dependency information was retrieved from the npm registry using `npm info` commands:

1. **@mui/material@7.3.7** - Retrieved via `npm info @mui/material peerDependencies`
2. **@chakra-ui/react@3.31.0** - Retrieved via `npm info @chakra-ui/react peerDependencies`
3. **react-hook-form@7.71.0** - Retrieved via `npm info react-hook-form peerDependencies`
4. **@tanstack/react-query@5.90.16** - Retrieved via `npm info @tanstack/react-query peerDependencies`
5. **@radix-ui/react-dialog@1.1.15** - Retrieved via `npm info @radix-ui/react-dialog peerDependencies`
6. **react-router-dom@7** - Retrieved via `npm info react-router-dom peerDependencies`
7. **@headlessui/react@2** - Retrieved via `npm info @headlessui/react peerDependencies`
8. **antd@5** - Retrieved via `npm info antd peerDependencies`
9. **@testing-library/react@16** - Retrieved via `npm info @testing-library/react peerDependencies`
10. **zustand@5** - Retrieved via `npm info zustand peerDependencies`
11. **react-select@5** - Retrieved via `npm info react-select peerDependencies`
12. **react-bootstrap@2** - Retrieved via `npm info react-bootstrap peerDependencies`
13. **@mui/x-date-pickers@7** - Retrieved via `npm info @mui/x-date-pickers peerDependencies`
14. **react@19.2.3** - Latest version from `npm info react@latest version`
15. **react-dom@19.2.3** - Latest version from `npm info react-dom@latest version`

### Current Project Information

**File**: `/home/dustin/projects/formality/packages/react/package.json`

The current formality React package uses:

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-hook-form": "^7.0.0"
  },
  "devDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.50.0",
    "@testing-library/react": "^14.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

**Note**: Currently only supports React 18, not React 19. Consider updating.

---

_Research conducted: January 12, 2026_
_React versions available: 18.3.0 (legacy), 19.2.3 (current latest)_
