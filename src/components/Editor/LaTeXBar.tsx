import React, { useState } from 'react';
import { Copy, Check, Undo2, Redo2, X } from 'lucide-react';
import styles from './LaTeXBar.module.css';

interface LaTeXBarProps {
  value: string;
  onCommit: (latex: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

export function LaTeXBar({ value, onCommit, onUndo, onRedo, onClear }: LaTeXBarProps) {
  let [editing, setEditing] = useState(false);
  let [draft, setDraft] = useState('');
  let [copied, setCopied] = useState(false);

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
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
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
      <div className={styles.editBtns}>
        <button type="button" className={styles.editBtn} onClick={onUndo} title="Undo">
          <Undo2 size={13} strokeWidth={1.75} />
        </button>
        <button type="button" className={styles.editBtn} onClick={onRedo} title="Redo">
          <Redo2 size={13} strokeWidth={1.75} />
        </button>
        <button type="button" className={styles.editBtn} onClick={onClear} title="Clear">
          <X size={12} strokeWidth={2} />
        </button>
      </div>
      <button
        type="button"
        className={`${styles.copyBtn}${copied ? ` ${styles.copyBtnDone}` : ''}`}
        onClick={handleCopy}
        title="Copy LaTeX"
      >
        {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={1.75} />}
      </button>
    </div>
  );
}
