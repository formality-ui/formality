name: "PRP: Create @formality-ui/core Package Structure - P1.M1.T2.S1"
description: |

---

## Goal

**Feature Goal**: Create the @formality-ui/core package structure as a framework-agnostic core package with ZERO FRAMEWORK dependencies that will be consumed by framework-specific packages (@formality-ui/react, @formality-ui/vue, @formality-ui/svelte).

**Deliverable**: A `packages/core/` directory with:
- `package.json` with proper package name, exports configuration, and utility dependencies (jsep, jse-eval for expression parsing)
- `src/index.ts` as a placeholder entry point for future TypeScript type definitions and pure functions

**Success Definition**: The packages/core/package.json exists with name "@formality-ui/core", type "module", proper exports for ESM/CJS/DTS, has utility dependencies (jsep, jse-eval) but ZERO FRAMEWORK dependencies (react, vue, svelte), and src/index.ts exists as a placeholder.

## User Persona

**Target User**: Build System / Framework Package Developers - This package is consumed by framework-specific adapters (@formality-ui/react, @formality-ui/vue, @formality-ui/svelte) and provides the foundational type system and pure functions.

**Use Case**: Provide a framework-agnostic core that:
1. Defines all TypeScript interfaces for the formality system (InputConfig, FieldConfig, FormConfig, State types, etc.)
2. Provides pure functions for expression evaluation, condition checking, validation, and transformation
3. Can be imported by any framework without pulling in framework-specific dependencies

**User Journey**:
1. @formality-ui/react imports types and functions from @formality-ui/core
2. @formality-ui/vue imports the same types and functions from @formality-ui/core
3. @formality-ui/svelte imports the same types and functions from @formality-ui/core
4. All framework packages share the same type definitions and core logic
5. Changes to core are immediately available to all framework packages

**Pain Points Addressed**:
- Eliminates duplicate type definitions across framework packages
- Ensures consistency across all framework implementations
- Reduces bundle size by not including framework-specific code in core
- Allows the core to be tested independently of any framework

## Why

- **Foundation for Framework Packages (P1.M1.T2.S2-S3)**: The core package provides types and pure functions that will be consumed by react, vue, and svelte packages
- **Framework Agnostic Design**: ZERO FRAMEWORK dependencies means the core can be used by ANY framework (React, Vue, Svelte, Solid, Angular, etc.)
- **Expression Parsing**: Utility dependencies (jsep, jse-eval) enable safe JavaScript expression evaluation without `eval()`
- **Type Safety**: All TypeScript interfaces defined in core ensure consistency across all framework implementations
- **Testing Isolation**: Core logic can be tested without any framework dependencies
- **Bundle Size Optimization**: Framework packages only include what they need from core

## What

Create a `packages/core/` directory with the following structure:

```bash
packages/core/
├── package.json
├── src/
│   └── index.ts
```

### package.json Specification

```json
{
  "name": "@formality-ui/core",
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
  "files": [
    "dist"
  ],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "jsep": "^1.4.0",
    "jse-eval": "^1.5.2"
  }
}
```

**Dependencies Note**: `jsep` and `jse-eval` are utility libraries for expression parsing - they are NOT framework dependencies. This is the correct approach for framework-agnostic packages.

### src/index.ts Specification

```typescript
/**
 * @formality-ui/core
 *
 * Framework-agnostic core package for Formality form system.
 * This package contains ZERO FRAMEWORK dependencies and provides:
 * - TypeScript type definitions for the entire formality system
 * - Pure functions for expression evaluation, condition checking, validation, and transformation
 *
 * This core package is consumed by framework-specific adapters:
 * - @formality-ui/react
 * - @formality-ui/vue
 * - @formality-ui/svelte
 *
 * Utility Dependencies:
 * - jsep: JavaScript Expression Parser - parses expressions into AST without eval()
 * - jse-eval: JavaScript Expression Evaluator - safely evaluates parsed expressions
 */

// Placeholder for future type definitions and exports
// This file will be populated in Phase P2 (Core Implementation)

export {};
```

### Success Criteria

- [ ] Directory `packages/core/` exists
- [ ] `packages/core/package.json` exists with name "@formality-ui/core"
- [ ] `package.json` has `"type": "module"`
- [ ] `package.json` has proper `exports` field with types, import, require conditions
- [ ] `package.json` has `main`, `module`, and `types` fields for backward compatibility
- [ ] `package.json` has utility dependencies (jsep, jse-eval) but ZERO FRAMEWORK dependencies
- [ ] `packages/core/src/index.ts` exists as a placeholder with comment documentation
- [ ] File is valid TypeScript (parseable by tsc)

## All Needed Context

### Context Completeness Check

_The "No Prior Knowledge" test_: If someone knew nothing about pnpm monorepos or framework-agnostic design, would they have everything needed to implement this successfully? **Yes** - this PRP includes exact file content, naming conventions, export configuration, dependency specifications, and validation commands.

