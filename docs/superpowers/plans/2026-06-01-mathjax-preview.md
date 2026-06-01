# MathJax Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an on-demand MathJax 3 side-by-side preview pane to the canvas, toggled by a button in the MathField card's toolbar, so users can validate MathLive LaTeX output against MathJax rendering.

**Architecture:** `MathJaxPreview` is a new component that lazy-loads `mathjax-full` (dynamic import, code-split by Vite) on first use and renders LaTeX to an SVG string via `liteAdaptor`. The MathJax singleton is module-level so it initializes only once. `MathField` gains two new props (`latex`, `mathType`) and manages `previewOpen` state locally; when open, the card area splits into a CSS Grid two-column layout.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vite (dynamic import code-splitting), `mathjax-full@3.2.2`

---

## File Map

| Action | Path | What changes |
|---|---|---|
| Create | `src/components/MathPreview/MathJaxPreview.tsx` | New lazy-loaded MathJax render component |
| Create | `src/components/MathPreview/MathJaxPreview.module.css` | Preview card styles |
| Modify | `src/components/Editor/MathField.tsx` | Add `latex`/`mathType` props, `previewOpen` state, toggle button, split layout |
| Modify | `src/components/Editor/MathField.module.css` | Add `.cards`, `.cardsSplit`, `.previewCard`, `.previewHeader`, `.previewBody`, `.sep`, `.previewBtn`, `.previewBtnActive` |
| Modify | `src/App.tsx` | Pass `currentLatex` and `mathType` to `<MathField>` |
| Modify | `vite.config.ts` | Exclude `mathjax-full` from `optimizeDeps`, bump `chunkSizeWarningLimit` to 400 |

---

## Task 1: Create branch and install dependency

**Files:** `package.json`, `pnpm-lock.yaml`, `vite.config.ts`

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feature/mathjax-preview
```

- [ ] **Step 2: Install mathjax-full**

```bash
pnpm add mathjax-full
```

Expected: `mathjax-full@3.2.2` added to `dependencies` in `package.json`.

- [ ] **Step 3: Update `vite.config.ts`**

Replace the entire file with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/equation-editor/' : '/',
  optimizeDeps: {
    exclude: ['mathjax-full'],
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mathlive': ['mathlive'],
        },
      },
    },
  },
}));
```

- [ ] **Step 4: Verify dev server still starts**

```bash
pnpm run dev
```

Expected: dev server starts on `http://localhost:5173` with no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts
git commit -m "feat: install mathjax-full, exclude from vite optimizeDeps"
```

---

## Task 2: Create MathJaxPreview component

**Files:**
- Create: `src/components/MathPreview/MathJaxPreview.tsx`
- Create: `src/components/MathPreview/MathJaxPreview.module.css`

- [ ] **Step 1: Create `MathJaxPreview.tsx`**

```tsx
import { useEffect, useState, memo } from 'react';
import styles from './MathJaxPreview.module.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MJInstance = { doc: any; adaptor: any };

let cached: MJInstance | null = null;
let pending: Promise<MJInstance> | null = null;

async function getMathJax(): Promise<MJInstance> {
  if (cached) return cached;
  if (pending) return pending;
  pending = (async (): Promise<MJInstance> => {
    const [
      { mathjax },
      { TeX },
      { SVG },
      { liteAdaptor },
      { RegisterHTMLHandler },
      { AllPackages },
    ] = await Promise.all([
      import('mathjax-full/js/mathjax.js'),
      import('mathjax-full/js/input/tex.js'),
      import('mathjax-full/js/output/svg.js'),
      import('mathjax-full/js/adaptors/liteAdaptor.js'),
      import('mathjax-full/js/handlers/html.js'),
      import('mathjax-full/js/input/tex/AllPackages.js'),
    ]);
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    const doc = mathjax.document('', {
      InputJax: new TeX({ packages: AllPackages }),
      OutputJax: new SVG({ fontCache: 'none' }),
    });
    cached = { doc, adaptor };
    return cached;
  })();
  return pending;
}

interface MathJaxPreviewProps {
  latex: string;
  mathType: 'display' | 'inline';
}

