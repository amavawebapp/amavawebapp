import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'

export function LoginScreen() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await signIn(email, password)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <form className="container" onSubmit={submit}>
      <h1>Amava M&E</h1>
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }} /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} /></label>
      {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}
      <button className="primary" type="submit">Sign in</button>
    </form>
  )
}
