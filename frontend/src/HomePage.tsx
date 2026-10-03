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
  mediaType?: 'text' | 'video'
  videoUrl?: string
  status?: 'approved' | 'pending' | 'rejected'
  authorName?: string
}

export type HomeProgressStats = {
  conceptsLearned: number
  quizAccuracy: number
  savedLessons: number
  streak: number
  categoryProgress: Record<string, { completed: number; total: number }>
}

export type HomeView = 'home' | 'discover' | 'leaderboard' | 'saved' | 'progress' | 'profile' | 'admin'

type Quiz = { lessonSlug: string; question: string; options: string[] }

type AdminUser = {
  _id: string
  email: string
  username: string
  displayName: string
  role: 'user' | 'admin'
  age?: number
  grade?: string
  xp?: number
  streak?: number
  completedCount?: number
  followers?: string[]
  following?: string[]
}

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
  userRole?: 'user' | 'admin'
  userFollowersCount?: number
  userFollowingCount?: number
  interests: string[]
  activeView: HomeView
  lessons: HomeLesson[]
  userPosts?: HomeLesson[]
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
  onCreatePost?: (postData: { title: string; topic: string; category: string; explanation: string; takeaway: string; difficulty: string; mediaType: 'text' | 'video'; videoUrl: string }) => Promise<void>
  onApprovePost?: (slug: string) => Promise<void>
  onRejectPost?: (slug: string) => Promise<void>
}