export const MathJaxPreview = memo(function MathJaxPreview({
  latex,
  mathType,
}: MathJaxPreviewProps) {
  let [svg, setSvg] = useState<string>('');
  let [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      getMathJax()
        .then(({ doc, adaptor }) => {
          if (cancelled) return;
          try {
            const node = doc.convert(latex || '{}', { display: mathType === 'display' });
            const result: string = adaptor.outerHTML(adaptor.firstChild(node));
            setSvg(result);
            setStatus('ready');
          } catch {
            if (!cancelled) setStatus('error');
          }
        })
        .catch(() => {
          if (!cancelled) setStatus('error');
        });
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [latex, mathType]);

  if (status === 'loading') {
    return (
      <div className={styles.state}>
        <span className={styles.spinner} />
      </div>
    );
  }
  if (status === 'error') {
    return <div className={styles.state}>Could not render</div>;
  }
  return (
    <div
      className={styles.render}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
```

- [ ] **Step 2: Create `MathJaxPreview.module.css`**

```css
.state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 60px;
  color: var(--ee-muted);
  font-size: 11px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--ee-border);
  border-top-color: var(--ee-accent);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.render {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 14px 16px;
  overflow: auto;
}

.render svg {
  max-width: 100%;
  height: auto;
}
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/MathPreview/MathJaxPreview.tsx src/components/MathPreview/MathJaxPreview.module.css
git commit -m "feat: add MathJaxPreview component with lazy-loaded mathjax-full"
```

---

## Task 3: Update MathField — new props, toggle button, split layout CSS

**Files:**
- Modify: `src/components/Editor/MathField.tsx`
- Modify: `src/components/Editor/MathField.module.css`

- [ ] **Step 1: Replace `MathField.tsx` with the updated version**

```tsx
import 'mathlive';
import React, { useEffect, useState } from 'react';
import { Undo2, Redo2, X } from 'lucide-react';
import type { MathfieldElement } from 'mathlive';
import type { useMathField } from '../../hooks/useMathField';
import { MathJaxPreview } from '../MathPreview/MathJaxPreview';
import styles from './MathField.module.css';

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface MathFieldProps {
  mathFieldRef: ReturnType<typeof useMathField>['ref'];
  onChange?: (latex: string) => void;
  fontSize: number;
  latex: string;
  mathType: 'display' | 'inline';
}

export function MathField({ mathFieldRef, onChange, fontSize, latex, mathType }: MathFieldProps) {
  let [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const el = mathFieldRef.current;
    if (!el || !onChange) return;

    function handler() {
      const value = (el as MathfieldElement).getValue('latex');
      onChange!(value);
    }

    el.addEventListener('input', handler);
    return () => {
      el.removeEventListener('input', handler);
    };
  }, [mathFieldRef, onChange]);

  useEffect(() => {
    const el = mathFieldRef.current as MathfieldElement | null;
    if (!el) return;
    customElements.whenDefined('math-field').then(() => {
      el.macros = {
        ...el.macros,
        boldsymbol: { def: '\\mathbf{#1}', args: 1 },
        bm: { def: '\\mathbf{#1}', args: 1 },
      };
    });
  }, [mathFieldRef]);

  function handleUndo() {
    (mathFieldRef.current as MathfieldElement | null)?.executeCommand('undo');
  }

  function handleRedo() {
    (mathFieldRef.current as MathfieldElement | null)?.executeCommand('redo');
  }

  function handleClear() {
    (mathFieldRef.current as MathfieldElement | null)?.setValue('');
    onChange?.('');
  }

  return (
    <div className={styles.mathFieldWrapper}>
      <div className={previewOpen ? styles.cardsSplit : styles.cards}>
        <div className={styles.card}>
          <math-field
            ref={mathFieldRef as React.RefObject<HTMLElement>}
            className={styles.mathField}
            style={{ fontSize: `${30 + (fontSize - 12) * 1.6}px` }}
          />
          <div className={styles.floatingToolbar}>
            <button type="button" className={styles.toolbarBtn} onClick={handleUndo} title="Undo">
              <Undo2 size={13} strokeWidth={1.75} />
            </button>
            <button type="button" className={styles.toolbarBtn} onClick={handleRedo} title="Redo">
              <Redo2 size={13} strokeWidth={1.75} />
            </button>
            <button type="button" className={styles.toolbarBtn} onClick={handleClear} title="Clear">
              <X size={12} strokeWidth={2} />
            </button>
            <div className={styles.sep} />
            <button
              type="button"
              className={previewOpen ? styles.previewBtnActive : styles.previewBtn}
              onClick={() => setPreviewOpen((v) => !v)}
              title="Toggle MathJax preview"
            >
              ⚡ MathJax
            </button>
          </div>
        </div>
        {previewOpen && (
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>MathJax Preview</div>
            <MathJaxPreview latex={latex} mathType={mathType} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `MathField.module.css`**

Add the following new rules at the bottom of the existing file (keep all existing rules intact):

```css
/* ── Split layout container ─────────────────────────────── */

.cards {
  position: relative;
  width: min(50%, 580px);
  animation: cardIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.cardsSplit {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: min(92%, 1140px);
  animation: cardIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ── Preview card ────────────────────────────────────────── */

.previewCard {
  background: #ffffff;
  border: 1.5px solid #bbf7d0;
  border-radius: 14px;
  box-shadow:
    0 4px 24px rgba(16, 185, 129, 0.07),
    0 1px 4px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 110px;
  animation: cardIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.previewHeader {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #059669;
  background: #f0fdf4;
  border-bottom: 1px solid #d1fae5;
  padding: 5px 12px;
  flex-shrink: 0;
}

/* ── Toolbar separator and preview toggle ────────────────── */

.sep {
  width: 1px;
  height: 14px;
  background: var(--ee-border);
  margin: 0 2px;
  flex-shrink: 0;
}

.previewBtn {
  height: 26px;
  padding: 0 9px;
  border-radius: var(--ee-radius-sm);
  border: 1px solid var(--ee-border);
  background: var(--ee-bg);
  color: var(--ee-muted);
  cursor: pointer;
  font-size: 10.5px;
  font-weight: 600;
  font-family: var(--ui-font);
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
}

.previewBtn:hover {
  background: var(--ee-accent-weak);
  border-color: var(--ee-accent);
  color: var(--ee-accent-ink);
}

.previewBtnActive {
  height: 26px;
  padding: 0 9px;
  border-radius: var(--ee-radius-sm);
  border: 1px solid var(--ee-accent);
  background: var(--ee-accent-weak);
  color: var(--ee-accent-ink);
  cursor: pointer;
  font-size: 10.5px;
  font-weight: 600;
  font-family: var(--ui-font);
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
}

.previewBtnActive:hover {
  background: var(--ee-accent);
  color: #ffffff;
}
```

Also **remove** the `animation: cardIn` rule from the existing `.card` selector (it now lives on `.cards` / `.cardsSplit`). The existing `.card` rule should look like:

```css
.card {
  position: relative;
  min-height: 110px;
  background: #ffffff;
  border: 1.5px solid var(--ee-border-strong);
  border-radius: 14px;
  box-shadow:
    0 4px 24px rgba(79, 70, 229, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

(The `width: min(50%, 580px)` and `animation` move to `.cards`.)

- [ ] **Step 3: Verify lint passes**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Editor/MathField.tsx src/components/Editor/MathField.module.css
git commit -m "feat: add MathJax preview toggle to MathField card toolbar"
```

---

## Task 4: Wire new props in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update the `<MathField>` call in `App.tsx`**

Find this line in `App.tsx`:
```tsx
<MathField mathFieldRef={mathField.ref} onChange={setCurrentLatex} fontSize={fontSize} />
```

Replace it with:
```tsx
<MathField
  mathFieldRef={mathField.ref}
  onChange={setCurrentLatex}
  fontSize={fontSize}
  latex={currentLatex}
  mathType={mathType}
/>
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: pass latex and mathType to MathField for preview"
```

---

## Task 5: Manual verification

- [ ] **Step 1: Start dev server**

```bash
pnpm run dev
```

Open `http://localhost:5173`.

- [ ] **Step 2: Verify default state**

The canvas shows one card (MathLive editor). The `floatingToolbar` has Undo / Redo / Clear / separator / "⚡ MathJax" button. The preview button is in the off (grey) style.

- [ ] **Step 3: Click "⚡ MathJax"**

The canvas splits into two cards side by side. Left: MathLive editor. Right: green-bordered card with "MathJax Preview" header. A spinner appears briefly while `mathjax-full` loads.

- [ ] **Step 4: Type an equation**

Type `\frac{a}{b}` in the MathLive field. After ~150ms debounce the right card re-renders with MathJax's SVG output. Both cards should show the same fraction.

- [ ] **Step 5: Toggle off**

Click "⚡ MathJax" again. The preview card disappears, canvas returns to single-card layout.

- [ ] **Step 6: Test Display / Inline difference**

Switch to "Inline" in the utility row. Open preview. Type `x^2`. MathJax should render inline style (smaller, text-height). Switch back to "Display" — MathJax should re-render display style (centred, larger).

- [ ] **Step 7: Verify build size**

```bash
pnpm run build
```

Expected output includes separate chunks. The mathjax chunk will be ~350KB (this is the lazy chunk, only loaded on preview toggle — it does NOT affect TTI). The initial `vendor-mathlive` chunk and main bundle should remain within the original limits.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "chore: verify mathjax preview build"
```
