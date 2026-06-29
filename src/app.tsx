import { useState, useCallback, useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import { useMathField } from './hooks/use-math-field';
import { usePostMessage } from './hooks/use-post-message';
import { CommandPalette } from './components/command-palette/command-palette';
import { RailColumn } from './components/rail/rail-column';
import { EditorColumn } from './components/editor/editor-column';
import { ActionBar } from './components/action-bar/action-bar';
import { PreviewColumn } from './components/math-preview/preview-column';
import { TooltipProvider } from './components/ui/tooltip';
import { texToMathML } from './lib/tex-to-mathml';
import type { LoadMessage } from './types';
import type { InsertStatus } from './components/action-bar/action-bar';

export default function App() {
  const mathField = useMathField();
  const cardRef = useRef<HTMLDivElement>(null);

  let [mathType, setMathType] = useState<'display' | 'inline'>('display');
  let [fontSize, setFontSize] = useState<number>(12);
  let [currentLatex, setCurrentLatex] = useState<string>('');
  let [initialLatex, setInitialLatex] = useState<string>('');
  let [previewOpen, setPreviewOpen] = useState(false);
  let [paletteOpen, setPaletteOpen] = useState(false);
  let [hasSelection, setHasSelection] = useState(false);
  let [insertStatus, setInsertStatus] = useState<InsertStatus>('idle');

  const onLoad = useCallback(
    (msg: LoadMessage) => {
      mathField.setValue(msg.latex);
      setCurrentLatex(msg.latex);
      setInitialLatex(msg.latex);
      setMathType(msg.config.mathType);
      setFontSize(msg.config.fontSize);
      setInsertStatus('idle');
    },
    [mathField]
  );

  function handleInsertSuccess() {
    mathField.replaceValue('');
    setCurrentLatex('');
    setInsertStatus('idle');
  }

  function handleInsertError() {
    setInsertStatus('idle');
  }

  const { send } = usePostMessage(
    onLoad,
    handleInsertRequested,
    handleInsertSuccess,
    handleInsertError
  );
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });

  async function handleInsertRequested() {
    const latexVal = mathField.getValue('latex');
    if (!latexVal.trim()) return;
    try {
      const mathml = await texToMathML(latexVal, mathType === 'display');
      send({ type: 'insert', latex: latexVal, mathml, fontSize, mathType });
    } catch {
      // insert-requested failures are silent — user is not looking at the editor
    }
  }

  const closePalette = useCallback(() => setPaletteOpen(false), []);

  const flash = useCallback(() => {
    const c = cardRef.current;
    if (!c) return;
    c.classList.remove('ee-flash');
    void c.offsetWidth;
    c.classList.add('ee-flash');
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPreviewOpen((v) => !v);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The parent's idle/session timer only sees activity on its own document, so it
  // can't tell when the user is interacting inside this iframe. Mirror the heartbeat
  // contract the biblio editor iframe already uses: report activity every 10s.
  useEffect(() => {
    let active = false;
    function markActive() {
      active = true;
    }
    window.addEventListener('mousemove', markActive);
    window.addEventListener('mousedown', markActive);
    window.addEventListener('keydown', markActive);
    const interval = setInterval(() => {
      if (active) {
        sendRef.current({ type: 'activity-heartbeat' });
        active = false;
      }
    }, 10000);
    return () => {
      window.removeEventListener('mousemove', markActive);
      window.removeEventListener('mousedown', markActive);
      window.removeEventListener('keydown', markActive);
      clearInterval(interval);
    };
  }, []);

  function handleInsert(latex: string) {
    mathField.insert(latex);
    const updated = mathField.getValue('latex');
    if (updated) setCurrentLatex(updated);
    flash();
  }

  function handleWrap(latex: string) {
    mathField.wrap(latex);
    const updated = mathField.getValue('latex');
    if (updated) setCurrentLatex(updated);
    flash();
  }

  function handleLatexCommit(latex: string) {
    if (latex === mathField.getValue('latex')) return;
    mathField.replaceValue(latex);
    setCurrentLatex(latex);
  }

  function handleUndo() {
    const el = mathField.ref.current as MathfieldElement | null;
    if (!el) return;
    el.focus();
    el.executeCommand('undo');
  }

  function handleRedo() {
    const el = mathField.ref.current as MathfieldElement | null;
    if (!el) return;
    el.focus();
    el.executeCommand('redo');
  }

  function handleClear() {
    mathField.replaceValue('');
    setCurrentLatex('');
  }

  function handleCancel() {
    send({ type: 'cancel-requested', initialLatex, currentLatex });
  }

  function getLatex() {
    return mathField.getValue('latex');
  }

  function getMathML() {
    return texToMathML(mathField.getValue('latex'), mathType === 'display');
  }

  return (
    <TooltipProvider>
      <div className="flex h-dvh w-full items-stretch">
        <div className="flex h-full w-full flex-col overflow-hidden bg-surface">
          <div className="flex min-h-0 flex-1 overflow-x-auto">
            {/* Col 1 — rail */}
            <RailColumn
              mathType={mathType}
              onMathType={setMathType}
              fontSize={fontSize}
              onFontSize={setFontSize}
              previewOpen={previewOpen}
              onPreviewToggle={() => setPreviewOpen((v) => !v)}
              onOpenPalette={() => setPaletteOpen(true)}
              onInsert={handleInsert}
            />

            {/* Col 2 — editor */}
            <EditorColumn
              latex={currentLatex}
              onCommit={handleLatexCommit}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              fontSize={fontSize}
              mathType={mathType}
              mathFieldRef={mathField.ref}
              onChange={setCurrentLatex}
              onSelectionChange={setHasSelection}
              hasSelection={hasSelection}
              onWrap={handleWrap}
              cardRef={cardRef}
            />

            {/* Col 3 — live preview */}
            {previewOpen && <PreviewColumn latex={currentLatex} mathType={mathType} />}
          </div>

          <ActionBar
            latex={currentLatex}
            fontSize={fontSize}
            mathType={mathType}
            getLatex={getLatex}
            getMathML={getMathML}
            send={send}
            onCancel={handleCancel}
            insertStatus={insertStatus}
            onInsertStatusChange={setInsertStatus}
          />
        </div>
        <CommandPalette open={paletteOpen} onClose={closePalette} onInsert={handleInsert} />
      </div>
    </TooltipProvider>
  );
}
