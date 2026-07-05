# Research: RHF `Controller.field.ref` (`RefCallBack`) & Focus-on-Error — `forwardRef` Prop vs React `ref` Key

> Scope: confirm whether delivering RHF's `field.ref` callback as a top-level
> **`forwardRef` prop** (instead of React's reserved `ref` key) is safe, avoids
> the React 18 "Function components cannot be given refs" warning, and still
> preserves RHF focus-on-error. Actionable for the §20.6 test suite.
>
> Tooling note: this run did not expose a web/fetch tool. The facts below are
> stable, well-established behaviors; canonical source URLs are listed in
> **Sources** and flagged for quick re-verification in **Gaps**.

## Summary

React Hook Form's `Controller` exposes `field.ref` as a **`RefCallBack`** — a
callback `(instance | null) => void` — that RHF uses internally to register the
field's DOM node so that focus-on-error (`shouldFocusError`, default `true`) can
call `.focus()` on the first errored field after a failed submit validation.
Delivering that **same callback** as a regular prop named `forwardRef` (and
having the consumer wire `ref={forwardRef}` onto its inner `<input>`) is safe and
**preserves focus-on-error**, because what RHF depends on is that the callback is
invoked with the real DOM node — not which key delivered it. The `forwardRef`-prop
delivery also sidesteps React 18's "Function components cannot be given refs"
warning, which fires **only** for the reserved `ref` key on an unwrapped function
component.

## Findings

### 1. RHF `field.ref` — type (`RefCallBack`) and internal use

1. **Type.** `Controller`'s render-prop `field.ref` is typed **`RefCallBack`**.
   `RefCallBack` is defined in `@types/react` as `(instance: T | null) => void` —
   a **callback ref**, not a ref object. (Across RHF 7.x the runtime value of
   `field.ref` is always a callback; some older typings show `React.Ref<any>`
   but the value is a function.) [Source: `@types/react` `RefCallback`; RHF `Controller` API]
2. **What RHF does with it.** When React invokes the callback with the mounted
   DOM element, RHF stores that node in its internal **`_fields` registry**
   keyed by field name (alongside `name`, `value`, rules, etc.). The registered
   node is used for (a) reading the uncontrolled input value when needed and
   (b) **focus-on-error**. [Source: RHF `Controller` / `shouldFocusError` docs]
3. **Safe to forward as `forwardRef`.** **Yes.** RHF never inspects *how* the
   callback reached the DOM node; it only needs the callback to be invoked with
   the node. If the consumer receives `forwardRef` as a normal prop and applies
   it as `ref={forwardRef}` on its `<input>`, React invokes the callback with the
   input DOM node on mount (and `null` on unmount) — identical to the `ref`-key
   case. RHF captures it the same way. [Source: RHF `Controller` API; React ref-callback contract]

### 2. React 18 "Function components cannot be given refs" warning

4. **Exact trigger.** React 18 emits
   > `Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?`
   when a `ref` is passed via the **reserved `ref` key** to an element whose
   `type` is a plain function component (not wrapped in `React.forwardRef`, not a
   class, not a host/DOM element). React peels `ref`/`key` off props before they
   reach the component; for a function component it discards the ref (object-ref
   `current = null`; callback ref called with `null`) and logs the warning.
   Independent of the ref's shape (object / callback / string).
   [Source: React `react-reconciler` `attachRef`; React legacy "Forwarding Refs"]
5. **`forwardRef` prop does NOT trigger it.** `forwardRef` (like `inputRef`,
   `innerRef`, `myRef`) is **not** a React-reserved key. React passes it through
   as an ordinary entry on `props`; the function component receives it and must
   explicitly apply it (`ref={forwardRef}`). **No warning** is emitted, because
   React never performs ref-handling on a non-`ref` key. This is exactly the
   loophole the change exploits.
6. **React 19 difference (forward-compat).** In React 19, `ref` is a regular prop
   for function components ("ref as a prop"); passing the `ref` key to a function
   component no longer warns, and `React.forwardRef` is deprecated. The
   `forwardRef`-prop pattern therefore works identically in React 18 **and** 19;
   in 19 you could also pass the `ref` key directly. [Source: React 19 blog "ref as a prop" / Upgrading Guide]

### 3. Focus-on-error mechanism

7. **How RHF finds the node.** On `handleSubmit`, RHF validates. If
   `shouldFocusError` is true (default) and there are errors, RHF takes the first
   field name with an error, looks it up in its internal `_fields` registry, and
   calls `.focus()` on the stored DOM node captured by the callback ref at mount:
   ```
   const field = _fields[firstNameWithError];
   field._f.ref?.focus?.();
   ```
   (Identifier names approximate; behavior = look up registered node → `.focus()`.)
8. **Key conclusion.** As long as the ref callback was invoked with the actual
   focusable DOM `<input>` node, `.focus()` works and focus-on-error behaves
   **identically** whether the callback was delivered via the `ref` key or a
   `forwardRef` prop. The `forwardRef`-prop delivery does **not** weaken
   focus-on-error. [Source: RHF `shouldFocusError`; RHF field-registry internals]

### 4. Testing focus-on-error in jsdom (vitest + @testing-library/react)

9. **jsdom `.focus()` sets `document.activeElement`.** jsdom implements
   `HTMLElement.prototype.focus()`: for a focusable element it sets
   `document.activeElement = element`, dispatches a `focus` event, and
   `document.hasFocus()` returns `true`. It does **not** scroll or do visual
   focus, but `activeElement` is reliably set. `blur()` resets `activeElement`
   to `<body>`. So focus-on-error **is** observable in jsdom.
10. **Focusability requirement.** jsdom only focuses elements it considers
    focusable: `<input>`, `<button>`, `<textarea>`, `<select>`, `<a href>`, and
    elements with a `tabindex`. A bare `<div>` without `tabindex` is **not**
    focusable and `.focus()` is a no-op in jsdom. Ensure the ref targets an
    actual `<input>` (the normal RHF case) so the focus assertion can pass.
11. **Assertions.**
    - `expect(screen.getByTestId('my-input')).toHaveFocus()` — `toHaveFocus()`
      (from `@testing-library/jest-dom`) asserts `document.activeElement === element`.
    - Or directly: `expect(document.activeElement).toBe(screen.getByTestId('my-input'))`.
12. **Timing in the test.** RHF runs focus-on-error **synchronously** inside the
    submit handler. Prefer `await userEvent.click(submit)` (async; awaits
    microtasks reliably) or `fireEvent.submit(form)` + `await waitFor(...)`.
    After the submit settles, `document.activeElement` reflects the focused
    errored field. Preconditions for a green test: `shouldFocusError` not
    disabled, the field actually has a validation error (invalid value
    submitted), and the ref resolves to a focusable `<input>`.

## Practical recipe for the implementer (§20.6)

1. **Library exposes** RHF's `field.ref` callback via a regular **`forwardRef`**
   prop on the outer function component — it must **not** use React's reserved
   `ref` key on the outer component.
2. **Consumer wires it:** `function Input({ forwardRef, ...rest }) { return <input ref={forwardRef} data-testid="..." {...rest} />; }`
3. **No-warning test:** assert no React 18 "Function components cannot be given
   refs" warning is emitted (spy on `console.error`/`console.warn`; assert the
   substring never appears). The `forwardRef`-prop path should be warning-free;
   the `ref`-key path (control/baseline) should warn.
