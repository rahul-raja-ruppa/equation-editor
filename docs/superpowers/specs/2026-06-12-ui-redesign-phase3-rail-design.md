# UI Redesign — Phase 3: Rail (Col 1) Design

**Date:** 2026-06-12
**Status:** Approved
**Builds on:** Phase 2 (app shell — centered `1200px` card, three-column flex row, `⌘P` preview toggle)
**Roadmap:** `docs/superpowers/specs/2026-06-12-ui-redesign-phases-2-6-roadmap.md` (Phase 3 section)
**Visual source of truth:** `/tmp/design_export/equation-editor-v2-2/project/app/` — `rail.jsx`, `library.jsx` (lines 6-48), `toolbar.jsx`, `math.jsx`, `data.js`. Per the bundle README: match visual output; internal structure adapts to this repo's React + TS + Tailwind v4 + CSS-Modules conventions.

---

## Goal

Replace the interim Col-1 shell — `UtilityRow` + `ToolbarZone` + `ExpressionZone`, re-parented into the 340px left column in Phase 2 — with the real v2.2 `RailColumn` from `rail.jsx`. This is the first phase that builds genuinely new v2.2 UI (Phase 2 only moved furniture).

## Component tree (`src/components/Rail/`)

- **`RailColumn`** — `flex w-[340px] shrink-0 flex-col border-r border-ink-200 bg-surface`. A 48px header (logo + "Equation Editor" title + search icon-button) over a `flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3` body containing: `ControlRow` → hairline (`h-px bg-ink-200/70`) → `SymbolGrid` → hairline → `VerticalLibrary`. Props: `mathType`, `onMathType`, `fontSize`, `onFontSize`, `previewOpen`, `onPreviewToggle`, `onOpenPalette`, `onInsert`.
- **`ControlRow`** — `flex items-center justify-between` row of `PreviewToggle` + `MathTypeToggle` + `SizeSelect`.
  - **`PreviewToggle`** — eye icon + sliding switch track (`role="switch"`), bound to `previewOpen` / `onPreviewToggle`. Secondary-soft styling when on. Tooltip "Show/Hide live preview · ⌘P". (Ported from `library.jsx` lines 6-20.)
  - **`MathTypeToggle`** — `role="radiogroup"` segmented control with an absolutely-positioned sliding thumb (`ease-snap`), Display/Inline. (Ported from `library.jsx` lines 22-48.)
  - **`SizeSelect`** — native `<select>` styled per v2.2 (chevron via inline `backgroundImage` data-URI), `SIZE_OPTIONS = [10,11,12,14,16,18]`. (Ported from `rail.jsx` lines 13-25.)
- **`SymbolGrid`** — `SectionLabel` "Symbols & structures" + `grid grid-cols-6 gap-1` of `GridCatButton` tiles, one per category in `row1`+`row2` (11 total). Owns the shared flyout manager (open state, anchor rect, hover-intent timers) and renders one `FlyoutPalette` for the open category.
  - **`GridCatButton`** — `h-[40px]` bordered tile rendering `<MathGlyph latex={category.icon} />` + a small corner chevron that rotates when open. Opens the flyout on `mouseEnter`/`focus`/`click`, schedules close on `mouseLeave`.
- **`VerticalLibrary`** — replaces `ExpressionZone`. `SectionLabel` "Templates" + a fixed wrap of tab buttons (`EXPRESSION_TAB_IDS` / `EXPRESSION_TAB_LABELS`, active tab = primary-filled) + a `ee-scroll` scrollable `grid grid-cols-2 gap-1.5` of formula cards. Each card (`h-[62px]`) shows a centered `MathGlyph` over a truncated label, inserts `it.latex` on click. Expression data loaded from `src/data/expressions/*.json` (same lazy-glob mechanism the codebase already uses).
- **`SectionLabel`** — shared 10px uppercase tracked label chip.

## Shared primitive — `MathGlyph` (`src/components/ui/MathGlyph.tsx` + `MathGlyph.module.css`)

Generalizes the current `MathPreview`. **`MathPreview.tsx` is deleted** — its only consumers (`FlyoutPalette`, `UtilityRow`, `ToolbarZone`) are restyled or deleted this phase.

- Renders `convertLatexToMarkup(toGlyphLatex(latex), { mathstyle: 'textstyle', letterShapeStyle: 'tex' })` **synchronously** — mathlive is eagerly imported in this app, so the CDN `window.__ML` / `ml-ready` ready-hook machinery from `math.jsx` is **not** ported.
- **`toGlyphLatex`** — ported from `math.jsx` lines 7-14: `#0-9 → \square`, big operators → `\nolimits` (limits beside, not stacked), `pmatrix`/`bmatrix`/`vmatrix` → bracketed `smallmatrix`. (Superset of the current `MathPreview.toPreviewLatex`, which lacks the `\nolimits` rule.)
- **Module-level `glyphCache: Map<string,string>`** — Phase 3 renders 50+ glyphs simultaneously (11 tiles + library cards + flyout items); cache the markup by input latex. (New vs current `MathPreview`, which has no cross-instance cache.)
- **`fit()` auto-scale** — ported from `math.jsx` lines 52-67: scales the glyph down (min 0.3) when taller/wider than its container so integrals/matrices never clip. Run in `useLayoutEffect`, plus a refit on `document.fonts.ready` and a ~450ms timeout (math-font swap changes glyph height).
- **`.ee-glyph` CSS** (local to this component) — the deferred Phase 1 §3 work: maps Latin Modern Math onto MathLive's `.ML__*` classes. Extracted verbatim from the bundle:
  ```css
  .ee-glyph { display:inline-flex; align-items:center; justify-content:center; line-height:1; color:#16131b; -webkit-font-smoothing:antialiased; max-width:100%; }
  .ee-glyph .ML__latex { font-size:inherit; line-height:1; }
  .ee-glyph .ML__mathit, .ee-glyph .ML__cmr { letter-spacing:0; }
  .ee-glyph .ML__mathrm, .ee-glyph .ML__textrm, .ee-glyph .ML__main {
    font-family: 'Latin Modern Math', 'KaTeX_Main', serif !important;
  }
  .ee-glyph .ML__mathit, .ee-glyph .ML__textit {
    font-family: 'Latin Modern Math', 'KaTeX_Math', serif !important;
    font-style: italic !important;
  }
  ```

