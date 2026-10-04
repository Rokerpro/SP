import { useState, type FormEvent } from 'react'
import type { HomeLesson } from '../components/ReelCard'

type ProfilePageProps = {
  username: string
  displayName: string
  userRole?: 'user' | 'admin'
  userFollowersCount?: number
  userFollowingCount?: number
  interests: string[]
  userPosts: HomeLesson[]
  onOpenCreateModal: () => void
}

export function ProfilePage({
  username,
  displayName,
  userRole = 'user',
  userFollowersCount = 0,
  userFollowingCount = 0,
  interests,
  userPosts,
  onOpenCreateModal,
}: ProfilePageProps) {
  const [profileImage, setProfileImage] = useState('')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [isChangingPw, setIsChangingPw] = useState(false)

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setProfileImage(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPwMsg('')
    setIsChangingPw(true)
    try {
      const token = localStorage.getItem('bolt-token') ?? ''
      const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
      const res = await fetch(`${apiUrl}/users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      })
      const result = await res.json()
      if (result.success) {
        setPwMsg('✓ Password updated successfully!')
        setOldPw('')
        setNewPw('')
      } else {
        setPwMsg(result.error || 'Failed to update password')
      }
    } catch (err) {
      setPwMsg('Error updating password')
    } finally {
      setIsChangingPw(false)
    }
  }

  const interestSummary = interests.length ? `Passionate about ${interests.slice(0, 3).join(', ')}` : 'Curious learner on Bolt'

  return (
    <div className="profile-page-container">
      <div className="profile-hero">
        <label className="profile-avatar-picker" aria-label="Change profile picture">
          <input type="file" accept="image/*" onChange={handleProfileImageChange} />
          {profileImage ? (
            <img src={profileImage} alt="Profile" />
          ) : (
            <span>{displayName.slice(0, 2).toUpperCase()}</span>
          )}
          <i className="fa-solid fa-pen" aria-hidden="true" />
        </label>
        <div className="profile-summary">
          <h1>
            {displayName} {userRole === 'admin' && <span className="admin-badge">Admin</span>}
          </h1>
          <p className="profile-handle">@{username}</p>
          <p className="profile-bio">{interestSummary}</p>
          <div className="profile-stats-row">
            <div>
              <strong>{userPosts.length}</strong>
              <span>Volts</span>
            </div>
            <div>
              <strong>{userFollowersCount}</strong>
              <span>Followers</span>
            </div>
            <div>
              <strong>{userFollowingCount}</strong>
              <span>Following</span>
            </div>
          </div>
        </div>
      </div>

      <button className="create-reel-btn" type="button" onClick={onOpenCreateModal}>
        + Create New Educational Volt
      </button>

      <div className="profile-section-label">Your Created Volts ({userPosts.length})</div>
      <div className="user-posts-list">
        {userPosts.map((post) => (
          <article className="user-post-card" key={post.slug}>
            <div className="post-header">
              <span className="post-category">{post.category}</span>
              <span className={`status-badge ${post.status ?? 'approved'}`}>
                {post.status === 'pending' ? (
                  <>
                    <i className="fa-solid fa-hourglass-half" style={{ marginRight: 4 }} /> Under Review
                  </>
                ) : post.status === 'rejected' ? (
                  <>
                    <i className="fa-solid fa-circle-xmark" style={{ marginRight: 4 }} /> Rejected
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check" style={{ marginRight: 4 }} /> Published
                  </>
                )}
              </span>
            </div>
            <h3>{post.title}</h3>
            <p>{post.explanation}</p>
          </article>
        ))}
        {userPosts.length === 0 && (
          <p className="empty-state">No reels created yet. Click above to post your first reel!</p>
        )}
      </div>

      <div className="profile-section-label">Change Password</div>
      <form className="change-pw-form" onSubmit={handleChangePassword}>
        <input
          className="standalone-input"
          type="password"
          placeholder="Current password"
          value={oldPw}
          onChange={(e) => setOldPw(e.target.value)}
          required
        />
        <input
          className="standalone-input"
          type="password"
          placeholder="New password (min 8 chars)"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          minLength={8}
          required
        />
        <button className="submit-button" type="submit" disabled={isChangingPw}>
          {isChangingPw ? 'Updating...' : 'Update Password'}
        </button>
        {pwMsg && <p className="pw-msg">{pwMsg}</p>}
      </form>
    </div>
  )
}
