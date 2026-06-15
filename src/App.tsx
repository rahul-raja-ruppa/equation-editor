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
import type { LoadMessage, OutboundMessage } from './types';

export default function App() {
  const mathField = useMathField();
  const cardRef = useRef<HTMLDivElement>(null);

  let [mathType, setMathType] = useState<'display' | 'inline'>('display');
  let [fontSize, setFontSize] = useState<number>(12);
  let [currentLatex, setCurrentLatex] = useState<string>('');
  let [previewOpen, setPreviewOpen] = useState(false);
  let [paletteOpen, setPaletteOpen] = useState(false);
  let [hasSelection, setHasSelection] = useState(false);

  const onLoad = useCallback(
    (msg: LoadMessage) => {
      mathField.setValue(msg.latex);
      setCurrentLatex(msg.latex);
      setMathType(msg.config.mathType);
      setFontSize(msg.config.fontSize);
    },
    [mathField]
  );

  const { send } = usePostMessage(onLoad);

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

  function handleInsert(latex: string) {
    mathField.insert(latex);
    setCurrentLatex(mathField.getValue('latex'));
    flash();
  }

  function handleWrap(latex: string) {
    mathField.wrap(latex);
    setCurrentLatex(mathField.getValue('latex'));
    flash();
  }

  function handleLatexCommit(latex: string) {
    mathField.setValue(latex);
    setCurrentLatex(latex);
  }

  function handleUndo() {
    (mathField.ref.current as MathfieldElement | null)?.executeCommand('undo');
  }

  function handleRedo() {
    (mathField.ref.current as MathfieldElement | null)?.executeCommand('redo');
  }

  function handleClear() {
    (mathField.ref.current as MathfieldElement | null)?.setValue('');
    setCurrentLatex('');
  }

  function handleCancel() {
    const payload: OutboundMessage = { type: 'cancel' };
    send(payload);
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
          <div className="flex min-h-0 flex-1">
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
            {previewOpen && (
              <PreviewColumn latex={currentLatex} mathType={mathType} />
            )}
          </div>

          <ActionBar
            latex={currentLatex}
            fontSize={fontSize}
            mathType={mathType}
            getLatex={getLatex}
            getMathML={getMathML}
            send={send}
            onCancel={handleCancel}
          />
        </div>
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onInsert={handleInsert}
        />
      </div>
    </TooltipProvider>
  );
}
