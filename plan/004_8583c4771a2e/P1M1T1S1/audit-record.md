# Audit Record — P1.M1.T1.S1

**Subtask:** P1.M1.T1.S1 — Audit runtime implementation in `Form.tsx` against
PRD §11.1–§11.3 (scoped-gate + coalescing spec).
**Target file:** `packages/react/src/components/Form.tsx` (879 lines at audit time)
**Audit mode:** READ-ONLY (no code change — see `git diff` confirmation at end)
**Audited against:** PRD §11.1 (point 4 — scoped validity gate), §11.2
(`executeAutoSave` + `changeField`), §11.3 (Example 4 — coalescing-by-interval)

---

## Outcome: no drift, already ships

All four specified behaviors are present in the current source and match the
PRD spec. Every citation below uses a **current** line number (each symbol was
re-located with `grep -n` at audit time; the file is 879 lines, matching the
research-time size). No gap was found, so no code was modified.

The downstream consumers may proceed:
- **P1.M1.T1.S2** (test audit) — the four behaviors below are the coverage targets.
- **P1.M1.T2.S1** (doc sweep) — runtime is confirmed; docs may be edited to match.

---

## Symbol re-location (Task 1)

`grep -n` against `packages/react/src/components/Form.tsx` (879 lines):

| Symbol | Current line |
|---|---|
| `invertedSubscriptions` (decl) | 202 |
| `pendingChangedFields` (decl) | 215 |
| `pendingAffectedFields` (decl) | 216 |
| `executionVersionRef` (decl) | 218 |
| `fieldDebouncersRef` (decl) | 225 |
| `getOrCreateDebouncedRef` (decl) | 228 |
| `getAffectedFields` (def) | 338 |
| `changeField` (def) | 358 |
| `executeAutoSave` (def) | 549 |
| `getOrCreateDebounced` (def) | 650 |

---

## Behavior 1 — Scoped validity gate (PRD §11.1 point 4)

**Status:** ✅ MATCHES

**PRD requirement:** "Validity is scoped to what this save can touch… Whole-form
validity is still enforced on a full manual submit." An unrelated invalid field
must NOT block a valid edit. No whole-form validity check.

**Location:** `packages/react/src/components/Form.tsx:549-631` (`executeAutoSave`)

### Gate 1 — changed-field `onChange` error check (Form.tsx:585-591)
The loop over `changedFields` checking `methods.getFieldState(name).error` and
returning early:
```ts
585:    for (const fieldName of changedFields) {
586:      const fieldState = methods.getFieldState(fieldName as any);
587:      if (fieldState.error) {
588:        // Changed field has validation error, don't submit
589:        return;
590:      }
591:    }
```

### Gate 2 — affected-field revalidation via `methods.trigger` (Form.tsx:594-616)
`fieldsToTrigger` is **affected-only** (`[...affectedFields]`, declared at 562 —
explicitly "Only affected, not changed"). `methods.trigger` is called WITH args
(scoped), then returns if `!isValid`:
```ts
594:    if (fieldsToTrigger.length > 0) {
595:      const isValid = await methods.trigger(fieldsToTrigger as any);
...
603:      if (!isValid) {
604:        // Validation failed, don't submit
605:        return;
606:      }
```

### Explicit "no whole-form check" — comment block (Form.tsx:623-629)
```ts
623:    // NOTE: we intentionally do NOT bail on whole-form errors here. The checks
624:    // above already validate exactly the fields this save can touch (changed
625:    // fields via onChange + affected fields via trigger()). Rejecting on *any*
626:    // unrelated field's error would silently drop a valid edit — e.g. editing
627:    // `notes` while an unrelated required `email` is empty — so the user's
628:    // change would sit unsaved with no feedback. Whole-form validity is still
629:    // enforced on a full manual submit. See autosave Issue 2.
```

### Absence proof — no whole-form validity leak (negative grep)
Extracted `executeAutoSave` body (lines 549-633) and grepped for whole-form
patterns:
```bash
sed -n '549,633p' packages/react/src/components/Form.tsx | grep -nE "formState\.isValid|methods\.trigger\(\s*\)"
# → 0 matches (exit 1)
```
- **No** `methods.formState.isValid` read anywhere in the function.
- **No** bare `methods.trigger()` call (no-args = whole form). The only
  `methods.trigger` call is at line **595** and passes `fieldsToTrigger`
  (scoped, affected-only).

**Notes:** Both gates are distinct and neither is a whole-form check. Gate 1
inspects RHF's already-computed `onChange` error state on the changed fields;
Gate 2 actively re-validates the affected (dependent) fields via a scoped
`trigger`. The scoped gate is proven two ways: the explicit comment (623-629)
AND the absence grep (0 matches).

---

## Behavior 2 — `executeAutoSave` structure (PRD §11.2)

**Status:** ✅ MATCHES

