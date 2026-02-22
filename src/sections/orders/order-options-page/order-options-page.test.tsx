import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderOptionsPage from './order-options-page'
import { useParams } from 'next/navigation'
import { getOrder } from '@/services/orders'

const mockOrder = {
  id: 'abc-123',
  status: { value: 'FINISHED', label: 'Concluído' },
  code: 1,
  formatted_address: 'Rua Teste',
  created: '',
  modified: ''
}

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}))

vi.mock('@/services/orders', () => ({
  getOrder: vi.fn(),
  orderQueryKey: (id: string) => ['order', id],
}))

vi.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Files: () => <div data-testid="icon-files" />,
  Users: () => <div data-testid="icon-users" />,
}))

vi.mock('@/sections/orders/order-header', () => ({
  default: () => <div data-testid="order-header" />,
}))

describe('OrderOptionsPage', () => {
  beforeEach(() => {
    vi.mocked(getOrder).mockResolvedValue(mockOrder as any)
  })

  it('deve renderizar o header e todos os botões de opções com os links corretos', async () => {
    const mockId = 'abc-123'
    vi.mocked(useParams).mockReturnValue({ id: mockId })

    render(<OrderOptionsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getAllByRole('link')).toHaveLength(3)
    })

    expect(screen.getByTestId('order-header')).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', `/consultas/${mockId}`)
    expect(links[1]).toHaveAttribute('href', `/consultas/${mockId}/opcoes/documentos`)
    expect(links[2]).toHaveAttribute('href', `/consultas/${mockId}/opcoes/proprietarios`)
  })

  it('deve exibir os títulos e subtítulos corretamente', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    render(<OrderOptionsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Resultado')).toBeInTheDocument()
    })
    expect(screen.getByText('Visualizar resultado completo')).toBeInTheDocument()
    expect(screen.getByText('Documentos')).toBeInTheDocument()
    expect(screen.getByText('Visualizar documentos da consulta')).toBeInTheDocument()
    expect(screen.getByText('Proprietários')).toBeInTheDocument()
    expect(screen.getByText('Visualizar proprietários da consulta')).toBeInTheDocument()
  })

  it('deve renderizar os ícones correspondentes para cada opção', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    render(<OrderOptionsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('icon-file-text')).toBeInTheDocument()
    })
    expect(screen.getByTestId('icon-files')).toBeInTheDocument()
    expect(screen.getByTestId('icon-users')).toBeInTheDocument()
    expect(screen.getAllByTestId('chevron-right')).toHaveLength(3)
  })

  it('deve aplicar as classes de hover e borda nos cartões', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    render(<OrderOptionsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Resultado')).toBeInTheDocument()
    })
    const firstCard = screen.getByText('Resultado').closest('a')
    expect(firstCard).toHaveClass('group', 'border-primary')
  })
})