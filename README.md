# kriya-equation-editor

A modern, high-performance math equation editor for the Kriya CMS — built to replace the legacy MathJax 2.7 + jQuery + EasyUI equation editor.

Built as a standalone **React 18 + Vite + TypeScript** application, it embeds into the Kriya CMS via `<iframe>` and communicates exclusively through a `postMessage` protocol.

---

## Tech Stack

| Layer           | Choice                                           |
| --------------- | ------------------------------------------------ |
| Framework       | React 18 + Vite 5                                |
| Math Input      | [MathLive](https://cortexjs.io/mathlive/) 0.101  |
| Math Rendering  | MathJax 3 (client-side LaTeX → MathML + preview) |
| Language        | TypeScript (strict)                              |
| Styling         | Tailwind CSS 4                                   |
| UI Primitives   | Radix UI (Tooltip, ScrollArea)                   |
| Icons           | Lucide React                                     |
| Animation       | Framer Motion                                    |
| Integration     | `<iframe>` + `postMessage`                       |
| Package Manager | `pnpm`                                           |

---

## Getting Started

### Installation

```bash
pnpm install
```

### Local Development

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app runs in standalone mode for easy manual testing.

To simulate a CMS `load` message, open the browser console and run:

```js
window.postMessage(
  {
    type: 'load',
    latex: '\\frac{a}{b}',
    config: {
      fontSize: 12,
      mathType: 'display',
      customer: 'bmj',
      project: 'bjophthalmol',
      doi: 'test-doi',
    },
  },
  '*'
);
```

To observe `insert` output:

```js
window.addEventListener('message', (e) => console.log(e.data));
```

### Production Build

```bash
pnpm run build
```

Output is generated in `dist/` — served under `/equation-editor/` on the Kriya host.

### Code Quality

```bash
pnpm run lint      # check linting issues
pnpm run format    # auto-format with Prettier
```

---

## Architecture

### Layout

The editor uses a three-column layout:

| Column        | Width  | Description                                                        |
| ------------- | ------ | ------------------------------------------------------------------ |
| RailColumn    | 340px  | Symbol/template library: ControlRow + SymbolGrid + VerticalLibrary |
| EditorColumn  | flex   | LaTeXPanel (raw edit) + EditorSurface (MathLive WYSIWYG)           |
| PreviewColumn | 260px+ | Optional live MathJax SVG preview (toggle via eye icon)            |
| ActionBar     | 46px   | Fixed footer: status indicator + Cancel + Insert                   |

Additional features accessible via keyboard:

- **Cmd+K** — Command palette: fuzzy search across all symbols and expressions
- **ContextToolbar** — Floating toolbar that appears on selection in the math field

### CMS Integration

The built `dist/` is served under `/equation-editor/` on the kriya2.0 host:

```html
<iframe
  id="eq-editor"
  src="/equation-editor/index.html"
  style="width:760px; height:420px; border:none;"
></iframe>
```

### postMessage Protocol

#### Load — CMS → Editor

```js
window.postMessage(
  {
    type: 'load',
    latex: '\\frac{a}{b}',
    config: {
      fontSize: 12,
      mathType: 'display', // 'display' | 'inline'
      customer: 'bmj',
      project: 'bjophthalmol',
      doi: 'article-doi',
    },
  },
  '*'
);
```

#### Insert — Editor → CMS

```js
window.postMessage(
  {
    type: 'insert',
    latex: '\\frac{a}{b}',
    mathml: '<math>...</math>',
    mathType: 'display',
    fontSize: 12,
  },
  '*'
);
```

Full protocol spec: `docs/ARCHITECTURE.md`

---

## Key Conventions

- `let` by default, `const` only for true constants. Never `var`.
- Tailwind CSS utility classes for all component styles — no CSS Modules, no global class names.
- Expression Library tabs load lazily from `src/data/expressions/*.json` on first activation; cached module-level.
- `usePostMessage` validates `e.origin` against `VITE_CMS_ORIGIN`; falls back to locking to the first sender.
- Template slots use `#0`, `#1` — converted by `src/lib/latex-templates.ts` before calling MathLive APIs.
