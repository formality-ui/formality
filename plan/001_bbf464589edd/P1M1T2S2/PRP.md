name: "PRP: Create @formality-ui/react Package Structure - P1.M1.T2.S2"
description: |

---

## Goal

**Feature Goal**: Create the @formality-ui/react package structure as a framework-specific React adapter that depends on @formality-ui/core via workspace:\* protocol and declares peer dependencies for React, React DOM, and React Hook Form.

**Deliverable**: A `packages/react/` directory with:

- `package.json` with workspace dependency on @formality-ui/core, regular dependencies for jsep/jse-eval/lodash-es, and peer dependencies for react/react-dom/react-hook-form
- `src/index.ts` as a placeholder entry point for future React components, hooks, and context providers

**Success Definition**: The packages/react/package.json exists with name "@formality-ui/react", type "module", proper exports for ESM/CJS/DTS, has "@formality-ui/core": "workspace:\*" in dependencies, has peer dependencies for React ecosystem, devDependencies for testing, and src/index.ts exists as a placeholder with barrel export documentation.

## User Persona

**Target User**: React Application Developers - This package is consumed by React applications that need the Formality form system with React-specific components and hooks.

**Use Case**: Provide React adapters that:

1. Wrap @formality-ui/core types and functions in React-friendly APIs
2. Provide React components (Form, Field, FieldGroup, etc.)
3. Provide React hooks (useFormState, useConditions, usePropsEvaluation, etc.)
4. Provide React contexts (FormContext, ConfigContext, GroupContext)
5. Integrate with react-hook-form for form state management

**User Journey**:

1. Developer installs @formality-ui/react in their React application
2. Developer imports Form, Field, FieldGroup components from @formality-ui/react
3. Developer uses useForm hook or Form component with react-hook-form
4. Developer gets type-safe form configuration with conditional rendering
5. Form conditions are evaluated automatically using core package utilities

**Pain Points Addressed**:

- Provides ready-to-use React components instead of manual integration
- Type-safe form configuration with TypeScript
- Automatic condition evaluation using core package expression engine
- Seamless react-hook-form integration
- Single source of truth for form state

## Why

- **Consumes Core Package (P1.M1.T2.S1 Output)**: React package depends on @formality-ui/core via workspace:\* protocol, importing types and pure functions
- **Framework-Specific Adapter**: Provides React-specific APIs (components, hooks, contexts) built on top of framework-agnostic core
- **React Hook Form Integration**: Leverages react-hook-form for form state management, validation, and submission handling
- **Expression Parsing Support**: Includes jsep and jse-eval dependencies (also in core) for safe expression evaluation in React context
- **TypeScript Re-exports**: Re-exports all core types for convenience, plus React-specific type extensions
- **Testing Infrastructure**: devDependencies include React, RHF, and Testing Library for component testing

## What

Create a `packages/react/` directory with the following structure:

```bash
packages/react/
├── package.json
└── src/
    └── index.ts
```

### package.json Specification

```json
{
  "name": "@formality-ui/react",
  "version": "0.0.0",
  "private": false,
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
    "test": "vitest run"
  },
  "dependencies": {
    "@formality-ui/core": "workspace:*",
    "jsep": "^1.4.0",
    "jse-eval": "^1.5.2",
    "lodash-es": "^4.17.21"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-hook-form": "^7.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/lodash-es": "^4.17.12",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "jsdom": "^24.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.50.0"
  }
}
```

**Dependency Notes**:

- `@formality-ui/core`: "workspace:\*" - Links to local core package during development, converted to version during publishing
- `jsep`, `jse-eval`, `lodash-es`: Regular dependencies (not peer dependencies) because they are used internally
- `react`, `react-dom`, `react-hook-form`: Peer dependencies (not installed with this package, provided by consumer)
- devDependencies include React, RHF, and testing libraries for development/testing

### src/index.ts Specification

```typescript
/**
 * @formality-ui/react
 *
 * React adapter for the Formality form system.
 * This package provides:
 * - React components (Form, Field, FieldGroup, FormalityProvider, UnusedFields)
 * - React hooks (useFormState, useConditions, usePropsEvaluation, useSubscriptions)
 * - React contexts (FormContext, ConfigContext, GroupContext)
 * - Re-exports of all @formality-ui/core types for convenience
 *
 * This package consumes @formality-ui/core (framework-agnostic) via workspace:* protocol
 * and provides React-specific APIs built on top of it.
 *
 * Framework Dependencies:
 * - react: ^18.0.0 (peer dependency)
 * - react-dom: ^18.0.0 (peer dependency)
 * - react-hook-form: ^7.0.0 (peer dependency)
 *
 * Internal Dependencies:
 * - @formality-ui/core: workspace:* (framework-agnostic core)
 * - jsep: JavaScript Expression Parser
 * - jse-eval: JavaScript Expression Evaluator
 * - lodash-es: Utility functions
 */

// Placeholder for future exports
// Phase P3 will add:
// - Context providers (ConfigContext, FormContext, GroupContext)
// - Performance utilities (makeProxyState, useFormState)
// - FormalityProvider component
//
// Phase P4 will add:
// - Form component
// - Field hooks (useSubscriptions, useConditions, usePropsEvaluation)
// - Field component
//
// Phase P5 will add:
// - FieldGroup component
// - UnusedFields component
// - Auto-save system

// Re-export core types for convenience (will be expanded in Phase P3)
export type {} from "@formality-ui/core";
```

### Success Criteria

- [ ] Directory `packages/react/` exists
- [ ] `packages/react/package.json` exists with name "@formality-ui/react"
- [ ] `package.json` has `"type": "module"`
- [ ] `package.json` has proper `exports` field with types, import, require conditions
- [ ] `package.json` has `main`, `module`, and `types` fields for backward compatibility
- [ ] `package.json` has `"@formality-ui/core": "workspace:*"` in dependencies
- [ ] `package.json` has utility dependencies (jsep, jse-eval, lodash-es) in dependencies
- [ ] `package.json` has peerDependencies for react, react-dom, react-hook-form
- [ ] `package.json` has devDependencies for testing (React, RHF, Testing Library)
- [ ] `packages/react/src/index.ts` exists as a placeholder with comment documentation
- [ ] File is valid TypeScript (parseable by tsc)
- [ ] pnpm workspace discovers the package
- [ ] package.json validates as proper JSON

