# JSDoc Consistency Audit — CURRENT source state (§6.4 field-level overrides)

Audit of the *current* JSDoc/source comments for the field-override symbol set,
verified by `read`/`grep` against `/home/dustin/projects/formality`.

Canonical precedence wording every field-override JSDoc should share:
> "the field-level value wins over the type-level value when it is !== undefined
> (so null, false, 0, and empty string are meaningful overrides, not unset)."

Legend for column (c):
- **Canonical (full)** — "wins when `!== undefined`" + explicit `null/false/0/""`
  enumeration + §6.4 sub-section ref.
- **Canonical (core)** — "wins when `!== undefined`" + §6.4 ref, omits the
  explicit falsy enumeration.
- **Section-covered** — terse inline JSDoc, but the shared section-header comment
  (config.ts:178-180) states the full canonical rule for the group.
- **Divergent** — different phrasing / partial wording.
- **Missing** — no field-level mention at all.

---

## CORE — `packages/core/src/types/config.ts`

### InputConfig.defaultValue  (config.ts:64) ★ KEY FINDING
- **(a) field-level mention?** NO.  **(b) §6.4 ref?** NO.
- **(c)** Missing.
- **(d)** Not stale (accurately describes the type-level default), but it is the
  **consistency gap**: the only one of the six type-level levers with no
  field-level / §6.4 mention.
- **(e)** `packages/core/src/types/config.ts:64`
  > `/** Default value for this input type (e.g., '' for text, false for switch) */`

### InputConfig.debounce  (config.ts:78-82)
- **(a)** YES.  **(b)** §6.4.2 + §6.4.0.
- **(c)** Divergent (minor) — lead "wins when **set**" but recovers "honored when
  `!== undefined`"; falsy trimmed to `false`/`number` (appropriate for the type).
- **(e)** config.ts:78-82.

### InputConfig.parser  (config.ts:115-119)
- **(a)** YES.  **(b)** §6.4.3 + §6.4.0.
- **(c)** Canonical (full) — "wins when `!== undefined`" + "null/false/0/\"\"".
- **(e)** config.ts:115-119.

### InputConfig.formatter  (config.ts:126-130)
- **(a)** YES.  **(b)** §6.4.3 + §6.4.0.
- **(c)** Canonical (full) — mirrors parser.
- **(e)** config.ts:126-130.

### InputConfig.valueField  (config.ts:95-98)
- **(a)** YES.  **(b)** §6.4.4 + §6.4.0.
- **(c)** Canonical (core) — "wins when `!== undefined`" but **omits** the
  `null/false/0/""` enumeration (parser/formatter siblings have it).
- **(e)** config.ts:95-98.

### InputConfig.getSubmitField  (config.ts:105-108)
- **(a)** YES.  **(b)** §6.4.4 + §6.4.0.
- **(c)** Canonical (core) — same shape as valueField; omits falsy enumeration.
- **(e)** config.ts:105-108.

### FieldConfig.defaultValue  (config.ts:184-186)
- **(a)** YES.  **(b)** §6.4.1, §13.1.
- **(c)** Canonical (full) — "Honored when !== undefined, so null/false/0/\"\"".
- **(e)** config.ts:184-186.

### FieldConfig.debounce / .parser / .formatter / .valueField / .getSubmitField
 (config.ts:191-193 / 198-199 / 204-205 / 210-211 / 216-217)
- **(a)** YES each.  **(b)** §6.4.2 / §6.4.3 / §6.4.3 / §6.4.4 / §6.4.4.
- **(c)** Section-covered / terse — no inline `!== undefined` / falsy wording
  (asymmetric vs. sibling FieldConfig.defaultValue, which has both). The shared
  section header (config.ts:178-180) supplies the canonical rule for the group.
- **(d)** Not stale.

> Reference — the section-header comment carrying the canonical rule for all six:
> `packages/core/src/types/config.ts:178-180`
> > "// All six follow ONE rule: the field value wins over the type value when
> > !== undefined (override, NOT compose — only `validator` composes; §10)."

## CORE — `packages/core/src/config/defaults.ts`

