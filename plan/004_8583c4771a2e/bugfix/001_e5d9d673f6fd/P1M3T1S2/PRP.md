name: "P1.M3.T1.S2 — Update packages/react/CHANGELOG.md with fix summary"
description: |

  Mode B changeset-level documentation task (PRD h2.0/h2.4). Add ONE new patch
  version section (`## 0.2.3` → `### Patch Changes`) to
  `packages/react/CHANGELOG.md` summarizing the four fixes from this bugfix
  changeset (`001_e5d9d673f6fd`), in Changesets format, referencing the PRD
  issue numbers. Single-file edit; nothing else changes.

---

## Goal

**Feature Goal**: Give the bugfix changeset a durable, consumer-facing
changelog entry. `packages/react/CHANGELOG.md` currently shows only the initial
`0.1.0` release with no patch entries; add a `## 0.2.3` patch section
documenting all four fixes (Issues 1–4) so the release notes reflect what
actually shipped.

**Deliverable**: An **edited** `packages/react/CHANGELOG.md` (one file,
additive only) containing a new `## 0.2.3` section with a `### Patch Changes`
block of four bullets — one per fix — each keyed to its real commit short-hash
and referencing its PRD issue number, placed **above** the existing `## 0.1.0`
(Changesets newest-first convention).

**Success Definition**:
- The new section is in **Changesets format** (version heading →
  `### Patch Changes` → `- <shorthash>: <description>`), matching the existing
  `0.1.0` entry's style.
- All four fixes are represented (Issue 1: submitImmediate per-field flush;
  Issue 3: pending() accuracy; Issue 2: probes removed + isDisabled tracked;
  Issue 4: forwardRef warnings eliminated), each referencing its PRD issue number.
- Every commit short-hash referenced **exists** in `git log` (verified — see
  Validation Level 2).
- The existing `## 0.1.0` entry is preserved byte-for-byte below the new section.
- `git diff --stat` shows **exactly one file**: `packages/react/CHANGELOG.md`.
  README.md, KNOWN_ISSUES.md, source, tests, other CHANGELOGs untouched.

## User Persona (if applicable)

**Target User**: A consumer of `@formality-ui/react` (or contributor) reading
the changelog to understand what changed in the latest patch — especially
whether the auto-save flush / `pending()` behavior they depend on was fixed.

**Use Case**: Consumer upgrades and scans `### Patch Changes` to confirm the
"Save Now drops per-field-debounced edits" bug (Issue 1) and the misreporting
`pending()` (Issue 3) are fixed before relying on them.

**Pain Points Addressed**:
- The CHANGELOG is stale (only 0.1.0) despite four committed fixes — consumers
  have no release notes for the auto-save correctness work.
- Silent-drop bugs (Issue 1) are exactly the class consumers need flagged in a
  changelog so they know to upgrade.

## Why

- **Item contract (OUTPUT)**: "CHANGELOG.md has a new patch entry documenting
  all four fixes."
- **Item contract (LOGIC)**: "Use the Changesets changelog format with brief
  descriptions. Reference the issue numbers from the PRD."
- **PRD h2.0 (Overview)** + **h2.4 (Testing Summary)**: the changeset closed
  two Major (Issues 1, 2) and two Minor (Issues 3, 4) issues; the changelog is
  the durable, consumer-facing record of that closure.
- **Sequencing / parallel context**: All four fixes are **complete and
  committed** (P1.M1.T1/T2, P1.M2.T1/T2 — all marked Complete). This task runs
  in parallel with sibling P1.M3.T1.S1 (README.md). S1 owns the README; this
  task owns CHANGELOG.md — zero file overlap.

## What

A **single-file, additive** markdown edit. No code, no tests, no runtime, no
config, no README, no KNOWN_ISSUES.md, no other CHANGELOG. One new version
section (`## 0.2.3` → `### Patch Changes` → 4 bullets) inserted above the
existing `## 0.1.0`.

### Success Criteria

- [ ] `## 0.2.3` section present in `packages/react/CHANGELOG.md`, placed
      **above** `## 0.1.0` (newest-first).
