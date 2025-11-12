import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DocumentConfirmationStep } from './document-confirmation-step'

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

type ButtonProps = {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}
vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }: ButtonProps) => (
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
const setup = () => {
  setValueMock.mockClear()
  handleNextStepMock.mockClear()

  render(<DocumentConfirmationStep />)

  // 👇 CORRIGIDO: Seletores mais robustos
  const optionYes = screen
    .getByText('Sim, eu tenho')
    .closest('[data-testid="option-card"]')!
  const optionNo = screen
    .getByText('Não tenho')
    .closest('[data-testid="option-card"]')!
  const continueButton = screen.getByTestId('button-continuar') // <-- Mais específico

  return {
    optionYes,
    optionNo,
    continueButton,
    setValueMock,
    handleNextStepMock,
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

    it('should render the "Continuar" button as disabled by default', () => {
      const { continueButton } = setup()
      expect(continueButton).toBeDisabled()
    })
  })

  describe('Interação do Usuário', () => {
    it('should enable the "Continuar" button when "Sim, eu tenho" is selected', async () => {
      const { optionYes, continueButton } = setup()

      expect(continueButton).toBeDisabled()
      fireEvent.click(optionYes)

      await waitFor(() => {
        expect(continueButton).toBeEnabled()
        expect(optionYes).toHaveClass('border-primary')
      })
    })

    it('should enable the "Continuar" button when "Não tenho" is selected', async () => {
      const { optionNo, continueButton } = setup()

      expect(continueButton).toBeDisabled()
      fireEvent.click(optionNo)

      await waitFor(() => {
        expect(continueButton).toBeEnabled()
        expect(optionNo).toHaveClass('border-primary')
      })
    })

    it('should toggle selection correctly when changing options', async () => {
      const { optionYes, optionNo } = setup()

      fireEvent.click(optionYes)
      await waitFor(() => {
        expect(optionYes).toHaveClass('border-primary')
        expect(optionNo).not.toHaveClass('border-primary')
      })

      fireEvent.click(optionNo)
      await waitFor(() => {
        expect(optionYes).not.toHaveClass('border-primary')
        expect(optionNo).toHaveClass('border-primary')
      })
    })
  })

  describe('Submissão (Form Context)', () => {
    it('should call setValue and handleNextStep when "Sim" is selected', async () => {
      const { optionYes, continueButton, setValueMock, handleNextStepMock } =
        setup()

      fireEvent.click(optionYes)
      await waitFor(() => expect(continueButton).toBeEnabled())
      fireEvent.click(continueButton)

      expect(setValueMock).toHaveBeenCalledWith('hasDocument', true)
      expect(handleNextStepMock).toHaveBeenCalledTimes(1)
    })

    it('should call setValue and handleNextStep when "Não" is selected', async () => {
      const { optionNo, continueButton, setValueMock, handleNextStepMock } =
        setup()

      fireEvent.click(optionNo)
      await waitFor(() => expect(continueButton).toBeEnabled())
      fireEvent.click(continueButton)

      expect(setValueMock).toHaveBeenCalledWith('hasDocument', false)
      expect(handleNextStepMock).toHaveBeenCalledTimes(1)
    })

    it('should not call setValue or handleNextStep if no option is selected', () => {
      const { continueButton, setValueMock, handleNextStepMock } = setup()

      expect(continueButton).toBeDisabled()
      fireEvent.click(continueButton)
      expect(setValueMock).not.toHaveBeenCalled()
      expect(handleNextStepMock).not.toHaveBeenCalled()
    })
  })
})