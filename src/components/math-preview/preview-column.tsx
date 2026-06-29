import { MathJaxPreview } from './mathjax-preview';

interface PreviewColumnProps {
  latex: string;
  mathType: 'display' | 'inline';
}

export function PreviewColumn({ latex, mathType }: PreviewColumnProps) {
  return (
    <div className="ee-anim-fade flex min-w-[260px] flex-1 flex-col border-l border-ink-200">
      <div className="flex h-[33px] shrink-0 items-center gap-2 border-b border-ink-200/70 px-3">
        <span className="select-none text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">
          Live preview
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          <span className="font-mono text-[9.5px] text-ink-400">MathJax</span>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1">
        {latex.trim() === '' ? (
          <div className="flex flex-1 items-center justify-center text-[12px] text-ink-400">
            Live preview appears here
          </div>
        ) : (
          <MathJaxPreview latex={latex} mathType={mathType} />
        )}
      </div>
    </div>
  );
}
