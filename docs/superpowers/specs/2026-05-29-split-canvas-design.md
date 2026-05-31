# Split Canvas Design — 50/50 Stacked MathLive + LaTeX Panel

**Date:** 2026-05-29
**Status:** Approved

## Problem

The current canvas area shows only the MathLive interactive editor. The LaTeXBar at the bottom is a single-line pill — click to reveal a one-line input. This is cramped for long expressions and gives no persistent view of the raw LaTeX while editing.

## Goal

Split the canvas 50/50 vertically: MathLive visual editor on top, a full-height editable LaTeX textarea on the bottom. Both panels stay in sync in real time.

## Layout

The `.canvas` region in `App.module.css` becomes a column flex container with two equal children (`flex: 1` each):

```
┌─────────────────────────────────────┐
│  TOOLBAR (unchanged)                │
├─────────────────────────────────────┤
│  EXPRESSION LIBRARY (unchanged)     │
├─────────────────────────────────────┤
│                                     │
│  MathField — MathLive interactive   │  ← flex: 1
│                                     │
├─────────────────────────────────────┤
│                                     │
│  LaTeXPanel — raw LaTeX textarea    │  ← flex: 1
│                                     │
├─────────────────────────────────────┤
│  ACTION BAR (unchanged)             │
└─────────────────────────────────────┘
```

## Components

### LaTeXPanel (new)

- File: `src/components/Editor/LaTeXPanel.tsx` + `LaTeXPanel.module.css`
- A controlled `<textarea>` — always editable, no click-to-reveal.
- Props: `value: string`, `onChange: (latex: string) => void`
- Styles: `height: 100%`, `resize: none`, monospace font, subtle tinted background to distinguish from the MathLive pane.

### LaTeXBar (deleted)

- `src/components/Editor/LaTeXBar.tsx` and `LaTeXBar.module.css` are removed.

### App.tsx changes

- Replace `<LaTeXBar value={currentLatex} onCommit={handleLatexCommit} />` with `<LaTeXPanel value={currentLatex} onChange={handleLatexChange} />`.
- Add a `debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)` for the textarea → MathLive sync.
- `handleLatexChange(draft)`:
  1. `setCurrentLatex(draft)` — immediate (keeps textarea controlled)
  2. Clear any pending debounce timer
  3. Set new timer: after 300ms, call `mathField.setValue(draft)`

### App.module.css changes

- `.canvas`: add `flex-direction: column` (already `display: flex` implied by the two children needing to stack).
- `.canvas > :first-child` rule (currently `flex: 1`) stays; add `.canvas > :last-child { flex: 1; min-height: 0; }`.

## Sync Contract

```
MathLive input event → setCurrentLatex(latex) → LaTeXPanel.value      [immediate]
LaTeXPanel onChange  → setCurrentLatex(draft)  → mathField.setValue()  [debounced 300ms]
```

- MathLive → textarea: always immediate — the `input` event handler in `MathField` already calls `onChange` which sets `currentLatex` in `App`.
- Textarea → MathLive: debounced 300ms to avoid MathLive resetting cursor position on every keystroke.

## What Is Not Changing

- `ToolbarZone`, `ExpressionZone`, `ActionBar` — untouched.
- `MathField` component internals — untouched.
- `postMessage` protocol (`load` / `insert` / `cancel`) — untouched.
- Insert / Cancel flow — untouched.

## Files Touched

| File                                          | Action                                       |
| --------------------------------------------- | -------------------------------------------- |
| `src/App.module.css`                          | Modify `.canvas`                             |
| `src/App.tsx`                                 | Swap `LaTeXBar` → `LaTeXPanel`, add debounce |
| `src/components/Editor/LaTeXBar.tsx`          | Delete                                       |
| `src/components/Editor/LaTeXBar.module.css`   | Delete                                       |
| `src/components/Editor/LaTeXPanel.tsx`        | Create                                       |
| `src/components/Editor/LaTeXPanel.module.css` | Create                                       |
