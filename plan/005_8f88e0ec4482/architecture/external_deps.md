# External Dependencies & Tooling

## Runtime Dependencies

### @formality-ui/core
| Dependency | Version | Purpose |
|-----------|---------|---------|
| `jsep` | ^1.4.0 | JavaScript expression parser (tokenizes/ASTs string expressions for the expression engine) |
| `jse-eval` | ^1.5.2 | Evaluates jsep AST against a context object (the dual-context-map approach from PRD §4.1.4) |

**CRITICAL:** Core has NO React/Vue/Svelte/RHF dependencies. This is verified by
14 framework-independence tests and enforced by the PRD §1.3.2/§1.3.6 import rules.

### @formality-ui/react
| Dependency | Type | Version | Purpose |
|-----------|------|---------|---------|
| `@formality-ui/core` | workspace | * | Framework-agnostic logic |
| `jsep` | direct | ^1.4.0 | Expression parsing (also used directly by react for inference) |
| `jse-eval` | direct | ^1.5.2 | Expression evaluation |
| `lodash-es` | direct | ^4.17.21 | debounce utility for auto-save |
| `react` | peer | >=17 | UI framework |
| `react-dom` | peer | >=17 | DOM rendering |
| `react-hook-form` | peer | ^7.0.0 | Form state management (Controller, useWatch, useForm, etc.) |

### Dev Dependencies (notable)
| Dependency | Version | Purpose |
|-----------|---------|---------|
| `vitest` | ^2.0.0 | Test runner + workspace support |
| `@vitest/coverage-v8` | ^2.0.0 | Coverage provider (v8) |
| `@testing-library/react` | ^14.0.0 | Component testing |
| `@testing-library/user-event` | ^14.5.2 | User interaction simulation |
| `@testing-library/jest-dom` | ^6.0.0 | DOM assertions |
| `jsdom` | ^24.0.0 | DOM environment |
| `tsup` | ^8.0.0 | Build tool (esbuild-based bundler) |
| `typescript` | ^5.5.0 | Type system |
| `eslint` | ^9.0.0 | Linting |
| `prettier` | ^3.0.0 | Code formatting |
| `semantic-release` | ^25.0.5 | Automated versioning/publishing |

## Build System

### Monorepo Structure
- **Workspace:** pnpm workspaces (`packages/*` + `examples`)
- **Build order:** core first (react depends on core via `workspace:*`)
- **Output:** Each package builds to `dist/` via tsup (ESM + CJS + d.ts)
- **tsconfig:** Project references at root (`tsconfig.json`)

### Coverage Configuration
- **Provider:** v8 (in `vitest.config.ts` at repo root)
- **Gate:** 90% threshold on statements, branches, functions, lines
- **Exclusions:** `examples/**`, `packages/svelte/**`, `packages/vue/**`,
  `**/dist/**`, `scripts/**` (spread of `coverageConfigDefaults.exclude`)
- **Workspace:** `vitest.workspace.ts` references `packages/core/vitest.config.ts`
  and `packages/react/vitest.config.ts`

### CI Pipeline (`.github/workflows/ci.yml`)
```
lint → format:check → typecheck → typecheck:examples → test:coverage → build(core+react)
```
All steps must pass for merge.

## Key Integration Points

### jsep / jse-eval (Expression Engine)
- `jsep` parses expression strings into AST (handles `&&`, `||`, `===`, ternary, property access)
- `jse-eval` evaluates the AST against a context object
- The expression engine wraps these with:
  - Dual context mapping (PRD §4.1.4 Option B)
  - Field-state proxies (PRD §4.1.5) via `createFieldStateProxy`
  - Caching (`clearExpressionCache`)
  - Field inference from expression text (`inferFieldsFromExpression`)

### react-hook-form (RHF)
- `useForm({ mode, defaultValues, values })` — form initialization
- `Controller` — field registration + controlled rendering
- `useWatch({ name, control })` — field subscription (triggers re-render on change)
- `useFormState({ control })` — form-level state (isDirty, isValid, etc.)
- `methods.setValue(name, value, { shouldValidate, shouldDirty })` — programmatic value setting
- `methods.trigger(names)` — on-demand validation (used by auto-save gates, mode-agnostic)
- `methods.handleSubmit(callback)` — submit flow with built-in validation

### lodash-es (Debounce)
- `debounce(fn, ms)` — auto-save debounce
- Provides `.cancel()`, `.flush()`, `.pending()` methods (wrapped in `DebouncedFunction` interface)
- Per-field debounce keyed by ms interval (coalescing: same ms = shared timer)
