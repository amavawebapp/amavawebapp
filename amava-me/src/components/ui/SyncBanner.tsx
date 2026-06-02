export function SyncBanner({ online, pending }: { online: boolean; pending: number }) {
  return (
    <div className={'am-sync ' + (online ? 'am-sync--on' : 'am-sync--off')}>
      <span className="am-sync__dot" />
      {online ? 'Saved & synced' : 'Offline — saved on this phone'}
      {pending > 0 && <span style={{ opacity: .85 }}>· {pending} waiting</span>}
    </div>
  )
}
