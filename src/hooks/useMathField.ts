import { useRef } from 'react';
import type { MathfieldElement, OutputFormat } from 'mathlive';

export function useMathField() {
  const ref = useRef<MathfieldElement>(null);

  function insert(latex: string): void {
    if (!ref.current) return;
    ref.current.insert(latex);
    ref.current.focus();
  }

  function getValue(format: OutputFormat): string {
    if (!ref.current) return '';
    return ref.current.getValue(format);
  }

  function setValue(latex: string): void {
    if (!ref.current) return;
    ref.current.setValue(latex);
  }

  return { ref, insert, getValue, setValue };
}
