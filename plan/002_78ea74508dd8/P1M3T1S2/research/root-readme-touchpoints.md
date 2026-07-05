# P1.M3.T1.S2 — Root README Touchpoints Field Guide

> Mode B (changeset-level documentation). The ONLY deliverable is an edited
> `README.md` at the repo root. This note is the distilled source-of-truth for
> that edit. Read it before writing any prose.

## 1. What this task IS and IS NOT

- **IS**: A *minimal, accurate* edit to the **root** `README.md` that syncs the
  two areas touched by the P1.M1 (type-safety exports) + P1.M2.T1.S5 (coverage
  gate) changeset: (a) the type-safety feature surface, (b) testing/coverage.
- **IS NOT**: A rewrite. Unrelated sections stay byte-for-byte identical. This
  is NOT the place to duplicate `packages/react/README.md` (sibling S1 owns the
  detailed type-safety snippets) — the root README **links** to it.
- **IS NOT**: editing any source/test/config/`package.json`/other-README file.

## 2. Root README.md — section map (verified line numbers, 2026-07-05)

```
1     # Formality
9       ### What you're probably writing
50      ### The same form with Formality
94    ## Built on React Hook Form
120   ## Separation of Concerns
143   ## The Form Logic Layer
162   ## Forms as Data                      ← "TypeScript type safety" in prose (L185)
191   ## Packages
202   ## Quick Start (React)
264   ## Conditions: The Behavior System
328   ## Derived Values (`set` and `selectSet`)
384   ## Field Dependencies
410     ### String Expressions vs Callback Functions
447       table row: "| TypeScript type safety | Function |"   ← type-safety touchpoint
451   ## Validation
482   ## Auto-Save
500   ## Field Groups
527   ## Value Transformation
551   ## Architecture
578     ### Expression Engine
595   ## When to Use Formality
616   ## Documentation                        ← links ./PRD.md (Dev Docs) + ./DEVELOPMENT.md (STALE)
626   ## Development
628     ### Prerequisites
633     ### Setup
644     ### Project Structure
656     ### Scripts                          ← table lists pnpm test/typecheck (touchpoint b)
667   ## Examples
685   ## Contributing
689     ### Testing                          ← THE testing touchpoint (part b)
700   ## Support
706   ## License
```

Total: 707 lines, ~23KB. The file is an **overview/landing** README — it does
NOT have a granular "Features" list or a dedicated "Type Safety" section today.
Type safety is only referenced obliquely (L185 prose, L447 table row).

## 3. Part (a) — type-safety feature surface: what to add

There is **no existing type-safety capability list** to extend. The accurate,
minimal move is to **add one concise new `## Type Safety` section** that:

- Names the four new consumer-facing capabilities (accurate to real exports):
  1. **Generic `<Form<TFieldValues>>` config key-checking** —
     `<Form<ClientValues> config={{...}}>` rejects unknown config keys (typos
     like `ofice`). Backwards compatible: default `<Form>` still accepts any
     string key.
  2. **Generic `<Field name>` name-checking (opt-in)** — `FieldProps<TName>`
     narrows `name`; checking engages only when narrowed (NOT automatic from
     `<Form<T>>`).
  3. **`defineInputs` / `InputType` (opt-in)** — derive a union of input-type
     keys for `keyof` checking on `Field` `type`.
  4. **`FormalityFieldComponentProps<P>`** — the shipped injected-props type
     replacing the consumer's hand-rolled lossy `WithFormality<P>`.
- **Links to `packages/react/README.md`** (the S1 deliverable, which has the
  `## Type Safety` section with full copy-paste snippets) for details —
  explicitly DOES NOT duplicate those snippets.
- **Recommended placement**: after `## Value Transformation` (ends ~L549) and
  before `## Architecture` (L551). Rationale: keeps feature-tour content grouped
  before the architecture deep-dive. (Alternative: after `## Field Dependencies`
  ~L449 / before `## Validation` L451 — also acceptable since that's where
  type-safety is already referenced. Pick ONE; do not add two sections.)

### Verified export facts (from `packages/react/src/index.ts`)

