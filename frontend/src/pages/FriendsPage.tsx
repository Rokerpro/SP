import { useState, useEffect } from 'react'

type RealSuggestedUser = {
  id: string
  name: string
  username: string
  bio?: string
  avatar?: string
  xp: number
  grade?: string
  followersCount: number
  followingCount: number
  isFollowing: boolean
}

export function FriendsPage() {
  const [friendQuery, setFriendQuery] = useState('')
  const [suggestedUsers, setSuggestedUsers] = useState<RealSuggestedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('bolt-token') ?? ''
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    setIsLoading(true)
    fetch(`${apiUrl}/users/suggested${friendQuery ? `?q=${encodeURIComponent(friendQuery)}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setSuggestedUsers(result.data)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [friendQuery])

  async function handleToggleFollow(targetUsername: string) {
    const token = localStorage.getItem('bolt-token') ?? ''
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    const res = await fetch(`${apiUrl}/users/${targetUsername}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = await res.json()
    if (result.success) {
      setSuggestedUsers((cur) =>
        cur.map((u) => (u.username === targetUsername ? { ...u, isFollowing: result.data.isFollowing } : u))
      )
    }
  }

  return (
    <div className="friends-page-container">
      <header className="page-header">
        <span className="eyebrow">COMMUNITY & FRIENDS</span>
        <h1>Connect with Learners</h1>
        <p>Find friends, study partners, and fellow curious minds on Bolt.</p>
      </header>

      <label className="friends-search">
        <span aria-hidden="true" />
        <input
          value={friendQuery}
          onChange={(e) => setFriendQuery(e.target.value)}
          placeholder="Search users by name or username..."
        />
      </label>

      {isLoading ? (
        <div className="loading-spinner">Searching learners...</div>
      ) : (
        <div className="friends-grid">
          {suggestedUsers.map((userItem) => (
            <article className="friend-card" key={userItem.username}>
              <div className="user-avatar">{userItem.name.slice(0, 2).toUpperCase()}</div>
              <h2>{userItem.name}</h2>
              <p>@{userItem.username}</p>
              <small>{userItem.grade || 'General'} • {userItem.xp} XP</small>
              <button
                type="button"
                className={`follow-btn ${userItem.isFollowing ? 'following' : ''}`}
                onClick={() => handleToggleFollow(userItem.username)}
              >
                {userItem.isFollowing ? '✓ Following' : '+ Follow'}
              </button>
            </article>
          ))}
          {suggestedUsers.length === 0 && (
            <p className="empty-state">No users found matching "{friendQuery}".</p>
          )}
        </div>
      )}
    </div>
  )
}
