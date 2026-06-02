import { useState } from 'react'
import type { ClassGroup } from '../domain/types'
import { CHILD_FIELDS, buildChildFields, type ChildInput } from '../domain/child-fields'

interface Props {
  classes: ClassGroup[]
  allowClassChange: boolean
  initial?: Partial<{ classId: string; firstName: string; surname: string; dateStarted: string; isSample: boolean; fields: Record<string, string> }>
  onSubmit: (input: ChildInput) => void
  onCancel: () => void
}

export function ChildEditor({ classes, allowClassChange, initial, onSubmit, onCancel }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [surname, setSurname] = useState(initial?.surname ?? '')
  const [classId, setClassId] = useState(initial?.classId ?? classes[0]?.id ?? '')
  const [dateStarted, setDateStarted] = useState(initial?.dateStarted ?? new Date().toISOString().slice(0, 10))
  const [isSample, setIsSample] = useState(initial?.isSample ?? true)
  const [fieldVals, setFieldVals] = useState<Record<string, string>>(initial?.fields ?? {})

  const valid = firstName.trim() !== '' && surname.trim() !== '' && classId !== ''

  return (
    <div style={{ border: '1px solid var(--sage)', borderRadius: 'var(--radius)', padding: 12, marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input aria-label="first name" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
        <input aria-label="surname" placeholder="Surname" value={surname} onChange={e => setSurname(e.target.value)} />
      </div>
      {allowClassChange && (
        <label style={{ display: 'block', marginBottom: 8 }}>Class{' '}
          <select aria-label="class" value={classId} onChange={e => setClassId(e.target.value)}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}
      {CHILD_FIELDS.map(f => (
        <label key={f.key} style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>{f.label}{' '}
          <input aria-label={f.label} type={f.type === 'date' ? 'date' : 'text'}
            value={fieldVals[f.key] ?? ''} onChange={e => setFieldVals(v => ({ ...v, [f.key]: e.target.value }))} />
        </label>
      ))}
      <label style={{ display: 'block', margin: '8px 0' }}>Start date{' '}
        <input aria-label="start date" type="date" value={dateStarted} onChange={e => setDateStarted(e.target.value)} />
      </label>
      <label style={{ display: 'block', marginBottom: 8 }}>
        <input type="checkbox" checked={isSample} onChange={e => setIsSample(e.target.checked)} /> Sample child (tracked for M&amp;E)
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="primary" disabled={!valid} onClick={() => onSubmit({
          classId, firstName: firstName.trim(), surname: surname.trim(), dateStarted, isSample, fields: buildChildFields(fieldVals),
        })}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
