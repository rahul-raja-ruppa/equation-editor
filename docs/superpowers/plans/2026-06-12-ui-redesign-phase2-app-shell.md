# UI Redesign — Phase 2: App Shell & Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `App.tsx` from the current single-column vertical stack into the v2.2 outer shell — a centered, padded, max-width `1200px` rounded card containing a flex row of three columns (rail · editor · on-demand live-preview) with `ActionBar` as a full-width footer — moving existing components into their new positions without restyling them, and add a global `⌘P` handler that toggles the preview column.

**Architecture:** Pure structural relayout. `App.module.css` (`.root`/`.editor` zoom-scaled vertical stack) is deleted and replaced by Tailwind utility classes in `App.tsx` matching `app.jsx` lines 119-146. The existing `UtilityRow` + `ToolbarZone` + `ExpressionZone` are re-parented into a 340px left column (their real v2.2 content arrives in Phase 3); `MathField` + `LaTeXBar` into a flex-1 editor column (rebuilt in Phase 5); the live preview — currently rendered *inside* `MathField` via `previewOpen` — is lifted to a true third flex column at the `App` level rendering the existing `MathJaxPreview` unchanged (styled in Phase 6). `MathField` is **not edited**; it is simply passed `previewOpen={false}` so it never renders its internal split, and Phase 5 deletes that now-dead code.

