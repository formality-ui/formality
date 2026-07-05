# pnpm workspace:\* Protocol Research

## Table of Contents

1. [How workspace:\* Protocol Works](#how-workspace-protocol-works)
2. [Specifying Workspace Dependencies in package.json](#specifying-workspace-dependencies)
3. [Changesets and workspace:\* Publishing](#changesets-and-workspace-publishing)
4. [Best Practices for Workspace Configuration](#best-practices)
5. [workspace:\* and peerDependencies](#workspace-and-peerdependencies)
6. [Common Patterns from Popular Monorepos](#common-patterns)

---

## How workspace:\* Protocol Works

### Overview

The `workspace:*` protocol is pnpm's solution for linking local packages within a monorepo without requiring them to be published to a registry first. This enables efficient development and testing of interdependent packages.

### Key Features

1. **Local Package Linking**: Automatically creates symlinks between workspace packages during `pnpm install`
2. **Version Resolution**: Resolves to the actual version of the workspace package
3. **Publishing Transformation**: Converts to actual version ranges during publishing
4. **Efficient Storage**: Uses pnpm's content-addressable storage for minimal disk usage

### How It Works

When you specify `"@my-org/core": "workspace:*"` in a package's dependencies:

1. **Development**: pnpm creates a symlink to the local package in `node_modules`
2. **Version Detection**: pnpm reads the actual version from the referenced package's `package.json`
3. **Build Time**: The import resolution works exactly like a regular published package
4. **Publish Time**: The `workspace:*` protocol is replaced with the actual version (see [Changesets section](#changesets-and-workspace-publishing))

### Workspace Protocol Syntax Variants

```json
{
  "dependencies": {
    // Exact version from workspace (latest available)
    "@my-org/core": "workspace:*",

    // Caret range based on workspace version
    "@my-org/utils": "workspace:^",

    // Tilde range based on workspace version
    "@my-org/ui": "workspace:~",

    // Specific version requirement from workspace
    "@my-org/types": "workspace:^1.2.0",

    // Protocol with package name (for disambiguation)
    "@my-org/package": "workspace:@my-org/package@*"
  }
}
```

### Workspace Configuration

**pnpm-workspace.yaml** (required):

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "tools/*"
  # Exclude specific patterns
  - "!**/test/**"
```

### Linking Behavior

- **Symbolic Links**: pnpm creates symlinks in `node_modules/.pnpm` pointing to workspace packages
- **Strict Isolation**: Each package gets its own `node_modules` with proper dependency isolation
- **Fast Installation**: Workspace dependencies are linked instantly, no download needed

---

## Specifying Workspace Dependencies in package.json

### Basic Configuration

```json
{
  "name": "@my-org/react-components",
  "version": "1.0.0",
  "dependencies": {
    "@my-org/core": "workspace:*",
    "@my-org/utils": "workspace:^"
  }
}
```

### Dependency Types Supporting workspace:\*

#### 1. Regular Dependencies

```json
{
  "dependencies": {
    "@my-org/shared": "workspace:*"
  }
}
```

#### 2. Development Dependencies

```json
{
  "devDependencies": {
    "@my-org/testing-utils": "workspace:*"
  }
}
```

#### 3. Peer Dependencies

```json
{
  "peerDependencies": {
    "@my-org/core": "workspace:*"
  }
}
```

**Note**: `workspace:*` in peerDependencies requires special handling - see [workspace:\* and peerDependencies](#workspace-and-peerdependencies) section.

### Real-World Example from formality

**packages/react/package.json**:

```json
{
  "name": "@formality-ui/react",
  "version": "0.0.0",
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
  }
}
```

**packages/svelte/package.json**:

```json
{
  "name": "@formality-ui/svelte",
  "version": "0.0.0",
  "dependencies": {
    "@formality-ui/core": "workspace:*"
  },
  "peerDependencies": {
    "svelte": "^4.0.0 || ^5.0.0"
  }
}
```

### Version Range Patterns

```json
{
  "dependencies": {
    // Wildcard - always use latest workspace version
    "@my-org/pkg": "workspace:*",

    // Caret - compatible with workspace version
    "@my-org/pkg": "workspace:^",

    // Tilde - patch updates only from workspace version
    "@my-org/pkg": "workspace:~",

    // Specific version constraint
    "@my-org/pkg": "workspace:^2.0.0",

    // Exact version matching workspace
    "@my-org/pkg": "workspace:1.5.0"
  }
}
```

---

## Changesets and workspace:\* Publishing

### Overview

Changesets is a tool for managing versioning and publishing monorepo packages. It has built-in support for the `workspace:*` protocol.

### How Changesets Handles workspace:\*

#### During Development

Changesets reads your `package.json` files as-is with `workspace:*` protocol:

```json
{
  "dependencies": {
    "@my-org/core": "workspace:*"
  }
}
```

#### During Version Bump (`changeset version`)

Changesets:

1. Reads all changeset files in `.changeset/`
2. Calculates version bumps for affected packages
3. Updates versions in `package.json` files
4. **Preserves `workspace:*` protocol** - does NOT convert it yet

Example after `changeset version`:

```json
{
  "name": "@my-org/core",
  "version": "1.2.0" // bumped from 1.1.0
}
```

Dependencies remain:

```json
{
  "dependencies": {
    "@my-org/core": "workspace:*" // still workspace:*
  }
}
```

#### During Publishing (`changeset publish`)

Changesets **replaces `workspace:*` with actual versions**:

**Before publishing**:

```json
{
  "name": "@my-org/react",
  "version": "2.0.0",
  "dependencies": {
    "@my-org/core": "workspace:*"
  }
}
```

**After publishing (on npm)**:

```json
{
  "name": "@my-org/react",
  "version": "2.0.0",
  "dependencies": {
    "@my-org/core": "^1.2.0" // replaced with actual version
  }
}
```

### Version Conversion Rules

| workspace:\* Syntax | Published As |
| ------------------- | ------------ |
| `workspace:*`       | `^<version>` |
| `workspace:^`       | `^<version>` |
| `workspace:~`       | `~<version>` |
| `workspace:^1.2.0`  | `^1.2.0`     |
| `workspace:1.2.0`   | `1.2.0`      |

### Changesets Configuration

**.changeset/config.json**:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### Important Configuration: `updateInternalDependencies`

The `updateInternalDependencies` setting controls how Changesets handles workspace dependencies:

- **"patch"** (default): When a package is bumped, dependent packages get a patch bump
- **"minor"**: Dependent packages get a minor bump
- **false**: Dependent packages are not bumped automatically

Example:

```json
{
  "updateInternalDependencies": "patch"
}
```

When `@my-org/core` goes from `1.0.0` to `1.1.0`:

- `@my-org/react` (which depends on `@my-org/core`) gets bumped to `2.0.1`

### Publishing Workflow

```bash
# 1. Create a changeset
pnpm changeset
# Select packages and version bump type
# Write changelog

# 2. Apply version bumps
pnpm changeset version
# This updates package.json versions but keeps workspace:*

# 3. Build packages
pnpm build

# 4. Publish
pnpm changeset publish
# This replaces workspace:* with actual versions and publishes
```

### Example: formality Publishing Workflow

**package.json** (root):

```json
{
  "scripts": {
    "build": "pnpm -r build",
    "changeset": "changeset",
    "release": "pnpm build && pnpm changeset version && pnpm changeset publish"
  }
}
```

This workflow ensures:

1. All packages are built first
2. Versions are bumped based on changesets
3. Publishing converts `workspace:*` to actual versions

---

## Best Practices for Workspace Configuration

### 1. Always Use workspace:\* for Internal Dependencies

**Recommended**:

```json
{
  "dependencies": {
    "@my-org/core": "workspace:*"
  }
}
```

**Not Recommended**:

```json
{
  "dependencies": {
    "@my-org/core": "file:../core"
  }
}
```

**Why**:

- `workspace:*` is the official pnpm protocol
- Properly handles version resolution
- Works seamlessly with Changesets
- Better tooling support

### 2. Use Semantic Versioning Ranges Appropriate to Your Use Case

```json
{
  "dependencies": {
    // For tightly coupled packages - use exact match
    "@my-org/internal-api": "workspace:*",

    // For stable libraries - use caret
    "@my-org/utils": "workspace:^",

    // For UI components - use tilde for patch updates
    "@my-org/components": "workspace:~"
  }
}
```

### 3. Keep workspace:\* in Source Control

**Do**:

- Commit `package.json` files with `workspace:*`
- Allow Changesets to handle conversion during publish

**Don't**:

- Commit `package.json` with actual version numbers for workspace deps
- Manually update workspace dependency versions

### 4. Use Consistent Package Naming

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
```

```json
// packages/core/package.json
{
  "name": "@my-org/core"
}

// packages/react/package.json
{
  "name": "@my-org/react"
}
```

### 5. Document Workspace Dependencies

Create a `README.md` in your monorepo root:

```markdown
# Monorepo Structure

## Packages

- `@my-org/core` - Core utilities and types
- `@my-org/react` - React component library
- `@my-org/vue` - Vue component library

## Internal Dependencies

- `@my-org/react` depends on `@my-org/core`
- `@my-org/vue` depends on `@my-org/core`

## Development

All internal dependencies use `workspace:*` protocol.
Changesets handles version conversion during publishing.
```

### 6. Use pnpm Workspace Commands

```bash
# Run command in all packages
pnpm -r build
pnpm -r test

# Run command in specific package
pnpm --filter @my-org/core test

# List all workspace dependencies
pnpm ls --depth 0
```

### 7. Configure publishConfig for Public Packages

```json
{
  "name": "@my-org/package",
  "publishConfig": {
    "access": "public"
  }
}
```

### 8. Use .npmrc for Workspace Settings

**.npmrc** (project root):

```
# Enable workspace protocol
workspace=true

# Prefer workspace versions
prefer-workspace-packages=true
```

### 9. Test Published Packages Locally

```bash
# Build all packages
pnpm -r build

# Test with actual published versions (requires registry setup)
# or use pnpm's link feature
```

### 10. Handle Circular Dependencies Carefully

Avoid circular dependencies if possible. If necessary:

```json
// packages/a/package.json
{
  "dependencies": {
    "@my-org/b": "workspace:*"
  }
}

// packages/b/package.json
{
  "peerDependencies": {
    "@my-org/a": "workspace:*"
  }
}
```

Use `peerDependencies` to break the cycle.

---

## workspace:\* and peerDependencies

### Overview

Using `workspace:*` in `peerDependencies` requires special consideration because peer dependencies are not installed by default - they are expected to be provided by the consumer.

### Challenge with workspace:\* in peerDependencies

**Problem**:

```json
{
  "name": "@my-org/react-components",
  "peerDependencies": {
    "@my-org/core": "workspace:*",
    "react": "^18.0.0"
  }
}
```

When consumers install `@my-org/react-components`:

- `react` is expected to be provided by the consumer (works fine)
- `@my-org/core` with `workspace:*` doesn't make sense for external consumers

### Solution: Dual Configuration Pattern

#### For Development (Within Workspace)

```json
{
  "name": "@my-org/react-components",
  "dependencies": {
    "@my-org/core": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

#### For Publishing (External Consumers)

After Changesets conversion:

```json
{
  "name": "@my-org/react-components",
  "dependencies": {
    "@my-org/core": "^1.2.0" // Now a regular dependency
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

**Result**: External consumers automatically get `@my-org/core` as a dependency.

### Alternative: Optional Peer Dependencies

```json
{
  "name": "@my-org/plugin",
  "peerDependencies": {
    "@my-org/core": "workspace:*"
  },
  "peerDependenciesMeta": {
    "@my-org/core": {
      "optional": true
    }
  }
}
```

### Best Practice: Internal vs External Dependencies

#### Internal Workspace Packages

```json
{
  "dependencies": {
    // Use regular dependencies for internal packages
    "@my-org/core": "workspace:*",
    "@my-org/utils": "workspace:*"
  }
}
```

**Reasoning**:

- Consumers automatically get these dependencies
- No configuration needed by consumers
- Versions are managed by the monorepo

#### External Libraries

```json
{
  "peerDependencies": {
    // Use peerDependencies for external libraries
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "vue": "^3.0.0"
  }
}
```

**Reasoning**:

- Avoids duplicate installations
- Allows consumer to control versions
- Standard pattern for framework libraries

### Hybrid Pattern (Advanced)

For packages that can work with or without internal dependencies:

```json
{
  "name": "@my-org/components",
  "dependencies": {
    // Optional internal dependency
    "@my-org/core": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "peerDependenciesMeta": {
    "@my-org/core": {
      "optional": true
    }
  }
}
```

### Real-World Example from formality

**packages/react/package.json**:

```json
{
  "name": "@formality-ui/react",
  "dependencies": {
    "@formality-ui/core": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-hook-form": "^7.0.0"
  }
}
```

**Analysis**:

- Internal dependency (`@formality-ui/core`) in `dependencies` with `workspace:*`
- External dependencies (React, React DOM, React Hook Form) in `peerDependencies`
- After publishing, consumers get `@formality-ui/core` automatically
- Consumers must provide React, React DOM, and React Hook Form

### Key Takeaways

1. **Internal workspace packages**: Use `dependencies` with `workspace:*`
2. **External framework libraries**: Use `peerDependencies` with version ranges
3. **Changesets handles the conversion**: `workspace:*` becomes actual version in `dependencies`
4. **External consumers get internal dependencies automatically**: No extra configuration needed

---

## Common Patterns from Popular Monorepo Projects

### Pattern 1: UI Library Monorepo (Radix UI, shadcn/ui)

**Structure**:

```
monorepo/
├── packages/
│   ├── core/
│   ├── react/
│   ├── vue/
│   └── primitives/
├── pnpm-workspace.yaml
```

**packages/react/package.json**:

```json
{
  "name": "@ui/react",
  "dependencies": {
    "@ui/core": "workspace:*",
    "@ui/primitives": "workspace:^"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**Key Characteristics**:

- Core package contains framework-agnostic logic
- Framework-specific packages depend on core via `workspace:*`
- Framework dependencies are peer dependencies

### Pattern 2: Design System (Chakra UI, Mantine)

**Structure**:

```
monorepo/
├── packages/
│   ├── system/
│   ├── components/
│   ├── icons/
│   └── utilities/
```

**packages/components/package.json**:

```json
{
  "name": "@design-system/components",
  "dependencies": {
    "@design-system/system": "workspace:*",
    "@design-system/icons": "workspace:^"
  }
}
```

**Key Characteristics**:

- Layered dependencies (components → system → utilities)
- Consistent `workspace:*` usage throughout
- Changesets for version management

### Pattern 3: Framework + Plugins (Vite, Astro)

**Structure**:

```
monorepo/
├── packages/
│   ├── vite/
│   ├── plugin-react/
│   ├── plugin-vue/
│   └── plugin-svelte/
```

**packages/plugin-react/package.json**:

```json
{
  "name": "@vitejs/plugin-react",
  "dependencies": {
    "vite": "workspace:*"
  },
  "peerDependencies": {
    "vite": ">=3.0.0"
  }
}
```

**Key Characteristics**:

- Plugins depend on core package via `workspace:*`
- Also declare peer dependency for external consumers
- Allows plugin to work with different core versions

### Pattern 4: Testing Library (Testing Library, Vitest)

**Structure**:

```
monorepo/
├── packages/
│   ├── core/
│   ├── react/
│   ├── vue/
│   └── dom/
```

**packages/react/package.json**:

```json
{
  "name": "@testing-library/react",
  "dependencies": {
    "@testing-library/dom": "workspace:^"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

**Key Characteristics**:

- Platform-specific packages depend on cross-platform core
- Caret ranges for stable APIs
- Framework versions in peer dependencies

### Pattern 5: Utility Library (lodash-es, date-fns)

**Structure**:

```
monorepo/
├── packages/
│   ├── core/
│   ├── fp/
│   └── helpers/
```

**packages/fp/package.json**:

```json
{
  "name": "@my-org/fp",
  "dependencies": {
    "@my-org/core": "workspace:*"
  }
}
```

**Key Characteristics**:

- Flat package structure
- All packages published to npm
- Minimal peer dependencies

### Common Configuration Patterns

#### 1. Root package.json

```json
{
  "name": "@my-org/monorepo",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "changeset": "changeset",
    "release": "pnpm build && pnpm changeset version && pnpm changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "typescript": "^5.0.0",
    "prettier": "^3.0.0"
  }
}
```

#### 2. pnpm-workspace.yaml

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "examples/*"
```

#### 3. TypeScript Configuration

**tsconfig.json** (root):

```json
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/react" },
    { "path": "./packages/vue" }
  ]
}
```

**packages/core/tsconfig.json**:

```json
{
  "composite": true,
  "declaration": true,
  "declarationMap": true
}
```

**packages/react/tsconfig.json**:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "paths": {
      "@my-org/core": ["../core/src"]
    }
  },
  "references": [{ "path": "../core" }]
}
```

### Best Practices from Popular Projects

1. **Consistent Naming**: All packages use scoped naming (`@org/name`)
2. **workspace:\* for Internal**: All internal dependencies use `workspace:*`
3. **peerDependencies for Frameworks**: Framework versions in peer dependencies
4. **Changesets Integration**: Most use Changesets for versioning
5. **Explicit Exports**: Use `exports` field in package.json
6. **Separate Build and Dev**: Clear distinction between build and dev dependencies
7. **TypeScript Project References**: Enable composite mode for monorepo

---

## References and Resources

### Official Documentation

#### pnpm Documentation

- **Workspaces**: https://pnpm.io/workspaces
  - Section: Workspace protocol
- **Workspace Protocol**: https://pnpm.io/workspace_protocol
  - Complete syntax and usage examples
- **pnpm-workspace.yaml**: https://pnpm.io/pnpm-workspace_yaml
  - Configuration options

#### Changesets Documentation

- **Introduction**: https://github.com/changesets/changesets
- **Configuration**: https://github.com/changesets/changesets/blob/main/docs/config.md
  - `updateInternalDependencies` option
- **Adding Changesets**: https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md
- **Versioning**: https://github.com/changesets/changesets/blob/main/docs/versioning-with-changesets.md
- **Publishing**: https://github.com/changesets/changesets/blob/main/docs/publishing-with-changesets.md

### Community Resources

#### Blog Posts

- **"Managing Monorepos with pnpm"**: Various Medium articles
- **"Changesets for Monorepo Versioning"**: Community tutorials
- **"Workspace Dependencies Best Practices"**: Dev.to articles

#### Examples

- **Turborepo Examples**: https://github.com/vercel/turbo/tree/main/examples
- **pnpm Examples**: https://github.com/pnpm/examples
- **Changesets Examples**: https://github.com/changesets/changesets/tree/main/docs

### Real-World Monorepos Using pnpm + workspace:\* + Changesets

1. **React Server Components**: https://github.com/reactjs/server-components-demo
2. **Vite**: https://github.com/vitejs/vite
3. **Astro**: https://github.com/withastro/astro
4. **Turborepo**: https://github.com/vercel/turbo
5. **Vitest**: https://github.com/vitest-dev/vitest
6. **TanStack Query**: https://github.com/TanStack/query
7. **shadcn/ui**: https://github.com/shadcn-ui/ui

### Tools and Integrations

- **pnpm**: https://pnpm.io
- **Changesets**: https://github.com/changesets/changesets
- **Turborepo**: https://turbo.build/repo
- **Nx**: https://nx.dev

### Code Examples

See the **formality** monorepo for working examples:

- `/home/dustin/projects/formality/pnpm-workspace.yaml`
- `/home/dustin/projects/formality/package.json`
- `/home/dustin/projects/formality/packages/core/package.json`
- `/home/dustin/projects/formality/packages/react/package.json`
- `/home/dustin/projects/formality/packages/svelte/package.json`
- `/home/dustin/projects/formality/packages/vue/package.json`

---

## Summary

### Key Takeaways

1. **workspace:\* Protocol**: pnpm's solution for linking local packages without publishing
2. **Syntax Variants**: `workspace:*`, `workspace:^`, `workspace:~`, `workspace:^1.2.0`
3. **Changesets Integration**: Automatically converts `workspace:*` to versions during publish
4. **Best Practice**: Use `workspace:*` for all internal workspace dependencies
5. **peerDependencies**: Use for external framework dependencies, not internal ones
6. **Configuration**: Requires `pnpm-workspace.yaml` in monorepo root
7. **Publishing**: Changesets handles conversion from `workspace:*` to `^version`

### Quick Reference

```json
{
  "dependencies": {
    // Internal workspace dependency
    "@my-org/core": "workspace:*"
  },
  "peerDependencies": {
    // External framework dependency
    "react": "^18.0.0"
  }
}
```

**Development**: `@my-org/core` is linked from local workspace
**After Publishing**: `@my-org/core` becomes `^1.2.0` in published package

### Workflow

```bash
# 1. Add dependency
pnpm add --filter @my-org/react @my-org/core

# 2. Create changeset
pnpm changeset

# 3. Apply version bumps
pnpm changeset version

# 4. Build
pnpm build

# 5. Publish (workspace:* → actual version)
pnpm changeset publish
```

---

_Document generated for formality monorepo research_
_Last updated: 2026-01-12_
