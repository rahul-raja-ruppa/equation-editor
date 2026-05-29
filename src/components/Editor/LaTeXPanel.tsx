import styles from './LaTeXPanel.module.css';

interface LaTeXPanelProps {
  value: string;
  onChange: (latex: string) => void;
}

export function LaTeXPanel({ value, onChange }: LaTeXPanelProps) {
  return (
    <div className={styles.panel}>
      <span className={styles.label}>LaTeX</span>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
