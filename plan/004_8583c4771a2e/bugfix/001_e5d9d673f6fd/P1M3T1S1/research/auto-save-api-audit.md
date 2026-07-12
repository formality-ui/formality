# P1.M3.T1.S1 — Auto-Save README Audit & Source Map (research)

> Field guide for the `packages/react/README.md` auto-save doc sweep (Mode B,
> bugfix changeset `001_e5d9d673f6fd`). Every fact below was read directly from
> the working tree. **Read this BEFORE editing the README** — it tells you what
> is already done (do not redo), what is genuinely missing (do this), and the
> one accuracy trap (do not document a symbol in the wrong table).

---

## 0. HEADLINE: this is a VERIFY-AND-EXTEND task, not greenfield

The README is already **669 lines** and prior doc work landed three sections
that this item's contract mentions. Audit result:

| Contract clause | Current README state | Action |
|---|---|---|
| (a1) per-field debounce note in Auto-Save section | Auto-Save section (L279–295) is **bare** — only the basic `<Form autoSave debounce={2000}>` example. NO mention of `inputConfig.debounce`. | **ADD** (real work) |
| (a2) "document submitImmediate in the render API table" | `submitImmediate` is NOT on `FormRenderAPI` (Form.tsx:82–110). It is on `FormContextValue` (FormContext.ts:127), surfaced via `useFormContext()`. The README only destructures it in the useFormContext example (L304) with NO description. | **ADD with accuracy caveat** — see §3 below. Do NOT add it to the Form render-prop table. |
| (a3) "add a Known Issues section linking to KNOWN_ISSUES.md" | **ALREADY EXISTS** — `## Known Issues` at L658–665 links to `./KNOWN_ISSUES.md` and describes the isDisabled limitation. | **VERIFY ONLY** (confirm accurate; do not rewrite) |
| (d) DebouncedFunction.pending() / flush semantics | Only listed as an export in the TypeScript Support catalog (no behavior doc anywhere). | **ADD** as part of the Auto-Save API surface |
| "Do NOT change Example 4 scoped-validation" | `examples/06-auto-save.tsx` Example 4 (L320) already says "Auto-save validates only the changed field (and its dependents) before saving" — correct. | **VERIFY ONLY** (do not touch) |
| (accuracy nit) `debounce` prop type in Form Props table | Table (L143) says `number`. Real type is `number | false` (Form.tsx:71), default 1000. | **FIX** (`number` → `number \| false`) |

---

## 1. The Auto-Save API surface (exact, source-of-truth)

All line numbers from the working tree.

### 1a. Form-level `debounce` prop — type `number | false`, default `1000`

- `Form.tsx:63–71` (FormProps JSDoc) + `Form.tsx:158` (`debounce: debounceMs = 1000`):
  ```ts
  /**
   * Form-level auto-save debounce, used as the fallback for any field whose
   * `InputConfig.debounce` is unset.
   * - `false` — submit immediately (no debounce timer).
   * ...
   */
  debounce?: number | false;
  ```
- README Form Props table (L143) currently says `number` → **WRONG**. Fix to
  `number | false`.

### 1b. Per-field override — `InputConfig.debounce: number | false | undefined`

- Core type: `packages/core/src/types/config.ts:68–81`:
  ```ts
  /**
   * Auto-save debounce for fields of this input type.
   * - `false` — submit immediately on change (no debounce timer).
   * - <number> — fields sharing the same numeric debounce coalesce into a
   *   single timer; fields with different numeric debounces fire on their own
   *   cadence. When unset, the field falls back to the Form-level `debounce`.
   */
  debounce?: number | false;
  ```
- Routing in `changeField` (`Form.tsx:372–387`):
  ```
  inputConfig.debounce === false      → executeAutoSave immediately (no timer)
  inputConfig.debounce === <number>   → per-field timer at that ms (coalesced by ms)
  inputConfig.debounce === undefined  → Form-level debouncedSubmit (fallback)
  ```
- **Coalescing model** (`fieldDebouncersRef`, Form.tsx:225): the per-field cache
  is keyed by **ms interval**, NOT by field name. Fields sharing the same numeric
  debounce share ONE timer; all pending changes accumulate in
  `pendingChangedFields` (Form.tsx:215) and are captured in a single save when
  any timer fires.

### 1c. `submitImmediate()` — flush BOTH timer sources

