import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import OrderHeader from './order-header'
import { useParams } from 'next/navigation'
import { getOrder } from '@/services/orders'

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}))

vi.mock('@/services/orders', () => ({
  getOrder: vi.fn(),
}))

vi.mock('@/utils/date', () => ({
  formatDateWithTime: vi.fn((date) => `formatado: ${date}`),
}))

vi.mock('lucide-react', () => ({
  MapPin: () => <div data-testid="map-pin-icon" />,
}))

vi.mock('@/components/traffic-light', () => ({
  default: ({ red, green, yellow }: any) => (
    <div data-testid="traffic-light" data-red={red} data-green={green} data-yellow={yellow} />
  ),
}))

describe('OrderHeader', () => {
  const mockOrder = {
    code: 123,
    created: '2023-01-01',
    formatted_address: 'Rua Teste, 100',
    semaphore: 'red',
    complement: 'Apto 12',
    payment_status: 'SUCCESS'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve exibir o estado de loading inicialmente', () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockReturnValue(new Promise(() => {}))

    const { container } = render(<OrderHeader />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('deve renderizar os dados do pedido com sucesso e semáforo vermelho', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue(mockOrder as any)

    render(<OrderHeader />)

    await waitFor(() => {
      expect(screen.getByText('#000123')).toBeInTheDocument()
      expect(screen.getByText('formatado: 2023-01-01')).toBeInTheDocument()
      expect(screen.getByText('Rua Teste, 100')).toBeInTheDocument()
      expect(screen.getByText('Apto 12')).toBeInTheDocument()
    })

    const tl = screen.getByTestId('traffic-light')
    expect(tl).toHaveAttribute('data-red', 'true')
    expect(tl).toHaveAttribute('data-green', 'false')
  })

  it('deve lidar com semáforo verde e endereço não informado', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue({
      ...mockOrder,
      semaphore: 'green',
      formatted_address: '',
      complement: undefined
    } as any)

    render(<OrderHeader />)

    await waitFor(() => {
      expect(screen.getByText('Endereço não informado')).toBeInTheDocument()
      expect(screen.queryByText('Apto 12')).not.toBeInTheDocument()
    })

    const tl = screen.getByTestId('traffic-light')
    expect(tl).toHaveAttribute('data-green', 'true')
    expect(tl).toHaveAttribute('data-red', 'false')
  })

  it('deve lidar com semáforo amarelo', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue({ ...mockOrder, semaphore: 'yellow' } as any)

    render(<OrderHeader />)

    await waitFor(() => {
      const tl = screen.getByTestId('traffic-light')
      expect(tl).toHaveAttribute('data-yellow', 'true')
    })
  })

  it('deve renderizar o Badge opcional quando fornecido', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue(mockOrder as any)

    render(<OrderHeader Badge={<div data-testid="custom-badge">Badge Teste</div>} />)

    await waitFor(() => {
      expect(screen.getByTestId('custom-badge')).toBeInTheDocument()
    })
  })

  it('deve exibir mensagem de erro de pagamento se o status for FAILED', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue({ ...mockOrder, payment_status: 'FAILED' } as any)

    render(<OrderHeader />)

    await waitFor(() => {
      expect(screen.getByText('Pagamento Falhou')).toBeInTheDocument()
    })
  })

  it('deve lidar com erro na chamada da API', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockRejectedValue(new Error('Erro API'))

    render(<OrderHeader />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao carregar cabeçalho:', expect.any(Error))
      expect(screen.queryByText('.animate-pulse')).not.toBeInTheDocument()
    })
    consoleSpy.mockRestore()
  })

  it('deve retornar precocemente se não houver ID', () => {
    vi.mocked(useParams).mockReturnValue({ id: undefined })
    render(<OrderHeader />)
    expect(getOrder).not.toHaveBeenCalled()
  })
})