**Tech Stack:** Vite 5 + React 18 + TS 5, Tailwind CSS v4 (`@theme` tokens from Phase 1's `src/styles/theme.css`), CSS Modules (existing inner components, untouched). pnpm 9. No test runner in this repo — verification is `pnpm build` + `pnpm lint` + `pnpm exec tsc --noEmit` + a manual dev-server smoke test, the same regime Phase 1 used.

**Source of truth:** `docs/superpowers/specs/2026-06-12-ui-redesign-phases-2-6-roadmap.md` (Phase 2 section) and `/tmp/design_export/equation-editor-v2-2/project/app/app.jsx` lines 119-146.

---

## File Structure

```
src/
├── App.tsx           # MODIFIED — new shell render + ⌘P handler; imports MathJaxPreview; drops App.module.css import & data-skin
└── App.module.css    # DELETED — .root/.editor zoom-scaled stack replaced by Tailwind utilities in App.tsx
```

No new files. No component file under `src/components/` is created or edited in this phase. `MathField.tsx`, `MathField.module.css`, `LaTeXBar.tsx`, `UtilityRow.tsx`, `ToolbarZone.tsx`, `ExpressionZone.tsx`, `ActionBar.tsx`, `MathJaxPreview.tsx` are all consumed exactly as-is.

---

## Background notes the implementer needs (do not re-derive)

- **No test runner exists** (`package.json` scripts are only `dev`, `build`, `preview`, `lint`). Do not write unit tests. Verify via build/lint/typecheck/manual-smoke.
- **The zoom transform is intentionally dropped.** Old `.root` did `transform: scale(0.8)` with `height: calc(100dvh / 0.8)`. The v2.2 design has no zoom (centered `max-w-[1200px]` card). The editor is iframe-embedded in kriya2.0 via a responsive modal (`kriya2.0/cms/v3.0/js/libs/editor/editor.js`: iframe `style="height: 95%; width: 100%;"` inside a `width:90%; height:90vh` modal), so the host auto-sizes and dropping the zoom does not clip. Use `h-dvh` (viewport height — works regardless of `#root` height) on the outer wrapper; the inner card uses `h-full` (= 100% of the `h-dvh` parent).
- **`data-skin="a"`** on the old `.editor` div is referenced **only** in `App.tsx` JSX — no `.module.css` reads `[data-skin]`. It is dead and is removed.
- **The live preview must render in Col 3 only — not also inside `MathField`.** `MathField` currently splits 50/50 and renders `MathJaxPreview` internally when `previewOpen` is true (`MathField.tsx` lines 120-138). Passing `previewOpen={false}` makes it always render the single full-width card; the App-level Col 3 owns the preview. This avoids a double-render and leaves `MathField.tsx` untouched (Phase 5 deletes the dead `cardsSplit`/`previewCard` branch).
- **`FlyoutPalette` is portaled to `document.body` with fixed positioning** (`FlyoutPalette.tsx:106` `createPortal(..., document.body)`, anchored via `getBoundingClientRect`). So `overflow` on the 340px rail column does **not** clip flyouts.
- **The toolbar ribbon / expression chips will look cramped inside the 340px column.** This is the expected, documented interim state — Phase 3 replaces this column's contents with the real vertical rail. Do not try to fix the cramping in this phase.
- **Tailwind token classes used below are validated.** `bg-surface` (`--color-surface`), `border-ink-200` (`--color-ink-200`), `rounded-xl` (`--radius-xl`), `h-dvh`, `shadow-[...]` arbitrary value all resolve against Phase 1's `theme.css`; Phase 1's Task 8 sanity check already rendered `bg-surface` / `border-ink-*` successfully.
- **The dotted canvas background** currently lives on `App.module.css` `.canvas` (`radial-gradient(circle at 1px 1px, #d8dbe8 1px, transparent 0) 0 0 / 22px 22px, #f2f3f9`). To preserve it behind the math field after `App.module.css` is deleted, it is reapplied as an inline `style` on the editor column wrapper. Phase 5 replaces this with the `.ee-canvas-bg` token utility.
- **`pnpm` is the package manager.** Use `pnpm` for all commands.

---

## Task 1: Add the global `⌘P` preview-toggle handler

**Files:**
- Modify: `src/App.tsx`

The `⌘P` (and `Ctrl+P`) shortcut toggles `previewOpen` (Col 3). It is layout-level state, so it belongs here even though the *button* that also toggles it (`UtilityRow`'s preview button) is restyled later. Only `⌘P` is added — `⌘K` / command palette is Phase 4.

- [ ] **Step 1: Add a keydown `useEffect` inside the `App` component**

In `src/App.tsx`, immediately after the existing `useEffect` block that ends at line 43 (the `seeded` timer effect), add this new effect:

```tsx
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPreviewOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
```

`useEffect` is already imported (`src/App.tsx:1`). `setPreviewOpen` is already in scope (`src/App.tsx:22`).

- [ ] **Step 2: Verify build, lint, and typecheck pass**

```bash
pnpm build && pnpm lint && pnpm exec tsc --noEmit
```

Expected: all three succeed with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add global ⌘P handler to toggle preview column"
```

---

## Task 2: Restructure `App.tsx` into the v2.2 card shell + lift preview to Col 3

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/App.module.css`

This replaces the single-column stack (`UtilityRow` → toolbar → expressions → canvas → actionBar) with the v2.2 outer shell: centered padded wrapper → max-width rounded card → flex row of three columns → full-width `ActionBar` footer.

- [ ] **Step 1: Swap the imports at the top of `src/App.tsx`**

Remove the `App.module.css` import (currently `src/App.tsx:13`):

```tsx
import styles from './App.module.css';
```

and add a `MathJaxPreview` import alongside the other component imports (after the `UtilityRow` import on line 10):

```tsx
import { MathJaxPreview } from './components/MathPreview/MathJaxPreview';
```

All other imports (lines 1-12) stay unchanged.

- [ ] **Step 2: Replace the entire `return ( ... )` JSX block**

Replace the current return (lines 80-127, the `<div className={styles.root}>...</div>` tree) with:

```tsx
  return (
    <div className="flex h-dvh w-full items-stretch justify-center p-4 sm:p-5">
      <div className="flex h-full w-full max-w-[1200px] flex-col overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-[0_18px_50px_-22px_rgba(54,24,92,0.32)]">
        <div className="flex min-h-0 flex-1">
          {/* Col 1 — rail shell. Real v2.2 vertical rail content arrives in Phase 3. */}
          <div className="flex w-[340px] shrink-0 flex-col overflow-auto border-r border-ink-200">
            <UtilityRow
              mathType={mathType}
              onMathTypeChange={setMathType}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              onInsert={handleInsert}
              previewOpen={previewOpen}
              onPreviewToggle={() => setPreviewOpen((v) => !v)}
            />
            <ToolbarZone onInsert={handleInsert} />
            <ExpressionZone onInsert={handleInsert} />
          </div>

          {/* Col 2 — editor shell. LaTeXPanel/EditorSurface rebuild is Phase 5. */}
          <div
            className="flex min-w-0 flex-1 flex-col"
            style={{
              background:
                'radial-gradient(circle at 1px 1px, #d8dbe8 1px, transparent 0) 0 0 / 22px 22px, #f2f3f9',
            }}
          >
            <div className="flex min-h-0 flex-1">
              <MathField
                mathFieldRef={mathField.ref}
                onChange={setCurrentLatex}
                fontSize={fontSize}
                latex={currentLatex}
                mathType={mathType}
                previewOpen={false}
              />
            </div>
            <LaTeXBar
              value={currentLatex}
              onCommit={handleLatexCommit}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
            />
          </div>

          {/* Col 3 — live preview, on demand. v2.2 styling arrives in Phase 6. */}
          {previewOpen && (
            <div className="flex min-w-0 flex-1 flex-col overflow-auto border-l border-ink-200 bg-surface">
              <MathJaxPreview latex={currentLatex} mathType={mathType} />
            </div>
          )}
        </div>

        <ActionBar
          fontSize={fontSize}
          mathType={mathType}
          getLatex={getLatex}
          getMathML={getMathML}
          send={send}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
```

Note: `data-skin="a"` is intentionally not carried over (dead attribute). All component props are identical to the current call sites except `MathField` now receives `previewOpen={false}` (literal) instead of `previewOpen={previewOpen}`.

- [ ] **Step 3: Delete `src/App.module.css`**

```bash
git rm src/App.module.css
```

- [ ] **Step 4: Verify build, lint, and typecheck pass**

```bash
pnpm build && pnpm lint && pnpm exec tsc --noEmit
```

Expected: all three succeed. In particular, `tsc` confirms no dangling reference to the deleted `styles` import.

- [ ] **Step 5: Manual smoke test**

```bash
pnpm dev
```

Open the dev-server URL and confirm:
- The app renders as a **centered, rounded, bordered card** with outer padding (no longer edge-to-edge, no zoom-scaling).
- Three regions are visible inside the card: a **340px left column** (UtilityRow + cramped toolbar/expressions — cramping is expected), a **flex-1 editor column** (math field on the dotted background, LaTeX bar below it), and the **ActionBar as a full-width footer** spanning the card bottom.
- The math field accepts typing and symbol/template insertion (left column buttons still work; flyouts open and are not clipped).
- Pressing **`⌘P`** (or `Ctrl+P`) toggles a **third column** on the right showing the live MathJax preview. Toggling the UtilityRow preview button does the same.
- **With preview open, the preview appears ONLY in the third column** — the math field (Col 2) stays full-width and does NOT split to show an inline preview.
- No console errors.

Stop the dev server (`Ctrl+C`) when done.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: restructure App into v2.2 card shell with rail/editor/preview columns"
```

---

## Self-Review Notes (for the plan author — already checked)

- **Spec coverage (Phase 2 section):** outer shell card (Task 2 Step 2 — `p-4 sm:p-5`, `max-w-[1200px]`, `rounded-xl border shadow-[...]`); rail shell at 340px wrapping UtilityRow+ToolbarZone+ExpressionZone re-parented unchanged (Task 2 Step 2 Col 1); editor shell flex-1 wrapping MathField+LaTeXBar (Col 2); preview extracted to true third flex column gated by `previewOpen` rendering existing `MathJaxPreview` (Col 3); ActionBar full-width footer below the row; `⌘P` global handler (Task 1). Out-of-scope items (⌘K, hasSelection/context toolbar, any inner-component restyle) are not touched.
- **No double-render:** `MathField` gets `previewOpen={false}` so its internal split never renders; preview is solely Col 3. `MathField.tsx` is not edited (Phase 5 removes the dead branch).
- **Placeholder scan:** every code block is complete and copy-pasteable; no TBD/TODO.
- **Type consistency:** `MathJaxPreview` props are `{ latex: string; mathType: 'display' | 'inline' }` (verified in `MathPreview/MathJaxPreview.tsx:49-52`); Col 3 passes `latex={currentLatex} mathType={mathType}` — matches. All other component props match their current call sites verbatim.
- **Height chain:** outer `h-dvh` (viewport-based, independent of `#root` height) → card `h-full` resolves correctly; avoids the silent 0-height collapse that `h-full` on the outermost element would cause.
