import { useFlyout } from '../../hooks/useFlyout'
import { CategoryButton } from './CategoryButton'
import row1 from '../../data/toolbar/row1'
import row2 from '../../data/toolbar/row2'
import styles from './ToolbarZone.module.css'

interface ToolbarZoneProps {
  onInsert: (latex: string) => void
}

export function ToolbarZone({ onInsert }: ToolbarZoneProps) {
  const { openId, position, open, close } = useFlyout()

  return (
    <div className={styles.zone}>
      <div className={styles.row}>
        {row1.map((cat) => (
          <CategoryButton
            key={cat.id}
            category={cat}
            isOpen={openId === cat.id}
            onOpen={open}
            onClose={close}
            onInsert={onInsert}
            position={position}
          />
        ))}
      </div>
      <div className={styles.row}>
        {row2.map((cat) => (
          <CategoryButton
            key={cat.id}
            category={cat}
            isOpen={openId === cat.id}
            onOpen={open}
            onClose={close}
            onInsert={onInsert}
            position={position}
          />
        ))}
      </div>
    </div>
  )
}
