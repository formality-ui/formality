# Framework-Agnostic Package Design Research

## Executive Summary

This research document explores best practices for creating framework-agnostic packages that can be consumed by multiple framework-specific implementations. The focus is on separating core logic from framework-specific code, enabling a single core package to power React, Vue, Svelte, and other framework integrations.

---

## 1. What Makes a Package Framework-Agnostic?

### 1.1 Zero Framework Dependencies

A framework-agnostic package has **NO dependencies** on any specific frontend framework:

- ❌ No `react`, `react-dom`, `react-hook-form` dependencies
- ❌ No `vue`, `@vue/*` dependencies
- ❌ No `svelte`, `svelte/*` dependencies
- ❌ No JSX/TSX in the core package
- ❌ No framework-specific types (e.g., `React.ReactNode`, `Ref<*>`)

**Example from @formality-ui/core package.json:**
```json
{
  "name": "@formality-ui/core",
  "dependencies": {
    "jsep": "^1.4.0",
    "jse-eval": "^1.5.2"
  }
}
```

Notice: Only utility libraries, no framework dependencies.

### 1.2 Pure Functions and Immutable Data

Framework-agnostic packages should:
- Export **pure functions** that take inputs and return outputs
- Avoid side effects and external state mutations
- Use plain JavaScript/TypeScript objects and arrays
- Provide clear input/output contracts via TypeScript types

**Example pattern:**
```typescript
// Pure function - no framework coupling
export function evaluateConditions(input: EvaluateConditionsInput): ConditionResult {
  const { conditions, fieldValues } = input;
  // Pure logic implementation
  return { disabled: boolean, hidden: boolean, required: boolean };
}
```

### 1.3 Language-Level APIs Only

Use standard JavaScript/TypeScript features:
- Standard `Map`, `Set`, `Array`, `Object` methods
- Native `Promise` for async operations
- Template literals for string interpolation
- Destructuring and spread operators
- Avoid framework-specific APIs (hooks, directives, lifecycle methods)

### 1.4 Framework-Independent Testing

Core packages should be testable without any framework:
- Use Vitest, Jest, or Node.js test runners
- No Testing Library, no Vue Test Utils
- Test pure functions with simple inputs/outputs
- Mock external dependencies, not framework internals

**Example test pattern:**
```typescript
describe("evaluateConditions", () => {
  it("should evaluate conditions purely based on input", () => {
    const result = evaluateConditions({
      conditions: [{ when: "field", truthy: true, disabled: true }],
      fieldValues: { field: true }
    });
    expect(result.disabled).toBe(true);
  });
});
```

---

## 2. Best Practices for Core Packages

### 2.1 Monorepo Structure

**Recommended structure using pnpm workspaces:**

```
formality/
├── packages/
│   ├── core/              # Framework-agnostic core
│   │   ├── src/
│   │   ├── package.json   # No framework deps
│   │   └── tsconfig.json
│   ├── react/             # React bindings
│   │   ├── src/
│   │   ├── package.json   # peerDependencies: react, react-dom
│   │   └── tsconfig.json
│   ├── vue/               # Vue bindings
│   │   ├── src/
│   │   ├── package.json   # peerDependencies: vue
│   │   └── tsconfig.json
│   └── svelte/            # Svelte bindings
│       ├── src/
│       ├── package.json   # peerDependencies: svelte
│       └── tsconfig.json
├── package.json           # Root package.json
├── pnpm-workspace.yaml    # Workspace configuration
└── tsconfig.json          # Root TypeScript config
```

**pnpm-workspace.yaml:**
```yaml
packages:
  - "packages/*"
```

**Framework package dependency pattern:**
```json
{
  "name": "@formality-ui/react",
  "dependencies": {
    "@formality-ui/core": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### 2.2 TypeScript Configuration

**Core package tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

Key points:
- No JSX (`jsx: undefined` or omit)
- Standard library only (`lib: ["ES2020"]`)
- No DOM types unless needed for utility functions

### 2.3 Build Configuration

**Using tsup for fast builds:**

**Core package tsup.config.ts:**
```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: "es2020",
});
```

**Root package.json scripts:**
```json
{
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "pnpm -r exec rm -rf dist"
  }
}
```

### 2.4 Export Strategy

**Core package exports:**
```typescript
// @formality-ui/core - Framework-agnostic form utilities
// This package has ZERO framework dependencies