**PRD requirement:** `pendingChangedFields` / `pendingAffectedFields` lifecycle,
`getAffectedFields` transitive traversal, and execution-version abort
re-checked after every `await`.

### `pendingChangedFields` lifecycle
- Declared: **Form.tsx:215** (`useRef(new Set<string>())`)
- Populated in `changeField`: **Form.tsx:363** (`pendingChangedFields.current.add(name)`)
- Copied + cleared at top of `executeAutoSave`: **Form.tsx:555** (copy) and
  **557** (clear):
```ts
555:    const changedFields = new Set(pendingChangedFields.current);
...
557:    pendingChangedFields.current.clear();
```

### `pendingAffectedFields` lifecycle
- Declared: **Form.tsx:216**
- Populated in `changeField`: **Form.tsx:366-369** (loops `getAffectedFields(name)`
  and adds each):
```ts
366:        const affected = getAffectedFields(name);
367:        for (const field of affected) {
368:          pendingAffectedFields.current.add(field);
369:        }
```
- Copied + cleared in `executeAutoSave`: **Form.tsx:556** (copy) and **558** (clear):
```ts
556:    const affectedFields = new Set(pendingAffectedFields.current);
...
558:    pendingAffectedFields.current.clear();
```

### `getAffectedFields()` — transitive dependency traversal (Form.tsx:338-356)
Traverses `invertedSubscriptions` (the target → subscribers inverted index) with
a worklist, pushing each subscriber back onto the stack for transitive closure:
```ts
338:  const getAffectedFields = useCallback((changedField: string): Set<string> => {
...
344:      const subscribers = invertedSubscriptions.current.get(current);
...
349:            toProcess.push(subscriber); // Check for transitive dependencies
```

### Execution-version abort — re-checked after EVERY `await`
`executionVersionRef` declared at **Form.tsx:218**. Incremented + captured at
function entry (**Form.tsx:551-552**):
```ts
551:    executionVersionRef.current++;
552:    const executionVersion = executionVersionRef.current;
```
Enumerated await points and their post-await version re-checks:

| # | `await` point | Re-check (returns on mismatch) |
|---|---|---|
| 1 | `await waitForFieldValidation(...)` — Form.tsx:**571-574** | Form.tsx:**579-583** (`!validationsComplete || executionVersionRef.current !== executionVersion`) |
| 2 | `await methods.trigger(fieldsToTrigger)` — Form.tsx:**595** | Form.tsx:**598-600** (`if (executionVersionRef.current !== executionVersion) return`) |
| 3 | `await waitForFieldValidation(...)` (post-trigger) — Form.tsx:**608-611** | Form.tsx:**613-616** (`!postTriggerComplete || executionVersionRef.current !== executionVersion`) |

(The final `await handleSubmit(...)` at line **631** is the terminal save action
and intentionally has no post-await guard — there is nothing after it to abort.)

**Notes:** All three non-terminal awaits have a version re-check immediately
following. The version is also threaded into `waitForFieldValidation` as an arg
(`executionVersion`), so in-flight validation waits can short-circuit on
supersession too.

---

## Behavior 3 — Per-field debounce coalescing (PRD §11.3 Example 4)

**Status:** ✅ MATCHES

**PRD requirement:** "Pending changes accumulate across ALL fields, so the
faster timer submits the whole pending batch, and a slower timer that fires
with nothing new pending is a no-op." Fields sharing `ms` share one timer.

### `getOrCreateDebounced(ms)` — per-interval memoized cache (Form.tsx:650-673)
Cache stored in `fieldDebouncersRef: Map<number, DebouncedFunction>` (declared
**Form.tsx:225**), keyed by `ms`. Lookup-then-create:
```ts
650:  const getOrCreateDebounced = useCallback(
651:    (ms: number): DebouncedFunction => {
652:      const cached = fieldDebouncersRef.current.get(ms);
653:      if (cached) return cached;
...
669:      fieldDebouncersRef.current.set(ms, fn);
```

### Fields sharing `ms` share one timer
Cache key is `ms` (a number). Line **652** returns the cached entry on hit, so
two fields with the same numeric debounce resolve to the same `fn`. Confirmed by
the keyed `get`/`set` pair (652 / 669).

### Faster timer submits whole pending batch
`executeAutoSave` copies **BOTH** pending sets before clearing
(**Form.tsx:555-558**, cited in Behavior 2). Because every debounced fn —
regardless of its `ms` — funnels into the single `executeAutoSave` which drains
both sets, the timer that fires first submits the entire accumulated batch
(changed + affected). The two copy lines together are the mechanical proof:
```ts
555:    const changedFields = new Set(pendingChangedFields.current);
556:    const affectedFields = new Set(pendingAffectedFields.current);
557:    pendingChangedFields.current.clear();
558:    pendingAffectedFields.current.clear();
```

### Slower timer that fires with nothing pending is a no-op (Form.tsx:566-568)
Early return when `changedFields.size === 0`:
```ts
566:    if (changedFields.size === 0) {
567:      return;
568:    }
```

