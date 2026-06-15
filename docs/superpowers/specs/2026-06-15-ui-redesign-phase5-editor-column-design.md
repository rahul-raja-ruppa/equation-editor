# UI Redesign — Phase 5: Editor Column (Col 2) Design

**Date:** 2026-06-15
**Status:** Approved
**Builds on:** Phase 2 (Col 2 shell placeholder in `app.tsx`, dotted-bg inline style), Phase 3 (`MathGlyph` primitive, `ee-anim-*`/`ee-scroll` utilities in `theme.css`), Phase 4 (`Kbd` primitive)
**Roadmap:** `docs/superpowers/specs/2026-06-12-ui-redesign-phases-2-6-roadmap.md` (Phase 5 section)
**Visual source of truth:** `/tmp/design_export/equation-editor-v2-2/project/app/app.jsx` lines 10-44 (`EditorSurface`/`EditorColumn`), `app/library.jsx` lines 124-173 (`LaTeXPanel`, `IconBtn`) and 203-248 (`ContextToolbar`, `CTX_GROUPS`), `app/math.jsx` lines 4-19 (`toWrapLatex`/`hasSlots`), `Equation Editor.html` lines 78-138 (`.ee-canvas-bg`, `.ee-flash`, `math-field::part(...)` rules). Per the bundle README: match visual output; internal structure adapts to this repo's React + TS + Tailwind v4 conventions.

---

## Goal

Rebuild Col 2 (`EditorColumn`) as a top `LaTeXPanel` (≈40% height) over a bottom `EditorSurface` containing the live `math-field` on a dotted canvas background, plus a new selection-triggered floating `ContextToolbar`. Remove the inline preview split that currently lives inside `MathField`/`MathField.module.css` — Col 3 (`previewOpen`) now exclusively governs the separate preview column established in Phase 2.

---

## File structure

| File | Change |
|---|---|
| `src/components/Editor/editor-column.tsx` | **New** — composes `LaTeXPanel` + `EditorSurface`, pure prop passthrough |
| `src/components/Editor/latex-panel.tsx` + `latex-panel.module.css` | **Rewritten** (overwrites stale Phase-2 placeholder) — header icon cluster + textarea, Tailwind-based; `.module.css` deleted |
| `src/components/Editor/editor-surface.tsx` | **New** — canvas + live `math-field`, absorbs the canvas portion of `MathField.tsx` |
| `src/components/Editor/context-toolbar.tsx` | **New** — floating Wrap/Script/Accent toolbar |
| `src/components/ui/icon-btn.tsx` | **New** — shared tooltip+icon button (`LaTeXPanel`, `ContextToolbar` glyph buttons use plain `Tooltip` directly, not `IconBtn` — see Section 3) |
| `src/lib/latex-templates.ts` | **New** — `toInsertLatex`, `toWrapLatex`, `hasSlots` |
| `src/hooks/use-math-field.ts` | Add `wrap(latex)`; replace inline `toMathLiveTemplate` with `toInsertLatex` from `latex-templates.ts` |
| `src/components/Editor/math-field.tsx` + `math-field.module.css` | **Deleted** — fully absorbed into `editor-surface.tsx` |
| `src/components/Editor/latex-bar.tsx` + `latex-bar.module.css` | **Deleted** — superseded by `latex-panel.tsx` |
| `src/styles/theme.css` | Add `.ee-canvas-bg`; add `.ee-flash`/`@keyframes ee-flash` (+ reduced-motion entry); add/consolidate the global `math-field { ... }` custom-property block including `::part(virtual-keyboard-toggle)`/`::part(menu-toggle) { display: none }` |
| `src/app.tsx` | Replace inline Col 2 block with `<EditorColumn>`; add `hasSelection` state, `cardRef`, `flash`, `handleWrap`; wrap root in `<TooltipProvider>` |

---

## Section 1 — `EditorColumn` + `LaTeXPanel`

### `EditorColumn` (`src/components/Editor/editor-column.tsx`)

Thin layout wrapper, no own state:

