import type { FC } from 'react'
import { EXPRESSION_TAB_IDS, EXPRESSION_TAB_LABELS, type ExpressionTabId } from '../../types'
import styles from './ExpressionTabStrip.module.css'

interface ExpressionTabStripProps {
  activeTab: ExpressionTabId
  onTabChange: (tab: ExpressionTabId) => void
}

const ExpressionTabStrip: FC<ExpressionTabStripProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.strip}>
      {EXPRESSION_TAB_IDS.map((id) => (
        <button
          key={id}
          className={id === activeTab ? `${styles.tab} ${styles.active}` : styles.tab}
          onClick={() => onTabChange(id)}
          type="button"
        >
          {EXPRESSION_TAB_LABELS[id]}
        </button>
      ))}
    </div>
  )
}

export default ExpressionTabStrip
