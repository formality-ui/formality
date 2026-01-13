# React Library Package.json Structure and Exports Configuration

Research document examining how major React libraries structure their package.json files and configure exports.

## Table of Contents

1. [Material UI (MUI)](#material-ui-mui)
2. [Chakra UI](#chakra-ui)
3. [Radix UI Primitives](#radix-ui-primitives)
4. [Subpath Exports Configuration](#subpath-exports-configuration)
5. [Common Scripts and Configurations](#common-scripts-and-configurations)
6. [Best Practices Summary](#best-practices-summary)

---

## Material UI (MUI)

### GitHub Repository
- **URL**: https://github.com/mui/material-ui
- **Organization**: MUI Team
- **Structure**: Monorepo using TypeScript and various build tools

### Package.json Structure

MUI uses a comprehensive package.json with extensive exports configuration. The main package (@mui/material) supports:

```json
{
  "name": "@mui/material",
  "version": "6.0.0",
  "private": false,
  "description": "React components that implement Google's Material Design.",
  "main": "./index.js",
  "module": "./index.js",
  "types": "./index.d.ts",
  "exports": {
    ".": {
      "import": "./index.js",
      "require": "./index.js",
      "types": "./index.d.ts"
    },
    "./package.json": "./package.json",
    "./internal": {
      "types": "./internal.d.ts"
    },
    "./locales/*": {
      "types": "./locales/*.d.ts",
      "default": "./locales/*"
    }
  },
  "sideEffects": false,
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "npm run build:node && npm run build:stable",
    "build:node": "ctsx",
    "build:stable": "ts-transform build",
    "test": "npm run test:unit",
    "test:unit": "jest",
    "lint": "eslint .",
    "typescript": "tsc -p tsconfig.json"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "dependencies": {
    "@babel/runtime": "^7.23.0",
    "@mui/base": "6.0.0",
    "@mui/system": "6.0.0",
    "clsx": "^2.0.0",
    "prop-types": "^15.8.1"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### Key Features

1. **Component-based exports**: Each component can be imported individually
   ```javascript
   import Button from '@mui/material/Button';
   import TextField from '@mui/material/TextField';
   ```

2. **Locale support**: Structured exports for i18n
   ```javascript
   import { zhCN } from '@mui/material/locales';
   ```

3. **Tree-shaking**: Uses `sideEffects: false` for optimal bundling

4. **Strict engine requirements**: Node.js 18+

---

## Chakra UI

### GitHub Repository
- **URL**: https://github.com/chakra-ui/chakra-ui
- **Organization**: Chakra UI Team
- **Structure**: Monorepo with individual packages for each component system

### Package.json Structure (for @chakra-ui/react)

Chakra UI uses a modular approach with comprehensive exports:

```json
{
  "name": "@chakra-ui/react",
  "version": "3.0.0",
  "description": "Responsive and accessible React component library",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    },
    "./package.json": "./package.json",
    "./use-animation-state": {
      "types": "./dist/use-animation-state.d.ts",
      "import": "./dist/use-animation-state.mjs",
      "require": "./dist/use-animation-state.cjs"
    },
    "./use-disclosure": {
      "types": "./dist/use-disclosure.d.ts",
      "import": "./dist/use-disclosure.mjs",
      "require": "./dist/use-disclosure.cjs"
    },
    "./system": {
      "types": "./dist/system.d.ts",
      "import": "./dist/system.mjs",
      "require": "./dist/system.cjs"
    }
  },
  "sideEffects": false,
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "dependencies": {
    "@emotion/react": "^11.0.0",
    "@chakra-ui/utils": "workspace:^",
    "@chakra-ui/system": "workspace:^"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### Key Features

1. **Hook-based exports**: Individual hooks can be imported separately
   ```javascript
   import { useDisclosure } from '@chakra-ui/react/use-disclosure';
   import { useAnimationState } from '@chakra-ui/react/use-animation-state';
   ```

2. **System exports**: Separate entry point for system utilities
   ```javascript
   import { SystemProvider } from '@chakra-ui/react/system';
   ```

3. **Modern build setup**: Uses `tsup` for fast TypeScript compilation

4. **Comprehensive test setup**: Includes Vitest with UI mode

5. **Workspace dependencies**: Uses workspace protocol for monorepo management

---

## Radix UI Primitives

### GitHub Repository
- **URL**: https://github.com/radix-ui/primitives
- **Organization**: WorkOS
- **Structure**: Monorepo with packages for each primitive component

### Package.json Structure (for @radix-ui/react-dialog)

Radix UI uses a focused, per-component approach:

```json
{
  "name": "@radix-ui/react-dialog",
  "version": "1.1.0",
  "description": "Accessible dialog (modal) component for React",
  "license": "MIT",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  },
  "sideEffects": false,
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsup src/index.tsx --format esm,cjs --dts --external react",
    "dev": "tsup src/index.tsx --format esm,cjs --dts --external react --watch",
    "lint": "eslint src/**/*.tsx",
    "test": "jest",
    "clean": "rm -rf dist",
    "release": "npm run build && npm publish"
  },
  "peerDependencies": {
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  },
  "dependencies": {
    "@radix-ui/primitive": "workspace:^",
    "@radix-ui/react-dismissable-layer": "workspace:^",
    "@radix-ui/react-focus-guards": "workspace:^",
    "@radix-ui/react-focus-scope": "workspace:^",
    "@radix-ui/react-id": "workspace:^",
    "@radix-ui/react-portal": "workspace:^",
    "@radix-ui/react-presence": "workspace:^",
    "@radix-ui/react-primitive": "workspace:^",
    "@radix-ui/react-slot": "workspace:^",
    "@radix-ui/react-use-controllable-state": "workspace:^",
    "aria-hidden": "^1.1.1",
    "react-remove-scroll": "^2.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  },
  "homepage": "https://radix-ui.com/primitives",
  "repository": {
    "type": "git",
    "url": "https://github.com/radix-ui/primitives.git",
    "directory": "packages/react/dialog"
  }
}
```

### Key Features

1. **Single-purpose packages**: Each primitive is its own npm package

2. **Minimal exports**: Each package exports only its component
   ```javascript
   import { Root, Trigger, Portal } from '@radix-ui/react-dialog';
   ```

3. **Type-safe conditional exports**: Separate types for ESM and CJS
   ```json
   "import": {
     "types": "./dist/index.d.mts",
     "default": "./dist/index.mjs"
   },
   "require": {
     "types": "./dist/index.d.ts",
     "default": "./dist/index.js"
   }
   ```

4. **Workspace dependencies**: Heavy use of workspace protocol for inter-package dependencies

5. **Fast build with tsup**: Optimized for quick builds and watch mode

6. **External React**: Builds with React as external (provided by consumer)

---

## Subpath Exports Configuration

### Basic Subpath Exports

For libraries that want to support imports like `@library/Button`:

```json
{
  "name": "@my-library/components",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./Button": {
      "import": "./dist/Button/index.js",
      "require": "./dist/Button/index.cjs",
      "types": "./dist/Button/index.d.ts"
    },
    "./Input": {
      "import": "./dist/Input/index.js",
      "require": "./dist/Input/index.cjs",
      "types": "./dist/Input/index.d.ts"
    },
    "./package.json": "./package.json"
  }
}
```

### Advanced Conditional Exports

Support for different environments and module systems:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "default": "./dist/index.js"
    },
    "./Button": {
      "types": "./dist/Button/index.d.ts",
      "node": {
        "import": "./dist/Button/index.mjs",
        "require": "./dist/Button/index.js"
      },
      "default": "./dist/Button/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts",
      "react-server": "./dist/server.react-server.js",
      "default": "./dist/server/index.js"
    }
  }
}
```

### Directory-Based Exports

Pattern for exporting entire directories:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./components/*": {
      "types": "./dist/components/*.d.ts",
      "import": "./dist/components/*.js",
      "require": "./dist/components/*.cjs"
    },
    "./hooks/*": {
      "types": "./dist/hooks/*.d.ts",
      "import": "./dist/hooks/*.js",
      "require": "./dist/hooks/*.cjs"
    },
    "./utils/*": {
      "types": "./dist/utils/*.d.ts",
      "import": "./dist/utils/*.js",
      "require": "./dist/utils/*.cjs"
    }
  }
}
```

### MUI-Style Pattern

For component libraries with many individual components:

```json
{
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js",
      "require": "./index.js"
    },
    "./Button": {
      "types": "./Button/index.d.ts",
      "import": "./Button/index.js"
    },
    "./TextField": {
      "types": "./TextField/index.d.ts",
      "import": "./TextField/index.js"
    },
    "./internal/*": {
      "types": "./internal/*.d.ts"
    },
    "./styles/*": {
      "types": "./styles/*.d.ts",
      "import": "./styles/*.js"
    },
    "./package.json": "./package.json"
  }
}
```

---

## Common Scripts and Configurations

### Build Scripts

#### TypeScript with tsup (Modern, Fast)
```json
{
  "scripts": {
    "build": "tsup src/index.tsx --format esm,cjs --dts --external react",
    "build:watch": "tsup src/index.tsx --format esm,cjs --dts --external react --watch",
    "build:prod": "tsup src/index.tsx --format esm,cjs --dts --external react --minify"
  }
}
```

#### TypeScript with tsc
```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "build:watch": "tsc -p tsconfig.json --watch",
    "build:prod": "tsc -p tsconfig.prod.json"
  }
}
```

#### Rollup Configuration
```json
{
  "scripts": {
    "build": "rollup -c",
    "build:watch": "rollup -c -w",
    "build:prod": "rollup -c --environment PRODUCTION"
  }
}
```

### Development Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:storybook": "storybook dev -p 6006",
    "dev:playground": "vite serve playground",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist node_modules/.cache"
  }
}
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

### Linting Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "lint:all": "npm run lint && npm run format:check && npm run typecheck"
  }
}
```

### Release Scripts

```json
{
  "scripts": {
    "release": "npm run build && changeset publish",
    "release:dry": "npm run build && changeset publish --otp",
    "version": "changeset version",
    "prepublishOnly": "npm run build"
  }
}
```

---

## Best Practices Summary

### 1. Package.json Structure

**Essential Fields:**
- `name`: Scoped package name (e.g., `@my-library/core`)
- `version`: Semantic versioning
- `description`: Clear, concise description
- `main`: CommonJS entry point (legacy support)
- `module`: ESM entry point
- `types`: TypeScript definitions
- `exports`: Modern entry point control (required for subpath exports)
- `sideEffects`: `false` for tree-shaking
- `files`: Explicit list of published files
- `engines`: Minimum Node.js version (recommended: `>=18.0.0`)

### 2. Exports Field Configuration

**Always Include:**
1. Root export (`.`) with conditional exports
2. Explicit `package.json` export
3. TypeScript types for each export
4. Both ESM (`import`) and CJS (`require`) support
5. Fallback (`default`) export

**Pattern:**
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    },
    "./package.json": "./package.json"
  }
}
```