- Source: `Form.tsx:726–745` (`const submitImmediate = useCallback(...)`):
  ```ts
  const submitImmediate = useCallback(() => {
    // Flush every pending auto-save immediately — both the per-field numeric
    // debounce timers (autosave Issue 1) and the Form-level debounce.
    const anyPending =
      debouncedSubmitRef.current?.pending() === true ||
      [...fieldDebouncersRef.current.values()].some((fn) => fn.pending());
    if (!anyPending) return; // nothing scheduled — avoid a spurious empty save
    debouncedSubmitRef.current?.cancel();
    fieldDebouncersRef.current.forEach((fn) => fn.cancel());
    executeAutoSaveRef.current?.();   // runs the save pipeline exactly once
  }, []);
  ```
- Semantics to document: **flush pending auto-save immediately**; covers BOTH
  per-field and Form-level timers; no-op when nothing is pending (no spurious
  empty save); cancels trailing timers to avoid a version-abort race; runs the
  save pipeline exactly once.

### 1d. `DebouncedFunction` contract — `cancel` / `flush` / `pending`

- Interface: `packages/react/src/types.ts:117–123`:
  ```ts
  export interface DebouncedFunction {
    (): void;                 // Schedule/trigger the debounced invocation
    cancel: () => void;       // Cancel any pending invocation
    flush: () => void;        // Immediately execute any pending invocation
    pending: () => boolean;   // Check if there's a pending invocation
  }
  ```
- Surfaced on `FormContextValue` as `debouncedSubmit: DebouncedFunction`
  (FormContext.ts:124) — accessible via `useFormContext()`.
- **Issue 3 fix (already shipped):** `pending()` now tracks real scheduled state.
  `wrapDebounced` (Form.tsx:862–884) maintains an `isPending` flag set on
  schedule and cleared on fire/cancel/flush; the immediate adapter
  (`debounce === false`) hardcodes `pending: () => false`. So `.pending()` is
  now reliable on both Form-level and per-field debouncers.

---

## 2. ⚠️ ACCURACY TRAP — where `submitImmediate` actually lives

**The item says "document submitImmediate in the render API table". That wording
is imprecise. Do NOT add it to the Form render-prop table — it would be a
documentation bug.**

- `FormRenderAPI` (Form.tsx:82–110) members: `unusedFields`, `formState`,
  `methods`, `handleSubmit`, `resolvedTitle`. **`submitImmediate` is NOT a
  member.**
- `submitImmediate` and `debouncedSubmit` are passed into the **`FormContextValue`**
  (the context value `useMemo`, Form.tsx:803 + 822), NOT into the render-prop
  `api`. They are accessed via **`useFormContext()`** (FormContext.ts:127,162).
- The README's `useFormContext` example (L298–310) ALREADY destructures
  `submitImmediate` — but with NO description table.

**Correct documentation placement (pick one or both):**
1. Add a small API table under `### useFormContext` (or `### FormContext`) listing
   `submitImmediate` and `debouncedSubmit` with their descriptions; OR
2. Add an "Auto-Save API" subsection under `## Auto-Save` that documents
   `submitImmediate` (flush), `debouncedSubmit` (DebouncedFunction with
   cancel/flush/pending), and notes both are accessed via `useFormContext()`.

**Recommended:** do BOTH lightly — a one-row-per-symbol note in the Auto-Save
section (the natural home for "flush semantics") AND ensure `useFormContext`'s
destructure example is accompanied by at least a pointer. Keep the Form
render-prop table (`methods/formState/unusedFields/resolvedTitle`) UNCHANGED.

---

## 3. What is ALREADY DONE (verify, do not redo)

### 3a. `## Known Issues` section — EXISTS (L658–665)

Already links to `./KNOWN_ISSUES.md` and accurately summarizes the isDisabled
limitation (fieldStates omits `disabled` to avoid circular re-renders). **Verify
the link resolves and the one-liner matches `KNOWN_ISSUES.md`; do not rewrite.**

### 3b. `KNOWN_ISSUES.md` — EXISTS at `packages/react/KNOWN_ISSUES.md`

Comprehensive (Symptom / Root cause / Workaround 1 value-based / Workaround 2
explicit prop / Potential future fix / Reference to skipped tests + source). This
file is the target of the README's Known Issues link. Do NOT edit it (out of
scope — it was P1.M1.T2.S2's deliverable).

