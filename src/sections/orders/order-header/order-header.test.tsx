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
    <div data-testid="traffic-light" data-red={String(red)} data-green={String(green)} data-yellow={String(yellow)} />
  ),
}))

describe('OrderHeader', () => {
  const mockOrder = {
    code: 123,
    created: '2023-01-01',
    formatted_address: 'Rua Teste, 100',
    status: { value: 'APPROVED', label: 'Aprovado' },
    signal: { label: 'red', value: 'Risco Detectado' },
    complement: 'Apto 12'
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

  it('deve renderizar os dados do consulta com sucesso e semáforo vermelho', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue(mockOrder as any)

    render(<OrderHeader />)

    await waitFor(() => {
      expect(screen.getByText('#000123')).toBeInTheDocument()
      expect(screen.getByText('formatado: 2023-01-01')).toBeInTheDocument()
      expect(screen.getByText('Rua Teste, 100')).toBeInTheDocument()
      expect(screen.getByText('Risco Detectado')).toBeInTheDocument()
    })

    const tl = screen.getByTestId('traffic-light')
    expect(tl).toHaveAttribute('data-red', 'true')
    expect(tl).toHaveAttribute('data-green', 'false')
  })

  it('deve exibir badge de fallback quando não houver signal (ex: Pendente)', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue({
      ...mockOrder,
      signal: undefined,
      status: { value: 'PENDING', label: 'Pendente' }
    } as any)

    render(<OrderHeader />)

    await waitFor(() => {
      expect(screen.getByText('Pendente')).toBeInTheDocument()
      expect(screen.queryByTestId('traffic-light')).not.toBeInTheDocument()
    })
  })

  it('deve lidar com semáforo verde e endereço não informado', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue({
      ...mockOrder,
      signal: { label: 'green', value: 'Tudo Certo' },
      formatted_address: '',
      complement: undefined
    } as any)

    render(<OrderHeader />)

    await waitFor(() => {
      expect(screen.getByText('Endereço não informado')).toBeInTheDocument()
    })

    const tl = screen.getByTestId('traffic-light')
    expect(tl).toHaveAttribute('data-green', 'true')
  })

  it('deve exibir mensagem de erro de pagamento se o status value for FAILED', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue({ 
      ...mockOrder, 
      status: { value: 'FAILED', label: 'Falhou' } 
    } as any)

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
    })
    consoleSpy.mockRestore()
  })
})