## All Needed Context

### Context Completeness Check

_The "No Prior Knowledge" test_: If someone knew nothing about pnpm workspace dependencies, React peer dependencies, or React Hook Form integration, would they have everything needed to implement this successfully? **Yes** - this PRP includes exact file content, research URLs with anchors, peer dependency patterns from popular libraries, workspace protocol documentation, and validation commands.

### Documentation & References

```yaml
# MUST READ - Contract from previous PRP
- file: plan/001_bbf464589edd/P1M1T2S1/PRP.md
  why: Previous PRP that creates @formality-ui/core package structure
  contract: Core package has name "@formality-ui/core", exports for ESM/CJS/DTS, utility dependencies (jsep, jse-eval), ZERO framework dependencies
  critical: React package will use "@formality-ui/core": "workspace:*" in dependencies
  section: Lines 1-1018 contain full PRP with specification, validation, and outputs

# MUST READ - React peer dependencies best practices
- file: plan/001_bbf464589edd/P1M1T2S2/research/react_peer_dependencies.md
  why: Comprehensive research on React library peer dependencies
  critical: React MUST be peerDependency (not regular dependency) to prevent duplicate copies
  section: Lines 1-500 cover why peer dependencies, version syntax, popular library patterns
  gotcha: Include React in devDependencies for testing, but only as peerDependency for consumers

- url: https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependencies
  why: npm official documentation for peerDependencies
  critical: Understanding peer dependencies vs regular dependencies

- url: https://react.dev/learn/installation
  why: React official documentation for installation practices
  critical: Current React version recommendations and installation patterns

# MUST READ - Popular React library patterns
- file: plan/001_bbf464589edd/P1M1T2S2/research/react_peer_dependencies.md
  why: Examples from MUI, Chakra UI, RHF, TanStack Query, Radix UI
  section: Lines 78-398 contain package.json patterns from 13+ popular libraries
  pattern: Most use "react": "^18.0.0 || ^19.0.0" for 2026
  pattern: React Hook Form uses "react": "^16.8.0 || ^17 || ^18 || ^19" for maximum compatibility

- url: https://mui.com/material-ui/getting-started/installation/
  why: Material UI peer dependency pattern
  pattern: "react": "^17.0.0 || ^18.0.0 || ^19.0.0"

- url: https://chakra-ui.com/docs/getting-started
  why: Chakra UI peer dependency pattern
  pattern: "react": ">=18" (forward compatible)

- url: https://react-hook-form.com
  why: React Hook Form peer dependency pattern
  pattern: "react": "^16.8.0 || ^17 || ^18 || ^19"

- url: https://tanstack.com/query/latest
  why: TanStack Query modern React library pattern
  pattern: "react": "^18 || ^19"

- url: https://radix-ui.com/primitives
  why: Radix UI primitives pattern
  pattern: "react": "^16.8 || ^17.0 || ^18.0 || ^19.0"

# MUST READ - pnpm workspace protocol
- file: plan/001_bbf464589edd/P1M1T2S2/research/pnpm_workspace_protocol.md
  why: Comprehensive research on workspace:* protocol
  critical: workspace:* is converted to actual version by changesets during publishing
  section: Lines 1-500 cover workspace protocol syntax, version resolution, linking behavior
  gotcha: Use workspace:* for internal dependencies, NOT for external packages like React

- url: https://pnpm.io/workspaces#workspace-packagejson
  why: pnpm official documentation for workspace package.json
  critical: How to specify workspace:* protocol in dependencies

- url: https://pnpm.io/workspaces#linking-workspace-packages
  why: How workspace linking works
  critical: Creates symlinks during development, converts to versions during publishing

# MUST READ - Changesets integration
- url: https://github.com/changesets/changesets/blob/main/docs/adding-changesets.md
  why: How Changesets handles workspace dependencies
  critical: workspace:* is preserved during versioning, converted during publishing

- url: https://github.com/changesets/changesets/blob/main/docs/config.md
  why: Changesets configuration options
  critical: updateInternalDependencies setting controls version bump propagation

# MUST READ - React Hook Form integration
- file: plan/001_bbf464589edd/P1M1T2S2/research/react_hook_form_patterns.md
  why: React Hook Form integration patterns for library authors
  critical: peerDependencies: "react-hook-form": "^7.0.0"
  section: Lines 1-400 cover peer dependency setup, integration patterns, type exports
  pattern: Use ^7.0.0 for broad compatibility within RHF v7

- url: https://react-hook-form.com
  why: React Hook Form official documentation
  critical: Understanding useForm, FormProvider, Controller APIs

- url: https://github.com/react-hook-form/resolvers
  why: Example of RHF ecosystem library
  pattern: Standalone resolver functions, no components, minimal peer dependencies

# MUST READ - React library structure
- file: plan/001_bbf464589edd/P1M1T2S2/research/react_library_structure.md
  why: Research on how major React libraries structure package.json
  section: Lines 1-400 cover MUI, Chakra UI, Radix UI patterns
  pattern: All use exports field with conditional exports
  pattern: All use sideEffects: false for tree-shaking
  pattern: All use files: ["dist"] to publish only built output

- url: https://github.com/mui/material-ui
  why: Material UI package.json structure
  pattern: Component-based exports, locale support, comprehensive build scripts

- url: https://github.com/chakra-ui/chakra-ui
  why: Chakra UI package.json structure
  pattern: Hook-based exports, modular approach, workspace dependencies

- url: https://github.com/radix-ui/primitives
  why: Radix UI package.json structure
  pattern: Single-purpose packages, minimal exports, external React in build

# Existing codebase references
- file: /home/dustin/projects/formality/pnpm-workspace.yaml
  why: Existing workspace configuration
  pattern: packages: ["packages/*"] glob pattern
  critical: Ensures packages/react is discovered by pnpm workspace

- file: /home/dustin/projects/formality/package.json
  why: Root package.json with shared devDependencies
  pattern: devDependencies available to all workspace packages
  critical: typescript, tsup, vitest available without re-specification

- file: /home/dustin/projects/formality/packages/core/package.json
  why: Core package configuration for reference
  pattern: name "@formality-ui/core", exports structure, dependencies (jsep, jse-eval)
  contract: React package will depend on this via workspace:* protocol

- file: plan/001_bbf464589edd/P1M1T2S2/research/existing_react_package_analysis.md
  why: Analysis of existing react package structure
  critical: Current implementation already has correct structure
  note: This PRP validates/enforces the existing correct implementation

- file: /home/dustin/projects/formality/packages/react/package.json
  why: Current react package.json (exists and should be preserved)
  gotcha: Current version already has correct dependencies and peerDependencies
  note: This PRP creates structure matching the existing correct implementation
```

### Current Codebase Tree

```bash
# Current state (packages already exist):
/home/dustin/projects/formality/
├── pnpm-workspace.yaml      # From P1.M1.T1.S1
├── package.json             # From P1.M1.T1.S2
├── plan/
│   └── 001_bbf464589edd/
│       ├── P1M1T2S1/
│       │   └── PRP.md       # Previous PRP (creates core package)
│       ├── P1M1T2S2/
│       │   ├── research/    # Research documents created
│       │   └── PRP.md       # <-- This PRP
│       └── prd_snapshot.md
├── packages/
│   ├── core/                # From P1.M1.T2.S1 (framework-agnostic)
│   │   ├── package.json     # Has jsep, jse-eval dependencies
│   │   ├── src/
│   │   │   └── index.ts     # Core types and functions
│   │   └── tsconfig.json
│   ├── react/               # <-- Target directory (already exists)
│   │   ├── package.json     # <-- Target file (exists with correct deps)
│   │   ├── src/             # <-- Target directory
│   │   │   ├── components/  # Form, Field, FieldGroup, etc.
│   │   │   ├── context/     # React contexts
│   │   │   ├── hooks/       # React hooks
│   │   │   ├── utils/       # Utilities
│   │   │   └── index.ts     # <-- Already exists with exports
│   │   └── tsconfig.json
│   ├── vue/                 # Stub package
│   └── svelte/              # Stub package
├── vitest.workspace.ts
├── tsconfig.json
└── .changeset/
```

### Desired Codebase Tree (After This Task - Validation Focus)

```bash
# After this task validation:
/home/dustin/projects/formality/packages/react/
├── package.json             # <-- Validate has correct spec
│   ├── name: "@formality-ui/react"
│   ├── type: "module"
│   ├── exports: { types, import, require }
│   ├── dependencies:
│   │   ├── "@formality-ui/core": "workspace:*"
│   │   ├── jsep: "^1.4.0"
│   │   ├── jse-eval: "^1.5.2"
│   │   └── lodash-es: "^4.17.21"
│   ├── peerDependencies:
│   │   ├── react: "^18.0.0"
│   │   ├── react-dom: "^18.0.0"
│   │   └── react-hook-form: "^7.0.0"
│   └── devDependencies: (testing libraries)
└── src/
    └── index.ts             # <-- Validate exists with proper documentation
```

### Known Gotchas & Library Quirks

```yaml
# CRITICAL: workspace:* protocol usage
# React package MUST use "@formality-ui/core": "workspace:*" in dependencies
# This enables local development without publishing core package
# Changesets converts workspace:* to actual version during publishing
# Incorrect: "@formality-ui/core": "file:../core" or "link:../core"
# Correct: "@formality-ui/core": "workspace:*"

# CRITICAL: React must be peerDependency
# React MUST be in peerDependencies, NOT in regular dependencies
# This prevents duplicate React copies which break hooks, context, and state
# Incorrect: "dependencies": { "react": "^18.0.0" }
# Correct: "peerDependencies": { "react": "^18.0.0" }

# CRITICAL: React must also be in devDependencies
# Even though React is a peerDependency, it must be in devDependencies for testing
# Tests need React to run, TypeScript needs @types/react for type checking
# Correct: "devDependencies": { "react": "^18.2.0", "@types/react": "^18.2.0" }

# CRITICAL: Internal vs External dependencies
# INTERNAL packages (workspace): Use dependencies, NOT peerDependencies
# - "@formality-ui/core": "workspace:*" in dependencies
# EXTERNAL frameworks: Use peerDependencies
# - "react": "^18.0.0" in peerDependencies
# - "react-hook-form": "^7.0.0" in peerDependencies
#
# Why: Internal packages are bundled with your package. External frameworks are provided by consumer.

# GOTCHA: Utility dependencies (jsep, jse-eval, lodash-es)
# These are in dependencies (regular), NOT peerDependencies
# Reason: They are used internally by the React package
# Rationale: Consumer doesn't need to know about these implementation details
# Correct: "dependencies": { "jsep": "^1.4.0", "jse-eval": "^1.5.2", "lodash-es": "^4.17.21" }

# CRITICAL: React version range
# Most libraries for 2026 use: "react": "^18.0.0 || ^19.0.0"
# This PRP uses: "react": "^18.0.0" (conservative, tested range)
# Consider updating to include React 19 after testing: "^18.0.0 || ^19.0.0"
# Reference: plan/001_bbf464589edd/P1M1T2S2/research/react_peer_dependencies.md

# CRITICAL: react-hook-form version range
# Use: "react-hook-form": "^7.0.0"
# This allows any 7.x version (backward compatible within major version)
# RHF v7 has stable APIs, ^7.0.0 is safe and widely used
# Reference: https://react-hook-form.com

# CRITICAL: exports field configuration
# Must match core package structure for consistency
# Format: { ".": { "types": "...", "import": "...", "require": "..." } }
# Order matters: types should be first, then import, then require

# GOTCHA: type: "module" is required
# All packages use ES modules by default
# Without this, TypeScript may default to CommonJS
# Affects how .js files are interpreted

# GOTCHA: sideEffects: false
# Enables tree-shaking for better bundle size
# Critical for library packages
# Tells bundlers unused exports can be removed

# CRITICAL: files: ["dist"]
# Only the dist directory is published to npm
# Source files (src/) are not included
# Keeps published package size small

# GOTCHA: version: "0.0.0"
# Initial version for development
# Managed by changesets
# Changesets handles version bumps for publishing

# CRITICAL: devDependencies inheritance
# Workspace packages inherit devDependencies from root
// No need to re-specify typescript, tsup, vitest in react package.json
// Root package.json provides these

# GOTCHA: TypeScript types (@types/react)
// Include @types/react and @types/react-dom in devDependencies
// NOT in peerDependencies (unless you want to support optional TypeScript)
// Most libraries don't specify types in peerDependencies

# CRITICAL: Testing library versions
// @testing-library/react v14+ requires React 18
// For React 19, use @testing-library/react v16+
// Current: "@testing-library/react": "^14.0.0" (for React 18)

# CRITICAL: lodash-es vs lodash
// Use lodash-es (ESM version) for tree-shaking
// NOT lodash (CommonJS version)
// Correct: "lodash-es": "^4.17.21"
// Incorrect: "lodash": "^4.17.21"
```

