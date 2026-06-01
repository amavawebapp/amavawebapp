import { useState } from 'react'
import type {
  Assessment, AssessmentType, Child, ClassGroup, DevelopmentArea, Indicator, Programme,
} from '../domain/types'
import { visibleAreas } from '../domain/assessment-logic'
import { AreaStep } from '../components/AreaStep'

interface Props {
  programme: Programme
  areas: DevelopmentArea[]
  indicators: Indicator[]
  cls: ClassGroup
  child: Child
  type: AssessmentType
  facilitatorId: string
  today: string
  onSubmit: (a: Assessment) => void
  onCancel: () => void
}

let idSeq = 0
function newId(today: string, childId: string): string {
  idSeq += 1
  return `${childId}-${today}-${idSeq}`
}

export function AssessmentFlow(props: Props) {
  const { programme, areas, indicators, cls, child, type, facilitatorId, today } = props
  const steps = visibleAreas(areas, cls)
  const [stepIdx, setStepIdx] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [coAssessors, setCoAssessors] = useState('')
  const [error, setError] = useState('')

  const area = steps[stepIdx]
  const areaIndicators = indicators.filter(i => i.areaId === area.id && i.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const allIndicators = indicators.filter(
    i => i.active && steps.some(s => s.id === i.areaId),
  )
  const isLast = stepIdx === steps.length - 1

  function handleSubmit() {
    const unscored = allIndicators.filter(i => scores[i.id] == null)
    if (unscored.length > 0) {
      setError('Please score every indicator before saving.')
      return
    }
    const assessment: Assessment = {
      id: newId(today, child.id),
      childId: child.id,
      type,
      date: today,
      assessedBy: facilitatorId,
      coAssessors,
      scaleMax: programme.scaleMax,
      scores: allIndicators.map(i => ({
        indicatorId: i.id, indicatorText: i.text, score: scores[i.id],
      })),
      observations: Object.entries(notes)
        .filter(([, note]) => note.trim() !== '')
        .map(([areaId, note]) => ({ areaId, note })),
      syncState: 'pending',
    }
    props.onSubmit(assessment)
  }

  return (
    <div className="container">
      <header>
        <h1>{child.firstName} {child.surname}</h1>
        <p style={{ color: 'var(--muted)' }}>
          {type === 'baseline' ? 'Baseline' : 'Quarterly'} · {cls.name} · Step {stepIdx + 1} of {steps.length}
        </p>
      </header>

      <AreaStep
        area={area}
        indicators={areaIndicators}
        descriptors={programme.scaleDescriptors}
        scores={scores}
        note={notes[area.id] ?? ''}
        onScore={(indicatorId, value) => setScores(s => ({ ...s, [indicatorId]: value }))}
        onNote={note => setNotes(n => ({ ...n, [area.id]: note }))}
      />

      {isLast && (
        <label style={{ display: 'block', marginTop: 12 }}>
          Co-facilitators who agreed on these scores
          <input
            value={coAssessors}
            onChange={e => setCoAssessors(e.target.value)}
            style={{ width: '100%', font: 'inherit' }}
          />
        </label>
      )}

      {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {stepIdx > 0 && (
          <button type="button" onClick={() => setStepIdx(i => i - 1)}>Back</button>
        )}
        {!isLast && (
          <button type="button" className="primary" onClick={() => setStepIdx(i => i + 1)}>
            Next
          </button>
        )}
        {isLast && (
          <button type="button" className="primary" onClick={handleSubmit}>
            Save assessment
          </button>
        )}
        <button type="button" onClick={props.onCancel}>Cancel</button>
      </div>
    </div>
  )
}