export type { FieldConfig, FormConfig, FieldState, FormState } from "./types";
export { evaluate, evaluateDescriptor } from "./expression";
export { evaluateConditions, conditionMatches } from "./conditions";
export { runValidator, required, minLength } from "./validation";
export { parse, format } from "./transform";
export { deepMerge, resolveInputConfig } from "./config";
```

**Framework package exports:**
```typescript
// @formality-ui/react
export { useField, useForm, useFormality } from "./hooks";
export { Field, Form, FormalityProvider } from "./components";
export type { FieldProps, FormProps } from "./types";

// Re-export core types for convenience
export type { FieldConfig, FormConfig } from "@formality-ui/core";
```

### 2.5 Documentation Standards

**README.md structure:**
```markdown
# @formality-ui/core

Framework-agnostic form utilities for JavaScript/TypeScript.

## Features

- Zero framework dependencies
- Pure functions for form logic
- TypeScript with full type safety
- Tree-shakeable ESM exports

## Installation

\`\`\`bash
npm install @formality-ui/core
\`\`\`

## Usage

\`\`\`typescript
import { evaluate, evaluateConditions, runValidator } from '@formality-ui/core';

// Pure function usage
const result = evaluate('field > 10', { values: { field: 15 } });
\`\`\`

## Framework Integrations

- [@formality-ui/react](./react) - React bindings
- [@formality-ui/vue](./vue) - Vue bindings
- [@formality-ui/svelte](./svelte) - Svelte bindings
```

---

## 3. Common Patterns for Separation

### 3.1 Adapter Pattern

**Core provides interfaces, frameworks implement adapters:**

```typescript
// Core: Interface definition
export interface FieldAdapter<TValue = any> {
  getValue(): TValue;
  setValue(value: TValue): void;
  subscribe(callback: (value: TValue) => void): () => void;
}
```

```typescript
// React: React-specific adapter
export function useFieldAdapter<TValue>(
  control: Control,
  name: string
): FieldAdapter<TValue> {
  const field = useWatch({ control, name });

  return {
    getValue: () => field,
    setValue: (value) => control.register(name).onChange(value),
    subscribe: (callback) => {
      const sub = control.register(name);
      return () => sub.unsubscribe();
    },
  };
}
```

```typescript
// Vue: Vue-specific adapter
export function useFieldAdapter<TValue>(
  fieldName: Ref<string>
): FieldAdapter<TValue> {
  const form = useFormContext();

  return {
    getValue: () => form.values[fieldName.value],
    setValue: (value) => form.setFieldValue(fieldName.value, value),
    subscribe: (callback) => {
      return watch(() => form.values[fieldName.value], callback);
    },
  };
}
```

### 3.2 Hook/Composable Pattern

**Core: Logic functions**
```typescript
export function validateField<TValue>(
  value: TValue,
  validators: Validator<TValue>[]
): ValidationResult {
  // Pure validation logic
}
```

**React: Hook implementation**
```typescript
export function useFieldValidation<TValue>(
  value: TValue,
  validators: Validator<TValue>[]
) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const result = validateField(value, validators);
    setError(result.error);
  }, [value, validators]);

  return error;
}
```

**Vue: Composable implementation**
```typescript
export function useFieldValidation<TValue>(
  value: Ref<TValue>,
  validators: Validator<TValue>[]
) {
  const error = ref<string | null>(null);

  watch(value, (newValue) => {
    const result = validateField(newValue, validators);
    error.value = result.error;
  });

  return { error };
}
```

### 3.3 Configuration Injection Pattern

**Core: Configuration-driven behavior**
```typescript
export interface FormConfig {
  fields: Record<string, FieldConfig>;
  validation?: ValidationConfig;
  submission?: SubmissionConfig;
}

export function createFormState(config: FormConfig): FormState {
  // Pure state creation from config
}
```

**React: Provider + Hook pattern**
```typescript
export const FormalityProvider = ({ config, children }) => {
  const state = useMemo(() => createFormState(config), [config]);
  return <Provider value={state}>{children}</Provider>;
};

export const useFormality = () => useContext(Context);
```

**Vue: provide/inject pattern**
```typescript
export const FormalityProvider = {
  setup(props, { slots }) {
    const state = createFormState(props.config);
    provide('formality', state);
    return () => slots.default?.();
  }
};

export function useFormality() {
  return inject('formality');
}
```

### 3.4 Event System Pattern

**Core: Event emitter interface**
```typescript
export interface EventEmitter<TEvents extends Record<string, any>> {
  on<E extends keyof TEvents>(
    event: E,
    handler: (payload: TEvents[E]) => void
  ): () => void;
  emit<E extends keyof TEvents>(event: E, payload: TEvents[E]): void;
}
```

