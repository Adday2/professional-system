import { NavLink, Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Professional System</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>

          <NavLink to="/users">
            Users
          </NavLink>
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <h1>Professional System</h1>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout