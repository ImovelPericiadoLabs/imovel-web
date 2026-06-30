import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderOptionsDocumentsPage from './order-options-documents-page'
import { useParams } from 'next/navigation'
import { getOrder, getOrderDocuments } from '@/services/orders'

// Anexos INLINE no detalhe (order.documents): matrícula + certidões anexas.
// O laudo (REPORT) é sintetizado pelo hook quando status === FINISHED.
const mockDocuments = [
  { id: 'reg', file_path: 'https://signed.example/matricula.pdf', type: 'REGISTRATION', original_name: 'matricula.pdf', file_hash: null, extension: 'pdf' },
  { id: 'c1', file_path: 'https://signed.example/cnd-federal.pdf', type: 'CERTIFICATE', original_name: 'cnd-federal.pdf', file_hash: null, extension: 'pdf' },
  { id: 'c2', file_path: 'https://signed.example/cnd-estadual.pdf', type: 'CERTIFICATE', original_name: 'cnd-estadual.pdf', file_hash: null, extension: 'pdf' },
]

const mockOrder = {
  id: '1',
  status: { value: 'FINISHED', label: 'Concluído' },
  semaphore: 'red',
  code: 1,
  formatted_address: '',
  created: '',
  modified: '',
  documents: mockDocuments,
}

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}))

vi.mock('@/hooks/use-order-realtime', () => ({
  useOrderRealtime: () => ({ connected: false }),
}))

vi.mock('@/services/orders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/orders')>()
  return {
    ...actual,
    getOrder: vi.fn(),
  }
})

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
    vi.mocked(getOrderDocuments).mockResolvedValue(mockDocuments as any)
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

  it('deve listar matrícula, certidões anexas e laudo com seus rótulos', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Matrícula')).toBeInTheDocument()
      expect(screen.getAllByText('Certidão')).toHaveLength(2)
      expect(screen.getByText('Relatório de análise (PDF)')).toBeInTheDocument()
      // nomes originais dos arquivos aparecem como linha secundária
      expect(screen.getByText('cnd-federal.pdf')).toBeInTheDocument()
      expect(screen.getByText('cnd-estadual.pdf')).toBeInTheDocument()
    })
  })

  it('deve usar ícone de download nas certidões/matrícula e FileText no laudo', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    await waitFor(() => {
      // matrícula + 2 certidões = 3 ícones de download; laudo usa FileText.
      expect(screen.getAllByTestId('icon-Download')).toHaveLength(3)
      expect(screen.getAllByTestId('icon-FileText')).toHaveLength(1)
    })
  })

  it('deve possuir as classes de estilo e hover nos cards', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getAllByTestId('icon-Download')).toHaveLength(3)
    })
    const buttons = screen.getAllByRole('button')
    const docButton = buttons.find((b) => b.textContent?.includes('Matrícula'))
    expect(docButton).toHaveClass('group', 'hover:border-primary')
  })

  it('deve garantir que o ícone de download tenha a cor da marca', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    await waitFor(() => {
      const icons = screen.getAllByTestId('icon-Download')
      expect(icons[0]).toHaveClass('text-primary')
    })
  })
})
