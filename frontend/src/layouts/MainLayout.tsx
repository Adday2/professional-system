import {
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  UserCircle,
  UsersRound,
} from 'lucide-react'
import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function MainLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Professional System</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end>
            <LayoutDashboard
              size={18}
              strokeWidth={2}
            />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/profile">
            <UserCircle
              size={18}
              strokeWidth={2}
            />
            <span>Profile</span>
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink to="/users">
              <UsersRound
                size={18}
                strokeWidth={2}
              />
              <span>Users</span>
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <h1>Professional System</h1>

          <div className="topbar-user">
            <div className="topbar-user-info">
              <CircleUserRound
                size={20}
                strokeWidth={2}
              />

              <div>
                <strong>{user?.name}</strong>
                <span>
                  {user?.email} · {user?.role}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              <LogOut
                size={17}
                strokeWidth={2}
              />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout