import { useRef, useState } from 'react';
import { Copy, Check, Undo2, Redo2, Trash } from 'lucide-react';
import { IconBtn } from '../ui/icon-btn';

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

  if (value !== syncedValue && !focused) {
    setDraft(value);
    setSyncedValue(value);
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
          <IconBtn onClick={copy} label={copied ? 'Copied' : 'Copy LaTeX'} tone={copied ? 'success' : undefined}>
            {copied ? <Check size={14} /> : <Copy size={13} />}
          </IconBtn>
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (!revertingRef.current) {
            onCommit(draft);
          }
          revertingRef.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onCommit(draft);
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            revertingRef.current = true;
            setDraft(value);
            e.currentTarget.blur();
          }
        }}
        placeholder="empty — type, click a symbol, or ⌘K"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className="ee-scroll min-h-0 flex-1 resize-none bg-ink-50/50 px-3 py-2 font-mono text-[12px] leading-[1.55] text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:bg-surface focus:shadow-[inset_0_0_0_1.5px_rgba(104,0,214,0.35)]"
      />
    </div>
  );
}
