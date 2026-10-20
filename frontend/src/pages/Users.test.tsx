import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { User } from '../services/users'
import Users from './Users'

const {
  mockCreateUser,
  mockDeleteUser,
  mockGetUsers,
  mockUpdateUser,
  mockUpdateUserRole,
} = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockDeleteUser: vi.fn(),
  mockGetUsers: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockUpdateUserRole: vi.fn(),
}))

vi.mock('../contexts/useAuth', () => ({
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

vi.mock('../services/users', () => ({
  createUser: mockCreateUser,
  deleteUser: mockDeleteUser,
  getUsers: mockGetUsers,
  updateUser: mockUpdateUser,
  updateUserRole: mockUpdateUserRole,
}))

const testUsers: User[] = [
  {
    id: 1,
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'admin',
    created_at: '2026-01-15T10:00:00',
  },
  {
    id: 2,
    name: 'Alex Smith',
    email: 'alex@example.com',
    role: 'user',
    created_at: '2026-02-10T10:00:00',
  },
  {
    id: 3,
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    role: 'user',
    created_at: '2026-03-12T10:00:00',
  },
]

function renderUsers() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <Users />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockCreateUser.mockReset()
  mockDeleteUser.mockReset()
  mockGetUsers.mockReset()
  mockUpdateUser.mockReset()
  mockUpdateUserRole.mockReset()

  mockGetUsers.mockResolvedValue(testUsers)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Users page', () => {
  it('loads and displays users', async () => {
    renderUsers()

    expect(
      await screen.findByText('Alex Smith'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Jordan Lee'),
    ).toBeInTheDocument()

    expect(mockGetUsers).toHaveBeenCalled()
  })

  it('filters users by name or email', async () => {
    const user = userEvent.setup()

    renderUsers()

    await screen.findByText('Alex Smith')

    await user.type(
      screen.getByRole('searchbox', {
        name: /search users/i,
      }),
      'jordan',
    )

    expect(
      screen.getByText('Jordan Lee'),
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Alex Smith'),
    ).not.toBeInTheDocument()
  })

  it('creates a user and displays the result', async () => {
    const user = userEvent.setup()

    const newUser: User = {
      id: 4,
      name: 'New Test User',
      email: 'new@example.com',
      role: 'user',
      created_at: '2026-04-20T10:00:00',
    }

    mockCreateUser.mockResolvedValueOnce(newUser)

    renderUsers()

    await user.type(
      screen.getByLabelText(/^name$/i),
      'New Test User',
    )

    await user.type(
      screen.getByLabelText(/^email$/i),
      'new@example.com',
    )

    await user.type(
      screen.getByLabelText(/^password$/i),
      'SecurePass123!',
    )

    await user.click(
      screen.getByRole('button', {
        name: /create user/i,
      }),
    )

    expect(mockCreateUser.mock.calls[0][0]).toEqual({
        name: 'New Test User',
        email: 'new@example.com',
        password: 'SecurePass123!',
    })

    expect(
      await screen.findByText('User created successfully.'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('New Test User'),
    ).toBeInTheDocument()
  })

  it('changes another user role after confirmation', async () => {
    const user = userEvent.setup()

    mockUpdateUserRole.mockImplementation(
      async (id: number, data: { role: 'admin' | 'user' }) => {
        const existingUser = testUsers.find(
          (item) => item.id === id,
        )!

        return {
          ...existingUser,
          role: data.role,
        }
      },
    )

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderUsers()

    await screen.findByText('Alex Smith')

    await user.selectOptions(
      screen.getByRole('combobox', {
        name: /change role for alex smith/i,
      }),
      'admin',
    )

    expect(mockUpdateUserRole).toHaveBeenCalledWith(
      2,
      { role: 'admin' },
    )

    expect(
      await screen.findByText(
        "Alex Smith's role was changed to admin.",
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('combobox', {
        name: /change role for alex smith/i,
      }),
    ).toHaveValue('admin')
  })

  it('deletes a user after confirmation', async () => {
    const user = userEvent.setup()

    mockDeleteUser.mockResolvedValueOnce(undefined)

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderUsers()

    await screen.findByText('Alex Smith')

    const alexRow = screen
      .getByText('Alex Smith')
      .closest('tr')

    expect(alexRow).not.toBeNull()

    await user.click(
      within(alexRow!).getByRole('button', {
        name: /^delete$/i,
      }),
    )

    expect(mockDeleteUser.mock.calls[0][0]).toBe(2)

    expect(
      await screen.findByText('User deleted successfully.'),
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Alex Smith'),
    ).not.toBeInTheDocument()
  })
})