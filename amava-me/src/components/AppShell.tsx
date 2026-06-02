import type { ReactNode } from 'react'
import { BottomNav } from './ui/BottomNav'

export function AppShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="am-root am-screen">
      {children}
      {nav && <BottomNav />}
    </div>
  )
}
