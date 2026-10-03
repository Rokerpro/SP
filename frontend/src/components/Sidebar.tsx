import { NavLink, useNavigate } from 'react-router-dom'
import { BoltLogo } from '../BoltLogo'

type SidebarProps = {
  username: string
  displayName: string
  userRole?: 'user' | 'admin'
  followersCount?: number
  followingCount?: number
  onLogout: () => void
}

export function Sidebar({
  username,
  displayName,
  userRole = 'user',
  onLogout,
}: SidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className="app-sidebar" aria-label="Main Navigation">
      <div className="sidebar-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
        <div className="bolt-logo">
          <BoltLogo />
        </div>
        <span className="brand-title">BOLT</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/home" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🔥</span>
          <span className="nav-text">Reels</span>
        </NavLink>

        <NavLink to="/discover" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🔍</span>
          <span className="nav-text">Discover</span>
        </NavLink>

        <NavLink to="/leaderboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🏆</span>
          <span className="nav-text">Leaderboard</span>
        </NavLink>

        <NavLink to="/saved" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🔖</span>
          <span className="nav-text">Saved</span>
        </NavLink>

        <NavLink to="/friends" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">👥</span>
          <span className="nav-text">Friends</span>
        </NavLink>

        {userRole === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link admin-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🛡️</span>
            <span className="nav-text">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-profile ${isActive ? 'active' : ''}`}>
          <div className="sidebar-avatar">{displayName.slice(0, 2).toUpperCase()}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-name">{displayName}</span>
            <span className="sidebar-handle">@{username}</span>
          </div>
        </NavLink>

        <button className="sidebar-logout" type="button" onClick={onLogout} title="Log Out">
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Log Out</span>
        </button>
      </div>
    </aside>
  )
}
