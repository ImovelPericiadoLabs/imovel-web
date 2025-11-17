import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SummaryStep } from './summary-step'

const mockGetValues = vi.fn()
const mockHandleNextStep = vi.fn()

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    getValues: mockGetValues,
    handleNextStep: mockHandleNextStep,
  }),
}))

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <h1 data-testid="text-title">{children}</h1>
  ),
}))

vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button data-testid="continue-btn" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/modal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal">{children}</div>
  ),
}))

vi.mock('lucide-react', () => ({
  MapPin: () => <svg data-testid="icon-map" />,
  Building: () => <svg data-testid="icon-building" />,
  Users: () => <svg data-testid="icon-users" />,
  Check: () => <svg data-testid="icon-check" />,
}))

describe('SummaryStep', () => {
  beforeEach(() => {
    mockGetValues.mockReset()
    mockHandleNextStep.mockReset()

    mockGetValues.mockImplementation((key: string) => {
      const values: Record<string, string | object> = {
        address: 'Rua Teste, 123',
        documentType: 'registration',
        registry: {
          name: '6º Oficial de Registro de Imóveis da Comarca de São Paulo - SP',
        },
      }
      return values[key]
    })
  })

  it('should render the title correctly', () => {
    render(<SummaryStep />)

    const title = screen.getAllByTestId('text-title')[0]
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Resumo do imóvel')
  })

  it('should display summary items based on form values', () => {
    render(<SummaryStep />)

    expect(screen.getByText('Endereço')).toBeInTheDocument()
    expect(screen.getByText('Rua Teste, 123')).toBeInTheDocument()

    expect(screen.getByText('Cartório')).toBeInTheDocument()
    expect(
      screen.getByText('6º Oficial de Registro de Imóveis da Comarca de São Paulo - SP'),
    ).toBeInTheDocument()

    expect(screen.getByText('Tipo de documento')).toBeInTheDocument()
    expect(screen.getByText('Matrícula')).toBeInTheDocument()
  })

  it('should render the recognized badge for document section', () => {
    render(<SummaryStep />)

    const badge = screen.getByText('Reconhecido automaticamente')
    expect(badge).toBeInTheDocument()
  })

  it('should render the details section with Modal trigger', () => {
    render(<SummaryStep />)

    const modalTrigger = screen.getByText('Ver detalhes')
    expect(modalTrigger).toBeInTheDocument()
  })

  it('should render total price and continue button', () => {
    render(<SummaryStep />)

    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('R$ 67,56')).toBeInTheDocument()

    const continueBtn = screen.getByTestId('continue-btn')
    expect(continueBtn).toBeInTheDocument()
  })

  it('should call handleNextStep when clicking Continue', () => {
    render(<SummaryStep />)

    const btn = screen.getByTestId('continue-btn')
    fireEvent.click(btn)

    expect(mockHandleNextStep).toHaveBeenCalledTimes(1)
  })
})
