# Split Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-panel canvas + LaTeXBar pill with a stacked 50/50 layout — MathLive editor on top, always-editable LaTeX textarea on the bottom, both in sync.

**Architecture:** `LaTeXBar` (click-to-edit pill) is deleted and replaced with `LaTeXPanel` (controlled `<textarea>`). `App.tsx` wires them: MathLive `input` → textarea value immediately; textarea `onChange` → `mathField.setValue()` debounced 300ms. CSS changes are confined to `.canvas` in `App.module.css`.

**Tech Stack:** React 18, TypeScript, CSS Modules, MathLive 0.101

---

### Task 1: Create LaTeXPanel component

**Files:**
- Create: `src/components/Editor/LaTeXPanel.tsx`
- Create: `src/components/Editor/LaTeXPanel.module.css`

- [ ] **Step 1: Create `LaTeXPanel.module.css`**

```css
/* src/components/Editor/LaTeXPanel.module.css */
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-top: 1px solid var(--border-faint);
  background: var(--bg-panel);
}

.label {
  font-family: var(--ui-font);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-2);
  padding: 4px 10px 2px;
  flex-shrink: 0;
}

.textarea {
  flex: 1;
  min-height: 0;
  resize: none;
  border: none;
  outline: none;
  padding: 6px 10px;
  font-family: var(--mono-font);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-0);
  background: transparent;
  caret-color: var(--indigo);
}

.textarea:focus {
  box-shadow: inset 0 0 0 1px var(--indigo-dim);
}
```

- [ ] **Step 2: Create `LaTeXPanel.tsx`**

```tsx
/* src/components/Editor/LaTeXPanel.tsx */
import styles from './LaTeXPanel.module.css';

interface LaTeXPanelProps {
  value: string;
  onChange: (latex: string) => void;
}

export function LaTeXPanel({ value, onChange }: LaTeXPanelProps) {
  return (
    <div className={styles.panel}>
      <span className={styles.label}>LaTeX</span>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build
```

Expected: build succeeds (LaTeXPanel not yet wired in, just a new file).

- [ ] **Step 4: Commit**

```bash
git add src/components/Editor/LaTeXPanel.tsx src/components/Editor/LaTeXPanel.module.css
git commit -m "feat: add LaTeXPanel component (full-height latex textarea)"
```

---

### Task 2: Update canvas CSS for 50/50 split

**Files:**
- Modify: `src/App.module.css`

Current `.canvas` is:
```css
.canvas {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  background-color: #ffffff;
  background-image: radial-gradient(circle, #dde0ef 1px, transparent 1px);
  background-size: 20px 20px;
}

.canvas > :first-child {
  flex: 1;
  min-height: 0;
}
```

- [ ] **Step 1: Replace the canvas block in `src/App.module.css`**

Remove these rules:
```css
.canvas {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  background-color: #ffffff;
  background-image: radial-gradient(circle, #dde0ef 1px, transparent 1px);
  background-size: 20px 20px;
}

.canvas > :first-child {
  flex: 1;
  min-height: 0;
}
```

Replace with:
```css
.canvas {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.canvas > * {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
```

The dotted background moves to `MathField.module.css` in the next step — keep it out of `.canvas` since the LaTeXPanel has its own background.

- [ ] **Step 2: Move the dotted background to `MathField.module.css`**

Open `src/components/Editor/MathField.module.css` and add to `.mathFieldWrapper`:

```css
background-color: #ffffff;
background-image: radial-gradient(circle, #dde0ef 1px, transparent 1px);
background-size: 20px 20px;
```

(Keep all existing rules — just add these three lines inside the existing `.mathFieldWrapper` block.)

- [ ] **Step 3: Verify build**

```bash
pnpm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/App.module.css src/components/Editor/MathField.module.css
git commit -m "feat: split canvas 50/50 — column flex with equal children"
```

---

