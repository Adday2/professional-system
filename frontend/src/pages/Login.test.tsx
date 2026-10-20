import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom'
import Login from './Login'

const { mockLogin } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
}))

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={<div>Dashboard page</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockLogin.mockReset()
})

describe('Login page', () => {
  it('renders the email, password, and sign-in button', () => {
    renderLogin()

    expect(
      screen.getByRole('textbox', {
        name: /email/i,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByLabelText(/password/i),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: /sign in/i,
      }),
    ).toBeInTheDocument()
  })

  it('logs in successfully and navigates to the dashboard', async () => {
    const user = userEvent.setup()

    mockLogin.mockResolvedValueOnce(undefined)

    renderLogin()

    await user.type(
      screen.getByLabelText(/email/i),
      'admin@example.com',
    )

    await user.type(
      screen.getByLabelText(/password/i),
      'AdminPass123!',
    )

    await user.click(
      screen.getByRole('button', {
        name: /sign in/i,
      }),
    )

    expect(mockLogin).toHaveBeenCalledWith(
      'admin@example.com',
      'AdminPass123!',
    )

    expect(
      await screen.findByText('Dashboard page'),
    ).toBeInTheDocument()
  })

  it('shows an error when login fails', async () => {
    const user = userEvent.setup()

    mockLogin.mockRejectedValueOnce(
      new Error('Unauthorized'),
    )

    renderLogin()

    await user.type(
      screen.getByLabelText(/email/i),
      'admin@example.com',
    )

    await user.type(
      screen.getByLabelText(/password/i),
      'WrongPassword123!',
    )

    await user.click(
      screen.getByRole('button', {
        name: /sign in/i,
      }),
    )

    expect(
      await screen.findByText(
        'Invalid email or password.',
      ),
    ).toBeInTheDocument()
  })
})