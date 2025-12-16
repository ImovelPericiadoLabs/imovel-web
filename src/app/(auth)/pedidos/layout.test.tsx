import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import PedidosLayout from './layout'

// 1. Mock do NextAuth para controlar se tem sessão ou não
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// 2. Mock do authOptions (necessário apenas para evitar erro de importação)
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}))

// 3. Mock do AppLayout
vi.mock('@/layouts/app-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}))

// 4. Mock do componente de Login
vi.mock('@/sections/login', () => ({
  Login: () => <div data-testid="login-component">Login Page</div>,
}))

describe('PedidosLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children wrapped in AppLayout when authenticated', async () => {
    // Simula usuário logado
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'Test User' } })

    const childNode = <div data-testid="test-child">Child Content</div>
    
    // Executa o Server Component como função async
    const component = await PedidosLayout({ children: childNode })
    
    render(component)

    const appLayout = screen.getByTestId('app-layout')
    const child = screen.getByTestId('test-child')

    expect(appLayout).toBeInTheDocument()
    expect(child).toBeInTheDocument()
    expect(appLayout).toContainElement(child)
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument()
  })

  it('should render Login component when not authenticated', async () => {
    // Simula usuário sem sessão (não logado)
    vi.mocked(getServerSession).mockResolvedValue(null)

    const childNode = <div data-testid="test-child">Child Content</div>

    // Executa o Server Component
    const component = await PedidosLayout({ children: childNode })

    render(component)

    expect(screen.getByTestId('login-component')).toBeInTheDocument()
    expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument()
    expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
  })
})