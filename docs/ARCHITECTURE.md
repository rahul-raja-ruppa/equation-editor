# Equation Editor — Architecture

## Overview

The editor is a self-contained React SPA served as static files. The Kriya CMS embeds it in an
`<iframe>` and communicates exclusively via `window.postMessage`. There is no shared JS context
between the CMS page and the editor — all state handoff is message-based.

```
┌─── Kriya CMS page ──────────────────────────────┐
│                                                  │
│   <iframe src="/equation-editor/index.html">     │
│   ┌──────────────────────────────────────────┐   │
│   │  Zone 1 — Quick Access (always visible)  │   │
│   │  Zone 2 — Expression Library (tabbed)    │   │
│   │  Zone 3 — MathLive Canvas                │   │
│   │  Zone 4 — Footer (LaTeX | Type | Insert) │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
│   postMessage ←→ usePostMessage hook             │
└──────────────────────────────────────────────────┘
         │
         ↓ postMessage({ type: 'insert', latex, mathml, ... })
   kriya2.0 host (eventHandler.js)
         │
         ↓ POST /api/texconversion + kriya.general.updateEquation
```

The editor converts LaTeX → MathML itself (via MathJax, see `src/lib/texToMathML.ts`) and
hands the host raw `latex`/`mathml`. The host owns the `/api/texconversion` call — it has the
customer/project config context (`mathMLConversion`, `class`, etc.) needed to resolve conversion
settings server-side.

---

## Component Tree

```
App
├── Toolbar
│   ├── QuickAccessBar          — 2 fixed rows (symbols + templates), always visible
│   │   └── QuickButton         — { latex, glyph, tooltip } → mathfield.insert(latex)
│   ├── TabStrip                — 10 tab headers; manages activeTab state
│   └── ExpressionLibrary       — chip grid for active tab, loaded lazily
│       └── ExpressionChip      — { latex, display, label } → mathfield.insert(latex)
├── EditorCanvas
│   ├── MathField               — wraps <math-field> web component; exposes insert/getValue/setValue
│   └── LaTeXBar                — read-only latex preview; click to toggle raw-edit mode
└── ActionBar
    ├── TypeToggle              — 'display' | 'inline'
    ├── SizeControl             — font size in pt: 10 | 11 | 12 | 14 | 16
    ├── CancelButton            — fires postMessage({ type: 'cancel' })
    └── InsertButton            — triggers insert flow (see Data Flow below)
```

---

## Custom Hooks

| Hook             | Owns                                 | Exposes                                                     |
| ---------------- | ------------------------------------ | ----------------------------------------------------------- |
| `useMathField`   | `ref` to `<math-field>` DOM element  | `insert(latex)`, `getValue(format)`, `setValue(latex)`      |
| `usePostMessage` | `message` event listener on `window` | fires `onLoad({ latex, config })` callback; `send(payload)` |
| `useTabData`     | lazy-loaded tab JSON cache           | `{ expressions, loading }` for active tab                   |

---

## Data Flow

### Load — CMS → Editor

```
CMS fires:
  iframe.contentWindow.postMessage({
    type: 'load',
    latex: '\\frac{a}{b}',        // empty string for new equation
    config: {
      fontSize: 12,
      mathType: 'display',        // 'display' | 'inline'
      customer: 'bmj',
      project: 'bjophthalmol',
      doi: 'article-doi'
    }
  }, CMS_ORIGIN)

Editor receives (usePostMessage):
  → useMathField.setValue(latex)
  → TypeToggle initialised from config.mathType
  → SizeControl initialised from config.fontSize
  // customer/project/doi are part of the load contract but are not consumed
  // by the editor — the host resolves them itself when it owns the
  // /api/texconversion call (see Insert flow below)
```

### Insert — Editor → CMS

```
User clicks Insert
  → latex  = mathfield.getValue('latex')
  → mathml = await texToMathML(latex, mathType === 'display')
       // client-side LaTeX → MathML via MathJax (src/lib/texToMathML.ts);
       // mirrors the legacy VisualMathEditorNew.js `updateEq()` output,
       // including the eLife inline-equation attribute strip
  → postMessage({
        type:     'insert',
        latex,
        mathml,
        fontSize,                 // from SizeControl state
        mathType                  // from TypeToggle state
    }, CMS_ORIGIN)

Host (kriya2.0, eventHandler.js `insert` listener) then:
  → POST /api/texconversion (customer/project/doi resolved server-side)
  → kriya.general.updateEquation(mathml, latex, data, fontSize, mathType)
```

