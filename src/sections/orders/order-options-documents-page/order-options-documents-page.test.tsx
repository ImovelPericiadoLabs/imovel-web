import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderOptionsDocumentsPage from './order-options-documents-page'
import { useParams } from 'next/navigation'
import { getOrder, getOrderDocuments } from '@/services/orders'

const mockDocuments = [
  { id: 'reg', kind: 'REGISTRATION', label: 'Matrícula do imóvel', original_name: 'matricula.pdf', extension: 'pdf', download_url: 'https://signed.example/matricula.pdf', file_hash: null },
  { id: 'c1', kind: 'CERTIFICATE', label: 'Certidão Federal (CND) - JULIO BARBOSA', original_name: 'cnd-federal.pdf', extension: 'pdf', download_url: 'https://signed.example/cnd-federal.pdf', file_hash: null },
  { id: 'c2', kind: 'CERTIFICATE', label: 'Certidão Estadual (SEFAZ) - JULIO BARBOSA', original_name: 'cnd-estadual.pdf', extension: 'pdf', download_url: 'https://signed.example/cnd-estadual.pdf', file_hash: null },
  { id: 'report-1', kind: 'REPORT', label: 'Relatório consolidado da consulta (laudo)', original_name: 'Consulta #1.pdf', extension: 'pdf', download_url: null, file_hash: null },
]

const mockOrder = {
  id: '1',
  status: { value: 'FINISHED', label: 'Concluído' },
  semaphore: 'red',
  code: 1,
  formatted_address: '',
  created: '',
  modified: '',
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
    getOrderDocuments: vi.fn(),
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

  it('deve listar matrícula, certidões e laudo com seus rótulos', async () => {
    render(<OrderOptionsDocumentsPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Matrícula do imóvel')).toBeInTheDocument()
      expect(screen.getByText('Certidão Federal (CND) - JULIO BARBOSA')).toBeInTheDocument()
      expect(screen.getByText('Certidão Estadual (SEFAZ) - JULIO BARBOSA')).toBeInTheDocument()
      expect(screen.getByText('Relatório consolidado da consulta (laudo)')).toBeInTheDocument()
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
    const docButton = buttons.find((b) => b.textContent?.includes('Matrícula do imóvel'))
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
