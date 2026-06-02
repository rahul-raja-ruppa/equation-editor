import 'mathlive';
import React, { useEffect } from 'react';
import type { MathfieldElement } from 'mathlive';
import type { useMathField } from '../../hooks/useMathField';
import { MathJaxPreview } from '../MathPreview/MathJaxPreview';
import styles from './MathField.module.css';

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface MathFieldProps {
  mathFieldRef: ReturnType<typeof useMathField>['ref'];
  onChange?: (latex: string) => void;
  fontSize: number;
  latex: string;
  mathType: 'display' | 'inline';
  previewOpen: boolean;
}

export function MathField({
  mathFieldRef,
  onChange,
  fontSize,
  latex,
  mathType,
  previewOpen,
}: MathFieldProps) {
  useEffect(() => {
    const el = mathFieldRef.current;
    if (!el || !onChange) return;

    function handler() {
      const value = (el as MathfieldElement).getValue('latex');
      onChange!(value);
    }

    el.addEventListener('input', handler);
    return () => {
      el.removeEventListener('input', handler);
    };
  }, [mathFieldRef, onChange]);

  useEffect(() => {
    const el = mathFieldRef.current as MathfieldElement | null;
    if (!el) return;
    customElements.whenDefined('math-field').then(() => {
      el.macros = {
        ...el.macros,
        boldsymbol: { def: '\\mathbf{#1}', args: 1 },
        bm: { def: '\\mathbf{#1}', args: 1 },
      };

      const shadow = el.shadowRoot;
      if (shadow) {
        const style = document.createElement('style');
        style.textContent = `
          :host { border: none !important; outline: none !important; box-shadow: none !important; border-radius: 0 !important; }
          :host(:focus-within) { border: none !important; outline: none !important; box-shadow: none !important; }
          .ML__container { border: none !important; box-shadow: none !important; }
        `;
        shadow.appendChild(style);
      }

      el.focus();
    });
  }, [mathFieldRef]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const tag = active?.tagName.toLowerCase() ?? '';
      // Don't steal focus from text inputs or the math field itself
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (active === mathFieldRef.current) return;
      // Only redirect printable keys, not modifiers/function keys
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      const el = mathFieldRef.current as MathfieldElement | null;
      if (!el) return;
      el.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mathFieldRef]);

  return (
    <div className={styles.mathFieldWrapper}>
      <div className={previewOpen ? styles.cardsSplit : styles.cards}>
        <div className={styles.card}>
          <math-field
            ref={mathFieldRef as React.RefObject<HTMLElement>}
            className={styles.mathField}
            style={{ fontSize: `${30 + (fontSize - 12) * 1.6}px` }}
          />
          {!latex && (
            <p className={styles.emptyHint}>
              Type LaTeX · click a symbol above · or search with <kbd>/</kbd>
            </p>
          )}
        </div>
        {previewOpen && (
          <div className={styles.previewCard}>
            <MathJaxPreview latex={latex} mathType={mathType} />
          </div>
        )}
      </div>
    </div>
  );
}
