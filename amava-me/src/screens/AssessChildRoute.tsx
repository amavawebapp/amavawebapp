import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useAppServices } from '../app-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { AssessmentFlow } from './AssessmentFlow'
import { nextAssessmentType } from '../domain/assessment-logic'
import type { Assessment } from '../domain/types'

export function AssessChildRoute() {
  const { childId } = useParams()
  const { session } = useAuth()
  const { store, engine } = useAppServices()
  const ref = useReferenceData()
  const navigate = useNavigate()
  const [type, setType] = useState<'baseline' | 'quarterly' | null>(null)

  useEffect(() => {
    if (childId) store.getAssessmentsForChild(childId).then(h => setType(nextAssessmentType(h)))
  }, [childId, store])

  if (!ref || !type) return <p className="container">Loading…</p>
  const child = ref.children.find(c => c.id === childId)
  const cls = child ? ref.classes.find(c => c.id === child.classId) : undefined
  const programme = cls ? ref.programmes.find(p => p.id === cls.programmeId) : undefined
  if (!child || !cls || !programme) return <Navigate to="/" replace />
  const clsId = cls.id
  const areas = ref.areas.filter(a => a.programmeId === programme.id)
  const indicators = ref.indicators.filter(i => areas.some(a => a.id === i.areaId))

  async function handleSubmit(a: Assessment) {
    await store.enqueueAssessment(a)
    await engine.push() // best-effort; stays queued if offline
    navigate(`/class/${clsId}`)
  }

  return (
    <AssessmentFlow
      programme={programme} areas={areas} indicators={indicators}
      cls={cls} child={child} type={type}
      facilitatorId={session!.user.id} today={new Date().toISOString().slice(0, 10)}
      onSubmit={handleSubmit} onCancel={() => navigate(`/class/${clsId}`)}
    />
  )
}
