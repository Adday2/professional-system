import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import Profile from './Profile'

const { mockChangePassword } = vi.hoisted(() => ({
  mockChangePassword: vi.fn(),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Test Admin',
      email: 'admin@example.com',
      role: 'admin',
      created_at: '2026-01-15T10:00:00',
    },
  }),
}))

vi.mock('../services/auth', () => ({
  changePassword: mockChangePassword,
}))

beforeEach(() => {
  mockChangePassword.mockReset()
})

describe('Profile page', () => {
  it('displays the account information', () => {
    render(<Profile />)

    expect(
      screen.getByText('Test Admin'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('admin@example.com'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('admin', {
        selector: '.role-badge',
      }),
    ).toBeInTheDocument()
  })

  it('rejects mismatched passwords without calling the API', async () => {
    const user = userEvent.setup()

    render(<Profile />)

    await user.type(
      screen.getByLabelText(/current password/i),
      'CurrentPass123!',
    )

    await user.type(
      screen.getByLabelText(/^new password$/i),
      'NewPassword123!',
    )

    await user.type(
      screen.getByLabelText(/confirm new password/i),
      'DifferentPass123!',
    )

    await user.click(
      screen.getByRole('button', {
        name: /change password/i,
      }),
    )

    expect(
      await screen.findByText(
        'New password and confirmation do not match.',
      ),
    ).toBeInTheDocument()

    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  it('changes the password and displays the success message', async () => {
    const user = userEvent.setup()

    mockChangePassword.mockResolvedValueOnce({
      message: 'Password changed successfully.',
    })

    render(<Profile />)

    await user.type(
      screen.getByLabelText(/current password/i),
      'CurrentPass123!',
    )

    await user.type(
      screen.getByLabelText(/^new password$/i),
      'NewPassword123!',
    )

    await user.type(
      screen.getByLabelText(/confirm new password/i),
      'NewPassword123!',
    )

    await user.click(
      screen.getByRole('button', {
        name: /change password/i,
      }),
    )

    expect(mockChangePassword).toHaveBeenCalledWith({
      current_password: 'CurrentPass123!',
      new_password: 'NewPassword123!',
    })

    expect(
      await screen.findByText(
        'Password changed successfully.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByLabelText(/current password/i),
    ).toHaveValue('')
  })
})