# UI Redesign — Phase 5: Editor Column (Col 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Col 2 (`EditorColumn`) as a top `LaTeXPanel` (≈40% height, Tailwind-based) over a bottom `EditorSurface` (live `math-field` on a dotted canvas), plus a selection-triggered floating `ContextToolbar`. Remove the inline preview split from `MathField`/`MathField.module.css` — Col 3 now exclusively owns the preview.

**Architecture:** Extract shared LaTeX-template helpers into `src/lib/latex-templates.ts`, add a `wrap()` method to `useMathField`, build small presentational primitives (`IconBtn`, `ContextToolbar`, `LaTeXPanel`, `EditorSurface`) and compose them in a new `EditorColumn`. `App` gains `hasSelection` state, a `cardRef` + `flash()` pulse, and `handleWrap`, then swaps its inline Col 2 block for `<EditorColumn>` inside a new `<TooltipProvider>`.

**Tech Stack:** React 18 + TypeScript, Tailwind v4 (utility classes, no CSS modules for new components), Radix `Tooltip` (via `src/components/ui/tooltip.tsx`), MathLive (`mathlive` custom element), Lucide icons.

**Source spec:** `docs/superpowers/specs/2026-06-15-ui-redesign-phase5-editor-column-design.md`

**No test runner exists** (`package.json` scripts: `dev`, `build`, `preview`, `lint`). Every task's "test" step is `pnpm exec tsc --noEmit` (and `pnpm lint` where noted); Task 9 runs the full verification + manual dev-server smoke test from the spec.

---

## File structure

| File | Change |
|---|---|
| `src/lib/latex-templates.ts` | **New** — `toInsertLatex`, `toWrapLatex`, `hasSlots` |
| `src/hooks/use-math-field.ts` | Modify — remove inline `toMathLiveTemplate`, import helpers from `latex-templates.ts`, add `wrap(latex)` |
| `src/styles/theme.css` | Modify — add `.ee-canvas-bg`, `.ee-flash`/`@keyframes ee-flash` (+ reduced-motion), `math-field::part(virtual-keyboard-toggle)`/`::part(menu-toggle) { display: none }` |
| `src/components/ui/icon-btn.tsx` | **New** — shared tooltip+icon button |
| `src/components/editor/latex-panel.tsx` | Rewrite — Tailwind-based header + textarea |
| `src/components/editor/latex-panel.module.css` | **Delete** |
| `src/components/editor/context-toolbar.tsx` | **New** — floating Wrap/Script/Accent toolbar |
| `src/components/editor/editor-surface.tsx` | **New** — canvas + live `math-field`, absorbs `MathField.tsx` |
| `src/components/editor/editor-column.tsx` | **New** — composes `LaTeXPanel` + `EditorSurface` |
| `src/components/editor/math-field.tsx` | **Delete** |
| `src/components/editor/math-field.module.css` | **Delete** |
| `src/components/editor/latex-bar.tsx` | **Delete** |
| `src/components/editor/latex-bar.module.css` | **Delete** |
| `src/app.tsx` | Modify — wire `EditorColumn`, `hasSelection`, `cardRef`, `flash`, `handleWrap`, `TooltipProvider` |

---

### Task 1: LaTeX template helpers + `useMathField.wrap`

**Files:**
- Create: `src/lib/latex-templates.ts`
- Modify: `src/hooks/use-math-field.ts`

- [ ] **Step 1: Create `src/lib/latex-templates.ts`**

```ts
/** Numbered slots (#0..#9) → MathLive placeholder token, for live insertion. */
export function toInsertLatex(latex: string): string {
  return latex.replace(/#[0-9]/g, '#?');
}

/** #0 (the "wrap target" slot) → MathLive's "previous selection" token (#@);
 *  remaining numbered slots → placeholder tokens. Used when wrapping a selection. */
export function toWrapLatex(latex: string): string {
  return latex.replace('#0', '#@').replace(/#[1-9]/g, '#?');
}

export function hasSlots(latex: string): boolean {
  return /#[0-9]/.test(latex);
}
```

- [ ] **Step 2: Update `src/hooks/use-math-field.ts`**

Remove the local `toMathLiveTemplate` function, import the new helpers, swap the inline regex test for `hasSlots`, and add `wrap`:

