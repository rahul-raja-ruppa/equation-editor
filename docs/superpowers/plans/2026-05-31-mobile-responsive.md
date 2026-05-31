# Mobile-Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add responsive CSS breakpoints so the equation editor works cleanly on narrow screens (≥ 320px) without touching the desktop iframe experience.

**Architecture:** CSS-only changes across 6 module files + one 2-line clamp in `useFlyout.ts`. All changes are guarded by `@media (max-width: 520px)` so desktop behavior at ≥ 760px is completely unaffected. The zoom hack in `App.module.css` is scoped to `@media (min-width: 760px)` — this is the key unlock that lets everything else flow naturally on mobile.

**Tech Stack:** CSS Modules, React 18, TypeScript, Vite. Dev server: `pnpm run dev` at http://localhost:5173. Use browser DevTools → responsive mode to test at 375px (iPhone) and 520px (narrow).

---

## Setup

### Task 0: Create the feature branch

- [ ] **Create and switch to branch**

```bash
git checkout -b mobile-responsive
```

Expected: `Switched to a new branch 'mobile-responsive'`

---

## Task 1: Scope the zoom hack to desktop only

**Files:**
- Modify: `src/App.module.css`

The current `.root` unconditionally applies `transform: scale(0.8)`. On screens narrower than 760px this makes everything tiny. We wrap the zoom declarations in a min-width media query so mobile gets natural layout flow.

- [ ] **Open `src/App.module.css` and replace the `.root` rule**

Current content of `.root`:
```css
.root {
  --editor-zoom: 0.8;

  display: flex;
  height: calc(100vh / var(--editor-zoom));
  width: calc(100% / var(--editor-zoom));
  overflow: hidden;
  background: var(--ee-bg);
  transform: scale(var(--editor-zoom));
  transform-origin: top left;
}
```

Replace with:
```css
.root {
  display: flex;
  overflow: hidden;
  background: var(--ee-bg);
}

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

- [ ] **Verify in browser at desktop width**

Run `pnpm run dev`, open http://localhost:5173, resize to > 760px.
Expected: Editor looks identical to before — zoom still active.

- [ ] **Verify in browser at mobile width**

In DevTools responsive mode, set width to 375px.
Expected: Editor fills the viewport at natural scale, no over-shrinking.

- [ ] **Commit**

```bash
git add src/App.module.css
git commit -m "scope zoom hack to desktop only (min-width: 760px)"
```

---

## Task 2: Make toolbar rows scroll horizontally on mobile

**Files:**
- Modify: `src/components/Toolbar/ToolbarZone.module.css`

On narrow screens, `flex-wrap: wrap` causes toolbar rows to spill into multiple lines and overflow the zone. Instead rows scroll horizontally (matching the tab strip pattern already used in ExpressionTabStrip). Touch targets bumped to 44px.

- [ ] **Append to `src/components/Toolbar/ToolbarZone.module.css`**

Add at the end of the file:
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
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
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

- [ ] **Verify in DevTools at 375px**

Expected: Toolbar rows are a single scrollable line. No wrapping. Buttons are taller (44px).

- [ ] **Commit**

```bash
git add src/components/Toolbar/ToolbarZone.module.css
git commit -m "make toolbar rows scroll horizontally on mobile"
```

---

## Task 3: Bump CategoryButton touch targets on mobile

**Files:**
- Modify: `src/components/Toolbar/CategoryButton.module.css`

CategoryButton (the flyout trigger buttons in the toolbar) is 38px tall on desktop — below the 44px iOS/Android minimum tap target recommendation.

- [ ] **Append to `src/components/Toolbar/CategoryButton.module.css`**

```css
@media (max-width: 520px) {
  .btn {
    height: 44px;
    min-width: 48px;
    flex-shrink: 0;
  }
}
```

- [ ] **Verify in DevTools at 375px**

Expected: Toolbar category buttons are visibly taller and easier to tap.

- [ ] **Commit**

```bash
git add src/components/Toolbar/CategoryButton.module.css
git commit -m "bump CategoryButton touch target to 44px on mobile"
```

---

## Task 4: Simplify ActionBar on mobile

**Files:**
- Modify: `src/components/ActionBar/ActionBar.module.css`

On screens < 520px the action bar row (TypeToggle + SizeControl + spacer + Cancel + Insert) is too cramped. TypeToggle and SizeControl are already rendered in the UtilityRow above (which stacks to two rows at 760px via its existing media query) — so hiding them in the ActionBar on mobile loses nothing. The bar becomes a full-width Cancel + Insert row.

- [ ] **Append to `src/components/ActionBar/ActionBar.module.css`**

```css
@media (max-width: 520px) {
  .actionBar {
    justify-content: space-between;
    gap: 10px;
  }

  .typeToggle,
  .sizeControl {
    display: none;
  }

  .spacer {
    display: none;
  }

  .cancelBtn {
    flex: 1;
    justify-content: center;
    min-height: 44px;
    font-size: 14px;
    padding: 0;
  }

  .insertBtn {
    flex: 1;
    justify-content: center;
    min-height: 44px;
    font-size: 14px;
    padding: 0;
  }
}
```

- [ ] **Verify in DevTools at 375px**

Expected: ActionBar shows only Cancel and Insert, each taking half the width. TypeToggle and SizeControl are gone from the bar but still visible in the UtilityRow above.

- [ ] **Commit**

```bash
git add src/components/ActionBar/ActionBar.module.css
git commit -m "simplify ActionBar to Cancel/Insert only on mobile"
```

---

## Task 5: Clamp FlyoutPalette to viewport on mobile

**Files:**
- Modify: `src/components/Toolbar/FlyoutPalette.module.css`
- Modify: `src/hooks/useFlyout.ts`

The palette is `position: fixed` with `left` set to the button's `rect.left`. On narrow screens this can push the palette off-screen to the right. Fix in two layers: CSS `max-width` clamp + a JS left-edge clamp in the hook.

- [ ] **Append to `src/components/Toolbar/FlyoutPalette.module.css`**

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

- [ ] **Update `src/hooks/useFlyout.ts` — clamp the computed left position**

Find the `open` callback (line 24–27). Replace:
```ts
  const open = useCallback((id: string, rect: DOMRect) => {
    setOpenId(id);
    setPosition({ top: rect.bottom, left: rect.left, anchorWidth: rect.width });
  }, []);
