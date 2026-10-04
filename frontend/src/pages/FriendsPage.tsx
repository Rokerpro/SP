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

const FALLBACK_USERS: RealSuggestedUser[] = [
  {
    id: 'f1',
    name: 'Ada Lovelace',
    username: 'ada_code',
    bio: 'Pioneer of computer algorithms & analytical engine logic',
    xp: 2450,
    grade: 'Grade 12',
    followersCount: 142,
    followingCount: 38,
    isFollowing: false,
  },
  {
    id: 'f2',
    name: 'Albert Einstein',
    username: 'relativity_al',
    bio: 'Exploring general relativity, gravity & quantum mechanics',
    xp: 3890,
    grade: 'General',
    followersCount: 480,
    followingCount: 52,
    isFollowing: true,
  },
  {
    id: 'f3',
    name: 'Marie Curie',
    username: 'marie_rad',
    bio: 'Radioactivity research & double Nobel laureate in physics/chem',
    xp: 3120,
    grade: 'Grade 11',
    followersCount: 290,
    followingCount: 44,
    isFollowing: false,
  },
  {
    id: 'f4',
    name: 'Nikola Tesla',
    username: 'tesla_sparks',
    bio: 'AC electricity, magnetic induction & energy systems',
    xp: 2980,
    grade: 'Grade 10',
    followersCount: 310,
    followingCount: 60,
    isFollowing: false,
  },
  {
    id: 'f5',
    name: 'Galileo Galilei',
    username: 'galileo_stars',
    bio: 'Observational astronomy, telescope design & planetary motion',
    xp: 2150,
    grade: 'Grade 9',
    followersCount: 195,
    followingCount: 28,
    isFollowing: false,
  },
]

export function FriendsPage() {
  const [friendQuery, setFriendQuery] = useState('')
  const [suggestedUsers, setSuggestedUsers] = useState<RealSuggestedUser[]>(FALLBACK_USERS)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('bolt-token') ?? ''
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    setIsLoading(true)
    fetch(`${apiUrl}/users/suggested${friendQuery ? `?q=${encodeURIComponent(friendQuery)}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setSuggestedUsers(result.data)
        } else if (!friendQuery) {
          setSuggestedUsers(FALLBACK_USERS)
        } else {
          // Filter fallback users if search query matches
          const filtered = FALLBACK_USERS.filter(
            (u) =>
              u.name.toLowerCase().includes(friendQuery.toLowerCase()) ||
              u.username.toLowerCase().includes(friendQuery.toLowerCase())
          )
          setSuggestedUsers(filtered)
        }
      })
      .catch(() => {
        setSuggestedUsers(FALLBACK_USERS)
      })
      .finally(() => setIsLoading(false))
  }, [friendQuery])

  async function handleToggleFollow(targetUsername: string) {
    const token = localStorage.getItem('bolt-token') ?? ''
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    try {
      const res = await fetch(`${apiUrl}/users/${targetUsername}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json()
      if (result.success) {
        setSuggestedUsers((cur) =>
          cur.map((u) => (u.username === targetUsername ? { ...u, isFollowing: result.data.isFollowing } : u))
        )
        return
      }
    } catch {
      // Local toggle fallback
    }

    setSuggestedUsers((cur) =>
      cur.map((u) => (u.username === targetUsername ? { ...u, isFollowing: !u.isFollowing } : u))
    )
  }

  return (
    <div className="friends-page">
      <header className="friends-heading">
        <p className="eyebrow">COMMUNITY & FRIENDS</p>
        <h1>Connect with Learners</h1>
        <p className="leaderboard-subtitle">Find friends, study partners, and fellow curious minds on Bolt.</p>
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
          {suggestedUsers.map((userItem) => {
            const displayName = userItem.name || userItem.username || 'Learner'
            const initials = displayName.slice(0, 2).toUpperCase()
            return (
              <article className="friend-card" key={userItem.username || userItem.id}>
                <div className="user-avatar">{initials}</div>
                <h2>{displayName}</h2>
                <p>@{userItem.username || 'user'}</p>
                <small>{userItem.grade || 'General'} • {userItem.xp ?? 0} XP</small>
                {userItem.bio && <p className="user-bio-preview">{userItem.bio}</p>}
                <button
                  type="button"
                  className={`follow-btn ${userItem.isFollowing ? 'following' : ''}`}
                  onClick={() => handleToggleFollow(userItem.username)}
                >
                  {userItem.isFollowing ? (
                    <>
                      <i className="fa-solid fa-check" style={{ marginRight: 6 }} /> Following
                    </>
                  ) : (
                    '+ Follow'
                  )}
                </button>
              </article>
            )
          })}
          {suggestedUsers.length === 0 && (
            <p className="empty-state">No users found matching "{friendQuery}".</p>
          )}
        </div>
      )}
    </div>
  )
}
