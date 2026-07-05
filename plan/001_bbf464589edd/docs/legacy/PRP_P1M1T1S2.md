name: "PRP: Create Root package.json - P1.M1.T1.S2"
description: |

---

## Goal

**Feature Goal**: Create the root package.json that provides the foundational package manager configuration, shared devDependencies, and workspace scripts for the formality-ui monorepo.

**Deliverable**: A `/package.json` file at the project root with:

- name: "formality"
- private: true
- packageManager: "pnpm@8.15.0"
- Scripts for build/test/lint/typecheck/changeset using `pnpm -r`
- devDependencies for typescript, vitest, eslint, prettier, @changesets/cli, tsup

**Success Definition**: The root package.json exists at project root, is valid JSON, contains all required fields and devDependencies, and all scripts execute successfully using pnpm.

## User Persona

**Target User**: Developer/Build System - This file is consumed by pnpm to enable workspace-level dependency management and script execution.

**Use Case**: Provide a centralized package.json that:

1. Defines the monorepo root configuration
2. Installs shared devDependencies available to all workspace packages
3. Provides workspace-wide scripts for build, test, lint, typecheck, and release
4. Enables changeset-based version management

**User Journey**:

1. Developer runs `pnpm install` to install all dependencies
2. pnpm reads root package.json for devDependencies
3. pnpm installs devDependencies at root level
4. Developer runs `pnpm build` to build all packages recursively
5. Developer runs `pnpm changeset` to create version changes

**Pain Points Addressed**:

- Eliminates need to duplicate devDependencies across packages
- Provides single source of truth for tool versions
- Enables workspace-wide commands with single script execution
- Standardizes development workflows across team

## Why

- **Foundation for Package Structures (P1.M1.T2)**: Root package.json devDependencies are inherited by workspace packages, reducing duplication
- **Enables Recursive Scripts**: Scripts using `pnpm -r` depend on workspace configuration from P1.M1.T1.S1
- **Standardizes Tooling**: Centralized devDependencies ensure consistent tool versions across all packages
- **Changeset Integration**: Enables version management and publishing workflow for monorepo
- **Developer Experience**: Provides simple, memorable commands for all development tasks

## What

Create a `/package.json` file at the project root with the following structure:

```json
{
  "name": "formality",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@8.15.0",
  "version": "0.1.0",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --build",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "clean": "pnpm -r exec rm -rf dist",
    "changeset": "changeset",
    "release": "pnpm build && pnpm changeset version && pnpm changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

### Success Criteria

- [ ] File exists at `/package.json` (project root)
- [ ] File is valid JSON (parseable)
- [ ] `name` field is "formality"
- [ ] `private` field is true
- [ ] `packageManager` field is "pnpm@8.15.0"
- [ ] `type` field is "module"
- [ ] All required scripts are present (build, dev, test, test:watch, test:coverage, typecheck, lint, format, clean, changeset, release)
- [ ] All devDependencies are present with correct versions
- [ ] `pnpm install` succeeds without errors
- [ ] `pnpm --version` shows 8.15.0 or compatible

## All Needed Context

### Context Completeness Check

_The "No Prior Knowledge" test_: If someone knew nothing about pnpm monorepos, would they have everything needed to implement this successfully? **Yes** - this PRP includes exact file content, placement, devDependency versions, and validation commands.

### Documentation & References

```yaml
# MUST READ - pnpm package.json documentation
- url: https://pnpm.io/package.json
  why: Primary documentation for package.json in pnpm, including packageManager field
  critical: packageManager field format is "pnpm@{version}" with exact version

- url: https://pnpm.io/workspaces#workspace-packagejson
  why: Documentation for workspace root package.json conventions
  critical: private:true is required for workspace root packages

- url: https://pnpm.io/cli#-r---recursive
  why: Documentation for recursive command flag used in scripts
  critical: -r runs command in all workspace packages

