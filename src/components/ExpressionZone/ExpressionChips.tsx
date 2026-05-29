import { useState, useEffect } from 'react'
import type { ExpressionTabId, ExpressionItem } from '../../types'
import styles from './ExpressionChips.module.css'

interface ExpressionChipsProps {
  tabId: ExpressionTabId
  onInsert: (latex: string) => void
}

// Module-level cache so each tab only loads once per session
const chipCache = new Map<ExpressionTabId, ExpressionItem[]>()

export function ExpressionChips({ tabId, onInsert }: ExpressionChipsProps) {
  // forceUpdate is the only state — incremented in async callbacks after cache is populated
  let [, forceUpdate] = useState(0)

  useEffect(() => {
    if (chipCache.has(tabId)) return

    let cancelled = false
    import(`../../data/expressions/${tabId}.json`)
      .then((mod) => {
        if (cancelled) return
        chipCache.set(tabId, (mod.default as { items: ExpressionItem[] }).items)
        forceUpdate((n) => n + 1)
      })
      .catch(() => {
        if (!cancelled) forceUpdate((n) => n + 1)
      })

    return () => { cancelled = true }
  }, [tabId])

  const items = chipCache.get(tabId)

  if (!items) {
    return <div className={styles.loading}>Loading…</div>
  }

  return (
    <div className={styles.chips}>
      {items.map((item, i) => (
        <button
          key={i}
          className={styles.chip}
          title={item.latex}
          onClick={() => onInsert(item.latex)}
          type="button"
        >
          <span className={styles.chipDisplay}>{item.display}</span>
          <span className={styles.chipLabel}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
