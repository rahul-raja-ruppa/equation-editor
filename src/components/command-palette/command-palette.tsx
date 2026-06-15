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

const CATEGORIES: ToolbarCategory[] = categoriesData;
const QUICK: PaletteItem[] = quickData;

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

interface IndexedEntry {
  entry: IndexEntry;
  index: number;
}

interface ResultGroup {
  group: string;
  items: IndexedEntry[];
}

function groupResults(results: IndexEntry[]): ResultGroup[] {
  const groups: ResultGroup[] = [];
  const map = new Map<string, IndexedEntry[]>();
  results.forEach((entry, index) => {
    let bucket = map.get(entry.group);
    if (!bucket) {
      bucket = [];
      map.set(entry.group, bucket);
      groups.push({ group: entry.group, items: bucket });
    }
    bucket.push({ entry, index });
  });
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
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevQuery, setPrevQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const index = useMemo(() => buildIndex(), []);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setActive(0);
    }
  }

  if (query !== prevQuery) {
    setPrevQuery(query);
    setActive(0);
  }

  useEffect(() => {
    if (!open) return;
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
                {items.map(({ entry, index }) => (
                  <ResultRow
                    key={entry.latex + '|' + entry.name}
                    entry={entry}
                    active={index === active}
                    onSelect={choose}
                    onHover={() => setActive(index)}
                  />
                ))}
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
