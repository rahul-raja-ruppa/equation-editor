import { useState, useCallback } from 'react';
import { useMathField } from './hooks/useMathField';
import { usePostMessage } from './hooks/usePostMessage';
import { StyleBar } from './components/Toolbar/StyleBar';
import TabStrip from './components/Toolbar/TabStrip';
import SymbolGrid from './components/Toolbar/SymbolGrid';
import { MathField } from './components/Editor/MathField';
import { LaTeXBar } from './components/Editor/LaTeXBar';
import { ActionBar } from './components/ActionBar/ActionBar';
import type { LoadMessage, LoadConfig, OutboundMessage, TabId } from './types';
import { TAB_IDS } from './types';
import styles from './App.module.css';

export default function App() {
  const mathField = useMathField();

  let [activeTab, setActiveTab] = useState<TabId>(TAB_IDS[0]);
  let [mathType, setMathType] = useState<'display' | 'inline'>('display');
  let [fontSize, setFontSize] = useState<number>(12);
  let [loadConfig, setLoadConfig] = useState<LoadConfig | null>(null);
  let [currentLatex, setCurrentLatex] = useState<string>('');

  const onLoad = useCallback(
    (msg: LoadMessage) => {
      mathField.setValue(msg.latex);
      setCurrentLatex(msg.latex);
      setMathType(msg.config.mathType);
      setFontSize(msg.config.fontSize);
      setLoadConfig(msg.config);
    },
    [mathField]
  );

  const { send } = usePostMessage(onLoad);

  function handleInsert(latex: string) {
    mathField.insert(latex);
  }

  function handleLatexCommit(latex: string) {
    mathField.setValue(latex);
    setCurrentLatex(latex);
  }

  function handleCancel() {
    const payload: OutboundMessage = { type: 'cancel' };
    send(payload);
  }

  function getLatex() {
    return mathField.getValue('latex');
  }

  function getMathML() {
    return mathField.getValue('math-ml');
  }

  return (
    <div className={styles.root}>
      <div className={styles.styleBar}>
        <StyleBar fontSize={fontSize} onFontSizeChange={setFontSize} />
      </div>
      <div className={styles.tabStrip}>
        <TabStrip activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className={styles.symbolGrid}>
        <SymbolGrid key={activeTab} activeTab={activeTab} onInsert={handleInsert} />
      </div>
      <div className={styles.canvas}>
        <MathField mathFieldRef={mathField.ref} onChange={setCurrentLatex} />
        <LaTeXBar value={currentLatex} onCommit={handleLatexCommit} />
      </div>
      <div className={styles.actionBar}>
        <ActionBar
          mathType={mathType}
          onMathTypeChange={setMathType}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          getLatex={getLatex}
          getMathML={getMathML}
          loadConfig={loadConfig}
          send={send}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
