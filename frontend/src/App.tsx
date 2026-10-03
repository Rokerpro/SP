import { useEffect, useState, type FormEvent } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { QuizModal } from './components/QuizModal'
import { CreateReelModal } from './components/CreateReelModal'
import type { HomeLesson } from './components/ReelCard'

import { HomePage } from './pages/HomePage'
import { DiscoverPage } from './pages/DiscoverPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { SavedPage } from './pages/SavedPage'
import { FriendsPage } from './pages/FriendsPage'
import { ProfilePage } from './pages/ProfilePage'
import { AdminPage } from './pages/AdminPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'

type AuthUser = {
  id: string
  email: string
  username: string
  displayName: string
  interests: string[]
  age?: number
  grade?: string
  xp?: number
  streak?: number
  completedCount?: number
  role?: 'user' | 'admin'
  followersCount?: number
  followingCount?: number
}

const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

export function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  const [lessons, setLessons] = useState<HomeLesson[]>([])
  const [savedLessons, setSavedLessons] = useState<HomeLesson[]>([])
  const [userPosts, setUserPosts] = useState<HomeLesson[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const [quiz, setQuiz] = useState<{ lessonSlug: string; question: string; options: string[] } | null>(null)
  const [quizFeedback, setQuizFeedback] = useState('')
  const [tutorPrompt, setTutorPrompt] = useState('')
  const [tutorAnswer, setTutorAnswer] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)

  // Verify auth token on initial mount
  useEffect(() => {
    const token = localStorage.getItem('bolt-token')
    if (!token) {
      setIsAuthChecking(false)
      return
    }

    fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => (res.ok ? res.json() as Promise<{ data: AuthUser }> : null))
      .then((result) => {
        if (result?.data) {
          setSessionUser(result.data)
        } else {
          localStorage.removeItem('bolt-token')
        }
      })
      .catch(() => localStorage.removeItem('bolt-token'))
      .finally(() => setIsAuthChecking(false))
  }, [])

  // Fetch feed, saved, categories, and user posts when sessionUser changes
  useEffect(() => {
    if (!sessionUser) return
    const token = localStorage.getItem('bolt-token') ?? ''
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${apiUrl}/feed`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/saved`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/categories`).then((res) => res.json()),
      fetch(`${apiUrl}/posts/my`, { headers }).then((res) => res.json()),
    ]).then(([feed, saved, catRes, postsRes]) => {
      if (feed.success) setLessons(feed.data)
      if (saved.success) setSavedLessons(saved.data)
      if (catRes.success) setCategories(catRes.data)
      if (postsRes.success) setUserPosts(postsRes.data)
    })
  }, [sessionUser])

  const handleLogout = () => {
    localStorage.removeItem('bolt-token')
    setSessionUser(null)
    navigate('/login')
  }

  const handleToggleSaved = async (lesson: HomeLesson) => {
    const token = localStorage.getItem('bolt-token') ?? ''
    const isAlreadySaved = savedLessons.some((item) => item.slug === lesson.slug)

    await fetch(`${apiUrl}/saved/${lesson.slug}`, {
      method: isAlreadySaved ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    setSavedLessons((cur) =>
      isAlreadySaved ? cur.filter((item) => item.slug !== lesson.slug) : [...cur, lesson]
    )
  }

  const handleCompleteLesson = async (lesson: HomeLesson) => {
    const token = localStorage.getItem('bolt-token') ?? ''
    await fetch(`${apiUrl}/progress/${lesson.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ completed: true }),
    })
  }

  const handleOpenQuiz = async (lesson: HomeLesson) => {
    const token = localStorage.getItem('bolt-token') ?? ''
    const res = await fetch(`${apiUrl}/quizzes/${lesson.slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = await res.json()
    if (result.success) {
      setQuiz({
        lessonSlug: lesson.slug,
        question: result.data.question,
        options: result.data.options,
      })
      setQuizFeedback('')
    }
  }

  const handleAnswerQuiz = async (answerIndex: number) => {
    if (!quiz) return
    const token = localStorage.getItem('bolt-token') ?? ''
    const res = await fetch(`${apiUrl}/quizzes/${quiz.lessonSlug}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answer: answerIndex }),
    })
    const result = await res.json()
    if (result.success) {
      const xpText = result.data.correct && result.data.xpEarned ? ` (+${result.data.xpEarned} XP)` : ''
      setQuizFeedback(`${result.data.correct ? `✓ Correct!${xpText}` : '✕ Not quite'}: ${result.data.explanation}`)
      setQuiz(null)
    }
  }

  const handleSearchSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    const query = searchQuery.trim()
    const url = query ? `${apiUrl}/lessons/search?q=${encodeURIComponent(query)}` : `${apiUrl}/lessons`
    const res = await fetch(url)
    const result = await res.json()
    if (result.success) setLessons(result.data)
  }

  const handleCategorySelect = (category: string) => {
    const url = category && category !== 'All'
      ? `${apiUrl}/lessons/search?category=${encodeURIComponent(category)}`
      : `${apiUrl}/lessons`
    fetch(url)
      .then((res) => res.json())
      .then((result) => result.success && setLessons(result.data))
  }

  const handleAskTutor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const token = localStorage.getItem('bolt-token') ?? ''
    const res = await fetch(`${apiUrl}/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt: tutorPrompt, lessonSlug: lessons[0]?.slug }),
    })
    const result = await res.json()
    if (result.success) setTutorAnswer(result.data.answer)
  }

  const handleCreatePost = async (postData: {
    title: string
    topic: string
    category: string
    explanation: string
    takeaway: string
    difficulty: string
    mediaType: 'text' | 'video'
    videoUrl: string
  }) => {
    const token = localStorage.getItem('bolt-token') ?? ''
    const res = await fetch(`${apiUrl}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(postData),
    })
    const result = await res.json()
    if (result.success) {
      setUserPosts((cur) => [result.data, ...cur])
    }
  }

  const handleApprovePost = async (slug: string) => {
    const token = localStorage.getItem('bolt-token') ?? ''
    await fetch(`${apiUrl}/admin/posts/${slug}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const handleRejectPost = async (slug: string) => {
    const token = localStorage.getItem('bolt-token') ?? ''
    await fetch(`${apiUrl}/admin/posts/${slug}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  if (isAuthChecking) {
    return <div className="app-loading-screen">Loading Bolt Platform...</div>
  }

  // Unauthenticated routes
  if (!sessionUser) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLoginSuccess={(_token, user) => {
                setSessionUser(user)
                navigate('/home')
              }}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignupPage
              onSignupSuccess={(_token, user) => {
                setSessionUser(user)
                navigate('/home')
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Authenticated Layout with Flexbox Desktop Sidebar (Sidebar expands alongside content, NOT over it)
  return (
    <div className="app-layout-flex">
      <Sidebar
        username={sessionUser.username}
        displayName={sessionUser.displayName}
        userRole={sessionUser.role}
        onLogout={handleLogout}
      />

      <main className="main-content-flow">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={
              <HomePage
                lessons={lessons}
                savedLessons={savedLessons}
                onToggleSaved={handleToggleSaved}
                onCompleteLesson={handleCompleteLesson}
                onOpenQuiz={handleOpenQuiz}
              />
            }
          />
          <Route
            path="/discover"
            element={
              <DiscoverPage
                categories={categories}
                lessons={lessons}
                savedLessons={savedLessons}
                searchQuery={searchQuery}
                tutorPrompt={tutorPrompt}
                tutorAnswer={tutorAnswer}
                onSearchQueryChange={setSearchQuery}
                onSearchSubmit={handleSearchSubmit}
                onCategorySelect={handleCategorySelect}
                onToggleSaved={handleToggleSaved}
                onCompleteLesson={handleCompleteLesson}
                onOpenQuiz={handleOpenQuiz}
                onTutorPromptChange={setTutorPrompt}
                onAskTutor={handleAskTutor}
              />
            }
          />
          <Route
            path="/leaderboard"
            element={<LeaderboardPage currentUsername={sessionUser.username} />}
          />
          <Route
            path="/saved"
            element={
              <SavedPage
                savedLessons={savedLessons}
                onToggleSaved={handleToggleSaved}
                onCompleteLesson={handleCompleteLesson}
                onOpenQuiz={handleOpenQuiz}
              />
            }
          />
          <Route path="/friends" element={<FriendsPage />} />
          <Route
            path="/profile"
            element={
              <ProfilePage
                username={sessionUser.username}
                displayName={sessionUser.displayName}
                userRole={sessionUser.role}
                userFollowersCount={sessionUser.followersCount}
                userFollowingCount={sessionUser.followingCount}
                interests={sessionUser.interests ?? []}
                userPosts={userPosts}
                onOpenCreateModal={() => setShowCreateModal(true)}
              />
            }
          />
          {sessionUser.role === 'admin' && (
            <Route
              path="/admin"
              element={
                <AdminPage onApprovePost={handleApprovePost} onRejectPost={handleRejectPost} />
              }
            />
          )}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>

        {quiz && (
          <QuizModal
            quiz={quiz}
            onClose={() => setQuiz(null)}
            onAnswer={handleAnswerQuiz}
          />
        )}

        {showCreateModal && (
          <CreateReelModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePost}
          />
        )}

        {quizFeedback && (
          <button className="feedback-toast" type="button" onClick={() => setQuizFeedback('')}>
            {quizFeedback}
          </button>
        )}
      </main>
    </div>
  )
}
