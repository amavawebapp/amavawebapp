import type { ReactNode } from 'react'
import { Icon } from './Icon'
export function Toast({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null
  return <div className="am-toast"><Icon name="check" size={18} stroke={3} /> {children}</div>
}