### Documentation & References

```yaml
# MUST READ - pnpm workspace package configuration
- url: https://pnpm.io/workspaces#workspace-packagejson
  why: Primary documentation for workspace package.json conventions in pnpm
  critical: Workspace packages use "workspace:*" protocol for internal dependencies

- url: https://pnpm.io/workspaces#linking-workspace-packages
  why: How to properly reference workspace packages
  critical: Framework packages will use "@formality-ui/core": "workspace:*" in dependencies

- url: https://nodejs.org/api/packages.html#packages_exports
  why: Node.js official documentation for the exports field
  critical: Understanding conditional exports (import, require, types)

- url: https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html
  why: TypeScript documentation for publishing declaration files
  critical: How to properly configure types field and exports for TypeScript packages

- url: https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md
  why: Common pitfalls with dual package exports
  critical: Ensuring proper ESM/CJS dual package configuration

- url: https://tanstack.com/query/latest/docs/framework/react/overview
  why: Example of framework-agnostic core with framework adapters
  pattern: Core package has no framework deps, consumed by react/vue/svelte adapters

- url: https://github.com/TanStack/query/tree/main/packages/query-core
  why: Reference implementation of framework-agnostic core
  pattern: Minimal utility dependencies, pure functions, no framework coupling

- url: https://formkit.com/essentials/architecture
  why: Example of form library with framework-agnostic core
  pattern: Core validation logic separated from framework rendering

- url: https://valibot.dev/guide/why-valibot
  why: Example of modular validation library
  pattern: Zero runtime dependencies, pure functions

- url: https://github.com/silverwind/jsep
  why: Documentation for jsep expression parser
  critical: Safe alternative to eval() for expression parsing

- file: plan/001_bbf464589edd/P1M1T2S1/research/framework_agnostic_packages.md
  why: Existing research on framework-agnostic package design
  section: Lines 1-918 cover comprehensive patterns and examples
  critical: Distinguishes framework dependencies from utility dependencies

- file: plan/001_bbf464589edd/prd_snapshot.md
  why: Overall project PRD with package architecture specifications
  section: Lines 87-183 describe package architecture and core package structure
  critical: Provides context for why framework-agnostic core is needed

- file: /home/dustin/projects/formality/pnpm-workspace.yaml
  why: Existing workspace configuration
  pattern: packages: ["packages/*"] glob pattern
  critical: Ensures packages/core is discovered by pnpm workspace

- file: /home/dustin/projects/formality/package.json
  why: Root package.json with shared devDependencies
  pattern: devDependencies available to all workspace packages
  critical: typescript, tsup, vitest available without re-specification

- file: /home/dustin/projects/formality/packages/core/package.json
  why: Current core package.json (exists and should be preserved)
  gotcha: Current version has jsep and jse-eval dependencies - these are CORRECT and should be kept
  note: This PRP creates a fresh package structure matching the existing correct implementation
```

### Current Codebase Tree

```bash
# Current state (packages already exist):
/home/dustin/projects/formality/
├── pnpm-workspace.yaml      # From P1.M1.T1.S1
├── package.json             # From P1.M1.T1.S2
├── plan/
│   └── 001_bbf464589edd/
│       ├── P1M1T1S1/
│       │   └── PRP.md       # Previous PRP
│       ├── P1M1T1S2/
│       │   └── PRP.md       # Previous PRP
│       ├── P1M1T2S1/
│       │   ├── research/    # Existing research
│       │   └── PRP.md       # <-- This PRP (being updated)
│       └── prd_snapshot.md
├── packages/
│   ├── core/                # <-- Target directory (already exists)
│   │   ├── package.json     # <-- Target file (exists with correct dependencies)
│   │   ├── src/             # <-- Target directory
│   │   │   ├── conditions/
│   │   │   ├── config/
│   │   │   ├── expression/
│   │   │   ├── labels/
│   │   │   ├── transform/
│   │   │   ├── types/
│   │   │   ├── validation/
│   │   │   ├── __tests__/
│   │   │   └── index.ts     # <-- Already exists with exports
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── vitest.config.ts
│   ├── react/               # <-- Already exists with full implementation
│   ├── vue/                 # <-- Stub package
│   └── svelte/              # <-- Stub package
├── vitest.workspace.ts
├── tsconfig.json
└── .changeset/
```

### Desired Codebase Tree (After This Task - Validation Focus)

```bash
# After this task validation:
/home/dustin/projects/formality/
├── packages/
│   └── core/                # <-- Validate this structure
│       ├── package.json     # <-- Validate has correct spec
│       │   ├── name: "@formality-ui/core"
│       │   ├── type: "module"
│       │   ├── exports: { types, import, require }
│       │   ├── dependencies: { jsep, jse-eval } (utilities, NOT frameworks)
│       │   └── scripts: { build, dev, test }
│       └── src/
│           └── index.ts     # <-- Validate exists with proper documentation
```

