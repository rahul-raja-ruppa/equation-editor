import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'
import type { FlyoutPosition } from '../../hooks/useFlyout'
import type { PaletteItem } from '../../types'
import { MathPreview } from '../MathPreview/MathPreview'
import styles from './FlyoutPalette.module.css'

const GAP = 5
const VIEWPORT_MARGIN = 8
const PALETTE_PADDING = 18
const STANDARD_ITEM_WIDTH = 44
const TEMPLATE_ITEM_WIDTH = 74
const MATRIX_ITEM_WIDTH = 112
const ITEM_HEIGHT = 42

function getViewportSize() {
  if (typeof window === 'undefined') return { width: 360, height: 640 }

  return { width: window.innerWidth, height: window.innerHeight }
}

interface FlyoutPaletteProps {
  items: PaletteItem[]
  position: FlyoutPosition
  onInsert: (latex: string) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function FlyoutPalette({
  items,
  position,
  onInsert,
  onMouseEnter,
  onMouseLeave,
}: FlyoutPaletteProps) {
  const [viewport, setViewport] = useState(getViewportSize)
  const viewportWidth = viewport.width
  const viewportHeight = viewport.height

  useEffect(() => {
    function handleResize() {
      setViewport(getViewportSize())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const availableWidth = Math.max(180, viewportWidth - VIEWPORT_MARGIN * 2)
  const hasTemplates = items.some((item) => item.isTemplate)
  const hasMatrixTemplates = items.some((item) => /\\begin\{[pbv]?matrix\}/.test(item.latex))
  const itemWidth = hasMatrixTemplates ? MATRIX_ITEM_WIDTH : hasTemplates ? TEMPLATE_ITEM_WIDTH : STANDARD_ITEM_WIDTH
  const maxColumns = hasTemplates ? 3 : 6
  const columns = Math.max(
    1,
    Math.min(items.length, maxColumns, Math.floor((availableWidth - PALETTE_PADDING + GAP) / (itemWidth + GAP))),
  )
  const paletteWidth = Math.min(availableWidth, PALETTE_PADDING + columns * itemWidth + (columns - 1) * GAP)
  const rows = Math.ceil(items.length / columns)
  const estimatedHeight = PALETTE_PADDING + rows * ITEM_HEIGHT + (rows - 1) * GAP
  const belowTop = position.top + 4
  const aboveTop = Math.max(VIEWPORT_MARGIN, position.top - estimatedHeight - 8)
  const top =
    belowTop + estimatedHeight <= viewportHeight - VIEWPORT_MARGIN || belowTop <= viewportHeight / 2
      ? Math.min(belowTop, viewportHeight - VIEWPORT_MARGIN - Math.min(estimatedHeight, viewportHeight - VIEWPORT_MARGIN * 2))
      : aboveTop
  const preferredLeft = position.left + position.anchorWidth / 2 - paletteWidth / 2
  const left = Math.min(Math.max(preferredLeft, VIEWPORT_MARGIN), viewportWidth - paletteWidth - VIEWPORT_MARGIN)
  const style = {
    top,
    left,
    width: paletteWidth,
    maxHeight: viewportHeight - VIEWPORT_MARGIN * 2,
    ['--flyout-columns' as string]: columns,
    ['--flyout-item-width' as string]: `${itemWidth}px`,
  } as CSSProperties

  function handleClick(latex: string) {
    onInsert(latex)
    // palette stays open — user may insert multiple symbols
  }

  return createPortal(
    <div
      className={styles.palette}
      style={style}
      data-flyout="true"
      role="dialog"
      aria-label="Symbol palette"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, i) => (
        <button
          key={i}
          className={item.isTemplate ? `${styles.item} ${styles.template}` : styles.item}
          title={item.tooltip}
          onClick={() => handleClick(item.latex)}
          type="button"
        >
          <MathPreview latex={item.latex} />
        </button>
      ))}
    </div>,
    document.body,
  )
}
