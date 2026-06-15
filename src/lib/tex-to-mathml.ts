// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MmlConverter = (latex: string, display: boolean) => any;

let cached: MmlConverter | null = null;
let pending: Promise<MmlConverter> | null = null;

async function getConverter(): Promise<MmlConverter> {
  if (cached) return cached;
  if (pending) return pending;
  pending = (async (): Promise<MmlConverter> => {
    const [
      { mathjax },
      { TeX },
      { AbstractOutputJax },
      { STATE },
      { liteAdaptor },
      { RegisterHTMLHandler },
      { AllPackages },
    ] = await Promise.all([
      import('mathjax-full/js/mathjax.js'),
      import('mathjax-full/js/input/tex.js'),
      import('mathjax-full/js/core/OutputJax.js'),
      import('mathjax-full/js/core/MathItem.js'),
      import('mathjax-full/js/adaptors/liteAdaptor.js'),
      import('mathjax-full/js/handlers/html.js'),
      import('mathjax-full/js/input/tex/AllPackages.js'),
    ]);
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    // Exclude the 'html' package — it enables \href with arbitrary URLs.
    const safePackages = (AllPackages as string[]).filter((p) => p !== 'html');

    // An OutputJax is required at compile time — e.g. the bussproofs extension
    // calls outputJax.getBBox() while compiling — even though we stop at
    // STATE.CONVERT and only ever serialize the MathML tree, never render it.
    // A real OutputJax (svg/chtml) would drag in ~1.3MB of font/layout code
    // we'd never use, so we stub the one method that's actually called.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    class MinimalOutputJax extends (AbstractOutputJax as any) {
      static NAME = 'minimal';
      typeset() {
        return null;
      }
      escaped() {
        return null;
      }
      getBBox() {
        return { w: 0, h: 0, d: 0 };
      }
    }

    const doc = mathjax.document('', {
      InputJax: new TeX({ packages: safePackages }),
      OutputJax: new MinimalOutputJax(),
    });
    cached = (latex, display) =>
      // MathJax.tex2mml() (the `mathjax` package's convenience method) stops
      // conversion at STATE.CONVERT and serializes the resulting MmlNode —
      // mirror that exactly so output matches the reference implementation.
      doc.convert(latex || '{}', { display, end: STATE.CONVERT });
    return cached;
  })();
  pending.catch(() => {
    pending = null;
  });
  return pending;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let visitorPromise: Promise<{ visitTree: (node: any) => string }> | null = null;

async function getVisitor() {
  if (!visitorPromise) {
    visitorPromise = import('mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js')
      .then(({ SerializedMmlVisitor }) => new SerializedMmlVisitor())
      .catch(() => {
        visitorPromise = null;
        throw new Error('Failed to load MathML serializer');
      });
  }
  return visitorPromise;
}

/**
 * Converts a LaTeX string to MathML using MathJax — the same engine
 * (and `toMathML` serialization approach) the legacy equation editor used,
 * so output matches the platform's standard MathML representation.
 */
export async function texToMathML(latex: string, display: boolean): Promise<string> {
  const [convert, visitor] = await Promise.all([getConverter(), getVisitor()]);
  const node = convert(latex, display);
  let mml = visitor.visitTree(node);

  // Per eLife's requirement, inline equations must not carry display-specific
  // attributes — MathJax emits these by default. Ported from the legacy
  // VisualMathEditorNew.js `updateEq()` post-processing.
  if (!display) {
    mml = mml.replace(/\s*(?:displaystyle="true"|scriptlevel="0")/g, '');
  }
  return mml;
}
