# Docs State Map — Formality forwardRef Delta

Scout report. **Review-only / no source edits made.** This file maps the exact
current state of the three docs the forwardRef delta must touch. No changes
proposed — only verbatim quotes with line numbers.

---

## 1. `packages/react/src/overlays.ts` — `FormalityFieldComponentProps` JSDoc + type

The JSDoc block spans **lines 139–178**; the `export type` declaration spans
**lines 179–188**. Verified via grep anchors: `:140 Props Formality`,
`:150 Destructure`, `:162 Wiring`, `:165 slotProps`, `:167 Runtime caveat`,
`:179 export type`.

### 1a. KEEP (verbatim, lines 139–166) — Destructure guidance + MUI v9 slotProps note

```
139: /**
140:  * Props Formality injects onto every field component.
141:  *
142:  * `<Field>` renders your input component via React Hook Form's `<Controller>`.
143:  * At runtime Formality merges a `coreProps` bundle onto the component (name,
144:  * value, onChange, onBlur, and — as a React-special key — `ref`). The three
145:  * members below are the **intended injected-props contract**: `formState`
146:  * today reaches templates and render-prop children; `state` (subscribed field
147:  * state) and a top-level `forwardRef` key are part of the contract this type
148:  * codifies ahead of the runtime wiring (see "Runtime caveat" below).
149:  *
150:  * **Destructure before forwarding.** Component authors MUST destructure
151:  * `state`, `formState`, and `forwardRef` OUT of props before spreading the
152:  * rest onto the underlying DOM `<input>` — otherwise these non-DOM props leak
153:  * to the DOM and React warns. Recommended pattern:
154:  *
155:  * ```tsx
156:  * const TextField: ComponentType<FormalityFieldComponentProps<TextFieldProps>> =
157:  *   ({ state, formState, forwardRef, ...domProps }) => (
158:  *     <input ref={forwardRef} {...domProps} />
159:  *   );
160:  * ```
161:  *
162:  * **Wiring `forwardRef` to the inner input.** `forwardRef` is RHF's
163:  * `RefCallBack` (a function). For a plain `<input>` use `ref={forwardRef}`.
164:  * For MUI v9 components that no longer accept a top-level `inputRef`, wire it
165:  * via slots: `slotProps={{ input: { ref: forwardRef } }}` (PRD §5.3.8).
166:  *
```

- **Lines 150–160** = the "Destructure before forwarding" guidance + code fence. KEEP.
- **Lines 162–165** = the MUI v9 `slotProps={{ input: { ref: forwardRef } }}` note. KEEP.
- **Lines 142–148** = the opening "intended injected-props contract" prose that
  prefaces the type. Note line 148 still references `"Runtime caveat"` — if the
  caveat paragraph is removed/edited, this back-reference may need follow-up.

### 1b. THE TARGET — 'Runtime caveat (important)' paragraph (lines 167–174)

This is the verbatim text that must be edited. It contains BOTH the wording to
remove ("FUTURE runtime task", "out of scope for this type-only change") AND
the guidance to keep (React.forwardRef wrap / React 19 ref-as-prop):

```
167:  * **Runtime caveat (important).** Today `Field` delivers the RHF ref via the
168:  * React-special `ref` key (not a top-level `forwardRef` prop). To receive it
169:  * as `forwardRef` on a plain function component WITHOUT a `React.forwardRef`
170:  * wrap, either (a) wrap your component with `React.forwardRef`, or (b) target
171:  * React 19's ref-as-prop. Making Field deliver it as a top-level `forwardRef`
172:  * key for bare components is a FUTURE runtime task (out of scope for this
173:  * type-only change). The type ships the intended contract now so consumers
174:  * stop hand-rolling a lossy `WithFormality<P>`.
```

**Remove wording (within 171–173):**
- Line 171: `Making Field deliver it as a top-level \`forwardRef\``
- Line 172: `key for bare components is a FUTURE runtime task (out of scope for this`
- Line 173: `type-only change).`

**Keep / preserve meaning (167–170, 174):**
- Lines 167–170: the "Field delivers the RHF ref via the React-special `ref`
  key ... wrap with `React.forwardRef`, or target React 19's ref-as-prop"
  guidance.
- Line 174: "stop hand-rolling a lossy `WithFormality<P>`."

### 1c. KEEP (verbatim, lines 175–188) — `@template` + the type body

```
175:  *
176:  * @template P - the field component's own props (e.g. TextFieldProps). Defaults
177:  *   to `unknown` so existing `ComponentType<any>` casts remain valid.
178:  */
179: export type FormalityFieldComponentProps<P = unknown> = P & {
180:   /** Subscribed/own field state when `provideState`/`passSubscriptions` is on. */
181:   state?: CustomFieldState | Record<string, CustomFieldState>;
182: 
183:   /** React Hook Form form state threaded from `<Controller>`. */
184:   formState?: UseFormStateReturn<FieldValues>;
185: 
186:   /** RHF ref callback (`RefCallBack`); wire to the inner input (see JSDoc). */
187:   forwardRef?: RefCallBack;
188: };
```

No edits required to the type body itself.

---

## 2. `packages/react/README.md` — the `FormalityFieldComponentProps` section

The section header is at **line 558**. Verified grep anchors:
`:558 ### Field component props`, `:579 import type`, `:600 **Wiring`,
`:606 slotProps`, `:609 **Runtime caveat`, `:613 future runtime task`.

