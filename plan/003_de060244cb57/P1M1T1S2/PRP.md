name: "P1.M1.T1.S2 — Rewrite FormalityFieldComponentProps JSDoc + sync README 'Runtime caveat' (Mode A)"
description: |

---

## Goal

**Feature Goal**: Synchronize the `FormalityFieldComponentProps`
documentation in two files with the runtime change shipped by P1.M1.T1.S1
(which made `<Field>` deliver `forwardRef` as a top-level enumerable prop).
Both files currently carry a now-false **"Runtime caveat (important)."**
paragraph claiming forwardRef delivery for bare components is a "FUTURE
runtime task" / "out of scope for this type-only change." That is no longer
true — the runtime now matches the type contract. Rewrite the stale prose
to state the truth, and leave every other documented element untouched.

**Deliverable**: Two precise, file-specific prose edits —
(a) `packages/react/src/overlays.ts` lines 148 (back-reference) + 167–174
(the "Runtime caveat" paragraph inside the JSDoc), and
(b) `packages/react/README.md` lines 609–615 (the README's copy of the same
paragraph). No type-body changes, no other prose regions touched.

**Success Definition**:
1. overlays.ts: the "Runtime caveat (important)." paragraph (167–174) no
   longer claims forwardRef delivery is a "FUTURE runtime task" or "out of
   scope for this type-only change." It states `forwardRef` is delivered at
   runtime as a top-level prop by `<Field>` (no `React.forwardRef` wrap
   required for plain function components).
2. overlays.ts: the back-reference at line 148 ("...codifies ahead of the
   runtime wiring...") no longer claims the type is "ahead of" the runtime.
3. README.md: the caveat paragraph (609–615) makes the same correction with
   its file-specific wording.
4. In BOTH files: the "Destructure before forwarding." guidance, the MUI v9
   `slotProps={{ input: { ref: forwardRef } }}` note, and the "stop
   hand-rolling `WithFormality`" closer are KEPT.
5. The `FormalityFieldComponentProps` type body (overlays.ts:179–188) is
   UNCHANGED. No README Before/After type docs (558–595), Destructure/Wiring
   guidance (596–607), or section header (558) are touched.
6. `pnpm typecheck` green; `pnpm lint` clean; no source/runtime files changed.

## User Persona

**Target User**: React consumers of `@formality-ui/react` reading the
`FormalityFieldComponentProps` JSDoc (in-IDE) or the React README (on the
web) to learn how to wire RHF's ref onto their input component.

**Use Case**: A consumer writes a plain function component
`({ forwardRef, ...rest }) => <input ref={forwardRef} {...rest} />` and
checks the docs to confirm `forwardRef` will actually arrive populated.

**Pain Points Addressed**: After P1.M1.T1.S1, `forwardRef` IS delivered at
runtime — but the docs still say it isn't, telling consumers to wrap with
`React.forwardRef` or wait for a "future runtime task." The docs now
misrepresent the shipped behavior and must be corrected.

## Why

- **Business value**: Keeps the public contract documentation truthful after
  a runtime change. Stale "this doesn't work yet" docs actively mislead
  consumers and undermine trust in the type contract.
- **Integration**: This is the **Mode A docs** subtask for PRD §20.7, riding
  directly on P1.M1.T1.S1's runtime change (Field.tsx coreProps
  `ref` → `forwardRef`). S1 ships the runtime; S2 (this) ships the doc sync.
  The two are intentionally split so the runtime diff stays minimal and
  reviewable.
- **Scope boundary (CRITICAL)**: This is a **doc-only** edit to exactly two
  prose regions. It does NOT:
  - Re-type `FormalityFieldComponentProps` (already correct).
  - Touch `state`/`formState` injection docs (out of scope per §20.7).
  - Sweep README feature listings (that is Mode B — P1.M1.T3.S1, which
    confirms the feature bullet at root README:584 / react README:440).
  - Edit any runtime/source file, the root `README.md`, or `packages/core`.
