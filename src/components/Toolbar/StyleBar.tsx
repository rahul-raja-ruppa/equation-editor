import { useState } from 'react'
import styles from './StyleBar.module.css'

interface StyleBarProps {
  fontSize: number
  onFontSizeChange: (size: number) => void
}

const SIZE_MIN = 6
const SIZE_MAX = 72

const COLOR_DOTS = [
  { color: '#1f2937', label: 'Black' },
  { color: '#dc2626', label: 'Red' },
  { color: '#2563eb', label: 'Blue' },
  { color: '#16a34a', label: 'Green' },
]

export function StyleBar({ fontSize, onFontSizeChange }: StyleBarProps) {
  let [autoItalic, setAutoItalic] = useState(true)
  let [bold, setBold] = useState(false)
  let [italic, setItalic] = useState(false)

  function decSize() {
    if (fontSize > SIZE_MIN) onFontSizeChange(fontSize - 1)
  }

  function incSize() {
    if (fontSize < SIZE_MAX) onFontSizeChange(fontSize + 1)
  }

  return (
    <div className={styles.styleBar}>
      <button
        className={`${styles.styleBtn} ${autoItalic ? styles.active : ''}`}
        onClick={() => setAutoItalic(!autoItalic)}
        title="Auto-italic"
      >
        <em>x</em> Auto-italic
      </button>

      <button
        className={`${styles.styleBtn} ${bold ? styles.active : ''}`}
        onClick={() => setBold(!bold)}
        title="Bold"
      >
        <strong>B</strong>
      </button>

      <button
        className={`${styles.styleBtn} ${italic ? styles.active : ''}`}
        onClick={() => setItalic(!italic)}
        title="Italic"
      >
        <em>I</em>
      </button>

      <div className={styles.separator} />

      <div className={styles.sizeControl}>
        <button className={styles.sizeArrow} onClick={decSize} title="Decrease size">▼</button>
        <span className={styles.sizeDisplay}>{fontSize}</span>
        <button className={styles.sizeArrow} onClick={incSize} title="Increase size">▲</button>
      </div>

      <div className={styles.separator} />

      {COLOR_DOTS.map(({ color, label }) => (
        <button
          key={color}
          className={styles.colorDot}
          style={{ backgroundColor: color }}
          title={label}
          aria-label={label}
        />
      ))}
    </div>
  )
}
