import type { FC } from 'react'
import { TAB_IDS, type TabId } from '../../types'
import styles from './TabStrip.module.css'

interface TabStripProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const TAB_LABELS: Record<TabId, string> = {
  general: 'General',
  symbols: 'Symbols',
  arrows: 'Arrows',
  greek: 'Greek & Letters',
  matrices: 'Matrices',
  scripts: 'Scripts & Layouts',
  bigops: 'Big Operators',
  calculus: 'Calculus',
}

const TabStrip: FC<TabStripProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.tabStrip}>
      {TAB_IDS.map((id) => {
        let className = styles.tab
        if (id === activeTab) {
          className = `${styles.tab} ${styles.active}`
        }
        return (
          <button
            key={id}
            className={className}
            onClick={() => onTabChange(id)}
          >
            {TAB_LABELS[id]}
          </button>
        )
      })}
    </div>
  )
}

export default TabStrip