- url: https://pnpm.io/cli#--parallel
  why: Documentation for parallel execution flag
  critical: Use with -r for CPU-intensive tasks like dev servers

- url: https://github.com/pnpm/pnpm/blob/main/CHANGELOG.md#8150
  why: pnpm 8.15.0 release notes
  critical: Verify 8.15.0 is stable and has required features

- url: https://changesets.dev/docs/intro
  why: Changesets documentation for monorepo version management
  critical: Changesets are used for versioning and publishing

- url: https://github.com/changesets/changesets/blob/main/docs/for-repo-maintainers/monorepos.md
  why: Changesets monorepo-specific configuration
  critical: Explains how changesets work with workspace:* protocol

- url: https://tsup.egoist.dev/
  why: tsup documentation for TypeScript package bundling
  critical: Build tool used by all packages

- url: https://vitest.dev/guide/workspace.html
  why: Vitest workspace configuration documentation
  critical: vitest.workspace.ts is used for monorepo testing

- url: https://eslint.org/docs/latest/integrate/
  why: ESLint documentation for integration with TypeScript
  critical: ESLint 9.x uses flat config format

- url: https://prettier.io/docs/en/options.html
  why: Prettier configuration options
  critical: Shared formatting across monorepo

- url: https://www.typescriptlang.org/docs/handbook/project-references.html
  why: TypeScript project references for monorepo
  critical: tsc --build uses project references

- file: plan/001_bbf464589edd/P1M1T1S1/PRP.md
  why: Previous PRP defining workspace configuration output
  section: Lines 1-430 contain pnpm-workspace.yaml specification
  critical: Root package.json scripts depend on workspace being configured

- file: plan/001_bbf464589edd/prd_snapshot.md
  why: Overall project PRD with monorepo architecture specifications
  section: Lines 87-150 describe package architecture
  critical: Provides context for why this structure is needed

- file: /home/dustin/projects/formality/pnpm-workspace.yaml
  why: Existing workspace configuration from P1.M1.T1.S1
  pattern: packages: ["packages/*"] glob pattern
  critical: Scripts use pnpm -r which depends on this config

- file: /home/dustin/projects/formality/packages/core/package.json
  why: Example of workspace package package.json
  pattern: "workspace:*" protocol for internal dependencies
  gotcha: Packages have name: "@formality-ui/{name}" but root is just "formality"

- file: /home/dustin/projects/formality/packages/react/package.json
  why: Example of package with workspace dependencies
  pattern: dependencies: { "@formality-ui/core": "workspace:*" }
  gotcha: React package has peerDependencies that are devDependencies here
```

### Current Codebase Tree

```bash
# Run from project root to see current structure
tree -L 2 -a

# Expected current state (before implementation of this specific PRP):
/home/dustin/projects/formality/
├── pnpm-workspace.yaml      # Created by P1.M1.T1.S1
├── package.json             # <-- TARGET FILE - may exist or need creation
├── plan/
│   └── 001_bbf464589edd/
├── packages/                # Will contain framework packages (created in P1.M1.T2)
│   ├── core/                # @formality-ui/core
│   ├── react/               # @formality-ui/react
│   ├── vue/                 # @formality-ui/vue
│   └── svelte/              # @formality-ui/svelte
├── vitest.workspace.ts      # Vitest workspace configuration
├── tsconfig.json            # Root TypeScript configuration
├── .gitignore
└── .changeset/
    └── config.json          # Changesets configuration
```

### Desired Codebase Tree (After Implementation)

```bash
# After this task is complete:
/home/dustin/projects/formality/
├── pnpm-workspace.yaml      # From P1.M1.T1.S1
├── package.json             # <-- CREATED/UPDATED by this task
│   ├── name: "formality"
│   ├── private: true
│   ├── packageManager: "pnpm@8.15.0"
│   ├── scripts: { build, dev, test, test:watch, test:coverage, typecheck, lint, format, clean, changeset, release }
│   └── devDependencies: { typescript, vitest, eslint, prettier, @changesets/cli, tsup, @types/node, @vitest/coverage-v8 }
├── plan/
│   └── 001_bbf464589edd/
│       └── P1M1T1S2/
│           └── PRP.md       # <-- This PRP
├── packages/                # (Created in P1.M1.T2)
├── vitest.workspace.ts
├── tsconfig.json
└── .changeset/
    └── config.json
