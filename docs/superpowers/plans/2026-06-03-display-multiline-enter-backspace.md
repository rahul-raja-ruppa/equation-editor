# Display Mode Multi-line: Backspace Handler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Backspace key handling inside `\begin{aligned}` environments so that pressing Backspace at the start of a non-first row merges it into the previous row (or removes it if empty).

**Architecture:** A single new `useEffect` in `MathField.tsx` intercepts Backspace when the current LaTeX contains `\begin{aligned}`. It first attempts `executeCommand('deleteBackward')` for normal in-cell deletion. If the LaTeX is unchanged (cursor is at a row boundary), a `countAtoms` helper determines which `\\` separator to remove, the rows are merged, and `setValue` + `moveToNextPlaceholder` repositions the cursor. Two small pure helper functions (`countAtoms`, `removeRowBoundary`) are extracted at the top of `MathField.tsx`.

**Tech Stack:** React 18, MathLive (`MathfieldElement`), TypeScript

> **Note:** The Enter handler is already implemented and working (verified). This plan covers only the Backspace handler.

---

### Task 1: Add `countAtoms` helper

**Files:**
- Modify: `src/components/Editor/MathField.tsx`

- [ ] **Step 1: Add `countAtoms` above the `MathField` component**

Open `src/components/Editor/MathField.tsx`. After the `declare global` block (line ~15) and before the `MathFieldProps` interface, insert:

```typescript
function countAtoms(latex: string): number {
  let count = 0;
  let i = 0;
  while (i < latex.length) {
    if (latex[i] === ' ') { i++; continue; }
    if (latex[i] === '\\') {
      i++;
      if (i < latex.length && /[a-zA-Z]/.test(latex[i])) {
        while (i < latex.length && /[a-zA-Z]/.test(latex[i])) i++;
      } else {
        i++;
      }
    } else if (latex[i] === '{') {
      let depth = 0;
      while (i < latex.length) {
        if (latex[i] === '{') depth++;
        else if (latex[i] === '}') {
          depth--;
          if (depth === 0) { i++; break; }
        }
        i++;
      }
    } else {
      i++;
    }
    count++;
  }
  return count;
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Editor/MathField.tsx
git commit -m "feat: add countAtoms helper for aligned row boundary detection"
```

---

### Task 2: Add `removeRowBoundary` helper

**Files:**
- Modify: `src/components/Editor/MathField.tsx`

- [ ] **Step 1: Add `removeRowBoundary` directly after `countAtoms`**

```typescript
function removeRowBoundary(mf: MathfieldElement, latex: string, cursorPos: number) {
  const inner = latex
    .replace(/^\\begin\{aligned\}/, '')
    .replace(/\\end\{aligned\}$/, '');
  const rows = inner.split('\\\\').map((r) => r.trim());

  // Find which row the cursor is at the start of
  let offset = 1; // +1 to enter the aligned block
  let targetRow = -1;
  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && offset === cursorPos) {
      targetRow = i;
      break;
    }
    offset += countAtoms(rows[i]) + 1; // +1 for \\ separator
  }

  if (targetRow < 1) return;

  const prevRow = rows[targetRow - 1];
  const currRow = rows[targetRow];
  const newRows = [
    ...rows.slice(0, targetRow - 1),
    prevRow + currRow,
    ...rows.slice(targetRow + 1),
  ];

  // Build new LaTeX — unwrap aligned if only 1 row remains
  const withPlaceholder =
    newRows.length === 1
      ? `${prevRow}\\placeholder{}${currRow}`
      : `\\begin{aligned}${[
          ...rows.slice(0, targetRow - 1),
          `${prevRow}\\placeholder{}${currRow}`,
          ...rows.slice(targetRow + 1),
        ].join('\\\\ ')}\\end{aligned}`;

  mf.setValue(withPlaceholder);
  mf.executeCommand('moveToNextPlaceholder');
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Editor/MathField.tsx
git commit -m "feat: add removeRowBoundary helper for aligned Backspace merging"
```

---

### Task 3: Add Backspace `useEffect` to `MathField`

**Files:**
- Modify: `src/components/Editor/MathField.tsx`

- [ ] **Step 1: Add the Backspace useEffect after the existing Enter useEffect**

The Enter `useEffect` ends with `}, [mathFieldRef, mathType]);`. Directly after that closing line, add:

```typescript
  useEffect(() => {
    if (mathType !== 'display') return;

    const el = mathFieldRef.current as MathfieldElement | null;
    if (!el) return;

    function handleBackspace(e: KeyboardEvent) {
      if (e.key !== 'Backspace') return;

      const mf = el as MathfieldElement;
      const current = mf.getValue('latex');
      if (!current.includes('\\begin{aligned}')) return;

      e.preventDefault();

      mf.executeCommand('deleteBackward');
      if (mf.getValue('latex') !== current) return;

      const pos = (mf.selection as { ranges: number[][] }).ranges[0][0];
      removeRowBoundary(mf, current, pos);
    }

    el.addEventListener('keydown', handleBackspace);
    return () => el.removeEventListener('keydown', handleBackspace);
  }, [mathFieldRef, mathType]);
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm run lint
```

Expected: no errors.

- [ ] **Step 3: Verify dev server builds without errors**

```bash
pnpm run dev &
sleep 3 && curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

Expected: `200`

- [ ] **Step 4: Commit**

```bash
git add src/components/Editor/MathField.tsx
git commit -m "feat: intercept Backspace in aligned display mode to merge rows"
```

---

### Task 4: Verify all behaviours in the browser

**Files:** none — browser-only verification

Run the app at `http://localhost:5173` and confirm the following scenarios using the browser console or Chrome DevTools:

- [ ] **Step 1: Enter wrap — type `x=1`, press Enter, confirm wrap**

```js
const mf = document.querySelector('math-field');
mf.setValue('x=1'); mf.focus();
mf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
console.log(mf.getValue('latex'));
// Expected: \begin{aligned}x=1\\ \placeholder{}\end{aligned}
```

- [ ] **Step 2: Second Enter — adds row 3**

```js
mf.insert('y=2');
mf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
mf.insert('z=3');
console.log(mf.getValue('latex'));
// Expected: \begin{aligned}x=1\\ y=2\\ z=3\end{aligned}
```

- [ ] **Step 3: Backspace mid-row — deletes previous char normally**

```js
// Position cursor at end of row 2 (after y=2) — position [8,8]
mf.setValue('\\begin{aligned}x=1\\\\ y=2\\end{aligned}');
mf.focus();
mf.executeCommand('moveToMathfieldStart');
for (let i = 0; i < 8; i++) mf.executeCommand('moveToNextChar');
mf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
console.log(mf.getValue('latex'));
// Expected: \begin{aligned}x=1\\ y=\end{aligned}  (deleted '2')
```

- [ ] **Step 4: Backspace at start of empty row — removes the row**

```js
mf.setValue('\\begin{aligned}x=1\\\\ \\placeholder{}\\end{aligned}');
mf.focus();
mf.executeCommand('moveToNextPlaceholder');
mf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
console.log(mf.getValue('latex'));
// Expected: x=1  (aligned unwrapped, row 2 removed)
```

- [ ] **Step 5: Backspace at start of non-empty row 2 — merges**

```js
// Navigate to position [5,5] (start of row 2)
mf.setValue('\\begin{aligned}x=1\\\\ y=2\\end{aligned}');
mf.focus();
mf.executeCommand('moveToMathfieldStart');
for (let i = 0; i < 5; i++) mf.executeCommand('moveToNextChar');
mf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
console.log(mf.getValue('latex'));
// Expected: x=1\placeholder{}y=2  (merged, cursor at join point)
// After moveToNextPlaceholder: cursor between x=1 and y=2
```

- [ ] **Step 6: Backspace on row 1 — no-op**

```js
mf.setValue('\\begin{aligned}x=1\\\\ y=2\\end{aligned}');
mf.focus();
mf.executeCommand('moveToMathfieldStart');
mf.executeCommand('moveToNextChar'); // position [1,1] — inside row 1
const before = mf.getValue('latex');
mf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
console.log(mf.getValue('latex') === before ? 'NO-OP ✓' : 'UNEXPECTED CHANGE');
```

- [ ] **Step 7: Inline mode — Backspace not intercepted**

Switch toggle to **Inline**, type something, press Backspace — it should behave normally (MathLive default).

- [ ] **Step 8: Final commit if all pass**

```bash
git add src/components/Editor/MathField.tsx
git commit -m "verified: display mode multi-line Enter and Backspace working"
```

---

## Final file state reference

`src/components/Editor/MathField.tsx` additions summary:

| Addition | Location | Purpose |
|---|---|---|
| `countAtoms(latex)` | Module top-level | Counts MathLive atoms in a LaTeX string for row boundary detection |
| `removeRowBoundary(mf, latex, pos)` | Module top-level | Merges two aligned rows, places cursor at join point |
| Enter `useEffect` | Inside `MathField` | Wraps content in `\begin{aligned}` on first Enter; adds row on subsequent |
| Backspace `useEffect` | Inside `MathField` | Delegates to `deleteBackward` for mid-row; calls `removeRowBoundary` at row boundaries |
