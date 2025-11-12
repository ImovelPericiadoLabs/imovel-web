import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DocumentTypeStep } from './document-type-step'

// --- Mocks ---
const setValueMock = vi.fn()
const handleNextStepMock = vi.fn()

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: setValueMock,
    handleNextStep: handleNextStepMock,
  }),
}))

type TextTitleProps = {
  children: React.ReactNode
}
vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: TextTitleProps) => (
    <h1 data-testid="text-title">{children}</h1>
  ),
}))

type TextSubtitleProps = {
  children: React.ReactNode
}
vi.mock('@/components/text-subtitle', () => ({
  __esModule: true,
  default: ({ children }: TextSubtitleProps) => (
    <h2 data-testid="text-subtitle">{children}</h2>
  ),
}))

vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }: any) => (
    <button data-testid="button-continuar" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

// Mock de ícones e OptionCard (não precisamos do card real)
vi.mock('lucide-react', () => ({
  Users: () => <span />,
  FileText: () => <span />,
  FileSignature: () => <span />,
}))

// --- Setup ---
const setup = () => {
  setValueMock.mockClear()
  handleNextStepMock.mockClear()
  render(<DocumentTypeStep />)

  return {
    optionContract: screen
      .getByText('Contrato de compra e venda')
      .closest('[data-testid="option-card"]')!,
    optionRegistration: screen
      .getByText('Matrícula')
      .closest('[data-testid="option-card"]')!,
    optionDeed: screen
      .getByText('Escritura')
      .closest('[data-testid="option-card"]')!,
    continueButton: screen.getByTestId('button-continuar'),
    setValueMock,
    handleNextStepMock,
  }
}

describe('DocumentTypeStep', () => {
  it('should render titles and all options', () => {
    setup()
    expect(screen.getByTestId('text-title')).toHaveTextContent(
      'Qual documento você tem?',
    )
    expect(screen.getByTestId('text-subtitle')).toHaveTextContent(
      'Selecione uma das opções abaixo',
    )
    expect(screen.getByText('Contrato de compra e venda')).toBeInTheDocument()
    expect(screen.getByText('Matrícula')).toBeInTheDocument()
    expect(screen.getByText('Escritura')).toBeInTheDocument()
  })

  it('should start with continue button disabled', () => {
    const { continueButton } = setup()
    expect(continueButton).toBeDisabled()
  })

  it('should enable button and set value when "Contrato" is selected', async () => {
    const {
      optionContract,
      continueButton,
      setValueMock,
      handleNextStepMock,
    } = setup()

    expect(continueButton).toBeDisabled()
    fireEvent.click(optionContract)

    await waitFor(() => {
      expect(continueButton).toBeEnabled()
    })

    fireEvent.click(continueButton)

    expect(setValueMock).toHaveBeenCalledWith('documentType', 'contract')
    expect(handleNextStepMock).toHaveBeenCalledTimes(1)
  })

  it('should enable button and set value when "Matrícula" is selected', async () => {
    const {
      optionRegistration,
      continueButton,
      setValueMock,
      handleNextStepMock,
    } = setup()

    expect(continueButton).toBeDisabled()
    fireEvent.click(optionRegistration)

    await waitFor(() => {
      expect(continueButton).toBeEnabled()
    })

    fireEvent.click(continueButton)

    expect(setValueMock).toHaveBeenCalledWith('documentType', 'registration')
    expect(handleNextStepMock).toHaveBeenCalledTimes(1)
  })
})