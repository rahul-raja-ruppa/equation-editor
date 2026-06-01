import { useEffect, useMemo, useRef, useState } from 'react';
import row1 from '../../data/toolbar/row1';
import row2 from '../../data/toolbar/row2';
import quick from '../../data/quick';
import { EXPRESSION_TAB_LABELS, type ExpressionItem, type ExpressionTabId } from '../../types';
import { MathPreview } from '../MathPreview/MathPreview';
import styles from './UtilityRow.module.css';

interface SearchResult {
  latex: string;
  name: string;
  group: string;
  isTemplate: boolean;
}

interface UtilityRowProps {
  mathType: 'display' | 'inline';
  onMathTypeChange: (v: 'display' | 'inline') => void;
  fontSize: number;
  onFontSizeChange: (v: number) => void;
  onInsert: (latex: string) => void;
  previewOpen: boolean;
  onPreviewToggle: () => void;
}

const SIZE_OPTIONS = [10, 11, 12, 14, 16, 18] as const;
const expressionModules = import.meta.glob('../../data/expressions/*.json');

function getTabId(path: string): ExpressionTabId {
  return path.split('/').pop()?.replace('.json', '') as ExpressionTabId;
}

export function UtilityRow({
  mathType,
  onMathTypeChange,
  fontSize,
  onFontSizeChange,
  onInsert,
  previewOpen,
  onPreviewToggle,
}: UtilityRowProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [libraryResults, setLibraryResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      Object.entries(expressionModules).map(([path, loader]) =>
        loader().then((mod) => {
          const tabId = getTabId(path);
          const payload = mod as { default: { items: ExpressionItem[] } };
          return payload.default.items.map((item) => ({
            latex: item.latex,
            name: item.label,
            group: EXPRESSION_TAB_LABELS[tabId],
            isTemplate: /#[0-9]/.test(item.latex),
          }));
        })
      )
    ).then((groups) => {
      if (!cancelled) setLibraryResults(groups.flat());
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        e.key === '/' &&
        target !== inputRef.current &&
        !target?.closest('input, textarea, math-field')
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const index = useMemo<SearchResult[]>(() => {
    const toolbar = [...row1, ...row2].flatMap((cat) =>
      cat.palette.map((item) => ({
        latex: item.latex,
        name: item.tooltip,
        group: cat.tooltip,
        isTemplate: !!item.isTemplate,
      }))
    );
    const quickResults = quick.map((item) => ({
      latex: item.latex,
      name: item.tooltip,
      group: 'Quick',
      isTemplate: !!item.isTemplate,
    }));

    return [...toolbar, ...quickResults, ...libraryResults];
  }, [libraryResults]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];

    const seen = new Set<string>();
    return index
      .filter((result) => {
        const haystack = `${result.name} ${result.latex} ${result.group}`.toLowerCase();
        const key = `${result.latex}:${result.name}`;
        if (!haystack.includes(needle) || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 24);
  }, [index, query]);

  function choose(result: SearchResult | undefined) {
    if (!result) return;
    onInsert(result.latex);
    setQuery('');
    setActive(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((value) => (results.length ? (value + 1 + results.length) % results.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((value) => (results.length ? (value - 1 + results.length) % results.length : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active < 0 ? 0 : active]);
    } else if (e.key === 'Escape') {
      setQuery('');
      setActive(-1);
      inputRef.current?.blur();
    }
  }

  return (
    <div className={styles.utility}>
      <div className={styles.search}>
        <div className={styles.field}>
          <svg
            className={styles.icon}
            aria-hidden="true"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.75" />
            <line
              x1="9.2"
              y1="9.2"
              x2="13"
              y2="13"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search symbols & templates..."
            aria-label="Search symbols and templates"
          />
          <span className={styles.kbd}>/</span>
        </div>
        {query && (
          <div className={styles.results}>
            {results.length ? (
              results.map((result, i) => (
                <button
                  key={`${result.latex}-${result.name}`}
                  type="button"
                  className={`${styles.result}${i === active ? ` ${styles.active}` : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(result)}
                >
                  <span className={styles.glyph}>
                    <MathPreview latex={result.latex} />
                  </span>
                  <span className={styles.meta}>
                    <span className={styles.name}>{result.name}</span>
                    <span className={styles.code}>{result.latex}</span>
                  </span>
                  <span className={result.isTemplate ? styles.templateTag : styles.groupTag}>
                    {result.isTemplate ? 'Template' : result.group}
                  </span>
                </button>
              ))
            ) : (
              <div className={styles.empty}>No symbols match "{query}"</div>
            )}
          </div>
        )}
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={previewOpen ? styles.previewBtnActive : styles.previewBtn}
          onClick={onPreviewToggle}
          title="Toggle MathJax preview"
        >
          ⚡ MathJax
        </button>
        <div className={styles.toggle} aria-label="Equation type">
          <button
            type="button"
            className={mathType === 'display' ? styles.selected : undefined}
            onClick={() => onMathTypeChange('display')}
          >
            Display
          </button>
          <button
            type="button"
            className={mathType === 'inline' ? styles.selected : undefined}
            onClick={() => onMathTypeChange('inline')}
          >
            Inline
          </button>
        </div>
        <label className={styles.size}>
          <span>Size</span>
          <select value={fontSize} onChange={(e) => onFontSizeChange(Number(e.target.value))}>
            {SIZE_OPTIONS.map((pt) => (
              <option key={pt} value={pt}>
                {pt} pt
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
