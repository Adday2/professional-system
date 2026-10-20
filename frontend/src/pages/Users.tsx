
import { useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import {
  Search,
  UserRoundX,
} from 'lucide-react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useAuth } from '../contexts/useAuth'
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  updateUserRole,
  type User,
} from '../services/users'

const PAGE_SIZE = 10

interface ApiErrorResponse {
  detail?: string
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof AxiosError) {
    const responseData =
      error.response?.data as ApiErrorResponse | undefined

    if (responseData?.detail) {
      return responseData.detail
    }
  }

  return fallback
}

function Users() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [editingId, setEditingId] =
    useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    data: userPage,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () =>
      getUsers({
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        search,
      }),
  })

  const users = userPage?.items ?? []
  const totalUsers = userPage?.total ?? 0
  const totalPages = Math.max(
    1,
    Math.ceil(totalUsers / PAGE_SIZE),
  )

  const createMutation = useMutation({
    mutationFn: createUser,

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['users'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['user-stats'],
      })

      setPage(1)
      setSearch('')
      setName('')
      setEmail('')
      setPassword('')
      setError('')
      setSuccess('User created successfully.')
    },

    onError: (error) => {
      setError(
        getApiErrorMessage(error, 'Failed to create user.'),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: {
        name: string
        email: string
      }
    }) => updateUser(id, data),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['users'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['user-stats'],
      })

      setName('')
      setEmail('')
      setPassword('')
      setEditingId(null)
      setError('')
      setSuccess('User updated successfully.')
    },

    onError: (error) => {
      setError(
        getApiErrorMessage(error, 'Failed to update user.'),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,

    onSuccess: (_, deletedId) => {
      void queryClient.invalidateQueries({
        queryKey: ['users'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['user-stats'],
      })

      if (users.length === 1 && page > 1) {
        setPage((currentPage) =>
          Math.max(1, currentPage - 1),
        )
      }

      if (editingId === deletedId) {
        setEditingId(null)
        setName('')
        setEmail('')
        setPassword('')
      }

      setError('')
      setSuccess('User deleted successfully.')
    },

    onError: (error) => {
      setError(
        getApiErrorMessage(error, 'Failed to delete user.'),
      )
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: number
      role: 'admin' | 'user'
    }) => updateUserRole(id, { role }),

    onSuccess: (updatedUser) => {
      void queryClient.invalidateQueries({
        queryKey: ['users'],
      })

      setError('')
      setSuccess(
        `${updatedUser.name}'s role was changed to ${updatedUser.role}.`,
      )
    },

    onError: (error) => {
      setError(
        getApiErrorMessage(
          error,
          'Failed to update user role.',
        ),
      )
    },
  })

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        data: { name, email },
      })
      return
    }

    createMutation.mutate({
      name,
      email,
      password,
    })
  }

  function handleEdit(user: User) {
    setError('')
    setSuccess('')
    setEditingId(user.id)
    setName(user.name)
    setEmail(user.email)
    setPassword('')
  }

  function handleCancelEdit() {
    setEditingId(null)
    setName('')
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
  }

  function handleDelete(user: User) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`,
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')
    deleteMutation.mutate(user.id)
  }

  function handleRoleChange(
    user: User,
    role: 'admin' | 'user',
  ) {
    if (user.id === currentUser?.id || role === user.role) {
      return
    }

    const confirmed = window.confirm(
      `Change ${user.name}'s role to ${role}?`,
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')
    roleMutation.mutate({ id: user.id, role })
  }

  const formBusy =
    createMutation.isPending ||
    updateMutation.isPending

  const tableBusy =
    deleteMutation.isPending ||
    roleMutation.isPending

  const firstDisplayedUser =
    totalUsers === 0 ? 0 : (page - 1) * PAGE_SIZE + 1

  const lastDisplayedUser = Math.min(
    page * PAGE_SIZE,
    totalUsers,
  )

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Users</h1>
        <p>Manage users, accounts, and permissions.</p>
      </div>

      <div className="create-user-card">
        <h2>
          {editingId !== null ? 'Edit User' : 'Add User'}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="create-user-form"
        >
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter user name"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          {editingId === null && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={formBusy}>
              {updateMutation.isPending
                ? 'Updating...'
                : createMutation.isPending
                  ? 'Creating...'
                  : editingId !== null
                    ? 'Update User'
                    : 'Create User'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancelEdit}
                disabled={formBusy}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {success && (
          <p className="success-message">{success}</p>
        )}

        {error && (
          <p className="error-message">{error}</p>
        )}
      </div>

      <div className="users-toolbar">
        <div className="users-search">
          <Search size={18} strokeWidth={2} />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search by name or email..."
            aria-label="Search users"
            maxLength={100}
          />
        </div>

        {!isLoading && !isError && (
          <span className="users-count">
            Showing {firstDisplayedUser}–{lastDisplayedUser}{' '}
            of {totalUsers} users
          </span>
        )}
      </div>

      <div className="users-table-container">
        {isLoading ? (
          <p className="users-loading">Loading users...</p>
        ) : isError ? (
          <p className="error-message">
            Failed to load users.
          </p>
        ) : users.length === 0 ? (
          <div className="users-empty-state">
            <UserRoundX size={40} strokeWidth={1.7} />
            <h3>
              {search.trim() ? 'No users found' : 'No users yet'}
            </h3>
            <p>
              {search.trim()
                ? 'Try a different name or email search.'
                : 'Create your first user using the form above.'}
            </p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const isCurrentUser =
                  user.id === currentUser?.id

                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td className="user-name">{user.name}</td>
                    <td>{user.email}</td>

                    <td>
                      {isCurrentUser ? (
                        <span
                          className={`role-badge role-${user.role}`}
                        >
                          {user.role}
                        </span>
                      ) : (
                        <select
                          className="role-select"
                          value={user.role}
                          onChange={(event) =>
                            handleRoleChange(
                              user,
                              event.target.value as 'admin' | 'user',
                            )
                          }
                          disabled={tableBusy}
                          aria-label={`Change role for ${user.name}`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>

                    <td>
                      {new Date(
                        user.created_at,
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEdit(user)}
                          disabled={tableBusy}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDelete(user)}
                          disabled={tableBusy}
                        >
                          {deleteMutation.isPending
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !isError && totalPages > 1 && (
        <div className="users-pagination">
          <button
            type="button"
            onClick={() =>
              setPage((currentPage) =>
                Math.max(1, currentPage - 1),
              )
            }
            disabled={page <= 1}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() =>
              setPage((currentPage) =>
                Math.min(totalPages, currentPage + 1),
              )
            }
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Users
