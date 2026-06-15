import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { OutboundMessage } from '../../types';

interface ToastProps {
  message: string;
  onDone: () => void;
}

function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="ee-anim-fade fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink-800 px-3 py-1.5 text-[11px] text-white shadow-pop">
      {message}
    </div>
  );
}

interface ActionBarProps {
  latex: string;
  mathType: 'display' | 'inline';
  fontSize: number;
  getLatex: () => string;
  getMathML: () => Promise<string>;
  send: (payload: OutboundMessage) => void;
  onCancel: () => void;
}

type InsertStatus = 'idle' | 'loading' | 'inserted';

export function ActionBar({
  latex,
  mathType,
  fontSize,
  getLatex,
  getMathML,
  send,
  onCancel,
}: ActionBarProps) {
  let [status, setStatus] = useState<InsertStatus>('idle');
  let [toastMsg, setToastMsg] = useState<string | null>(null);

  const hasContent = latex.trim().length > 0;

  async function handleInsert() {
    if (!hasContent || status === 'loading') return;
    setStatus('loading');
    try {
      const latexVal = getLatex();
      const mathml = await getMathML();
      send({ type: 'insert', latex: latexVal, mathml, fontSize, mathType });
      setStatus('inserted');
      window.setTimeout(() => setStatus('idle'), 900);
    } catch (err) {
      setStatus('idle');
      setToastMsg((err as Error).message || 'Failed to generate MathML');
    }
  }

  return (
    <>
      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg(null)} />}
      <div className="flex min-h-[46px] items-center gap-3 border-t border-ink-200 bg-surface px-3.5 py-2">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
              hasContent ? 'bg-success' : 'bg-ink-300'
            }`}
          />
          <span className="text-[10px] text-ink-500">
            {hasContent ? 'MathML & LaTeX ready' : 'Empty equation'}
          </span>
          <span className="font-mono text-[10px] text-ink-400 max-sm:hidden">
            {mathType} · {fontSize}pt
          </span>
        </div>

        {/* Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-ink-200 px-3.5 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!hasContent || status === 'loading'}
            className={`flex min-w-[80px] items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-[12px] font-semibold transition-all disabled:cursor-default disabled:shadow-none ${
              hasContent
                ? 'bg-primary text-white shadow-[0_8px_18px_-10px_rgba(104,0,214,0.6)] hover:-translate-y-px hover:bg-primary-dark active:scale-[0.97] active:shadow-none'
                : 'cursor-default bg-ink-200 text-ink-400'
            }`}
          >
            {status === 'inserted' ? (
              <>
                <Check size={13} />
                Inserted
              </>
            ) : status === 'loading' ? (
              'Inserting…'
            ) : (
              'Insert'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
