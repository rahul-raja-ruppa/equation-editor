import { CancelButton } from './CancelButton';
import { InsertButton } from './InsertButton';
import type { LoadConfig, OutboundMessage } from '../../types';
import styles from './ActionBar.module.css';

interface ActionBarProps {
  fontSize: number;
  mathType: 'display' | 'inline';
  getLatex: () => string;
  getMathML: () => string;
  loadConfig: LoadConfig | null;
  send: (payload: OutboundMessage) => void;
  onCancel: () => void;
}

export function ActionBar({
  fontSize,
  mathType,
  getLatex,
  getMathML,
  loadConfig,
  send,
  onCancel,
}: ActionBarProps) {
  return (
    <div className={styles.actionBar}>
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
