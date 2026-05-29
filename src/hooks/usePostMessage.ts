import { useEffect, useRef } from 'react'
import type { LoadMessage, OutboundMessage } from '../types'

export function usePostMessage(onLoad: (msg: LoadMessage) => void) {
  const originRef = useRef<string | null>(null)

  useEffect(() => {
    const cmsOrigin = import.meta.env.VITE_CMS_ORIGIN as string | undefined

    function handler(e: MessageEvent): void {
      if (cmsOrigin && e.origin !== cmsOrigin) return

      if (e.data?.type === 'load') {
        if (!originRef.current) {
          originRef.current = e.origin
        }
        onLoad(e.data as LoadMessage)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  // onLoad is intentionally excluded — callers must memoize if needed,
  // and re-subscribing on every render would thrash the listener.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function send(payload: OutboundMessage): void {
    window.parent.postMessage(payload, originRef.current ?? '*')
  }

  return { send }
}
