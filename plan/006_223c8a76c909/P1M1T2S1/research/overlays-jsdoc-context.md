# Research — P1.M1.T2.S1: ReactFieldConfig JSDoc → §6.4 field-level overrides

## Task in one line

Add one JSDoc paragraph to `ReactFieldConfig` in
`packages/react/src/overlays.ts` so React consumers learn that the six §6.4
field-level override fields are inherited unchanged from core `FieldConfig`.
Documentation-only (Mode A); no runtime/type change.

## What already exists (verified by reading the code)

### Core `FieldConfig` — S1 is COMPLETE ✅

`packages/core/src/types/config.ts` (interface at line 120) already contains
the six optional override fields, placed **after `recordKey`** and **before
`rules`** exactly as S1's PRP specified (read lines 110–200):

```typescript
  recordKey?: string;

  // ── Field-level overrides for type-level levers (PRD §6.4). ──────────
  defaultValue?: unknown;
  debounce?: number | false;
  parser?:    string | ((value: unknown) => unknown);
  formatter?: string | ((value: unknown) => unknown);
  valueField?: string;
  getSubmitField?: (fieldName: string) => string;

  rules?: Record<string, unknown>;
```

→ **This task's input dependency is satisfied.** No core edit is needed or
permitted.

### React overlay — auto-inherits, but is UNDOCUMENTED for §6.4

`packages/react/src/overlays.ts`, lines 55–66 (read directly):

```typescript
/**
 * `FieldConfig` as seen by React consumers.
 *
 * Narrows core's framework-agnostic `rules?: Record<string, unknown>` to
 * react-hook-form's `RegisterOptions`, giving autocomplete and checking for
 * `required`, `min`, `max`, `pattern`, `validate`, `valueAsNumber`, `deps`, …
 *
 * The generic `V` defaults to `FieldValues`; pass your form's values type for
 * slightly tighter checking on path-based rules.
 */
export interface ReactFieldConfig<
  V extends FieldValues = FieldValues,
> extends Omit<FieldConfig, "rules"> {
  /** react-hook-form register options forwarded to the field's Controller. */
  rules?: RegisterOptions<V>;
}
```

Observations:
- The JSDoc has **two paragraphs**: (1) the `rules`-narrowing paragraph
  (lines 57–60), (2) the generic-`V` paragraph (lines 62–63).
- The interface body has a single `rules` field with its own one-line JSDoc.
- The JSDoc **says nothing** about the six §6.4 override fields. React
  consumers reading the hover/IntelliSense today would NOT know the overlay
  also carries `defaultValue`/`debounce`/`parser`/`formatter`/`valueField`/
  `getSubmitField`. → **This is the gap S1's PRP explicitly deferred to T2.S1.**

### `resolveFieldOverType` (the §6.4.0 helper) — S3 is IN-FLIGHT (parallel)

`plan/006_223c8a76c909/P1M1T1S3/PRP.md` (read in full) exports
`resolveFieldOverType` from the core barrel. S1 (definition) and S2 (helper)
are both COMPLETE; S3 is the re-export wiring. The JSDoc paragraph this task
writes *references* the helper by name (`resolveFieldOverType`) and its rule
(§6.4.0). The prose is correct regardless of S3's merge state — the helper
exists and works either way (importable from the deep path today, the barrel
after S3). No code dependency; only a documentation cross-reference.

## Conventions discovered (must match in the edit)

### JSDoc referencing style in `overlays.ts`

The file already references PRD sections with bare `§` notation (no `PRD`
prefix is required inside the react package — it is understood):

- line 6:  `// … See PRD §1.3.2 / §3.2.`
- line 81: `// … (PRD §C.4 / T2.1).`
- line 120:`// follow-up (PRD §C.4 T2.2 step 3).`
- line 145:`// … see §20.1`
- line 168:`// … (PRD §5.3.8).`
- line 175:`// … (PRD §20.4), and under React 19`

→ Using `§6.4`, `§6.4.0`, `§3.2.1` is fully consistent.

### Backtick convention for code identifiers

EVERY code identifier in the file's JSDoc is wrapped in backticks:
`` rules?: Record<string, unknown> ``, `RegisterOptions`, `FieldValues`,
`component`, `template`, `forwardRef`, `RefCallBack`, … The contract's plain
prose names (`defaultValue`, `parser`, `FieldConfig`, `InputConfig`, `TValue`)
should therefore be backticked to match. This is a documentation-quality
decision that keeps the new paragraph visually consistent with the file; the
semantic content stays identical to the contract text.

### JSDoc prose wrapping

The file's multi-line JSDoc paragraphs wrap around 76–78 chars (prettier's
default `printWidth: 80` reflows `/** */` prose). `pnpm format:check` is a gate
(see *Validation* below), so the final wrapping must satisfy prettier. Best
practice: write the paragraph naturally, run `pnpm format`, and let prettier
normalize. The PRP provides a pre-wrapped form likely to pass.

## Validation tooling (verified from root `package.json`)

```
test        = vitest run
typecheck   = tsc --build        (references packages/core + packages/react)
lint        = eslint .
format      = prettier --write .
format:check= prettier --check .
```

For a pure JSDoc edit:
- `pnpm format:check` is the **primary** gate (prettier reflows JSDoc and will
  fail if wrapping/spacing is off). Run `pnpm format` to auto-fix.
- `pnpm lint` (eslint) is secondary — eslint's JSDoc rules (if any) run here.
- `pnpm typecheck` must stay clean (a JSDoc change has zero compile impact, so
  this is a regression-guard, not a feature gate).
- `pnpm test` must stay green (1085 passed | 5 skipped baseline; JSDoc has no
  runtime effect). There is **no** test that asserts JSDoc *content* — JSDoc is
  not executed.

## Test infrastructure (for the optional type-check recommendation)

`packages/react/src/__typechecks__/ReactFormFieldsConfig.test-d.ts` (read in
full) is the established convention for *type-level* assertions on overlay
types: a `// NOT a runtime test; consumed by tsc --build` header, plain
`const _x: Type = { … }` literals, and `// @ts-expect-error` for negative
cases. It currently asserts **key-narrowing** of `ReactFormFieldsConfig`, NOT
the presence of the six override fields. A small optional addition proving
`ReactFieldConfig` exposes `defaultValue`/`debounce`/`parser`/`formatter`/
`valueField`/`getSubmitField` would lock the inheritance against future
regression — but it is **out of the stated contract** (OUTPUT = "Updated JSDoc
on ReactFieldConfig"), so it is listed as OPTIONAL only.

## Placement decision

Task contract: "add a paragraph … (after the existing rules documentation)".

The "existing rules documentation" = paragraph (1) (lines 57–60) plus the
generic-`V` paragraph (2) (lines 62–63), which together document what the
overlay narrows. The natural, unambiguous append point is the **end of the
JSDoc block** — after the `V` paragraph, before the closing ` */ ` on line 64.
This keeps the block coherent (narrowing → generic → inherited fields) and is
unambiguously "after the existing rules documentation". Inserting between
paragraphs (1) and (2) would split the rules/generic discussion.

## Confidence

**10/10.** Single file, single JSDoc block, exact contract text supplied,
placement unambiguous, input dependency (S1) verified complete, validation
gates mechanical (`format:check` + `lint` + `typecheck`). The only residual
risk is a prettier-wrapping nit, which `pnpm format` resolves deterministically.
