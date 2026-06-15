# UI Redesign — Phase 3: Rail (Col 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the interim Col-1 shell (`UtilityRow` + `ToolbarZone` + `ExpressionZone`) with the real v2.2 `RailColumn` — a 340px left column with header, preview/type/size control row, a 6-column symbol-category grid with hover flyouts, and a tabbed 2-column template library — all driven by a new shared `MathGlyph` rendering primitive.

**Architecture:** New components under `src/components/Rail/`, plus a shared `MathGlyph` under `src/components/ui/`. `MathGlyph` generalizes the deleted `MathPreview` (synchronous `convertLatexToMarkup` + glyph-latex transforms + module-level cache + auto-scale-to-fit). The existing `FlyoutPalette` and `useFlyout` are kept (flyout restyled to Tailwind, logic intact). All new v2.2 CSS utilities (`ee-anim-*`, `ee-scroll`, `ee-glyph`) are added globally to `src/styles/theme.css`. `App.tsx` swaps the Col-1 block for `<RailColumn>`. Eight now-dead files are deleted at the end.

**Tech Stack:** Vite 5 + React 18 + TS 5, Tailwind CSS v4 (`@theme` tokens in `src/styles/theme.css`), CSS Modules (legacy components only — new Rail components are Tailwind-only), `lucide-react` icons, Radix-based shadcn `Tooltip`, `mathlive` (eagerly imported). pnpm 9.

**Source of truth:** `docs/superpowers/specs/2026-06-12-ui-redesign-phase3-rail-design.md` and `/tmp/design_export/equation-editor-v2-2/project/app/` (`rail.jsx`, `library.jsx`, `toolbar.jsx`, `math.jsx`, `data.js`).

---

## Background notes the implementer needs (do not re-derive)

- **No test runner exists.** `package.json` scripts are only `dev`, `build`, `preview`, `lint`. Do NOT write unit tests. Every task verifies via `pnpm exec tsc --noEmit` + `pnpm lint` + (final tasks) `pnpm build` and a manual dev-server smoke check — the same regime Phases 1-2 used.
- **`pnpm` is the package manager.** Use `pnpm` for every command.
- **mathlive is eagerly imported** (`MathField.tsx` does `import 'mathlive'`; `MathPreview.tsx` imports `convertLatexToMarkup`, `'mathlive/static.css'`, `'mathlive/fonts.css'`). So `convertLatexToMarkup` is available synchronously — `MathGlyph` does NOT need the bundle's `window.__ML` / `ml-ready` ready-hook.
- **`.ee-glyph` must be GLOBAL, not a CSS module.** Its rules target mathlive's runtime-generated `.ML__cmr` / `.ML__mathit` / etc. classes. CSS Modules would hash those class names and the selectors would never match. All `ee-*` rules therefore live in `src/styles/theme.css` (global). New Rail components use Tailwind utility classes inline; only `theme.css` gains hand-written CSS this phase.
- **`FlyoutPalette` is portaled to `document.body` with fixed positioning** (anchored via `getBoundingClientRect`). The rail's `overflow-hidden` body does NOT clip flyouts.
- **The hover-intent close timers live in `ToolbarZone`** (`cancelClose`/`scheduleClose`, 180ms), NOT in `useFlyout`. `useFlyout` only provides `openId`/`position`/`open`/`close` + Escape + outside-pointer-down. `SymbolGrid` must implement its own timer block (copy the shape from `ToolbarZone.tsx` lines 16-46).
- **Repo has 17 toolbar categories** (row1: relations, decorations, operators, arrows, logic, sets, misc, greek-lower, greek-upper; row2: fences, fractions, scripts, summation, integrals, over-under, bigops, matrices). The roadmap's "11 categories" was inaccurate; all 17 are kept, each gets an `icon` latex field.
- **Color/shadow tokens already exist** in `theme.css`: `--color-primary`, `--color-primary-soft`, `--color-secondary`, `--color-secondary-soft`, `--color-ink-50..900`, `--color-surface`, `--shadow-xs`, `--shadow-pop`, `--ease-snap`, `--radius-xl`. So Tailwind classes `bg-primary`, `bg-primary-soft`, `text-secondary`, `border-ink-200`, `bg-ink-100`, `shadow-pop`, `ease-snap`, `rounded-xl` all resolve. `shadow-xs` is a built-in Tailwind v4 utility name AND a token — it resolves. There is no `ink-150` color util by default but `--color-ink-150` exists, so `bg-ink-150` resolves.
- **`Tooltip` is Radix-based** (`src/components/ui/tooltip.tsx`) exporting `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`. Usage: wrap trigger+content in `<Tooltip>`, put the button in `<TooltipTrigger asChild>`, label in `<TooltipContent>`. A `TooltipProvider` must be an ancestor — verify one exists in `main.tsx`/`App.tsx`; if not, the simplest path is to use the native `title` attribute for this phase's tooltips (matches current rail buttons which mostly use `title`). Prefer `title` attributes for category/library buttons (cheap, no provider needed); reserve the Radix `Tooltip` only if a provider is already mounted.
- **Expression JSON is lazy-loaded per tab** with a module-level cache (see `ExpressionChips.tsx`). `VerticalLibrary` reuses this exact pattern (dynamic `import()` + `Map` cache + `forceUpdate`), swapping `MathPreview`→`MathGlyph`.
- **Do not edit** `MathField.*`, `LaTeXBar.*`, `LaTeXPanel.*`, `ActionBar/*`, `MathJaxPreview.*` — they belong to Phases 5-6.

