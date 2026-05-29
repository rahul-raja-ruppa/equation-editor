import { createPortal } from 'react-dom'
import type { FlyoutPosition } from '../../hooks/useFlyout'
import type { PaletteItem } from '../../types'
import styles from './FlyoutPalette.module.css'

interface FlyoutPaletteProps {
  items: PaletteItem[]
  position: FlyoutPosition
  onInsert: (latex: string) => void
}

export function FlyoutPalette({ items, position, onInsert }: FlyoutPaletteProps) {
  const style = {
    top: position.top + 4,
    left: position.left,
  }

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
    >
      {items.map((item, i) => (
        <button
          key={i}
          className={item.isTemplate ? `${styles.item} ${styles.template}` : styles.item}
          title={item.tooltip}
          onClick={() => handleClick(item.latex)}
          type="button"
        >
          {item.display}
        </button>
      ))}
    </div>,
    document.body,
  )
}
