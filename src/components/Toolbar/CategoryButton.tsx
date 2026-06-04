import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ToolbarCategory } from '../../types';
import type { FlyoutPosition } from '../../hooks/useFlyout';
import { FlyoutPalette } from './FlyoutPalette';
import { MathPreview } from '../MathPreview/MathPreview';
import styles from './CategoryButton.module.css';

interface CategoryButtonProps {
  category: ToolbarCategory;
  isOpen: boolean;
  onOpen: (id: string, rect: DOMRect) => void;
  onClose: () => void;
  onCancelClose: () => void;
  onScheduleClose: () => void;
  onInsert: (latex: string) => void;
  position: FlyoutPosition;
}

export function CategoryButton({
  category,
  isOpen,
  onOpen,
  onClose,
  onCancelClose,
  onScheduleClose,
  onInsert,
  position,
}: CategoryButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  function show() {
    onCancelClose();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) onOpen(category.id, rect);
  }

  function handleClick() {
    if (isOpen) {
      onCancelClose();
      onClose();
    } else {
      show();
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        className={isOpen ? `${styles.btn} ${styles.open}` : styles.btn}
        title={category.tooltip}
        onClick={handleClick}
        onMouseEnter={show}
        onMouseLeave={onScheduleClose}
        type="button"
        data-category-btn="true"
      >
        <span className={styles.iconWrap}>
          <MathPreview latex={category.icon} />
        </span>
        <ChevronDown size={9} strokeWidth={2.5} className={styles.chevron} />
      </button>
      {isOpen && (
        <FlyoutPalette
          label={category.tooltip}
          items={category.palette}
          position={position}
          onInsert={onInsert}
          onMouseEnter={onCancelClose}
          onMouseLeave={onScheduleClose}
        />
      )}
    </>
  );
}
