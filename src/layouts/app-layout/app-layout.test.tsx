import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppLayout from './app-layout'

const mocks = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockSignOut: vi.fn(),
  mockRequestAccountDeletion: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.mockPush,
    back: mocks.mockBack,
  }),
}))

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next-auth/react', () => ({
  signOut: mocks.mockSignOut,
  useSession: () => ({
    status: 'authenticated',
    data: {
      user: { email: 'lucas@imovelpericiado.com' },
      accessToken: 'access-token',
    },
  }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      email: 'lucas@imovelpericiado.com',
      credits_balance: 177,
    },
  }),
  useMutation: (options: any) => ({
    isPending: false,
    mutateAsync: async (variables: any) => {
      const response = await options.mutationFn(variables)
      await options.onSuccess?.(response, variables, undefined)
      return response
    },
  }),
}))

vi.mock('@/hooks/use-is-router-match', () => ({
  default: () => ({
    isMatch: () => false,
    pathname: '/consultas',
  }),
}))

vi.mock('@/services/account', () => ({
  getMe: vi.fn(),
  requestAccountDeletion: mocks.mockRequestAccountDeletion,
}))

vi.mock('@/components/modal', () => ({
  default: ({ open, title, content }: any) =>
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {content}
      </div>
    ) : null,
}))

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockRequestAccountDeletion.mockResolvedValue({ detail: 'Conta desativada com sucesso.' })
  })

  it('abre a exclusão oculta e confirma a desativação', async () => {
    render(
      <AppLayout>
        <div>Conteúdo</div>
      </AppLayout>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Abrir configurações' }))

    const hiddenAccountArea = await screen.findByRole('button', { name: 'Informações da conta' })
    fireEvent.doubleClick(hiddenAccountArea)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Desativar conta' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Digite seu e-mail para confirmar'), {
      target: { value: 'lucas@imovelpericiado.com' },
    })

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /entendo que esta ação desativa minha conta/i,
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Desativar conta' }))

    await waitFor(() => {
      expect(mocks.mockRequestAccountDeletion).toHaveBeenCalledWith({
        email: 'lucas@imovelpericiado.com',
        reason: '',
      })
    })

    await waitFor(() => {
      expect(mocks.mockSignOut).toHaveBeenCalledWith({
        redirect: true,
        callbackUrl: '/consultar-imovel?inicio=1',
      })
    }, { timeout: 2500 })
  })
})

