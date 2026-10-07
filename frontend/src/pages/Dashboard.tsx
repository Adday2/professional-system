import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../services/system'
import { getUsers } from '../services/users'

function Dashboard() {
  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
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
    (user) => new Date(user.created_at).toDateString() === today,
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
        <p>Welcome to the Professional System.</p>
      </div>

      {usersError && (
        <p className="error-message">
          Failed to load user data.
        </p>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <span className="dashboard-card-label">
            Total Users
          </span>

          <strong className="dashboard-card-value">
            {usersLoading ? '...' : users.length}
          </strong>
        </div>

        <div className="dashboard-card">
          <span className="dashboard-card-label">
            Users Created Today
          </span>

          <strong className="dashboard-card-value">
            {usersLoading ? '...' : usersCreatedToday}
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
              healthError ? 'dashboard-status-offline' : ''
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
    </div>
  )
}

export default Dashboard