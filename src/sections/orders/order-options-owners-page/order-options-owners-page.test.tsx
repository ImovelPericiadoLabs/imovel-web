import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderOptionsOwnersPage from './index'
import { useParams } from 'next/navigation'
import { getOrder } from '@/services/orders'

const mockOwners = [
  { id: '1', name: 'JULIO BARBOSA LEMES FILHO', tax_id: '159.256.252-00', undivided_interest: 100 },
  { id: '2', name: 'MARIANA SANTOS', tax_id: '123.456.789-01', undivided_interest: 75 },
  { id: '3', name: 'CARLOS ANDRADE', tax_id: '123.456.789-10', undivided_interest: 75 },
  { id: '4', name: 'ANA CARLA DA SILVA', tax_id: '987.654.321-09', undivided_interest: 50 }
]

const mockOrder = {
  id: '1',
  status: { value: 'FINISHED', label: 'Concluído' },
  semaphore: 'red',
  owners: mockOwners,
  code: 1,
  formatted_address: '',
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

vi.mock('@/sections/orders/order-header', () => ({
  default: () => (
    <div data-testid="order-header">
      <span data-testid="badge" data-variant="danger">Sinal Vermelho</span>
    </div>
  ),
}))

vi.mock('@/components/badge', () => ({
  default: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

describe('OrderOptionsOwnersPage', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue(mockOrder as any)
  })

  it('deve renderizar o header com o badge de sinal vermelho', async () => {
    render(<OrderOptionsOwnersPage />, { wrapper })

    const header = screen.getByTestId('order-header')
    expect(header).toBeInTheDocument()

    await waitFor(() => {
      const badge = screen.getAllByTestId('badge')[0]
      expect(badge).toHaveTextContent('Sinal Vermelho')
      expect(badge).toHaveAttribute('data-variant', 'danger')
    })
  })

  it('deve renderizar a lista completa de proprietários', async () => {
    render(<OrderOptionsOwnersPage />, { wrapper })

    const ownersNames = [
      'JULIO BARBOSA LEMES FILHO',
      'MARIANA SANTOS',
      'CARLOS ANDRADE',
      'ANA CARLA DA SILVA'
    ]

    await waitFor(() => {
      ownersNames.forEach(name => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
      const icons = screen.getAllByTestId('icon-User')
      expect(icons).toHaveLength(4)
    })
  })

  it('deve exibir corretamente os documentos e as porcentagens', async () => {
    render(<OrderOptionsOwnersPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('159.256.252-00')).toBeInTheDocument()
      expect(screen.getByText('Possui 100%')).toBeInTheDocument()
      expect(screen.getByText('123.456.789-01')).toBeInTheDocument()
      expect(screen.getByText('123.456.789-10')).toBeInTheDocument()
      const badges75 = screen.getAllByText('Possui 75%')
      expect(badges75).toHaveLength(2)
      expect(screen.getByText('987.654.321-09')).toBeInTheDocument()
      expect(screen.getByText('Possui 50%')).toBeInTheDocument()
    })
  })

  it('deve aplicar as classes de estilo e hover nos cards dos proprietários', async () => {
    render(<OrderOptionsOwnersPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('JULIO BARBOSA LEMES FILHO')).toBeInTheDocument()
    })
    const card = screen.getByText('JULIO BARBOSA LEMES FILHO').closest('.flex-col.p-4')
    expect(card).toHaveClass('border', 'border-box', 'group', 'hover:border-primary')
  })
})