```

### Known Gotchas & Library Quirks

```yaml
# CRITICAL: packageManager field format
# Format is EXACTLY "pnpm@{version}" - not "pnpm {version}" or "pnpm@>{version}"
# Incorrect: "packageManager": "pnpm 8.15.0"
# Incorrect: "packageManager": "pnpm@^8.15.0"
# Correct: "packageManager": "pnpm@8.15.0"
# This format is required by Corepack (Node.js package manager manager)

# CRITICAL: private field MUST be true
# Root workspace packages should NEVER be published
# Without private: true, `pnpm publish` would try to publish the root
# This prevents accidental registry pollution

# CRITICAL: Scripts use pnpm -r for recursive execution
# -r flag runs the script in ALL workspace packages
# Scripts like "build" run "pnpm -r build" which runs "build" in each package
# --parallel flag is used for dev servers to run simultaneously
# Order: pnpm -r respects dependency graph, builds in correct order

# GOTCHA: Root scripts vs package scripts
# Root scripts use pnpm -r to delegate to packages
# Package scripts (in packages/*/package.json) do the actual work
# Example: Root "build" script calls "pnpm -r build" which calls each package's "build" script

# GOTCHA: type: "module" is required
# All packages use ES modules
# Root package.json should also specify type: "module" for consistency
# Without this, TypeScript may default to CommonJS

# CRITICAL: DevDependency versions
# Use caret ranges (^) for most dependencies
# Allow updates within same major version
# Example: "^2.27.0" allows 2.27.0 to 2.999.999
# Do NOT lock to exact version (e.g., "2.27.0" without ^)

# GOTCHA: tsup is a devDependency, not a dependency
# tsup is used for building, not runtime
# Should be in devDependencies at root level
# Individual packages may also have tsup as devDependency

# CRITICAL: Changesets requires specific config
# .changeset/config.json must exist (created separately)
# Changesets works with workspace:* protocol
# Changesets will handle versioning and publishing

# GOTCHA: vitest vs vitest run
# "vitest" starts watch mode (for development)
# "vitest run" runs once (for CI/CD)
# "vitest run --coverage" generates coverage report

# GOTCHA: TypeScript version compatibility
# TypeScript 5.5.0 is compatible with Node.js 20+
# Check peerDependencies if using with other packages
# React types (@types/react) should match React version

