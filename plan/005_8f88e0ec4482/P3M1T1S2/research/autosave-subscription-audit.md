# Formality v1.0 Audit — Auto-Save (§12) & Subscription (§9)

**Repo:** `/home/dustin/projects/formality`
**Main file:** `packages/react/src/components/Form.tsx` (961 lines)
**Scope:** RESEARCH ONLY. No files edited.
**Audited against PRD:** §9 Subscription System (incl. §8.5 Validation Blocking subsection) + §12 Auto-Save System.

---

## Executive Summary

| Section | Behavior | Verdict |
|---|---|---|
| §12 Auto-Save | scoped validation, dual gates, version guard, debounce, submitImmediate | **COMPLIANT** |
| §9 Subscription | inverted index, watcher setters, pending queue | **COMPLIANT** |
| §8.5 Validation blocking | subscriber-scoped submit gate | **PARTIAL** (over-blocking; `isAnySubscribedFieldValidating` NOT implemented) |

One material gap: PRD §8.5 specifies a subscriber-aware submission gate; the implementation blocks submission on **any** validating field (Form.tsx:469) regardless of whether it has subscribers. Functionally safe but more restrictive than spec, and untested.

---

## §12 AUTO-SAVE — COMPLIANT

All eight audited behaviors are implemented with exact evidence below.

### 1. `executeAutoSave` with SCOPED validation — COMPLIANT
`executeAutoSave` defined at **Form.tsx:559–666**. Mode-agnostic and scoped:
- **`pendingChangedFields`** Set (declared Form.tsx:225): drained into local copy at **Form.tsx:565** then cleared **:566**.
- **`affectedFields`** from sibling Set `pendingAffectedFields` (declared :226), copied :566, cleared same line.
- **`getAffectedFields`** (Form.tsx:348–369) traverses `invertedSubscriptions` via DFS including transitive deps (line 357 `toProcess.push(subscriber)`).
- No whole-form validation: `methods.trigger` only on `changedFields` (Gate 1) + `affectedFields` (Gate 2).

### 2. Gate 1 — `methods.trigger(changedFields)` — COMPLIANT
**Form.tsx:594** — `const changedValid = await methods.trigger(changedArray as any);` where `changedArray = [...changedFields]` (:592).
- Version re-check after await at **:601–603**.
- Early return on error at **:604–606**.

### 3. Gate 2 — `methods.trigger(affectedFields)` — COMPLIANT
**Form.tsx:632** — `const isValid = await methods.trigger(fieldsToTrigger as any);` where `fieldsToTrigger = [...affectedFields]` (:588).
- Version re-check at **:635**.
- Early return on error at **:639–642**.

### 4. Mode-agnostic (no reliance on pre-existing errors) — COMPLIANT
- Both gates call `methods.trigger()` explicitly, which ignores RHF `mode` (comment Form.tsx:582–589, :573–580).
- Never reads `methods.formState.errors` to decide whether to save.
- Explicit note Form.tsx:655–664: "we intentionally do NOT bail on whole-form errors here."
- Verified by tests `mode=onTouched` (autosave-validation.test.tsx:557, :597).

### 5. Execution-version guard (stale-save abort) — COMPLIANT
- **`executionVersionRef`** declared Form.tsx:228, incremented + captured at **Form.tsx:561–562**.
- Guarded checkpoints (each returns early if `executionVersionRef.current !== executionVersion`): **:591** (after pre-trigger waitForFieldValidation), **:603** (after Gate 1), **:619** (after Gate 1 wait), **:635** (after Gate 2), **:651** (after Gate 2 wait).
- `waitForFieldValidation` (Form.tsx:525–554) returns `false` on version drift (:533).

