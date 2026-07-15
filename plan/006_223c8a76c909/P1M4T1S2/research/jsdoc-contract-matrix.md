# JSDoc Contract Matrix — §6.4 Field-Level Overrides (plan/006)

Extracted from the 8 implementing PRPs (P1.M1.T1.S1 → P1.M3.T3.S1) to define
what JSDoc/comment text each subtask was *supposed* to deliver, so the
P1.M4.T1.S2 consistency sweep can verify compliance.

**Scope**: JSDoc / comment *text* contracts only. Runtime behavior/tests are
referenced only where they pin a JSDoc claim (e.g. the §6.4.5 falsy cases).

**Legend**: "verbatim" = the PRP quotes the exact text to land in the file;
"paraphrased" = the PRP specifies required content but not exact prose.

---

## 1. Files & symbols touched, per PRP

| PRP | File(s) | Symbol(s) / JSDoc block(s) modified |
|---|---|---|
| **P1.M1.T1.S1** | `packages/core/src/types/config.ts` | `FieldConfig` interface — adds 6 new field-level JSDoc'd fields (`defaultValue`, `debounce`, `parser`, `formatter`, `valueField`, `getSubmitField`) between `recordKey` and `rules`. **Does NOT touch `InputConfig` JSDoc.** |
| **P1.M1.T1.S2** | `packages/core/src/config/defaults.ts` | NEW `resolveFieldOverType<T>` function + its JSDoc. (Barrels untouched; S3's scope.) |
| **P1.M1.T1.S3** | `packages/core/src/config/index.ts`, `packages/core/src/index.ts` | Barrel re-exports ONLY. **No JSDoc** (re-exports carry no doc surface — explicitly stated). |
| **P1.M1.T2.S1** | `packages/react/src/overlays.ts` | `ReactFieldConfig` interface-level JSDoc — appends ONE new paragraph. |
| **P1.M2.T1.S1** | `packages/core/src/config/defaults.ts` | `resolveInitialValue` Priority-3 block comment + 4 deltas to its JSDoc (priority list, deviation-note chain, `@param fieldConfig`, `@example`). |
| **P1.M3.T1.S1** | `packages/react/src/hooks/useField.tsx` + `packages/core/src/types/config.ts` | `InputConfig.parser` + `InputConfig.formatter` JSDoc (expanded to multi-line). + in-function comment. |
| **P1.M3.T2.S1** | `packages/react/src/components/Form.tsx` + `packages/core/src/types/config.ts` | `InputConfig.debounce` JSDoc — adds "Three-tier precedence" paragraph. + in-function comment. |
| **P1.M3.T3.S1** | `packages/react/src/components/Form.tsx` + `packages/core/src/types/config.ts` | `InputConfig.valueField` + `InputConfig.getSubmitField` JSDoc. + in-function comment. |

> **Asymmetry relevant to the sweep:** P1.M1.T1.S3 intentionally adds NO
> JSDoc. P1.M1.T1.S1 explicitly does NOT touch `InputConfig`.

---

## 2. JSDoc CONTRACT MATRIX

### A. FieldConfig fields (all owned by P1.M1.T1.S1) — verbatim text required

| Symbol (FieldConfig.*) | § refs | Required precedence wording |
|---|---|---|
| `defaultValue?: unknown` | §6.4.1, §13.1 | "Honored when !== undefined, so null/false/0/\"\" are meaningful." |
| `debounce?: number \| false` | §6.4.2 | "false = submit immediately"; "falls back to Form-level debounce prop (default 1000)" |
| `parser?: string \| ((value: unknown) => unknown)` | §6.4.3 | "String = named parser; function = inline" |
| `formatter?: string \| ((value: unknown) => unknown)` | §6.4.3 | "String = named formatter; function = inline" |
| `valueField?: string` | §6.4.4 | "Overrides the input type's valueField" |
| `getSubmitField?: (fieldName: string) => string` | §6.4.4 | "Overrides the input type's getSubmitField" |

**Section-header comment (OPTIONAL but recommended, P1.M1.T1.S1):**
```typescript
  // ── Field-level overrides for type-level levers (PRD §6.4). ──────────
  // All six follow ONE rule: the field value wins over the type value when
  // !== undefined (override, NOT compose — only `validator` composes; §10).
  // See resolveFieldOverType (core helper, added in P1.M1.T1.S2).
```
This is the **only** place in the 8 implementing PRPs where the
override-vs-compose asymmetry is named in code.

### B. InputConfig fields (the field-level counterparts)

| Symbol (InputConfig.*) | Owning PRP | § refs | Precedence wording |
|---|---|---|---|
| `parser` | P1.M3.T1.S1 | §6.4.3, §6.4.0 | "Three-tier precedence (§6.4.3): field → type → none"; "wins when `!== undefined`"; "null/false/0/\"\" are meaningful overrides" |
| `formatter` | P1.M3.T1.S1 | §6.4.3, §6.4.0 | mirror of parser |
| `debounce` | P1.M3.T2.S1 | §6.4.2, §6.4.0 | "Three-tier precedence (§6.4.2)"; "wins when set"; "honored when `!== undefined`" |
| `valueField` | P1.M3.T3.S1 | §6.4.4, §6.4.0 | "wins when `!== undefined`"; "restoring read/write symmetry with `recordKey`" |
| `getSubmitField` | P1.M3.T3.S1 | §6.4.4, §6.4.0 | mirror of valueField |
| **`defaultValue: TValue`** | **NONE** | — | — |

### C. Core helper & resolver

| Symbol | Owning PRP | § refs | Precedence wording |
|---|---|---|---|
| `resolveFieldOverType<T>` | P1.M1.T1.S2 | §6.4.0 (required) | "Returns the field value when it is not undefined (so null/false/0/\"\" are meaningful overrides); otherwise the type value"; "single precedence rule"; "Every adapter MUST call this helper at each field-vs-type resolution site". Body must be `!== undefined`, NOT `??`. |
| `resolveInitialValue` JSDoc | P1.M2.T1.S1 | §6.4.1, §13.1, §6.4.0, §6.4.5 | 4-tier priority list; `@param fieldConfig` "honored for any value `!== undefined` (so null/false/0/\"\" are meaningful)"; `@example` field-default-wins scenario. |
| `resolveInitialValue` Priority-3+4 comment | P1.M2.T1.S1 | §6.4.1, §6.4.0 | `// Priority 3+4: Field-level default overrides type-level (§6.4.1, §6.4.0)` |

### D. React overlay

| Symbol | Owning PRP | § refs | Precedence wording |
|---|---|---|---|
| `ReactFieldConfig` (one appended paragraph) | P1.M1.T2.S1 | §6.4, §6.4.0, §3.2.1 | "override their `InputConfig` counterparts when `!== undefined`"; "using the single `resolveFieldOverType` rule"; "`parser`/`formatter` stay `string \| ((value: unknown) => unknown)` — NOT generified over `TValue`". Identifiers backticked (file convention); em-dash `—`. |

### E. In-function code comments (Mode A, ride with the work)

| Site | Owning PRP | § refs |
|---|---|---|
| `useField.tsx` effectiveParser/formatter | P1.M3.T1.S1 | §6.4.3, §6.4.0, **§6.4.5** |
| `Form.tsx` changeField fieldDebounce | P1.M3.T2.S1 | §6.4.2, §6.4.0 |
| `Form.tsx` transformValuesForSubmit | P1.M3.T3.S1 | §6.4.4, §6.4.0 |

---

## 3. Override-vs-compose-vs-merge table

**NONE of the 8 implementing PRPs owns the full override/compose/merge table.**
That table is owned by **P1.M4.T1.S1** (the README task), which is *outside*
the 8 implementing subtasks. The only appearance of the asymmetry in the 8
implementing PRPs is P1.M1.T1.S1's OPTIONAL FieldConfig section-header comment
(`override, NOT compose — only \`validator\` composes; §10`).

→ The sweep should NOT fail the 8 subtasks for omitting the table; the table is
a README concern.

---

## 4. Open questions the consistency sweep must decide

### Q1 — `InputConfig.defaultValue` has NO field-level JSDoc mention ⚠️ KEY
**Status: NO implementing PRP required it.** Of the six FieldConfig override
fields, FIVE have an `InputConfig` counterpart whose JSDoc was explicitly
extended with a field-level mention (debounce→P1.M3.T2.S1,
parser/formatter→P1.M3.T1.S1, valueField/getSubmitField→P1.M3.T3.S1). The PRP
that owns the `defaultValue` runtime wiring (P1.M2.T1.S1, `resolveInitialValue`)
scopes out `types/config.ts` entirely. P1.M1.T1.S1 explicitly does NOT touch
`InputConfig`.

→ **This is the ONE genuine consistency gap the sweep should close.** Adding a
field-level mention + §6.4.1 reference to `InputConfig.defaultValue` improves
consistency with its five sibling levers and its field-level counterpart
`FieldConfig.defaultValue` (which already cites §6.4.1).

### Q2 — Optional FieldConfig section-header comment
P1.M1.T1.S1 marks the section-header comment OPTIONAL. The sweep cannot require
its presence strictly; if present, verify `only \`validator\` composes; §10`.

### Q3 — Backtick-vs-bare identifier style
P1.M1.T2.S1 requires backticking identifiers in the new ReactFieldConfig
paragraph (file convention) but accepts bare as a fallback. Other PRPs do not
specify a backtick convention. Do NOT impose backticks where the PRPs are silent.

### Q4 — `@param`/`@example` density on `resolveFieldOverType`
P1.M1.T1.S2 marks `@param`/`@example` RECOMMENDED, not required. Only the core
prose + §6.4.0 ref is required.

### Q5 — P1.M1.T1.S3 barrels carry NO JSDoc (by design)
Do NOT flag `config/index.ts` / `src/index.ts` for missing JSDoc on
`resolveFieldOverType`.

### Q6 — §6.4.5 attribution in `resolveFieldOverType`
Required prose cites §6.4.0 only; §6.4.5 is named in `@example`/tests. Treat
§6.4.5 as recommended-but-not-required in the helper JSDoc prose.

### Q7 — Precedence phrasing uniformity across the 5 InputConfig blocks
Exact-string uniformity is NOT required (each PRP quotes its own text);
**conceptual consistency is** (field wins when `!== undefined`, via
`resolveFieldOverType`, per §6.4.0).

### Q8 — em-dash + prettier wrapping
Do NOT enforce exact line breaks (prettier owns those); MAY verify em-dashes
survived where used.
