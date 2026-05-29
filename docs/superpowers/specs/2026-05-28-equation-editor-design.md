# Equation Editor — Design Spec

**Date:** 2026-05-28  
**Status:** Approved for implementation  
**Stack:** React + Vite · MathLive · Light Pro UI  
**Replaces:** `kriya2.0/cms/v3.0/js/equation_editor` (jQuery + EasyUI + MathJax 2.7)

---

## 1. Goal

Build a lightweight, fast, web-based equation editor that:

- Feels familiar to users of MathType — same mental model (quick-access rows + tabbed expression library + big editing canvas)
- Is visually modern and eye-friendly — not a pixel-perfect MathType clone
- Embeds in the Kriya CMS via `<iframe>` with `postMessage` communication
- Outputs LaTeX + MathML + rendered image on Insert
- Loads in under 1 second, with zero jQuery/EasyUI/MathJax baggage

---

## 2. Technology Decisions

| Concern           | Choice                        | Reason                                                                                                     |
| ----------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Framework         | React 18 + Vite               | Component boundaries map cleanly to toolbar/canvas/footer; fast HMR in dev                                 |
| Math input engine | MathLive (`mathlive` npm)     | WYSIWYG `<math-field>` web component; replaces both CodeMirror (input) and MathJax (preview); ~150 KB gzip |
| Styling           | Plain CSS modules             | No runtime overhead; predictable scoping                                                                   |
| CMS integration   | `<iframe>` + `postMessage`    | Zero changes to CMS HTML; clean separation                                                                 |
| Image generation  | Existing `/api/texconversion` | Unchanged backend contract                                                                                 |
| Symbol data       | JSON files per tab            | Editable without touching component code                                                                   |

**What we drop:** jQuery, jQuery EasyUI, MathJax 2.7, CodeMirror, canvg, jquery-colorpicker — all gone.

---

## 3. UI Layout (4 Zones)

```
┌─────────────────────────────────────────────────────────┐
│  ZONE 1 — Quick Access (always visible, 2 rows)         │
│  Row 1: ≤ ≥ ≈ ≠ ≡ ± × ÷ | → ⇒ ⟺ | ∈ ∉ ⊂ ∪ ∩ ∅ | ...  │
│  Row 2: ½ √ ∛ x² xₙ | () [] {} |x| ⌊⌋ | ∑ ∏ ∫ ∬ ∮ ... │
├─────────────────────────────────────────────────────────┤
│  ZONE 2 — Expression Library (tabbed)                   │
│  [Algebra][Calculus][Statistics][Matrices][Sets]        │
│  [Trig][Geometry][Greek][Arrows][More +]                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ √(a²+b²)  lim(x→∞)  (-b±√Δ)/2a  n!/r!(n-r)! …│   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  ZONE 3 — MathLive Canvas                              │
│                                                         │
│    ∫ₐᵇ f(x) dx = F(b) − F(a) |cursor|                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ZONE 4 — Footer                                        │
│  [ \int_{a}^{b} f(x)\,dx ... ]  Type▾  Size▾  Cancel  Insert │
└─────────────────────────────────────────────────────────┘
```

### Zone 1 — Quick Access (always visible)

Two fixed rows that are **always visible** regardless of active tab. Users familiar with MathType will find the most-used symbols here without clicking through tabs.

- **Row 1 (symbols):** ~26 symbols grouped by category with visual dividers — relations, arrows, set theory, logic/misc. White buttons, hover lifts with blue tint.
- **Row 2 (templates):** ~20 structural templates — fractions, roots, scripts, fences, big operators. Blue-tinted buttons to visually distinguish "structure" from "symbol".

Clicking any button calls `mathfield.insert(latex)` at the current cursor position.

### Zone 2 — Expression Library (tabbed)

10 tabs. Each tab shows a horizontal row of **expression chips** — full formula shortcuts, not just single symbols. Each chip has a small category badge label.

