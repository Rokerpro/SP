import { useEffect, useState } from 'react'

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

type LeaderboardPageProps = {
  currentUsername?: string
}

const FALLBACK_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, id: 'lb1', username: 'einstein_al', displayName: 'Albert Einstein', grade: 'General', xp: 3890, streak: 14, completedCount: 42 },
  { rank: 2, id: 'lb2', username: 'curie_marie', displayName: 'Marie Curie', grade: 'Grade 11', xp: 3120, streak: 9, completedCount: 35 },
  { rank: 3, id: 'lb3', username: 'tesla_nikola', displayName: 'Nikola Tesla', grade: 'Grade 10', xp: 2980, streak: 11, completedCount: 31 },
  { rank: 4, id: 'lb4', username: 'ada_lovelace', displayName: 'Ada Lovelace', grade: 'Grade 12', xp: 2450, streak: 7, completedCount: 26 },
  { rank: 5, id: 'lb5', username: 'galileo_g', displayName: 'Galileo Galilei', grade: 'Grade 9', xp: 2150, streak: 5, completedCount: 21 },
]

export function LeaderboardPage({ currentUsername = '' }: LeaderboardPageProps) {
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardUser[]>(FALLBACK_LEADERBOARD)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    setIsLoading(true)
    fetch(`${apiUrl}/leaderboard`)
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setLeaderboardItems(result.data)
        } else {
          setLeaderboardItems(FALLBACK_LEADERBOARD)
        }
      })
      .catch(() => {
        setLeaderboardItems(FALLBACK_LEADERBOARD)
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="leaderboard-page">
      <header className="friends-heading">
        <p className="eyebrow">LEADERBOARD</p>
        <h1>Top Learners</h1>
        <p className="leaderboard-subtitle">
          Earn XP and climb the ranks by exploring educational volts and answering quizzes!
        </p>
      </header>

      {isLoading ? (
        <div className="loading-spinner">Loading rankings...</div>
      ) : (
        <>
          <div className="leaderboard-podium">
            {leaderboardItems.slice(0, 3).map((item, idx) => {
              const badge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
              const rankClass = idx === 0 ? 'rank-first' : idx === 1 ? 'rank-second' : 'rank-third'
              const name = item.displayName || item.username || 'Learner'
              const initials = name.slice(0, 2).toUpperCase()

              return (
                <div className={`podium-card ${rankClass}`} key={item.id || item.username}>
                  <div className="podium-badge">{badge}</div>
                  <div className="podium-avatar">{initials}</div>
                  <h3>{name}</h3>
                  <p className="podium-handle">@{item.username}</p>
                  <div className="podium-meta">
                    <span className="podium-grade">{item.grade || 'General'}</span>
                    <span className="podium-xp">{item.xp ?? 0} XP</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="leaderboard-list">
            {leaderboardItems.map((item) => {
              const isSelf = Boolean(currentUsername && item.username === currentUsername)
              const name = item.displayName || item.username || 'Learner'
              const initials = name.slice(0, 2).toUpperCase()

              return (
                <div className={`leaderboard-row${isSelf ? ' is-self' : ''}`} key={item.id || item.username}>
                  <div className="rank-num">#{item.rank}</div>
                  <div className="user-info">
                    <div className="user-avatar">{initials}</div>
                    <div>
                      <strong>
                        {name} {isSelf && <span className="you-tag">(You)</span>}
                      </strong>
                      <small>
                        @{item.username} • {item.grade || 'General'}
                      </small>
                    </div>
                  </div>
                  <div className="user-stats-meta">
                    <span>🔥 {item.streak ?? 0} Streak</span>
                    <span>✓ {item.completedCount ?? 0} Learned</span>
                    <span className="xp-badge">{item.xp ?? 0} XP</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
