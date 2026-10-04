import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BoltLogo } from '../BoltLogo'

type LoginPageProps = {
  onLoginSuccess: (userToken: string, userData: any) => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrUsername, password }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Login failed')
      }

      localStorage.setItem('bolt-token', result.data.token)
      onLoginSuccess(result.data.token, result.data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <header className="auth-header">
          <BoltLogo />
          <h1>WELCOME BACK TO BOLT</h1>
          <p>LOG IN TO CONTINUE YOUR LEARNING JOURNEY</p>
        </header>

        <section className="auth-card" aria-labelledby="login-title">
          <div className="card-heading">
            <div>
              <h2 id="login-title">Log In</h2>
              <p>Enter your email or username and password below.</p>
            </div>
          </div>
          <div className="card-rule" />

          {error && <p className="form-message">{error}</p>}

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">EMAIL OR USERNAME</label>
            <div className="input-wrap">
              <span className="field-icon"><i className="fa-solid fa-envelope" /></span>
              <input
                id="email"
                type="text"
                placeholder="admin@bolt.demo or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
            </div>

            <label htmlFor="password">PASSWORD</label>
            <div className="input-wrap">
              <span className="field-icon"><i className="fa-solid fa-key" /></span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="visibility-button"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <i className="fa-solid fa-eye-slash" /> : <i className="fa-solid fa-eye" />}
              </button>
            </div>

            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          <div className="switch-mode">
            <span>Don't have an account? </span>
            <Link to="/signup">Sign up here</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
