import { useState } from 'react';
import { convertEquation } from '../../api/texconversion';
import type { LoadConfig, OutboundMessage } from '../../types';

interface InsertButtonProps {
  getLatex: () => string;
  getMathML: () => string;
  fontSize: number;
  mathType: 'display' | 'inline';
  loadConfig: LoadConfig | null;
  send: (payload: OutboundMessage) => void;
  buttonClassName?: string;
  errorClassName?: string;
}

type Status = 'idle' | 'loading' | 'error';

export function InsertButton({
  getLatex,
  getMathML,
  fontSize,
  mathType,
  loadConfig,
  send,
  buttonClassName,
  errorClassName,
}: InsertButtonProps) {
  let [status, setStatus] = useState<Status>('idle');
  let [errorMsg, setErrorMsg] = useState<string>('');

  async function handleClick() {
    if (status === 'loading') return;

    setStatus('loading');

    const latex = getLatex();
    if (latex === '') {
      setStatus('idle');
      return;
    }

    const mathml = getMathML();

    if (loadConfig === null) {
      setStatus('error');
      setErrorMsg('No config loaded');
      return;
    }

    try {
      const result = await convertEquation({
        tex: latex,
        customer: loadConfig.customer,
        project: loadConfig.project,
        doi: loadConfig.doi,
        mathmode: mathType,
      });

      send({
        type: 'insert',
        latex,
        mathml,
        imageUrl: result.imageUrl,
        fontSize,
        mathType,
      });

      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message);
    }
  }

  const isLoading = status === 'loading';

  return (
    <>
      <button type="button" className={buttonClassName} onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Inserting…' : 'Insert'}
      </button>
      {status === 'error' && <span className={errorClassName}>{errorMsg}</span>}
    </>
  );
}