### 6. Debounce (§12.3) per-field `InputConfig.debounce` — COMPLIANT
Resolved in `changeField` (Form.tsx:382–400):
- **`false` → immediate:** :384–390 calls `executeAutoSaveRef.current?.()` directly.
- **`number` → per-field timer:** :391–396 calls `getOrCreateDebouncedRef.current?.(fieldDebounce)()`.
- **`undefined` → Form-level:** :397–400 calls `debouncedSubmitRef.current?.()`.
- **`getOrCreateDebounced`** memoizes one `DebouncedFunction` per interval in `fieldDebouncersRef` (Map keyed by ms): Form.tsx:686–704. Fields sharing interval coalesce into one timer.
- Form-level `debouncedSubmit` built once per `debounceMs` (Form.tsx:729–752), with immediate adapter when `debounceMs === false` (:731–745) whose `pending()` always `false`.

### 7. `submitImmediate` flush — COMPLIANT
**Form.tsx:762–785.**
- Detects pending: :770–772 checks `debouncedSubmitRef.current?.pending()` OR any per-field debouncer `.pending()`.
- No-op when nothing pending (:773) — avoids spurious empty save.
- Cancels idle timers (:777–778) so trailing callback can't race.
- Drains shared pending set in one `executeAutoSave` (:782–785).
- Exposed on context: Form.tsx:839 and :858.

### 8. `changeField` wiring — COMPLIANT
**Form.tsx:371–401.**
- Accumulates change: `pendingChangedFields.current.add(name)` :373.
- Computes affected: `getAffectedFields(name)` :376; adds each to `pendingAffectedFields` :377–379.
- Routes to immediate / numeric-debounce / form-debounce branches (:382–400).
- Gated by `if (autoSave)` (:372).

---

## §9 SUBSCRIPTION — COMPLIANT (with §8.5 caveat)

### 1. `addSubscription` — inverted index + mount-aware notify — COMPLIANT
**Form.tsx:254–280.**
- Inverted index write: `invertedSubscriptions.current.set/get(target).add(subscriber)` :256–259.
- If target mounted (`watcherSetters.current.get(target)` truthy), notify via setter: :271–273.
- Else queue in `pendingWatcherUpdates` :274–277.
- Dev logging guarded by `NODE_ENV !== "production"` :262–267.

### 2. `registerWatcherSetter` — stores setter, drains pending — COMPLIANT
**Form.tsx:317–335.**
- Stores setter: `watcherSetters.current.set(name, setter)` :319.
- Drains pending: reads `pendingWatcherUpdates.current.get(name)` :321; applies each queued subscriber via `setter` (:323–330); deletes pending entry :331.

### 3. `removeSubscription` — COMPLIANT
**Form.tsx:281–316.** Existence check for double-cleanup detection (:284–285); deletes from inverted index (:288); updates mounted target's watcher state via setter (:303–312).

### 4. `unregisterWatcherSetter` — COMPLIANT
**Form.tsx:337–339** — `watcherSetters.current.delete(name)`.

### 5. §8.5 Validation Blocking on Submit — **PARTIAL (over-blocking)**
**This is the one material gap.** PRD §8.5 specifies:
```ts
const isAnySubscribedFieldValidating = useMemo(() => {
  for (const [fieldName, isValidating] of validatingFields.entries()) {
    if (isValidating) {
      const subscribers = invertedSubscriptions.get(fieldName);
      if (subscribers && subscribers.size > 0) return true; // Block
    }
  }
  return false;
}, [validatingFields, invertedSubscriptions]);
```
i.e. block submission **only** when a validating field has subscribers (dependents).

**Implementation:** `handleSubmit` (Form.tsx:455–489) instead iterates **all** validating fields and returns on any:
```ts
// Form.tsx:468-471
for (const [, isValidating] of validatingFields.current) {
  if (isValidating) return;
}
```
- The symbol `isAnySubscribedFieldValidating` does **not exist anywhere** in the codebase (verified via repo-wide grep). It is not in `FormContext.ts`.
- **Effect:** Functionally safe (never submits with an in-flight validator), but MORE restrictive than spec — a background async validator on an *unsubscribed* field needlessly blocks an unrelated submit.
- Severity: **Low–Medium** (correctness preserved; spec compliance + UX optimization missing).
- **No test covers subscriber-scoped submit blocking.**

