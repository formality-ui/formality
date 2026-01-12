# pnpm Monorepo Package Structure Research

## Table of Contents
1. [Workspace Package Configuration](#1-workspace-package-configuration)
2. [Package Naming Conventions](#2-package-naming-conventions)
3. [Root vs Workspace Package.json](#3-root-vs-workspace-packagejson)
4. [Referencing Workspace Packages](#4-referencing-workspace-packages)
5. [Common Directory Structure Patterns](#5-common-directory-structure-patterns)
6. [Official Documentation References](#6-official-documentation-references)

---

## 1. Workspace Package Configuration

### 1.1 Root pnpm-workspace.yaml Configuration

The foundation of a pnpm monorepo is the `pnpm-workspace.yaml` file in the root directory:

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'tools/*'
```

**Key Points:**
- Defines which directories contain workspace packages
- Uses glob patterns to match package directories
- Each matching directory must contain a valid `package.json`
- Supports multiple glob patterns for different package categories

### 1.2 Workspace Package package.json Structure

Each workspace package requires a properly configured `package.json`:

```json
{
  "name": "@formality-ui/core",
  "version": "0.1.0",
  "private": false,
  "publishConfig": {
    "access": "public"
  },
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
    "external-package": "^1.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**Essential Fields:**
- `name`: Unique package identifier (should be scoped for monorepos)
- `version`: Semantic version number
- `private`: Set to `false` for publishable packages, `true` for internal-only
- `publishConfig.access`: Set to `"public"` for scoped packages
- `type`: `"module"` for ESM, `"commonjs"` for CJS
- `main`: Entry point for CommonJS
- `module`: Entry point for ESM
- `types`: TypeScript declaration file entry point
- `exports`: Modern export conditions for package consumers
- `files`: Array of files/directories to include when publishing
- `sideEffects`: Enables tree-shaking optimization

---

## 2. Package Naming Conventions

### 2.1 Scoped Naming for Monorepos

**Best Practice:** Use scoped package names to organize monorepo packages

```
@formality-ui/core
@formality-ui/react
@formality-ui/vue
@formality-ui/svelte
```

**Benefits of Scoped Naming:**
- Prevents naming conflicts with public npm packages
- Clearly indicates package ownership/organization
- Groups related packages together
- Enables `publishConfig.access: "public"` for free publishing

### 2.2 Naming Patterns

**Framework-Specific Packages:**
```
@formality-ui/react     # React integration
@formality-ui/vue       # Vue integration
@formality-ui/svelte    # Svelte integration
@formality-ui/solid     # Solid integration
```

**Core/Shared Packages:**
```
@formality-ui/core      # Core logic/framework-agnostic
@formality-ui/utils     # Utility functions
@formality-ui/types     # Shared TypeScript types
```

**Feature Packages:**
```
@formality-ui/validation    # Validation features
@formality-ui/evaluation    # Expression evaluation
@formality-ui/providers     # Data providers
```

### 2.3 Naming Best Practices

1. **Use kebab-case:** All lowercase with hyphens between words
2. **Be descriptive:** Names should clearly indicate purpose
3. **Avoid conflicts:** Check npm registry for existing names
4. **Stay consistent:** Use consistent naming patterns across packages
5. **Keep it short:** Prefer shorter, memorable names

**Good Examples:**
- `@formality-ui/core`
- `@formality-ui/react-components`
- `@formality-ui/validation-rules`

**Avoid:**
- `@formality-ui/Core` (camelCase)
- `@formality-ui.core` (dots)
- `@formality-ui_core` (underscores)

---

## 3. Root vs Workspace Package.json

### 3.1 Root package.json

The root `package.json` serves as the monorepo configuration hub:

```json
{
  "name": "formality",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "test": "vitest run",
    "test:watch": "vitest",
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

**Root Package Characteristics:**
- `private: true` - Prevents accidental publishing of root
- Shared dev dependencies (TypeScript, linters, testing)
- Orchestrator scripts using `pnpm -r` (recursive)
- Monorepo tooling (changesets, etc.)
- Version control for tooling (packageManager field)

### 3.2 Workspace Package package.json

Workspace packages focus on their specific functionality:

```json
{
  "name": "@formality-ui/react",
  "version": "0.1.0",
  "private": false,
  "publishConfig": {
    "access": "public"
  },
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
    "@formality-ui/core": "workspace:*",
    "lodash-es": "^4.17.21"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-hook-form": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.50.0"
  }
}
```

**Workspace Package Characteristics:**
- Scoped name for organization
- Focused dependencies (only what that package needs)
- Workspace references to internal packages
- Framework-specific peer dependencies
- Package-specific build/test scripts
- Ready for publishing

### 3.3 Key Differences

| Aspect | Root Package | Workspace Package |
|--------|--------------|-------------------|
| `private` | `true` | `false` (usually) |
| Purpose | Orchestration | Functionality |
| Dependencies | Dev tooling only | Runtime + workspace deps |
| Scripts | Run across all packages (`-r`) | Package-specific |
| Publishing | Never published | Published to npm |
| Location | Root directory | `packages/*` or `apps/*` |

---

## 4. Referencing Workspace Packages

### 4.1 The workspace: Protocol

The `workspace:` protocol is pnpm's way to link packages within a monorepo:

```json
{
  "dependencies": {
    "@formality-ui/core": "workspace:*",
    "@formality-ui/utils": "workspace:^",
    "@formality-ui/types": "workspace:~"
  }
}
```

**Protocol Variants:**

1. **`workspace:*`** (Most Common)
   - Links to the exact version in the workspace
   - Best for development (always uses local version)
   - Resolves to actual version on publish

2. **`workspace:^`**
   - Links with caret range matching
   - Allows compatible updates within workspace

3. **`workspace:~`**
   - Links with tilde range matching
   - More restrictive than caret

4. **`workspace:1.2.3`**
   - Links to specific version
   - Ensures exact version match

### 4.2 How workspace: Works

**During Development:**
```json
{
  "dependencies": {
    "@formality-ui/core": "workspace:*"
  }
}
```
- Creates a symlink to the local package
- Changes in `@formality-ui/core` are immediately available
- No need to reinstall or rebuild

**During Publishing:**
```bash
pnpm publish
```
- `workspace:*` is replaced with the actual version number
- Example: `"@formality-ui/core": "workspace:*"` → `"@formality-ui/core": "0.1.0"`

### 4.3 Practical Examples

**Example 1: React Package Depends on Core**

```json
// packages/react/package.json
{
  "name": "@formality-ui/react",
  "dependencies": {
    "@formality-ui/core": "workspace:*"
  }
}
```

**Example 2: Vue Package Depends on Core**

```json
// packages/vue/package.json
{
  "name": "@formality-ui/vue",
  "dependencies": {
    "@formality-ui/core": "workspace:*"
  }
}
```

**Example 3: App Depends on Multiple Workspace Packages**

```json
// apps/web/package.json
{
  "name": "@formality-ui/web-app",
  "dependencies": {
    "@formality-ui/core": "workspace:*",
    "@formality-ui/react": "workspace:*",
    "@formality-ui/validation": "workspace:*"
  }
}
```

### 4.4 Referencing Best Practices

1. **Always use `workspace:*` for internal dependencies**
   - Ensures you're using the local version during development
   - Automatically resolves to published version

2. **Keep workspace dependencies minimal**
   - Only depend on what you actually need
   - Prevents unnecessary coupling

3. **Use peerDependencies for frameworks**
   ```json
   {
     "peerDependencies": {
       "react": "^18.0.0"
     }
   }
   ```

4. **Document workspace dependencies**
   - Make it clear which packages depend on which
   - Consider a dependency diagram in README

### 4.5 Verifying Workspace Links

Check that workspace packages are properly linked:

```bash
# List all workspace dependencies
pnpm list --depth 0

# Check specific package dependencies
pnpm list --filter @formality-ui/react

# Verify workspace protocol is working
pnpm why @formality-ui/core
```

---

## 5. Common Directory Structure Patterns

### 5.1 Standard Monorepo Structure

```
formality/
├── pnpm-workspace.yaml
├── package.json
├── pnpm-lock.yaml
├── .gitignore
├── tsconfig.json
├── vitest.workspace.ts
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   ├── src/
│   │   ├── dist/
│   │   └── tsup.config.ts
│   ├── react/
│   │   ├── package.json
│   │   ├── src/
│   │   ├── dist/
│   │   └── tsup.config.ts
│   ├── vue/
│   │   ├── package.json
│   │   ├── src/
│   │   └── dist/
│   └── svelte/
│       ├── package.json
│       ├── src/
│       └── dist/
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   └── src/
│   └── docs/
│       ├── package.json
│       └── src/
├── tools/
│   ├── lint-config/
│   │   └── package.json
│   └── ts-config/
│       └── package.json
└── examples/
    ├── basic-usage/
    └── advanced-usage/
```

### 5.2 pnpm-workspace.yaml Configuration

**Simple Structure:**
```yaml
packages:
  - 'packages/*'
```

**Multi-Directory Structure:**
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'tools/*'
  - 'examples/*'
```

**Selective Structure:**
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'
```

### 5.3 Common Package Categories

**1. Core Packages** (`packages/`)
- Framework-agnostic logic
- Shared utilities
- Type definitions
- Base functionality

**2. Framework Packages** (`packages/`)
- React integration
- Vue integration
- Svelte integration
- Angular integration

**3. Feature Packages** (`packages/`)
- Validation
- Evaluation
- Providers
- Components

**4. Application Packages** (`apps/`)
- Documentation site
- Example apps
- Demo applications
- Internal tools

**5. Development Tools** (`tools/`)
- Shared TypeScript configs
- ESLint configurations
- Build scripts
- Development utilities

### 5.4 Alternative Patterns

**Pattern 1: Domain-Driven Structure**
```
packages/
├── auth/
├── billing/
├── user-management/
└── shared/
```

**Pattern 2: Layer-Based Structure**
```
packages/
├── ui-components/
├── business-logic/
├── data-access/
└── api-clients/
```

**Pattern 3: Type-Based Structure**
```
packages/
├── libraries/
├── services/
├── apps/
└── configs/
```

### 5.5 Structure Best Practices

1. **Keep it flat initially**
   - Start with all packages in `packages/`
   - Split into subdirectories when needed

2. **Group related packages**
   - Framework packages together
   - Feature packages together
   - Apps in separate directory

3. **Use descriptive directory names**
   - `packages/` for libraries
   - `apps/` for applications
   - `tools/` for development tools
   - `examples/` for examples

4. **Maintain consistency**
   - Use the same structure for similar packages
   - Keep build artifacts in consistent locations

5. **Consider package count**
   - < 10 packages: Single `packages/` directory
   - 10-50 packages: Split into categories
   - 50+ packages: Multiple workspace definitions

---

## 6. Official Documentation References

### 6.1 Core pnpm Workspace Documentation

**Main Workspaces Documentation**
- URL: https://pnpm.io/workspaces
- Sections:
  - Workspace setup
  - pnpm-workspace.yaml configuration
  - Workspace commands
  - Linking workspace packages

**Workspace Protocol Documentation**
- URL: https://pnpm.io/workspaces#workspace-protocol-workspace
- Sections:
  - `workspace:` protocol syntax
  - Version range specifications
  - Publishing with workspace dependencies
  - Workspace protocol examples

**Package.json Reference**
- URL: https://pnpm.io/package_json
- Sections:
  - package.json fields
  - pnpm-specific fields
  - Dependency types
  - Publish configuration

### 6.2 Dependency Management

**Dependencies Documentation**
- URL: https://pnpm.io/dependency-types
- Sections:
  - dependencies
  - devDependencies
  - peerDependencies
  - optionalDependencies

**Workspace Dependencies**
- URL: https://pnpm.io/workspaces#workspace-dependencies
- Sections:
  - Adding workspace dependencies
  - Workspace dependency protocol
  - Linking local packages

### 6.3 Publishing from Monorepos

**Publishing Workspaces**
- URL: https://pnpm.io/publishing-workspace-packages
- Sections:
  - Publishing workspace packages
  - workspace: protocol during publish
  - Version management
  - Access control

**Changesets with pnpm**
- URL: https://pnpm.io/using-changesets
- Sections:
  - Changeset configuration
  - Versioning in monorepos
  - Publishing with changesets

### 6.4 CLI Commands

**Workspace CLI Commands**
- URL: https://pnpm.io/cli/add
- Sections:
  - Adding workspace dependencies
  - `--workspace` flag
  - `--filter` option

**Recursive Commands**
- URL: https://pnpm.io/cli/recursive
- Sections:
  - `pnpm -r` (recursive)
  - `pnpm --filter`
  - Running commands in specific packages

### 6.5 Best Practices

**Monorepo Best Practices**
- URL: https://pnpm.io/workspaces#best-practices
- Sections:
  - Workspace organization
  - Dependency management
  - Performance optimization
  - CI/CD considerations

### 6.6 Additional Resources

**GitHub Repository**
- URL: https://github.com/pnpm/pnpm
- Issues, discussions, and examples

**Discord Community**
- URL: https://pnpm.io/pnpm-discord
- Real-time help and discussions

**Blog**
- URL: https://pnpm.io/blog
- Feature announcements, tutorials, best practices

---

## Summary: Key Takeaways

1. **Workspace Configuration**
   - Use `pnpm-workspace.yaml` to define workspace packages
   - Each package needs a valid `package.json`
   - Use glob patterns to match package directories

2. **Scoped Naming**
   - Use `@organization/package` format
   - Keep names descriptive and consistent
   - Use kebab-case for package names

3. **Root vs Workspace Packages**
   - Root: Orchestration, dev dependencies, never published
   - Workspace: Focused functionality, published individually

4. **Workspace Dependencies**
   - Use `workspace:*` for internal dependencies
   - Automatically resolves during publish
   - Enables hot-reloading during development

5. **Directory Structure**
   - Start simple with `packages/*`
   - Split into categories as needed
   - Group related packages together

6. **Official Resources**
   - https://pnpm.io/workspaces - Main workspace docs
   - https://pnpm.io/workspaces#workspace-protocol-workspace - Workspace protocol
   - https://pnpm.io/package_json - Package.json reference
   - https://pnpm.io/publishing-workspace-packages - Publishing guide

---

## Current Project Examples

The Formality project demonstrates these principles:

**Current Structure:**
```
formality/
├── pnpm-workspace.yaml       # Defines packages/*
├── package.json              # Root orchestration
├── packages/
│   ├── core/                 # @formality-ui/core
│   ├── react/                # @formality-ui/react
│   ├── vue/                  # @formality-ui/vue
│   └── svelte/               # @formality-ui/svelte
└── examples/                 # Example applications
```

**Workspace Dependency Example:**
```json
// packages/react/package.json
{
  "dependencies": {
    "@formality-ui/core": "workspace:*"
  }
}
```

This follows pnpm monorepo best practices and provides a solid foundation for scaling the project.