**React: useEffect integration**
```typescript
export function useEventEmitter<TEvents>(
  emitter: EventEmitter<TEvents>,
  event: keyof TEvents,
  handler: (payload: any) => void
) {
  useEffect(() => {
    const unsubscribe = emitter.on(event, handler);
    return unsubscribe;
  }, [emitter, event, handler]);
}
```

**Vue: watch integration**
```typescript
export function useEventEmitter<TEvents>(
  emitter: EventEmitter<TEvents>,
  event: keyof TEvents
) {
  const payload = ref(null);

  onMounted(() => {
    const unsubscribe = emitter.on(event, (p) => {
      payload.value = p;
    });
    onUnmounted(unsubscribe);
  });

  return payload;
}
```

### 3.5 Renderer/Component Pattern

**Core: Schema-based rendering**
```typescript
export interface FieldSchema {
  type: 'text' | 'number' | 'select' | 'checkbox';
  label: string;
  props: Record<string, any>;
}

export function renderField(schema: FieldSchema, value: any) {
  // Return data describing what to render
  return {
    tagName: getTagName(schema.type),
    attributes: buildAttributes(schema),
    value: value
  };
}
```

**React: Component implementation**
```typescript
export const Field = ({ schema, value, onChange }) => {
  const render = renderField(schema, value);

  return createElement(render.tagName, {
    ...render.attributes,
    value: render.value,
    onChange: (e) => onChange(e.target.value)
  });
};
```

**Vue: Component implementation**
```typescript
export const Field = defineComponent({
  props: ['schema', 'modelValue'],
  setup(props, { emit }) {
    const render = computed(() =>
      renderField(props.schema, props.modelValue)
    );

    return () => h(render.value.tagName, {
      ...render.value.attributes,
      modelValue: render.value.value,
      'onUpdate:modelValue': (v) => emit('update:modelValue', v)
    });
  }
});
```

---

## 4. Successful Monorepo Examples

### 4.1 TanStack Query (formerly React Query)

**GitHub:** https://github.com/TanStack/query

**Architecture:**
- Core package: `@tanstack/query-core` - Framework-agnostic state management
- Framework packages:
  - `@tanstack/react-query` - React integration
  - `@tanstack/vue-query` - Vue integration
  - `@tanstack/svelte-query` - Svelte integration
  - `@tanstack/solid-query` - Solid integration

**Key design decisions:**
- Core uses vanilla TypeScript with Observable pattern
- Framework adapters use framework-specific reactivity (hooks, composables)
- Shared types across all packages
- Monorepo managed with Turborepo

**Documentation:** https://tanstack.com/query/latest

**Why it works:**
- Core focuses on data fetching logic, caching, and state management
- Frameworks only need to provide reactivity integration
- Clear separation: core = "what", frameworks = "how to react"

### 4.2 React Hook Form

**GitHub:** https://github.com/react-hook-form/react-hook-form

**Architecture:**
- Core: Form validation and state management (React-agnostic logic)
- React integration: Hooks for React ecosystem

**Key patterns:**
- Validation logic is framework-independent
- State management uses pub/sub pattern
- Hooks are thin wrappers around core logic
- Minimal re-renders through careful subscription management

**Documentation:** https://react-hook-form.com

**Note:** While primarily React-focused, the validation logic could be extracted to a core package for other frameworks.

### 4.3 FormKit

**GitHub:** https://github.com/formkit/formkit

**Architecture:**
- `@formkit/core` - Framework-agnostic form logic
- `@formkit/vue` - Vue integration
- `@formkit/react` - React integration (in development)
- `@formkit/auto-animate` - Animation utilities

**Key design decisions:**
- Core uses a plugin architecture
- Form validation and state management are framework-independent
- Framework adapters handle UI rendering and reactivity
- Input generation from schema

**Documentation:** https://formkit.com

### 4.4 Zod

**GitHub:** https://github.com/colinhacks/zod

**Architecture:**
- Single package, framework-agnostic validation
- No framework-specific code
- Pure TypeScript schema validation

**Usage across frameworks:**
- React: Used with react-hook-form, formik
- Vue: Used with vee-validate, vuelidate
- Svelte: Used with sveltekit-forms
- Server-side: Node.js, Deno, Bun

**Documentation:** https://zod.dev

**Why it works:**
- Pure validation logic, no UI concerns
- TypeScript-first design
- Runtime validation with type inference
- Zero dependencies

### 4.5 Valibot

**GitHub:** https://github.com/fabian-hiller/valibot

