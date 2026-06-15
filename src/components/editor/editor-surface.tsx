import 'mathlive';
import React, { useEffect } from 'react';
import type { MathfieldElement } from 'mathlive';
import type { useMathField } from '../../hooks/use-math-field';
import { ContextToolbar } from './context-toolbar';

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
  latex: string;
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
  latex,
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

  useEffect(() => {
    if (mathType !== 'display') return;

    const el = mathFieldRef.current as MathfieldElement | null;
    if (!el) return;

    function handleEnter(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      const mf = el as MathfieldElement;
      const current = mf.getValue('latex');

      if (current.includes('\\begin{aligned}')) {
        mf.insert('\\\\');
      } else {
        mf.setValue(`\\begin{aligned}${current}\\\\ \\placeholder{}\\end{aligned}`);
        mf.executeCommand('moveToNextPlaceholder');
      }
    }

    el.addEventListener('keydown', handleEnter);
    return () => el.removeEventListener('keydown', handleEnter);
  }, [mathFieldRef, mathType]);

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
        <span className="select-none text-[9.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">Editor</span>
        <span className="ml-auto font-mono text-[9.5px] text-ink-400">{mathType} · {fontSize}pt</span>
      </div>
      <div className="ee-canvas-bg relative flex min-h-0 flex-1 flex-col">
        <ContextToolbar visible={hasSelection} onAction={onWrap} />
        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          <div
            ref={cardRef}
            className="relative flex min-h-[120px] w-full max-w-[560px] items-center justify-center rounded-xl border border-ink-200 bg-surface px-6 py-6 shadow-sm"
          >
            <math-field
              ref={mathFieldRef as React.RefObject<HTMLElement>}
              className="block w-full border-none bg-transparent outline-none"
              style={{ fontSize: `${30 + (fontSize - 12) * 1.6}px` }}
            />
            {!latex && (
              <p className="pointer-events-none absolute text-[13px] text-ink-400">
                Type LaTeX · click a symbol · ⌘K
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
