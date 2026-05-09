'use client'

import { type ReactElement } from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrdersPage from './orders-page'
import { listOrders } from '@/services/orders'
import type { Order } from '@/services/orders'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function renderWithProviders(ui: ReactElement) {
  const client = createTestQueryClient()
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
}

vi.mock('@/services/orders', () => ({
  listOrders: vi.fn(),
}))

vi.mock('@/utils/date', () => ({
  formatDateWithTime: vi.fn(() => '10/10/2023 15:30'),
}))

vi.mock('@/utils/tailwind', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/components/loading-overlay', () => ({
  default: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div data-testid="loading-overlay">Carregando...</div> : null,
}))

vi.mock('@/components/badge', () => ({
  default: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}))

vi.mock('@/components/text-title', () => ({
  default: ({ children }: any) => <h1>{children}</h1>,
}))

vi.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right" />,
  Inbox: () => <div data-testid="inbox-icon" />,
  /** Usado por ``Button`` no CTA "Consultar Imóvel" (estado vazio). */
  Search: () => <div data-testid="search-icon" />,
}))

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
let intersectionCallback: any = null

class MockIntersectionObserver {
  constructor(callback: any) {
    intersectionCallback = callback
  }
  observe = mockObserve
  unobserve = vi.fn()
  disconnect = mockDisconnect
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

describe('OrdersPage', () => {
  const mockOrderData = {
    id: 'order-1',
    code: 12345,
    formatted_address: 'Rua das Flores, 100',
    modified: '2023-10-10T15:30:00Z',
    status: { value: 'APPROVED', label: 'Aprovado' },
    semaphore: 'green', 
    analysis: [1, 2, 3],
  } as unknown as Order

  beforeEach(() => {
    vi.clearAllMocks()
    intersectionCallback = null
  })

  it('deve exibir o loading global no primeiro carregamento', () => {
    vi.mocked(listOrders).mockReturnValue(new Promise(() => {}))
    renderWithProviders(<OrdersPage />)
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
  })

  it('deve renderizar a lista de consultas e aplicar as cores e labels do semaphore', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [mockOrderData],
      meta: { has_next: false, page: 1 },
    } as any)

    renderWithProviders(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText(/Consulta #12345/i)).toBeInTheDocument()
    })

    const badge = screen.getByTestId('badge')
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
    expect(badge).toHaveClass('border-green-500 text-green-600')
  })

  it('deve priorizar o semaphore sobre o status para estilização', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [{
        ...mockOrderData,
        status: { value: 'REJECTED', label: 'Reprovado' },
        semaphore: 'yellow' 
      }],
      meta: { has_next: false, page: 1 },
    } as any)

    const { container } = renderWithProviders(<OrdersPage />)

    await waitFor(() => {
      const dot = container.querySelector('.bg-primary')
      expect(dot).toBeInTheDocument()
      expect(screen.getByText('Reprovado')).toBeInTheDocument()
    })
  })

  it('deve aplicar cor azul e label de solicitado para status PENDING sem semaphore', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [{
        ...mockOrderData,
        status: { value: 'PENDING', label: 'Pendente' },
        semaphore: null
      }],
      meta: { has_next: false, page: 1 },
    } as any)

    const { container } = renderWithProviders(<OrdersPage />)

    await waitFor(() => {
      const dot = container.querySelector('.bg-primary')
      expect(dot).toBeInTheDocument()
      expect(screen.getByText('Pendente')).toBeInTheDocument()
    })
  })

  it('deve exibir Em processamento quando PENDING com pagamento confirmado', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [
        {
          ...mockOrderData,
          status: { value: 'PENDING', label: 'Pendente' },
          payment_status: { value: 'CONFIRMED', label: 'Confirmado' },
          semaphore: null,
        },
      ],
      meta: { has_next: false, page: 1 },
    } as any)

    const { container } = renderWithProviders(<OrdersPage />)

    await waitFor(() => {
      const dot = container.querySelector('.bg-primary')
      expect(dot).toBeInTheDocument()
      expect(screen.getByText('Em processamento')).toBeInTheDocument()
    })
    expect(screen.queryByText('Pendente')).not.toBeInTheDocument()
  })

  it('deve exibir o estado vazio corretamente', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [],
      meta: { has_next: false, page: 1 },
    } as any)

    renderWithProviders(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma consulta encontrada/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /consultar imóvel/i })).toHaveAttribute('href', '/consultar-imovel?inicio=1')
    })
  })

  it('deve carregar mais itens ao acionar o scroll infinito', async () => {
    vi.mocked(listOrders).mockResolvedValueOnce({
      items: [mockOrderData],
      meta: { has_next: true, page: 1 },
    } as any)

    vi.mocked(listOrders).mockResolvedValueOnce({
      items: [{ ...mockOrderData, id: 'order-2', code: 67890 }],
      meta: { has_next: false, page: 2 },
    } as any)

    renderWithProviders(<OrdersPage />)

    await waitFor(() => expect(screen.getByText(/Consulta #12345/i)).toBeInTheDocument())

    if (intersectionCallback) {
      await act(async () => {
        intersectionCallback([{ isIntersecting: true }])
      })
    }

    await waitFor(() => {
      expect(listOrders).toHaveBeenCalledWith({ limit: 10, p: 2 })
      expect(screen.getByText(/Consulta #67890/i)).toBeInTheDocument()
    })
  })
})