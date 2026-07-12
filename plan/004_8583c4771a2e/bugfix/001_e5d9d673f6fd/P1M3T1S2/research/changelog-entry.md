# P1.M3.T1.S2 — CHANGELOG Field Guide

> Mode B (changeset-level documentation). The ONLY deliverable is an edited
> `packages/react/CHANGELOG.md`. This note is the distilled source-of-truth for
> that edit. Read it before writing any entry.

## 1. What this task IS and IS NOT

- **IS**: Add ONE new patch version section to `packages/react/CHANGELOG.md`
  summarizing the four fixes from this bugfix changeset
  (`001_e5d9d673f6fd`), in Changesets format, referencing the PRD issue numbers.
- **IS NOT**: Editing any other file. NOT the README (sibling S1 owns it). NOT
  KNOWN_ISSUES.md (P1.M1.T2.S2 owns it). NOT root CHANGELOG.md. NOT backfilling
  the missing 0.2.0–0.2.2 entries. NOT renaming the stale `@formality-js` header.
- **IS NOT**: creating a `.changeset/*.md` file — the contract says edit
  CHANGELOG.md directly.

## 2. Current CHANGELOG — exact content (12 lines)

```
# @formality-js/react

## 0.1.0

### Minor Changes

- 463a2e0: Initial Release

### Patch Changes

- Updated dependencies [463a2e0]
  - @formality-js/core@0.1.0
```

File: `packages/react/CHANGELOG.md`. Format = **Changesets** (version heading →
`### Patch Changes` / `### Minor Changes` → `- <shorthash>: <description>`).
Changesets convention = **newest version at the TOP**, directly under the
`# <pkg>` header.

### Two pre-existing inconsistencies (OUT OF SCOPE — do NOT fix)

1. **Header name**: `# @formality-js/react` but `package.json` name is
   `@formality-ui/react` (package was renamed; CHANGELOG header is stale).
2. **Version gap**: `package.json` is `0.2.2` but the CHANGELOG only has
   `## 0.1.0`. Git log shows `cc8cb43 chore(release): 0.2.2 [skip ci]` and
   `c7e554c chore(release): 0.2.1 [skip ci]` — those releases never got
   CHANGELOG entries (the file was effectively reset to 0.1.0 at some point).

The contract is explicit: add the patch entry for THIS changeset only. Do not
backfill, do not rename. (Flag both in the PR description if you like.)

## 3. The four fixes → commit hash → PRD issue mapping (VERIFIED)

From `git log` + `git show --stat` (all four are committed; core is NOT touched
by any of them):

| # | PRD Issue | Fix commit(s) | Files touched | One-line summary |
|---|-----------|---------------|---------------|------------------|
| 1 | **Issue 1** (Major) | `0dca79a` | `packages/react/src/components/Form.tsx` | `submitImmediate()` now flushes per-field numeric debounce saves (were silently dropped) |
| 2 | **Issue 3** (Minor) | `0dca79a` (same commit) | `Form.tsx` (`wrapDebounced`) | `DebouncedFunction.pending()` now reports accurate scheduled state |
| 3 | **Issue 2** (Major) | `1863b44` (probes+skip) + `411b55a` (KNOWN_ISSUES) | `Field.test.tsx`; `KNOWN_ISSUES.md`+`README.md` | Removed diagnostic probes; isDisabled React-adapter limitation now tracked |
| 4 | **Issue 4** (Minor) | `716b44c` | 4 react `__tests__/*.test.tsx` | Eliminated `forwardRef render-function` warnings in tests |

**Full commit subjects (verified):**
```
0dca79a fix(react): flush per-field debounce saves in submitImmediate; fix pending()
1863b44 test(react): skip out-of-scope failing isDisabled tests; remove diagnostic probes
411b55a docs: add KNOWN_ISSUES tracking isDisabled adapter limitation
716b44c test(react): drop unnecessary forwardRef wraps to silence render warnings
```

