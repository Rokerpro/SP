import { useEffect, useState, type FormEvent } from 'react'
import { BoltLogo } from './BoltLogo'

export type HomeLesson = {
  slug: string
  category: string
  title: string
  topic: string
  explanation: string
  takeaway: string
  difficulty: string
  visualKey: string
  relatedTopics: string[]
}

export type HomeProgressStats = {
  conceptsLearned: number
  quizAccuracy: number
  savedLessons: number
  streak: number
  categoryProgress: Record<string, { completed: number; total: number }>
}

export type HomeView = 'home' | 'discover' | 'leaderboard' | 'saved' | 'progress' | 'profile'

type Quiz = { lessonSlug: string; question: string; options: string[] }

type LeaderboardUser = {
  rank: number
  id: string
  username: string
  displayName: string
  age?: number
  grade?: string
  xp: number
  streak: number
  completedCount: number
}

const friendSuggestions = [
  { name: 'Alex R.', username: 'alexr_designs', connections: 5, action: 'Add Friend' },
  { name: 'Samantha K.', username: 'samantha_k', connections: 5, action: 'Add Friend' },
  { name: 'Jordan M.', username: 'jordan_makes', connections: 8, action: 'Add Friend' },
  { name: 'Maya L.', username: 'maya_labs', connections: 3, action: 'Add Friend' },
  { name: 'Alex R.', username: 'alexr_designs_2', connections: 5, action: 'Add Friend' },
  { name: 'Samantha K.', username: 'samantha_k_2', connections: 5, action: 'Add Friend' },
  { name: 'Jordan M.', username: 'jordan_makes_2', connections: 8, action: 'Add Friend' },
  { name: 'Maya L.', username: 'maya_labs_2', connections: 3, action: 'Add Friend' },
]

type HomePageProps = {
  displayName: string
  username: string
  interests: string[]
  activeView: HomeView
  lessons: HomeLesson[]
  savedLessons: HomeLesson[]
  progressStats: HomeProgressStats
  categories: string[]
  searchQuery: string
  quiz: Quiz | null
  quizFeedback: string
  tutorPrompt: string
  tutorAnswer: string
  onViewChange: (view: HomeView) => void
  onLogout: () => void
  onSearchQueryChange: (query: string) => void
  onSearch: (event: FormEvent<HTMLFormElement>) => void
  onCategorySelect: (category: string) => void
  onLessonSelect: (lesson: HomeLesson) => void
  onCompleteLesson: (lesson: HomeLesson) => void
  onToggleSaved: (lesson: HomeLesson) => void
  onOpenQuiz: (lesson: HomeLesson) => void
  onCloseQuiz: () => void
  onAnswerQuiz: (answer: number) => void
  onQuizFeedbackDismiss: () => void
  onTutorPromptChange: (prompt: string) => void
  onAskTutor: (event: FormEvent<HTMLFormElement>) => void
}