### Task 3: Wire LaTeXPanel into App and delete LaTeXBar

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/Editor/LaTeXBar.tsx`
- Delete: `src/components/Editor/LaTeXBar.module.css`

- [ ] **Step 1: Update `src/App.tsx`**

Replace the entire file with:

```tsx
import { useState, useCallback, useRef } from 'react';
import { useMathField } from './hooks/useMathField';
import { usePostMessage } from './hooks/usePostMessage';
import { ToolbarZone } from './components/Toolbar/ToolbarZone';
import { ExpressionZone } from './components/ExpressionZone/ExpressionZone';
import { MathField } from './components/Editor/MathField';
import { LaTeXPanel } from './components/Editor/LaTeXPanel';
import { ActionBar } from './components/ActionBar/ActionBar';
import type { LoadMessage, LoadConfig, OutboundMessage } from './types';
import styles from './App.module.css';

export default function App() {
  const mathField = useMathField();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  let [mathType, setMathType] = useState<'display' | 'inline'>('display');
  let [fontSize, setFontSize] = useState<number>(12);
  let [loadConfig, setLoadConfig] = useState<LoadConfig | null>(null);
  let [currentLatex, setCurrentLatex] = useState<string>('');

  const onLoad = useCallback((msg: LoadMessage) => {
    mathField.setValue(msg.latex);
    setCurrentLatex(msg.latex);
    setMathType(msg.config.mathType);
    setFontSize(msg.config.fontSize);
    setLoadConfig(msg.config);
  }, [mathField]);

  const { send } = usePostMessage(onLoad);

  function handleInsert(latex: string) {
    mathField.insert(latex);
  }

  function handleLatexPanelChange(draft: string) {
    setCurrentLatex(draft);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mathField.setValue(draft);
    }, 300);
  }

  function handleCancel() {
    const payload: OutboundMessage = { type: 'cancel' };
    send(payload);
  }

  function getLatex() {
    return mathField.getValue('latex');
  }

  function getMathML() {
    return mathField.getValue('math-ml');
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <ToolbarZone onInsert={handleInsert} />
      </div>
      <div className={styles.expressions}>
        <ExpressionZone onInsert={handleInsert} />
      </div>
      <div className={styles.canvas}>
        <MathField mathFieldRef={mathField.ref} onChange={setCurrentLatex} />
        <LaTeXPanel value={currentLatex} onChange={handleLatexPanelChange} />
      </div>
      <div className={styles.actionBar}>
        <ActionBar
          mathType={mathType}
          onMathTypeChange={setMathType}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          getLatex={getLatex}
          getMathML={getMathML}
          loadConfig={loadConfig}
          send={send}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete LaTeXBar files**

```bash
rm src/components/Editor/LaTeXBar.tsx src/components/Editor/LaTeXBar.module.css
```

- [ ] **Step 3: Verify build and lint pass**

```bash
pnpm run build && pnpm run lint
```

Expected: both pass with zero errors/warnings.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git rm src/components/Editor/LaTeXBar.tsx src/components/Editor/LaTeXBar.module.css
git commit -m "feat: wire LaTeXPanel into App, remove LaTeXBar"
```

---

### Task 4: Manual smoke test

No automated tests exist. Verify behavior manually in the browser.

- [ ] **Step 1: Start dev server**

```bash
pnpm run dev
```

Open http://localhost:5173

- [ ] **Step 2: Verify layout**

Check:
- Canvas area is split roughly 50/50 top/bottom
- Top half shows the MathLive editor with the dotted grid background
- Bottom half shows a "LATEX" label and an editable textarea
- No visual regressions in toolbar, expression library, or action bar

- [ ] **Step 3: Verify MathLive → textarea sync**

Click into the MathLive editor and type a few keys (e.g. `\frac`).
Expected: the textarea updates immediately to show the matching LaTeX string.

- [ ] **Step 4: Verify textarea → MathLive sync**

Click into the textarea and type or edit the LaTeX string.
Expected: after ~300ms pause, the MathLive editor updates to reflect the new LaTeX.

- [ ] **Step 5: Verify postMessage load**

Open browser console and run:

```js
window.postMessage(
  { type: 'load', latex: '\\frac{a}{b}', config: { fontSize: 12, mathType: 'display', customer: 'test', project: 'test', doi: 'test' } },
  '*'
);
```

Expected: MathLive renders the fraction, textarea shows `\frac{a}{b}`.

- [ ] **Step 6: Commit if any fixups were needed, otherwise done**

```bash
git add -p && git commit -m "fix: <describe any fixup>"
```
