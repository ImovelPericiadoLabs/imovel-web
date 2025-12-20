import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import OrdersPage from './orders-page' 
import { listOrders } from '@/services/orders'
import type { Order } from '@/services/orders'

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
  default: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

vi.mock('@/components/text-title', () => ({
  default: ({ children }: any) => <h1>{children}</h1>,
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
    code: '12345',
    formatted_address: 'Rua das Flores, 100',
    modified: '2023-10-10T15:30:00Z',
    semaphore: 'green',
    analysis_status: 'APPROVED',
    analysis: [1, 2, 3],
  } as unknown as Order 

  beforeEach(() => {
    vi.clearAllMocks()
    intersectionCallback = null
  })

  it('deve exibir o loading global no primeiro carregamento', () => {
    vi.mocked(listOrders).mockReturnValue(new Promise(() => {}))
    render(<OrdersPage />)
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
  })

  it('deve renderizar a lista de pedidos e aplicar variantes corretas', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [mockOrderData],
      meta: { has_next: false },
      links: {}
    } as any)

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Pedido #12345')).toBeInTheDocument()
      expect(screen.getByText('Rua das Flores, 100')).toBeInTheDocument()
    })

    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('data-variant', 'success')
  })

  it('deve exibir o estado vazio quando a API retornar lista vazia', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [],
      meta: { has_next: false },
      links: {}
    } as any)

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument()
    })
  })

  it('deve carregar mais itens ao acionar o scroll infinito', async () => {
    vi.mocked(listOrders).mockResolvedValueOnce({
      items: [mockOrderData],
      meta: { has_next: true },
      links: {}
    } as any)

    vi.mocked(listOrders).mockResolvedValueOnce({
      items: [{ ...mockOrderData, id: 'order-2', code: '67890' } as unknown as Order],
      meta: { has_next: false },
      links: {}
    } as any)

    render(<OrdersPage />)

    await waitFor(() => expect(screen.getByText('Pedido #12345')).toBeInTheDocument())

    if (intersectionCallback) {
      intersectionCallback([{ isIntersecting: true }])
    }

    await waitFor(() => {
      expect(listOrders).toHaveBeenCalledWith({ limit: 10, p: 2 })
      expect(screen.getByText('Pedido #67890')).toBeInTheDocument()
    })
  })

  it('deve lidar com erros de API e logar no console', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(listOrders).mockRejectedValue(new Error('Erro de API'))

    render(<OrdersPage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })
    consoleSpy.mockRestore()
  })

  it('deve renderizar status padrão neutral para status desconhecido', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [{ ...mockOrderData, analysis_status: 'STATUS_INVALIDO' } as unknown as Order],
      meta: { has_next: false },
      links: {}
    } as any)

    render(<OrdersPage />)

    await waitFor(() => {
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'neutral')
    })
  })

  it('deve mostrar texto de fallback quando o endereço for nulo ou vazio', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [{ ...mockOrderData, formatted_address: '' } as unknown as Order],
      meta: { has_next: false },
      links: {}
    } as any)

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Endereço não informado')).toBeInTheDocument()
    })
  })

  it('deve renderizar a cor correta do semáforo (red)', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [{ ...mockOrderData, semaphore: 'red' } as unknown as Order],
      meta: { has_next: false },
      links: {}
    } as any)

    const { container } = render(<OrdersPage />)
    
    await waitFor(() => {
      const semaphore = container.querySelector('.bg-red-500')
      expect(semaphore).toBeInTheDocument()
    })
  })

  it('deve renderizar cores do semáforo (yellow)', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [{ ...mockOrderData, semaphore: 'yellow' } as unknown as Order],
      meta: { has_next: false },
      links: {}
    } as any)

    const { container } = render(<OrdersPage />)
    
    await waitFor(() => {
      const semaphore = container.querySelector('.bg-yellow-500')
      expect(semaphore).toBeInTheDocument()
    })
  })
})