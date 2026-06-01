import React, { useState, useLayoutEffect, useRef } from 'react';
import { Copy, Check, Undo2, Redo2, X } from 'lucide-react';
import type { MathfieldElement } from 'mathlive';
import type { useMathField } from '../../hooks/useMathField';
import styles from './LaTeXBar.module.css';

interface LaTeXBarProps {
  value: string;
  onCommit: (latex: string) => void;
  mathFieldRef: ReturnType<typeof useMathField>['ref'];
  onClear: () => void;
}

export function LaTeXBar({ value, onCommit, mathFieldRef, onClear }: LaTeXBarProps) {
  let [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  }

  function handleUndo() {
    (mathFieldRef.current as MathfieldElement | null)?.executeCommand('undo');
  }

  function handleRedo() {
    (mathFieldRef.current as MathfieldElement | null)?.executeCommand('redo');
  }

  async function handleCopy() {
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className={styles.latexBar}>
      <span className={styles.label}>LaTeX</span>
      <textarea
        ref={textareaRef}
        className={styles.input}
        value={value}
        onChange={(e) => onCommit(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <div className={styles.editBtns}>
        <button type="button" className={styles.editBtn} onClick={handleUndo} title="Undo">
          <Undo2 size={13} strokeWidth={1.75} />
        </button>
        <button type="button" className={styles.editBtn} onClick={handleRedo} title="Redo">
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