### 2a. Feature-listing elsewhere in this README

- **Line 440** — `FormalityFieldComponentProps,` appears in a code-block import
  list (under a "Type Safety" import example). Not the caveat prose; likely
  untouched by the delta.

### 2b. Section header + 'Before/After' type docs (lines 558–595) — KEEP

```
558: ### Field component props: `FormalityFieldComponentProps`
559: 
560: `<Field>` renders your input component via React Hook Form's `<Controller>` and
561: injects a bundle of props onto it. `FormalityFieldComponentProps<P>` is the
562: **precise** type for that contract — replacing the lossy `WithFormality<P>`
563: helper consumers (e.g. `sellario-ui`) hand-roll today.
```

(Section body continues with the Before/After code blocks through ~line 595.)

### 2c. KEEP — Destructure + Wiring guidance (lines 596–607)

```
596: **Destructure before forwarding.** Always pull `state`, `formState`, and
597: `forwardRef` **out** of props before spreading the rest onto the underlying DOM
598: node — otherwise these non-DOM props leak to the DOM and React warns.
599: 
600: **Wiring `forwardRef` to the inner input.** `forwardRef` is RHF's `RefCallBack`
601: (`(instance: any) => void`), **not** `React.Ref<HTMLInputElement>`. For a
602: plain `<input>` use `ref={forwardRef}`. For **MUI v9** components (e.g.
603: `Checkbox`) that no longer accept a top-level `inputRef`, wire it via slots:
604: 
605: ```tsx
606: slotProps={{ input: { ref: forwardRef } }}
607: ```
```

### 2d. THE TARGET — 'Runtime caveat (important)' paragraph (lines 609–615)

This is the README's verbatim copy of the caveat. Note: wording differs slightly
from overlays.ts (uses "bare function component", "future runtime task;" with
semicolon, "Making `Field` deliver a" — backticked Field).

```
609: **Runtime caveat (important).** Today `Field` delivers the RHF ref via the
610: React-special `ref` key, **not** a top-level `forwardRef` prop. To receive it
611: as `forwardRef` on a bare function component, either wrap your component with
612: `React.forwardRef`, or target React 19's ref-as-prop. Making `Field` deliver a
613: top-level `forwardRef` key for bare components is a future runtime task; the
614: type ships the **intended contract now** so consumers can stop hand-rolling
615: `WithFormality`.
```

**Remove wording (lines 612–613):**
- Line 613: `top-level \`forwardRef\` key for bare components is a future runtime task; the`
- Line 612 tail: `Making \`Field\` deliver a`

**Keep (lines 609–612 head, 614–615):**
- The "Field delivers via React-special `ref` key ... `React.forwardRef` wrap /
  React 19 ref-as-prop" guidance and the "stop hand-rolling `WithFormality`"
  closer.

**Line 616** is blank; **line 617** begins `## Utilities` (next section). The
caveat paragraph is the last block before `## Utilities`, so edits are
self-contained between lines 608–616.

---

## 3. `README.md` (repo root) — VERIFIED: no 'Runtime caveat' prose

Grep for `Runtime caveat|forwardRef|future runtime task|out of scope for this type-only change|slotProps` in the root README returns:

- **Line 584** only:
  ```
  584: - **`FormalityFieldComponentProps<P>`** — the shipped injected-props type,
  ```
  Context (lines 584–585):
  ```
  584: - **`FormalityFieldComponentProps<P>`** — the shipped injected-props type,
  585:   replacing the hand-rolled lossy `WithFormality<P>`.
  ```
  This is a feature-bullet in a "Type Safety" summary list, ending with a
  pointer to the React package README.

**No** occurrences of: `Runtime caveat`, `forwardRef`, `slotProps`, `future
runtime task`, or `out of scope for this type-only change` anywhere else in the
root README. Confirms the delta's claim: **the root README does NOT carry the
caveat prose and needs no edit.**

---

## Summary table

| File | Target lines | Action |
|------|-------------|--------|
| `packages/react/src/overlays.ts` | 167–174 | Edit caveat (remove "FUTURE runtime task" / "out of scope for this type-only change" wording on 171–173; keep wrap/ref-as-prop guidance 167–170 + closer 174). Watch back-reference on line 148. |
| `packages/react/README.md` | 609–615 | Edit caveat (remove "future runtime task" wording on 612–613; keep wrap guidance 609–612 + closer 614–615). |
| `packages/react/README.md` | 440 | Import-list mention — no prose edit expected. |
| `README.md` (root) | 584 | Feature bullet only — **no edit needed** (verified). |

## Cross-cutting risk / open question for the implementer

- **Back-reference drift in overlays.ts line 148:** the opening paragraph at
  `:148` says `codifies ahead of the runtime wiring (see "Runtime caveat"
  below).` If the caveat paragraph is shortened/rewritten, this forward-link
  still points to it. The implementer should re-read lines 142–148 and 167–174
  together to ensure the cross-reference stays valid.
- **Wording asymmetry between the two files:** overlays.ts uses `FUTURE runtime
  task (out of scope for this type-only change)` (capital FUTURE); the README
  uses `a future runtime task;` (lowercase, semicolon, no "out of scope"
  phrase). Any find/replace must be file-specific, not a single global pattern.