### resolveFieldOverType  (defaults.ts:8-13, examples 21-28)
- **(a)** YES (it IS the resolver).  **(b)** §6.4.0.
- **(c)** Canonical (full) — "Returns the field value when it is not undefined
  (so null/false/0/\"\" are meaningful overrides)" + worked examples.

### resolveInitialValue  (defaults.ts:42-45 list, 57-59 param, 86-94 example)
- **(a)** YES.  **(b)** §6.4.1, §13.1.
- **(c)** Canonical (full) — "honored for any value `!== undefined` (so
  null/false/0/\"\" are meaningful)".

## REACT — `packages/react/src/overlays.ts`

### ReactFieldConfig  (overlays.ts:65-69)
- **(a)** YES.  **(b)** §6.4 + §6.4.0 (+ §3.2.1).
- **(c)** Canonical (core) — "override their `InputConfig` counterparts when
  `!== undefined`"; omits explicit falsy enumeration but defers to §6.4.0.
- **(e)** overlays.ts:65-69.

## Wiring-site comments (source comments, not JSDoc)

### useField.tsx parser/formatter  (useField.tsx:559-563)
- **(a)** YES.  **(b)** §6.4.3, §6.4.0, **§6.4.5**.
- **(c)** Canonical (full) — "`!== undefined`, NOT `??` — so null/false/0/\"\"".

> **Citation-attribution note:** this site + the test suite attribute the
> falsy-semantics to **§6.4.5**; `config.ts` (parser/formatter) +
> `resolveFieldOverType` attribute the SAME semantics to **§6.4.0**. Both
> sections exist; this is a citation-style drift (lowest priority).

### Form.tsx debounce  (Form.tsx:387-391)
- **(a)** YES.  **(b)** §6.4.2 + §6.4.0.
- **(c)** Canonical (core) — delegates falsy enumeration to the §6.4.0 helper.

### Form.tsx getSubmitField/valueField  (Form.tsx:962-965)
- **(a)** YES.  **(b)** §6.4.4 + §6.4.0.
- **(c)** Canonical (core) — "wins when !== undefined"; delegates enumeration.

---

## CONSISTENCY GAPS — ranked concrete fixes (JSDoc/comment-only, no behavior)

### Rank 1 — HEADLINE: missing field-level mention on the type-level default lever
1. **`InputConfig.defaultValue`** — `packages/core/src/types/config.ts:64`
   - **Fix:** add a field-level mention + §6.4.1 reference (mirror the five
     sibling InputConfig levers). The single clearest consistency win.

### Rank 2 — within-FieldConfig verbosity asymmetry (LOW/cosmetic, OPTIONAL)
The shared section header (config.ts:178-180) already states the full canonical
rule for all six, so these are cosmetic. Listed only if uniform inline wording is
desired:
2. FieldConfig.debounce (191-193), parser (198-199), formatter (204-205),
   valueField (210-211), getSubmitField (216-217) — terse; could add inline
   "`!== undefined` … null/false meaningful".

### Rank 3 — InputConfig valueField/getSubmitField omit the falsy enumeration (LOW)
3. InputConfig.valueField (95-98), getSubmitField (105-108) — have "wins when
   `!== undefined`" but omit `null/false/0/""` (parser/formatter siblings have it).

### Rank 4 — citation-attribution drift §6.4.0 vs §6.4.5 (LOWEST)
4. The "null/false/0/\"\" meaningful" rule is filed under §6.4.0 in config.ts +
   resolveFieldOverType, but under §6.4.5 in useField.tsx:563 + tests. Pick one
   canonical attribution (lowest priority — both sections exist).

### Minor phrasing note (no fix required)
- InputConfig.debounce (config.ts:78) leads with "wins when **set**" rather than
  "wins when `!== undefined`"; recovers the `!== undefined` semantics next line.

## Bottom line
- **Stale JSDoc (describing old behavior):** NONE found.
- **Single highest-value fix:** add a field-level mention + §6.4.1 reference to
  `InputConfig.defaultValue` (`config.ts:64`).
- All resolution sites (useField.tsx, Form.tsx ×2, defaults.ts) correctly route
  through `resolveFieldOverType` and cite §6.4.x — no behavioral risk, only doc
  wording.
