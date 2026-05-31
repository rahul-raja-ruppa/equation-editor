# Menu Toggle — Design Spec

**Date:** 2026-05-29

## Summary

Add a dark header bar above row 1 of the `ToolbarZone` containing a `☰ Menu` button that opens MathLive's built-in context menu (Insert Matrix, Mode, Font Style, Color, Cut/Copy/Paste). Remove MathLive's auto-rendered virtual-keyboard-toggle button from the math field.

## What Changes

### Remove virtual-keyboard-toggle

MathLive renders a virtual keyboard toggle button inside `<math-field>` by default. Suppress it by setting `math-virtual-keyboard-policy="manual"` on the `<math-field>` element in `MathField.tsx`. The `manual` policy tells MathLive the keyboard is externally controlled, which hides the auto-rendered toggle.

### Add menu bar above row 1

A new `menuBar` div is added as the first child of `ToolbarZone`, above the existing two symbol rows. It contains a single `☰ Menu` button. Clicking the button calls `mathFieldRef.current?.showMenu({ location: { x, y }, modifiers: {} })` where `x`/`y` come from the button's `getBoundingClientRect()`. This opens MathLive's native context menu anchored near the button.

The bar uses a dark background (`#1f2937`) to visually distinguish editor-level controls from the symbol category rows below.

## Files Modified

| File                                            | Change                                                      |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `src/components/Editor/MathField.tsx`           | Add `virtual-keyboard-policy="off"` to `<math-field>`       |
| `src/components/Toolbar/ToolbarZone.tsx`        | Accept `mathFieldRef` prop; render `menuBar` div above rows |
| `src/components/Toolbar/ToolbarZone.module.css` | Add `.menuBar` and `.menuBtn` styles                        |
| `src/App.tsx`                                   | Pass `mathField.ref` to `<ToolbarZone mathFieldRef={...}>`  |

## ToolbarZone Props (after change)

```ts
interface ToolbarZoneProps {
  onInsert: (latex: string) => void;
  mathFieldRef: React.RefObject<HTMLElement>;
}
```

## Menu Bar Styling

```
background: #1f2937   (dark gray, matches MathLive context menu)
padding: 3px 8px
border-bottom: 1px solid rgba(255,255,255,0.1)

Button:
  background: rgba(255,255,255,0.12)
  color: white
  border: 1px solid rgba(255,255,255,0.2)
  border-radius: 4px
  padding: 2px 9px
  font-size: 11px
  label: "☰ Menu"
```

## Behaviour

- `☰ Menu` is always visible regardless of math field focus state.
- Clicking it calls `mathFieldRef.current?.showMenu()`.
- MathLive handles menu positioning, submenus, and keyboard shortcuts internally.
- Toolbar rows (row 1, row 2) remain always expanded — no collapse behaviour.
