import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useConfigData } from '../hooks/use-config-data'
import { ChildEditor } from '../components/ChildEditor'
import { rosterClient } from '../data/roster-client'
import type { Child } from '../domain/types'

export function ChildListScreen() {
  const { classId } = useParams()
  const { session } = useAuth()
  const { ref, refresh } = useConfigData()
  const [editing, setEditing] = useState<Child | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!ref) return <p className="container">Loading…</p>
  const cls = ref.classes.find(c => c.id === classId)
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'
  const canManage = isCoordinator || (!!classId && (me?.classIds.includes(classId) ?? false))
  const children = ref.children.filter(c => c.classId === classId)

  const run = async (p: Promise<void>) => {
    setError(null)
    try { await p; await refresh(); setEditing(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed. Please try again.') }
  }

  return (
    <div className="container">
      <h1>{cls?.name}</h1>
      {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}
      <ul>
        {children.filter(c => c.active).map(ch => (
          <li key={ch.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to={`/assess/${ch.id}`} style={{ flex: 1 }}>
              {ch.firstName} {ch.surname}{ch.isSample ? '' : ' (not in sample)'}
            </Link>
            {canManage && <button onClick={() => setEditing(ch)}>Edit</button>}
            {canManage && <button onClick={() => run(rosterClient.setActive('child', ch.id, false))}>Retire</button>}
          </li>
        ))}
      </ul>

      {canManage && children.some(c => !c.active) && (
        <details>
          <summary>Retired children</summary>
          {children.filter(c => !c.active).map(ch => (
            <div key={ch.id} style={{ display: 'flex', gap: 8, opacity: 0.6, alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{ch.firstName} {ch.surname}</span>
              <button onClick={() => run(rosterClient.setActive('child', ch.id, true))}>Restore</button>
            </div>
          ))}
        </details>
      )}

      {canManage && !editing && <button className="primary" onClick={() => setEditing('new')}>Add child</button>}
      {canManage && editing && (
        <ChildEditor
          classes={ref.classes.filter(c => c.active)}
          allowClassChange={isCoordinator}
          initial={editing === 'new'
            ? { classId }
            : { classId: editing.classId, firstName: editing.firstName, surname: editing.surname, dateStarted: editing.dateStarted, isSample: editing.isSample, fields: editing.fields }}
          onCancel={() => setEditing(null)}
          onSubmit={input => { if (editing === 'new') run(rosterClient.addChild(input)); else if (editing) run(rosterClient.updateChild(editing.id, input)) }}
        />
      )}
    </div>
  )
}
