import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ConsultProperty from './consult-property'

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

vi.mock('lucide-react', () => ({
  ChevronLeft: ({ onClick, className }: any) => (
    <div data-testid="chevron-left" onClick={onClick} className={className} role="button" />
  ),
  CircleQuestionMark: () => <div data-testid="circle-question-mark" />,
}))

vi.mock('@/components/traffic-light-modal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('@/sections/consult-property/steps', () => ({
  AddressStep: ({ onNext }: any) => (
    <div data-testid="address-step"><button onClick={onNext}>Next Address</button></div>
  ),
  AddressComplementStep: ({ onNext }: any) => (
    <div data-testid="address-complement-step"><button onClick={onNext}>Next Complement</button></div>
  ),
  DocumentConfirmationStep: ({ onNext, onSkip }: any) => (
    <div data-testid="document-confirmation-step">
      <button onClick={onNext}>Next DocConfirm</button>
      <button onClick={onSkip}>Skip DocConfirm</button>
    </div>
  ),
  DocumentTypeStep: ({ onNext }: any) => (
    <div data-testid="document-type-step"><button onClick={onNext}>Next DocType</button></div>
  ),
  SendDocumentStep: ({ onNext }: any) => (
    <div data-testid="send-document-step"><button onClick={onNext}>Next SendDoc</button></div>
  ),
  SummaryStep: ({ onNext }: any) => (
    <div data-testid="summary-step"><button onClick={onNext}>Next Summary</button></div>
  ),
  SuccessStep: ({ onNavigateToOrders }: any) => (
    <div data-testid="success-step"><button onClick={onNavigateToOrders}>Go Orders</button></div>
  ),
}))

vi.mock('@/sections/consult-property/steps/payment-step/payment-confirmation-step/payment-confirmation-step', () => ({
  PaymentConfirmationStep: ({ onFinish }: any) => (
    <div data-testid="payment-confirmation-step"><button onClick={onFinish}>Finish Payment</button></div>
  ),
}))

vi.mock('@/sections/consult-property/steps/payment-step/card/select', () => ({
  SavedCardsPage: ({ onAddNewCard }: any) => (
    <div data-testid="saved-cards-page"><button onClick={onAddNewCard}>Add New Card</button></div>
  )
}))

vi.mock('@/sections/consult-property/steps/payment-step/card/register', () => ({
  CreditCardPage: ({ onSave }: any) => (
    <div data-testid="credit-card-page"><button onClick={onSave}>Save Card</button></div>
  )
}))

describe('ConsultProperty Flow', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
    vi.clearAllMocks()
  })

  afterEach(cleanup)

  it('deve navegar por todo o fluxo linear com sucesso', () => {
    render(<ConsultProperty />)

    expect(screen.getByTestId('address-step')).toBeVisible()
    expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-value', '16.666666666666664')

    fireEvent.click(screen.getByText('Next Address'))
    expect(screen.getByTestId('address-complement-step')).toBeVisible()

    fireEvent.click(screen.getByText('Next Complement'))
    expect(screen.getByTestId('document-confirmation-step')).toBeVisible()

    fireEvent.click(screen.getByText('Next DocConfirm'))
    expect(screen.getByTestId('document-type-step')).toBeVisible()

    fireEvent.click(screen.getByText('Next DocType'))
    expect(screen.getByTestId('send-document-step')).toBeVisible()

    fireEvent.click(screen.getByText('Next SendDoc'))
    expect(screen.getByTestId('summary-step')).toBeVisible()

    fireEvent.click(screen.getByText('Next Summary'))
    expect(screen.getByTestId('payment-confirmation-step')).toBeVisible()

    fireEvent.click(screen.getByText('Finish Payment'))
    expect(screen.getByTestId('success-step')).toBeVisible()
  })

  it('deve esconder o botão voltar no início e navegar para home se clicado', () => {
    render(<ConsultProperty />)
    const backBtn = screen.getByTestId('chevron-left')
    expect(backBtn).toHaveClass('opacity-0')

    fireEvent.click(backBtn)
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('deve gerenciar a pilha de estados (stack) ao voltar passos', () => {
    render(<ConsultProperty />)

    fireEvent.click(screen.getByText('Next Address'))
    fireEvent.click(screen.getByText('Next Complement'))

    fireEvent.click(screen.getByTestId('chevron-left'))
    expect(screen.getByTestId('address-complement-step')).toBeVisible()

    fireEvent.click(screen.getByTestId('chevron-left'))
    expect(screen.getByTestId('address-step')).toBeVisible()
  })

  it('deve resetar a página ao clicar em voltar no estado finalizado', () => {
    const mockLocation = { href: 'http://localhost/consultar-imovel' };
    vi.stubGlobal('location', mockLocation);

    render(<ConsultProperty />)

    fireEvent.click(screen.getByText('Next Address'))
    fireEvent.click(screen.getByText('Next Complement'))
    fireEvent.click(screen.getByText('Next DocConfirm'))
    fireEvent.click(screen.getByText('Next DocType'))
    fireEvent.click(screen.getByText('Next SendDoc'))
    fireEvent.click(screen.getByText('Next Summary'))
    fireEvent.click(screen.getByText('Finish Payment'))

    fireEvent.click(screen.getByTestId('chevron-left'))

    expect(mockLocation.href).toBe('/consultar-imovel')

    vi.unstubAllGlobals();
  })
})