import { useEffect, useState } from 'react'
import { getUsers } from '../services/users'

function Dashboard() {
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUsers()
      .then((users) => {
        setUserCount(users.length)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to the Professional System.</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <span className="dashboard-card-label">Total Users</span>

          <strong className="dashboard-card-value">
            {loading ? '...' : userCount}
          </strong>
        </div>
      </div>
    </div>
  )
}

export default Dashboard