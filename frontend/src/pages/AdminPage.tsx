import { useState, useEffect } from 'react'
import type { HomeLesson } from '../components/ReelCard'

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

type AdminPageProps = {
  onApprovePost: (slug: string) => Promise<void>
  onRejectPost: (slug: string) => Promise<void>
}

export function AdminPage({ onApprovePost, onRejectPost }: AdminPageProps) {
  const [adminStats, setAdminStats] = useState<{
    totalUsers: number
    totalLessons: number
    pendingCount: number
    totalAttempts: number
  } | null>(null)
  const [pendingPosts, setPendingPosts] = useState<HomeLesson[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminTab, setAdminTab] = useState<'posts' | 'users'>('posts')
  const [adminResetTarget, setAdminResetTarget] = useState('')
  const [adminResetPw, setAdminResetPw] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
    const token = localStorage.getItem('bolt-token') ?? ''
    const headers = { Authorization: `Bearer ${token}` }

    setIsLoading(true)
    Promise.all([
      fetch(`${apiUrl}/admin/stats`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/admin/pending-posts`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/admin/users`, { headers }).then((res) => res.json()),
    ])
      .then(([statsRes, pendingRes, usersRes]) => {
        if (statsRes.success) setAdminStats(statsRes.data)
        if (pendingRes.success && Array.isArray(pendingRes.data)) setPendingPosts(pendingRes.data)
        if (usersRes.success && Array.isArray(usersRes.data)) setAdminUsers(usersRes.data)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <span className="eyebrow">ADMINISTRATIVE DASHBOARD</span>
        <h1>Platform Management</h1>
        <p>Review user-submitted reels, manage platform accounts, and check analytics.</p>
      </header>

      {isLoading ? (
        <div className="loading-spinner">Loading admin console...</div>
      ) : (
        <>
          {adminStats && (
            <div className="admin-stats-grid">
              <div className="stat-card">
                <h3>{adminStats.totalUsers}</h3>
                <p>Total Users</p>
              </div>
              <div className="stat-card">
                <h3>{adminStats.totalLessons}</h3>
                <p>Approved Reels</p>
              </div>
              <div className="stat-card highlight">
                <h3>{adminStats.pendingCount}</h3>
                <p>Pending Reviews</p>
              </div>
              <div className="stat-card">
                <h3>{adminStats.totalAttempts}</h3>
                <p>Quiz Attempts</p>
              </div>
            </div>
          )}

          <div className="admin-tabs">
            <button
              className={adminTab === 'posts' ? 'active' : ''}
              type="button"
              onClick={() => setAdminTab('posts')}
            >
              Content Review ({pendingPosts.length})
            </button>
            <button
              className={adminTab === 'users' ? 'active' : ''}
              type="button"
              onClick={() => setAdminTab('users')}
            >
              User Management ({adminUsers.length})
            </button>
          </div>

          {adminTab === 'posts' && (
            <div className="admin-pending-list">
              <div className="profile-section-label">Pending User Submissions ({pendingPosts.length})</div>
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
                    <button
                      className="approve-btn"
                      type="button"
                      onClick={async () => {
                        await onApprovePost(post.slug)
                        setPendingPosts((curr) => curr.filter((p) => p.slug !== post.slug))
                      }}
                    >
                      <i className="fa-solid fa-check" style={{ marginRight: 6 }} /> Approve &amp; Publish
                    </button>
                    <button
                      className="reject-btn"
                      type="button"
                      onClick={async () => {
                        await onRejectPost(post.slug)
                        setPendingPosts((curr) => curr.filter((p) => p.slug !== post.slug))
                      }}
                    >
                      <i className="fa-solid fa-xmark" style={{ marginRight: 6 }} /> Reject
                    </button>
                  </div>
                </article>
              ))}
              {pendingPosts.length === 0 && <p className="empty-state">No pending posts to review.</p>}
            </div>
          )}

          {adminTab === 'users' && (
            <div className="admin-users-list">
              <div className="profile-section-label">All Platform Users ({adminUsers.length})</div>
              {adminUsers.map((u) => (
                <div className="admin-user-row" key={u._id}>
                  <div className="admin-user-info">
                    <div className="user-avatar">
                      {((u.displayName || u.username || 'U').slice(0, 2)).toUpperCase()}
                    </div>
                    <div>
                      <strong>{u.displayName || u.username || 'User'}</strong>
                      <small>
                        @{u.username || 'user'} · {u.email} · {u.grade || 'General'} · {u.xp ?? 0} XP
                      </small>
                    </div>
                  </div>
                  <div className="admin-user-actions">
                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const newRole = u.role === 'admin' ? 'user' : 'admin'
                        const token = localStorage.getItem('bolt-token') ?? ''
                        const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
                        const res = await fetch(`${apiUrl}/admin/users/${u._id}/role`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ role: newRole }),
                        })
                        const result = await res.json()
                        if (result.success) {
                          setAdminUsers((cur) => cur.map((x) => (x._id === u._id ? { ...x, role: newRole } : x)))
                        }
                      }}
                    >
                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </button>

                    {adminResetTarget === u._id ? (
                      <form
                        className="inline-pw-form"
                        onSubmit={async (e) => {
                          e.preventDefault()
                          const token = localStorage.getItem('bolt-token') ?? ''
                          const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
                          const res = await fetch(`${apiUrl}/admin/users/${u._id}/password`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ newPassword: adminResetPw }),
                          })
                          const result = await res.json()
                          if (result.success) {
                            setAdminResetTarget('')
                            setAdminResetPw('')
                          }
                        }}
                      >
                        <input
                          type="password"
                          placeholder="New password"
                          value={adminResetPw}
                          onChange={(e) => setAdminResetPw(e.target.value)}
                          minLength={8}
                          required
                        />
                        <button type="submit">Set</button>
                        <button type="button" onClick={() => setAdminResetTarget('')}>
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button type="button" onClick={() => setAdminResetTarget(u._id)}>
                        Reset Password
                      </button>
                    )}

                    <button
                      className="reject-btn"
                      type="button"
                      onClick={async () => {
                        const token = localStorage.getItem('bolt-token') ?? ''
                        const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
                        const res = await fetch(`${apiUrl}/admin/users/${u._id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` },
                        })
                        const result = await res.json()
                        if (result.success) {
                          setAdminUsers((cur) => cur.filter((x) => x._id !== u._id))
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
