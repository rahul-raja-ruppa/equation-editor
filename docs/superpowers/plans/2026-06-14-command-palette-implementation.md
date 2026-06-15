# Phase 4: Command Palette (⌘K) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portaled `CommandPalette` (⌘K) modal that searches symbols, templates, quick items, and expression-library formulas with grouped, ranked, keyboard-navigable results, and wire it into `App`.

**Architecture:** A data-layer cleanup converts `row1.ts`/`row2.ts`/`quick.ts` into JSON (`categories.json`/`quick.json`) consumed via `resolveJsonModule`. A new `CommandPalette` component (portaled like `FlyoutPalette`) builds a flat search index once via `useMemo`, ranks/groups results, and renders them with a new `Kbd` primitive. `App` gets `paletteOpen` state, a `⌘K`/`Ctrl+K` handler, and mounts `CommandPalette`.

**Tech Stack:** React 18 + TypeScript (strict), Tailwind v4, `lucide-react`, `mathlive` (via existing `MathGlyph`), Vite, ESLint (kebab-case filenames enforced for `src/**/*.{ts,tsx}`).

---

## Reference: spec

`docs/superpowers/specs/2026-06-14-ui-redesign-phase4-command-palette-design.md`

## Filename note

The repo's ESLint `check-file/filename-naming-convention` rule enforces `KEBAB_CASE` for all `src/**/*.{ts,tsx}` filenames (directories may stay PascalCase, e.g. `src/components/MathPreview/mathjax-preview.tsx`). So the new component file is `src/components/CommandPalette/command-palette.tsx` (not `CommandPalette.tsx`), exporting `CommandPalette`.

---

## Task 1: Enable JSON module imports

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Add `resolveJsonModule` to compiler options**

In `tsconfig.json`, inside `compilerOptions`, add `"resolveJsonModule": true` (place it near `"allowImportingTsExtensions"`):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Verify tsc still runs clean**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors (existing baseline passes).

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: enable resolveJsonModule for JSON data imports"
```

---

## Task 2: Convert toolbar/quick data to JSON

**Files:**
- Create (temporary, deleted at end of task): `scripts/convert-toolbar-data.mjs`
- Create: `src/data/toolbar/categories.json`
- Create: `src/data/quick.json`
- Delete: `src/data/toolbar/row1.ts`, `src/data/toolbar/row2.ts`, `src/data/quick.ts`
- Modify: `src/components/Rail/symbol-grid.tsx`

This task merges `row1.ts` (9 categories) + `row2.ts` (8 categories) → `categories.json` (17 categories, row1-then-row2 order), and `quick.ts` (17 `PaletteItem` entries) → `quick.json`. The conversion is done programmatically (not hand-transcribed) to avoid transcription errors across ~500 lines of data.

- [ ] **Step 1: Write the conversion script**

Create `scripts/convert-toolbar-data.mjs`:

```js
import fs from 'node:fs';

function extractArray(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const match = src.match(/=\s*(\[[\s\S]*\])\s*;\s*\n\s*export default/);
  if (!match) throw new Error(`No array literal found in ${filePath}`);
  return new Function(`return ${match[1]};`)();
}

const row1 = extractArray('src/data/toolbar/row1.ts');
const row2 = extractArray('src/data/toolbar/row2.ts');
fs.writeFileSync(
  'src/data/toolbar/categories.json',
  JSON.stringify([...row1, ...row2], null, 2) + '\n'
);

const quick = extractArray('src/data/quick.ts');
fs.writeFileSync('src/data/quick.json', JSON.stringify(quick, null, 2) + '\n');

