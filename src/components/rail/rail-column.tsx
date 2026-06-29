import { Search } from 'lucide-react';
import { KriyaLogomark } from '@/components/icons/kriya-logomark';
import { ControlRow } from './control-row';
import { SymbolGrid } from './symbol-grid';
import { VerticalLibrary } from './vertical-library';

interface RailColumnProps {
  mathType: 'display' | 'inline';
  onMathType: (v: 'display' | 'inline') => void;
  fontSize: number;
  onFontSize: (v: number) => void;
  previewOpen: boolean;
  onPreviewToggle: () => void;
  onOpenPalette: () => void;
  onInsert: (latex: string) => void;
}

export function RailColumn({
  mathType,
  onMathType,
  fontSize,
  onFontSize,
  previewOpen,
  onPreviewToggle,
  onOpenPalette,
  onInsert,
}: RailColumnProps) {
  return (
    <div className="flex w-[340px] shrink-0 flex-col border-r border-ink-200 bg-surface">
      {/* Header */}
      <div className="flex h-[48px] shrink-0 items-center gap-2 border-b border-ink-200 px-4">
        <KriyaLogomark className="h-[26px] w-[26px] shrink-0" />
        <span className="text-[13px] font-semibold tracking-[-0.01em] text-ink-900">
          Equation Editor
        </span>
        <div className="ml-auto">
          <button
            type="button"
            onClick={onOpenPalette}
            title="Search symbols & templates (⌘K)"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 active:scale-95"
          >
            <Search size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
        <ControlRow
          mathType={mathType}
          onMathType={onMathType}
          fontSize={fontSize}
          onFontSize={onFontSize}
          previewOpen={previewOpen}
          onPreviewToggle={onPreviewToggle}
        />
        <div className="h-px bg-ink-200/70" />
        <SymbolGrid onInsert={onInsert} />
        <div className="h-px bg-ink-200/70" />
        <VerticalLibrary onInsert={onInsert} />
      </div>
    </div>
  );
}
