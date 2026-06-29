import { Fragment } from 'react';
import { MathGlyph } from '../ui/math-glyph';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface ContextAction {
  latex: string;
  tip: string;
  icon: string;
}

interface ContextGroup {
  label: string;
  items: ContextAction[];
}

const CTX_GROUPS: ContextGroup[] = [
  {
    label: 'Font',
    items: [
      { latex: '\\mathbf{#0}', tip: 'Bold', icon: '\\mathbf{A}' },
      { latex: '\\mathit{#0}', tip: 'Italic', icon: '\\mathit{A}' },
      { latex: '\\mathrm{#0}', tip: 'Roman', icon: '\\mathrm{A}' },
      { latex: '\\mathbb{#0}', tip: 'Blackboard bold', icon: '\\mathbb{A}' },
      { latex: '\\mathcal{#0}', tip: 'Calligraphic', icon: '\\mathcal{A}' },
      { latex: '\\mathfrak{#0}', tip: 'Fraktur', icon: '\\mathfrak{A}' },
      { latex: '\\mathsf{#0}', tip: 'Sans-serif', icon: '\\mathsf{A}' },
      { latex: '\\mathtt{#0}', tip: 'Typewriter', icon: '\\mathtt{A}' },
    ],
  },
  {
    label: 'Wrap',
    items: [
      { latex: '\\frac{#0}{#1}', tip: 'Fraction', icon: '\\frac{\\square}{\\square}' },
      { latex: '\\sqrt{#0}', tip: 'Square root', icon: '\\sqrt{\\square}' },
      { latex: '\\sqrt[#1]{#0}', tip: 'nth root', icon: '\\sqrt[n]{\\square}' },
      { latex: '\\left(#0\\right)', tip: 'Parentheses', icon: '(\\square)' },
      { latex: '\\left[#0\\right]', tip: 'Brackets', icon: '[\\square]' },
      { latex: '\\left\\{#0\\right\\}', tip: 'Braces', icon: '\\{\\square\\}' },
      { latex: '\\left|#0\\right|', tip: 'Absolute value', icon: '|\\square|' },
    ],
  },
  {
    label: 'Script',
    items: [
      { latex: '#0^{#1}', tip: 'Superscript', icon: '\\square^{n}' },
      { latex: '#0_{#1}', tip: 'Subscript', icon: '\\square_{n}' },
      { latex: '#0_{#1}^{#2}', tip: 'Sub & superscript', icon: '\\square_{n}^{m}' },
    ],
  },
  {
    label: 'Accent',
    items: [
      { latex: '\\vec{#0}', tip: 'Vector', icon: '\\vec{\\square}' },
      { latex: '\\hat{#0}', tip: 'Hat', icon: '\\hat{\\square}' },
      { latex: '\\bar{#0}', tip: 'Bar', icon: '\\bar{\\square}' },
      { latex: '\\dot{#0}', tip: 'Dot', icon: '\\dot{\\square}' },
      { latex: '\\overline{#0}', tip: 'Overline', icon: '\\overline{\\square}' },
      { latex: '\\underbrace{#0}_{#1}', tip: 'Underbrace', icon: '\\underbrace{\\square}' },
    ],
  },
];

interface ContextToolbarProps {
  visible: boolean;
  onAction: (latex: string) => void;
}

export function ContextToolbar({ visible, onAction }: ContextToolbarProps) {
  if (!visible) return null;

  return (
    <div className="ee-anim-pop ee-scroll absolute left-1/2 top-3 z-30 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-xl border border-ink-200 bg-surface p-1.5 shadow-pop">
      {CTX_GROUPS.map((group, gi) => (
        <Fragment key={group.label}>
          {gi > 0 && <span className="mx-0.5 h-6 w-px shrink-0 bg-ink-200" />}
          <span className="shrink-0 select-none px-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-ink-400">
            {group.label}
          </span>
          {group.items.map((item) => (
            <Tooltip key={item.tip}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onAction(item.latex)}
                  className="group flex h-[30px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-md hover:bg-primary-soft active:scale-[0.95]"
                >
                  <MathGlyph
                    latex={item.icon}
                    className="text-[13px] text-ink-800 group-hover:text-primary"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>{item.tip}</TooltipContent>
            </Tooltip>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
