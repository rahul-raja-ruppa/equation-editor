import { useEffect, useState, memo } from 'react';
import styles from './MathJaxPreview.module.css';

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
    const doc = mathjax.document('', {
      InputJax: new TeX({ packages: AllPackages }),
      OutputJax: new SVG({ fontCache: 'none' }),
    });
    cached = { doc, adaptor };
    return cached;
  })();
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
  let [svg, setSvg] = useState<string>('');
  let [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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
      <div className={styles.state}>
        <span className={styles.spinner} />
      </div>
    );
  }
  if (status === 'error') {
    return <div className={styles.state}>Could not render</div>;
  }
  return <div className={styles.render} dangerouslySetInnerHTML={{ __html: svg }} />;
});
