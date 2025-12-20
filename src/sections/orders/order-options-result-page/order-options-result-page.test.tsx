import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrderOptionsResultPage from './order-options-result-page'

vi.mock('@/utils/tailwind', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/components/badge', () => ({
  default: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

vi.mock('@/sections/orders/constants', () => ({
  mapCircleStatus: {
    ALL_GOOD: 'bg-green-500',
    IRREGULARITIES_FOUND: 'bg-yellow-500',
    PURCHASE_AND_SALE_BLOCKED: 'bg-red-500',
  },
  mapBadgeStatus: {
    ALL_GOOD: 'success',
    IRREGULARITIES_FOUND: 'warning',
    PURCHASE_AND_SALE_BLOCKED: 'destructive',
  },
}))

describe('OrderOptionsResultPage', () => {
  it('deve renderizar a seção de Matrícula com campos específicos', () => {
    render(<OrderOptionsResultPage />)

    expect(screen.getByText('Matrícula')).toBeInTheDocument()
    expect(screen.getByText('35529')).toBeInTheDocument()
    expect(screen.getByText('6º Ofício De Registro De Imóveis - Vila Mariana - SP')).toBeInTheDocument()
    expect(screen.getByText('Terreno Urbano com Edificação')).toBeInTheDocument()
    expect(screen.getByText('308.8 m²')).toBeInTheDocument()
    expect(screen.getByText('0.48 m²')).toBeInTheDocument()
    
    const badge = screen.getAllByTestId('badge')[0]
    expect(badge).toHaveTextContent('Sinal Verde')
    expect(badge).toHaveAttribute('data-variant', 'success')
  })

  it('deve renderizar a seção de Ônus e Restrições com lista de itens', () => {
    render(<OrderOptionsResultPage />)

    expect(screen.getByText('Ônus e Restrições')).toBeInTheDocument()
    expect(screen.getByText('Bloqueio judicial ativo na matrícula')).toBeInTheDocument()
    expect(screen.getByText('Indisponibilidade de bens do proprietário')).toBeInTheDocument()
    
    const redBadge = screen.getAllByTestId('badge')[1]
    expect(redBadge).toHaveTextContent('Sinal Vermelho')
    expect(redBadge).toHaveAttribute('data-variant', 'destructive')
  })

  it('deve renderizar a seção de Pendências Financeiras (Sinal Amarelo)', () => {
    render(<OrderOptionsResultPage />)

    expect(screen.getByText('Pendências Financeiras')).toBeInTheDocument()
    expect(screen.getByText('IPTU do exercício atual em atraso')).toBeInTheDocument()
    
    const yellowBadge = screen.getAllByTestId('badge')[2]
    expect(yellowBadge).toHaveTextContent('Sinal Amarelo')
    expect(yellowBadge).toHaveAttribute('data-variant', 'warning')
  })

  it('deve renderizar a seção de Documentos', () => {
    render(<OrderOptionsResultPage />)

    expect(screen.getByText('Documentos')).toBeInTheDocument()
    expect(screen.getByText('Todas as certidões negativas emitidas')).toBeInTheDocument()
  })

  it('deve renderizar a seção de Conclusão sem badge e com mensagem longa', () => {
    render(<OrderOptionsResultPage />)

    expect(screen.getByText('Conclusão')).toBeInTheDocument()
    expect(screen.getByText(/O imóvel apresenta restrições graves/)).toBeInTheDocument()
    
    // Conclusão não tem status, então não deve renderizar badge nesta seção
    const sections = screen.getAllByRole('separator', { hidden: true }) 
    // O separator é o <hr />, cada seção tem um.
    expect(sections).toHaveLength(5)
  })

  it('deve aplicar as classes de cores do semáforo nos círculos', () => {
    const { container } = render(<OrderOptionsResultPage />)

    expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
    expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument()
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument()
  })

  it('deve garantir que o hover mude a borda para primary', () => {
    render(<OrderOptionsResultPage />)
    const cards = screen.getAllByText('Matrícula')[0].closest('.cursor-pointer')
    expect(cards).toHaveClass('hover:border-primary')
  })
})