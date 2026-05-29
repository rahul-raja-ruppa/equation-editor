import type { FC } from 'react'
import styles from './QuickAccessBar.module.css'

interface QuickButtonProps {
  latex: string
  glyph: string
  tooltip: string
  variant?: 'symbol' | 'template'
  onInsert: (latex: string) => void
}

const QuickButton: FC<QuickButtonProps> = ({
  latex,
  glyph,
  tooltip,
  variant = 'symbol',
  onInsert,
}) => {
  let className = styles.btn
  if (variant === 'template') {
    className = `${styles.btn} ${styles.template}`
  }

  return (
    <button
      className={className}
      title={tooltip}
      onClick={() => onInsert(latex)}
    >
      {glyph}
    </button>
  )
}

export default QuickButton