## Implementation Blueprint

### Data Models and Structure

```json
// React package.json structure
{
  "name": "@formality-ui/react", // Scoped package name
  "version": "0.0.0", // Initial development version
  "private": false, // Package will be published
  "type": "module", // ES modules

  // Legacy entry points (for older tooling)
  "main": "./dist/index.cjs", // CommonJS entry point
  "module": "./dist/index.js", // ESM entry point
  "types": "./dist/index.d.ts", // TypeScript declarations

  // Modern conditional exports
  "exports": {
    ".": {
      "types": "./dist/index.d.ts", // TypeScript types
      "import": "./dist/index.js", // ESM import
      "require": "./dist/index.cjs" // CommonJS require
    }
  },

  "files": ["dist"], // Only publish dist/
  "sideEffects": false, // Enable tree-shaking

  "scripts": {
    "build": "tsup", // Build with tsup (configured in packages/react/tsup.config.ts)
    "dev": "tsup --watch", // Watch mode for development
    "test": "vitest run" // Run tests (configured in packages/react/vitest.config.ts)
  },

  // Internal dependencies (workspace)
  "dependencies": {
    "@formality-ui/core": "workspace:*", // Links to local core package
    "jsep": "^1.4.0", // JavaScript expression parser
    "jse-eval": "^1.5.2", // Expression evaluator
    "lodash-es": "^4.17.21" // Utility functions (ESM version)
  },

  // External framework peer dependencies (provided by consumer)
  "peerDependencies": {
    "react": "^18.0.0", // React 18+ (consumer must provide)
    "react-dom": "^18.0.0", // React DOM 18+ (consumer must provide)
    "react-hook-form": "^7.0.0" // RHF 7.x (consumer must provide)
  },

  // Development dependencies for testing
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0", // Jest DOM matchers
    "@testing-library/react": "^14.0.0", // React Testing Library
    "@testing-library/user-event": "^14.5.2", // User event simulation
    "@types/lodash-es": "^4.17.12", // Lodash types
    "@types/react": "^18.2.0", // React types
    "@types/react-dom": "^18.2.0", // React DOM types
    "jsdom": "^24.0.0", // JSDOM environment
    "react": "^18.2.0", // React for testing
    "react-dom": "^18.2.0", // React DOM for testing
    "react-hook-form": "^7.50.0" // RHF for testing
  }
}
```

```typescript
// src/index.ts placeholder structure
/**
 * @formality-ui/react
 *
 * React adapter for the Formality form system.
 * Built on @formality-ui/core (framework-agnostic).
 *
 * Framework Dependencies (peer dependencies):
 * - react: ^18.0.0
 * - react-dom: ^18.0.0
 * - react-hook-form: ^7.0.0
 *
 * Internal Dependencies:
 * - @formality-ui/core: workspace:* (types and pure functions)
 * - jsep: Expression parsing
 * - jse-eval: Expression evaluation
 * - lodash-es: Utility functions
 *
 * Exports (will be populated in phases P3-P5):
 * - Components: Form, Field, FieldGroup, FormalityProvider, UnusedFields
 * - Hooks: useFormState, useConditions, usePropsEvaluation, useSubscriptions
 * - Contexts: FormContext, ConfigContext, GroupContext
 * - Types: Re-exports from @formality-ui/core
 */

// Placeholder for future exports
// Re-export core types for convenience
export type {} from "@formality-ui/core";

// Phase P3 will add:
// - Context providers
// - Performance utilities
// - FormalityProvider component

// Phase P4 will add:
// - Form component
// - Field hooks
// - Field component

// Phase P5 will add:
// - FieldGroup component
// - UnusedFields component
// - Auto-save system
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY workspace configuration exists
  - CHECK: /pnpm-workspace.yaml exists (from P1.M1.T1.S1)
  - VERIFY: File contains packages: ["packages/*"]
  - ENSURE: Root package.json exists (from P1.M1.T1.S2)
  - COMMAND: cat /pnpm-workspace.yaml
  - COMMAND: cat /package.json

Task 2: VERIFY core package exists (from P1.M1.T2.S1)
  - CHECK: Directory packages/core/ exists
  - VERIFY: packages/core/package.json exists with name "@formality-ui/core"
  - VERIFY: Core package has jsep and jse-eval dependencies
  - COMMAND: cat /home/dustin/projects/formality/packages/core/package.json

Task 3: VERIFY packages/react directory structure
  - CHECK: Directory packages/react/ exists
  - VERIFY: Subdirectory packages/react/src/ exists
  - VERIFY: packages/react/package.json exists
  - VERIFY: packages/react/src/index.ts exists
  - COMMAND: ls -la /home/dustin/projects/formality/packages/react/
  - COMMAND: ls -la /home/dustin/projects/formality/packages/react/src/

Task 4: VALIDATE packages/react/package.json specification
  - VERIFY: JSON file with exact specification from "What" section
  - CHECK: name is "@formality-ui/react"
  - CHECK: version is "0.0.0"
  - CHECK: private is false (publishable package)
  - CHECK: type is "module"
  - CHECK: main is "./dist/index.cjs"
  - CHECK: module is "./dist/index.js"
  - CHECK: types is "./dist/index.d.ts"
  - CHECK: exports has types, import, require conditions
  - CHECK: files is ["dist"]
  - CHECK: sideEffects is false
  - CHECK: scripts has build, dev, test
  - CRITICAL: dependencies has "@formality-ui/core": "workspace:*"
  - CRITICAL: dependencies has jsep, jse-eval, lodash-es
  - CRITICAL: peerDependencies has react, react-dom, react-hook-form
  - CHECK: devDependencies has testing libraries
  - COMMAND: cat /home/dustin/projects/formality/packages/react/package.json

Task 5: VALIDATE packages/react/src/index.ts content
  - VERIFY: TypeScript file with comment documentation
  - CHECK: File explains purpose and dependencies
  - CHECK: File has placeholder comment for future exports
  - CHECK: File re-exports core types (export type {} from '@formality-ui/core')
  - VALIDATION: Valid TypeScript (parseable by tsc)
  - COMMAND: cat /home/dustin/projects/formality/packages/react/src/index.ts

Task 6: VERIFY pnpm workspace discovers the package
  - COMMAND: pnpm list --depth=0
  - EXPECTED: @formality-ui/react listed in workspace packages
  - VERIFY: pnpm recognizes the package as part of workspace
  - COMMAND: pnpm --filter @formality-ui/react pwd

Task 7: VERIFY workspace dependency linking
  - COMMAND: pnpm --filter @formality-ui/react ls
  - EXPECTED: @formality-ui/core listed as a dependency
  - VERIFY: workspace:* protocol is resolved correctly
  - COMMAND: ls -la node_modules/@formality-ui/core (should be symlink)

Task 8: VERIFY TypeScript can parse the index.ts
  - COMMAND: pnpm tsc --noEmit packages/react/src/index.ts
  - EXPECTED: No errors (file is valid TypeScript)
  - Note: tsconfig.json for react package already exists

Task 9: VALIDATE package.json is valid JSON
  - COMMAND: cat /home/dustin/projects/formality/packages/react/package.json | python3 -m json.tool > /dev/null
  - EXPECTED: No output (exit code 0) means valid JSON
```