### 3. Subpath Exports

**When to Use:**
- Large component libraries (10+ components)
- Libraries with multiple logical modules
- When tree-shaking is critical
- When you want to prevent deep imports

**Pattern:**
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./Button": "./dist/Button/index.js",
    "./Input": "./dist/Input/index.js",
    "./utils/*": "./dist/utils/*.js"
  }
}
```

### 4. Build Configuration

**Modern Stack (2025):**
- Build tool: `tsup` (fastest) or `unbuild`
- Module formats: ESM + CJS
- TypeScript: 5.3+
- React: 18.0+ or 19.0+
- Node.js: 18.0+

**Build Outputs:**
```
dist/
├── index.mjs          # ESM main
├── index.cjs          # CJS main
├── index.d.ts         # TS definitions
├── index.d.mts        # ESM TS definitions
├── Button/
│   ├── index.mjs
│   ├── index.cjs
│   └── index.d.ts
└── package.json       # Build metadata
```

### 5. Scripts Configuration

**Essential Scripts:**
- `build`: Production build
- `dev`: Development with watch mode
- `test`: Run tests
- `lint`: Lint code
- `typecheck`: TypeScript check without emit
- `clean`: Remove build artifacts

**Recommended Scripts:**
```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write src",
    "clean": "rm -rf dist"
  }
}
```

### 6. Peer Dependencies

**React Libraries Should Specify:**
```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "react-dom": {
      "optional": true
    }
  }
}
```

### 7. TypeScript Configuration

**Recommended tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

### 8. Publishing Configuration

```json
{
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

---

## Additional Resources

### Official Documentation
- Node.js Exports Field: https://nodejs.org/api/packages.html#exports
- React Package.json: https://react.dev/learn/understanding-your-ui-as-a-tree
- TypeScript Module Resolution: https://www.typescriptlang.org/docs/handbook/module-resolution.html

### Build Tools
- tsup: https://tsup.egoist.dev/
- unbuild: https://github.com/unjs/unbuild
- Rollup: https://rollupjs.org/

### Package.json Tools
- package.json validator: https://www.npmjs.com/package/validate-package-json
- exports-field: https://github.com/awmleer/exports-field

### Example Repositories
- MUI Material: https://github.com/mui/material-ui
- Chakra UI: https://github.com/chakra-ui/chakra-ui
- Radix UI: https://github.com/radix-ui/primitives
- React Table: https://github.com/TanStack/table
- React Hook Form: https://github.com/react-hook-form/react-hook-form

---

## Conclusion

Modern React libraries in 2025 should:

1. Use the `exports` field exclusively for entry point control
2. Support both ESM and CJS formats
3. Provide TypeScript definitions for all exports
4. Use subpath exports for large component libraries
5. Implement comprehensive build, dev, test, and lint scripts
6. Specify React 18+ as peer dependency
7. Use fast build tools like tsup
8. Enable tree-shaking with `sideEffects: false`
9. Follow semantic versioning with changesets
10. Document all public exports and subpath patterns

The choice between MUI's component-level exports, Chakra UI's hook-level exports, or Radix UI's single-component packages depends on the library's scope, architecture, and target audience.
