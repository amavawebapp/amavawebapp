import { Link } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useAppServices } from '../app-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { useSyncStatus } from '../hooks/use-sync-status'
import { SyncBadge } from '../components/SyncBadge'

export function HomeScreen() {
  const { session } = useAuth()
  const { store, engine } = useAppServices()
  const ref = useReferenceData()
  const { online, pendingCount } = useSyncStatus(store, engine)

  if (!ref) return <p className="container">Loading…</p>
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const myClasses = ref.classes.filter(
    c => me?.role === 'coordinator' || me?.classIds.includes(c.id),
  )

  return (
    <div className="container">
      <SyncBadge online={online} pendingCount={pendingCount} />
      <h1>My classes</h1>
      <p className="no-print"><Link to="/reports">View reports →</Link></p>
      {myClasses.length === 0 ? (
        <p>No classes assigned yet. Please contact your coordinator.</p>
      ) : (
        <ul>
          {myClasses.map(c => (
            <li key={c.id}><Link to={`/class/${c.id}`}>{c.name}</Link></li>
          ))}
        </ul>
      )}
    </div>
  )
}