**Architecture:**
- Framework-agnostic validation library
- Modular design with tree-shaking
- Smaller bundle size than Zod
- No runtime dependencies

**Framework integrations:**
- Works with any form library
- Used in React, Vue, Svelte projects
- Server-side validation

**Documentation:** https://valibot.dev

### 4.6 Vite

**GitHub:** https://github.com/vitejs/vite

**Architecture:**
- `create-vite` - Scaffolding tool
- `@vitejs/plugin-react` - React plugin
- `@vitejs/plugin-vue` - Vue plugin
- `@vitejs/plugin-svelte` - Svelte plugin
- Core is framework-agnostic build tool

**Key pattern:**
- Plugin architecture for framework-specific transforms
- Core provides build pipeline, dev server, HMR
- Framework plugins handle JSX, SFC compilation, etc.

**Documentation:** https://vitejs.dev

### 4.7 Vitest

**GitHub:** https://github.com/vitest-dev/vitest

**Architecture:**
- Core testing framework (framework-agnostic)
- UI framework-specific coverage tools
- Compatible with Vite ecosystem

**Key pattern:**
- Test runner is framework-independent
- Snapshot testing works with any framework
- UI for test results (React-based, but optional)

**Documentation:** https://vitest.dev

---

## 5. Implementation Guidelines for Formality

### 5.1 Current State Analysis

**Current @formality-ui/core structure:**
```
src/
├── conditions/        # Conditional logic evaluation
├── config/            # Configuration merging and resolution
├── expression/        # Expression engine for field references
├── labels/            # Label generation and humanization
├── transform/         # Parse/format pipeline
├── types/             # TypeScript definitions
├── validation/        # Validation logic
└── index.ts           # Main exports
```

**Framework independence verification:**
- ✅ Zero framework dependencies in package.json
- ✅ Pure function exports
- ✅ Framework-independent testing
- ✅ Clear documentation in comments

### 5.2 Recommended Enhancements

1. **Add framework independence tests:**
   - Already implemented in `framework-independence.test.ts`
   - Ensures no framework imports leak into core
   - Validates package.json dependencies

2. **Expand core functionality:**
   - Add more validation utilities
   - Implement async validation support
   - Add field dependency tracking
   - Implement form state machine

3. **Framework package improvements:**
   - Use React Hook Form for React integration
   - Use VeeValidate for Vue integration
   - Use native Svelte stores for Svelte integration
   - Ensure each package follows framework idioms

4. **Documentation:**
   - Add migration guides for each framework
   - Provide examples for common use cases
   - Document TypeScript types thoroughly
   - Create "Why Formality?" guide

5. **Tooling:**
   - Add changesets for version management
   - Implement automated testing across all packages
   - Add E2E tests for framework integrations
   - Set up CI/CD for multi-framework testing

### 5.3 Package Publishing Strategy

