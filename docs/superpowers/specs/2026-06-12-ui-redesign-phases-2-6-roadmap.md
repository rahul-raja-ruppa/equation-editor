# Equation Editor — UI/UX Redesign · Phases 2-6 Roadmap

**Date:** 2026-06-12
**Status:** Proposed
**Builds on:** [Phase 1: Foundation](2026-06-12-ui-redesign-phase1-foundation-design.md) (Tailwind v4 tokens, self-hosted fonts, shadcn/ui primitives, Framer Motion)
**Scope:** Design-level specs for the five remaining phases of the v2.2 redesign. Each phase still gets its own implementation plan (via `writing-plans`) and review before code is written — this document is the shared roadmap so all five can be evaluated together before any of them starts.

Source of truth for visuals/behavior throughout: `/tmp/design_export/equation-editor-v2-2/project/` (`app.jsx`, `rail.jsx`, `toolbar.jsx`, `palette.jsx`, `library.jsx`, `math.jsx`, `ui.jsx`, `data.js`, `Equation Editor.html`). Per the bundle's README, match visual output — internal structure is adapted to this codebase's React + TS + Tailwind conventions, not copied verbatim.

---

## Two open questions, resolved

**1. `mathVirtualKeyboard` layout customization** — dropped from scope. The v2.2 design hides the virtual keyboard entirely:
```css
math-field::part(virtual-keyboard-toggle),
math-field::part(menu-toggle) { display: none; }
```
These two rules are added to the `math-field` global block in Phase 5 (where `MathField` is rebuilt). No VK surface exists, so there's nothing to lay out.

**2. Live preview engine (Col 3)** — keep `MathJaxPreview` (current SVG-via-MathJax implementation), not the prototype's `convertLatexToMarkup`. The bundle's `convertLatexToMarkup` preview was a CDN convenience for the design tool; this app already has a working MathJax pipeline and "match the visual output, not the internal structure" applies. Phase 6 restyles `MathJaxPreview`'s container to match v2.2's Col 3 — the `MathJax` badge in the header is accurate as-is.

---

## Phase 2 — App shell & layout

**Goal:** Restructure `App.tsx` from the current single-column stack (`UtilityRow` → `ToolbarZone` → `ExpressionZone` → `MathField`+`LaTeXBar` → `ActionBar`) into the v2.2 outer shell: a centered, padded (`p-4 sm:p-5`), max-width (`1200px`) rounded card (`rounded-xl border shadow-[...]`) containing a `flex min-h-0 flex-1` row of columns, with `ActionBar` as a full-width footer below the row.

**What moves where (structural only — no restyling yet):**
- New root wrapper + card container replace `App.module.css`'s `.root`/`.editor`.
- `UtilityRow` + `ToolbarZone` + `ExpressionZone` are wrapped together into a single left-column container (`RailColumn` shell) — contents unchanged, just re-parented. This column becomes 340px and gets its real v2.2 content in Phase 3.
- `MathField` + `LaTeXBar` are wrapped into a middle-column container (`EditorColumn` shell), still flex-1.
- The preview pane currently rendered *inside* `MathField` (via `previewOpen` → `cardsSplit`/`previewCard`) is extracted to a **true third flex column** at the `App` level, gated by `previewOpen`, rendering the existing `MathJaxPreview` unchanged. This establishes the Col 3 slot; Phase 6 gives it v2.2 styling.
- `ActionBar` stays a footer, now spanning the full card width below the row (currently it already does this — verify it still does after the row becomes `flex`).

