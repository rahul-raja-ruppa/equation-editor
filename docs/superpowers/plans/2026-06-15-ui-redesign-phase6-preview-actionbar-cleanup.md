# UI Redesign — Phase 6: PreviewColumn + ActionBar + Final Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap MathJaxPreview in a styled PreviewColumn, rebuild ActionBar as a single clean Tailwind file with a status indicator and toast-on-error, then delete all dead files and strip the legacy CSS compat block from theme.css.

**Architecture:** Three independent component rewrites (MathJaxPreview, ActionBar, new PreviewColumn), one App wiring change, and one CSS cleanup. No new libraries — the toast is self-contained in ActionBar. Tasks 1-4 are independent of each other; Task 5 (App wiring) depends on Tasks 1-3; Task 6 (CSS cleanup) depends on all prior tasks having removed every legacy token consumer.

**Tech Stack:** React 18 + TypeScript, Tailwind v4 (no new CSS modules — all new code uses utility classes), Lucide icons, existing `OutboundMessage` type from `src/types/index.ts`.

**Source spec:** `docs/superpowers/specs/2026-06-15-ui-redesign-phase6-preview-actionbar-cleanup-design.md`

**No test runner exists** — every task's verification is `pnpm exec tsc --noEmit` (type-check) and/or `pnpm build`. Task 7 runs the full smoke test.

---

## File structure

| File | Action |
|---|---|
| `src/components/math-preview/mathjax-preview.tsx` | Rewrite — Tailwind only, remove CSS module import |
| `src/components/math-preview/mathjax-preview.module.css` | **Delete** |
| `src/components/math-preview/preview-column.tsx` | **New** — wraps MathJaxPreview with v2.2 header + empty state |
| `src/components/action-bar/action-bar.tsx` | **Complete rewrite** — single file: Toast + ActionBar |
| `src/components/action-bar/action-bar.module.css` | **Delete** |
| `src/components/action-bar/cancel-button.tsx` | **Delete** |
| `src/components/action-bar/insert-button.tsx` | **Delete** |
| `src/components/action-bar/size-control.tsx` | **Delete** (dead — not imported anywhere since Phase 3) |
| `src/components/action-bar/type-toggle.tsx` | **Delete** (dead — same reason) |
| `src/app.tsx` | Modify — add `latex` prop to ActionBar, swap Col 3 div for PreviewColumn |
| `src/styles/theme.css` | Modify — remove legacy compat vars, keep shadcn tokens, migrate body font |

---

## Task 1: Rewrite `MathJaxPreview` — Tailwind only, delete CSS module

**Files:**
- Modify: `src/components/math-preview/mathjax-preview.tsx`
- Delete: `src/components/math-preview/mathjax-preview.module.css`

- [ ] **Step 1: Rewrite `src/components/math-preview/mathjax-preview.tsx`**

Replace the entire file. The MathJax pipeline (cache, lazy imports, `getMathJax`) is unchanged. Only the JSX return values change — CSS module classes replaced by Tailwind utilities. The spinner uses Tailwind's built-in `animate-spin`. The SVG output block uses an arbitrary group selector `[&_svg]:` to constrain the injected SVG dimensions.

```tsx
import { useEffect, useState, memo } from 'react';

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
    // Exclude the 'html' package — it enables \href with arbitrary URLs,
    // which is exploitable via dangerouslySetInnerHTML.
    const safePackages = (AllPackages as string[]).filter((p) => p !== 'html');
    const doc = mathjax.document('', {
      InputJax: new TeX({ packages: safePackages }),
      OutputJax: new SVG({ fontCache: 'none' }),
    });
    cached = { doc, adaptor };
    return cached;
  })();
  // Clear pending on failure so the next call can retry instead of
  // permanently returning the same rejected promise for the session.
  pending.catch(() => {
    pending = null;
  });
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
  const [svg, setSvg] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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
      <div className="flex min-h-[60px] flex-1 items-center justify-center text-[11px] text-ink-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-primary" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex min-h-[60px] flex-1 items-center justify-center text-[11px] text-ink-400">
        Could not render
      </div>
    );
  }
  return (
    <div
      className="flex flex-1 items-center justify-center overflow-auto px-4 py-3.5 [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
```