- [ ] `### Patch Changes` block contains **four** bullets covering Issues 1, 3,
      2, 4 (the contract's enumeration order).
- [ ] Each bullet is `- <shorthash>: <description>` and references its PRD issue
      number (`Issue 1` / `Issue 2` / `Issue 3` / `Issue 4`).
- [ ] Every referenced short-hash exists in `git log` (Level 2 grep).
- [ ] Existing `## 0.1.0` entry (and the `# @formality-js/react` header) is
      preserved unchanged.
- [ ] `git diff --stat` = exactly one file (`packages/react/CHANGELOG.md`).

## All Needed Context

### Context Completeness Check

If someone knew nothing about this codebase, they would need: (1) the exact
file + its current 12-line content, (2) the Changesets format conventions
(newest-first, version heading, `### Patch Changes`, `- <hash>:`), (3) the four
fixes mapped to verified commit hashes + PRD issue numbers, (4) the
version-number decision (`0.2.3`) and why, (5) the two pre-existing
inconsistencies (stale `@formality-js` header; missing 0.2.0–0.2.2 entries)
that are OUT of scope, and (6) the sibling boundaries. All cited below with
exact paths + verified hashes. ✅ Passes the "No Prior Knowledge" test.

### Documentation & References

```yaml
# MUST READ — include in context window before implementing
- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M3T1S2/research/changelog-entry.md
  why: |
    THIS TASK'S FIELD GUIDE. Contains: the exact current CHANGELOG content, the
    verified four-fixes→commit-hash→issue-number table, the Changesets format
    conventions, the 0.2.3 version decision + rationale, the two out-of-scope
    pre-existing inconsistencies, the ready-to-transcribe entry, and the
    accuracy self-check greps. READ THIS FIRST.

- file: packages/react/CHANGELOG.md
  why: |
    THE file to edit (12 lines). Current content (verbatim):
      L1  # @formality-js/react
      L2  (blank)
      L3  ## 0.1.0
      L4  (blank)
      L5  ### Minor Changes
      L6  (blank)
      L7  - 463a2e0: Initial Release
      L8  (blank)
      L9  ### Patch Changes
      L10 (blank)
      L11 - Updated dependencies [463a2e0]
      L12   - @formality-js/core@0.1.0
    INSERT the new `## 0.2.3` block between L2 and L3 (above 0.1.0).
  pattern: |
    Changesets format: `## X.Y.Z` → blank → `### Patch Changes` → blank →
    `- <7-char-hash>: <description>`. Newest version sits directly under the
    `# <pkg>` header. MATCH the existing 0.1.0 entry's spacing/style exactly.
  gotcha: |
    The header is `# @formality-js/react` but package.json is `@formality-ui/react`
    (stale rename artifact). Do NOT rename it — out of scope. The new entry's
    bullets describe react-adapter fixes only (no core change), so NO
    `Updated dependencies [...]` line is needed (this also sidesteps the
    @formality-js/@formality-ui core-naming quirk).

- file: packages/react/package.json
  why: Confirms current version `0.2.2` → next patch = `0.2.3`. Also confirms
        canonical name `@formality-ui/react` (context for the header quirk).

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/prd_snapshot.md
  sections: "Issue 1", "Issue 2", "Issue 3", "Issue 4"
  why: |
    The authoritative descriptions of each fix. The "issue numbers from the PRD"
    are the labels Issue 1 / Issue 2 / Issue 3 / Issue 4 (there is no separate
    GitHub issue tracker). Transcribe the essence of each into a one-line bullet:
      Issue 1 (Major): submitImmediate() now flushes per-field numeric debounce
        saves (were silently dropped — only Form-level timer was flushed).
      Issue 3 (Minor): DebouncedFunction.pending() now reports accurate scheduled
        state (was hardcoded false for both timer sources).
      Issue 2 (Major): Removed committed diagnostic probe files; the React-adapter
        isDisabled limitation is now tracked in KNOWN_ISSUES.md (tests skipped).
      Issue 4 (Minor): Eliminated forwardRef render-function warnings in the test
        suite (dropped unnecessary React.forwardRef() wraps).

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/architecture/system_context.md
  sections: "Issue-by-Issue Status", "Current Codebase State (HEAD: 8281ad7)"
  why: |
    Confirms the fix implementation details and the commit graph (the four fix
    commits on top of 8e3fd4c). Grounds the bullet descriptions in the real fix
    (e.g. submitImmediate cancels-then-executes to avoid the version-abort race;
    wrapDebounced tracks an isPending flag).

- docfile: plan/004_8583c4771a2e/bugfix/001_e5d9d673f6fd/P1M3T1S1/PRP.md
  section: Goal + Integration Points (sibling boundary)
  why: |
    CONTRACT for the parallel sibling. S1 edits packages/react/README.md ONLY.
    This task (S2) edits packages/react/CHANGELOG.md ONLY. Confirmed zero file
    overlap. S1's research note (auto-save-api-audit.md) exists — do not read it
    as a source for CHANGELOG content (it's README-focused); use this task's own
    field guide instead.

- url: https://github.com/changesets/changesets/blob/main/docs/modifying-changelog-format.md
  why: |
    Authoritative Changesets changelog format reference. Confirms: version
    headings, `### Patch Changes` / `### Minor Changes` sections, `- <hash>:
    <desc>` bullet shape, and that the `Updated dependencies [...]` line is
    auto-generated ONLY when a dependency bumped (it did not here).
```

### Current Codebase tree (relevant slice)

```bash
packages/react/CHANGELOG.md   # ← THE file to EDIT (add one ## 0.2.3 patch section)
packages/react/package.json   # version 0.2.2 → next patch 0.2.3; name @formality-ui/react
packages/react/README.md      # NOT in scope (sibling P1.M3.T1.S1)
packages/react/KNOWN_ISSUES.md # NOT in scope (P1.M1.T2.S2); reference from a bullet only
CHANGELOG.md (root)           # NOT in scope
packages/core/CHANGELOG.md    # NOT in scope
plan/004_.../P1M3T1S2/research/changelog-entry.md  # THIS TASK's field guide
```

### Desired Codebase tree with files to be modified

```bash
packages/react/CHANGELOG.md   # MODIFIED — +1 version section (## 0.2.3 / ### Patch Changes / 4 bullets)
# (no other files change)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL (SCOPE): This is Mode B documentation. The diff MUST be exactly
     one file: packages/react/CHANGELOG.md. Do NOT edit README.md (sibling S1),
     KNOWN_ISSUES.md (P1.M1.T2.S2), root/core/svelte/vue CHANGELOGs, source,
     tests, or package.json. -->

<!-- CRITICAL (FORMAT): Use Changesets format, NOT keep-a-changelog. That means
     a `## 0.2.3` version heading + `### Patch Changes` + `- <hash>: <desc>`
     bullets. Do NOT use "Unreleased" (that is a different tool's convention).
     Newest version goes at the TOP, directly under the `# @formality-js/react`
     header (i.e. ABOVE the existing `## 0.1.0`). -->

<!-- CRITICAL (VERSION): The heading is `## 0.2.3`. package.json is 0.2.2; these
     are bug fixes + test/docs hygiene = semver patch; next patch = 0.2.3.
     Do NOT use 0.1.x (the CHANGELOG's 0.1.0 is ancient) and do NOT backfill the
     missing 0.2.0–0.2.2 entries (out of scope — pre-existing staleness). -->

<!-- CRITICAL (HASHES): Reference the REAL commit short-hashes, verified from
     git log:
       Issue 1 + Issue 3 → 0dca79a  (same commit fixed both)
       Issue 2           → 1863b44  (probes removed + tests skipped); the
                                      KNOWN_ISSUES tracking is commit 411b55a
       Issue 4           → 716b44c
     Do NOT invent hashes. Level 2 grep fails the task on any fabricated hash. -->

<!-- CRITICAL (NO DEPS LINE): Do NOT add an `Updated dependencies [...]` bullet.
     None of the four fix commits touch packages/core (verified via
     `git show --stat`), so this react patch has no core dependency change.
     The existing 0.1.0 entry HAS such a line because it depended on core@0.1.0;
     the new 0.2.3 entry does not. Adding a fake deps line is an accuracy bug. -->

<!-- OUT OF SCOPE (do NOT fix): (1) The header says `# @formality-js/react` but
     package.json is `@formality-ui/react` — a stale rename artifact. Leave it.
     (2) The CHANGELOG jumps 0.1.0 → (new) 0.2.3, missing 0.2.0–0.2.2 — those
     releases (commits cc8cb43 / c7e554c) never got entries. Pre-existing; do
     NOT backfill. Flag both in the PR description, not in the diff. -->

<!-- GOTCHA: Issues 1 & 3 were fixed in the SAME commit (0dca79a). Two bullets
     sharing one hash is correct and matches the contract's "four fixes"
     enumeration. (Acceptable alternative: merge into one bullet — but four
     bullets is the recommended mapping.) -->
```

## Implementation Blueprint

### Data models and structure

None — pure markdown documentation.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ORIENTATION — read the file to edit + the field guide + the PRD issues
  - READ: plan/.../P1M3T1S2/research/changelog-entry.md  (the field guide — FIRST)
  - READ: packages/react/CHANGELOG.md  (12 lines — note exact spacing/style)
  - READ: packages/react/package.json  (version 0.2.2; name @formality-ui/react)
  - SKIM: plan/.../prd_snapshot.md  (the four Issue sections — for bullet wording)
  - RUN: `git show --no-patch --format="%h %s" 0dca79a 1863b44 411b55a 716b44c`
         to confirm the four hashes/subjects exist BEFORE referencing them.

Task 2: INSERT the `## 0.2.3` patch section (the entire deliverable)
  - FILE: packages/react/CHANGELOG.md
  - WHERE: insert BETWEEN the header block (L1 `# @formality-js/react` + L2 blank)
           and `## 0.1.0` (L3). Newest-first is the Changesets convention.
  - CONTENT — transcribe this block exactly (hashes + issue numbers verified):
      ## 0.2.3

      ### Patch Changes

      - 0dca79a: `submitImmediate()` now flushes pending per-field numeric debounce saves. Previously only the Form-level timer was flushed, so edits to fields using a numeric `InputConfig.debounce` were silently dropped on "Save Now" / flush-before-navigate. (Issue 1)
      - 0dca79a: `DebouncedFunction.pending()` now reports accurate scheduled state for both the Form-level and per-field debouncers (previously hardcoded to `false`). (Issue 3)
      - 1863b44: Removed committed diagnostic probe files and skipped the out-of-scope `isDisabled` tests; the React-adapter `isDisabled` limitation is now tracked in `KNOWN_ISSUES.md`. (Issue 2)
      - 716b44c: Eliminated `forwardRef render-function` warnings in the test suite by dropping unnecessary `React.forwardRef()` wraps around test input components. (Issue 4)
  - SPACING: match the existing 0.1.0 entry — blank line after the version
             heading, blank line after `### Patch Changes`. The result reads:
             header → blank → `## 0.2.3` → blank → `### Patch Changes` → blank
             → 4 bullets → blank → `## 0.1.0` → ... (rest unchanged).
  - DO NOT add an `Updated dependencies [...]` bullet (no core change).
  - DO NOT alter the `# @formality-js/react` header or the `## 0.1.0` block.

Task 3: VERIFY — format, hashes, scope (run BEFORE declaring done)
  - 3a. FORMAT: exactly two `## ` version headings now exist (0.2.3 above 0.1.0);
       the new section has `### Patch Changes` with four `- <hash>:` bullets.
  - 3b. HASHES EXIST: each referenced short-hash resolves in `git log` (Level 2).
  - 3c. ISSUE REFS: all four of `Issue 1`/`Issue 2`/`Issue 3`/`Issue 4` appear.
  - 3d. SCOPE: `git diff --stat` = exactly `packages/react/CHANGELOG.md`.
  - 3e. PRESERVED: the `## 0.1.0` block and the header are byte-for-byte intact;
       no `Updated dependencies` line was added to 0.2.3.
```

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN — Changesets newest-first layout (the full expected file shape): -->

# @formality-js/react

## 0.2.3

### Patch Changes

- 0dca79a: `submitImmediate()` now flushes pending per-field numeric debounce
  saves. Previously only the Form-level timer was flushed, so edits to fields
  using a numeric `InputConfig.debounce` were silently dropped on "Save Now" /
  flush-before-navigate. (Issue 1)
- 0dca79a: `DebouncedFunction.pending()` now reports accurate scheduled state
  for both the Form-level and per-field debouncers (previously hardcoded to
  `false`). (Issue 3)
- 1863b44: Removed committed diagnostic probe files and skipped the
  out-of-scope `isDisabled` tests; the React-adapter `isDisabled` limitation
  is now tracked in `KNOWN_ISSUES.md`. (Issue 2)
- 716b44c: Eliminated `forwardRef render-function` warnings in the test suite
  by dropping unnecessary `React.forwardRef()` wraps around test input
  components. (Issue 4)

## 0.1.0

### Minor Changes

- 463a2e0: Initial Release

### Patch Changes

- Updated dependencies [463a2e0]
  - @formality-js/core@0.1.0

<!-- GOTCHA: keep bullet lines as single logical entries. If you wrap a long
     bullet onto a second line (as above), indent the continuation by 2 spaces
     so markdown renders it as one list item — or keep each bullet on one line
     (both render correctly; pick one and be consistent). -->

<!-- GOTCHA: the PRD issue numbers are literally "Issue 1"…"Issue 4". There is
     no GitHub "#N" to cite. -->
```

### Integration Points

```yaml
DOCUMENTATION (this task):
  - file: packages/react/CHANGELOG.md
  - change: ADD `## 0.2.3` / `### Patch Changes` / 4 bullets ABOVE `## 0.1.0`.
  - preserve: the `# @formality-js/react` header and the entire `## 0.1.0` block.

DOCUMENTATION (NOT in scope):
  - packages/react/README.md        → sibling P1.M3.T1.S1. Do not edit.
  - packages/react/KNOWN_ISSUES.md  → P1.M1.T2.S2. Reference from a bullet only.
  - root / core / svelte / vue CHANGELOG.md → not referenced; do not edit.

CODE / TESTS / CONFIG / PACKAGE.JSON:
  - change: NONE. Mode B documentation only.
```

## Validation Loop

### Level 1: Markdown & Style (Immediate Feedback)

```bash
# Section count + order: exactly two version headings, 0.2.3 above 0.1.0.
grep -nE "^## " packages/react/CHANGELOG.md
# Expected:
#   3:## 0.2.3
#   <n>:## 0.1.0

# The new section has Patch Changes with four hash bullets.
grep -nE "^### Patch Changes" packages/react/CHANGELOG.md   # >= 1 new hit (plus 0.1.0's)
sed -n '/^## 0\.2\.3$/,/^## 0\.1\.0$/p' packages/react/CHANGELOG.md | grep -cE '^- [0-9a-f]{7}:'
# Expected: 4

# Prettier (if configured on .md — accept its formatting for new lines):
pnpm exec prettier --check packages/react/CHANGELOG.md || \
  pnpm exec prettier --write packages/react/CHANGELOG.md
```

### Level 2: Hashes + issue refs are real (THE key accuracy gate)

```bash
# Every referenced short-hash exists in git.
for h in 0dca79a 1863b44 716b44c; do
  git show --no-patch --format="%h" "$h" >/dev/null 2>&1 \
    && echo "OK:     $h" \
    || echo "MISSING: $h  ← NOT A REAL COMMIT — fix the entry"
done
# Expected: all OK. (411b55a is the KNOWN_ISSUES commit, referenced in prose,
# not as a bullet hash — optional to also verify.)

# All four PRD issue numbers appear in the new section.
for n in 1 2 3 4; do
  grep -qE "Issue $n\b" packages/react/CHANGELOG.md \
    && echo "OK:     Issue $n" \
    || echo "MISSING: Issue $n"
done
# Expected: all OK.

# Confirm the four-bullet mapping (1=submitImmediate, 3=pending, 2=probes, 4=forwardRef).
sed -n '/^## 0\.2\.3$/,/^## 0\.1\.0$/p' packages/react/CHANGELOG.md | \
  grep -E "submitImmediate|pending|probe|isDisabled|forwardRef"
# Expected: hits covering all four fix topics.
```

### Level 3: Preservation + no fabricated deps line

```bash
# The existing 0.1.0 block is intact.
git show HEAD:packages/react/CHANGELOG.md > /tmp/old_cl.md
sed -n '/^## 0\.1\.0$/,$p' packages/react/CHANGELOG.md > /tmp/new_010.md
sed -n '/^## 0\.1\.0$/,$p' /tmp/old_cl.md        > /tmp/old_010.md
diff /tmp/old_010.md /tmp/new_010.md && echo "OK: 0.1.0 block unchanged" \
  || echo "ERROR: 0.1.0 block was modified"
rm -f /tmp/old_cl.md /tmp/old_010.md /tmp/new_010.md

# No fabricated "Updated dependencies" under 0.2.3 (core wasn't touched).
sed -n '/^## 0\.2\.3$/,/^## 0\.1\.0$/p' packages/react/CHANGELOG.md | \
  grep -q "Updated dependencies" \
  && echo "ERROR: 0.2.3 has an Updated-deps line (core wasn't changed)" \
  || echo "OK: no spurious Updated-deps line in 0.2.3"

# Header unchanged.
head -1 packages/react/CHANGELOG.md   # Expected: # @formality-js/react
```

### Level 4: Scope review (manual, final)

```bash
# Exactly one file changed.
git diff --stat
# Expected: only packages/react/CHANGELOG.md.

git diff --name-only | grep -vE '^packages/react/CHANGELOG\.md$' \
  && echo "UNEXPECTED FILES CHANGED" || echo "scope OK"
# Expected: scope OK (no README, no KNOWN_ISSUES, no source/test/config).
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 passed: two `## ` version headings (0.2.3 above 0.1.0); four
      `- <hash>:` bullets under the new `### Patch Changes`; prettier clean.
- [ ] Level 2 passed: every short-hash resolves in git; all four `Issue N`
      refs present; all four fix topics (submitImmediate/pending/probe+isDisabled/
      forwardRef) appear.
- [ ] Level 3 passed: `0.1.0` block byte-for-byte unchanged; no `Updated
      dependencies` line under `0.2.3`; header unchanged.
- [ ] Level 4 passed: scope = one file.

### Feature Validation

- [ ] `## 0.2.3` section present above `## 0.1.0` (Changesets newest-first).
- [ ] Four bullets cover Issues 1, 3, 2, 4 (contract order) with brief, accurate
      descriptions + PRD issue numbers.
- [ ] Bullet wording matches the actual fixes (per PRD + system_context).
- [ ] Commit hashes are the real fix commits (`0dca79a`, `1863b44`, `716b44c`).

### Code Quality Validation

- [ ] New section matches the existing 0.1.0 entry's Changesets style/spacing.
- [ ] No fabricated dependency-update line; no backfilled 0.2.0–0.2.2 entries.
- [ ] No header rename (`@formality-js` quirk left as-is — out of scope).

### Documentation & Deployment

- [ ] The CHANGELOG accurately reflects the four shipped fixes.
- [ ] README.md left for sibling P1.M3.T1.S1; KNOWN_ISSUES.md left for
      P1.M1.T2.S2; all other CHANGELOGs untouched.

---

## Anti-Patterns to Avoid

- ❌ Don't use "Unreleased" as the heading. That is keep-a-changelog, NOT
  Changesets. Use a real version heading: `## 0.2.3` (next patch after 0.2.2).
- ❌ Don't place the new section BELOW `## 0.1.0`. Changesets is newest-first;
  the new version goes directly under the `# <pkg>` header.
- ❌ Don't invent or guess commit hashes. Use the verified ones (`0dca79a`,
  `1863b44`, `716b44c`); Level 2 grep fails the task on any fabricated hash.
- ❌ Don't add an `Updated dependencies [...]` bullet. None of the four fixes
  touch `packages/core` (verified via `git show --stat`). The 0.1.0 entry has
  one because it depended on core@0.1.0; the 0.2.3 entry does not.
- ❌ Don't conflate Issues 1 & 3 into one bullet unless you also drop the
  four-fix enumeration. The contract lists four fixes; four bullets (two sharing
  hash `0dca79a`) is the recommended mapping.
- ❌ Don't edit the `# @formality-js/react` header to `@formality-ui/react`.
  That stale-rename artifact is out of scope for this changeset.
- ❌ Don't backfill the missing `0.2.0` / `0.2.1` / `0.2.2` entries. That is
  pre-existing staleness unrelated to this changeset — flag it in the PR, not
  the diff.
- ❌ Don't edit `packages/react/README.md` (sibling S1), `KNOWN_ISSUES.md`
  (P1.M1.T2.S2), root/core/svelte/vue CHANGELOGs, source, tests, or
  `package.json`. One file only.
- ❌ Don't pad the bullets into paragraphs. Changesets entries are one-liners
  (a wrapped line is fine); keep them brief and reference the issue number.

---

**Confidence Score: 9/10** for one-pass implementation success.

Rationale:
- This is a **single-file, additive, documentation-only** task with the entire
  source of truth pre-verified and distilled in the research note
  (`changelog-entry.md`): exact current CHANGELOG content (12 lines), the
  verified four-fixes→commit-hash→issue-number table, the Changesets format
  conventions, the `0.2.3` version decision with rationale, the ready-to-
  transcribe entry, and the sibling boundaries.
- The biggest accuracy risks (fabricating a commit hash; wrong Changesets format;
  adding a fake dependency-update line; editing the wrong file) are each
  neutralized by a concrete validation gate (Level 2 hash grep; Level 1 format
  grep; Level 3 no-deps-line check; Level 4 `git diff --stat` one-file check).
- The version-numbering judgment call (`0.2.3`) is documented with its
  rationale and the out-of-scope pre-existing gap is explicitly fenced off.
- Residual 1 point: bullet wording length/wrapping is a style judgment; Task 2
  gives the exact text to transcribe and the Anti-Patterns warn against padding.
