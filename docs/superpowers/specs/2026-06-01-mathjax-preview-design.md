# MathJax Preview — Design Spec

**Date:** 2026-06-01  
**Status:** Approved for implementation  
**Branch:** feature/mathjax-preview

---

## 1. Goal

Add an on-demand MathJax 3 preview pane to the canvas zone so users can validate that the LaTeX they authored in MathLive renders correctly in MathJax — the renderer used across the academic publishing industry for web output.

The preview is **off by default** and toggled via a button in the MathField card's existing `floatingToolbar` row (beside Undo/Redo/Clear). When active, the canvas splits side-by-side: MathLive editor on the left, MathJax render on the right.

---

## 2. Design Decisions

| Concern | Decision | Reason |
|---|---|---|
| MathJax loading | Lazy npm import (dynamic `import()`, code-split by Vite) | Keeps TTI < 1s and bundle < 200KB gzip; no CDN dependency |
| Toggle placement | Inside `MathField` `floatingToolbar`, beside Undo/Redo/Clear | Self-contained — only `MathField.tsx` needs to change |
| Preview state | Local `useState` inside `MathField` | Preview is purely a canvas concern; no need to lift to `App.tsx` |
| Canvas split | CSS Grid `1fr 1fr` when preview is on, `1fr` when off | Smooth animated transition via CSS `grid-template-columns` |
| MathJax error handling | Silent fallback — show a neutral "could not render" message | Invalid LaTeX is common mid-edit; don't interrupt the flow |
| LaTeX input to MathJax | `currentLatex` prop passed down from `App.tsx` → `MathField` | Already flows as `onChange` callback; just needs to be stored |

---

## 3. Component Changes

### New: `MathJaxPreview` component (`src/components/MathPreview/MathJaxPreview.tsx`)

- Accepts `latex: string` and `mathType: 'display' | 'inline'` props
- Dynamically imports `mathjax-full` on first render (lazy, cached after first load)
- Renders into a `<div>` via MathJax's `tex2svg` or `tex2chtml` API
- Shows a loading spinner while MathJax is initializing (first toggle only)
- Shows a neutral error state if MathJax throws on the given LaTeX

### Modified: `MathField` component

- Accepts new prop `latex: string` (current value, for passing to preview)
- Accepts new prop `mathType: 'display' | 'inline'`
- Adds `previewOpen: boolean` local state
- Adds "⚡ MathJax" toggle button in `floatingToolbar`
- When `previewOpen`, wraps card contents in a `1fr 1fr` grid: left = existing `math-field`, right = `MathJaxPreview`

### Modified: `App.tsx`

- Passes `currentLatex` and `mathType` as props to `MathField`

---

## 4. Canvas Layout

**Default (preview off):**
```
┌─────────────────────────────────────────┐
│         math-field (MathLive)           │
│  [↩] [↪] [✕] | [⚡ MathJax]            │  ← floatingToolbar
└─────────────────────────────────────────┘
[ LaTeX: \int_{a}^{b}... ]  [⎘]
```

**Preview on:**
```
┌─────────────────────────┬───────────────────────────┐
│  math-field (MathLive)  │  MathJax Preview          │
│                         │  ─────────────────────    │
│  ∫ₐᵇ f(x) dx |cursor|  │  ∫ₐᵇ f(x) dx             │
│  [↩] [↪] [✕] | [⚡ On] │                           │
└─────────────────────────┴───────────────────────────┘
[ LaTeX: \int_{a}^{b}... ]  [⎘]
```

---

## 5. MathJax Integration

Use `mathjax-full` npm package, loaded via dynamic import on first toggle:

```ts
const { mathjax } = await import('mathjax-full/js/mathjax.js');
const { CHTML } = await import('mathjax-full/js/output/chtml.js');
const { TeX } = await import('mathjax-full/js/input/tex.js');
const { browserAdaptor } = await import('mathjax-full/js/adaptors/browserAdaptor.js');
const { RegisterHTMLHandler } = await import('mathjax-full/js/handlers/html.js');
```

Instance is created once and reused. Render is triggered on every `latex` prop change (debounced 150ms to avoid thrashing during fast typing).

---

## 6. Performance Constraints

- MathJax chunk must not block initial render — dynamic import only
- Debounce re-renders at 150ms
- MathJax instance initialized once, reused across renders
- No MathJax in the initial bundle