```tsx
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
  cardRef: React.RefObject<HTMLDivElement>;
}

export function EditorColumn(props: EditorColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <LaTeXPanel
        value={props.latex}
        onCommit={props.onCommit}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
        onClear={props.onClear}
      />
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

`LaTeXPanel` is rendered inside a `flex h-[40%] min-h-[132px] flex-col border-b border-ink-200 bg-surface` wrapper (matches v2.2's `className` override on `EditorColumn`'s `LaTeXPanel` call). `EditorSurface` is `flex min-h-0 flex-1 flex-col` (its own root, no extra wrapper needed).

### `LaTeXPanel` (`src/components/Editor/latex-panel.tsx`)

Rewritten per `library.jsx` lines 124-161. Props:

```ts
interface LaTeXPanelProps {
  value: string;
  onCommit: (latex: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}
```

**Header** (`flex h-[33px] shrink-0 items-center gap-2 border-b border-ink-200/70 pl-3 pr-1.5`):
- Label: `"LaTeX source"` — `select-none text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400`
- Right-aligned cluster (`ml-auto flex items-center gap-0.5`):
  - `IconBtn` Undo — `<Undo2 size={14} />`, label `"Undo"`, sub `"⌘Z"`, `onClick={onUndo}`
  - `IconBtn` Redo — `<Redo2 size={14} />`, label `"Redo"`, sub `"⌘⇧Z"`, `onClick={onRedo}`
  - divider: `<span className="mx-0.5 h-4 w-px bg-ink-200" />`
  - `IconBtn` Clear — `<Trash size={13} />`, label `"Clear all"`, `onClick={onClear}`
  - divider
  - `IconBtn` Copy — `<Copy size={13} />` / `<Check size={14} />` when `copied`, label `"Copy LaTeX"` / `"Copied"`, `tone={copied ? 'success' : undefined}`

**Body**: `<textarea>` bound to local `draft` state:
- `useState(value)` for `draft`, `useState(false)` for `focused`, `useState(false)` for `copied`
- `useEffect`: when `!focused`, sync `draft` from `value` (so external changes — e.g. from the editor — flow into the textarea while not being edited)
- `onFocus` → `setFocused(true)`
- `onBlur` → `setFocused(false)`; `onCommit(draft)`
- `onKeyDown`:
  - `Enter` without `shiftKey` → `preventDefault()`, `onCommit(draft)`, `e.currentTarget.blur()`
  - `Escape` → `setDraft(value)`, `e.currentTarget.blur()`
- `copy()`: `await navigator.clipboard.writeText(value)` (try/catch, clipboard may be unavailable), `setCopied(true)`, `setTimeout(() => setCopied(false), 1400)`
- Styling: `ee-scroll min-h-0 flex-1 resize-none bg-ink-50/50 px-3 py-2 font-mono text-[12px] leading-[1.55] text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:bg-surface focus:shadow-[inset_0_0_0_1.5px_rgba(104,0,214,0.35)]`
- `placeholder="empty — type, click a symbol, or ⌘K"`
- `spellCheck={false}` `autoComplete="off"` `autoCorrect="off"` `autoCapitalize="off"`

`onCommit`/`onUndo`/`onRedo`/`onClear` map directly to `App`'s existing `handleLatexCommit`/`handleUndo`/`handleRedo`/`handleClear` — no behavior changes versus today's `LaTeXBar`, only control type (textarea vs pill+input) and icon set (`Trash` replaces `X` for Clear).

`latex-panel.module.css` is deleted — all styling moves to Tailwind utility classes.

---

## Section 2 — `EditorSurface`

`src/components/Editor/editor-surface.tsx`, replacing the canvas portion of `MathField.tsx`, per `app.jsx` lines 11-32.

```ts
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
```

### Structure

```tsx
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
```

### Retained behaviors (relocated from `MathField.tsx` lines 49-116, unchanged logic)

1. **`input` listener** — `onChange?.(el.getValue('latex'))`.
2. **Setup on `customElements.whenDefined('math-field')`**:
   - Macro registration: `el.macros = { ...el.macros, boldsymbol: { def: '\\mathbf{#1}', args: 1 }, bm: { def: '\\mathbf{#1}', args: 1 } }`
   - Shadow-DOM style injection removing border/outline/box-shadow on `:host`, `:host(:focus-within)`, `.ML__container`
   - `el.focus()`
3. **Global keydown redirect** — printable, non-modifier keys typed while focus is outside `input`/`textarea`/`select` and outside the math-field itself redirect focus to the math-field.
4. **Display-mode Enter handling** (`mathType === 'display'`) — `Enter` either appends `\\` (if already inside `\begin{aligned}`) or wraps the current value in `\begin{aligned}...\\ \placeholder{}\end{aligned}` and moves to the next placeholder.

### New — `onSelectionChange` wiring

A 5th effect, added alongside the above, registers a `selection-change` listener:

```ts
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
```

(`Range = [start: Offset, end: Offset]`; collapsed ⇔ `from === to` for every range — typically a single range.)

### Styling notes

- `.ee-canvas-bg` (new global rule in `theme.css`):
  ```css
  .ee-canvas-bg {
    background: radial-gradient(circle at 1px 1px, #e4ddec 1px, transparent 0) 0 0 / 20px 20px, #fbfafd;
  }
  ```
  Replaces the inline `style={{ background: 'radial-gradient(...)' }}` currently on the Col 2 wrapper in `app.tsx`.
- Global `math-field { ... }` block in `theme.css` — verify/consolidate the existing custom-property overrides (`--selection-background-color`, `--caret-color`, `--primary`, etc. from Phase 1/3) and add:
  ```css
  math-field::part(virtual-keyboard-toggle),
  math-field::part(menu-toggle) { display: none; }
  ```
- Font-size calculation `30 + (fontSize - 12) * 1.6` is unchanged, now inline (no CSS module).

### Empty-state hint

`"Type LaTeX · click a symbol · ⌘K"` — replaces `"Type LaTeX · click a symbol above · or search with Ctrl+F"`.

### Behavior change — preview removed from Col 2

`cardsSplit`/`cards`/`previewCard`/`card` styles and the `previewOpen` branch are removed entirely. `EditorSurface` always renders the single full-width card regardless of `previewOpen`. The `previewOpen` prop is **not** part of `EditorSurfaceProps` — Col 3 (Phase 6) owns that state exclusively.

---

## Section 3 — `ContextToolbar`, `IconBtn`, and shared LaTeX-template helpers

### `src/lib/latex-templates.ts` (new)

Extracted from `use-math-field.ts`'s inline `toMathLiveTemplate` + `math.jsx` lines 4-19:

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

### `use-math-field.ts` changes

- Remove the local `toMathLiveTemplate` function; import `toInsertLatex` from `latex-templates.ts` and use it in `insert` (identical implementation — pure rename/relocation).
- Add `wrap`:
  ```ts
  const wrap = useCallback((latex: string): void => {
    if (!ref.current) return;
    ref.current.insert(toWrapLatex(latex), {
      focus: true,
      selectionMode: 'placeholder',
      format: 'latex',
    });
    ref.current.focus();
  }, []);
  ```
  (`toWrapLatex`'s output always contains `#@` or `#?`, so `selectionMode` is unconditionally `'placeholder'` — unlike `insert`, which branches on `hasSlots`.)
- Returned object gains `wrap`.

### `src/components/ui/icon-btn.tsx` (new)

Wraps the existing (currently-unused) Radix `Tooltip` primitives:

```tsx
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

Used only by `LaTeXPanel`'s header cluster (Undo/Redo/Clear/Copy — fixed-size Lucide icons with label+shortcut tooltips).

### `ContextToolbar` (`src/components/Editor/context-toolbar.tsx`)

Per `library.jsx` lines 203-248.

```ts
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
```

```ts
interface ContextToolbarProps {
  visible: boolean;
  onAction: (latex: string) => void;
}
```

- Returns `null` when `!visible`.
- Container: `ee-anim-pop ee-scroll absolute left-1/2 top-3 z-30 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-xl border border-ink-200 bg-surface p-1.5 shadow-pop`
- For each group: a `<span>` divider (`mx-0.5 h-6 w-px shrink-0 bg-ink-200`) before all but the first group, then the group label (`shrink-0 select-none px-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-ink-400`), then each item as:
  ```tsx
  <Tooltip>
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
  ```
  These use plain `Tooltip`/`TooltipTrigger`/`TooltipContent` directly (not `IconBtn` — `IconBtn` is sized/styled for fixed 26x26 Lucide-icon buttons, these are 34x30 `MathGlyph` buttons with a different hover treatment).

`onAction` is `App`'s `handleWrap`, which calls `mathField.wrap(latex)`.

---

## Section 4 — `App` wiring

`src/app.tsx` changes:

- **Remove imports**: `MathField` (`./components/Editor/math-field`), `LaTeXBar` (`./components/Editor/latex-bar`).
- **Add imports**: `EditorColumn` (`./components/Editor/editor-column`), `TooltipProvider` (`./components/ui/tooltip`).
- **New state**: `let [hasSelection, setHasSelection] = useState(false);`
- **New ref**: `const cardRef = useRef<HTMLDivElement>(null);`
- **New `flash` callback**:
  ```ts
  const flash = useCallback(() => {
    const c = cardRef.current;
    if (!c) return;
    c.classList.remove('ee-flash');
    void c.offsetWidth;
    c.classList.add('ee-flash');
  }, []);
  ```
- **`handleInsert` updated**:
  ```ts
  function handleInsert(latex: string) {
    mathField.insert(latex);
    setCurrentLatex(mathField.getValue('latex'));
    flash();
  }
  ```
  (The `setCurrentLatex` call is a belt-and-suspenders sync matching v2.2's explicit `setLatex(el.getValue('latex'))` in its `insert` callback — `EditorSurface`'s `input` listener also catches this, so this is not a behavior change, just parity with the reference.)
- **New `handleWrap`**:
  ```ts
  function handleWrap(latex: string) {
    mathField.wrap(latex);
    setCurrentLatex(mathField.getValue('latex'));
    flash();
  }
  ```
- **Col 2 JSX replaced** — the current inline `<div className="flex min-w-0 flex-1 flex-col" style={{ background: 'radial-gradient(...)' }}>...</div>` block becomes:
  ```tsx
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
  ```
- **`TooltipProvider`**: wrap the existing returned JSX (the outermost `<div className="flex h-dvh w-full items-stretch justify-center p-4 sm:p-5">...</div>`) in `<TooltipProvider>...</TooltipProvider>`.

---

## Out of scope (per roadmap)

Col 3 (`PreviewColumn`) restyle, `ActionBar` footer rebuild, removal of the Phase 1 CSS-variable compatibility block (`--ee-bg`, `--indigo`, `--ui-font`, etc.) and confirmation that `MathField.module.css`'s split-preview rules are fully gone — all Phase 6.

---

## Verification

No test runner exists (`package.json` scripts: `dev`, `build`, `preview`, `lint`). Verify via `pnpm exec tsc --noEmit && pnpm lint && pnpm build` plus a manual dev-server smoke test:

- `LaTeXPanel`: textarea reflects editor changes live (when not focused); typing + `Enter` commits to the editor; `Escape` reverts; Undo/Redo/Clear/Copy all work with correct tooltips and the Copy→Check transient state
- `EditorSurface`: dotted background renders; centered card shows the live math-field; empty-state hint shows/hides correctly; typing outside any input redirects focus to the math-field; display-mode `Enter` produces `\begin{aligned}` rows; virtual-keyboard/menu toggles are hidden
- `ContextToolbar`: appears when selecting a range in the math-field, disappears when collapsed; each Wrap/Script/Accent action wraps the selection correctly with a placeholder landing in the new slot
- Flash: inserting via palette/rail/`ContextToolbar` triggers a brief purple pulse on the editor card
- No visual preview split remains inside Col 2 regardless of `previewOpen`
- `pnpm build` succeeds with `math-field.tsx`/`.module.css` and `latex-bar.tsx`/`.module.css` deleted
