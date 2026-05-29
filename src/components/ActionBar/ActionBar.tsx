import { TypeToggle } from './TypeToggle';
import { SizeControl } from './SizeControl';
import { CancelButton } from './CancelButton';
import { InsertButton } from './InsertButton';
import type { LoadConfig, OutboundMessage } from '../../types';
import styles from './ActionBar.module.css';

interface ActionBarProps {
  mathType: 'display' | 'inline';
  onMathTypeChange: (v: 'display' | 'inline') => void;
  fontSize: number;
  onFontSizeChange: (v: number) => void;
  getLatex: () => string;
  getMathML: () => string;
  loadConfig: LoadConfig | null;
  send: (payload: OutboundMessage) => void;
  onCancel: () => void;
}

export function ActionBar({
  mathType,
  onMathTypeChange,
  fontSize,
  onFontSizeChange,
  getLatex,
  getMathML,
  loadConfig,
  send,
  onCancel,
}: ActionBarProps) {
  return (
    <div className={styles.actionBar}>
      <TypeToggle value={mathType} onChange={onMathTypeChange} />
      <SizeControl value={fontSize} onChange={onFontSizeChange} />
      <div className={styles.spacer} />
      <CancelButton onCancel={onCancel} className={styles.cancelBtn} />
      <InsertButton
        getLatex={getLatex}
        getMathML={getMathML}
        fontSize={fontSize}
        mathType={mathType}
        loadConfig={loadConfig}
        send={send}
        buttonClassName={styles.insertBtn}
        errorClassName={styles.errorMsg}
      />
    </div>
  );
}