```

With:
```ts
  const open = useCallback((id: string, rect: DOMRect) => {
    setOpenId(id);
    const paletteMaxWidth = Math.min(280, window.innerWidth - 16);
    const clampedLeft = Math.min(rect.left, window.innerWidth - paletteMaxWidth - 8);
    setPosition({ top: rect.bottom, left: clampedLeft, anchorWidth: rect.width });
  }, []);
```

- [ ] **Verify in DevTools at 375px**

Open a flyout palette from a button near the right edge of the toolbar.
Expected: Palette stays fully within the viewport — no horizontal overflow.

- [ ] **Verify at desktop (> 760px)**

Expected: Flyout palette positions identically to before — no regression.

- [ ] **Commit**

```bash
git add src/components/Toolbar/FlyoutPalette.module.css src/hooks/useFlyout.ts
git commit -m "clamp FlyoutPalette to viewport on mobile"
```

---

## Task 6: Guarantee MathField canvas height on mobile

**Files:**
- Modify: `src/components/Editor/MathField.module.css`

The canvas uses `flex: 1` which gives it the remaining height after other zones. On narrow screens with tall stacking zones, the canvas can get squeezed below a usable size. Reduce padding and add a minimum height.

- [ ] **Append to `src/components/Editor/MathField.module.css`**

```css
@media (max-width: 520px) {
  .mathFieldWrapper {
    padding: 16px 12px;
    min-height: 120px;
  }
}
```

- [ ] **Verify in DevTools at 375px**

Expected: The math input area has at least 120px of height even when toolbar + expression zone + action bar are all visible. The dotted canvas background is clearly visible.

- [ ] **Commit**

```bash
git add src/components/Editor/MathField.module.css
git commit -m "guarantee MathField min height on mobile"
```

---

## Task 7: Lint, final cross-breakpoint check, push branch

- [ ] **Run linter**

```bash
pnpm run lint
```

Expected: No errors.

- [ ] **Full cross-breakpoint visual check in DevTools**

Test each of these widths and confirm no visual regressions:

| Width | Expected |
|---|---|
| 375px | Natural scale, toolbar scrolls, ActionBar = Cancel+Insert only, palette clamped |
| 520px | Same as 375px (boundary) |
| 521px | Zoom kicks back in, all desktop controls visible |
| 760px | Desktop layout, zoom active, all features |
| 1024px | Desktop layout unchanged |

- [ ] **Push branch**

```bash
git push -u origin mobile-responsive
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|---|---|
| Zoom hack scoped to ≥ 760px | Task 1 |
| Toolbar rows scroll horizontally on mobile | Task 2 |
| QuickBtn 44px touch target | Task 2 |
| CategoryButton 44px touch target | Task 3 |
| ActionBar hides TypeToggle/SizeControl on mobile | Task 4 |
| Cancel/Insert full-width 44px on mobile | Task 4 |
| FlyoutPalette max-width clamp | Task 5 |
| FlyoutPalette item 48px on mobile | Task 5 |
| useFlyout left-edge clamp | Task 5 |
| MathField min-height on mobile | Task 6 |
| ExpressionZone — no changes needed | — |
| LaTeXBar — no changes needed | — |
