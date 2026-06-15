import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import type { FlyoutPosition } from '../../hooks/use-flyout';
import type { PaletteItem } from '../../types';
import { MathGlyph } from '../ui/math-glyph';

const GAP = 5;
const VIEWPORT_MARGIN = 8;
const PALETTE_PADDING = 18;
const STANDARD_ITEM_WIDTH = 44;
const TEMPLATE_ITEM_WIDTH = 54;
const MATRIX_ITEM_WIDTH = 64;
const ITEM_HEIGHT = 42;

function getViewportSize() {
  if (typeof window === 'undefined') return { width: 360, height: 640 };
  return { width: window.innerWidth, height: window.innerHeight };
}

const SPACE_WIDTHS: Record<string, number> = { thin: 6, med: 12, quad: 20, qquad: 30 };

function SpaceVisual({ size }: { size?: string }) {
  const w = (size && SPACE_WIDTHS[size]) || 10;
  return (
    <span className="flex items-center gap-[3px] text-ink-400 group-hover:text-primary">
      <span className="h-3.5 w-px bg-current opacity-70" />
      <span style={{ width: w }} className="h-px bg-current opacity-50" />
      <span className="h-3.5 w-px bg-current opacity-70" />
    </span>
  );
}

interface FlyoutPaletteProps {
  label: string;
  items: PaletteItem[];
  position: FlyoutPosition;
  onInsert: (latex: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function FlyoutPalette({
  label,
  items,
  position,
  onInsert,
  onMouseEnter,
  onMouseLeave,
}: FlyoutPaletteProps) {
  const [viewport, setViewport] = useState(getViewportSize);
  const viewportWidth = viewport.width;
  const viewportHeight = viewport.height;

  useEffect(() => {
    function handleResize() {
      setViewport(getViewportSize());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const availableWidth = Math.max(180, viewportWidth - VIEWPORT_MARGIN * 2);
  const hasTemplates = items.some((item) => item.isTemplate);
  const hasMatrixTemplates = items.some((item) => /\\begin\{[pbv]?matrix\}/.test(item.latex));
  const itemWidth = hasMatrixTemplates
    ? MATRIX_ITEM_WIDTH
    : hasTemplates
      ? TEMPLATE_ITEM_WIDTH
      : STANDARD_ITEM_WIDTH;
  const maxColumns = hasMatrixTemplates ? 3 : hasTemplates ? 4 : 6;
  const columns = Math.max(
    1,
    Math.min(
      items.length,
      maxColumns,
      Math.floor((availableWidth - PALETTE_PADDING + GAP) / (itemWidth + GAP))
    )
  );
  const paletteWidth = Math.min(
    availableWidth,
    PALETTE_PADDING + columns * itemWidth + (columns - 1) * GAP
  );
  const rows = Math.ceil(items.length / columns);
  const estimatedHeight = PALETTE_PADDING + rows * ITEM_HEIGHT + (rows - 1) * GAP;
  const belowTop = position.top + 4;
  const aboveTop = Math.max(VIEWPORT_MARGIN, position.top - estimatedHeight - 8);
  const top =
    belowTop + estimatedHeight <= viewportHeight - VIEWPORT_MARGIN || belowTop <= viewportHeight / 2
      ? Math.min(
          belowTop,
          viewportHeight -
            VIEWPORT_MARGIN -
            Math.min(estimatedHeight, viewportHeight - VIEWPORT_MARGIN * 2)
        )
      : aboveTop;
  const preferredLeft = position.left + position.anchorWidth / 2 - paletteWidth / 2;
  const left = Math.min(
    Math.max(preferredLeft, VIEWPORT_MARGIN),
    viewportWidth - paletteWidth - VIEWPORT_MARGIN
  );
  const style: CSSProperties = {
    top,
    left,
    width: paletteWidth,
    maxHeight: viewportHeight - VIEWPORT_MARGIN * 2,
  };
  const glyphSize = hasMatrixTemplates ? 13 : hasTemplates ? 17 : 19;

  return createPortal(
    <div
      className="ee-anim-pop fixed z-50 overflow-auto rounded-xl border border-ink-200 bg-surface p-2 shadow-pop"
      style={style}
      data-flyout="true"
      role="dialog"
      aria-label={`${label} palette`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="mb-1.5 flex items-center justify-between px-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-500">
          {label}
        </span>
        <span className="text-[9.5px] font-medium tabular-nums text-ink-400">{items.length}</span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            title={item.tooltip}
            onClick={() => onInsert(item.latex)}
            style={{ height: ITEM_HEIGHT }}
            className={
              'group flex items-center justify-center overflow-hidden rounded-lg transition-colors duration-100 active:scale-[0.94] ' +
              (item.isTemplate ? 'hover:bg-primary-soft' : 'hover:bg-ink-100')
            }
          >
            {item.isSpace ? (
              <SpaceVisual size={item.spaceSize} />
            ) : (
              <MathGlyph
                latex={item.latex}
                style={{ fontSize: glyphSize }}
                className="text-ink-900 group-hover:text-primary"
              />
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
