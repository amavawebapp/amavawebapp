import type { ReactNode } from 'react'
import { Icon } from './Icon'
export function AppBar({ title, onBack, right, center, big }: {
  title: ReactNode; onBack?: () => void; right?: ReactNode; center?: boolean; big?: boolean
}) {
  return (
    <div className="am-appbar">
      <div className="am-appbar__row">
        {onBack && <button className="am-back" onClick={onBack} aria-label="Back"><Icon name="back" size={26} /></button>}
        <div className={'am-appbar__title' + (center ? ' center' : '')} style={big ? { fontSize: '1.6rem', fontWeight: 900 } : undefined}>{title}</div>
        {right}
      </div>
    </div>
  )
}
