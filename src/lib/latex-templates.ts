/** Numbered slots (#0..#9) → MathLive placeholder token, for live insertion. */
export function toInsertLatex(latex: string): string {
  return latex.replace(/#[0-9]/g, '#?');
}

/** #0 (the "wrap target" slot) → MathLive's "previous selection" token (#@);
 *  remaining numbered slots → placeholder tokens. Used when wrapping a selection. */
export function toWrapLatex(latex: string): string {
  return latex.replace('#0', '#@').replace(/#[1-9]/g, '#?');
}

export function hasSlots(latex: string): boolean {
  return /#[0-9]/.test(latex);
}
