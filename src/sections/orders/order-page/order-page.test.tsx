import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderPage from './order-page'
import { useParams } from 'next/navigation'
import { getOrder } from '@/services/orders'

const mockId = 'abc-123'

const finishedOrder = {
  id: mockId,
  code: 1,
  status: { value: 'FINISHED', label: 'Concluído' },
  formatted_address: 'Rua Teste',
  created: '2026-01-01T00:00:00Z',
  modified: '2026-01-02T00:00:00Z',
  analysis: [
    {
      id: '1',
      title: 'Penhora',
      status: { value: 'green', label: 'Tudo certo' },
      reason: 'Sem problemas.',
    },
  ],
}

const pendingOrder = {
  ...finishedOrder,
  status: { value: 'IN_PROGRESS', label: 'Em andamento' },
}

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}))

vi.mock('@/services/orders', async importOriginal => {
  const actual = await importOriginal<typeof import('@/services/orders')>()
  return {
    ...actual,
    getOrder: vi.fn(),
    orderQueryKey: (id: string) => ['order', id],
    getOrderEvents: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('@/sections/orders/order-header', () => ({
  default: () => <div data-testid="order-header">Order Header</div>,
}))

vi.mock('@/components/order-journey', () => ({
  OrderJourneyPanel: () => <div data-testid="order-journey">Journey</div>,
}))

vi.mock('lucide-react', () => ({
  Files: () => <span />,
  Lock: () => <span />,
}))

describe('OrderPage', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: mockId })
  })

  it('deve exibir timeline e botão de documentos quando concluída, sem cards de análise', async () => {
    vi.mocked(getOrder).mockResolvedValue(finishedOrder as never)

    render(<OrderPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-journey')).toBeInTheDocument()
    })

    expect(screen.getByText('Abrir documentos e dados')).toBeInTheDocument()
    expect(screen.queryByText('Penhora')).not.toBeInTheDocument()
  })

  it('deve exibir timeline sem botão enquanto a análise não termina', async () => {
    vi.mocked(getOrder).mockResolvedValue(pendingOrder as never)

    render(<OrderPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-journey')).toBeInTheDocument()
    })

    expect(screen.queryByText('Abrir documentos e dados')).not.toBeInTheDocument()
    expect(screen.queryByText('Penhora')).not.toBeInTheDocument()
  })
})