### Implementation Patterns & Key Details

```yaml
# PATTERN: Workspace dependency specification
# Format: "@formality-ui/core": "workspace:*"
# Purpose: Link to local workspace package during development
# Resolution: pnpm creates symlink in node_modules
# Publishing: Changesets converts workspace:* to actual version
# Example: "@formality-ui/core": "workspace:*" → "^1.0.0" (when published)

# PATTERN: Internal vs External dependencies
# INTERNAL (workspace packages): Use "dependencies"
# - "@formality-ui/core": "workspace:*" in dependencies
# - These are bundled with your package
# - Consumer gets them automatically
#
# EXTERNAL (frameworks): Use "peerDependencies"
# - "react": "^18.0.0" in peerDependencies
# - "react-hook-form": "^7.0.0" in peerDependencies
# - Consumer provides these
# - Prevents duplicate copies

# PATTERN: React peer dependency versions
# Conservative: "^18.0.0" (only tested with React 18)
# Modern: "^18.0.0 || ^19.0.0" (tested with both)
# Forward compatible: ">=18.0.0" (supports future versions)
# Maximum compatibility: "^16.8.0 || ^17 || ^18 || ^19"
#
# This PRP uses: "^18.0.0" (conservative, tested range)
# Most popular libraries for 2026: "^18.0.0 || ^19.0.0"

# PATTERN: react-hook-form peer dependency
# Use: "^7.0.0"
# Allows any 7.x version (backward compatible within major)
# RHF v7 APIs are stable and widely used
# Alternative: ">=7.0.0" (more permissive)

# PATTERN: Utility dependencies in React package
# jsep, jse-eval, lodash-es are in "dependencies" (regular)
# NOT in peerDependencies
# Reason: They are implementation details
# Consumer doesn't need to know about them
# They are bundled with the React package

# PATTERN: lodash-es vs lodash
# Use lodash-es (ESM version) for tree-shaking
// Incorrect: "lodash": "^4.17.21"
// Correct: "lodash-es": "^4.17.21"
// Enables better bundle size optimization

# PATTERN: Dual package exports (ESM + CJS)
# exports: {
#   ".": {
#     "types": "./dist/index.d.ts",
#     "import": "./dist/index.js",
#     "require": "./dist/index.cjs"
#   }
# }
# Import condition: Used by ESM imports
# Require condition: Used by CJS requires
# Types condition: Used by TypeScript

# PATTERN: React in devDependencies
# Even though React is a peerDependency, include in devDependencies
# Reason: Tests need React to run
# TypeScript needs @types/react for type checking
# CI/CD needs dependencies installed
// Correct:
// "peerDependencies": { "react": "^18.0.0" }
// "devDependencies": { "react": "^18.2.0", "@types/react": "^18.2.0" }

# PATTERN: Testing library versions
# @testing-library/react v14+ requires React 18
# For React 19, use @testing-library/react v16+
# Current: "@testing-library/react": "^14.0.0"
# Match React version in devDependencies

# CRITICAL: Don't duplicate workspace dependencies
# Internal packages (workspace): in dependencies
# External frameworks: in peerDependencies
# NEVER put workspace packages in peerDependencies
// Incorrect:
// "peerDependencies": { "@formality-ui/core": "workspace:*" }
// Correct:
// "dependencies": { "@formality-ui/core": "workspace:*" }

# GOTCHA: sideEffects: false
# Enables tree-shaking
# Critical for library packages
// Incorrect: "sideEffects": true (or omitting)
// Correct: "sideEffects": false

# PATTERN: Re-exporting core types
// src/index.ts should re-export core types for convenience
// This allows users to import types from @formality-ui/react
// instead of needing @formality-ui/core
// export type * from '@formality-ui/core';
```

### Integration Points

