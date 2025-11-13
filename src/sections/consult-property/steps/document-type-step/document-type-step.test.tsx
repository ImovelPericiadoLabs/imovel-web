import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DocumentTypeStep } from './document-type-step'

// --- Mocks ---
const setValueMock = vi.fn()
const handleNextStepMock = vi.fn()
const triggerMock = vi.fn()

let mockErrors: any = {}
let mockWatchValue: string | null = null

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: setValueMock,
    handleNextStep: handleNextStepMock,
    trigger: triggerMock,
    watch: (field: string) =>
      field === 'documentType' ? mockWatchValue : undefined,
    formState: { errors: mockErrors },
  }),
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

vi.mock('lucide-react', () => ({
  Users: () => <span />,
  FileText: () => <span />,
  FileSignature: () => <span />,
}))

// --- Setup ---
const setup = (props?: {
  watchValue?: string | null
  errors?: any
}) => {
  setValueMock.mockClear()
  handleNextStepMock.mockClear()
  triggerMock.mockClear().mockResolvedValue(true)
  mockWatchValue = props?.watchValue ?? null
  mockErrors = props?.errors ?? {}

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
    triggerMock,
  }
}

describe('DocumentTypeStep', () => {
  describe('Renderização Inicial', () => {
    it('should render titles and all options', () => {
      setup()
      expect(screen.getByTestId('text-title')).toBeInTheDocument()
      expect(screen.getByTestId('text-subtitle')).toBeInTheDocument()
      expect(screen.getByText('Contrato de compra e venda')).toBeInTheDocument()
      expect(screen.getByText('Matrícula')).toBeInTheDocument()
      expect(screen.getByText('Escritura')).toBeInTheDocument()
    })

    it('should render the "Continuar" button as ENABLED by default', () => {
      const { continueButton } = setup()
      expect(continueButton).toBeEnabled()
    })

    it('should correctly show "Contrato" as selected based on watch', () => {
      const { optionContract, optionRegistration } = setup({
        watchValue: 'contract',
      })
      expect(optionContract).toHaveClass('border-primary')
      expect(optionRegistration).not.toHaveClass('border-primary')
    })
  })

  describe('Interação do Usuário (setValue)', () => {
    it('should call setValue when "Contrato" is selected', () => {
      const { optionContract, setValueMock } = setup()
      fireEvent.click(optionContract)
      expect(setValueMock).toHaveBeenCalledWith('documentType', 'contract', {
        shouldValidate: true,
      })
    })

    it('should call setValue when "Matrícula" is selected', () => {
      const { optionRegistration, setValueMock } = setup()
      fireEvent.click(optionRegistration)
      expect(setValueMock).toHaveBeenCalledWith(
        'documentType',
        'registration',
        {
          shouldValidate: true,
        },
      )
    })

    it('should call setValue when "Escritura" is selected', () => {
      const { optionDeed, setValueMock } = setup()
      fireEvent.click(optionDeed)
      expect(setValueMock).toHaveBeenCalledWith('documentType', 'deed', {
        shouldValidate: true,
      })
    })
  })

  describe('Submissão (handleSubmit)', () => {
    it('should call trigger and handleNextStep on valid submission', async () => {
      const { continueButton, triggerMock, handleNextStepMock } = setup({
        watchValue: 'contract',
      })

      triggerMock.mockResolvedValue(true)
      fireEvent.click(continueButton)

      await waitFor(() => {
        expect(triggerMock).toHaveBeenCalledWith('documentType')
      })

      await waitFor(() => {
        expect(handleNextStepMock).toHaveBeenCalledTimes(1)
      })
    })

    it('should call trigger, show error, and NOT call handleNextStep on invalid submission', async () => {
      const error = { documentType: { message: 'Selecione um tipo' } }
      const { continueButton, triggerMock, handleNextStepMock } = setup({
        errors: error,
      })

      triggerMock.mockResolvedValue(false)
      fireEvent.click(continueButton)

      await waitFor(() => {
        expect(triggerMock).toHaveBeenCalledWith('documentType')
      })

      expect(handleNextStepMock).not.toHaveBeenCalled()
      expect(await screen.findByText('Selecione um tipo')).toBeInTheDocument()
    })
  })
})