---

## File Structure

```
src/
├── styles/theme.css                         # MODIFY — add ee-* keyframes + utilities (ee-anim-fade/pop, ee-scroll, ee-glyph)
├── types/index.ts                           # MODIFY — add `icon: string` to ToolbarCategory
├── data/toolbar/row1.ts                     # MODIFY — add icon latex to 9 categories
├── data/toolbar/row2.ts                     # MODIFY — add icon latex to 8 categories
├── components/ui/MathGlyph.tsx              # CREATE — shared glyph primitive (replaces MathPreview)
├── components/Toolbar/FlyoutPalette.tsx     # MODIFY — restyle to Tailwind v2.2 popover, use MathGlyph
├── components/Toolbar/FlyoutPalette.module.css  # DELETE — replaced by Tailwind classes
├── components/Rail/SectionLabel.tsx         # CREATE
├── components/Rail/ControlRow.tsx           # CREATE — PreviewToggle + MathTypeToggle + SizeSelect
├── components/Rail/SymbolGrid.tsx           # CREATE — grid + GridCatButton + flyout manager
├── components/Rail/VerticalLibrary.tsx      # CREATE — tabs + formula-card grid
├── components/Rail/RailColumn.tsx           # CREATE — composes header + body
└── App.tsx                                  # MODIFY — replace Col-1 block with <RailColumn>

DELETED at end (Task 10):
  components/Utility/UtilityRow.tsx + .module.css
  components/Toolbar/ToolbarZone.tsx + .module.css
  components/Toolbar/CategoryButton.tsx + .module.css
  components/Toolbar/CategoryIcon.tsx
  components/ExpressionZone/ExpressionZone.tsx + .module.css
  components/ExpressionZone/ExpressionTabStrip.tsx + .module.css
  components/ExpressionZone/ExpressionChips.tsx + .module.css
  components/MathPreview/MathPreview.tsx
```

---

## Task 1: Add v2.2 CSS utilities to theme.css

**Files:**
- Modify: `src/styles/theme.css`

- [ ] **Step 1: Append the ee-* block to the end of `src/styles/theme.css`**

Add this verbatim at the end of the file (all rules extracted from the v2.2 bundle; `.ee-glyph` is the deferred Phase 1 §3 Latin-Modern-Math mapping):

```css

/* ── v2.2 redesign utilities (Phase 3) ──────────────────────────────────
 * Global (NOT CSS-module) because .ee-glyph descendant selectors target
 * mathlive's runtime .ML__* classes, which must not be hashed.
 * Extracted verbatim from the v2.2 design bundle.
 */
@keyframes ee-pop-in  { from { opacity: 0; transform: translateY(-4px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes ee-fade-in { from { opacity: 0; } to { opacity: 1; } }

.ee-anim-pop  { animation: ee-pop-in 140ms cubic-bezier(.2,.7,.2,1); transform-origin: top center; }
.ee-anim-fade { animation: ee-fade-in 130ms ease; }

@media (prefers-reduced-motion: reduce) {
  .ee-anim-pop, .ee-anim-fade { animation: none !important; }
}

.ee-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
.ee-scroll::-webkit-scrollbar-thumb { background: #d9d2e3; border-radius: 99px; border: 2px solid transparent; background-clip: padding-box; }
.ee-scroll::-webkit-scrollbar-thumb:hover { background: #b4aac1; background-clip: padding-box; }
.ee-scroll::-webkit-scrollbar-track { background: transparent; }
.ee-scroll.overflow-x-auto { overflow-y: hidden; scrollbar-width: thin; }
.ee-scroll.overflow-x-auto::-webkit-scrollbar { height: 6px; }

/* Latin Modern Math mapped onto MathLive's class names (static glyph rendering) */
.ee-glyph { display: inline-flex; align-items: center; justify-content: center; line-height: 1; color: #16131b; -webkit-font-smoothing: antialiased; max-width: 100%; }
.ee-glyph .ML__latex { font-size: inherit; line-height: 1; }
.ee-glyph .ML__mathit, .ee-glyph .ML__cmr { letter-spacing: 0; }
.ee-glyph .ML__mathrm, .ee-glyph .ML__textrm, .ee-glyph .ML__main {
  font-family: 'Latin Modern Math', 'KaTeX_Main', serif !important;
}
.ee-glyph .ML__mathit, .ee-glyph .ML__textit {
  font-family: 'Latin Modern Math', 'KaTeX_Math', serif !important;
  font-style: italic !important;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no new errors (CSS is not type-checked; lint should be clean).

- [ ] **Step 3: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat(rail): add v2.2 ee-* CSS utilities (anim, scroll, glyph font map)"
```

---

