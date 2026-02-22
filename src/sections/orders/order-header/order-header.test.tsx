'use client'

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderHeader from './order-header'
import { useParams } from 'next/navigation'
import { getOrder } from '@/services/orders'

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}))

vi.mock('@/services/orders', () => ({
  getOrder: vi.fn(),
  orderQueryKey: (id: string) => ['order', id],
}))

vi.mock('@/utils/date', () => ({
  formatDateWithTime: vi.fn((date) => `formatado: ${date}`),
}))

vi.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="map-pin-icon" />,
}))

vi.mock('@/components/traffic-light', () => ({
  default: ({ red, green, yellow }: any) => (
    <div data-testid="traffic-light" data-red={String(red)} data-green={String(green)} data-yellow={String(yellow)} />
  ),
}))

// Mock do componente Badge para garantir que renderiza o que passamos
vi.mock('@/components/badge', () => ({
  default: ({ children, variant }: any) => (
    <div data-testid="badge" data-variant={variant}>{children}</div>
  ),
}))

describe('OrderHeader', () => {
  const mockOrder = {
    code: 123,
    created: '2023-01-01',
    formatted_address: 'Rua Teste, 100',
    status: { value: 'FINISHED', label: 'Concluído' }, // Status alterado para FINISHED para mostrar semáforo
    semaphore: 'red', // Usando semaphore como no seu código
    complement: 'Apto 12'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve exibir o estado de loading inicialmente', () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockReturnValue(new Promise(() => {}))

    const { container } = render(<OrderHeader />, { wrapper })
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('deve renderizar os dados da consulta com sucesso e semáforo vermelho', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue(mockOrder as any)

    render(<OrderHeader />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('#000123')).toBeInTheDocument()
      expect(screen.getByText('formatado: 2023-01-01')).toBeInTheDocument()
      expect(screen.getByText('Rua Teste, 100')).toBeInTheDocument()
      // O seu código renderiza "Sinal Vermelho" quando semaphore é red e status é FINISHED
      expect(screen.getByText('Sinal Vermelho')).toBeInTheDocument()
    })

    const tl = screen.getByTestId('traffic-light')
    expect(tl).toHaveAttribute('data-red', 'true')
    expect(tl).toHaveAttribute('data-green', 'false')
  })

  it('deve exibir badge de fallback quando não for FINISHED (ex: APPROVED)', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue({
      ...mockOrder,
      status: { value: 'APPROVED', label: 'Aprovado' },
      semaphore: 'red'
    } as any)

    render(<OrderHeader />, { wrapper })

    await waitFor(() => {
      // Status desconhecido (APPROVED não está em OrderStatus) usa fallback "—"
      expect(screen.getByText('—')).toBeInTheDocument()
      // E não deve mostrar o semáforo
      expect(screen.queryByTestId('traffic-light')).not.toBeInTheDocument()
    })
  })

  it('deve lidar com semáforo verde e endereço não informado', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue({
      ...mockOrder,
      status: { value: 'FINISHED', label: 'Concluído' },
      semaphore: 'green',
      formatted_address: '',
      complement: undefined
    } as any)

    render(<OrderHeader />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Endereço não informado')).toBeInTheDocument()
      expect(screen.getByText('Sinal Verde')).toBeInTheDocument()
    })

    const tl = screen.getByTestId('traffic-light')
    expect(tl).toHaveAttribute('data-green', 'true')
  })

  it('deve exibir mensagem de erro de pagamento se o status value for FAILED', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue({
      ...mockOrder,
      status: { value: 'FAILED', label: 'Falhou' },
      semaphore: undefined
    } as any)

    render(<OrderHeader />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Pagamento falhou')).toBeInTheDocument()
    })
  })

  it('deve lidar com erro na chamada da API', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockRejectedValue(new Error('Erro API'))

    render(<OrderHeader />, { wrapper })

    await waitFor(() => {
      expect(getOrder).toHaveBeenCalledWith('1')
    })
    // Com useQuery, em erro data fica undefined e o componente retorna null
    expect(screen.queryByText('#000123')).not.toBeInTheDocument()
  })
})