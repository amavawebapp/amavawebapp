import { useState, type ReactNode } from 'react'
import type { Programme, ClassGroup } from '../domain/types'

interface Props {
  programmes: Programme[]
  classes: ClassGroup[]
  onAddProgramme: (name: string) => void
  onRenameProgramme: (id: string, name: string) => void
  onToggleProgrammeActive: (id: string, active: boolean) => void
  onAddClass: (programmeId: string, name: string) => void
  onRenameClass: (id: string, name: string) => void
  onToggleGarden: (id: string, hasGardenComponent: boolean) => void
  onToggleClassActive: (id: string, active: boolean) => void
}

function NameRow({ value, onSave, children }: { value: string; onSave: (v: string) => void; children?: ReactNode }) {
  const [v, setV] = useState(value)
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
      <input value={v} onChange={e => setV(e.target.value)} />
      {v !== value && <button disabled={!v.trim()} onClick={() => onSave(v.trim())}>Save</button>}
      {children}
    </div>
  )
}

export function ProgrammeClassManager(p: Props) {
  const [newProg, setNewProg] = useState('')
  const [newClass, setNewClass] = useState<Record<string, string>>({})
  return (
    <div>
      {p.programmes.map(prog => (
        <section key={prog.id} style={{ border: '1px solid var(--sage)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 12, opacity: prog.active ? 1 : 0.5 }}>
          <NameRow value={prog.name} onSave={name => p.onRenameProgramme(prog.id, name)}>
            <button onClick={() => p.onToggleProgrammeActive(prog.id, !prog.active)}>{prog.active ? 'Retire' : 'Restore'}</button>
          </NameRow>
          {p.classes.filter(c => c.programmeId === prog.id).map(c => (
            <div key={c.id} style={{ marginLeft: 16, opacity: c.active ? 1 : 0.5 }}>
              <NameRow value={c.name} onSave={name => p.onRenameClass(c.id, name)}>
                <label style={{ fontSize: 12 }}><input type="checkbox" checked={c.hasGardenComponent} onChange={e => p.onToggleGarden(c.id, e.target.checked)} /> garden</label>
                <button onClick={() => p.onToggleClassActive(c.id, !c.active)}>{c.active ? 'Retire' : 'Restore'}</button>
              </NameRow>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginLeft: 16, marginTop: 8 }}>
            <input aria-label={`new class for ${prog.name}`} placeholder="New class…" value={newClass[prog.id] ?? ''} onChange={e => setNewClass(s => ({ ...s, [prog.id]: e.target.value }))} />
            <button disabled={!(newClass[prog.id] ?? '').trim()} onClick={() => { p.onAddClass(prog.id, (newClass[prog.id] ?? '').trim()); setNewClass(s => ({ ...s, [prog.id]: '' })) }}>Add class</button>
          </div>
        </section>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <input aria-label="new programme" placeholder="New programme…" value={newProg} onChange={e => setNewProg(e.target.value)} />
        <button className="primary" disabled={!newProg.trim()} onClick={() => { p.onAddProgramme(newProg.trim()); setNewProg('') }}>Add programme</button>
      </div>
    </div>
  )
}