| Tab        | Sample expressions                                        |
| ---------- | --------------------------------------------------------- |
| Algebra    | √(a²+b²), lim(x→∞), (-b±√Δ)/2a, n!/r!(n−r)!, aₙ=a₁+(n−1)d |
| Calculus   | ∫f(x)dx, d/dx f(x), ∂f/∂x, ∫ₐᵇf(x)dx, ∇f, Δx→0            |
| Statistics | x̄ = Σx/n, σ², P(A∩B), nCr, z=(x−μ)/σ                      |
| Matrices   | 2×2, 3×3, augmented, column vector, row vector            |
| Sets       | A∪B, A∩B, A⊆B, Aᶜ, A×B, P(A)                              |
| Trig       | sin²θ+cos²θ=1, tanθ=sinθ/cosθ, sin(A±B), law of cosines   |
| Geometry   | Pythagorean a²+b²=c², area formulas, circle equations     |
| Greek      | Full alphabet α…ω and Α…Ω as individual chips             |
| Arrows     | All arrow variants as individual chips                    |
| More +     | Chemical notation, logic symbols, spacing, typography     |

Clicking a chip calls `mathfield.insert(latex)` with the full expression template.

### Zone 3 — MathLive Canvas

The `<math-field>` web component from MathLive. This is the WYSIWYG editing area — renders the equation in real time as the user types or inserts symbols.

- Auto-italic for variables, auto-upright for function names (sin, cos, log…)
- Full keyboard navigation (arrow keys, Home/End, Shift+select)
- Ctrl+Z/Y undo/redo
- Fence auto-scaling
- Blinking cursor

The canvas has comfortable vertical padding so the equation has room to breathe — not cramped like the original editor.

### Zone 4 — Footer

A single bar containing:

| Element           | Detail                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| **LaTeX pill**    | Read-only monospace strip showing current `mathfield.value`. Clickable to switch to raw LaTeX edit mode. |
| **Type selector** | `Display` / `Inline` dropdown. Affects `\displaystyle` wrapping and how the CMS renders the equation.    |
| **Size selector** | Font size in pt (10, 11, 12, 14, 16). Passed to `/api/texconversion`.                                    |
| **Cancel button** | Posts `{ type: 'cancel' }` via postMessage.                                                              |
| **Insert button** | Triggers the insert flow (see §5).                                                                       |

---

## 4. Component Architecture

```
App
├── Toolbar
│   ├── QuickAccessBar        — 2 fixed rows of symbol/template buttons
│   │   └── QuickButton       — single button: latex string + display glyph + tooltip
│   ├── TabStrip              — 10 tab headers
│   └── ExpressionLibrary     — chips for active tab
│       └── ExpressionChip    — full expression shortcut
├── EditorCanvas
│   ├── MathField             — wraps <math-field>, exposes ref
│   └── LaTeXBar              — shows mathfield.value, click-to-edit
└── ActionBar
    ├── TypeToggle            — display | inline
    ├── SizeControl           — pt selector
    ├── CancelButton
    └── InsertButton
```

### Custom hooks

| Hook             | Responsibility                                                                        |
| ---------------- | ------------------------------------------------------------------------------------- |
| `useMathField`   | Holds ref to `<math-field>`, exposes `insert(latex)`, `getValue()`, `setValue(latex)` |
| `usePostMessage` | Listens for `load` messages from CMS on mount; sends `insert`/`cancel` on user action |
| `useTabData`     | Lazy-loads the JSON for the active tab (only fetches on first activation)             |

---

## 5. Data Flow

### Load (CMS → Editor)

```
CMS: iframe.contentWindow.postMessage({ type: 'load', latex: '...', config: { fontSize: 12, mathType: 'display' } }, '*')
  → usePostMessage receives message
  → useMathField.setValue(latex)
  → TypeToggle and SizeControl initialise from config
```

### Insert (Editor → CMS)

```
User clicks Insert
  → read mathfield.getValue('latex')        // e.g. \frac{a}{b}
  → read mathfield.getValue('math-ml')      // <math>...</math>
  → POST /api/texconversion { tex, mathml, fontSize, mathType, ... }
  → await imageUrl from response
  → postMessage({ type: 'insert', latex, mathml, imageUrl, fontSize, mathType })
```

### Cancel

```
User clicks Cancel
  → postMessage({ type: 'cancel' })
```

---

## 6. postMessage Protocol

### CMS → Editor

```json
{
  "type": "load",
  "latex": "\\frac{a}{b}",
  "config": {
    "fontSize": 12,
    "mathType": "display",
    "customer": "...",
    "project": "...",
    "doi": "..."
  }
}
```

### Editor → CMS (insert)

```json
{
  "type": "insert",
  "latex": "\\frac{a}{b}",
  "mathml": "<math xmlns='...'><mfrac>...</mfrac></math>",
  "imageUrl": "/api/texconversion/result/...",
  "fontSize": 12,
  "mathType": "display"
}
```

