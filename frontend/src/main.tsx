import { StrictMode } from 'react'
import { useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

const interestOptions = [
  ['AI Skills', '✣'],
  ['Web Dev', '</>'],
  ['Photography', '◉'],
  ['UX Design', '⌁'],
  ['Data Science', '▥'],
  ['Creative Writing', '✧'],
  ['Engineering', '⚙'],
  ['Sustainability', '♧'],
  ['Marketing', '⌁'],
  ['Entrepreneurship', '▤'],
  ['History', '◴'],
  ['UX Clarity', '▥'],
] as const

function App() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'auth' | 'interests'>('auth')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignup = mode === 'signup'
  const canContinue = selectedInterests.length >= 3

  function switchMode(nextMode: 'login' | 'signup') {
    setMode(nextMode)
    setError('')
    setEmail('')
    setPassword('')
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiUrl}/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json() as { success: boolean; error?: string; data?: { token: string; user: { interests: string[] } } }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? 'Unable to continue')
      }

      localStorage.setItem('bolt-token', result.data.token)
      setSelectedInterests(result.data.user.interests)
      if (isSignup || result.data.user.interests.length < 3) {
        setStep('interests')
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to continue')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleInterestsSubmit() {
    if (!canContinue) return
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiUrl}/auth/interests`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('bolt-token') ?? ''}` },
        body: JSON.stringify({ interests: selectedInterests }),
      })
      const result = await response.json() as { success: boolean; error?: string }
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Unable to save interests')
      setStep('auth')
      setMode('login')
      setError('Your interests are saved.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save interests')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'interests') {
    return (
      <main className="auth-shell">
        <div className="auth-layout interests-layout">
          <header className="auth-header">
            <div className="brand-mark" aria-label="Bolt home"><span className="bolt-icon" aria-hidden="true">✦</span><span>BOLT</span></div>
            <h1>DISCOVER YOUR PATH</h1>
            <p>CHOOSE TOPICS YOU'RE INTERESTED IN</p>
            <div className="progress-track" aria-label="2 of 3 steps"><span className="progress-fill interests-progress" /></div>
            <small>2 of 3 Steps</small>
          </header>
          <section className="interests-card" aria-labelledby="interests-title">
            <div className="interest-grid">
              {interestOptions.map(([interest, icon]) => {
                const selected = selectedInterests.includes(interest)
                return (
                  <button className={`interest-option${selected ? ' selected' : ''}`} key={interest} type="button" onClick={() => toggleInterest(interest)} aria-pressed={selected}>
                    <span className="interest-check" aria-hidden="true">{selected ? '✓' : ''}</span>
                    <span className="interest-icon" aria-hidden="true">{icon}</span>
                    <span>#{interest.replace(' ', '')}</span>
                  </button>
                )
              })}
            </div>
            <button className={`continue-button${canContinue ? ' ready' : ''}`} type="button" disabled={!canContinue || isSubmitting} onClick={handleInterestsSubmit}>
              {isSubmitting ? 'SAVING...' : 'CONTINUE'}
            </button>
            <p className={`selection-hint${canContinue ? ' ready-text' : ''}`}>{canContinue ? `${selectedInterests.length} topics selected` : 'select at least 3'}</p>
            {error && <p className="form-message">{error}</p>}
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <header className="auth-header">
          <div className="brand-mark" aria-label="Bolt home">
            <span className="bolt-icon" aria-hidden="true">✦</span>
            <span>BOLT</span>
          </div>
          <h1>{isSignup ? 'JOIN THE BOLT' : 'WELCOME BACK'}</h1>
          <p>{isSignup ? 'START YOUR JOURNEY OR CREATE YOUR SPACE' : 'ENTER YOUR CREDENTIALS TO LOG IN'}</p>
          <div className="progress-track" aria-label="1 of 3 steps">
            <span className="progress-fill signup" />
          </div>
          <small>1 of 3 Steps</small>
        </header>

        <section className="auth-card" aria-labelledby="form-title">
          <div className="card-heading">
            <div>
              <h2 id="form-title">{isSignup ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</h2>
              <p>{isSignup ? 'Start with your email and password' : 'Log in to continue your path'}</p>
            </div>
          </div>

          {isSignup && <div className="card-rule" />}

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">EMAIL ADDRESS</label>
            <div className="input-wrap">
              <span className="field-icon" aria-hidden="true">✉</span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <label htmlFor="password">PASSWORD</label>
            <div className="input-wrap">
              <span className="field-icon lock-icon" aria-hidden="true">⌑</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
              <button
                className="visibility-button"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '◉' : '◌'}
              </button>
            </div>

            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'PLEASE WAIT...' : isSignup ? 'CONTINUE & JOIN' : 'LOG IN'}
              {isSignup && <span aria-hidden="true">✓</span>}
            </button>
          </form>

          {error && <p className="form-message">{error}</p>}

          <p className="switch-mode">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </section>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)