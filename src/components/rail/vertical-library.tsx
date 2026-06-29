import { useEffect, useState } from 'react';
import {
  EXPRESSION_TAB_IDS,
  EXPRESSION_TAB_LABELS,
  type ExpressionItem,
  type ExpressionTabId,
} from '../../types';
import { MathGlyph } from '../ui/math-glyph';
import { SectionLabel } from './section-label';

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
                <MathGlyph
                  latex={it.latex}
                  className="text-[15px] text-ink-800 group-hover:text-primary"
                />
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
