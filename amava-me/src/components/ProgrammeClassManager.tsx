import { useState } from 'react'
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

function ProgrammeRow(p: Props & { prog: Programme }) {
  const { prog } = p
  const [name, setName] = useState(prog.name)
  const [newClass, setNewClass] = useState('')
  return (
    <div className="am-card am-card--pad" style={{ opacity: prog.active ? 1 : 0.55, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="am-input" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, fontWeight: 700 }} />
        {name !== prog.name && (
          <button className="am-btn" disabled={!name.trim()} onClick={() => p.onRenameProgramme(prog.id, name.trim())}>Save</button>
        )}
        <button className="am-btn am-btn--ghost" aria-label={prog.active ? 'retire programme' : 'restore programme'}
          onClick={() => p.onToggleProgrammeActive(prog.id, !prog.active)}>{prog.active ? 'Retire' : 'Restore'}</button>
      </div>

      <div className="am-stack" style={{ gap: 8 }}>
        {p.classes.filter(c => c.programmeId === prog.id).map(c => (
          <ClassRow key={c.id} cls={c}
            onRenameClass={p.onRenameClass} onToggleGarden={p.onToggleGarden} onToggleClassActive={p.onToggleClassActive} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input className="am-input" aria-label={`new class for ${prog.name}`} placeholder="New class…"
          value={newClass} onChange={e => setNewClass(e.target.value)} style={{ flex: 1 }} />
        <button className="am-btn" disabled={!newClass.trim()}
          onClick={() => { p.onAddClass(prog.id, newClass.trim()); setNewClass('') }}>Add class</button>
      </div>
    </div>
  )
}

function ClassRow({ cls, onRenameClass, onToggleGarden, onToggleClassActive }: {
  cls: ClassGroup
  onRenameClass: (id: string, name: string) => void
  onToggleGarden: (id: string, hasGardenComponent: boolean) => void
  onToggleClassActive: (id: string, active: boolean) => void
}) {
  const [name, setName] = useState(cls.name)
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: cls.active ? 1 : 0.55 }}>
      <input className="am-input" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} />
      {name !== cls.name && (
        <button className="am-btn" disabled={!name.trim()} onClick={() => onRenameClass(cls.id, name.trim())}>Save</button>
      )}
      <button className={'am-switch' + (cls.hasGardenComponent ? ' on' : '')} role="switch"
        aria-checked={cls.hasGardenComponent} aria-label={`garden component for ${cls.name}`}
        onClick={() => onToggleGarden(cls.id, !cls.hasGardenComponent)}>
        <span className="am-switch__knob" />
      </button>
      <button className="am-btn am-btn--ghost" onClick={() => onToggleClassActive(cls.id, !cls.active)}>{cls.active ? 'Retire' : 'Restore'}</button>
    </div>
  )
}

export function ProgrammeClassManager(p: Props) {
  const [newProg, setNewProg] = useState('')
  return (
    <div className="am-stack" style={{ gap: 12 }}>
      {p.programmes.map(prog => (
        <ProgrammeRow key={prog.id} {...p} prog={prog} />
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="am-input" aria-label="new programme" placeholder="New programme…"
          value={newProg} onChange={e => setNewProg(e.target.value)} style={{ flex: 1 }} />
        <button className="am-btn am-btn--primary" disabled={!newProg.trim()}
          onClick={() => { p.onAddProgramme(newProg.trim()); setNewProg('') }}>Add programme</button>
      </div>
    </div>
  )
}
