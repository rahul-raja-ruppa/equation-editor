import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { convertLatexToMarkup } from 'mathlive';
import 'mathlive/static.css';
import 'mathlive/fonts.css';

interface MathGlyphProps {
  latex: string;
  className?: string;
  style?: CSSProperties;
}

/* Static-glyph latex transforms (ported from the v2.2 bundle math.jsx):
 * - numbered slots (#0..#9) → \square
 * - big operators → \nolimits so limits sit beside, not stacked (compact icons)
 * - matrices → bracketed \smallmatrix
 */
function toGlyphLatex(latex: string): string {
  return latex
    .replace(/#[0-9]/g, '\\square')
    .replace(
      /\\(sum|prod|coprod|int|iint|iiint|iiiint|oint|oiint|oiiint|bigcup|bigcap|bigvee|bigwedge|bigoplus|bigotimes|bigodot|biguplus|bigsqcup|lim|limsup|liminf)(?![a-zA-Z])/g,
      '\\$1\\nolimits'
    )
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

// Module-level cache: this phase renders 50+ glyphs at once.
const glyphCache = new Map<string, string>();

function renderGlyph(latex: string): string {
  const cached = glyphCache.get(latex);
  if (cached !== undefined) return cached;
  let html: string;
  try {
    html = convertLatexToMarkup(toGlyphLatex(latex), {
      defaultMode: 'inline-math', // textstyle — compact glyphs, not display blocks
      letterShapeStyle: 'tex',
    });
  } catch {
    html = '';
  }
  glyphCache.set(latex, html);
  return html;
}

// Shrink the available box by this fraction before computing the fit
// scale, so a scaled glyph never sits flush against its clip ancestor's
// edge — sub-pixel rounding and font-metric drift would otherwise clip it.
const FIT_SAFETY_MARGIN = 0.96;

export function MathGlyph({ latex, className = '', style }: MathGlyphProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // Scale the glyph down when taller/wider than its container so tall
  // constructs (integrals, matrices) never clip or overflow.
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.transformOrigin = 'center';
    const parent = el.parentElement;
    if (!parent) return;
    const availH = parent.clientHeight * FIT_SAFETY_MARGIN;
    const availW = parent.clientWidth * FIT_SAFETY_MARGIN;
    // el.scrollWidth only captures right-side overflow when content is centered
    // (justify-content:center causes symmetric overflow, left half is invisible to
    // scrollWidth since scrollLeft cannot go negative). Measure the inner content
    // element's rendered rect to get the true symmetric natural width.
    const innerEl = el.firstElementChild as HTMLElement | null;
    const innerRect = innerEl ? innerEl.getBoundingClientRect() : null;
    const naturalH =
      innerRect && innerRect.height > 0
        ? Math.max(el.scrollHeight, innerRect.height)
        : el.scrollHeight;
    const naturalW =
      innerRect && innerRect.width > 0 ? Math.max(el.scrollWidth, innerRect.width) : el.scrollWidth;
    const scaleH = availH > 0 && naturalH > availH ? availH / naturalH : 1;
    const scaleW = availW > 0 && naturalW > availW ? availW / naturalW : 1;
    const scale = Math.min(scaleH, scaleW);
    if (scale < 1) el.style.transform = `scale(${Math.max(0.3, scale)})`;
  }, []);

  useLayoutEffect(() => {
    fit();
  }, [latex, fit]);

  // Re-fit once the math font finishes loading (glyph heights change on swap).
  useEffect(() => {
    if (document.fonts && document.fonts.ready) void document.fonts.ready.then(fit);
  }, [latex, fit]);

  // Re-fit whenever the clip container itself resizes (sidebar collapse,
  // panel reflow, viewport resize) — this is the actual signal for when a
  // previously-correct scale can go stale, replacing a blind timeout.
  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [fit]);

  return (
    <span
      ref={ref}
      className={`ee-glyph ${className}`}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: renderGlyph(latex) }}
    />
  );
}