### 3c. Example 4 scoped validation — ALREADY CORRECT (do not change)

`examples/06-auto-save.tsx` Example 4 (L320, "Auto-Save with Validation"):
- L322: "Auto-save validates only the changed field (and its dependents) before
  saving" ✅ scoped (not whole-form).
- L372: "Auto-save saves a change once the edited field (and its dependents)
  validate; an unrelated invalid field won't block it." ✅ scoped.
- PRD overview (h2.0) confirms: "the three stale whole-form-validity claims …
  were rewritten to describe the scoped gate."

**This task MUST NOT edit `examples/06-auto-save.tsx`.** The clause is
verify-only: confirm the scoped wording is present (the two lines above), then
leave it.

---

## 4. Sibling-task boundaries (anti-overlap)

| Sibling | Owns | Overlap with this task? |
|---|---|---|
| `P1.M2.T2.S1` (parallel, in flight) | test input components (forwardRef→plain fn); verify-only, no README touch | NONE |
| `P1.M3.T1.S2` (pending) | `packages/react/CHANGELOG.md` fix summary | NONE — this task owns README.md ONLY; do NOT touch CHANGELOG.md |
| `P1.M1.T2.S2` (done) | `packages/react/KNOWN_ISSUES.md` | Do NOT edit KNOWN_ISSUES.md (reference/verify only) |

**This task edits exactly ONE file: `packages/react/README.md`.** (Plus a
read-only verify of `examples/06-auto-save.tsx` Example 4 and `KNOWN_ISSUES.md`.)

---

## 5. README section map (current, 669 lines)

```
L1    # @formality-ui/react
L5    ## Installation
L21   ## Quick Start
L84   ## Components
L111    ### Form            ← Props table L136 (debounce type wrong), Render API table L141
L148    ### Field
L279  ## Auto-Save          ← BARE (L279–295); EXPAND here (per-field debounce + submitImmediate + DebouncedFunction)
L296  ## Hooks
L298    ### useFormContext  ← destructures submitImmediate (L304) but no description; ADD pointer/table here
L364  ## Contexts
L377    ### FormContext
L397  ## TypeScript Support
L453  ## Type Safety        (prior plan work; not this task's concern)
L631  ## Testing & Coverage (prior plan work; not this task's concern)
L658  ## Known Issues       ← ALREADY EXISTS; verify only
L667  ## License
```

**Insertion plan:**
- EXPAND `## Auto-Save` (L279–295) in place: keep the basic example; add
  per-field debounce + coalescing + submitImmediate/flush + DebouncedFunction.
- FIX the `debounce` row in the Form Props table (L143): `number` → `number | false`.
- (Optional, light) add a `submitImmediate`/`debouncedSubmit` note under
  `### useFormContext` (L298) pointing into the Auto-Save section.
- VERIFY `## Known Issues` (L658) and Example 4 — do not edit.

---

## 6. Accuracy verification harness (for the implementer)

```bash
# 1. Every auto-save symbol referenced in the new README text must resolve to
#    a real export / source location.
for sym in submitImmediate debouncedSubmit DebouncedFunction InputConfig; do
  grep -rn "\b$sym\b" packages/react/src/ packages/core/src/types/ >/dev/null \
    && echo "OK: $sym" || echo "MISSING: $sym"
done

# 2. Confirm submitImmediate is NOT wrongly added to FormRenderAPI:
sed -n '82,110p' packages/react/src/components/Form.tsx | grep -q submitImmediate \
  && echo "ERROR: submitImmediate is on FormRenderAPI — re-check" \
  || echo "OK: submitImmediate is NOT on FormRenderAPI (document it via useFormContext)"

# 3. Confirm the debounce prop type matches source:
grep -n "debounce?: number | false" packages/react/src/components/Form.tsx
# Expected: one hit (FormProps). README Form Props table must say `number | false`.

# 4. Confirm Known Issues link target exists:
test -f packages/react/KNOWN_ISSUES.md && echo "OK: KNOWN_ISSUES.md exists" \
  || echo "MISSING: KNOWN_ISSUES.md"

# 5. Confirm Example 4 still describes scoped validation (do NOT edit):
grep -n "changed field (and its dependents)" examples/06-auto-save.tsx
# Expected: hits at ~L322 and ~L372 (scoped wording present).

# 6. Scope check — exactly one file changed:
git diff --stat
# Expected: only packages/react/README.md.
```