# GOTCHA: ESLint 9.x flat config
# ESLint 9.x uses eslint.config.js, not .eslintrc
# Root package.json should have ESLint 9.x in devDependencies
# Individual packages may inherit from root config
```

## Implementation Blueprint

### Data Models and Structure

```json
// Root package.json structure
{
  "name": "formality", // Root package name (not scoped)
  "private": true, // Prevents publishing
  "type": "module", // ES modules
  "packageManager": "pnpm@8.15.0", // Exact pnpm version
  "version": "0.1.0", // Root version (semantic)

  "scripts": {
    // Build: Run build in all packages (respects dependency order)
    "build": "pnpm -r build",

    // Dev: Run dev servers in parallel (watch mode)
    "dev": "pnpm -r --parallel dev",

    // Test: Run all tests once
    "test": "vitest run",

    // Test: Watch mode for development
    "test:watch": "vitest",

    // Test: Generate coverage report
    "test:coverage": "vitest run --coverage",

    // Typecheck: Type-check all TypeScript projects
    "typecheck": "tsc --build",

    // Lint: Run ESLint on all TypeScript files
    "lint": "eslint . --ext .ts,.tsx",

    // Format: Format all files with Prettier
    "format": "prettier --write .",

    // Clean: Remove all dist directories
    "clean": "pnpm -r exec rm -rf dist",

    // Changeset: Create a new changeset
    "changeset": "changeset",

    // Release: Build, version, and publish
    "release": "pnpm build && pnpm changeset version && pnpm changeset publish"
  },

  "devDependencies": {
    // Changesets: Version management for monorepo
    "@changesets/cli": "^2.27.0",

    // TypeScript types: Node.js built-ins
    "@types/node": "^20.0.0",

    // Vitest: Test framework with coverage
    "@vitest/coverage-v8": "^2.0.0",
    "vitest": "^2.0.0",

    // ESLint: Linting for TypeScript
    "eslint": "^9.0.0",

    // Prettier: Code formatting
    "prettier": "^3.0.0",

    // tsup: TypeScript package bundler
    "tsup": "^8.0.0",

    // TypeScript: TypeScript compiler
    "typescript": "^5.5.0"
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY workspace configuration exists
  - CHECK: /pnpm-workspace.yaml exists (from P1.M1.T1.S1)
  - VERIFY: File contains packages: ["packages/*"]
  - ENSURE: pnpm is installed at version 8.15.0 or compatible
  - COMMAND: pnpm --version (should be 8.x)

Task 2: CREATE /package.json with root configuration
  - IMPLEMENT: JSON file with all required fields
  - NAME: "formality" (not scoped, root package)
  - PRIVATE: true (prevents accidental publishing)
  - TYPE: "module" (ES modules for all packages)
  - PACKAGE_MANAGER: "pnpm@8.15.0" (exact format required)
  - VERSION: "0.1.0" (semantic version for root)
  - PLACEMENT: Project root directory (/home/dustin/projects/formality/)
  - VALIDATION: Valid JSON, proper escaping

Task 3: ADD scripts section with workspace commands
  - IMPLEMENT: All scripts using pnpm -r for recursive execution
  - BUILD: "pnpm -r build" (builds all packages in dependency order)
  - DEV: "pnpm -r --parallel dev" (runs dev servers in parallel)
  - TEST: "vitest run" (runs tests using vitest.workspace.ts)
  - TEST_WATCH: "vitest" (watch mode for development)
  - TEST_COVERAGE: "vitest run --coverage" (generates coverage)
  - TYPECHECK: "tsc --build" (type-checks all projects)
  - LINT: "eslint . --ext .ts,.tsx" (lints all TS/TSX files)
  - FORMAT: "prettier --write ." (formats all files)
  - CLEAN: "pnpm -r exec rm -rf dist" (cleans all dist dirs)
  - CHANGESET: "changeset" (creates new changeset)
  - RELEASE: "pnpm build && pnpm changeset version && pnpm changeset publish"
  - NAMING: Use kebab-case for script names
  - ORDER: Group related scripts together

Task 4: ADD devDependencies section with all tools
  - IMPLEMENT: All devDependencies with caret ranges
  - TYPESCRIPT: "^5.5.0" (TypeScript compiler)
  - VITEST: "^2.0.0" (test framework)
  - VITEST_COVERAGE: "@vitest/coverage-v8": "^2.0.0" (coverage provider)
  - ESLINT: "^9.0.0" (linter with flat config)
  - PRETTIER: "^3.0.0" (code formatter)
  - TSUP: "^8.0.0" (TypeScript bundler)
  - CHANGESETS: "@changesets/cli": "^2.27.0" (version management)
  - TYPES_NODE: "@types/node": "^20.0.0" (Node.js types)
  - VERSIONING: Use caret (^) for all ranges
  - SORTING: Alphabetical order is standard

Task 5: VERIFY pnpm can install dependencies
  - COMMAND: pnpm install
  - EXPECTED: Installs all devDependencies at root level
  - VERIFY: node_modules/ directory created at root
  - VERIFY: pnpm-lock.yaml updated/created
  - EXPECTED: No errors during installation

Task 6: VERIFY scripts execute correctly
  - COMMAND: pnpm run --dry-run build (shows what would run)
  - COMMAND: pnpm build (will fail until packages exist, but validates script)
  - COMMAND: pnpm run typecheck (will fail until tsconfig exists, but validates script)
  - VERIFY: All scripts are recognized by pnpm
  - EXPECTED: Scripts are listed in `pnpm run` output
```

### Implementation Patterns & Key Details

```json
// CRITICAL: Exact file content for /package.json
{
  "name": "formality",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@8.15.0",
  "version": "0.1.0",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --build",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "clean": "pnpm -r exec rm -rf dist",
    "changeset": "changeset",
    "release": "pnpm build && pnpm changeset version && pnpm changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

```yaml
# PATTERN: Root scripts delegate to packages via pnpm -r
# Script: "build": "pnpm -r build"
# Meaning: Run "build" script in all workspace packages
# Order: Respects dependency graph (packages are built in correct order)
# Benefit: Single command builds entire monorepo

# PATTERN: --parallel flag for watch mode
# Script: "dev": "pnpm -r --parallel dev"
# Meaning: Run "dev" in all packages simultaneously
# Use case: Watch mode for all packages at once
# Benefit: Fast feedback during development

# GOTCHA: vitest runs workspace tests from root
# Script: "test": "vitest run"
# Location: Uses vitest.workspace.ts for configuration
# Benefit: Single test command covers all packages

# CRITICAL: packageManager field format
# Value: "pnpm@8.15.0"
# Format: Exactly "name@version" with exact version
# Purpose: Enables Corepack to use correct pnpm version
# Benefit: Consistent pnpm version across all environments

# GOTCHA: DevDependency version ranges
# Format: "^2.27.0" allows updates within 2.x.x
# Reason: Get bug fixes and minor features automatically
# Do NOT use: "~2.27.0" (too restrictive)
# Do NOT use: "2.27.0" (no updates)

# PATTERN: Root package naming
# Name: "formality" (not scoped)
# Reason: Root package is not published
# Contrast: Workspace packages use "@formality-ui/*" scope

# EXTENSION: Future scripts (NOT for this task)
# If adding CI/CD scripts later:
# "ci:test": "pnpm test && pnpm test:coverage"
# "ci:build": "pnpm build && pnpm typecheck"
# "ci:validate": "pnpm lint && pnpm typecheck && pnpm test"
```

### Integration Points

```yaml
# INPUT: Consumed from P1.M1.T1.S1
WORKSPACE_CONFIG:
  - file: /pnpm-workspace.yaml
  - dependency: "pnpm -r scripts depend on workspace being configured"
  - contract: "packages: ['packages/*'] glob pattern"

# OUTPUT: Consumed by P1.M1.T2 (Create Package Structures)
PACKAGE_CREATION:
  - task: "P1.M1.T2.S1-S3: Create @formality-ui/{core,react,vue,svelte}"
  - dependency: "Packages inherit root devDependencies"
  - contract: "Workspace packages can use typescript, vitest, eslint, prettier, tsup from root"
  - benefit: "No need to duplicate devDependencies in each package"

# OUTPUT: Consumed by P1.M2 (TypeScript & Build Configuration)
BUILD_CONFIG:
  - task: "P1.M2.T1-S3: Configure TypeScript and Build Tooling"
  - dependency: "Root devDependencies provide required tools"
  - contract: "typescript and tsup available for build configuration"
  - benefit: "tsup can be used in package build scripts"

# OUTPUT: Consumed by P1.M3 (Testing Infrastructure)
TEST_CONFIG:
  - task: "P1.M3.T1-S3: Configure Vitest"
  - dependency: "Root devDependencies provide vitest and coverage"
  - contract: "vitest and @vitest/coverage-v8 available for test configuration"
  - benefit: "Test runner available for all packages"

# OUTPUT: Consumed by release workflow
RELEASE:
  - tool: "@changesets/cli"
  - purpose: "Version management and publishing"
  - contract: "Changesets reads workspace packages and versions"
  - benefit: "Automated version bumps and publishing"

# OUTPUT: Consumed by development workflow
DEV_EXPERIENCE:
  - scripts: "build, dev, test, typecheck, lint, format"
  - purpose: "Standardize development commands"
  - contract: "All developers use same commands"
  - benefit: "Consistent developer experience"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating the file, validate immediately

# Check file exists
ls -la /package.json
# Expected: File listing showing package.json

# Verify JSON syntax
cat /package.json | python3 -m json.tool > /dev/null
# Expected: No output (exit code 0) means valid JSON

# Alternative: Use node to validate JSON
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
# Expected: No output (exit code 0) means valid JSON

# Verify file content matches specification
cat /package.json
# Expected output:
# {
#   "name": "formality",
#   "private": true,
#   "type": "module",
#   "packageManager": "pnpm@8.15.0",
#   "version": "0.1.0",
#   "scripts": {
#     "build": "pnpm -r build",
#     "dev": "pnpm -r --parallel dev",
#     "test": "vitest run",
#     ...
#   },
#   "devDependencies": {
#     "@changesets/cli": "^2.27.0",
#     ...
#   }
# }

# Check for common JSON errors
# 1. No trailing commas
cat /package.json | grep ',\s*}'
# Expected: No output (no trailing commas before closing braces)

# 2. Proper quoting (double quotes, not single)
cat /package.json | grep "'"
# Expected: No output (all strings use double quotes)

# 3. Proper line endings (LF, not CRLF)
file /package.json
# Expected: "JSON data" or "ASCII text"

# Expected: All validations pass, file is valid JSON
```

### Level 2: Package Manager Validation (Component Validation)

```bash
# Verify pnpm recognizes the packageManager field
pnpm --version
# Expected: 8.15.0 or 8.x.x (compatible version)

# Verify workspace configuration is still valid
cat /pnpm-workspace.yaml
# Expected: packages: ["packages/*"]

# Install dependencies (this validates package.json is correct)
pnpm install
# Expected:
# - Downloads and installs all devDependencies
# - Creates/updates pnpm-lock.yaml
# - Creates node_modules/ at root
# - No errors during installation

# Verify devDependencies are installed
ls node_modules/.bin/ | grep -E "(tsc|vitest|eslint|prettier|tsup|changeset)"
# Expected: All tool binaries are available

# Verify specific packages are installed
pnpm list typescript vitest eslint prettier tsup @changesets/cli --depth=0
# Expected: Lists all devDependencies with correct versions

# Expected: pnpm installs successfully, all tools available
```

### Level 3: Scripts Validation (System Validation)

```bash
# List all available scripts
pnpm run
# Expected: Shows all scripts: build, dev, test, test:watch, test:coverage, typecheck, lint, format, clean, changeset, release

# Test script execution (dry-run where possible)
pnpm run --dry-run build
# Expected: Shows command that would be executed: "pnpm -r build"

# Test individual scripts (some will fail until packages/configs exist)
pnpm run typecheck
# Expected: May fail (tsconfig not ready), but script executes
# Error: "error TS18000: No inputs were found" or similar is acceptable

pnpm run lint
# Expected: May fail (eslint.config.js not ready), but script executes

# Test vitest script (will fail until tests exist)
pnpm test
# Expected: "No test files found" or similar error is acceptable

# Test format script (will format any existing files)
pnpm run format
# Expected: Formats files, may have no effect if no .ts/.tsx files

# Test changeset command
pnpm changeset
# Expected: Opens changeset CLI (may show no packages yet)

# Expected: All scripts are executable and recognized by pnpm
```

### Level 4: Integration Testing (Full System Validation)

```bash
# Verify workspace commands work correctly
pnpm -r exec pwd
# Expected: Runs command in workspace context (may show no packages yet)

# Verify pnpm -r respects dependency graph
# (This will be more meaningful after packages are created in P1.M1.T2)

# Test Corepack integration (if available)
corepack enable
corepack prepare pnpm@8.15.0 --activate
# Expected: Enables and prepares pnpm 8.15.0

# Verify the packageManager field is respected
cat package.json | grep packageManager
# Expected: "packageManager": "pnpm@8.15.0"

# Test that private: true prevents accidental publishing
# (Simulation - don't actually run publish)
pnpm publish --dry-run
# Expected: Error about private package or warning

# Expected: All integration points work correctly
```

## Final Validation Checklist

### Technical Validation

- [ ] File created at `/package.json` (project root)
- [ ] File is valid JSON (parseable by node/python)
- [ ] `name` field is "formality"
- [ ] `private` field is true
- [ ] `type` field is "module"
- [ ] `packageManager` field is "pnpm@8.15.0" (exact format)
- [ ] `version` field is "0.1.0"
- [ ] All 11 scripts are present (build, dev, test, test:watch, test:coverage, typecheck, lint, format, clean, changeset, release)
- [ ] All 8 devDependencies are present with correct versions
- [ ] `pnpm install` succeeds without errors
- [ ] All devDependencies are installed in node_modules/
- [ ] `pnpm run` lists all scripts

### Feature Validation

- [ ] Success criteria from "What" section met: All checkboxes completed
- [ ] Scripts use `pnpm -r` for recursive execution where appropriate
- [ ] Scripts use `--parallel` flag for dev command
- [ ] DevDependency versions use caret (^) ranges
- [ ] packageManager field uses exact version (no caret)
- [ ] File is properly formatted (2-space indentation)
- [ ] No trailing commas (proper JSON)
- [ ] Ready for downstream task P1.M1.T2 (Create Package Structures)

### Code Quality Validation

- [ ] Follows JSON formatting standards
- [ ] DevDependencies are sorted alphabetically
- [ ] Scripts are grouped logically (build, test, dev tools, release)
- [ ] File uses double quotes (not single quotes)
- [ ] No unnecessary whitespace
- [ ] File is minimal (contains only required configuration)

### Documentation & Deployment

- [ ] All referenced URLs are accurate and relevant
- [ ] Integration points clearly documented
- [ ] Gotchas documented for future reference
- [ ] Contract with P1.M1.T1.S1 clearly defined
- [ ] Outputs for P1.M1.T2 clearly specified
- [ ] PRP is self-documenting with examples

---

## Anti-Patterns to Avoid

- ❌ Don't set `private: false` - root package must not be publishable
- ❌ Don't use scoped name like "@formality-ui/root" - use "formality"
- ❌ Don't omit `packageManager` field - needed for consistency
- ❌ Don't use caret in packageManager version - use exact "pnpm@8.15.0"
- ❌ Don't use tilde (~) in devDependency versions - use caret (^)
- ❌ Don't add dependencies section - only devDependencies at root
- ❌ Don't use `npm` or `yarn` in scripts - use `pnpm`
- ❌ Don't omit `type: "module"` - needed for ES modules
- ❌ Don't hardcode exact versions for devDependencies (except pnpm)
- ❌ Don't create scripts that duplicate pnpm -r functionality unnecessarily
- ❌ Don't add trailing commas in JSON (not valid JSON)
- ❌ Don't use single quotes for strings (must be double quotes)
- ❌ Don't forget to add scripts for all development workflows
- ❌ Don't skip `pnpm install` validation step

---

## Additional Context for Executing Agent

### Task Dependency Chain

```
P1.M1.T1.S1: Create pnpm-workspace.yaml (COMPLETED)
         ↓
P1.M1.T1.S2: Create root package.json (THIS TASK)
         ↓
P1.M1.T2: Create Package Structures (NEXT)
         ├── P1.M1.T2.S1: Create @formality-ui/core package structure
         ├── P1.M1.T2.S2: Create @formality-ui/react package structure
         └── P1.M1.T2.S3: Create Vue and Svelte stub packages
         ↓
P1.M2: TypeScript & Build Configuration
         ↓
P1.M3: Testing Infrastructure
         ↓
P2-P6: Implementation phases (all depend on root package.json)
```

### Relationship with Previous PRP (P1.M1.T1.S1)

**INPUT from P1.M1.T1.S1:**

- File: `/pnpm-workspace.yaml`
- Content: `packages: ["packages/*"]`
- Purpose: Enables workspace discovery for pnpm

**CONTRACT:** The workspace configuration from P1.M1.T1.S1 is assumed to exist and be correct. This PRP does not modify or validate pnpm-workspace.yaml.

### Outputs for Next Task (P1.M1.T2)

**PROVIDED to P1.M1.T2:**

- Root devDependencies available for workspace packages
- TypeScript 5.5.0 for type system
- tsup 8.0.0 for building packages
- Vitest 2.0.0 for testing
- ESLint 9.0.0 for linting
- Prettier 3.0.0 for formatting
- Changesets for version management

**CONTRACT:** Workspace packages created in P1.M1.T2 will have access to these devDependencies without needing to specify them in their own package.json files (unless package-specific overrides are needed).

### Version Strategy

**Root version:** "0.1.0"

- Indicates early development phase
- Will be managed by changesets
- Individual packages have their own versions

**DevDependency version ranges:**

- Use caret (^) for most dependencies
- Allows updates within same major version
- Gets bug fixes automatically
- Prevents breaking changes

**packageManager exact version:**

- "pnpm@8.15.0" uses exact version
- Required for Corepack integration
- Ensures consistency across environments

### Script Usage Patterns

```bash
# Development workflow
pnpm dev              # Start all package dev servers in parallel
pnpm test             # Run all tests once
pnpm test:watch       # Watch mode for TDD
pnpm typecheck        # Type-check all packages
pnpm lint             # Lint all TypeScript files
pnpm format           # Format all files

# Build workflow
pnpm build            # Build all packages in dependency order
pnpm clean            # Clean all dist directories

# Release workflow
pnpm changeset        # Create a changeset
pnpm release          # Build, version bump, and publish
```

### Confidence Score

**9/10** - The PRP provides exact file content, placement, validation commands, and comprehensive context. The only uncertainty is whether the root package.json already exists (and if so, whether it needs to be created or replaced). The research from pnpm documentation and version checking ensures all information is accurate and current.

---

## Sources

- [pnpm package.json Documentation](https://pnpm.io/package.json)
- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [pnpm Recursive Commands (-r flag)](https://pnpm.io/cli#-r---recursive)
- [pnpm Parallel Execution](https://pnpm.io/cli#--parallel)
- [pnpm 8.15.0 Release Notes](https://github.com/pnpm/pnpm/blob/main/CHANGELOG.md#8150)
- [Changesets Documentation](https://changesets.dev/docs/intro)
- [Changesets for Monorepos](https://github.com/changesets/changesets/blob/main/docs/for-repo-maintainers/monorepos.md)
- [tsup Documentation](https://tsup.egoist.dev/)
- [Vitest Workspace Configuration](https://vitest.dev/guide/workspace.html)
- [ESLint Documentation](https://eslint.org/docs/latest/integrate/)
- [Prettier Documentation](https://prettier.io/docs/en/options.html)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Previous PRP: plan/001_bbf464589edd/P1M1T1S1/PRP.md](plan/001_bbf464589edd/P1M1T1S1/PRP.md)
- [Project PRD: plan/001_bbf464589edd/prd_snapshot.md](plan/001_bbf464589edd/prd_snapshot.md)
