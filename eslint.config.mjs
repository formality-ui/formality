// ESLint flat config for the Formality monorepo.
//
// Derived from observed project conventions:
//   - Double quotes, semicolons, 2-space indent, trailing commas  (prettier defaults)
//   - `import type` / inline `type` qualifier everywhere           (verbatimModuleSyntax)
//   - Import order: react -> third-party -> @formality-ui/core -> relative
//   - console.warn/console.error allowed (used for user-facing warnings);
//     console.log/info/debug blocked
//   - `any` is tolerated at framework boundaries (warned, not errored)
//   - React 18 automatic JSX runtime (jsx: "react-jsx")
//
// Scoped to @formality-ui/core and @formality-ui/react. The svelte/vue packages
// are private WIP stubs and are ignored until they have real implementations.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  // --- Global ignores ---
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/*.tsbuildinfo",
      "packages/svelte/**",
      "packages/vue/**",
    ],
  },

  // --- Base: JS + TypeScript recommended (non-type-checked; tsc handles types) ---
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // --- Shared rule overrides for all TS/TSX ---
  {
    files: ["packages/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Equality: codebase uses === throughout
      eqeqeq: ["error", "always"],

      // console: warn/error are legitimate (user-facing warnings); log/info/debug are not
      "no-console": ["error", { allow: ["warn", "error"] }],

      // Unused vars: TS handles this; allow `_`-prefixed args to opt out
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Type-only imports: align with verbatimModuleSyntax (inline `type` qualifier style)
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // `any` is used deliberately at the react-hook-form boundary; surface it
      // as a warning so it's visible without blocking CI on existing interop.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // --- React package: component + hooks rules ---
  {
    files: ["packages/react/**/*.{ts,tsx}"],
    ...react.configs.flat.recommended,
    ...react.configs.flat["jsx-runtime"], // disables react-in-jsx-scope etc.
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // TS covers these
      "react/prop-types": "off",
      // We don't publish prop spreads that would need display-name enforcement; keep noise low
      "react/display-name": "off",
    },
  },

  // --- Non-production code (tests + examples): relax rules that fight
  //     illustrative/demo code. Tests use console.log for diagnostics and
  //     `any` for mock fixtures; examples destructure APIs to demonstrate them.
  //     Issues are still surfaced as warnings, just non-blocking. ---
  {
    files: [
      "packages/**/__tests__/**/*.{ts,tsx}",
      "packages/**/*.test.{ts,tsx}",
      "examples/**/*.{ts,tsx}",
    ],
    rules: {
      // Tests/examples use console.log for diagnostics (subscription traces, etc.)
      "no-console": "off",
      // Tests/examples legitimately use `any` for mock fixtures / simplicity
      "@typescript-eslint/no-explicit-any": "off",
      // Test/example hygiene (unused imports) surfaced but non-blocking
      "@typescript-eslint/no-unused-vars": "warn",
      "react/display-name": "off",
    },
  },

  // --- Disable formatting rules that conflict with Prettier (MUST be last) ---
  prettier,
);
