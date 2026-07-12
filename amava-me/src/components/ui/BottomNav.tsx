import { useLocation, useNavigate } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const ITEMS: { key: string; label: string; icon: IconName; path: string; match: (p: string) => boolean }[] = [
  { key: 'home', label: 'Classes', icon: 'home', path: '/', match: p => p === '/' || p.startsWith('/class') || p.startsWith('/assess') || p.startsWith('/child') },
  { key: 'reports', label: 'Reports', icon: 'chart', path: '/reports', match: p => p.startsWith('/report') },
  { key: 'settings', label: 'Settings', icon: 'gear', path: '/settings', match: p => p.startsWith('/settings') },
]

export function BottomNav() {
  const loc = useLocation()
  const nav = useNavigate()
  return (
    <nav className="am-bottomnav">
      {ITEMS.map(it => {
        const on = it.match(loc.pathname)
        return (
          <button key={it.key} className={'am-navbtn' + (on ? ' on' : '')} onClick={() => nav(it.path)} aria-current={on ? 'page' : undefined}>
            <Icon name={it.icon} size={25} stroke={on ? 2.4 : 2} />
            {it.label}
          </button>
        )
      })}
    </nav>
  )
}