**State:** `mathType`, `fontSize`, `currentLatex`, `previewOpen` already live in `App` — no new state needed this phase. Add a global `⌘P` keydown handler in `App` that toggles `previewOpen` (currently only triggerable via `UtilityRow`'s preview button); this is layout-level state so it belongs here even though the *button* that also toggles it gets restyled in Phase 3.

**Out of scope:** `⌘K` / command palette state (Phase 4), `hasSelection` / context toolbar (Phase 5), any visual restyle of `UtilityRow`, `ToolbarZone`, `ExpressionZone`, `MathField`, `LaTeXBar`, `ActionBar` — they keep their current CSS Modules and just render in new positions. This phase is "move the furniture," not "redecorate."

**v2.2 reference:** `app.jsx` lines 119-146 (overall `App` return — card, row, footer, Col 3 conditional).

---

## Phase 3 — Rail (Col 1)

**Goal:** Replace `UtilityRow` + `ToolbarZone` (and the search portion of their combined responsibilities) with `RailColumn` — the 340px left column from `rail.jsx`. `ExpressionZone` is also replaced here (its v2.2 equivalent, `VerticalLibrary`, lives in the same column).

**New component tree** (`src/components/Rail/`):
- `RailColumn` — header (logo + "Equation Editor" title + search icon-button) + scrollable body containing `ControlRow`, `SymbolGrid`, `VerticalLibrary`, separated by hairlines.
- `ControlRow` — `PreviewToggle` (eye icon + sliding switch, bound to `previewOpen`/`⌘P` from Phase 2) + `MathTypeToggle` (sliding-thumb Display/Inline segmented control) + `SizeSelect` (native `<select>` styled per v2.2, `SIZE_OPTIONS = [10,11,12,14,16,18]`).
- `SymbolGrid` — 6-column grid of `GridCatButton` tiles, one per category in `row1`+`row2` (existing `src/data/toolbar/row1.ts` / `row2.ts` — same 11 categories, no data changes). Each tile shows a `MathGlyph` of `category.icon`, opens a `FlyoutPalette` on hover/click/focus.
- `VerticalLibrary` — replaces `ExpressionZone`: category tabs (same `EXPRESSION_TAB_IDS`/`EXPRESSION_TAB_LABELS`, same `src/data/expressions/*.json`) + a 2-column scrollable grid of formula cards (`MathGlyph` + label), instead of the current horizontal chip strip.

**New shared primitive — `MathGlyph`** (`src/components/ui/MathGlyph.tsx` or `src/lib/mathGlyph.tsx`): generalizes the current `MathPreview` — same `convertLatexToMarkup` + slot/matrix transforms (`toGlyphLatex`, ported from `math.jsx`), plus the v2.2 additions:
- `.ee-glyph` font-override rules (Latin Modern Math mapped onto MathLive's `.ML__cmr`/`.ML__mathit`/etc. classes — the deferred piece from Phase 1 §3) are added here, in this component's CSS.
- Auto-scale-to-fit (`fit()` in `math.jsx` lines 52-67) so tall constructs (integrals, matrices) shrink to fit their button instead of clipping.
`MathPreview` is renamed/replaced by this component; all toolbar/library/palette consumers across Phases 3-6 use it.

**Flyout palette:** existing `FlyoutPalette`/`CategoryButton`/`useFlyout` logic is retained (anchor-rect positioning, hover-intent open/close timers) but restyled per `toolbar.jsx`'s `FlyoutPalette` (rounded-xl popover, dynamic column count by category type, `SpaceVisual` for spacing glyphs).

**Scrapped:** `UtilityRow.tsx/.module.css` (its search bar moves to Phase 4; preview/type/size controls move into `ControlRow`), `ToolbarZone.tsx/.module.css`, `ExpressionZone.tsx/.module.css`, `ExpressionTabStrip.tsx/.module.css`, `ExpressionChips.tsx/.module.css`, `CategoryButton`'s ribbon-row styling (logic kept, restyled as `GridCatButton`).

**Decision — search button wiring:** the header search icon-button and `SearchRow`'s `⌘K` hint are built in this phase but their `onClick`/`onOpenPalette` callback is a no-op (`paletteOpen` state doesn't exist yet) until Phase 4 wires it up. This is the only intentionally-inert UI in the roadmap, scoped to one phase gap.

**v2.2 reference:** `rail.jsx` (whole file), `library.jsx` lines 6-48 (`PreviewToggle`, `MathTypeToggle`), `toolbar.jsx` (flyout + category button), `math.jsx` (`MathGlyph`, `toGlyphLatex`).

---

## Phase 4 — Command palette (⌘K)

**Goal:** Build `CommandPalette` per `palette.jsx` — a portaled, full-screen modal search over symbols, structures, quick-access items, and expression-library templates, with grouped results and a live `MathGlyph` preview per row.

**New component** (`src/components/CommandPalette/CommandPalette.tsx`):
- Search index (`buildIndex`): flattens `row1`+`row2` category palettes, `quick` items, and all expression-library tabs into `{ latex, name, group, isTemplate }` entries, deduped. This **replaces** the index-building logic currently inline in `UtilityRow` (`src/components/Utility/UtilityRow.tsx` lines 85-102) — same data sources, moved here.
- Ranking (`score`): ported from `palette.jsx` lines 19-28 — exact name match → prefix match → latex-prefix match → substring matches → group match. This is a meaningful upgrade over `UtilityRow`'s current plain substring `.includes()` filter (line 110-117), which had no ranking.
- Grouped rendering (`groupResults` + `GroupHeader`): results rendered under their category/tab labels, preserving encounter order.
- `ResultRow`: name + latex on the left, `MathGlyph` preview chip on the right, `↵` hint on the active row.
- Keyboard: `↑`/`↓` navigate, `Enter` inserts + closes, `Escape` closes. Empty query shows `Common` + template entries (first 36); non-empty query is scored/sorted (top 48).
- Footer hint bar: `↑↓ navigate`, `↵ insert`, result count.

**State & wiring:** add `paletteOpen` boolean to `App`; global `⌘K` keydown handler toggles it (alongside the `⌘P` handler from Phase 2). `RailColumn`'s header search button and `SearchRow` (Phase 3, previously no-op) now call `onOpenPalette`.

**Scrapped:** the inline search `<input>` + dropdown results UI in `UtilityRow` (already removed structurally in Phase 3 when `UtilityRow` was deleted — this phase removes the *logic* that lived alongside it).

**v2.2 reference:** `palette.jsx` (whole file).

---

## Phase 5 — Editor column (Col 2)

**Goal:** Rebuild `EditorColumn` per `app.jsx`'s `EditorColumn`/`EditorSurface` and `library.jsx`'s `LaTeXPanel`/`ContextToolbar`: a top `LaTeXPanel` (≈40% height) over a bottom `EditorSurface` containing the live `math-field` on a dotted canvas background, plus a new selection-triggered floating `ContextToolbar`.

**`LaTeXPanel`** (replaces `LaTeXBar.tsx/.module.css`):
- Header row: "LaTeX source" label + icon-button cluster — Undo, Redo, divider, Clear (trash icon), divider, Copy (clipboard → checkmark on success, 1.4s). All five actions already exist in `App`/`LaTeXBar`; only the layout and icon set change (current `LaTeXBar` already has Undo/Redo/Clear/Copy — Clear's icon changes from `X` to `Trash`, divider grouping added per v2.2).
- Body: a `<textarea>` (not the current pill+conditional-`<input>`) bound to the LaTeX string, committing on blur / `Enter` (no shift) / reverting on `Escape` — same commit semantics as today's `handleCommit`, different control.

**`EditorSurface`** (replaces the canvas portion of `MathField.tsx`):
- Header strip: "Editor" label + `{mathType} · {fontSize}pt` indicator (new — small UX addition, no functional change).
- `.ee-canvas-bg` dotted background (radial-gradient pattern, added to theme in this phase).
- Centered card (`max-w-[560px]`, rounded, bordered) containing the live `math-field` — shadow-DOM override styles, macro registration (`boldsymbol`/`bm`), focus-on-ready, and the `display`-mode Enter→`\begin{aligned}` behavior are all **retained from current `MathField.tsx`** (lines 49-116), just relocated into this component.
- Empty-state hint text (`"Type LaTeX · click a symbol · ⌘K"`) replaces the current `"Type LaTeX · click a symbol above · or search with Ctrl+F"` (wording updated to match the new ⌘K palette).
- `math-field::part(virtual-keyboard-toggle)` / `::part(menu-toggle)` → `display: none` added to the global `math-field` block (resolves the VK-layout question from Phase 1, see top of this doc).

**New — `ContextToolbar`** (`src/components/Editor/ContextToolbar.tsx`): a floating, horizontally-scrollable toolbar that appears above the editor card when the math-field selection is non-collapsed. Three groups — **Wrap** (fraction, √, ⁿ√, parens/brackets/braces, abs-value), **Script** (sup/sub/sub+sup), **Accent** (vector, hat, bar, dot, overline, underbrace) — each item renders a `MathGlyph` icon and, on click, wraps the current selection via `el.insert(toWrapLatex(latex), { selectionMode: 'placeholder' })` (`toWrapLatex`/`hasSlots` ported from `math.jsx`).
- New state: `hasSelection` (boolean) in `App`, set via the `math-field`'s `selection-change` event (collapsed vs. range).
- `onWrap` handler in `App`: calls `insert(latex, 'wrap')`.

**Behavior change — preview removal from Col 2:** the current `previewOpen` → `cardsSplit`/`previewCard` inline preview inside `MathField` is **removed entirely**. `previewOpen` now exclusively controls Col 3 (`PreviewColumn`, Phase 6, already extracted as its own column in Phase 2). `EditorSurface` always renders full-width regardless of `previewOpen`.

**Scrapped:** `LaTeXBar.tsx/.module.css`, the `cardsSplit`/`previewCard`/`.card` rules in `MathField.module.css` (superseded by `EditorSurface`'s single always-full-width card).

**v2.2 reference:** `app.jsx` lines 10-44 (`EditorSurface`, `EditorColumn`), `library.jsx` lines 124-173 (`LaTeXPanel`, `IconBtn`), lines 203-248 (`ContextToolbar`, `CTX_GROUPS`), `math.jsx` lines 4-19 (`toWrapLatex`/`hasSlots`).

---

## Phase 6 — Live Preview column (Col 3) + footer ActionBar

**Goal:** Style the Col 3 slot (extracted in Phase 2) as v2.2's `PreviewColumn`, and rebuild `ActionBar` as the v2.2 footer.

**`PreviewColumn`** (`src/components/Preview/PreviewColumn.tsx`, wraps existing `MathJaxPreview`):
- Header strip matching `EditorSurface`'s: "Live preview" label + engine badge (`● MathJax`, secondary-colored dot — accurate per the resolved-question above, since `MathJaxPreview` is the actual engine).
- Body: centered, scrollable; `MathJaxPreview` output at `fontSizePx * 0.9` per v2.2's scaling; empty-state text `"Live preview appears here"` when `latex` is blank.
- Fade-in animation (`ee-anim-fade`, defined in Phase 1's keyframes) when the column mounts (i.e., when `previewOpen` flips true).
- Left border separating it from Col 2 (already implied by Col 2 no longer having a right-side preview split, per Phase 5).

**`ActionBar`** (replaces `ActionBar.tsx`/`CancelButton.tsx`/`InsertButton.tsx`/`*.module.css`):
- Left: status indicator — colored dot (`success` if `hasContent`, `ink-300` if empty) + `"MathML & LaTeX ready"` / `"Empty equation"` text + `{mathType} · {fontSize}pt` mono label (hidden on narrow widths).
- Right: `Cancel` button (existing `onCancel` → `cancel` postMessage, unchanged), `Insert` button (existing `getLatex`/`getMathML`/`send` → `insert` postMessage, unchanged) — restyled per v2.2: disabled/`ink-300` when `!hasContent`, primary-filled otherwise, with a transient "Inserted" + checkmark state for ~900ms after click (`inserting` local state, matches `library.jsx`'s `ActionBar` lines 177-178).
- `hasContent` is derived the same way as today (`latex.trim().length > 0`).

**Final cleanup (this phase):**
- Remove the Phase 1 "compatibility variable block" (old CSS var names → new tokens) once this is the last phase consuming any of them — confirm via grep that no `.module.css` references `--ee-bg`, `--indigo`, `--ui-font`, etc. before deleting.
- Confirm `MathField.module.css`'s now-fully-unused split-preview rules (flagged in Phase 5) are deleted.

**v2.2 reference:** `app.jsx` lines 46-70 (`PreviewColumn`), `library.jsx` lines 176-201 (`ActionBar`).

---

## Sequencing & dependencies

```
Phase 2 (shell)
  └─ Phase 3 (rail)        — needs Col 1 slot from Phase 2
       └─ Phase 4 (palette) — needs RailColumn's search button from Phase 3
  └─ Phase 5 (editor col)  — needs Col 2 slot from Phase 2; independent of 3/4
       └─ Phase 6 (preview + footer) — needs Col 3 slot from Phase 2,
                                         needs Col 2's preview-removal from Phase 5
```

Phases 3+4 and Phase 5 are independent of each other and could be reordered or interleaved; Phase 6 has a soft dependency on Phase 5 (preview must be out of Col 2 before Col 3 owns it cleanly). Phase 2 is the only hard prerequisite for everything else.

Each phase, in order, still goes through its own brainstorm → clarifying questions (if any remain after this roadmap) → spec → user review → `writing-plans` cycle before implementation begins.