## Task 2: Add `icon` latex to all toolbar categories

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/toolbar/row1.ts`
- Modify: `src/data/toolbar/row2.ts`

- [ ] **Step 1: Add `icon` to the `ToolbarCategory` interface**

In `src/types/index.ts`, in the `ToolbarCategory` interface, add the `icon` field right after `id`:

```ts
export interface ToolbarCategory {
  id: string;
  icon: string; // latex rendered as the category tile glyph (v2.2 rail)
  glyph: string; // legacy: shown on the old compact category button face
  tooltip: string; // button tooltip
  palette: PaletteItem[];
}
```

- [ ] **Step 2: Add `icon` to each category in `row1.ts`**

In `src/data/toolbar/row1.ts`, add an `icon` property immediately after each `id:` line, using these exact values (ported from bundle `data.js`):

```
relations    → icon: '\\leq',
decorations  → icon: '\\cdots',
operators    → icon: '\\pm',
arrows       → icon: '\\rightarrow',
logic        → icon: '\\forall',
sets         → icon: '\\subset',
misc         → icon: '\\partial',
greek-lower  → icon: '\\lambda',
greek-upper  → icon: '\\Omega',
```

Example (first category):
```ts
  {
    id: 'relations',
    icon: '\\leq',
    glyph: '≤≥≈',
    tooltip: 'Relations',
    palette: [
```

- [ ] **Step 3: Add `icon` to each category in `row2.ts`**

In `src/data/toolbar/row2.ts`, add `icon` after each `id:` line:

```
fences      → icon: '\\left(a\\right)',
fractions   → icon: '\\tfrac{1}{2}',
scripts     → icon: 'x^{n}',
summation   → icon: '\\textstyle\\sum',
integrals   → icon: '\\textstyle\\int',
over-under  → icon: '\\hat{a}',
bigops      → icon: '\\textstyle\\prod',
matrices    → icon: '\\begin{bmatrix}\\cdot&\\cdot\\\\\\cdot&\\cdot\\end{bmatrix}',
```

- [ ] **Step 4: Verify types**

Run: `pnpm exec tsc --noEmit`
Expected: PASS. (If any category object is missing `icon`, tsc errors with "Property 'icon' is missing".)

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/data/toolbar/row1.ts src/data/toolbar/row2.ts
git commit -m "feat(rail): add icon latex field to all 17 toolbar categories"
```

---

## Task 3: Create the `MathGlyph` primitive

**Files:**
- Create: `src/components/ui/MathGlyph.tsx`

- [ ] **Step 1: Write `src/components/ui/MathGlyph.tsx`**

```tsx
import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { convertLatexToMarkup } from 'mathlive';
import 'mathlive/static.css';
import 'mathlive/fonts.css';

interface MathGlyphProps {
  latex: string;
  className?: string;
  style?: CSSProperties;
}

/* Static-glyph latex transforms (ported from the v2.2 bundle math.jsx):
 * - numbered slots (#0..#9) → \square
 * - big operators → \nolimits so limits sit beside, not stacked (compact icons)
 * - matrices → bracketed \smallmatrix
 */
function toGlyphLatex(latex: string): string {
  return latex
    .replace(/#[0-9]/g, '\\square')
    .replace(
      /\\(sum|prod|coprod|int|iint|iiint|iiiint|oint|oiint|oiiint|bigcup|bigcap|bigvee|bigwedge|bigoplus|bigotimes|bigodot|biguplus|bigsqcup|lim|limsup|liminf)(?![a-zA-Z])/g,
      '\\$1\\nolimits'
    )
    .replace(
      /\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g,
      '\\left(\\begin{smallmatrix}$1\\end{smallmatrix}\\right)'
    )
    .replace(
      /\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g,
      '\\left[\\begin{smallmatrix}$1\\end{smallmatrix}\\right]'
    )
    .replace(
      /\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}/g,
      '\\left|\\begin{smallmatrix}$1\\end{smallmatrix}\\right|'
    );
}

// Module-level cache: this phase renders 50+ glyphs at once.
const glyphCache = new Map<string, string>();

function renderGlyph(latex: string): string {
  const cached = glyphCache.get(latex);
  if (cached !== undefined) return cached;
  let html = '';
  try {
    html = convertLatexToMarkup(toGlyphLatex(latex), {
      mathstyle: 'textstyle',
      letterShapeStyle: 'tex',
    });
  } catch {
    html = '';
  }
  glyphCache.set(latex, html);
  return html;
}

export function MathGlyph({ latex, className = '', style }: MathGlyphProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // Scale the glyph down when taller/wider than its container so tall
  // constructs (integrals, matrices) never clip or overflow.
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.transformOrigin = 'center';
    const parent = el.parentElement;
    if (!parent) return;
    const availH = parent.clientHeight;
    const availW = parent.clientWidth;
    const naturalH = el.scrollHeight;
    const naturalW = el.scrollWidth;
    const scaleH = availH > 0 && naturalH > availH + 0.5 ? availH / naturalH : 1;
    const scaleW = availW > 0 && naturalW > availW + 0.5 ? availW / naturalW : 1;
    const scale = Math.min(scaleH, scaleW);
    if (scale < 1) el.style.transform = `scale(${Math.max(0.3, scale)})`;
  }, []);

  useLayoutEffect(() => {
    fit();
  });

  // Re-fit once the math font finishes loading (glyph heights change on swap).
  useEffect(() => {
    if (document.fonts && document.fonts.ready) void document.fonts.ready.then(fit);
    const t = window.setTimeout(fit, 450);
    return () => window.clearTimeout(t);
  }, [latex, fit]);

  return (
    <span
      ref={ref}
      className={`ee-glyph ${className}`}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: renderGlyph(latex) }}
    />
  );
}
```

- [ ] **Step 2: Verify types/build**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/MathGlyph.tsx
git commit -m "feat(rail): add MathGlyph primitive (cache + auto-fit, replaces MathPreview)"
```

---

## Task 4: Restyle `FlyoutPalette` to the v2.2 Tailwind popover

**Files:**
- Modify: `src/components/Toolbar/FlyoutPalette.tsx`
- Delete: `src/components/Toolbar/FlyoutPalette.module.css`

The positioning logic (viewport math, portal, anchor) is kept. Only the markup/styling changes: Tailwind classes, `MathGlyph` instead of `MathPreview`, inline `SpaceVisual`, v2.2 column counts (matrix → 3, template → 4, else → 6).

- [ ] **Step 1: Replace `src/components/Toolbar/FlyoutPalette.tsx` with:**

```tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import type { FlyoutPosition } from '../../hooks/useFlyout';
import type { PaletteItem } from '../../types';
import { MathGlyph } from '../ui/MathGlyph';

const GAP = 5;
const VIEWPORT_MARGIN = 8;
const PALETTE_PADDING = 18;
const STANDARD_ITEM_WIDTH = 44;
const TEMPLATE_ITEM_WIDTH = 54;
const MATRIX_ITEM_WIDTH = 64;
const ITEM_HEIGHT = 42;

function getViewportSize() {
  if (typeof window === 'undefined') return { width: 360, height: 640 };
  return { width: window.innerWidth, height: window.innerHeight };
}

const SPACE_WIDTHS: Record<string, number> = { thin: 6, med: 12, quad: 20, qquad: 30 };

function SpaceVisual({ size }: { size?: string }) {
  const w = (size && SPACE_WIDTHS[size]) || 10;
  return (
    <span className="flex items-center gap-[3px] text-ink-400 group-hover:text-primary">
      <span className="h-3.5 w-px bg-current opacity-70" />
      <span style={{ width: w }} className="h-px bg-current opacity-50" />
      <span className="h-3.5 w-px bg-current opacity-70" />
    </span>
  );
}

interface FlyoutPaletteProps {
  label: string;
  items: PaletteItem[];
  position: FlyoutPosition;
  onInsert: (latex: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function FlyoutPalette({
  label,
  items,
  position,
  onInsert,
  onMouseEnter,
  onMouseLeave,
}: FlyoutPaletteProps) {
  const [viewport, setViewport] = useState(getViewportSize);
  const viewportWidth = viewport.width;
  const viewportHeight = viewport.height;

  useEffect(() => {
    function handleResize() {
      setViewport(getViewportSize());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const availableWidth = Math.max(180, viewportWidth - VIEWPORT_MARGIN * 2);
  const hasTemplates = items.some((item) => item.isTemplate);
  const hasMatrixTemplates = items.some((item) => /\\begin\{[pbv]?matrix\}/.test(item.latex));
  const itemWidth = hasMatrixTemplates
    ? MATRIX_ITEM_WIDTH
    : hasTemplates
      ? TEMPLATE_ITEM_WIDTH
      : STANDARD_ITEM_WIDTH;
  const maxColumns = hasMatrixTemplates ? 3 : hasTemplates ? 4 : 6;
  const columns = Math.max(
    1,
    Math.min(
      items.length,
      maxColumns,
      Math.floor((availableWidth - PALETTE_PADDING + GAP) / (itemWidth + GAP))
    )
  );
  const paletteWidth = Math.min(
    availableWidth,
    PALETTE_PADDING + columns * itemWidth + (columns - 1) * GAP
  );
  const rows = Math.ceil(items.length / columns);
  const estimatedHeight = PALETTE_PADDING + rows * ITEM_HEIGHT + (rows - 1) * GAP;
  const belowTop = position.top + 4;
  const aboveTop = Math.max(VIEWPORT_MARGIN, position.top - estimatedHeight - 8);
  const top =
    belowTop + estimatedHeight <= viewportHeight - VIEWPORT_MARGIN || belowTop <= viewportHeight / 2
      ? Math.min(
          belowTop,
          viewportHeight -
            VIEWPORT_MARGIN -
            Math.min(estimatedHeight, viewportHeight - VIEWPORT_MARGIN * 2)
        )
      : aboveTop;
  const preferredLeft = position.left + position.anchorWidth / 2 - paletteWidth / 2;
  const left = Math.min(
    Math.max(preferredLeft, VIEWPORT_MARGIN),
    viewportWidth - paletteWidth - VIEWPORT_MARGIN
  );
  const style: CSSProperties = {
    top,
    left,
    width: paletteWidth,
    maxHeight: viewportHeight - VIEWPORT_MARGIN * 2,
  };
  const glyphSize = hasMatrixTemplates ? 13 : hasTemplates ? 17 : 19;

  return createPortal(
    <div
      className="ee-anim-pop fixed z-50 overflow-auto rounded-xl border border-ink-200 bg-surface p-2 shadow-pop"
      style={style}
      data-flyout="true"
      role="dialog"
      aria-label={`${label} palette`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="mb-1.5 flex items-center justify-between px-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-500">
          {label}
        </span>
        <span className="text-[9.5px] font-medium tabular-nums text-ink-400">{items.length}</span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            title={item.tooltip}
            onClick={() => onInsert(item.latex)}
            style={{ height: ITEM_HEIGHT }}
            className={
              'group flex items-center justify-center overflow-hidden rounded-lg transition-colors duration-100 active:scale-[0.94] ' +
              (item.isTemplate ? 'hover:bg-primary-soft' : 'hover:bg-ink-100')
            }
          >
            {item.isSpace ? (
              <SpaceVisual size={item.spaceSize} />
            ) : (
              <MathGlyph
                latex={item.latex}
                style={{ fontSize: glyphSize }}
                className="text-ink-900 group-hover:text-primary"
              />
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: Delete the old CSS module**

```bash
git rm src/components/Toolbar/FlyoutPalette.module.css
```

- [ ] **Step 3: Verify types/build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS. (`CategoryButton.tsx` still imports `FlyoutPalette` with the same props — it compiles. `ToolbarZone` still works.)

- [ ] **Step 4: Commit**

```bash
git add -A src/components/Toolbar/FlyoutPalette.tsx
git commit -m "refactor(rail): restyle FlyoutPalette to v2.2 Tailwind popover with MathGlyph"
```

---

## Task 5: Create `SectionLabel` and `ControlRow`

**Files:**
- Create: `src/components/Rail/SectionLabel.tsx`
- Create: `src/components/Rail/ControlRow.tsx`

- [ ] **Step 1: Write `src/components/Rail/SectionLabel.tsx`**

```tsx
import type { ReactNode } from 'react';

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1.5 select-none text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/Rail/ControlRow.tsx`**

`PreviewToggle` (ported from `library.jsx` 6-20), `MathTypeToggle` (22-48), `SizeSelect` (`rail.jsx` 13-25). Uses `lucide-react` `Eye`/`EyeOff`. The chevron data-URI is inlined per the bundle.

```tsx
import { Eye, EyeOff } from 'lucide-react';

const SIZE_OPTIONS = [10, 11, 12, 14, 16, 18];

interface ControlRowProps {
  mathType: 'display' | 'inline';
  onMathType: (v: 'display' | 'inline') => void;
  fontSize: number;
  onFontSize: (v: number) => void;
  previewOpen: boolean;
  onPreviewToggle: () => void;
}

function PreviewToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      title={on ? 'Hide live preview (⌘P)' : 'Show live preview (⌘P)'}
      className={
        'flex h-[30px] items-center gap-2 rounded-md border px-2 transition-colors ' +
        (on
          ? 'border-secondary/40 bg-secondary-soft text-secondary'
          : 'border-ink-200 bg-surface text-ink-500 hover:bg-ink-50')
      }
    >
      {on ? <Eye size={14} strokeWidth={1.75} /> : <EyeOff size={14} strokeWidth={1.75} />}
      <span
        className={
          'relative h-[15px] w-[26px] shrink-0 rounded-full transition-colors duration-200 ' +
          (on ? 'bg-secondary' : 'bg-ink-300')
        }
      >
        <span
          className={
            'absolute top-[2px] h-[11px] w-[11px] rounded-full bg-white shadow-sm transition-all duration-200 ease-snap ' +
            (on ? 'left-[13px]' : 'left-[2px]')
          }
        />
      </span>
    </button>
  );
}

function MathTypeToggle({
  value,
  onChange,
}: {
  value: 'display' | 'inline';
  onChange: (v: 'display' | 'inline') => void;
}) {
  const opts: { value: 'display' | 'inline'; label: string }[] = [
    { value: 'display', label: 'Display' },
    { value: 'inline', label: 'Inline' },
  ];
  const idx = opts.findIndex((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      className="relative inline-grid h-[30px] grid-cols-2 items-stretch rounded-md bg-ink-100 p-[3px] ring-1 ring-inset ring-ink-200/70"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[3px] bottom-[3px] rounded-[5px] bg-surface shadow-xs ring-1 ring-ink-200/80 transition-[left] duration-200 ease-snap"
        style={{ width: 'calc(50% - 3px)', left: idx === 0 ? '3px' : '50%' }}
      />
      {opts.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={
              'relative z-10 flex items-center justify-center rounded-[5px] px-2.5 text-[11.5px] font-medium transition-colors duration-150 ' +
              (active ? 'text-primary' : 'text-ink-500 hover:text-ink-700')
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SizeSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex h-[30px] items-center gap-1.5 rounded-md border border-ink-200 bg-surface pl-2.5 pr-1.5 text-[11.5px] text-ink-600">
      <span className="text-ink-400">Size</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cursor-pointer appearance-none bg-transparent pr-3 text-[11.5px] font-medium text-ink-800 outline-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238c8398' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
        }}
      >
        {SIZE_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p} pt
          </option>
        ))}
      </select>
    </label>
  );
}

export function ControlRow({
  mathType,
  onMathType,
  fontSize,
  onFontSize,
  previewOpen,
  onPreviewToggle,
}: ControlRowProps) {
  return (
    <div className="flex items-center justify-between">
      <PreviewToggle on={previewOpen} onToggle={onPreviewToggle} />
      <MathTypeToggle value={mathType} onChange={onMathType} />
      <SizeSelect value={fontSize} onChange={onFontSize} />
    </div>
  );
}
```

- [ ] **Step 3: Verify types**

Run: `pnpm exec tsc --noEmit`
Expected: PASS. (Components are unused so far — tsc allows that; lint runs in a later task once they're consumed.)

- [ ] **Step 4: Commit**

```bash
git add src/components/Rail/SectionLabel.tsx src/components/Rail/ControlRow.tsx
git commit -m "feat(rail): add SectionLabel and ControlRow (preview/type/size controls)"
```

---

## Task 6: Create `SymbolGrid` + `GridCatButton`

**Files:**
- Create: `src/components/Rail/SymbolGrid.tsx`

Reuses `useFlyout`; implements the 180ms hover-intent timer block locally (copied shape from `ToolbarZone`).

- [ ] **Step 1: Write `src/components/Rail/SymbolGrid.tsx`**

```tsx
import { useCallback, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useFlyout } from '../../hooks/useFlyout';
import { FlyoutPalette } from '../Toolbar/FlyoutPalette';
import { MathGlyph } from '../ui/MathGlyph';
import row1 from '../../data/toolbar/row1';
import row2 from '../../data/toolbar/row2';
import type { ToolbarCategory } from '../../types';
import { SectionLabel } from './SectionLabel';

const CATEGORIES: ToolbarCategory[] = [...row1, ...row2];

interface GridCatButtonProps {
  category: ToolbarCategory;
  isOpen: boolean;
  onOpen: (id: string, rect: DOMRect) => void;
  onScheduleClose: () => void;
}

function GridCatButton({ category, isOpen, onOpen, onScheduleClose }: GridCatButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const open = () => {
    if (ref.current) onOpen(category.id, ref.current.getBoundingClientRect());
  };
  return (
    <button
      ref={ref}
      type="button"
      title={category.tooltip}
      onMouseEnter={open}
      onMouseLeave={onScheduleClose}
      onFocus={open}
      onClick={open}
      aria-expanded={isOpen}
      data-category-btn="true"
      className={
        'group relative flex h-[40px] items-center justify-center overflow-hidden rounded-lg border transition-colors duration-150 ' +
        (isOpen
          ? 'border-primary/40 bg-primary-soft'
          : 'border-ink-200 bg-surface hover:border-ink-300 hover:bg-ink-50')
      }
    >
      <MathGlyph
        latex={category.icon}
        className={'text-[17px] ' + (isOpen ? 'text-primary' : 'text-ink-900 group-hover:text-primary')}
      />
      <span
        className={
          'absolute bottom-[1px] right-[2px] transition-transform duration-150 ' +
          (isOpen ? 'rotate-180 text-primary' : 'text-ink-300 group-hover:text-ink-500')
        }
      >
        <ChevronDown size={9} strokeWidth={2.2} />
      </span>
    </button>
  );
}

export function SymbolGrid({ onInsert }: { onInsert: (latex: string) => void }) {
  const { openId, position, open, close } = useFlyout();
  const closeTimer = useRef<number | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      close();
      closeTimer.current = null;
    }, 180);
  }, [cancelClose, close]);

  const openCategory = useCallback(
    (id: string, rect: DOMRect) => {
      cancelClose();
      open(id, rect);
    },
    [cancelClose, open]
  );

  useEffect(() => cancelClose, [cancelClose]);

  const openCat = CATEGORIES.find((c) => c.id === openId);

  return (
    <div>
      <SectionLabel>Symbols &amp; structures</SectionLabel>
      <div className="grid grid-cols-6 gap-1">
        {CATEGORIES.map((cat) => (
          <GridCatButton
            key={cat.id}
            category={cat}
            isOpen={openId === cat.id}
            onOpen={openCategory}
            onScheduleClose={scheduleClose}
          />
        ))}
      </div>
      {openCat && (
        <FlyoutPalette
          label={openCat.tooltip}
          items={openCat.palette}
          position={position}
          onInsert={onInsert}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Rail/SymbolGrid.tsx
git commit -m "feat(rail): add SymbolGrid with hover-flyout category tiles"
```

---

## Task 7: Create `VerticalLibrary`

**Files:**
- Create: `src/components/Rail/VerticalLibrary.tsx`

Lazy-loads expression JSON per active tab with a module-level cache (mirrors `ExpressionChips.tsx`), renders a 2-column scrollable formula-card grid.

- [ ] **Step 1: Write `src/components/Rail/VerticalLibrary.tsx`**

```tsx
import { useEffect, useState } from 'react';
import {
  EXPRESSION_TAB_IDS,
  EXPRESSION_TAB_LABELS,
  type ExpressionItem,
  type ExpressionTabId,
} from '../../types';
import { MathGlyph } from '../ui/MathGlyph';
import { SectionLabel } from './SectionLabel';

// Module-level cache so each tab only loads once per session.
const libCache = new Map<ExpressionTabId, ExpressionItem[]>();

export function VerticalLibrary({ onInsert }: { onInsert: (latex: string) => void }) {
  const [active, setActive] = useState<ExpressionTabId>(EXPRESSION_TAB_IDS[0]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (libCache.has(active)) return;
    let cancelled = false;
    import(`../../data/expressions/${active}.json`)
      .then((mod) => {
        if (cancelled) return;
        libCache.set(active, (mod.default as { items: ExpressionItem[] }).items);
        forceUpdate((n) => n + 1);
      })
      .catch(() => {
        if (!cancelled) forceUpdate((n) => n + 1);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  const items = libCache.get(active);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionLabel>Templates</SectionLabel>
      <div className="mb-2 flex flex-wrap gap-1">
        {EXPRESSION_TAB_IDS.map((id) => {
          const on = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={
                'rounded-md px-2 py-[5px] text-[11px] font-medium leading-none transition-colors ' +
                (on
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-150 hover:text-ink-800')
              }
            >
              {EXPRESSION_TAB_LABELS[id]}
            </button>
          );
        })}
      </div>
      <div className="ee-scroll min-h-0 flex-1 overflow-y-auto pb-2">
        <div key={active} className="ee-anim-fade grid grid-cols-2 gap-1.5">
          {(items ?? []).map((it, i) => (
            <button
              key={i}
              type="button"
              title={it.label}
              onClick={() => onInsert(it.latex)}
              className="group flex h-[62px] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-ink-200 bg-surface px-2 transition-all duration-150 hover:border-primary/40 hover:bg-primary-soft/40 hover:shadow-xs active:scale-[0.98]"
            >
              <span className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
                <MathGlyph latex={it.latex} className="text-[15px] text-ink-800 group-hover:text-primary" />
              </span>
              <span className="w-full truncate text-center text-[9.5px] font-medium text-ink-400 group-hover:text-primary/70">
                {it.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Rail/VerticalLibrary.tsx
git commit -m "feat(rail): add VerticalLibrary (tabbed formula-card grid)"
```

---

## Task 8: Create `RailColumn`

**Files:**
- Create: `src/components/Rail/RailColumn.tsx`

Header (∑ logo mark + title + search icon-button, search is inert until Phase 4) over a scrollable body. The bundle uses `assets/logo.png`; this repo has no such asset, so use the v2.2 `TopBar` identity mark (a ∑ in a primary-filled rounded square, from `library.jsx` line 56) — self-contained, no asset dependency.

- [ ] **Step 1: Write `src/components/Rail/RailColumn.tsx`**

```tsx
import { Search } from 'lucide-react';
import { ControlRow } from './ControlRow';
import { SymbolGrid } from './SymbolGrid';
import { VerticalLibrary } from './VerticalLibrary';

interface RailColumnProps {
  mathType: 'display' | 'inline';
  onMathType: (v: 'display' | 'inline') => void;
  fontSize: number;
  onFontSize: (v: number) => void;
  previewOpen: boolean;
  onPreviewToggle: () => void;
  onOpenPalette: () => void;
  onInsert: (latex: string) => void;
}

export function RailColumn({
  mathType,
  onMathType,
  fontSize,
  onFontSize,
  previewOpen,
  onPreviewToggle,
  onOpenPalette,
  onInsert,
}: RailColumnProps) {
  return (
    <div className="flex w-[340px] shrink-0 flex-col border-r border-ink-200 bg-surface">
      {/* Header */}
      <div className="flex h-[48px] shrink-0 items-center gap-2 border-b border-ink-200 px-4">
        <span
          className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-primary text-[15px] font-semibold leading-none text-white"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          ∑
        </span>
        <span className="text-[13px] font-semibold tracking-[-0.01em] text-ink-900">
          Equation Editor
        </span>
        <div className="ml-auto">
          <button
            type="button"
            onClick={onOpenPalette}
            title="Search symbols & templates (⌘K)"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 active:scale-95"
          >
            <Search size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
        <ControlRow
          mathType={mathType}
          onMathType={onMathType}
          fontSize={fontSize}
          onFontSize={onFontSize}
          previewOpen={previewOpen}
          onPreviewToggle={onPreviewToggle}
        />
        <div className="h-px bg-ink-200/70" />
        <SymbolGrid onInsert={onInsert} />
        <div className="h-px bg-ink-200/70" />
        <VerticalLibrary onInsert={onInsert} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Rail/RailColumn.tsx
git commit -m "feat(rail): add RailColumn composing header + control/symbol/library body"
```

---

## Task 9: Wire `RailColumn` into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the three old imports with `RailColumn`**

In `src/App.tsx`, remove these three import lines:
```tsx
import { ToolbarZone } from './components/Toolbar/ToolbarZone';
import { ExpressionZone } from './components/ExpressionZone/ExpressionZone';
import { UtilityRow } from './components/Utility/UtilityRow';
```
and add:
```tsx
import { RailColumn } from './components/Rail/RailColumn';
```

- [ ] **Step 2: Replace the Col-1 block**

Replace the entire Col-1 `<div>` (the `{/* Col 1 — rail shell ... */}` wrapper through its closing `</div>`, currently lines 95-108) with:

```tsx
          {/* Col 1 — rail */}
          <RailColumn
            mathType={mathType}
            onMathType={setMathType}
            fontSize={fontSize}
            onFontSize={setFontSize}
            previewOpen={previewOpen}
            onPreviewToggle={() => setPreviewOpen((v) => !v)}
            onOpenPalette={() => {}}
            onInsert={handleInsert}
          />
```

- [ ] **Step 3: Verify build + typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS. (The old `UtilityRow`/`ToolbarZone`/`ExpressionZone` files still exist but are now unimported — they still compile because `MathPreview` etc. still exist; they're deleted in Task 10.)

- [ ] **Step 4: Manual dev-server smoke test**

Run: `pnpm dev`, open the served URL. Verify:
- Rail renders at 340px: ∑ logo + "Equation Editor" + search icon in the header.
- ControlRow: preview toggle, Display/Inline segmented control, Size select — all functional. Toggling preview opens/closes Col 3; ⌘P still works; changing type/size updates the editor.
- Symbol grid: 6-column tiles render MathGlyph icons; hovering a tile opens a flyout; moving into the flyout keeps it open; leaving closes it after ~180ms; clicking a palette item inserts into the math-field.
- Templates: tab switching loads each category; clicking a card inserts the formula; the grid scrolls.
- Search icon click does nothing (inert — Phase 4).

Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(rail): mount RailColumn in App, replacing interim Col-1 shell"
```

---

## Task 10: Delete the scrapped components

**Files:**
- Delete: `src/components/Utility/UtilityRow.tsx`, `src/components/Utility/UtilityRow.module.css`
- Delete: `src/components/Toolbar/ToolbarZone.tsx`, `src/components/Toolbar/ToolbarZone.module.css`
- Delete: `src/components/Toolbar/CategoryButton.tsx`, `src/components/Toolbar/CategoryButton.module.css`
- Delete: `src/components/Toolbar/CategoryIcon.tsx`
- Delete: `src/components/ExpressionZone/ExpressionZone.tsx`, `src/components/ExpressionZone/ExpressionZone.module.css`
- Delete: `src/components/ExpressionZone/ExpressionTabStrip.tsx`, `src/components/ExpressionZone/ExpressionTabStrip.module.css`
- Delete: `src/components/ExpressionZone/ExpressionChips.tsx`, `src/components/ExpressionZone/ExpressionChips.module.css`
- Delete: `src/components/MathPreview/MathPreview.tsx`

- [ ] **Step 1: Confirm nothing still imports them**

Run:
```bash
rg -n "UtilityRow|ToolbarZone|CategoryButton|CategoryIcon|ExpressionZone|ExpressionTabStrip|ExpressionChips|MathPreview/MathPreview|from '.*MathPreview'" src --glob '!**/MathJaxPreview*'
```
Expected: only matches inside the files being deleted themselves (no references from `App.tsx`, `RailColumn`, `SymbolGrid`, `FlyoutPalette`, etc.). If any live reference remains, fix it before deleting. Note `MathJaxPreview` (Col 3, Phase 6) is unrelated and must NOT be touched — its directory `src/components/MathPreview/MathJaxPreview.*` stays.

- [ ] **Step 2: Delete the files**

```bash
git rm \
  src/components/Utility/UtilityRow.tsx src/components/Utility/UtilityRow.module.css \
  src/components/Toolbar/ToolbarZone.tsx src/components/Toolbar/ToolbarZone.module.css \
  src/components/Toolbar/CategoryButton.tsx src/components/Toolbar/CategoryButton.module.css \
  src/components/Toolbar/CategoryIcon.tsx \
  src/components/ExpressionZone/ExpressionZone.tsx src/components/ExpressionZone/ExpressionZone.module.css \
  src/components/ExpressionZone/ExpressionTabStrip.tsx src/components/ExpressionZone/ExpressionTabStrip.module.css \
  src/components/ExpressionZone/ExpressionChips.tsx src/components/ExpressionZone/ExpressionChips.module.css \
  src/components/MathPreview/MathPreview.tsx
```

- [ ] **Step 3: Remove the now-empty `Utility` directory if present**

```bash
rmdir src/components/Utility 2>/dev/null || true
```

- [ ] **Step 4: Verify build + typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: PASS with no unresolved-import errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(rail): remove UtilityRow/ToolbarZone/ExpressionZone/MathPreview (superseded by RailColumn)"
```

---

## Self-Review

**Spec coverage:**
- RailColumn (header + search icon + scrollable body) → Task 8. ✓
- ControlRow (PreviewToggle/MathTypeToggle/SizeSelect) → Task 5. ✓
- SymbolGrid + GridCatButton (6-col, hover flyout) → Task 6. ✓
- VerticalLibrary (tabs + 2-col cards) → Task 7. ✓
- MathGlyph (sync convert, toGlyphLatex, cache, fit, ee-glyph) → Task 3 + Task 1. ✓
- FlyoutPalette restyle (logic kept, MathGlyph, SpaceVisual) → Task 4. ✓
- Divergence 1 (category icon field) → Task 2. ✓
- Divergence 2 (ee-* utilities global) → Task 1. ✓
- Divergence 3 (lucide + title tooltips) → Tasks 5,6,8. ✓
- Divergence 4 (header-only inert search) → Task 8 + Task 9 no-op. ✓
- App wiring → Task 9. ✓
- Scrapped files deleted → Task 10. ✓

**Type consistency:** `MathGlyph` props `{latex, className, style}` used consistently in Tasks 4/6/7. `ToolbarCategory.icon` defined in Task 2, consumed in Task 6. `useFlyout` returns `{openId, position, open, close}` (verified) — `SymbolGrid` (Task 6) uses exactly these. `FlyoutPalette` props unchanged from the existing signature, so `CategoryButton` keeps compiling between Tasks 4 and 10. Expression cache pattern matches `ExpressionChips`.

**Placeholder scan:** No TBD/TODO; every code step shows full file content. The `onOpenPalette={() => {}}` no-op is intentional (Phase 4), documented in spec divergence 4.

**Ordering invariant:** Every task leaves the app building. `MathPreview` survives until Task 10 (its last consumers are deleted in the same task). `RailColumn` and its children all exist before Task 9 mounts them.