### Editor → CMS (cancel)

```json
{ "type": "cancel" }
```

---

## 7. Symbol & Expression Data Format

Each tab's data lives in `src/data/tabs/<tabname>.json`:

```json
{
  "id": "algebra",
  "label": "Algebra",
  "expressions": [
    { "latex": "\\sqrt{#0}", "display": "√(…)", "label": "Root" },
    { "latex": "\\lim_{x \\to #0} #1", "display": "lim(x→…)", "label": "Limit" },
    {
      "latex": "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
      "display": "(-b±√Δ)/2a",
      "label": "Quadratic"
    }
  ]
}
```

Quick-access button data lives in `src/data/quickaccess.ts` — two arrays (`symbols[]`, `templates[]`), each item `{ latex, glyph, tooltip }`.

`#0`, `#1` are MathLive placeholder slots — cursor jumps to the first slot after insertion.

---

## 8. File Structure

```
equation-editor-poc/
├── index.html
├── vite.config.ts
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.module.css
    ├── components/
    │   ├── Toolbar/
    │   │   ├── QuickAccessBar.tsx
    │   │   ├── QuickAccessBar.module.css
    │   │   ├── QuickButton.tsx
    │   │   ├── TabStrip.tsx
    │   │   ├── ExpressionLibrary.tsx
    │   │   ├── ExpressionLibrary.module.css
    │   │   └── ExpressionChip.tsx
    │   ├── Editor/
    │   │   ├── MathField.tsx
    │   │   ├── MathField.module.css
    │   │   └── LaTeXBar.tsx
    │   └── ActionBar/
    │       ├── ActionBar.tsx
    │       └── ActionBar.module.css
    ├── hooks/
    │   ├── useMathField.ts
    │   ├── usePostMessage.ts
    │   └── useTabData.ts
    ├── api/
    │   └── texconversion.ts
    ├── data/
    │   ├── quickaccess.ts
    │   └── tabs/
    │       ├── algebra.json
    │       ├── calculus.json
    │       ├── statistics.json
    │       ├── matrices.json
    │       ├── sets.json
    │       ├── trig.json
    │       ├── geometry.json
    │       ├── greek.json
    │       ├── arrows.json
    │       └── more.json
    └── types/
        └── index.ts
```

---

## 9. Performance Targets

| Metric                 | Target   | Mechanism                                                          |
| ---------------------- | -------- | ------------------------------------------------------------------ |
| Bundle size (gzip)     | < 200 KB | MathLive ~150 KB + thin React shell; no jQuery/EasyUI/MathJax      |
| Time to interactive    | < 1 s    | Vite code-split; tab JSON lazy-loaded on first tab activation      |
| Symbol insert → render | < 16 ms  | `mathfield.insert()` is synchronous; no network round-trip         |
| Insert with image      | < 800 ms | LaTeX + MathML ready instantly; only `/api/texconversion` is async |

---

## 10. What Is Explicitly Out of Scope

- **Handwriting input** — not in v1; MathLive supports it but adds complexity
- **ChemType / chemistry mode** — separate concern, separate editor
- **Multi-language / RTL** — not needed for Kriya CMS
- **Theme switching** — Light Pro only; dark mode not in v1
- **Color picker** — the original editor had one; removed as no user demand identified
- **PNG export UI** — image is generated silently on Insert; no separate export dialog
- **Saving custom expressions to tabs** — tabs are read-only JSON in v1

---

## 11. CMS Integration (How to embed)

Add to the CMS page where the equation editor is triggered:

```html
<iframe
  id="eq-editor"
  src="/equation-editor/index.html"
  style="width:760px; height:420px; border:none;"
></iframe>
```

On open (send existing equation if editing):

```js
document.getElementById('eq-editor').contentWindow.postMessage(
  {
    type: 'load',
    latex: existingLatex || '',
    config: { fontSize: 12, mathType: 'display', customer, project, doi },
  },
  '*'
);
```

On receive:

```js
window.addEventListener('message', (e) => {
  if (e.data.type === 'insert') {
    const { latex, mathml, imageUrl, fontSize, mathType } = e.data;
    // update equation in CMS
  }
  if (e.data.type === 'cancel') {
    // close/hide the iframe
  }
});
```
