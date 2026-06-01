import 'mathlive';
import React, { useEffect } from 'react';
import type { MathfieldElement } from 'mathlive';
import type { useMathField } from '../../hooks/useMathField';
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
}

export function MathField({ mathFieldRef, onChange, fontSize }: MathFieldProps) {
  useEffect(() => {
    const el = mathFieldRef.current;
    if (!el || !onChange) return;

    function handler() {
      const latex = (el as MathfieldElement).getValue('latex');
      onChange!(latex);
    }

    el.addEventListener('input', handler);
    return () => {
      el.removeEventListener('input', handler);
    };
  }, [mathFieldRef, onChange]);

  return (
    <div className={styles.mathFieldWrapper}>
      <div className={styles.card}>
        <math-field
          ref={mathFieldRef as React.RefObject<HTMLElement>}
          className={styles.mathField}
          style={{ fontSize: `${30 + (fontSize - 12) * 1.6}px` }}
        />
      </div>
    </div>
  );
}
