import { useCallback, useMemo, useRef } from 'react';
import type { MathfieldElement, OutputFormat } from 'mathlive';
import { toInsertLatex, toWrapLatex, hasSlots } from '../lib/latex-templates';

export function useMathField() {
  const ref = useRef<MathfieldElement>(null);

  const insert = useCallback((latex: string): void => {
    if (!ref.current) return;
    ref.current.insert(toInsertLatex(latex), {
      focus: true,
      selectionMode: hasSlots(latex) ? 'placeholder' : 'after',
      format: 'latex',
    });
    ref.current.focus();
  }, []);

  const wrap = useCallback((latex: string): void => {
    if (!ref.current) return;
    ref.current.insert(toWrapLatex(latex), {
      focus: true,
      selectionMode: 'placeholder',
      format: 'latex',
    });
    ref.current.focus();
  }, []);

  const getValue = useCallback((format: OutputFormat): string => {
    if (!ref.current) return '';
    return ref.current.getValue(format);
  }, []);

  const setValue = useCallback((latex: string): void => {
    if (!ref.current) return;
    ref.current.setValue(latex);
  }, []);

  return useMemo(
    () => ({ ref, insert, wrap, getValue, setValue }),
    [insert, wrap, getValue, setValue]
  );
}
