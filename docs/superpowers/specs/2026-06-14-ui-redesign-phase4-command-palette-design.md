# UI Redesign — Phase 4: Command Palette (⌘K) Design

**Date:** 2026-06-14
**Status:** Approved
**Builds on:** Phase 3 (`RailColumn` mounted with an inert header search icon-button; `onOpenPalette={() => {}}` placeholder in `app.tsx`)
**Roadmap:** `docs/superpowers/specs/2026-06-12-ui-redesign-phases-2-6-roadmap.md` (Phase 4 section)
**Visual source of truth:** `/tmp/design_export/equation-editor-v2-2/project/app/palette.jsx` (whole file). Per the bundle README: match visual output; internal structure adapts to this repo's React + TS + Tailwind v4 conventions.

---

## Goal

Build `CommandPalette` — a portaled, full-screen modal search over symbols, structures, quick-access items, and expression-library templates, with grouped, ranked results and a live `MathGlyph` preview per row. Wire it to a new `paletteOpen` state in `App`, toggled by `⌘K`/`Ctrl+K` and by the rail header's search button (inert since Phase 3).

---

## Section 1 — Data layer cleanup (prerequisite)

The current toolbar/quick data is split across TS files with naming (`row1`/`row2`) that no longer means anything — `symbol-grid.tsx` just does `[...row1, ...row2]` for a single 6-column grid — while the expression library (`src/data/expressions/*.json`) is already JSON with meaningful names. `buildIndex` needs to read from all of these, so this is the moment to make them consistent:

- **`src/data/toolbar/row1.ts` + `row2.ts`** (17 `ToolbarCategory` entries total) → merged into **`src/data/toolbar/categories.json`**, preserving row1-then-row2 order (same effective order `symbol-grid.tsx` renders today).
- **`src/data/quick.ts`** (9 `PaletteItem` entries) → **`src/data/quick.json`**.
- **`src/data/expressions/*.json`** (8 files) — unchanged, already correctly named.
- **`types/index.ts`** — `ToolbarCategory` and `PaletteItem` interfaces stay as-is. JSON imports are typed at the import site with `satisfies ToolbarCategory[]` / `satisfies PaletteItem[]` (TS infers literal shapes from JSON modules with `resolveJsonModule`; `satisfies` validates structure without widening).
- **`src/components/Rail/symbol-grid.tsx`** — replace:
  ```ts
  import row1 from '../../data/toolbar/row1';
  import row2 from '../../data/toolbar/row2';
  const CATEGORIES: ToolbarCategory[] = [...row1, ...row2];
  ```
  with:
  ```ts
  import categoriesData from '../../data/toolbar/categories.json';
  const CATEGORIES = categoriesData satisfies ToolbarCategory[];
  ```
- **Delete** `row1.ts`, `row2.ts`, `quick.ts` once their replacements are wired and verified.