- [ ] **Step 2: Delete the CSS module**

```bash
git rm src/components/math-preview/mathjax-preview.module.css
```

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: no output, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/math-preview/mathjax-preview.tsx
git commit -m "feat(preview): rewrite MathJaxPreview with Tailwind, delete CSS module"
```

---

## Task 2: Create `PreviewColumn`

**Files:**
- Create: `src/components/math-preview/preview-column.tsx`

- [ ] **Step 1: Create `src/components/math-preview/preview-column.tsx`**

The `ee-anim-fade` class is on the outermost element. Because `PreviewColumn` only mounts when `previewOpen` is true (in App), the animation fires naturally each time the column appears — no manual trigger needed.

```tsx
import { MathJaxPreview } from './mathjax-preview';

interface PreviewColumnProps {
  latex: string;
  mathType: 'display' | 'inline';
}

export function PreviewColumn({ latex, mathType }: PreviewColumnProps) {
  return (
    <div className="ee-anim-fade flex min-w-0 flex-1 flex-col border-l border-ink-200">
      <div className="flex h-[33px] shrink-0 items-center gap-2 border-b border-ink-200/70 px-3">
        <span className="select-none text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">
          Live preview
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          <span className="font-mono text-[9.5px] text-ink-400">MathJax</span>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1">
        {latex.trim() === '' ? (
          <div className="flex flex-1 items-center justify-center text-[12px] text-ink-400">
            Live preview appears here
          </div>
        ) : (
          <MathJaxPreview latex={latex} mathType={mathType} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/math-preview/preview-column.tsx
git commit -m "feat(preview): add PreviewColumn with header, MathJax badge, empty state"
```

---

## Task 3: Rebuild `ActionBar` — single file with inline Toast

**Files:**
- Rewrite: `src/components/action-bar/action-bar.tsx`

The `Toast` component is defined locally — it's only ever used here. It auto-unmounts via `setTimeout` inside its own `useEffect`. The Insert button has three visual states (`idle` → `loading` → `inserted`) plus a toast shown on error. `hasContent` is derived from the `latex` prop — no local state.

- [ ] **Step 1: Rewrite `src/components/action-bar/action-bar.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { OutboundMessage } from '../../types';

interface ToastProps {
  message: string;
  onDone: () => void;
}

function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="ee-anim-fade fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink-800 px-3 py-1.5 text-[11px] text-white shadow-pop">
      {message}
    </div>
  );
}

interface ActionBarProps {
  latex: string;
  mathType: 'display' | 'inline';
  fontSize: number;
  getLatex: () => string;
  getMathML: () => Promise<string>;
  send: (payload: OutboundMessage) => void;
  onCancel: () => void;
}

type InsertStatus = 'idle' | 'loading' | 'inserted';

export function ActionBar({
  latex,
  mathType,
  fontSize,
  getLatex,
  getMathML,
  send,
  onCancel,
}: ActionBarProps) {
  let [status, setStatus] = useState<InsertStatus>('idle');
  let [toastMsg, setToastMsg] = useState<string | null>(null);

  const hasContent = latex.trim().length > 0;

  async function handleInsert() {
    if (!hasContent || status === 'loading') return;
    setStatus('loading');
    try {
      const latexVal = getLatex();
      const mathml = await getMathML();
      send({ type: 'insert', latex: latexVal, mathml, fontSize, mathType });
      setStatus('inserted');
      window.setTimeout(() => setStatus('idle'), 900);
    } catch (err) {
      setStatus('idle');
      setToastMsg((err as Error).message || 'Failed to generate MathML');
    }
  }

  return (
    <>
      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg(null)} />}
      <div className="flex min-h-[46px] items-center gap-3 border-t border-ink-200 bg-surface px-3.5 py-2">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
              hasContent ? 'bg-success' : 'bg-ink-300'
            }`}
          />
          <span className="text-[10px] text-ink-500">
            {hasContent ? 'MathML & LaTeX ready' : 'Empty equation'}
          </span>
          <span className="font-mono text-[10px] text-ink-400 max-sm:hidden">
            {mathType} · {fontSize}pt
          </span>
        </div>

        {/* Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-ink-200 px-3.5 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!hasContent || status === 'loading'}
            className={`flex min-w-[80px] items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-[12px] font-semibold transition-all disabled:cursor-default disabled:shadow-none ${
              hasContent
                ? 'bg-primary text-white shadow-[0_8px_18px_-10px_rgba(104,0,214,0.6)] hover:-translate-y-px hover:bg-primary-dark active:scale-[0.97] active:shadow-none'
                : 'cursor-default bg-ink-200 text-ink-400'
            }`}
          >
            {status === 'inserted' ? (
              <>
                <Check size={13} />
                Inserted
              </>
            ) : status === 'loading' ? (
              'Inserting…'
            ) : (
              'Insert'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: no output, exit code 0. TypeScript will still see the old sub-component files (cancel-button.tsx, etc.) as valid modules — they're just unreferenced. That's fine; they're deleted in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/components/action-bar/action-bar.tsx
git commit -m "feat(action-bar): rebuild as single Tailwind file with status indicator and toast"
```

---

## Task 4: Delete dead action-bar files

**Files:**
- Delete: `src/components/action-bar/action-bar.module.css`
- Delete: `src/components/action-bar/cancel-button.tsx`
- Delete: `src/components/action-bar/insert-button.tsx`
- Delete: `src/components/action-bar/size-control.tsx`
- Delete: `src/components/action-bar/type-toggle.tsx`

`size-control.tsx` and `type-toggle.tsx` have not been imported by `action-bar.tsx` since Phase 3 moved those controls to `RailColumn`. The new `action-bar.tsx` no longer imports `cancel-button.tsx`, `insert-button.tsx`, or the CSS module either.

- [ ] **Step 1: Confirm no imports remain**

```bash
rg "cancel-button|insert-button|size-control|type-toggle|action-bar\.module" src/
```
Expected: zero matches.

- [ ] **Step 2: Delete the files**

```bash
git rm \
  src/components/action-bar/action-bar.module.css \
  src/components/action-bar/cancel-button.tsx \
  src/components/action-bar/insert-button.tsx \
  src/components/action-bar/size-control.tsx \
  src/components/action-bar/type-toggle.tsx
```

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: no output, exit code 0.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(action-bar): delete superseded sub-components and CSS module"
```

---

## Task 5: Wire `App.tsx`

**Files:**
- Modify: `src/app.tsx`

Two changes:
1. Add `latex={currentLatex}` to the `<ActionBar>` call (new required prop).
2. Replace the bare Col 3 `<div>` with `<PreviewColumn>`, and update the import.

- [ ] **Step 1: Update imports in `src/app.tsx`**

Replace the `MathJaxPreview` import with `PreviewColumn`:

```tsx
// Remove this line:
import { MathJaxPreview } from './components/math-preview/mathjax-preview';

// Add this line:
import { PreviewColumn } from './components/math-preview/preview-column';
```

- [ ] **Step 2: Swap Col 3 div for PreviewColumn**

Replace:
```tsx
            {/* Col 3 — live preview, on demand. v2.2 styling arrives in Phase 6. */}
            {previewOpen && (
              <div className="flex min-w-0 flex-1 flex-col overflow-auto border-l border-ink-200 bg-surface">
                <MathJaxPreview latex={currentLatex} mathType={mathType} />
              </div>
            )}
```

With:
```tsx
            {/* Col 3 — live preview */}
            {previewOpen && (
              <PreviewColumn latex={currentLatex} mathType={mathType} />
            )}
```

- [ ] **Step 3: Add `latex` prop to ActionBar**

Replace:
```tsx
          <ActionBar
            fontSize={fontSize}
            mathType={mathType}
            getLatex={getLatex}
            getMathML={getMathML}
            send={send}
            onCancel={handleCancel}
          />
```

With:
```tsx
          <ActionBar
            latex={currentLatex}
            fontSize={fontSize}
            mathType={mathType}
            getLatex={getLatex}
            getMathML={getMathML}
            send={send}
            onCancel={handleCancel}
          />
```

- [ ] **Step 4: Type-check and build**

```bash
pnpm exec tsc --noEmit && pnpm build
```
Expected: both succeed, no errors. Build output should reference `preview-column` and the new `action-bar` but not `mathjax-preview.module.css` or any deleted sub-component.

- [ ] **Step 5: Commit**

```bash
git add src/app.tsx
git commit -m "feat(app): wire PreviewColumn and updated ActionBar with latex prop"
```

---

## Task 6: Clean up `theme.css` — remove legacy compat block, migrate body font

**Files:**
- Modify: `src/styles/theme.css`

After Tasks 1-5, the only remaining consumers of the compat block are gone. This task verifies that, then removes the block.

- [ ] **Step 1: Verify zero remaining legacy token references**

```bash
rg "var\(--ee-|var\(--bg-|var\(--border-faint|var\(--border-normal|var\(--border-strong|var\(--border-focus|var\(--indigo|var\(--violet|var\(--text-0|var\(--text-1|var\(--text-2|var\(--r-sm|var\(--r-md|var\(--r-lg|var\(--r-pill|var\(--ui-font|var\(--mono-font|var\(--math-font|var\(--t-fast|var\(--t-med|var\(--shadow-xs|var\(--shadow-sm|var\(--shadow-md" src/
```

Expected: **zero matches**. If any matches appear, do NOT proceed — locate the file, migrate the token to its new equivalent, then re-run the grep.

- [ ] **Step 2: Replace the `:root` block in `src/styles/theme.css`**

The current `:root` block runs from the comment on line ~65 through line 170. Replace the entire block (comment + `:root { ... }`) with a slim version that keeps only the shadcn semantic tokens:

```css
/* shadcn semantic tokens — required by Button, Tooltip, ScrollArea primitives.
 * Mapped to Tailwind --color-* / --radius-* via @theme inline below.
 */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}
