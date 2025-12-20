import { vi, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import OrderPage from './order-page'
import { useParams } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-icon" />,
}))

vi.mock('@/utils/tailwind', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/sections/orders/order-header', () => ({
  default: () => <div data-testid="order-header">Order Header</div>,
}))

vi.mock('@/components/traffic-light-modal', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="traffic-light-modal">{children}</div>
  ),
}))

vi.mock('@/components/badge', () => ({
  default: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

vi.mock('@/sections/orders/constants', () => ({
  mapCircleStatus: {
    ALL_GOOD: 'bg-green-500',
    PURCHASE_AND_SALE_BLOCKED: 'bg-red-500',
  },
  mapBadgeStatus: {
    ALL_GOOD: 'success',
    PURCHASE_AND_SALE_BLOCKED: 'destructive',
  },
}))

describe('OrderPage', () => {
  it('deve renderizar o componente com o ID do pedido correto na URL', () => {
    vi.mocked(useParams).mockReturnValue({ id: '123' })

    render(<OrderPage />)

    expect(screen.getByTestId('order-header')).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/pedidos/123/opcoes')
    expect(links[1]).toHaveAttribute('href', '/pedidos/123/opcoes')
  })

  it('deve renderizar as informações de Hipoteca (Sinal Vermelho)', () => {
    vi.mocked(useParams).mockReturnValue({ id: '123' })
    render(<OrderPage />)

    expect(screen.getByText('Hipoteca')).toBeInTheDocument()
    expect(screen.getByText(/Há irregularidades graves/i)).toBeInTheDocument()
    
    const badges = screen.getAllByTestId('badge')
    expect(badges[0]).toHaveTextContent('Sinal vermelho')
    expect(badges[0]).toHaveAttribute('data-variant', 'destructive')
  })

  it('deve renderizar as informações de Penhora (Sinal Verde)', () => {
    vi.mocked(useParams).mockReturnValue({ id: '123' })
    render(<OrderPage />)

    expect(screen.getByText('Penhora')).toBeInTheDocument()
    expect(screen.getByText('Sem problemas. Pode seguir com a operação.')).toBeInTheDocument()

    const badges = screen.getAllByTestId('badge')
    expect(badges[1]).toHaveTextContent('Sinal verde')
    expect(badges[1]).toHaveAttribute('data-variant', 'success')
  })

  it('deve renderizar os componentes de modal e ícones para cada item', () => {
    vi.mocked(useParams).mockReturnValue({ id: '123' })
    render(<OrderPage />)

    const modals = screen.getAllByTestId('traffic-light-modal')
    expect(modals).toHaveLength(2)

    const triggerTexts = screen.getAllByText('Entender')
    expect(triggerTexts).toHaveLength(2)

    expect(screen.getAllByTestId('chevron-icon')).toHaveLength(2)
  })

  it('deve aplicar as classes de cores do círculo corretamente', () => {
    vi.mocked(useParams).mockReturnValue({ id: '123' })
    const { container } = render(<OrderPage />)

    const greenCircle = container.querySelector('.bg-green-500')
    const redCircle = container.querySelector('.bg-red-500')

    expect(greenCircle).toBeInTheDocument()
    expect(redCircle).toBeInTheDocument()
  })
})