console.log('categories:', row1.length + row2.length, 'quick:', quick.length);
```

- [ ] **Step 2: Run the script**

Run: `node scripts/convert-toolbar-data.mjs`
Expected output: `categories: 17 quick: 17`

- [ ] **Step 3: Verify the generated JSON is valid and complete**

Run: `node -e "const c = require('fs').readFileSync('src/data/toolbar/categories.json','utf8'); const j = JSON.parse(c); console.log(j.length, j.map(x => x.id).join(','))"`
Expected: `17 relations,decorations,operators,arrows,logic,sets,misc,greek-lower,greek-upper,fences,fractions,scripts,summation,integrals,over-under,bigops,matrices`

Run: `node -e "const q = JSON.parse(require('fs').readFileSync('src/data/quick.json','utf8')); console.log(q.length)"`
Expected: `17`

- [ ] **Step 4: Delete the conversion script and old TS data files**

```bash
rm scripts/convert-toolbar-data.mjs
rmdir scripts 2>/dev/null || true
rm src/data/toolbar/row1.ts src/data/toolbar/row2.ts src/data/quick.ts
```

- [ ] **Step 5: Update `symbol-grid.tsx` to import from JSON**

In `src/components/Rail/symbol-grid.tsx`, replace:

```ts
import row1 from '../../data/toolbar/row1';
import row2 from '../../data/toolbar/row2';
import type { ToolbarCategory } from '../../types';
import { SectionLabel } from './section-label';

const CATEGORIES: ToolbarCategory[] = [...row1, ...row2];
```

with:

```ts
import categoriesData from '../../data/toolbar/categories.json';
import type { ToolbarCategory } from '../../types';
import { SectionLabel } from './section-label';

