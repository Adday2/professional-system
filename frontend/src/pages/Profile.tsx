import { useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import {
  LockKeyhole,
  UserCircle,
} from 'lucide-react'
import {
  changePassword,
} from '../services/auth'
import { useAuth } from '../contexts/AuthContext'

interface ApiErrorResponse {
  detail?: string
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof AxiosError) {
    const responseData =
      error.response?.data as
        | ApiErrorResponse
        | undefined

    if (responseData?.detail) {
      return responseData.detail
    }
  }

  return fallback
}

function Profile() {
  const { user } = useAuth()

  const [currentPassword, setCurrentPassword] =
    useState('')
  const [newPassword, setNewPassword] =
    useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError(
        'New password and confirmation do not match.',
      )
      return
    }

    if (newPassword.length < 8) {
      setError(
        'New password must be at least 8 characters.',
      )
      return
    }

    setIsSubmitting(true)

    try {
      const response = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setSuccess(response.message)
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          'Failed to change password.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>
          Manage your account and security settings.
        </p>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-card-header">
            <UserCircle
              size={22}
              strokeWidth={2}
            />

            <h2>Account Information</h2>
          </div>

          <div className="profile-info">
            <div className="profile-info-item">
              <span>Name</span>
              <strong>{user?.name}</strong>
            </div>

            <div className="profile-info-item">
              <span>Email</span>
              <strong>{user?.email}</strong>
            </div>

            <div className="profile-info-item">
              <span>Role</span>

              <span
                className={`role-badge role-${user?.role}`}
              >
                {user?.role}
              </span>
            </div>

            <div className="profile-info-item">
              <span>Member since</span>

              <strong>
                {user
                  ? new Date(
                      user.created_at,
                    ).toLocaleDateString()
                  : '-'}
              </strong>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <LockKeyhole
              size={22}
              strokeWidth={2}
            />

            <h2>Change Password</h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="password-form"
          >
            <div className="form-group">
              <label htmlFor="current-password">
                Current Password
              </label>

              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value,
                  )
                }
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value,
                  )
                }
                minLength={8}
                autoComplete="new-password"
                required
              />

              <small>
                Minimum 8 characters.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            {success && (
              <p className="success-message">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="password-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Changing Password...'
                : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile