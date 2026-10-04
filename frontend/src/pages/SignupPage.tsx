import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BoltLogo } from '../BoltLogo'

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

type SignupPageProps = {
  onSignupSuccess: (token: string, user: any) => void
}

export function SignupPage({ onSignupSuccess }: SignupPageProps) {
  const [step, setStep] = useState<'auth' | 'interests' | 'people'>('auth')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('16')
  const [grade, setGrade] = useState('Grade 9-12')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [publicPeople, setPublicPeople] = useState<Array<{ username: string; name: string; initials: string }>>([])
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [peopleQuery, setPeopleQuery] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [token, setToken] = useState('')
  const [createdUser, setCreatedUser] = useState<any>(null)

  const canContinueInterests = selectedInterests.length >= 3

  useEffect(() => {
    if (step !== 'people') return
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    fetch(`${apiUrl}/users/public-suggested`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          setPublicPeople(result.data)
        }
      })
      .catch(() => {})
  }, [step])

  const handleAuthSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          displayName,
          password,
          confirmPassword,
          age: Number(age),
          grade,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Signup failed')
      }

      localStorage.setItem('bolt-token', result.data.token)
      setToken(result.data.token)
      setCreatedUser(result.data.user)
      setStep('interests')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInterestsSubmit = async () => {
    if (!canContinueInterests) return
    setError('')
    setIsSubmitting(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
      const response = await fetch(`${apiUrl}/auth/interests`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interests: selectedInterests }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Unable to save interests')
      }
      setStep('people')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save interests')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests((cur) =>
      cur.includes(interest) ? cur.filter((i) => i !== interest) : [...cur, interest]
    )
  }

  const togglePerson = (targetUsername: string) => {
    setSelectedPeople((cur) =>
      cur.includes(targetUsername) ? cur.filter((u) => u !== targetUsername) : [...cur, targetUsername]
    )
  }

  const completeSignup = async () => {
    if (selectedPeople.length > 0 && token) {
      const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
      await Promise.all(
        selectedPeople.map((targetUsername) =>
          fetch(`${apiUrl}/users/${targetUsername}/follow`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {})
        )
      )
    }
    onSignupSuccess(token, { ...createdUser, interests: selectedInterests })
  }

  if (step === 'interests') {
    return (
      <main className="auth-shell">
        <div className="auth-layout interests-layout">
          <header className="auth-header">
            <BoltLogo />
            <h1>DISCOVER YOUR PATH</h1>
            <p>CHOOSE TOPICS YOU'RE INTERESTED IN</p>
            <div className="progress-track">
              <span className="progress-fill interests-progress" />
            </div>
            <small>2 of 3 Steps</small>
          </header>
          <section className="interests-card">
            <div className="interest-grid">
              {interestOptions.map(([interest, icon]) => {
                const selected = selectedInterests.includes(interest)
                return (
                  <button
                    className={`interest-option${selected ? ' selected' : ''}`}
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                  >
                    <span className="interest-check">{selected ? <i className="fa-solid fa-check" /> : ''}</span>
                    <span className="interest-icon">{icon}</span>
                    <span>#{interest.replace(' ', '')}</span>
                  </button>
                )
              })}
            </div>
            <button
              className={`continue-button${canContinueInterests ? ' ready' : ''}`}
              type="button"
              disabled={!canContinueInterests || isSubmitting}
              onClick={handleInterestsSubmit}
            >
              {isSubmitting ? 'SAVING...' : 'CONTINUE'}
            </button>
            <p className="selection-hint">
              {canContinueInterests ? `${selectedInterests.length} topics selected` : 'select at least 3'}
            </p>
            {error && <p className="form-message">{error}</p>}
          </section>
        </div>
      </main>
    )
  }

  if (step === 'people') {
    const visiblePeople = publicPeople.filter((p) =>
      `${p.name} ${p.username}`.toLowerCase().includes(peopleQuery.toLowerCase())
    )
    return (
      <main className="auth-shell">
        <div className="auth-layout people-layout">
          <header className="auth-header">
            <BoltLogo />
            <h1>FIND PEOPLE YOU KNOW</h1>
            <p>CONNECT WITH YOUR CIRCLE</p>
            <div className="progress-track">
              <span className="progress-fill people-progress" />
            </div>
            <small>3 of 3 Steps</small>
          </header>
          <section className="auth-card people-card">
            <h2>Connect with Fellow Learners</h2>
            <p className="people-intro">Search for friends by name or username.</p>
            <input
              className="standalone-input people-search"
              value={peopleQuery}
              onChange={(e) => setPeopleQuery(e.target.value)}
              placeholder="Search people"
            />
            <div className="people-list">
              {visiblePeople.map((person) => {
                const selected = selectedPeople.includes(person.username)
                return (
                  <button
                    className={`person-option${selected ? ' selected' : ''}`}
                    key={person.username}
                    type="button"
                    onClick={() => togglePerson(person.username)}
                  >
                    <span className="person-avatar">{person.initials}</span>
                    <span>
                      <strong>{person.name}</strong>
                      <small>@{person.username}</small>
                    </span>
                    <span className="person-action">
                      {selected ? (
                        <>
                          <i className="fa-solid fa-check" style={{ marginRight: 4 }} /> Added
                        </>
                      ) : (
                        '+ Add'
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            <button className="continue-button ready" type="button" onClick={completeSignup}>
              COMPLETE SIGNUP
            </button>
            <button className="skip-button" type="button" onClick={completeSignup}>
              Skip for now
            </button>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <header className="auth-header">
          <BoltLogo />
          <h1>JOIN THE BOLT LEARNING PLATFORM</h1>
          <p>EXPLORE BITE-SIZED REELS & EXPAND YOUR KNOWLEDGE</p>
          <div className="progress-track">
            <span className="progress-fill auth-progress" />
          </div>
          <small>1 of 3 Steps</small>
        </header>

        <section className="auth-card">
          <div className="card-heading">
            <div>
              <h2>Create Account</h2>
              <p>Enter your details below to get started.</p>
            </div>
          </div>
          <div className="card-rule" />

          {error && <p className="form-message">{error}</p>}

          <form onSubmit={handleAuthSubmit}>
            <label htmlFor="display-name">DISPLAY NAME</label>
            <input
              className="standalone-input"
              id="display-name"
              type="text"
              placeholder="e.g. Alex Rivera"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <label htmlFor="username">USERNAME</label>
            <input
              className="standalone-input"
              id="username"
              type="text"
              placeholder="Choose a unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <div className="form-row">
              <div>
                <label htmlFor="age">YOUR AGE</label>
                <input
                  className="standalone-input"
                  id="age"
                  type="number"
                  min="5"
                  max="120"
                  placeholder="e.g. 16"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="grade">GRADE LEVEL</label>
                <select
                  className="standalone-input grade-select"
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                >
                  <option value="Grade 1-5">Grade 1-5 (Elementary)</option>
                  <option value="Grade 6-8">Grade 6-8 (Middle School)</option>
                  <option value="Grade 9-12">Grade 9-12 (High School)</option>
                  <option value="College / Adult">College / Adult</option>
                  <option value="General">General / Other</option>
                </select>
              </div>
            </div>

            <label htmlFor="email">EMAIL ADDRESS</label>
            <div className="input-wrap">
              <span className="field-icon"><i className="fa-solid fa-envelope" /></span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label htmlFor="password">PASSWORD</label>
            <div className="input-wrap">
              <span className="field-icon"><i className="fa-solid fa-key" /></span>
              <input
                id="password"
                type="password"
                placeholder="Enter password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <label htmlFor="confirm-password">CONFIRM PASSWORD</label>
            <div className="input-wrap">
              <span className="field-icon"><i className="fa-solid fa-key" /></span>
              <input
                id="confirm-password"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'CREATING ACCOUNT...'
              ) : (
                <>
                  CONTINUE &amp; JOIN <i className="fa-solid fa-check" style={{ marginLeft: 6 }} />
                </>
              )}
            </button>
          </form>

          <div className="switch-mode">
            <span>Already have an account? </span>
            <Link to="/login">Log in here</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
