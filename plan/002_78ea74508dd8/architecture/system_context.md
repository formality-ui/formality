# System Context — Formality Type-Safety Completion & Coverage Gate

> **Scope of this plan (delta from `plan/001`):** The Formality monorepo is
> **already substantially implemented and passing**. This plan is a focused
> delta with exactly five requirements (R1–R5) drawn from PRD §1.3.7 and
> Appendix C. It does **not** re-implement the framework.
>
> Base PRD: `PRD.md` (5859 lines). Delta spec: `plan/002_78ea74508dd8/delta_prd.md`.

---

## 1. Repository reality (verified)

### 1.1 Monorepo layout

```
packages/
├── core/    # @formality-ui/core  — framework-agnostic pure logic (jsep/jse-eval)
├── react/   # @formality-ui/react — React + react-hook-form adapter (PRIMARY)
├── svelte/  # stubbed (excluded from coverage)
└── vue/     # stubbed (excluded from coverage)
```

- **Package manager:** `pnpm@8.15.0` (root `package.json` `packageManager`).
- **Build:** `tsup` per package; orchestrated by `pnpm -r build`.
- **Tests:** `vitest` 2.x + `@vitest/coverage-v8`; `vitest.workspace.ts`
  registers `packages/core` + `packages/react` projects. Coverage resolved at
  repo **root** (`vitest.config.ts`).
- **Typecheck:** `tsc --build`.
- **Build order matters:** core **before** react (react depends on core's dist).

### 1.2 What is already DONE (do NOT re-implement)

| PRD item | Status | Evidence |
| --- | --- | --- |
| §3.2 / §3.2.1 core-types-framework-agnostic | ✅ Done | `core/src/types/config.ts` uses `unknown` for `component`/`template`/`rules`/`*Template`; `FormFieldsConfig<TName extends string = string>` is already generic. |
| Appendix C T1.1 `ReactInputConfig.component` | ✅ Done | `packages/react/src/overlays.ts:42-49` — `component: ComponentType<any>`, `template?: ComponentType<InputTemplateProps>`. |
| Appendix C T1.2 `ReactFieldConfig.rules` | ✅ Done | `overlays.ts:61-65` — `rules?: RegisterOptions<V>`. |
| Appendix C T1.3 template alignment | ✅ Done | `ReactInputConfig.template` narrowed; core left loose with doc comments. |
| Appendix C T3.2 document `TValue` | ✅ Done | Core `InputConfig<TValue>` carries JSDoc. |
| §1.3.7 coverage `exclude` | ✅ Done | Root `vitest.config.ts` excludes `examples/**`, `packages/svelte/**`, `packages/vue/**`, `**/dist/**` (spread over `coverageConfigDefaults.exclude`). |

### 1.3 What REMAINS (this plan's scope)

| Req | PRD ref | Status before this plan |
| --- | --- | --- |
| **R1** — add 90% coverage `thresholds`; backfill tests so `pnpm test:coverage` is green | §1.3.7 / Appendix B | `thresholds` block **MISSING**; current metrics **fail** (stmt 87.0%, branch 88.3%, func 92.5%). |
| **R2** — finish Appendix C T2.1 strict key-checking | §C.4 T2.1 | ⚠️ PARTIAL — core generic done; `FormProps.config` key-set still `string`; `FieldProps` non-generic. |
| **R3** — Appendix C T2.2 `defineInputs` opt-in helper | §C.4 T2.2 | ❌ NOT STARTED — `defineInputs` does not exist anywhere in `packages/`. |
| **R4** — Appendix C T3.1 export `FormalityFieldComponentProps` | §C.4 T3.1 | ❌ NOT STARTED — symbol does not exist anywhere in `packages/`. |
| **R5** — sync changeset-level docs | §5 (Mode B) | Pending — depends on R2–R4. |

---

## 2. Critical architectural constraints (PRD §C.2 / §C.3)

1. **`@formality-ui/core` MUST stay framework-agnostic.** Its `package.json`
   depends only on `jsep`, `jse-eval`, `lodash-es`. **Do NOT add `react` or
   `react-hook-form` to core.** React-specific precision lives in
   `@formality-ui/react` as **overlay types** (precedent: `overlays.ts`).
2. **No breaking public API changes.** Use **generic defaults** and **overlay
   types**, not narrowing that rejects previously-valid values.
3. **Runtime behavior unchanged** for R2–R4 (type-only). The ONLY code-touching
   exceptions per Appendix C.3 are: T2.2's identity function `defineInputs`,
   and T3.1's internal reuse of its type.
4. **Defaults preserve today's behavior.** e.g.
   `FormFieldsConfig<TName extends string = string>` — when `TName = string` it
   is identical to today's `Record<string, FieldConfig>`.
5. **After every item:** rebuild affected package(s) (core before react), run
   the full test suite, run `tsc --noEmit`. Do not move on if anything is red.
6. **Coverage gate must be cleared by adding tests**, never by weakening the
   threshold or broadening excludes (PRD §1.3.7).

---

## 3. Exact touch points (file:line) — see companion docs

- **Type system inventory** → `architecture/type_system_state.md`
- **Coverage gap analysis + backfill targets** → `architecture/coverage_gaps.md`
- **Injected-props runtime types for `FormalityFieldComponentProps`** → `architecture/injected_props_types.md`

## 4. Suggested decomposition shape (from delta_prd.md §4)

```
Phase 1 — Type-Safety Completion & Coverage Gate
├─ Milestone A — Type-safety completion
│   ├─ Task 1 — Finish T2.1 (R2): strict FormProps.config keys + generic FieldProps
│   ├─ Task 2 — Add defineInputs (R3 / T2.2)
│   └─ Task 3 — Export FormalityFieldComponentProps (R4 / T3.1)
├─ Milestone B — Coverage gate (R1)
│   └─ Task 4 — Add 90% thresholds + backfill tests
└─ Task 5 (final) — Sync changeset-level documentation (R5), deps on all above
```

**Acceptance (delta_prd.md):** `pnpm build` green (core then react); `pnpm test`
green; `pnpm test:coverage` green at ≥90% all four metrics; `tsc --noEmit`
green on core + react; new exports (`defineInputs`,
`FormalityFieldComponentProps`, generic `FieldProps`) present in
`packages/react/src/index.ts`; an unknown `<Form<T>>` config key and a typo'd
`type` (when wrapped in `defineInputs`) fail to compile.

## 5. Build/test commands (verified working)

```bash
pnpm --filter @formality-ui/core build   # build core FIRST
pnpm --filter @formality-ui/react build  # then react (depends on core dist)
pnpm test                                # vitest run across workspace
pnpm test:coverage                       # vitest run --coverage (enforces thresholds after R1)
pnpm typecheck                           # tsc --build
```
