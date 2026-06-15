import { useCallback, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useFlyout } from '../../hooks/use-flyout';
import { FlyoutPalette } from '../toolbar/flyout-palette';
import { MathGlyph } from '../ui/math-glyph';
import categoriesData from '../../data/toolbar/categories.json';
import type { ToolbarCategory } from '../../types';
import { SectionLabel } from './section-label';

const CATEGORIES = categoriesData satisfies ToolbarCategory[];

interface GridCatButtonProps {
  category: ToolbarCategory;
  isOpen: boolean;
  onOpen: (id: string, rect: DOMRect) => void;
  onScheduleClose: () => void;
}

function GridCatButton({ category, isOpen, onOpen, onScheduleClose }: GridCatButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const open = () => {
    if (ref.current) onOpen(category.id, ref.current.getBoundingClientRect());
  };
  return (
    <button
      ref={ref}
      type="button"
      title={category.tooltip}
      onMouseEnter={open}
      onMouseLeave={onScheduleClose}
      onFocus={open}
      onClick={open}
      aria-expanded={isOpen}
      data-category-btn="true"
      className={
        'group relative flex h-[40px] items-center justify-center overflow-hidden rounded-lg border transition-colors duration-150 ' +
        (isOpen
          ? 'border-primary/40 bg-primary-soft'
          : 'border-ink-200 bg-surface hover:border-ink-300 hover:bg-ink-50')
      }
    >
      <MathGlyph
        latex={category.icon}
        className={'text-[17px] ' + (isOpen ? 'text-primary' : 'text-ink-900 group-hover:text-primary')}
      />
      <span
        className={
          'absolute bottom-[1px] right-[2px] transition-transform duration-150 ' +
          (isOpen ? 'rotate-180 text-primary' : 'text-ink-300 group-hover:text-ink-500')
        }
      >
        <ChevronDown size={9} strokeWidth={2.2} />
      </span>
    </button>
  );
}

export function SymbolGrid({ onInsert }: { onInsert: (latex: string) => void }) {
  const { openId, position, open, close } = useFlyout();
  const closeTimer = useRef<number | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      close();
      closeTimer.current = null;
    }, 180);
  }, [cancelClose, close]);

  const openCategory = useCallback(
    (id: string, rect: DOMRect) => {
      cancelClose();
      open(id, rect);
    },
    [cancelClose, open]
  );

  useEffect(() => cancelClose, [cancelClose]);

  const openCat = CATEGORIES.find((c) => c.id === openId);

  return (
    <div>
      <SectionLabel>Symbols &amp; structures</SectionLabel>
      <div className="grid grid-cols-6 gap-1">
        {CATEGORIES.map((cat) => (
          <GridCatButton
            key={cat.id}
            category={cat}
            isOpen={openId === cat.id}
            onOpen={openCategory}
            onScheduleClose={scheduleClose}
          />
        ))}
      </div>
      {openCat && (
        <FlyoutPalette
          label={openCat.tooltip}
          items={openCat.palette}
          position={position}
          onInsert={onInsert}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        />
      )}
    </div>
  );
}
