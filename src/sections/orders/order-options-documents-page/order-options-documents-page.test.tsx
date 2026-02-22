import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderOptionsDocumentsPage from './order-options-documents-page'
import { useParams } from 'next/navigation'
import { getOrder } from '@/services/orders'

const mockDocuments = [
  { id: '1', file_path: '/a.pdf', file_hash: null, original_name: 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf', extension: 'pdf' },
  { id: '2', file_path: '/b.pdf', file_hash: null, original_name: 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf', extension: 'pdf' },
  { id: '3', file_path: '/c.pdf', file_hash: null, original_name: 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf', extension: 'pdf' },
  { id: '4', file_path: '/d.pdf', file_hash: null, original_name: 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf', extension: 'pdf' }
]

const mockOrder = {
  id: '1',
  status: { value: 'FINISHED', label: 'Concluído' },
  semaphore: 'red',
  documents: mockDocuments,
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

vi.mock('lucide-react', () => ({
  Download: ({ className }: { className?: string }) => (
    <div data-testid="download-icon" className={className} />
  ),
  Info: () => null,
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

describe('OrderOptionsDocumentsPage', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    vi.mocked(getOrder).mockResolvedValue(mockOrder as any)
  })

  it('deve renderizar o header com o badge de sinal vermelho', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    const header = screen.getByTestId('order-header')
    expect(header).toBeInTheDocument()

    await waitFor(() => {
      const badge = within(header).getByTestId('badge')
      expect(badge).toHaveTextContent('Sinal Vermelho')
      expect(badge).toHaveAttribute('data-variant', 'danger')
    })
  })

  it('deve renderizar todos os tipos de documentos da lista', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    await waitFor(() => {
      const pdfLabels = screen.getAllByText(/Documento - PDF/)
      expect(pdfLabels).toHaveLength(4)
      const icons = screen.getAllByTestId('download-icon')
      expect(icons).toHaveLength(4)
    })
  })

  it('deve exibir o nome do arquivo para cada documento', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    const fileName = 'JULIO BARBOSA LEMES FILHO - Estadual - Processo 6e0c39306b05cfe.pdf'
    await waitFor(() => {
      const files = screen.getAllByText(fileName)
      expect(files).toHaveLength(4)
    })
  })

  it('deve possuir as classes de estilo e hover nos cards', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getAllByTestId('download-icon')).toHaveLength(4)
    })
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveClass('group', 'hover:border-primary')
  })

  it('deve garantir que o ícone de download tenha a cor da marca', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    await waitFor(() => {
      const icons = screen.getAllByTestId('download-icon')
      expect(icons[0]).toHaveClass('text-primary')
    })
  })
})