const CATEGORIES = categoriesData satisfies ToolbarCategory[];
```

(Leave the rest of the file — `GridCatButton`, `SymbolGrid`, etc. — unchanged; `CATEGORIES` is used the same way.)

- [ ] **Step 6: Verify build, lint, and types**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: all three pass with no errors.

- [ ] **Step 7: Manual regression check — SymbolGrid renders correctly**

Run: `pnpm dev`, open the app, hover/click each of the 17 category tiles in the rail's "Symbols & structures" grid, and confirm the flyout palettes still show the same items as before (spot-check `relations`, `matrices`, and `decorations` — the latter has `isSpace` entries which must still render as gap-bars).

- [ ] **Step 8: Commit**

```bash
git add src/data/toolbar/categories.json src/data/quick.json src/components/Rail/symbol-grid.tsx
git rm src/data/toolbar/row1.ts src/data/toolbar/row2.ts src/data/quick.ts
git commit -m "chore(data): convert toolbar categories and quick items to JSON"
```

---

## Task 3: `Kbd` shared primitive

**Files:**
- Create: `src/components/ui/kbd.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/ui/kbd.tsx`:

```tsx
import type { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-ink-200 bg-surface px-1 font-mono text-[10px] text-ink-500">
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Verify types and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors (file is currently unused, which is fine — it has no unused *local* symbols).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/kbd.tsx
git commit -m "feat(ui): add Kbd keyboard-hint primitive"
```

---

## Task 4: `CommandPalette` component

**Files:**
- Create: `src/components/CommandPalette/command-palette.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/CommandPalette/command-palette.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { MathGlyph } from '../ui/math-glyph';
import { Kbd } from '../ui/kbd';
import categoriesData from '../../data/toolbar/categories.json';
import quickData from '../../data/quick.json';
import algebra from '../../data/expressions/algebra.json';
import calculus from '../../data/expressions/calculus.json';
import statistics from '../../data/expressions/statistics.json';
import matrices from '../../data/expressions/matrices.json';
import sets from '../../data/expressions/sets.json';
import trig from '../../data/expressions/trig.json';
import geometry from '../../data/expressions/geometry.json';
import more from '../../data/expressions/more.json';
import { EXPRESSION_TAB_IDS, EXPRESSION_TAB_LABELS } from '../../types';
import type { ExpressionItem, ExpressionTabId, PaletteItem, ToolbarCategory } from '../../types';

const CATEGORIES = categoriesData satisfies ToolbarCategory[];
const QUICK = quickData satisfies PaletteItem[];

const EXPRESSION_TABS: Record<ExpressionTabId, { items: ExpressionItem[] }> = {
  algebra,
  calculus,
  statistics,
  matrices,
  sets,
  trig,
  geometry,
  more,
};

interface IndexEntry {
  latex: string;
  name: string;
  group: string;
  isTemplate: boolean;
}

function buildIndex(): IndexEntry[] {
  const out: IndexEntry[] = [];

  for (const category of CATEGORIES) {
    for (const item of category.palette) {
      if (item.isSpace) continue;
      out.push({
        latex: item.latex,
        name: item.tooltip,
        group: category.tooltip,
        isTemplate: !!item.isTemplate,
      });
    }
  }

  for (const item of QUICK) {
    out.push({ latex: item.latex, name: item.tooltip, group: 'Common', isTemplate: !!item.isTemplate });
  }

  for (const id of EXPRESSION_TAB_IDS) {
    for (const item of EXPRESSION_TABS[id].items) {
      out.push({ latex: item.latex, name: item.label, group: EXPRESSION_TAB_LABELS[id], isTemplate: true });
    }
  }

  const seen = new Set<string>();
  const dedup: IndexEntry[] = [];
  for (const entry of out) {
    const key = `${entry.latex}|${entry.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(entry);
    }
  }
  return dedup;
}

function score(entry: IndexEntry, needle: string): number {
  const name = entry.name.toLowerCase();
  const latex = entry.latex.toLowerCase();
  const group = entry.group.toLowerCase();
  if (name === needle) return 0;
  if (name.startsWith(needle)) return 1;
  if (latex.replace(/\\/g, '').startsWith(needle)) return 2;
  if (name.includes(needle)) return 3;
  if (latex.includes(needle)) return 4;
  if (group.includes(needle)) return 5;
  return 99;
}

interface ResultGroup {
  group: string;
  items: IndexEntry[];
}

function groupResults(results: IndexEntry[]): ResultGroup[] {
  const groups: ResultGroup[] = [];
  const map = new Map<string, IndexEntry[]>();
  for (const entry of results) {
    let bucket = map.get(entry.group);
    if (!bucket) {
      bucket = [];
      map.set(entry.group, bucket);
      groups.push({ group: entry.group, items: bucket });
    }
    bucket.push(entry);
  }
  return groups;
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 pb-1 pt-3 first:pt-1.5">
      <span className="select-none text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-ink-200/70" />
    </div>
  );
}

interface ResultRowProps {
  entry: IndexEntry;
  active: boolean;
  onSelect: (entry: IndexEntry) => void;
  onHover: () => void;
}

function ResultRow({ entry, active, onSelect, onHover }: ResultRowProps) {
  return (
    <button
      type="button"
      data-active={active}
      onMouseEnter={onHover}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(entry)}
      className={
        'flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors ' +
        (active ? 'bg-primary-soft' : 'hover:bg-ink-50')
      }
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1 leading-tight">
        <span className={'truncate text-[13px] font-medium ' + (active ? 'text-primary' : 'text-ink-800')}>
          {entry.name}
        </span>
        <span className="truncate font-mono text-[11px] text-ink-400">{entry.latex}</span>
      </span>
      <span
        className={
          'flex w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-lg border px-2 py-3 text-[16px] ' +
          (active ? 'border-primary/30 bg-surface' : 'border-ink-200 bg-ink-50')
        }
      >
        <MathGlyph latex={entry.latex} className={active ? 'text-primary' : 'text-ink-700'} />
      </span>
      {active && (
        <span className="shrink-0 text-ink-400">
          <Kbd>
            <CornerDownLeft size={9} />
          </Kbd>
        </span>
      )}
    </button>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
}

export function CommandPalette({ open, onClose, onInsert }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const index = useMemo(buildIndex, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onWindowKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [open, onClose]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return index.filter((entry) => entry.group === 'Common' || entry.isTemplate).slice(0, 36);
    }
    return index
      .map((entry) => ({ entry, s: score(entry, needle) }))
      .filter((x) => x.s < 99)
      .sort((a, b) => a.s - b.s)
      .slice(0, 48)
      .map((x) => x.entry);
  }, [query, index]);

  const grouped = useMemo(() => groupResults(results), [results]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    if (el && listRef.current) {
      const container = listRef.current;
      const itemRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (itemRect.bottom > containerRect.bottom) {
        container.scrollTop += itemRect.bottom - containerRect.bottom;
      } else if (itemRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - itemRect.top;
      }
    }
  }, [active]);

  if (!open) return null;

  function choose(entry: IndexEntry | undefined) {
    if (!entry) return;
    onInsert(entry.latex);
    onClose();
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  let flatIndex = 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh]">
      <div className="ee-anim-fade absolute inset-0 bg-ink-900/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="ee-anim-pop relative w-full max-w-[640px] overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-pop">
        <div className="flex items-center gap-2.5 border-b border-ink-200 px-3.5 py-3">
          <span className="text-ink-400">
            <Search size={16} />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search symbols, templates & formulas…"
            className="flex-1 bg-transparent text-[14px] text-ink-900 outline-none placeholder:text-ink-400"
          />
          <Kbd>esc</Kbd>
        </div>

        <div ref={listRef} className="ee-scroll max-h-[56vh] overflow-y-auto px-1.5 py-2">
          {results.length === 0 ? (
            <div className="px-3 py-10 text-center text-[12.5px] text-ink-400">
              No matches for &quot;{query}&quot;
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group}>
                <GroupHeader label={group} />
                {items.map((entry) => {
                  const i = flatIndex++;
                  return (
                    <ResultRow
                      key={entry.latex + '|' + entry.name}
                      entry={entry}
                      active={i === active}
                      onSelect={choose}
                      onHover={() => setActive(i)}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-ink-200 bg-ink-50 px-3 py-2 text-[10.5px] text-ink-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft size={9} />
              </Kbd>{' '}
              insert
            </span>
          </div>
          <span className="font-mono">
            {results.length} result{results.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: Verify types and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors. (The component is unused until Task 5, but it has no unused locals/params itself.)

- [ ] **Step 3: Commit**

```bash
git add src/components/CommandPalette/command-palette.tsx
git commit -m "feat: add CommandPalette component"
```

---

## Task 5: Wire `CommandPalette` into `App`

**Files:**
- Modify: `src/app.tsx`
- Modify: `src/components/Rail/rail-column.tsx` (no signature change — `onOpenPalette` prop already exists)

- [ ] **Step 1: Add `paletteOpen` state and import**

In `src/app.tsx`, add the import near the other component imports:

```ts
import { CommandPalette } from './components/CommandPalette/command-palette';
```

Add the state declaration alongside the existing `useState` calls:

```ts
let [paletteOpen, setPaletteOpen] = useState(false);
```

- [ ] **Step 2: Add the `⌘K`/`Ctrl+K` handler**

In `src/app.tsx`, the existing keydown `useEffect` is:

```ts
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

Replace it with:

```ts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPreviewOpen((v) => !v);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
```

- [ ] **Step 3: Wire `onOpenPalette` and mount `CommandPalette`**

In `src/app.tsx`, change:

```tsx
            onOpenPalette={() => {}}
```

to:

```tsx
            onOpenPalette={() => setPaletteOpen(true)}
```

Then, as a sibling of the existing `<div className="flex h-full w-full max-w-[1200px] ...">` (i.e. directly inside the root `<div className="flex h-dvh w-full items-stretch justify-center p-4 sm:p-5">`, after that inner div closes), add:

```tsx
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onInsert={handleInsert}
        />
```

So the end of the returned JSX looks like:

```tsx
      <div className="flex h-full w-full max-w-[1200px] flex-col overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-[0_18px_50px_-22px_rgba(54,24,92,0.32)]">
        {/* ... existing content unchanged ... */}
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onInsert={handleInsert}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify build, lint, and types**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: all three pass with no errors.

- [ ] **Step 5: Manual smoke test**

Run: `pnpm dev`, open the app in a browser, and verify:
- `⌘K` (or `Ctrl+K`) opens the palette; pressing it again closes it.
- The rail header's search icon-button (top-right of Col 1) opens the palette.
- With an empty query, results show "Common" items and template entries (max 36), grouped with headers.
- Typing (e.g. "frac", "sum", "pi") filters and re-ranks results live; the result count in the footer updates.
- `↑`/`↓` move the active row (highlighted, with a trailing `↵` `Kbd`); the active row auto-scrolls into view when navigating past the visible area.
- `Enter` inserts the active row's LaTeX into the editor and closes the palette.
- Clicking a result row inserts it and closes the palette.
- `Escape` closes the palette (test both while focused in the input and after clicking elsewhere).
- Clicking the dark backdrop closes the palette.
- An unmatched query (e.g. "zzzzz") shows the `No matches for "zzzzz"` empty state.

- [ ] **Step 6: Commit**

```bash
git add src/app.tsx
git commit -m "feat: wire CommandPalette into App with ⌘K toggle"
```

---

## Out of scope (per spec)

`hasSelection` / `ContextToolbar` (Phase 5). Editor column rebuild (Phase 5). Preview column styling, footer `ActionBar` restyle (Phase 6).