### Supporting: `setFieldValidating` / `validatingFields`
- `validatingFields` Map declared Form.tsx:221. `setFieldValidating` Form.tsx:404–407. Read in `getFormState` (:425), in `executeAutoSave` field wait filter (:539), and in `handleSubmit` gate (:469).

---

## Test Coverage Matrix (behavior → test file:line)

### §12 Auto-Save
| Behavior | Test file:line | Assertion |
|---|---|---|
| Scoped (NOT all-field) validation | autosave-validation.test.tsx:108 | one change does NOT trigger all-field validation |
| Dependent validated, independent skipped | autosave-validation.test.tsx:170 | dependent fields validated, independent NOT |
| Async validation awaited | autosave-validation.test.tsx:225 | waits for async validators before submit |
| Gate 1/2 error blocks submit | autosave-validation.test.tsx:389 | does NOT submit if validation fails |
| Issue 2 — unrelated invalid field still saves | autosave-validation.test.tsx:432 | valid field auto-saves despite unrelated invalid field |
| Changed field itself invalid → no save | autosave-validation.test.tsx:509 | does NOT auto-save when changed field invalid |
| Mode-agnostic (onTouched) — invalid first edit | autosave-validation.test.tsx:557 | mode=onTouched does NOT auto-save invalid first edit |
| Mode-agnostic (onTouched) — valid first edit | autosave-validation.test.tsx:597 | mode=onTouched DOES auto-save valid first edit |
| Version guard — single change during validation | autosave-async-timing.test.tsx:81 | ignores first validation when value changes mid-flight |
| Version guard — triple change (PRIMARY) | autosave-async-timing.test.tsx:182 | submits only final value after multiple mid-validation changes |
| Version guard — checkpoint in waitForFieldValidation | autosave-async-timing.test.tsx:316 | aborts at the wait checkpoint |
| Version guard — all three checkpoints | autosave-async-timing.test.tsx:397 | checks version at all three executeAutoSave checkpoints |
| Version guard — abort stale saves | autosave-rapid-changes.test.tsx:141 | aborts intermediate auto-save operations |
| Version guard — rapid changes during async validation | autosave-rapid-changes.test.tsx:196 | handles rapid changes during async validation |
| Version guard — checkpoint aborts stale | autosave-rapid-changes.test.tsx:400 | version checkpoint aborts stale saves |
| 10 rapid changes → last value only | autosave-rapid-changes.test.tsx:78 | only final value submitted after 10 rapid changes |
| Per-field numeric debounce honored (Issue 1) | autosave-field-debounce.test.tsx:77 | does NOT submit before numeric debounce elapses |
| Numeric debounce fires after interval | autosave-field-debounce.test.tsx:125 | submits after exactly the field's numeric debounce |
| Numeric debounce via Field inputConfig prop | autosave-field-debounce.test.tsx:174 | honors numeric debounce via Field inputConfig prop |
| Debounce resets within a field | autosave-field-debounce.test.tsx:219 | debounce resets on each keystroke |
| Coalescing — same interval → one submit | autosave-field-debounce.test.tsx:271 | coalesces fields sharing numeric debounce |
| Coalescing — faster batch wins | autosave-field-debounce.test.tsx:323 | faster debounce submits; slower timer no-ops |
| Lone slow field own cadence | autosave-field-debounce.test.tsx:385 | slow field fires on its own longer cadence |
| Mixed false + numeric | autosave-field-debounce.test.tsx:438 | debounce:false immediate while numeric pending |
| Coalesce pending numeric into immediate | autosave-field-debounce.test.tsx:503 | coalesces pending numeric into immediate submit |
| Form-level fallback | autosave-field-debounce.test.tsx:559 | falls back to Form-level debounce when unset |
| `debounce: false` immediate submit | autosave-validation.test.tsx:640 | submitHandler called immediately when inputConfig.debounce === false |
| Default 1000ms debounce | autosave-validation.test.tsx:774 | default 1000ms when no debounce prop |
| Form-level debounce prop | autosave-validation.test.tsx:819 | uses form-level debounce prop when provided |
| inputConfig undefined → form debounce | autosave-validation.test.tsx:858 | normal debounce when inputConfig undefined |
| inputConfig without debounce → form debounce | autosave-validation.test.tsx:898 | normal debounce when inputConfig lacks debounce |
| Mixed debounce integration | autosave-validation.test.tsx:1017 | immediate for false field while debounced fields wait |
| Mixed rapid changes | autosave-validation.test.tsx:1257 | handles rapid changes across mixed debounce fields |
| No timer conflicts (immediate + debounced) | autosave-validation.test.tsx:1315 | no timer conflicts between immediate and debounced |
| submitImmediate flushes Form-level | autosave-submit-immediate.test.tsx:88 | flushes pending Form-level save immediately |
| submitImmediate flushes per-field numeric (Issue 1) | autosave-submit-immediate.test.tsx:136 | flushes pending per-field numeric save immediately |
| submitImmediate flushes both as single submit | autosave-submit-immediate.test.tsx:192 | flushes both Form + per-field as one submit |
| submitImmediate no-op when nothing pending | autosave-submit-immediate.test.tsx:256 | no-op when nothing pending (no spurious empty save) |
| `pending()` real state (Issue 3) — Form-level | autosave-submit-immediate.test.tsx:301 | pending() true while scheduled, false after fire |
| `pending()` false after cancel | autosave-submit-immediate.test.tsx:341 | pending() false after cancel() |
| `flush()` fires numeric immediately | autosave-submit-immediate.test.tsx:381 | flush() fires pending numeric save immediately |
| Immediate adapter never pending | autosave-submit-immediate.test.tsx:434 | debounce:false adapter is never pending |

