# Field Ref Delivery — Change Site Map (current state)

Exact current state of the one-line runtime change that delivers RHF's ref
under the `forwardRef` key instead of the React-special `ref` key. Paths,
line numbers, and verbatim quotes verified by direct read. **Review-only
report — no edits made.**

## TL;DR change site

`packages/react/src/components/Field.tsx:464`

```tsx
            ref: field.ref,
```
becomes
```tsx
            forwardRef: field.ref,
```

No other change is required to make `forwardRef` flow to the rendered
component: `mergeFieldProps`/`mergeStaticProps` are plain `Object.assign`
spreads (no allow-list), `coreProps` is applied last and wins, and
`finalProps` is spread onto `<Component {...finalProps} />`.

The type contract `FormalityFieldComponentProps` already declares
`forwardRef?: RefCallBack` (`packages/react/src/overlays.ts:187`), so the
type side is already correct — only the runtime wiring in `Field.tsx` is
stale. Its JSDoc explicitly calls this out as a "FUTURE runtime task" to be
landed (overlays.ts lines ~167-172).

---

## 1. `packages/react/src/components/Field.tsx` — coreProps block

### 1a. Full `coreProps` object verbatim (lines 456-466)

Inside the `<Controller render={({ field, fieldState, formState }) => { ... }}>`
block, after the 8-layer `mergeFieldProps` call (which starts at the call
that opens at line ~444). The `coreProps` field is the 9th and final
argument:

```tsx
456          coreProps: {
457            name,
458            label,
459            disabled: isDisabled,
460            error: fieldState.error?.message,
461            [inputConfig.inputFieldProp ?? "value"]: formattedValue,
462            onChange: handleChange(field.onChange),
463            onBlur: field.onBlur,
464            ref: field.ref,
465          },
466        });
```

**The exact target line is `464`: `            ref: field.ref,`** →
`            forwardRef: field.ref,`.

Indentation: 12 spaces (the object literal lives inside the
`coreProps: { ... }` of the `mergeFieldProps({ ... })` argument, itself
inside the `render={({ field, ... }) => { ... }` arrow body).

### 1b. Internal component cast (lines 469-470)

```tsx
468        // Get component
469        const Component =
470          inputConfig.component as React.ComponentType<FormalityFieldComponentProps>;
```

The cast targets `FormalityFieldComponentProps` (defined in
`packages/react/src/overlays.ts:179`, see §4 below). The cast itself
contains **no literal `ref`/`forwardRef` token** — it just names the type.
`FormalityFieldComponentProps` already declares `forwardRef?: RefCallBack`
(`overlays.ts:187`), so after the one-line runtime change the cast is
consistent with the delivered props.

### 1c. `field.ref` referenced elsewhere in Field.tsx?

**No.** A whole-file grep for the literal pattern `field\.ref` returns
exactly one match: line 464. There is no second delivery of the ref, no
separate `ref={field.ref}` on a rendered element, and no destructuring of
`ref` out of `field`. The only ref delivery path is the `coreProps` object.

Other `field.*` usages present (not ref, for context): `field.value`
(format call), `field.onChange` (wrapped via `handleChange`), `field.onBlur`
(coreProps), all in the same render block.

---

## 2. `packages/core/src/config/merge.ts` — merge pass-through confirmation

Both functions are **plain ordered `Object.assign` spreads with no key
allow-listing or filtering**. `coreProps` is applied last and wins outright;
an unknown key like `forwardRef` passes through unchanged.

### 2a. `mergeStaticProps` (lines 155-165)

```ts
155 export function mergeStaticProps(
156   ...layers: Array<Record<string, unknown> | undefined>
157 ): Record<string, unknown> {
158   const result: Record<string, unknown> = {};
159
160   for (const layer of layers) {
161     if (layer) {
162       Object.assign(result, layer);
163     }
164   }
165
166   return result;
167 }
```

No filtering. Every enumerable own-key of every layer is copied via
`Object.assign`. `forwardRef` will be copied verbatim.

### 2b. `mergeFieldProps` (lines 180-215)

```ts
180 export function mergeFieldProps(options: {
181   providerDefaultFieldProps?: Record<string, unknown>;
182   providerSelectDefaultFieldProps?: Record<string, unknown>;
183   formDefaultFieldProps?: Record<string, unknown>;
184   formSelectDefaultFieldProps?: Record<string, unknown>;
185   inputProps?: Record<string, unknown>;
186   fieldConfigProps?: Record<string, unknown>;
187   selectProps?: Record<string, unknown>;
188   componentProps?: Record<string, unknown>;
189   coreProps?: Record<string, unknown>;
190 }): Record<string, unknown> {
191   const {
192     providerDefaultFieldProps,
193     providerSelectDefaultFieldProps,
194     formDefaultFieldProps,
195     formSelectDefaultFieldProps,
196     inputProps,
197     fieldConfigProps,
198     selectProps,
199     componentProps,
200     coreProps,
201   } = options;
202
203   // Merge in priority order (later overrides earlier)
204   return mergeStaticProps(
205     providerDefaultFieldProps,
206     providerSelectDefaultFieldProps,
207     formDefaultFieldProps,
208     formSelectDefaultFieldProps,
209     inputProps,
210     fieldConfigProps,
211     selectProps,
212     componentProps,
213     coreProps, // Core props always win (name, value, onChange, etc.)
214   );
215 }
```