```yaml
# INPUT: Consumed from P1.M1.T1.S1
WORKSPACE_CONFIG:
  - file: /pnpm-workspace.yaml
  - dependency: "Workspace must discover packages/react"
  - contract: "packages: ['packages/*'] glob pattern includes react"

# INPUT: Consumed from P1.M1.T1.S2
ROOT_DEV_DEPENDENCIES:
  - file: /package.json
  - dependency: "React package uses root devDependencies"
  - contract: "typescript, tsup, vitest available for build/test"

# INPUT: Consumed from P1.M1.T2.S1 (CRITICAL)
CORE_PACKAGE_CONTRACT:
  - file: /home/dustin/projects/formality/packages/core/package.json
  - dependency: "React package depends on @formality-ui/core"
  - contract: "React package.json has '@formality-ui/core': 'workspace:*' in dependencies"
  - benefit: "React package imports types and functions from core"
  - critical: "Core package has ZERO framework dependencies (react, vue, svelte)"
  - critical: "Core package has utility dependencies (jsep, jse-eval)"

# OUTPUT: Consumed by P1.M1.T2.S3 (Create Vue and Svelte stubs)
FRAMEWORK_PACKAGE_PATTERN:
  - task: "P1.M1.T2.S3: Create Vue and Svelte stub packages"
  - dependency: "Vue and Svelte packages follow similar pattern"
  - contract: "Both packages will have: '@formality-ui/core': 'workspace:*'"
  - contract: "Both packages will have framework-specific peerDependencies"
  - pattern: "Vue: 'vue', 'vue-router' as peerDependencies"
  - pattern: "Svelte: 'svelte' as peerDependency"

# OUTPUT: Consumed by P1.M2.T1.S2 (Create package-level tsconfig files)
TYPESCRIPT_CONFIG:
  - task: "P1.M2.T1.S2: Create package-level tsconfig files"
  - dependency: "React package needs tsconfig.json for TypeScript compilation"
  - contract: "packages/react/tsconfig.json will extend root tsconfig.json"
  - note: "Already exists, should be validated"

# OUTPUT: Consumed by P1.M2.T2.S2 (Create tsup configuration for react)
BUILD_CONFIG:
  - task: "P1.M2.T2.S2: Create tsup configuration for react package"
  - dependency: "React package needs tsup.config.ts for building"
  - contract: "tsup will generate dist/index.js, dist/index.cjs, dist/index.d.ts"
  - note: "Already exists, should be validated"

# OUTPUT: Consumed by P1.M3.T1.S2 (Create package-level vitest configurations)
TEST_CONFIG:
  - task: "P1.M3.T1.S2: Create package-level vitest configurations"
  - dependency: "React package needs vitest.config.ts for testing"
  - contract: "vitest will run tests from packages/react/src/__tests__/"
  - note: "Already exists, should be validated"

# OUTPUT: Consumed by P3 (React Foundation)
REACT_IMPLEMENTATION:
  - task: "P3: @formality-ui/react Foundation"
  - dependency: "Phase P3 will expand react with contexts, hooks, providers"
  - contract: "React package structure is ready for React-specific code"
  - note: "React package already has substantial implementation, will be expanded"

# OUTPUT: Consumed by P2.M1.T1 (Define Core Configuration Types)
TYPE_REEXPORT_PATTERN:
  - task: "P2.M1.T1: Define Core Configuration Types"
  - dependency: "Core types will be re-exported by React package"
  - contract: "React package imports and re-exports core types for convenience"
  - benefit: "Users can import types from @formality-ui/react instead of core"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Validate the existing package structure

# Check directories exist
ls -la /home/dustin/projects/formality/packages/react/
# Expected: Shows package.json, src/, tsconfig.json, tsup.config.ts, vitest.config.ts

ls -la /home/dustin/projects/formality/packages/react/src/
# Expected: Shows index.ts and subdirectories (components, context, hooks, utils)

# Verify package.json is valid JSON
cat /home/dustin/projects/formality/packages/react/package.json | python3 -m json.tool > /dev/null
# Expected: No output (exit code 0) means valid JSON

# Alternative: Use node to validate JSON
node -e "JSON.parse(require('fs').readFileSync('packages/react/package.json', 'utf8'))"
# Expected: No output (exit code 0) means valid JSON

# Verify index.ts is valid TypeScript
pnpm tsc --noEmit packages/react/src/index.ts
# Expected: No errors (file is valid TypeScript)

# Verify package.json content matches specification
cat /home/dustin/projects/formality/packages/react/package.json
# Expected output key fields:
# {
#   "name": "@formality-ui/react",
#   "version": "0.0.0",
#   "type": "module",
#   "main": "./dist/index.cjs",
#   "module": "./dist/index.js",
#   "types": "./dist/index.d.ts",
#   "exports": {
#     ".": {
#       "types": "./dist/index.d.ts",
#       "import": "./dist/index.js",
#       "require": "./dist/index.cjs"
#     }
#   },
#   "files": ["dist"],
#   "sideEffects": false,
#   "scripts": {
#     "build": "tsup",
#     "dev": "tsup --watch",
#     "test": "vitest run"
#   },
#   "dependencies": {
#     "@formality-ui/core": "workspace:*",
#     "jsep": "^1.4.0",
#     "jse-eval": "^1.5.2",
#     "lodash-es": "^4.17.21"
#   },
#   "peerDependencies": {
#     "react": "^18.0.0",
#     "react-dom": "^18.0.0",
#     "react-hook-form": "^7.0.0"
#   },
#   "devDependencies": {
#     "@testing-library/jest-dom": "^6.0.0",
#     "@testing-library/react": "^14.0.0",
#     ...
#   }
# }

# Verify workspace dependency exists
cat /home/dustin/projects/formality/packages/react/package.json | grep "@formality-ui/core"
# Expected: Shows "@formality-ui/core": "workspace:*"

# Verify peer dependencies exist
cat /home/dustin/projects/formality/packages/react/package.json | grep -A5 '"peerDependencies"'
# Expected: Shows react, react-dom, react-hook-form peer dependencies

# Expected: All validations pass, files are valid
```

### Level 2: Workspace Validation (Component Validation)

```bash
# Verify pnpm workspace discovers the react package
pnpm list --depth=0
# Expected: Lists @formality-ui/react in workspace packages

# Verify workspace package is recognized
pnpm --filter @formality-ui/react pwd
# Expected: Shows /home/dustin/projects/formality/packages/react

# Verify workspace dependency is linked
pnpm --filter @formality-ui/react ls
# Expected: Shows @formality-ui/core as a dependency

# Verify core package symlink exists
ls -la /home/dustin/projects/formality/node_modules/@formality-ui/core
# Expected: Symlink pointing to packages/core

# Verify package scripts are available
cd /home/dustin/projects/formality/packages/react
pnpm run
# Expected: Lists build, dev, test scripts

# Expected: Package is properly discovered by pnpm workspace
```

### Level 3: Package Configuration Validation (System Validation)