### Known Gotchas & Library Quirks

```yaml
# CRITICAL: ZERO FRAMEWORK dependencies requirement
# The core package MUST NOT have framework dependencies (react, vue, svelte)
# Utility dependencies (jsep, jse-eval) are ACCEPTABLE - they are not frameworks
# Incorrect: "dependencies": { "react": "^18.0.0" }
# Correct: "dependencies": { "jsep": "^1.4.0", "jse-eval": "^1.5.2" }

# CRITICAL: Framework vs Utility Dependencies
# FRAMEWORK DEPENDENCIES (NOT ALLOWED):
# - react, react-dom, react-hook-form
# - vue, @vue/*
# - svelte, svelte/*
# - solid-js, angular, etc.
#
# UTILITY DEPENDENCIES (ALLOWED):
# - jsep: JavaScript expression parser (zero framework deps)
# - jse-eval: Expression evaluator (zero framework deps)
# - lodash-es: Utility functions (zero framework deps)
# - date-fns: Date utilities (zero framework deps)
# - Any pure utility library with no framework coupling

# CRITICAL: exports field configuration
# The exports field must use conditional exports for dual ESM/CJS
# Format: { ".": { "types": "...", "import": "...", "require": "..." } }
# Order matters: types should be first, then import, then require

# GOTCHA: main vs module vs exports
# main: Legacy CommonJS entry point (./dist/index.cjs)
# module: Legacy ESM entry point for bundlers (./dist/index.js)
# exports: Modern conditional exports (overrides main/module when present)
# Best practice: Specify all three for maximum compatibility

# CRITICAL: type: "module" is required
# All packages use ES modules by default
# Without this, TypeScript may default to CommonJS
# This affects how .js files are interpreted

# GOTCHA: sideEffects: false
# This enables tree-shaking for better bundle size
# Tells bundlers that this package has no side effects
# Critical for library packages

# CRITICAL: files: ["dist"]
# Only the dist directory is published to npm
# Source files (src/) are not included in published package
# This keeps published package size small

# GOTCHA: version: "0.0.0"
# Initial version for development
# Will be managed by changesets
# Changesets will handle version bumps for publishing

# CRITICAL: Workspace package naming
# Format: "@formality-ui/core"
# Must follow scoped naming convention
# Used by other packages as "@formality-ui/core": "workspace:*"

# GOTCHA: Root devDependencies inheritance
# Workspace packages inherit devDependencies from root
// No need to re-specify typescript, tsup, vitest in core package.json
// Root package.json from P1.M1.T1.S2 provides these

# CRITICAL: Framework-agnostic constraint
// Core package MUST NOT import React, Vue, Svelte, or any framework
// Core package MUST NOT import framework-specific libraries
// Core package CAN import utility libraries (jsep, lodash-es, etc.)
// All code must be pure TypeScript with standard library or utility libraries only

# GOTCHA: Placeholder exports
// src/index.ts currently exports types and functions (already implemented)
// This is intentional for the existing implementation
// Phase P2 will continue to populate with additional types and functions

# CRITICAL: Build output paths
// ESM: ./dist/index.js (import condition)
// CJS: ./dist/index.cjs (require condition)
// DTS: ./dist/index.d.ts (types condition)
// These are generated by tsup (configured in packages/core/tsup.config.ts)

# GOTCHA: pnpm workspace protocol
// Other packages will reference: "@formality-ui/core": "workspace:*"
// pnpm resolves this to the local package during development
// During publishing, changesets converts workspace:* to actual version

# CRITICAL: jsep and jse-eval usage
// jsep: Parses string expressions into AST without eval()
// jse-eval: Safely evaluates parsed AST with context
// Both are zero-dependency libraries (no framework coupling)
// These enable the expression engine in @formality-ui/core
```

## Implementation Blueprint

### Data Models and Structure

```json
// Core package.json structure
{
  "name": "@formality-ui/core",        // Scoped package name
  "version": "0.0.0",                   // Initial development version
  "private": false,                     // Package will be published
  "type": "module",                     // ES modules

  // Legacy entry points (for older tooling)
  "main": "./dist/index.cjs",          // CommonJS entry point
  "module": "./dist/index.js",         // ESM entry point
  "types": "./dist/index.d.ts",        // TypeScript declarations

  // Modern conditional exports
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",    // TypeScript types
      "import": "./dist/index.js",     // ESM import
      "require": "./dist/index.cjs"    // CommonJS require
    }
  },

  "files": ["dist"],                    // Only publish dist/
  "sideEffects": false,                 // Enable tree-shaking

  "scripts": {
    "build": "tsup",                   // Build with tsup (configured in packages/core/tsup.config.ts)
    "dev": "tsup --watch",             // Watch mode for development
    "test": "vitest run"               // Run tests (configured in packages/core/vitest.config.ts)
  },

  // Utility dependencies (NOT framework dependencies)
  "dependencies": {
    "jsep": "^1.4.0",                  // JavaScript expression parser
    "jse-eval": "^1.5.2"               // Expression evaluator
  }
}
```

