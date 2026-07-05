# Implementation Issue Feedback (Attempt 1/3)

The previous implementation attempt encountered an issue that requires re-planning.

## Issue Details

Task 0 PRECONDITION FAILED — halting before any README edit, per the PRP's explicit failure protocol.\n\nWHAT I FOUND:\nRunning the PRP's Task 0 gate:\n  grep -nE \

## Full Agent Output

Confirmed. The `typecheck:examples` **script** exists in `package.json` (line 14), but the CI workflow does **not** invoke it. Per the PRP's explicit Task 0 failure protocol, I am HALTING and not editing either README.

```json
{
  "result": "issue",
  "message": "Task 0 PRECONDITION FAILED — halting before any README edit, per the PRP's explicit failure protocol.\n\nWHAT I FOUND:\nRunning the PRP's Task 0 gate:\n  grep -nE \"pnpm (test:coverage|typecheck:examples)\" .github/workflows/ci.yml\nreturns ONLY:\n  38:      - run: pnpm test:coverage\n\nThe `pnpm typecheck:examples` step is MISSING from the `verify` job in .github/workflows/ci.yml. Only `pnpm test:coverage` is present. (Confirmed: count of `typecheck:examples` in ci.yml = 0.)\n\nWHY THIS BLOCKS THE TASK:\nThe PRP declares this task runs LAST and depends on P1.M2.T3.S1, whose Mode-A deliverable is adding the `pnpm typecheck:examples` step to ci.yml. That dependency has NOT landed. The PRP's Task 0 states verbatim: 'If either [ci.yml step] is missing, STOP — the prose would describe a CI that doesn't exist. Do NOT edit READMEs until both hold.' The Anti-Patterns section reiterates: 'Don't proceed if Task 0 fails (a required ci.yml step missing)... flag the dependency gap instead.'\n\nThe two prose insertions this task is supposed to make both claim that CI runs `pnpm typecheck:examples`:\n  - README.md §Testing:  '...the examples type-check (pnpm typecheck:examples)...'\n  - packages/react/README.md §Testing & Coverage: '...it also runs pnpm typecheck:examples to keep the shipped examples type-clean.'\nWriting those now would violate the PRP's core honesty contract (§3c) and Success Criterion #2 — 'Every claim made in the new prose is literally true of the post-changeset .github/workflows/ci.yml (no fabricated scripts/thresholds/behaviors).' The `typecheck:examples` invocation is currently a fabricated CI behavior.\n\nWHAT I DID NOT DO (scope discipline):\n- Did NOT edit README.md or packages/react/README.md.\n- Did NOT edit ci.yml (out of my scope — owned by P1.M1.T1.S1/P1.M2.T3.S1; READMEs are my only edit surface).\n- Did NOT modify any workflow, package.json, vitest.config.ts, examples/, packages/, or PRD.md.\n- git diff is clean — no files changed.\n\nRESOLUTION REQUIRED:\nP1.M2.T3.S1 must land first (add `- run: pnpm typecheck:examples` to the `verify` job in .github/workflows/ci.yml, plus its README §Scripts table row). Once both `pnpm test:coverage` AND `pnpm typecheck:examples` appear in ci.yml, re-run this task — the Task 0 gate will then pass and the two prose insertions can be made safely in one pass.\n\nNote: the `typecheck:examples` SCRIPT itself exists in package.json (line 14: 'tsc -p examples/tsconfig.json --noEmit'); only its CI invocation is missing."
}
```

## Instructions

Review this feedback and create a revised PRP that addresses the issue.
If the issue is fundamentally impossible to resolve, output `"result": "fail"` with an explanation.
