import { useEffect, useState } from 'react'
import { getUsers, type User } from '../services/users'

function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {
        setError('Failed to load users.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1>Users</h1>

      {loading && <p>Loading users...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Users