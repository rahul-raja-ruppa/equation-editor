import { useEffect, useRef, useState } from 'react'
import type { TabId, Section } from '../types'

// Module-level cache — survives across hook unmount/remount cycles within a session.
// Keyed by TabId; populated on first activation, never re-fetched.
const tabCache = new Map<TabId, Section[]>()

export function useTabData(tabId: TabId) {
  const [sections, setSections] = useState<Section[]>(
    () => tabCache.get(tabId) ?? []
  )
  const [loading, setLoading] = useState<boolean>(!tabCache.has(tabId))

  // Track in-flight requests so a fast tabId change doesn't double-load
  const inFlightRef = useRef<TabId | null>(null)

  useEffect(() => {
    if (tabCache.has(tabId)) {
      setSections(tabCache.get(tabId)!)
      setLoading(false)
      return
    }

    let cancelled = false
    inFlightRef.current = tabId
    setLoading(true)

    import(`../data/tabs/${tabId}.json`)
      .then((mod) => {
        if (cancelled) return
        // Vite JSON imports: mod.default is the JSON root object
        // New shape: { id, label, sections: Section[] }
        const root = mod.default as { sections: Section[] }
        const data: Section[] = root.sections ?? []
        tabCache.set(tabId, data)
        setSections(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        // On error: leave sections empty, clear loading — caller can decide
        setLoading(false)
      })
      .finally(() => {
        if (inFlightRef.current === tabId) inFlightRef.current = null
      })

    return () => {
      cancelled = true
    }
  }, [tabId])

  return { sections, loading }
}
