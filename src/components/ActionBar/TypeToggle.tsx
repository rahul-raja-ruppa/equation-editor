import styles from './ActionBar.module.css';

interface TypeToggleProps {
  value: 'display' | 'inline';
  onChange: (v: 'display' | 'inline') => void;
}

export function TypeToggle({ value, onChange }: TypeToggleProps) {
  return (
    <div className={styles.typeToggle}>
      <button
        type="button"
        className={`${styles.typeOption}${value === 'display' ? ` ${styles.typeOptionActive}` : ''}`}
        onClick={() => onChange('display')}
      >
        Display
      </button>
      <button
        type="button"
        className={`${styles.typeOption}${value === 'inline' ? ` ${styles.typeOptionActive}` : ''}`}
        onClick={() => onChange('inline')}
      >
        Inline
      </button>
    </div>
  );
}
