import { useCallback, useEffect, useRef } from 'react';
import { useFlyout } from '../../hooks/useFlyout';
import { CategoryButton } from './CategoryButton';
import row1 from '../../data/toolbar/row1';
import row2 from '../../data/toolbar/row2';
import quick from '../../data/quick';
import { MathPreview } from '../MathPreview/MathPreview';
import styles from './ToolbarZone.module.css';

interface ToolbarZoneProps {
  onInsert: (latex: string) => void;
}

export function ToolbarZone({ onInsert }: ToolbarZoneProps) {
  const { openId, position, open, close } = useFlyout();
  const closeTimer = useRef<number | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      close();
      closeTimer.current = null;
    }, 180);
  }, [cancelClose, close]);

  const openCategory = useCallback(
    (id: string, rect: DOMRect) => {
      cancelClose();
      open(id, rect);
    },
    [cancelClose, open]
  );

  const closeCategory = useCallback(() => {
    cancelClose();
    close();
  }, [cancelClose, close]);

  useEffect(() => cancelClose, [cancelClose]);

  function getQuickButtonClass(latex: string, isTemplate?: boolean) {
    return [
      styles.quickBtn,
      isTemplate ? styles.template : '',
      /\\(?:sum|int)_/.test(latex) ? styles.wideTemplate : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  return (
    <div className={styles.zone}>
      <div className={styles.row}>
        {row1.map((cat) => (
          <CategoryButton
            key={cat.id}
            category={cat}
            isOpen={openId === cat.id}
            onOpen={openCategory}
            onClose={closeCategory}
            onCancelClose={cancelClose}
            onScheduleClose={scheduleClose}
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
            onOpen={openCategory}
            onClose={closeCategory}
            onCancelClose={cancelClose}
            onScheduleClose={scheduleClose}
            onInsert={onInsert}
            position={position}
          />
        ))}
      </div>
      <div className={styles.quick}>
        <span className={styles.quickLabel}>Quick</span>
        <div className={styles.quickItems}>
          {quick.map((item) => (
            <button
              key={`${item.latex}-${item.tooltip}`}
              type="button"
              className={getQuickButtonClass(item.latex, item.isTemplate)}
              title={item.tooltip}
              onClick={() => onInsert(item.latex)}
            >
              <MathPreview className={styles.quickPreview} latex={item.latex} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
