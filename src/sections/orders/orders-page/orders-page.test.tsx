import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

// Mock ajustado: O componente real não usa mais a prop variant como filtro principal,
// agora ele recebe classes CSS via className.
vi.mock('@/components/badge', () => ({
  default: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>{children}</span>
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
    semaphore: 'green', // Este campo agora é ignorado pelo componente
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

  it('deve renderizar a lista de consultas e aplicar variantes corretas', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [mockOrderData],
      meta: { has_next: false },
      links: {}
    } as any)

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('consulta #12345')).toBeInTheDocument()
    })

    const badge = screen.getByTestId('badge')
    // Agora verificamos se a classe de cor correta está presente (verde para APPROVED)
    expect(badge).toHaveClass('text-green-500')
  })

  it('deve exibir o estado vazio quando a API retornar lista vazia', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [],
      meta: { has_next: false },
      links: {}
    } as any)

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Nenhum consulta encontrado')).toBeInTheDocument()
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

    await waitFor(() => expect(screen.getByText('consulta #12345')).toBeInTheDocument())

    if (intersectionCallback) {
      intersectionCallback([{ isIntersecting: true }])
    }

    await waitFor(() => {
      expect(listOrders).toHaveBeenCalledWith({ limit: 10, p: 2 })
      expect(screen.getByText('consulta #67890')).toBeInTheDocument()
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
      // Verifica o fallback definido no seu componente (gray-400)
      expect(badge).toHaveClass('text-gray-400')
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

  it('deve renderizar a cor correta baseada no status REJECTED', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [{ ...mockOrderData, analysis_status: 'REJECTED' } as unknown as Order],
      meta: { has_next: false },
      links: {}
    } as any)

    const { container } = render(<OrdersPage />)
    
    await waitFor(() => {
      // Bolinha deve ser vermelha
      const dot = container.querySelector('.bg-red-500')
      expect(dot).toBeInTheDocument()
      // Card deve ter borda vermelha
      const link = container.querySelector('a')
      expect(link).toHaveClass('border-red-500')
    })
  })

  it('deve renderizar a cor azul para status IN_PROGRESS ou PENDING', async () => {
    vi.mocked(listOrders).mockResolvedValue({
      items: [{ ...mockOrderData, analysis_status: 'PENDING' } as unknown as Order],
      meta: { has_next: false },
      links: {}
    } as any)

    const { container } = render(<OrdersPage />)
    
    await waitFor(() => {
      const dot = container.querySelector('.bg-blue-500')
      expect(dot).toBeInTheDocument()
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('text-blue-500')
    })
  })
})