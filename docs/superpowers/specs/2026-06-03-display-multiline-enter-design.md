# Display Mode Multi-line: Enter & Backspace

**Date:** 2026-06-03
**Status:** Implementation ready

---

## Problem

In Display mode, pressing Enter should allow users to build multi-line equations. Pressing Backspace at the start of a new row should remove it and return the cursor to the previous row. MathLive provides no built-in handling for either of these cases in `\begin{aligned}` environments.

---

## Behaviour Spec

### Enter key (Display mode only)

| State | Action | Result |
|---|---|---|
| Plain expression (no `\begin{aligned}`) | Enter | Wrap in `\begin{aligned}...\end{aligned}`, cursor in new empty row |
| Already in `\begin{aligned}` | Enter | Append `\\` row, cursor in new empty row |
| Inline mode | Enter | No interception — MathLive default |

#### LaTeX transitions

First Enter on `x=1`:
```
x=1  →  \begin{aligned}x=1\\ \placeholder{}\end{aligned}
```

Second Enter (cursor in row 2 after typing `y=2`):
```
\begin{aligned}x=1\\ y=2\end{aligned}  →  \begin{aligned}x=1\\ y=2\\ \placeholder{}\end{aligned}
```

Cursor is placed using `\placeholder{}` + `executeCommand('moveToNextPlaceholder')`.

---

### Backspace key (Display mode, inside `\begin{aligned}`)

| Cursor position | Action | Result |
|---|---|---|
| Mid-row (content before cursor) | Backspace | Delete previous char (normal) |
| Start of row 1 | Backspace | No-op |
| Start of row N > 1, row is empty | Backspace | Remove empty row, cursor at end of row N-1 |
| Start of row N > 1, row has content | Backspace | Merge row N content into row N-1, cursor at merge point |

#### LaTeX transitions

Backspace at start of empty row 2:
```
\begin{aligned}x=1\\ \end{aligned}  →  x=1
```
(If only 2 rows and row 2 was empty, the whole aligned wrapper is also removed.)

Backspace at start of non-empty row 2 (`y=2`):
```
\begin{aligned}x=1\\ y=2\end{aligned}  →  \begin{aligned}x=1y=2\end{aligned}
```
Cursor lands at the join point (between `x=1` and `y=2`).

Backspace at start of row 2 when 3 rows exist:
```
\begin{aligned}x=1\\ y=2\\ z=3\end{aligned}  →  \begin{aligned}x=1y=2\\ z=3\end{aligned}
```

---

## Implementation Design

### Files changed

Only `src/components/Editor/MathField.tsx` — two `useEffect` blocks added (Enter already done; Backspace to be added).

---

### Enter handler (already implemented)

```typescript
useEffect(() => {
  if (mathType !== 'display') return;
  const el = mathFieldRef.current as MathfieldElement | null;
  if (!el) return;

  function handleEnter(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const mf = el as MathfieldElement;
    const current = mf.getValue('latex');
    if (current.includes('\\begin{aligned}')) {
      mf.insert('\\\\');
    } else {
      mf.setValue(`\\begin{aligned}${current}\\\\ \\placeholder{}\\end{aligned}`);
      mf.executeCommand('moveToNextPlaceholder');
    }
  }

  el.addEventListener('keydown', handleEnter);
  return () => el.removeEventListener('keydown', handleEnter);
}, [mathFieldRef, mathType]);
```

---

### Backspace handler (to implement)

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

    // Attempt normal deletion within current cell
    mf.executeCommand('deleteBackward');
    if (mf.getValue('latex') !== current) return; // worked — done

    // LaTeX unchanged → cursor is at start of a row boundary
    const pos = (mf.selection as { ranges: number[][] }).ranges[0][0];
    removeRowBoundary(mf, current, pos);
  }

  el.addEventListener('keydown', handleBackspace);
  return () => el.removeEventListener('keydown', handleBackspace);
}, [mathFieldRef, mathType]);
```

---

### `removeRowBoundary` helper

```typescript
function countAtoms(latex: string): number {
  // Counts top-level tokens: single chars, \commands, {groups}
  let count = 0;
  let i = 0;
  while (i < latex.length) {
    if (latex[i] === ' ') { i++; continue; }
    if (latex[i] === '\\') {
      i++;
      if (i < latex.length && /[a-zA-Z]/.test(latex[i])) {
        while (i < latex.length && /[a-zA-Z]/.test(latex[i])) i++;
      } else { i++; }
    } else if (latex[i] === '{') {
      let depth = 0;
      while (i < latex.length) {
        if (latex[i] === '{') depth++;
        else if (latex[i] === '}') { depth--; if (depth === 0) { i++; break; } }
        i++;
      }
    } else { i++; }
    count++;
  }
  return count;
}

function removeRowBoundary(mf: MathfieldElement, latex: string, cursorPos: number) {
  const inner = latex.replace(/^\\begin\{aligned\}/, '').replace(/\\end\{aligned\}$/, '');
  const rows = inner.split('\\\\').map(r => r.trim());

  // Find which row cursor is at the start of
  let offset = 1; // +1 to enter the aligned block
  let targetRow = -1;
  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && offset === cursorPos) { targetRow = i; break; }
    offset += countAtoms(rows[i]) + 1; // +1 for \\ separator
  }

  if (targetRow < 1) return; // no boundary found — no-op

  // Merge rows[targetRow] into rows[targetRow - 1]
  const mergedContent = rows[targetRow - 1] + rows[targetRow];
  const newRows = [...rows.slice(0, targetRow - 1), mergedContent, ...rows.slice(targetRow + 1)];

  // Cursor lands at end of original rows[targetRow - 1] content
  const cursorAtomCount = countAtoms(rows[targetRow - 1]);

  if (newRows.length === 1 && !newRows[0]) {
    // All rows empty after merge — clear entirely
    mf.setValue('');
    return;
  }

  const newLatex =
    newRows.length === 1
      ? newRows[0]  // unwrap aligned if only 1 row remains
      : `\\begin{aligned}${newRows.join('\\\\ ')}\\end{aligned}`;

  // Inject placeholder at merge point for cursor positioning
  const beforeMerge = rows[targetRow - 1];
  const afterMerge = rows[targetRow];
  const withPlaceholder =
    newRows.length === 1
      ? `${beforeMerge}\\placeholder{}${afterMerge}`
      : `\\begin{aligned}${[
          ...rows.slice(0, targetRow - 1),
          `${beforeMerge}\\placeholder{}${afterMerge}`,
          ...rows.slice(targetRow + 1),
        ].join('\\\\ ')}\\end{aligned}`;

  mf.setValue(withPlaceholder);
  mf.executeCommand('moveToNextPlaceholder');
}
```

---

## Edge Cases

| Case | Handling |
|---|---|
| Only 1 row in aligned, Enter pressed | Adds row 2 as normal |
| Backspace on row 1 (no previous row) | `targetRow < 1` guard → no-op |
| Backspace merges last two rows into one | Unwraps `\begin{aligned}` entirely (single row) |
| Inline mode Backspace | Handler returns early (no `\begin{aligned}` guard) |
| Complex expression in row (e.g., `\frac{a}{b}`) | `countAtoms` treats `\frac` as 1 atom, `{a}` as 1, `{b}` as 1 → 3 atoms — matches MathLive's internal atom count |

---

## Non-goals

- Switching from Inline → Display with aligned content in field: no auto-unwrap
- Undo/redo across Enter/Backspace: MathLive's built-in undo stack handles this
