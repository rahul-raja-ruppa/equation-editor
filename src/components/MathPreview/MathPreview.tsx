import { memo } from 'react';
import { convertLatexToMarkup } from 'mathlive';
import 'mathlive/static.css';
import 'mathlive/fonts.css';

interface MathPreviewProps {
  latex: string;
  className?: string;
}

function toPreviewLatex(latex: string): string {
  return latex
    .replace(/#[0-9]/g, '\\square')
    .replace(
      /\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g,
      '\\left(\\begin{smallmatrix}$1\\end{smallmatrix}\\right)'
    )
    .replace(
      /\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g,
      '\\left[\\begin{smallmatrix}$1\\end{smallmatrix}\\right]'
    )
    .replace(
      /\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}/g,
      '\\left|\\begin{smallmatrix}$1\\end{smallmatrix}\\right|'
    );
}

export const MathPreview = memo(function MathPreview({ latex, className }: MathPreviewProps) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: convertLatexToMarkup(toPreviewLatex(latex), {
          mathstyle: 'auto',
          letterShapeStyle: 'tex',
        }),
      }}
    />
  );
});
