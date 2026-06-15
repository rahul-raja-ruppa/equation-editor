# UI Redesign — Phase 6: PreviewColumn + ActionBar + Final Cleanup

**Date:** 2026-06-15
**Status:** Approved
**Builds on:** Phase 5 (EditorColumn complete, Col 3 slot unstyled bare div in App)
**v2.2 reference:** `app.jsx` lines 46-70 (`PreviewColumn`), `library.jsx` lines 176-201 (`ActionBar`)

---

## Goals

1. Wrap `MathJaxPreview` in a proper `PreviewColumn` with v2.2 header chrome and empty state.
2. Rebuild `ActionBar` as a single clean file — status indicator on the left, Cancel + Insert on the right, toast on MathML error.
3. Remove all legacy compat CSS vars from `theme.css` (keep only shadcn semantic tokens).
4. Delete all dead files: `action-bar.module.css`, sub-components (`cancel-button.tsx`, `insert-button.tsx`, `size-control.tsx`, `type-toggle.tsx`), and `mathjax-preview.module.css` after migrating its 3 token refs.

---

## Section 1 — `PreviewColumn`

### New file: `src/components/math-preview/preview-column.tsx`

Wraps the existing `MathJaxPreview` (internals unchanged) with v2.2 chrome. Replaces the bare `<div>` in `App`'s Col 3 slot.

**Props:**
```ts
interface PreviewColumnProps {
  latex: string;
  mathType: 'display' | 'inline';
}
```

**Structure:**
```
PreviewColumn (flex col, min-w-0 flex-1, border-l border-ink-200)
  ├── Header strip (h-[33px] shrink-0, border-b border-ink-200/70, px-3, flex items-center gap-2)
  │   ├── "Live preview" label  (9.5px semibold uppercase tracking, text-ink-400)
  │   └── "● MathJax" badge    (ml-auto, secondary dot + mono label, text-ink-400)
  └── Body (flex-1, ee-anim-fade, relative)
      ├── Empty state: "Live preview appears here" centered text-ink-400 (when latex.trim() === '')
      └── <MathJaxPreview latex={latex} mathType={mathType} /> (always mounted)
```

Header matches `EditorSurface`'s strip exactly (same height, border, label style) for visual consistency across Col 2 and Col 3.

The `ee-anim-fade` class applies to the outer `PreviewColumn` element so the whole column fades in when `previewOpen` flips true.

### `MathJaxPreview` changes

Migrate `mathjax-preview.module.css`'s 3 legacy token refs to Tailwind utility classes inline, then **delete** the CSS module:

| Legacy token | Replacement |
|---|---|
| `var(--ee-muted)` | `text-ink-400` |
| `var(--ee-border)` | `border-ink-200` |
| `var(--ee-accent)` | `border-t-primary` |

After migration, `MathJaxPreview` uses only Tailwind classes (no CSS module import). Spinner, loading/error states, and SVG render output are all expressed via Tailwind utilities.

---

## Section 2 — `ActionBar` rebuild

### Single file: `src/components/action-bar/action-bar.tsx` (complete rewrite)

All existing action-bar files are deleted:
- `action-bar.module.css`
- `cancel-button.tsx`
- `insert-button.tsx`
- `size-control.tsx` (dead — not imported anywhere since Phase 3 moved controls to RailColumn)
- `type-toggle.tsx` (dead — same reason)

**Props** (App gains `latex` pass-through):
```ts
interface ActionBarProps {
  latex: string;
  mathType: 'display' | 'inline';
  fontSize: number;
  getLatex: () => string;
  getMathML: () => Promise<string>;
  send: (payload: OutboundMessage) => void;
  onCancel: () => void;
}
```

**Layout** (full width, `min-h-[46px]`, `border-t border-ink-200`, `px-3.5 py-2`, flex row):

