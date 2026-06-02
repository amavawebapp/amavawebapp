import { useState } from 'react'
import type { Facilitator, ClassGroup } from '../domain/types'
import { validateUsername } from '../domain/username'

interface CreateInput { username: string; password: string; name: string; role: string; classIds: string[] }
interface Props {
  facilitators: Facilitator[]
  classes: ClassGroup[]
  onCreate: (input: CreateInput) => void
  onSetPassword: (userId: string, password: string) => void
  onUpdate: (userId: string, name: string, role: string, classIds: string[]) => void
  onSetActive: (userId: string, active: boolean) => void
}

function ClassChecks({ classes, selected, onToggle, labelPrefix }: { classes: ClassGroup[]; selected: string[]; onToggle: (id: string) => void; labelPrefix: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {classes.map(c => (
        <label key={c.id} style={{ fontSize: 13 }}>
          <input aria-label={`${labelPrefix} ${c.name}`} type="checkbox" checked={selected.includes(c.id)} onChange={() => onToggle(c.id)} /> {c.name}
        </label>
      ))}
    </div>
  )
}

export function AccountManager({ facilitators, classes, onCreate, onSetPassword, onUpdate, onSetActive }: Props) {
  const activeClasses = classes.filter(c => c.active)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('facilitator')
  const [classIds, setClassIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [resetFor, setResetFor] = useState<string | null>(null)
  const [resetPwd, setResetPwd] = useState('')

  function create() {
    const uErr = validateUsername(username)
    if (!name.trim()) { setError('Name is required.'); return }
    if (uErr) { setError(uErr); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(null)
    onCreate({ username: username.trim().toLowerCase(), password, name: name.trim(), role, classIds })
    setName(''); setUsername(''); setPassword(''); setRole('facilitator'); setClassIds([])
  }
  const toggle = (id: string) => setClassIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <div>
      <h3>Add an account</h3>
      <div style={{ display: 'grid', gap: 8, maxWidth: 420, marginBottom: 12 }}>
        <input aria-label="new name" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
        <input aria-label="new username" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input aria-label="new password" type="text" placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} />
        <select aria-label="new role" value={role} onChange={e => setRole(e.target.value)}>
          <option value="facilitator">Facilitator</option>
          <option value="coordinator">Coordinator</option>
        </select>
        <ClassChecks classes={activeClasses} selected={classIds} onToggle={toggle} labelPrefix="assign" />
        {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}
        <button className="primary" onClick={create}>Create account</button>
      </div>

      <h3>Accounts</h3>
      {facilitators.map(f => (
        <AccountRow key={f.id} f={f} classes={activeClasses}
          onUpdate={onUpdate} onSetActive={onSetActive}
          resetOpen={resetFor === f.id}
          onOpenReset={() => { setResetFor(f.id); setResetPwd('') }}
          onCancelReset={() => setResetFor(null)}
          resetPwd={resetPwd} setResetPwd={setResetPwd}
          onConfirmReset={() => { if (resetPwd.length >= 8) { onSetPassword(f.id, resetPwd); setResetFor(null) } }}
        />
      ))}
    </div>
  )
}

function AccountRow({ f, classes, onUpdate, onSetActive, resetOpen, onOpenReset, onCancelReset, resetPwd, setResetPwd, onConfirmReset }: {
  f: Facilitator; classes: ClassGroup[]
  onUpdate: (userId: string, name: string, role: string, classIds: string[]) => void
  onSetActive: (userId: string, active: boolean) => void
  resetOpen: boolean; onOpenReset: () => void; onCancelReset: () => void
  resetPwd: string; setResetPwd: (v: string) => void; onConfirmReset: () => void
}) {
  const [name, setName] = useState(f.name)
  const [role, setRole] = useState(f.role)
  const [classIds, setClassIds] = useState<string[]>(f.classIds)
  const active = f.active !== false
  const dirty = name !== f.name || role !== f.role || classIds.join() !== f.classIds.join()
  const toggle = (id: string) => setClassIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  return (
    <div style={{ border: '1px solid var(--sage)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 8, opacity: active ? 1 : 0.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input aria-label={`name ${f.username ?? f.id}`} value={name} onChange={e => setName(e.target.value)} />
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{f.username ?? '(email login)'}</span>
        <select aria-label={`role ${f.username ?? f.id}`} value={role} onChange={e => setRole(e.target.value as Facilitator['role'])}>
          <option value="facilitator">Facilitator</option>
          <option value="coordinator">Coordinator</option>
        </select>
        <button onClick={() => onSetActive(f.id, !active)}>{active ? 'Deactivate' : 'Reactivate'}</button>
        <button onClick={onOpenReset}>Reset password</button>
        {dirty && <button className="primary" onClick={() => onUpdate(f.id, name.trim(), role, classIds)}>Save</button>}
      </div>
      <ClassChecks classes={classes} selected={classIds} onToggle={toggle} labelPrefix={`class ${f.username ?? f.id}`} />
      {resetOpen && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input aria-label="reset password" type="text" placeholder="New password (min 8)" value={resetPwd} onChange={e => setResetPwd(e.target.value)} />
          <button className="primary" disabled={resetPwd.length < 8} onClick={onConfirmReset}>Set password</button>
          <button onClick={onCancelReset}>Cancel</button>
        </div>
      )}
    </div>
  )
}
