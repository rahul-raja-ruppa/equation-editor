import { useRef } from 'react';
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

const CATEGORY_ICONS: Record<string, string> = {
  relations: '\\leq',
  decorations: '\\cdots',
  operators: '\\pm',
  arrows: '\\rightarrow',
  logic: '\\forall',
  sets: '\\subset',
  misc: '\\partial',
  'greek-lower': '\\lambda',
  'greek-upper': '\\Omega',
  fences: '\\left(\\square\\right)',
  fractions: '\\frac{\\square}{\\square}',
  scripts: '\\square^{\\square}',
  summation: '\\sum',
  integrals: '\\int',
  'over-under': '\\vec{\\square}',
  bigops: '\\prod',
  matrices: '\\begin{smallmatrix}\\square&\\square\\\\\\square&\\square\\end{smallmatrix}',
};

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
        <MathPreview
          className={styles.math}
          latex={CATEGORY_ICONS[category.id] ?? category.palette[0].latex}
        />
        <span className={styles.chevron}>▾</span>
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
