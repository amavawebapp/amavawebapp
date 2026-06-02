import { useState } from 'react'
import type { ClassGroup } from '../domain/types'
import { CHILD_FIELDS, buildChildFields, type ChildInput } from '../domain/child-fields'
import { Icon } from './ui'

interface Props {
  classes: ClassGroup[]
  allowClassChange: boolean
  initial?: Partial<{ classId: string; firstName: string; surname: string; dateStarted: string; isSample: boolean; fields: Record<string, string> }>
  onSubmit: (input: ChildInput) => void
  onCancel: () => void
  heading?: string
}

export function ChildEditor({ classes, allowClassChange, initial, onSubmit, onCancel, heading = 'Add a child' }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [surname, setSurname] = useState(initial?.surname ?? '')
  const [classId, setClassId] = useState(initial?.classId ?? classes[0]?.id ?? '')
  const [dateStarted, setDateStarted] = useState(initial?.dateStarted ?? new Date().toISOString().slice(0, 10))
  const [isSample, setIsSample] = useState(initial?.isSample ?? true)
  const [fieldVals, setFieldVals] = useState<Record<string, string>>(initial?.fields ?? {})

  const valid = firstName.trim() !== '' && surname.trim() !== '' && classId !== ''

  return (
    <div className="am-scrim" onClick={onCancel}>
      <div className="am-sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="am-sheet__grip" />
        <div className="am-sheet__head">
          <div className="am-ava" style={{ background: 'var(--brand)', width: 40, height: 40, flexBasis: 40, borderRadius: 12 }}>
            <Icon name="plus" size={22} color="#fff" />
          </div>
          <div className="am-h2">{heading}</div>
          <button className="am-sheet__x" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="am-stack" style={{ gap: 16 }}>
          <label className="am-field">
            <span className="am-field__lab">First name</span>
            <input className="am-input" aria-label="first name" placeholder="e.g. Aphiwe" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus />
          </label>
          <label className="am-field">
            <span className="am-field__lab">Surname</span>
            <input className="am-input" aria-label="surname" placeholder="e.g. Mbeki" value={surname} onChange={e => setSurname(e.target.value)} />
          </label>

          {allowClassChange && (
            <div className="am-field">
              <span className="am-field__lab">Class</span>
              <div className="am-hscroll">
                {classes.map(c => {
                  const on = classId === c.id
                  return (
                    <button key={c.id} type="button" className={'am-chip' + (on ? ' am-chip--on' : '')} aria-pressed={on} onClick={() => setClassId(c.id)}>
                      <span className="am-chip__dot" style={{ background: on ? '#fff' : 'var(--brand)' }} />
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {CHILD_FIELDS.map(f => (
            <label key={f.key} className="am-field">
              <span className="am-field__lab">{f.label}</span>
              <input className="am-input" aria-label={f.label} type={f.type === 'date' ? 'date' : 'text'}
                value={fieldVals[f.key] ?? ''} onChange={e => setFieldVals(v => ({ ...v, [f.key]: e.target.value }))} />
            </label>
          ))}

          <div className="am-ctrl">
            <div style={{ flex: 1 }}>
              <div className="am-ctrl__lab">Part of the research sample</div>
              <div className="am-ctrl__sub">Their scores will count in impact reports.</div>
            </div>
            <button className={'am-switch' + (isSample ? ' on' : '')} role="switch" aria-checked={isSample}
              aria-label="Part of the research sample" onClick={() => setIsSample(s => !s)}>
              <span className="am-switch__knob" />
            </button>
          </div>

          <label className="am-field">
            <span className="am-field__lab">Start date</span>
            <input className="am-input" aria-label="start date" type="date" value={dateStarted} onChange={e => setDateStarted(e.target.value)} />
          </label>

          <button className="am-btn am-btn--primary am-btn--block am-btn--lg" disabled={!valid} onClick={() => onSubmit({
            classId, firstName: firstName.trim(), surname: surname.trim(), dateStarted, isSample, fields: buildChildFields(fieldVals),
          })}>
            <Icon name="check" size={20} stroke={3} /> {heading === 'Add a child' ? 'Add child' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
