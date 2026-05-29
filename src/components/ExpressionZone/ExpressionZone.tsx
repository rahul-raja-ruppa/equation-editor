import { useState } from 'react'
import { type ExpressionTabId, EXPRESSION_TAB_IDS } from '../../types'
import ExpressionTabStrip from './ExpressionTabStrip'
import { ExpressionChips } from './ExpressionChips'
import styles from './ExpressionZone.module.css'

interface ExpressionZoneProps {
  onInsert: (latex: string) => void
}

export function ExpressionZone({ onInsert }: ExpressionZoneProps) {
  let [activeTab, setActiveTab] = useState<ExpressionTabId>(EXPRESSION_TAB_IDS[0])

  return (
    <div className={styles.zone}>
      <ExpressionTabStrip activeTab={activeTab} onTabChange={setActiveTab} />
      <ExpressionChips tabId={activeTab} onInsert={onInsert} />
    </div>
  )
}