```ts
import { useCallback, useMemo, useRef } from 'react';
import type { MathfieldElement, OutputFormat } from 'mathlive';
import { toInsertLatex, toWrapLatex, hasSlots } from '../lib/latex-templates';

export function useMathField() {
  const ref = useRef<MathfieldElement>(null);

  const insert = useCallback((latex: string): void => {
    if (!ref.current) return;
    ref.current.insert(toInsertLatex(latex), {
      focus: true,
      selectionMode: hasSlots(latex) ? 'placeholder' : 'after',
      format: 'latex',
    });
    ref.current.focus();
  }, []);

  const wrap = useCallback((latex: string): void => {
    if (!ref.current) return;
    ref.current.insert(toWrapLatex(latex), {
      focus: true,
      selectionMode: 'placeholder',
      format: 'latex',
    });
    ref.current.focus();
  }, []);

  const getValue = useCallback((format: OutputFormat): string => {
    if (!ref.current) return '';
    return ref.current.getValue(format);
  }, []);

  const setValue = useCallback((latex: string): void => {
    if (!ref.current) return;
    ref.current.setValue(latex);
  }, []);

  return useMemo(
    () => ({ ref, insert, wrap, getValue, setValue }),
    [insert, wrap, getValue, setValue]
  );
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no output, exit code 0 (`use-math-field.ts` is not yet consumed differently, so this should be clean).

- [ ] **Step 4: Commit**

```bash
git add src/lib/latex-templates.ts src/hooks/use-math-field.ts
git commit -m "feat(editor): extract latex-templates helpers and add useMathField.wrap"
```

---

### Task 2: `theme.css` — canvas background, flash pulse, math-field part rules

**Files:**
- Modify: `src/styles/theme.css`

- [ ] **Step 1: Hide virtual-keyboard/menu toggles on `math-field`**

In `src/styles/theme.css`, immediately after the existing `math-field { ... }` block (the one setting `--selection-background-color`, `--caret-color`, etc., currently ending around line 179), add:

```css
math-field::part(virtual-keyboard-toggle),
math-field::part(menu-toggle) {
  display: none;
}
```

- [ ] **Step 2: Add `.ee-canvas-bg` and the `ee-flash` pulse**

In the "v2.2 redesign utilities (Phase 3)" section, after the `.ee-anim-pop` / `.ee-anim-fade` rules and before the `@media (prefers-reduced-motion: reduce)` block, add:

```css
.ee-canvas-bg {
  background: radial-gradient(circle at 1px 1px, #e4ddec 1px, transparent 0) 0 0 / 20px 20px, #fbfafd;
}

@keyframes ee-flash {
  0%   { box-shadow: 0 0 0 0 rgba(104, 0, 214, 0); }
  30%  { box-shadow: 0 0 0 3px rgba(104, 0, 214, 0.22); }
  100% { box-shadow: 0 0 0 0 rgba(104, 0, 214, 0); }
}
.ee-flash { animation: ee-flash 520ms ease; }
```

- [ ] **Step 3: Add `.ee-flash` to the reduced-motion override**

Update the existing reduced-motion block from:

```css
@media (prefers-reduced-motion: reduce) {
  .ee-anim-pop, .ee-anim-fade { animation: none !important; }
}
```

to:

```css
@media (prefers-reduced-motion: reduce) {
  .ee-anim-pop, .ee-anim-fade, .ee-flash { animation: none !important; }
}
```

- [ ] **Step 4: Lint/build sanity check**

Run: `pnpm lint`
Expected: no errors (CSS isn't linted by ESLint, but this confirms nothing else broke).

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat(theme): add ee-canvas-bg, ee-flash pulse, and hide math-field toggles"
```

---

### Task 3: `IconBtn` primitive

**Files:**
- Create: `src/components/ui/icon-btn.tsx`

- [ ] **Step 1: Create `src/components/ui/icon-btn.tsx`**

Wraps the existing (currently-unused) Radix `Tooltip` primitives for the fixed-size 26×26 Lucide-icon buttons used in `LaTeXPanel`'s header:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Kbd } from './kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface IconBtnProps {
  onClick: () => void;
  label: string;
  sub?: string;
  tone?: 'success';
  children: ReactNode;
}

export function IconBtn({ onClick, label, sub, tone, children }: IconBtnProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'flex h-[26px] w-[26px] items-center justify-center rounded-md transition-colors',
            tone === 'success' ? 'text-success' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800'
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {sub && <Kbd>{sub}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no output, exit code 0. `IconBtn` is not yet imported anywhere — an unused *export* is fine under `noUnusedLocals`/`noUnusedParameters` (those only flag unused locals/params within a module, not unused exports).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/icon-btn.tsx
git commit -m "feat(ui): add IconBtn tooltip+icon button primitive"
```

---

### Task 4: Rewrite `LaTeXPanel`

**Files:**
- Modify: `src/components/editor/latex-panel.tsx`
- Delete: `src/components/editor/latex-panel.module.css`

- [ ] **Step 1: Rewrite `src/components/editor/latex-panel.tsx`**

Replace the entire file with the Tailwind-based version (per spec Section 1 / `library.jsx` lines 124-161). `onCommit`/`onUndo`/`onRedo`/`onClear` map directly to `App`'s existing handlers — same behavior as today's `LaTeXBar`, just a textarea instead of a pill+input and `Trash` instead of `X` for Clear:

```tsx
import { useEffect, useState } from 'react';
import { Copy, Check, Undo2, Redo2, Trash } from 'lucide-react';
import { IconBtn } from '../ui/icon-btn';

interface LaTeXPanelProps {
  value: string;
  onCommit: (latex: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

export function LaTeXPanel({ value, onCommit, onUndo, onRedo, onClear }: LaTeXPanelProps) {
  let [draft, setDraft] = useState(value);
  let [focused, setFocused] = useState(false);
  let [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // clipboard may be unavailable
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[33px] shrink-0 items-center gap-2 border-b border-ink-200/70 pl-3 pr-1.5">
        <span className="select-none text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">
          LaTeX source
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn onClick={onUndo} label="Undo" sub="⌘Z">
            <Undo2 size={14} />
          </IconBtn>
          <IconBtn onClick={onRedo} label="Redo" sub="⌘⇧Z">
            <Redo2 size={14} />
          </IconBtn>
          <span className="mx-0.5 h-4 w-px bg-ink-200" />
          <IconBtn onClick={onClear} label="Clear all">
            <Trash size={13} />
          </IconBtn>
          <span className="mx-0.5 h-4 w-px bg-ink-200" />
          <IconBtn onClick={copy} label={copied ? 'Copied' : 'Copy LaTeX'} tone={copied ? 'success' : undefined}>
            {copied ? <Check size={14} /> : <Copy size={13} />}
          </IconBtn>
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onCommit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onCommit(draft);
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            setDraft(value);
            e.currentTarget.blur();
          }
        }}
        placeholder="empty — type, click a symbol, or ⌘K"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className="ee-scroll min-h-0 flex-1 resize-none bg-ink-50/50 px-3 py-2 font-mono text-[12px] leading-[1.55] text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:bg-surface focus:shadow-[inset_0_0_0_1.5px_rgba(104,0,214,0.35)]"
      />
    </div>
  );
}
```

- [ ] **Step 2: Delete the stale CSS module**

```bash
git rm src/components/editor/latex-panel.module.css
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no output, exit code 0. (The old `latex-panel.tsx` imported `./latex-panel.module.css`, which is now gone, but since the whole file was rewritten there's no dangling import. `LaTeXPanel`'s new props shape isn't consumed yet — that's fine, same unused-export rule as Task 3.)

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/latex-panel.tsx
git commit -m "feat(editor): rewrite LaTeXPanel with Tailwind header + IconBtn cluster"
```

---

### Task 5: `ContextToolbar`

**Files:**
- Create: `src/components/editor/context-toolbar.tsx`

- [ ] **Step 1: Create `src/components/editor/context-toolbar.tsx`**

Per spec Section 3 / `library.jsx` lines 203-248. Uses plain `Tooltip`/`TooltipTrigger`/`TooltipContent` directly (not `IconBtn` — these are 34×30 `MathGlyph` buttons with a different hover treatment):

```tsx
import { Fragment } from 'react';
import { MathGlyph } from '../ui/math-glyph';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface ContextAction {
  latex: string;
  tip: string;
  icon: string;
}

interface ContextGroup {
  label: string;
  items: ContextAction[];
}

const CTX_GROUPS: ContextGroup[] = [
  {
    label: 'Wrap',
    items: [
      { latex: '\\frac{#0}{#1}', tip: 'Fraction', icon: '\\frac{\\square}{\\square}' },
      { latex: '\\sqrt{#0}', tip: 'Square root', icon: '\\sqrt{\\square}' },
      { latex: '\\sqrt[#1]{#0}', tip: 'nth root', icon: '\\sqrt[n]{\\square}' },
      { latex: '\\left(#0\\right)', tip: 'Parentheses', icon: '(\\square)' },
      { latex: '\\left[#0\\right]', tip: 'Brackets', icon: '[\\square]' },
      { latex: '\\left\\{#0\\right\\}', tip: 'Braces', icon: '\\{\\square\\}' },
      { latex: '\\left|#0\\right|', tip: 'Absolute value', icon: '|\\square|' },
    ],
  },
  {
    label: 'Script',
    items: [
      { latex: '#0^{#1}', tip: 'Superscript', icon: '\\square^{n}' },
      { latex: '#0_{#1}', tip: 'Subscript', icon: '\\square_{n}' },
      { latex: '#0_{#1}^{#2}', tip: 'Sub & superscript', icon: '\\square_{n}^{m}' },
    ],
  },
  {
    label: 'Accent',
    items: [
      { latex: '\\vec{#0}', tip: 'Vector', icon: '\\vec{\\square}' },
      { latex: '\\hat{#0}', tip: 'Hat', icon: '\\hat{\\square}' },
      { latex: '\\bar{#0}', tip: 'Bar', icon: '\\bar{\\square}' },
      { latex: '\\dot{#0}', tip: 'Dot', icon: '\\dot{\\square}' },
      { latex: '\\overline{#0}', tip: 'Overline', icon: '\\overline{\\square}' },
      { latex: '\\underbrace{#0}_{#1}', tip: 'Underbrace', icon: '\\underbrace{\\square}' },
    ],
  },
];

interface ContextToolbarProps {
  visible: boolean;
  onAction: (latex: string) => void;
}

export function ContextToolbar({ visible, onAction }: ContextToolbarProps) {
  if (!visible) return null;

  return (
    <div className="ee-anim-pop ee-scroll absolute left-1/2 top-3 z-30 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-xl border border-ink-200 bg-surface p-1.5 shadow-pop">
      {CTX_GROUPS.map((group, gi) => (
        <Fragment key={group.label}>
          {gi > 0 && <span className="mx-0.5 h-6 w-px shrink-0 bg-ink-200" />}
          <span className="shrink-0 select-none px-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-ink-400">
            {group.label}
          </span>
          {group.items.map((item) => (
            <Tooltip key={item.tip}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onAction(item.latex)}
                  className="group flex h-[30px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-md hover:bg-primary-soft active:scale-[0.95]"
                >
                  <MathGlyph latex={item.icon} className="text-[13px] text-ink-800 group-hover:text-primary" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{item.tip}</TooltipContent>
            </Tooltip>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/context-toolbar.tsx
git commit -m "feat(editor): add ContextToolbar with Wrap/Script/Accent groups"
```

---

### Task 6: `EditorSurface`

**Files:**
- Create: `src/components/editor/editor-surface.tsx`

- [ ] **Step 1: Create `src/components/editor/editor-surface.tsx`**

Absorbs the canvas portion of `MathField.tsx` (effects 1-4, unchanged logic), drops the `previewOpen`/split-card branching entirely, renders `ContextToolbar`, and adds a 5th effect for `selection-change`. Per spec Section 2 / `app.jsx` lines 11-32:

```tsx
import 'mathlive';
import React, { useEffect } from 'react';
import type { MathfieldElement } from 'mathlive';
import type { useMathField } from '../../hooks/use-math-field';
import { ContextToolbar } from './context-toolbar';

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface EditorSurfaceProps {
  mathFieldRef: ReturnType<typeof useMathField>['ref'];
  onChange?: (latex: string) => void;
  fontSize: number;
  latex: string;
  mathType: 'display' | 'inline';
  onSelectionChange: (hasSelection: boolean) => void;
  hasSelection: boolean;
  onWrap: (latex: string) => void;
  cardRef: React.RefObject<HTMLDivElement>;
}

export function EditorSurface({
  mathFieldRef,
  onChange,
  fontSize,
  latex,
  mathType,
  onSelectionChange,
  hasSelection,
  onWrap,
  cardRef,
}: EditorSurfaceProps) {
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

      const shadow = el.shadowRoot;
      if (shadow) {
        const style = document.createElement('style');
        style.textContent = `
          :host { border: none !important; outline: none !important; box-shadow: none !important; border-radius: 0 !important; }
          :host(:focus-within) { border: none !important; outline: none !important; box-shadow: none !important; }
          .ML__container { border: none !important; box-shadow: none !important; }
        `;
        shadow.appendChild(style);
      }

      el.focus();
    });
  }, [mathFieldRef]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const tag = active?.tagName.toLowerCase() ?? '';
      // Don't steal focus from text inputs or the math field itself
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (active === mathFieldRef.current) return;
      // Only redirect printable keys, not modifiers/function keys
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      const el = mathFieldRef.current as MathfieldElement | null;
      if (!el) return;
      el.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mathFieldRef]);

  useEffect(() => {
    if (mathType !== 'display') return;

    const el = mathFieldRef.current as MathfieldElement | null;
    if (!el) return;

    function handleEnter(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      const mf = el as MathfieldElement;
      const current = mf.getValue('latex');

      if (current.includes('\\begin{aligned}')) {
        mf.insert('\\\\');
      } else {
        mf.setValue(`\\begin{aligned}${current}\\\\ \\placeholder{}\\end{aligned}`);
        mf.executeCommand('moveToNextPlaceholder');
      }
    }

    el.addEventListener('keydown', handleEnter);
    return () => el.removeEventListener('keydown', handleEnter);
  }, [mathFieldRef, mathType]);

  useEffect(() => {
    const el = mathFieldRef.current as MathfieldElement | null;
    if (!el) return;

    function handler() {
      const ranges = (el as MathfieldElement).selection.ranges;
      onSelectionChange(ranges.some(([from, to]) => from !== to));
    }

    el.addEventListener('selection-change', handler);
    return () => el.removeEventListener('selection-change', handler);
  }, [mathFieldRef, onSelectionChange]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-surface">
      <div className="flex h-[33px] shrink-0 items-center gap-2 border-b border-ink-200/70 px-3">
        <span className="select-none text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">Editor</span>
        <span className="ml-auto font-mono text-[9.5px] text-ink-400">{mathType} · {fontSize}pt</span>
      </div>
      <div className="ee-canvas-bg relative flex min-h-0 flex-1 flex-col">
        <ContextToolbar visible={hasSelection} onAction={onWrap} />
        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          <div
            ref={cardRef}
            className="relative flex min-h-[120px] w-full max-w-[560px] items-center justify-center rounded-xl border border-ink-200 bg-surface px-6 py-6 shadow-sm"
          >
            <math-field
              ref={mathFieldRef as React.RefObject<HTMLElement>}
              className="block w-full border-none bg-transparent outline-none"
              style={{ fontSize: `${30 + (fontSize - 12) * 1.6}px` }}
            />
            {!latex && (
              <p className="pointer-events-none absolute text-[13px] text-ink-400">
                Type LaTeX · click a symbol · ⌘K
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no output, exit code 0. The `declare global { namespace JSX { ... } }` block now exists in both `math-field.tsx` (still present) and `editor-surface.tsx` — this is safe: interface declaration merging for identical augmentations does not conflict.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/editor-surface.tsx
git commit -m "feat(editor): add EditorSurface absorbing math-field canvas + selection-change wiring"
```

---

### Task 7: `EditorColumn`

**Files:**
- Create: `src/components/editor/editor-column.tsx`

- [ ] **Step 1: Create `src/components/editor/editor-column.tsx`**

Thin layout wrapper, no own state. The `flex h-[40%] min-h-[132px] flex-col border-b border-ink-200 bg-surface` wrapper around `LaTeXPanel` matches v2.2's `className` override on `EditorColumn`'s `LaTeXPanel` call:

```tsx
import type { RefObject } from 'react';
import type { useMathField } from '../../hooks/use-math-field';
import { LaTeXPanel } from './latex-panel';
import { EditorSurface } from './editor-surface';

interface EditorColumnProps {
  latex: string;
  onCommit: (latex: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  fontSize: number;
  mathType: 'display' | 'inline';
  mathFieldRef: ReturnType<typeof useMathField>['ref'];
  onChange: (latex: string) => void;
  onSelectionChange: (hasSelection: boolean) => void;
  hasSelection: boolean;
  onWrap: (latex: string) => void;
  cardRef: RefObject<HTMLDivElement>;
}

export function EditorColumn(props: EditorColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-[40%] min-h-[132px] flex-col border-b border-ink-200 bg-surface">
        <LaTeXPanel
          value={props.latex}
          onCommit={props.onCommit}
          onUndo={props.onUndo}
          onRedo={props.onRedo}
          onClear={props.onClear}
        />
      </div>
      <EditorSurface
        mathFieldRef={props.mathFieldRef}
        onChange={props.onChange}
        fontSize={props.fontSize}
        latex={props.latex}
        mathType={props.mathType}
        onSelectionChange={props.onSelectionChange}
        hasSelection={props.hasSelection}
        onWrap={props.onWrap}
        cardRef={props.cardRef}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/editor-column.tsx
git commit -m "feat(editor): add EditorColumn composing LaTeXPanel + EditorSurface"
```

---

### Task 8: Wire `App`, delete superseded files

**Files:**
- Modify: `src/app.tsx`
- Delete: `src/components/editor/math-field.tsx`, `src/components/editor/math-field.module.css`, `src/components/editor/latex-bar.tsx`, `src/components/editor/latex-bar.module.css`

- [ ] **Step 1: Rewrite `src/app.tsx`**

Replace the full file contents with the version below. Changes versus the current file:
- Remove imports of `MathField` and `LaTeXBar`; add `EditorColumn` and `TooltipProvider`.
- Add `hasSelection` state and `cardRef`.
- Add `flash()` (purple pulse on the editor card) and `handleWrap` (calls `mathField.wrap`).
- `handleInsert` now also syncs `currentLatex` and calls `flash()` — parity with v2.2's explicit `setLatex(el.getValue('latex'))` in its insert callback; `EditorSurface`'s `input` listener also catches this, so this is not a behavior change.
- Col 2's inline dotted-background block is replaced by `<EditorColumn>`.
- The whole returned tree is wrapped in `<TooltipProvider>`.

```tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import { useMathField } from './hooks/use-math-field';
import { usePostMessage } from './hooks/use-post-message';
import { CommandPalette } from './components/command-palette/command-palette';
import { RailColumn } from './components/rail/rail-column';
import { EditorColumn } from './components/editor/editor-column';
import { ActionBar } from './components/action-bar/action-bar';
import { MathJaxPreview } from './components/math-preview/mathjax-preview';
import { TooltipProvider } from './components/ui/tooltip';
import { texToMathML } from './lib/tex-to-mathml';
import type { LoadMessage, OutboundMessage } from './types';

export default function App() {
  const mathField = useMathField();
  const seeded = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  let [mathType, setMathType] = useState<'display' | 'inline'>('display');
  let [fontSize, setFontSize] = useState<number>(12);
  let [currentLatex, setCurrentLatex] = useState<string>('');
  let [previewOpen, setPreviewOpen] = useState(false);
  let [paletteOpen, setPaletteOpen] = useState(false);
  let [hasSelection, setHasSelection] = useState(false);

  const onLoad = useCallback(
    (msg: LoadMessage) => {
      mathField.setValue(msg.latex);
      setCurrentLatex(msg.latex);
      setMathType(msg.config.mathType);
      setFontSize(msg.config.fontSize);
    },
    [mathField]
  );

  const { send } = usePostMessage(onLoad);

  const flash = useCallback(() => {
    const c = cardRef.current;
    if (!c) return;
    c.classList.remove('ee-flash');
    void c.offsetWidth;
    c.classList.add('ee-flash');
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!seeded.current && !mathField.getValue('latex')) {
        seeded.current = true;
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [mathField]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPreviewOpen((v) => !v);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleInsert(latex: string) {
    mathField.insert(latex);
    setCurrentLatex(mathField.getValue('latex'));
    flash();
  }

  function handleWrap(latex: string) {
    mathField.wrap(latex);
    setCurrentLatex(mathField.getValue('latex'));
    flash();
  }

  function handleLatexCommit(latex: string) {
    mathField.setValue(latex);
    setCurrentLatex(latex);
  }

  function handleUndo() {
    (mathField.ref.current as MathfieldElement | null)?.executeCommand('undo');
  }

  function handleRedo() {
    (mathField.ref.current as MathfieldElement | null)?.executeCommand('redo');
  }

  function handleClear() {
    (mathField.ref.current as MathfieldElement | null)?.setValue('');
    setCurrentLatex('');
  }

  function handleCancel() {
    const payload: OutboundMessage = { type: 'cancel' };
    send(payload);
  }

  function getLatex() {
    return mathField.getValue('latex');
  }

  function getMathML() {
    return texToMathML(mathField.getValue('latex'), mathType === 'display');
  }

  return (
    <TooltipProvider>
      <div className="flex h-dvh w-full items-stretch justify-center p-4 sm:p-5">
        <div className="flex h-full w-full max-w-[1200px] flex-col overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-[0_18px_50px_-22px_rgba(54,24,92,0.32)]">
          <div className="flex min-h-0 flex-1">
            {/* Col 1 — rail */}
            <RailColumn
              mathType={mathType}
              onMathType={setMathType}
              fontSize={fontSize}
              onFontSize={setFontSize}
              previewOpen={previewOpen}
              onPreviewToggle={() => setPreviewOpen((v) => !v)}
              onOpenPalette={() => setPaletteOpen(true)}
              onInsert={handleInsert}
            />

            {/* Col 2 — editor */}
            <EditorColumn
              latex={currentLatex}
              onCommit={handleLatexCommit}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              fontSize={fontSize}
              mathType={mathType}
              mathFieldRef={mathField.ref}
              onChange={setCurrentLatex}
              onSelectionChange={setHasSelection}
              hasSelection={hasSelection}
              onWrap={handleWrap}
              cardRef={cardRef}
            />

            {/* Col 3 — live preview, on demand. v2.2 styling arrives in Phase 6. */}
            {previewOpen && (
              <div className="flex min-w-0 flex-1 flex-col overflow-auto border-l border-ink-200 bg-surface">
                <MathJaxPreview latex={currentLatex} mathType={mathType} />
              </div>
            )}
          </div>

          <ActionBar
            fontSize={fontSize}
            mathType={mathType}
            getLatex={getLatex}
            getMathML={getMathML}
            send={send}
            onCancel={handleCancel}
          />
        </div>
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onInsert={handleInsert}
        />
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Delete superseded files**

```bash
git rm src/components/editor/math-field.tsx src/components/editor/math-field.module.css src/components/editor/latex-bar.tsx src/components/editor/latex-bar.module.css
```

- [ ] **Step 3: Type-check and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no output / no errors, exit code 0.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: build succeeds with no references to the deleted `math-field`/`latex-bar` modules.

- [ ] **Step 5: Commit**

```bash
git add src/app.tsx
git commit -m "feat(editor): wire EditorColumn into App with TooltipProvider, flash, and handleWrap"
```

---

### Task 9: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full check**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: all three succeed.

- [ ] **Step 2: Manual dev-server smoke test**

Run: `pnpm dev`, open the printed local URL, and verify each item from the spec's Verification section:

- `LaTeXPanel`: textarea reflects editor changes live (when not focused); typing + `Enter` commits to the editor; `Escape` reverts; Undo/Redo/Clear/Copy all work with correct tooltips and the Copy→Check transient state.
- `EditorSurface`: dotted background renders; centered card shows the live math-field; empty-state hint (`"Type LaTeX · click a symbol · ⌘K"`) shows/hides correctly; typing outside any input redirects focus to the math-field; display-mode `Enter` produces `\begin{aligned}` rows; virtual-keyboard/menu toggles are hidden.
- `ContextToolbar`: appears when selecting a range in the math-field, disappears when collapsed; each Wrap/Script/Accent action wraps the selection correctly with a placeholder landing in the new slot.
- Flash: inserting via palette (`⌘K`)/rail/`ContextToolbar` triggers a brief purple pulse on the editor card.
- No visual preview split remains inside Col 2 regardless of `previewOpen` (toggle via `⌘P` — Col 3 still appears/disappears independently).

- [ ] **Step 3: Stop the dev server**

Stop the `pnpm dev` process (Ctrl-C) once verification is complete. No commit for this task — it's verification-only.

---

## Out of scope (per roadmap)

Col 3 (`PreviewColumn`) restyle, `ActionBar` footer rebuild, removal of the Phase 1 CSS-variable compatibility block (`--ee-bg`, `--indigo`, `--ui-font`, etc.), and confirmation that `MathField.module.css`'s split-preview rules are fully gone — all Phase 6.