**Notes:** Each cached debounced fn forwards through `executeAutoSaveRef`
(line **661**), so the cache stays valid for the field's lifetime without
teardown/rebuild on `executeAutoSave` identity changes — this is what makes
coalescing-by-`ms` stable.

---

## Behavior 4 — `changeField` 3-way branch (PRD §11.2)

**Status:** ✅ MATCHES

**PRD requirement:** Three-way branch on `inputConfig.debounce`:
`false` → immediate; `number` → per-field timer; `undefined` → Form-level fallback.

**Location:** `packages/react/src/components/Form.tsx:358-392` (`changeField`)

The branch (keys off `inputConfig?.debounce` with strict equality):
```ts
375:        const fieldDebounce = inputConfig?.debounce;
376:        if (fieldDebounce === false) {
377:          // Immediate submission: bypass debounce entirely (field-level override)
378:          executeAutoSaveRef.current?.();
379:        } else if (typeof fieldDebounce === "number") {
...
383:          // the single Form-level debounce. See autosave Issue 1.
384:          getOrCreateDebouncedRef.current?.(fieldDebounce)();
385:        } else {
386:          // No field-level override → Form-level debounced submission
387:          debouncedSubmitRef.current?.();
388:        }
```

| Branch | Condition | Call | Line |
|---|---|---|---|
| Immediate | `fieldDebounce === false` | `executeAutoSaveRef.current?.()` | **378** |
| Per-field timer | `typeof fieldDebounce === "number"` | `getOrCreateDebouncedRef.current?.(fieldDebounce)()` | **384** |
| Form-level fallback | `else` (i.e. `undefined`) | `debouncedSubmitRef.current?.()` | **387** |

**Notes:** A truthy non-number (e.g. `debounce: true`) would fall through to the
`else` (Form-level) branch — but per PRD §6.3.3 the only contemplated values are
`false | number | undefined`, so this is spec-correct, not a gap. The branch is
guarded by `if (autoSave)` at line 360, so the whole auto-save path is inert
when auto-save is disabled.

---

## Validation gate results

### Level 1 — Audit Rigor (the real validation; always run)
- ✅ Symbol re-location: all 10 symbols located at current lines (table above).
- ✅ "No whole-form check" by absence: `grep -nE "formState\.isValid|methods\.trigger\(\s*\)"`
  over the `executeAutoSave` body → **0 matches** (exit 1).
- ✅ Explicit comment block: exactly **1 match** at line 623
  (`grep -n "intentionally do NOT bail on whole-form"`).
- ✅ Execution-version abort re-checked after every non-terminal await (3 of 3;
  enumerated in Behavior 2).
- ✅ Coalescing proof cites BOTH pending-set copy lines (555 + 556).

### Levels 2 & 3 — Coverage / Typecheck / Build
**SKIPPED** — no code change was made (no gap found), so there is nothing to
test or build. Per PRP: these levels run only if Task 7 produced a `Form.tsx`
edit.

### Level 4 — Audit-Record Completeness
```bash
grep -cE "Behavior [1-4]" plan/004_8583c4771a2e/P1M1T1S1/audit-record.md   # ≥4 ✓ (one section per behavior)
grep -cE "Form\.tsx:[0-9]" plan/004_8583c4771a2e/P1M1T1S1/audit-record.md  # ≥4 ✓ (many citations)
grep -E "no drift|GAP FOUND" plan/004_8583c4771a2e/P1M1T1S1/audit-record.md # exactly one ✓ ("no drift, already ships")
```

### No-code-change confirmation
Since the outcome is "no drift," `Form.tsx` must be untouched:
```bash
git diff --exit-code packages/react/src/components/Form.tsx   # expected exit 0
```

---

## Summary

| Behavior | PRD ref | Status | Key citations |
|---|---|---|---|
| 1 — Scoped validity gate | §11.1 point 4 | ✅ MATCHES | Gate 1: 585-591; Gate 2: 594-616; comment: 623-629; absence grep: 0 matches |
| 2 — `executeAutoSave` structure | §11.2 | ✅ MATCHES | pending sets: 215/216, 363/366-369, 555-558; `getAffectedFields`: 338-356; version abort: 551-552 + 579-583, 598-600, 613-616 |
| 3 — Per-field debounce coalescing | §11.3 Ex. 4 | ✅ MATCHES | `getOrCreateDebounced`: 650-673 (cache key `ms`); both pending sets copied: 555-556; no-op on empty: 566-568 |
| 4 — `changeField` 3-way branch | §11.2 | ✅ MATCHES | false→378; number→384; undefined→387 |

**Conclusion:** The shipped auto-save runtime in `Form.tsx` matches PRD
§11.1–§11.3 on all four specified behaviors. No drift. No code change required.
This record gates P1.M1.T2 (doc sweep) and feeds P1.M1.T1.S2 (test audit).