export function HomePage({
  displayName,
  username,
  userRole = 'user',
  userFollowersCount = 0,
  userFollowingCount = 0,
  interests,
  activeView,
  lessons,
  userPosts = [],
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
  onCreatePost,
  onApprovePost,
  onRejectPost,
}: HomePageProps) {
  const [lessonIndex, setLessonIndex] = useState(0)
  const [profileImage, setProfileImage] = useState('')
  const [friendQuery, setFriendQuery] = useState('')
  const [followedFriends, setFollowedFriends] = useState<string[]>([])
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardUser[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [newCategory, setNewCategory] = useState('Science')
  const [newExplanation, setNewExplanation] = useState('')
  const [newTakeaway, setNewTakeaway] = useState('')
  const [newMediaType, setNewMediaType] = useState<'text' | 'video'>('text')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [adminStats, setAdminStats] = useState<{ totalUsers: number; totalLessons: number; pendingCount: number; totalAttempts: number } | null>(null)
  const [pendingPosts, setPendingPosts] = useState<HomeLesson[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminTab, setAdminTab] = useState<'posts' | 'users'>('posts')
  const [adminResetPw, setAdminResetPw] = useState('')
  const [adminResetTarget, setAdminResetTarget] = useState('')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  const reelLessons = lessons.slice(0, 20)
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

  const [realSuggestedUsers, setRealSuggestedUsers] = useState<Array<{ id: string; name: string; username: string; bio?: string; avatar?: string; xp: number; grade?: string; followersCount: number; followingCount: number; isFollowing: boolean }>>([])

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

  useEffect(() => {
    if (activeView !== 'progress') return
    const token = localStorage.getItem('bolt-token') ?? ''
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    fetch(`${apiUrl}/users/suggested${friendQuery ? `?q=${encodeURIComponent(friendQuery)}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setRealSuggestedUsers(result.data)
        }
      })
      .catch(() => {})
  }, [activeView, friendQuery])

  useEffect(() => {
    if (activeView !== 'admin' || userRole !== 'admin') return
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    const token = localStorage.getItem('bolt-token') ?? ''
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${apiUrl}/admin/stats`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/admin/pending-posts`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/admin/users`, { headers }).then((res) => res.json()),
    ])
      .then(([statsRes, pendingRes, usersRes]) => {
        if (statsRes.success) setAdminStats(statsRes.data)
        if (pendingRes.success) setPendingPosts(pendingRes.data)
        if (usersRes.success) setAdminUsers(usersRes.data)
      })
      .catch(() => {})
  }, [activeView, userRole])

  const currentItem = reelSequence[lessonIndex]
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

  async function handleCreatePostSubmit(event: FormEvent) {
    event.preventDefault()
    if (!onCreatePost) return
    await onCreatePost({
      title: newTitle,
      topic: newTopic,
      category: newCategory,
      explanation: newExplanation,
      takeaway: newTakeaway,
      difficulty: 'Beginner',
      mediaType: newMediaType,
      videoUrl: newVideoUrl,
    })
    setShowCreateModal(false)
    setNewTitle('')
    setNewTopic('')
    setNewExplanation('')
    setNewTakeaway('')
    setNewVideoUrl('')
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
          {([
            ['home', 'Volt'],
            ['discover', 'Library'],
            ['leaderboard', 'Leaderboard'],
            ['progress', 'Friends'],
            ...(userRole === 'admin' ? [['admin', 'Admin Panel'] as const] : []),
          ] as const).map(([view, label]) => (
            <button className={activeView === view ? 'active' : ''} key={view} type="button" onClick={() => onViewChange(view as HomeView)}>
              {label}
            </button>
          ))}
        </div>
        <button className={`profile-button${activeView === 'profile' ? ' active' : ''}`} type="button" onClick={() => onViewChange('profile')}>
          <span className="sidebar-profile-image">{profileImage ? <img src={profileImage} alt="" /> : displayName.slice(0, 2).toUpperCase()}</span>
          <span>Profile</span>
        </button>
        <button className="logout-button" type="button" onClick={onLogout}>Logout</button>
      </nav>

      <section className={`app-content reels-content${activeView === 'home' ? ' reels-content-home' : ''}`}>
        {activeView === 'home' && (
          <>
            <header className="reels-heading"><p className="eyebrow">YOUR DAILY BOLT</p><h1>One idea at a time.</h1><p>Scroll to keep learning.</p></header>
            {currentItem ? (
              <div className="lesson-feed reels-feed">
                {currentItem.type === 'quiz' ? (
                  <article className="lesson-card reel-card quiz-card" key={`${currentItem.lesson.slug}-quiz`}>
                    <div className="quiz-card-inner">
                      <p className="quiz-card-kicker">Quick Check</p>
                      <h3>Test what you learned</h3>
                      <p>{currentItem.lesson.title}</p>
                      <button type="button" onClick={() => onOpenQuiz(currentItem.lesson)}>Start quiz</button>
                    </div>
                  </article>
                ) : (
                  <article className="lesson-card reel-card" key={currentItem.lesson.slug}>
                    {currentItem.lesson.mediaType === 'video' && currentItem.lesson.videoUrl ? (
                      <div className="reel-video-container">
                        <video src={currentItem.lesson.videoUrl} autoPlay loop muted playsInline className="reel-video" />
                        <div className="reel-overlay">
                          <div className="lesson-meta">
                            <span>{currentItem.lesson.category}</span>
                            <span>{currentItem.lesson.difficulty}</span>
                          </div>
                          <h2>{currentItem.lesson.title}</h2>
                          <p>{currentItem.lesson.explanation}</p>
                          <strong>{currentItem.lesson.takeaway}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="reel-visual">
                        <span className="reel-visual-label">{currentItem.lesson.visualKey}</span>
                        <span className="reel-play" aria-hidden="true">▶</span>
                        <div className="reel-overlay">
                          <div className="lesson-meta">
                            <span>{currentItem.lesson.category}</span>
                            <span>{currentItem.lesson.difficulty}</span>
                          </div>
                          <h2>{currentItem.lesson.title}</h2>
                          <p>{currentItem.lesson.explanation}</p>
                          <strong>{currentItem.lesson.takeaway}</strong>
                        </div>
                      </div>
                    )}
                  </article>
                )}
                <div className="reel-stepper" aria-label="Lesson navigation">
                  <button type="button" aria-label="Previous lesson" disabled={lessonIndex === 0} onClick={() => setLessonIndex((index) => Math.max(0, index - 1))}>⌃</button>
                  <span>{reelSequence.length ? `${lessonIndex + 1} / ${reelSequence.length}` : '0 / 0'}</span>
                  <button type="button" aria-label="Next lesson" disabled={lessonIndex >= reelSequence.length - 1} onClick={() => setLessonIndex((index) => Math.min(reelSequence.length - 1, index + 1))}>⌄</button>
                </div>
              </div>
            ) : (
              <p className="empty-state">No lessons available.</p>
            )}
          </>
        )}

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
            </div>
          </section>
        )}

        {activeView === 'admin' && (
          <section className="admin-page">
            <header className="friends-heading">
              <p className="eyebrow">ADMINISTRATOR CONTROL</p>
              <h1>Platform Management</h1>
            </header>

            {adminStats && (
              <div className="admin-stats-grid">
                <div className="stat-card"><h3>{adminStats.totalUsers}</h3><p>Total Users</p></div>
                <div className="stat-card"><h3>{adminStats.totalLessons}</h3><p>Approved Reels</p></div>
                <div className="stat-card highlight"><h3>{adminStats.pendingCount}</h3><p>Pending Reviews</p></div>
                <div className="stat-card"><h3>{adminStats.totalAttempts}</h3><p>Quiz Attempts</p></div>
              </div>
            )}

            <div className="admin-tabs">
              <button className={adminTab === 'posts' ? 'active' : ''} type="button" onClick={() => setAdminTab('posts')}>Content Review</button>
              <button className={adminTab === 'users' ? 'active' : ''} type="button" onClick={() => setAdminTab('users')}>User Management</button>
            </div>

            {adminTab === 'posts' && (
              <>
                <div className="profile-section-label">Pending User Submissions ({pendingPosts.length})</div>
                <div className="admin-pending-list">
                  {pendingPosts.map((post) => (
                    <article className="admin-post-card" key={post.slug}>
                      <div className="admin-post-meta">
                        <span className="category-badge">{post.category}</span>
                        <span className="author-tag">By {post.authorName || 'Learner'}</span>
                      </div>
                      <h2>{post.title}</h2>
                      <p>{post.explanation}</p>
                      <strong>Takeaway: {post.takeaway}</strong>
                      <div className="admin-actions">
                        <button className="approve-btn" type="button" onClick={async () => { if (onApprovePost) await onApprovePost(post.slug); setPendingPosts((curr) => curr.filter((p) => p.slug !== post.slug)) }}>✓ Approve & Publish</button>
                        <button className="reject-btn" type="button" onClick={async () => { if (onRejectPost) await onRejectPost(post.slug); setPendingPosts((curr) => curr.filter((p) => p.slug !== post.slug)) }}>✕ Reject</button>
                      </div>
                    </article>
                  ))}
                  {pendingPosts.length === 0 && <p className="empty-state">No pending posts to review.</p>}
                </div>
              </>
            )}

            {adminTab === 'users' && (
              <>
                <div className="profile-section-label">All Platform Users ({adminUsers.length})</div>
                <div className="admin-users-list">
                  {adminUsers.map((u) => (
                    <div className="admin-user-row" key={u._id}>
                      <div className="admin-user-info">
                        <div className="user-avatar">{u.displayName.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <strong>{u.displayName}</strong>
                          <small>@{u.username} · {u.email} · {u.grade || 'General'} · {u.xp ?? 0} XP</small>
                        </div>
                      </div>
                      <div className="admin-user-actions">
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                        <button type="button" onClick={async () => {
                          const newRole = u.role === 'admin' ? 'user' : 'admin'
                          const token = localStorage.getItem('bolt-token') ?? ''
                          const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/users/${u._id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role: newRole }) })
                          const result = await res.json()
                          if (result.success) setAdminUsers((cur) => cur.map((x) => x._id === u._id ? { ...x, role: newRole } : x))
                        }}>{u.role === 'admin' ? 'Demote' : 'Make Admin'}</button>
                        {adminResetTarget === u._id ? (
                          <form className="inline-pw-form" onSubmit={async (e) => {
                            e.preventDefault()
                            const token = localStorage.getItem('bolt-token') ?? ''
                            const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/users/${u._id}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ newPassword: adminResetPw }) })
                            const result = await res.json()
                            if (result.success) { setAdminResetTarget(''); setAdminResetPw('') }
                          }}>
                            <input type="password" placeholder="New password" value={adminResetPw} onChange={(e) => setAdminResetPw(e.target.value)} minLength={8} required />
                            <button type="submit">Set</button>
                            <button type="button" onClick={() => setAdminResetTarget('')}>Cancel</button>
                          </form>
                        ) : (
                          <button type="button" onClick={() => setAdminResetTarget(u._id)}>Reset Password</button>
                        )}
                        <button className="reject-btn" type="button" onClick={async () => {
                          const token = localStorage.getItem('bolt-token') ?? ''
                          const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/users/${u._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                          const result = await res.json()
                          if (result.success) setAdminUsers((cur) => cur.filter((x) => x._id !== u._id))
                        }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {activeView === 'progress' && (
          <section className="friends-page">
            <header className="friends-heading"><p className="eyebrow">COMMUNITY & FRIENDS</p><h1>People You May Know</h1></header>
            <label className="friends-search">
              <span aria-hidden="true" />
              <input value={friendQuery} onChange={(event) => setFriendQuery(event.target.value)} placeholder="Search users by name or username..." />
            </label>
            <div className="friends-grid">
              {realSuggestedUsers.map((userItem) => (
                <article className="friend-card" key={userItem.username}>
                  <div className="user-avatar">{userItem.name.slice(0, 2).toUpperCase()}</div>
                  <h2>{userItem.name}</h2>
                  <p>@{userItem.username}</p>
                  <small>{userItem.grade || 'General'} • {userItem.xp} XP</small>
                  <button
                    type="button"
                    className={userItem.isFollowing ? 'following-btn' : ''}
                    onClick={async () => {
                      const token = localStorage.getItem('bolt-token') ?? ''
                      const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
                      const res = await fetch(`${apiUrl}/users/${userItem.username}/follow`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                      })
                      const result = await res.json()
                      if (result.success) {
                        setRealSuggestedUsers((cur) =>
                          cur.map((u) => (u.username === userItem.username ? { ...u, isFollowing: result.data.isFollowing } : u))
                        )
                      }
                    }}
                  >
                    {userItem.isFollowing ? '✓ Following' : '+ Follow'}
                  </button>
                </article>
              ))}
              {realSuggestedUsers.length === 0 && <p className="empty-state">No users found matching "{friendQuery}".</p>}
            </div>
          </section>
        )}

        {activeView === 'profile' && (
          <section className="profile-page">
            <div className="profile-hero">
              <label className="profile-avatar-picker" aria-label="Change profile picture">
                <input type="file" accept="image/*" onChange={handleProfileImageChange} />
                {profileImage ? <img src={profileImage} alt="Profile" /> : <span>{displayName.slice(0, 2).toUpperCase()}</span>}
                <i aria-hidden="true">✎</i>
              </label>
              <div className="profile-summary">
                <h1>{displayName} {userRole === 'admin' && <span className="admin-badge">Admin</span>}</h1>
                <p className="profile-handle">@{username}</p>
                <p className="profile-bio">{interestSummary}</p>
                <div className="profile-stats-row">
                  <div><strong>{userPosts.length}</strong><span>Reels</span></div>
                  <div><strong>{userFollowersCount}</strong><span>Followers</span></div>
                  <div><strong>{userFollowingCount}</strong><span>Following</span></div>
                </div>
              </div>
            </div>

            <button className="create-reel-btn" type="button" onClick={() => setShowCreateModal(true)}>
              + Create New Educational Reel
            </button>

            <div className="profile-section-label">Your Reels ({userPosts.length})</div>
            <div className="user-posts-list">
              {userPosts.map((post) => (
                <article className="user-post-card" key={post.slug}>
                  <div className="post-header">
                    <span className="post-category">{post.category}</span>
                    <span className={`status-badge ${post.status ?? 'approved'}`}>
                      {post.status === 'pending' ? '⏳ Under Review' : post.status === 'rejected' ? '❌ Rejected' : '✓ Published'}
                    </span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.explanation}</p>
                </article>
              ))}
              {userPosts.length === 0 && <p className="empty-state">No reels created yet. Click above to post your first reel!</p>}
            </div>

            <div className="profile-section-label">Change Password</div>
            <form className="change-pw-form" onSubmit={async (e) => {
              e.preventDefault()
              setPwMsg('')
              const token = localStorage.getItem('bolt-token') ?? ''
              const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/users/change-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }) })
              const result = await res.json()
              if (result.success) { setPwMsg('Password updated'); setOldPw(''); setNewPw('') }
              else setPwMsg(result.error || 'Failed to update')
            }}>
              <input className="standalone-input" type="password" placeholder="Current password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required />
              <input className="standalone-input" type="password" placeholder="New password (min 8 chars)" value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={8} required />
              <button className="submit-button" type="submit">Update Password</button>
              {pwMsg && <p className="pw-msg">{pwMsg}</p>}
            </form>
          </section>
        )}
      </section>

      {showCreateModal && (
        <div className="quiz-modal">
          <div className="create-post-dialog">
            <button className="modal-close" type="button" onClick={() => setShowCreateModal(false)}>Close</button>
            <p className="eyebrow">CREATE REEL</p>
            <h2>Share an Educational Reel</h2>
            <form onSubmit={handleCreatePostSubmit}>
              <label htmlFor="post-title">TITLE</label>
              <input className="standalone-input" id="post-title" type="text" placeholder="e.g. How Solar Panels Work" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />

              <label htmlFor="post-topic">TOPIC / KEYWORD</label>
              <input className="standalone-input" id="post-topic" type="text" placeholder="e.g. Photovoltaics" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} required />

              <label htmlFor="post-category">CATEGORY</label>
              <select className="standalone-input grade-select" id="post-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                {['Science', 'Space', 'Technology', 'Mathematics', 'Psychology', 'History', 'Environment', 'Literature', 'Economics'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <label htmlFor="post-media-type">CONTENT FORMAT</label>
              <select className="standalone-input grade-select" id="post-media-type" value={newMediaType} onChange={(e) => setNewMediaType(e.target.value as 'text' | 'video')}>
                <option value="text">Text & Visual Card</option>
                <option value="video">Short Video Reel</option>
              </select>

              {newMediaType === 'video' && (
                <>
                  <label htmlFor="post-video-url">VIDEO URL (MP4 / WebM)</label>
                  <input className="standalone-input" id="post-video-url" type="url" placeholder="https://example.com/video.mp4" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} required />
                </>
              )}

              <label htmlFor="post-explanation">EXPLANATION</label>
              <textarea className="standalone-input text-area" id="post-explanation" rows={3} placeholder="Explain the key concept simply..." value={newExplanation} onChange={(e) => setNewExplanation(e.target.value)} required />

              <label htmlFor="post-takeaway">KEY TAKEAWAY</label>
              <input className="standalone-input" id="post-takeaway" type="text" placeholder="One main point to remember..." value={newTakeaway} onChange={(e) => setNewTakeaway(e.target.value)} required />

              <button className="submit-button" type="submit">SUBMIT FOR REVIEW</button>
            </form>
          </div>
        </div>
      )}

      {quiz && (
        <div className="quiz-modal">
          <div>
            <button className="modal-close" type="button" onClick={onCloseQuiz}>Close</button>
            <p className="eyebrow">QUICK CHECK</p>
            <h2>{quiz.question}</h2>
            {quiz.options.map((option, index) => (
              <button className="quiz-option" type="button" key={option} onClick={() => onAnswerQuiz(index)}>{option}</button>
            ))}
          </div>
        </div>
      )}

      {quizFeedback && <button className="feedback-toast" type="button" onClick={onQuizFeedbackDismiss}>{quizFeedback}</button>}
    </main>
  )
}