```
defineInputs                         → VALUE export (import { defineInputs })
ReactInputConfig                     → TYPE
ReactFieldConfig                     → TYPE
ReactFormFieldsConfig                → TYPE   (generic <V extends FieldValues>)
FormalityFieldComponentProps         → TYPE   (generic <P = unknown>)
RefCallBack, UseFormStateReturn, FieldValues → TYPE (re-exported from RHF)
FormProps                            → TYPE   (generic <TFieldValues>)  [from components/Form]
FieldProps                           → TYPE   (generic <TName extends string = string>)  [from components/Field]
```

All four named capabilities map to REAL exports. ✅ (Cross-checked against the
S1 PRP's symbol-existence contract.)

## 4. Part (b) — testing/coverage: what to change

Two touchpoints, both inside `## Development` / `## Contributing`:

### 4.1 `### Scripts` table (L656–665) — add one row
Current table:
```
| Script           | Description             |
| ---------------- | ----------------------- |
| `pnpm build`     | Build all packages      |
| `pnpm test`      | Run all tests           |
| `pnpm typecheck` | Type check all packages |
| `pnpm lint`      | Lint all packages       |
```
**Add** a row for `pnpm test:coverage` (the script exists in `package.json`:
`"test:coverage": "vitest run --coverage"`).

### 4.2 `### Testing` subsection (L689–699) — update + add gate note
Current block:
```bash
pnpm test
pnpm test --filter=@formality-ui/core
pnpm test --filter=@formality-ui/react
pnpm test -- --coverage
```
**Update** to use the canonical `pnpm test:coverage` and **add a concise note**:
- The bar: ≥ **90%** on statements, branches, functions, **and** lines (all four).
- The gate **fails the build** below 90% (exit 1).
- **Exclusions** (not measured): `examples/**`, `packages/svelte/**`,
  `packages/vue/**`, `**/dist/**` (+ vitest defaults).
- Everything else — `packages/core/**`, `packages/react/**`, and any future real
  adapter — is in scope and must clear 90%.
- **Link** to PRD §1.3.7 (Testing Strategy) via `./PRD.md` (the file the
  Documentation table already links as "Developer Docs").
- Provider: v8.

### Verified coverage facts (from `vitest.config.ts`)
```ts
provider: "v8"
exclude: [...coverageConfigDefaults.exclude, "examples/**", "packages/svelte/**",
          "packages/vue/**", "**/dist/**"]
thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 }
```
`pnpm test:coverage` script = `vitest run --coverage`. ✅ Matches PRD §1.3.7 / §B
(h3.95) exactly.

## 5. Sibling boundary — DO NOT overlap with S1

- `packages/react/README.md` is **owned by P1.M3.T1.S1** (running in parallel).
  S1 adds `## Type Safety` + `## Testing & Coverage` sections with full snippets.
- This task (S2) **references** `packages/react/README.md` from the root; it does
  NOT duplicate S1's snippets and does NOT edit that file.
- Treat S1's PRP as a contract: by the time S2 runs, `packages/react/README.md`
  WILL contain a `## Type Safety` section — safe to deep-link to it.

## 6. Out-of-scope observations (do NOT fix here)

- **Stale link**: the `## Documentation` table links `[Development Guide](./DEVELOPMENT.md)`
  but `DEVELOPMENT.md` does **not exist**. This is pre-existing and UNRELATED to
  this changeset. Per the contract ("update ONLY sections affected by this
  changeset"), leave it alone. (Worth flagging in the PR description, not fixing.)
- Do NOT rewrite `## Quick Start`, tables, or any feature section other than the
  type-safety additions specified above.
- Do NOT change `package.json`, `vitest.config.ts`, source, or tests.

## 7. Accuracy self-check (run before declaring done)

```bash
# Scope: exactly one file changed (the root README)
git diff --stat   # → README.md only

# The four capabilities are named + the React README is linked (not duplicated)
grep -nE "Type Safety|packages/react/README" README.md

# Coverage gate stated correctly (90 / all four / exclusions / PRD §1.3.7)
grep -nE "90%|test:coverage|svelte|vue|1\.3\.7" README.md

# No accidental edits to the React README or any non-markdown file
git diff --name-only | grep -vE '^README\.md$' && echo "UNEXPECTED FILES CHANGED" || echo "scope OK"
```
