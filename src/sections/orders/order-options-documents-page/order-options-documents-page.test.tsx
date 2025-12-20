import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import React from 'react'
import OrderOptionsDocumentsPage from './order-options-documents-page'

vi.mock('lucide-react', () => ({
  Download: ({ className }: { className?: string }) => (
    <div data-testid="download-icon" className={className} />
  ),
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

describe('OrderOptionsDocumentsPage', () => {
  it('deve renderizar o header com o badge de sinal vermelho', () => {
    render(<OrderOptionsDocumentsPage />)
    
    const header = screen.getByTestId('order-header')
    expect(header).toBeInTheDocument()
    
    const badge = within(header).getByTestId('badge')
    expect(badge).toHaveTextContent('Sinal Vermelho')
    expect(badge).toHaveAttribute('data-variant', 'danger')
  })

  it('deve renderizar todos os tipos de documentos da lista', () => {
    render(<OrderOptionsDocumentsPage />)
    
    expect(screen.getByText('Contrato de compra e venda')).toBeInTheDocument()
    expect(screen.getByText('Escritura do imóvel')).toBeInTheDocument()
    expect(screen.getByText('Matrícula do Imóvel')).toBeInTheDocument()
    expect(screen.getByText('Acordo de compra e venda')).toBeInTheDocument()

    const icons = screen.getAllByTestId('download-icon')
    expect(icons).toHaveLength(4)
  })

  it('deve exibir o nome do arquivo para cada documento', () => {
    render(<OrderOptionsDocumentsPage />)
    
    const fileName = 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf'
    const files = screen.getAllByText(fileName)
    
    expect(files).toHaveLength(4)
  })

  it('deve possuir as classes de estilo e hover nos cards', () => {
    render(<OrderOptionsDocumentsPage />)
    
    const firstCard = screen.getByText('Contrato de compra e venda').closest('.cursor-pointer')
    expect(firstCard).toHaveClass('group', 'hover:border-primary')
  })

  it('deve garantir que o ícone de download tenha a cor da marca', () => {
    render(<OrderOptionsDocumentsPage />)
    
    const icons = screen.getAllByTestId('download-icon')
    expect(icons[0]).toHaveClass('text-primary')
  })
})