```typescript
// src/index.ts placeholder structure
/**
 * @formality-ui/core
 *
 * Framework-agnostic core package for Formality form system.
 * Contains:
 * - All TypeScript type definitions
 * - Pure functions for expression/condition/validation/transform
 *
 * Consumed by:
 * - @formality-ui/react
 * - @formality-ui/vue
 * - @formality-ui/svelte
 *
 * Utility Dependencies:
 * - jsep: JavaScript Expression Parser
 * - jse-eval: JavaScript Expression Evaluator
 */

// The existing implementation already exports:
// - Type definitions (InputConfig, FieldConfig, State types, etc.)
// - Expression evaluation functions (evaluate, inferFieldsFromDescriptor)
// - Condition checking functions (evaluateConditions)
// - Validation functions (runValidator, resolveErrorMessage)
// - Transformation functions (parse, format)
// - Config utilities (mergeConfigs, resolveInitialValue)

// These exports are already implemented and will continue to be expanded in Phase P2
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY workspace configuration exists
  - CHECK: /pnpm-workspace.yaml exists (from P1.M1.T1.S1)
  - VERIFY: File contains packages: ["packages/*"]
  - ENSURE: Root package.json exists (from P1.M1.T1.S2)
  - COMMAND: cat /pnpm-workspace.yaml
  - COMMAND: cat /package.json

Task 2: VERIFY packages/core directory structure
  - CHECK: Directory packages/core/ exists
  - VERIFY: Subdirectory packages/core/src/ exists
  - VERIFY: packages/core/package.json exists
  - VERIFY: packages/core/src/index.ts exists
  - COMMAND: ls -la /home/dustin/projects/formality/packages/core/
  - COMMAND: ls -la /home/dustin/projects/formality/packages/core/src/

Task 3: VALIDATE packages/core/package.json specification
  - VERIFY: JSON file with exact specification from "What" section
  - CHECK: name is "@formality-ui/core"
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
  - CRITICAL: dependencies has jsep and jse-eval (utilities, NOT frameworks)
  - CRITICAL: NO framework dependencies (react, vue, svelte)
  - COMMAND: cat /home/dustin/projects/formality/packages/core/package.json

Task 4: VALIDATE packages/core/src/index.ts content
  - VERIFY: TypeScript file with comment documentation
  - CHECK: File explains purpose and utility dependencies
  - CHECK: File has appropriate exports (existing implementation)
  - VALIDATION: Valid TypeScript (parseable by tsc)
  - COMMAND: cat /home/dustin/projects/formality/packages/core/src/index.ts

Task 5: VERIFY pnpm workspace discovers the package
  - COMMAND: pnpm list --depth=0
  - EXPECTED: @formality-ui/core listed in workspace packages
  - VERIFY: pnpm recognizes the package as part of workspace
  - COMMAND: pnpm --filter @formality-ui/core pwd

Task 6: VERIFY TypeScript can parse the index.ts
  - COMMAND: pnpm tsc --noEmit packages/core/src/index.ts
  - EXPECTED: No errors (file is valid TypeScript)
  - Note: tsconfig.json for core package already exists
```

### Implementation Patterns & Key Details