**Note:** Issues 1 & 3 were fixed in the SAME commit (`0dca79a`). Two bullets
sharing one hash is fine (the contract asks for four fixes; the commit fixed
two). Issue 2 spans two commits; key the bullet to `1863b44` (primary hygiene)
and mention KNOWN_ISSUES tracking in the description.

**No "Updated dependencies" line**: none of the four commits touch
`packages/core`, so the react patch does not bump/depend on a core change.
(This also avoids the `@formality-js/core` vs `@formality-ui/core` naming quirk.)

## 4. Version-number decision: `## 0.2.3`

- `package.json` version = `0.2.2`.
- These are bug fixes + test/docs hygiene → semver **patch**.
- Next patch after 0.2.2 = **0.2.3**.
- Changesets format requires a `## X.Y.Z` version heading (`Unreleased` is a
  different tool's convention — NOT Changesets). So `## 0.2.3` is the
  Changesets-compliant, forward-looking home for these four fixes.
- Placement = **above** `## 0.1.0` (newest-first), i.e. insert between the
  header (L1) + blank (L2) and `## 0.1.0` (L3).

## 5. The exact entry to write (ready to transcribe)

Insert between the `# @formality-js/react` header and `## 0.1.0`:

```markdown
## 0.2.3

### Patch Changes

- 0dca79a: `submitImmediate()` now flushes pending per-field numeric debounce saves. Previously only the Form-level timer was flushed, so edits to fields using a numeric `InputConfig.debounce` were silently dropped on "Save Now" / flush-before-navigate. (Issue 1)
- 0dca79a: `DebouncedFunction.pending()` now reports accurate scheduled state for both the Form-level and per-field debouncers (previously hardcoded to `false`). (Issue 3)
- 1863b44: Removed committed diagnostic probe files and skipped the out-of-scope `isDisabled` tests; the React-adapter `isDisabled` limitation is now tracked in `KNOWN_ISSUES.md`. (Issue 2)
- 716b44c: Eliminated `forwardRef render-function` warnings in the test suite by dropping unnecessary `React.forwardRef()` wraps around test input components. (Issue 4)
```

(Per-bullet issue numbers come straight from the PRD's "Issue 1/2/3/4" labels —
these ARE the PRD issue numbers; there is no separate GitHub issue tracker
referenced in the PRD.)

### Acceptable variations (document for the implementer)
- Issues 1 & 3 share commit `0dca79a`. If a single-bullet-per-commit style is
  preferred, they can be merged into one bullet — but the contract enumerates
  four fixes, so four bullets (two sharing the hash) is the recommended mapping.
- The `Updated dependencies [...]` line is OMITTED on purpose (no core change).

## 6. Sibling boundary — zero overlap

- `packages/react/README.md` → **sibling P1.M3.T1.S1** (in progress; its research
  note `auto-save-api-audit.md` exists). S1 owns the README; do NOT touch it.
- `packages/react/KNOWN_ISSUES.md` → **P1.M1.T2.S2** (complete, commit `411b55a`).
  Do NOT edit; only reference it from the CHANGELOG bullet.
- Root `CHANGELOG.md`, `packages/core/CHANGELOG.md`, svelte/vue CHANGELOGs exist
  but are OUT OF SCOPE. Edit ONLY `packages/react/CHANGELOG.md`.

## 7. Accuracy self-check (run before declaring done)

```bash
# Scope: exactly one file changed
git diff --stat   # → packages/react/CHANGELOG.md only

# New version section present, above 0.1.0, with all four issue refs
grep -nE "## 0\.2\.3|Issue [1-4]|0dca79a|1863b44|716b44c" packages/react/CHANGELOG.md

# Still exactly one existing version (0.1.0) untouched below
grep -cE "^## " packages/react/CHANGELOG.md   # → 2 (0.2.3 + 0.1.0)

# No accidental README / KNOWN_ISSUES / source edits
git diff --name-only | grep -vE '^packages/react/CHANGELOG\.md$' \
  && echo "UNEXPECTED FILES CHANGED" || echo "scope OK"

# No fabricated "Updated dependencies" line (core wasn't touched)
grep -nE "Updated dependencies" packages/react/CHANGELOG.md   # → only the 0.1.0 one
```
