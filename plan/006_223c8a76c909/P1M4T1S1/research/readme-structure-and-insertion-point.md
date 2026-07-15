# Research — P1.M4.T1.S1: README.md field-level overrides section

Purpose: pin down the exact insertion point, the README's documentation style,
and the verified facts the new subsection must state. (Docs-only task — no code
changes; this note exists so the PRP can quote exact line anchors.)

## 1. Where field-config / InputConfig levers live in the root README today

Root `README.md` (888 lines / 33KB) heading map (relevant slice):

```
L521  ## Auto-Save            (type-level + Form-level debounce only)
L539  ## Field Groups
L566  ## Value Transformation (HOME of the InputConfig levers)
L588  ### Composing input types: reuse a component + default props + named transforms
L672  ---   (closes the Value Transformation section)
L674  ## Type Safety
```

There is **no dedicated "Field Configuration" / "InputConfig" heading** in the
root README. The closest, authoritative home for the levers
(`defaultValue`, `debounce`, `parser`, `formatter`, `valueField`,
`getSubmitField`) is the `### Composing input types` subsection (L588–670) under
`## Value Transformation`. That subsection contains the InputConfig **bundle
table** (L596–599):

```
| props      | Default props applied to every field of this type ... Per-field props override them. |
| parser     | Transform user input → form value. A string names an entry in the provider's parsers; a function is inline. |
| formatter  | Transform form value → display value. Same string/function rules as parser. |
| validator, template, inputFieldProp, valueField, getSubmitField, debounce, defaultValue | The rest of the bundle (see InputConfig). |
```

So the levers the new feature overrides are *already enumerated* right here — the
new field-level-overrides subsection is a natural sibling that says "those same
keys now also work per-instance on `config[name]`".

## 2. Exact insertion point (verified)

The "Composing input types" subsection ends with this paragraph + section close
(L668–672, exact text):

```
See [`examples/02-input-types.tsx`](./examples/02-input-types.tsx) for the full
set of `InputConfig` options (named vs inline transforms, default `props`,
`validator`, `template`, etc.).

---
```

**New subsection goes BETWEEN `etc.).` and the `---`** (i.e. as a new `###`
sibling under `## Value Transformation`). The anchor text
`` `validator`, `template`, etc.). `` + the following `---` is unique in the
file → safe for an exact-text edit.

## 3. README style conventions to mirror (so the new section fits)

- `###` subsections with a short prose intro + a fenced ```tsx example + tables.
- `>` blockquote callouts for gotchas. Two precedents inside the same subsection:
  - L656 `> **type gotcha:** ...`
  - L663 `> **Named lookups must be registered.** ...`
- Cross-refs point to `examples/*.tsx` and the package READMEs
  (`./packages/react/README.md#...`) — NOT to PRD `§` numbers (PRD is internal
  spec notation; README is user-facing). ⇒ Do NOT write "see §6.4" in the README.
- The react README uses the naming pattern **"Per-field X"** (e.g.
  `### Per-field debounce overrides` at packages/react/README.md:300). Mirror it:
  `### Per-field overrides for type-level levers`.

## 4. Verified facts the new section must state (from code, not PRD)

Field-level override fields already exist on `FieldConfig` (S1 COMPLETE —
packages/core/src/types/config.ts L186–219):

| Field (on `config[name]`) | Type                                       |
| ------------------------- | ------------------------------------------ |
| `defaultValue`            | `unknown` (L188)                           |
| `debounce`                | `number | false` (L195)                    |
| `parser`                  | `string | ((value: unknown) => unknown)` (L201) |
| `formatter`               | `string | ((value: unknown) => unknown)` (L207) |
| `valueField`              | `string` (L213)                            |
| `getSubmitField`          | `(fieldName: string) => string` (L219)     |

Precedence rule = `resolveFieldOverType(fieldVal, typeVal)` →
`fieldVal !== undefined ? fieldVal : typeVal` (defaults.ts L30). ⇒ `null`,
`false`, `0`, `""` are MEANINGFUL overrides/defaults (not "unset").

`defaultValue` precedence (resolveInitialValue, defaults.ts L103–121) — highest
to lowest:
1. `defaultValues[fieldName]` (Form prop)
2. `record[recordKey]`
3. `resolveFieldOverType(fieldConfig.defaultValue, inputConfig.defaultValue)`
   (field wins over type)
4. `undefined`

⇒ field-level `defaultValue` is a NEW priority tier BETWEEN record/defaultValues
and the type default — NOT a bare `??` of the type default. The new section's
gotcha must state this.

Override-vs-compose asymmetry (PRD §6.4 "Override vs. compose"):
- the six levers → **override** (single value each)
- `validator` → **compose** (field runs, then type)
- `props` → **merge** (type props spread under field props)

## 5. Existing package-README coverage of this feature = NONE

`packages/react/README.md` has `### Per-field debounce overrides` (L300) but it
documents ONLY **type-level** `InputConfig.debounce` (the table there is
`InputConfig.debounce` × behavior). It does NOT mention field-level
`config[name].debounce`. So the field-level capability is undocumented in every
README. The root README subsection (this task) is the changeset-level sync (Mode
B) that surfaces it. (P1.M4.T1.S2 is a separate task: JSDoc consistency across
core/react exports — NOT root README.)

## 6. Validation gates (project-verified)

- `README.md` IS prettier-managed (NOT in `.prettierignore`; only `PRD.md`,
  `plan/`, `CHANGELOG.md`, build/dist/coverage are ignored). It passes
  `prettier --check` today. ⇒ `pnpm format:check` is a real gate; run
  `pnpm format` if it complains (markdown table/code-fence wrapping).
- No markdown linter (no markdownlint/remark config). ⇒ prettier is the only
  markdown gate.
- `pnpm test` (vitest run) enforces the 90/90/90/90 coverage gate — a docs-only
  README change cannot reduce coverage, but run it to confirm the full suite
  stays green.
- `pnpm typecheck` / `pnpm lint` are unaffected by a README change (no TS/JS
  touched) but cheap to run as a no-regression sanity check.

## 7. The canonical example (the one the contract requests)

A `switch` that defaults ON for ONE field without making every switch default on:

```tsx
const inputs = {
  switch: { component: Switch, defaultValue: false }, // TYPE default = OFF
};
const config = {
  active: { type: "switch", defaultValue: true }, // ONE field defaults ON
  paused: { type: "switch" }, // siblings keep the type default (OFF)
};
// <Field name="active" /> starts ON; <Field name="paused" /> starts OFF.
```

This is concise, self-contained, and directly demonstrates per-instance override
without affecting siblings — exactly what the item description asks for.