**Version management with Changesets:**
```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**Publishing workflow:**
1. Add changeset for each change
2. `pnpm changeset version` - Bump versions
3. `pnpm build` - Build all packages
4. `pnpm changeset publish` - Publish to npm

**Semantic versioning:**
- Core package changes trigger framework package bumps
- Framework-specific changes only affect that package
- Use `workspace:*` for development, `^x.y.z` for published

---

## 6. Key Resources and URLs

### 6.1 Documentation

**TanStack Query:**
- Main Site: https://tanstack.com/query/latest
- GitHub: https://github.com/TanStack/query
- Blog posts on architecture: https://tanstack.com/blog

**React Hook Form:**
- Main Site: https://react-hook-form.com
- GitHub: https://github.com/react-hook-form/react-hook-form
- Performance guide: https://react-hook-form.com/performance

**FormKit:**
- Main Site: https://formkit.com
- GitHub: https://github.com/formkit/formkit
- Documentation: https://formkit.com/guide

**Zod:**
- Main Site: https://zod.dev
- GitHub: https://github.com/colinhacks/zod
- Examples: https://zod.dev/?id=practical-examples

**Valibot:**
- Main Site: https://valibot.dev
- GitHub: https://github.com/fabian-hiller/valibot
- Comparison with Zod: https://valibot.dev/guide/why-valibot

### 6.2 Monorepo Tools

**Turborepo:**
- Site: https://turbo.build/repo
- GitHub: https://github.com/vercel/turbo
- Docs: https://turbo.build/repo/docs

**Nx:**
- Site: https://nx.dev
- Monorepo guide: https://nx.dev/monorepo
- Framework guides: https://nx.dev/features/framework-integration

**pnpm Workspaces:**
- Docs: https://pnpm.io/workspaces
- Workspace protocol: https://pnpm.io/workspaces#workspace-protocol

**Changesets:**
- GitHub: https://github.com/changesets/changesets
- Docs: https://github.com/changesets/changesets/tree/main/docs

### 6.3 TypeScript Resources

**TypeScript Handbook:**
- https://www.typescriptlang.org/docs/handbook/intro.html

**TypeScript for Library Authors:**
- https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

**Module formats:**
- https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-formats

### 6.4 Testing Resources

**Vitest:**
- Site: https://vitest.dev
- GitHub: https://github.com/vitest-dev/vitest
- Testing guide: https://vitest.dev/guide/

**Testing Library:**
- React: https://testing-library.com/react
- Vue: https://testing-library.com/vue
- Svelte: https://testing-library.com/svelte

---

## 7. Checklist for Framework-Agnostic Design

### Core Package Checklist

- [ ] **Zero framework dependencies** in package.json
- [ ] **Pure functions** - no side effects, no external state
- [ ] **TypeScript types** are framework-agnostic
- [ ] **No JSX/TSX** files in core package
- [ ] **Plain objects** for state representation
- [ ] **Framework-independent testing** (Vitest/Jest, no framework test utils)
- [ ] **Clear documentation** indicating framework independence
- [ ] **ESM + CJS** exports for maximum compatibility
- [ ] **Tree-shakeable** exports (named exports, no barrel-file side effects)
- [ ] **Semantic versioning** with clear changelog

### Framework Package Checklist

- [ ] **peerDependencies** on framework packages
- [ ] **workspace protocol** for core dependency in development
- [ ] **Framework idioms** (hooks for React, composables for Vue)
- [ ] **Re-export core types** for convenience
- [ ] **Framework-specific testing** (Testing Library, etc.)
- [ ] **Clear examples** in README
- [ ] **Migration guides** from other form libraries
- [ ] **Performance optimizations** specific to framework

### Monorepo Checklist

- [ ] **Workspace configuration** (pnpm-workspace.yaml)
- [ ] **Root scripts** for building, testing, linting
- [ ] **Shared TypeScript config** with project references
- [ ] **Changesets** for version management
- [ ] **Consistent build tool** (tsup, rollup, etc.)
- [ ] **CI/CD** for multi-framework testing
- [ ] **Documentation site** with framework tabs
- [ ] **Example apps** for each framework

---

## 8. Conclusion

Creating framework-agnostic core packages requires:

1. **Discipline** - Avoid framework dependencies at all costs
2. **Pure functions** - Keep logic simple and testable
3. **Clear interfaces** - Define contracts between core and frameworks
4. **Adapter pattern** - Let frameworks adapt to core, not vice versa
5. **Monorepo tooling** - Use workspaces, changesets, and proper build tools
6. **Documentation** - Explain the architecture and provide examples

Successful libraries like TanStack Query, FormKit, Zod, and Valibot demonstrate that this approach works well for validation, state management, and form logic.

For @formality-ui, the current core package is already well-designed for framework independence. The next steps are to enhance the framework integrations and ensure each follows its framework's idioms while leveraging the shared core.

---

## Appendix: Code Examples

### Example 1: Pure Validation Core

```typescript
// @formality-ui/core/validation/required.ts
export interface RequiredValidator {
  type: 'required';
  message?: string;
}

export function required(message?: string): RequiredValidator {
  return { type: 'required', message };
}

export function validateRequired(
  validator: RequiredValidator,
  value: unknown
): ValidationResult {
  if (isEmptyValue(value)) {
    return {
      valid: false,
      error: validator.message || 'This field is required'
    };
  }
  return { valid: true };
}
```

### Example 2: React Hook Integration

```typescript
// @formality-ui/react/hooks/useValidation.ts
import { useCallback } from 'react';
import { validateRequired } from '@formality-ui/core';

export function useValidation(validator: RequiredValidator) {
  const validate = useCallback(
    (value: unknown) => validateRequired(validator, value),
    [validator]
  );

  return { validate };
}
```

### Example 3: Vue Composable Integration

```typescript
// @formality-ui/vue/composables/useValidation.ts
import { ref, watch } from 'vue';
import { validateRequired } from '@formality-ui/core';

export function useValidation(validator: RequiredValidator, value: Ref) {
  const error = ref<string | null>(null);

  watch(value, (newValue) => {
    const result = validateRequired(validator, newValue);
    error.value = result.valid ? null : result.error;
  });

  return { error };
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-12
**Author:** Claude (Research for @formality-ui)
**Status:** Complete