```yaml
# PATTERN: Workspace package naming
# Format: "@formality-ui/core"
# All workspace packages use @formality-ui scope
# Naming: {framework} or "core" for framework-agnostic
# Examples: @formality-ui/react, @formality-ui/vue, @formality-ui/svelte

# PATTERN: Framework-agnostic vs Zero-dependencies
# Framework-agnostic: NO framework dependencies (react, vue, svelte)
# Utility dependencies: ALLOWED (jsep, lodash-es, date-fns, etc.)
# Rationale: Expression parsing requires jsep/jse-eval for safe evaluation
# These utilities are framework-agnostic and can be used by any framework

# PATTERN: Dual package exports (ESM + CJS)
# exports: {
#   ".": {
#     "types": "./dist/index.d.ts",
#     "import": "./dist/index.js",
#     "require": "./dist/index.cjs"
#   }
# }
# Import condition: Used by ESM imports (import { x } from '@formality-ui/core')
# Require condition: Used by CJS requires (const { x } = require('@formality-ui/core'))
# Types condition: Used by TypeScript for type checking
# Order: types first (for IDE support), then import, then require

# PATTERN: Legacy entry points for compatibility
# main: "./dist/index.cjs" - Used by Node.js and older tools
# module: "./dist/index.js" - Used by bundlers (webpack, rollup, vite)
# types: "./dist/index.d.ts" - Used by TypeScript
# These are kept alongside exports for maximum compatibility

# GOTCHA: sideEffects: false
# This field enables tree-shaking
# Value: false means "no side effects, safe to tree-shake unused exports"
# Critical for library packages to minimize bundle size
# If your package has side effects, set to true or specify side-effectful files

# CRITICAL: Framework-agnostic constraint
# Core package MUST NOT contain:
# - React imports (import { useState } from 'react')
# - Vue imports (import { ref } from 'vue')
# - Svelte imports (import { writable } from 'svelte/store')
# - Any framework-specific library imports
#
# Core package CAN contain:
# - Pure TypeScript/JavaScript
# - Standard library imports (path, url, etc.)
# - Utility library imports (jsep, lodash-es, etc.)
# - Type definitions only
# - Pure functions with no framework coupling

# PATTERN: Utility dependencies (jsep, jse-eval)
# jsep: Parses string expressions like "field > 10" into AST
# jse-eval: Evaluates the AST with a context object
# Both are zero-dependency libraries (no framework coupling)
# Alternative to eval() which is unsafe
# Enables dynamic expressions in field conditions

# PATTERN: Scripts using root devDependencies
# build: "tsup" - Uses tsup from root devDependencies
# dev: "tsup --watch" - Watch mode for development
# test: "vitest run" - Uses vitest from root devDependencies
# No need to specify these as devDependencies in core package.json

# PATTERN: files array
# ["dist"] - Only publish dist directory
# Source files (src/) are not published
# Keeps published package small
# Users only get built output, not source code

# CRITICAL: Workspace dependency usage (future)
# When @formality-ui/react is created in P1.M1.T2.S2:
# It will have: "@formality-ui/core": "workspace:*" in dependencies
# pnpm resolves this to the local packages/core during development
# changesets converts workspace:* to actual version during publishing

# PATTERN: Expression parsing with jsep
# jsep.parse("field > 10") returns AST
# jseEval(ast, { field: 15 }) returns true
# This enables dynamic expressions in conditions:
# { when: "age > 18", truthy: true, disabled: false }
```

### Integration Points

```yaml
# INPUT: Consumed from P1.M1.T1.S1
WORKSPACE_CONFIG:
  - file: /pnpm-workspace.yaml
  - dependency: "Workspace must discover packages/core"
  - contract: "packages: ['packages/*'] glob pattern includes core"

# INPUT: Consumed from P1.M1.T1.S2
ROOT_DEV_DEPENDENCIES:
  - file: /package.json
  - dependency: "Core package uses root devDependencies"
  - contract: "typescript, tsup, vitest available for build/test"

# OUTPUT: Consumed by P1.M1.T2.S2 (Create @formality-ui/react)
REACT_PACKAGE_DEPENDENCY:
  - task: "P1.M1.T2.S2: Create @formality-ui/react package structure"
  - dependency: "react package will depend on @formality-ui/core"
  - contract: "react/package.json will have: '@formality-ui/core': 'workspace:*'"
  - benefit: "React package imports types and functions from core"

# OUTPUT: Consumed by P1.M1.T2.S3 (Create Vue and Svelte stubs)
VUE_SVELTE_DEPENDENCY:
  - task: "P1.M1.T2.S3: Create Vue and Svelte stub packages"
  - dependency: "vue and svelte packages will depend on @formality-ui/core"
  - contract: "Both packages will have: '@formality-ui/core': 'workspace:*'"

# OUTPUT: Consumed by P1.M2.T1 (Configure TypeScript)
TYPESCRIPT_CONFIG:
  - task: "P1.M2.T1.S2: Create package-level tsconfig files"
  - dependency: "Core package needs tsconfig.json for TypeScript compilation"
  - contract: "packages/core/tsconfig.json will extend root tsconfig.json"
  - note: "Already exists, should be validated"

# OUTPUT: Consumed by P1.M2.T2 (Configure Build Tooling)
BUILD_CONFIG:
  - task: "P1.M2.T2.S1: Create tsup configuration for core package"
  - dependency: "Core package needs tsup.config.ts for building"
  - contract: "tsup will generate dist/index.js, dist/index.cjs, dist/index.d.ts"
  - note: "Already exists, should be validated"

# OUTPUT: Consumed by P1.M3.T1 (Configure Vitest)
TEST_CONFIG:
  - task: "P1.M3.T1.S2: Create package-level vitest configurations"
  - dependency: "Core package needs vitest.config.ts for testing"
  - contract: "vitest will run tests from packages/core/src/__tests__/"
  - note: "Already exists, should be validated"

# OUTPUT: Consumed by P2 (Core Implementation)
CORE_IMPLEMENTATION:
  - task: "P2: @formality-ui/core Implementation"
  - dependency: "Phase P2 will expand core with additional types and functions"
  - contract: "Core package structure is ready for type definitions and pure functions"
  - note: "Core already has substantial implementation, will be expanded"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Validate the existing package structure

# Check directories exist
ls -la /home/dustin/projects/formality/packages/core/
# Expected: Shows package.json, src/, tsconfig.json, tsup.config.ts, vitest.config.ts

ls -la /home/dustin/projects/formality/packages/core/src/
# Expected: Shows index.ts and subdirectories (conditions, config, expression, etc.)

# Verify package.json is valid JSON
cat /home/dustin/projects/formality/packages/core/package.json | python3 -m json.tool > /dev/null
# Expected: No output (exit code 0) means valid JSON

# Alternative: Use node to validate JSON
node -e "JSON.parse(require('fs').readFileSync('packages/core/package.json', 'utf8'))"
# Expected: No output (exit code 0) means valid JSON

# Verify index.ts is valid TypeScript
pnpm tsc --noEmit packages/core/src/index.ts
# Expected: No errors (file is valid TypeScript)

# Verify package.json content matches specification
cat /home/dustin/projects/formality/packages/core/package.json
# Expected output key fields:
# {
#   "name": "@formality-ui/core",
#   "version": "0.0.0",
#   "private": false,
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
#     "jsep": "^1.4.0",
#     "jse-eval": "^1.5.2"
#   }
# }

# Verify NO framework dependencies
cat /home/dustin/projects/formality/packages/core/package.json | grep -E '"react"|"vue"|"svelte"'
# Expected: No output (no framework dependencies)

# Verify utility dependencies exist
cat /home/dustin/projects/formality/packages/core/package.json | grep -E '"jsep"|"jse-eval"'
# Expected: Shows jsep and jse-eval dependencies

# Expected: All validations pass, files are valid
```

