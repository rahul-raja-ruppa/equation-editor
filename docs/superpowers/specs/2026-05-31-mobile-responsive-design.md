# Mobile-Responsive Design — Equation Editor

**Date:** 2026-05-31
**Status:** Approved

---

## Overview

Make the equation editor usable on narrow screens (mobile browsers, narrow iframes) without breaking the existing desktop CMS iframe experience. Mobile is a secondary use case — desktop behavior is unchanged. The iframe embedding at 760×420px continues to work exactly as today.

---

## Breakpoints

| Range         | Label                  | Behavior                                             |
| ------------- | ---------------------- | ---------------------------------------------------- |
| ≥ 760px       | Desktop                | Current behavior, zoom hack active                   |
| 520px – 759px | Tablet / narrow iframe | Zoom removed, layout reflows                         |
| < 520px       | Phone                  | Zoom removed, action bar simplified, toolbar scrolls |

---

## Component Changes

### `App.module.css`

**Problem:** The zoom hack (`transform: scale(0.8)`) is unconditional. On screens narrower than 760px it over-shrinks everything.

**Fix:** Wrap the zoom declarations inside `@media (min-width: 760px)`. Below 760px the root renders at natural scale.

```css
@media (min-width: 760px) {
  .root {
    --editor-zoom: 0.8;
    height: calc(100vh / var(--editor-zoom));
    width: calc(100% / var(--editor-zoom));
    transform: scale(var(--editor-zoom));
    transform-origin: top left;
  }
}
```

The `.root` flex layout and `overflow: hidden` remain unconditional.

---

### `ToolbarZone.module.css`

**Problem:** Toolbar rows `flex-wrap: wrap` causes awkward multi-line wrapping on narrow screens. The quick-symbols row overflows silently.

**Fix:** Below 520px, make each row a single horizontally scrollable line. Hide scrollbar visually (matches the tab strip pattern already used in `ExpressionTabStrip`).

```css
@media (max-width: 520px) {
  .row {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .row::-webkit-scrollbar {
    display: none;
  }

  .quick {
    overflow-x: auto;
    scrollbar-width: none;
    flex-wrap: nowrap;
  }
  .quick::-webkit-scrollbar {
    display: none;
  }

  .quickBtn {
    height: 44px;
    min-width: 40px;
    flex-shrink: 0;
  }
}
```

---

### `CategoryButton.module.css`

**Problem:** Buttons are 38px tall — below the 44px iOS/Android minimum touch target recommendation.

**Fix:**

```css
@media (max-width: 520px) {
  .btn {
    height: 44px;
    min-width: 48px;
    flex-shrink: 0;
  }
}
```

---

### `ActionBar.module.css`

**Problem:** On narrow screens, the action bar row packs TypeToggle + SizeControl + Cancel + Insert into ~320px — too cramped.

**Fix:** Below 520px, hide TypeToggle and SizeControl from the ActionBar (they are already rendered in UtilityRow, which stacks to two rows at 760px per existing media query). The ActionBar becomes Cancel + Insert only, full width.

```css
@media (max-width: 520px) {
  .actionBar {
    justify-content: space-between;
  }

  .typeToggle,
  .sizeControl {
    display: none;
  }

  .spacer {
    display: none;
  }

  .cancelBtn,
  .insertBtn {
    flex: 1;
    justify-content: center;
    min-height: 44px;
    font-size: 14px;
  }
}
```

**Note:** The UtilityRow already renders TypeToggle and SizeControl (via `UtilityRow.tsx`'s right section) and stacks them at 760px. On mobile these controls remain accessible above the canvas — they are not lost.

---

### `FlyoutPalette.module.css` + `useFlyout.ts`

**Problem:** The palette is `position: fixed` with JS-computed `top`/`left` from `useFlyout.ts` (`rect.left` of the trigger button). On narrow screens the button may sit close to the right edge, pushing the palette off-screen.

**Fix (CSS):** Add `max-width` so the palette never exceeds the viewport width regardless of where it's positioned.

```css
@media (max-width: 520px) {
  .palette {
    max-width: min(280px, calc(100vw - 16px));
  }

  .item {
    height: 48px;
  }
}
```

**Fix (useFlyout.ts):** Clamp `left` so the palette's right edge stays within the viewport. One line change in the `open` callback:

```ts
// Before
setPosition({ top: rect.bottom, left: rect.left, anchorWidth: rect.width });

// After
const paletteMaxWidth = Math.min(280, window.innerWidth - 16);
const clampedLeft = Math.min(rect.left, window.innerWidth - paletteMaxWidth - 8);
setPosition({ top: rect.bottom, left: clampedLeft, anchorWidth: rect.width });
```

This makes `useFlyout.ts` a 7th file in scope (TypeScript, not CSS, but a trivial change).

---

### `MathField.module.css`

**Problem:** The canvas uses `flex: 1` which gives it remaining height after other zones. On very narrow screens with tall stacking zones, the canvas can be squeezed.

**Fix:** Guarantee a minimum height so the math field is always usable.

```css
@media (max-width: 520px) {
  .mathFieldWrapper {
    padding: 16px 12px;
    min-height: 120px;
  }
}
```

---

### `ExpressionZone` (no changes needed)

- `ExpressionTabStrip` already uses `overflow-x: auto; scrollbar-width: none` — tabs scroll correctly on mobile today.
- `ExpressionChips` already uses `flex-wrap: wrap` — chips reflow naturally.
- No changes required.

---

### `LaTeXBar.module.css` (no changes needed)

The bar is a single flex row with `flex: 1` on the pill — already handles narrow widths gracefully. No changes required.

---

## Touch Targets — Summary

All interactive elements hit 44px minimum height on mobile:

| Component          | Desktop height | Mobile height           |
| ------------------ | -------------- | ----------------------- |
| CategoryButton     | 38px           | 44px                    |
| QuickBtn           | 40px           | 44px                    |
| FlyoutPalette item | 42px           | 48px                    |
| ActionBar buttons  | ~36px          | 44px (via `min-height`) |

---

## Out of Scope

- No new React components or props — CSS-only changes.
- No changes to the postMessage protocol.
- No changes to the desktop experience (≥ 760px).
- No dark mode.
- No landscape-specific treatment.

---

## Files Modified

1. `src/App.module.css`
2. `src/components/Toolbar/ToolbarZone.module.css`
3. `src/components/Toolbar/CategoryButton.module.css`
4. `src/components/ActionBar/ActionBar.module.css`
5. `src/components/Toolbar/FlyoutPalette.module.css`
6. `src/components/Editor/MathField.module.css`
7. `src/hooks/useFlyout.ts`