export function HomePage({
  displayName,
  username,
  interests,
  activeView,
  lessons,
  savedLessons,
  progressStats,
  categories,
  searchQuery,
  quiz,
  quizFeedback,
  tutorPrompt,
  tutorAnswer,
  onViewChange,
  onLogout,
  onSearchQueryChange,
  onSearch,
  onCategorySelect,
  onLessonSelect,
  onCompleteLesson,
  onToggleSaved,
  onOpenQuiz,
  onCloseQuiz,
  onAnswerQuiz,
  onQuizFeedbackDismiss,
  onTutorPromptChange,
  onAskTutor,
}: HomePageProps) {
  const [lessonIndex, setLessonIndex] = useState(0)
  const [profileImage, setProfileImage] = useState('')
  const [friendQuery, setFriendQuery] = useState('')
  const [followedFriends, setFollowedFriends] = useState<string[]>([])
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardUser[]>([])
  const reelLessons = lessons.slice(0, 15)
  const reelSequence = reelLessons.reduce<Array<{ type: 'lesson' | 'quiz'; lesson: HomeLesson }>>((items, lesson, index) => {
    items.push({ type: 'lesson', lesson })
    if ((index + 1) % 3 === 0 && index < reelLessons.length - 1) {
      items.push({ type: 'quiz', lesson })
    }
    return items
  }, [])

  useEffect(() => {
    setLessonIndex(0)
  }, [lessons])

  useEffect(() => {
    if (activeView !== 'leaderboard') return
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    fetch(`${apiUrl}/leaderboard`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setLeaderboardItems(result.data)
      })
      .catch(() => {})
  }, [activeView])

  const currentItem = reelSequence[lessonIndex]
  const currentLesson = currentItem?.lesson
  const visibleFriends = friendSuggestions.filter((friend) => `${friend.name} ${friend.username}`.toLowerCase().includes(friendQuery.toLowerCase()))
  const interestSummary = interests.length ? interests.join(' · ') : 'Keep exploring new ideas and finding your next spark.'

  function handleProfileImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const imageUrl = URL.createObjectURL(file)
    setProfileImage((current) => {
      if (current) URL.revokeObjectURL(current)
      return imageUrl
    })
  }

  useEffect(() => {
    if (activeView !== 'home') return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setLessonIndex((index) => Math.max(0, index - 1))
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setLessonIndex((index) => Math.min(reelSequence.length - 1, index + 1))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeView, reelSequence.length])

  return (
    <main className={`app-shell${activeView === 'home' ? ' reels-page' : ''}`}>
      <nav className="app-nav reels-rail">
        <div className="app-brand"><BoltLogo compact /></div>
        <div className="nav-links" aria-label="Main navigation">
          {([['home', 'Volt'], ['discover', 'Library'], ['leaderboard', 'Leaderboard'], ['progress', 'Friends']] as const).map(([view, label]) => <button className={activeView === view ? 'active' : ''} key={view} type="button" onClick={() => onViewChange(view)}>{label}</button>)}
        </div>
        <button className={`profile-button${activeView === 'profile' ? ' active' : ''}`} type="button" onClick={() => onViewChange('profile')}><span className="sidebar-profile-image">{profileImage ? <img src={profileImage} alt="" /> : displayName.slice(0, 2).toUpperCase()}</span><span>Profile</span></button>
        <button className="logout-button" type="button" onClick={onLogout}>Logout</button>
      </nav>
        <section className={`app-content reels-content${activeView === 'home' ? ' reels-content-home' : ''}`}>
        {activeView === 'home' && <>
          <header className="reels-heading"><p className="eyebrow">YOUR DAILY BOLT</p><h1>One idea at a time.</h1><p>Scroll to keep learning.</p></header>
          {currentItem ? <div className="lesson-feed reels-feed">{currentItem.type === 'quiz' ? <article className="lesson-card reel-card quiz-card" key={`${currentItem.lesson.slug}-quiz`}><div className="quiz-card-inner"><p className="quiz-card-kicker">Quick Check</p><h3>Test what you learned</h3><p>{currentItem.lesson.title}</p><button type="button" onClick={() => onOpenQuiz(currentItem.lesson)}>Start quiz</button></div></article> : <article className="lesson-card reel-card" key={currentItem.lesson.slug}><div className="reel-visual"><span className="reel-visual-label">{currentItem.lesson.visualKey}</span><span className="reel-play" aria-hidden="true">▶</span><div className="reel-overlay"><div className="lesson-meta"><span>{currentItem.lesson.category}</span><span>{currentItem.lesson.difficulty}</span></div><h2>{currentItem.lesson.title}</h2><p>{currentItem.lesson.explanation}</p><strong>{currentItem.lesson.takeaway}</strong></div></div></article>}<div className="reel-stepper" aria-label="Lesson navigation"><button type="button" aria-label="Previous lesson" disabled={lessonIndex === 0} onClick={() => setLessonIndex((index) => Math.max(0, index - 1))}>⌃</button><span>{reelSequence.length ? `${lessonIndex + 1} / ${reelSequence.length}` : '0 / 0'}</span><button type="button" aria-label="Next lesson" disabled={lessonIndex >= reelSequence.length - 1} onClick={() => setLessonIndex((index) => Math.min(reelSequence.length - 1, index + 1))}>⌄</button></div>{lessonIndex >= reelSequence.length - 1 && reelSequence.length > 0 && <p className="reel-ending">Your daily dose of education ends here.</p>}</div> : <p className="empty-state">No lessons available.</p>}
        </>}
        {activeView === 'discover' && null}
        {activeView === 'leaderboard' && (
          <section className="leaderboard-page">
            <header className="friends-heading">
              <p className="eyebrow">LEADERBOARD</p>
              <h1>Top Learners</h1>
              <p className="leaderboard-subtitle">Climb the ranks by exploring lessons and mastering quizzes.</p>
            </header>
            <div className="leaderboard-podium">
              {leaderboardItems.slice(0, 3).map((item, idx) => {
                const badge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
                const rankClass = idx === 0 ? 'rank-first' : idx === 1 ? 'rank-second' : 'rank-third'
                return (
                  <div className={`podium-card ${rankClass}`} key={item.id}>
                    <div className="podium-badge">{badge}</div>
                    <div className="podium-avatar">{item.displayName.slice(0, 2).toUpperCase()}</div>
                    <h3>{item.displayName}</h3>
                    <p className="podium-handle">@{item.username}</p>
                    <div className="podium-meta">
                      <span className="podium-grade">{item.grade || 'General'}</span>
                      <span className="podium-xp">{item.xp} XP</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="leaderboard-list">
              {leaderboardItems.map((item) => {
                const isSelf = item.username === username
                return (
                  <div className={`leaderboard-row${isSelf ? ' is-self' : ''}`} key={item.id}>
                    <div className="rank-num">#{item.rank}</div>
                    <div className="user-info">
                      <div className="user-avatar">{item.displayName.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <strong>{item.displayName} {isSelf && <span className="you-tag">(You)</span>}</strong>
                        <small>@{item.username} • {item.grade || 'General'}</small>
                      </div>
                    </div>
                    <div className="user-stats">
                      <span title="Completed concepts">📚 {item.completedCount}</span>
                      <span title="Streak">🔥 {item.streak}d</span>
                      <strong className="user-xp">⚡ {item.xp} XP</strong>
                    </div>
                  </div>
                )
              })}
              {leaderboardItems.length === 0 && <p className="empty-state">No leaderboard entries yet.</p>}
            </div>
          </section>
        )}
        {activeView === 'saved' && <><header className="page-heading"><p className="eyebrow">SAVED</p><h1>Ideas worth returning to.</h1></header><div className="saved-list">{savedLessons.length ? savedLessons.map((lesson) => <article key={lesson.slug}><span>{lesson.category}</span><h2>{lesson.title}</h2><button type="button" onClick={() => onToggleSaved(lesson)}>Remove</button></article>) : <p className="empty-state">Nothing saved yet.</p>}</div></>}
        {activeView === 'progress' && <section className="friends-page"><header className="friends-heading"><p className="eyebrow">FRIENDS</p><h1>People you may know</h1></header><label className="friends-search"><span aria-hidden="true" /> <input value={friendQuery} onChange={(event) => setFriendQuery(event.target.value)} placeholder="Search by name, username, or email..." /></label><div className="friends-grid">{visibleFriends.map((friend) => { const isFollowed = followedFriends.includes(friend.username); return <article className="friend-card" key={friend.username}><span className="friend-avatar" aria-hidden="true"><span /></span><h2>{friend.name}</h2><p>@{friend.username}</p><small>{friend.connections} shared connections</small><button type="button" onClick={() => setFollowedFriends((current) => isFollowed ? current.filter((usernameToRemove) => usernameToRemove !== friend.username) : [...current, friend.username])}>{isFollowed ? 'Request Sent' : friend.action}</button></article> })}</div>{visibleFriends.length === 0 && <p className="empty-state">No people found.</p>}</section>}
        {activeView === 'profile' && <section className="profile-page"><div className="profile-hero"><label className="profile-avatar-picker" aria-label="Change profile picture"><input type="file" accept="image/*" onChange={handleProfileImageChange} />{profileImage ? <img src={profileImage} alt="Profile" /> : <span>{displayName.slice(0, 2).toUpperCase()}</span>}<i aria-hidden="true">✎</i></label><div className="profile-summary"><h1>{displayName}</h1><p className="profile-handle">@{username}</p><p className="profile-bio">{interestSummary}</p></div></div><div className="profile-progress-card"><div className="profile-progress-label">TOTAL XP</div><div className="xp-bar"><span /></div><p>{progressStats.conceptsLearned * 50} XP earned ({progressStats.conceptsLearned} concepts learned)</p></div><div className="profile-section-label">Recent Creations</div><div className="profile-preview">FEATURED CREATION IMAGE /<br />PREVIEW PLACEHOLDER<br /><span>(DASHED BORDER)</span></div></section>}
      </section>
      {quiz && <div className="quiz-modal"><div><button className="modal-close" type="button" onClick={onCloseQuiz}>Close</button><p className="eyebrow">QUICK CHECK</p><h2>{quiz.question}</h2>{quiz.options.map((option, index) => <button className="quiz-option" type="button" key={option} onClick={() => onAnswerQuiz(index)}>{option}</button>)}</div></div>}
      {quizFeedback && <button className="feedback-toast" type="button" onClick={onQuizFeedbackDismiss}>{quizFeedback}</button>}
    </main>
  )
}
