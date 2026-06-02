import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { loginIdentifierToEmail } from '../domain/username'
import { Logo } from '../components/ui'
import logoBadge from '../assets/logo-badge.png'

export function LoginScreen() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await signIn(loginIdentifierToEmail(username), password)
    if (error) setError('Incorrect username or password.')
    else navigate('/')
  }

  return (
    <div className="am-root am-screen" style={{ background: 'var(--bg)' }}>
      <div className="am-scroll am-pad" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* warm hero band */}
        <div style={{ paddingTop: 78, paddingBottom: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src={logoBadge} alt="Amava Oluntu" width={104} height={104}
            style={{ borderRadius: 26, boxShadow: 'var(--shadow-lg)', marginBottom: 20 }} />
          <Logo size={48} />
          <p className="am-muted" style={{ marginTop: 18, fontSize: '1.05rem', maxWidth: 280 }}>
            Welcome back. Sign in to record how your children are growing.
          </p>
        </div>

        <form className="am-card am-card--pad am-stack" style={{ gap: 16, marginTop: 8 }} onSubmit={submit}>
          <label className="am-field">
            <span className="am-field__lab">Username</span>
            <input className="am-input" aria-label="username" value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" />
          </label>
          <label className="am-field">
            <span className="am-field__lab">Password</span>
            <input className="am-input" aria-label="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {error && <p style={{ color: 'var(--warn)', fontWeight: 700, margin: 0 }}>{error}</p>}
          <button className="am-btn am-btn--primary am-btn--block am-btn--lg" type="submit">
            Sign in
          </button>
          <p className="am-muted" style={{ fontSize: '.86rem', textAlign: 'center', margin: 0 }}>
            Use the username your coordinator set (an email also works).
          </p>
        </form>

        <div style={{ flex: 1 }} />
        <p className="am-muted" style={{ textAlign: 'center', fontSize: '.74rem', padding: '24px 0 14px' }}>
          Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213
        </p>
      </div>
    </div>
  )
}
