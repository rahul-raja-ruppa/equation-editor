import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Check, Undo2, Redo2, Trash } from 'lucide-react';
import { IconBtn } from '../ui/icon-btn';
import { getLatexErrorInfo, type LatexErrorInfo } from '../../lib/latex-validation';

interface LaTeXPanelProps {
  value: string;
  onCommit: (latex: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

export function LaTeXPanel({ value, onCommit, onUndo, onRedo, onClear }: LaTeXPanelProps) {
  let [draft, setDraft] = useState(value);
  let [syncedValue, setSyncedValue] = useState(value);
  let [focused, setFocused] = useState(false);
  let [copied, setCopied] = useState(false);
  const revertingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  if (value !== syncedValue && !focused) {
    setDraft(value);
    setSyncedValue(value);
  }

  const errorInfo: LatexErrorInfo | null = useMemo(
    () => (draft.trim() ? getLatexErrorInfo(draft) : null),
    [draft]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!errorInfo) {
      debounceRef.current = setTimeout(() => {
        onCommit(draft);
      }, 250);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft, onCommit, errorInfo]);

  function syncScroll() {
    if (mirrorRef.current && textareaRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
    } catch {
      // clipboard may be unavailable
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  const highlightStart = errorInfo?.start ?? -1;
  const highlightEnd = errorInfo?.end ?? -1;
  const hasHighlight = highlightStart >= 0 && highlightEnd > highlightStart;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[33px] shrink-0 items-center gap-2 border-b border-ink-200/70 pl-3 pr-1.5">
        <span className="select-none text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">
          LaTeX source
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn onClick={onUndo} label="Undo" sub="⌘Z">
            <Undo2 size={14} />
          </IconBtn>
          <IconBtn onClick={onRedo} label="Redo" sub="⌘⇧Z">
            <Redo2 size={14} />
          </IconBtn>
          <span className="mx-0.5 h-4 w-px bg-ink-200" />
          <IconBtn onClick={onClear} label="Clear all">
            <Trash size={13} />
          </IconBtn>
          <span className="mx-0.5 h-4 w-px bg-ink-200" />
          <IconBtn
            onClick={copy}
            label={copied ? 'Copied' : 'Copy LaTeX'}
            tone={copied ? 'success' : undefined}
          >
            {copied ? <Check size={14} /> : <Copy size={13} />}
          </IconBtn>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Mirror div — renders same text behind textarea for error highlighting */}
        {errorInfo && hasHighlight && (
          <div
            ref={mirrorRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3 py-2 font-mono text-[12px] leading-[1.55] text-transparent"
          >
            {draft.slice(0, highlightStart)}
            <span className="rounded-[2px] bg-danger/25 text-transparent">
              {draft.slice(highlightStart, highlightEnd) || ' '}
            </span>
            {draft.slice(highlightEnd)}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onScroll={syncScroll}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            setFocused(false);
            if (!revertingRef.current && !errorInfo) {
              onCommit(draft);
            }
            revertingRef.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (debounceRef.current) clearTimeout(debounceRef.current);
              if (!errorInfo) onCommit(draft);
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              revertingRef.current = true;
              setDraft(value);
              e.currentTarget.blur();
            }
          }}
          placeholder="Type LaTeX to see it rendered"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className={`ee-scroll relative min-h-0 flex-1 resize-none px-3 py-2 font-mono text-[12px] leading-[1.55] text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:shadow-[inset_0_0_0_1.5px_rgba(104,0,214,0.35)] ${
            errorInfo
              ? 'bg-transparent shadow-[inset_0_0_0_1.5px_rgba(255,51,51,0.5)] focus:shadow-[inset_0_0_0_1.5px_rgba(255,51,51,0.5)]'
              : 'bg-ink-50/50 focus:bg-surface'
          }`}
        />
        {errorInfo && (
          <div className="shrink-0 border-t border-danger/20 bg-danger-soft px-3 py-1.5 font-mono text-[10.5px] text-danger">
            {errorInfo.message}
          </div>
        )}
      </div>
    </div>
  );
}
