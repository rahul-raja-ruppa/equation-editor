import { useState, useEffect, useCallback } from 'react'

export interface FlyoutPosition {
  top: number
  left: number
  anchorWidth: number
}

interface UseFlyoutReturn {
  openId: string | null
  position: FlyoutPosition
  open: (id: string, rect: DOMRect) => void
  close: () => void
}

export function useFlyout(): UseFlyoutReturn {
  let [openId, setOpenId] = useState<string | null>(null)
  let [position, setPosition] = useState<FlyoutPosition>({ top: 0, left: 0, anchorWidth: 0 })

  const close = useCallback(() => {
    setOpenId(null)
  }, [])

  const open = useCallback((id: string, rect: DOMRect) => {
    setOpenId(id)
    setPosition({ top: rect.bottom, left: rect.left, anchorWidth: rect.width })
  }, [])

  useEffect(() => {
    if (!openId) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element
      if (!target.closest('[data-flyout]') && !target.closest('[data-category-btn]')) {
        close()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openId, close])

  return { openId, position, open, close }
}
