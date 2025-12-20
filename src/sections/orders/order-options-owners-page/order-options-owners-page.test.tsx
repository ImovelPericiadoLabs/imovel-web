import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import OrderOptionsOwnersPage from './index'

vi.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
}))

vi.mock('@/sections/orders/order-header', () => ({
  default: ({ Badge }: { Badge?: React.ReactNode }) => (
    <div data-testid="order-header">
      {Badge}
    </div>
  ),
}))

vi.mock('@/components/badge', () => ({
  default: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

describe('OrderOptionsOwnersPage', () => {
  it('deve renderizar o header com o badge de sinal vermelho', () => {
    render(<OrderOptionsOwnersPage />)
    
    const header = screen.getByTestId('order-header')
    expect(header).toBeInTheDocument()
    
    const badge = screen.getAllByTestId('badge')[0]
    expect(badge).toHaveTextContent('Sinal Vermelho')
    expect(badge).toHaveAttribute('data-variant', 'danger')
  })

  it('deve renderizar a lista completa de proprietários', () => {
    render(<OrderOptionsOwnersPage />)
    
    const ownersNames = [
      'JULIO BARBOSA LEMES FILHO',
      'MARIANA SANTOS',
      'CARLOS ANDRADE',
      'ANA CARLA DA SILVA'
    ]

    ownersNames.forEach(name => {
      expect(screen.getByText(name)).toBeInTheDocument()
    })

    const icons = screen.getAllByTestId('user-icon')
    expect(icons).toHaveLength(4)
  })

  it('deve exibir corretamente os documentos e as porcentagens', () => {
    render(<OrderOptionsOwnersPage />)

    expect(screen.getByText('159.256.252-00')).toBeInTheDocument()
    expect(screen.getByText('Possui 100%')).toBeInTheDocument()

    expect(screen.getByText('123.456.789-01')).toBeInTheDocument()
    expect(screen.getByText('123.456.789-10')).toBeInTheDocument()
    const badges75 = screen.getAllByText('Possui 75%')
    expect(badges75).toHaveLength(2)

    expect(screen.getByText('987.654.321-09')).toBeInTheDocument()
    expect(screen.getByText('Possui 50%')).toBeInTheDocument()
  })

  it('deve aplicar as classes de estilo e hover nos cards dos proprietários', () => {
    render(<OrderOptionsOwnersPage />)
    
    const card = screen.getByText('JULIO BARBOSA LEMES FILHO').closest('.flex-col.p-4')
    expect(card).toHaveClass('border', 'border-box', 'group', 'hover:border-primary')
  })
})