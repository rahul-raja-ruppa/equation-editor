import { useRef } from 'react'
import type { ToolbarCategory } from '../../types'
import type { FlyoutPosition } from '../../hooks/useFlyout'
import { FlyoutPalette } from './FlyoutPalette'
import styles from './CategoryButton.module.css'

interface CategoryButtonProps {
  category: ToolbarCategory
  isOpen: boolean
  onOpen: (id: string, rect: DOMRect) => void
  onClose: () => void
  onInsert: (latex: string) => void
  position: FlyoutPosition
}

export function CategoryButton({
  category,
  isOpen,
  onOpen,
  onClose,
  onInsert,
  position,
}: CategoryButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleClick() {
    if (isOpen) {
      onClose()
    } else {
      const rect = btnRef.current?.getBoundingClientRect()
      if (rect) onOpen(category.id, rect)
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        className={isOpen ? `${styles.btn} ${styles.open}` : styles.btn}
        title={category.tooltip}
        onClick={handleClick}
        type="button"
        data-category-btn="true"
      >
        {category.glyph}
        <span className={styles.chevron}>▾</span>
      </button>
      {isOpen && (
        <FlyoutPalette
          items={category.palette}
          position={position}
          onInsert={onInsert}
        />
      )}
    </>
  )
}