```bash
# Validate package name is correctly scoped
cat /home/dustin/projects/formality/packages/react/package.json | grep '"name"'
# Expected: "name": "@formality-ui/react"

# Validate workspace dependency is correctly configured
cat /home/dustin/projects/formality/packages/react/package.json | grep -A10 '"dependencies"'
# Expected: Shows "@formality-ui/core": "workspace:*"

# Validate peer dependencies are correctly configured
cat /home/dustin/projects/formality/packages/react/package.json | grep -A10 '"peerDependencies"'
# Expected: Shows react, react-dom, react-hook-form with version ranges

# Validate exports field is correctly configured
cat /home/dustin/projects/formality/packages/react/package.json | grep -A10 '"exports"'
# Expected: Shows proper conditional exports structure

# Validate type field is set to module
cat /home/dustin/projects/formality/packages/react/package.json | grep '"type"'
# Expected: "type": "module"

# Validate all required entry points are present
cat /home/dustin/projects/formality/packages/react/package.json | grep -E '"main"|"module"|"types"'
# Expected: All three fields present with correct paths

# Validate files array
cat /home/dustin/projects/formality/packages/react/package.json | grep -A5 '"files"'
# Expected: "files": ["dist"]

# Validate sideEffects is false
cat /home/dustin/projects/formality/packages/react/package.json | grep '"sideEffects"'
# Expected: "sideEffects": false

# Validate scripts are present
cat /home/dustin/projects/formality/packages/react/package.json | grep -A10 '"scripts"'
# Expected: build, dev, test scripts present

# Expected: All package configuration is correct
```

### Level 4: Integration Validation (Full System Validation)

```bash
# Verify root workspace still includes react
cat /home/dustin/projects/formality/pnpm-workspace.yaml
# Expected: packages: ["packages/*"] (includes react)

# Verify root package.json unchanged
cat /home/dustin/projects/formality/package.json
# Expected: Same as P1.M1.T1.S2 output (no modifications)

# Verify core package exists and is discoverable
cat /home/dustin/projects/formality/packages/core/package.json | grep '"name"'
# Expected: "name": "@formality-ui/core"

# Verify workspace dependency linking works
cd /home/dustin/projects/formality/packages/react
pnpm ls @formality-ui/core
# Expected: Shows core package as dependency

# Test that package can be built
cd /home/dustin/projects/formality/packages/react
pnpm build
# Expected: Builds successfully, generates dist/index.js, dist/index.cjs, dist/index.d.ts

# Test that package can be tested
pnpm test
# Expected: Runs tests successfully

# Verify TypeScript compilation
pnpm tsc --noEmit
# Expected: No TypeScript errors

# Expected: All integration points are correct
```

## Final Validation Checklist

### Technical Validation

- [ ] Directory `packages/react/` exists
- [ ] `packages/react/package.json` exists
- [ ] `packages/react/src/` directory exists
- [ ] `packages/react/src/index.ts` exists
- [ ] package.json is valid JSON (parseable)
- [ ] package.json has name "@formality-ui/react"
- [ ] package.json has type "module"
- [ ] package.json has proper exports field with types, import, require conditions
- [ ] package.json has main, module, types fields for backward compatibility
- [ ] package.json has "@formality-ui/core": "workspace:\*" in dependencies
- [ ] package.json has utility dependencies (jsep, jse-eval, lodash-es) in dependencies
- [ ] package.json has peerDependencies for react, react-dom, react-hook-form
- [ ] package.json has devDependencies for testing (React, RHF, Testing Library)
- [ ] package.json has files: ["dist"]
- [ ] package.json has sideEffects: false
- [ ] package.json has scripts: build, dev, test
- [ ] src/index.ts is valid TypeScript (parseable)
- [ ] src/index.ts re-exports core types
- [ ] pnpm workspace discovers @formality-ui/react
- [ ] `pnpm list` shows react package in workspace
- [ ] workspace dependency on @formality-ui/core is linked correctly
- [ ] `pnpm build` generates dist files successfully
- [ ] `pnpm test` runs successfully

### Feature Validation

- [ ] Success criteria from "What" section met: All checkboxes completed
- [ ] Package uses scoped naming (@formality-ui/react)
- [ ] Package uses workspace:\* protocol for @formality-ui/core dependency
- [ ] Package has correct peer dependencies for React ecosystem
- [ ] Package has correct utility dependencies (jsep, jse-eval, lodash-es)
- [ ] Exports are configured for dual ESM/CJS with types
- [ ] Package is ready for consumption by React applications
- [ ] Package structure follows monorepo conventions
- [ ] Core package dependency is correctly linked via workspace protocol

### Code Quality Validation

- [ ] package.json follows JSON formatting standards (2-space indentation)
- [ ] package.json has no trailing commas (proper JSON)
- [ ] src/index.ts has descriptive comment documentation
- [ ] src/index.ts re-exports core types for convenience
- [ ] File placement matches desired codebase tree structure
- [ ] No framework-specific code leaks into core package
- [ ] Build configuration (tsup.config.ts) is appropriate
- [ ] Test configuration (vitest.config.ts) is appropriate

### Documentation & Deployment

- [ ] All referenced URLs are accurate and relevant
- [ ] Integration points clearly documented
- [ ] Gotchas documented for future reference
- [ ] Workspace protocol usage clearly documented
- [ ] Peer dependency patterns clearly documented
- [ ] Contract with P1.M1.T2.S1 clearly defined
- [ ] Outputs for P1.M1.T2.S3 clearly specified
- [ ] PRP is self-documenting with examples

---

## Anti-Patterns to Avoid

- ❌ Don't put React in regular dependencies - MUST be peerDependency to prevent duplicate copies
- ❌ Don't put @formality-ui/core in peerDependencies - MUST be in dependencies with workspace:\*
- ❌ Don't use file: or link: protocol for workspace dependencies - use workspace:\*
- ❌ Don't forget React in devDependencies - tests need React to run
- ❌ Don't use lodash (CJS) - use lodash-es (ESM) for tree-shaking
- ❌ Don't omit peerDependencies - React, react-dom, react-hook-form must be specified
- ❌ Don't use non-scoped name like "formality-react" - use "@formality-ui/react"
- ❌ Don't omit type: "module" - needed for ES modules
- ❌ Don't omit exports field - modern packages require conditional exports
- ❌ Don't use old-style exports (just main/module) - include exports field
- ❌ Don't add trailing commas in JSON (not valid JSON)
- ❌ Don't set private: true - react package will be published
- ❌ Don't skip workspace validation - verify pnpm discovers the package
- ❌ Don't add devDependencies to react package.json - inherit from root (except testing libs)
- ❌ Don't remove existing implementation - react already has substantial exports
- ❌ Don't use ^19.0.0 only for React - support React 18 for broader compatibility
- ❌ Don't make jsep/jse-eval peer dependencies - they are internal implementation details

