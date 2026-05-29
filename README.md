# Equation Editor POC

A modern, high-performance equation editor built to replace the legacy MathJax 2.7 + jQuery + EasyUI equation editor in Kriya CMS. 

Built as a standalone **React 18 + Vite + TypeScript** application, it embeds into the Kriya CMS via `<iframe>` and communicates exclusively using a secure `postMessage` protocol.

---

## 🚀 Tech Stack

- **Framework**: React 18 + Vite
- **Math Engine**: [MathLive](https://cortexjs.io/mathlive/) (`mathlive`)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS Modules)
- **Integration**: `<iframe>` + `postMessage`
- **Package Manager**: `pnpm`

---

## 🛠️ Getting Started

### 1. Installation

Install dependencies using `pnpm`:

```bash
pnpm install
```

### 2. Local Development

Start the Vite development server:

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The app runs in a standalone mode for easy manual testing.

### 3. Production Build

Build the optimized static assets ready for deployment:

```bash
pnpm run build
```

The output will be generated in the `dist/` directory, which is served under the `/equation-editor/` path in production.

### 4. Code Quality & Formatting

```bash
# Check linting and styling issues
pnpm run lint

# Automatically format the code using Prettier
pnpm run format
```

---

## 📐 Architecture & Integration

### UI Zones
- **Zone 1 (Quick Access)**: Always-visible toolbar containing frequently used symbols and math templates.
- **Zone 2 (Expression Library)**: Lazy-loaded tabbed lists of mathematics expressions.
- **Zone 3 (MathLive Canvas)**: A rich, interactive WYSIWYG math field.
- **Zone 4 (Footer & Actions)**: Controls for changing display sizes, toggling display/inline mode, and full-screen LaTeX raw editor.

### `postMessage` Data Flow

#### Load (CMS → Editor)
When the editor loads inside the iframe, the parent CMS page sends a `load` message to initialize the editor state:

```javascript
window.postMessage({
  type: 'load',
  latex: '\\frac{a}{b}', // Current equation (empty string for new)
  config: {
    fontSize: 12,
    mathType: 'display', // 'display' | 'inline'
    customer: 'bmj',
    project: 'bjophthalmol',
    doi: 'article-doi'
  }
}, '*');
```

#### Insert (Editor → CMS)
When the user clicks "Insert", the editor serializes the formula to LaTeX and MathML, sends it to the `/api/texconversion` endpoint to generate an image preview, and then posts the data back to the CMS:

```javascript
window.postMessage({
  type: 'insert',
  latex: '\\frac{a}{b}',
  mathml: '<math>...</math>',
  imageUrl: 'https://...',
  mathType: 'display',
  fontSize: 12
}, '*');
```

---

## 📖 Key Developer Notes

- **CSS Modules**: Ensure all styling uses CSS Modules (`.module.css`) to maintain scoping and avoid global CSS collisions.
- **Lazy Loading**: Tabs in the Expression Library are loaded lazily from JSON configuration files (`src/data/tabs/`) to optimize initial load times.
- **Variables**: Favor `let` by default and `const` only for true constants. Never use `var`.
