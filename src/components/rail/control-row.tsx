import { Eye, EyeOff } from 'lucide-react';

const SIZE_OPTIONS = [10, 11, 12, 14, 16, 18];

interface ControlRowProps {
  mathType: 'display' | 'inline';
  onMathType: (v: 'display' | 'inline') => void;
  fontSize: number;
  onFontSize: (v: number) => void;
  previewOpen: boolean;
  onPreviewToggle: () => void;
}

function PreviewToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      title={on ? 'Hide live preview (⌘P)' : 'Show live preview (⌘P)'}
      className={
        'flex h-[30px] items-center gap-2 rounded-md border px-2 transition-colors ' +
        (on
          ? 'border-secondary/40 bg-secondary-soft text-secondary'
          : 'border-ink-200 bg-surface text-ink-500 hover:bg-ink-50')
      }
    >
      {on ? <Eye size={14} strokeWidth={1.75} /> : <EyeOff size={14} strokeWidth={1.75} />}
      <span
        className={
          'relative h-[15px] w-[26px] shrink-0 rounded-full transition-colors duration-200 ' +
          (on ? 'bg-secondary' : 'bg-ink-300')
        }
      >
        <span
          className={
            'absolute top-[2px] h-[11px] w-[11px] rounded-full bg-white shadow-sm transition-all duration-200 ease-snap ' +
            (on ? 'left-[13px]' : 'left-[2px]')
          }
        />
      </span>
    </button>
  );
}

function MathTypeToggle({
  value,
  onChange,
}: {
  value: 'display' | 'inline';
  onChange: (v: 'display' | 'inline') => void;
}) {
  const opts: { value: 'display' | 'inline'; label: string }[] = [
    { value: 'display', label: 'Display' },
    { value: 'inline', label: 'Inline' },
  ];
  const idx = opts.findIndex((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      className="relative inline-grid h-[30px] grid-cols-2 items-stretch rounded-md bg-ink-100 p-[3px] ring-1 ring-inset ring-ink-200/70"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[3px] bottom-[3px] rounded-[5px] bg-surface shadow-xs ring-1 ring-ink-200/80 transition-[left] duration-200 ease-snap"
        style={{ width: 'calc(50% - 3px)', left: idx === 0 ? '3px' : '50%' }}
      />
      {opts.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={
              'relative z-10 flex items-center justify-center rounded-[5px] px-2.5 text-[11.5px] font-medium transition-colors duration-150 ' +
              (active ? 'text-primary' : 'text-ink-500 hover:text-ink-700')
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SizeSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex h-[30px] items-center gap-1.5 rounded-md border border-ink-200 bg-surface pl-2.5 pr-1.5 text-[11.5px] text-ink-600">
      <span className="text-ink-400">Size</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cursor-pointer appearance-none bg-transparent pr-3 text-[11.5px] font-medium text-ink-800 outline-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238c8398' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
        }}
      >
        {SIZE_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p} pt
          </option>
        ))}
      </select>
    </label>
  );
}

export function ControlRow({
  mathType,
  onMathType,
  fontSize,
  onFontSize,
  previewOpen,
  onPreviewToggle,
}: ControlRowProps) {
  return (
    <div className="flex items-center justify-between">
      <PreviewToggle on={previewOpen} onToggle={onPreviewToggle} />
      <MathTypeToggle value={mathType} onChange={onMathType} />
      <SizeSelect value={fontSize} onChange={onFontSize} />
    </div>
  );
}