```

- [ ] **Step 3: Migrate the `body` block in `@layer base`**

In the `@layer base` block, replace the body declaration:

```css
/* current — remove */
body {
  font-family: var(--ui-font); /* TODO Phase 2: migrate to var(--font-sans) */
  font-size: 12px;
  background: var(--bg-base);
  color: var(--text-0);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
```

```css
/* replacement */
body {
  font-family: var(--font-sans);
  font-size: 12px;
  background: var(--color-surface-dark);
  color: var(--color-ink-900);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
```

(`--color-surface-dark: #f5f3f7` replaces `--bg-base: #f5f6fa` — near-identical off-white. `--color-ink-900: #1c1a1f` replaces `--text-0: #1e2030` — near-identical near-black.)

- [ ] **Step 4: Build to confirm**

```bash
pnpm build
```
Expected: succeeds with no errors or unresolved variable warnings.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css
git commit -m "chore(theme): remove legacy compat vars, keep shadcn tokens, migrate body to new tokens"
```

---

## Task 7: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full check**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm build
```
Expected: all three pass.

- [ ] **Step 2: Confirm deleted files are gone**

```bash
ls src/components/action-bar/
```
Expected: only `action-bar.tsx`.

```bash
ls src/components/math-preview/
```
Expected: `mathjax-preview.tsx` and `preview-column.tsx` only (no `.module.css`).

```bash
ls src/components/editor/
```
Expected: `context-toolbar.tsx`, `editor-column.tsx`, `editor-surface.tsx`, `latex-panel.tsx` only (no `math-field.*`, no `latex-bar.*`).

- [ ] **Step 3: Manual dev-server smoke test**

Run `pnpm dev`, open the local URL, and verify:

**PreviewColumn (⌘P to toggle):**
- Column fades in when opened; header shows "Live preview" label + green dot + "MathJax" mono badge
- Empty state text "Live preview appears here" shows when equation field is blank
- MathJax renders the SVG when LaTeX is present
- Spinner appears briefly while MathJax initializes on first open

**ActionBar:**
- Empty state: dot is `ink-300`, label reads "Empty equation", Insert button is muted/disabled
- With content: dot is green, label reads "MathML & LaTeX ready", `{mathType} · {fontSize}pt` shows
- Insert: button turns primary-purple, click triggers "Inserting…" then "Inserted ✓" for ~900ms then resets
- Cancel: fires cancel postMessage as before
- No math type or font size controls remain in the footer (those live in RailColumn)

**Theme / font:**
- Body text renders in Geist (not DM Sans) — check DevTools computed `font-family` on any text element

- [ ] **Step 4: Stop the dev server**

Stop `pnpm dev` (Ctrl-C). No commit for this task — verification only.
