import { useCallback, useMemo, useRef } from 'react';
import type { MathfieldElement, OutputFormat } from 'mathlive';
import { toInsertLatex, toWrapLatex, hasSlots } from '../lib/latex-templates';

export function useMathField() {
  const ref = useRef<MathfieldElement>(null);

  const insert = useCallback((latex: string): void => {
    if (!ref.current) return;
    try {
      ref.current.insert(toInsertLatex(latex), {
        focus: true,
        selectionMode: hasSlots(latex) ? 'placeholder' : 'after',
        format: 'latex',
      });
      ref.current.focus();
    } catch {
      // MathLive can throw on malformed LaTeX — swallow to keep the editor alive
    }
  }, []);

  const wrap = useCallback((latex: string): void => {
    if (!ref.current) return;
    try {
      ref.current.insert(toWrapLatex(latex), {
        focus: true,
        selectionMode: 'placeholder',
        format: 'latex',
      });
      ref.current.focus();
    } catch {
      // MathLive throws on malformed LaTeX
    }
  }, []);

  const getValue = useCallback((format: OutputFormat): string => {
    if (!ref.current) return '';
    try {
      return ref.current.getValue(format);
    } catch {
      return '';
    }
  }, []);

  const setValue = useCallback((latex: string): void => {
    if (!ref.current) return;
    try {
      ref.current.setValue(latex);
    } catch {
      // MathLive throws on malformed LaTeX
    }
  }, []);

  // Like setValue but goes through MathLive's editing pipeline so it's undoable.
  const replaceValue = useCallback((latex: string): void => {
    if (!ref.current) return;
    try {
      if (!latex.trim()) {
        ref.current.setValue('');
        return;
      }
      ref.current.insert(latex, {
        insertionMode: 'replaceAll',
        format: 'latex',
      });
    } catch {
      // MathLive throws on malformed LaTeX
    }
  }, []);

  return useMemo(
    () => ({ ref, insert, wrap, getValue, setValue, replaceValue }),
    [insert, wrap, getValue, setValue, replaceValue]
  );
}
