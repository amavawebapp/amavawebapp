interface Props { online: boolean; pendingCount: number }

export function SyncBadge({ online, pendingCount }: Props) {
  return (
    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
      {online ? '● Online' : '○ Offline'}
      {pendingCount > 0 && ` · ${pendingCount} waiting to sync`}
    </div>
  )
}