---

## Additional Context for Executing Agent

### Task Dependency Chain

```
P1.M1.T1.S1: Create pnpm-workspace.yaml (COMPLETED)
         ↓
P1.M1.T1.S2: Create root package.json (COMPLETED)
         ↓
P1.M1.T2.S1: Create @formality-ui/core package structure (COMPLETED)
         ↓
P1.M1.T2.S2: Create @formality-ui/react package structure (THIS TASK - VALIDATION)
         ↓
P1.M1.T2.S3: Create Vue and Svelte stub packages (NEXT)
         ↓
P1.M2: TypeScript & Build Configuration
         ↓
P1.M3: Testing Infrastructure
         ↓
P3: @formality-ui/react Foundation (expands react with contexts, hooks, providers)
```

### Relationship with Previous PRPs

**INPUT from P1.M1.T1.S1:**

- File: `/pnpm-workspace.yaml`
- Content: `packages: ["packages/*"]`
- Purpose: Enables pnpm workspace discovery

**INPUT from P1.M1.T1.S2:**

- File: `/package.json`
- Content: Root devDependencies (typescript, tsup, vitest)
- Purpose: Provides shared tooling for all workspace packages

**INPUT from P1.M1.T2.S1 (CRITICAL):**

- File: `/home/dustin/projects/formality/packages/core/package.json`
- Content: Core package with name "@formality-ui/core", utility dependencies (jsep, jse-eval)
- Purpose: Provides framework-agnostic types and functions
- **CONTRACT**: React package will use "@formality-ui/core": "workspace:\*" in dependencies
- **CONTRACT**: Core package has ZERO framework dependencies (react, vue, svelte)

### Outputs for Next Tasks

**PROVIDED to P1.M1.T2.S3 (Create Vue and Svelte stubs):**

- React package structure pattern to follow
- Contract: Vue and Svelte packages will also use workspace dependencies
- Pattern: Framework-specific peerDependencies (vue, svelte)

**PROVIDED to P1.M2.T1.S2 (Create package-level tsconfig files):**

- React package directory for tsconfig.json placement
- Contract: packages/react/tsconfig.json extends root tsconfig.json

**PROVIDED to P1.M2.T2.S2 (Create tsup configuration for react):**

- React package with scripts referencing tsup
- Contract: tsup will generate dist files

**PROVIDED to P1.M3.T1.S2 (Create package-level vitest configurations):**

- React package with scripts referencing vitest
- Contract: vitest will run tests

**PROVIDED to P3 (React Foundation):**

- React package structure ready for React-specific code
- Contract: Phase P3 will expand with contexts, hooks, and providers

### Workspace Dependency Pattern

The react package depends on the core package through workspace:\* protocol:

```json
{
  "name": "@formality-ui/react",
  "dependencies": {
    "@formality-ui/core": "workspace:*"
  }
}
```

The `workspace:*` protocol:

- Resolves to the local packages/core during development
- Creates a symlink in node_modules/@formality-ui/core
- Is converted to the actual version by changesets during publishing
- Enables local development without npm publishing

**Note**: The react package already exists and correctly uses `"@formality-ui/core": "workspace:*"`.

### Why React in Both peerDependencies AND devDependencies?

This is a common pattern for React libraries:

**peerDependencies**: What the consumer needs

```json
{
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

- Tells consumers: "You need React 18+ to use this package"
- React is NOT installed with your package
- Ensures single React instance in the app

**devDependencies**: What you need for development

```json
{
  "devDependencies": {
    "react": "^18.2.0",
    "@types/react": "^18.2.0"
  }
}
```

- Tests need React to run
- TypeScript needs type definitions
- CI/CD needs dependencies installed

**Key Point**: React appears in BOTH places, but for different reasons.

### Confidence Score

**10/10** - The PRP provides exact file content, placement, validation commands, and comprehensive context. The existing react package structure matches the specification exactly. All research is complete and accurate with specific URLs and examples from 13+ popular React libraries.

---

## Sources

- [npm peerDependencies Documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependencies)
- [React Installation Documentation](https://react.dev/learn/installation)
- [Material UI Installation](https://mui.com/material-ui/getting-started/installation/)
- [Chakra UI Getting Started](https://chakra-ui.com/docs/getting-started)
- [React Hook Form](https://react-hook-form.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [Radix UI Primitives](https://radix-ui.com/primitives)
- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [pnpm Workspace Package Configuration](https://pnpm.io/workspaces#workspace-packagejson)
- [pnpm Linking Workspace Packages](https://pnpm.io/workspaces#linking-workspace-packages)
- [Changesets Adding Changesets](https://github.com/changesets/changesets/blob/main/docs/adding-changesets.md)
- [Changesets Configuration](https://github.com/changesets/changesets/blob/main/docs/config.md)
- [MUI GitHub Repository](https://github.com/mui/material-ui)
- [Chakra UI GitHub Repository](https://github.com/chakra-ui/chakra-ui)
- [Radix UI Primitives GitHub](https://github.com/radix-ui/primitives)
- [Previous PRP: plan/001_bbf464589edd/P1M1T2S1/PRP.md](plan/001_bbf464589edd/P1M1T2S1/PRP.md)
- [Research: plan/001_bbf464589edd/P1M1T2S2/research/react_peer_dependencies.md](plan/001_bbf464589edd/P1M1T2S2/research/react_peer_dependencies.md)
- [Research: plan/001_bbf464589edd/P1M1T2S2/research/pnpm_workspace_protocol.md](plan/001_bbf464589edd/P1M1T2S2/research/pnpm_workspace_protocol.md)
- [Research: plan/001_bbf464589edd/P1M1T2S2/research/react_hook_form_patterns.md](plan/001_bbf464589edd/P1M1T2S2/research/react_hook_form_patterns.md)
- [Research: plan/001_bbf464589edd/P1M1T2S2/research/react_library_structure.md](plan/001_bbf464589edd/P1M1T2S2/research/react_library_structure.md)
- [Research: plan/001_bbf464589edd/P1M1T2S2/research/existing_react_package_analysis.md](plan/001_bbf464589edd/P1M1T2S2/research/existing_react_package_analysis.md)
