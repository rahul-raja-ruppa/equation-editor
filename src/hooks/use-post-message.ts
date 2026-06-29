import { useEffect, useRef } from 'react';
import type { LoadMessage, OutboundMessage } from '../types';

export function usePostMessage(
  onLoad: (msg: LoadMessage) => void,
  onInsertRequested: () => void,
  onInsertSuccess: () => void,
  onInsertError: () => void
) {
  const originRef = useRef<string | null>(null);
  // Keep stable refs so the message listener never needs to be re-registered
  // when the caller's callbacks change across renders.
  const onInsertRequestedRef = useRef(onInsertRequested);
  const onInsertSuccessRef = useRef(onInsertSuccess);
  const onInsertErrorRef = useRef(onInsertError);
  useEffect(() => {
    onInsertRequestedRef.current = onInsertRequested;
    onInsertSuccessRef.current = onInsertSuccess;
    onInsertErrorRef.current = onInsertError;
  });

  useEffect(() => {
    const cmsOrigin = import.meta.env.VITE_CMS_ORIGIN as string | undefined;

    function handler(e: MessageEvent): void {
      // If VITE_CMS_ORIGIN is set, enforce it strictly.
      // Otherwise lock to the first sender after the initial load.
      const trusted = cmsOrigin ?? originRef.current;
      if (trusted && e.origin !== trusted) return;

      if (e.data?.type === 'load') {
        if (!originRef.current) {
          originRef.current = e.origin;
        }
        onLoad(e.data as LoadMessage);
      } else if (e.data?.type === 'insert-requested') {
        onInsertRequestedRef.current();
      } else if (e.data?.type === 'insert-success') {
        onInsertSuccessRef.current();
      } else if (e.data?.type === 'insert-error') {
        onInsertErrorRef.current();
      }
    }

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
    // onLoad is intentionally excluded — callers must memoize if needed,
    // and re-subscribing on every render would thrash the listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function send(payload: OutboundMessage): void {
    if (!originRef.current) return;
    window.parent.postMessage(payload, originRef.current);
  }

  return { send };
}
