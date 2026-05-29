import React from 'react';
import styles from './ActionBar.module.css';

interface SizeControlProps {
  value: number;
  onChange: (v: number) => void;
}

const SIZE_OPTIONS = [10, 11, 12, 14, 16] as const;

export function SizeControl({ value, onChange }: SizeControlProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(Number(e.target.value));
  }

  return (
    <div className={styles.sizeControl}>
      <select className={styles.sizeSelect} value={value} onChange={handleChange}>
        {SIZE_OPTIONS.map((pt) => (
          <option key={pt} value={pt}>
            {pt}pt
          </option>
        ))}
      </select>
      <span className={styles.sizeArrow}>▾</span>
    </div>
  );
}