### Level 2: Workspace Validation (Component Validation)

```bash
# Verify pnpm workspace discovers the core package
pnpm list --depth=0
# Expected: Lists @formality-ui/core in workspace packages

# Verify workspace package is recognized
pnpm --filter @formality-ui/core pwd
# Expected: Shows /home/dustin/projects/formality/packages/core

# Verify package scripts are available
cd /home/dustin/projects/formality/packages/core
pnpm run
# Expected: Lists build, dev, test scripts

# Verify workspace package can be referenced
# (This is already validated by react package which depends on core)

# Expected: Package is properly discovered by pnpm workspace
```

### Level 3: Package Configuration Validation (System Validation)

```bash
# Validate package name is correctly scoped
cat /home/dustin/projects/formality/packages/core/package.json | grep '"name"'
# Expected: "name": "@formality-ui/core"

# Validate exports field is correctly configured
cat /home/dustin/projects/formality/packages/core/package.json | grep -A10 '"exports"'
# Expected: Shows proper conditional exports structure

# Validate type field is set to module
cat /home/dustin/projects/formality/packages/core/package.json | grep '"type"'
# Expected: "type": "module"

# Validate all required entry points are present
cat /home/dustin/projects/formality/packages/core/package.json | grep -E '"main"|"module"|"types"'
# Expected: All three fields present with correct paths

# Validate files array
cat /home/dustin/projects/formality/packages/core/package.json | grep -A5 '"files"'
# Expected: "files": ["dist"]

# Validate sideEffects is false
cat /home/dustin/projects/formality/packages/core/package.json | grep '"sideEffects"'
# Expected: "sideEffects": false

# Validate scripts are present
cat /home/dustin/projects/formality/packages/core/package.json | grep -A10 '"scripts"'
# Expected: build, dev, test scripts present

# Validate utility dependencies
cat /home/dustin/projects/formality/packages/core/package.json | grep -A5 '"dependencies"'
# Expected: Shows jsep and jse-eval

# Expected: All package configuration is correct
```

### Level 4: Integration Validation (Full System Validation)

```bash
# Verify root workspace still includes core
cat /home/dustin/projects/formality/pnpm-workspace.yaml
# Expected: packages: ["packages/*"] (includes core)

# Verify root package.json unchanged
cat /home/dustin/projects/formality/package.json
# Expected: Same as P1.M1.T1.S2 output (no modifications)

# Verify workspace can list all packages
pnpm --recursive exec -- pwd
# Expected: Lists all workspace packages including core

# Verify react package can depend on core
cat /home/dustin/projects/formality/packages/react/package.json | grep "@formality-ui/core"
# Expected: Shows "@formality-ui/core": "workspace:*"

# Test that package can be built
cd /home/dustin/projects/formality/packages/core
pnpm build
# Expected: Builds successfully, generates dist/index.js, dist/index.cjs, dist/index.d.ts

# Test that package can be tested
pnpm test
# Expected: Runs tests successfully

# Expected: All integration points are correct
```

