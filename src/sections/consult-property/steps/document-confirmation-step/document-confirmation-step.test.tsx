import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DocumentConfirmationStep } from './document-confirmation-step'
import type { FieldErrors } from 'react-hook-form'

// --- Mocks ---
const setValueMock = vi.fn()
const handleNextStepMock = vi.fn()
const triggerMock = vi.fn()

let mockErrors: FieldErrors = {}
let mockWatchValue: boolean | undefined | null = null

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: setValueMock,
    handleNextStep: handleNextStepMock,
    setHasDocument: vi.fn(),
    setStep: vi.fn(),
    trigger: triggerMock,
    watch: (field: string) => (field === 'hasDocument' ? mockWatchValue : undefined),
    formState: { errors: mockErrors },
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
  default: ({
    children,
    onClick,
    disabled,
  }: { onClick: () => void; disabled?: boolean } & React.PropsWithChildren) => (
    <button data-testid="button-continuar" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

vi.mock('lucide-react', () => ({
  ThumbsUp: () => <span data-testid="icon-thumbs-up" />,
  ThumbsDown: () => <span data-testid="icon-thumbs-down" />,
}))

// --- Setup ---
// 3. Substituição de 'any' por 'FieldErrors'
const setup = (props?: { watchValue?: boolean | null; errors?: FieldErrors }) => {
  setValueMock.mockClear()
  handleNextStepMock.mockClear()
  triggerMock.mockClear().mockResolvedValue(true)
  mockWatchValue = props?.watchValue ?? null
  mockErrors = props?.errors ?? {}

  render(<DocumentConfirmationStep />)

  const optionYes = screen.getByText('Sim, eu tenho').closest('[data-testid="option-card"]')!
  const optionNo = screen.getByText('Não tenho').closest('[data-testid="option-card"]')!

  return {
    optionYes,
    optionNo,
    setValueMock,
    handleNextStepMock,
    triggerMock,
  }
}

describe('DocumentConfirmationStep', () => {
  describe('Renderização Inicial', () => {
    it('should render the title and options correctly', () => {
      setup()
      expect(screen.getByTestId('text-title')).toBeInTheDocument()
      expect(screen.getByText('Sim, eu tenho')).toBeInTheDocument()
      expect(screen.getByText('Não tenho')).toBeInTheDocument()
    })

    it('should correctly show "Sim" as selected based on watch', () => {
      const { optionNo } = setup({ watchValue: true })
      expect(optionNo).not.toHaveClass('border-primary')
    })

    it('should correctly show "Não" as selected based on watch', () => {
      const { optionYes } = setup({ watchValue: false })
      expect(optionYes).not.toHaveClass('border-primary')
    })
  })

  describe('Interação do Usuário (setValue)', () => {
    it('should call setValue when "Sim, eu tenho" is selected', () => {
      const { optionYes, setValueMock } = setup()

      fireEvent.click(optionYes)

      expect(setValueMock).toHaveBeenCalledWith('hasDocument', true, {
        shouldValidate: true,
      })
    })

    it('should call setValue when "Não tenho" is selected', () => {
      const { optionNo, setValueMock } = setup()

      fireEvent.click(optionNo)

      expect(setValueMock).toHaveBeenCalledWith('hasDocument', false, {
        shouldValidate: true,
      })
    })
  })
})