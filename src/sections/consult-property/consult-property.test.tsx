import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import ConsultProperty from './consult-property'

// --- MOCKS ---
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: (schema: any) => schema,
}))

vi.mock('@/components/progress-bar', () => ({
  default: ({ value }: { value: number }) => <div data-testid="progress-bar" data-value={value} />,
}))

// Correção crucial: Adicionar data-testid aos mocks de ícones
vi.mock('lucide-react', () => ({
  ChevronLeft: (props: ComponentProps<'div'>) => <div data-testid="chevron-left" {...props} />,
  Menu: (props: ComponentProps<'div'>) => <div data-testid="menu" {...props} />,
}))

// Mock dos Steps simulando o comportamento do Hook Form
vi.mock('@/sections/consult-property/steps', async () => {
  const rhf = await vi.importActual<typeof import('react-hook-form')>('react-hook-form')

  const MockStep = ({ testId }: { testId: string }) => {
    const { handleNextStep } = rhf.useFormContext() as FormContextWithSteps
    return (
      <div data-testid={testId}>
        <button onClick={handleNextStep}>Next Step</button>
      </div>
    )
  }

  const MockConfirmationStep = () => {
    const { handleNextStep, setHasDocument } = rhf.useFormContext() as FormContextWithSteps
    return (
      <div data-testid="document-confirmation-step">
        <button onClick={() => setHasDocument(true)}>Set Has Document</button>
        <button onClick={handleNextStep}>Next Step</button>
      </div>
    )
  }

  return {
    AddressStep: () => <MockStep testId="address-step" />,
    DocumentConfirmationStep: () => <MockConfirmationStep />,
    DocumentTypeStep: () => <MockStep testId="document-type-step" />,
    SendDocumentStep: () => <MockStep testId="send-document-step" />,
    SummaryStep: () => <MockStep testId="summary-step" />,
    PaymentStep: () => <MockStep testId="payment-step" />,
  }
})

vi.mock('@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step', () => ({
  PaymentConfirmationStep: () => <div data-testid="payment-confirmation-step">Payment Confirmation</div>
}))

// --- TESTES ---
describe('ConsultProperty Flow', () => {
  beforeEach(() => {
    render(<ConsultProperty />)
  })

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('should render ONLY the first step initially', () => {
    expect(screen.getByTestId('address-step')).toBeInTheDocument()
    expect(screen.queryByTestId('document-confirmation-step')).not.toBeInTheDocument()
  })

  it('should switch steps correctly when Next is clicked', () => {
    // Passo 1 -> 2
    fireEvent.click(screen.getByText('Next Step'))

    expect(screen.getByTestId('document-confirmation-step')).toBeInTheDocument()
    expect(screen.queryByTestId('address-step')).not.toBeInTheDocument()
  })

  it('should handle the "go back" logic correctly using ChevronLeft', () => {
    // Avançar para o passo 2
    fireEvent.click(screen.getByText('Next Step'))
    expect(screen.getByTestId('document-confirmation-step')).toBeInTheDocument()

    // Clicar no botão de voltar (ChevronLeft)
    const backButton = screen.getByTestId('chevron-left')
    fireEvent.click(backButton)

    // Verificar se voltou para o passo 1
    expect(screen.getByTestId('address-step')).toBeInTheDocument()
    expect(screen.queryByTestId('document-confirmation-step')).not.toBeInTheDocument()
  })

  it('should handle the payment sub-step logic', () => {
    // Navegar do passo 1 até o 6 (Payment)
    // Loop de 5 cliques no "Next Step"
    const nextButtons = screen.getAllByText('Next Step')
    // Como a renderização é condicional, sempre haverá apenas 1 botão "Next Step" visível por vez
    // Precisamos clicar 5 vezes sequencialmente
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next Step'))
    }

    // Verificar se chegou no passo de Pagamento
    expect(screen.getByTestId('payment-step')).toBeInTheDocument()

    // Clicar next no payment step (deve ir para confirmação interna)
    fireEvent.click(screen.getByText('Next Step'))

    expect(screen.getByTestId('payment-confirmation-step')).toBeInTheDocument()
    expect(screen.queryByTestId('payment-step')).not.toBeInTheDocument()
  })

  it('should redirect to home if back button is clicked on step 1', () => {
    const backButton = screen.getByTestId('chevron-left')
    fireEvent.click(backButton)

    expect(mockPush).toHaveBeenCalledWith('/')
  })
})