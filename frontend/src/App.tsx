import { useEffect, useState } from 'react'
import { getUsers, type User } from './services/users'

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {
        setError('Failed to connect to the backend.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1>Professional System</h1>

      <h2>Users</h2>

      {loading && <p>Loading users...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name} — {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App