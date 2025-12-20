import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import consultasLayout from './layout'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}))

vi.mock('@/layouts/app-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}))

vi.mock('@/sections/login', () => ({
  Login: () => <div data-testid="login-component">Login Page</div>,
}))

describe('consultasLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children wrapped in AppLayout when authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'Test User' } })

    const childNode = <div data-testid="test-child">Child Content</div>
    
    const component = await consultasLayout({ children: childNode })
    
    render(component)

    const appLayout = screen.getByTestId('app-layout')
    const child = screen.getByTestId('test-child')

    expect(appLayout).toBeInTheDocument()
    expect(child).toBeInTheDocument()
    expect(appLayout).toContainElement(child)
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument()
  })

  it('should render Login component when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const childNode = <div data-testid="test-child">Child Content</div>

    const component = await consultasLayout({ children: childNode })

    render(component)

    expect(screen.getByTestId('login-component')).toBeInTheDocument()
    expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument()
    expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
  })
})