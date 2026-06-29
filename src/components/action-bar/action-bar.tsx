import { useState, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { OutboundMessage } from '../../types';
import { getLatexErrorInfo } from '../../lib/latex-validation';
import { Toast } from '../ui/toast';

export type InsertStatus = 'idle' | 'loading';

interface ActionBarProps {
  latex: string;
  mathType: 'display' | 'inline';
  fontSize: number;
  getLatex: () => string;
  getMathML: () => Promise<string>;
  send: (payload: OutboundMessage) => void;
  onCancel: () => void;
  insertStatus: InsertStatus;
  onInsertStatusChange: (s: InsertStatus) => void;
}

export function ActionBar({
  latex,
  mathType,
  fontSize,
  getLatex,
  getMathML,
  send,
  onCancel,
  insertStatus,
  onInsertStatusChange,
}: ActionBarProps) {
  let [toastMsg, setToastMsg] = useState<string | null>(null);

  const clearToast = useCallback(() => setToastMsg(null), []);

  const hasContent = latex.trim().length > 0;
  const isLoading = insertStatus === 'loading';

  const hasLatexError = useMemo(
    () => hasContent && getLatexErrorInfo(latex) !== null,
    [hasContent, latex]
  );

  async function handleInsert() {
    if (!hasContent || isLoading) return;
    onInsertStatusChange('loading');
    try {
      const latexVal = getLatex();
      const mathml = await getMathML();
      send({ type: 'insert', latex: latexVal, mathml, fontSize, mathType });
      // Stay in 'loading' — parent sends insert-success or insert-error to resolve
    } catch (err) {
      onInsertStatusChange('idle');
      setToastMsg((err as Error).message || 'Failed to generate MathML');
    }
  }

  return (
    <>
      {toastMsg && <Toast message={toastMsg} onDone={clearToast} />}
      <div className="flex min-h-[46px] items-center gap-3 border-t border-ink-200 bg-surface px-3.5 py-2">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
              !hasContent ? 'bg-ink-300' : hasLatexError ? 'bg-danger' : 'bg-success'
            }`}
          />
          <span
            className={`text-[10px] ${hasContent && hasLatexError ? 'text-danger' : 'text-ink-500'}`}
          >
            {!hasContent
              ? 'Empty equation'
              : hasLatexError
                ? 'Invalid LaTeX syntax'
                : 'MathML & LaTeX ready'}
          </span>
        </div>

        {/* Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-ink-200 px-3.5 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors disabled:cursor-default disabled:opacity-40 hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!hasContent || isLoading}
            className={`flex w-[90px] items-center justify-center gap-1.5 rounded-md border px-3.5 py-1.5 text-[12px] font-semibold transition-all disabled:cursor-default disabled:shadow-none ${
              hasContent
                ? 'border-primary bg-primary text-white shadow-[0_8px_18px_-10px_rgba(104,0,214,0.6)] hover:-translate-y-px hover:bg-primary-dark active:scale-[0.97] active:shadow-none disabled:opacity-70'
                : 'cursor-default border-transparent bg-ink-200 text-ink-400'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Inserting…
              </>
            ) : (
              'Insert'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
