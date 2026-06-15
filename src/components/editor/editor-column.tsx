import type { RefObject } from 'react';
import type { useMathField } from '../../hooks/use-math-field';
import { LaTeXPanel } from './latex-panel';
import { EditorSurface } from './editor-surface';

interface EditorColumnProps {
  latex: string;
  onCommit: (latex: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  fontSize: number;
  mathType: 'display' | 'inline';
  mathFieldRef: ReturnType<typeof useMathField>['ref'];
  onChange: (latex: string) => void;
  onSelectionChange: (hasSelection: boolean) => void;
  hasSelection: boolean;
  onWrap: (latex: string) => void;
  cardRef: RefObject<HTMLDivElement>;
}

export function EditorColumn(props: EditorColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-[40%] min-h-[132px] flex-col border-b border-ink-200 bg-surface">
        <LaTeXPanel
          value={props.latex}
          onCommit={props.onCommit}
          onUndo={props.onUndo}
          onRedo={props.onRedo}
          onClear={props.onClear}
        />
      </div>
      <EditorSurface
        mathFieldRef={props.mathFieldRef}
        onChange={props.onChange}
        fontSize={props.fontSize}
        latex={props.latex}
        mathType={props.mathType}
        onSelectionChange={props.onSelectionChange}
        hasSelection={props.hasSelection}
        onWrap={props.onWrap}
        cardRef={props.cardRef}
      />
    </div>
  );
}
