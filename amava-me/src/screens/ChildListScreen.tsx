import { Link, useParams } from 'react-router-dom'
import { useReferenceData } from '../hooks/use-reference-data'

export function ChildListScreen() {
  const { classId } = useParams()
  const ref = useReferenceData()
  if (!ref) return <p className="container">Loading…</p>
  const cls = ref.classes.find(c => c.id === classId)
  const children = ref.children.filter(c => c.classId === classId && c.isSample)

  return (
    <div className="container">
      <h1>{cls?.name}</h1>
      <ul>
        {children.map(ch => (
          <li key={ch.id}>
            <Link to={`/assess/${ch.id}`}>{ch.firstName} {ch.surname}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