## Flyout — restyle existing, retain logic

- Reuse the existing `useFlyout` hook (open/close/position/Escape/outside-pointer-down) unchanged.
- The hover-intent close timers live in `ToolbarZone` (`cancelClose`/`scheduleClose`, 180ms), **not** in `useFlyout`. Port that timer block into `SymbolGrid`'s flyout manager (mirrors `rail.jsx` `SymbolGrid` lines 73-78).
- Restyle `FlyoutPalette` to v2.2's popover per `toolbar.jsx` lines 6-47: `fixed z-50 ee-anim-pop rounded-xl border border-ink-200 bg-surface p-2 shadow-pop`, dynamic column count (matrix → 3, template → 4, else → 6), header with category name + item count, `SpaceVisual` for spacing glyphs. Swap the per-item `MathPreview` for `MathGlyph`. Keep the existing portal-to-`document.body` + anchor-rect positioning (already correct; flyouts are not clipped by the rail's `overflow-hidden`).

## Resolutions to roadmap-vs-codebase divergences

1. **Category icons.** Repo categories (`src/data/toolbar/row1.ts`, `row2.ts`) carry `glyph` (unicode, e.g. `'≤≥≈'`) and rely on a hand-curated `CategoryIcon` (unicode + lucide per id); they have no `icon` latex. v2.2 (`rail.jsx` `GridCatButton`, `data.js`) renders `<MathGlyph latex={category.icon} />`. **Resolution:** add an `icon: string` (latex) field to all 11 categories, ported verbatim from the bundle `data.js` (e.g. `relations → '\\leq'`, `decorations → '\\cdots'`), add `icon` to the `ToolbarCategory` type, and delete `CategoryIcon.tsx`. The roadmap's "no data changes" referred to the category set/palette contents, which are unchanged.
2. **Missing `ee-*` utilities.** `ee-anim-fade`, `ee-anim-pop`, `ee-scroll`, `ee-glyph` are absent from the codebase (the roadmap assumed Phase 1 defined the keyframes; it did not — verified by grep). **Resolution:** add the keyframes + `.ee-anim-fade`/`.ee-anim-pop` + `.ee-scroll` (incl. the `prefers-reduced-motion` `animation:none` guard) globally to `src/styles/theme.css` so Phases 5/6 find them where expected; keep `.ee-glyph` local to MathGlyph's CSS module. All extracted verbatim from the bundle's standalone HTML. (`ee-canvas-bg` / `ee-modal-in` are deferred to their consuming phases — 5 and 4 — not added here.)
3. **Icon library.** Reuse the existing `lucide-react` icons + shadcn `Tooltip` primitive (the Phase 1 standard); add a small local `Kbd` helper for the ⌘K hint. The bundle's custom `ui.jsx` Icon/Tooltip set is **not** ported.
4. **SearchRow.** `rail.jsx` (visual source of truth) defines a `SearchRow` component but never mounts it in `RailColumn` — only the header search icon-button renders. The roadmap prose calling for an inert `SearchRow` contradicts its own source. **Resolution (user-approved):** build the header search icon-button only, with the ⌘K hint in its tooltip; its `onClick`/`onOpenPalette` is a no-op until Phase 4 wires `paletteOpen`. No standalone `SearchRow` component. This is the only intentionally-inert UI in this phase.

## App wiring

`App.tsx` Col-1 block (currently `<UtilityRow/>` + `<ToolbarZone/>` + `<ExpressionZone/>` inside a `w-[340px]` wrapper div) is replaced by a single `<RailColumn>` (which owns its own width/border/bg). Wire existing handlers: `mathType`/`setMathType`, `fontSize`/`setFontSize`, `previewOpen` + `() => setPreviewOpen(v => !v)`, `handleInsert`, and `onOpenPalette={() => {}}` (no-op placeholder for Phase 4). No new `App` state this phase.

## Scrapped this phase

`UtilityRow.tsx/.module.css`, `ToolbarZone.tsx/.module.css`, `ExpressionZone.tsx/.module.css`, `ExpressionTabStrip.tsx/.module.css`, `ExpressionChips.tsx/.module.css`, `CategoryButton.tsx/.module.css`, `CategoryIcon.tsx`, `MathPreview.tsx`. `useFlyout.ts` and `FlyoutPalette` are kept (restyled). `MathField`/`LaTeXBar`/`ActionBar`/`MathJaxPreview` are untouched (Phases 5-6).

## Out of scope

Command palette / `paletteOpen` / ⌘K (Phase 4) — the search button stays inert. Editor column rebuild, `ContextToolbar`, `hasSelection` (Phase 5). Preview column styling, footer ActionBar restyle (Phase 6).

## Verification

No test runner exists (`package.json` scripts: `dev`, `build`, `preview`, `lint`). Verify via `pnpm build` + `pnpm lint` + `pnpm exec tsc --noEmit` + a manual dev-server smoke test (rail renders, flyouts open/close on hover, symbols/templates insert, preview/type/size controls drive `App` state, ⌘P still toggles Col 3) — same regime as Phases 1-2.
