import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { loginIdentifierToEmail } from '../domain/username'

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
    <form className="container" onSubmit={submit}>
      <h1>Amava M&amp;E</h1>
      <label>Username
        <input aria-label="username" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%' }} />
      </label>
      <label>Password
        <input aria-label="password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} />
      </label>
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>Use the username your coordinator set (an email also works).</p>
      {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}
      <button className="primary" type="submit">Sign in</button>
    </form>
  )
}
