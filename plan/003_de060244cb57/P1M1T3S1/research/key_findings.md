# P1.M1.T3.S1 — Key Research Findings (Mode B overview sweep)

Review-only scout findings for the changeset-level OVERVIEW doc sweep. All
verbatim against the live working tree on 2026-07-06. **No source edits made.**

## TL;DR

The overview/feature-listing framing for `FormalityFieldComponentProps` is
**already accurate** in both READMEs. No overview sentence implies forwardRef
is type-only / not-yet-runtime-backed / "coming soon". The per-symbol caveat
prose (the ONLY place that ever carried stale "future runtime task" wording)
is owned by **P1.M1.T1.S2 (Mode A)** and has **already landed** in the working
tree (`packages/react/README.md:609` now reads
`**Runtime delivery (important).**`). This task's most likely outcome is
**NO edit; record the decision in the PR description.** But the implementing
agent makes the final call per SOW §5.

## 1. Root `README.md` — the SINGLE overview mention

Grep confirms `FormalityFieldComponentProps` / `forwardRef` /
`type-only` / `future runtime` / `coming soon` / `ahead of` appear in the root
README at **EXACTLY ONE location** (lines 584–585):

```
584: - **`FormalityFieldComponentProps<P>`** — the shipped injected-props type,
585:   replacing the hand-rolled lossy `WithFormality<P>`.
```

This is a bullet in the `## Type Safety` feature list (header at line 571),
ending with a pointer to the React package README (line 588).

**Accuracy assessment:** "the shipped injected-props type" is factually correct
— it IS a type, and it IS shipped (in 0.1.0 by T3.1). It is **silent on
runtime delivery** (it describes only the type, not the runtime behavior).
Silence ≠ stale framing: it does NOT claim forwardRef is type-only or
not-yet-runtime-backed, and contains no "future"/"coming soon"/"ahead of"
wording. → **Accurate. No edit needed.**

## 2. `packages/react/README.md` — overview mentions (NOT the caveat block)

All `FormalityFieldComponentProps` / `forwardRef` / overview mentions, mapped:

| Line | Content | Owner | Stale? |
|------|---------|-------|--------|
| 440 | `FormalityFieldComponentProps,` (inside an `import type { ... }` code fence) | Mode B (overview) | No — import example only; no framing claim |
| 455–460 | `## Type Safety` intro: "...It also ships a precise type for the props Formality **injects** onto your field components, so you can stop hand-rolling a lossy `WithFormality<P>` helper." | Mode B (overview) | No — explicitly says Formality "injects" the props (affirms runtime) |
| 576 | `**After — the shipped precise type:**` (code-block caption) | Mode B (overview) | No — accurate ("shipped precise type") |
| 558 | `### Field component props: \`FormalityFieldComponentProps\`` (section header) | Mode B (overview) | No — neutral header |
| 561–563 | "`FormalityFieldComponentProps<P>` is the **precise** type for that contract — replacing the lossy `WithFormality<P>`" | Mode B (overview) | No — accurate |
| 596–606 | Destructure + Wiring + MUI v9 `slotProps` guidance | Mode B (overview) | No — still valid |
| **609–616** | `**Runtime delivery (important).**` caveat paragraph | **Mode A (S2)** — ALREADY REWRITTEN | No — S2 landed the fix; now states `<Field>` delivers forwardRef at runtime |

**Note:** lines 556 ("those types is a follow-up; `defineInputs` is the opt-in
entry point") is about the `defineInputs`/`InputType` FOLLOW-UP, NOT about
forwardRef — out of scope for this task.

**Accuracy assessment:** Every Mode-B-overview mention is accurate. The
strongest one (line 458) actually **affirms** runtime injection ("the props
Formality injects onto your field components"). The stale "future runtime task"
wording that ever existed was confined to the **caveat paragraph (609–615)**,
which is **S2's Mode A territory** and has **already been rewritten** in the
working tree. → **No Mode-B overview edit needed.**

## 3. Scope boundary — what is NOT this task

- **Per-symbol caveat prose** (overlays.ts JSDoc 167–174; react README
  609–616) = **P1.M1.T1.S2 (Mode A)**. Already landed. Do NOT touch these —
  that would duplicate S2's work.
- **The type body** (overlays.ts:179–188) = already correct; out of scope.
- **Runtime/source files** (Field.tsx, core) = S1/T2 territory; out of scope.
- **`defineInputs`/`InputType` follow-up framing** (react README:556) = a
  different feature's follow-up; out of scope.

## 4. The decision the implementing agent must make (per SOW §5)

Re-read the overview mentions above and apply this rubric:

- **STALE (edit required)** = any overview sentence implies forwardRef is
  type-only / not-yet-runtime-backed / "coming soon" / "future" / "ahead of
  runtime".
- **ACCURATE (no edit)** = the sentence is silent on runtime (just describes
  the type) OR explicitly affirms runtime delivery.

From this scout's verification, ALL overview mentions are ACCURATE → **no
edit**; record the decision ("verified accurate, no overview wording implies
forwardRef is type-only; caveat prose was Mode A / S2") in the PR description.

If (unexpectedly) the implementer finds a stale overview sentence, edit it
minimally to state that `<Field>` delivers `forwardRef` at runtime as a
top-level prop — and coordinate with S2 if it lives in `packages/react/README.md`
(file overlap), since S2 is also editing that file.
