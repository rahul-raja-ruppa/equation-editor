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
         ↓ POST /api/texconversion (on Insert only)
   kriya2.0 backend
```

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

| Hook | Owns | Exposes |
|------|------|---------|
| `useMathField` | `ref` to `<math-field>` DOM element | `insert(latex)`, `getValue(format)`, `setValue(latex)` |
| `usePostMessage` | `message` event listener on `window` | fires `onLoad({ latex, config })` callback; `send(payload)` |
| `useTabData` | lazy-loaded tab JSON cache | `{ expressions, loading }` for active tab |

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
  → customer/project/doi stored in context for Insert call
```

### Insert — Editor → CMS

```
User clicks Insert
  → latex  = mathfield.getValue('latex')
  → mathml = mathfield.getValue('math-ml')
  → POST /api/texconversion {
        tex:      latex,
        mathmode: mathType,       // from TypeToggle state
        customer, project, doi,   // from load config
        config:   null            // server auto-loads indesignAutoPageConfig.js
    }
  → await response → extract imageUrl
  → postMessage({
        type:     'insert',
        latex,
        mathml,
        imageUrl,
        fontSize,                 // from SizeControl state
        mathType                  // from TypeToggle state
    }, CMS_ORIGIN)
```

**On API error:** Insert button shows an error state; no message is sent. User can retry or cancel.

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
    "project":  "bjophthalmol",
    "doi":      "article-doi"
  }
}
```

- `latex`: empty string `""` for a new equation.
- `mathType`: `"display"` (block, `\displaystyle`) or `"inline"`.
- `customer` / `project` / `doi`: required — passed through to `/api/texconversion`.

### Editor → CMS (insert)

```json
{
  "type":     "insert",
  "latex":    "\\frac{a}{b}",
  "mathml":   "<math xmlns='http://www.w3.org/1998/Math/MathML'>...</math>",
  "imageUrl": "https://s3.../equations/abc123.png",
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

## /api/texconversion Contract

Endpoint lives on the kriya2.0 host. The iframe shares the CMS session cookie so auth is automatic.

### Request

```
POST /api/texconversion
Content-Type: application/json

{
  "tex":      "\\frac{a}{b}",   // LaTeX string, required
  "customer": "bmj",             // required
  "project":  "bjophthalmol",    // required
  "doi":      "article-doi",     // required
  "mathmode": "display",         // 'display' | 'inline'
  "config":   null               // null → server loads indesignAutoPageConfig.js for customer/project
}
```

### Response

`200 OK` — body is the downstream texConversion service response.
Inferred shape (verify against live instance):
```json
{ "imageUrl": "https://s3.../equations/abc123.png" }
```

The old editor passed the full `response.body` as the `data` argument to
`kriya.general.updateEquation(mathml, tex, data, fontSize, mathType)`.

**Action required before implementing `src/api/texconversion.ts`:** make a real request to
`/api/texconversion` in a running kriya2.0 instance and log `response.body` to confirm the shape.

### Error cases

| HTTP | Meaning | Editor behaviour |
|------|---------|-----------------|
| 500 `ERROR:Parameter missing.` | Missing tex/customer/project/doi | Show inline error, block insert |
| 500 `ERROR: Config not found.` | No indesignAutoPageConfig for customer/project | Show inline error |
| Network failure | CMS unreachable | Show retry option |

---

## Data Formats

### Quick Access (`src/data/quickaccess.ts`)

```ts
export const symbols: QuickButtonDef[] = [
  { latex: '\\leq',  glyph: '≤', tooltip: 'Less than or equal' },
  // ...
]

export const templates: QuickButtonDef[] = [
  { latex: '\\frac{#0}{#1}', glyph: '½', tooltip: 'Fraction' },
  // ...
]
```

### Tab JSON (`src/data/tabs/<name>.json`)

```json
{
  "id": "algebra",
  "label": "Algebra",
  "expressions": [
    { "latex": "\\sqrt{#0}",                           "display": "√(…)",      "label": "Root" },
    { "latex": "\\lim_{x \\to #0} #1",                "display": "lim(x→…)", "label": "Limit" },
    { "latex": "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", "display": "(-b±√Δ)/2a","label": "Quadratic" }
  ]
}
```

`#0`, `#1` are MathLive placeholder slots — cursor jumps to `#0` after `mathfield.insert()`.

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Bundle size (gzip) | < 200 KB |
| Time to interactive | < 1 s |
| Symbol insert → render | < 16 ms (synchronous) |
| Insert with image | < 800 ms (texconversion round-trip) |

---

## What Is Out of Scope (v1)

- Handwriting input
- ChemType / chemistry mode
- RTL / multi-language
- Dark mode / theme switching
- Color picker
- PNG export dialog
- User-editable expression tabs