### §9 Subscription
| Behavior | Test file:line | Assertion |
|---|---|---|
| addSubscription on mount | useSubscriptions.test.tsx:159 | adds subscriptions on mount |
| Empty array → no add | useSubscriptions.test.tsx:178 | no add when array empty |
| Per-effect cleanup isolation | useSubscriptions.test.tsx:188 | only cleans up current run's subscriptions |
| Rapid changes no leak | useSubscriptions.test.tsx:232 | handles rapid changes without memory leaks |
| LIFO cleanup order | useSubscriptions.test.tsx:282 | uses LIFO cleanup ordering |
| React 18 StrictMode double-invoke | useSubscriptions.test.tsx:333 | handles StrictMode double-invocation |
| StrictMode + subscription changes | useSubscriptions.test.tsx:380 | no errors with StrictMode + changes |
| Array isolation (copy) | useSubscriptions.test.tsx:429 | stores array copy to prevent reference sharing |
| Dev logging — additions | useSubscriptions.test.tsx:459 | logs subscription additions |
| Dev logging — multiple | useSubscriptions.test.tsx:469 | logs multiple additions |
| Dev logging — cleanup | useSubscriptions.test.tsx:484 | logs cleanup operations |
| Dev logging — run ID | useSubscriptions.test.tsx:502 | includes run ID in logs |
| Double-cleanup detection | useSubscriptions.test.tsx:534 | warns about double-cleanup attempts |
| invertedSubscriptions cleaned on unmount | useSubscriptions.test.tsx:550 | cleans invertedSubscriptions Map after unmount |
| Multi-field unmount cleanup | useSubscriptions.test.tsx:573 | cleans all Maps when multiple fields unmount |
| GC of component instances | useSubscriptions.test.tsx:605 | allows GC of component instances |
| Nested subscription cleanup | useSubscriptions.test.tsx:659 | cleans nested subscriptions correctly |
| Rapid field add/remove | useSubscriptions.test.tsx:695 | handles rapid field addition/removal |
| No leak warnings on unmount | useSubscriptions.test.tsx:739 | no memory-leak warnings during unmount |
| No leak warnings with rapid changes | useSubscriptions.test.tsx:768 | no leak warnings with rapid changes |
| Subscription count balance (10+) | useSubscriptions.test.tsx:802 | maintains count balance with 10+ rapid changes |
| Only latest run in invertedSubscriptions | useSubscriptions.test.tsx:850 | only latest run entry after rapid changes |
| Final state matches last prop | useSubscriptions.test.tsx:886 | final state matches last prop value |
| No memory growth (10+) | useSubscriptions.test.tsx:936 | no memory growth with 10+ changes |
| 100 rapid changes stress | useSubscriptions.test.tsx:1011 | handles 100 rapid changes (stress) |
| Loop-based rapid changes | useSubscriptions.test.tsx:1064 | handles loop-based rapid subscription changes |
| Rapid field name changes | useSubscriptions.test.tsx:1111 | handles rapid field name changes |
| Mixed rapid changes | useSubscriptions.test.tsx:1142 | handles mixed rapid (subs + name) |
| Watched-field typing stability | Field.subscriptionStability.test.tsx:70 | typing into a watched field does not churn subs / hit max update depth |

