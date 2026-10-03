import { StrictMode } from 'react'
import { useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { BoltLogo } from './BoltLogo'
import { HomePage, type HomeLesson, type HomeProgressStats, type HomeView } from './HomePage'
import './styles.css'

const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

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

type AuthUser = { id: string; email: string; username: string; displayName: string; interests: string[]; age?: number; grade?: string; xp?: number; streak?: number; completedCount?: number }
type SignupStep = 'auth' | 'interests' | 'people'

const peopleSuggestions = [
  { username: 'alexbolt', name: 'Alex M.', initials: 'AM' },
  { username: 'mayabolt', name: 'Maya R.', initials: 'MR' },
  { username: 'sambolt', name: 'Sam T.', initials: 'ST' },
]

function KeyIcon() {
  return (
    <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8m-2 2 2 2m-5 1 2 2" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 9.5 6a11.7 11.7 0 0 1-3 3.7M6.2 6.2A12.4 12.4 0 0 0 2.5 10c1 2 4.5 6 9.5 6 1 0 1.9-.2 2.7-.5" />
    </svg>
  ) : (
    <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function App() {
  const [mode, setMode] = useState<'login' | 'signup'>(window.location.pathname.startsWith('/login') ? 'login' : 'signup')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('16')
  const [grade, setGrade] = useState('Grade 9-12')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<SignupStep>(window.location.pathname === '/signup/interests' ? 'interests' : window.location.pathname === '/signup/people' ? 'people' : 'auth')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [peopleQuery, setPeopleQuery] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null)
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null)
  const [activeView, setActiveView] = useState<HomeView>(() => viewFromPath(window.location.pathname))
  const [lessons, setLessons] = useState<HomeLesson[]>([])
  const [savedLessons, setSavedLessons] = useState<HomeLesson[]>([])
  const [progressStats, setProgressStats] = useState<HomeProgressStats>({ conceptsLearned: 0, quizAccuracy: 0, savedLessons: 0, streak: 0, categoryProgress: {} })
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [quiz, setQuiz] = useState<{ lessonSlug: string; question: string; options: string[] } | null>(null)
  const [quizFeedback, setQuizFeedback] = useState('')
  const [tutorPrompt, setTutorPrompt] = useState('')
  const [tutorAnswer, setTutorAnswer] = useState('')

  const isSignup = mode === 'signup'
  const canContinue = selectedInterests.length >= 3
  const shouldRenderProfileRoute = activeView === 'profile' || window.location.pathname === '/profile'

  function viewFromPath(path: string): HomeView {
    if (path === '/discover') return 'discover'
    if (path === '/saved') return 'saved'
    if (path === '/progress') return 'progress'
    if (path === '/profile') return 'profile'
    if (path === '/leaderboard') return 'leaderboard'
    return 'home'
  }

  function authModeFromPath(path: string): 'login' | 'signup' {
    return path.startsWith('/login') ? 'login' : 'signup'
  }

  function navigateToView(view: HomeView) {
    window.history.pushState({}, '', view === 'home' ? '/home' : `/${view}`)
    setActiveView(view)
  }

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      setMode(authModeFromPath(path))
      setStep(path === '/signup/interests' ? 'interests' : path === '/signup/people' ? 'people' : 'auth')
      setActiveView(viewFromPath(path))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (window.location.pathname === '/') window.history.replaceState({}, '', '/signup')
    const token = localStorage.getItem('bolt-token')
    if (!token) return

    fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => response.ok ? response.json() as Promise<{ data: AuthUser }> : null)
      .then((result) => {
        if (result?.data) {
          const restoredView = viewFromPath(window.location.pathname)
          if (window.location.pathname === '/') window.history.replaceState({}, '', '/home')
          setActiveView(restoredView)
          setSessionUser(result.data)
        }
      })
      .catch(() => localStorage.removeItem('bolt-token'))
  }, [])

  useEffect(() => {
    if (!sessionUser) return
    const token = localStorage.getItem('bolt-token') ?? ''
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${apiUrl}/feed`, { headers }).then((response) => response.json()),
      fetch(`${apiUrl}/saved`, { headers }).then((response) => response.json()),
      fetch(`${apiUrl}/progress`, { headers }).then((response) => response.json()),
      fetch(`${apiUrl}/categories`).then((response) => response.json()),
    ]).then(([feed, saved, progress, categoryResult]) => {
      if (feed.success) setLessons(feed.data)
      if (saved.success) setSavedLessons(saved.data)
      if (progress.success) setProgressStats(progress.data)
      if (categoryResult.success) setCategories(categoryResult.data)
    }).catch(() => setError('Unable to load your learning data'))
  }, [sessionUser])

  function switchMode(nextMode: 'login' | 'signup') {
    window.history.pushState({}, '', nextMode === 'login' ? '/login' : '/signup')
    setMode(nextMode)
    setError('')
    setEmail('')
    setUsername('')
    setDisplayName('')
    setPassword('')
    setConfirmPassword('')
    setPendingUser(null)
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
        body: JSON.stringify(isSignup ? { email, username, displayName, age: Number(age), grade, password, confirmPassword } : { email, password }),
      })
      const result = await response.json() as { success: boolean; error?: string; data?: { token: string; user: AuthUser } }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? 'Unable to continue')
      }

      localStorage.setItem('bolt-token', result.data.token)
      setSelectedInterests(result.data.user.interests)
      if (isSignup) {
        setPendingUser(result.data.user)
        window.history.pushState({}, '', '/signup/interests')
        setStep('interests')
      } else {
        navigateToView('home')
        setSessionUser(result.data.user)
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
      setPendingUser((current) => current ? { ...current, interests: selectedInterests } : current)
      window.history.pushState({}, '', '/signup/people')
      setStep('people')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save interests')
    } finally {
      setIsSubmitting(false)
    }
  }

  function togglePerson(usernameToToggle: string) {
    setSelectedPeople((current) => current.includes(usernameToToggle) ? current.filter((item) => item !== usernameToToggle) : [...current, usernameToToggle])
  }

  function completeSignup() {
    navigateToView('home')
    setSessionUser(pendingUser ?? { id: '', email, username, displayName, interests: selectedInterests })
    setStep('auth')
    setSelectedPeople([])
  }

  function handleLogout() {
    localStorage.removeItem('bolt-token')
    window.history.replaceState({}, '', '/')
    setSessionUser(null)
    setSelectedInterests([])
    setPendingUser(null)
    setStep('auth')
    switchMode('login')
  }

  async function toggleSaved(lesson: HomeLesson) {
    const token = localStorage.getItem('bolt-token') ?? ''
    const saved = savedLessons.some((item) => item.slug === lesson.slug)
    await fetch(`${apiUrl}/saved/${lesson.slug}`, { method: saved ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` } })
    setSavedLessons((current) => saved ? current.filter((item) => item.slug !== lesson.slug) : [...current, lesson])
    setProgressStats((current) => ({ ...current, savedLessons: current.savedLessons + (saved ? -1 : 1) }))
  }

  async function completeLesson(lesson: HomeLesson) {
    await fetch(`${apiUrl}/progress/${lesson.slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('bolt-token') ?? ''}` }, body: JSON.stringify({ completed: true }) })
    const response = await fetch(`${apiUrl}/progress`, { headers: { Authorization: `Bearer ${localStorage.getItem('bolt-token') ?? ''}` } })
    const result = await response.json()
    if (result.success) setProgressStats(result.data)
  }

  async function openQuiz(lesson: HomeLesson) {
    const response = await fetch(`${apiUrl}/quizzes/${lesson.slug}`, { headers: { Authorization: `Bearer ${localStorage.getItem('bolt-token') ?? ''}` } })
    const result = await response.json()
    if (result.success) {
      setQuiz({ lessonSlug: lesson.slug, question: result.data.question, options: result.data.options })
      setQuizFeedback('')
    }
  }

  async function answerQuiz(answer: number) {
    if (!quiz) return
    const response = await fetch(`${apiUrl}/quizzes/${quiz.lessonSlug}/attempt`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('bolt-token') ?? ''}` }, body: JSON.stringify({ answer }) })
    const result = await response.json()
    if (result.success) {
      setQuizFeedback(`${result.data.correct ? 'Correct' : 'Not quite'}: ${result.data.explanation}`)
      setQuiz(null)
    }
  }

  async function askTutor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch(`${apiUrl}/tutor`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('bolt-token') ?? ''}` }, body: JSON.stringify({ prompt: tutorPrompt, lessonSlug: lessons[0]?.slug }) })
    const result = await response.json()
    if (result.success) setTutorAnswer(result.data.answer)
  }

  async function searchLessons(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch(`${apiUrl}/lessons/search?q=${encodeURIComponent(searchQuery)}`)
    const result = await response.json()
    if (result.success) setLessons(result.data)
  }

  if (sessionUser || shouldRenderProfileRoute) return <HomePage username={sessionUser?.username ?? 'user'} displayName={sessionUser?.displayName ?? 'Display Name'} interests={sessionUser?.interests ?? []} activeView={activeView} lessons={lessons} savedLessons={savedLessons} progressStats={progressStats} categories={categories} searchQuery={searchQuery} quiz={quiz} quizFeedback={quizFeedback} tutorPrompt={tutorPrompt} tutorAnswer={tutorAnswer} onViewChange={navigateToView} onLogout={handleLogout} onSearchQueryChange={setSearchQuery} onSearch={searchLessons} onCategorySelect={(category) => { setSearchQuery(category); void fetch(`${apiUrl}/lessons/search?q=${encodeURIComponent(category)}`).then((response) => response.json()).then((result) => result.success && setLessons(result.data)) }} onLessonSelect={(lesson) => { navigateToView('home'); setLessons([lesson]) }} onCompleteLesson={completeLesson} onToggleSaved={toggleSaved} onOpenQuiz={openQuiz} onCloseQuiz={() => setQuiz(null)} onAnswerQuiz={answerQuiz} onQuizFeedbackDismiss={() => setQuizFeedback('')} onTutorPromptChange={setTutorPrompt} onAskTutor={askTutor} />

  if (step === 'interests') {
    return (
      <main className="auth-shell">
        <div className="auth-layout interests-layout">
          <header className="auth-header">
            <BoltLogo />
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

  if (step === 'people') {
    const visiblePeople = peopleSuggestions.filter((person) => `${person.name} ${person.username}`.toLowerCase().includes(peopleQuery.toLowerCase()))
    return (
      <main className="auth-shell">
        <div className="auth-layout people-layout">
          <header className="auth-header">
            <BoltLogo />
            <h1>FIND PEOPLE YOU KNOW</h1>
            <p>CONNECT WITH YOUR CIRCLE</p>
            <div className="progress-track" aria-label="3 of 3 steps"><span className="progress-fill people-progress" /></div>
            <small>3 of 3 Steps</small>
          </header>
          <section className="auth-card people-card" aria-labelledby="people-title">
            <h2 id="people-title">FIND PEOPLE YOU KNOW</h2>
            <p className="people-intro">Search for friends by name or username.</p>
            <input className="standalone-input people-search" value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Search people" />
            <div className="people-list">
              {visiblePeople.map((person) => {
                const selected = selectedPeople.includes(person.username)
                return <button className={`person-option${selected ? ' selected' : ''}`} key={person.username} type="button" onClick={() => togglePerson(person.username)} aria-pressed={selected}><span className="person-avatar">{person.initials}</span><span><strong>{person.name}</strong><small>@{person.username}</small></span><span className="person-action">{selected ? 'Added' : 'Add'}</span></button>
              })}
            </div>
            <button className="continue-button ready" type="button" onClick={completeSignup}>COMPLETE SIGNUP</button>
            <button className="skip-button" type="button" onClick={completeSignup}>Skip for now</button>
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
          <h1>{isSignup ? 'JOIN THE BOLT' : 'WELCOME BACK'}</h1>
          <p>{isSignup ? 'START YOUR JOURNEY OR CREATE YOUR SPACE' : 'ENTER YOUR CREDENTIALS TO LOG IN'}</p>
          {isSignup && <>
            <div className="progress-track" aria-label="1 of 3 steps">
              <span className="progress-fill signup" />
            </div>
            <small>1 of 3 Steps</small>
          </>}
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
            {isSignup && <>
              <label htmlFor="display-name">DISPLAY NAME</label>
              <input className="standalone-input" id="display-name" type="text" placeholder="How should we call you?" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
              <label htmlFor="username">USERNAME</label>
              <input className="standalone-input" id="username" type="text" placeholder="Choose a username" value={username} onChange={(event) => setUsername(event.target.value)} required />
              <div className="form-row">
                <div>
                  <label htmlFor="age">YOUR AGE</label>
                  <input className="standalone-input" id="age" type="number" min="5" max="120" placeholder="e.g. 16" value={age} onChange={(event) => setAge(event.target.value)} required />
                </div>
                <div>
                  <label htmlFor="grade">GRADE LEVEL</label>
                  <select className="standalone-input grade-select" id="grade" value={grade} onChange={(event) => setGrade(event.target.value)}>
                    <option value="Grade 1-5">Grade 1-5 (Elementary)</option>
                    <option value="Grade 6-8">Grade 6-8 (Middle School)</option>
                    <option value="Grade 9-12">Grade 9-12 (High School)</option>
                    <option value="College / Adult">College / Adult</option>
                    <option value="General">General / Other</option>
                  </select>
                </div>
              </div>
            </>}
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
              <span className="field-icon" aria-hidden="true"><KeyIcon /></span>
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
                <EyeIcon hidden={showPassword} />
              </button>
            </div>

            {isSignup && <>
              <label htmlFor="confirm-password">CONFIRM PASSWORD</label>
              <div className="input-wrap">
                <span className="field-icon" aria-hidden="true"><KeyIcon /></span>
                <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
                <button className="visibility-button" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}>
                  <EyeIcon hidden={showConfirmPassword} />
                </button>
              </div>
            </>}

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