`coreProps` is the **last** positional argument (line 213) → wins outright.
`forwardRef` rides through. ✅

---

## 3. Template / component render path in Field.tsx (lines 472-491)

`finalProps` is the return value of `mergeFieldProps`. It reaches the
rendered component in two mutually-exclusive branches:

```tsx
472        // Render through template if present
473        const template =
474          inputConfig.template ??
475          providerConfig.inputTemplates[type] ??
476          providerConfig.defaultInputTemplate;
477
478        const TemplateComponent = template as
479          | React.ComponentType<any>
480          | undefined;
481
482        const renderedField = TemplateComponent ? (
483          <TemplateComponent
484            Field={Component}
485            fieldProps={finalProps}
486            fieldState={fieldState}
487            formState={formState}
488          />
489        ) : (
490          <Component {...finalProps} />
491        );
```

- **No-template branch (line 490):** `<Component {...finalProps} />` — direct
  spread. `forwardRef` lands as a top-level prop on the component. ✅ This is
  the branch the runtime change fixes for bare function components.
- **Template branch (lines 483-488):** `finalProps` is passed as the named
  prop `fieldProps={finalProps}` (line 485), **not spread**. A template must
  itself destructure and forward `forwardRef` (e.g. spread `fieldProps` onto
  the inner `<Component {...fieldProps} />`, or wire
  `slotProps={{ input: { ref: fieldProps.forwardRef } }}` per overlays.ts
  JSDoc §5.3.8). The template contract is the consumer's responsibility; the
  runtime change puts `forwardRef` *into* `fieldProps` correctly regardless.

The render-prop children branch (lines 493-503) also exposes `finalProps`
as `fieldProps` to consumer render functions (line 498) — same forward-on
contract as templates.

---

## 4. Type contract (already correct — for reference)

`packages/react/src/overlays.ts:179-188`:

```ts
179 export type FormalityFieldComponentProps<P = unknown> = P & {
180   /** Subscribed/own field state when `provideState`/`passSubscriptions` is on. */
181   state?: CustomFieldState | Record<string, CustomFieldState>;
182
183   /** React Hook Form form state threaded from `<Controller>`. */
184   formState?: UseFormStateReturn<FieldValues>;
185
186   /** RHF ref callback (`RefCallBack`); wire to the inner input (see JSDoc). */
187   forwardRef?: RefCallBack;
188 };
```

The type already advertises `forwardRef?: RefCallBack`. The runtime in
`Field.tsx` is the only stale piece. The JSDoc block above this type
(lines ~140-178) explicitly states:

> "Today `Field` delivers the RHF ref via the React-special `ref` key (not a
> top-level `forwardRef` prop). … Making Field deliver it as a top-level
> `forwardRef` key for bare components is a FUTURE runtime task (out of scope
> for this type-only change)."

The one-line change at Field.tsx:464 lands that "future runtime task."

---

## Files Retrieved

1. `packages/react/src/components/Field.tsx` — full file read; coreProps
   block at lines 456-466, component cast at 469-470, render path 472-491,
   render-prop exposure 493-503. Confirmed `field.ref` appears exactly once
   (line 464).
2. `packages/core/src/config/merge.ts` — `mergeStaticProps` (155-167),
   `mergeFieldProps` (180-215). Confirmed plain `Object.assign`, no
   allow-list; `coreProps` last → wins.
3. `packages/react/src/overlays.ts` (lines 140-188) — `FormalityFieldComponentProps`
   type already declares `forwardRef?: RefCallBack` at line 187; JSDoc
   documents the runtime caveat.

## Start Here

Open `packages/react/src/components/Field.tsx`, line 464. That single line —
`            ref: field.ref,` → `            forwardRef: field.ref,` — is the
entire runtime change. Everything downstream (merge.ts spread, Component
spread on line 490, the already-correct `FormalityFieldComponentProps`
contract) is wired to carry `forwardRef` through unchanged.

## Risks / Open Questions

- **Template branch** (Field.tsx:483-488) passes `finalProps` as a named
  `fieldProps` prop, not a spread. Any existing template that destructures
  `fieldProps.ref` (rather than `fieldProps.forwardRef`) would break. A repo
  grep for `fieldProps.ref` / `.ref` inside templates is the only follow-up
  verification needed before landing the change.
- **Render-prop children** (Field.tsx:493-503) expose `finalProps` as
  `fieldProps`; same consumer contract caveat.
- The change intentionally stops delivering `ref` (React-special key) on the
  no-template branch. Components relying on receiving `ref` as a
  React-special (via `React.forwardRef` wrap or React 19 ref-as-prop) will
  now need to read `forwardRef` instead — which is exactly the documented
  intended contract (overlays.ts JSDoc).
