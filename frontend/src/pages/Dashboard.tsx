import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getHealth } from '../services/system'
import { getUsers } from '../services/users'

function Dashboard() {
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin'

  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
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

  const today = new Date().toDateString()

  const usersCreatedToday = users.filter(
    (currentUser) =>
      new Date(
        currentUser.created_at,
      ).toDateString() === today,
  ).length

  const latestUser =
    users.length > 0
      ? [...users].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        )[0]
      : null

  const systemLoading = healthLoading

  const systemOnline =
    !healthError && health?.status === 'ok'

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>
          Welcome back, {user?.name}.
        </p>
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
                : users.length}
            </strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-label">
              Users Created Today
            </span>

            <strong className="dashboard-card-value">
              {usersLoading
                ? '...'
                : usersCreatedToday}
            </strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-label">
              Latest User
            </span>

            <strong className="dashboard-card-value dashboard-card-text">
              {usersLoading
                ? '...'
                : latestUser
                  ? latestUser.name
                  : 'No users'}
            </strong>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-label">
              System Status
            </span>

            <strong
              className={`dashboard-card-value dashboard-status ${
                healthError
                  ? 'dashboard-status-offline'
                  : ''
              }`}
            >
              {systemLoading
                ? '● Checking...'
                : systemOnline
                  ? '● Online'
                  : '● Offline'}
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
                healthError
                  ? 'dashboard-status-offline'
                  : ''
              }`}
            >
              {systemLoading
                ? '● Checking...'
                : systemOnline
                  ? '● Online'
                  : '● Offline'}
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard