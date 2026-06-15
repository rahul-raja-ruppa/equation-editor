import { useEffect, useState, memo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MJInstance = { doc: any; adaptor: any };

let cached: MJInstance | null = null;
let pending: Promise<MJInstance> | null = null;

async function getMathJax(): Promise<MJInstance> {
  if (cached) return cached;
  if (pending) return pending;
  pending = (async (): Promise<MJInstance> => {
    const [
      { mathjax },
      { TeX },
      { SVG },
      { liteAdaptor },
      { RegisterHTMLHandler },
      { AllPackages },
    ] = await Promise.all([
      import('mathjax-full/js/mathjax.js'),
      import('mathjax-full/js/input/tex.js'),
      import('mathjax-full/js/output/svg.js'),
      import('mathjax-full/js/adaptors/liteAdaptor.js'),
      import('mathjax-full/js/handlers/html.js'),
      import('mathjax-full/js/input/tex/AllPackages.js'),
    ]);
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    // Exclude the 'html' package — it enables \href with arbitrary URLs,
    // which is exploitable via dangerouslySetInnerHTML.
    const safePackages = (AllPackages as string[]).filter((p) => p !== 'html');
    const doc = mathjax.document('', {
      InputJax: new TeX({ packages: safePackages }),
      OutputJax: new SVG({ fontCache: 'none' }),
    });
    cached = { doc, adaptor };
    return cached;
  })();
  // Clear pending on failure so the next call can retry instead of
  // permanently returning the same rejected promise for the session.
  pending.catch(() => {
    pending = null;
  });
  return pending;
}

interface MathJaxPreviewProps {
  latex: string;
  mathType: 'display' | 'inline';
}

export const MathJaxPreview = memo(function MathJaxPreview({
  latex,
  mathType,
}: MathJaxPreviewProps) {
  const [svg, setSvg] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      getMathJax()
        .then(({ doc, adaptor }) => {
          if (cancelled) return;
          try {
            const node = doc.convert(latex || '{}', { display: mathType === 'display' });
            const result: string = adaptor.outerHTML(adaptor.firstChild(node));
            setSvg(result);
            setStatus('ready');
          } catch {
            if (!cancelled) setStatus('error');
          }
        })
        .catch(() => {
          if (!cancelled) setStatus('error');
        });
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [latex, mathType]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60px] flex-1 items-center justify-center text-[11px] text-ink-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-primary" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex min-h-[60px] flex-1 items-center justify-center text-[11px] text-ink-400">
        Could not render
      </div>
    );
  }
  return (
    <div
      className="flex flex-1 items-center justify-center overflow-auto px-4 py-3.5 [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
