
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type {
  CreateUserData,
  GetUsersOptions,
  RoleUpdateData,
  UpdateUserData,
  User,
  UserPage,
} from '../services/users'
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
      created_at: '2026-01-15T10:00:00Z',
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
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'Alex Smith',
    email: 'alex@example.com',
    role: 'user',
    created_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 3,
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    role: 'user',
    created_at: '2026-03-12T10:00:00Z',
  },
]

let currentUsers: User[] = []

function makeUserPage(
  options: GetUsersOptions = {},
): UserPage {
  const skip = options.skip ?? 0
  const limit = options.limit ?? 10
  const searchTerm = options.search?.trim().toLowerCase() ?? ''

  const matchingUsers = currentUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm),
  )

  return {
    items: matchingUsers.slice(skip, skip + limit),
    total: matchingUsers.length,
    skip,
    limit,
  }
}

function renderUsers() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <Users />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  currentUsers = [...testUsers]

  mockCreateUser.mockReset()
  mockDeleteUser.mockReset()
  mockGetUsers.mockReset()
  mockUpdateUser.mockReset()
  mockUpdateUserRole.mockReset()

  mockGetUsers.mockImplementation(
    async (options: GetUsersOptions = {}) =>
      makeUserPage(options),
  )

  mockCreateUser.mockImplementation(
    async (data: CreateUserData): Promise<User> => {
      const newUser: User = {
        id: Math.max(0, ...currentUsers.map((user) => user.id)) + 1,
        name: data.name,
        email: data.email.toLowerCase(),
        role: 'user',
        created_at: '2026-04-20T10:00:00Z',
      }

      currentUsers = [...currentUsers, newUser]
      return newUser
    },
  )

  mockUpdateUser.mockImplementation(
    async (
      id: number,
      data: UpdateUserData,
    ): Promise<User> => {
      const existingUser = currentUsers.find(
        (user) => user.id === id,
      )

      if (!existingUser) {
        throw new Error('User not found')
      }

      const updatedUser = { ...existingUser, ...data }

      currentUsers = currentUsers.map((user) =>
        user.id === id ? updatedUser : user,
      )

      return updatedUser
    },
  )

  mockDeleteUser.mockImplementation(
    async (id: number): Promise<void> => {
      currentUsers = currentUsers.filter(
        (user) => user.id !== id,
      )
    },
  )

  mockUpdateUserRole.mockImplementation(
    async (
      id: number,
      data: RoleUpdateData,
    ): Promise<User> => {
      const existingUser = currentUsers.find(
        (user) => user.id === id,
      )

      if (!existingUser) {
        throw new Error('User not found')
      }

      const updatedUser = {
        ...existingUser,
        role: data.role,
      }

      currentUsers = currentUsers.map((user) =>
        user.id === id ? updatedUser : user,
      )

      return updatedUser
    },
  )
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

    expect(mockGetUsers).toHaveBeenCalledWith({
      skip: 0,
      limit: 10,
      search: '',
    })
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

    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenLastCalledWith({
        skip: 0,
        limit: 10,
        search: 'jordan',
      })

      expect(
        screen.queryByText('Alex Smith'),
      ).not.toBeInTheDocument()
    })

    expect(
      screen.getByText('Jordan Lee'),
    ).toBeInTheDocument()
  })

  it('moves between pages', async () => {
    const user = userEvent.setup()

    currentUsers = Array.from(
      { length: 12 },
      (_, index): User => {
        const id = index + 1

        return {
          id,
          name:
            id === 1
              ? 'Test Admin'
              : id === 2
                ? 'Alex Smith'
                : id === 3
                  ? 'Jordan Lee'
                  : `Pagination User ${id}`,
          email:
            id === 1
              ? 'admin@example.com'
              : `user${id}@example.com`,
          role: id === 1 ? 'admin' : 'user',
          created_at: '2026-04-20T10:00:00Z',
        }
      },
    )

    renderUsers()

    expect(
      await screen.findByText('Showing 1–10 of 12 users'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Pagination User 10'),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /next/i }),
    )

    expect(
      await screen.findByText('Pagination User 11'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Showing 11–12 of 12 users'),
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Pagination User 10'),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /previous/i }),
    )

    expect(
      await screen.findByText('Pagination User 10'),
    ).toBeInTheDocument()
  })

  it('creates a user and displays the result', async () => {
    const user = userEvent.setup()
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
      screen.getByRole('button', { name: /create user/i }),
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
      await screen.findByText('New Test User'),
    ).toBeInTheDocument()
  })

  it('changes another user role after confirmation', async () => {
    const user = userEvent.setup()
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

    await waitFor(() => {
      expect(
        screen.getByRole('combobox', {
          name: /change role for alex smith/i,
        }),
      ).toHaveValue('admin')
    })
  })

  it('deletes a user after confirmation', async () => {
    const user = userEvent.setup()
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

    await waitFor(() => {
      expect(
        screen.queryByText('Alex Smith'),
      ).not.toBeInTheDocument()
    })
  })
})