```
ActionBar
  ├── Left — status indicator (flex items-center gap-2)
  │   ├── dot       w-1.5 h-1.5 rounded-full
  │   │             success (green) when hasContent, ink-300 when empty
  │   ├── label     "MathML & LaTeX ready" / "Empty equation"  (10px, text-ink-500)
  │   └── meta      "{mathType} · {fontSize}pt"  (10px mono, text-ink-400, hidden on narrow: max-sm:hidden)
  └── Right — buttons (ml-auto, flex items-center gap-2)
      ├── Cancel    ghost/outline, existing onCancel → 'cancel' postMessage
      └── Insert    primary-filled when hasContent; ink-300/disabled when !hasContent
                    states: idle "Insert" | loading "Inserting…" | inserted "Inserted ✓" (900ms)
```

**Insert button state machine:**
```
idle ──(click, hasContent)──→ loading ──(success)──→ inserted ──(900ms)──→ idle
                                       └─(error)───→ idle  +  show Toast
```

**Toast** (self-contained, no external library):
- Component lives inline in `action-bar.tsx` (only callsite).
- Positioned `fixed bottom-[64px] left-1/2 -translate-x-1/2 z-50`.
- `ee-anim-fade` entrance animation; auto-unmounts after 2000ms via `setTimeout`.
- Displays the error message string from `getMathML()` rejection.
- Style: `rounded-lg bg-ink-800 px-3 py-1.5 text-[11px] text-white shadow-pop`.

**`hasContent`** derived as `latex.trim().length > 0` — passed from App (no local state needed in ActionBar).

---

## Section 3 — Final cleanup

### `src/styles/theme.css`

Remove the entire unlayered `:root { ... }` legacy compat block (lines 82–170 in the current file). Keep:
- The shadcn semantic tokens (`--background`, `--foreground`, `--card`, `--popover`, `--primary-foreground`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`) — required by Button/Tooltip/ScrollArea.
- The `math-field` theming block (reads new `--color-*` tokens — already clean).
- The `@layer base` block.
- The `@theme inline` shadcn mapping block.
- All v2.2 redesign utilities (`.ee-*`, `.ee-glyph`, `@keyframes`).

Migrate `body` font from `var(--ui-font)` → `var(--font-sans)` (Geist). Remove the `/* TODO Phase 2: migrate */` comment.

### Verification before removal

Before deleting the compat block, confirm zero remaining references with:
```bash
rg "var\(--ee-|var\(--bg-|var\(--border-|var\(--indigo|var\(--violet|var\(--text-|var\(--r-|var\(--ui-font|var\(--mono-font|var\(--math-font|var\(--t-fast|var\(--t-med|var\(--shadow-xs|var\(--shadow-sm|var\(--shadow-md" src/
```
Expected: zero matches.

### Dead file confirmation

`math-field.tsx` and `math-field.module.css` were deleted in Phase 5. Confirm they're absent:
```bash
ls src/components/editor/
```
Expected: `context-toolbar.tsx`, `editor-column.tsx`, `editor-surface.tsx`, `latex-panel.tsx` only.

---

## File change summary

| File | Action |
|---|---|
| `src/components/math-preview/preview-column.tsx` | **New** |
| `src/components/math-preview/mathjax-preview.tsx` | Rewrite — Tailwind only, no CSS module |
| `src/components/math-preview/mathjax-preview.module.css` | **Delete** |
| `src/components/action-bar/action-bar.tsx` | **Complete rewrite** |
| `src/components/action-bar/action-bar.module.css` | **Delete** |
| `src/components/action-bar/cancel-button.tsx` | **Delete** |
| `src/components/action-bar/insert-button.tsx` | **Delete** |
| `src/components/action-bar/size-control.tsx` | **Delete** (dead code) |
| `src/components/action-bar/type-toggle.tsx` | **Delete** (dead code) |
| `src/app.tsx` | Modify — add `latex` prop to ActionBar, swap Col 3 div for PreviewColumn |
| `src/styles/theme.css` | Modify — remove compat block, migrate body font |

---

## Out of scope

- `MathJaxPreview` rendering engine or MathJax pipeline changes.
- Any changes to Col 1 (RailColumn) or Col 2 (EditorColumn).
- New shadcn primitives.
- Responsive breakpoints beyond the `max-sm:hidden` on the meta label.
