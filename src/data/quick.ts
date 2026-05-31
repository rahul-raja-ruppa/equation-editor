import type { PaletteItem } from '../types'

const quick: PaletteItem[] = [
  { latex: '\\pi', display: 'π', tooltip: 'Pi' },
  { latex: '\\theta', display: 'θ', tooltip: 'Theta' },
  { latex: '\\infty', display: '∞', tooltip: 'Infinity' },
  { latex: '\\in', display: '∈', tooltip: 'Element of' },
  { latex: '\\rightarrow', display: '→', tooltip: 'Right arrow' },
  { latex: '\\partial', display: '∂', tooltip: 'Partial' },
  { latex: '\\leq', display: '≤', tooltip: 'Less or equal' },
  { latex: '\\neq', display: '≠', tooltip: 'Not equal' },
  { latex: '\\pm', display: '±', tooltip: 'Plus or minus' },
  { latex: '\\left(#0\\right)', display: '(…)', tooltip: 'Parentheses', isTemplate: true },
  { latex: '\\left[#0\\right]', display: '[…]', tooltip: 'Brackets', isTemplate: true },
  { latex: '\\frac{#0}{#1}', display: '□/□', tooltip: 'Fraction', isTemplate: true },
  { latex: '\\sqrt{#0}', display: '√□', tooltip: 'Square root', isTemplate: true },
  { latex: '#0^{#1}', display: 'x²', tooltip: 'Superscript', isTemplate: true },
  { latex: '#0_{#1}', display: 'xₙ', tooltip: 'Subscript', isTemplate: true },
  { latex: '\\sum_{#0}^{#1} #2', display: 'Σₙᵐ', tooltip: 'Summation', isTemplate: true },
  { latex: '\\int_{#0}^{#1} #2 \\, d#3', display: '∫₀¹', tooltip: 'Integral', isTemplate: true },
]

export default quick