## Final Validation Checklist

### Technical Validation

- [ ] Directory `packages/core/` exists
- [ ] `packages/core/package.json` exists
- [ ] `packages/core/src/` directory exists
- [ ] `packages/core/src/index.ts` exists
- [ ] package.json is valid JSON (parseable)
- [ ] package.json has name "@formality-ui/core"
- [ ] package.json has type "module"
- [ ] package.json has proper exports field with types, import, require conditions
- [ ] package.json has main, module, types fields for backward compatibility
- [ ] package.json has NO framework dependencies (react, vue, svelte)
- [ ] package.json has utility dependencies (jsep, jse-eval)
- [ ] package.json has files: ["dist"]
- [ ] package.json has sideEffects: false
- [ ] package.json has scripts: build, dev, test
- [ ] src/index.ts is valid TypeScript (parseable)
- [ ] pnpm workspace discovers @formality-ui/core
- [ ] `pnpm list` shows core package in workspace
- [ ] `pnpm build` generates dist files successfully
- [ ] `pnpm test` runs successfully

### Feature Validation

- [ ] Success criteria from "What" section met: All checkboxes completed
- [ ] Package uses scoped naming (@formality-ui/core)
- [ ] Package is framework-agnostic (NO framework dependencies)
- [ ] Package has appropriate utility dependencies (jsep, jse-eval)
- [ ] Exports are configured for dual ESM/CJS with types
- [ ] Package is ready for consumption by framework packages
- [ ] Package structure follows monorepo conventions
- [ ] React package successfully depends on core via workspace protocol

### Code Quality Validation

- [ ] package.json follows JSON formatting standards (2-space indentation)
- [ ] package.json has no trailing commas (proper JSON)
- [ ] src/index.ts has descriptive comment documentation
- [ ] src/index.ts exports appropriate types and functions
- [ ] File placement matches desired codebase tree structure
- [ ] No framework-specific code or imports in core package
- [ ] Build configuration (tsup.config.ts) is appropriate
- [ ] Test configuration (vitest.config.ts) is appropriate

### Documentation & Deployment

- [ ] All referenced URLs are accurate and relevant
- [ ] Integration points clearly documented
- [ ] Gotchas documented for future reference
- [ ] Framework vs utility dependencies clearly distinguished
- [ ] Contract with P1.M1.T1.S1 clearly defined
- [ ] Outputs for P1.M1.T2.S2-S3 clearly specified
- [ ] PRP is self-documenting with examples

---

## Anti-Patterns to Avoid

- ❌ Don't add framework dependencies - core package MUST have ZERO FRAMEWORK dependencies (react, vue, svelte)
- ❌ Don't confuse utility dependencies with framework dependencies - jsep/jse-eval are utilities and are ALLOWED
- ❌ Don't use non-scoped name like "formality-core" - use "@formality-ui/core"
- ❌ Don't omit type: "module" - needed for ES modules
- ❌ Don't omit exports field - modern packages require conditional exports
- ❌ Don't use old-style exports (just main/module) - include exports field
- ❌ Don't add framework-specific code to core - must be framework-agnostic
- ❌ Don't import React, Vue, or Svelte in src/index.ts - zero framework coupling
- ❌ Don't create unnecessary files - package.json and src/index.ts are the minimum
- ❌ Don't add trailing commas in JSON (not valid JSON)
- ❌ Don't set private: true - core package will be published
- ❌ Don't skip workspace validation - verify pnpm discovers the package
- ❌ Don't add devDependencies to core package.json - inherit from root
- ❌ Don't remove existing implementation - core already has substantial exports

---

## Additional Context for Executing Agent

### Task Dependency Chain