- **Parallel-safe with S1**: S1 edits `Field.tsx` (runtime) + adds a proof
  test. S2 (this) edits `overlays.ts` (JSDoc prose only) + `react/README.md`
  (prose only). No file overlap on the *edited regions*: S1 does not touch
  the FormalityFieldComponentProps JSDoc. (Both touch `overlays.ts` only if
  S1 were to re-type — it explicitly does not. The type body is untouched by
  both.) Coordinate that the JSDoc edit here does not collide with any S1
  change to the same lines; S1's PRP scopes it out of the JSDoc entirely.

## What

### The two edits

**Edit A — `packages/react/src/overlays.ts`** (JSDoc, inside the
`FormalityFieldComponentProps` block):

- **Line 148** (back-reference): rewrite so it no longer says the type
  "codifies ahead of the runtime wiring." The runtime now matches.
- **Lines 167–174** ("Runtime caveat (important)." paragraph): remove the
  "FUTURE runtime task" / "out of scope for this type-only change" wording
  (lines 171–173). State that `forwardRef` is delivered at runtime as a
  top-level prop by `<Field>`. KEEP the wrap/ref-as-prop migration guidance
  (167–170 head) and the "stop hand-rolling `WithFormality<P>`" closer (174).

**Edit B — `packages/react/README.md`** (the section's caveat copy):

- **Lines 609–615** ("Runtime caveat (important)." paragraph): remove the
  "future runtime task" wording (lines 612–613 tail). State forwardRef is
  delivered at runtime as a top-level prop. KEEP the wrap/ref-as-prop
  guidance (609–612 head) and the "stop hand-rolling `WithFormality`" closer
  (614–615). NOTE: wording differs from overlays.ts ("bare function
  component", "future runtime task;" semicolon, backticked `Field`) — the
  edit MUST be file-specific, not one global find/replace.

### Success Criteria

- [ ] overlays.ts "Runtime caveat" paragraph: no "FUTURE runtime task" /
      "out of scope for this type-only change" wording remains.
- [ ] overlays.ts "Runtime caveat" paragraph: states `forwardRef` is
      delivered at runtime as a top-level prop by `<Field>`.
- [ ] overlays.ts line 148 back-reference: no longer claims the type is
      "ahead of" the runtime.
- [ ] overlays.ts: "Destructure before forwarding." guidance + MUI v9
      `slotProps` note + `WithFormality` closer all KEPT.
- [ ] README.md caveat paragraph (609–615): same correction, file-specific
      wording.
- [ ] README.md: section header (558), Before/After type docs (558–595),
      Destructure/Wiring guidance (596–607), and `WithFormality` closer all KEPT.
- [ ] `FormalityFieldComponentProps` type body (overlays.ts:179–188) UNCHANGED.
- [ ] No runtime/source file, root README, or core file edited.
- [ ] `pnpm typecheck` green; `pnpm lint` clean.

## All Needed Context

### Context Completeness Check

_Pass._ The architecture report
(`plan/003_de060244cb57/architecture/docs_to_update.md`) provides verbatim
quotes with exact line numbers for both target regions, the KEEP regions,
and the cross-reference risk. Live source was re-verified during PRP
creation (line numbers match exactly: overlays.ts caveat at 167–174,
back-ref at 148; README caveat at 609–615). The implementing agent needs
only to re-confirm line numbers (they may shift if S1 lands first) and
make the two prose edits.

### Documentation & References

```yaml
# MUST READ
- url: PRD §20.7 (heading:h3.101) — "Documentation update"
  why: Authoritative instructions for this exact subtask.
  critical: "Remove the 'Runtime caveat (important)' paragraph and all 'future runtime task' /
             'out of scope for this type-only change' wording. State that forwardRef is delivered
             at runtime as a top-level prop by <Field>. KEEP 'Destructure before forwarding' +
             MUI v9 slotProps note. Out of scope: state/formState injection, re-typing the type."

- url: PRD §20.1 (heading:h3.95) — "Requirement (the change)"
  why: Describes the runtime change (S1) whose truth this doc sync reflects.
  critical: "After this change forwardRef is a regular, enumerable prop on finalProps… React no
             longer intercepts it as a special key." ← this is what the docs must now say.

- url: PRD §20.4 (heading:h3.98) — "Backward compatibility & migration"
  why: The forwardRef-EXCLUSIVE decision + the React.forwardRef / React 19 ref-as-prop migration
        guidance that the KEPT portion of the caveat summarizes.
  critical: The wrap/ref-as-prop migration guidance STAYS in the docs (it's still valid for
            consumers migrating from the old special-ref-key behavior).

- url: PRD §5.3.8 (heading:h4.36) — "Template Rendering"
  why: Cross-reference target for the MUI v9 slotProps note ("(PRD §5.3.8)" / "(cross-ref §5.3.8)").

- docfile: plan/003_de060244cb57/architecture/docs_to_update.md
  why: Verified docs-state map with VERBATIM quotes + exact line numbers for BOTH target regions,
        BOTH KEEP regions, the back-reference risk (overlays.ts:148), and the wording-asymmetry
        warning between the two files.
  section: "§1 (overlays.ts JSDoc), §2 (react README), §3 (root README — no edit), Summary table"
  critical: "Wording asymmetry: overlays.ts uses 'FUTURE runtime task (out of scope for this
             type-only change)'; README uses 'a future runtime task;' (semicolon, no 'out of scope').
             Any find/replace MUST be file-specific."

# PARALLEL-EXECUTION CONTEXT (S1 is being implemented concurrently)
- file: plan/003_de060244cb57/P1M1T1S1/PRP.md
  section: "Goal + Anti-Patterns (overlays.ts JSDoc = P1.M1.T1.S2)"
  why: S1 ships the runtime change (Field.tsx coreProps ref → forwardRef) that makes these docs
        true. S1 EXPLICITLY does NOT edit the FormalityFieldComponentProps JSDoc (it scopes that
        to S2 = this subtask). Treat S1's runtime output as the input truth: forwardRef IS now
        delivered at runtime as a top-level enumerable prop by <Field>.
  critical: "S1's PRP anti-pattern list: 'Don't edit overlays.ts JSDoc or any README — those are
             P1.M1.T1.S2 / P1.M1.T3.S1.' → confirms this subtask owns exactly these doc regions."

- file: packages/react/src/overlays.ts
  section: "JSDoc lines 139–178; type body 179–188"
  why: EDIT region = lines 148 (back-ref) + 167–174 (caveat). KEEP region = 139–147, 149–166, 175–188.
  pattern: "JSDoc block with **bold** lead-ins: 'Destructure before forwarding.', 'Wiring forwardRef...', 'Runtime caveat (important).'"
  gotcha: "Line 148 forward-links to '\"Runtime caveat\" below' — after rewriting the caveat, ensure
           the link target still exists (the paragraph header must remain recognizable) OR adjust 148
           so it doesn't dangle. The back-reference itself must stop claiming 'ahead of the runtime wiring'."

- file: packages/react/README.md
  section: "Section header 558; caveat 609–615; next section '## Utilities' at 617"
  why: EDIT region = lines 609–615 only. KEEP region = 558–607, 614–615 closer.
  pattern: "Markdown **bold** lead-in '**Runtime caveat (important).**' followed by prose."
  gotcha: "Wording DIFFERS from overlays.ts: README says 'bare function component', 'a future runtime
           task;' (semicolon), backticked `Field`. Do NOT copy the overlays.ts wording verbatim —
           edit the README's own sentences in place."

- file: README.md   # repo root
  section: "Line 584 (feature bullet only)"
  why: VERIFIED to contain NO caveat prose and NO 'forwardRef'/'Runtime caveat'/'future runtime task'
        strings. Needs NO edit. (The Mode B sweep in P1.M1.T3.S1 confirms the feature listing here.)
  gotcha: "Do NOT edit the root README in this subtask — it has no stale caveat to fix."
```

### Current Codebase tree (relevant slice)

```bash
packages/
  react/
    src/
      overlays.ts          # ← EDIT: JSDoc back-ref (148) + caveat (167–174). Type body 179–188 UNCHANGED.
      components/
        Field.tsx          # S1's territory (runtime) — DO NOT TOUCH here
    README.md              # ← EDIT: caveat paragraph (609–615) only
README.md                  # root — VERIFIED no caveat prose; DO NOT TOUCH (Mode B = P1.M1.T3.S1)
```

### Desired Codebase tree with files to be added

```bash
packages/react/
  src/overlays.ts          # MODIFIED — JSDoc prose only (2 regions: line 148, lines 167–174)
  README.md                # MODIFIED — caveat prose only (lines 609–615)
# (no new files; no type-body changes; no runtime changes; no root README changes)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (wording asymmetry): The two files use DIFFERENT phrasing for the same caveat.
//   overlays.ts (171–173): "Making Field deliver it as a top-level `forwardRef` key for bare
//                            components is a FUTURE runtime task (out of scope for this type-only
//                            change)."
//   README.md  (612–613):  "Making `Field` deliver a top-level `forwardRef` key for bare components
//                            is a future runtime task; the"
// A single global find/replace will MISS one or corrupt the other. Edit each file IN PLACE,
// matching its own sentences.

// CRITICAL (dangling back-reference): overlays.ts line 148 currently reads:
//   "...codifies ahead of the runtime wiring (see \"Runtime caveat\" below)."
// Two problems after S1: (1) "ahead of the runtime wiring" is now FALSE (runtime matches);
// (2) if the caveat paragraph header is renamed, the "(see ...)" link dangles.
// FIX: rewrite 148 so it no longer claims "ahead of", and ensure the "(see ...)" target still
// matches whatever header the rewritten caveat uses (simplest: keep a recognizable "Runtime
// note"-style header, or drop the parenthetical forward-link if the caveat no longer needs it).

// CRITICAL (KEEP regions): Do NOT touch, in either file:
//   - The "Destructure before forwarding." guidance + its code fence.
//   - The MUI v9 `slotProps={{ input: { ref: forwardRef } }}` note (and its PRD §5.3.8 cross-ref).
//   - The "stop hand-rolling `WithFormality`" closer sentence.
//   - The type body (overlays.ts:179–188) — it is ALREADY correct.
//   - README section header (558), Before/After type docs (558–595), Destructure/Wiring (596–607).

// GOTCHA (line drift): S1 may land its Field.tsx edit (and proof test) before this subtask runs.
// That does NOT shift overlays.ts or README.md line numbers (S1 touches neither edited region).
// Still, re-confirm line numbers with a quick grep before editing:
//   grep -n "Runtime caveat" packages/react/src/overlays.ts packages/react/README.md

// GOTCHA (no typecheck impact): JSDoc/Markdown edits do not affect tsc output. `pnpm typecheck`
// is a sanity gate (catches accidental damage to the type body or surrounding code), not a
// proof of the prose change. The real proof is reading the rendered diff.

// GOTCHA (eslint on JSDoc): the react package's eslint config may include JSDoc rules. Keep the
// rewritten JSDoc well-formed (balanced `*` comment markers, no stray `*/`). `pnpm lint` will catch
// issues.
```

## Implementation Blueprint

### Data models and structure

No data models. No type changes. Pure prose edits in two files.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY current state (re-confirm line numbers + verbatim text)
  - GREP: `grep -n "Runtime caveat" packages/react/src/overlays.ts packages/react/README.md`
    → expect overlays.ts:167 and README.md:609.
  - READ overlays.ts lines 139–178 (full JSDoc) and 179–188 (type body — confirm untouched).
  - READ packages/react/README.md lines 558–616 (full section).
  - CONFIRM the root README has no caveat: `grep -n "Runtime caveat\|future runtime task" README.md`
    → expect NO matches (verified; do not edit root README).
  - WHY: Guard against line drift and confirm the KEEP/EDIT boundaries before touching prose.

Task 2: EDIT packages/react/src/overlays.ts — the "Runtime caveat" paragraph (167–174)
  - REPLACE the paragraph (167–174) with a corrected version that:
      (a) KEEPS a bold lead-in (e.g. "**Runtime delivery (important).**" or keep
          "**Runtime caveat (important).**" if you keep the header — see gotcha on line 148).
      (b) STATES that `<Field>` now delivers `forwardRef` at runtime as a regular, top-level,
          enumerable prop (no `React.forwardRef` wrap required for plain function components).
      (c) REMOVES all "FUTURE runtime task" / "out of scope for this type-only change" wording.
      (d) PRESERVES the migration note for consumers coming from the old special-`ref`-key
          behavior: a `React.forwardRef`-wrapped component should consume `props.forwardRef`
          (option A/B per PRD §20.4), and under React 19 ref-as-prop consumers use `forwardRef`.
      (e) PRESERVES the closer: "...so consumers stop hand-rolling a lossy `WithFormality<P>`."
  - DO NOT touch lines 139–166 (Destructure + slotProps guidance) or 175–188 (@template + type body).
  - SUGGESTED replacement text (adapt as needed; keep JSDoc ` * ` prefixes):
      ` * **Runtime delivery (important).** \`<Field>\` delivers RHF's ref as a regular,`
      ` * top-level, enumerable prop named \`forwardRef\` — no \`React.forwardRef\` wrap is`
      ` * required for a plain function component that destructures \`forwardRef\` and wires`
      ` * it to the inner input (\`ref={forwardRef}\`). Consumers migrating off the old`
      ` * React-special \`ref\` key: a \`React.forwardRef\`-wrapped component should consume`
      ` * \`props.forwardRef\` (see PRD §20.4), and under React 19 ref-as-prop use \`forwardRef\``
      ` * directly. The type ships the intended contract so consumers stop hand-rolling a`
      ` * lossy \`WithFormality<P>\`.`

Task 3: EDIT packages/react/src/overlays.ts — the back-reference at line 148
  - REWRITE line 148 so it no longer claims the type "codifies ahead of the runtime wiring."
  - The sentence currently spans 145–148; adjust minimally so the meaning becomes: the three
    members (`formState`, `state`, `forwardRef`) ARE the injected-props contract, and `forwardRef`
    is now delivered at runtime (cross-link to the rewritten paragraph if you keep a "(see ...)" link,
    ensuring the link target matches the new header from Task 2).
  - DO NOT alter the factual claims about `formState` (reaches templates/render-prop children) or
    `state` (subscribed field state) — only the "ahead of the runtime wiring" / forwardRef framing.
  - GOTCHA: if Task 2 renamed the paragraph header away from "Runtime caveat", update or remove the
    `(see "Runtime caveat" below)` parenthetical so it doesn't dangle.

Task 4: EDIT packages/react/README.md — the caveat paragraph (609–615)
  - REPLACE the paragraph (609–615) with a corrected version using the README's own voice:
      (a) KEEPS a bold lead-in ("**Runtime delivery (important).**" or keep "**Runtime caveat...**").
      (b) STATES `<Field>` delivers `forwardRef` at runtime as a top-level prop (no wrap required
          for plain function components).
      (c) REMOVES "Making `Field` deliver a top-level `forwardRef` key for bare components is a
          future runtime task;" (lines 612–613).
      (d) PRESERVES the migration guidance head (609–612): React.forwardRef wrap / React 19
          ref-as-prop consumers.
      (e) PRESERVES the closer (614–615): "the type ships the **intended contract now** so
          consumers can stop hand-rolling `WithFormality`."
  - DO NOT touch lines 558–607 (header, Before/After type docs, Destructure, Wiring, slotProps fence).
  - NOTE: edit the README's sentences in place — do NOT paste the overlays.ts wording (it won't
    match the README's style/voice).

Task 5: VALIDATION (doc-only, but run the gates to catch accidental damage)
  - RUN: `pnpm typecheck` (root tsc — catches accidental type-body/code damage in overlays.ts).
  - RUN: `pnpm lint` (catches malformed JSDoc / markdown issues if configured).
  - RUN: `pnpm format` (prettier — may reflow markdown; review the diff).
  - EXPECT: green. typecheck/lint are sanity gates; the real proof is reading the rendered prose.

Task 6: SCOPE-LEAK CHECK
  - RUN: `git diff --stat` → expect EXACTLY two files:
        packages/react/src/overlays.ts
        packages/react/README.md
  - RUN: `git diff --exit-code packages/react/src/components/Field.tsx README.md packages/core`
    → expect exit 0 (untouched). Field.tsx is S1's territory; root README + core are out of scope.
  - RUN: `git diff packages/react/src/overlays.ts | grep -E '^\+|^-' | grep -iE 'forwardRef|Runtime|future|WithFormality'`
    → confirm the diff touches ONLY the intended prose (no type-body lines, no Destructure/slotProps lines).
  - EXPECT: clean, minimal, prose-only diff.
```

### Implementation Patterns & Key Details

```typescript
// overlays.ts — Task 2 replacement (JSDoc; keep the leading ` * ` on every line):

// BEFORE (167–174):
//  * **Runtime caveat (important).** Today `Field` delivers the RHF ref via the
//  * React-special `ref` key (not a top-level `forwardRef` prop). To receive it
//  * as `forwardRef` on a plain function component WITHOUT a `React.forwardRef`
//  * wrap, either (a) wrap your component with `React.forwardRef`, or (b) target
//  * React 19's ref-as-prop. Making Field deliver it as a top-level `forwardRef`
//  * key for bare components is a FUTURE runtime task (out of scope for this
//  * type-only change). The type ships the intended contract now so consumers
//  * stop hand-rolling a lossy `WithFormality<P>`.

// AFTER (suggested):
//  * **Runtime delivery (important).** `<Field>` delivers RHF's ref as a regular,
//  * top-level, enumerable prop named `forwardRef` — no `React.forwardRef` wrap
//  * is required for a plain function component that destructures `forwardRef`
//  * and wires it to the inner input (`ref={forwardRef}`). Consumers migrating
//  * off the old React-special `ref` key: a `React.forwardRef`-wrapped component
//  * should consume `props.forwardRef` (PRD §20.4), and under React 19
//  * ref-as-prop use `forwardRef` directly. The type ships the intended contract
//  * so consumers stop hand-rolling a lossy `WithFormality<P>`.

// overlays.ts — Task 3 back-reference fix (line 145–148 region):

// BEFORE (145–148):
//  * members below are the **intended injected-props contract**: `formState`
//  * today reaches templates and render-prop children; `state` (subscribed field
//  * state) and a top-level `forwardRef` key are part of the contract this type
//  * codifies ahead of the runtime wiring (see "Runtime caveat" below).

// AFTER (suggested — drop "ahead of the runtime wiring"; fix the forward-link):
//  * members below are the **injected-props contract**: `formState` reaches
//  * templates and render-prop children; `state` (subscribed field state) and a
//  * top-level `forwardRef` key are delivered at runtime by `<Field>` (see
//  * "Runtime delivery" below).

// README.md — Task 4 replacement (markdown prose; the README's own voice):

// BEFORE (609–615):
// **Runtime caveat (important).** Today `Field` delivers the RHF ref via the
// React-special `ref` key, **not** a top-level `forwardRef` prop. To receive it
// as `forwardRef` on a bare function component, either wrap your component with
// `React.forwardRef`, or target React 19's ref-as-prop. Making `Field` deliver a
// top-level `forwardRef` key for bare components is a future runtime task; the
// type ships the **intended contract now** so consumers can stop hand-rolling
// `WithFormality`.

// AFTER (suggested):
// **Runtime delivery (important).** `<Field>` delivers the RHF ref as a regular,
// top-level `forwardRef` prop — no `React.forwardRef` wrap is required for a
// plain function component that destructures `forwardRef` and wires it to the
// inner input (`ref={forwardRef}`). Consumers migrating off the old React-special
// `ref` key: a `React.forwardRef`-wrapped component should consume
// `props.forwardRef` (PRD §20.4), and under React 19 ref-as-prop use `forwardRef`
// directly. The type ships the **intended contract** so consumers can stop
// hand-rolling `WithFormality`.

// PATTERN: keep each file's existing voice/format (JSDoc ` * ` prefixes vs. markdown prose).
// GOTCHA:  do NOT copy one file's wording into the other verbatim — edit each in place.
// CRITICAL: the type body (overlays.ts:179–188) is UNCHANGED. The Destructure + slotProps
//           guidance in BOTH files is UNCHANGED.
```

### Integration Points

```yaml
DATABASE: none
CONFIG: none
ROUTES: none
RUNTIME: none (doc-only).
PUBLIC API: none changed. FormalityFieldComponentProps type body (overlays.ts:179–188) UNCHANGED.
DOCS:
  - overlays.ts FormalityFieldComponentProps JSDoc: caveat rewritten + back-ref fixed (this subtask).
  - packages/react/README.md FormalityFieldComponentProps section: caveat rewritten (this subtask).
  - root README.md feature bullet (line 584): NO edit (Mode B sweep = P1.M1.T3.S1).
TESTS: none (doc-only; no behavior change to test).
PARALLEL-SAFE:
  - S1 edits Field.tsx (runtime) + proof test; S2 edits overlays.ts JSDoc + react README prose.
  - S1's PRP explicitly scopes OUT the FormalityFieldComponentProps JSDoc (→ this subtask).
  - No edited-region overlap. Coordinate only that both don't reflow the same markdown header.
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After editing overlays.ts (Tasks 2/3) and README.md (Task 4)
pnpm --filter @formality-ui/react exec tsc --noEmit   # sanity: no accidental code/type damage
pnpm format                                          # prettier — review any markdown reflow
pnpm lint                                            # eslint — catch malformed JSDoc if configured

# Expected: Zero errors. typecheck/lint are sanity gates (doc edits shouldn't affect them);
# the real correctness check is reading the rendered prose diff.
```

### Level 2: Typecheck & Build (System Validation — sanity only)

```bash
# Root typecheck — project references (core + react). Confirms no code/type damage.
pnpm typecheck
# Expected: green. If this fails, you accidentally touched the type body or surrounding code — revert
# those lines and keep ONLY the JSDoc prose edits.

# (No build needed — dist/ carries no JSDoc/README prose that consumers import. Skip unless CI requires it.)
```

### Level 3: Prose Verification (the actual proof — domain-specific)

```bash
# Confirm NO stale wording remains in either file:
grep -niE "future runtime task|out of scope for this type-only change|ahead of the runtime" \
  packages/react/src/overlays.ts packages/react/README.md
# Expected: NO matches. Any match = a stale phrase was missed.

# Confirm the new truth is present in both files:
grep -niE "delivers.*forwardRef.*top-level|forwardRef.*delivered at runtime|no.*React\.forwardRef.*wrap.*required" \
  packages/react/src/overlays.ts packages/react/README.md
# Expected: at least one match per file.

# Confirm the KEEP guidance is still present:
grep -ni "Destructure before forwarding" packages/react/src/overlays.ts packages/react/README.md
grep -ni "slotProps={{ input: { ref: forwardRef } }}" packages/react/src/overlays.ts packages/react/README.md
grep -ni "WithFormality" packages/react/src/overlays.ts packages/react/README.md
# Expected: matches in both files for each (Destructure, slotProps, WithFormality closer).

# Confirm the type body is UNCHANGED:
sed -n '179,188p' packages/react/src/overlays.ts
# Expected: identical to the verified baseline (state?, formState?, forwardRef?: RefCallBack).
```

### Level 4: Scope Verification

```bash
# Confirm exactly two files changed:
git diff --stat
# Expected: packages/react/src/overlays.ts AND packages/react/README.md. Nothing else.

# Confirm out-of-scope files are untouched:
git diff --exit-code packages/react/src/components/Field.tsx README.md packages/core
# Expected: exit 0 (Field.tsx = S1; root README + core = out of scope).

# Confirm the overlays.ts diff touches ONLY prose (no type-body lines):
git diff packages/react/src/overlays.ts
# Expected: changes only within the JSDoc comment block (lines ~148 and ~167–174); the `export type`
# declaration and its members are unchanged.
```

## Final Validation Checklist

### Technical Validation

- [ ] `pnpm typecheck` green (sanity — no code/type damage).
- [ ] `pnpm lint` clean.
- [ ] `git diff --stat` shows EXACTLY two files: `packages/react/src/overlays.ts` + `packages/react/README.md`.

### Feature Validation

- [ ] overlays.ts: no "FUTURE runtime task" / "out of scope for this type-only change" wording remains.
- [ ] overlays.ts: states `forwardRef` is delivered at runtime as a top-level prop by `<Field>`.
- [ ] overlays.ts line 148: no longer claims "ahead of the runtime wiring"; forward-link not dangling.
- [ ] README.md: same correction (file-specific wording).
- [ ] `grep -niE "future runtime task|out of scope for this type-only change|ahead of the runtime"` → no matches in either file.
- [ ] KEEP verified: "Destructure before forwarding", MUI v9 `slotProps` note, `WithFormality` closer in BOTH files.
- [ ] `FormalityFieldComponentProps` type body (overlays.ts:179–188) UNCHANGED.
- [ ] Root README, Field.tsx, packages/core all untouched.

### Code Quality Validation

- [ ] Each file edited in its own voice (no verbatim cross-paste).
- [ ] JSDoc comment markers balanced (` * `, closing `*/` intact).
- [ ] Minimal, surgical prose diff — no incidental reflow outside the target paragraphs.
- [ ] Back-reference (overlays.ts:148) and caveat header naming are consistent (no dangling link).

### Documentation & Deployment

- [ ] Docs now match the shipped runtime behavior (the whole point of this subtask).
- [ ] No new env vars, config, or runtime code.
- [ ] Mode A docs ride complete; Mode B feature-listing sweep remains P1.M1.T3.S1.

---

## Anti-Patterns to Avoid

- ❌ Don't use ONE global find/replace for both files — their wording differs (asymmetry verified); edit each in place.
- ❌ Don't touch the `FormalityFieldComponentProps` type body (overlays.ts:179–188) — it's already correct.
- ❌ Don't touch the "Destructure before forwarding" guidance, the MUI v9 `slotProps` note, or the `WithFormality` closer — KEEP them in both files.
- ❌ Don't edit the root `README.md` — it has NO caveat prose (verified); its feature bullet is Mode B (P1.M1.T3.S1).
- ❌ Don't edit `Field.tsx`, `packages/core`, or any runtime/source file — those are S1's territory / out of scope.
- ❌ Don't leave the overlays.ts:148 back-reference claiming "ahead of the runtime wiring" or pointing at a renamed/dangling header.
- ❌ Don't re-type or re-document `state`/`formState` injection semantics — explicitly out of scope per PRD §20.7.
- ❌ Don't add tests — this is doc-only; there is no behavior change to test.
- ❌ Don't skip the prose-verification greps (Level 3) — typecheck/lint cannot prove the wording changed; only greps + reading the diff can.

---

## Confidence Score

**9/10** — one-pass success likelihood.

Rationale: This is a tightly scoped, doc-only edit to two prose regions whose
verbatim text and exact line numbers are confirmed in the architecture
report AND re-verified against live source during PRP creation (overlays.ts
caveat at 167–174, back-ref at 148; README caveat at 609–615). The KEEP
regions are enumerated precisely. The only residual risks are (a) wording-
asymmetry between the two files (mitigated by the explicit file-specific
edit instructions + the asymmetry callout), (b) a dangling back-reference
at overlays.ts:148 (mitigated by Task 3 + the gotcha), and (c) possible
line drift if S1 lands first (mitigated by Task 1's grep re-confirmation —
though S1 touches neither edited region, so drift is unlikely). The 1-point
deduction accounts for the inherent subjectivity of prose rewriting (the
implementer's phrasing may differ from the suggested text, which is fine as
long as it satisfies the success criteria).
