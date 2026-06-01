import type { ReactNode } from 'react'

interface Props { columns: string[]; rows: ReactNode[][] }

export function ReportTable({ columns, rows }: Props) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr>{columns.map(c => (
          <th key={c} style={{ textAlign: 'left', borderBottom: '2px solid var(--sage)', padding: '6px 8px' }}>{c}</th>
        ))}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{r.map((cell, j) => (
            <td key={j} style={{ borderBottom: '1px solid #eee', padding: '6px 8px' }}>{cell}</td>
          ))}</tr>
        ))}
      </tbody>
    </table>
  )
}
