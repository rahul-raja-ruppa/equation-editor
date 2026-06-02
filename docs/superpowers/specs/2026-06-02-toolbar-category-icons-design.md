# Toolbar Category Icons — Design Spec

**Date:** 2026-06-02
**Branch:** feature/mathjax-preview (current working branch)

---

## Problem

The 17 category trigger buttons in the toolbar (rows 1 & 2) render their icons using `MathPreview` — `convertLatexToMarkup()` from mathlive with `mathstyle: 'auto'`. This causes:

1. **Display-style inflation** — `\sum`, `\int`, `\prod` render at display size (with scripts above/below), making row 2 buttons visibly taller than row 1.
2. **Baseline misalignment** — the rendered MathML `<span>` has no predictable baseline, so it misaligns with the `ChevronDown` icon beside it.
3. **Missing `.math` CSS class** — `CategoryButton` passes `className={styles.math}` but that rule doesn't exist in `CategoryButton.module.css`, so the math span is unstyled.

---

## Scope

**In scope:** The 17 `CategoryButton` trigger icons (rows 1 & 2 of `ToolbarZone`).

**Out of scope:** Quick bar items (data-driven, too many items for individual custom SVGs), flyout palette items (alignment is fine at grid scale).

---

## Approach: Two-Tier Icons

### Tier 1 — Unicode text (9 symbol categories)

Categories whose representative symbol exists as a plain Unicode character. Rendered as a `<span>` with `font-family: var(--math-font)` (STIX Two Math / KaTeX Math, already loaded by mathlive).

| Category ID | Unicode | Display |
|---|---|---|
| `relations` | `≤` | U+2264 |
| `decorations` | `···` | U+22EF |
| `operators` | `±` | U+00B1 |
| `arrows` | `→` | U+2192 |
| `logic` | `∀` | U+2200 |
| `sets` | `⊂` | U+2282 |
| `misc` | `∂` | U+2202 |
| `greek-lower` | `λ` | U+03BB |
| `greek-upper` | `Ω` | U+03A9 |

Unicode text is always baseline-aligned, zero rendering cost, no dependency.

### Tier 2 — Custom inline SVG (8 structural categories)

Categories whose icon represents a 2D structure with no Unicode equivalent. Each is a hand-written inline SVG React component.

**SVG spec:** `viewBox="0 0 20 20"` · `fill="none"` · `stroke="currentColor"` · `strokeWidth={1.5}` · `strokeLinecap="round"` · `strokeLinejoin="round"`

| Category ID | Visual | Key shapes |
|---|---|---|
| `fences` | `(□)` | Two curved paths (parentheses) + small rect slot |
| `fractions` | `□/□` | Two rounded rects + horizontal rule |
| `scripts` | `□²` | Large rect (base) + small rect (superscript, top-right) |
| `summation` | `Σ` | Zigzag polyline + faint limit-slot lines |
| `integrals` | `∫` | S-curve path + faint dot hints for limits |
| `over-under` | `→̄□` | Rect (base) + arrow accent line above |
| `bigops` | `∏` | Two vertical bars + top horizontal bar + faint limit line |
| `matrices` | `▪▪/▪▪` | Four equal rounded rects in 2×2 grid |

---

## Component Design

### New file: `src/components/Toolbar/CategoryIcon.tsx`

A single component that takes `categoryId: string` and renders either a Unicode span or inline SVG. No props beyond the ID — callers don't decide which tier.

```tsx
export function CategoryIcon({ id }: { id: string }) {
  // Unicode tier
  const unicode = UNICODE_ICONS[id];
  if (unicode) return <span className={styles.unicodeIcon}>{unicode}</span>;

  // SVG tier
  const Svg = SVG_ICONS[id];
  if (Svg) return <Svg />;

  return null;
}
```

Two lookup tables in the same file:
- `UNICODE_ICONS: Record<string, string>` — 9 entries
- `SVG_ICONS: Record<string, React.FC>` — 8 entries, each an inline SVG component

### Changes to `CategoryButton.tsx`

Replace:
```tsx
<MathPreview className={styles.math} latex={CATEGORY_ICONS[category.id] ?? ...} />
```

With:
```tsx
<CategoryIcon id={category.id} />
```

Remove `CATEGORY_ICONS` map and `MathPreview` import from this file.

### New CSS: `CategoryButton.module.css` additions

```css
/* Unicode icons */
.unicodeIcon {
  font-family: var(--math-font);
  font-size: 15px;
  line-height: 1;
  display: flex;
  align-items: center;
}

/* SVG icons */
.svgIcon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
```

Both classes enforce `display: flex; align-items: center` so they sit on the same baseline as the `ChevronDown` beside them.

---

## File Checklist

| File | Change |
|---|---|
| `src/components/Toolbar/CategoryIcon.tsx` | **Create** — new component with both icon tiers |
| `src/components/Toolbar/CategoryButton.tsx` | **Modify** — swap `MathPreview` for `CategoryIcon`, remove `CATEGORY_ICONS` map |
| `src/components/Toolbar/CategoryButton.module.css` | **Modify** — add `.unicodeIcon` and `.svgIcon` rules |

No changes to: `MathPreview`, `ToolbarZone`, `FlyoutPalette`, `UtilityRow`, data files.

---

## Non-Goals

- Quick bar icons: kept as-is (mathlive rendering). The Quick bar alignment issue is a separate concern.
- Flyout palette items: kept as-is.
- Changing the icon for any category other than the 17 listed.
- Adding animation or hover-specific icon states.