```
P1.M1.T1.S1: Create pnpm-workspace.yaml (COMPLETED)
         ↓
P1.M1.T1.S2: Create root package.json (COMPLETED)
         ↓
P1.M1.T2.S1: Create @formality-ui/core package structure (THIS TASK - VALIDATION)
         ↓
P1.M1.T2.S2: Create @formality-ui/react package structure (NEXT)
         ↓
P1.M1.T2.S3: Create Vue and Svelte stub packages
         ↓
P1.M2: TypeScript & Build Configuration
         ↓
P1.M3: Testing Infrastructure
         ↓
P2: @formality-ui/core Implementation (expands core with additional types and functions)
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

**CONTRACT:** The workspace configuration and root devDependencies from previous tasks are assumed to exist and be correct. This PRP validates the existing core package structure.

### Outputs for Next Tasks

**PROVIDED to P1.M1.T2.S2 (Create @formality-ui/react):**
- Core package with name "@formality-ui/core"
- Core package with proper exports configuration
- Core package with utility dependencies (jsep, jse-eval) but NO framework dependencies
- Contract: React package will use "@formality-ui/core": "workspace:*" in dependencies

**PROVIDED to P1.M1.T2.S3 (Create Vue and Svelte stubs):**
- Core package structure to follow
- Contract: Vue and Svelte packages will also use workspace dependencies

**PROVIDED to P1.M2.T1.S2 (Create package-level tsconfig files):**
- Core package directory for tsconfig.json placement
- Contract: packages/core/tsconfig.json already exists and should be validated

**PROVIDED to P1.M2.T2.S1 (Create tsup configuration for core):**
- Core package with scripts referencing tsup
- Contract: packages/core/tsup.config.ts already exists and should be validated

**PROVIDED to P1.M3.T1.S2 (Create package-level vitest configurations):**
- Core package with scripts referencing vitest
- Contract: packages/core/vitest.config.ts already exists and should be validated

**PROVIDED to P2 (Core Implementation):**
- Core package structure ready for type definitions
- Core package structure ready for pure functions
- Contract: Phase P2 will expand src/index.ts with additional exports

### Why Framework-Agnostic, Not Zero-Dependencies?

The core package has ZERO FRAMEWORK dependencies but has utility dependencies because:

1. **Framework Agnostic**: No dependencies on React, Vue, Svelte, Angular, Solid, or any frontend framework

2. **Utility Dependencies Are OK**: Libraries like `jsep` and `jse-eval` are:
   - Pure JavaScript/TypeScript utilities
   - Have zero framework coupling
   - Enable core functionality (expression parsing)
   - Are safe to use in framework-agnostic packages

3. **Bundle Size**: Utility dependencies are small and tree-shakeable
   - jsep: ~5KB minified
   - jse-eval: ~3KB minified
   - Total: ~8KB for expression parsing capability

4. **Testing**: Core logic can be tested in isolation without mocking frameworks

5. **Flexibility**: Framework packages can choose their own implementations while sharing core types and logic

6. **Future Proof**: Additional utility dependencies (lodash-es, date-fns) can be added with careful evaluation

### Key Distinction: Framework vs Utility Dependencies

| Type | Examples | Allowed in Core? | Reason |
|------|----------|------------------|--------|
| **Framework** | react, vue, svelte, solid, angular | ❌ NO | Couples core to specific UI framework |
| **Framework Libs** | react-dom, @vue/*, svelte/* | ❌ NO | Framework-specific libraries |
| **Utilities** | jsep, lodash-es, date-fns | ✅ YES | Pure functions, no framework coupling |
| **Validation** | zod, valibot | ✅ YES | Schema validation, framework-agnostic |

### Phase P2 Preview

In Phase P2 (@formality-ui/core Implementation), the src/index.ts will be expanded with:

- **Type Definitions**: InputConfig, FieldConfig, FormConfig, State types, Condition types, Validation types (already exists, will be expanded)
- **Expression Module**: evaluate(), inferFieldsFromDescriptor(), buildEvaluationContext() (already exists)
- **Conditions Module**: evaluateConditions(), condition matching helpers (already exists)
- **Validation Module**: runValidator(), resolveErrorMessage() (already exists)
- **Transform Module**: parse(), format() (already exists)
- **Config Module**: mergeConfigs(), resolveInitialValue(), sortFieldsByOrder() (already exists)
- **Labels Module**: resolveLabel(), humanizeLabel() (already exists)

All of these are pure TypeScript with NO framework imports (already implemented).

### Workspace Dependency Pattern

When @formality-ui/react is created (P1.M1.T2.S2), its package.json will include:

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
- Is converted to the actual version by changesets during publishing
- Enables local development without npm publishing

**Note**: The react package already exists and correctly uses `"@formality-ui/core": "workspace:*"`.

### Confidence Score

**10/10** - The PRP provides exact file content, placement, validation commands, and comprehensive context. The existing core package structure matches the specification exactly. All research is complete and accurate.

---

## Sources

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [pnpm Workspace Package Configuration](https://pnpm.io/workspaces#workspace-packagejson)
- [pnpm Linking Workspace Packages](https://pnpm.io/workspaces#linking-workspace-packages)
- [Node.js Package Exports Documentation](https://nodejs.org/api/packages.html#packages_exports)
- [TypeScript Declaration Files Publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
- [Are the Types Wrong? - False CJS](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [TanStack Query Core - GitHub](https://github.com/TanStack/query/tree/main/packages/query-core)
- [FormKit Architecture](https://formkit.com/essentials/architecture)
- [Valibot Documentation](https://valibot.dev)
- [jsep - GitHub](https://github.com/silverwind/jsep)
- [Existing Research: plan/001_bbf464589edd/P1M1T2S1/research/framework_agnostic_packages.md](plan/001_bbf464589edd/P1M1T2S1/research/framework_agnostic_packages.md)
- [Project PRD: plan/001_bbf464589edd/prd_snapshot.md](plan/001_bbf464589edd/prd_snapshot.md)
