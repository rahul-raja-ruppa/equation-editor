import { useState, type FC } from 'react';
import type { TabId } from '../../types';
import { useTabData } from '../../hooks/useTabData';
import styles from './SymbolGrid.module.css';

interface SymbolGridProps {
  activeTab: TabId;
  onInsert: (latex: string) => void;
}

const SymbolGrid: FC<SymbolGridProps> = ({ activeTab, onInsert }) => {
  const { sections, loading } = useTabData(activeTab);
  let [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const toggleExpander = (sectionIndex: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionIndex)) {
        next.delete(sectionIndex);
      } else {
        next.add(sectionIndex);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className={styles.grid}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {sections.map((section, sectionIndex) => {
        const mainSymbols = section.symbols.filter((sym) => sym.extra !== true);
        const extraSymbols = section.symbols.filter((sym) => sym.extra === true);
        const hasExtras = extraSymbols.length > 0;
        const isExpanded = expandedSections.has(sectionIndex);
        const isLastSection = sectionIndex === sections.length - 1;

        return (
          <div key={sectionIndex}>
            <div className={styles.sectionHeader}>{section.header}</div>
            <div className={styles.symRow}>
              {mainSymbols.map((sym) => (
                <button
                  key={sym.latex}
                  className={sym.isTemplate ? styles.tmpl : styles.sym}
                  data-tooltip={sym.tooltip}
                  onClick={() => onInsert(sym.latex)}
                  type="button"
                >
                  {sym.display}
                </button>
              ))}
              {hasExtras && (
                <button
                  className={styles.expander}
                  onClick={() => toggleExpander(sectionIndex)}
                  type="button"
                >
                  {isExpanded ? '▲ Less' : '▼ More'}
                </button>
              )}
            </div>
            {hasExtras && isExpanded && (
              <div className={styles.extraRow}>
                {extraSymbols.map((sym) => (
                  <button
                    key={sym.latex}
                    className={sym.isTemplate ? styles.tmpl : styles.sym}
                    data-tooltip={sym.tooltip}
                    onClick={() => onInsert(sym.latex)}
                    type="button"
                  >
                    {sym.display}
                  </button>
                ))}
              </div>
            )}
            {!isLastSection && <div className={styles.secDiv} />}
          </div>
        );
      })}
    </div>
  );
};

export default SymbolGrid;