`symbol-grid.tsx` is the *only* current consumer of `row1`/`row2`; `quick.ts` currently has no consumers (it becomes the palette's "Common" group source).

---

## Section 2 — `CommandPalette` component

**New file:** `src/components/CommandPalette/CommandPalette.tsx`. Portaled to `document.body` via `createPortal` — same convention as the existing `FlyoutPalette`.

### Index (`buildIndex`, built once via `useMemo`)

Flattens three data sources into `{ latex, name, group, isTemplate }` entries, deduped on `latex + '|' + name`:

1. **`categories.json`** — each category's `.palette` items (skip entries where `isSpace` is true) → `{ latex: item.latex, name: item.tooltip, group: category.tooltip, isTemplate: !!item.isTemplate }`
2. **`quick.json`** — each item → `{ latex: item.latex, name: item.tooltip, group: 'Common', isTemplate: !!item.isTemplate }`
3. **`expressions/*.json`** (all 8 tabs, eager static imports — combined ~6.6KB, negligible) — each tab's `.items`, for each `EXPRESSION_TAB_IDS` entry → `{ latex: item.latex, name: item.label, group: EXPRESSION_TAB_LABELS[id], isTemplate: true }`

### Ranking (`score`) — ported verbatim from `palette.jsx`

```ts
function score(entry: IndexEntry, needle: string): number {
  const name = entry.name.toLowerCase();
  const latex = entry.latex.toLowerCase();
  const group = entry.group.toLowerCase();
  if (name === needle) return 0;
  if (name.startsWith(needle)) return 1;
  if (latex.replace(/\\/g, '').startsWith(needle)) return 2;
  if (name.includes(needle)) return 3;
  if (latex.includes(needle)) return 4;
  if (group.includes(needle)) return 5;
  return 99;
}
```

### Results (`useMemo`, keyed on `query`/`index`)

- **Empty query** → entries where `group === 'Common'` or `isTemplate`, first 36, in encounter order (no scoring/sorting).
- **Non-empty query** → map to `{ entry, s: score(entry, needle) }`, filter `s < 99`, sort by `s` ascending, take top 48, unwrap to entries.

### Grouping (`groupResults`)

Buckets the flat `results` array into `{ group, items }[]`, preserving first-encounter order — used for rendering under `GroupHeader`s. Keyboard navigation (`active` index) operates on the **flat** `results` list; a running `flatCounter` during render maps each `ResultRow` back to its flat index for `active`/`onHover`/`onSelect`.

### Rendering

- **`GroupHeader`** — small uppercase tracked label (`text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400`) + trailing hairline (`h-px flex-1 bg-ink-200/70`).
- **`ResultRow`** — `flex items-center gap-4` button: left side `name` (truncated, 13px) over `latex` (mono, 11px, `text-ink-400`); right side a bordered `MathGlyph` preview chip (`w-[80px]`); active row additionally shows a trailing `↵` (lucide `CornerDownLeft`, via the new `Kbd`). Active row styled `bg-primary-soft` + `text-primary`; inactive `hover:bg-ink-50`.
- **Empty state** — `No matches for "{query}"` when `results.length === 0`.
- **Footer** — left: `↑↓ navigate`, `↵ insert` (using `Kbd`); right: `{results.length} result(s)`, mono.

### New shared primitive — `Kbd`

**New file:** `src/components/ui/kbd.tsx`. A small `<span>` styled as a keyboard-key badge (rounded, bordered, `text-[10px]`, `font-mono`, `text-ink-500`, `bg-ink-50`/`bg-surface`). Used for:
- `esc` hint in the search input's right side
- `↑` / `↓` / `↵` in the footer hint bar
- `↵` on the active `ResultRow`

### Interaction

- **Open** (`open` prop becomes `true`): reset `query` to `''`, `active` to `0`, autofocus the input after a 20ms `setTimeout` (matches v2.2 — avoids focus race with the mount/portal).
- **`↑`/`↓`**: move `active`, clamped to `[0, results.length - 1]`.
- **`Enter`**: insert `results[active].latex` via `onInsert`, then `onClose()`.
- **`Escape`**: `onClose()` — bound both on the search `<input>`'s `onKeyDown` and on a `window` `keydown` listener (so Escape closes even if focus has left the input).
- **Backdrop click**: `onClose()`.
- **Active-row auto-scroll**: on `active` change, if the active `ResultRow` is out of view in the scrollable results list, scroll it into view (matches v2.2's `getBoundingClientRect` adjustment).
- **Query change**: resets `active` to `0`.

### Animation

Backdrop: `ee-anim-fade`. Panel: `ee-anim-pop`. Both already exist in `src/styles/theme.css` (added in Phase 3) — **no new keyframes needed**. (v2.2's `ee-anim-modal` class does not exist in this codebase and is not added; `ee-anim-pop`'s `translateY(-4px) scale(.97)` + `transform-origin: top center` reads correctly for a `pt-[10vh]`-anchored modal.)

### Layout

`fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh]` wrapper; panel `w-full max-w-[640px] rounded-xl border border-ink-200 bg-surface shadow-pop overflow-hidden`; results list `ee-scroll max-h-[56vh] overflow-y-auto`.

---

## Section 3 — State wiring + `App` integration

- **New state** in `app.tsx`: `const [paletteOpen, setPaletteOpen] = useState(false)`.
- **New global keydown handler**, alongside the existing `⌘P`/`Ctrl+P` handler in the same `useEffect`:
  ```ts
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    setPaletteOpen((v) => !v);
  }
  ```
- **`RailColumn`'s `onOpenPalette`**: `() => {}` → `() => setPaletteOpen(true)`.
- **Mount point**: `<CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onInsert={handleInsert} />` rendered unconditionally as a sibling within `App`'s root `<div>` (it portals to `document.body` and internally returns `null` when `!open`, so its position in the JSX tree doesn't affect layout — matches `palette.jsx`'s `if (!open) return null` pattern).
- **`onInsert`** reuses the existing `handleInsert` (`mathField.insert(latex)`) — no changes.

---

## Files touched

| File | Change |
|---|---|
| `src/data/toolbar/categories.json` | **New** — merged row1+row2 (17 categories) |
| `src/data/quick.json` | **New** — converted from `quick.ts` |
| `src/data/toolbar/row1.ts`, `row2.ts`, `src/data/quick.ts` | **Deleted** |
| `src/components/Rail/symbol-grid.tsx` | Import update only |
| `src/components/ui/kbd.tsx` | **New** |
| `src/components/CommandPalette/CommandPalette.tsx` | **New** |
| `src/app.tsx` | `paletteOpen` state, `⌘K` handler, `onOpenPalette` wiring, mount `CommandPalette` |

---

## Out of scope

`hasSelection` / `ContextToolbar` (Phase 5). Editor column rebuild (Phase 5). Preview column styling, footer `ActionBar` restyle (Phase 6).

---

## Verification

No test runner exists (`package.json` scripts: `dev`, `build`, `preview`, `lint`). Verify via `pnpm build` + `pnpm lint` + `pnpm exec tsc --noEmit` + a manual dev-server smoke test:
- `⌘K`/`Ctrl+K` opens/closes the palette; rail header search button opens it
- Empty query shows Common + template entries; typing filters/ranks/groups correctly
- `↑`/`↓`/`Enter`/`Escape` keyboard nav works; clicking a result inserts and closes
- `categories.json`/`quick.json` data renders correctly in `SymbolGrid` (regression check on the Section 1 data migration)
