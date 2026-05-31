import React, { useState } from 'react';
import styles from './LaTeXBar.module.css';

interface LaTeXBarProps {
  value: string;
  onCommit: (latex: string) => void;
}

export function LaTeXBar({ value, onCommit }: LaTeXBarProps) {
  let [editing, setEditing] = useState(false);
  let [draft, setDraft] = useState('');

  function handlePillClick() {
    setDraft(value);
    setEditing(true);
  }

  function handleCommit() {
    onCommit(draft);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleCommit();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard?.writeText(value)
  }

  return (
    <div className={styles.latexBar}>
      <span className={styles.label}>LaTeX</span>
      {editing ? (
        <input
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <div className={styles.pill} onClick={handlePillClick} title="Click to edit LaTeX">
          {value}
        </div>
      )}
      <button type="button" className={styles.copyBtn} onClick={handleCopy}>
        Copy
      </button>
    </div>
  );
}
