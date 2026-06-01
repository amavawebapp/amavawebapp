import { useEffect, useState } from 'react'
import type { Assessment } from '../domain/types'
import { useAppServices } from '../app-context'

/** Loads all assessments the user may see (cache-first, then refresh from server). */
export function useReportAssessments() {
  const { store, engine } = useAppServices()
  const [assessments, setAssessments] = useState<Assessment[] | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const cached = await store.getAllAssessments()
      if (active && cached.length) setAssessments(cached)
      try {
        await engine.pull()
        const fresh = await store.getAllAssessments()
        if (active) setAssessments(fresh)
      } catch {
        if (active && !cached.length) setAssessments([])
      }
    })()
    return () => { active = false }
  }, [store, engine])

  return assessments
}