**On conversion error:** `texToMathML` rejects (e.g. malformed LaTeX, or the lazily-loaded
MathJax chunk fails to fetch) — the Insert button shows an inline error state and no message
is sent. User can retry or cancel.

### Cancel

```
User clicks Cancel (or CMS closes iframe)
  → postMessage({ type: 'cancel' }, CMS_ORIGIN)
```

---

## postMessage Protocol

### CMS → Editor

```json
{
  "type": "load",
  "latex": "\\frac{a}{b}",
  "config": {
    "fontSize": 12,
    "mathType": "display",
    "customer": "bmj",
    "project": "bjophthalmol",
    "doi": "article-doi"
  }
}
```

- `latex`: empty string `""` for a new equation.
- `mathType`: `"display"` (block, `\displaystyle`) or `"inline"`.
- `customer` / `project` / `doi`: required by the load contract, but the editor itself no longer
  consumes them — the host resolves conversion settings server-side when it owns the
  `/api/texconversion` call (see Insert flow).

### Editor → CMS (insert)

```json
{
  "type": "insert",
  "latex": "\\frac{a}{b}",
  "mathml": "<math xmlns='http://www.w3.org/1998/Math/MathML'>...</math>",
  "fontSize": 12,
  "mathType": "display"
}
```

### Editor → CMS (cancel)

```json
{ "type": "cancel" }
```

### Origin security

- `usePostMessage` checks `e.origin` against `import.meta.env.VITE_CMS_ORIGIN` before processing any message.
- Insert sends to the stored origin from the load message, not `'*'`.
- `VITE_CMS_ORIGIN` defaults to `window.location.origin` for local dev.

---

## LaTeX → MathML Conversion

Conversion now happens in two independent places — the editor no longer calls
`/api/texconversion` itself (the earlier `src/api/texconversion.ts` integration was removed):

1. **Client-side, in the editor** — `texToMathML(latex, display)` in `src/lib/texToMathML.ts`
   runs MathJax (TeX input → internal MmlNode → `SerializedMmlVisitor`, stopping at
   `STATE.CONVERT`) entirely in the browser, lazily importing the MathJax chunks on first use.
   It mirrors the legacy `VisualMathEditorNew.js` `updateEq()` post-processing — including
   stripping `displaystyle`/`scriptlevel` attributes for inline equations per eLife's
   requirement. The result is sent to the host as `mathml` in the `insert` message.
2. **Server-side, on the host** — `kriya2.0`'s `eventHandler.js` `insert` listener owns the
   `POST /api/texconversion` call (resolving `customer`/`project`/`doi`/`indesignAutoPageConfig`
   itself, since it has that context already) and performs the DOM update via
   `kriya.general.updateEquation(mathml, latex, data, fontSize, mathType)`. That contract is
   entirely the host's concern and out of scope for this document.

---

## Data Formats

### Quick Access (`src/data/quickaccess.ts`)

```ts
export const symbols: QuickButtonDef[] = [
  { latex: '\\leq', glyph: '≤', tooltip: 'Less than or equal' },
  // ...
];

export const templates: QuickButtonDef[] = [
  { latex: '\\frac{#0}{#1}', glyph: '½', tooltip: 'Fraction' },
  // ...
];
```

### Tab JSON (`src/data/tabs/<name>.json`)

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

`#0`, `#1` are MathLive placeholder slots — cursor jumps to `#0` after `mathfield.insert()`.

---

## Performance Targets

| Metric                 | Target                              |
| ---------------------- | ----------------------------------- |
| Bundle size (gzip)     | < 200 KB                            |
| Time to interactive    | < 1 s                               |
| Symbol insert → render | < 16 ms (synchronous)               |
| Insert with image      | < 800 ms (texconversion round-trip) |

---

## What Is Out of Scope (v1)

- Handwriting input
- ChemType / chemistry mode
- RTL / multi-language
- Dark mode / theme switching
- Color picker
- PNG export dialog
- User-editable expression tabs