4. **Focus test:** submit an invalid value → `expect(await screen.findByTestId('field')).toHaveFocus()` (or `document.activeElement`).
5. **Version matrix:** the `forwardRef`-prop approach is universal across React
   18 and 19; only add an explicit React 19 `ref`-as-prop case if the matrix
   includes React 19.

## Sources

Kept (canonical; flagged for live re-verification in Gaps):
- RHF `Controller` / `UseControllerReturn` API — `field: { onChange, onBlur, value, name, ref, disabled }`. https://react-hook-form.com/docs/usecontroller/controller — defines `field.ref` shape.
- RHF `shouldFocusError` option (default `true`). https://react-hook-form.com/docs/useform — confirms focus-on-first-error behavior.
- `@types/react` `RefCallback` / `RefCallBack`. https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/index.d.ts — callback-ref signature.
- React `react-reconciler` ref-commit / `attachRef` logic — warning emitted only for the reserved `ref` key on function components. https://github.com/facebook/react (packages/react-reconciler).
- React docs "Forwarding Refs" (legacy) + React 19 "ref as a prop". https://react.dev/reference/react/forwardRef ; https://react.dev/blog/2024/12/05/react-19 — warning condition and the React 19 change.
- jsdom `HTMLElement.focus()` / `document.activeElement`. https://github.com/jsdom/jsdom — focus semantics in the DOM emulation.
- `@testing-library/jest-dom` `toHaveFocus()`. https://github.com/testing-library/jest-dom — matcher asserts `document.activeElement`.

Dropped:
- Generic "RHF with custom inputs" blog tutorials — restate canonical sources without adding evidence; some carry stale pre-7 APIs.
- Stack Overflow threads on the React warning — confirm the same condition; primary React source/docs are authoritative.

## Gaps

- **Live source verification unavailable this run** (no `web_search`/fetch tool
  in this environment). URLs above are the canonical locations from prior
  knowledge and were **not** re-fetched for the exact current revision. Before
  finalizing §20.6, re-confirm: (a) current RHF type annotation of `field.ref`
  (recent 7.x = `RefCallBack`); (b) exact React 19 wording in the Upgrading
  Guide; (c) that the project's pinned jsdom dispatches `focus` events (most do).
- **RHF version pinning.** Behavior is for RHF **7.x** (current major). Older
  majors differ in the `_fields` registry shape.
- **Empirical lock-in recommended:** a ~10-line vitest case passing RHF's
  `field.ref` through a `forwardRef` prop and asserting `toHaveFocus()` after an
  invalid submit would convert these claims into test evidence cheaply.
