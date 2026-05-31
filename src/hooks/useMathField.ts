import { useCallback, useMemo, useRef } from 'react';
import type { MathfieldElement, OutputFormat } from 'mathlive';

function toMathLiveTemplate(latex: string): string {
  return latex.replace(/#[0-9]/g, '#?');
}

export function useMathField() {
  const ref = useRef<MathfieldElement>(null);

  const insert = useCallback((latex: string): void => {
    if (!ref.current) return;
    ref.current.insert(toMathLiveTemplate(latex), {
      focus: true,
      selectionMode: /#[0-9]/.test(latex) ? 'placeholder' : 'after',
      format: 'latex',
    });
    ref.current.focus();
  }, [])

  const getValue = useCallback((format: OutputFormat): string => {
    if (!ref.current) return '';
    return ref.current.getValue(format);
  }, [])

  const setValue = useCallback((latex: string): void => {
    if (!ref.current) return;
    ref.current.setValue(latex);
  }, [])

  return useMemo(() => ({ ref, insert, getValue, setValue }), [insert, getValue, setValue]);
}
