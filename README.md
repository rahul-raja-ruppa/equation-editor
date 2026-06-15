# kriya-equation-editor

A modern, high-performance math equation editor for the Kriya CMS — built to replace the legacy MathJax 2.7 + jQuery + EasyUI equation editor.

Built as a standalone **React 18 + Vite + TypeScript** application, it embeds into the Kriya CMS via `<iframe>` and communicates exclusively through a `postMessage` protocol.

---

## Tech Stack

| Layer           | Choice                                    |
| --------------- | ----------------------------------------- |
| Framework       | React 18 + Vite                           |
| Math Input      | [MathLive](https://cortexjs.io/mathlive/) |
| Language        | TypeScript                                |
| Styling         | CSS Modules                               |
| Integration     | `<iframe>` + `postMessage`                |
| Package Manager | `pnpm`                                    |

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

### UI Zones

| Zone                        | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| Zone 1 — Quick Access       | Always-visible toolbar with frequently used symbols and templates |
| Zone 2 — Expression Library | Lazy-loaded tabbed lists of math expressions                      |
| Zone 3 — MathLive Canvas    | Rich, interactive WYSIWYG math input field                        |
| Zone 4 — Footer & Actions   | Display/inline toggle, font size, LaTeX raw editor                |

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
- CSS Modules for all component styles — no global class names.
- Expression Library tabs load lazily from `src/data/expressions/*.json` on first activation.
- `usePostMessage` validates `e.origin` against `VITE_CMS_ORIGIN` before acting on messages.
