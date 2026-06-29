import 'mathlive';
import React, { useCallback, useEffect, useState } from 'react';
import type { MathfieldElement } from 'mathlive';
import type { useMathField } from '../../hooks/use-math-field';
import { ContextToolbar } from './context-toolbar';
import { EditorErrorBoundary } from './editor-error-boundary';

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface EditorSurfaceProps {
  mathFieldRef: ReturnType<typeof useMathField>['ref'];
  onChange?: (latex: string) => void;
  fontSize: number;
  mathType: 'display' | 'inline';
  onSelectionChange: (hasSelection: boolean) => void;
  hasSelection: boolean;
  onWrap: (latex: string) => void;
  cardRef: React.RefObject<HTMLDivElement>;
}

export function EditorSurface({
  mathFieldRef,
  onChange,
  fontSize,
  mathType,
  onSelectionChange,
  hasSelection,
  onWrap,
  cardRef,
}: EditorSurfaceProps) {
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

  let [mountKey, setMountKey] = useState(0);

  let handleReset = useCallback(() => {
    setMountKey((k) => k + 1);
    onChange?.('');
  }, [onChange]);

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      // MathLive's parser throws this when it encounters invalid environments
      // (e.g. nested \begin{align}). It creates its own React root inside the
      // Shadow DOM so the error escapes our tree as a global window error.
      if (
        event.error instanceof TypeError &&
        (event.message?.includes('mathlist') || event.error.stack?.includes('mathlive'))
      ) {
        event.preventDefault();
        setMountKey((k) => k + 1);
        onChange?.('');
      }
    }
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onChange]);

  useEffect(() => {
    const el = mathFieldRef.current as MathfieldElement | null;
    if (!el) return;

    function handler() {
      const ranges = (el as MathfieldElement).selection.ranges;
      onSelectionChange(ranges.some(([from, to]) => from !== to));
    }

    el.addEventListener('selection-change', handler);
    return () => el.removeEventListener('selection-change', handler);
  }, [mathFieldRef, onSelectionChange]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-surface">
      <div className="flex h-[33px] shrink-0 items-center gap-2 border-b border-ink-200/70 px-3">
        <span className="select-none text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">
          Editor
        </span>
        <span className="ml-auto font-mono text-[9.5px] text-ink-400">
          {mathType} · {fontSize}pt
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ContextToolbar visible={hasSelection} onAction={onWrap} />
        <div
          ref={cardRef}
          className="ee-scroll relative flex min-h-0 w-full flex-1 overflow-auto bg-surface px-6 py-6"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            (mathFieldRef.current as MathfieldElement | null)?.focus();
          }}
        >
          <EditorErrorBoundary onReset={handleReset}>
            <math-field
              key={mountKey}
              ref={mathFieldRef as React.RefObject<HTMLElement>}
              style={{
                fontSize: `${30 + (fontSize - 12) * 1.6}px`,
                margin: 'auto',
                background: 'transparent',
              }}
            />
          </EditorErrorBoundary>
        </div>
      </div>
    </div>
  );
}
