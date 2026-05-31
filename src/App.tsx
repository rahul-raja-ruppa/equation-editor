import { useState, useCallback, useEffect, useRef } from 'react'
import { useMathField } from './hooks/useMathField'
import { usePostMessage } from './hooks/usePostMessage'
import { ToolbarZone } from './components/Toolbar/ToolbarZone'
import { ExpressionZone } from './components/ExpressionZone/ExpressionZone'
import { MathField } from './components/Editor/MathField'
import { LaTeXBar } from './components/Editor/LaTeXBar'
import { ActionBar } from './components/ActionBar/ActionBar'
import { UtilityRow } from './components/Utility/UtilityRow'
import type { LoadMessage, LoadConfig, OutboundMessage } from './types'
import styles from './App.module.css'

export default function App() {
  const mathField = useMathField()
  const seeded = useRef(false)

  let [mathType, setMathType] = useState<'display' | 'inline'>('display')
  let [fontSize, setFontSize] = useState<number>(12)
  let [loadConfig, setLoadConfig] = useState<LoadConfig | null>(null)
  let [currentLatex, setCurrentLatex] = useState<string>('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}')

  const onLoad = useCallback((msg: LoadMessage) => {
    mathField.setValue(msg.latex)
    setCurrentLatex(msg.latex)
    setMathType(msg.config.mathType)
    setFontSize(msg.config.fontSize)
    setLoadConfig(msg.config)
  }, [mathField])

  const { send } = usePostMessage(onLoad)

  useEffect(() => {
    const seed = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}'
    const timer = window.setTimeout(() => {
      if (!seeded.current && !mathField.getValue('latex')) {
        mathField.setValue(seed)
        seeded.current = true
      }
    }, 100)
    return () => window.clearTimeout(timer)
  }, [mathField])

  function handleInsert(latex: string) {
    mathField.insert(latex)
  }

  function handleLatexCommit(latex: string) {
    mathField.setValue(latex)
    setCurrentLatex(latex)
  }

  function handleCancel() {
    const payload: OutboundMessage = { type: 'cancel' }
    send(payload)
  }

  function getLatex() {
    return mathField.getValue('latex')
  }

  function getMathML() {
    return mathField.getValue('math-ml')
  }

  return (
    <div className={styles.root}>
      <div className={styles.editor} data-skin="a">
        <UtilityRow
          mathType={mathType}
          onMathTypeChange={setMathType}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onInsert={handleInsert}
        />
        <div className={styles.toolbar}>
          <ToolbarZone onInsert={handleInsert} />
        </div>
        <div className={styles.expressions}>
          <ExpressionZone onInsert={handleInsert} />
        </div>
        <div className={styles.canvas}>
          <MathField mathFieldRef={mathField.ref} onChange={setCurrentLatex} fontSize={fontSize} />
          <LaTeXBar value={currentLatex} onCommit={handleLatexCommit} />
        </div>
        <div className={styles.actionBar}>
          <ActionBar
            fontSize={fontSize}
            mathType={mathType}
            getLatex={getLatex}
            getMathML={getMathML}
            loadConfig={loadConfig}
            send={send}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}