### GAP — uncovered behaviors
| Missing coverage | Notes |
|---|---|
| **§8.5 subscriber-scoped submit blocking** | `isAnySubscribedFieldValidating` not implemented (Form.tsx uses all-fields gate at :469); no test asserts subscriber-aware behavior. THE GAP this audit must fix (TDD) or document. |

---

## Architecture / Data Flow

```
Field.handleChange (value commit)
   └─> FormContext.changeField(name, value, inputConfig)   [Form.tsx:371]
         ├─ pendingChangedFields.add(name)                 [:373]
         ├─ pendingAffectedFields ∪= getAffectedFields(name) [:376-379]
         │     └─ reads invertedSubscriptions (DFS, transitive) [:348-369]
         └─ cadence branch [:382-400]
              ├ debounce===false  → executeAutoSaveRef.current?.()   (immediate)
              ├ debounce===<num>  → getOrCreateDebounced(num)()       (per-field timer, cached by ms)
              └ debounce===undef → debouncedSubmitRef.current?.()     (Form-level timer)

executeAutoSave [Form.tsx:559]
   1. executionVersionRef++ ; capture version        [:561-562]
   2. drain pendingChangedFields / pendingAffectedFields into locals; clear  [:565-566]
   3. waitForFieldValidation(all) — abort on version drift  [:589-592]
   4. Gate 1: methods.trigger(changed) — abort on version drift or error  [:594-606]
   5. waitForFieldValidation(changed)  [:612-624]
   6. Gate 2: methods.trigger(affected) — abort on version drift or error  [:632-642]
   7. waitForFieldValidation(affected)  [:644-653]
   8. methods.getValues() → handleSubmit(values)     [:666]

handleSubmit [Form.tsx:455]
   - ALL-field validating gate (Form.tsx:468-471)   ← §8.5 GAP: not subscriber-scoped
   - form-level validate()                       [:472-481]
   - transformValuesForSubmit                    [:484]
   - onSubmit / overrideOnSubmit                 [:487]
```

---

## Start Here

**`packages/react/src/components/Form.tsx:559`** — `executeAutoSave`. This single function encodes §12 items 1–5. Read down through :666, then up to `changeField` (:371–401) for debounce wiring, `submitImmediate` (:762–785) for flush path. For §9, start at `addSubscription` (Form.tsx:254). For §8.5 gap, read `handleSubmit` Form.tsx:468-471.

## Acceptance

- **§12 Auto-Save: COMPLIANT** — all 8 behaviors implemented and tested.
- **§9 Subscription core: COMPLIANT** — inverted index, watcher setters, pending queue implemented and heavily tested (31 tests).
- **§8.5 Validation blocking: PARTIAL** — submission blocked on any validating field rather than only subscribed ones; `isAnySubscribedFieldValidating` absent; no test. Safe but non-compliant with subscriber-scoped optimization. **THIS IS THE TDD GAP TO FIX.**
