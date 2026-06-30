import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FormProvider, useForm } from 'react-hook-form'
import { SummaryStep } from './summary-step'

const mockOnNext = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}))

vi.mock('@/utils/analytics/gtm', () => ({
  trackGtmEvent: vi.fn(),
  buildConsultItem: (v: number) => ({ item_id: 'x', price: v, quantity: 1 }),
  DEFAULT_CURRENCY: 'BRL',
  CONSULT_PRODUCT_PRICE: 79.9,
  CONSULT_PRICE_WITH_CERTIFICATES: 79.9,
  CERTIFICATES_UPSELL_PRICE: 5.99,
}))

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <h1 data-testid="text-title">{children}</h1>
  ),
}))

vi.mock('@/components/text-subtitle', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="text-subtitle">{children}</p>
  ),
}))

vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button type="button" data-testid="continue-btn" onClick={onClick}>
      {children}
    </button>
  ),
}))

function SummaryHarness({
  entryPath,
  includeCertificates = false,
}: {
  entryPath?: 'address' | 'document' | 'registry'
  includeCertificates?: boolean
} = {}) {
  const methods = useForm({
    defaultValues: {
      address: 'Rua Teste, 123',
      addressHint: '',
      registry: { name: '6º Oficial de Registro de Imóveis da Comarca de São Paulo - SP' },
      registrationNumber: '',
      notaryName: '',
      allotment: '',
      block: '',
      lot: '',
      entryPath,
      includeCertificates,
    },
  })
  return (
    <FormProvider {...methods}>
      <SummaryStep onNext={mockOnNext} />
    </FormProvider>
  )
}

describe('SummaryStep', () => {
  beforeEach(() => {
    mockOnNext.mockReset()
  })

  it('renderiza título e subtítulo do resumo', () => {
    render(<SummaryHarness />)
    expect(screen.getByText('Resumo da Consulta do Imóvel')).toBeInTheDocument()
    expect(screen.getByText('Verifique se os dados abaixo estão corretos')).toBeInTheDocument()
  })

  it('mostra endereço e cartório a partir do formulário', () => {
    render(<SummaryHarness />)
    expect(screen.getByText('Rua Teste, 123')).toBeInTheDocument()
    expect(
      screen.getByText('6º Oficial de Registro de Imóveis da Comarca de São Paulo - SP'),
    ).toBeInTheDocument()
  })

  it('exibe preço formatado e lista de benefícios', () => {
    render(<SummaryHarness entryPath="document" includeCertificates />)
    expect(screen.getByText('R$ 79,90')).toBeInTheDocument()
    expect(screen.getByText(/análise objetiva do imóvel/i)).toBeInTheDocument()
    expect(screen.getByText(/Leitura assistida por IA/i)).toBeInTheDocument()
    expect(screen.getByText(/certidões oficiais incluídas/i)).toBeInTheDocument()
    // O painel de certidões é um accordion via CSS (grid-rows): o conteúdo está
    // sempre no DOM, colapsado por padrão. Verificamos o estado via aria-expanded.
    const certToggle = screen.getByRole('button', { name: /certidões oficiais incluídas/i })
    expect(certToggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(certToggle)
    expect(certToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('CND Federal')).toBeInTheDocument()
  })

  it('mostra toggle de certidões no fluxo por endereço', () => {
    render(<SummaryHarness entryPath="address" includeCertificates={false} />)
    expect(screen.getByRole('switch', { name: /incluir certidões oficiais/i })).toBeInTheDocument()
    expect(screen.getByText(/certidões oficiais não incluídas/i)).toBeInTheDocument()
  })

  it('chama onNext ao continuar', () => {
    render(<SummaryHarness />)
    fireEvent.click(screen.getByTestId('continue-btn'))
    expect(mockOnNext).toHaveBeenCalledTimes(1)
  })

  it('mostra tipo e arquivo quando o fluxo é por documento', () => {
    function DocumentHarness() {
      const methods = useForm({
        defaultValues: {
          address: '',
          addressHint: '',
          registry: null,
          registrationNumber: '',
          notaryName: '',
          allotment: '',
          block: '',
          lot: '',
          documentType: 'registration',
          document: {
            id: 'doc-uuid',
            file_path: '/x',
            file_hash: null,
            original_name: 'matricula.pdf',
            extension: 'pdf',
          },
          documentPreview: { id: '1', name: 'matricula.pdf', size: 1.2, type: 'application/pdf' },
        },
      })
      return (
        <FormProvider {...methods}>
          <SummaryStep onNext={mockOnNext} />
        </FormProvider>
      )
    }

    render(<DocumentHarness />)
    expect(screen.getByText('Matrícula')).toBeInTheDocument()
    expect(screen.getByText('matricula.pdf')).toBeInTheDocument()
    expect(screen.getByText('Tipo de documento')).toBeInTheDocument()
    expect(screen.getByText('Arquivo enviado')).toBeInTheDocument()
  })
})
