import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar, BottomNav } from '../../components/ui'

export function SubScreen({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="am-root am-screen">
      <AppBar title={title} onBack={() => navigate('/settings')} />
      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 14, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
