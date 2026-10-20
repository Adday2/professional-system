import { useState, type FormEvent } from 'react'
import { LockKeyhole, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch {
      setError('Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <LockKeyhole size={24} strokeWidth={2} />
          </div>

          <h1>Welcome back</h1>

          <p>
            Sign in to your Professional System account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >
          <div className="form-group">
            <label htmlFor="login-email">
              Email
            </label>

            <div className="login-input-wrapper">
              <Mail size={18} strokeWidth={2} />

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">
              Password
            </label>

            <div className="login-input-wrapper">
              <LockKeyhole
                size={18}
                strokeWidth={2}
              />

              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <p className="login-error">{error}</p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login