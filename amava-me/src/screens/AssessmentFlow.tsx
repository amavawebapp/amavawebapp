import { useState } from 'react'
import type {
  Assessment, AssessmentType, Child, ClassGroup, DevelopmentArea, Indicator, Programme,
} from '../domain/types'
import { visibleAreas } from '../domain/assessment-logic'
import { AreaStep } from '../components/AreaStep'
import { AppBar, Avatar, Icon } from '../components/ui'
import { areaIcon, shortLabel } from '../domain/view-model'

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

export function AssessmentFlow(props: Props) {
  const { programme, areas, indicators, cls, child, type, facilitatorId, today } = props
  const steps = visibleAreas(areas, cls)
  const [stepIdx, setStepIdx] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [coAssessors, setCoAssessors] = useState('')
  const [error, setError] = useState('')

  if (steps.length === 0) {
    return <p className="container">No assessment areas available for this class.</p>
  }

  const totalSteps = steps.length + 1
  const isReview = stepIdx === steps.length
  const area = isReview ? null : steps[stepIdx]

  const indicatorsFor = (areaId: string) =>
    indicators.filter(i => i.areaId === areaId && i.active).sort((a, b) => a.sortOrder - b.sortOrder)

  const allIndicators = indicators
    .filter(i => i.active && steps.some(s => s.id === i.areaId))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  function handleBack() {
    setError('')
    if (stepIdx === 0) {
      props.onCancel()
    } else {
      setStepIdx(s => s - 1)
    }
  }

  function handleNext() {
    if (!area) return
    const unscored = indicatorsFor(area.id).filter(i => scores[i.id] == null)
    if (unscored.length > 0) {
      setError('Please score every indicator before saving.')
      return
    }
    setError('')
    setStepIdx(s => s + 1)
  }

  function handleSubmit() {
    const unscored = allIndicators.filter(i => scores[i.id] == null)
    if (unscored.length > 0) {
      setError('Please score every indicator before saving.')
      return
    }
    const assessment: Assessment = {
      id: crypto.randomUUID(),
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
      attachments: [],
      syncState: 'pending',
    }
    props.onSubmit(assessment)
  }

  return (
    <div className="am-root am-screen">
      <AppBar
        title={`${child.firstName} ${child.surname}`}
        onBack={handleBack}
        right={<Avatar name={`${child.firstName} ${child.surname}`} size={42} />}
      />
      <div className="am-pad" style={{ paddingTop: 0, paddingBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="am-row__sub">
          {type === 'baseline' ? 'First assessment' : 'Quarterly check-in'} · {cls.name}
        </div>
        <div className="am-steps">
          {steps.map((s, i) => (
            <div key={s.id} className={'am-steps__d' + (i < stepIdx ? ' done' : i === stepIdx ? ' now' : '')} />
          ))}
          <div className={'am-steps__d' + (isReview ? ' now' : '')} />
        </div>
        <div className="am-row__sub" style={{ fontWeight: 700 }}>
          {isReview ? 'Review & save' : `Step ${stepIdx + 1} of ${totalSteps} · ${area!.name}`}
        </div>
      </div>

      <div className="am-scroll am-pad" style={{ paddingTop: 4, paddingBottom: 120 }}>
        {!isReview && area ? (
          <AreaStep
            area={area}
            indicators={indicatorsFor(area.id)}
            descriptors={programme.scaleDescriptors}
            scores={scores}
            note={notes[area.id] ?? ''}
            onScore={(indicatorId, value) => { setScores(s => ({ ...s, [indicatorId]: value })); setError('') }}
            onNote={note => setNotes(n => ({ ...n, [area.id]: note }))}
          />
        ) : (
          <div className="am-anim am-stack">
            <div>
              <div className="am-eyebrow">Almost done</div>
              <div className="am-h1">Review the scores</div>
              <p className="am-muted" style={{ margin: '6px 0 0' }}>Tap any area to fix a score before saving.</p>
            </div>
            {steps.map((a, i) => {
              const inds = indicatorsFor(a.id)
              const vals = inds.map(ind => scores[ind.id]).filter(v => v != null)
              const av = vals.length ? (vals.reduce((x, y) => x + y, 0) / vals.length).toFixed(1) : '—'
              return (
                <button
                  key={a.id}
                  type="button"
                  className="am-card am-card--pad"
                  onClick={() => { setError(''); setStepIdx(i) }}
                  style={{ textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div className="am-ava" style={{ background: 'var(--brand)', width: 36, height: 36, flexBasis: 36, borderRadius: 11 }}>
                      <Icon name={areaIcon(a.sortOrder)} size={20} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>{a.name}</div>
                      <div className="am-row__sub">Average {av} / {programme.scaleMax}</div>
                    </div>
                    <Icon name="pencil" size={18} color="var(--sage)" />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {inds.map(ind => (
                      <span key={ind.id} className="am-chip" style={{ fontSize: '.74rem', padding: '5px 9px' }}>
                        {shortLabel(ind.text, 14)}: <strong style={{ color: 'var(--brand)' }}>{scores[ind.id] ?? '–'}</strong>
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}
            <label className="am-field">
              <span className="am-field__lab">
                Who agreed on these scores? <span className="am-muted" style={{ fontWeight: 600 }}>(optional)</span>
              </span>
              <input
                className="am-input"
                value={coAssessors}
                onChange={e => setCoAssessors(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 18px))',
          background: 'color-mix(in srgb, var(--surface) 86%, transparent)',
          backdropFilter: 'blur(10px)', borderTop: '1px solid var(--line)', zIndex: 9,
        }}
      >
        {error && (
          <p style={{ color: 'var(--warn)', fontWeight: 700, fontSize: '.88rem', margin: '0 0 8px', textAlign: 'center' }}>
            {error}
          </p>
        )}
        {!isReview ? (
          <button type="button" className="am-btn am-btn--primary am-btn--block am-btn--lg" onClick={handleNext}>
            Next <Icon name="arrowright" size={20} stroke={2.6} />
          </button>
        ) : (
          <button type="button" className="am-btn am-btn--primary am-btn--block am-btn--lg" onClick={handleSubmit}>
            <Icon name="check" size={20} stroke={3} /> Save assessment
          </button>
        )}
      </div>
    </div>
  )
}
