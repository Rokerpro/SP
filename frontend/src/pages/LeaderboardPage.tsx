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
  currentUsername: string
}

export function LeaderboardPage({ currentUsername }: LeaderboardPageProps) {
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    fetch(`${apiUrl}/leaderboard`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setLeaderboardItems(result.data)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="leaderboard-page-container">
      <header className="page-header">
        <span className="eyebrow">LEADERBOARD</span>
        <h1>Top Learners</h1>
        <p className="leaderboard-subtitle">
          Earn XP and climb the ranks by watching educational reels and answering quizzes!
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
              const isSelf = item.username === currentUsername
              return (
                <div className={`leaderboard-row${isSelf ? ' is-self' : ''}`} key={item.id}>
                  <div className="rank-num">#{item.rank}</div>
                  <div className="user-info">
                    <div className="user-avatar">{item.displayName.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>
                        {item.displayName} {isSelf && <span className="you-tag">(You)</span>}
                      </strong>
                      <small>
                        @{item.username} • {item.grade || 'General'}
                      </small>
                    </div>
                  </div>
                  <div className="user-stats-meta">
                    <span>🔥 {item.streak} Streak</span>
                    <span>✓ {item.completedCount} Learned</span>
                    <span className="xp-badge">{item.xp} XP</span>
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
