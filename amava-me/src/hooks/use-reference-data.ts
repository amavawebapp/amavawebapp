import { useEffect, useState } from 'react'
import type { ReferenceData } from '../domain/types'
import { useAppServices } from '../app-context'

export function useReferenceData() {
  const { store, engine } = useAppServices()
  const [data, setData] = useState<ReferenceData | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const cached = await store.getReferenceData()
      if (active && cached) setData(cached)
      try {
        await engine.pull()
        const fresh = await store.getReferenceData()
        if (active && fresh) setData(fresh)
      } catch {
        // offline: keep cached
      }
    })()
    return () => { active = false }
  }, [store, engine])

  return data
}
