import { vi, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrderOptionsPage from './order-options-page'
import { useParams } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Files: () => <div data-testid="icon-files" />,
  Users: () => <div data-testid="icon-users" />,
}))

vi.mock('@/sections/orders/order-header', () => ({
  default: () => <div data-testid="order-header" />,
}))

describe('OrderOptionsPage', () => {
  it('deve renderizar o header e todos os botões de opções com os links corretos', () => {
    const mockId = 'abc-123'
    vi.mocked(useParams).mockReturnValue({ id: mockId })

    render(<OrderOptionsPage />)

    expect(screen.getByTestId('order-header')).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)

    expect(links[0]).toHaveAttribute('href', `/consultas/${mockId}`)
    expect(links[1]).toHaveAttribute('href', `/consultas/${mockId}/opcoes/documentos`)
    expect(links[2]).toHaveAttribute('href', `/consultas/${mockId}/opcoes/proprietarios`)
  })

  it('deve exibir os títulos e subtítulos corretamente', () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    render(<OrderOptionsPage />)

    expect(screen.getByText('Resultado')).toBeInTheDocument()
    expect(screen.getByText('Visualizar resultado completo')).toBeInTheDocument()

    expect(screen.getByText('Documentos')).toBeInTheDocument()
    expect(screen.getByText('Visualizar documentos da consulta')).toBeInTheDocument()

    expect(screen.getByText('Proprietários')).toBeInTheDocument()
    expect(screen.getByText('Visualizar proprietários da consulta')).toBeInTheDocument()
  })

  it('deve renderizar os ícones correspondentes para cada opção', () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    render(<OrderOptionsPage />)

    expect(screen.getByTestId('icon-file-text')).toBeInTheDocument()
    expect(screen.getByTestId('icon-files')).toBeInTheDocument()
    expect(screen.getByTestId('icon-users')).toBeInTheDocument()
    expect(screen.getAllByTestId('chevron-right')).toHaveLength(3)
  })

  it('deve aplicar as classes de hover e borda nos cartões', () => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    render(<OrderOptionsPage />)

    const firstCard = screen.getByText('Resultado').closest('a')
    expect(firstCard).toHaveClass('group', 'hover:border-primary', 'border-box')
  })
})