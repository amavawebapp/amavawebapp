import { useCallback, useEffect, useState } from 'react'
import type { ReferenceData } from '../domain/types'
import { useAppServices } from '../app-context'

/** Online refetch of reference data for the Settings screen, plus whether any
 *  assessments exist (drives the scale-change warning). */
export function useConfigData() {
  const { store, engine } = useAppServices()
  const [ref, setRef] = useState<ReferenceData | null>(null)
  const [hasAssessments, setHasAssessments] = useState(false)

  const refresh = useCallback(async () => {
    try { await engine.pull() } catch { /* fall back to cache */ }
    setRef(await store.getReferenceData())
    setHasAssessments((await store.getAllAssessments()).length > 0)
  }, [store, engine])

  useEffect(() => { refresh() }, [refresh])

  return { ref, refresh, hasAssessments }
}
