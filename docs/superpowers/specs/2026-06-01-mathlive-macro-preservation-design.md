# MathLive Macro Preservation — Design Spec

**Date:** 2026-06-01
**Status:** Approved

---

## Problem

MathLive normalizes bold-variant LaTeX commands when they pass through its internal AST.
All three commands — `\boldsymbol`, `\bm`, `\bold` — map to a single AST node
`{variantStyle: "bold"}`. On serialization (`getValue('latex')`), MathLive applies this rule:

```
content is [a-zA-Z0-9]+  →  \mathbf{...}
otherwise                →  \bm{...}
```

This means a user who types `\boldsymbol{\rho}` and makes any edit in the visual MathField
will see the LaTeXBar update to `\bm{\rho}` — a different command that requires the `bm`
package. `\boldsymbol` is natively supported by MathJax without any external package;
emitting `\bm` or `\mathbf` in its place is incorrect for downstream typesetting.

### Root cause (confirmed from MathLive 0.101.2 source)

MathLive's parser resolves macros **before** built-in commands
(`scanSymbolOrLiteral` checks `scanMacro` first). Macro atoms store their original
command name as `verbatimLatex` and `getValue('latex')` returns it verbatim. Built-in
commands do not set `verbatimLatex` and go through the normalizing serializer.

---

## Goal

When the user types `\boldsymbol{...}` or `\bm{...}`, `getValue('latex')` must return
exactly that command — not a normalized substitute — even after subsequent visual edits
in the MathField.

---

## Scope

**In scope:**

- `\boldsymbol` — MathJax-native, no package required
- `\bm` — preserve verbatim if the user typed it

**Out of scope:**

- Whitespace normalizations (`\left (` → `\left(`, spaces around braces, `\limits` spacing,
  `_{0}` → `_0`) — these are structurally invisible to the AST and cannot be preserved
- `\\[0.45em]` → `\\[0.45 em]` row-gap space insertion — hardcoded template in MathLive's
  array serializer; requires a separate fix or upstream issue

---

## Solution

Override `\boldsymbol` and `\bm` as user-defined macros on the `MathfieldElement`.
Because macros are checked before built-ins, MathLive will store these as macro atoms
with `verbatimLatex` set, preserving the original command through all edits.

### Macro definitions

```ts
el.macros = {
  ...el.macros,
  boldsymbol: { def: '\\mathbf{#1}', args: 1 },
  bm: { def: '\\mathbf{#1}', args: 1 },
};
```

The `def` (`\mathbf{#1}`) is used only for MathLive's internal rendering. It shows the
content as bold in the visual editor. The actual `\boldsymbol` or `\bm` command is what
`getValue('latex')` returns — the `def` is never emitted.

**Known visual trade-off:** `\boldsymbol` / `\bm` render as bold _italic_ in real LaTeX;
`\mathbf` expansion in MathLive shows bold _upright_. This is acceptable — the editor is
a preview, and downstream typesetting uses the preserved original command.

### Where to wire it

`src/components/Editor/MathField.tsx` — in a dedicated `useEffect` that runs once on
mount, after the element ref is available. The component already owns element-setup
effects (input listener, virtual keyboard container); macro config belongs in the same
layer.

```ts
useEffect(() => {
  const el = mathFieldRef.current;
  if (!el) return;
  (el as MathfieldElement).macros = {
    ...(el as MathfieldElement).macros,
    boldsymbol: { def: '\\mathbf{#1}', args: 1 },
    bm: { def: '\\mathbf{#1}', args: 1 },
  };
}, [mathFieldRef]);
```

---

## Verification

After the change, this round-trip must hold:

```
setValue('\boldsymbol{\rho}')
// user makes any edit in MathField
getValue('latex')  →  '\boldsymbol{\rho}'   ✓  (not '\bm{\rho}' or '\mathbf{\rho}')

setValue('\bm{x}')
getValue('latex')  →  '\bm{x}'              ✓  (not '\mathbf{x}')
```

Manual test: paste the user's original LaTeX string into the LaTeXBar, make a small edit
in the visual MathField, confirm the LaTeXBar still shows the original bold command.
