# MathLive Macro Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent MathLive from normalizing `\boldsymbol` and `\bm` to `\mathbf`/`\bm` during AST round-trips by registering them as macros before built-in command resolution.

**Architecture:** One `useEffect` added to `MathField.tsx` sets `el.macros` on the `MathfieldElement` after mount. MathLive checks user-defined macros before built-ins, so the atoms are stored verbatim and `getValue('latex')` returns the original command unchanged.

**Tech Stack:** React 18, MathLive 0.101.2, TypeScript

---

### Task 1: Add macro config effect to MathField.tsx

**Files:**

- Modify: `src/components/Editor/MathField.tsx`

**Context:**
`MathField.tsx` renders the `<math-field>` custom element and already has two `useEffect` hooks:

- One that attaches the `input` event listener (reads `onChange`)
- One that sets `window.mathVirtualKeyboard.container`

The new effect follows the same pattern: read `mathFieldRef.current`, guard on null, configure the element.

`MathfieldElement.macros` is a settable JS property (not an HTML attribute). Setting it replaces the macro dictionary, so spread `el.macros` first to preserve MathLive's built-in macro definitions.

- [ ] **Step 1: Open `src/components/Editor/MathField.tsx` and locate the two existing `useEffect` hooks**

The first starts at the line:

```ts
useEffect(() => {
  const el = mathFieldRef.current;
  if (!el || !onChange) return;
```

The second starts at:

```ts
useEffect(() => {
  if (kbPanelRef.current) {
```

- [ ] **Step 2: Add the macro config effect between the two existing effects**

The `MathfieldElement` type from `mathlive` exposes the `macros` property. The import at the top already brings in `MathfieldElement` — no new import needed.

Add this block between the two existing `useEffect` calls:

```ts
useEffect(() => {
  const el = mathFieldRef.current as MathfieldElement | null;
  if (!el) return;
  el.macros = {
    ...el.macros,
    boldsymbol: { def: '\\mathbf{#1}', args: 1 },
    bm: { def: '\\mathbf{#1}', args: 1 },
  };
}, [mathFieldRef]);
```

After the edit, the three effects in order are:

1. `input` event listener (depends on `[mathFieldRef, onChange]`)
2. **macro config** (depends on `[mathFieldRef]`) ← new
3. virtual keyboard container (depends on `[]`)

- [ ] **Step 3: Verify the file compiles cleanly**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run lint
```

Expected: no errors. If TypeScript complains about the `macros` setter type, cast `el` explicitly as shown in Step 2 (`as MathfieldElement | null`) — `MathfieldElement` is already imported at line 3.

- [ ] **Step 4: Start the dev server**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run dev
```

Open `http://localhost:5173` in a browser.

- [ ] **Step 5: Manual verification — boldsymbol round-trip**

In the browser console, fire a `load` message with a `\boldsymbol` expression:

```js
window.postMessage(
  {
    type: 'load',
    latex:
      '\\begin{array}{c}\\frac{d}{dt}\\boldsymbol{\\rho}(t)=-i\\mathbf{L}(t)\\boldsymbol{\\rho}(t)\\end{array}',
    config: { fontSize: 12, mathType: 'display', customer: 'test', project: 'test', doi: 'test' },
  },
  '*'
);
```

1. Confirm the LaTeXBar shows `\boldsymbol{\rho}` (not `\bm` or `\mathbf`)
2. Click into the visual MathField and press any key (e.g., space then backspace) to trigger an `input` event
3. Confirm the LaTeXBar **still** shows `\boldsymbol{\rho}` — not `\bm{\rho}` or `\mathbf{\rho}`

- [ ] **Step 6: Manual verification — bm round-trip**

```js
window.postMessage(
  {
    type: 'load',
    latex: '\\bm{x} + \\bm{\\rho}',
    config: { fontSize: 12, mathType: 'display', customer: 'test', project: 'test', doi: 'test' },
  },
  '*'
);
```

1. Trigger an `input` event in MathField (click in, press a key)
2. Confirm LaTeXBar shows `\bm{x} + \bm{\rho}` — not `\mathbf{x} + \mathbf{\rho}`

- [ ] **Step 7: Commit**

```bash
git add src/components/Editor/MathField.tsx
git commit -m "fix: preserve \\boldsymbol and \\bm via MathLive macro override

MathLive normalizes all bold-variant commands (\\boldsymbol, \\bm, \\bold)
to \\mathbf or \\bm depending on content. By registering \\boldsymbol and
\\bm as user macros, MathLive stores them as macro atoms with verbatimLatex
set, so getValue('latex') returns the original command unchanged after
visual edits in the MathField."
```
