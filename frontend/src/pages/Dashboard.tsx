
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/useAuth'
import { getHealth } from '../services/system'
import { getUserStats } from '../services/users'

function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const {
    data: userStats,
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: ['user-stats'],
    queryFn: getUserStats,
    enabled: isAdmin,
  })

  const {
    data: health,
    isLoading: healthLoading,
    isError: healthError,
  } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
  })

  const systemOnline =
    !healthError && health?.status === 'ok'

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}.</p>
      </div>

      {isAdmin ? (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-label">
              Total Users
            </span>
            <strong className="dashboard-card-value">
              {usersLoading
                ? '...'
                : usersError
                  ? '—'
                  : userStats?.total_users ?? 0}
            </strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-label">
              Users Created Today
            </span>
            <strong className="dashboard-card-value">
              {usersLoading
                ? '...'
                : usersError
                  ? '—'
                  : userStats?.users_created_today ?? 0}
            </strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-label">
              Latest User
            </span>
            <strong className="dashboard-card-value dashboard-card-text">
              {usersLoading
                ? '...'
                : usersError
                  ? 'Unavailable'
                  : userStats?.latest_user?.name ?? 'No users'}
            </strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-label">
              System Status
            </span>
            <strong
              className={`dashboard-card-value dashboard-status ${
                healthError ? 'dashboard-status-offline' : ''
              }`}
            >
              {healthLoading
                ? 'Checking...'
                : systemOnline
                  ? 'Online'
                  : 'Offline'}
            </strong>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-label">
              Account
            </span>
            <strong className="dashboard-card-value dashboard-card-text">
              Active
            </strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-label">
              Role
            </span>
            <strong className="dashboard-card-value dashboard-card-text">
              User
            </strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-label">
              System Status
            </span>
            <strong
              className={`dashboard-card-value dashboard-status ${
                healthError ? 'dashboard-status-offline' : ''
              }`}
            >
              {healthLoading
                ? 'Checking...'
                : systemOnline
                  ? 'Online'
                  : 'Offline'}
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
