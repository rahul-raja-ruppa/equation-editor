import 'mathlive';
import React, { useEffect, useRef, useState } from 'react';
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
  const [kbVisible, setKbVisible] = useState(false);
  const kbBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = mathFieldRef.current;
    if (!el || !onChange) return;
    function handler() {
      const latex = (el as MathfieldElement).getValue('latex');
      onChange!(latex);
    }
    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, [mathFieldRef, onChange]);

  function toggleKeyboard() {
    const vk = window.mathVirtualKeyboard;
    if (kbVisible) {
      vk.hide();
      setKbVisible(false);
    } else {
      vk.show();
      setKbVisible(true);
    }
  }

  function openMenu() {
    const el = mathFieldRef.current as Element | null;
    const shadowBtn = el?.shadowRoot?.querySelector('[part="menu-toggle"]') as HTMLElement | null;
    if (!shadowBtn || !menuBtnRef.current) return;

    // Teleport the shadow button to our external button's screen coords so
    // MathLive's getBoundingClientRect() anchors its popup there, then restore.
    const rect = menuBtnRef.current.getBoundingClientRect();
    shadowBtn.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;opacity:0;pointer-events:none;`;
    shadowBtn.click();
    requestAnimationFrame(() => {
      shadowBtn.style.cssText = '';
    });
  }

  return (
    <div className={styles.mathFieldWrapper}>
      <div className={styles.cardRow}>
        <div className={styles.card}>
          <math-field
            ref={mathFieldRef as React.RefObject<HTMLElement>}
            className={styles.mathField}
            style={{ fontSize: `${30 + (fontSize - 12) * 1.6}px` }}
            virtual-keyboard-mode="manual"
          />
        </div>

        <div className={styles.sideControls}>
          <button
            ref={menuBtnRef}
            className={styles.kbToggle}
            onClick={openMenu}
            title="Math menu"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="4.5" r="1.5" fill="currentColor" />
              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
              <circle cx="10" cy="15.5" r="1.5" fill="currentColor" />
            </svg>
          </button>

          <button
            ref={kbBtnRef}
            className={`${styles.kbToggle}${kbVisible ? ` ${styles.kbToggleActive}` : ''}`}
            onClick={toggleKeyboard}
            title="Toggle virtual keyboard"
            type="button"
            aria-pressed={kbVisible}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="4.5" y="7.5" width="2" height="2" rx="0.5" fill="currentColor" />
              <rect x="8.5" y="7.5" width="2" height="2" rx="0.5" fill="currentColor" />
              <rect x="12.5" y="7.5" width="2" height="2" rx="0.5" fill="currentColor" />
              <rect x="4.5" y="11" width="2" height="2" rx="0.5" fill="currentColor" />
              <rect x="8" y="11" width="5" height="2" rx="0.5" fill="currentColor" />
              <rect x="12.5" y="11" width="2" height="2" rx="0.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
